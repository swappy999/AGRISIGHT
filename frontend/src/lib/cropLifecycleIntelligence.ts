export interface LifecycleStageConfig {
  id: string;
  order: number;
  name: string;
  nameHi: string;
  nameBn: string;
  icon: string;
  typicalDurationDays: number;
  dapRange: [number, number]; // [startDap, endDap]
  waterPriority: "Low" | "Moderate" | "High" | "Critical" | "Withhold / Drydown";
  waterGuidance: {
    en: string;
    hi: string;
    bn: string;
  };
  nutrientFocus: {
    en: string;
    hi: string;
    bn: string;
    recommendedRatio: string;
  };
  scoutingPriorities: {
    en: string[];
    hi: string[];
    bn: string[];
  };
  criticalWarnings: {
    en: string;
    hi: string;
    bn: string;
  };
  managementChecklist: {
    en: string[];
    hi: string[];
    bn: string[];
  };
}

export const CROP_LIFECYCLE_STAGES: LifecycleStageConfig[] = [
  {
    id: "seed",
    order: 1,
    name: "Sowing / Seed Preparation",
    nameHi: "बीज बुवाई / नर्सरी तैयारी",
    nameBn: "বীজ বপন ও নার্সারি প্রস্তুতি",
    icon: "grain",
    typicalDurationDays: 10,
    dapRange: [0, 10],
    waterPriority: "Moderate",
    waterGuidance: {
      en: "Keep soil consistently moist but never flooded. Avoid standing water to prevent seed rot.",
      hi: "मिट्टी में हल्की नमी बनाए रखें, जलभराव न होने दें जिससे बीज सड़ने से बचे।",
      bn: "মাটিতে পর্যাপ্ত আর্দ্রতা রাখুন, কোনোভাবেই পানি জমতে দেবেন না যাতে বীজ পচে না যায়।"
    },
    nutrientFocus: {
      en: "Basal phosphorus (SSP) & Trichoderma seed treatment for strong initial root sprouting.",
      hi: "बुवाई के समय बेसल फॉस्फोरस (SSP) व ट्राइकोडर्मा बीज उपचार करें।",
      bn: "মূল শিকড় গজানোর জন্য ফসফরাস (SSP) ও ট্রাইকোডার্মা বীজ শোধন করুন।" ,
      recommendedRatio: "Basal P & Bio-fertilizer"
    },
    scoutingPriorities: {
      en: ["Seed rot fungi (Pythium / Rhizoctonia)", "Soil cutworms and ants"],
      hi: ["बीज सड़न फफूंद (डैम्पिंग ऑफ)", "जमीन के कीड़े व चींटियां"],
      bn: ["বীজ পচা ছত্রাক (ড্যাম্পিং অফ)", "মাটির কাটুই পোকা"]
    },
    criticalWarnings: {
      en: "Do not apply direct high-dose chemical nitrogen touching the seed germ.",
      hi: "बीज के सीधे संपर्क में अधिक रासायनिक खाद न डालें।",
      bn: "বীজের সাথে সরাসরি উচ্চমাত্রার রাসায়নিক সার মেশাবেন না।"
    },
    managementChecklist: {
      en: ["Seed germination test (>85% viability)", "Fungicide / bio-agent seed treatment (Trichoderma @ 5g/kg)", "Prepare fine tilth raised nursery bed"],
      hi: ["बीज अंकुरण क्षमता की जांच करें", "ट्राइकोडर्मा 5 ग्राम/किग्रा से बीज उपचार करें", "उठी हुई क्यारियां तैयार करें"],
      bn: ["বীজের অঙ্কুরোদগম ক্ষমতা পরীক্ষা করুন", "ট্রাইকোডার্মা দিয়ে বীজ শোধন করুন", "উঁচু বেড তৈরি করে বীজ বপন করুন"]
    }
  },
  {
    id: "seedling",
    order: 2,
    name: "Germination & Seedling",
    nameHi: "अंकुरण एवं पौध अवस्था",
    nameBn: "চারা ও প্রাথমিক বৃদ্ধি",
    icon: "psychiatry",
    typicalDurationDays: 15,
    dapRange: [10, 25],
    waterPriority: "Moderate",
    waterGuidance: {
      en: "Light, frequent irrigations (micro-sprinkler or fine rose-can). Avoid heavy crusting.",
      hi: "हल्की व बार-बार सिंचाई करें। मिट्टी पर कड़ी परत न बनने दें।",
      bn: "ঘন ঘন হালকা সেচ দিন। মাটির উপরিভাগে শক্ত স্তর পড়তে দেবেন না।"
    },
    nutrientFocus: {
      en: "Root initiation booster: Humic acid (2ml/L) and 19:19:19 foliar spray at half strength (2g/L).",
      hi: "जड़ों के विकास हेतु ह्यूमिक एसिड और 19:19:19 का आधा घोल (2 ग्राम/लीटर) दें।",
      bn: "শিকড় দ্রুত ছড়াতে হিউমিক অ্যাসিড ও ১৯:১৯:১৯ সারের হালকা স্প্রে দিন।",
      recommendedRatio: "Starter 1:1:1 (Half Dose)"
    },
    scoutingPriorities: {
      en: ["Damping-off collar rot", "Early sucking thrips and flea beetles"],
      hi: ["आर्द्र गलन (डैम्पिंग ऑफ कॉलर रॉट)", "शुरुआती रस चूसक कीट"],
      bn: ["গোড়া পচা রোগ (Damping off)", "কচি পাতার রসচোষা পোকা"]
    },
    criticalWarnings: {
      en: "Excess moisture at seedling base triggers catastrophic collar rot damping-off.",
      hi: "पौध के तने के पास अधिक पानी रुकने से पौधे गलकर गिर जाते हैं।",
      bn: "চারার গোড়ায় অতিরিক্ত জল জমলে চারা দ্রুত পচে ঢলে পড়ে।"
    },
    managementChecklist: {
      en: ["Harden seedlings 3-4 days before transplanting", "Drench nursery with copper oxychloride 0.25% if damping-off observed", "Transplant during cool evening hours"],
      hi: ["रोपाई से 3-4 दिन पहले पानी कम करके पौध को मजबूत करें", "शाम के ठंडे समय में रोपाई करें"],
      bn: ["রোপণের ৩-৪ দিন আগে জল কমিয়ে চারা শক্ত করুন", "বিকেলের ঠাণ্ডা আবহাওয়ায় মূল জমিতে রোপণ করুন"]
    }
  },
  {
    id: "vegetative",
    order: 3,
    name: "Active Vegetative Growth",
    nameHi: "सक्रिय वानस्पतिक वृद्धि",
    nameBn: "অঙ্গজ ও শাখা-প্রশাখা বৃদ্ধি",
    icon: "eco",
    typicalDurationDays: 25,
    dapRange: [25, 50],
    waterPriority: "High",
    waterGuidance: {
      en: "Steady, regular irrigation matching evapotranspiration demand. Support canopy expansion.",
      hi: "नियमित व पर्याप्त सिंचाई करें ताकि पत्तियों व टहनियों का फैलाव अच्छा हो।",
      bn: "নিয়মিত পর্যাপ্ত সেচ দিন যাতে ডালপালা ও পাতার বিস্তার দ্রুত হয়।"
    },
    nutrientFocus: {
      en: "High nitrogen & magnesium for chlorophyll synthesis: Split urea application + 19:19:19.",
      hi: "नाइट्रोजन व मैग्नीशियम की मुख्य खुराक: यूरिया की पहली टॉप-ड्रेसिंग करें।",
      bn: "গাছের পাতা ও ডালের জন্য নাইট্রোজেন: ইউরিয়া সারের টপ-ড্রেসিং ও ১৯:১৯:১৯ দিন।",
      recommendedRatio: "High Nitrogen (N:P:K = 3:1:2)"
    },
    scoutingPriorities: {
      en: ["Aphids, whiteflies, and leaf miners", "Early blight and leaf spot pathogens", "Weed competition"],
      hi: ["माहू (एफिड्स), सफेद मक्खी व लीफ माइनर", "अगेती झुलसा व पत्ती धब्बा रोग", "खरपतवार"],
      bn: ["জাবপোকা, সাদা মাছি ও পাতা ফুটোকারী পোকা", "আগেতি ধসা ও পাতার দাগ রোগ", "আগাছার উপদ্রব"]
    },
    criticalWarnings: {
      en: "Over-fertilization with nitrogen produces lush soft growth highly susceptible to pests.",
      hi: "अत्यधिक यूरिया देने से पौधे बहुत कोमल हो जाते हैं और कीटों का प्रकोप बढ़ जाता है।",
      bn: "অতিরিক্ত ইউরিয়া দিলে গাছ বেশি নরম হয়ে যায় এবং পোকা-মাকড়ের আক্রমণ বহুগুণ বেড়ে যায়।"
    },
    managementChecklist: {
      en: ["First inter-cultivation and manual weeding", "Install yellow/blue sticky cards at canopy height", "Side-dress balanced organic compost"],
      hi: ["पहली निराई-गुड़ाई करके खरपतवार निकालें", "पीले व नीले स्टिकी ट्रैप लगाएं", "गोबर की सड़ी खाद या वर्मीकम्पोस्ट दें"],
      bn: ["প্রথমবার নিড়ানি দিয়ে আগাছা পরিষ্কার করুন", "হলুদ ও নীল আঠালো ফাঁদ স্থাপন করুন", "গাছের গোড়ায় কেঁচো সার বা কম্পোস্ট দিন"]
    }
  },
  {
    id: "flowering",
    order: 4,
    name: "Flowering & Panicle Initiation",
    nameHi: "फूल आना / बाली निकलना",
    nameBn: "ফুল ফোটা ও শিষ বের হওয়া",
    icon: "local_florist",
    typicalDurationDays: 25,
    dapRange: [50, 75],
    waterPriority: "Critical",
    waterGuidance: {
      en: "CRITICAL MOISTURE WINDOW: Never allow moisture stress; water deficit causes severe flower drop and sterile pollen.",
      hi: "अत्यंत संवेदनशील अवस्था: खेत में सूखा न पड़ने दें; पानी की कमी से फूल झड़ जाते हैं और परागण नहीं होता।",
      bn: "সবচেয়ে সংবেদনশীল ধাপ: কোনোভাবেই পানির ঘাটতি হতে দেবেন না; খরায় ফুল ঝরে যায় ও পরাগায়ন ব্যাহত হয়।"
    },
    nutrientFocus: {
      en: "Phosphorus, Potassium & Boron: Spray 0:52:34 (MKP @ 5g/L) + Boron 20% (1g/L) to boost fruit set.",
      hi: "फॉस्फोरस, पोटाश व बोरॉन: 0:52:34 (5 ग्राम) + बोरॉन (1 ग्राम/लीटर) का छिड़काव करें।",
      bn: "ফসফরাস, পটাশ ও বোরন: ০:৫২:৩৪ (৫ গ্রাম) + বোরন (১ গ্রাম/লিটার) স্প্রে করে ফুল ও ফলের সেটিং বাড়ান।",
      recommendedRatio: "High P-K + Boron (0:52:34 + B)"
    },
    scoutingPriorities: {
      en: ["Tomato fruit borer / bollworm moth flights", "Blossom blight / Botrytis gray mold", "Thrips inside flower blossoms"],
      hi: ["फल छेदक सूंडी (हेलिकोवर्पा)", "फूलों का सड़न रोग (ब्लोसम ब्लाइट)", "फूलों में थ्रिप्स कीट"],
      bn: ["ফল ছিদ্রকারী শুঁয়োপোকা", "ফুল পচা রোগ", "ফুলের ভেতরের থ্রিপস"]
    },
    criticalWarnings: {
      en: "POLLINATOR SAFEGUARD: Never spray synthetic chemical insecticides in morning hours (7 AM - 11 AM) during active honeybee pollination.",
      hi: "मधुमक्खी सुरक्षा: सुबह (7 से 11 बजे) जब मधुमक्खियां परागण कर रही हों, तब किसी भी रासायनिक दवा का छिड़काव न करें।",
      bn: "মৌমাছি সুরক্ষা: সকালে (৭টা থেকে ১১টা) পরাগায়নের সময় কোনো বিষাক্ত কীটনাশক স্প্রে করবেন না।"
    },
    managementChecklist: {
      en: ["Deploy pheromone traps for pest monitoring", "Apply foliar Boron for improved pollen tube germination", "Staking / tying tall vegetable vines"],
      hi: ["फेरोमोन ट्रैप लगाएं", "बोरॉन का पर्णीय छिड़काव करें", "टमाटर के पौधों को सहारा (स्टेकिंग) दें"],
      bn: ["ফেরোমোন ফাঁদ লাগান", "পরাগনালী বৃদ্ধির জন্য বোরন স্প্রে করুন", "গাছের ডালপালায় খুঁটি বা সুতো দিয়ে সাপোর্ট দিন"]
    }
  },
  {
    id: "fruiting",
    order: 5,
    name: "Fruit / Grain Development",
    nameHi: "फल विकास / दाना भराव",
    nameBn: "ফল গঠন ও দানা পুষ্ট হওয়া",
    icon: "nutrition",
    typicalDurationDays: 30,
    dapRange: [75, 105],
    waterPriority: "High",
    waterGuidance: {
      en: "Maintain consistent soil moisture. Sudden heavy irrigation after a dry spell causes fruit splitting and skin cracking.",
      hi: "सिंचाई में नियमितता रखें। सूखे के बाद अचानक ज्यादा पानी देने से फल फटने लगते हैं।",
      bn: "নিয়মিত পরিমিত সেচ দিন। খরা বা শুকানোর পর হঠাৎ অতিরিক্ত জল দিলে ফলের ত্বক ফেটে যায়।"
    },
    nutrientFocus: {
      en: "High Potassium & Calcium: Foliar spray 0:0:50 (Potassium Sulfate) + Calcium Nitrate to prevent Blossom End Rot.",
      hi: "पोटाश व कैल्शियम मुख्य: 0:0:50 (पोटैशियम सल्फेट) व कैल्शियम नाइट्रेट का छिड़काव करें।",
      bn: "পটাশ ও ক্যালসিয়াম: ০:০:৫০ সার ও ক্যালসিয়াম নাইট্রেট স্প্রে করে ফলের আকার ও মিষ্টতা বাড়ান।",
      recommendedRatio: "High Potassium + Calcium (0:0:50 + Ca)"
    },
    scoutingPriorities: {
      en: ["Fruit borer entry holes & frass", "Blossom End Rot (calcium/water deficiency)", "Fruit rot & anthracnose spots"],
      hi: ["फलों में छेदक सूंडी का प्रवेश", "ब्लॉसम एंड रॉट (निचला हिस्सा काला पड़ना)", "फल सड़न रोग"],
      bn: ["ফলে পোকার ছিদ্র", "ফলের নিচে কালো পচা দাগ (Blossom End Rot)", "ফল পচা রোগ"]
    },
    criticalWarnings: {
      en: "Strictly observe Pre-Harvest Intervals (PHI) for any crop protection products applied.",
      hi: "तुड़ाई से पूर्व दवा की प्रतीक्षा अवधि (PHI) का कड़ाई से पालन करें।",
      bn: "ফসল তোলার পূর্বে কীটনাশকের অপেক্ষার সময়কাল (PHI) কঠোরভাবে মেনে চলুন।"
    },
    managementChecklist: {
      en: ["Regular inspection of developing fruits", "Remove bored and dropped fruits to break pest cycle", "Apply potassium foliar sprays for fruit sizing and luster"],
      hi: ["फलों का नियमित निरीक्षण करें", "कीट लगे फलों को तोड़कर नष्ट करें", "फलों की चमक व मिठास हेतु पोटाश का छिड़काव करें"],
      bn: ["নিয়মিত ফল পরীক্ষা করুন", "আক্রান্ত ও ঝরে পড়া ফল সংগ্রহ করে ধ্বংস করুন", "ফলের চকচকে ভাব ও ওজন বাড়াতে পটাশ স্প্রে করুন"]
    }
  },
  {
    id: "harvest",
    order: 6,
    name: "Maturity & Harvesting",
    nameHi: "परिपक्वता एवं कटाई / तुड़ाई",
    nameBn: "পরিপক্কতা ও ফসল সংগ্রহ",
    icon: "agriculture",
    typicalDurationDays: 20,
    dapRange: [105, 140],
    waterPriority: "Withhold / Drydown",
    waterGuidance: {
      en: "Withhold irrigation 7–10 days before grain harvest to promote uniform ripening and prevent post-harvest mold.",
      hi: "कटाई से 7-10 दिन पहले सिंचाई पूरी तरह बंद कर दें ताकि दाना अच्छी तरह सूख सके।",
      bn: "ফসল তোলার ৭-১০ দিন আগে সেচ পুরোপুরি বন্ধ করে দিন যাতে ফসল সহজে শুকায় ও পচন না ধরে।"
    },
    nutrientFocus: {
      en: "Zero fertilizer application. Allow natural senescence and translocation into grains/fruits.",
      hi: "किसी भी खाद का प्रयोग बंद करें। पौधे को स्वाभाविक रूप से पकने दें।",
      bn: "কোনো প্রকার সার প্রয়োগ বন্ধ রাখুন। গাছকে প্রাকৃতিকভাবে পরিপক্ক হতে দিন।",
      recommendedRatio: "None (Harvest Phase)"
    },
    scoutingPriorities: {
      en: ["Post-harvest storage pests (weevils, moths)", "Aflatoxin / mold contamination in damp conditions"],
      hi: ["भंडारण के कीट (घुन, सुंडी)", "नमी के कारण फफूंद"],
      bn: ["গুদামের পোকা-মাকড়", "আর্দ্রতায় ছত্রাক বা ছাতা পড়া"]
    },
    criticalWarnings: {
      en: "Never harvest immediately after a heavy rain shower. Harvest during dry weather to maximize storage life.",
      hi: "बारिश के तुरंत बाद फसल न काटें। सूखे मौसम में कटाई करें ताकि भंडारण में सड़न न हो।",
      bn: "বৃষ্টির পরপরই ভেজা অবস্থায় ফসল তুলবেন না। শুকনা রৌদ্রোজ্জ্বল দিনে ফসল সংগ্রহ করুন।"
    },
    managementChecklist: {
      en: ["Harvest at optimal physiological maturity", "Sun-dry grains to <12% moisture before hermetic storage", "Clean and grade produce for market"],
      hi: ["उचित समय पर तुड़ाई/कटाई करें", "अनाज को सुखाकर 12% से कम नमी पर भंडारित करें", "सफाई व ग्रेडिंग करें"],
      bn: ["সঠিক পরিপক্কতায় ফসল সংগ্রহ করুন", "দানা জাতীয় ফসল রোদে শুকিয়ে ১২% এর নিচে আর্দ্রতায় সংরক্ষণ করুন", "গ্রেডিং ও প্যাকিং করুন"]
    }
  }
];

export function calculateDAP(plantingDateStr?: string | null): number {
  if (!plantingDateStr) return 30; // Default to active vegetative growth
  const pDate = new Date(plantingDateStr);
  if (isNaN(pDate.getTime())) return 30;
  const now = new Date();
  const diffMs = now.getTime() - pDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function estimateStageFromDAP(dap: number): LifecycleStageConfig {
  for (const stage of CROP_LIFECYCLE_STAGES) {
    if (dap >= stage.dapRange[0] && dap <= stage.dapRange[1]) {
      return stage;
    }
  }
  return CROP_LIFECYCLE_STAGES[CROP_LIFECYCLE_STAGES.length - 1];
}

export function getStageById(stageIdOrName?: string): LifecycleStageConfig {
  const norm = (stageIdOrName || "").toLowerCase().trim();
  const found = CROP_LIFECYCLE_STAGES.find(
    (s) =>
      s.id === norm ||
      norm.includes(s.id) ||
      norm.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(norm)
  );
  return found || CROP_LIFECYCLE_STAGES[2]; // Default to vegetative
}
