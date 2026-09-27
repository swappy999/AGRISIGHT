export type Language = "en" | "hi" | "bn";

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  speech: string;
  tts: string;
}

export const LANGUAGE_CONFIG: Record<Language, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    speech: "en-IN",
    tts: "en-IN",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    speech: "hi-IN",
    tts: "hi-IN",
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    speech: "bn-IN",
    tts: "bn-IN",
  },
};

export type TranslationKeys = {
  // Navigation
  home: string;
  crops: string;
  fields: string;
  scanLeaf: string;
  analysisHistory: string;
  analytics: string;
  alerts: string;
  profile: string;
  newAnalysis: string;
  searchPlaceholder: string;
  logout: string;
  loginWelcome: string;
  loginSubtext: string;
  continueWithGoogle: string;
  emailAddress: string;
  password: string;
  forgotPassword: string;
  signIn: string;
  signingIn: string;
  noAccount: string;
  createAccount: string;
  demoAccess: string;
  orSignInWith: string;
  signupWelcome: string;
  signupSubtext: string;
  confirmPassword: string;
  alreadyHaveAccount: string;
  // Username & Onboarding
  username: string;
  chooseUsername: string;
  usernameHint: string;
  usernameChecking: string;
  usernameAvailable: string;
  usernameTaken: string;
  usernameInvalid: string;
  usernameRequired: string;
  onboardingTitle: string;
  onboardingSubtext: string;
  onboardingContinue: string;
  onboardingSkip: string;
  // Profile Edit
  editProfile: string;
  fullName: string;
  saveProfile: string;
  profileUpdated: string;
  profileUpdateFailed: string;
  changePassword: string;
  verifiedAccount: string;
  unverifiedAccount: string;

  // Upload & Scan
  uploadTitle: string;
  analyzingTitle: string;
  uploadInstruction: string;
  analyzingInstruction: string;
  selectImage: string;
  dragAndDrop: string;
  errorNoFile: string;
  errorInvalidType: string;
  takePhoto: string;
  chooseFile: string;
  askQuestionPlaceholder: string;
  optionalContext: string;
  selectCropOptional: string;
  selectFieldOptional: string;
  noAssignedCrop: string;
  noAssignedField: string;
  startAnalysisButton: string;
  reTake: string;
  cancel: string;
  voiceInputTitle: string;
  listeningState: string;
  speakNowPrompt: string;
  stopListening: string;
  micPermissionDenied: string;
  speechNetworkError: string;
  listeningInLanguage: string;
  tapToSpeak: string;
  clearVoiceInput: string;
  cameraUnavailable: string;
  fileTooLarge: string;
  stageCompressing: string;
  stageUploading: string;
  stageAiAnalyzing: string;
  stageGeneratingInsights: string;
  openLiveCamera: string;
  switchCamera: string;
  snapPhoto: string;
  closeCamera: string;
  qualityWarningDark: string;
  qualityWarningBlur: string;
  proceedAnyway: string;
  retryAnalysis: string;

  // Dashboard & Decision Center
  latestAnalysis: string;
  viewFullReport: string;
  analyzedAgo: string;
  confidence: string;
  spreadRisk: string;
  realtimeAlerts: string;
  localWeather: string;
  noScansYet: string;
  startScanning: string;
  risk: string;
  humidityLabel: string;
  smartInsight: string;
  clickToUpload: string;
  cropOverview: string;
  activeIssues: string;
  priorityActions: string;
  riskIntelligence: string;
  overallHealth: string;
  manageCrops: string;
  noCropsYet: string;
  addCrop: string;
  cropsNeedAttention: string;

  // Bento / Stats
  totalScans: string;
  aiAccuracy: string;
  cropVarieties: string;
  activeThreats: string;

  // Analysis Detail
  capturedArea: string;
  scanDate: string;
  identifiedCondition: string;
  conditionSeverity: string;
  environmentalCause: string;
  recommendedTreatment: string;
  preventionRoadmap: string;
  whatWeFound: string;
  whyHappening: string;
  whatToDo: string;
  whatToAvoid: string;
  prevention: string;
  immediateActions: string;
  cautions: string;
  symptoms: string;
  causes: string;
  predictionOutlook: string;
  next3Days: string;
  next7Days: string;
  recoveryChance: string;
  listenExplanation: string;
  stopAudio: string;
  audioPlaybackError: string;
  speak: string;
  stopSpeaking: string;
  ttsVoiceUnavailable: string;
  ttsPlaying: string;
  detailedInsight: string;
  linkToCrop: string;
  linkToField: string;

  // Comparison
  scanComparison: string;
  whatChanged: string;
  previousScan: string;
  currentScan: string;
  severityChange: string;
  timeElapsed: string;
  improvingProgression: string;
  worseningProgression: string;
  stableProgression: string;
  healthyStableProgression: string;
  persistentCondition: string;
  compareButton: string;
  selectAnotherScan: string;
  smartFollowUp: string;
  daysAgo: string;

  // Fields
  geospatialFieldIntel: string;
  agriculturalFields: string;
  addFieldPlot: string;
  totalManagedArea: string;
  averageFieldHealth: string;
  activeHotspots: string;
  fieldHealthMap: string;
  quadrants: string;
  hotspotsLayer: string;
  healthLayer: string;
  survivalEstimate: string;
  targetedFieldActions: string;
  cropsInField: string;
  fieldScanHistory: string;
  noFieldsYet: string;
  soilType: string;
  irrigationSystem: string;
  plotLocation: string;
  areaAcres: string;
  editFieldProfile: string;
  deleteFieldConfirm: string;

  // Trends & Status
  improving: string;
  worsening: string;
  stable: string;
  healthy: string;
  low: string;
  medium: string;
  high: string;
  critical: string;

  // Profile
  profileSettings: string;
  accountStatus: string;
  notificationPreferences: string;
  signOut: string;
  manageProfileSettings: string;
  memberSince: string;
  recent: string;
  dataSync: string;
  active: string;
  subscription: string;
  freeTier: string;
  languageLabel: string;
  savedSuccess: string;
  criticalAlertsPref: string;
  criticalAlertsSub: string;
  weeklySummariesPref: string;
  weeklySummariesSub: string;
  appearance: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  themeSystemDesc: string;
  themeLightDesc: string;
  themeDarkDesc: string;
  needSupport: string;
  supportSub: string;
  contactSupport: string;

  // Alerts & History
  backToDashboard: string;
  notificationsTitle: string;
  notificationsSubtitle: string;
  summary: string;
  totalAlerts: string;
  unread: string;
  aboutAlerts: string;
  criticalAlertsDesc: string;
  warningAlertsDesc: string;
  optimalAlertsDesc: string;
  scanNewCrop: string;
  historySubtitle: string;
  searchHistoryPlaceholder: string;
  allScans: string;
  threatsTab: string;
  healthyTab: string;

  // Alerts & Realtime
  criticalAlert: string;
  cropAlert: string;
  systemNotification: string;
  newAlert: string;
  justNow: string;
  noUnreadNotifications: string;
  noAlertsYet: string;
  signInToSeeAlerts: string;
  showAll: string;
  showUnreadOnly: string;

  // Analytics Dashboard (§19 of a2.md)
  analyticsSubtitle: string;
  cleanHealthRate: string;
  pathogenDistribution: string;
  severityBreakdown: string;
  fieldPerformanceMatrix: string;
  notEnoughData: string;
  noYieldFabrication: string;
  activePlots: string;
  scannedCrops: string;

  // AI Assistant
  aiAssistant: string;
  askAgriSight: string;
  typeYourQuestion: string;
  suggestedQuestions: string;
  groundedAnswer: string;
  generalGuidance: string;
  thinking: string;
  askButton: string;
  aiAssistantDescription: string;
  openAssistant: string;
  closeAssistant: string;
  clearChat: string;
  groundedBadge: string;
  guidanceBadge: string;
  decisionRationale: string;
  evidence: string;
  voiceNotSupported: string;
  offlineWarning: string;
  pageContext: string;

  // Generic / States & Attributes
  loading: string;
  retry: string;
  errorOccurred: string;
  back: string;
  saveChanges: string;
  save: string;
  edit: string;
  delete: string;
  viewDetails: string;
  growthStage: string;
  cropName: string;
  variety: string;
  plantedOn: string;
  enterCropName: string;
  crop: string;
  cropIntelligence: string;
  fieldName: string;
  location: string;
  area: string;
  acres: string;
  irrigationType: string;
  notes: string;
  addField: string;
  activeRisks: string;
  noFieldsTitle: string;
  noFieldsDescription: string;
  moderate: string;
  activeIssuesCount: string;
  actionChecklistTitle: string;
  noHistory: string;

  // Master Intelligence & Officer
  officerDashboard: string;
  digitalTwin: string;
  farmTimeline: string;
  decisionCards: string;
  expertReview: string;
  simulateScenario: string;
  regionalOverview: string;
  projectedHealth: string;
  yieldImpact: string;
  waterStress: string;
  daysWithoutWater: string;
  tempChange: string;
  expectedRainfall: string;
  runSimulation: string;

  // Phase 1 & 2: Crisp Scan Navigation, IPM & AI Assistant
  btnCrop: string;
  btnDisease: string;
  btnPest: string;
  btnNutrition: string;
  btnWater: string;
  btnPrevention: string;
  btnIpm: string;
  btnCompare: string;
  cropProfile: string;
  detectedCrop: string;
  mainIssue: string;
  immediateActionTitle: string;
  backToSummary: string;
  waterStressRisk: string;
  todaysGuidance: string;
  bestWindow: string;
  whyHappeningGist: string;
  whatToDoGist: string;
  priorityAction: string;
  needsAttention: string;
  allGood: string;
  possibleIssue: string;
  tapToViewDetails: string;
  moreDetails: string;
  lessDetails: string;
  resourceTip: string;
  ipmTitle: string;
  whatShouldIDoToday: string;
  explainThisScan: string;
  btnWhy: string;
  btnWhatToDo: string;

  // Additional Common Keys
  cropCountLabel: string;
  cropCountUnit: string;
  precisionFarming: string;
  farmer: string;
  logAction: string;
  recordFarmingAction: string;
  noActionsRecorded: string;
  noActionsSubtext: string;
  actionChecklistSubtext: string;

  // Analysis & IPM Crisp Result Keys
  noActivePests: string;
  soilAndFertilizer: string;
  preventAndControl: string;
  comparePreviousScans: string;
  cropInsights: string;
  cropProfileTag: string;
  unhealthy: string;
  atRisk: string;
  fieldLocation: string;
  visualAiClassification: string;
  cropCarePractices: string;
  optimalSunlightTitle: string;
  optimalSunlightDesc: string;
  soilMoistureTitle: string;
  soilMoistureDesc: string;
  scoutingScheduleTitle: string;
  scoutingScheduleDesc: string;
  ipmActionChecklist: string;
  ipmStep1: string;
  ipmStep2: string;
  ipmStep3: string;
  ipmStep4: string;
  ipmStep5: string;
  ipmStep6: string;
  ipmResourceTipDesc: string;
  nutritionSoilHealth: string;
  possibleNutrientDeficiency: string;
  foliarImbalance: string;
  aiNutritionGuidance: string;
  nutritionStep1: string;
  nutritionStep2: string;
  nutritionStep3: string;
  soilTestRecommendation: string;
  soilTestBannerText: string;
  waterIrrigationTitle: string;
  postponeIrrigationRain: string;
  irrigationMayBeNeeded: string;
  aiIrrigationGuidance: string;
  weatherReasonRain: string;
  weatherReasonTemp: string;
  weatherReasonMorning: string;
  diseaseDiagnosisTitle: string;
  pestIntelligenceTitle: string;
  healthyLeafFoliage: string;
  unhealthyLeafFoliage: string;
  healthyCareStep1: string;
  healthyCareStep2: string;
  healthyCareStep3: string;
  unhealthyCareStep1: string;
  unhealthyCareStep2: string;
  unhealthyCareStep3: string;

  // Field-Centric MVP (§1-51 of master prompt)
  myFields: string;
  addFieldGuided: string;
  fieldSetupStep1: string;
  fieldSetupStep2: string;
  fieldSetupStep3: string;
  fieldReady: string;
  fieldNamePlaceholder: string;
  fieldAreaLabel: string;
  fieldLocationLabel: string;
  useMyLocation: string;
  selectOnMap: string;
  whatAreYouGrowing: string;
  cropVarietyOptional: string;
  whenDidYouPlant: string;
  skipForNow: string;
  connectFieldNode: string;
  fieldNodeDescription: string;
  attachToField: string;
  openField: string;
  fieldHealth: string;
  fieldHealthGood: string;
  fieldHealthAttention: string;
  fieldHealthCritical: string;
  fieldHealthNoData: string;
  waitingForFieldData: string;
  fieldConditions: string;
  soilMoisture: string;
  temperature: string;
  humidity: string;
  soilPh: string;
  waterFlow: string;
  notAvailable: string;
  scanLeafCta: string;
  checkCropHealth: string;
  agriSightInsight: string;
  fieldNodeConnected: string;
  fieldNodeOffline: string;
  fieldNodeNotAttached: string;
  fieldNodeLastUpdate: string;
  fieldNodeTroubleshoot: string;
  viewSensors: string;
  recentScans: string;
  fieldHistory: string;
  fieldAnalytics: string;
  recommendations: string;
  askAboutThisField: string;
  whichFieldIsThis: string;
  cropCheckResult: string;
  whyThisWasFlagged: string;
  viewRecommendation: string;
  compareWithPreviousScan: string;
  scanSavedToField: string;
  fieldNodeSectionTitle: string;
  sensorsDetected: string;
  noSensorData: string;
  yourFieldCanStillBeUsed: string;
  farmOverview: string;
  connectedFieldNodes: string;
  continueSetup: string;
  setupComplete: string;
  scanFromField: string;
  addCropToField: string;
  noCropLinked: string;
  fieldStage: string;
  noFieldNodeYet: string;
  connectYourFieldNode: string;
  manageMore: string;
};

export const translations: Record<Language, TranslationKeys> = {
  en: {
    home: "Home",
    crops: "My Crops",
    fields: "Fields",
    scanLeaf: "Scan Leaf",
    analysisHistory: "Analysis History",
    analytics: "Analytics",
    alerts: "Alerts",
    profile: "Profile",
    newAnalysis: "New Analysis",
    searchPlaceholder: "Search crops, pests, or records...",
    logout: "Logout",
    loginWelcome: "Welcome Back",
    loginSubtext: "AI-powered farming intelligence",
    continueWithGoogle: "Continue with Google",
    emailAddress: "Email Address",
    password: "Password",
    forgotPassword: "Forgot password?",
    signIn: "Sign In",
    signingIn: "Signing In...",
    noAccount: "Don't have an account?",
    createAccount: "Create Account",
    demoAccess: "Quick Demo Access",
    orSignInWith: "or sign in with email",
    signupWelcome: "Create Account",
    signupSubtext: "Join the AgriSight community today",
    confirmPassword: "Confirm Password",
    alreadyHaveAccount: "Already have an account?",

    uploadTitle: "Upload Leaf Image",
    analyzingTitle: "Local AI is processing",
    uploadInstruction: "📸 Take a clear photo of a single leaf",
    analyzingInstruction: "Checking your leaf and field conditions.",
    selectImage: "Select Image",
    dragAndDrop: "Or drag and drop here",
    errorNoFile: "Please select an image first.",
    errorInvalidType: "Please upload a clear leaf photo (JPG/PNG)",
    takePhoto: "Take Photo",
    chooseFile: "Choose from Files",
    askQuestionPlaceholder: "Ask a specific question about this leaf (optional)...",
    optionalContext: "Optional Farm Context",
    selectCropOptional: "Select Crop (Optional)",
    selectFieldOptional: "Select Field Plot (Optional)",
    noAssignedCrop: "No assigned crop",
    noAssignedField: "No assigned field",
    startAnalysisButton: "Start AI Analysis",
    reTake: "Retake Photo",
    cancel: "Cancel",
    voiceInputTitle: "Voice Input",
    listeningState: "Listening... speak your observations or question",
    speakNowPrompt: "Speak now in your language",
    stopListening: "Stop Recording",
    micPermissionDenied: "Microphone permission was denied. Please allow microphone access in your browser or device settings.",
    speechNetworkError: "Speech recognition network error. Please check your internet connection and try again.",
    listeningInLanguage: "Listening in {lang}...",
    tapToSpeak: "Tap to Speak",
    clearVoiceInput: "Clear Voice Input",
    cameraUnavailable: "Camera access is unavailable. Please use file upload.",
    fileTooLarge: "Image exceeds 25MB maximum size.",
    stageCompressing: "Optimizing leaf imagery...",
    stageUploading: "Uploading to agronomic database...",
    stageAiAnalyzing: "Analyzing crop health and symptoms...",
    stageGeneratingInsights: "Formulating treatment & prevention roadmap...",
    openLiveCamera: "Live Viewfinder",
    switchCamera: "Switch Camera",
    snapPhoto: "Capture",
    closeCamera: "Close Camera",
    qualityWarningDark: "Image appears dark or shadowed. Better lighting improves accuracy.",
    qualityWarningBlur: "Leaf does not appear in crisp focus. Center a single leaf.",
    proceedAnyway: "Analyze Anyway",
    retryAnalysis: "Retry Analysis",

    latestAnalysis: "Latest Analysis",
    viewFullReport: "View Full Report",
    analyzedAgo: "Analyzed recently",
    confidence: "Accuracy",
    spreadRisk: "Spread Risk",
    realtimeAlerts: "Real-time Alerts",
    localWeather: "Local Weather",
    noScansYet: "No scans found yet",
    startScanning: "Upload a photo of your crop to receive instant AI diagnostics.",
    risk: "Risk",
    humidityLabel: "Humidity",
    smartInsight: "Smart Insight",
    clickToUpload: "or click icon",
    cropOverview: "Crop Health Overview",
    activeIssues: "Active Crop Risks",
    priorityActions: "Priority Actions",
    riskIntelligence: "Agricultural Risk Radar",
    overallHealth: "Overall Health",
    manageCrops: "Manage Crops",
    noCropsYet: "No crop profiles configured yet.",
    addCrop: "Add Crop",
    cropsNeedAttention: "Crops requiring agronomic attention",

    totalScans: "Total Scans",
    aiAccuracy: "AI Accuracy",
    cropVarieties: "Active Crops",
    activeThreats: "Active Threats",

    capturedArea: "Captured Leaf Area",
    scanDate: "Scan Date",
    identifiedCondition: "Identified Condition",
    conditionSeverity: "Condition Severity",
    environmentalCause: "Environmental & Biological Causes",
    recommendedTreatment: "Actionable Treatment Protocol",
    preventionRoadmap: "Prevention Roadmap",
    whatWeFound: "What We Found",
    whyHappening: "Why This Is Happening",
    whatToDo: "What To Do",
    whatToAvoid: "What To Avoid",
    prevention: "Prevention Steps",
    immediateActions: "Immediate Actions",
    cautions: "Cautions",
    symptoms: "Observed Symptoms",
    causes: "Possible Causes",
    predictionOutlook: "Predictive Outlook",
    next3Days: "Next 3 Days",
    next7Days: "Next 7 Days",
    recoveryChance: "Recovery Chance",
    listenExplanation: "Listen in your language",
    stopAudio: "Stop Voice Audio",
    audioPlaybackError: "Voice synthesis error.",
    speak: "Speak",
    stopSpeaking: "Stop speaking",
    ttsVoiceUnavailable: "Voice playback is unavailable for this language in your browser. The text response remains fully readable.",
    ttsPlaying: "Speaking response...",
    detailedInsight: "Detailed Agronomic Insight",
    linkToCrop: "Assign to Crop",
    linkToField: "Assign to Field",

    scanComparison: "Scan Comparison",
    whatChanged: "Diagnostic Progression",
    previousScan: "Baseline Scan",
    currentScan: "Current Scan",
    severityChange: "Severity Shift",
    timeElapsed: "Time Elapsed",
    improvingProgression: "Condition is improving with effective recovery indicators.",
    worseningProgression: "Symptom spread or severity has increased since baseline.",
    stableProgression: "Condition remains stable without active deterioration.",
    healthyStableProgression: "Plant health remains optimally stable.",
    persistentCondition: "Condition persists at consistent levels.",
    compareButton: "Compare Progression",
    selectAnotherScan: "Select scan to compare",
    smartFollowUp: "Recommended Follow-up",
    daysAgo: "days ago",

    geospatialFieldIntel: "Geospatial Field Intelligence",
    agriculturalFields: "Registered Agricultural Plots",
    addFieldPlot: "Add Field Plot",
    totalManagedArea: "Total Cultivated Area",
    averageFieldHealth: "Mean Plot Health",
    activeHotspots: "Pathogen Hotspots",
    fieldHealthMap: "Spatial Field Health Distribution",
    quadrants: "Quadrants",
    hotspotsLayer: "Hotspots",
    healthLayer: "Health Map",
    survivalEstimate: "Survival Outlook",
    targetedFieldActions: "Targeted Plot Interventions",
    cropsInField: "Planted Crops",
    fieldScanHistory: "Plot Scan Datalogs",
    noFieldsYet: "No registered plots found.",
    soilType: "Soil Composition",
    irrigationSystem: "Irrigation Setup",
    plotLocation: "Plot Coordinates",
    areaAcres: "Area (Acres)",
    editFieldProfile: "Edit Plot Profile",
    deleteFieldConfirm: "Are you sure you want to delete this field plot?",

    improving: "Improving",
    worsening: "Worsening",
    stable: "Stable",
    healthy: "Healthy",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",

    profileSettings: "Profile Settings",
    accountStatus: "Account Status",
    notificationPreferences: "Notification Preferences",
    signOut: "Sign Out",
    manageProfileSettings: "Manage your agricultural profile and settings.",
    memberSince: "Member since {date}",
    recent: "Recent",
    dataSync: "Data Sync",
    active: "Active",
    subscription: "Subscription",
    freeTier: "Free Tier",
    languageLabel: "Language",
    savedSuccess: "Saved ✓",
    criticalAlertsPref: "Critical Alerts",
    criticalAlertsSub: "Urgent disease detections",
    weeklySummariesPref: "Weekly Summaries",
    weeklySummariesSub: "Crop health digest",
    appearance: "Appearance",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystemDesc: "Follows your device or browser display settings automatically",
    themeLightDesc: "Natural, warm botanical day mode",
    themeDarkDesc: "Deep botanical dark mode designed for clear night visibility",
    needSupport: "Need support?",
    supportSub: "Contact our agriculture specialists for personalized crop advice.",
    contactSupport: "Contact Support",

    // Alerts & History
    backToDashboard: "Back to Dashboard",
    notificationsTitle: "Notifications",
    notificationsSubtitle: "Real-time crop alerts and system notifications.",
    summary: "Summary",
    totalAlerts: "Total alerts",
    unread: "Unread",
    aboutAlerts: "About Alerts",
    criticalAlertsDesc: "Immediate action required. Detected high-severity disease.",
    warningAlertsDesc: "Moderate risk detected. Monitor closely.",
    optimalAlertsDesc: "Crop conditions are healthy.",
    scanNewCrop: "Scan New Crop",
    historySubtitle: "Browse and review past crop health records and diagnosis insights.",
    searchHistoryPlaceholder: "Search by crop or disease...",
    allScans: "All Scans",
    threatsTab: "Threats",
    healthyTab: "Healthy / Low",

    // Alerts & Realtime
    criticalAlert: "Critical Alert",
    cropAlert: "Crop Alert",
    systemNotification: "System Notification",
    newAlert: "New Alert",
    justNow: "Just now",
    noUnreadNotifications: "No unread notifications",
    noAlertsYet: "No alerts yet",
    signInToSeeAlerts: "Sign in to see alerts",
    showAll: "Show all",
    showUnreadOnly: "Show unread only",

    // Analytics Dashboard (§19 of a2.md)
    analyticsSubtitle: "Comprehensive health trends, pathogen distribution, and field surveillance",
    cleanHealthRate: "Clean Health Rate",
    pathogenDistribution: "Pathogen & Condition Distribution",
    severityBreakdown: "Threat Severity Breakdown",
    fieldPerformanceMatrix: "Field Performance Matrix",
    notEnoughData: "Not enough scan data yet to generate trends. Complete your first field scans to unlock insights.",
    noYieldFabrication: "Actual empirical field scans only · Zero fabricated yield forecasts",
    activePlots: "Monitored Plots",
    scannedCrops: "Scanned Crops",

    aiAssistant: "AgriSight Assistant",
    askAgriSight: "Ask AgriSight",
    typeYourQuestion: "Ask about pest control, fertilizers, or diseases...",
    suggestedQuestions: "Suggested Inquiries",
    groundedAnswer: "Grounded Agronomic Analysis",
    generalGuidance: "Agricultural Knowledge",
    thinking: "Analyzing context...",
    askButton: "Send Inquiry",
    aiAssistantDescription: "Your multilingual agronomic reasoning assistant.",
    openAssistant: "Open AgriSight Assistant",
    closeAssistant: "Close Assistant",
    clearChat: "Clear Session",
    groundedBadge: "Farm-Grounded",
    guidanceBadge: "General Guidance",
    decisionRationale: "Decision Rationale",
    evidence: "Evidence",
    voiceNotSupported: "Voice input is not supported in this browser. You can type your question instead.",
    offlineWarning: "You are currently offline. AI answers require an active internet connection.",
    pageContext: "Page Context",

    loading: "Loading...",
    retry: "Retry",
    errorOccurred: "An error occurred",
    back: "Back",
    saveChanges: "Save Changes",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    viewDetails: "View Details",
    growthStage: "Growth Stage",
    cropName: "Crop Name",
    variety: "Variety",
    plantedOn: "Planted On",
    enterCropName: "Enter crop name...",
    crop: "Crop",
    cropIntelligence: "Manage your crop profiles and track their health.",
    fieldName: "Field / Plot Name",
    location: "Location / Village",
    area: "Area",
    acres: "Acres",
    irrigationType: "Irrigation System",
    notes: "Agronomic Notes",
    addField: "Add Field Plot",
    activeRisks: "Active Risks",
    noFieldsTitle: "No Agricultural Fields Registered Yet",
    noFieldsDescription: "Register your farm plots to organize crops, track microclimate moisture, and map leaf pathogen hotspots spatially.",
    moderate: "Moderate",
    activeIssuesCount: "Plot Clusters",
    actionChecklistTitle: "Action Checklist",
    noHistory: "No scan history recorded yet.",

    // Master Intelligence & Officer
    officerDashboard: "Officer View",
    digitalTwin: "Digital Twin",
    farmTimeline: "Farm Timeline",
    decisionCards: "Farmer Decisions",
    expertReview: "Expert Review",
    simulateScenario: "Simulate Field Scenarios",
    regionalOverview: "Regional Intelligence",
    projectedHealth: "Projected Health",
    yieldImpact: "Yield Impact",
    waterStress: "Water Stress",
    daysWithoutWater: "Days Without Irrigation",
    tempChange: "Temperature Change",
    expectedRainfall: "Expected Rainfall",
    runSimulation: "Run Simulation",

    // Phase 1: Crisp Gist-First Scan Navigation & Details
    btnCrop: "Crop Profile",
    btnDisease: "Disease",
    btnPest: "Pest",
    btnNutrition: "Nutrition",
    btnWater: "Water",
    btnPrevention: "Prevention",
    btnIpm: "IPM",
    btnCompare: "Compare",
    cropProfile: "Crop Profile",
    detectedCrop: "Detected Crop",
    mainIssue: "Main Issue",
    immediateActionTitle: "Immediate Action",
    backToSummary: "Back",
    waterStressRisk: "Water-stress risk",
    todaysGuidance: "Today's guidance",
    bestWindow: "Best window",
    whyHappeningGist: "Why",
    whatToDoGist: "What to do",
    priorityAction: "Priority",
    needsAttention: "Needs attention",
    allGood: "Looking good",
    possibleIssue: "Possible issue",
    tapToViewDetails: "Tap to view details",
    moreDetails: "More Details",
    lessDetails: "Less Details",
    resourceTip: "Resource Tip",
    ipmTitle: "Integrated Pest Management",
    whatShouldIDoToday: "What should I do today?",
    explainThisScan: "Explain this scan",
    btnWhy: "Why?",
    btnWhatToDo: "What should I do?",

    cropCountLabel: "Active Crops",
    cropCountUnit: "Crops",
    precisionFarming: "Precision Farming",
    farmer: "Farmer",
    logAction: "Log Action",
    recordFarmingAction: "Record Farming Action",
    noActionsRecorded: "No farming actions recorded yet",
    noActionsSubtext: "Log treatments (spraying, irrigation changes, pruning) to measure and document recovery outcomes.",
    actionChecklistSubtext: "Track interventions to verify if treatments stop disease spread.",

    noActivePests: "No Active Pests",
    soilAndFertilizer: "Soil & Fertilizer",
    preventAndControl: "Prevent & Control",
    comparePreviousScans: "Compare previous scans",
    cropInsights: "Crop Insights",
    cropProfileTag: "Profile",
    unhealthy: "Unhealthy",
    atRisk: "At Risk",
    fieldLocation: "Field Location",
    visualAiClassification: "Visual AI Classification",
    cropCarePractices: "Crop Care & Agronomic Practices",
    optimalSunlightTitle: "Optimal Sunlight",
    optimalSunlightDesc: "Provide full sunlight (6-8 hours daily) for active photosynthesis and robust foliage development.",
    soilMoistureTitle: "Soil & Moisture",
    soilMoistureDesc: "Maintain well-drained, aerated soil; avoid standing water around root zones to prevent damping-off.",
    scoutingScheduleTitle: "Scouting Schedule",
    scoutingScheduleDesc: "Inspect lower canopy and undersides of leaves twice weekly for early signs of lesions or pest nymphs.",
    ipmActionChecklist: "IPM Action Checklist",
    ipmStep1: "Inspect surrounding foliage and adjacent plants in this quadrant",
    ipmStep2: "Sanitize and remove severely affected plant material from the field",
    ipmStep3: "Improve canopy airflow and spacing between crop rows",
    ipmStep4: "Prefer non-chemical biological & cultural controls where practical",
    ipmStep5: "Use approved targeted controls only if economic injury threshold is reached",
    ipmStep6: "Re-scan in 3–5 days to verify symptom containment",
    ipmResourceTipDesc: "Avoid uniform chemical spraying over the entire plot for localized symptoms. Targeted spot management protects beneficial insects and eliminates unnecessary chemical expenditure.",
    nutritionSoilHealth: "Nutrition & Soil Health",
    possibleNutrientDeficiency: "Possible Nutrient Deficiency",
    foliarImbalance: "Visual Chlorosis / Foliar Imbalance",
    aiNutritionGuidance: "AI Nutrition & Fertilizer Guidance",
    nutritionStep1: "Check soil moisture condition and root vigor",
    nutritionStep2: "Confirm with soil testing before high-dose fertilization",
    nutritionStep3: "Apply recommended balanced organic compost or mild foliar spray",
    soilTestRecommendation: "Soil Testing Recommendation",
    soilTestBannerText: "Visual leaf yellowing can overlap with water-stress or root aeration issues. Confirm with a lab soil test before heavy fertilizer application.",
    waterIrrigationTitle: "Water & Irrigation",
    postponeIrrigationRain: "Postpone irrigation — rain expected.",
    irrigationMayBeNeeded: "Irrigation may be needed.",
    aiIrrigationGuidance: "AI Irrigation Guidance",
    weatherReasonRain: "Low rainfall probability in local forecast",
    weatherReasonTemp: "Ambient daytime temperature ~28°C–32°C",
    weatherReasonMorning: "Morning irrigation prevents leaf wetness pathogen incubation",
    diseaseDiagnosisTitle: "Disease Diagnosis",
    pestIntelligenceTitle: "Pest Intelligence",
    healthyLeafFoliage: "No visible disease lesions or discoloration observed. Foliage is intact and healthy.",
    unhealthyLeafFoliage: "Visual lesions and leaf discoloration observed on foliage.",
    healthyCareStep1: "Continue regular scouting and monitor weekly for early disease onset",
    healthyCareStep2: "Maintain balanced fertilization and irrigation to preserve crop vigor",
    healthyCareStep3: "Sanitize field equipment and maintain clean perimeter borders",
    unhealthyCareStep1: "Inspect nearby plants for early spread",
    unhealthyCareStep2: "Remove severely affected leaves to reduce inoculum",
    unhealthyCareStep3: "Follow appropriate IPM and protective spray guidance",
    // Username & Onboarding
    username: "Username",
    chooseUsername: "Choose your username",
    usernameHint: "3–20 characters, letters, numbers and underscores only",
    usernameChecking: "Checking availability...",
    usernameAvailable: "Username is available!",
    usernameTaken: "This username is already taken.",
    usernameInvalid: "Only letters, numbers, and underscores (3–20 characters).",
    usernameRequired: "Please enter a username to continue.",
    onboardingTitle: "Almost there!",
    onboardingSubtext: "Create a unique username for your AgriSight profile.",
    onboardingContinue: "Save & Continue",
    onboardingSkip: "Skip for now",
    // Profile Edit
    editProfile: "Edit Profile",
    fullName: "Full Name",
    saveProfile: "Save Profile",
    profileUpdated: "Profile updated successfully!",
    profileUpdateFailed: "Failed to update profile. Please try again.",
    changePassword: "Change Password",
    verifiedAccount: "Verified Account",
    unverifiedAccount: "Unverified — check your email",

    // Field-Centric MVP
    myFields: "My Fields",
    addFieldGuided: "Add Field",
    fieldSetupStep1: "Create Your Field",
    fieldSetupStep2: "What Are You Growing?",
    fieldSetupStep3: "Connect Your Field Node",
    fieldReady: "Your Field Is Ready",
    fieldNamePlaceholder: "e.g. North Field",
    fieldAreaLabel: "How large is it?",
    fieldLocationLabel: "Where is it?",
    useMyLocation: "Use My Location",
    selectOnMap: "Select on Map",
    whatAreYouGrowing: "What are you growing here?",
    cropVarietyOptional: "Crop variety (optional)",
    whenDidYouPlant: "When did you plant it?",
    skipForNow: "Skip for now",
    connectFieldNode: "Connect Your Field Node",
    fieldNodeDescription: "Your Field Node can monitor soil and environmental conditions.",
    attachToField: "Attach to Field",
    openField: "Open Field",
    fieldHealth: "Field Health",
    fieldHealthGood: "Good",
    fieldHealthAttention: "Attention",
    fieldHealthCritical: "Critical",
    fieldHealthNoData: "No Data",
    waitingForFieldData: "Waiting for enough field data",
    fieldConditions: "Field Conditions",
    soilMoisture: "Soil Moisture",
    temperature: "Temperature",
    humidity: "Humidity",
    soilPh: "Soil pH",
    waterFlow: "Water Flow",
    notAvailable: "Not available",
    scanLeafCta: "Scan Leaf",
    checkCropHealth: "Check your crop health",
    agriSightInsight: "AgriSight Insight",
    fieldNodeConnected: "Connected",
    fieldNodeOffline: "Offline",
    fieldNodeNotAttached: "No Field Node attached",
    fieldNodeLastUpdate: "Last update",
    fieldNodeTroubleshoot: "Troubleshoot",
    viewSensors: "View Sensors",
    recentScans: "Recent Scans",
    fieldHistory: "Field History",
    fieldAnalytics: "Field Analytics",
    recommendations: "Recommendations",
    askAboutThisField: "Ask AgriSight about this field",
    whichFieldIsThis: "Which field is this from?",
    cropCheckResult: "Crop Check",
    whyThisWasFlagged: "Why This Was Flagged",
    viewRecommendation: "View Recommendation",
    compareWithPreviousScan: "Compare With Previous Scan",
    scanSavedToField: "Scan saved to field",
    fieldNodeSectionTitle: "Field Node",
    sensorsDetected: "Sensors detected",
    noSensorData: "No sensor data available",
    yourFieldCanStillBeUsed: "Your field can still be used. Some live sensor readings are unavailable.",
    farmOverview: "Farm Overview",
    connectedFieldNodes: "Connected Field Nodes",
    continueSetup: "Continue",
    setupComplete: "Setup Complete",
    scanFromField: "Scan Leaf",
    addCropToField: "Add Crop",
    noCropLinked: "No crop linked yet",
    fieldStage: "Stage",
    noFieldNodeYet: "No Field Node connected",
    connectYourFieldNode: "Connect your Field Node to monitor soil and weather.",
    manageMore: "More Details",
  },
  hi: {
    home: "होम",
    crops: "मेरी फसलें",
    fields: "खेत / भूखंड",
    scanLeaf: "पत्ती स्कैन करें",
    analysisHistory: "विश्लेषण इतिहास",
    analytics: "विश्लेषण",
    alerts: "अलर्ट",
    profile: "प्रोफ़ाइल",
    newAnalysis: "नया विश्लेषण",
    searchPlaceholder: "फसल, कीट या रिकॉर्ड खोजें...",
    logout: "लॉग आउट",
    loginWelcome: "वापसी पर आपका स्वागत है",
    loginSubtext: "AI-संचालित कृषि बुद्धिमत्ता",
    continueWithGoogle: "Google से जारी रखें",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    signIn: "साइन इन",
    signingIn: "साइन इन हो रहा है...",
    noAccount: "खाता नहीं है?",
    createAccount: "खाता बनाएं",
    demoAccess: "डेमो एक्सेस",
    orSignInWith: "या ईमेल से साइन इन करें",
    signupWelcome: "खाता बनाएं",
    signupSubtext: "आज ही एग्रीसाइट समुदाय में शामिल हों",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    alreadyHaveAccount: "क्या पहले से एक खाता है?",

    uploadTitle: "पत्ती की तस्वीर अपलोड करें",
    analyzingTitle: "पत्ती की जाँच हो रही है",
    uploadInstruction: "📸 एक पत्ते की स्पष्ट तस्वीर लें",
    analyzingInstruction: "आपकी पत्ती और खेत की स्थिति जाँची जा रही है।",
    selectImage: "तस्वीर चुनें",
    dragAndDrop: "या यहाँ खींचें और छोड़ें",
    errorNoFile: "कृपया पहले एक तस्वीर चुनें।",
    errorInvalidType: "कृपया पत्ते की एक स्पष्ट तस्वीर अपलोड करें (JPG/PNG)",
    takePhoto: "फोटो खींचें",
    chooseFile: "गैलरी से चुनें",
    askQuestionPlaceholder: "इस पत्ती के बारे में कोई विशिष्ट प्रश्न पूछें (वैकल्पिक)...",
    optionalContext: "वैकल्पिक खेत संदर्भ",
    selectCropOptional: "फसल चुनें (वैकल्पिक)",
    selectFieldOptional: "खेत भूखंड चुनें (वैकल्पिक)",
    noAssignedCrop: "कोई फसल चयनित नहीं",
    noAssignedField: "कोई खेत चयनित नहीं",
    startAnalysisButton: "AI विश्लेषण शुरू करें",
    reTake: "पुनः फोटो लें",
    cancel: "रद्द करें",
    voiceInputTitle: "आवाज से प्रश्न पूछें",
    listeningState: "सुन रहे हैं...",
    speakNowPrompt: "अब बोलें (हिंदी/বাংলা/English)",
    stopListening: "रोकें",
    micPermissionDenied: "माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अपनी ब्राउज़र या डिवाइस सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।",
    speechNetworkError: "वाक् पहचान नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।",
    listeningInLanguage: "{lang} में सुन रहे हैं...",
    tapToSpeak: "बोलने के लिए टैप करें",
    clearVoiceInput: "आवाज इनपुट हटाएं",
    cameraUnavailable: "कैमरा उपलब्ध नहीं है। कृपया गैलरी से फोटो चुनें।",
    fileTooLarge: "फाइल का आकार 25MB से कम होना चाहिए।",
    stageCompressing: "फोटो तैयार की जा रही है...",
    stageUploading: "सुरक्षित अपलोड हो रहा है...",
    stageAiAnalyzing: "AI विश्लेषण जारी है...",
    stageGeneratingInsights: "सलाह तैयार हो रही है...",
    openLiveCamera: "कैमरा खोलें",
    switchCamera: "कैमरा बदलें",
    snapPhoto: "फोटो खींचें",
    closeCamera: "कैमरा बंद करें",
    qualityWarningDark: "फोटो में रोशनी कम है। कृपया पर्याप्त उजाले में फोटो लें।",
    qualityWarningBlur: "फोटो धुंधली प्रतीत हो रही है। स्पष्ट फोटो लेने का प्रयास करें।",
    proceedAnyway: "फिर भी विश्लेषण करें",
    retryAnalysis: "पुनः प्रयास करें",

    latestAnalysis: "नवीनतम विश्लेषण",
    viewFullReport: "पूरी रिपोर्ट देखें",
    analyzedAgo: "पहले विश्लेषित",
    confidence: "सटीकता",
    spreadRisk: "प्रसार जोखिम",
    realtimeAlerts: "रीयल-टाइम अलर्ट",
    localWeather: "स्थानीय मौसम",
    noScansYet: "अभी तक कोई स्कैन नहीं हुआ है",
    startScanning: "पहला पत्ता स्कैन करें",
    risk: "जोखिम",
    humidityLabel: "आर्द्रता",
    smartInsight: "कृषि अंतर्दृष्टि",
    clickToUpload: "अपलोड करने के लिए क्लिक करें",
    cropOverview: "फसल स्वास्थ्य सारांश",
    activeIssues: "सक्रिय समस्याएं",
    priorityActions: "प्राथमिक कार्य",
    riskIntelligence: "जोखिम पूर्वानुमान",
    overallHealth: "औसत स्वास्थ्य",
    manageCrops: "फसलें प्रबंधित करें",
    noCropsYet: "अभी तक कोई फसल नहीं जोड़ी गई",
    addCrop: "नई फसल जोड़ें",
    cropsNeedAttention: "जिन फसलों पर ध्यान देने की आवश्यकता है",

    totalScans: "कुल स्कैन",
    aiAccuracy: "AI सटीकता",
    cropVarieties: "फसल किस्में",
    activeThreats: "सक्रिय खतरे",

    capturedArea: "विश्लेषित क्षेत्र",
    scanDate: "स्कैन तिथि",
    identifiedCondition: "पहचानी गई स्थिति",
    conditionSeverity: "गंभीरता",
    environmentalCause: "पर्यावरणीय कारण",
    recommendedTreatment: "अनुशंसित उपचार",
    preventionRoadmap: "रोकथाम कार्ययोजना",
    whatWeFound: "निरीक्षण परिणाम",
    whyHappening: "कारण क्या हो सकता है",
    whatToDo: "किसान को क्या करना चाहिए",
    whatToAvoid: "सावधानियां",
    prevention: "दीर्घकालिक रोकथाम",
    immediateActions: "त्वरित उपाय",
    cautions: "चेतावनी",
    symptoms: "लक्षण",
    causes: "संभावित कारण",
    predictionOutlook: "AI पूर्वानुमान",
    next3Days: "अगले 3 दिन",
    next7Days: "अगले 7 दिन",
    recoveryChance: "सुधार की संभावना",
    listenExplanation: "सलाह सुनें",
    stopAudio: "रोकें",
    audioPlaybackError: "ऑडियो उपलब्ध नहीं है",
    speak: "बोलें",
    stopSpeaking: "बोलना बंद करें",
    ttsVoiceUnavailable: "आपके ब्राउज़र में इस भाषा के लिए वॉइस उपलब्ध नहीं है। उत्तर पढ़ने के लिए उपलब्ध है।",
    ttsPlaying: "ऑडियो बज रहा है...",
    detailedInsight: "विस्तृत विवरण",
    linkToCrop: "फसल से जोड़ें",
    linkToField: "खेत से जोड़ें",

    scanComparison: "स्कैन तुलना",
    whatChanged: "क्या बदलाव आया",
    previousScan: "पिछला स्कैन",
    currentScan: "वर्तमान स्कैन",
    severityChange: "गंभीरता में बदलाव",
    timeElapsed: "बीता हुआ समय",
    improvingProgression: "सुधार हो रहा है",
    worseningProgression: "स्थिति गंभीर हो रही है",
    stableProgression: "स्थिति स्थिर है",
    healthyStableProgression: "पौधा स्वस्थ बना हुआ है",
    persistentCondition: "लक्षण बने हुए हैं",
    compareButton: "तुलना करें",
    selectAnotherScan: "तुलना के लिए दूसरा स्कैन चुनें",
    smartFollowUp: "फॉलो-अप समय",
    daysAgo: "दिन पहले",

    geospatialFieldIntel: "भू-स्थानिक खेत बुद्धिमत्ता",
    agriculturalFields: "कृषि खेत एवं भूखंड",
    addFieldPlot: "खेत भूखंड जोड़ें",
    totalManagedArea: "कुल प्रबंधित क्षेत्र",
    averageFieldHealth: "औसत खेत स्वास्थ्य",
    activeHotspots: "सक्रिय रोग हॉटस्पॉट",
    fieldHealthMap: "खेत स्वास्थ्य मानचित्र",
    quadrants: "चतुर्भुज क्षेत्र",
    hotspotsLayer: "रोग हॉटस्पॉट",
    healthLayer: "स्वास्थ्य सूचकांक",
    survivalEstimate: "अनुमानित पौधा अस्तित्व",
    targetedFieldActions: "लक्षित खेत कार्रवाई चेकलिस्ट",
    cropsInField: "इस खेत में बोई गई फसलें",
    fieldScanHistory: "खेत स्कैन इतिहास",
    noFieldsYet: "अभी तक कोई खेत भूखंड पंजीकृत नहीं है",
    soilType: "मिट्टी का प्रकार",
    irrigationSystem: "सिंचाई प्रणाली",
    plotLocation: "भूखंड स्थान",
    areaAcres: "क्षेत्रफल (एकड़)",
    editFieldProfile: "खेत प्रोफ़ाइल संपादित करें",
    deleteFieldConfirm: "क्या आप वाकई इस खेत को हटाना चाहते हैं? जुड़े हुए रिकॉर्ड सुरक्षित रहेंगे।",

    improving: "सुधार हो रहा है",
    worsening: "बिगड़ रहा है",
    stable: "स्थिर",
    healthy: "स्वस्थ",
    low: "कम",
    medium: "मध्यम",
    high: "उच्च",
    critical: "गंभीर",

    profileSettings: "प्रोफ़ाइल सेटिंग्स",
    accountStatus: "खाता स्थिति",
    notificationPreferences: "अधिसूचना प्राथमिकताएं",
    signOut: "साइन आउट",
    manageProfileSettings: "अपनी कृषि प्रोफ़ाइल और सेटिंग्स प्रबंधित करें।",
    memberSince: "{date} से सदस्य",
    recent: "हाल ही में",
    dataSync: "डेटा सिंक",
    active: "सक्रिय",
    subscription: "सदस्यता",
    freeTier: "निःशुल्क स्तर",
    languageLabel: "भाषा",
    savedSuccess: "सहेजा गया ✓",
    criticalAlertsPref: "गंभीर चेतावनियाँ",
    criticalAlertsSub: "अति आवश्यक रोग पहचान",
    weeklySummariesPref: "साप्ताहिक सारांश",
    weeklySummariesSub: "फसल स्वास्थ्य डाइजेस्ट",
    appearance: "रूप-रंग (Appearance)",
    themeSystem: "सिस्टम (System)",
    themeLight: "लाइट (Light)",
    themeDark: "डार्क (Dark)",
    themeSystemDesc: "स्वचालित रूप से आपके डिवाइस या ब्राउज़र की थीम का पालन करता है",
    themeLightDesc: "प्राकृतिक, स्वच्छ व उज्ज्वल दिन मोड",
    themeDarkDesc: "गहरा वनस्पति नाइट मोड, रात के लिए उपयुक्त",
    needSupport: "मदद चाहिए?",
    supportSub: "व्यक्तिगत फसल सलाह के लिए हमारे कृषि विशेषज्ञों से संपर्क करें।",
    contactSupport: "सहायता से संपर्क करें",

    // Alerts & History
    backToDashboard: "डैशबोर्ड पर वापस जाएं",
    notificationsTitle: "सूचनाएं",
    notificationsSubtitle: "वास्तविक समय फसल अलर्ट और सिस्टम सूचनाएं।",
    summary: "सारांश",
    totalAlerts: "कुल अलर्ट",
    unread: "अपठित",
    aboutAlerts: "अलर्ट के बारे में",
    criticalAlertsDesc: "तत्काल कार्रवाई आवश्यक। उच्च गंभीरता का रोग पाया गया।",
    warningAlertsDesc: "मध्यम जोखिम का पता चला। बारीकी से निगरानी करें।",
    optimalAlertsDesc: "फसल की स्थिति पूरी तरह स्वस्थ है।",
    scanNewCrop: "नई फसल स्कैन करें",
    historySubtitle: "पिछले फसल स्वास्थ्य रिकॉर्ड और निदान अंतर्दृष्टि देखें।",
    searchHistoryPlaceholder: "फसल या रोग के अनुसार खोजें...",
    allScans: "सभी स्कैन",
    threatsTab: "जोखिम / रोग",
    healthyTab: "स्वस्थ / कम जोखिम",

    // Alerts & Realtime
    criticalAlert: "गंभीर चेतावनी",
    cropAlert: "फसल चेतावनी",
    systemNotification: "सिस्टम सूचना",
    newAlert: "नई चेतावनी",
    justNow: "अभी-अभी",
    noUnreadNotifications: "कोई अपठित सूचना नहीं",
    noAlertsYet: "अभी कोई चेतावनी नहीं",
    signInToSeeAlerts: "चेतावनी देखने के लिए साइन इन करें",
    showAll: "सभी दिखाएं",
    showUnreadOnly: "केवल अपठित दिखाएं",

    // Analytics Dashboard (§19 of a2.md)
    analyticsSubtitle: "व्यापक स्वास्थ्य रुझान, रोगजनक वितरण और खेत निगरानी",
    cleanHealthRate: "स्वस्थ फसल दर",
    pathogenDistribution: "रोगजनक एवं स्थिति वितरण",
    severityBreakdown: "खतरे की गंभीरता का विवरण",
    fieldPerformanceMatrix: "खेत प्रदर्शन मैट्रिक्स",
    notEnoughData: "रुझान उत्पन्न करने के लिए अभी पर्याप्त स्कैन डेटा नहीं है। इनसाइट्स अनलॉक करने के लिए अपने पहले स्कैन पूरे करें।",
    noYieldFabrication: "केवल वास्तविक स्कैन रिकॉर्ड · कोई काल्पनिक उपज अनुमान नहीं",
    activePlots: "निगरानी किए गए खेत",
    scannedCrops: "स्कैन की गई फसलें",

    aiAssistant: "AgriSight सहायक",
    askAgriSight: "AgriSight से पूछें",
    typeYourQuestion: "अपनी फसल, रोग या खेत के बारे में पूछें...",
    suggestedQuestions: "सुझाए गए प्रश्न",
    groundedAnswer: "आपके AgriSight डेटा के आधार पर",
    generalGuidance: "सामान्य मार्गदर्शन",
    thinking: "सोच रहा है...",
    askButton: "पूछें",
    aiAssistantDescription: "अपनी फसल के निदान, लक्षण या अनुशंसित उपचार के बारे में प्रश्न पूछें।",
    openAssistant: "AI सहायक से पूछें",
    closeAssistant: "सहायक बंद करें",
    clearChat: "बातचीत साफ़ करें",
    groundedBadge: "आपके खेत के डेटा पर आधारित",
    guidanceBadge: "सामान्य कृषि मार्गदर्शन",
    decisionRationale: "निर्णय का कारण",
    evidence: "प्रमाण",
    voiceNotSupported: "इस ब्राउज़र में आवाज इनपुट समर्थित नहीं है। आप अपना प्रश्न टाइप कर सकते हैं।",
    offlineWarning: "आप अभी ऑफ़लाइन हैं। AI उत्तरों के लिए इंटरनेट कनेक्शन आवश्यक है।",
    pageContext: "पेज संदर्भ",

    loading: "लोड हो रहा है...",
    retry: "पुनः प्रयास करें",
    errorOccurred: "एक त्रुटि हुई",
    back: "पीछे जाएं",
    saveChanges: "परिवर्तन सहेजें",
    save: "सहेजें",
    edit: "संपादित करें",
    delete: "हटाएं",
    viewDetails: "विवरण देखें",
    growthStage: "वृद्धि चरण",
    cropName: "फसल का नाम",
    variety: "किस्म",
    plantedOn: "बुवाई की तारीख",
    enterCropName: "फसल का नाम दर्ज करें...",
    crop: "फसल",
    cropIntelligence: "अपनी फसल प्रोफाइल प्रबंधित करें और उनके स्वास्थ्य की निगरानी करें।",
    fieldName: "खेत / भूखंड का नाम",
    location: "स्थान / गांव",
    area: "क्षेत्रफल",
    acres: "एकड़",
    irrigationType: "सिंचाई प्रणाली",
    notes: "कृषि संबंधी नोट्स",
    addField: "खेत भूखंड जोड़ें",
    activeRisks: "सक्रिय जोखिम",
    noFieldsTitle: "अभी तक कोई खेत भूखंड पंजीकृत नहीं है",
    noFieldsDescription: "फसलों को व्यवस्थित करने और बीमारी के हॉटस्पॉट को ट्रैक करने के लिए अपने खेत भूखंड पंजीकृत करें।",
    moderate: "मध्यम",
    activeIssuesCount: "भूखंड समूह",
    actionChecklistTitle: "कार्रवाई चेकलिस्ट",
    noHistory: "अभी तक कोई स्कैन इतिहास दर्ज नहीं किया गया है।",

    // Master Intelligence & Officer
    officerDashboard: "कृषि अधिकारी डैशबोर्ड",
    digitalTwin: "डिजिटल ट्विन",
    farmTimeline: "खेत समयरेखा",
    decisionCards: "किसान निर्णय कार्ड",
    expertReview: "विशेषज्ञ समीक्षा",
    simulateScenario: "खेत परिदृश्य अनुकरण",
    regionalOverview: "क्षेत्रीय कृषि विश्लेषण",
    projectedHealth: "अनुमानित स्वास्थ्य",
    yieldImpact: "उपज प्रभाव",
    waterStress: "जल तनाव",
    daysWithoutWater: "सिंचाई के बिना दिन",
    tempChange: "तापमान परिवर्तन",
    expectedRainfall: "अपेक्षित वर्षा",
    runSimulation: "सिमुलेशन चलाएं",

    // Phase 1: Crisp Gist-First Scan Navigation & Details
    btnCrop: "फसल विवरण (Crop)",
    btnDisease: "रोग (Disease)",
    btnPest: "कीट (Pest)",
    btnNutrition: "पोषण (Nutrition)",
    btnWater: "पानी / सिंचाई (Water)",
    btnPrevention: "रोकथाम (Prevention)",
    btnIpm: "आईपीएम (IPM)",
    btnCompare: "तुलना करें (Compare)",
    cropProfile: "फसल विवरण",
    detectedCrop: "पहचानी गई फसल",
    mainIssue: "मुख्य समस्या",
    immediateActionTitle: "तत्काल कार्रवाई",
    backToSummary: "वापस",
    waterStressRisk: "जल-तनाव जोखिम",
    todaysGuidance: "आज का सुझाव",
    bestWindow: "उपयुक्त समय",
    whyHappeningGist: "कारण (Why)",
    whatToDoGist: "क्या करें (What to do)",
    priorityAction: "प्राथमिकता",
    needsAttention: "ध्यान देने की आवश्यकता है",
    allGood: "फसल स्वस्थ है",
    possibleIssue: "संभावित समस्या",
    tapToViewDetails: "विवरण देखने के लिए टैप करें",
    moreDetails: "अधिक विवरण",
    lessDetails: "कम विवरण",
    resourceTip: "संसाधन बचत सुझाव",
    ipmTitle: "एकीकृत कीट प्रबंधन (IPM)",
    whatShouldIDoToday: "आज मुझे क्या करना चाहिए?",
    explainThisScan: "इस स्कैन को समझाएं",
    btnWhy: "क्यों? (Why)",
    btnWhatToDo: "क्या करें? (What to do)",

    cropCountLabel: "फसल संख्या",
    cropCountUnit: "फसलें",
    precisionFarming: "सटीक कृषि तकनीक",
    farmer: "किसान",
    logAction: "कार्रवाई दर्ज करें",
    recordFarmingAction: "कृषि कार्य दर्ज करें",
    noActionsRecorded: "अभी तक कोई कार्य दर्ज नहीं किया गया",
    noActionsSubtext: "उपचार (छिड़काव, सिंचाई परिवर्तन, छंटाई) दर्ज करें ताकि सुधार के परिणामों को मापा जा सके।",
    actionChecklistSubtext: "बीमारी को फैलने से रोकने के लिए उपचारों को ट्रैक करें।",

    noActivePests: "कोई सक्रिय कीट नहीं",
    soilAndFertilizer: "मिट्टी और उर्वरक",
    preventAndControl: "रोकथाम और नियंत्रण",
    comparePreviousScans: "पिछले स्कैन की तुलना करें",
    cropInsights: "फसल विश्लेषण",
    cropProfileTag: "विवरण",
    unhealthy: "अस्वस्थ",
    atRisk: "जोखिम में",
    fieldLocation: "खेत का स्थान",
    visualAiClassification: "विजुअल एआई पहचान",
    cropCarePractices: "फसल देखभाल और कृषि पद्धतियां",
    optimalSunlightTitle: "अनुकूल धूप",
    optimalSunlightDesc: "सक्रिय प्रकाश संश्लेषण और स्वस्थ पत्तियों के लिए दैनिक 6-8 घंटे धूप प्रदान करें।",
    soilMoistureTitle: "मिट्टी और नमी",
    soilMoistureDesc: "जड़ गलन से बचने के लिए जल निकासी वाली मिट्टी रखें; जड़ों में पानी न जमने दें।",
    scoutingScheduleTitle: "निगरानी समय सारिणी",
    scoutingScheduleDesc: "रोग या कीटों के शुरुआती संकेतों के लिए सप्ताह में दो बार पत्तियों की निचली सतह का निरीक्षण करें।",
    ipmActionChecklist: "आईपीएम कार्य सूची",
    ipmStep1: "इस क्षेत्र के आसपास के पौधों और पत्तियों का सावधानीपूर्वक निरीक्षण करें",
    ipmStep2: "गंभीर रूप से प्रभावित पत्तियों और टहनियों को काटकर खेत से दूर नष्ट करें",
    ipmStep3: "फसल की पंक्तियों के बीच वायु प्रवाह और उचित दूरी बनाए रखें",
    ipmStep4: "रासायनिक कीटनाशकों के बजाय पहले नीम का तेल या जैविक नियंत्रण अपनाएं",
    ipmStep5: "आर्थिक क्षति सीमा पार होने पर ही अनुमोदित लक्षित कीटनाशक का प्रयोग करें",
    ipmStep6: "रोग नियंत्रण की पुष्टि के लिए अगले 3-5 दिनों में पुनः स्कैन करें",
    ipmResourceTipDesc: "पूरे खेत में एक समान रासायनिक छिड़काव से बचें। केवल प्रभावित हिस्से पर ही लक्षित छिड़काव करें, इससे लागत बचती है और लाभकारी कीट सुरक्षित रहते हैं।",
    nutritionSoilHealth: "पोषण और मृदा स्वास्थ्य",
    possibleNutrientDeficiency: "संभावित पोषक तत्व की कमी",
    foliarImbalance: "पत्तियों का पीलापन / पोषक असंतुलन",
    aiNutritionGuidance: "AI पोषक तत्व एवं उर्वरक सलाह",
    nutritionStep1: "मिट्टी की नमी और जड़ों की स्थिति की जांच करें",
    nutritionStep2: "भारी उर्वरक देने से पहले मिट्टी की जांच से पुष्टि करें",
    nutritionStep3: "संतुलित जैविक खाद या हल्का फोलियर स्प्रे प्रयोग करें",
    soilTestRecommendation: "मृदा प्रयोगशाला परीक्षण",
    soilTestBannerText: "पत्तियों का पीलापन अधिक पानी या जड़ों की कमजोरी के कारण भी हो सकता है। अधिक उर्वरक देने से पहले मिट्टी जांच से पुष्टि करें।",
    waterIrrigationTitle: "जल एवं सिंचाई प्रबंधन",
    postponeIrrigationRain: "बारिश की संभावना के कारण सिंचाई स्थगित रखें।",
    irrigationMayBeNeeded: "संतुलित सिंचाई की आवश्यकता हो सकती है।",
    aiIrrigationGuidance: "AI सिंचाई सलाह",
    weatherReasonRain: "स्थानीय पूर्वानुमान में बारिश की कम संभावना",
    weatherReasonTemp: "दिन का तापमान सामान्य (~28°C–32°C)",
    weatherReasonMorning: "सुबह सिंचाई करने से पत्तियों पर नमी जमने और फफूंद का खतरा कम होता है",
    diseaseDiagnosisTitle: "रोग निदान",
    pestIntelligenceTitle: "कीट जानकारी",
    healthyLeafFoliage: "पत्तियों पर कोई रोग या धब्बे नहीं दिखे। पत्तियां पूरी तरह स्वस्थ हैं।",
    unhealthyLeafFoliage: "पत्तियों पर घाव या असामान्य धब्बे देखे गए हैं।",
    healthyCareStep1: "फसल की नियमित निगरानी जारी रखें",
    healthyCareStep2: "पौधों के स्वास्थ्य के लिए संतुलित खाद और सिंचाई दें",
    healthyCareStep3: "खेत के औजारों को साफ और रोगाणुरहित रखें",
    unhealthyCareStep1: "आसपास के पौधों में रोग के प्रसार की जांच करें",
    unhealthyCareStep2: "संक्रमण कम करने के लिए अत्यधिक प्रभावित पत्तियां काटें",
    unhealthyCareStep3: "उचित एकीकृत कीट प्रबंधन (IPM) का पालन करें",
    // Username & Onboarding
    username: "उपयोगकर्ता नाम",
    chooseUsername: "अपना उपयोगकर्ता नाम चुनें",
    usernameHint: "3–20 वर्ण, केवल अक्षर, संख्याएं और अंडरस्कोर",
    usernameChecking: "उपलब्धता जांची जा रही है...",
    usernameAvailable: "उपयोगकर्ता नाम उपलब्ध है!",
    usernameTaken: "यह उपयोगकर्ता नाम पहले से लिया गया है।",
    usernameInvalid: "केवल अक्षर, संख्याएं और अंडरस्कोर (3–20 वर्ण)।",
    usernameRequired: "आगे बढ़ने के लिए उपयोगकर्ता नाम दर्ज करें।",
    onboardingTitle: "बस एक कदम दूर!",
    onboardingSubtext: "अपनी AgriSight प्रोफ़ाइल के लिए एक अनूठा उपयोगकर्ता नाम बनाएं।",
    onboardingContinue: "सहेजें और आगे बढ़ें",
    onboardingSkip: "अभी छोड़ें",
    // Profile Edit
    editProfile: "प्रोफ़ाइल संपादित करें",
    fullName: "पूरा नाम",
    saveProfile: "प्रोफ़ाइल सहेजें",
    profileUpdated: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    profileUpdateFailed: "प्रोफ़ाइल अपडेट करने में विफल। कृपया पुनः प्रयास करें।",
    changePassword: "पासवर्ड बदलें",
    verifiedAccount: "सत्यापित खाता",
    unverifiedAccount: "असत्यापित — अपना ईमेल जांचें",

    // Field-Centric MVP
    myFields: "मेरे खेत",
    addFieldGuided: "खेत जोड़ें",
    fieldSetupStep1: "अपना खेत बनाएं",
    fieldSetupStep2: "आप यहां क्या उगा रहे हैं?",
    fieldSetupStep3: "फील्ड नोड कनेक्ट करें",
    fieldReady: "आपका खेत तैयार है",
    fieldNamePlaceholder: "जैसे उत्तरी खेत",
    fieldAreaLabel: "यह कितना बड़ा है?",
    fieldLocationLabel: "यह कहाँ है?",
    useMyLocation: "मेरी लोकेशन उपयोग करें",
    selectOnMap: "मानचित्र पर चुनें",
    whatAreYouGrowing: "आप यहां क्या उगा रहे हैं?",
    cropVarietyOptional: "फसल किस्म (वैकल्पिक)",
    whenDidYouPlant: "आपने कब बोया?",
    skipForNow: "अभी छोड़ें",
    connectFieldNode: "फील्ड नोड कनेक्ट करें",
    fieldNodeDescription: "आपका फील्ड नोड मिट्टी और पर्यावरण की स्थिति निगरानी कर सकता है।",
    attachToField: "खेत से जोड़ें",
    openField: "खेत खोलें",
    fieldHealth: "खेत स्वास्थ्य",
    fieldHealthGood: "अच्छा",
    fieldHealthAttention: "ध्यान दें",
    fieldHealthCritical: "गंभीर",
    fieldHealthNoData: "डेटा नहीं",
    waitingForFieldData: "पर्याप्त खेत डेटा का इंतजार",
    fieldConditions: "खेत की स्थिति",
    soilMoisture: "मिट्टी की नमी",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    soilPh: "मिट्टी का pH",
    waterFlow: "पानी का प्रवाह",
    notAvailable: "उपलब्ध नहीं",
    scanLeafCta: "पत्ती स्कैन करें",
    checkCropHealth: "अपनी फसल का स्वास्थ्य जांचें",
    agriSightInsight: "AgriSight अंतर्दृष्टि",
    fieldNodeConnected: "कनेक्टेड",
    fieldNodeOffline: "ऑफलाइन",
    fieldNodeNotAttached: "कोई फील्ड नोड संलग्न नहीं",
    fieldNodeLastUpdate: "अंतिम अपडेट",
    fieldNodeTroubleshoot: "समस्या निवारण",
    viewSensors: "सेंसर देखें",
    recentScans: "हाल के स्कैन",
    fieldHistory: "खेत इतिहास",
    fieldAnalytics: "खेत विश्लेषण",
    recommendations: "सिफारिशें",
    askAboutThisField: "इस खेत के बारे में AgriSight से पूछें",
    whichFieldIsThis: "यह किस खेत से है?",
    cropCheckResult: "फसल जांच",
    whyThisWasFlagged: "यह क्यों चिह्नित किया गया",
    viewRecommendation: "सिफारिश देखें",
    compareWithPreviousScan: "पिछले स्कैन से तुलना करें",
    scanSavedToField: "स्कैन खेत में सहेजा गया",
    fieldNodeSectionTitle: "फील्ड नोड",
    sensorsDetected: "सेंसर मिले",
    noSensorData: "कोई सेंसर डेटा उपलब्ध नहीं",
    yourFieldCanStillBeUsed: "आपका खेत अभी भी उपयोग किया जा सकता है। कुछ लाइव सेंसर रीडिंग अनुपलब्ध हैं।",
    farmOverview: "खेत अवलोकन",
    connectedFieldNodes: "कनेक्टेड फील्ड नोड",
    continueSetup: "जारी रखें",
    setupComplete: "सेटअप पूर्ण",
    scanFromField: "पत्ती स्कैन करें",
    addCropToField: "फसल जोड़ें",
    noCropLinked: "अभी तक कोई फसल नहीं जोड़ी गई",
    fieldStage: "अवस्था",
    noFieldNodeYet: "कोई फील्ड नोड कनेक्ट नहीं",
    connectYourFieldNode: "मिट्टी और मौसम निगरानी के लिए अपना फील्ड नोड कनेक्ट करें।",
    manageMore: "अधिक विवरण",
  },
  bn: {
    home: "হোম",
    crops: "আমার ফসল",
    fields: "জমি / প্লট",
    scanLeaf: "পাতা স্ক্যান করুন",
    analysisHistory: "বিশ্লেষণ ইতিহাস",
    analytics: "বিশ্লেষণ",
    alerts: "সতর্কতা",
    profile: "প্রোফাইল",
    newAnalysis: "নতুন বিশ্লেষণ",
    searchPlaceholder: "ফসল, কীটপতঙ্গ বা রেকর্ড খুঁজুন...",
    logout: "লগ আউট",
    loginWelcome: "স্বাগতম",
    loginSubtext: "AI-চালিত কৃষি বিজ্ঞান",
    continueWithGoogle: "Google দিয়ে চালিয়ে যান",
    emailAddress: "ইমেল ঠিকানা",
    password: "পাসওয়ার্ড",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    signIn: "সাইন ইন",
    signingIn: "সাইন ইন হচ্ছে...",
    noAccount: "অ্যাকাউন্ট নেই?",
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    demoAccess: "ডেমো অ্যাকস",
    orSignInWith: "বা ইমেল দিয়ে সাইন ইন করুন",
    signupWelcome: "অ্যাকাউন্ট তৈরি করুন",
    signupSubtext: "আজই এগ্রিসাইট সম্প্রদায়ে যোগ দিন",
    confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    alreadyHaveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",

    uploadTitle: "পাতার ছবি আপলোড করুন",
    analyzingTitle: "পাতা পরীক্ষা করা হচ্ছে",
    uploadInstruction: "📸 একটি পাতার পরিষ্কার ছবি নিন",
    analyzingInstruction: "আপনার পাতা ও মাঠের অবস্থা যাচাই করা হচ্ছে।",
    selectImage: "ছবি নির্বাচন করুন",
    dragAndDrop: "বা এখানে টেনে আনুন",
    errorNoFile: "দয়া করে প্রথমে একটি ছবি নির্বাচন করুন।",
    errorInvalidType: "দয়া করে একটি পাতার পরিষ্কার ছবি আপলোড করুন (JPG/PNG)",
    takePhoto: "ছবি তুলুন",
    chooseFile: "গ্যালারি থেকে নির্বাচন করুন",
    askQuestionPlaceholder: "এই পাতাটি সম্পর্কে নির্দিষ্ট কোনো প্রশ্ন থাকলে লিখুন (ঐচ্ছিক)...",
    optionalContext: "ঐচ্ছিক খামার তথ্য",
    selectCropOptional: "ফসল নির্বাচন করুন (ঐচ্ছিক)",
    selectFieldOptional: "জমি / প্লট নির্বাচন করুন (ঐচ্ছিক)",
    noAssignedCrop: "কোনো ফসল নির্বাচিত নেই",
    noAssignedField: "কোনো জমি নির্বাচিত নেই",
    startAnalysisButton: "AI বিশ্লেষণ শুরু করুন",
    reTake: "পুনরায় ছবি তুলুন",
    cancel: "বাতিল করুন",
    voiceInputTitle: "কণ্ঠস্বর ইনপুট",
    listeningState: "শুনছি... আপনার পর্যবেক্ষণ বা প্রশ্নটি বলুন",
    speakNowPrompt: "আপনার ভাষায় কথা বলুন",
    stopListening: "রেকর্ডিং থামান",
    micPermissionDenied: "মাইক্রোফোনের অনুমতি প্রত্যাখ্যাত হয়েছে। দয়া করে আপনার ব্রাউজার বা ডিভাইস সেটিংসে অনুমতি দিন।",
    speechNetworkError: "স্পিচ রিকগনিশনে নেটওয়ার্ক সমস্যা। দয়া করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।",
    listeningInLanguage: "{lang} এ শুনছি...",
    tapToSpeak: "কথা বলতে ট্যাপ করুন",
    clearVoiceInput: "কণ্ঠস্বর ইনপুট মুছুন",
    cameraUnavailable: "ক্যামেরা অ্যাক্সেস অনুপলব্ধ। দয়া করে ফাইল আপলোড ব্যবহার করুন।",
    fileTooLarge: "ছবির সাইজ অনুমোদিত সীমা অতিক্রম করেছে (সর্বোচ্চ ২৫ মেগাবাইট)।",
    stageCompressing: "পাতার ছবি অপ্টিমাইজ করা হচ্ছে...",
    stageUploading: "কৃষি ডাটাবেজে আপলোড করা হচ্ছে...",
    stageAiAnalyzing: "ফসলের স্বাস্থ্য ও লক্ষণ বিশ্লেষণ হচ্ছে...",
    stageGeneratingInsights: "চিকিৎসা ও প্রতিরোধ পরিকল্পনা তৈরি করা হচ্ছে...",
    openLiveCamera: "লাইভ ক্যামেরা ভিউফাইন্ডার",
    switchCamera: "ক্যামেরা পরিবর্তন করুন",
    snapPhoto: "ছবি তুলুন",
    closeCamera: "ক্যামেরা বন্ধ করুন",
    qualityWarningDark: "ছবিটি খুব অন্ধকার বা অস্পষ্ট মনে হচ্ছে। ভালো আলোতে ছবি তুলুন।",
    qualityWarningBlur: "পাতাটি স্পষ্টভাবে ফোকাসে নেই। নির্দিষ্ট একটি পাতায় ফোকাস করে ছবি তুলুন।",
    proceedAnyway: "তবুও বিশ্লেষণ করুন",
    retryAnalysis: "পুনরায় বিশ্লেষণ করুন",

    latestAnalysis: "সর্বশেষ বিশ্লেষণ",
    viewFullReport: "সম্পূর্ণ রিপোর্ট দেখুন",
    analyzedAgo: "সম্প্রতি বিশ্লেষণ করা হয়েছে",
    confidence: "নির্ভুলতা",
    spreadRisk: "ছড়ানোর ঝুঁকি",
    realtimeAlerts: "রিয়েল-টাইম সতর্কতা",
    localWeather: "স্থানীয় আবহাওয়া",
    noScansYet: "এখনো কোনো স্ক্যান পাওয়া যায়নি",
    startScanning: "তাত্ক্ষণিক AI বিশ্লেষণ পেতে আপনার ফসলের একটি ছবি আপলোড করুন।",
    risk: "ঝুঁকি",
    humidityLabel: "আর্দ্রতা",
    smartInsight: "স্মার্ট অন্তর্দৃষ্টি",
    clickToUpload: "বা আইকনে ক্লিক করুন",
    cropOverview: "ফসলের স্বাস্থ্য পর্যালোচনা",
    activeIssues: "সক্রিয় ফসলের ঝুঁকি",
    priorityActions: "অগ্রাধিকারমূলক পদক্ষেপ",
    riskIntelligence: "কৃষি ঝুঁকি রাডার",
    overallHealth: "সামগ্রিক স্বাস্থ্য",
    manageCrops: "ফসল পরিচালনা করুন",
    noCropsYet: "এখনও কোনো ফসল যোগ করা হয়নি",
    addCrop: "ফসল যোগ করুন",
    cropsNeedAttention: "ফসলে অবিলম্বে পদক্ষেপ নেওয়া প্রয়োজন",

    totalScans: "মোট স্ক্যান",
    aiAccuracy: "AI সঠিকতা",
    cropVarieties: "চিহ্নিত ফসল",
    activeThreats: "সক্রিয় হুমকি",

    capturedArea: "ক্যাপচার করা এলাকা",
    scanDate: "স্ক্যানের তারিখ",
    identifiedCondition: "শনাক্ত অবস্থা",
    conditionSeverity: "অবস্থার তীব্রতা",
    environmentalCause: "পরিবেশগত কারণ",
    recommendedTreatment: "প্রস্তাবিত চিকিৎসা",
    preventionRoadmap: "প্রতিরোধ রোডম্যাপ",
    whatWeFound: "যা পাওয়া গেছে",
    whyHappening: "কেন এটি ঘটতে পারে",
    whatToDo: "আপনার যা করা উচিত",
    whatToAvoid: "যা এড়িয়ে চলবেন",
    prevention: "প্রতিরোধ",
    immediateActions: "তাৎক্ষণিক করণীয়",
    cautions: "সতর্কতা ও ঝুঁকি",
    symptoms: "দৃশ্যমান লক্ষণসমূহ",
    causes: "মূল কারণ",
    predictionOutlook: "ভবিষ্যত সম্ভাবনা ও পূর্বাভাস",
    next3Days: "পরবর্তী ৩ দিন",
    next7Days: "পরবর্তী ৭ দিন",
    recoveryChance: "সুস্থ হওয়ার সম্ভাবনা",
    listenExplanation: "শুনুন (ভয়েস রিডআউট)",
    stopAudio: "ভয়েস বন্ধ করুন",
    audioPlaybackError: "আপনার ডিভাইসে এই ভাষার জন্য অডিও প্লেব্যাক অনুপলব্ধ।",
    speak: "বলুন",
    stopSpeaking: "বলা বন্ধ করুন",
    ttsVoiceUnavailable: "আপনার ব্রাউজারে এই ভাষার জন্য ভয়েস উপলব্ধ নেই। উত্তরের লেখা সম্পূর্ণরূপে ব্যবহারযোগ্য।",
    ttsPlaying: "অডিও বাজছে...",
    detailedInsight: "বিস্তারিত ব্যাখ্যা",
    linkToCrop: "ফসলের সাথে সংযুক্ত করুন",
    linkToField: "জমির সাথে সংযুক্ত করুন",

    scanComparison: "স্ক্যান তুলনা",
    whatChanged: "কি পরিবর্তন হলো? · স্ক্যান তুলনা",
    previousScan: "পূর্ববর্তী স্ক্যান",
    currentScan: "বর্তমান স্ক্যান",
    severityChange: "তীব্রতার পরিবর্তন",
    timeElapsed: "অতিবাহিত সময়",
    improvingProgression: "অবস্থার উন্নতি হচ্ছে",
    worseningProgression: "অবস্থার অবনতি হচ্ছে",
    stableProgression: "অবস্থা স্থিতিশীল",
    healthyStableProgression: "সুস্থ ও স্থিতিশীল",
    persistentCondition: "স্থায়ী সংক্রমণ",
    compareButton: "স্ক্যান তুলনা করুন",
    selectAnotherScan: "তুলনা করতে অন্য একটি স্ক্যান নির্বাচন করুন",
    smartFollowUp: "স্মার্ট ফলো-আপ পরামর্শ",
    daysAgo: "দিন আগে",

    geospatialFieldIntel: "ভৌগোলিক জমি বুদ্ধিমত্তা",
    agriculturalFields: "কৃষি জমি ও প্লট",
    addFieldPlot: "নতুন জমি প্লট যোগ করুন",
    totalManagedArea: "মোট পরিচালিত এলাকা",
    averageFieldHealth: "গড় জমির স্বাস্থ্য",
    activeHotspots: "সক্রিয় রোগ হটস্পট",
    fieldHealthMap: "জমির স্বাস্থ্য মানচিত্র",
    quadrants: "চতুর্থাংশ এলাকা",
    hotspotsLayer: "রোগ হটস্পট",
    healthLayer: "স্বাস্থ্য সূচক",
    survivalEstimate: "আনুমানিক ফসলের বেঁচে থাকার হার",
    targetedFieldActions: "জমির পদক্ষেপের তালিকা",
    cropsInField: "এই জমিতে রোপিত ফসল",
    fieldScanHistory: "জমির স্ক্যান ইতিহাস",
    noFieldsYet: "এখনও কোনো কৃষি জমি নিবন্ধিত হয়নি",
    soilType: "মাটির ধরন",
    irrigationSystem: "সেচ ব্যবস্থা",
    plotLocation: "প্লটের অবস্থান",
    areaAcres: "আয়তন (একর)",
    editFieldProfile: "জমির তথ্য সম্পাদনা",
    deleteFieldConfirm: "আপনি কি নিশ্চিতভাবে এই জমিটি মুছে ফেলতে চান? সম্পর্কিত রেকর্ডসমূহ নিরাপদে সংরক্ষিত থাকবে।",

    improving: "উন্নতি হচ্ছে",
    worsening: "অবনতি হচ্ছে",
    stable: "স্থিতিশীল",
    healthy: "সুস্থ",
    low: "কম",
    medium: "মাঝারি",
    high: "উচ্চ",
    critical: "মারাত্মক",

    profileSettings: "প্রোফাইল সেটিংস",
    accountStatus: "অ্যাকাউন্টের অবস্থা",
    notificationPreferences: "বিজ্ঞপ্তির পছন্দসমূহ",
    signOut: "সাইন আউট",
    manageProfileSettings: "আপনার কৃষি প্রোফাইল এবং সেটিংস পরিচালনা করুন।",
    memberSince: "{date} থেকে সদস্য",
    recent: "সম্প্রতি",
    dataSync: "ডেটা সিঙ্ক",
    active: "সক্রিয়",
    subscription: "সাবস্ক্রিপশন",
    freeTier: "ফ্রি টিয়ার",
    languageLabel: "ভাষা",
    savedSuccess: "সংরক্ষিত ✓",
    criticalAlertsPref: "জরুরি সতর্কবার্তা",
    criticalAlertsSub: "জরুরি রোগ সনাক্তকরণ",
    weeklySummariesPref: "সাপ্তাহিক সারসংক্ষেপ",
    weeklySummariesSub: "ফসল স্বাস্থ্য ডাইজেস্ট",
    appearance: "অ্যাপিয়ারেন্স (Appearance)",
    themeSystem: "সিস্টেম (System)",
    themeLight: "লাইট (Light)",
    themeDark: "ডার্ক (Dark)",
    themeSystemDesc: "ডিভাইস বা ব্রাউজার ডিসপ্লে সেটিংস স্বয়ংক্রিয়ভাবে অনুসরণ করে",
    themeLightDesc: "স্বাভাবিক, পরিষ্কার ও উজ্জ্বল ডে মোড",
    themeDarkDesc: "গভীর বোটানিক্যাল নাইট মোড, রাতে দেখার জন্য উপযোগী",
    needSupport: "সহায়তা প্রয়োজন?",
    supportSub: "ব্যক্তিগতকৃত ফসল পরামর্শের জন্য আমাদের কৃষি বিশেষজ্ঞদের সাথে যোগাযোগ করুন।",
    contactSupport: "সহায়তায় যোগাযোগ করুন",

    // Alerts & History
    backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
    notificationsTitle: "বিজ্ঞপ্তি",
    notificationsSubtitle: "রিয়েল-টাইম ফসল সতর্কতা এবং সিস্টেম বিজ্ঞপ্তি।",
    summary: "সারসংক্ষেপ",
    totalAlerts: "মোট সতর্কতা",
    unread: "অপঠিত",
    aboutAlerts: "সতর্কতা সম্পর্কে",
    criticalAlertsDesc: "অবিলম্বে ব্যবস্থা প্রয়োজন। উচ্চ মাত্রার রোগ সনাক্ত করা হয়েছে।",
    warningAlertsDesc: "মাঝারি ঝুঁকি সনাক্ত। নিবিড় পর্যবেক্ষণ করুন।",
    optimalAlertsDesc: "ফসলের অবস্থা সম্পূর্ণ সুস্থ।",
    scanNewCrop: "নতুন ফসল স্ক্যান করুন",
    historySubtitle: "পূর্ববর্তী ফসলের স্বাস্থ্য রেকর্ড এবং রোগ নির্ণয়ের বিবরণ দেখুন।",
    searchHistoryPlaceholder: "ফসল বা রোগ অনুসারে অনুসন্ধান করুন...",
    allScans: "সমস্ত স্ক্যান",
    threatsTab: "ঝুঁকি / রোগ",
    healthyTab: "সুস্থ / কম ঝুঁকি",

    // Alerts & Realtime
    criticalAlert: "জরুরি সতর্কতা",
    cropAlert: "ফসলের সতর্কতা",
    systemNotification: "সিস্টেম বিজ্ঞপ্তি",
    newAlert: "নতুন সতর্কতা",
    justNow: "এই মাত্র",
    noUnreadNotifications: "কোনো অপঠিত বিজ্ঞপ্তি নেই",
    noAlertsYet: "এখনো কোনো সতর্কতা নেই",
    signInToSeeAlerts: "সতর্কতা দেখতে সাইন ইন করুন",
    showAll: "সব দেখান",
    showUnreadOnly: "শুধু অপঠিত দেখান",

    // Analytics Dashboard (§19 of a2.md)
    analyticsSubtitle: "বিস্তারিত স্বাস্থ্য প্রবণতা, রোগজীবাণু বিতরণ ও মাঠ পর্যবেক্ষণ",
    cleanHealthRate: "সুস্থ ফসলের হার",
    pathogenDistribution: "রোগজীবাণু ও রোগের বিতরণ",
    severityBreakdown: "তীব্রতার বিশ্লেষণ",
    fieldPerformanceMatrix: "মাঠের কার্যক্ষমতার সারণী",
    notEnoughData: "ডেটা যথেষ্ট নয় — সাম্প্রতিক প্রবণতা দেখতে প্রথম মাঠ স্ক্যান সম্পন্ন করুন।",
    noYieldFabrication: "নিশ্চিত ফলন পূর্বাভাস শূন্য — শুধু প্রকৃত ডেটার শাসন",
    activePlots: "সক্রিয় প্লট",
    scannedCrops: "স্ক্যান করা ফসল",

    aiAssistant: "AgriSight সহায়ক",
    askAgriSight: "AgriSight-কে জিজ্ঞাসা করুন",
    typeYourQuestion: "আপনার ফসল, রোগ বা খামার সম্পর্কে জিজ্ঞাসা করুন...",
    suggestedQuestions: "পরামর্শকৃত প্রশ্নসমূহ",
    groundedAnswer: "আপনার AgriSight ডেটার ভিত্তিতে",
    generalGuidance: "সাধারণ নির্দেশনা",
    thinking: "ভাবছে...",
    askButton: "জিজ্ঞাসা করুন",
    aiAssistantDescription: "ফসলের রোগ নির্ণয়, লক্ষণ বা প্রস্তাবিত চিকিৎসা সম্পর্কিত যেকোনো প্রশ্ন জিজ্ঞাসা করুন।",
    openAssistant: "AI সহায়ককে জিজ্ঞাসা করুন",
    closeAssistant: "সহায়ক বন্ধ করুন",
    clearChat: "চ্যাট সাফ করুন",
    groundedBadge: "আপনার খামারের তথ্যের ভিত্তিতে",
    guidanceBadge: "সাধারণ কৃষি নির্দেশনা",
    decisionRationale: "পরামর্শের যৌক্তিক কারণ",
    evidence: "তথ্যসূত্র",
    voiceNotSupported: "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। আপনি টাইপ করে প্রশ্ন করতে পারেন।",
    offlineWarning: "আপনি বর্তমানে অফলাইনে আছেন। AI উত্তরের জন্য ইন্টারনেট সংযোগ প্রয়োজন।",
    pageContext: "পেজ প্রসঙ্গ",

    loading: "লোড হচ্ছে...",
    retry: "পুনরায় চেষ্টা করুন",
    errorOccurred: "একটি ত্রুটি ঘটেছে",
    back: "ফিরে যান",
    saveChanges: "পরিবর্তন সংরক্ষণ করুন",
    save: "সংরক্ষণ করুন",
    edit: "সম্পাদনা",
    delete: "মুছে ফেলুন",
    viewDetails: "বিস্তারিত দেখুন",
    growthStage: "বৃদ্ধির ধাপ",
    cropName: "ফসলের নাম",
    variety: "জাত / ভ্যারাইটি",
    plantedOn: "রোপণের তারিখ",
    enterCropName: "ফসলের নাম লিখুন...",
    crop: "ফসল",
    cropIntelligence: "আপনার ফসলের প্রোফাইল পরিচালনা করুন এবং স্বাস্থ্য ট্র্যাক করুন।",
    fieldName: "জমি / প্লটের নাম",
    location: "অবস্থান / গ্রাম",
    area: "আয়তন",
    acres: "একর",
    irrigationType: "সেচ ব্যবস্থা",
    notes: "কৃষি সংক্রান্ত তথ্য",
    addField: "নতুন জমি যোগ করুন",
    activeRisks: "সক্রিয় ঝুঁকি",
    noFieldsTitle: "এখনও কোনো কৃষি জমি নিবন্ধিত হয়নি",
    noFieldsDescription: "ফসল পরিচালনা করতে এবং রোগের হটস্পট ট্র্যাক করতে আপনার জমি নিবন্ধন করুন।",
    moderate: "মাঝারি",
    activeIssuesCount: "প্লট ক্লাস্টার",
    actionChecklistTitle: "পদক্ষেপের তালিকা",
    noHistory: "এখনো কোনো স্ক্যান ইতিহাস পাওয়া যায়নি।",

    // Master Intelligence & Officer
    officerDashboard: "কৃষি কর্মকর্তা ড্যাশবোর্ড",
    digitalTwin: "ডিজিটাল টুইন",
    farmTimeline: "খামার টাইমলাইন",
    decisionCards: "কৃষক সিদ্ধান্ত কার্ড",
    expertReview: "বিশেষজ্ঞ পর্যালোচনা",
    simulateScenario: "খামার সিমুলেশন",
    regionalOverview: "আঞ্চলিক কৃষি অন্তর্দৃষ্টি",
    projectedHealth: "প্রত্যাশিত স্বাস্থ্য",
    yieldImpact: "ফলন প্রভাব",
    waterStress: "পানির চাপ",
    daysWithoutWater: "সেচ ছাড়া দিন",
    tempChange: "তাপমাত্রা পরিবর্তন",
    expectedRainfall: "প্রত্যাশিত বৃষ্টিপাত",
    runSimulation: "সিমুলেশন চালান",

    // Phase 1: Crisp Gist-First Scan Navigation & Details
    btnCrop: "ফসলের বিবরণ (Crop)",
    btnDisease: "রোগ (Disease)",
    btnPest: "কীটপতঙ্গ (Pest)",
    btnNutrition: "পুষ্টি (Nutrition)",
    btnWater: "পানি / সেচ (Water)",
    btnPrevention: "প্রতিরোধ (Prevention)",
    btnIpm: "আইপিএম (IPM)",
    btnCompare: "তুলনা করুন (Compare)",
    cropProfile: "ফসলের বিবরণ",
    detectedCrop: "শনাক্তকৃত ফসল",
    mainIssue: "মূল সমস্যা",
    immediateActionTitle: "তাৎক্ষণিক করণীয়",
    backToSummary: "ফিরে যান",
    waterStressRisk: "পানি সংকট ঝুঁকি",
    todaysGuidance: "আজকের পরামর্শ",
    bestWindow: "উপযুক্ত সময়",
    whyHappeningGist: "কারণ (Why)",
    whatToDoGist: "কী করবেন (What to do)",
    priorityAction: "অগ্রাধিকার",
    needsAttention: "মনোযোগ দেওয়া প্রয়োজন",
    allGood: "ফসল সুস্থ আছে",
    possibleIssue: "সম্ভাব্য সমস্যা",
    tapToViewDetails: "বিস্তারিত দেখতে ট্যাপ করুন",
    moreDetails: "আরও বিস্তারিত",
    lessDetails: "সংক্ষিপ্ত করুন",
    resourceTip: "সম্পদ সাশ্রয় টিপ",
    ipmTitle: "সমন্বিত বালাই দমন (IPM)",
    whatShouldIDoToday: "আজ আমার কী করা উচিত?",
    explainThisScan: "এই স্ক্যানটি ব্যাখ্যা করুন",
    btnWhy: "কেন? (Why)",
    btnWhatToDo: "কী করা উচিত? (What to do)",

    cropCountLabel: "ফসলের সংখ্যা",
    cropCountUnit: "টি ফসল",
    precisionFarming: "নির্ভুল কৃষি প্রযুক্তি",
    farmer: "কৃষক",
    logAction: "পদক্ষেপ যোগ করুন",
    recordFarmingAction: "কৃষি কাজ রেকর্ড করুন",
    noActionsRecorded: "এখনো কোনো পদক্ষেপ রেকর্ড করা হয়নি",
    noActionsSubtext: "চিকিৎসা ও পরিচর্যা (স্প্রে, সেচ সমন্বয়, ছাঁটাই) রেকর্ড করুন যাতে পুনরুদ্ধারের ফলাফল নথিভুক্ত করা যায়।",
    actionChecklistSubtext: "রোগের বিস্তার বন্ধ করতে পদক্ষেপগুলো ট্র্যাক করুন।",

    noActivePests: "কোনো সক্রিয় কীটপতঙ্গ নেই",
    soilAndFertilizer: "মাটি ও সার ব্যবস্থাপনা",
    preventAndControl: "প্রতিরোধ ও নিয়ন্ত্রণ",
    comparePreviousScans: "পূর্ববর্তী স্ক্যান তুলনা করুন",
    cropInsights: "ফসলের বিশ্লেষণ",
    cropProfileTag: "বিবরণ",
    unhealthy: "অসুস্থ",
    atRisk: "ঝুঁকিপূর্ণ",
    fieldLocation: "জমির অবস্থান",
    visualAiClassification: "ভিজ্যুয়াল এআই শনাক্তকরণ",
    cropCarePractices: "ফসল পরিচর্যা ও কৃষি পরামর্শ",
    optimalSunlightTitle: "পর্যাপ্ত সূর্যালোক",
    optimalSunlightDesc: "পাতা ও গাছের স্বাভাবিক বৃদ্ধির জন্য দৈনিক ৬-৮ ঘণ্টা সরাসরি সূর্যালোক নিশ্চিত করুন।",
    soilMoistureTitle: "মাটি ও আর্দ্রতা",
    soilMoistureDesc: "শিকড় পচা রোগ এড়াতে সুনিষ্কাশিত মাটি বজায় রাখুন; শিকড়ের চারপাশে পানি জমতে দেবেন না।",
    scoutingScheduleTitle: "নজরদারি সময়সূচী",
    scoutingScheduleDesc: "রোগ বা পোকার প্রাথমিক লক্ষণ শনাক্ত করতে সপ্তাহে দুইবার পাতার নিচের অংশ ও নিচের ক্যানোপি পরীক্ষা করুন।",
    ipmActionChecklist: "আইপিএম কর্মপরিকল্পনা",
    ipmStep1: "এই অঞ্চলের চারপাশের গাছপালা এবং সংলগ্ন পাতার সংক্রমণ সতর্কতার সাথে পর্যবেক্ষণ করুন",
    ipmStep2: "অতিরিক্ত আক্রান্ত বা পচা পাতা ও ডালপালা সাবধানে কেটে জমি থেকে দূরে সরিয়ে বিনষ্ট করুন",
    ipmStep3: "ফসলের সারির মধ্যে দূরত্ব ও বায়ু চলাচল উন্নত করুন যাতে আর্দ্রতা কম থাকে",
    ipmStep4: "রাসায়নিক বিষের পরিবর্তে প্রথমে নিম তেল বা জৈব বালাইনাশক ব্যবহারকে অগ্রাধিকার দিন",
    ipmStep5: "আক্রমণ মারাত্মক পর্যায়ে পৌঁছালেই শুধুমাত্র অনুমোদিত নির্দিষ্ট কীটনাশক প্রয়োগ করুন",
    ipmStep6: "রোগ নিয়ন্ত্রণ নিশ্চিত করতে আগামী ৩–৫ দিনের মধ্যে পুনরায় স্ক্যান করুন",
    ipmResourceTipDesc: "নির্দিষ্ট অংশে লক্ষণ দেখা দিলে পুরো জমিতে অপ্রয়োজনীয় রাসায়নিক স্প্রে করবেন না। আক্রান্ত স্থানে নির্দিষ্টভাবে বালাইনাশক প্রয়োগ করলে উপকারী পোকা রক্ষা পায় এবং খরচ বাঁচে।",
    nutritionSoilHealth: "পুষ্টি ও মাটির স্বাস্থ্য",
    possibleNutrientDeficiency: "সম্ভাব্য পুষ্টি ঘাটতি",
    foliarImbalance: "পাতার ক্লোরোসিস / পুষ্টি ভারসাম্যহীনতা",
    aiNutritionGuidance: "AI পুষ্টি ও সার পরামর্শ",
    nutritionStep1: "মাটির আর্দ্রতা এবং গাছের শিকড়ের অবস্থা পরীক্ষা করুন",
    nutritionStep2: "অতিরিক্ত রাসায়নিক সার দেওয়ার পূর্বে মাটি পরীক্ষা করে নিশ্চিত হোন",
    nutritionStep3: "সুষম জৈব কম্পোস্ট বা অনুমোদিত হালকা ফলিয়ার স্প্রে প্রয়োগ করুন",
    soilTestRecommendation: "ল্যাব মাটি পরীক্ষার পরামর্শ",
    soilTestBannerText: "পাতার হলুদ ভাব পানি নিষ্কাশন সমস্যা বা শিকড়ের দুর্বলতার কারণেও হতে পারে। ভারী সার প্রয়োগের আগে সরকারি ল্যাব থেকে মাটি পরীক্ষা করে নিশ্চিত হওয়া জরুরি।",
    waterIrrigationTitle: "পানি ও সেচ ব্যবস্থাপনা",
    postponeIrrigationRain: "বৃষ্টির সম্ভাবনা থাকায় সেচ স্থগিত রাখুন।",
    irrigationMayBeNeeded: "পরিমিত সেচ দেওয়ার প্রয়োজন হতে পারে।",
    aiIrrigationGuidance: "AI সেচ পরামর্শ",
    weatherReasonRain: "স্থানীয় পূর্বাভাসে বৃষ্টির সম্ভাবনা কম",
    weatherReasonTemp: "দিনের তাপমাত্রা স্বাভাবিক (~২৮°সে–৩২°সে)",
    weatherReasonMorning: "ভোরে সেচ দিলে পাতায় পানি জমে ছত্রাক সংক্রমণের ঝুঁকি কমে",
    diseaseDiagnosisTitle: "রোগ নির্ণয়",
    pestIntelligenceTitle: "কীটপতঙ্গ তথ্য",
    healthyLeafFoliage: "পাতায় কোনো রোগ বা ক্ষতিকর দাগ দেখা যায়নি। পাতা সতেজ ও সুস্থ।",
    unhealthyLeafFoliage: "পাতায় দৃশ্যমান ক্ষত বা বিবর্ণ দাগ লক্ষ্য করা গেছে।",
    healthyCareStep1: "নিয়মিত ফসলের মাঠ পরিদর্শন চালিয়ে যান",
    healthyCareStep2: "গাছের বৃদ্ধির জন্য পরিমিত সার ও সময়মতো সেচ দিন",
    healthyCareStep3: "কৃষি যন্ত্রপাতি পরিষ্কার ও জীবাণুমুক্ত রাখুন",
    unhealthyCareStep1: "আশেপাশের গাছপালায় রোগ ছড়িয়েছে কি না তা পর্যবেক্ষণ করুন",
    unhealthyCareStep2: "জীবাণু বিস্তার কমাতে অতিরিক্ত আক্রান্ত পাতা ছাঁটাই করুন",
    unhealthyCareStep3: "সঠিক আইপিএম এবং সুরক্ষামূলক বালাইনাশক নির্দেশিকা অনুসরণ করুন",
    // Username & Onboarding
    username: "ব্যবহারকারীর নাম",
    chooseUsername: "আপনার ব্যবহারকারীর নাম নির্বাচন করুন",
    usernameHint: "৩–২০টি অক্ষর, শুধুমাত্র বর্ণ, সংখ্যা এবং আন্ডারস্কোর",
    usernameChecking: "উপলব্ধতা যাচাই করা হচ্ছে...",
    usernameAvailable: "ব্যবহারকারীর নাম উপলব্ধ আছে!",
    usernameTaken: "এই ব্যবহারকারীর নাম ইতিমধ্যে ব্যবহৃত হয়েছে।",
    usernameInvalid: "শুধুমাত্র বর্ণ, সংখ্যা এবং আন্ডারস্কোর (৩–২০ অক্ষর)।",
    usernameRequired: "চালিয়ে যেতে একটি ব্যবহারকারীর নাম লিখুন।",
    onboardingTitle: "প্রায় সম্পন্ন!",
    onboardingSubtext: "আপনার AgriSight প্রোফাইলের জন্য একটি অনন্য ব্যবহারকারীর নাম তৈরি করুন।",
    onboardingContinue: "সংরক্ষণ করুন ও এগিয়ে যান",
    onboardingSkip: "এখনই বাদ দিন",
    // Profile Edit
    editProfile: "প্রোফাইল সম্পাদনা করুন",
    fullName: "পুরো নাম",
    saveProfile: "প্রোফাইল সংরক্ষণ করুন",
    profileUpdated: "প্রোফাইল সফলভাবে আপডেট করা হয়েছে!",
    profileUpdateFailed: "প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    changePassword: "পাসওয়ার্ড পরিবর্তন করুন",
    verifiedAccount: "যাচাইকৃত অ্যাকাউন্ট",
    unverifiedAccount: "অযাচাইকৃত — আপনার ইমেল পরীক্ষা করুন",

    // Field-Centric MVP
    myFields: "আমার জমি",
    addFieldGuided: "জমি যোগ করুন",
    fieldSetupStep1: "আপনার জমি তৈরি করুন",
    fieldSetupStep2: "আপনি এখানে কী ফলাচ্ছেন?",
    fieldSetupStep3: "ফিল্ড নোড সংযুক্ত করুন",
    fieldReady: "আপনার জমি প্রস্তুত",
    fieldNamePlaceholder: "যেমন উত্তর জমি",
    fieldAreaLabel: "এটি কতটুকু বড়?",
    fieldLocationLabel: "এটি কোথায়?",
    useMyLocation: "আমার অবস্থান ব্যবহার করুন",
    selectOnMap: "মানচিত্রে নির্বাচন করুন",
    whatAreYouGrowing: "আপনি এখানে কী ফলাচ্ছেন?",
    cropVarietyOptional: "ফসলের জাত (ঐচ্ছিক)",
    whenDidYouPlant: "আপনি কখন রোপণ করেছেন?",
    skipForNow: "এখন বাদ দিন",
    connectFieldNode: "ফিল্ড নোড সংযুক্ত করুন",
    fieldNodeDescription: "আপনার ফিল্ড নোড মাটি ও পরিবেশের অবস্থা পর্যবেক্ষণ করতে পারে।",
    attachToField: "জমিতে সংযুক্ত করুন",
    openField: "জমি খুলুন",
    fieldHealth: "জমির স্বাস্থ্য",
    fieldHealthGood: "ভালো",
    fieldHealthAttention: "মনোযোগ প্রয়োজন",
    fieldHealthCritical: "সংকটজনক",
    fieldHealthNoData: "ডেটা নেই",
    waitingForFieldData: "যথেষ্ট জমির ডেটার জন্য অপেক্ষা করছে",
    fieldConditions: "জমির অবস্থা",
    soilMoisture: "মাটির আর্দ্রতা",
    temperature: "তাপমাত্রা",
    humidity: "আর্দ্রতা",
    soilPh: "মাটির pH",
    waterFlow: "পানির প্রবাহ",
    notAvailable: "পাওয়া যাচ্ছে না",
    scanLeafCta: "পাতা স্ক্যান করুন",
    checkCropHealth: "আপনার ফসলের স্বাস্থ্য পরীক্ষা করুন",
    agriSightInsight: "AgriSight অন্তর্দৃষ্টি",
    fieldNodeConnected: "সংযুক্ত",
    fieldNodeOffline: "অফলাইন",
    fieldNodeNotAttached: "কোনো ফিল্ড নোড সংযুক্ত নেই",
    fieldNodeLastUpdate: "শেষ আপডেট",
    fieldNodeTroubleshoot: "সমস্যা সমাধান",
    viewSensors: "সেন্সর দেখুন",
    recentScans: "সাম্প্রতিক স্ক্যান",
    fieldHistory: "জমির ইতিহাস",
    fieldAnalytics: "জমির বিশ্লেষণ",
    recommendations: "পরামর্শ",
    askAboutThisField: "এই জমি সম্পর্কে AgriSight-কে জিজ্ঞাসা করুন",
    whichFieldIsThis: "এটি কোন জমি থেকে?",
    cropCheckResult: "ফসল পরীক্ষা",
    whyThisWasFlagged: "এটি কেন চিহ্নিত হয়েছে",
    viewRecommendation: "পরামর্শ দেখুন",
    compareWithPreviousScan: "আগের স্ক্যানের সাথে তুলনা করুন",
    scanSavedToField: "স্ক্যান জমিতে সংরক্ষিত হয়েছে",
    fieldNodeSectionTitle: "ফিল্ড নোড",
    sensorsDetected: "সেন্সর পাওয়া গেছে",
    noSensorData: "কোনো সেন্সর ডেটা পাওয়া যাচ্ছে না",
    yourFieldCanStillBeUsed: "আপনার জমি এখনও ব্যবহার করা যাবে। কিছু লাইভ সেন্সর রিডিং পাওয়া যাচ্ছে না।",
    farmOverview: "খামার সংক্ষিপ্ত চিত্র",
    connectedFieldNodes: "সংযুক্ত ফিল্ড নোড",
    continueSetup: "চালিয়ে যান",
    setupComplete: "সেটআপ সম্পন্ন",
    scanFromField: "পাতা স্ক্যান করুন",
    addCropToField: "ফসল যোগ করুন",
    noCropLinked: "এখনো কোনো ফসল যুক্ত করা হয়নি",
    fieldStage: "পর্যায়",
    noFieldNodeYet: "কোনো ফিল্ড নোড সংযুক্ত নেই",
    connectYourFieldNode: "মাটি ও আবহাওয়া পর্যবেক্ষণের জন্য আপনার ফিল্ড নোড সংযুক্ত করুন।",
    manageMore: "আরও বিবরণ",
  },
};

export function translateDynamicContent(text: string, lang: Language): string {
  if (lang === "en" || !text) return text;

  const normalized = text.trim();

  const knownMappings: Record<string, Record<Language, string>> = {
    // Diagnoses & Conditions
    "Early Blight Detected": {
      en: "Early Blight Detected",
      hi: "अर्ली ब्लाइट का पता चला",
      bn: "আর্লি ব্লাইট ধরা পড়েছে",
    },
    "Early Blight": {
      en: "Early Blight",
      hi: "अर्ली ब्लाइट",
      bn: "আর্লি ব্লাইট",
    },
    "Late Blight": {
      en: "Late Blight",
      hi: "लेट ब्लाइट",
      bn: "লেট ব্লাইট",
    },
    "Leaf Spot": {
      en: "Leaf Spot",
      hi: "पत्ती का धब्बा रोग",
      bn: "পাতার দাগ রোগ",
    },
    "Powdery Mildew": {
      en: "Powdery Mildew",
      hi: "चूर्णिल आसिता (पाउडरी मिल्ड्यू)",
      bn: "পাউডারি মিলডিউ",
    },
    "Healthy Plant": {
      en: "Healthy Plant",
      hi: "स्वस्थ पौधा",
      bn: "সুস্থ গাছ",
    },
    "Healthy": {
      en: "Healthy",
      hi: "स्वस्थ",
      bn: "সুস্থ",
    },
    "Unhealthy": {
      en: "Unhealthy",
      hi: "अस्वस्थ",
      bn: "অসুস্থ",
    },
    "At Risk": {
      en: "At Risk",
      hi: "जोखिम में",
      bn: "ঝুঁকিতে",
    },

    // Severity & Levels
    "High": {
      en: "High",
      hi: "उच्च",
      bn: "উচ্চ",
    },
    "Low": {
      en: "Low",
      hi: "कम",
      bn: "কম",
    },
    "Medium": {
      en: "Medium",
      hi: "मध्यम",
      bn: "মাঝারি",
    },
    "Moderate": {
      en: "Moderate",
      hi: "मध्यम",
      bn: "মাঝারি",
    },
    "Critical": {
      en: "Critical",
      hi: "गंभीर",
      bn: "মারাত্মক",
    },

    // Weather
    "Sunny": {
      en: "Sunny",
      hi: "धूप",
      bn: "রৌদ্রোজ্জ্বল",
    },
    "Humid": {
      en: "Humid",
      hi: "नम",
      bn: "আর্দ্র",
    },
    "Hot": {
      en: "Hot",
      hi: "गर्म",
      bn: "তপ্ত",
    },
    "Rainy": {
      en: "Rainy",
      hi: "बरसात",
      bn: "বৃষ্টিময়",
    },
    "Partly Cloudy": {
      en: "Partly Cloudy",
      hi: "आंशिक रूप से बादल",
      bn: "আংশিক মেঘলা",
    },
    "Clear": {
      en: "Clear",
      hi: "साफ मौसम",
      bn: "পরিষ্কার আকাশ",
    },

    // Insights & Weather interpretations
    "Optimal conditions for growth.": {
      en: "Optimal conditions for growth.",
      hi: "विकास के लिए अनुकूल परिस्थितियां।",
      bn: "বৃদ্ধির জন্য অনুকূল পরিস্থিতি।",
    },
    "High humidity detected. Increased risk of fungal diseases like Early Blight.": {
      en: "High humidity detected. Increased risk of fungal diseases like Early Blight.",
      hi: "अत्यधिक नमी का पता चला। अर्ली ब्लाइट जैसे फंगल रोगों का खतरा बढ़ गया है।",
      bn: "অতিরিক্ত আর্দ্রতা শনাক্ত করা হয়েছে। আর্লি ব্লাইটের মতো ছত্রাকজনিত রোগের ঝুঁকি বেড়েছে।",
    },
    "High heat. Consider increasing irrigation frequency in the early morning.": {
      en: "High heat. Consider increasing irrigation frequency in the early morning.",
      hi: "अत्यधिक गर्मी। सुबह जल्दी सिंचाई की आवृत्ति बढ़ाने पर विचार करें।",
      bn: "অত্যধিক তাপ। ভোরে সেচের পরিমাণ বাড়ানোর কথা বিবেচনা করুন।",
    },
    "Rain expected. Delay any planned fertilizer or pesticide spraying.": {
      en: "Rain expected. Delay any planned fertilizer or pesticide spraying.",
      hi: "बारिश की उम्मीद है। किसी भी नियोजित उर्वरक या कीटनाशक छिड़काव में देरी करें।",
      bn: "বৃষ্টির সম্ভাবনা রয়েছে। সার বা কীটনাশক স্প্রে করার পরিকল্পনা আপাতত স্থগিত রাখুন।",
    },

    // Progression labels
    "Improving": {
      en: "Improving",
      hi: "सुधार हो रहा है",
      bn: "উন্নতি হচ্ছে",
    },
    "Worsening": {
      en: "Worsening",
      hi: "बिगड़ रहा है",
      bn: "অবনতি হচ্ছে",
    },
    "Stable": {
      en: "Stable",
      hi: "स्थिर",
      bn: "স্থিতিশীল",
    },
    "Healthy & Stable": {
      en: "Healthy & Stable",
      hi: "स्वस्थ और स्थिर",
      bn: "সুস্থ ও স্থিতিশীল",
    },
    "Persistent Condition": {
      en: "Persistent Condition",
      hi: "लगातार स्थिति",
      bn: "স্থায়ী সংক্রমণ",
    },
    "First Scan for this Crop": {
      en: "First Scan for this Crop",
      hi: "इस फसल के लिए पहला स्कैन",
      bn: "এই ফসলের জন্য প্রথম স্ক্যান",
    },

    // ── Common Agricultural Crops ──
    "Rice": { en: "Rice", hi: "धान (चावल)", bn: "ধান" },
    "Paddy": { en: "Paddy", hi: "धान", bn: "ধান" },
    "Wheat": { en: "Wheat", hi: "गेहूं", bn: "গম" },
    "Tomato": { en: "Tomato", hi: "टमाटर", bn: "টমেটো" },
    "Potato": { en: "Potato", hi: "आलू", bn: "আলু" },
    "Maize": { en: "Maize", hi: "मक्का", bn: "ভুট্টা" },
    "Corn": { en: "Corn", hi: "मक्का", bn: "ভুট্টা" },
    "Cotton": { en: "Cotton", hi: "कपास", bn: "তুলা" },
    "Chili": { en: "Chili", hi: "मिर्च", bn: "মরিচ" },
    "Chilli": { en: "Chilli", hi: "मिर्च", bn: "মরিচ" },
    "Mustard": { en: "Mustard", hi: "सरसों", bn: "সরিষা" },
    "Sugarcane": { en: "Sugarcane", hi: "गन्ना", bn: "আখ" },
    "Onion": { en: "Onion", hi: "प्याज", bn: "পেঁয়াজ" },
    "Eggplant": { en: "Eggplant", hi: "बैंगन", bn: "বেগুন" },
    "Brinjal": { en: "Brinjal", hi: "बैंगन", bn: "বেগুন" },
    "Soybean": { en: "Soybean", hi: "सोयाबीन", bn: "সয়াবিন" },
    "Groundnut": { en: "Groundnut", hi: "मूंगफली", bn: "চিনাবাদাম" },
    "Peanut": { en: "Peanut", hi: "मूंगफली", bn: "চিনাবাদাম" },
    "Tea": { en: "Tea", hi: "चाय", bn: "চা" },
    "Jute": { en: "Jute", hi: "पटसन (जूट)", bn: "পাট" },
    "Mango": { en: "Mango", hi: "आम", bn: "আম" },
    "Banana": { en: "Banana", hi: "केला", bn: "কলা" },
    "Apple": { en: "Apple", hi: "सेब", bn: "আপেল" },
    "Guava": { en: "Guava", hi: "अमरूद", bn: "পেয়ারা" },
    "Pulses": { en: "Pulses", hi: "दालें", bn: "ডাল" },
    "Chickpea": { en: "Chickpea", hi: "चना", bn: "ছোলা" },
    "Gram": { en: "Gram", hi: "चना", bn: "ছোলা" },
    "Lentil": { en: "Lentil", hi: "मसूर", bn: "মসুর ডাল" },

    // ── Common Diseases & Pathologies ──
    "Cedar-Apple Rust": { en: "Cedar-Apple Rust", hi: "सीडर-एप्पल रस्ट", bn: "সিডার-অ্যাপল রাস্ট (মরিচা)" },
    "Blossom End Rot": { en: "Blossom End Rot", hi: "ब्लॉसम एंड रॉट (फल सड़न)", bn: "ব্লসম এন্ড রট (পচা রোগ)" },
    "Possible Blossom End Rot": { en: "Possible Blossom End Rot", hi: "संभावित ब्लॉसम एंड रॉट", bn: "সম্ভাব্য ব্লসম এন্ড রট" },
    "Calcium": { en: "Calcium", hi: "कैल्शियम", bn: "ক্যালসিয়াম" },
    "Calcium (Ca)": { en: "Calcium (Ca)", hi: "कैल्शियम (Ca)", bn: "ক্যালসিয়াম (Ca)" },
    "Septoria Leaf Spot": { en: "Septoria Leaf Spot", hi: "सेप्टोरिया पत्ती धब्बा रोग", bn: "সেপ্টোরিয়া পাতার দাগ" },
    "Bacterial Spot": { en: "Bacterial Spot", hi: "बैक्टीरियल स्पॉट", bn: "ব্যাকটেরিয়াল দাগ" },
    "Target Spot": { en: "Target Spot", hi: "टारगेट स्पॉट", bn: "টার্গেট স্পট" },
    "Leaf Mold": { en: "Leaf Mold", hi: "लीफ मोल्ड (फफूंद)", bn: "লিফ মোল্ড" },
    "Tomato Yellow Leaf Curl": { en: "Tomato Yellow Leaf Curl", hi: "टमाटर पीला पत्ती मरोड़ रोग", bn: "টমেটো হলুদ পাতা কোঁকড়ানো রোগ" },
    "Juniper": { en: "Juniper", hi: "जूनिपर", bn: "জুনিপার" },
    "Juniper (Conifer)": { en: "Juniper (Conifer)", hi: "जूनिपर (शंकुवृक्ष)", bn: "জুনিপার (কনিফার)" },
    "Conifer": { en: "Conifer", hi: "शंकुधारी", bn: "কনিফার (শঙ্কু গাছ)" },
    "Bacterial Leaf Blight": { en: "Bacterial Leaf Blight", hi: "बैक्टीरियल लीफ ब्लाइट", bn: "ব্যাকটেরিয়াল লিফ ব্লাইট" },
    "Blast": { en: "Blast", hi: "ब्लास्ट रोग", bn: "ব্লাস্ট রোগ" },
    "Rice Blast": { en: "Rice Blast", hi: "धान का ब्लास्ट रोग", bn: "ধানের ব্লাস্ট রোগ" },
    "Sheath Blight": { en: "Sheath Blight", hi: "शीथ ब्लाइट", bn: "শীথ ব্লাইট" },
    "Brown Spot": { en: "Brown Spot", hi: "भूरा धब्बा रोग", bn: "বাদামী দাগ রোগ" },
    "Downy Mildew": { en: "Downy Mildew", hi: "डाउनी मिल्ड्यू", bn: "ডাউনি মিলডিউ" },
    "Rust": { en: "Rust", hi: "रस्ट (गेरूई)", bn: "মরিচা রোগ (রাস্ট)" },
    "Yellow Rust": { en: "Yellow Rust", hi: "पीला रस्ट (पीला गेरूई)", bn: "হলুদ মরিচা রোগ" },
    "Brown Rust": { en: "Brown Rust", hi: "भूरा रस्ट", bn: "বাদামী মরিচা রোগ" },
    "Mosaic Virus": { en: "Mosaic Virus", hi: "मोज़ेक वायरस", bn: "মোজাইক ভাইরাস" },
    "Leaf Curl": { en: "Leaf Curl", hi: "पत्ती मरोड़ रोग (लीफ कर्ल)", bn: "পাতা কোঁকড়ানো রোগ" },
    "Anthracnose": { en: "Anthracnose", hi: "एन्थ्रेक्नोज", bn: "অ্যানথ্রাকনোজ" },
    "Wilt": { en: "Wilt", hi: "उकठा रोग (विल्ट)", bn: "উইল্ট রোগ" },
    "Fusarium Wilt": { en: "Fusarium Wilt", hi: "फ्यूजेरियम विल्ट", bn: "ফিউসারিয়াম উইল্ট" },
    "Damping Off": { en: "Damping Off", hi: "डैम्पिंग ऑफ", bn: "ড্যাম্পিং অফ" },
    "Black Rot": { en: "Black Rot", hi: "ब्लैक रॉट (काला सड़न)", bn: "ব্ল্যাক রট" },
    "Root Rot": { en: "Root Rot", hi: "जड़ सड़न", bn: "শিকড় পচা রোগ" },
    "Stem Rot": { en: "Stem Rot", hi: "तना सड़न", bn: "কান্ড পচা রোগ" },
    "Citrus Canker": { en: "Citrus Canker", hi: "सिट्रस कैंकर", bn: "সাইট্রাস ক্যাঙ্কার" },
    "Scab": { en: "Scab", hi: "स्कैब", bn: "স্ক্যাব" },
    "Diagnosis Uncertain": { en: "Diagnosis Uncertain", hi: "अनिश्चित निदान", bn: "অনিশ্চিত নির্ণয়" },
    "Inspection Pending": { en: "Inspection Pending", hi: "निरीक्षण लंबित", bn: "পরিদর্শন বাকি" },
    "Invalid Crop Image": { en: "Invalid Crop Image", hi: "अमान्य फसल छवि", bn: "অবৈধ ফসলের ছবি" },
    "Non-Crop Image": { en: "Non-Crop Image", hi: "गैर-फसल छवि", bn: "অকৃষি ছবি" },

    // ── Common Pests ──
    "Aphids": { en: "Aphids", hi: "एफिड्स (माहू)", bn: "জাবপোকা" },
    "Aphid": { en: "Aphid", hi: "एफिड (माहू)", bn: "জাবপোকা" },
    "Stem Borer": { en: "Stem Borer", hi: "तना छेदक", bn: "মাজরা পোকা" },
    "Yellow Stem Borer": { en: "Yellow Stem Borer", hi: "पीला तना छेदक", bn: "হলুদ মাজরা পোকা" },
    "Whiteflies": { en: "Whiteflies", hi: "सफेद मक्खी", bn: "সাদা মাছি" },
    "Whitefly": { en: "Whitefly", hi: "सफेद मक्खी", bn: "সাদা মাছি" },
    "Thrips": { en: "Thrips", hi: "थ्रिप्स", bn: "থ্রিপস" },
    "Armyworm": { en: "Armyworm", hi: "आर्मीवर्म", bn: "আর্মিওয়ার্ম" },
    "Fall Armyworm": { en: "Fall Armyworm", hi: "फॉल आर्मीवर्म", bn: "ফল আর্মিওয়ার্ম" },
    "Leafminer": { en: "Leafminer", hi: "लीफ माइनर", bn: "লিফমাইনার" },
    "Spider Mites": { en: "Spider Mites", hi: "मकड़ी के घुन (माइट्स)", bn: "লাল মাকড় (মাইট)" },
    "Mites": { en: "Mites", hi: "माइट्स (घुन)", bn: "মাকড় (মাইট)" },
    "Leafhopper": { en: "Leafhopper", hi: "फुदका (लीफहॉपर)", bn: "পাতা ফড়িং" },
    "Brown Plant Hopper": { en: "Brown Plant Hopper", hi: "भूरा फुदका (BPH)", bn: "বাদামী ঘাসফড়িং (বিপিএইচ)" },
    "Cutworm": { en: "Cutworm", hi: "कटवर्म", bn: "কাটুই পোকা" },
    "Bollworm": { en: "Bollworm", hi: "सुंडी (बॉलवर्म)", bn: "বোলওয়ার্ম" },
    "Mealybug": { en: "Mealybug", hi: "मिलीबग", bn: "মিলিবাগ" },
    "Fruit Borer": { en: "Fruit Borer", hi: "फल छेदक", bn: "ফল ছিদ্রকারী পোকা" },
    "Pod Borer": { en: "Pod Borer", hi: "फली छेदक", bn: "শুঁটি ছিদ্রকারী পোকা" },
    "Termites": { en: "Termites", hi: "दीमक", bn: "উইপোকা" },
    "Termite": { en: "Termite", hi: "दीमक", bn: "উইপোকা" },
    "Grasshopper": { en: "Grasshopper", hi: "टिड्डा", bn: "ঘাসফড়িং" },
    "Weevil": { en: "Weevil", hi: "घुन (वीविल)", bn: "গুঁইপোকা (উইভিল)" },

    // ── Nutrient Deficiencies ──
    "Nitrogen Deficiency": { en: "Nitrogen Deficiency", hi: "नाइट्रोजन की कमी", bn: "নাইট্রোজেনের ঘাটতি" },
    "Phosphorus Deficiency": { en: "Phosphorus Deficiency", hi: "फास्फोरस की कमी", bn: "ফসফরাসের ঘাটতি" },
    "Potassium Deficiency": { en: "Potassium Deficiency", hi: "पोटैशियम की कमी", bn: "পটাসিয়ামের ঘাটতি" },
    "Zinc Deficiency": { en: "Zinc Deficiency", hi: "जिंक (जस्ता) की कमी", bn: "দস্তার ঘাটতি" },
    "Iron Deficiency": { en: "Iron Deficiency", hi: "आयरन (लोहा) की कमी", bn: "লোহার ঘাটতি" },
    "Magnesium Deficiency": { en: "Magnesium Deficiency", hi: "मैग्नीशियम की कमी", bn: "ম্যাগনেসিয়ামের ঘাটতি" },
    "Calcium Deficiency": { en: "Calcium Deficiency", hi: "कैल्शियम की कमी", bn: "ক্যালসিয়ামের ঘাটতি" },
    "Boron Deficiency": { en: "Boron Deficiency", hi: "बोरॉन की कमी", bn: "বোরনের ঘাটতি" },
    "Sulfur Deficiency": { en: "Sulfur Deficiency", hi: "सल्फर (गंधक) की कमी", bn: "সালফারের ঘাটতি" },
    "Micronutrient Deficiency": { en: "Micronutrient Deficiency", hi: "सूक्ष्म पोषक तत्वों की कमी", bn: "অণুখাদ্যের ঘাটতি" },

    // ── Growth Stages ──
    "Germination": { en: "Germination", hi: "अंकुरण", bn: "অঙ্কুরোদ্গম" },
    "Seedling": { en: "Seedling", hi: "अंकुर (पौध)", bn: "চারা পর্যায়" },
    "Tillering": { en: "Tillering", hi: "कल्ले फूटना (टिलरिंग)", bn: "কুশি পর্যায়" },
    "Vegetative": { en: "Vegetative", hi: "वानस्पतिक वृद्धि", bn: "বৃদ্ধি পর্যায়" },
    "Panicle Initiation": { en: "Panicle Initiation", hi: "बाली निकलना", bn: "শিষ গঠন পর্যায়" },
    "Flowering": { en: "Flowering", hi: "फूल आना", bn: "ফুল ফোটার পর্যায়" },
    "Fruiting": { en: "Fruiting", hi: "फल लगना", bn: "ফল ধরার পর্যায়" },
    "Pod Development": { en: "Pod Development", hi: "फली का विकास", bn: "শুঁটি গঠন পর্যায়" },
    "Ripening": { en: "Ripening", hi: "पकना", bn: "পাকা পর্যায়" },
    "Maturity": { en: "Maturity", hi: "परिपक्वता", bn: "পূর্ণাঙ্গ পর্যায়" },
    "Harvest": { en: "Harvest", hi: "कटाई", bn: "ফসল তোলা" },
    "Harvesting": { en: "Harvesting", hi: "कटाई", bn: "ফসল সংগ্রহ" },

    // ── Soil Types ──
    "Alluvial": { en: "Alluvial", hi: "जलोढ़ मिट्टी", bn: "পলি মাটি" },
    "Clay Loam": { en: "Clay Loam", hi: "चिकनी दोमट मिट्टी", bn: "এটেল দোআঁশ মাটি" },
    "Sandy Loam": { en: "Sandy Loam", hi: "बलुई दोमट मिट्टी", bn: "বেলে দোআঁশ মাটি" },
    "Red Soil": { en: "Red Soil", hi: "लाल मिट्टी", bn: "লাল মাটি" },
    "Black Soil": { en: "Black Soil", hi: "काली मिट्टी (रेगुर)", bn: "কালো মাটি" },
    "Silt Loam": { en: "Silt Loam", hi: "गाद दोमट मिट्टी", bn: "পলিময় দোআঁশ মাটি" },
    "Clay Soil": { en: "Clay Soil", hi: "चिकनी मिट्टी", bn: "এঁটেল মাটি" },
    "Sandy Soil": { en: "Sandy Soil", hi: "बलुई मिट्टी", bn: "বেলে মাটি" },
    "Loam": { en: "Loam", hi: "दोमट मिट्टी", bn: "দোআঁশ মাটি" },

    // ── Irrigation Types ──
    "Drip": { en: "Drip", hi: "ड्रिप (टपक) सिंचाई", bn: "ড্রিপ (বিন্দু) সেচ" },
    "Drip Irrigation": { en: "Drip Irrigation", hi: "ड्रिप सिंचाई", bn: "ড্রিপ সেচ" },
    "Sprinkler": { en: "Sprinkler", hi: "स्प्रिंकलर (फव्वारा) सिंचाई", bn: "স্প্রিংকলার (ঝরনা) সেচ" },
    "Sprinkler Irrigation": { en: "Sprinkler Irrigation", hi: "फव्वारा सिंचाई", bn: "স্প্রিংকলার সেচ" },
    "Flood": { en: "Flood", hi: "जलप्लावन (फ्लड) सिंचाई", bn: "প্লাবন সেচ" },
    "Flood Irrigation": { en: "Flood Irrigation", hi: "बाढ़ सिंचाई", bn: "প্লাবন সেচ" },
    "Rainfed": { en: "Rainfed", hi: "वर्षा-आधारित", bn: "বৃষ্টি-নির্ভর" },
    "Canal": { en: "Canal", hi: "नहर सिंचाई", bn: "খাল সেচ" },
    "Furrow": { en: "Furrow", hi: "नाली सिंचाई", bn: "নালা সেচ" },
    "Flood / Furrow": { en: "Flood / Furrow", hi: "बाढ़ / कुंड सिंचाई", bn: "বন্যা / নালা সেচ" },
    "Manual": { en: "Manual", hi: "हस्तचालित (हाथ से)", bn: "হাতে সেচ" },

    // ── Weather & Atmospheric Conditions ──
    "Today": { en: "Today", hi: "आज", bn: "আজ" },
    "Sun": { en: "Sun", hi: "रवि", bn: "রবি" },
    "Mon": { en: "Mon", hi: "सोम", bn: "সোম" },
    "Tue": { en: "Tue", hi: "मंगल", bn: "মঙ্গল" },
    "Wed": { en: "Wed", hi: "बुध", bn: "বুধ" },
    "Thu": { en: "Thu", hi: "गुरु", bn: "বৃহস্পতি" },
    "Fri": { en: "Fri", hi: "शुक्र", bn: "শুক্র" },
    "Sat": { en: "Sat", hi: "शनि", bn: "শনি" },
    "Heat Risk": { en: "Heat Risk", hi: "ताप जोखिम", bn: "ताप ঝুঁকি" },
    "Rain Risk": { en: "Rain Risk", hi: "बारिश जोखिम", bn: "বৃষ্টির ঝুঁকি" },
    "Spray Wind": { en: "Spray Wind", hi: "छिड़काव हवा", bn: "স্প্রে বাতাস" },
    "Fungal Risk": { en: "Fungal Risk", hi: "फफूंद जोखिम", bn: "ছত্রাক ঝুঁকি" },
    "Fungal Pressure": { en: "Fungal Pressure", hi: "फफूंद दबाव", bn: "ছত্রাক চাপ" },
    "Storm / Severe": { en: "Storm / Severe", hi: "आंधी / गंभीर", bn: "ঝড় / দুর্যোগ" },
    "Clear Sky": { en: "Clear Sky", hi: "साफ आसमान", bn: "পরিষ্কার আকাশ" },
    "Mainly Clear": { en: "Mainly Clear", hi: "मुख्यतः साफ", bn: "প্রধানত পরিষ্কার" },
    "High Humidity": { en: "High Humidity", hi: "उच्च नमी (आर्द्रता)", bn: "উচ্চ আর্দ্রতা" },
    "Dense Fog": { en: "Dense Fog", hi: "घना कोहरा", bn: "ঘন কুয়াশা" },
    "Overcast": { en: "Overcast", hi: "घने बादल (बदली)", bn: "মেঘাচ্ছন্ন" },
    "Cloudy": { en: "Cloudy", hi: "बादल छाए हुए", bn: "মেঘলা" },
    "Foggy / Mist": { en: "Foggy / Mist", hi: "कोहरा / धुंध", bn: "কুয়াশাচ্ছন্ন" },
    "Light Drizzle": { en: "Light Drizzle", hi: "हल्की बूंदाबांदी", bn: "হালকা গুঁড়ি গুঁড়ি বৃষ্টি" },
    "Rain Showers": { en: "Rain Showers", hi: "बारिश की फुहारें", bn: "বৃষ্টির সম্ভাবনা" },
    "Snow / Hail": { en: "Snow / Hail", hi: "ओले / बर्फबारी", bn: "শিলাবৃষ্টি / তুষার" },
    "Heavy Rain Showers": { en: "Heavy Rain Showers", hi: "भारी बारिश", bn: "ভারী বৃষ্টিপাত" },
    "Thunderstorm Alert": { en: "Thunderstorm Alert", hi: "आंधी-तूफान की चेतावनी", bn: "বজ্রঝড়ের সতর্কতা" },

    // ── Additional Soil Types ──
    "Red / Laterite": { en: "Red / Laterite", hi: "लाल / लैटेराइट मिट्टी", bn: "লাল / ল্যাটেরাইট মাটি" },
    "Clay Heavy": { en: "Clay Heavy", hi: "भारी चिकनी मिट्टी", bn: "ভারী এঁটেল মাটি" },
    "Clay": { en: "Clay", hi: "चिकनी मिट्टी", bn: "এঁটেল মাটি" },

    // ── Additional Irrigation Types ──
    "Sprinkler Overhead": { en: "Sprinkler Overhead", hi: "ओवरहेड फव्वारा सिंचाई", bn: "ওভারহেড স্প্রিংকলার সেচ" },
    "Furrow / Channel": { en: "Furrow / Channel", hi: "नाली / चैनल सिंचाई", bn: "নালা / খাল সেচ" },
    "Furrow / Flood": { en: "Furrow / Flood", hi: "कुंड / बाढ़ सिंचाई", bn: "নালা / প্লাবন সেচ" },
    "Rainfed (Natural)": { en: "Rainfed (Natural)", hi: "प्राकृतिक वर्षा-आधारित", bn: "প্রাকৃতিক বৃষ্টি-নির্ভর" },

    // ── Farm Plots & Field Entities ──
    "Master Test Field": { en: "Master Test Field", hi: "मास्टर टेस्ट खेत", bn: "মাস্টার টেস্ট জমি" },
    "Green Meadow": { en: "Green Meadow", hi: "हरा चारागाह (ग्रीन मीडो)", bn: "সবুজ প্রান্তর (গ্রিন মেডো)" },
    "North Field": { en: "North Field", hi: "उत्तरी खेत", bn: "উত্তর জমি" },
    "East Terraces": { en: "East Terraces", hi: "पूर्वी सीढ़ीदार खेत", bn: "পূর্ব ধাপ জমি" },
    "Polyhouse Block B": { en: "Polyhouse Block B", hi: "पॉलीहाउस ब्लॉक बी", bn: "পলিহাউস ব্লক বি" },
    "South Orchard": { en: "South Orchard", hi: "दक्षिणी बाग", bn: "দক্ষিণ ফলের বাগান" },
    "Main Plot": { en: "Main Plot", hi: "मुख्य भूखंड", bn: "মূল প্লট" },
    "Plot 9": { en: "Plot 9", hi: "प्लॉट ९", bn: "প্লট ৯" },
    "Plot Location": { en: "Plot Location", hi: "भूखंड स्थान", bn: "প্লটের অবস্থান" },
    "Field Sector": { en: "Field Sector", hi: "खेत प्रभाग", bn: "জমির সেক্টর" },
    "Field Crops": { en: "Field Crops", hi: "खेत की फसलें", bn: "জমির ফসল" },
    "Assigned Crop": { en: "Assigned Crop", hi: "निर्धारित फसल", bn: "নির্ধারিত ফসল" },
    "No assigned field": { en: "No assigned field", hi: "कोई खेत निर्धारित नहीं", bn: "কোনো জমি নির্ধারিত নেই" },
    "No assigned crop": { en: "No assigned crop", hi: "कोई फसल निर्धारित नहीं", bn: "কোনো ফসল নির্ধারিত নেই" },
    "Kolkata, WB": { en: "Kolkata, WB", hi: "कोलकाता, पश्चिम बंगाल", bn: "কলকাতা, পশ্চিমবঙ্গ" },
    "Kolkata": { en: "Kolkata", hi: "कोलकाता", bn: "কলকাতা" },
    "Regional Farm": { en: "Regional Farm", hi: "क्षेत्रीय खेत", bn: "আঞ্চলিক খামার" },
    "Farm Location": { en: "Farm Location", hi: "खेत स्थान", bn: "খামারের অবস্থান" },

    // ── Quadrants & Zones ──
    "Quadrant A · North": { en: "Quadrant A · North", hi: "चतुर्भुज A · उत्तर", bn: "চতুর্থাংশ ক · উত্তর" },
    "Quadrant B · East": { en: "Quadrant B · East", hi: "चतुर्भुज B · पूर्व", bn: "চতুর্থাংশ খ · পূর্ব" },
    "Quadrant C · South": { en: "Quadrant C · South", hi: "चतुर्भुज C · दक्षिण", bn: "চতুর্থাংশ গ · দক্ষিণ" },
    "Quadrant D · West": { en: "Quadrant D · West", hi: "चतुर्भुज D · पश्चिम", bn: "চতুর্থাংশ ঘ · পশ্চিম" },
    "Zone A (North)": { en: "Zone A (North)", hi: "क्षेत्र A (उत्तर)", bn: "অঞ্চল ক (উত্তর)" },
    "Zone B (East)": { en: "Zone B (East)", hi: "क्षेत्र B (पूर्व)", bn: "অঞ্চল খ (পূর্ব)" },
    "Zone C (South)": { en: "Zone C (South)", hi: "क्षेत्र C (दक्षिण)", bn: "অঞ্চল গ (দক্ষিণ)" },
    "Zone D (West)": { en: "Zone D (West)", hi: "क्षेत्र D (पश्चिम)", bn: "অঞ্চল ঘ (পশ্চিম)" },
    "Zone A": { en: "Zone A", hi: "क्षेत्र A", bn: "অঞ্চল ক" },
    "Zone B": { en: "Zone B", hi: "क्षेत्र B", bn: "অঞ্চল খ" },
    "Zone C": { en: "Zone C", hi: "क्षेत्र C", bn: "অঞ্চল গ" },
    "Zone D": { en: "Zone D", hi: "क्षेत्र D", bn: "অঞ্চল ঘ" },
    "Northwest Quad": { en: "Northwest Quad", hi: "उत्तर-पश्चिम क्षेत्र", bn: "উত্তর-পশ্চিম চতুর্থাংশ" },
    "Northeast Quad": { en: "Northeast Quad", hi: "उत्तर-पूर्व क्षेत्र", bn: "উত্তর-পূর্ব চতুর্থাংশ" },
    "Southwest Quad": { en: "Southwest Quad", hi: "दक्षिण-पश्चिम क्षेत्र", bn: "দক্ষিণ-পশ্চিম চতুর্থাংশ" },
    "Southeast Quad": { en: "Southeast Quad", hi: "दक्षिण-पूर्व क्षेत्र", bn: "দক্ষিণ-পূর্ব চতুর্থাংশ" },

    // ── Statuses & Modifiers ──
    "UNHEALTHY": { en: "UNHEALTHY", hi: "अस्वस्थ", bn: "অসুস্থ" },
    "HEALTHY": { en: "HEALTHY", hi: "स्वस्थ", bn: "সুস্থ" },
    "AT RISK": { en: "AT RISK", hi: "जोखिम में", bn: "ঝুঁকিপূর্ণ" },
    "Low Risk": { en: "Low Risk", hi: "कम जोखिम", bn: "কম ঝুঁকি" },
    "Medium Risk": { en: "Medium Risk", hi: "मध्यम जोखिम", bn: "মাঝারি ঝুঁকি" },
    "High Risk": { en: "High Risk", hi: "उच्च जोखिम", bn: "উচ্চ ঝুঁকি" },
    "Critical Risk": { en: "Critical Risk", hi: "गंभीर जोखिम", bn: "মারাত্মক ঝুঁকি" },
    "Main Field": { en: "Main Field", hi: "मुख्य खेत", bn: "মূল জমি" },
    "Field Location": { en: "Field Location", hi: "खेत स्थान", bn: "জমির অবস্থান" },
    "Visual AI Classification": { en: "Visual AI Classification", hi: "विजुअल एआई पहचान", bn: "ভিজ্যুয়াল এআই শনাক্তকরণ" },
    "Optimal": { en: "Optimal", hi: "अनुकूल", bn: "অনুকূল" },
    "Active": { en: "Active", hi: "सक्रिय", bn: "সক্রিয়" },
    "Active Growth": { en: "Active Growth", hi: "सक्रिय वृद्धि", bn: "সক্রিয় বৃদ্ধি" },
    "Warning": { en: "Warning", hi: "चेतावनी", bn: "সতর্কতা" },
    "Alert": { en: "Alert", hi: "अलर्ट", bn: "সতর্কতা" },
    "Severe": { en: "Severe", hi: "अति गंभीर", bn: "মারাত্মক" },
    "Unknown": { en: "Unknown", hi: "अज्ञात", bn: "অজানা" },
    "Pending": { en: "Pending", hi: "लंबित", bn: "অপেক্ষমাণ" },
    "Completed": { en: "Completed", hi: "पूर्ण", bn: "সম্পন্ন" },
    "In Progress": { en: "In Progress", hi: "प्रगति पर", bn: "চলমান" },
    "Ready": { en: "Ready", hi: "तैयार", bn: "প্রস্তুত" },
    "Farmer": { en: "Farmer", hi: "किसान", bn: "কৃষক" },

    // ── Crop Varieties & Seeded Names ──
    "Wheat (गेहूं)": { en: "Wheat", hi: "गेहूं", bn: "গম" },
    "Rice (ধান)": { en: "Rice", hi: "धान", bn: "ধান" },
    "Tomato (टमाटर)": { en: "Tomato", hi: "टमाटर", bn: "টমেটো" },
    "Sharbati Gold": { en: "Sharbati Gold", hi: "शरबती गोल्ड", bn: "শরবতী গোল্ড" },
    "Swarna Masuri": { en: "Swarna Masuri", hi: "स्वर्णा मसूरी", bn: "স্বর্ণা মসুরি" },
    "Pusa Ruby": { en: "Pusa Ruby", hi: "पूसा रूबी", bn: "পূসা রুবি" },
    "Basmati": { en: "Basmati", hi: "बासमती", bn: "বাসমতী" },
    "IR64": { en: "IR64", hi: "आईआर ६४", bn: "আইআর৬৪" },
    "Sonalika": { en: "Sonalika", hi: "सोनालिका", bn: "সোনালিকা" },

    // ── Agronomic Action Types & Interventions ──
    "Fungicide Spray": { en: "Fungicide Spray", hi: "फफूंदनाशक छिड़काव", bn: "ছত্রাকনাশক স্প্রে" },
    "Pesticide Spray": { en: "Pesticide Spray", hi: "कीटनाशक छिड़काव", bn: "কীটনাশক স্প্রে" },
    "Bio-Pesticide Spray": { en: "Bio-Pesticide Spray", hi: "जैविक कीटनाशक छिड़काव", bn: "জৈব কীটনাশক স্প্রে" },
    "Neem Oil Application": { en: "Neem Oil Application", hi: "नीम तेल का प्रयोग", bn: "নিম তেলের প্রয়োগ" },
    "Fertilizer Application": { en: "Fertilizer Application", hi: "उर्वरक प्रयोग", bn: "সার প্রয়োগ" },
    "Irrigation Adjustment": { en: "Irrigation Adjustment", hi: "सिंचाई समायोजन", bn: "সেচ সমন্বয়" },
    "Pruning Infected Leaves": { en: "Pruning Infected Leaves", hi: "संक्रमित पत्तियों की छंटाई", bn: "আক্রান্ত পাতা ছাঁটাই" },
    "Weeding & Soil Aeration": { en: "Weeding & Soil Aeration", hi: "निराई-गुड़ाई", bn: "আগাছা দমন ও মাটি নিড়ানি" },
    "Soil Treatment": { en: "Soil Treatment", hi: "मृदा उपचार", bn: "মাটি শোধন" },
    "Inspection": { en: "Inspection", hi: "खेत निरीक्षण", bn: "মাঠ পরিদর্শন" },
    "Fertilizer": { en: "Fertilizer", hi: "उर्वरक", bn: "সার প্রয়োগ" },
    "Pesticide": { en: "Pesticide", hi: "कीटनाशक", bn: "কীটনাশক" },
    "Irrigation": { en: "Irrigation", hi: "सिंचाई", bn: "সেচ" },
    "Pruning": { en: "Pruning", hi: "छंटाई", bn: "ছাঁটাই" },
    "Weeding": { en: "Weeding", hi: "निराई", bn: "আগাছা নিড়ানি" },
  };

  const exactMatch = knownMappings[normalized];
  if (exactMatch && exactMatch[lang]) {
    return exactMatch[lang];
  }

  // Fallback direct case-insensitive check
  for (const [key, map] of Object.entries(knownMappings)) {
    if (key.toLowerCase() === normalized.toLowerCase() && map[lang]) {
      return map[lang];
    }
  }

  // Prefix pattern for "Possible <X>" / "संभावित <X>" / "সম্ভাব্য <X>"
  const possibleMatch = normalized.match(/^(?:possible|संभावित|সম্ভাব্য)\s+(.+)$/i);
  if (possibleMatch) {
    const inner = possibleMatch[1].trim();
    const translatedInner = translateDynamicContent(inner, lang);
    return lang === "bn" ? `সম্ভাব্য ${translatedInner}` : `संभावित ${translatedInner}`;
  }

  // Suffix pattern for "<Crop> Profile" e.g. "Tomato Profile"
  const profileMatch = normalized.match(/^(.+)\s+profile$/i);
  if (profileMatch) {
    const crop = profileMatch[1].trim();
    const translatedCrop = translateDynamicContent(crop, lang);
    return lang === "bn" ? `${translatedCrop} বিবরণ` : `${translatedCrop} विवरण`;
  }

  // Regex pattern for Plot <number> e.g. "Plot 9"
  const plotMatch = normalized.match(/^plot\s*([0-9]+)$/i);
  if (plotMatch) {
    const num = plotMatch[1];
    return lang === "bn"
      ? `প্লট ${formatLocalizedNumber(num, "bn")}`
      : `प्लॉट ${formatLocalizedNumber(num, "hi")}`;
  }

  // Regex pattern for Field <number> e.g. "Field 2"
  const fieldMatch = normalized.match(/^field\s*([0-9]+)$/i);
  if (fieldMatch) {
    const num = fieldMatch[1];
    return lang === "bn"
      ? `জমি ${formatLocalizedNumber(num, "bn")}`
      : `खेत ${formatLocalizedNumber(num, "hi")}`;
  }

  // Regex pattern for Sector <number>
  const sectorMatch = normalized.match(/^sector\s*([0-9]+)$/i);
  if (sectorMatch) {
    const num = sectorMatch[1];
    return lang === "bn"
      ? `সেক্টর ${formatLocalizedNumber(num, "bn")}`
      : `सेक्टर ${formatLocalizedNumber(num, "hi")}`;
  }

  // Regex pattern for Block <id>
  const blockMatch = normalized.match(/^block\s*([a-zA-Z0-9]+)$/i);
  if (blockMatch) {
    const id = blockMatch[1];
    return lang === "bn" ? `ব্লক ${id}` : `ब्लॉक ${id}`;
  }

  return text;
}

export function formatLocalizedNumber(num: number | string | undefined | null, lang: Language): string {
  if (num === undefined || num === null) return "";
  const str = String(num);
  if (lang === "bn") {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return str.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
  }
  if (lang === "hi") {
    const hiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return str.replace(/\d/g, (d) => hiDigits[parseInt(d, 10)]);
  }
  return str;
}

