/**
 * AgriSight Hardware-Ready Application Master Verification Tests
 * Validates specifications in AgriSight_Hardware_Ready_Application_Master_Specification.md
 */

import assert from "node:assert";
import { FEATURE_FLAGS } from "../src/lib/featureFlags";
import { MockHardwareProvider } from "../src/lib/mockHardwareProvider";
import { SensorService } from "../src/lib/sensorService";
import { AgriculturalKnowledgeService } from "../src/lib/agriculturalKnowledgeService";
import { toAgriculturalAnalysis, AIScanResult } from "../src/lib/aiService";
import { HardwareCommand, SensorReading } from "../src/lib/hardwareContracts";

console.log("Starting AgriSight Hardware-Ready Layer & Contract Tests...\n");

// ── Test 1: Feature Flags & Production Gating (§28) ──────────────────────────
console.log("Testing Feature Flags & Production Gating (§28)...");
assert.strictEqual(
  FEATURE_FLAGS.MOCK_HARDWARE_ENABLED,
  false,
  "MOCK_HARDWARE_ENABLED must strictly default to false in production"
);

const forbiddenMock = new MockHardwareProvider();
assert.rejects(
  async () => {
    await forbiddenMock.connect();
  },
  /MockHardwareProvider is forbidden in production/,
  "MockHardwareProvider must throw when called with MOCK_HARDWARE_ENABLED=false"
);
console.log("[PASS] Test 1: Production gating and mock hardware prohibition verified");

// ── Test 2: Honest Sensor Service State with No Hardware (§2, §6, §22) ──────
console.log("\nTesting Honest Sensor Service State (§6, §22)...");
(async () => {
  SensorService.setProvider(null);
  const status = await SensorService.getFieldHardwareStatus("test_field");
  assert.strictEqual(status.status, "unpaired", "Status should be 'unpaired' when no device attached");
  assert.strictEqual(status.deviceId, "UNPAIRED", "Device ID should honestly indicate UNPAIRED");

  const readings = await SensorService.getLatestReadings("empty_field");
  assert.strictEqual(Array.isArray(readings), true, "Readings should be an array");
  console.log("[PASS] Test 2: Honest un-fabricated state verified when hardware is absent");
})().then(() => {
  // ── Test 3: Hardware Abstraction & Mock Provider in Controlled Test Mode ──
  console.log("\nTesting Mock Hardware Provider & Safety Interlocks (§4, §20, §21)...");
  FEATURE_FLAGS.MOCK_HARDWARE_ENABLED = true;

  const testProvider = new MockHardwareProvider("TEST_ESP32_DEV", "FIELD_01");

  (async () => {
    const conn = await testProvider.connect();
    assert.strictEqual(conn.connected, true);
    assert.strictEqual(conn.connectionType, "WIFI");

    const readings = await testProvider.getLatestReadings();
    assert.strictEqual(readings.length, 1);
    assert.strictEqual(typeof readings[0].soilMoisture, "number");
    assert.strictEqual(readings[0].sensorStatus?.soilMoisture, "online");

    // Test safety interlock on pump command (§20 & §21)
    const unsafeCommand: HardwareCommand = {
      deviceId: "TEST_ESP32_DEV",
      fieldId: "FIELD_01",
      command: "START_PUMP",
      durationSeconds: 7200, // 2 hours -> must be blocked
      requestedBy: "RULE_ENGINE",
      safetyCheckRequired: true,
    };

    const cmdResult = await testProvider.sendCommand(unsafeCommand);
    assert.strictEqual(cmdResult.success, false, "Pump command > 60m should be rejected by safety interlock");
    assert.strictEqual(cmdResult.safetyBlocked, true, "Safety block flag must be set");

    const safeCommand: HardwareCommand = {
      deviceId: "TEST_ESP32_DEV",
      fieldId: "FIELD_01",
      command: "START_PUMP",
      durationSeconds: 900, // 15 mins -> allowed
      requestedBy: "USER",
      safetyCheckRequired: true,
    };
    const safeResult = await testProvider.sendCommand(safeCommand);
    assert.strictEqual(safeResult.success, true, "Safe pump duration should succeed");

    await testProvider.disconnect();
    FEATURE_FLAGS.MOCK_HARDWARE_ENABLED = false; // Reset to production default
    console.log("[PASS] Test 3: Hardware contracts & actuation safety interlocks verified");

    // ── Test 4: Agricultural Knowledge Service (§13) ─────────────────────────
    console.log("\nTesting Agricultural Knowledge Service (§13)...");
    const tomato = AgriculturalKnowledgeService.getCropProfile("Tomato");
    assert.notStrictEqual(tomato, null, "Tomato profile must exist");
    assert.strictEqual(tomato?.scientificName, "Solanum lycopersicum");
    assert.strictEqual(tomato?.phRange.optimal, 6.5);
    assert.strictEqual(tomato?.stages.length, 5);

    const earlyBlight = AgriculturalKnowledgeService.getDiseaseProfile("Early Blight");
    assert.notStrictEqual(earlyBlight, null, "Early Blight profile must exist");
    assert.strictEqual(earlyBlight?.pathogenType, "fungal");
    assert.strictEqual(earlyBlight?.affectedCrops.includes("tomato"), true);

    const riskEval = AgriculturalKnowledgeService.evaluatePathogenRisk("Tomato", 26, 85, 5);
    assert.strictEqual(riskEval.riskLevel, "critical", "26°C with 85% humidity & 5h wetness must trigger critical blight risk");
    assert.strictEqual(riskEval.pathogens.includes("Early Blight"), true);

    const nutrientMatch = AgriculturalKnowledgeService.matchNutrientDeficiency("older leaves chlorosis yellow");
    assert.strictEqual(nutrientMatch.length > 0, true, "Must match Nitrogen deficiency");
    console.log("[PASS] Test 4: Agricultural Knowledge Service profiles and risk calculations verified");

    // ── Test 5: Canonical Agricultural Analysis Normalization (§12) ──────────
    console.log("\nTesting Canonical Agricultural Analysis Normalization (§12)...");
    const rawScan: AIScanResult = {
      id: "scan_123",
      disease: "Late Blight",
      confidence: 89.4,
      severity: "high",
      pathogen_type: "fungal",
      crop_detected: "Potato",
      image_url: "https://example.com/leaf.jpg",
      created_at: "2026-09-27T12:00:00Z",
      summary: "Distinct water-soaked lesions visible on margins.",
      immediate_actions: ["Prune affected leaves"],
      organic_treatments: ["Bordeaux mixture"],
      chemical_treatments: ["Mancozeb"],
      preventive_measures: ["Avoid overhead watering"],
      weather_risks: ["High humidity incubation"],
      is_offline: false,
      provider: "GEMINI",
    };

    const normalized = toAgriculturalAnalysis(rawScan);
    assert.strictEqual(normalized.crop, "Potato");
    assert.strictEqual(normalized.condition, "Late Blight");
    assert.strictEqual(normalized.severity, "high");
    assert.strictEqual(normalized.confidence, 89.4);
    assert.strictEqual(normalized.provider, "gemini");
    assert.strictEqual(normalized.followUpDays, 4);

    // Verify lack of fake defaults
    const minimalScan: AIScanResult = {
      id: "scan_min",
      disease: "",
      confidence: NaN,
      severity: "",
      image_url: "",
      created_at: "",
      summary: "",
      immediate_actions: [],
      organic_treatments: [],
      chemical_treatments: [],
      preventive_measures: [],
      is_offline: true,
      provider: "LOCAL_AI",
    };
    const normMin = toAgriculturalAnalysis(minimalScan);
    assert.strictEqual(normMin.crop, "Unspecified Crop");
    assert.strictEqual(normMin.confidence, undefined, "Undefined confidence should remain undefined, not defaulted to 95%");
    assert.strictEqual(normMin.provider, "local");
    console.log("[PASS] Test 5: Canonical Agricultural Analysis schema normalization verified");

    console.log("\n========================================================");
    console.log("ALL HARDWARE-READY LAYER & CONTRACT TESTS PASSED! [5/5]");
    console.log("========================================================\n");
  })();
});
