import { computeIrrigationRecommendation } from "../src/lib/irrigationIntelligence";

function runTests() {
  console.log("Starting Smart Irrigation Intelligence Tests...");

  // Test 1: Rain forecast triggers postponement
  const rainRec = computeIrrigationRecommendation({
    cropName: "Tomato",
    growthStage: "Flowering",
    temp: 32,
    humidity: 70,
    rainProb: 65,
    precipitation: 6,
    forecastRainSum: 12
  });
  if (rainRec.status !== "POSTPONE_RAIN") throw new Error("Test 1 Failed: Expected POSTPONE_RAIN");
  console.log("[PASS] Test 1: High rain forecast correctly postpones irrigation");

  // Test 2: Flowering stage with high heat triggers recommended irrigation
  const heatRec = computeIrrigationRecommendation({
    cropName: "Tomato",
    growthStage: "Flowering",
    temp: 36,
    humidity: 40,
    rainProb: 5,
    precipitation: 0,
    forecastRainSum: 0
  });
  if (heatRec.status !== "RECOMMENDED") throw new Error("Test 2 Failed: Expected RECOMMENDED");
  if (heatRec.waterStressRisk !== "High") throw new Error("Test 2 Failed: Expected High Water Stress");
  console.log("[PASS] Test 2: Flowering crop in high heat triggers RECOMMENDED with High water stress");

  // Test 3: Moderate vegetative growth in mild weather
  const vegRec = computeIrrigationRecommendation({
    cropName: "Rice",
    growthStage: "Vegetative",
    temp: 26,
    humidity: 75,
    rainProb: 15,
    precipitation: 0,
    forecastRainSum: 0
  });
  if (vegRec.waterStressRisk !== "Low") throw new Error("Test 3 Failed: Expected Low Water Stress");
  console.log("[PASS] Test 3: Vegetative crop in mild weather shows Low water stress");

  // Test 4: Recently irrigated
  const recentRec = computeIrrigationRecommendation({
    cropName: "Potato",
    growthStage: "Tuber Bulking",
    temp: 34,
    humidity: 50,
    rainProb: 10,
    precipitation: 0,
    forecastRainSum: 0,
    lastIrrigatedHoursAgo: 8
  });
  if (recentRec.status !== "RECENTLY_IRRIGATED") throw new Error("Test 4 Failed: Expected RECENTLY_IRRIGATED");
  console.log("[PASS] Test 4: Recent irrigation (<18h) correctly acknowledged");

  console.log("\nALL SMART IRRIGATION INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
}

runTests();
