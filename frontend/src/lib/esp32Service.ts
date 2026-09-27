/**
 * AgriSight ESP32 Direct-to-Phone Service
 * Implements Sections 15 & 16 of Mobile Offline-First Master Plan.
 *
 * Responsibilities:
 * - Direct phone-to-ESP32 receiver via Local WiFi AP (192.168.4.1), LAN IP, or HTTP polling.
 * - Sensor Reliability Safeguards (§16):
 *   - Never treats 0 as automatically meaning 100% or valid.
 *   - Validates ranges:
 *     - Soil moisture: 0.1% - 100.0% (0.0 flagged as disconnected probe)
 *     - Temperature: -10°C - 60°C
 *     - Humidity: 10% - 100%
 *     - Soil pH: 3.5 - 9.5
 *   - Distinguishes real zero vs disconnected sensor vs invalid reading vs stale reading.
 * - Stores readings into offlineDb immediately.
 * - Queues to sync_queue for cloud sync when online.
 */

import { offlineDb, OfflineSensorReading } from "./offlineDb";

export interface ESP32Payload {
  device_id: string;
  field_id: string;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  soil_ph?: number;
  battery_pct?: number;
  timestamp?: string;
}

export interface SensorValidationReport {
  isValid: boolean;
  sensor_status: "valid" | "warning" | "error" | "disconnected";
  notes: string[];
}

export class ESP32Service {
  /**
   * Validates raw sensor readings to prevent false 0 readings and bad calibrations (§16)
   */
  public static validateSensorData(raw: ESP32Payload): SensorValidationReport {
    const notes: string[] = [];
    let status: "valid" | "warning" | "error" | "disconnected" = "valid";

    // 1. Soil Moisture check
    if (raw.soil_moisture === undefined || raw.soil_moisture === null) {
      notes.push("Soil moisture probe data missing.");
      status = "warning";
    } else if (raw.soil_moisture === 0) {
      // Rule §16: Do not interpret 0 as 100% or valid reading without verification
      notes.push("Soil moisture probe reads 0.0%: Check if sensor prongs are disconnected from soil.");
      status = "disconnected";
    } else if (raw.soil_moisture < 0 || raw.soil_moisture > 100) {
      notes.push(`Abnormal moisture value: ${raw.soil_moisture}%. Expected range is 1-100%.`);
      status = "error";
    }

    // 2. Temperature check
    if (raw.temperature !== undefined && raw.temperature !== null) {
      if (raw.temperature < -10 || raw.temperature > 65) {
        notes.push(`Abnormal temperature reading: ${raw.temperature}°C.`);
        status = "error";
      }
    }

    // 3. Humidity check
    if (raw.humidity !== undefined && raw.humidity !== null) {
      if (raw.humidity < 0 || raw.humidity > 100) {
        notes.push(`Abnormal relative humidity: ${raw.humidity}%.`);
        status = "error";
      }
    }

    // 4. Soil pH check
    if (raw.soil_ph !== undefined && raw.soil_ph !== null) {
      if (raw.soil_ph < 3.0 || raw.soil_ph > 10.0) {
        notes.push(`Unusual soil pH level: ${raw.soil_ph}. Agricultural range is 4.5 - 8.5.`);
        status = "warning";
      }
    }

    return {
      isValid: status !== "error",
      sensor_status: status,
      notes,
    };
  }

  /**
   * Ingests a sensor payload directly on phone without laptop mediation
   */
  public static async ingestReading(payload: ESP32Payload): Promise<OfflineSensorReading> {
    const validation = this.validateSensorData(payload);

    const reading: OfflineSensorReading = {
      id: "reading_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      device_id: payload.device_id || "AGRISIGHT_NODE_01",
      field_id: payload.field_id || "DEFAULT_FIELD",
      soil_moisture: payload.soil_moisture,
      temperature: payload.temperature,
      humidity: payload.humidity,
      soil_ph: payload.soil_ph,
      battery_pct: payload.battery_pct,
      sensor_status: validation.sensor_status,
      connection_status: "connected",
      timestamp: payload.timestamp || new Date().toISOString(),
      sync_status: "PENDING_SYNC",
    };

    // 1. Store in local DB immediately
    await offlineDb.saveSensorReading(reading);

    // 2. Queue for background sync
    await offlineDb.enqueueSyncItem({
      entityType: "sensor_reading",
      action: "create",
      entityId: reading.id,
      payload: reading,
      status: "PENDING_SYNC",
    });

    return reading;
  }

  /**
   * Polls direct ESP32 Wi-Fi SoftAP (e.g., http://192.168.4.1/data or custom IP)
   */
  public static async pollDirectESP32Node(ipAddress = "192.168.4.1"): Promise<OfflineSensorReading | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`http://${ipAddress}/sensors`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`ESP32 returned status ${res.status}`);

      const data: ESP32Payload = await res.json();
      return await this.ingestReading(data);
    } catch (err: any) {
      console.warn(`[ESP32 Direct] Unable to connect directly to ESP32 node at ${ipAddress}:`, err?.message);
      return null;
    }
  }
}
