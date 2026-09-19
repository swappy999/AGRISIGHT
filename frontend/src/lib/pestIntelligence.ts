export interface PestProfile {
  id: string;
  name: string;
  nameHi: string;
  nameBn: string;
  scientificName: string;
  pestType: "Sucking Pest" | "Chewing / Borer" | "Defoliator" | "Mite";
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  growthStagesAtRisk: string[];
  favorableWeather: {
    tempRange: string;
    humidity: string;
    season: string;
  };
  symptoms: string[];
  symptomsHi: string[];
  symptomsBn: string[];
  economicThreshold: string;
  economicThresholdHi: string;
  economicThresholdBn: string;
  ipmProtocol: {
    biological: string[];
    biologicalHi: string[];
    biologicalBn: string[];
    mechanical: string[];
    mechanicalHi: string[];
    mechanicalBn: string[];
    chemicalSafeguard: string[];
    chemicalSafeguardHi: string[];
    chemicalSafeguardBn: string[];
    pollinatorCaution: string;
    pollinatorCautionHi: string;
    pollinatorCautionBn: string;
  };
}

export interface CropPestCatalog {
  crop: string;
  pests: PestProfile[];
}

export const PEST_DATABASE: Record<string, PestProfile[]> = {
  tomato: [
    {
      id: "aphid_tomato",
      name: "Aphids (Green Peach / Cotton Aphid)",
      nameHi: "एफिड्स / माहू (चूसक कीट)",
      nameBn: "জাবপোকা / এফিড",
      scientificName: "Aphis gossypii / Myzus persicae",
      pestType: "Sucking Pest",
      riskLevel: "High",
      growthStagesAtRisk: ["Seedling", "Vegetative", "Flowering"],
      favorableWeather: {
        tempRange: "20°C – 30°C",
        humidity: "High relative humidity (>65%) with cloudy skies",
        season: "Spring / Post-monsoon"
      },
      symptoms: [
        "Curling and crinkling of young top leaves",
        "Sticky honeydew secretions attracting black sooty mold",
        "Stunted vegetative shoot growth"
      ],
      symptomsHi: [
        "नई शीर्ष पत्तियों का मुड़ना और सिकुड़ना",
        "पत्तियों पर चिपचिपा स्राव जिससे काली फफूंद जमती है",
        "पौधे का विकास रुक जाना"
      ],
      symptomsBn: [
        "নতুন কচি পাতা কুঁকড়ে যাওয়া",
        "পাতার উপর আঠালো রস নিঃসরণ ও কালো ছত্রাক পড়া",
        "গাছের স্বাভাবিক বৃদ্ধি বাধাগ্রস্ত হওয়া"
      ],
      economicThreshold: "5–10 aphids per leaf shoot or curling visible on >10% plants",
      economicThresholdHi: "प्रति शीर्ष शाखा 5–10 एफिड्स या 10% से अधिक पौधों पर पत्ती मुड़ना",
      economicThresholdBn: "প্রতি ডগায় ৫–১০টি জাবপোকা বা ১০% গাছে পাতা কোঁকড়ানো দেখা গেলে",
      ipmProtocol: {
        biological: [
          "Spray cold-pressed 0.5% Neem Seed Kernel Extract (NSKE) or Neem Oil (10,000 ppm) @ 3 ml/L",
          "Conserve natural predators: Ladybird beetles (Coccinellidae) & Hoverfly larvae",
          "Apply Verticillium lecanii or Beauveria bassiana bio-fungal spore suspension (5g/L) during evening"
        ],
        biologicalHi: [
          "नीम का तेल (10,000 ppm) 3 मिली/लीटर पानी में मिलाकर शाम को छिड़कें",
          "लेडीबर्ड भृंग (लेडीबग) जैसे मित्र कीटों का संरक्षण करें",
          "ब्युवेरिया बासियाना या वर्टिसिलियम बायो-कीटनाशक 5 ग्राम/लीटर का छिड़काव करें"
        ],
        biologicalBn: [
          "০.৫% নিম তেল (১০,০০০ ppm) ৩ মিলি প্রতি লিটার জলে মিশিয়ে বিকেলে স্প্রে করুন",
          "বন্ধু পোকা (লেডিবার্ড বিটল) সংরক্ষণ করুন",
          "বিউভেরিয়া ব্যাসিয়ানা ৫ গ্রাম/লিটার জলে মিশিয়ে জৈব স্প্রে করুন"
        ],
        mechanical: [
          "Install yellow sticky traps @ 12–15 traps per acre at crop canopy level",
          "Prune and safely destroy heavily infested terminal twigs",
          "Use reflective silver mulch during transplanting to deter incoming winged aphids"
        ],
        mechanicalHi: [
          "खेत में फसल की ऊंचाई पर 12-15 पीले चिपचिपे ट्रैप प्रति एकड़ लगाएं",
          "अधिक ग्रसित पत्तियों और टहनियों को काटकर नष्ट करें",
          "रिफ्लेक्टिव सिल्वर मल्चिंग का उपयोग करें"
        ],
        mechanicalBn: [
          "প্রতি একরে ১২–১৫টি হলুদ আঠালো ফাঁদ (Yellow Sticky Trap) স্থাপন করুন",
          "বেশি আক্রান্ত ডালপালা ছেঁটে নষ্ট করে ফেলুন",
          "রুপালি প্লাস্টিক মালচিং ব্যবহার করে পোকার আগমন রোধ করুন"
        ],
        chemicalSafeguard: [
          "If ETL exceeds threshold, use targeted biorational like Thiamethoxam 25% WG @ 0.3g/L or Acetamiprid 20% SP @ 0.2g/L",
          "Maintain strict 5-day pre-harvest waiting interval (PHI)"
        ],
        chemicalSafeguardHi: [
          "यदि नुकसान सीमा पार हो जाए, तो थायमेथोक्सम 25% WG @ 0.3 ग्राम/लीटर का लक्षित छिड़काव करें",
          "तुड़ाई से 5 दिन पूर्व कोई रासायनिक छिड़काव न करें (PHI)"
        ],
        chemicalSafeguardBn: [
          "আক্রমণ তীব্র হলে থায়ামেথোক্সাম ২৫% WG ০.৩ গ্রাম/লিটার জলে স্প্রে করুন",
          "ফসল তোলার অন্তত ৫ দিন আগে রাসায়নিক প্রয়োগ বন্ধ রাখুন"
        ],
        pollinatorCaution: "Never spray during morning hours (7 AM - 11 AM) when honeybees and pollinators are active.",
        pollinatorCautionHi: "सुबह (7 से 11 बजे) जब मधुमक्खियां सक्रिय हों, तब कभी भी कीटनाशक का छिड़काव न करें।",
        pollinatorCautionBn: "সকালে (৭টা থেকে ১১টা) যখন মৌমাছিরা পরাগায়ন করে, তখন কোনো কীটনাশক স্প্রে করবেন না।"
      }
    },
    {
      id: "fruit_borer_tomato",
      name: "Tomato Fruit Borer / American Bollworm",
      nameHi: "टमाटर फल छेदक (कैटरपिलर)",
      nameBn: "টমেটোর ফল ছিদ্রকারী পোকা",
      scientificName: "Helicoverpa armigera",
      pestType: "Chewing / Borer",
      riskLevel: "Moderate",
      growthStagesAtRisk: ["Flowering", "Fruiting", "Fruit Development"],
      favorableWeather: {
        tempRange: "24°C – 34°C",
        humidity: "Warm days with intermittent light showers",
        season: "Mid-season cropping"
      },
      symptoms: [
        "Circular entry holes bored into developing green and ripe fruits",
        "Dark frass (caterpillar droppings) visible near fruit calyx",
        "Premature fruit rot and dropping"
      ],
      symptomsHi: [
        "हरे और पके फलों में गोल छेद",
        "फलों के पास कैटरपिलर का काला मल",
        "फलों का समय से पहले सड़ना और गिरना"
      ],
      symptomsBn: [
        "সবুজ ও পাকা ফলে গোল ছিদ্র",
        "বোঁটার কাছে পোকার মল দেখা যাওয়া",
        "ফল পচে অকালে ঝরে পড়া"
      ],
      economicThreshold: "1 egg or 1 newly hatched larva per 5 plants or 1 damaged fruit per plant",
      economicThresholdHi: "प्रति 5 पौधों पर 1 कैटरपिलर या प्रति पौधा 1 क्षतिग्रस्त फल",
      economicThresholdBn: "প্রতি ৫টি গাছে ১টি শুঁয়োপোকা বা গাছে ১টি ক্ষতিগ্রস্ত ফল দেখা দিলে",
      ipmProtocol: {
        biological: [
          "Release egg parasitoid Trichogramma pretiosum @ 50,000/acre at 7-day intervals during flowering",
          "Apply Bacillus thuringiensis (Bt) kurstaki formulation @ 2g/L during late evening",
          "Spray Helicoverpa NPV (Nuclear Polyhedrosis Virus) @ 250 LE/acre with 0.1% jaggery"
        ],
        biologicalHi: [
          "ट्राइकोग्रामा परजीवी कार्ड 50,000 प्रति एकड़ फूल आने पर लगाएं",
          "बैसिलस थुरिंजिएंसिस (Bt) 2 ग्राम/लीटर का शाम को छिड़काव करें",
          "एचएएनपीवी (HaNPV) 250 LE/एकड़ का गुड़ के घोल के साथ छिड़काव करें"
        ],
        biologicalBn: [
          "ট্রাইকোগ্রামা প্যারাসাইট কার্ড প্রতি একরে ৫০,০০০ ফুল আসার সময় লাগান",
          "ব্যাসিলাস থুরিনজিয়েনসিস (Bt) ২ গ্রাম/লিটার জলে গুলে বিকেলে স্প্রে করুন",
          "HaNPV স্প্রে করুন ০.১% গুড়ের সাথে মিশিয়ে"
        ],
        mechanical: [
          "Install Helilure pheromone traps @ 5–8 traps per acre for male moth monitoring and mass trapping",
          "Plant African Marigold as a trap crop (1 row of marigold every 16 rows of tomato)",
          "Handpick and destroy early-stage caterpillars and bored fruits"
        ],
        mechanicalHi: [
          "हेलिल्यूर फेरोमोन ट्रैप 5-8 प्रति एकड़ लगाएं",
          "टमाटर की हर 16 कतारों के बाद 1 कतार गेंदे के फूल की लगाएं (ट्रैप क्रॉप)",
          "कीट लगे फलों और सूंडियों को हाथ से बीनकर नष्ट करें"
        ],
        mechanicalBn: [
          "প্রতি একরে ৫–৮টি ফেরোমোন ফাঁদ (Pheromone Trap) স্থাপন করুন",
          "প্রতি ১৬ সারি টমেটোর মাঝে ১ সারি গাঁদা ফুল লাগান ফাঁদ শস্য হিসেবে",
          "পোকা ধরা ফল ও শুঁয়োপোকা হাত দিয়ে তুলে নষ্ট করুন"
        ],
        chemicalSafeguard: [
          "If threshold exceeded, spray Emamectin Benzoate 5% SG @ 0.4g/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L",
          "Observe 3-day harvest safety interval"
        ],
        chemicalSafeguardHi: [
          "सीमा पार होने पर एमामेक्टिन बेंजोएट 5% SG @ 0.4 ग्राम/लीटर का छिड़काव करें",
          "छिड़काव के 3 दिन बाद ही फल तोड़ें"
        ],
        chemicalSafeguardBn: [
          "আক্রমণ বেশি হলে ইমমেকটিন বেনজয়েট ৫% SG ০.৪ গ্রাম/লিটার জলে স্প্রে করুন",
          "স্প্রে করার ৩ দিন পর ফসল তুলুন"
        ],
        pollinatorCaution: "Apply treatments strictly at dusk (5:30 PM - 7:00 PM) to avoid non-target toxicity.",
        pollinatorCautionHi: "शाम को (5:30 से 7:00 बजे) छिड़काव करें ताकि लाभदायक कीट सुरक्षित रहें।",
        pollinatorCautionBn: "সূর্যাস্তের সময় (বিকেল ৫:৩০ - ৭:০০) স্প্রে করুন যাতে উপকারী পোকার ক্ষতি না হয়।"
      }
    },
    {
      id: "whitefly_tomato",
      name: "Whiteflies (Vector for Leaf Curl Virus)",
      nameHi: "सफेद मक्खी (व्हाइटफ्लाई)",
      nameBn: "সাদা মাছি (হোয়াইটফ্লাই)",
      scientificName: "Bemisia tabaci",
      pestType: "Sucking Pest",
      riskLevel: "High",
      growthStagesAtRisk: ["Seedling", "Vegetative"],
      favorableWeather: {
        tempRange: "28°C – 38°C",
        humidity: "Dry, hot conditions (40–60% RH)",
        season: "Summer / Pre-monsoon"
      },
      symptoms: [
        "Tiny white flying insects fluttering when foliage is shaken",
        "Yellow chlorotic spots and leaf thickening",
        "Transmission of Tomato Yellow Leaf Curl Virus (TYLCV)"
      ],
      symptomsHi: [
        "पौधे को हिलाने पर छोटे सफेद कीट उड़ते हैं",
        "पत्तियों पर पीले धब्बे और पत्ती का मोटा होना",
        "पत्ती मरोड़ वायरस (लीफ कर्ल) का फैलाव"
      ],
      symptomsBn: [
        "গাছ নাড়া দিলে সাদা মাছি উড়ে যায়",
        "পাতায় হলুদ ছোপ ও পাতা মোটা হয়ে যাওয়া",
        "লিফ কার্ল ভাইরাস ছড়ানো"
      ],
      economicThreshold: "4–5 whiteflies per plant terminal leaf",
      economicThresholdHi: "प्रति शीर्ष पत्ती 4-5 सफेद मक्खियां",
      economicThresholdBn: "প্রতি শীর্ষ পাতায় ৪-৫টি সাদা মাছি দেখা গেলে",
      ipmProtocol: {
        biological: [
          "Conserve natural predators: Mirid bugs & Encarsia formosa parasitoids",
          "Spray Neem oil 3000 ppm @ 5ml/L + soap emulsion (1ml/L)"
        ],
        biologicalHi: [
          "नीम का तेल (3000 ppm) 5 मिली/लीटर + साबुन का घोल मिलाकर छिड़कें",
          "प्राकृतिक शिकारी कीटों का संरक्षण करें"
        ],
        biologicalBn: [
          "নিম তেল (৩০০০ ppm) ৫ মিলি/লিটার সাবান জলের সাথে মিশিয়ে স্প্রে করুন",
          "প্রাকৃতিক শিকারী পোকা রক্ষা করুন"
        ],
        mechanical: [
          "Install yellow sticky traps @ 20 traps per acre at 1 foot above canopy",
          "Erect 2–3 rows of barrier crops (Maize or Sorghum) around tomato plot perimeter",
          "Grow seedlings under 40-mesh insect-proof nylon netting nurseries"
        ],
        mechanicalHi: [
          "खेत में 20 पीले चिपचिपे ट्रैप प्रति एकड़ लगाएं",
          "खेत के चारों ओर मक्का या ज्वार की 2-3 पंक्तियां बॉर्डर क्रॉप के रूप में लगाएं",
          "नर्सरी को 40 मेश नेट के अंदर उगाएं"
        ],
        mechanicalBn: [
          "প্রতি একরে ২০টি হলুদ আঠালো ফাঁদ লাগান",
          "জমির সীমানায় ভুট্টা বা জোয়ারের ২-৩ সারি সীমানা ফসল (Barrier crop) লাগান",
          "৪০ মেশের মশারি নেট দিয়ে নার্সারি ঢেকে চারা তৈরি করুন"
        ],
        chemicalSafeguard: [
          "Spray Diafenthiuron 50% WP @ 1g/L or Pyriproxyfen 10% EC @ 1ml/L at nymphal stage",
          "Rotate chemical classes to prevent rapid insecticide resistance"
        ],
        chemicalSafeguardHi: [
          "डायाफेन्थियूरॉन 50% WP @ 1 ग्राम/लीटर का छिड़काव करें",
          "दवा बदल-बदल कर छिड़कें ताकि कीटों में प्रतिरोधक क्षमता न बने"
        ],
        chemicalSafeguardBn: [
          "ডায়াফেন্থিউরন ৫০% WP ১ গ্রাম/লিটার জলে স্প্রে করুন",
          "একই কীটনাশক বারবার ব্যবহার না করে ঘুরিয়ে-ফিরিয়ে স্প্রে করুন"
        ],
        pollinatorCaution: "Avoid spraying during peak bloom stage.",
        pollinatorCautionHi: "फूल आने के चरम समय में छिड़काव से बचें।",
        pollinatorCautionBn: "ফুল ফোটার মূল সময়ে স্প্রে এড়িয়ে চলুন।"
      }
    }
  ],
  rice: [
    {
      id: "stem_borer_rice",
      name: "Yellow Stem Borer",
      nameHi: "धान का तना छेदक (स्टेम बोरर)",
      nameBn: "ধানের মাজরা পোকা",
      scientificName: "Scirpophaga incertulas",
      pestType: "Chewing / Borer",
      riskLevel: "High",
      growthStagesAtRisk: ["Tillering", "Panicle Initiation", "Heading"],
      favorableWeather: {
        tempRange: "25°C – 32°C",
        humidity: "High humidity (>80%) and warm stagnant conditions",
        season: "Kharif & Rabi"
      },
      symptoms: [
        "'Dead heart' in vegetative tillers (central drying shoot that pulls out easily)",
        "'White earhead' at reproductive stage with completely chaffy unfilled grains",
        "Tiny entry holes at the base of the tiller stem"
      ],
      symptomsHi: [
        "वानस्पतिक अवस्था में 'डेड हार्ट' (सूखा केंद्रीय तना जो आसानी से खिंच जाता है)",
        "बाली निकलने पर सफेद थोथी बालियां ('व्हाइट इयर')",
        "तने के निचले हिस्से पर छोटे छिद्र"
      ],
      symptomsBn: [
        "গাছ বাড়ার সময় 'মৃত ডিগ' বা ডেড হার্ট (মাঝের পাতা শুকিয়ে যায় ও টান দিলে সহজে উঠে আসে)",
        "থোড় বা শিষ আসার সময় শিষ সাদা ও চিটা হয়ে যাওয়া (হোয়াইট হেড)",
        "ধানের গোড়ায় ছোট ছিদ্র"
      ],
      economicThreshold: "2 egg masses/m² or 10% dead hearts at tillering, 2% white ears at heading",
      economicThresholdHi: "प्रति वर्ग मीटर 2 अंडा समूह या 10% डेड हार्ट",
      economicThresholdBn: "প্রতি বর্গমিটারে ২টি ডিমের গাদা বা ১০% মৃত ডিগ দেখা দিলে",
      ipmProtocol: {
        biological: [
          "Release Trichogramma japonicum parasitoid cards @ 40,000/acre (5 releases at weekly intervals)",
          "Encourage spider populations (wolf spiders & orb-weavers) by avoiding early non-selective pesticide sprays"
        ],
        biologicalHi: [
          "ट्राइकोग्रामा जपोनिकम कार्ड 40,000 प्रति एकड़ की दर से 5 बार लगाएं",
          "खेत में मकड़ियों जैसे शिकारी जीवों की रक्षा करें"
        ],
        biologicalBn: [
          "ট্রাইকোগ্রামা জাপোনিকাম কার্ড প্রতি একরে ৪০,০০০ হারে সাপ্তাহিক ব্যবধানে ব্যবহার করুন",
          "জমিতে মাকড়সার মতো প্রাকৃতিক শত্রু রক্ষা করুন"
        ],
        mechanical: [
          "Install Light Traps @ 1 per hectare (burn 7 PM - 10 PM) to trap emerging adult moths",
          "Install Pheromone traps with 'Scirpolure' @ 8 traps/acre",
          "Clip seedling leaf tips before transplanting to remove egg masses"
        ],
        mechanicalHi: [
          "खेत में प्रकाश प्रपंच (Light Trap) रात 7 से 10 बजे तक चलाएं",
          "फेरोमोन ट्रैप 8 प्रति एकड़ लगाएं",
          "रोपाई से पहले धान की पौध के ऊपरी सिरे को काट दें ताकि अंडे नष्ट हो जाएं"
        ],
        mechanicalBn: [
          "প্রতি হেক্টরে ১টি আলোক ফাঁদ (Light Trap) সন্ধ্যা ৭টা-১০টা পর্যন্ত চালান",
          "ফেরোমোন ফাঁদ প্রতি একরে ৮টি স্থাপন করুন",
          "চারা রোপণের সময় পাতার ডগা কেটে ফেলুন যাতে ডিমের গাদা নষ্ট হয়"
        ],
        chemicalSafeguard: [
          "Apply Chlorantraniliprole 0.4% GR @ 4 kg/acre in standing water or Cartap Hydrochloride 4G @ 7.5 kg/acre",
          "Maintain 2–3 cm standing water for 48 hours after granule broadcast"
        ],
        chemicalSafeguardHi: [
          "खेत में पानी होने पर क्लोरेंट्रानिलीप्रोल 0.4% GR @ 4 किग्रा/एकड़ का बुरकाव करें",
          "दवा डालने के बाद खेत में 2-3 सेमी पानी बनाए रखें"
        ],
        chemicalSafeguardBn: [
          "জমিতে পানি থাকা অবস্থায় ক্লোরেন্ট্রানিলিপ্রোল ০.৪% GR ৪ কেজি/একর জমিতে ছিটিয়ে দিন",
          "প্রয়োগের পর ৪৮ ঘণ্টা জমিতে ২-৩ সেমি পানি রাখুন"
        ],
        pollinatorCaution: "Do not drain treated field water directly into community fish ponds or waterways.",
        pollinatorCautionHi: "दवा युक्त पानी को मछली तालाबों या जलस्रोतों में न बहने दें।",
        pollinatorCautionBn: "কীটনাশক মিশ্রিত পানি পুকুর বা জলাশয়ে নিষ্কাশন করবেন না।"
      }
    }
  ],
  potato: [
    {
      id: "aphid_potato",
      name: "Potato Aphids & Tuber Moth",
      nameHi: "आलू का माहू एवं कंद शलभ (ट्यूबर मॉथ)",
      nameBn: "আলুর জাবপোকা ও শুঁয়োপোকা",
      scientificName: "Myzus persicae / Phthorimaea operculella",
      pestType: "Sucking Pest",
      riskLevel: "Moderate",
      growthStagesAtRisk: ["Vegetative", "Tuber Bulking", "Storage"],
      favorableWeather: {
        tempRange: "18°C – 26°C",
        humidity: "Moderate humidity (55–75%)",
        season: "Winter Rabi"
      },
      symptoms: [
        "Leaf curling and vector transmission of Potato Leaf Roll Virus (PLRV)",
        "Mines inside potato foliage and tunneling into exposed soil tubers"
      ],
      symptomsHi: [
        "पत्तियों का मुड़ना और वायरस का फैलाव",
        "पत्तियों और खुले कंदों में सुरंग बनाना"
      ],
      symptomsBn: [
        "পাতা কোঁকড়ানো ও লিফ রোল ভাইরাস ছড়ানো",
        "পাতায় ও অনাবৃত আলুর গায়ে সুড়ঙ্গ তৈরি করা"
      ],
      economicThreshold: "20 aphids per 100 compound leaves (for seed crop: 2 aphids/100 leaves)",
      economicThresholdHi: "प्रति 100 पत्तियों पर 20 माहू (बीज फसल के लिए 2 माहू)",
      economicThresholdBn: "প্রতি ১০০টি যৌগিক পাতায় ২০টি জাবপোকা দেখা দিলে",
      ipmProtocol: {
        biological: [
          "Spray Neem seed kernel extract (NSKE 5%) @ 50g/L or Neem oil @ 3ml/L",
          "Release Chrysoperla carnea green lacewing larvae @ 20,000/acre"
        ],
        biologicalHi: [
          "नीम का काढ़ा (5%) या नीम तेल 3 मिली/लीटर का छिड़काव करें",
          "क्राइसोपर्ला मित्र कीट के लार्वा छोड़ें"
        ],
        biologicalBn: [
          "৫% নিম বীজের নির্যাস বা নিম তেল ৩ মিলি/লিটার স্প্রে করুন",
          "ক্রাইসোপারলা পোকার লার্ভা জমিতে ছাড়ুন"
        ],
        mechanical: [
          "Perform thorough earthing up (मिट्टी चढ़ाना) at 30 & 45 DAP so no tubers are exposed to moths",
          "Install yellow water pan traps or sticky traps for aphid monitoring"
        ],
        mechanicalHi: [
          "बुवाई के 30 और 45 दिन बाद अच्छी तरह मिट्टी चढ़ाएं ताकि कंद ढके रहें",
          "पीले चिपचिपे ट्रैप लगाएं"
        ],
        mechanicalBn: [
          "৩০ ও ৪৫ দিনে ভালো করে ভেলি বা মাটি তুলে আলু ঢেকে দিন যাতে পোকা ডিম পাড়তে না পারে",
          "হলুদ আঠালো ফাঁদ ব্যবহার করুন"
        ],
        chemicalSafeguard: [
          "Spray Imidacloprid 17.8% SL @ 0.3ml/L or Flonicamid 50% WG @ 0.3g/L if threshold exceeded",
          "Observe 15-day pre-harvest waiting interval"
        ],
        chemicalSafeguardHi: [
          "इमिडाक्लोप्रिड 17.8% SL @ 0.3 मिली/लीटर का छिड़काव करें",
          "तुड़ाई से 15 दिन पहले छिड़काव बंद करें"
        ],
        chemicalSafeguardBn: [
          "ইমিডাক্লোপ্রিড ১৭.৮% SL ০.৩ মিলি/লিটার জলে গুলে স্প্রে করুন",
          "ফসল তোলার ১৫ দিন আগে স্প্রে করা বন্ধ করুন"
        ],
        pollinatorCaution: "Never apply systemic neonicotinoids during active flowering.",
        pollinatorCautionHi: "फूल आने पर कीटनाशक का प्रयोग न करें।",
        pollinatorCautionBn: "ফুল ফোটার সময় বিষ প্রয়োগ থেকে বিরত থাকুন।"
      }
    }
  ],
  chili: [
    {
      id: "thrips_chili",
      name: "Chili Thrips & Yellow Mites (Murda Complex)",
      nameHi: "मिर्च का थ्रिप्स एवं पीली मकड़ी (मुर्रड़ा रोग)",
      nameBn: "মরিচের থ্রিপস ও মাকড় (পাতা কোঁকড়ানো)",
      scientificName: "Scirtothrips dorsalis / Polyphagotarsonemus latus",
      pestType: "Sucking Pest",
      riskLevel: "High",
      growthStagesAtRisk: ["Vegetative", "Flowering", "Fruiting"],
      favorableWeather: {
        tempRange: "28°C – 37°C",
        humidity: "Dry weather with clear skies (accelerates thrips)",
        season: "Summer & Post-monsoon"
      },
      symptoms: [
        "Upward boat-shaped curling of leaves (Thrips attack)",
        "Downward inverted cup-shaped curling with shiny brittle leaves (Mite attack)",
        "Bronzing and rough russeting on fruit surface"
      ],
      symptomsHi: [
        "पत्तियों का नाव की तरह ऊपर की ओर मुड़ना (थ्रिप्स का प्रकोप)",
        "पत्तियों का उल्टे कप की तरह नीचे मुड़ना और कड़ा होना (माइट्स का प्रकोप)",
        "फलों पर भूरापन और खुरदरापन"
      ],
      symptomsBn: [
        "পাতা নৌকার মতো উপরের দিকে কুঁকড়ে যাওয়া (থ্রিপস আক্রমণ)",
        "পাতা নিচের দিকে কুঁকড়ে মোটা ও শক্ত হয়ে যাওয়া (মাকড় আক্রমণ)",
        "মরিচের ত্বকে তামাটে দাগ পড়া"
      ],
      economicThreshold: "2–3 thrips or mites per leaf shoot",
      economicThresholdHi: "प्रति शीर्ष पत्ती 2-3 थ्रिप्स या माइट्स",
      economicThresholdBn: "প্রতি ডগায় ২-৩টি থ্রিপস বা মাকড় দেখা দিলে",
      ipmProtocol: {
        biological: [
          "Spray Neem oil (10,000 ppm) @ 3ml/L + Pongamia (Karanja) oil @ 2ml/L",
          "Conserve predatory mites (Amblyseius spp.) and pirate bugs"
        ],
        biologicalHi: [
          "नीम का तेल (10,000 ppm) 3 मिली + करंज का तेल 2 मिली/लीटर मिलाकर छिड़कें",
          "शिकारी माइट्स का संरक्षण करें"
        ],
        biologicalBn: [
          "নিম তেল ৩ মিলি + করঞ্জা তেল ২ মিলি প্রতি লিটার জলে স্প্রে করুন",
          "প্রাকৃতিক শিকারী মাকড় রক্ষা করুন"
        ],
        mechanical: [
          "Install Blue Sticky Traps @ 15–20 per acre for thrips + Yellow Sticky Traps for whiteflies",
          "Install overhead sprinkler misting during hot dry spells to wash off thrips and suppress mites",
          "Intercrop with 2 rows of Maize or Bajra as border barriers"
        ],
        mechanicalHi: [
          "नीले चिपचिपे ट्रैप (Blue sticky trap) 15-20 प्रति एकड़ थ्रिप्स के लिए लगाएं",
          "गर्म सूखे मौसम में फव्वारा (स्प्रिंकलर) चलाएं जिससे कीट बह जाएं",
          "खेत की मेड़ों पर मक्का या बाजरा लगाएं"
        ],
        mechanicalBn: [
          "প্রতি একরে ১৫–২০টি নীল আঠালো ফাঁদ (Blue Trap) থ্রিপসের জন্য লাগান",
          "বৃষ্টি না হলে স্প্রিংকলার দিয়ে জল ছিটিয়ে মাকড় ও থ্রিপস ধুয়ে দিন",
          "জমির চারিপাশে ভুট্টা বা বাজরার ২ সারি বেড়া দিন"
        ],
        chemicalSafeguard: [
          "For thrips: Fipronil 5% SC @ 1.5ml/L or Spinetoram 11.7% SC @ 0.8ml/L",
          "For mites: Spiromesifen 22.9% SC @ 1ml/L or Propargite 57% EC @ 2ml/L",
          "Maintain strict 7-day pre-harvest waiting interval"
        ],
        chemicalSafeguardHi: [
          "थ्रिप्स के लिए: फिप्रोनिल 5% SC @ 1.5 मिली/लीटर या स्पाइनेटोरम @ 0.8 मिली/लीटर",
          "माइट्स के लिए: स्पाइरोमेसिफेन 22.9% SC @ 1 मिली/लीटर",
          "तुड़ाई से 7 दिन पूर्व दवा बंद करें"
        ],
        chemicalSafeguardBn: [
          "থ্রিপসের জন্য: ফিপ্রোনিল ৫% SC ১.৫ মিলি বা স্পিনেটোরাম ০.৮ মিলি/লিটার",
          "মাকড়ের জন্য: স্পাইরোমেসিফেন ২২.৯% SC ১ মিলি/লিটার",
          "তোলার ৭ দিন আগে স্প্রে বন্ধ রাখুন"
        ],
        pollinatorCaution: "Never apply Fipronil during peak blossom; highly toxic to bees.",
        pollinatorCautionHi: "फूल आने पर फिप्रोनिल का प्रयोग बिल्कुल न करें; यह मधुमक्खियों के लिए अत्यंत हानिकारक है।",
        pollinatorCautionBn: "ফুল ফোটার সময় ফিপ্রোনিল স্প্রে করবেন না; এটি মৌমাছির জন্য মারাত্মক ক্ষতিকর।"
      }
    }
  ]
};

export function getCropPestProfiles(cropName: string): PestProfile[] {
  const normalized = (cropName || "").toLowerCase().trim();
  if (normalized.includes("tomato") || normalized.includes("টমেটো") || normalized.includes("टमाटर")) {
    return PEST_DATABASE.tomato;
  }
  if (normalized.includes("rice") || normalized.includes("paddy") || normalized.includes("ধান") || normalized.includes("चावल")) {
    return PEST_DATABASE.rice;
  }
  if (normalized.includes("potato") || normalized.includes("আলু") || normalized.includes("आलू")) {
    return PEST_DATABASE.potato;
  }
  if (normalized.includes("chili") || normalized.includes("chilli") || normalized.includes("pepper") || normalized.includes("মরিচ") || normalized.includes("मिर्च")) {
    return PEST_DATABASE.chili;
  }
  // Default general pest profile
  return PEST_DATABASE.tomato;
}
