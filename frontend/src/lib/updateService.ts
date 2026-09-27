/**
 * AgriSight App Update Service
 * Implements Section 44, 45 & 46 of Master Spec (a1.md).
 *
 * Responsibilities:
 * - Checks for available APK updates from the update distribution server.
 * - Tracks currentVersion ("1.2.0"), versionCode (3), latestVersion, and updateAvailable.
 * - Exposes checkOnLaunch() and manual checkForUpdates().
 * - Triggers controlled browser download or update flow without unsafe hidden execution.
 */

import { NetworkService } from "./networkService";

export interface UpdateInfo {
  currentVersion: string;
  versionCode: number;
  latestVersion: string;
  latestVersionCode: number;
  updateAvailable: boolean;
  downloadUrl?: string;
  releaseNotes?: string;
  checkedAt: string;
}

export const CURRENT_APP_VERSION = "1.2.2";
export const CURRENT_VERSION_CODE = 5;

class AppUpdateServiceImpl {
  private updateInfo: UpdateInfo = {
    currentVersion: CURRENT_APP_VERSION,
    versionCode: CURRENT_VERSION_CODE,
    latestVersion: CURRENT_APP_VERSION,
    latestVersionCode: CURRENT_VERSION_CODE,
    updateAvailable: false,
    checkedAt: new Date().toISOString(),
  };

  private lastCheckTimestamp = 0;
  private checkIntervalMs = 60 * 60 * 1000; // 1 hour throttle

  /**
   * Check for updates on application launch (throttled).
   */
  public async checkOnLaunch(): Promise<UpdateInfo> {
    const now = Date.now();
    if (now - this.lastCheckTimestamp < this.checkIntervalMs) {
      return this.updateInfo;
    }
    return this.checkForUpdates();
  }

  /**
   * Manual update check from Settings or UI button.
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    this.lastCheckTimestamp = Date.now();

    if (!NetworkService.isOnline()) {
      return {
        ...this.updateInfo,
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const baseUrl =
        (typeof window !== "undefined" && localStorage.getItem("agrisight_api_url")) ||
        (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")
          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
          : "https://agrisight-kn5u.onrender.com");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${baseUrl}/app-version`, {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.latestVersionCode === "number") {
          const isNewer = data.latestVersionCode > CURRENT_VERSION_CODE;
          this.updateInfo = {
            currentVersion: CURRENT_APP_VERSION,
            versionCode: CURRENT_VERSION_CODE,
            latestVersion: data.latestVersion || CURRENT_APP_VERSION,
            latestVersionCode: data.latestVersionCode,
            updateAvailable: isNewer,
            downloadUrl: data.downloadUrl || `${baseUrl}/download/app-debug.apk`,
            releaseNotes: data.releaseNotes || "Performance enhancements & updated crop pathology models.",
            checkedAt: new Date().toISOString(),
          };
          return this.updateInfo;
        }
      }
    } catch (err) {
      console.info("[AppUpdateService] Update check skipped:", err);
    }

    this.updateInfo.checkedAt = new Date().toISOString();
    return this.updateInfo;
  }

  public getCachedInfo(): UpdateInfo {
    return this.updateInfo;
  }
}

export const AppUpdateService = new AppUpdateServiceImpl();
