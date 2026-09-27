/**
 * AgriSight Weather & Environmental Intelligence Layer (Phase 1)
 * Calculates explainable agricultural risks (Heat, Rain, Wind/Spray, Fungal, Extreme Weather)
 * from real atmospheric data and forecasts.
 */

import { cachedFetch } from "./apiCache";

export interface EnvironmentalRisk {
  level: "Low" | "Moderate" | "High";
  label: string;
  score: number; // 0-100
  explanation: {
    en: string;
    hi: string;
    bn: string;
  };
}

export interface DayForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  condition: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  precipitation: number;
}

export interface WeatherIntelligenceData {
  temp: number;
  feelsLike?: number;
  humidity: number;
  windSpeed: number; // km/h
  rainProb: number; // %
  precipitation: number; // mm
  uvIndex: number;
  weatherCode: number;
  condition: string;
  icon: string;
  locationName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;

  // Environmental Risk Analysis
  heatRisk: EnvironmentalRisk;
  rainRisk: EnvironmentalRisk;
  sprayWindRisk: EnvironmentalRisk;
  fungalRisk: EnvironmentalRisk;
  extremeWeatherRisk: EnvironmentalRisk;
  overallEnvironmentalRisk: "Low" | "Moderate" | "High";

  // Agricultural Synthesis
  agriInsight: {
    en: string;
    hi: string;
    bn: string;
  };

  // 3-Day Forecast
  forecast: DayForecast[];
}


export function mapWeatherCodeToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: "Clear Sky", icon: "wb_sunny" };
  if (code === 1) return { condition: "Mainly Clear", icon: "sunny" };
  if (code === 2) return { condition: "Partly Cloudy", icon: "partly_cloudy_day" };
  if (code === 3) return { condition: "Overcast", icon: "cloud" };
  if (code >= 45 && code <= 48) return { condition: "Foggy / Mist", icon: "foggy" };
  if (code >= 51 && code <= 55) return { condition: "Light Drizzle", icon: "grain" };
  if (code >= 61 && code <= 65) return { condition: "Rain Showers", icon: "rainy" };
  if (code >= 71 && code <= 77) return { condition: "Snow / Hail", icon: "ac_unit" };
  if (code >= 80 && code <= 82) return { condition: "Heavy Rain Showers", icon: "thunderstorm" };
  if (code >= 95 && code <= 99) return { condition: "Thunderstorm Alert", icon: "flash_on" };
  return { condition: "Cloudy", icon: "cloud" };
}

export async function reverseGeocodeLocation(lat: number, lon: number): Promise<string | null> {
  // Live client reverse-geocoding via BigDataCloud client API (free, open, no token required)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (resp.ok) {
      const geo = await resp.json();

      // Try sub-locality / neighborhood first (most precise), then locality, then city
      const subLocality =
        geo.localityInfo?.informative?.[0]?.name ||
        geo.localityInfo?.informative?.[1]?.name ||
        null;
      const city =
        geo.city ||
        geo.locality ||
        geo.localityInfo?.administrative?.[2]?.name ||
        null;
      const state = geo.principalSubdivision || null;

      if (subLocality && city && subLocality !== city) {
        // e.g. "Behala, Parnashree" + city → "Behala, Parnashree\nKolkata"
        return state ? `${subLocality}, ${city}` : subLocality;
      }
      if (city && state && city !== state) {
        return `${city}, ${state}`;
      }
      if (city) return city;
    }
  } catch {
    // Graceful fallback — caller handles null
  }

  return null;
}

export function computeEnvironmentalIntelligence(
  raw: any,
  lat: number,
  lon: number,
  locationName: string | null = null
): WeatherIntelligenceData {
  const current = raw.current_weather || {};
  const hourly = raw.hourly || {};
  const daily = raw.daily || {};

  const temp = Math.round(current.temperature ?? 28);
  const windSpeed = Math.round(current.windspeed ?? 8);
  const weatherCode = current.weathercode ?? 0;
  const humidity = hourly.relativehumidity_2m?.[0] ?? 65;
  const rainProb = hourly.precipitation_probability?.[0] ?? daily.precipitation_probability_max?.[0] ?? 10;
  const precipitation = hourly.precipitation?.[0] ?? daily.precipitation_sum?.[0] ?? 0;
  const uvIndex = Math.round(daily.uv_index_max?.[0] ?? 5);

  const { condition, icon } = mapWeatherCodeToCondition(weatherCode);

  // 1. Heat Stress Risk
  let heatRisk: EnvironmentalRisk;
  if (temp >= 36) {
    heatRisk = {
      level: "High",
      label: "Heat Stress",
      score: 85,
      explanation: {
        en: "High ambient heat. Risk of blossom drop and rapid moisture loss. Increase early morning irrigation.",
        hi: "अत्यधिक तापमान। फूलों के झड़ने और नमी तेजी से खत्म होने का खतरा। सुबह जल्दी सिंचाई करें।",
        bn: "অতিরিক্ত গরম। ফুল ঝরে যাওয়া এবং মাটির আর্দ্রতা দ্রুত কমে যাওয়ার ঝুঁকি। ভোরে সেচ দিন।"
      }
    };
  } else if (temp >= 31) {
    heatRisk = {
      level: "Moderate",
      label: "Heat Stress",
      score: 55,
      explanation: {
        en: "Elevated daytime temperature. Maintain root-zone moisture to avoid heat stress.",
        hi: "मध्यम गर्मी। गर्मी के तनाव से बचने के लिए जड़ों में पर्याप्त नमी बनाए रखें।",
        bn: "মাঝারি তাপমাত্রা। তাপের চাপ এড়াতে মূল অঞ্চলে পর্যাপ্ত আর্দ্রতা বজায় রাখুন।"
      }
    };
  } else {
    heatRisk = {
      level: "Low",
      label: "Heat Stress",
      score: 20,
      explanation: {
        en: "Temperature is within the optimal metabolic range for standard crops.",
        hi: "तापमान फसलों के सामान्य विकास के लिए अनुकूल है।",
        bn: "তাপমাত্রা ফসলের স্বাভাবিক বৃদ্ধির জন্য অনুকূল।"
      }
    };
  }

  // 2. Rain & Foliar Washout Risk
  let rainRisk: EnvironmentalRisk;
  if (rainProb >= 60 || precipitation >= 5 || weatherCode >= 61) {
    rainRisk = {
      level: "High",
      label: "Rain & Washout",
      score: 80,
      explanation: {
        en: "High rain probability. Delay fertilizer and pesticide spray to prevent chemical washout.",
        hi: "बारिश की भारी संभावना। कीटनाशक या खाद के छिड़काव से बचें ताकि दवा बह न जाए।",
        bn: "বৃষ্টির প্রবল সম্ভাবনা। কীটনাশক বা সার স্প্রে স্থগিত রাখুন যাতে তা ধুয়ে না যায়।"
      }
    };
  } else if (rainProb >= 35 || precipitation > 0.5) {
    rainRisk = {
      level: "Moderate",
      label: "Rain & Washout",
      score: 50,
      explanation: {
        en: "Scattered showers possible. Monitor skies before initiating extensive field applications.",
        hi: "हल्की बारिश संभव है। खेत में बड़े काम शुरू करने से पहले मौसम पर नज़र रखें।",
        bn: "হালকা বৃষ্টির সম্ভাবনা। মাঠে ওষুধ প্রয়োগের আগে আকাশ পর্যবেক্ষণ করুন।"
      }
    };
  } else {
    rainRisk = {
      level: "Low",
      label: "Rain & Washout",
      score: 15,
      explanation: {
        en: "Low precipitation risk. Favorable conditions for fieldwork and foliar management.",
        hi: "बारिश का जोखिम कम है। खेत के काम और छिड़काव के लिए स्थिति अनुकूल है।",
        bn: "বৃষ্টির ঝুঁকি নেই। মাঠের কাজ এবং পরিচর্যার জন্য আবহাওয়া অনুকূল।"
      }
    };
  }

  // 3. Spray Window / Wind Drift Risk
  let sprayWindRisk: EnvironmentalRisk;
  if (windSpeed >= 20) {
    sprayWindRisk = {
      level: "High",
      label: "Wind & Drift",
      score: 85,
      explanation: {
        en: "Strong wind gusts (>20 km/h). Chemical spray will drift off-target. Postpone spraying.",
        hi: "तेज हवा (>20 किमी/घंटा)। छिड़काव की दवा हवा में उड़ सकती है। अभी स्प्रे न करें।",
        bn: "প্রবল বাতাস (>২০ কিমি/ঘণ্টা)। স্প্রে করা ওষুধ উড়ে গিয়ে নষ্ট হতে পারে। এখন স্প্রে করবেন না।"
      }
    };
  } else if (windSpeed >= 12) {
    sprayWindRisk = {
      level: "Moderate",
      label: "Wind & Drift",
      score: 45,
      explanation: {
        en: "Moderate breeze. Use low-drift nozzles if spraying foliar treatments.",
        hi: "मध्यम हवा। यदि छिड़काव कर रहे हैं तो कम बहाव वाले नोजल का प्रयोग करें।",
        bn: "মাঝারি বাতাস। স্প্রে করার সময় সতর্কতা অবলম্বন করুন।"
      }
    };
  } else {
    sprayWindRisk = {
      level: "Low",
      label: "Wind & Drift",
      score: 10,
      explanation: {
        en: "Calm atmospheric window. Optimal for uniform foliar spray and drone applications.",
        hi: "शांत मौसम। समान छिड़काव और ड्रोन कार्यों के लिए सबसे उपयुक्त समय।",
        bn: "শান্ত আবহাওয়া। ফসলে সুষম স্প্রে করার জন্য আদর্শ সময়।"
      }
    };
  }

  // 4. Fungal / Humidity Risk
  let fungalRisk: EnvironmentalRisk;
  if (humidity >= 80 && temp >= 20) {
    fungalRisk = {
      level: "High",
      label: "Fungal Pressure",
      score: 75,
      explanation: {
        en: "High humidity and warm air accelerate fungal spore germination (blight, mildew, rust).",
        hi: "उच्च आर्द्रता और गर्मी से फफूंद (ब्लाइट, डाउनी मिल्ड्यू) फैलने का खतरा बढ़ जाता है।",
        bn: "উচ্চ আর্দ্রতা এবং উষ্ণ আবহাওয়া ছত্রাকের বিস্তার (ব্লাইট, ডাউনি মিলডিউ) ত্বরান্বিত করে।"
      }
    };
  } else if (humidity >= 70) {
    fungalRisk = {
      level: "Moderate",
      label: "Fungal Pressure",
      score: 45,
      explanation: {
        en: "Elevated canopy humidity. Ensure proper plant spacing and inspect dense lower foliage.",
        hi: "पौधों के बीच नमी अधिक है। निचली पत्तियों की नियमित जांच करें।",
        bn: "গাছের মাঝে আর্দ্রতা বেশি। নিচের পাতাগুলোতে ছত্রাকের লক্ষণ লক্ষ্য করুন।"
      }
    };
  } else {
    fungalRisk = {
      level: "Low",
      label: "Fungal Pressure",
      score: 15,
      explanation: {
        en: "Dry canopy conditions reduce the risk of foliar pathogen outbreaks.",
        hi: "सूखा वातावरण पत्तियों में फफूंद संक्रमण के जोखिम को कम करता है।",
        bn: "শুষ্ক আবহাওয়া পাতার রোগ সংক্রমণের ঝুঁকি কমায়।"
      }
    };
  }

  // 5. Extreme Weather Indicator
  let extremeWeatherRisk: EnvironmentalRisk;
  if (weatherCode >= 95 || windSpeed >= 40) {
    extremeWeatherRisk = {
      level: "High",
      label: "Storm / Severe",
      score: 95,
      explanation: {
        en: "Severe thunderstorm or high wind alert. Secure crop stakes and verify field drainage.",
        hi: "आंधी-तूफान की चेतावनी। पौधों को सहारा दें और जल निकासी की व्यवस्था जांचें।",
        bn: "ঝড়-বৃষ্টির সতর্কবার্তা। ফসলের খুঁটি শক্ত করুন এবং পানি নিষ্কাশন ব্যবস্থা নিশ্চিত করুন।"
      }
    };
  } else {
    extremeWeatherRisk = {
      level: "Low",
      label: "Storm / Severe",
      score: 10,
      explanation: {
        en: "No extreme weather events detected in current atmospheric models.",
        hi: "वर्तमान में किसी गंभीर मौसम की चेतावनी नहीं है।",
        bn: "বর্তমানে কোনো চরম আবহাওয়ার সতর্কতা নেই।"
      }
    };
  }

  // Overall Environmental Risk
  let overallEnvironmentalRisk: "Low" | "Moderate" | "High" = "Low";
  if (extremeWeatherRisk.level === "High" || heatRisk.level === "High" || rainRisk.level === "High") {
    overallEnvironmentalRisk = "High";
  } else if (heatRisk.level === "Moderate" || rainRisk.level === "Moderate" || fungalRisk.level === "Moderate" || sprayWindRisk.level === "Moderate") {
    overallEnvironmentalRisk = "Moderate";
  }

  // Agronomic synthesis
  let agriInsight = {
    en: "Optimal conditions for routine farming operations and crop scouting.",
    hi: "नियमित कृषि कार्यों और फसल निरीक्षण के लिए अनुकूल परिस्थितियां।",
    bn: "নিয়মিত কৃষি কাজ এবং ফসল পর্যবেক্ষণের জন্য অনুকূল আবহাওয়া।"
  };

  if (rainRisk.level === "High") {
    agriInsight = {
      en: "Rain forecast today. Avoid chemical spraying and ensure clear drainage channels in low-lying plots.",
      hi: "आज बारिश का अनुमान है। कीटनाशक छिड़काव रोकें और खेत में जल निकासी सुनिश्चित करें।",
      bn: "আজ বৃষ্টির সম্ভাবনা। কীটনাশক স্প্রে করবেন না এবং নিচু জমিতে পানি নিষ্কাশন নালা পরিষ্কার রাখুন।"
    };
  } else if (sprayWindRisk.level === "High") {
    agriInsight = {
      en: "Wind gusts exceed safe spraying threshold. Postpone foliar treatments until wind drops below 12 km/h.",
      hi: "हवा की गति अधिक है। हवा धीमी होने (12 किमी/घंटा से कम) तक स्प्रे टालें।",
      bn: "বাতাসের গতি বেশি। বাতাস শান্ত না হওয়া পর্যন্ত স্প্রে স্থগিত রাখুন।"
    };
  } else if (fungalRisk.level === "High") {
    agriInsight = {
      en: "High humidity detected. Inspect leaf undersides for early blight or mildew lesions.",
      hi: "अधिक नमी पाई गई। पत्तियों के नीचे ब्लाइट या फफूंद के लक्षणों की जांच करें।",
      bn: "উচ্চ আর্দ্রতা বিদ্যমান। পাতার নিচের অংশে ব্লাইট বা ছত্রাকের সংক্রমণ পরীক্ষা করুন।"
    };
  } else if (heatRisk.level === "High") {
    agriInsight = {
      en: "Extreme ambient heat today. Schedule irrigation during early morning hours to protect crops from heat wilt.",
      hi: "आज अत्यधिक गर्मी है। फसलों को झुलसने से बचाने के लिए सुबह जल्दी पानी दें।",
      bn: "আজ প্রচণ্ড তাপপ্রবাহ। ফসলের সুরক্ষায় ভোরে জমিতে সেচ প্রদান করুন।"
    };
  }

  // 3-Day Forecast Array
  const forecast: DayForecast[] = [];
  const dailyTime = daily.time || [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 0; i < Math.min(dailyTime.length, 3); i++) {
    const dStr = dailyTime[i];
    const dateObj = new Date(dStr);
    const dayName = i === 0 ? "Today" : dayNames[dateObj.getDay()] || "Day";
    const dCode = daily.weathercode?.[i] ?? 0;
    const { condition: dCond, icon: dIcon } = mapWeatherCodeToCondition(dCode);

    forecast.push({
      date: dStr,
      dayName,
      weatherCode: dCode,
      condition: dCond,
      icon: dIcon,
      tempMax: Math.round(daily.temperature_2m_max?.[i] ?? temp),
      tempMin: Math.round(daily.temperature_2m_min?.[i] ?? (temp - 5)),
      rainProb: daily.precipitation_probability_max?.[i] ?? 0,
      precipitation: daily.precipitation_sum?.[i] ?? 0
    });
  }

  return {
    temp,
    humidity,
    windSpeed,
    rainProb,
    precipitation,
    uvIndex,
    weatherCode,
    condition,
    icon,
    locationName: locationName || "Location unavailable",
    latitude: lat,
    longitude: lon,
    updatedAt: new Date().toISOString(),
    heatRisk,
    rainRisk,
    sprayWindRisk,
    fungalRisk,
    extremeWeatherRisk,
    overallEnvironmentalRisk,
    agriInsight,
    forecast
  };
}

export async function fetchWeatherIntelligence(
  lat?: number,
  lon?: number,
  forceRefresh: boolean = false
): Promise<WeatherIntelligenceData> {
  // If no coordinates provided, try to get device location
  let resolvedLat = lat;
  let resolvedLon = lon;

  if (resolvedLat === undefined || resolvedLon === undefined) {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 6000,
            maximumAge: 120000,
            enableHighAccuracy: false,
          });
        });
        resolvedLat = pos.coords.latitude;
        resolvedLon = pos.coords.longitude;
      } catch {
        throw new Error("Location unavailable");
      }
    } else {
      throw new Error("Location unavailable");
    }
  }

  const cacheKey = `weather_intelligence_${resolvedLat.toFixed(2)}_${resolvedLon.toFixed(2)}`;
  return await cachedFetch<WeatherIntelligenceData>(
    cacheKey,
    async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${resolvedLat}&longitude=${resolvedLon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,precipitation,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,windspeed_10m_max&timezone=auto`;

      const [weatherResp, locationName] = await Promise.all([
        fetch(url),
        reverseGeocodeLocation(resolvedLat!, resolvedLon!).catch(() => null),
      ]);

      if (!weatherResp.ok) {
        throw new Error(`Weather service returned HTTP ${weatherResp.status}`);
      }
      const raw = await weatherResp.json();
      return computeEnvironmentalIntelligence(raw, resolvedLat!, resolvedLon!, locationName);
    },
    15 * 60 * 1000,
    forceRefresh
  );
}

