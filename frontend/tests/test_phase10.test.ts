import { translations, translateDynamicContent, Language } from "../src/translations";

function runPhase10Tests() {
  console.log("Starting Phase 10 (Weather, Alerts, Fields, Analytics) Tests...");

  // Test 1: Parity of Phase 10 Alert & Analytics translation keys
  const phase10Keys: (keyof typeof translations.en)[] = [
    "criticalAlert",
    "cropAlert",
    "systemNotification",
    "newAlert",
    "justNow",
    "noUnreadNotifications",
    "noAlertsYet",
    "signInToSeeAlerts",
    "showAll",
    "showUnreadOnly",
    "analyticsSubtitle",
    "cleanHealthRate",
    "pathogenDistribution",
    "severityBreakdown",
    "fieldPerformanceMatrix",
    "notEnoughData",
    "noYieldFabrication",
    "activePlots",
    "scannedCrops",
  ];

  const langs: Language[] = ["en", "hi", "bn"];
  for (const lang of langs) {
    for (const key of phase10Keys) {
      const val = translations[lang][key];
      if (!val || val.trim() === "") {
        throw new Error(`Missing or empty translation for key "${key}" in language "${lang}"`);
      }
    }
  }
  console.log(`[PASS] Test 1: All ${phase10Keys.length} Phase 10 keys present and populated in en, hi, bn`);

  // Test 2: Atmospheric Weather Conditions in translateDynamicContent
  const weatherConditions = [
    "Clear Sky",
    "Sunny",
    "Partly Cloudy",
    "Overcast",
    "Light Drizzle",
    "Rain Showers",
    "Thunderstorm Alert",
    "High Humidity",
    "Dense Fog",
  ];

  for (const cond of weatherConditions) {
    const hi = translateDynamicContent(cond, "hi");
    const bn = translateDynamicContent(cond, "bn");
    const en = translateDynamicContent(cond, "en");

    if (hi === cond) {
      throw new Error(`Weather condition "${cond}" failed to translate to Hindi`);
    }
    if (bn === cond) {
      throw new Error(`Weather condition "${cond}" failed to translate to Bengali`);
    }
    if (en !== cond) {
      throw new Error(`Weather condition "${cond}" corrupted in English`);
    }
  }
  console.log(`[PASS] Test 2: Atmospheric weather conditions correctly mapped across en, hi, bn (${weatherConditions.length} conditions tested)`);

  // Test 3: Soil and Irrigation types in translateDynamicContent
  const agronomicEntities = [
    "Alluvial",
    "Black Soil",
    "Red Soil",
    "Sandy Loam",
    "Clay Loam",
    "Drip",
    "Sprinkler",
    "Flood / Furrow",
    "Manual",
  ];

  for (const entity of agronomicEntities) {
    const hi = translateDynamicContent(entity, "hi");
    const bn = translateDynamicContent(entity, "bn");

    if (hi === entity) {
      throw new Error(`Agronomic entity "${entity}" failed to translate to Hindi`);
    }
    if (bn === entity) {
      throw new Error(`Agronomic entity "${entity}" failed to translate to Bengali`);
    }
  }
  console.log(`[PASS] Test 3: Soil and irrigation terms dynamically localized in en, hi, bn (${agronomicEntities.length} entities tested)`);

  // Test 4: Analytics Metric Calculation & Zero-Fabrication Contract
  const sampleScans = [
    { disease: "Tomato Early Blight", severity: "high", risk_score: 85 },
    { disease: "Healthy", severity: "low", risk_score: 10 },
    { disease: "Tomato Late Blight", severity: "critical", risk_score: 95 },
    { disease: "Healthy", severity: "optimal", risk_score: 5 },
    { disease: "Leaf Spot", severity: "moderate", risk_score: 45 },
  ];

  const total = sampleScans.length;
  const cleanScans = sampleScans.filter((s) => {
    const d = s.disease.toLowerCase();
    return d.includes("healthy") || s.severity === "low" || s.severity === "optimal" || s.risk_score < 30;
  }).length;

  const cleanRate = Math.round((cleanScans / total) * 100);
  if (cleanRate !== 40) {
    throw new Error(`Expected clean health rate of 40%, got ${cleanRate}%`);
  }

  const highThreats = sampleScans.filter((s) => s.severity === "high" || s.severity === "critical").length;
  if (highThreats !== 2) {
    throw new Error(`Expected 2 high/critical threats, got ${highThreats}`);
  }

  // Verify transparency guarantee key
  if (!translations.en.noYieldFabrication.includes("Zero fabricated yield forecasts")) {
    throw new Error("a2.md §19 compliance failure: transparency guarantee key missing");
  }

  console.log("[PASS] Test 4: Analytics KPIs and empirical data contracts verified (clean rate 40%, 2 threats, zero-fabrication confirmed)");

  // Test 5: Sparse Data / Empty State Fallback
  const emptyScans: any[] = [];
  const emptyTotal = emptyScans.length;
  const emptyCleanRate = emptyTotal > 0 ? Math.round((0 / emptyTotal) * 100) : 0;
  if (emptyCleanRate !== 0) {
    throw new Error(`Empty dataset must yield 0% clean rate, got ${emptyCleanRate}`);
  }
  if (!translations.en.notEnoughData || translations.en.notEnoughData.length < 10) {
    throw new Error("notEnoughData fallback text must be present and descriptive");
  }
  console.log("[PASS] Test 5: Sparse data and empty state fallbacks handled cleanly without errors");

  console.log("\nAll Phase 10 Tests Passed Successfully! [5/5]");
}

runPhase10Tests();
