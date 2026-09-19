/**
 * AgriSight Smart Irrigation Intelligence Layer (Phase 2)
 * Computes agronomic, weather-grounded irrigation recommendations
 * WITHOUT claiming direct IoT soil moisture measurement.
 * Evaluates: Crop Type + Growth Stage + Soil Characteristics + Weather & Rain Forecast.
 */

export interface IrrigationInputContext {
  cropName: string;
  growthStage: string;
  soilType?: string;
  irrigationType?: string;
  temp: number;
  humidity: number;
  rainProb: number;
  precipitation: number;
  forecastRainSum?: number; // mm in next 48h
  lastIrrigatedHoursAgo?: number | null;
}

export interface IrrigationRecommendation {
  status: "RECOMMENDED" | "OPTIONAL" | "POSTPONE_RAIN" | "RECENTLY_IRRIGATED";
  statusTitle: {
    en: string;
    hi: string;
    bn: string;
  };
  waterStressRisk: "Low" | "Moderate" | "High" | "Critical";
  waterStressScore: number; // 0-100 (Estimated Water-Stress Index)
  recommendedWindow: {
    en: string;
    hi: string;
    bn: string;
  };
  recommendedVolume: {
    en: string;
    hi: string;
    bn: string;
  };
  reasoning: {
    en: string;
    hi: string;
    bn: string;
  };
  keyFactors: {
    label: string;
    value: string;
    impact: "High" | "Moderate" | "Neutral" | "Beneficial";
  }[];
}

// Stage multipliers for water sensitivity
const STAGE_SENSITIVITY: Record<string, { multiplier: number; label: string; desc: string }> = {
  seedling: { multiplier: 1.2, label: "Seedling / Germination", desc: "Shallow roots require frequent light moisture to prevent seedling desiccation." },
  germination: { multiplier: 1.2, label: "Germination", desc: "Shallow root depth requires light, consistent surface moisture." },
  vegetative: { multiplier: 1.0, label: "Vegetative", desc: "Steady vegetative leaf expansion and stem growth." },
  flowering: { multiplier: 1.5, label: "Flowering / Heading", desc: "Critical reproductive stage: water stress causes severe flower drop and yield penalty." },
  heading: { multiplier: 1.5, label: "Flowering / Heading", desc: "High water requirement for panicle and flower formation." },
  fruiting: { multiplier: 1.4, label: "Fruit / Grain Development", desc: "High transpirational demand during grain filling or fruit enlargement." },
  grain: { multiplier: 1.4, label: "Fruit / Grain Development", desc: "Grain filling requires steady moisture to prevent grain shriveling." },
  maturity: { multiplier: 0.6, label: "Maturity / Harvest", desc: "Withhold excess water to promote uniform ripening and prevent fungal rot." },
  harvest: { multiplier: 0.5, label: "Harvest", desc: "Dry soil conditions required for clean harvesting." },
};

export function computeIrrigationRecommendation(ctx: IrrigationInputContext): IrrigationRecommendation {
  const {
    cropName = "Crop",
    growthStage = "Vegetative",
    soilType = "Alluvial",
    irrigationType = "Drip",
    temp = 28,
    humidity = 65,
    rainProb = 10,
    precipitation = 0,
    forecastRainSum = 0,
    lastIrrigatedHoursAgo = null,
  } = ctx;

  const stageKey = Object.keys(STAGE_SENSITIVITY).find((k) =>
    growthStage.toLowerCase().includes(k)
  );
  const stageInfo = stageKey ? STAGE_SENSITIVITY[stageKey] : { multiplier: 1.0, label: growthStage, desc: "Standard growth water demand." };

  // Base evapotranspiration demand from temp & humidity
  let baseDemand = 30;
  if (temp > 35) baseDemand += 35;
  else if (temp > 30) baseDemand += 20;
  else if (temp < 22) baseDemand -= 10;

  if (humidity < 45) baseDemand += 20; // Dry air increases evaporation
  else if (humidity > 80) baseDemand -= 15; // Humid air slows evaporation

  // Crop stage weighting
  let calculatedStress = Math.round(baseDemand * stageInfo.multiplier);

  // Soil drainage factor
  const sType = soilType.toLowerCase();
  if (sType.includes("sand")) calculatedStress += 12; // Drains very fast
  else if (sType.includes("clay")) calculatedStress -= 10; // Retains moisture

  // Clamp stress 0-100
  calculatedStress = Math.max(5, Math.min(95, calculatedStress));

  // Determine key factors for transparency
  const keyFactors: IrrigationRecommendation["keyFactors"] = [
    {
      label: "Growth Stage",
      value: stageInfo.label,
      impact: stageInfo.multiplier >= 1.3 ? "High" : stageInfo.multiplier < 0.8 ? "Beneficial" : "Moderate",
    },
    {
      label: "Ambient Heat",
      value: `${temp}°C`,
      impact: temp >= 33 ? "High" : temp >= 28 ? "Moderate" : "Neutral",
    },
    {
      label: "Air Humidity",
      value: `${humidity}%`,
      impact: humidity <= 45 ? "High" : humidity >= 75 ? "Beneficial" : "Neutral",
    },
    {
      label: "Rain Forecast",
      value: rainProb >= 40 ? `${rainProb}% (${forecastRainSum.toFixed(1)}mm)` : "Dry (<20%)",
      impact: rainProb >= 50 ? "Beneficial" : "Neutral",
    },
  ];

  // Case 1: High Rain Forecast Imminent -> Postpone
  if (rainProb >= 55 || precipitation >= 4 || forecastRainSum >= 6) {
    return {
      status: "POSTPONE_RAIN",
      statusTitle: {
        en: "Postpone Irrigation — Rain Expected",
        hi: "सिंचाई स्थगित करें — बारिश की संभावना",
        bn: "সেচ স্থগিত রাখুন — বৃষ্টির পূর্বাভাস",
      },
      waterStressRisk: "Low",
      waterStressScore: Math.min(25, calculatedStress),
      recommendedWindow: {
        en: "Withhold watering until precipitation passes",
        hi: "बारिश समाप्त होने तक पानी न दें",
        bn: "বৃষ্টি শেষ না হওয়া পর্যন্ত জল দেওয়া বন্ধ রাখুন",
      },
      recommendedVolume: {
        en: "0 mm (Natural rainfall expected)",
        hi: "0 मिमी (प्राकृतिक वर्षा अनुमानित)",
        bn: "০ মিমি (প্রাকৃতিক বৃষ্টিপাত প্রত্যাশিত)",
      },
      reasoning: {
        en: `Rain probability is ${rainProb}% with ${forecastRainSum.toFixed(1)}mm forecast. Applying irrigation now risks root waterlogging, nutrient leaching, and wasted water.`,
        hi: `बारिश की संभावना ${rainProb}% है। अभी सिंचाई करने से खेत में जलभराव और पोषक तत्वों के बह जाने का खतरा होगा।`,
        bn: `বৃষ্টির সম্ভাবনা ${rainProb}%। এখন সেচ দিলে জমিতে অতিরিক্ত পানি জমে শিকড় পচে যাওয়ার ঝুঁকি থাকবে।`,
      },
      keyFactors,
    };
  }

  // Case 2: Recently Irrigated (< 18 hours ago)
  if (lastIrrigatedHoursAgo !== null && lastIrrigatedHoursAgo < 18) {
    return {
      status: "RECENTLY_IRRIGATED",
      statusTitle: {
        en: "Recently Irrigated — Soil Moisture Adequate",
        hi: "हाल ही में सिंचाई की गई — नमी पर्याप्त",
        bn: "সম্প্রতি সেচ দেওয়া হয়েছে — পর্যাপ্ত আর্দ্রতা",
      },
      waterStressRisk: "Low",
      waterStressScore: 20,
      recommendedWindow: {
        en: "Allow root zone aeration; check tomorrow morning",
        hi: "जड़ों में हवा लगने दें; कल सुबह पुनः जांचें",
        bn: "মাটিতে বাতাস চলাচলের সুযোগ দিন; আগামীকাল সকালে আবার দেখুন",
      },
      recommendedVolume: {
        en: "No additional water needed today",
        hi: "आज अतिरिक्त पानी की आवश्यकता नहीं है",
        bn: "আজ আর অতিরিক্ত জলের প্রয়োজন নেই",
      },
      reasoning: {
        en: `Irrigation was performed ${lastIrrigatedHoursAgo}h ago. Root zone moisture remains sufficient for current ${cropName} development.`,
        hi: `सिंचाई ${lastIrrigatedHoursAgo} घंटे पहले की गई थी। ${cropName} के विकास के लिए नमी अभी पर्याप्त है।`,
        bn: `${lastIrrigatedHoursAgo} ঘণ্টা আগে সেচ দেওয়া হয়েছে। ${cropName} ফসলের জন্য আর্দ্রতা এখনো পর্যাপ্ত।`,
      },
      keyFactors,
    };
  }

  // Case 3: High Water Stress -> Irrigation Recommended
  if (calculatedStress >= 60) {
    const isFloweringOrFruiting = stageInfo.multiplier >= 1.3;
    const windowStr =
      temp >= 32
        ? {
            en: "6:00 AM – 8:30 AM (Early Morning)",
            hi: "सुबह 6:00 – 8:30 (सुबह जल्दी)",
            bn: "সকাল ৬:০০ – ৮:৩০ (ভোরে)",
          }
        : {
            en: "5:00 PM – 7:00 PM (Late Afternoon)",
            hi: "शाम 5:00 – 7:00 (दोपहर बाद)",
            bn: "বিকাল ৫:০০ – ৭:০০ (বিকালে)",
          };

    const volumeStr =
      irrigationType.toLowerCase().includes("drip")
        ? {
            en: "Drip Cycle: 45–60 mins (20–25 mm depth)",
            hi: "ड्रिप चक्र: 45–60 मिनट (20–25 मिमी)",
            bn: "ড্রিপ সেচ: ৪৫–৬০ মিনিট (২০–২৫ মিমি)",
          }
        : {
            en: "Moderate surface irrigation: 30–35 mm",
            hi: "मध्यम सतही सिंचाई: 30–35 मिमी",
            bn: "মাঝারি সেচ: ৩০–৩৫ মিমি",
          };

    return {
      status: "RECOMMENDED",
      statusTitle: {
        en: "Irrigation Recommended",
        hi: "सिंचाई की सिफारिश की जाती है",
        bn: "সেচ প্রদানের পরামর্শ দেওয়া হচ্ছে",
      },
      waterStressRisk: calculatedStress >= 75 ? "High" : "Moderate",
      waterStressScore: calculatedStress,
      recommendedWindow: windowStr,
      recommendedVolume: volumeStr,
      reasoning: {
        en: `High evapotranspiration demand (${temp}°C, ${humidity}% humidity) combined with ${cropName} in ${stageInfo.label} stage. ${
          isFloweringOrFruiting
            ? "Reproductive stage is highly sensitive to moisture stress."
            : "Adequate moisture is required to sustain steady growth."
        }`,
        hi: `उच्च वाष्पीकरण (${temp}°C, ${humidity}% आर्द्रता) और ${stageInfo.label} अवस्था के कारण ${cropName} को पानी की आवश्यकता है।`,
        bn: `উচ্চ তাপমাত্রা (${temp}°C, ${humidity}% আর্দ্রতা) এবং ${stageInfo.label} দশার কারণে ${cropName} ফসলে আর্দ্রতার ঘাটতি দেখা দিতে পারে।`,
      },
      keyFactors,
    };
  }

  // Case 4: Low to Moderate Stress -> Optional / Low Need
  return {
    status: "OPTIONAL",
    statusTitle: {
      en: "Moisture Stable — Optional Light Watering",
      hi: "नमी स्थिर — हल्की सिंचाई वैकल्पिक",
      bn: "আর্দ্রতা স্বাভাবিক — সেচের তীব্র প্রয়োজন নেই",
    },
    waterStressRisk: "Low",
    waterStressScore: calculatedStress,
    recommendedWindow: {
      en: "Early Morning (if soil surface appears dry)",
      hi: "सुबह जल्दी (यदि मिट्टी की ऊपरी परत सूखी लगे)",
      bn: "ভোরে (যদি মাটির উপরিভাগ শুষ্ক মনে হয়)",
    },
    recommendedVolume: {
      en: "Light cycle: 15–20 mm",
      hi: "हल्का चक्र: 15–20 मिमी",
      bn: "হালকা সেচ: ১৫–২০ মিমি",
    },
    reasoning: {
      en: `Moderate atmospheric demand and low water stress for ${cropName} at ${stageInfo.label} stage. Routine monitoring recommended.`,
      hi: `${cropName} की ${stageInfo.label} अवस्था में नमी का स्तर सामान्य है। नियमित जांच करते रहें।`,
      bn: `${stageInfo.label} দশায় ${cropName} ফসলের পানির চাহিদা বর্তমানে স্বাভাবিক অবস্থায় রয়েছে।`,
    },
    keyFactors,
  };
}
