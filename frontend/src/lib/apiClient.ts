import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabaseClient";
import { offlineDb, OfflineField, OfflineCrop, OfflineScan, OfflineIntervention } from "./offlineDb";
import { syncManager } from "./syncManager";
import { LocalAIEngine } from "./localAIEngine";
import { WeatherCacheService } from "./weatherCache";
import { HybridAssistantService } from "./hybridAssistant";
import { AlertEngine } from "./alertEngine";
import { AssistantContextService } from "./assistantContextService";

export function logAndroidScan(stage: string, details: { api?: string; image?: string; status?: string; error?: string }) {
  console.log(`[ANDROID SCAN]\nAPI: ${details.api || getFastApiUrl() + "/analyze"}\nImage: ${details.image || "N/A"}\nStage: ${stage}\nStatus: ${details.status || "In Progress"}\nError: ${details.error || "None"}`);
}

export function logAndroidAI(stage: string, details: { api?: string; language?: string; status?: string; error?: string }) {
  console.log(`[ANDROID AI]\nAPI: ${details.api || getFastApiUrl() + "/assistant/chat"}\nLanguage: ${details.language || "en"}\nStage: ${stage}\nStatus: ${details.status || "In Progress"}\nError: ${details.error || "None"}`);
}

export function getFastApiUrl(): string {
  if (typeof window !== "undefined") {
    // 1. Dynamic override from settings or mobile preferences
    const customUrl = localStorage.getItem("agrisight_api_url");
    if (customUrl) return customUrl.replace(/\/+$/, "");

    // 2. Production URL configured in environment
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    }
    return "/api/backend";
  }
  return process.env.NEXT_PUBLIC_API_URL || "/api/backend";
}


async function getAuthHeaders(isFormData = false) {
  const headers: Record<string, string> = {};
  try {
    let token: string | undefined;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    } else if (typeof window !== "undefined") {
      // Fallback: read directly from localStorage if getSession() is momentarily unreachable
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const parsed = JSON.parse(item);
              if (parsed?.access_token) {
                token = parsed.access_token;
                break;
              }
            } catch { }
          }
        }
      }
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    // Graceful offline/local fallback
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;
  } catch {}
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed?.user?.id) return parsed.user.id;
          }
        } catch {}
      }
    }
    const cachedProfile = localStorage.getItem("agrisight_cached_profile");
    if (cachedProfile) {
      try {
        const p = JSON.parse(cachedProfile);
        if (p?.id) return p.id;
      } catch {}
    }
  }
  return undefined;
}

async function safeFetch<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 30000): Promise<T> {
  const primaryUrl = getFastApiUrl();
  const candidateUrls: string[] = [primaryUrl];

  // In production (HTTPS), only use the configured production URL to prevent dead local IP timeouts
  if (!primaryUrl.startsWith("https://")) {
    if (Capacitor.isNativePlatform() || (typeof window !== "undefined" && window.location.protocol === "capacitor:")) {
      // ADB reverse (127.0.0.1) and Android emulator (10.0.2.2) only — no LAN IPs in production code
      const mobileFallbacks = ["http://127.0.0.1:8000", "http://10.0.2.2:8000"];
      for (const fb of mobileFallbacks) {
        if (!candidateUrls.includes(fb)) candidateUrls.push(fb);
      }
    } else {
      // Web desktop fallbacks: try direct backend and proxy rewrite
      const webFallbacks = ["http://127.0.0.1:8000", "http://localhost:8000", "/api/backend"];
      for (const fb of webFallbacks) {
        if (!candidateUrls.includes(fb)) candidateUrls.push(fb);
      }
    }
  }

  let lastError: any = null;

  for (let i = 0; i < candidateUrls.length; i++) {
    const baseUrl = candidateUrls[i];
    const controller = new AbortController();
    const candidateTimeout = timeoutMs;
    const id = setTimeout(() => controller.abort(), candidateTimeout);
    const config = { ...options, signal: controller.signal };

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, config);
      clearTimeout(id);

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        if (result && result.error) {
          throw new Error(result.error.message || "Request failed");
        }
        throw new Error(`Server error (${response.status}). Please try again later.`);
      }

      if (!result) throw new Error("Invalid response from server.");
      if (result.status === "error") throw new Error(result.error?.message || "An unexpected error occurred.");

      // Save successful URL for subsequent fast calls
      if (typeof window !== "undefined" && baseUrl !== primaryUrl && !baseUrl.startsWith("/")) {
        localStorage.setItem("agrisight_api_url", baseUrl);
      }

      return (result.data !== undefined ? result.data : result) as T;
    } catch (error: any) {
      clearTimeout(id);
      lastError = error;
      // If client explicitly aborted due to timeout, break immediately
      if (error?.name === "AbortError" && i > 0) {
        break;
      }
      if (i < candidateUrls.length - 1) {
        continue;
      }
    }
  }

  if (lastError?.name === "AbortError") throw new Error("Request timed out. The server took too long to respond.");
  if (lastError?.message === "Failed to fetch") throw new Error("Unable to reach the server. Please check your connection.");
  throw lastError || new Error("Network request failed");
}

import { cachedFetch, invalidateCache } from "./apiCache";

export { invalidateCache };

export const api = {
  // ── Analysis ──────────────────────────────────────────────────────────────
  async getAnalyses(forceRefresh = false) {
    const userId = await getCurrentUserId();
    const local = await offlineDb.getScans(userId);
    if (typeof window !== "undefined" && !navigator.onLine && local.length > 0 && !forceRefresh) {
      return local.map((s) => ({
        id: s.id,
        disease: s.disease,
        severity: s.severity,
        confidence: s.confidence,
        image_url: s.image_url,
        created_at: s.created_at,
        crop_id: s.crop_id,
        field_id: s.field_id,
        ...(typeof s.result_json === "object" ? s.result_json : {}),
      }));
    }

    try {
      const remote = await safeFetch<any[]>("/analyses", {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);

      if (Array.isArray(remote)) {
        for (const a of remote) {
          await offlineDb.saveScan({
            id: a.id,
            user_id: a.user_id || userId || "local",
            image_url: a.image_url,
            disease: a.disease || "Diagnosed Condition",
            severity: a.severity || "Low",
            confidence: a.confidence || 0.85,
            result_json: a,
            crop_id: a.crop_id,
            field_id: a.field_id,
            created_at: a.created_at,
            sync_status: "SYNCED",
          });
        }
      }
    } catch { }

    const updated = await offlineDb.getScans(userId);
    return updated.map((s) => ({
      id: s.id,
      disease: s.disease,
      severity: s.severity,
      confidence: s.confidence,
      image_url: s.image_url,
      created_at: s.created_at,
      crop_id: s.crop_id,
      field_id: s.field_id,
      ...(typeof s.result_json === "object" ? s.result_json : {}),
    }));
  },

  async getAnalysis(id: string, forceRefresh = false) {
    const local = await offlineDb.getScan(id);
    if (typeof window !== "undefined" && !navigator.onLine && local && !forceRefresh) {
      return {
        id: local.id,
        disease: local.disease,
        severity: local.severity,
        confidence: local.confidence,
        image_url: local.image_url,
        created_at: local.created_at,
        crop_id: local.crop_id,
        field_id: local.field_id,
        ...(typeof local.result_json === "object" ? local.result_json : {}),
      };
    }

    try {
      const remote = await safeFetch<any>(`/analyses/${id}`, {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);

      if (remote && remote.id) {
        await offlineDb.saveScan({
          id: remote.id,
          user_id: remote.user_id || "local",
          image_url: remote.image_url,
          disease: remote.disease,
          severity: remote.severity,
          confidence: remote.confidence,
          result_json: remote,
          crop_id: remote.crop_id,
          field_id: remote.field_id,
          created_at: remote.created_at,
          sync_status: "SYNCED",
        });
        return remote;
      }
    } catch { }

    if (local) {
      return {
        id: local.id,
        disease: local.disease,
        severity: local.severity,
        confidence: local.confidence,
        image_url: local.image_url,
        created_at: local.created_at,
        crop_id: local.crop_id,
        field_id: local.field_id,
        ...(typeof local.result_json === "object" ? local.result_json : {}),
      };
    }
    return null;
  },

  async uploadAnalysis(file: File | Blob, lat?: string, lon?: string, question?: string, cropId?: string, fieldId?: string, language = "en") {
    const actualFile = file instanceof File ? file : new File([file], "leaf_scan.jpg", { type: file.type || "image/jpeg" });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || "local_farmer";

    let cropName = "Paddy / Rice";
    let fieldName = "My Field";
    if (cropId) {
      const c = await offlineDb.getCrop(cropId);
      if (c) cropName = c.name;
    }
    if (fieldId) {
      const f = await offlineDb.getField(fieldId);
      if (f) fieldName = f.name;
    }

    logAndroidScan("Pre-Upload Validation", {
      image: `${actualFile.name} (${Math.round(actualFile.size / 1024)} KB, ${actualFile.type})`,
      status: "Preparing analysis payload",
    });

    // 1. Try remote cloud analysis if online
    if (typeof window !== "undefined" && navigator.onLine) {
      try {
        const formData = new FormData();
        formData.append("image", actualFile);
        formData.append("file", actualFile);
        if (question) formData.append("question", question);
        if (lat) formData.append("lat", lat);
        if (lon) formData.append("lon", lon);
        if (language) formData.append("language", language);
        if (cropId) formData.append("crop_id", cropId);
        if (fieldId) formData.append("field_id", fieldId);

        logAndroidScan("Backend Transmission", {
          image: actualFile.name,
          status: "Sending to /analyze",
        });

        const res = await safeFetch<any>("/analyze", {
          method: "POST",
          body: formData,
          headers: await getAuthHeaders(true),
        }, 15000);

        if (res && res.id) {
          const innerResult = res.result || {};
          const isAgri = innerResult.is_agricultural !== false && res.is_agricultural !== false && innerResult.validation_status !== "NON_CROP" && innerResult.status !== "non_crop";
          const diagDisease = innerResult.disease || (isAgri ? (res.disease || "Diagnosed Condition") : "Non-Crop Image");

          res.is_agricultural = isAgri;
          res.status = innerResult.status || (isAgri ? "success" : "non_crop");
          res.validation_status = innerResult.validation_status || (isAgri ? "VALID" : "NON_CROP");
          res.disease = diagDisease;
          res.severity = innerResult.severity || (isAgri ? (res.severity || "Low") : "Healthy");
          res.confidence = innerResult.confidence || res.confidence || (isAgri ? 0.85 : 0.95);

          await offlineDb.saveScan({
            id: res.id,
            user_id: userId,
            image_url: res.image_url || URL.createObjectURL(actualFile),
            disease: diagDisease,
            severity: res.severity,
            confidence: res.confidence,
            result_json: res,
            crop_id: cropId,
            field_id: fieldId,
            question,
            created_at: res.created_at || new Date().toISOString(),
            sync_status: "SYNCED",
            status: "COMPLETED",
            provider: "gemini",
            language: (language as "en" | "hi" | "bn") || "en",
            analysis: {
              crop: innerResult.crop || res.crop || cropName,
              condition: diagDisease,
              severity: res.severity,
              confidence: res.confidence,
              observations: Array.isArray(innerResult.observations) ? innerResult.observations : (innerResult.summary ? [innerResult.summary] : []),
              possibleCauses: Array.isArray(innerResult.possible_causes) ? innerResult.possible_causes : [],
              recommendedActions: Array.isArray(innerResult.actions) ? innerResult.actions : (innerResult.recommended_actions || []),
              prevention: Array.isArray(innerResult.prevention_steps) ? innerResult.prevention_steps : [],
              riskFlags: Array.isArray(innerResult.weather_risks) ? innerResult.weather_risks : [],
            },
          });
          AssistantContextService.invalidate();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("scanCompleted", { detail: { id: res.id } }));
            window.dispatchEvent(new CustomEvent("scan_saved", { detail: { id: res.id } }));
          }
          invalidateCache("analyses");
          return res;
        }
      } catch (cloudErr) {
        console.warn("[AgriSight Scan] Cloud analysis fallback to Local AI:", cloudErr);
      }
    }

    // 2. Local AI Engine (100% Laptop-Independent & Offline)
    logAndroidScan("Local AI Execution", {
      image: actualFile.name,
      status: "Running on-device agronomic pathology engine",
    });

    const localResult = await LocalAIEngine.analyzeOffline(actualFile, cropName, fieldName);

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(actualFile);
    });

    const scanId = "scan_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const isAgri = localResult.is_agricultural !== false;
    const packagedResult = {
      id: scanId,
      disease: localResult.disease,
      scientific_name: localResult.scientific_name,
      confidence: localResult.confidence,
      severity: localResult.severity,
      pathogen_type: localResult.pathogen_type,
      crop_detected: localResult.crop_detected,
      image_url: dataUrl,
      created_at: new Date().toISOString(),
      crop_id: cropId || "",
      field_id: fieldId || "",
      summary: localResult.diagnosis_summary,
      immediate_actions: localResult.immediate_actions,
      organic_treatments: localResult.organic_treatments,
      chemical_treatments: localResult.chemical_treatments,
      preventive_measures: localResult.preventive_measures,
      weather_risks: localResult.weather_risks || [],
      is_offline: true,
      sync_status: "PENDING_SYNC",
      is_agricultural: isAgri,
      status: localResult.status || (isAgri ? "success" : "non_crop"),
      validation_status: localResult.validation_status || (isAgri ? "VALID" : "NON_CROP"),
      rejection_reason: localResult.rejection_reason,
    };

    await offlineDb.saveScan({
      id: scanId,
      user_id: userId,
      image_url: dataUrl,
      disease: localResult.disease,
      severity: localResult.severity,
      confidence: localResult.confidence,
      result_json: packagedResult,
      crop_id: cropId,
      field_id: fieldId,
      question,
      created_at: packagedResult.created_at,
      sync_status: "PENDING_SYNC",
      status: "COMPLETED",
      provider: "local",
      language: (language as "en" | "hi" | "bn") || "en",
      analysis: {
        crop: localResult.crop_detected || cropName,
        condition: localResult.disease,
        severity: localResult.severity,
        confidence: localResult.confidence,
        observations: localResult.diagnosis_summary ? [localResult.diagnosis_summary] : [],
        possibleCauses: [],
        recommendedActions: Array.isArray(localResult.immediate_actions) ? localResult.immediate_actions : [],
        prevention: Array.isArray(localResult.preventive_measures) ? localResult.preventive_measures : [],
        riskFlags: Array.isArray(localResult.weather_risks) ? localResult.weather_risks : [],
      },
    });

    if (isAgri) {
      await offlineDb.enqueueSyncItem({
        entityType: "scan",
        action: "create",
        entityId: scanId,
        payload: packagedResult,
        status: "PENDING_SYNC",
      });
      if (fieldId) {
        AlertEngine.evaluateFieldConditions(fieldId).catch(() => {});
      }
    }

    AssistantContextService.invalidate();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("scanCompleted", { detail: { id: scanId } }));
      window.dispatchEvent(new CustomEvent("scan_saved", { detail: { id: scanId } }));
    }

    invalidateCache("analyses");
    return packagedResult;
  },

  async assignCropToAnalysis(analysisId: string, cropId: string) {
    const scan = await offlineDb.getScan(analysisId);
    if (scan) {
      scan.crop_id = cropId;
      await offlineDb.saveScan(scan);
    }
    const res = await safeFetch<any>(`/analyses/${analysisId}/crop?crop_id=${cropId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    }).catch(() => null);
    invalidateCache("analyses");
    return res || { success: true };
  },

  async assignFieldToAnalysis(analysisId: string, fieldId: string) {
    const scan = await offlineDb.getScan(analysisId);
    if (scan) {
      scan.field_id = fieldId;
      await offlineDb.saveScan(scan);
    }
    const res = await safeFetch<any>(`/analyses/${analysisId}/field?field_id=${fieldId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    }).catch(() => null);
    invalidateCache("analyses");
    invalidateCache("fields");
    if (fieldId) {
      AlertEngine.evaluateFieldConditions(fieldId).catch(() => {});
    }
    return res || { success: true };
  },

  async getAnalysisProgression(id: string, forceRefresh = false) {
    return await cachedFetch<any>(
      `progression_${id}`,
      async () =>
        await safeFetch<any>(`/analyses/${id}/progression`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000).catch(() => ({ progression: [] })),
      30000,
      forceRefresh
    );
  },

  async compareAnalyses(scan1Id: string, scan2Id: string) {
    const scan1 = await offlineDb.getScan(scan1Id);
    const scan2 = await offlineDb.getScan(scan2Id);

    if (scan1 && scan2) {
      return {
        scan1: { id: scan1.id, disease: scan1.disease, severity: scan1.severity, created_at: scan1.created_at },
        scan2: { id: scan2.id, disease: scan2.disease, severity: scan2.severity, created_at: scan2.created_at },
        comparison_notes: `Comparison between ${scan1.disease} (${scan1.severity}) and ${scan2.disease} (${scan2.severity}).`,
      };
    }

    return await cachedFetch<any>(
      `compare_${scan1Id}_${scan2Id}`,
      async () =>
        await safeFetch<any>(`/analyses/compare?scan1_id=${scan1Id}&scan2_id=${scan2Id}`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000).catch(() => null),
      60000
    );
  },

  // ── Fields API (Offline-First) ──────────────────────────────────────────
  async getFields(forceRefresh = false) {
    const userId = await getCurrentUserId();
    const local = await offlineDb.getFields(userId);
    if (typeof window !== "undefined" && !navigator.onLine && local.length > 0 && !forceRefresh) {
      return local;
    }

    try {
      const remote = await safeFetch<any[]>("/fields", {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);

      if (Array.isArray(remote)) {
        for (const f of remote) {
          await offlineDb.saveField({
            id: f.id,
            user_id: f.user_id || userId || "local_farmer",
            name: f.name,
            location_name: f.location_name,
            latitude: f.latitude,
            longitude: f.longitude,
            area_acres: f.area_acres,
            soil_type: f.soil_type,
            irrigation_type: f.irrigation_type,
            notes: f.notes,
            created_at: f.created_at || new Date().toISOString(),
            updated_at: f.updated_at || new Date().toISOString(),
            sync_status: "SYNCED",
          });
        }
      }
    } catch {}

    const all = await offlineDb.getFields(userId);
    return all.map((f: any) => ({
      ...f,
      health_score: f.health_score ?? 88,
      status: f.status ?? "Active",
      crop_count: f.crop_count ?? 1,
      active_hotspots: f.active_hotspots ?? 0,
      irrigation_type: f.irrigation_type || "Drip / Canal",
    })) as any[];
  },

  async getField(id: string, forceRefresh = false) {
    const local = await offlineDb.getField(id);
    if (typeof window !== "undefined" && !navigator.onLine && local && !forceRefresh) {
      return {
        ...local,
        health_score: (local as any).health_score ?? 88,
        status: (local as any).status ?? "Active",
        crop_count: (local as any).crop_count ?? 1,
        active_hotspots: (local as any).active_hotspots ?? 0,
        irrigation_type: local.irrigation_type || "Drip / Canal",
      } as any;
    }

    try {
      const remote = await safeFetch<any>(`/fields/${id}`, {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);

      if (remote && remote.id) {
        await offlineDb.saveField({
          id: remote.id,
          user_id: remote.user_id || "local_farmer",
          name: remote.name,
          location_name: remote.location_name,
          latitude: remote.latitude,
          longitude: remote.longitude,
          area_acres: remote.area_acres,
          soil_type: remote.soil_type,
          irrigation_type: remote.irrigation_type,
          notes: remote.notes,
          created_at: remote.created_at || new Date().toISOString(),
          updated_at: remote.updated_at || new Date().toISOString(),
          sync_status: "SYNCED",
        });
        return {
          ...remote,
          health_score: remote.health_score ?? 88,
          status: remote.status ?? "Active",
          crop_count: remote.crop_count ?? 1,
          active_hotspots: remote.active_hotspots ?? 0,
        };
      }
    } catch {}

    if (local) {
      return {
        ...local,
        health_score: (local as any).health_score ?? 88,
        status: (local as any).status ?? "Active",
        crop_count: (local as any).crop_count ?? 1,
        active_hotspots: (local as any).active_hotspots ?? 0,
        irrigation_type: local.irrigation_type || "Drip / Canal",
      } as any;
    }
    return null;
  },

  async createField(data: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || "local_farmer";
    const fieldId = "field_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const record: OfflineField = {
      id: fieldId,
      user_id: userId,
      name: data.name || "My Field",
      location_name: data.location_name || "",
      latitude: data.latitude,
      longitude: data.longitude,
      area_acres: data.area_acres ? Number(data.area_acres) : undefined,
      soil_type: data.soil_type,
      irrigation_type: data.irrigation_type,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: "PENDING_SYNC",
    };

    await offlineDb.saveField(record);
    await offlineDb.enqueueSyncItem({
      entityType: "field",
      action: "create",
      entityId: fieldId,
      payload: record,
      status: "PENDING_SYNC",
    });

    if (typeof window !== "undefined" && navigator.onLine) {
      safeFetch<any>("/fields", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(record),
      }).then(async (res) => {
        if (res && res.id) {
          record.sync_status = "SYNCED";
          await offlineDb.saveField(record);
        }
      }).catch(() => {});
    }

    invalidateCache("fields");
    return record;
  },

  async updateField(id: string, data: any) {
    const existing = await offlineDb.getField(id);
    const updated: OfflineField = {
      id,
      user_id: existing?.user_id || "local_farmer",
      name: data.name !== undefined ? data.name : (existing?.name || "Field"),
      location_name: data.location_name !== undefined ? data.location_name : existing?.location_name,
      latitude: data.latitude !== undefined ? data.latitude : existing?.latitude,
      longitude: data.longitude !== undefined ? data.longitude : existing?.longitude,
      area_acres: data.area_acres !== undefined ? Number(data.area_acres) : existing?.area_acres,
      soil_type: data.soil_type !== undefined ? data.soil_type : existing?.soil_type,
      irrigation_type: data.irrigation_type !== undefined ? data.irrigation_type : existing?.irrigation_type,
      notes: data.notes !== undefined ? data.notes : existing?.notes,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: "PENDING_SYNC",
    };

    await offlineDb.saveField(updated);
    await offlineDb.enqueueSyncItem({
      entityType: "field",
      action: "update",
      entityId: id,
      payload: updated,
      status: "PENDING_SYNC",
    });

    if (typeof window !== "undefined" && navigator.onLine) {
      safeFetch<any>(`/fields/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }).catch(() => {});
    }

    invalidateCache("fields");
    return updated;
  },

  async deleteField(id: string) {
    await offlineDb.deleteField(id);
    await offlineDb.enqueueSyncItem({
      entityType: "field",
      action: "delete",
      entityId: id,
      payload: { id },
      status: "PENDING_SYNC",
    });

    if (typeof window !== "undefined" && navigator.onLine) {
      safeFetch<any>(`/fields/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }).catch(() => {});
    }

    invalidateCache("fields");
    return { success: true };
  },

  async getFieldAnalytics(id: string) {
    try {
      const res = await safeFetch<any>(`/fields/${id}/analytics`, {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);
      if (res) return res;
    } catch {}

    const field = await offlineDb.getField(id);
    const scans = await offlineDb.getScans(undefined, undefined, id);
    const sensors = await offlineDb.getSensorReadings(id);
    return {
      field_id: id,
      field_name: field?.name || "Field",
      health_score: scans.length > 0 ? 82 : 90,
      total_scans: scans.length,
      recent_readings_count: sensors.length,
      average_moisture: sensors.length > 0 ? sensors[0].soil_moisture || 48 : 50,
      is_offline: true,
    };
  },

  // ── Crops API (Offline-First) ────────────────────────────────────────────
  async getCrops(forceRefresh = false) {
    const userId = await getCurrentUserId();
    const local = await offlineDb.getCrops(userId);
    if (typeof window !== "undefined" && !navigator.onLine && local.length > 0 && !forceRefresh) {
      return local;
    }

    try {
      const remote = await safeFetch<any[]>("/crops", {
        method: "GET",
        headers: await getAuthHeaders(),
      }, 7000);

      if (Array.isArray(remote)) {
        for (const c of remote) {
          await offlineDb.saveCrop({
            id: c.id,
            user_id: c.user_id || userId || "local_farmer",
            name: c.name,
            variety: c.variety,
            planting_date: c.planting_date,
            growth_stage: c.growth_stage,
            field_name: c.field_name,
            field_id: c.field_id,
            notes: c.notes,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at || new Date().toISOString(),
            sync_status: "SYNCED",
          });
        }
      }
    } catch {}

    return await offlineDb.getCrops(userId);
  },
  async getCrop(id: string, forceRefresh = false) {
  const local = await offlineDb.getCrop(id);
  if (typeof window !== "undefined" && !navigator.onLine && local && !forceRefresh) {
    return local;
  }

  try {
    const remote = await safeFetch<any>(`/crops/${id}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    }, 7000);

    if (remote && remote.id) {
      await offlineDb.saveCrop({
        id: remote.id,
        user_id: remote.user_id || "local_farmer",
        name: remote.name,
        variety: remote.variety,
        planting_date: remote.planting_date,
        growth_stage: remote.growth_stage,
        field_name: remote.field_name,
        field_id: remote.field_id,
        notes: remote.notes,
        created_at: remote.created_at || new Date().toISOString(),
        updated_at: remote.updated_at || new Date().toISOString(),
        sync_status: "SYNCED",
      });
      return remote;
    }
  } catch { }

  return local;
},

  async createCrop(data: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "local_farmer";
  const cropId = "crop_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const record: OfflineCrop = {
    id: cropId,
    user_id: userId,
    name: data.name || "Crop",
    variety: data.variety,
    planting_date: data.planting_date,
    growth_stage: data.growth_stage,
    field_name: data.field_name,
    field_id: data.field_id,
    notes: data.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: "PENDING_SYNC",
  };

  await offlineDb.saveCrop(record);
  await offlineDb.enqueueSyncItem({
    entityType: "crop",
    action: "create",
    entityId: cropId,
    payload: record,
    status: "PENDING_SYNC",
  });

  if (typeof window !== "undefined" && navigator.onLine) {
    safeFetch<any>("/crops", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(record),
    }).then(async (res) => {
      if (res && res.id) {
        record.sync_status = "SYNCED";
        await offlineDb.saveCrop(record);
      }
    }).catch(() => { });
  }

  invalidateCache("crops");
  return record;
},

  async updateCrop(id: string, data: any) {
  const existing = await offlineDb.getCrop(id);
  const updated: OfflineCrop = {
    id,
    user_id: existing?.user_id || "local_farmer",
    name: data.name !== undefined ? data.name : (existing?.name || "Crop"),
    variety: data.variety !== undefined ? data.variety : existing?.variety,
    planting_date: data.planting_date !== undefined ? data.planting_date : existing?.planting_date,
    growth_stage: data.growth_stage !== undefined ? data.growth_stage : existing?.growth_stage,
    field_name: data.field_name !== undefined ? data.field_name : existing?.field_name,
    field_id: data.field_id !== undefined ? data.field_id : existing?.field_id,
    notes: data.notes !== undefined ? data.notes : existing?.notes,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_status: "PENDING_SYNC",
  };

  await offlineDb.saveCrop(updated);
  await offlineDb.enqueueSyncItem({
    entityType: "crop",
    action: "update",
    entityId: id,
    payload: updated,
    status: "PENDING_SYNC",
  });

  if (typeof window !== "undefined" && navigator.onLine) {
    safeFetch<any>(`/crops/${id}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    }).catch(() => { });
  }

  invalidateCache("crops");
  return updated;
},

  async deleteCrop(id: string) {
  await offlineDb.deleteCrop(id);
  await offlineDb.enqueueSyncItem({
    entityType: "crop",
    action: "delete",
    entityId: id,
    payload: { id },
    status: "PENDING_SYNC",
  });

  if (typeof window !== "undefined" && navigator.onLine) {
    safeFetch<any>(`/crops/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }).catch(() => { });
  }

  invalidateCache("crops");
  return { success: true };
},

  // ── Interventions API (Offline-First) ────────────────────────────────────
  async getInterventions(filter ?: { crop_id?: string; field_id?: string }) {
  const userId = await getCurrentUserId();
  const local = await offlineDb.getInterventions(userId, filter?.field_id, filter?.crop_id);
  if (typeof window !== "undefined" && !navigator.onLine && local.length > 0) {
    return local;
  }

  try {
    const q = new URLSearchParams();
    if (filter?.crop_id) q.set("crop_id", filter.crop_id);
    if (filter?.field_id) q.set("field_id", filter.field_id);
    const qs = q.toString() ? `?${q.toString()}` : "";

    const remote = await safeFetch<any[]>(`/interventions${qs}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    }, 7000);

    if (Array.isArray(remote)) {
      for (const i of remote) {
        await offlineDb.saveIntervention({
          id: i.id,
          user_id: i.user_id || userId || "local_farmer",
          action_type: i.action_type || "Intervention",
          action_title: i.action_title || i.title || "Field Care",
          crop_id: i.crop_id,
          field_id: i.field_id,
          notes: i.notes,
          performed_at: i.performed_at || new Date().toISOString(),
          created_at: i.created_at || new Date().toISOString(),
          sync_status: "SYNCED",
        });
      }
    }
  } catch { }

    const res = await offlineDb.getInterventions(userId, filter?.field_id, filter?.crop_id);
    return res.map((i) => ({
      ...i,
      notes: i.notes || "",
    })) as any[];
  },

  async createIntervention(data: any) {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || "local_farmer";
  const intId = "int_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const record: OfflineIntervention = {
    id: intId,
    user_id: userId,
    action_type: data.action_type || "Intervention",
    action_title: data.action_title || data.title || "Field Care",
    crop_id: data.crop_id,
    field_id: data.field_id,
    notes: data.notes,
    performed_at: data.performed_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    sync_status: "PENDING_SYNC",
  };

  await offlineDb.saveIntervention(record);
  await offlineDb.enqueueSyncItem({
    entityType: "intervention",
    action: "create",
    entityId: intId,
    payload: record,
    status: "PENDING_SYNC",
  });

  if (typeof window !== "undefined" && navigator.onLine) {
    safeFetch<any>("/interventions", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(record),
    }).then(async (res) => {
      if (res && res.id) {
        record.sync_status = "SYNCED";
        await offlineDb.saveIntervention(record);
      }
    }).catch(() => { });
  }

  invalidateCache("interventions");
  return record;
},

  async deleteIntervention(id: string) {
  await offlineDb.deleteIntervention(id);
  await offlineDb.enqueueSyncItem({
    entityType: "intervention",
    action: "delete",
    entityId: id,
    payload: { id },
    status: "PENDING_SYNC",
  });

  if (typeof window !== "undefined" && navigator.onLine) {
    safeFetch<any>(`/interventions/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }).catch(() => { });
  }

  invalidateCache("interventions");
  return { success: true };
},

  // ── Notifications / Alerts ───────────────────────────────────────────────
  async getNotifications(forceRefresh = false) {
  const userId = await getCurrentUserId();
  const local = await offlineDb.getAlerts(userId);
  if (typeof window !== "undefined" && !navigator.onLine && local.length > 0 && !forceRefresh) {
    return local;
  }

  try {
    const remote = await safeFetch<any[]>("/notifications", {
      method: "GET",
      headers: await getAuthHeaders(),
    }, 7000);

    if (Array.isArray(remote)) {
      for (const n of remote) {
        await offlineDb.saveAlert({
          id: n.id,
          user_id: n.user_id || userId || "local_farmer",
          title: n.title,
          message: n.message,
          severity: n.severity || "info",
          is_read: !!n.is_read,
          created_at: n.created_at || new Date().toISOString(),
        });
      }
    }
  } catch { }

    const all = await offlineDb.getAlerts(userId);
    return all.map((n) => ({
      ...n,
      type: n.type || n.severity || "alert",
    })) as any[];
  },

  async markNotificationRead(id: string) {
  const alerts = await offlineDb.getAlerts();
  const target = alerts.find((a) => a.id === id);
  if (target) {
    target.is_read = true;
    await offlineDb.saveAlert(target);
  }

  const res = await safeFetch<any>(`/notifications/${id}/read`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
  }).catch(() => null);
  invalidateCache("notifications");
  return res || { success: true };
},

  // ── AI Assistant (M10, M11, M12) ─────────────────────────────────────────
  async assistantChat(message: string, language: string = "en", fieldId ?: string) {
  logAndroidAI("Processing Query", {
    language,
    status: `Processing prompt${fieldId ? ` for field ${fieldId}` : ""}`,
  });

  try {
    const res = await HybridAssistantService.askAssistant(message, language, fieldId);
    logAndroidAI("Response Received", {
      language,
      status: `Received ${res.isOffline ? "local AI" : "grounded cloud"} advisory`,
    });

    return {
      answer: res.answer,
      is_grounded: res.isGrounded ?? true,
      confidence_tier: res.confidenceTier || (res.isOffline ? "Local AI" : "Cloud AI"),
      evidence_points: res.evidencePoints && res.evidencePoints.length > 0 ? res.evidencePoints : [res.reason],
      why_explanation: res.whyExplanation || res.reason,
      more_details: res.moreDetails || res.action,
      suggested_actions: res.suggestedActions && res.suggestedActions.length > 0 ? res.suggestedActions : [res.action],
    };
  } catch (err: any) {
    logAndroidAI("Query Fallback", {
      language,
      status: "Using basic advisory",
      error: err?.message,
    });
    return {
      answer: "AgriSight advisory active: Continue monitoring crop health and moisture.",
      is_grounded: true,
      confidence_tier: "Local AI",
      evidence_points: ["Field conditions normal"],
      why_explanation: "Regular field inspections ensure early detection of pest and water stress.",
      more_details: "Routine maintenance and regular leaf scans prevent sudden pest outbreaks.",
      suggested_actions: ["Check soil moisture levels", "Perform weekly leaf scans"],
    };
  }
},

  // ── Agricultural Risk Engine (Phase 6) ───────────────────────────────────
  async getFarmRiskSummary(params ?: { temp?: number; humidity?: number; rain_probability?: number }) {
  const q = new URLSearchParams();
  if (params?.temp !== undefined) q.set("temp", String(params.temp));
  if (params?.humidity !== undefined) q.set("humidity", String(params.humidity));
  if (params?.rain_probability !== undefined) q.set("rain_probability", String(params.rain_probability));
  const qs = q.toString() ? `?${q.toString()}` : "";
  return await cachedFetch<any>(
    `risk_summary_${qs}`,
    async () =>
      await safeFetch<any>(
        `/risk/summary${qs}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
        15000
      ).catch(() => ({ risk_score: 25, status: "Low Risk" })),
    30000
  );
},

  // ── Intelligence Architecture Endpoints (Phases 1-20) ────────────────────
  async getWeatherIntelligence(lat = 22.57, lon = 88.36, language = "en") {
  const weather = await WeatherCacheService.getWeather();
  return {
    current_weather: {
      temperature: weather.temperature,
      humidity: weather.humidity,
      condition: weather.condition,
      wind_speed: weather.windSpeed,
      rain_probability: weather.rainProbability,
      is_offline: weather.isOffline,
      fetched_at: weather.fetchedAt,
    },
    advisory: weather.advisory,
    locality: weather.locality,
  };
},

  async getSensors(fieldId?: string) {
    const readings = await offlineDb.getSensorReadings(fieldId);
    if (readings.length > 0) {
      return readings[0];
    }
    return null;
  },

  async recordSensorReading(reading: {
    field_id: string;
    device_id?: string;
    soil_moisture?: number;
    temperature?: number;
    humidity?: number;
    soil_ph?: number;
    battery_pct?: number;
    sensor_status?: "valid" | "warning" | "error" | "disconnected";
  }) {
    const record = {
      id: "rdg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      device_id: reading.device_id || "esp32_field_node",
      field_id: reading.field_id,
      soil_moisture: reading.soil_moisture,
      temperature: reading.temperature,
      humidity: reading.humidity,
      soil_ph: reading.soil_ph,
      battery_pct: reading.battery_pct,
      sensor_status: reading.sensor_status || "valid",
      connection_status: "connected" as const,
      timestamp: new Date().toISOString(),
      sync_status: "PENDING_SYNC" as const,
    };

    await offlineDb.saveSensorReading(record);
    await offlineDb.enqueueSyncItem({
      entityType: "sensor_reading",
      action: "create",
      entityId: record.id,
      payload: record,
      status: "PENDING_SYNC",
    });

    AlertEngine.evaluateFieldConditions(reading.field_id).catch(() => {});
    return record;
  },

  async getFieldAlerts(fieldId: string) {
    return await AlertEngine.getFieldAlerts(fieldId);
  },

  async markAlertRead(alertId: string) {
    return await AlertEngine.markAlertRead(alertId);
  },

  async resolveAlert(alertId: string) {
    return await AlertEngine.resolveAlert(alertId);
  },

  async getSmartIrrigation(language = "en", lat = 22.57, lon = 88.36) {
  return await cachedFetch<any>(
    `smart_irrigation_${language}_${lat}_${lon}`,
    async () =>
      await safeFetch<any>(
        `/intelligence/irrigation?language=${language}&lat=${lat}&lon=${lon}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
        15000
      ),
    60000
  );
},

  async getFarmRisk(language = "en", lat = 22.57, lon = 88.36) {
  return await cachedFetch<any>(
    `farm_risk_${language}_${lat}_${lon}`,
    async () =>
      await safeFetch<any>(
        `/intelligence/risk?language=${language}&lat=${lat}&lon=${lon}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
        15000
      ),
    60000
  );
},

  async getFarmerDecisions(language = "en", lat = 22.57, lon = 88.36) {
  return await cachedFetch<any[]>(
    `farmer_decisions_${language}_${lat}_${lon}`,
    async () =>
      await safeFetch<any[]>(
        `/intelligence/decisions?language=${language}&lat=${lat}&lon=${lon}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
        15000
      ),
    60000
  );
},

  async getFarmTimeline(fieldId ?: string) {
  const qs = fieldId ? `?field_id=${encodeURIComponent(fieldId)}` : "";
  return await cachedFetch<any[]>(
    `farm_timeline_${fieldId || "all"}`,
    async () =>
      await safeFetch<any[]>(
        `/intelligence/timeline${qs}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
        15000
      ),
    30000
  );
},

  async simulateDigitalTwin(payload: {
  field_id?: string;
  crop_id?: string;
  days_without_water?: number;
  temperature_delta?: number;
  rainfall_mm?: number;
  pesticide_applied?: boolean;
  language?: string;
}) {
  return await safeFetch<any>(
    "/intelligence/digital-twin/simulate",
    {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    25000
  );
},

  // ── Agriculture Extension Officer Regional Endpoints ──────────────────────
  async getOfficerOverview() {
  return await safeFetch<any>(
    "/officer/overview",
    {
      method: "GET",
      headers: await getAuthHeaders(),
    },
    15000
  );
},

  async getOfficerFields() {
  return await safeFetch<any[]>(
    "/officer/fields",
    {
      method: "GET",
      headers: await getAuthHeaders(),
    },
    15000
  );
},

  // ── Expert Escalations ───────────────────────────────────────────────────
  async submitExpertEscalation(payload: {
  scan_id?: string;
  image_url?: string;
  suspected_issue?: string;
  confidence?: number;
  farmer_note?: string;
  field_id?: string;
  crop_id?: string;
}) {
  return await safeFetch<any>(
    "/expert/escalations",
    {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    },
    15000
  );
},

  async getExpertEscalations() {
  return await safeFetch<any[]>(
    "/expert/escalations",
    {
      method: "GET",
      headers: await getAuthHeaders(),
    },
    15000
  );
},
};

