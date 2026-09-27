/**
 * AgriSight Network Service
 * Implements Section 32 of Master Spec (a1.md).
 *
 * Responsibilities:
 * - Single source of truth for network connectivity state.
 * - States: ONLINE, OFFLINE, RECONNECTING, UNKNOWN.
 * - Integrates Capacitor Network plugin with browser fallback.
 * - Reactive listeners for all features (Scan, Assistant, Weather, Sync, Alerts).
 */

import { Network, ConnectionStatus } from "@capacitor/network";

export type NetworkState = "ONLINE" | "OFFLINE" | "RECONNECTING" | "UNKNOWN";

export type NetworkListener = (state: NetworkState) => void;

class NetworkServiceImpl {
  private currentState: NetworkState = "UNKNOWN";
  private listeners: Set<NetworkListener> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const status: ConnectionStatus = await Network.getStatus();
      this.currentState = status.connected ? "ONLINE" : "OFFLINE";

      Network.addListener("networkStatusChange", (newStatus: ConnectionStatus) => {
        const nextState: NetworkState = newStatus.connected ? "ONLINE" : "OFFLINE";
        this.updateState(nextState);
      });
    } catch {
      // Browser fallback
      this.currentState = typeof navigator !== "undefined" && navigator.onLine ? "ONLINE" : "OFFLINE";

      window.addEventListener("online", () => {
        this.updateState("RECONNECTING");
        setTimeout(() => this.updateState("ONLINE"), 500);
      });

      window.addEventListener("offline", () => {
        this.updateState("OFFLINE");
      });
    }
  }

  private updateState(newState: NetworkState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.listeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (err) {
        console.warn("[NetworkService] Listener error:", err);
      }
    });
  }

  public getState(): NetworkState {
    if (this.currentState === "UNKNOWN" && typeof navigator !== "undefined") {
      return navigator.onLine ? "ONLINE" : "OFFLINE";
    }
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.getState() === "ONLINE" || this.getState() === "RECONNECTING";
  }

  public isOffline(): boolean {
    return this.getState() === "OFFLINE";
  }

  public addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Emit immediate current state
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const NetworkService = new NetworkServiceImpl();
