import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabaseClient";

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

    // 2. In Native Capacitor: Must use direct backend URL (localhost ADB reverse / LAN / Production HTTPS)
    if (Capacitor.isNativePlatform() || window.location.protocol === "capacitor:") {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      if (envUrl && !envUrl.includes("localhost")) return envUrl.replace(/\/+$/, "");
      // Default to 127.0.0.1 (ADB reverse) or LAN fallback
      return "http://127.0.0.1:8000";
    }

    // 3. In Web Browser: Prefer Next.js proxy rewrite to avoid CORS
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    }
    return "/api/backend";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}


async function getAuthHeaders(isFormData = false) {
  const headers: Record<string, string> = {};
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    // Graceful offline/local fallback
  }
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function safeFetch<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 30000): Promise<T> {
  const primaryUrl = getFastApiUrl();
  const candidateUrls: string[] = [primaryUrl];
  
  // In production (HTTPS), only use the configured production URL to prevent dead local IP timeouts
  if (!primaryUrl.startsWith("https://")) {
    if (Capacitor.isNativePlatform() || (typeof window !== "undefined" && window.location.protocol === "capacitor:")) {
      const mobileFallbacks = ["http://127.0.0.1:8000", "http://localhost:8000", "http://192.168.1.7:8000", "http://10.0.2.2:8000"];
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
    return await cachedFetch<any[]>(
      "analyses_list",
      async () =>
        await safeFetch<any[]>("/analyses", {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      15000,
      forceRefresh
    );
  },

  async getAnalysis(id: string, forceRefresh = false) {
    return await cachedFetch<any>(
      `analysis_${id}`,
      async () =>
        await safeFetch<any>(`/analyses/${id}`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async uploadAnalysis(file: File | Blob, lat?: string, lon?: string, question?: string, cropId?: string, fieldId?: string, language?: string) {
    const actualFile = file instanceof File ? file : new File([file], "leaf_scan.jpg", { type: file.type || "image/jpeg" });
    logAndroidScan("Pre-Upload Validation", {
      image: `${actualFile.name} (${Math.round(actualFile.size / 1024)} KB, ${actualFile.type})`,
      status: "Preparing multipart payload",
    });

    const formData = new FormData();
    formData.append("image", actualFile);
    formData.append("file", actualFile);
    if (question) formData.append("question", question);
    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);
    if (language) formData.append("language", language);
    if (cropId) formData.append("crop_id", cropId);
    if (fieldId) formData.append("field_id", fieldId);
    
    try {
      logAndroidScan("Backend Transmission", {
        image: actualFile.name,
        status: "Sending to /analyze",
      });
      const res = await safeFetch<any>("/analyze", {
        method: "POST",
        body: formData,
        headers: await getAuthHeaders(true),
      }, 65000);

      logAndroidScan("Result Processing", {
        image: actualFile.name,
        status: "Analysis received successfully",
      });

      invalidateCache("analyses");
      invalidateCache("fields");
      invalidateCache("crops");
      return res;
    } catch (err: any) {
      logAndroidScan("Upload Failure", {
        image: actualFile.name,
        status: "Failed",
        error: err.message,
      });
      throw err;
    }
  },

  async assignCropToAnalysis(analysisId: string, cropId: string) {
    const res = await safeFetch<any>(`/analyses/${analysisId}/crop?crop_id=${cropId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });
    invalidateCache("analyses");
    return res;
  },

  async assignFieldToAnalysis(analysisId: string, fieldId: string) {
    const res = await safeFetch<any>(`/analyses/${analysisId}/field?field_id=${fieldId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });
    invalidateCache("analyses");
    invalidateCache("fields");
    return res;
  },

  async getAnalysisProgression(id: string, forceRefresh = false) {
    return await cachedFetch<any>(
      `progression_${id}`,
      async () =>
        await safeFetch<any>(`/analyses/${id}/progression`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async compareAnalyses(scan1Id: string, scan2Id: string) {
    return await cachedFetch<any>(
      `compare_${scan1Id}_${scan2Id}`,
      async () =>
        await safeFetch<any>(`/analyses/compare?scan1_id=${scan1Id}&scan2_id=${scan2Id}`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      60000
    );
  },

  // ── Fields (M7, M8, M9) ───────────────────────────────────────────────────
  async getFields(forceRefresh = false) {
    return await cachedFetch<any[]>(
      "fields_list",
      async () =>
        await safeFetch<any[]>("/fields", {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async getField(id: string, forceRefresh = false) {
    return await cachedFetch<any>(
      `field_${id}`,
      async () =>
        await safeFetch<any>(`/fields/${id}`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async createField(data: {
    name: string;
    location_name?: string;
    latitude?: number;
    longitude?: number;
    area_acres?: number;
    soil_type?: string;
    irrigation_type?: string;
    notes?: string;
  }) {
    const res = await safeFetch<any>("/fields", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    invalidateCache("fields");
    return res;
  },

  async updateField(id: string, data: Partial<{
    name: string;
    location_name: string;
    latitude: number;
    longitude: number;
    area_acres: number;
    soil_type: string;
    irrigation_type: string;
    notes: string;
  }>) {
    const res = await safeFetch<any>(`/fields/${id}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    invalidateCache("fields");
    return res;
  },

  async deleteField(id: string) {
    const res = await safeFetch<any>(`/fields/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    invalidateCache("fields");
    return res;
  },

  async getFieldAnalytics(id: string) {
    return await safeFetch<any>(`/fields/${id}/analytics`, {
      method: "GET",
      headers: await getAuthHeaders(),
    }, 12000);
  },

  // ── Interventions & Action Tracking (Phase J) ─────────────────────────────
  async getInterventions(params?: { crop_id?: string; field_id?: string }) {
    let qs = "";
    if (params?.crop_id) qs += `?crop_id=${encodeURIComponent(params.crop_id)}`;
    if (params?.field_id) qs += `${qs ? "&" : "?"}field_id=${encodeURIComponent(params.field_id)}`;
    return await safeFetch<any[]>(`/interventions${qs}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    }, 12000);
  },

  async createIntervention(data: {
    action_type: string;
    action_title: string;
    crop_id?: string;
    field_id?: string;
    notes?: string;
    performed_at?: string;
  }) {
    const res = await safeFetch<any>("/interventions", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    invalidateCache("interventions");
    return res;
  },

  async deleteIntervention(id: string) {
    const res = await safeFetch<any>(`/interventions/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    invalidateCache("interventions");
    return res;
  },

  // ── Crops (M3) ────────────────────────────────────────────────────────────
  async getCrops(forceRefresh = false) {
    return await cachedFetch<any[]>(
      "crops_list",
      async () =>
        await safeFetch<any[]>("/crops", {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async getCrop(id: string, forceRefresh = false) {
    return await cachedFetch<any>(
      `crop_${id}`,
      async () =>
        await safeFetch<any>(`/crops/${id}`, {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 12000),
      30000,
      forceRefresh
    );
  },

  async createCrop(data: {
    name: string;
    variety?: string;
    planting_date?: string;
    growth_stage?: string;
    field_name?: string;
    field_id?: string;
    notes?: string;
  }) {
    const res = await safeFetch<any>("/crops", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    invalidateCache("crops");
    return res;
  },

  async updateCrop(id: string, data: Partial<{
    name: string;
    variety: string;
    planting_date: string;
    growth_stage: string;
    field_name: string;
    field_id: string;
    notes: string;
  }>) {
    const res = await safeFetch<any>(`/crops/${id}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    invalidateCache("crops");
    return res;
  },

  async deleteCrop(id: string) {
    const res = await safeFetch<any>(`/crops/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    invalidateCache("crops");
    return res;
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  async getNotifications(forceRefresh = false) {
    return await cachedFetch<any[]>(
      "notifications_list",
      async () =>
        await safeFetch<any[]>("/notifications", {
          method: "GET",
          headers: await getAuthHeaders(),
        }, 10000),
      10000,
      forceRefresh
    );
  },

  // ── AI Assistant (M10, M11, M12) ─────────────────────────────────────────
  async assistantChat(message: string, language: string = "en", fieldId?: string) {
    logAndroidAI("Sending Query", {
      language,
      status: `Dispatching prompt to backend${fieldId ? ` for field ${fieldId}` : ""}`,
    });

    try {
      const res = await safeFetch<{
        answer: string;
        is_grounded: boolean;
        confidence_tier?: string;
        evidence_points?: string[];
        why_explanation?: string;
        more_details?: string;
        suggested_actions: string[];
      }>(
        "/assistant/chat",
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ message, language, field_id: fieldId || "" }),
        },
        30000
      );

      logAndroidAI("Response Received", {
        language,
        status: `Received grounded response (${res.confidence_tier || "Standard"})`,
      });

      return res;
    } catch (err: any) {
      logAndroidAI("Query Failure", {
        language,
        status: "Failed",
        error: err.message,
      });
      throw err;
    }
  },

  // ── Agricultural Risk Engine (Phase 6) ───────────────────────────────────
  async getFarmRiskSummary(params?: { temp?: number; humidity?: number; rain_probability?: number }) {
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
        ),
      30000
    );
  },

  // ── Intelligence Architecture Endpoints (Phases 1-20) ────────────────────
  async getWeatherIntelligence(lat = 22.57, lon = 88.36, language = "en") {
    return await cachedFetch<any>(
      `weather_intel_${lat}_${lon}_${language}`,
      async () =>
        await safeFetch<any>(
          `/intelligence/weather?lat=${lat}&lon=${lon}&language=${language}`,
          {
            method: "GET",
            headers: await getAuthHeaders(),
          },
          15000
        ),
      60000
    );
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

  async getFarmTimeline(fieldId?: string) {
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

