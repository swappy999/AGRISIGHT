/**
 * AgriSight Deterministic Alert Engine (P0 Field Alerts Stabilization)
 * Implements Sections 11, 12, 13, 14, 15, 16 & 19 of the Master Plan.
 *
 * Evaluates real stored field conditions (Sensors, Leaf Scans, Weather, Crop Stage),
 * generates deterministic alerts without screen-load duplicates, persists to IndexedDB,
 * and queues synchronization to Supabase.
 */

import { offlineDb, OfflineAlert } from "./offlineDb";
import { supabase } from "./supabaseClient";

export class AlertEngine {
  /**
   * Evaluates all field conditions deterministically for a specific field.
   * Triggered by: new sensor readings, new leaf scans, weather updates, or sync events.
   * NEVER generates duplicate alerts for the same condition window.
   */
  static async evaluateFieldConditions(fieldId: string): Promise<OfflineAlert[]> {
    if (!fieldId) return [];

    const field = await offlineDb.getField(fieldId);
    if (!field) return [];

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || field.user_id || "local_farmer";

    const [recentScans, sensorReadings, existingAlerts] = await Promise.all([
      offlineDb.getScans(undefined, undefined, fieldId),
      offlineDb.getSensorReadings(fieldId),
      offlineDb.getAlerts(userId),
    ]);

    const activeAlerts = existingAlerts.filter(
      (a) => a.field_id === fieldId && !a.is_resolved
    );
    const existingDedupKeys = new Set(
      activeAlerts.map((a) => a.dedup_key).filter(Boolean)
    );

    const generatedAlerts: OfflineAlert[] = [];
    const todayWindow = new Date().toISOString().split("T")[0]; // Daily condition window

    // ──────────────────────────────────────────────────────────────────────────
    // RULE 1: Crop Pathology & Disease Severity (from Leaf Scans)
    // ──────────────────────────────────────────────────────────────────────────
    if (recentScans.length > 0) {
      const latestScan = recentScans[0];
      const scanDate = new Date(latestScan.created_at);
      const daysSinceScan = Math.floor((Date.now() - scanDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if scan detected a disease condition within the last 7 days
      if (daysSinceScan <= 7 && latestScan.disease && !latestScan.disease.toLowerCase().includes("healthy")) {
        const severityLower = (latestScan.severity || "medium").toLowerCase();
        const isCritical = severityLower === "high" || severityLower === "critical";
        const dedupKey = `${fieldId}_DISEASE_${latestScan.id}`;

        if (!existingDedupKeys.has(dedupKey)) {
          const alert: OfflineAlert = {
            id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId,
            field_id: fieldId,
            crop_id: latestScan.crop_id,
            type: "DISEASE",
            severity: isCritical ? "critical" : "warning",
            title: isCritical
              ? `Critical: ${latestScan.disease} Detected`
              : `Warning: ${latestScan.disease} Observed`,
            message: `Recent leaf scan identified ${latestScan.disease} with ${latestScan.severity} severity on ${field.name}.`,
            action: latestScan.result_json?.immediate_actions?.[0] || "Review recommended foliar treatment and isolate infected foliage.",
            source: "scan",
            source_record_id: latestScan.id,
            dedup_key: dedupKey,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sync_status: "PENDING_SYNC",
          };

          await offlineDb.saveAlert(alert);
          await offlineDb.enqueueSyncItem({
            entityType: "alert",
            action: "create",
            entityId: alert.id,
            payload: alert,
            status: "PENDING_SYNC",
          });
          generatedAlerts.push(alert);
          existingDedupKeys.add(dedupKey);
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RULE 2: Soil Moisture Deficit & Water Stress (from ESP32 / Field Probes)
    // ──────────────────────────────────────────────────────────────────────────
    if (sensorReadings.length > 0) {
      const latestReading = sensorReadings[0];
      const moisture = latestReading.soil_moisture;

      // Ensure reading is valid and probe is connected (do not treat disconnected 0 as valid moisture)
      if (moisture !== undefined && latestReading.sensor_status !== "disconnected") {
        if (moisture < 20) {
          // Critical Moisture Deficit
          const dedupKey = `${fieldId}_LOW_MOISTURE_${todayWindow}`;
          if (!existingDedupKeys.has(dedupKey)) {
            const alert: OfflineAlert = {
              id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              user_id: userId,
              field_id: fieldId,
              type: "LOW_MOISTURE",
              severity: "critical",
              title: "Critical Water Stress (Severe Deficit)",
              message: `Soil moisture in ${field.name} has fallen to ${moisture}%, below the critical 20% root wilting threshold.`,
              action: "Initiate irrigation immediately to avoid irreversible root shrinkage and yield loss.",
              source: "sensor",
              source_record_id: latestReading.id,
              dedup_key: dedupKey,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: "PENDING_SYNC",
            };
            await offlineDb.saveAlert(alert);
            await offlineDb.enqueueSyncItem({
              entityType: "alert",
              action: "create",
              entityId: alert.id,
              payload: alert,
              status: "PENDING_SYNC",
            });
            generatedAlerts.push(alert);
            existingDedupKeys.add(dedupKey);
          }
        } else if (moisture < 32) {
          // Moderate Water Stress Warning
          const dedupKey = `${fieldId}_WATER_STRESS_${todayWindow}`;
          if (!existingDedupKeys.has(dedupKey)) {
            const alert: OfflineAlert = {
              id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              user_id: userId,
              field_id: fieldId,
              type: "WATER_STRESS",
              severity: "warning",
              title: "Soil Moisture Below Target",
              message: `Soil moisture in ${field.name} is ${moisture}%. Soil depletion is active.`,
              action: "Schedule next irrigation cycle within the next 24 to 48 hours.",
              source: "sensor",
              source_record_id: latestReading.id,
              dedup_key: dedupKey,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: "PENDING_SYNC",
            };
            await offlineDb.saveAlert(alert);
            await offlineDb.enqueueSyncItem({
              entityType: "alert",
              action: "create",
              entityId: alert.id,
              payload: alert,
              status: "PENDING_SYNC",
            });
            generatedAlerts.push(alert);
            existingDedupKeys.add(dedupKey);
          }
        } else if (moisture > 85) {
          // Waterlogging / Saturation Warning
          const dedupKey = `${fieldId}_WATERLOGGING_${todayWindow}`;
          if (!existingDedupKeys.has(dedupKey)) {
            const alert: OfflineAlert = {
              id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
              user_id: userId,
              field_id: fieldId,
              type: "WATERLOGGING",
              severity: "warning",
              title: "Excess Soil Saturation / Waterlogging",
              message: `Soil moisture in ${field.name} has reached ${moisture}%. Root oxygenation may be restricted.`,
              action: "Halt all irrigation and check field drainage furrows to release standing water.",
              source: "sensor",
              source_record_id: latestReading.id,
              dedup_key: dedupKey,
              is_read: false,
              is_resolved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: "PENDING_SYNC",
            };
            await offlineDb.saveAlert(alert);
            await offlineDb.enqueueSyncItem({
              entityType: "alert",
              action: "create",
              entityId: alert.id,
              payload: alert,
              status: "PENDING_SYNC",
            });
            generatedAlerts.push(alert);
            existingDedupKeys.add(dedupKey);
          }
        } else {
          // If moisture is in optimal healthy zone (38% - 70%), auto-resolve moisture alerts!
          for (const a of activeAlerts) {
            if (a.type === "LOW_MOISTURE" || a.type === "WATER_STRESS") {
              a.is_resolved = true;
              a.updated_at = new Date().toISOString();
              await offlineDb.saveAlert(a);
              await offlineDb.enqueueSyncItem({
                entityType: "alert",
                action: "update",
                entityId: a.id,
                payload: a,
                status: "PENDING_SYNC",
              });
            }
          }
        }
      }

      // ──────────────────────────────────────────────────────────────────────────
      // RULE 3: Microclimate Heat Stress & Fungal Risk
      // ──────────────────────────────────────────────────────────────────────────
      if (latestReading.temperature && latestReading.temperature > 38) {
        const dedupKey = `${fieldId}_HEAT_${todayWindow}`;
        if (!existingDedupKeys.has(dedupKey)) {
          const alert: OfflineAlert = {
            id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId,
            field_id: fieldId,
            type: "HIGH_TEMPERATURE",
            severity: "warning",
            title: "Extreme Temperature Stress",
            message: `Field temperature reached ${latestReading.temperature}°C in ${field.name}. Heat stress induces flower/leaf drop.`,
            action: "Maintain soil mulch cover and irrigate early morning to prevent thermal root shock.",
            source: "sensor",
            source_record_id: latestReading.id,
            dedup_key: dedupKey,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sync_status: "PENDING_SYNC",
          };
          await offlineDb.saveAlert(alert);
          await offlineDb.enqueueSyncItem({
            entityType: "alert",
            action: "create",
            entityId: alert.id,
            payload: alert,
            status: "PENDING_SYNC",
          });
          generatedAlerts.push(alert);
          existingDedupKeys.add(dedupKey);
        }
      }

      if (latestReading.humidity && latestReading.humidity > 85 && (latestReading.temperature || 25) > 23) {
        const dedupKey = `${fieldId}_FUNGAL_RISK_${todayWindow}`;
        if (!existingDedupKeys.has(dedupKey)) {
          const alert: OfflineAlert = {
            id: "alt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            user_id: userId,
            field_id: fieldId,
            type: "HIGH_HUMIDITY",
            severity: "warning",
            title: "Favorable Fungal Infection Window",
            message: `High atmospheric humidity (${latestReading.humidity}%) creates prime spores germination conditions in ${field.name}.`,
            action: "Perform preventative canopy leaf checks for lesions; avoid foliar nitrogen fertilization.",
            source: "sensor",
            source_record_id: latestReading.id,
            dedup_key: dedupKey,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sync_status: "PENDING_SYNC",
          };
          await offlineDb.saveAlert(alert);
          await offlineDb.enqueueSyncItem({
            entityType: "alert",
            action: "create",
            entityId: alert.id,
            payload: alert,
            status: "PENDING_SYNC",
          });
          generatedAlerts.push(alert);
          existingDedupKeys.add(dedupKey);
        }
      }
    }

    return generatedAlerts;
  }

  /**
   * Retrieves active, deduplicated alerts for a specific field.
   */
  static async getFieldAlerts(fieldId: string): Promise<OfflineAlert[]> {
    if (!fieldId) return [];

    // Trigger evaluation on demand to ensure fresh state
    await this.evaluateFieldConditions(fieldId).catch(() => []);

    const all = await offlineDb.getAlerts();
    return all.filter((a) => a.field_id === fieldId && !a.is_resolved);
  }

  /**
   * Retrieves all active alerts across all fields for the user.
   */
  static async getGlobalAlerts(): Promise<OfflineAlert[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const all = await offlineDb.getAlerts(userId);
    return all.filter((a) => !a.is_resolved);
  }

  /**
   * Marks an alert as read in the local database and enqueues sync.
   */
  static async markAlertRead(alertId: string): Promise<void> {
    const alerts = await offlineDb.getAlerts();
    const target = alerts.find((a) => a.id === alertId);
    if (target) {
      target.is_read = true;
      target.updated_at = new Date().toISOString();
      await offlineDb.saveAlert(target);
      await offlineDb.enqueueSyncItem({
        entityType: "alert",
        action: "update",
        entityId: target.id,
        payload: target,
        status: "PENDING_SYNC",
      });
    }
  }

  /**
   * Marks an alert as resolved in the local database and enqueues sync.
   */
  static async resolveAlert(alertId: string): Promise<void> {
    const alerts = await offlineDb.getAlerts();
    const target = alerts.find((a) => a.id === alertId);
    if (target) {
      target.is_resolved = true;
      target.updated_at = new Date().toISOString();
      await offlineDb.saveAlert(target);
      await offlineDb.enqueueSyncItem({
        entityType: "alert",
        action: "update",
        entityId: target.id,
        payload: target,
        status: "PENDING_SYNC",
      });
    }
  }
}
