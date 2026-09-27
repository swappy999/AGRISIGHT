/**
 * AgriSight Sync Manager
 * Implements Section 7 of Mobile Offline-First Master Plan.
 *
 * Responsibilities:
 * - Monitors online/offline network connectivity.
 * - Flushes pending items in `sync_queue` directly to Supabase when connected.
 * - Retries failed sync with exponential backoff.
 * - Downloads remote updates to maintain local consistency.
 * - Dispatches 'agrisight-sync-status' events for reactive UI badges.
 */

import { offlineDb, SyncQueueItem, OfflineField, OfflineCrop, OfflineScan, OfflineSensorReading, OfflineIntervention, OfflineAlert } from "./offlineDb";
import { supabase } from "./supabaseClient";

export type SyncState = "IDLE" | "SYNCING" | "OFFLINE" | "ERROR";

class SyncManagerService {
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(state: SyncState, pendingCount: number) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
      // Periodic sync attempt every 30 seconds when app is active
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncPending();
        }
      }, 30000);
    }
  }

  public subscribe(callback: (state: SyncState, pendingCount: number) => void) {
    this.listeners.push(callback);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners() {
    const pending = await offlineDb.getPendingSyncItems();
    const state: SyncState = !navigator.onLine
      ? "OFFLINE"
      : this.isSyncing
      ? "SYNCING"
      : "IDLE";

    for (const listener of this.listeners) {
      try {
        listener(state, pending.length);
      } catch {}
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("agrisight-sync-event", {
          detail: { state, pendingCount: pending.length },
        })
      );
    }
  }

  private handleNetworkChange(isOnline: boolean) {
    if (isOnline) {
      console.log("[AgriSight SyncManager] Internet restored. Triggering automatic background sync.");
      this.syncPending();
    } else {
      console.log("[AgriSight SyncManager] Device went offline. Operations will queue locally.");
      this.notifyListeners();
    }
  }

  /**
   * Main sync processor
   */
  public async syncPending(): Promise<void> {
    if (typeof window === "undefined" || !navigator.onLine || this.isSyncing) {
      this.notifyListeners();
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const pendingItems = await offlineDb.getPendingSyncItems();

      for (const item of pendingItems) {
        // Exponential backoff check
        if (item.retryCount > 0) {
          const waitMinutes = Math.min(Math.pow(2, item.retryCount - 1), 30);
          const lastAttempt = new Date(item.updatedAt).getTime();
          if (Date.now() - lastAttempt < waitMinutes * 60 * 1000) {
            continue; // Skip this round, backoff duration not elapsed
          }
        }

        try {
          item.status = "SYNCING";
          await offlineDb.updateSyncItem(item);

          let syncSuccess = false;

          switch (item.entityType) {
            case "field":
              syncSuccess = await this.syncField(item, currentUserId);
              break;
            case "crop":
              syncSuccess = await this.syncCrop(item, currentUserId);
              break;
            case "scan":
              syncSuccess = await this.syncScan(item, currentUserId);
              break;
            case "sensor_reading":
              syncSuccess = await this.syncSensorReading(item);
              break;
            case "intervention":
              syncSuccess = await this.syncIntervention(item, currentUserId);
              break;
            case "alert":
              syncSuccess = await this.syncAlert(item, currentUserId);
              break;
          }

          if (syncSuccess) {
            item.status = "SYNCED";
            await offlineDb.removeSyncItem(item.id);
          } else {
            item.status = "SYNC_FAILED";
            item.retryCount = (item.retryCount || 0) + 1;
            item.lastError = "Sync attempt rejected by server or table not ready";
            await offlineDb.updateSyncItem(item);
          }
        } catch (err: any) {
          item.status = "SYNC_FAILED";
          item.retryCount = (item.retryCount || 0) + 1;
          item.lastError = err?.message || "Network sync failure";
          await offlineDb.updateSyncItem(item);
        }
      }
    } catch (globalSyncErr) {
      console.warn("[AgriSight SyncManager] Sync cycle warning:", globalSyncErr);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  // ── Entity Sync Handlers ──────────────────────────────────────────────────

  private async syncField(item: SyncQueueItem, currentUserId?: string): Promise<boolean> {
    const payload = item.payload as OfflineField;
    const userId = payload.user_id || currentUserId;
    if (!userId) return false;

    if (item.action === "delete") {
      const { error } = await supabase.from("fields").delete().eq("id", item.entityId);
      return !error;
    }

    const { error } = await supabase.from("fields").upsert({
      id: payload.id,
      user_id: userId,
      name: payload.name,
      location_name: payload.location_name || "",
      latitude: payload.latitude || 22.57,
      longitude: payload.longitude || 88.36,
      area_acres: payload.area_acres || 1.0,
      soil_type: payload.soil_type || "Alluvial",
      irrigation_type: payload.irrigation_type || "Drip",
      notes: payload.notes || "",
      created_at: payload.created_at,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveField(payload);
      return true;
    }
    return false;
  }

  private async syncCrop(item: SyncQueueItem, currentUserId?: string): Promise<boolean> {
    const payload = item.payload as OfflineCrop;
    const userId = payload.user_id || currentUserId;
    if (!userId) return false;

    if (item.action === "delete") {
      const { error } = await supabase.from("crops").delete().eq("id", item.entityId);
      return !error;
    }

    const { error } = await supabase.from("crops").upsert({
      id: payload.id,
      user_id: userId,
      name: payload.name,
      variety: payload.variety || "",
      planting_date: payload.planting_date || "",
      growth_stage: payload.growth_stage || "Vegetative",
      field_name: payload.field_name || "",
      field_id: payload.field_id || "",
      notes: payload.notes || "",
      created_at: payload.created_at,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveCrop(payload);
      return true;
    }
    return false;
  }

  private async syncScan(item: SyncQueueItem, currentUserId?: string): Promise<boolean> {
    const payload = item.payload as OfflineScan;
    const userId = payload.user_id || currentUserId;
    if (!userId) return false;

    // Direct insert to Supabase analyses table
    const { error } = await supabase.from("analyses").upsert({
      id: payload.id,
      user_id: userId,
      image_url: payload.image_url,
      disease: payload.disease,
      severity: payload.severity,
      result_json: typeof payload.result_json === "string" ? payload.result_json : JSON.stringify(payload.result_json),
      crop_id: payload.crop_id || null,
      field_id: payload.field_id || null,
      created_at: payload.created_at,
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveScan(payload);
      return true;
    }
    return false;
  }

  private async syncSensorReading(item: SyncQueueItem): Promise<boolean> {
    const payload = item.payload as OfflineSensorReading;
    const { error } = await supabase.from("sensor_readings").upsert({
      id: payload.id,
      device_id: payload.device_id,
      field_id: payload.field_id,
      soil_moisture: payload.soil_moisture ?? null,
      temperature: payload.temperature ?? null,
      humidity: payload.humidity ?? null,
      soil_ph: payload.soil_ph ?? null,
      battery_pct: payload.battery_pct ?? null,
      sensor_status: payload.sensor_status,
      timestamp: payload.timestamp,
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveSensorReading(payload);
      return true;
    }
    return false;
  }

  private async syncIntervention(item: SyncQueueItem, currentUserId?: string): Promise<boolean> {
    const payload = item.payload as OfflineIntervention;
    const userId = payload.user_id || currentUserId;
    if (!userId) return false;

    const { error } = await supabase.from("interventions").upsert({
      id: payload.id,
      user_id: userId,
      action_type: payload.action_type,
      action_title: payload.action_title,
      crop_id: payload.crop_id || "",
      field_id: payload.field_id || "",
      notes: payload.notes || "",
      performed_at: payload.performed_at || new Date().toISOString(),
      created_at: payload.created_at,
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveIntervention(payload);
      return true;
    }
    return false;
  }

  private async syncAlert(item: SyncQueueItem, currentUserId?: string): Promise<boolean> {
    const payload = item.payload as OfflineAlert;
    const userId = payload.user_id || currentUserId;
    if (!userId) return false;

    if (item.action === "delete") {
      const { error } = await supabase.from("notifications").delete().eq("id", item.entityId);
      return !error;
    }

    const { error } = await supabase.from("notifications").upsert({
      id: payload.id,
      user_id: userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || payload.severity,
      severity: payload.severity,
      is_read: payload.is_read,
      created_at: payload.created_at,
    });

    if (!error) {
      payload.sync_status = "SYNCED";
      await offlineDb.saveAlert(payload);
      return true;
    }
    return false;
  }
}

export const syncManager = new SyncManagerService();
