/**
 * AgriSight Production Feature Flags
 * Implements Section 28 of AgriSight Hardware-Ready Application Master Specification.
 *
 * Production Rules:
 * - MOCK_HARDWARE_ENABLED must strictly be false in production.
 * - DEBUG_MODE must strictly be false in production.
 * - Real hardware connects via HardwareProvider without rewriting UI.
 */

export interface AppFeatureFlags {
  HARDWARE_INTEGRATION_ENABLED: boolean;
  LOCAL_AI_ENABLED: boolean;
  VOICE_ENABLED: boolean;
  OFFLINE_MODE_ENABLED: boolean;
  DEBUG_MODE: boolean;
  MOCK_HARDWARE_ENABLED: boolean;
}

export const FEATURE_FLAGS: AppFeatureFlags = {
  HARDWARE_INTEGRATION_ENABLED: false, // Switched to true when physical ESP32 nodes are provisioned
  LOCAL_AI_ENABLED: true,
  VOICE_ENABLED: true,
  OFFLINE_MODE_ENABLED: true,
  DEBUG_MODE: process.env.NODE_ENV === "development",
  MOCK_HARDWARE_ENABLED: false, // STRICTLY FALSE IN PRODUCTION
};
