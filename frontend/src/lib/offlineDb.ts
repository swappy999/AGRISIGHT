/**
 * AgriSight Offline-First Database (IndexedDB with local caching)
 * Provides permanent, laptop-independent on-device storage for:
 * - fields
 * - crops
 * - scans / analyses
 * - sensor_readings
 * - interventions
 * - alerts
 * - weather_cache
 * - assistant_history
 * - sync_queue
 *
 * Implements Section 5 & 6 of AgriSight Mobile Offline-First Master Plan.
 */

export interface OfflineField {
  id: string;
  user_id: string;
  name: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  area_acres?: number;
  soil_type?: string;
  irrigation_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sync_status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineCrop {
  id: string;
  user_id: string;
  name: string;
  variety?: string;
  planting_date?: string;
  growth_stage?: string;
  field_name?: string;
  field_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  sync_status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineScan {
  id: string;
  user_id: string;
  image_url: string;
  disease: string;
  severity: string;
  confidence: number;
  result_json: any;
  crop_id?: string;
  field_id?: string;
  question?: string;
  created_at: string;
  language?: "en" | "hi" | "bn";
  status?: "COMPLETED" | "PENDING" | "FAILED";
  provider?: "gemini" | "local" | "rule_based";
  analysis?: {
    crop: string;
    condition: string;
    severity: string;
    confidence?: number;
    observations: string[];
    possibleCauses: string[];
    recommendedActions: string[];
    prevention: string[];
    riskFlags: string[];
  };
  sync_status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineSensorReading {
  id: string;
  user_id?: string;
  device_id: string;
  field_id: string;
  soil_moisture?: number;
  temperature?: number;
  humidity?: number;
  soil_ph?: number;
  battery_pct?: number;
  sensor_status: "valid" | "warning" | "error" | "disconnected";
  connection_status: "connected" | "offline";
  timestamp: string;
  sync_status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineIntervention {
  id: string;
  user_id: string;
  action_type: string;
  action_title: string;
  crop_id?: string;
  field_id?: string;
  notes?: string;
  performed_at: string;
  created_at: string;
  sync_status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineAlert {
  id: string;
  user_id: string;
  field_id?: string;
  crop_id?: string;
  title: string;
  message: string;
  type?: string;
  severity: "info" | "warning" | "critical";
  source?: "scan" | "sensor" | "weather" | "system" | string;
  source_record_id?: string;
  dedup_key?: string;
  action?: string;
  is_read: boolean;
  is_resolved?: boolean;
  created_at: string;
  updated_at?: string;
  sync_status?: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
}

export interface OfflineWeatherCache {
  locality: string;
  latitude: number;
  longitude: number;
  data: any;
  fetched_at: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: "field" | "crop" | "scan" | "sensor_reading" | "intervention" | "alert";
  action: "create" | "update" | "delete";
  entityId: string;
  payload: any;
  status: "LOCAL_ONLY" | "PENDING_SYNC" | "SYNCING" | "SYNCED" | "SYNC_FAILED";
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

import { HardwareDevice } from "./hardwareContracts";

const DB_NAME = "AgriSight_Offline_DB";
const DB_VERSION = 3;

class OfflineDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      throw new Error("IndexedDB is only accessible in browser/Capacitor environment");
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const stores = [
          { name: "fields", keyPath: "id" },
          { name: "crops", keyPath: "id" },
          { name: "scans", keyPath: "id" },
          { name: "sensor_readings", keyPath: "id" },
          { name: "interventions", keyPath: "id" },
          { name: "alerts", keyPath: "id" },
          { name: "weather_cache", keyPath: "locality" },
          { name: "assistant_history", keyPath: "id" },
          { name: "sync_queue", keyPath: "id" },
          { name: "hardware_devices", keyPath: "id" },
        ];

        for (const storeDef of stores) {
          if (!db.objectStoreNames.contains(storeDef.name)) {
            const store = db.createObjectStore(storeDef.name, { keyPath: storeDef.keyPath });
            if (storeDef.name === "sync_queue") {
              store.createIndex("status", "status", { unique: false });
              store.createIndex("entityType", "entityType", { unique: false });
            }
            if (storeDef.name === "fields" || storeDef.name === "crops" || storeDef.name === "scans" || storeDef.name === "hardware_devices") {
              store.createIndex("user_id", "user_id", { unique: false });
            }
          }
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // ── Generic IDB Operations ──────────────────────────────────────────────

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage
      return this.getLocalStorageFallback<T>(storeName);
    }
  }

  private async getByIdFromStore<T>(storeName: string, id: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getLocalStorageFallback<any>(storeName);
      return list.find((item) => item.id === id || item.locality === id) || null;
    }
  }

  private async putInStore<T extends { id?: string; locality?: string }>(storeName: string, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.putLocalStorageFallback(storeName, item);
    }
  }

  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.deleteLocalStorageFallback(storeName, id);
    }
  }

  private async clearStore(storeName: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`agrisight_fallback_${storeName}`);
      }
    }
  }

  async clearUserData(userId?: string): Promise<void> {
    const stores = ["fields", "crops", "scans", "sensor_readings", "interventions", "alerts"] as const;
    if (!userId) {
      for (const store of stores) {
        await this.clearStore(store);
      }
      return;
    }
    for (const store of stores) {
      const items = await this.getAllFromStore<any>(store);
      for (const item of items) {
        if (item.user_id === userId) {
          await this.deleteFromStore(store, item.id);
        }
      }
    }
  }

  // ── LocalStorage Fallback Helpers ────────────────────────────────────────

  private getLocalStorageFallback<T>(storeName: string): T[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`agrisight_fallback_${storeName}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private putLocalStorageFallback<T extends { id?: string; locality?: string }>(storeName: string, item: T): void {
    if (typeof window === "undefined") return;
    try {
      const key = `agrisight_fallback_${storeName}`;
      const items = this.getLocalStorageFallback<any>(storeName);
      const idKey = item.id ? "id" : "locality";
      const idx = items.findIndex((x) => x[idKey] === item[idKey]);
      if (idx >= 0) {
        items[idx] = item;
      } else {
        items.push(item);
      }
      localStorage.setItem(key, JSON.stringify(items));
    } catch { }
  }

  private deleteLocalStorageFallback(storeName: string, id: string): void {
    if (typeof window === "undefined") return;
    try {
      const key = `agrisight_fallback_${storeName}`;
      const items = this.getLocalStorageFallback<any>(storeName).filter(
        (x) => x.id !== id && x.locality !== id
      );
      localStorage.setItem(key, JSON.stringify(items));
    } catch { }
  }

  // ── Fields API ──────────────────────────────────────────────────────────

  async getFields(userId?: string): Promise<OfflineField[]> {
    const all = await this.getAllFromStore<OfflineField>("fields");
    if (!userId) return all;
    return all.filter((f) => f.user_id === userId);
  }

  async getField(id: string): Promise<OfflineField | null> {
    return await this.getByIdFromStore<OfflineField>("fields", id);
  }

  async saveField(field: OfflineField): Promise<void> {
    await this.putInStore("fields", field);
  }

  async deleteField(id: string): Promise<void> {
    await this.deleteFromStore("fields", id);
  }

  // ── Crops API ───────────────────────────────────────────────────────────

  async getCrops(userId?: string, fieldId?: string): Promise<OfflineCrop[]> {
    let all = await this.getAllFromStore<OfflineCrop>("crops");
    if (userId) all = all.filter((c) => c.user_id === userId);
    if (fieldId) all = all.filter((c) => c.field_id === fieldId);
    return all;
  }

  async getCrop(id: string): Promise<OfflineCrop | null> {
    return await this.getByIdFromStore<OfflineCrop>("crops", id);
  }

  async saveCrop(crop: OfflineCrop): Promise<void> {
    await this.putInStore("crops", crop);
  }

  async deleteCrop(id: string): Promise<void> {
    await this.deleteFromStore("crops", id);
  }

  // ── Scans API (a5.md Sections 6, 7, 8, 9, 10, 16) ───────────────────────

  async getScans(userId?: string, cropId?: string, fieldId?: string): Promise<OfflineScan[]> {
    let all = await this.getAllFromStore<OfflineScan>("scans");
    if (userId && userId !== "local_farmer") {
      const userScans = all.filter((s) => s.user_id === userId);
      if (userScans.length > 0) {
        all = userScans;
      }
    }
    if (cropId) all = all.filter((s) => s.crop_id === cropId);
    if (fieldId) all = all.filter((s) => s.field_id === fieldId);
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * a5.md Section 9: getLatestCompletedScan(userId)
   * Current authenticated user -> Their scans -> COMPLETED only -> Newest first -> First result
   */
  async getLatestCompletedScan(userId?: string, fieldId?: string, cropId?: string): Promise<OfflineScan | null> {
    const scans = await this.getRecentCompletedScans(userId, 1, fieldId, cropId);
    return scans.length > 0 ? scans[0] : null;
  }

  /**
   * a5.md Section 10: getRecentCompletedScans(userId, limit = 5)
   * Return the user's most recent completed scans for Assistant context.
   */
  async getRecentCompletedScans(userId?: string, limit = 5, fieldId?: string, cropId?: string): Promise<OfflineScan[]> {
    let all = await this.getAllFromStore<OfflineScan>("scans");
    // Filter completed scans only
    all = all.filter((s) => !s.status || s.status === "COMPLETED");

    // Scoped to authenticated user ID
    if (userId && userId !== "local_farmer") {
      const userScans = all.filter((s) => s.user_id === userId);
      if (userScans.length > 0) {
        all = userScans;
      }
    }
    if (cropId) all = all.filter((s) => s.crop_id === cropId);
    if (fieldId) all = all.filter((s) => s.field_id === fieldId);

    return all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  async getScan(id: string): Promise<OfflineScan | null> {
    return await this.getByIdFromStore<OfflineScan>("scans", id);
  }

  async saveScan(scan: OfflineScan): Promise<void> {
    // a5.md Section 7: Every scan must have a unique ID (scan_<id>)
    const scanId = scan.id.startsWith("scan_") ? scan.id : `scan_${scan.id}`;

    // a5.md Section 6: Canonical structured result
    const rj = scan.result_json || {};
    const innerResult = rj.result || rj;

    const cropName =
      scan.analysis?.crop ||
      innerResult.crop ||
      rj.crop ||
      (scan.crop_id ? (await this.getCrop(scan.crop_id))?.name : undefined) ||
      "Crop";

    const conditionName =
      scan.analysis?.condition ||
      scan.disease ||
      innerResult.condition ||
      innerResult.disease ||
      "Healthy Plant";

    const severityVal =
      scan.analysis?.severity ||
      scan.severity ||
      innerResult.severity ||
      "Low";

    const rawActions =
      scan.analysis?.recommendedActions ||
      innerResult.actions ||
      innerResult.immediate_actions ||
      rj.actions ||
      [];

    const rawObs =
      scan.analysis?.observations ||
      innerResult.observations ||
      innerResult.symptoms ||
      (innerResult.summary ? [innerResult.summary] : []);

    const rawCauses =
      scan.analysis?.possibleCauses ||
      innerResult.possible_causes ||
      [];

    const rawPrev =
      scan.analysis?.prevention ||
      innerResult.prevention_steps ||
      (innerResult.prevention ? [innerResult.prevention] : []);

    const rawRisks =
      scan.analysis?.riskFlags ||
      innerResult.weather_risks ||
      [];

    const structuredScan: OfflineScan = {
      ...scan,
      id: scanId,
      status: "COMPLETED",
      provider: scan.provider || "gemini",
      language: scan.language || (typeof window !== "undefined" ? (localStorage.getItem("agrisight_lang") as any) || "en" : "en"),
      analysis: {
        crop: cropName,
        condition: conditionName,
        severity: severityVal,
        confidence: scan.confidence || innerResult.confidence,
        observations: Array.isArray(rawObs) ? rawObs : [],
        possibleCauses: Array.isArray(rawCauses) ? rawCauses : [],
        recommendedActions: Array.isArray(rawActions) ? rawActions : [],
        prevention: Array.isArray(rawPrev) ? rawPrev : [],
        riskFlags: Array.isArray(rawRisks) ? rawRisks : [],
      },
    };

    await this.putInStore("scans", structuredScan);

    // a5.md Section 16: Emit SCAN_COMPLETED so Assistant immediately accesses the new scan
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("SCAN_COMPLETED", { detail: { id: scanId, scan: structuredScan } }));
      window.dispatchEvent(new CustomEvent("scanCompleted", { detail: { id: scanId, scan: structuredScan } }));
      window.dispatchEvent(new CustomEvent("scan_saved", { detail: { id: scanId, scan: structuredScan } }));
    }
  }

  // ── Sensor Readings API ─────────────────────────────────────────────────

  async getSensorReadings(fieldId?: string, userId?: string): Promise<OfflineSensorReading[]> {
    let all = await this.getAllFromStore<OfflineSensorReading>("sensor_readings");
    if (userId) all = all.filter((r) => r.user_id === userId);
    if (fieldId) all = all.filter((r) => r.field_id === fieldId);
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async saveSensorReading(reading: OfflineSensorReading): Promise<void> {
    await this.putInStore("sensor_readings", reading);
  }

  // ── Interventions API ───────────────────────────────────────────────────

  async getInterventions(userId?: string, fieldId?: string, cropId?: string): Promise<OfflineIntervention[]> {
    let all = await this.getAllFromStore<OfflineIntervention>("interventions");
    if (userId) all = all.filter((i) => i.user_id === userId);
    if (fieldId) all = all.filter((i) => i.field_id === fieldId);
    if (cropId) all = all.filter((i) => i.crop_id === cropId);
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async saveIntervention(intervention: OfflineIntervention): Promise<void> {
    await this.putInStore("interventions", intervention);
  }

  async deleteIntervention(id: string): Promise<void> {
    await this.deleteFromStore("interventions", id);
  }

  // ── Alerts API ────────────────────────────────────────────────────────────

  async getAlerts(userId?: string): Promise<OfflineAlert[]> {
    let all = await this.getAllFromStore<OfflineAlert>("alerts");
    if (userId) all = all.filter((a) => a.user_id === userId);
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async saveAlert(alert: OfflineAlert): Promise<void> {
    await this.putInStore("alerts", alert);
  }

  // ── Weather Cache API ───────────────────────────────────────────────────

  async getWeatherCache(locality?: string): Promise<OfflineWeatherCache | null> {
    if (locality) {
      return await this.getByIdFromStore<OfflineWeatherCache>("weather_cache", locality);
    }
    const all = await this.getAllFromStore<OfflineWeatherCache>("weather_cache");
    return all.length > 0 ? all[0] : null;
  }

  async saveWeatherCache(cache: OfflineWeatherCache): Promise<void> {
    await this.putInStore("weather_cache", cache);
  }

  // ── Sync Queue API ──────────────────────────────────────────────────────

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return await this.getAllFromStore<SyncQueueItem>("sync_queue");
  }

  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    const all = await this.getSyncQueue();
    return all.filter((item) => item.status === "PENDING_SYNC" || item.status === "SYNC_FAILED");
  }

  async enqueueSyncItem(item: Omit<SyncQueueItem, "id" | "createdAt" | "updatedAt" | "retryCount">): Promise<SyncQueueItem> {
    const fullItem: SyncQueueItem = {
      ...item,
      id: "sync_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9),
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.putInStore("sync_queue", fullItem);
    return fullItem;
  }

  async updateSyncItem(item: SyncQueueItem): Promise<void> {
    item.updatedAt = new Date().toISOString();
    await this.putInStore("sync_queue", item);
  }

  async removeSyncItem(id: string): Promise<void> {
    await this.deleteFromStore("sync_queue", id);
  }

  // ── Hardware Devices API (§7 & §14) ──────────────────────────────────────

  async getHardwareDevices(userId?: string): Promise<HardwareDevice[]> {
    let all = await this.getAllFromStore<HardwareDevice>("hardware_devices");
    if (userId) {
      all = all.filter((d) => d.user_id === userId);
    }
    return all;
  }

  async saveHardwareDevice(device: HardwareDevice): Promise<void> {
    await this.putInStore("hardware_devices", device);
  }

  async deleteHardwareDevice(id: string): Promise<void> {
    await this.deleteFromStore("hardware_devices", id);
  }
}

export const offlineDb = new OfflineDBService();
