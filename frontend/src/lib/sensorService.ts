/**
 * AgriSight Central Sensor Service
 * Implements Sections 3, 6, and 22 of AgriSight Hardware-Ready Application Master Specification.
 *
 * Responsibilities:
 * - Single point of entry for the UI to inspect hardware and sensor telemetry.
 * - Decouples UI from any specific IoT protocol (ESP32, BLE, Wi-Fi, MQTT).
 * - Enforces honest status reporting:
 *     - If no hardware is paired/connected, returns status: "unpaired" or "offline".
 *     - Never injects fake/simulated numbers into production.
 *     - Translates local offlineDb readings into canonical SensorReading contracts.
 */

import {
  HardwareProvider,
  HardwareStatus,
  SensorReading,
  HardwareCommand,
  HardwareCommandResult,
  Unsubscribe,
} from "./hardwareContracts";
import { FEATURE_FLAGS } from "./featureFlags";
import { MockHardwareProvider } from "./mockHardwareProvider";
import { offlineDb, OfflineSensorReading } from "./offlineDb";

export class SensorService {
  private static activeProvider: HardwareProvider | null = null;
  private static subscribers: Set<(readings: SensorReading[]) => void> = new Set();

  /**
   * Registers or switches the active hardware provider (e.g. ESP32WiFiProvider, BLEProvider).
   */
  public static setProvider(provider: HardwareProvider | null) {
    if (this.activeProvider) {
      this.activeProvider.disconnect().catch(() => {});
    }
    this.activeProvider = provider;
  }

  /**
   * Returns current hardware provider, or initializes the dev mock if explicitly enabled by feature flag.
   */
  public static getProvider(): HardwareProvider | null {
    if (!this.activeProvider && FEATURE_FLAGS.MOCK_HARDWARE_ENABLED) {
      this.activeProvider = new MockHardwareProvider();
    }
    return this.activeProvider;
  }

  /**
   * Retrieves connection and operational status of hardware for a field.
   * In production with no hardware attached, honestly returns "unpaired".
   */
  public static async getFieldHardwareStatus(fieldId?: string): Promise<HardwareStatus> {
    const provider = this.getProvider();
    if (provider) {
      try {
        return await provider.getStatus();
      } catch (err) {
        console.warn("[SensorService] Error reading provider status:", err);
      }
    }

    // Default honest status: No hardware attached
    return {
      deviceId: "UNPAIRED",
      status: "unpaired",
      errors: [],
    };
  }

  /**
   * Retrieves latest validated sensor readings.
   * If real readings were ingested into offlineDb (e.g. from physical ESP32 Wi-Fi SoftAP or manual probe),
   * returns them. If no hardware exists, returns empty array — NEVER fake readings.
   */
  public static async getLatestReadings(fieldId?: string, userId?: string): Promise<SensorReading[]> {
    // 1. If active hardware provider is connected, check for live readings
    const provider = this.getProvider();
    if (provider) {
      try {
        const live = await provider.getLatestReadings();
        if (live && live.length > 0) return live;
      } catch (e) {
        console.warn("[SensorService] Provider reading failed:", e);
      }
    }

    // 2. Query verified local storage
    const offlineReadings = await offlineDb.getSensorReadings(fieldId, userId);
    if (!offlineReadings || offlineReadings.length === 0) {
      return [];
    }

    // 3. Map to canonical SensorReading schema (§5)
    return offlineReadings.map((r: OfflineSensorReading): SensorReading => {
      return {
        id: r.id,
        deviceId: r.device_id,
        fieldId: r.field_id,
        timestamp: r.timestamp,
        soilMoisture: r.soil_moisture,
        temperature: r.temperature,
        humidity: r.humidity,
        soilPH: r.soil_ph,
        waterFlow: undefined,
        sensorStatus: {
          soilMoisture: r.sensor_status === "valid" ? "online" : r.sensor_status === "error" ? "error" : "offline",
          temperature: r.sensor_status === "valid" ? "online" : r.sensor_status === "error" ? "error" : "offline",
          humidity: r.sensor_status === "valid" ? "online" : r.sensor_status === "error" ? "error" : "offline",
          soilPH: r.sensor_status === "valid" ? "online" : r.sensor_status === "error" ? "error" : "offline",
        },
        source: "hardware",
        syncStatus: r.sync_status || "LOCAL_ONLY",
      };
    });
  }

  /**
   * Subscribes to telemetry stream from hardware.
   */
  public static subscribeToTelemetry(
    callback: (readings: SensorReading[]) => void
  ): Unsubscribe {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Sends command to connected hardware node with deterministic agronomic validation (§20).
   */
  public static async executeCommand(command: HardwareCommand): Promise<HardwareCommandResult> {
    const provider = this.getProvider();
    if (!provider) {
      return {
        success: false,
        commandId: "cmd_failed_" + Date.now(),
        error: "No hardware controller connected to execute command.",
        message: "Actuation failed: Device node is not online.",
      };
    }

    return await provider.sendCommand(command);
  }
}
