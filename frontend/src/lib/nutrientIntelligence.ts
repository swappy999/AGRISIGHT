export interface NutrientProfile {
  id: string;
  element: string;
  symbol: string;
  category: "Macronutrient (Primary)" | "Macronutrient (Secondary)" | "Micronutrient";
  mobility: string;
  deficiencyTitleEn: string;
  deficiencyTitleHi: string;
  deficiencyTitleBn: string;
  diagnosticSymptoms: string[];
  diagnosticSymptomsHi: string[];
  diagnosticSymptomsBn: string[];
  foliarAndOrganicCorrection: string[];
  foliarAndOrganicCorrectionHi: string[];
  foliarAndOrganicCorrectionBn: string[];
  soilTestingAdvice: string;
  soilTestingAdviceHi: string;
  soilTestingAdviceBn: string;
  preventionManagement: string[];
  preventionManagementHi: string[];
  preventionManagementBn: string[];
}

export const NUTRIENT_PROFILES: NutrientProfile[] = [
  {
    id: "nitrogen",
    element: "Nitrogen",
    symbol: "N",
    category: "Macronutrient (Primary)",
    mobility: "Mobile (Symptoms on Old Leaves First)",
    deficiencyTitleEn: "Possible Nitrogen (N) Deficiency",
    deficiencyTitleHi: "संभावित नाइट्रोजन (N) की कमी",
    deficiencyTitleBn: "সম্ভাব্য নাইট্রোজেন (N) ঘাটতি",
    diagnosticSymptoms: [
      "Uniform pale green to yellow chlorosis starting from oldest bottom leaves",
      "V-shaped yellowing along the midrib extending from leaf tip backwards",
      "Stunted vegetative growth, thin spindly stems, and reduced tillering"
    ],
    diagnosticSymptomsHi: [
      "पुरानी निचली पत्तियों से शुरू होकर पूरी पत्ती का हल्का पीला पड़ना",
      "पत्ती के सिरे से मध्य शिरा (मिडरॉब) के साथ V-आकार में पीलापन",
      "पौधे का कद छोटा रहना और तने पतले व कमजोर होना"
    ],
    diagnosticSymptomsBn: [
      "গাছের নিচের পুরনো পাতা থেকে শুরু করে সমভাবে ফ্যাকাশে হলুদ হওয়া",
      "পাতার ডগা থেকে শুরু করে মাঝের শিরার সাথে V-আকৃতির হলুদ ভাব",
      "গাছের বৃদ্ধি থমকে যাওয়া ও কান্ড সরু হয়ে যাওয়া"
    ],
    foliarAndOrganicCorrection: [
      "Apply foliar spray of 1.0% to 1.5% water-soluble Urea (10-15g/L) during cool morning hours for rapid absorption",
      "Top-dress with well-rotted Farmyard Manure (FYM) or Vermicompost (2–3 tons/acre)",
      "Inoculate soil with Azotobacter or Azospirillum bio-fertilizers (2 kg/acre mixed with FYM)"
    ],
    foliarAndOrganicCorrectionHi: [
      "सुबह के समय 1% यूरिया का पर्णीय छिड़काव (10 ग्राम/लीटर) तुरंत सुधार हेतु करें",
      "अच्छी सड़ी गोबर की खाद या वर्मीकम्पोस्ट (केंचुआ खाद) की टॉप ड्रेसिंग करें",
      "एजोटोबैक्टर या एजोस्पिरिलम जैव उर्वरक का उपयोग करें"
    ],
    foliarAndOrganicCorrectionBn: [
      "সকালে ১% ইউরিয়া দ্রবণ (১০ গ্রাম/লিটার) পাতায় স্প্রে করুন দ্রুত প্রতিকারের জন্য",
      "ভালোভাবে পচানো গোবর সার বা কেঁচো সার প্রয়োগ করুন",
      "এজোটোব্যাক্টর বা এজোস্পাইরিলাম বায়ো-ফার্টিলাইজার ব্যবহার করুন"
    ],
    soilTestingAdvice: "Visual chlorosis can be confused with root rot or overwatering. Conduct a laboratory soil test to confirm available Nitrogen and organic carbon percentage.",
    soilTestingAdviceHi: "पत्तियों का पीलापन जलभराव से भी हो सकता है। उपलब्ध नाइट्रोजन व जैविक कार्बन की पुष्टि हेतु प्रयोगशाला में मिट्टी की जांच अवश्य करवाएं।",
    soilTestingAdviceBn: "পাতা হলুদ হওয়া জলাবদ্ধতার কারণেও হতে পারে। মাটিতে নাইট্রোজেন ও জৈব কার্বনের পরিমাণ জানতে ল্যাব টেস্টের মাধ্যমে নিশ্চিত হন।",
    preventionManagement: [
      "Apply nitrogen in split doses aligned with crop growth stages (Seedling, Active Tillering, Panicle initiation)",
      "Incorporate green manure leguminous crops (Dhaincha / Sunhemp) before sowing"
    ],
    preventionManagementHi: [
      "नाइट्रोजन को फसल की विभिन्न अवस्थाओं में 2-3 किस्तों (स्प्लिट डोज) में दें",
      "बुवाई से पूर्व ढैंचा या सनई जैसी हरी खाद का उपयोग करें"
    ],
    preventionManagementBn: [
      "নাইট্রোজেন সার একবারে না দিয়ে ফসলের বৃদ্ধির বিভিন্ন ধাপে কিস্তিতে দিন",
      "জমি তৈরির সময় ধইঞ্চা জাতীয় সবুজ সার প্রয়োগ করুন"
    ]
  },
  {
    id: "phosphorus",
    element: "Phosphorus",
    symbol: "P",
    category: "Macronutrient (Primary)",
    mobility: "Mobile (Symptoms on Old Leaves First)",
    deficiencyTitleEn: "Possible Phosphorus (P) Deficiency",
    deficiencyTitleHi: "संभावित फॉस्फोरस (P) की कमी",
    deficiencyTitleBn: "সম্ভাব্য ফসফরাস (P) ঘাটতি",
    diagnosticSymptoms: [
      "Dark green foliage turning distinctive purple or reddish-bronze along margins",
      "Severely restricted root elongation and weak root system",
      "Delayed flowering, poor grain filling, and retarded maturity"
    ],
    diagnosticSymptomsHi: [
      "पत्तियों का गहरा हरा होकर किनारों से बैंगनी या लाल-तामिया रंग में बदलना",
      "जड़ों का कमजोर व अल्प विकास",
      "फूल व बालियां आने में देरी और दानों का ठीक से न भरना"
    ],
    diagnosticSymptomsBn: [
      "পাতা অতিরিক্ত গাঢ় সবুজ হয়ে কিনারায় লালচে-বেগুনি রঙ ধারণ করা",
      "গাছের শিকড় বা মূলতন্ত্রের দুর্বল বৃদ্ধি",
      "ফুল-ফল দেরিতে আসা এবং ফলন অপুষ্ট হওয়া"
    ],
    foliarAndOrganicCorrection: [
      "Foliar spray of 19:19:19 or 0:52:34 (Monopotassium Phosphate) @ 5g/L water",
      "Incorporate Single Super Phosphate (SSP) or Rock Phosphate placed near active root zone",
      "Apply Phosphate Solubilizing Bacteria (PSB) bio-inoculant @ 2 kg/acre to unlock fixed soil phosphorus"
    ],
    foliarAndOrganicCorrectionHi: [
      "0:52:34 (मोनोपोटैशियम फॉस्फेट) या 19:19:19 घुलनशील खाद का 5 ग्राम/लीटर छिड़काव करें",
      "सिंगल सुपर फॉस्फेट (SSP) को जड़ों के पास गहराई में डालें",
      "फॉस्फोरस घोलक बैक्टीरिया (PSB) कल्चर 2 किग्रा/एकड़ का प्रयोग करें"
    ],
    foliarAndOrganicCorrectionBn: [
      "০:৫২:৩৪ (MKP) বা ১৯:১৯:১৯ সার ৫ গ্রাম/লিটার জলে গুলে পাতায় স্প্রে করুন",
      "সিঙ্গেল সুপার ফসফেট (SSP) শিকড়ের কাছাকাছি গভীরতায় প্রয়োগ করুন",
      "পিএসবি (PSB) কালচার জমিতে মিশিয়ে দিন যা মাটির ফসফরাস সহজে গাছে জোগায়"
    ],
    soilTestingAdvice: "Phosphorus availability is heavily dependent on soil pH (optimal 6.0–7.5). Strongly acidic or alkaline soils lock phosphorus. Test soil pH.",
    soilTestingAdviceHi: "फॉस्फोरस की उपलब्धता मिट्टी के pH पर निर्भर करती है। अत्यधिक अम्लीय या क्षारीय मिट्टी में फॉस्फोरस लॉक हो जाता है, अतः pH की जांच करें।",
    soilTestingAdviceBn: "মাটির পিএইচ (pH) খুব কম বা বেশি হলে ফসফরাস আটকে যায়। ল্যাবে মাটির পিএইচ টেস্ট করুন।",
    preventionManagement: [
      "Always apply full phosphorus dose as basal application at the time of sowing/transplanting",
      "Band placement below the seed row rather than surface broadcasting"
    ],
    preventionManagementHi: [
      "फॉस्फोरस की पूरी मात्रा हमेशा बुवाई/रोपाई के समय बेसल डोज के रूप में दें",
      "खाद को ऊपर छिड़कने के बजाय कतार में बीज के नीचे डालें"
    ],
    preventionManagementBn: [
      "ফসফরাস সারের পুরো অংশই চারা রোপণ বা বীজ বোনার সময় জমিতে দিন",
      "মাটির উপরে ছড়িয়ে না দিয়ে বীজ সারির নিচে প্রয়োগ করুন"
    ]
  },
  {
    id: "potassium",
    element: "Potassium",
    symbol: "K",
    category: "Macronutrient (Primary)",
    mobility: "Mobile (Symptoms on Old Leaves First)",
    deficiencyTitleEn: "Possible Potassium (K) Deficiency",
    deficiencyTitleHi: "संभावित पोटाश (K) की कमी",
    deficiencyTitleBn: "সম্ভাব্য পটাশিয়াম (K) ঘাটতি",
    diagnosticSymptoms: [
      "Marginal chlorosis turning into severe necrosis (scorching / tip burn) on older leaves",
      "Weak lodging-prone stems and increased susceptibility to fungal diseases and drought",
      "Uneven fruit ripening, poor shelf-life, and reduced sweetness/starch content"
    ],
    diagnosticSymptomsHi: [
      "पुरानी पत्तियों के किनारों का जलने जैसा (टिप बर्न) झुलसना",
      "तनों का कमजोर होना और फसल का गिरना (लॉजिंग) तथा रोगों का प्रकोप बढ़ना",
      "फलों का असमान पकना और चमक व वजन में कमी"
    ],
    diagnosticSymptomsBn: [
      "পুরনো পাতার কিনারায় পোড়া বা ঝলসে যাওয়ার মতো দাগ (Tip Burn)",
      "গাছের ডালপালা দুর্বল হয়ে হেলে পড়া এবং রোগ প্রতিরোধ ক্ষমতা হ্রাস পাওয়া",
      "ফলের অসম পরিপক্কতা ও গুণমান নষ্ট হওয়া"
    ],
    foliarAndOrganicCorrection: [
      "Foliar spray of 0:0:50 (Potassium Sulfate) or 13:0:45 (Potassium Nitrate) @ 5–8 g/L water",
      "Apply Muriate of Potash (MOP) or Sulfate of Potash (SOP) based on crop salt tolerance",
      "Top-dress with wood ash (rich in bio-available potassium) in vegetable patches"
    ],
    foliarAndOrganicCorrectionHi: [
      "0:0:50 (पोटैशियम सल्फेट) या 13:0:45 @ 5-8 ग्राम/लीटर का पर्णीय छिड़काव करें",
      "म्यूरेट ऑफ पोटाश (MOP) का प्रयोग करें",
      "लकड़ी की राख (पोटाश का प्राकृतिक स्रोत) का बुरकाव करें"
    ],
    foliarAndOrganicCorrectionBn: [
      "০:০:৫০ (পটাশিয়াম সালফেট) ৫-৮ গ্রাম/লিটার জলে গুলে পাতায় স্প্রে করুন",
      "মিউরেট অফ পটাশ (MOP) বা পটাশ সার প্রয়োগ করুন",
      "গাছের গোড়ায় কাঠের ছাই ব্যবহার করতে পারেন যা পটাশের ভালো উৎস"
    ],
    soilTestingAdvice: "Leaf margin scorch can also be caused by saline water or pesticide burn. Verify with soil electrical conductivity (EC) and potassium test.",
    soilTestingAdviceHi: "किनारों का झुलसना खारे पानी या दवा के जलने से भी हो सकता है। मिट्टी के EC व पोटाश की जांच कराएं।",
    soilTestingAdviceBn: "পাতার কিনারা পোড়া অতিরিক্ত লবণাক্ততা বা কীটনাশকের অতিমাত্রার ফলেও হতে পারে। মাটি পরীক্ষা করে নিশ্চিত হন।",
    preventionManagement: [
      "Split potassium application into 2 doses (Basal + Flowering stage) on sandy and coarse soils",
      "Maintain adequate soil moisture to facilitate potassium diffusion into roots"
    ],
    preventionManagementHi: [
      "बलुई मिट्टी में पोटाश को 2 भागों में दें (बुवाई पर + फूल आने पर)",
      "खेत में उचित नमी बनाए रखें ताकि पोटाश का अवशोषण हो सके"
    ],
    preventionManagementBn: [
      "বেলে মাটিতে পটাশ সার দুই কিস্তিতে (জমি তৈরি + ফুল আসার সময়) দিন",
      "মাটিতে পর্যাপ্ত আর্দ্রতা বজায় রাখুন যাতে শিকড় সহজে পটাশ গ্রহণ করতে পারে"
    ]
  },
  {
    id: "iron",
    element: "Iron",
    symbol: "Fe",
    category: "Micronutrient",
    mobility: "Immobile (Symptoms on Young Leaves First)",
    deficiencyTitleEn: "Possible Iron (Fe) Chlorosis",
    deficiencyTitleHi: "संभावित आयरन / लोहे (Fe) की कमी (क्लोरोसिस)",
    deficiencyTitleBn: "সম্ভাব্য আয়রন (Fe) ঘাটতি",
    diagnosticSymptoms: [
      "Sharp interveinal chlorosis on youngest top leaves (veins remain distinctly green while blade turns ivory-yellow)",
      "In severe cases, entire newly emerging leaves turn completely bleached white",
      "Common in calcareous soils (high calcium carbonate) and alkaline pH (>7.5)"
    ],
    diagnosticSymptomsHi: [
      "नई शीर्ष पत्तियों की नसों के बीच का हिस्सा पीला पड़ना (नसें हरी रहती हैं)",
      "अधिक कमी में नई पत्तियां पूरी तरह सफेद/दूधिया हो जाती हैं",
      "चूनेदार व क्षारीय (pH > 7.5) मिट्टी में अधिक देखा जाता है"
    ],
    diagnosticSymptomsBn: [
      "কচি পাতার শিরা সবুজ রেখে মধ্যবর্তী অংশ গাঢ় হলুদ হয়ে যাওয়া",
      "অতিরিক্ত ঘাটতিতে কচি পাতা প্রায় সাদা বা ফ্যাকাশে হয়ে যায়",
      "ক্ষারযুক্ত মাটিতে (pH > ৭.৫) আয়রন ঘাটতি বেশি দেখা যায়"
    ],
    foliarAndOrganicCorrection: [
      "Foliar spray of 0.5% Ferrous Sulfate (FeSO4 @ 5g/L) + 0.1% Citric Acid (1g/L) to prevent oxidation",
      "Apply chelated iron (Fe-EDTA 12% @ 1.5g/L or Fe-EDDHA @ 1g/L for high-pH soils)",
      "Apply sulfur amendments to lower excessively high soil pH"
    ],
    foliarAndOrganicCorrectionHi: [
      "फेरस सल्फेट (FeSO4) 5 ग्राम + 1 ग्राम साइट्रिक एसिड (नींबू सत्व) प्रति लीटर पानी में मिलाकर 2 बार छिड़कें",
      "चिलेटेड आयरन (Fe-EDTA) 1.5 ग्राम/लीटर का छिड़काव करें",
      "मिट्टी का pH सुधारने हेतु सल्फर या जिप्सम का प्रयोग करें"
    ],
    foliarAndOrganicCorrectionBn: [
      "ফেরাস সালফেট ৫ গ্রাম + ১ গ্রাম সাইট্রিক অ্যাসিড প্রতি লিটার জলে গুলে স্প্রে করুন",
      "চিলেটেড আয়রন (Fe-EDTA) ১.৫ গ্রাম/লিটার স্প্রে করুন",
      "মাটির ক্ষারত্ব কমাতে সালফার বা জিপসাম ব্যবহার করুন"
    ],
    soilTestingAdvice: "Iron is usually present in soil but immobilized by high pH and free lime. Test soil pH and free calcium carbonate levels.",
    soilTestingAdviceHi: "मिट्टी में लोहा मौजूद होने पर भी अधिक pH के कारण पौधे उसे ग्रहण नहीं कर पाते। अतः मिट्टी की pH जांच आवश्यक है।",
    soilTestingAdviceBn: "মাটিতে আয়রন থাকলেও উচ্চ পিএইচ এর কারণে গাছ তা শোষণ করতে পারে না। মাটির পিএইচ পরীক্ষা করুন।",
    preventionManagement: [
      "Incorporate well-fermented organic compost with sulfur to create localized acidic root micro-zones",
      "Avoid excess flooding or waterlogging which reduces root respiration"
    ],
    preventionManagementHi: [
      "गोबर की खाद में सल्फर मिलाकर डालें जिससे जड़ों के पास अनुकूल वातावरण बने",
      "खेत में अत्यधिक जलभराव से बचें"
    ],
    preventionManagementBn: [
      "জৈব সারের সাথে সালফার মিশিয়ে প্রয়োগ করুন",
      "জমিতে অতিরিক্ত জলাবদ্ধতা এড়িয়ে চলুন"
    ]
  },
  {
    id: "magnesium",
    element: "Magnesium",
    symbol: "Mg",
    category: "Macronutrient (Secondary)",
    mobility: "Mobile (Symptoms on Old Leaves First)",
    deficiencyTitleEn: "Possible Magnesium (Mg) Deficiency",
    deficiencyTitleHi: "संभावित मैग्नीशियम (Mg) की कमी",
    deficiencyTitleBn: "সম্ভাব্য ম্যাগনেসিয়াম (Mg) ঘাটতি",
    diagnosticSymptoms: [
      "Interveinal chlorosis on older mature lower leaves, often forming an inverted V green pattern",
      "Leaf margins turn yellow, orange, or purplish while main veins remain green",
      "Premature defoliation of lower canopy leaves"
    ],
    diagnosticSymptomsHi: [
      "पुरानी निचली पत्तियों की नसों के बीच पीलापन (नसें हरी रहती हैं)",
      "पत्तियों के किनारे पीले, नारंगी या बैंगनी हो जाना",
      "निचली पत्तियों का समय से पहले झड़ना"
    ],
    diagnosticSymptomsBn: [
      "পুরনো বয়স্ক পাতার শিরা সবুজ থেকে মধ্যবর্তী অংশ হলুদ হওয়া",
      "পাতার কিনারা কমলা বা রক্তাভ রূপ নেওয়া",
      "নিচের পাতা অকালে ঝরে যাওয়া"
    ],
    foliarAndOrganicCorrection: [
      "Foliar spray of Magnesium Sulfate (Epsom Salt - MgSO4) @ 10g/L water",
      "Soil application of Dolomite limestone (calcium-magnesium carbonate) on acidic soils",
      "Apply 10–15 kg/acre Magnesium Sulfate as basal fertilizer"
    ],
    foliarAndOrganicCorrectionHi: [
      "मैग्नीशियम सल्फेट (एप्सम सॉल्ट) 10 ग्राम/लीटर का पर्णीय छिड़काव करें",
      "अम्लीय मिट्टी में डोलोमाइट चूना डालें",
      "10-15 किग्रा/एकड़ मैग्नीशियम सल्फेट मिट्टी में दें"
    ],
    foliarAndOrganicCorrectionBn: [
      "ম্যাগনেসিয়াম সালফেট (ইপসম সল্ট) ১০ গ্রাম/লিটার জলে গুলে পাতায় স্প্রে করুন",
      "অম্লীয় মাটিতে ডলোমাইট চুন ব্যবহার করুন",
      "মাটিতে ১০-১৫ কেজি/একর ম্যাগনেসিয়াম সালফেট প্রয়োগ করুন"
    ],
    soilTestingAdvice: "Excessive potassium or calcium fertilization can inhibit magnesium uptake (antagonism). Perform soil cation balance testing.",
    soilTestingAdviceHi: "अत्यधिक पोटाश या कैल्शियम देने से मैग्नीशियम का अवशोषण रुक जाता है। मिट्टी में पोषक तत्वों के संतुलन की जांच कराएं।",
    soilTestingAdviceBn: "অতিরিক্ত পটাশ বা ক্যালসিয়াম ব্যবহারের কারণেও ম্যাগনেসিয়াম ঘাটতি দেখা দিতে পারে। মাটি টেস্ট করুন।",
    preventionManagement: [
      "Maintain a balanced Potassium-to-Magnesium ratio (K:Mg < 4:1) in soil fertilization",
      "Use dolomite when liming acidic agricultural soils"
    ],
    preventionManagementHi: [
      "खाद प्रबंधन में पोटाश व मैग्नीशियम का उचित अनुपात रखें",
      "अम्लीय मिट्टी में डोलोमाइट का उपयोग करें"
    ],
    preventionManagementBn: [
      "সারের ক্ষেত্রে পটাশ ও ম্যাগনেসিয়ামের সঠিক অনুপাত বজায় রাখুন",
      "মাটি শোধনে ডলোমাইট ব্যবহার করুন"
    ]
  },
  {
    id: "calcium",
    element: "Calcium",
    symbol: "Ca",
    category: "Macronutrient (Secondary)",
    mobility: "Immobile (Symptoms on Young Growing Tips / Fruits)",
    deficiencyTitleEn: "Possible Calcium (Ca) Deficiency",
    deficiencyTitleHi: "संभावित कैल्शियम (Ca) की कमी",
    deficiencyTitleBn: "সম্ভাব্য ক্যালসিয়াম (Ca) ঘাটতি",
    diagnosticSymptoms: [
      "Blossom End Rot (BER) in tomatoes, peppers, and watermelons (sunken black leathery spot at fruit bottom)",
      "Hooking, curling, and necrosis of young shoot tips and new leaves",
      "Poor cell wall integrity and fruit cracking / split skin"
    ],
    diagnosticSymptomsHi: [
      "टमाटर व मिर्च के फलों के निचले हिस्से का काला पड़कर सड़ना (ब्लॉसम एंड रॉट)",
      "नई कलियों और पत्तियों के सिरों का मुड़ना और सूखना",
      "फलों का फटना (क्रैकिंग) और भंडारण क्षमता कम होना"
    ],
    diagnosticSymptomsBn: [
      "টমেটো বা মরিচের ফলের নিচে কালো শুকনো পচা দাগ (Blossom End Rot)",
      "কচি ডাল ও পাতার ডগা কুঁকড়ে মরে যাওয়া",
      "ফলের ত্বক ফেটে যাওয়া (Fruit Cracking)"
    ],
    foliarAndOrganicCorrection: [
      "Foliar spray of 0.5% Calcium Nitrate (Ca(NO3)2 @ 5g/L) + 0.1% Boron (1g/L)",
      "Soil application of Agricultural Gypsum (Calcium Sulfate) @ 100 kg/acre without altering soil pH",
      "Maintain regular, uniform irrigation (calcium moves into plants solely via steady water transpiration stream)"
    ],
    foliarAndOrganicCorrectionHi: [
      "कैल्शियम नाइट्रेट 5 ग्राम + बोरॉन 1 ग्राम प्रति लीटर का फल बनते समय छिड़काव करें",
      "खेत में जिप्सम (100 किग्रा/एकड़) का प्रयोग करें",
      "नियमित व संतुलित सिंचाई करें क्योंकि कैल्शियम पानी के बहाव से ही पौधों में चढ़ता है"
    ],
    foliarAndOrganicCorrectionBn: [
      "ক্যালসিয়াম নাইট্রেট ৫ গ্রাম + বোরন ১ গ্রাম/লিটার জলে গুলে ফল ধরার সময় স্প্রে করুন",
      "জিপসাম সার ১০০ কেজি/একর জমিতে প্রয়োগ করুন",
      "নিয়মিত ও পরিমিত সেচ দিন যাতে গাছ সহজে ক্যালসিয়াম টেনে নিতে পারে"
    ],
    soilTestingAdvice: "Calcium deficiency is often induced by dry soil and irregular watering rather than lack of soil calcium. Check irrigation uniformity and soil Ca levels.",
    soilTestingAdviceHi: "कैल्शियम की कमी अक्सर अनियमित सिंचाई और सूखे के कारण होती है। मिट्टी व सिंचाई व्यवस्था की जांच करें।",
    soilTestingAdviceBn: "অনিয়মিত সেচ ও খরার কারণে ক্যালসিয়াম ঘাটতি বেশি হয়। সেচ ব্যবস্থা ঠিক রাখুন ও মাটি পরীক্ষা করুন।",
    preventionManagement: [
      "Avoid dry-wet moisture swings with drip irrigation and organic mulching",
      "Avoid heavy ammonium-nitrogen fertilization which competes directly with calcium uptake"
    ],
    preventionManagementHi: [
      "मल्चिंग व ड्रिप सिंचाई से खेत में नमी एक समान बनाए रखें",
      "अत्यधिक अमोनिकल खाद के प्रयोग से बचें"
    ],
    preventionManagementBn: [
      "মালচিং ও ড্রিপ সেচের মাধ্যমে মাটির আর্দ্রতা সমান রাখুন",
      "অতিরিক্ত অ্যামোনিয়াম সারের ব্যবহার এড়িয়ে চলুন"
    ]
  }
];

export function getNutrientProfiles(): NutrientProfile[] {
  return NUTRIENT_PROFILES;
}

export function findNutrientProfile(nameOrSymbol: string): NutrientProfile | null {
  const norm = (nameOrSymbol || "").toLowerCase().trim();
  return (
    NUTRIENT_PROFILES.find(
      (p) =>
        norm.includes(p.element.toLowerCase()) ||
        norm.includes(p.symbol.toLowerCase()) ||
        norm.includes(p.id)
    ) || NUTRIENT_PROFILES[0]
  );
}
