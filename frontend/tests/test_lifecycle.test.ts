import {
  CROP_LIFECYCLE_STAGES,
  calculateDAP,
  estimateStageFromDAP,
  getStageById,
} from "../src/lib/cropLifecycleIntelligence";

function testDAPCalculation() {
  const today = new Date();
  const d30Ago = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const dap = calculateDAP(d30Ago);
  if (dap !== 30 && dap !== 29 && dap !== 31) {
    throw new Error(`Expected DAP around 30, got ${dap}`);
  }
  console.log(`[PASS] testDAPCalculation passed: DAP=${dap}`);
}

function testStageEstimation() {
  const seedlingStage = estimateStageFromDAP(15);
  if (seedlingStage.id !== "seedling") {
    throw new Error(`Expected seedling stage for DAP 15, got ${seedlingStage.id}`);
  }

  const floweringStage = estimateStageFromDAP(60);
  if (floweringStage.id !== "flowering") {
    throw new Error(`Expected flowering stage for DAP 60, got ${floweringStage.id}`);
  }

  if (floweringStage.waterPriority !== "Critical") {
    throw new Error(`Expected Critical water priority for flowering stage, got ${floweringStage.waterPriority}`);
  }

  const harvestStage = estimateStageFromDAP(120);
  if (harvestStage.id !== "harvest") {
    throw new Error(`Expected harvest stage for DAP 120, got ${harvestStage.id}`);
  }

  if (harvestStage.waterPriority !== "Withhold / Drydown") {
    throw new Error(`Expected Withhold / Drydown for harvest stage, got ${harvestStage.waterPriority}`);
  }

  console.log("[PASS] testStageEstimation passed for seedling, flowering, and harvest");
}

function testStageRetrieval() {
  const stage = getStageById("Flowering & Panicle Initiation");
  if (stage.id !== "flowering") {
    throw new Error(`Expected flowering stage, got ${stage.id}`);
  }
  if (!stage.nutrientFocus.recommendedRatio.includes("0:52:34")) {
    throw new Error("Expected 0:52:34 MKP in flowering nutrient recommendation");
  }
  console.log("[PASS] testStageRetrieval passed");
}

function testAllSixStagesHaveChecklists() {
  if (CROP_LIFECYCLE_STAGES.length !== 6) {
    throw new Error(`Expected 6 lifecycle stages, got ${CROP_LIFECYCLE_STAGES.length}`);
  }

  for (const s of CROP_LIFECYCLE_STAGES) {
    if (!s.managementChecklist.en.length || !s.managementChecklist.hi.length || !s.managementChecklist.bn.length) {
      throw new Error(`Missing trilingual checklist for stage ${s.id}`);
    }
    if (!s.criticalWarnings.en) {
      throw new Error(`Missing critical warning for stage ${s.id}`);
    }
  }
  console.log("[PASS] testAllSixStagesHaveChecklists passed across all 6 stages");
}

function runTests() {
  testDAPCalculation();
  testStageEstimation();
  testStageRetrieval();
  testAllSixStagesHaveChecklists();
  console.log("\nALL CROP LIFECYCLE INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
}

runTests();
