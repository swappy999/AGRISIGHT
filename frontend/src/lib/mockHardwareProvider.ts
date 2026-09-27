/**
 * AgriSight Mock Hardware Provider (Development & Testing ONLY)
 * Implements Section 27 of AgriSight Hardware-Ready Application Master Specification.
 *
 * CRITICAL RULE:
 * This provider is STRICTLY for local development/automated unit tests.
 * In production, MOCK_HARDWARE_ENABLED is false and this provider cannot be activated.
 * Real production state must be REAL HARDWARE or NO HARDWARE. Never fake hardware.
 */

import {
  HardwareProvider,
  HardwareConnection,
  HardwareStatus,
  SensorReading,
  HardwareCommand,
  HardwareCommandResult,
  Unsubscribe,
} from "./hardwareContracts";
import { FEATURE_FLAGS } from "./featureFlags";

export class MockHardwareProvider implements HardwareProvider {
  private deviceId: string;
  private fieldId: string;
  private isConnected = false;
  private subscribers: Set<(reading: SensorReading) => void> = new Set();
  private intervalId: any = null;

  constructor(deviceId = "MOCK_ESP32_NODE_DEV", fieldId = "TEST_FIELD") {
    this.deviceId = deviceId;
    this.fieldId = fieldId;
  }

  private assertAllowed() {
    if (!FEATURE_FLAGS.MOCK_HARDWARE_ENABLED) {
      throw new Error(
        "MockHardwareProvider is forbidden in production: FEATURE_FLAGS.MOCK_HARDWARE_ENABLED is false."
      );
    }
  }

  async connect(): Promise<HardwareConnection> {
    this.assertAllowed();
    this.isConnected = true;
    return {
      connected: true,
      connectionType: "WIFI",
      deviceId: this.deviceId,
      endpoint: "http://192.168.4.1 (mock)",
      connectedAt: new Date().toISOString(),
    };
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async getStatus(): Promise<HardwareStatus> {
    this.assertAllowed();
    return {
      deviceId: this.deviceId,
      status: this.isConnected ? "online" : "offline",
      batteryPct: 88,
      rssi: -62,
      firmwareVersion: "0.9.1-dev-mock",
      lastSeenAt: new Date().toISOString(),
    };
  }

  async getLatestReadings(): Promise<SensorReading[]> {
    this.assertAllowed();
    if (!this.isConnected) return [];

    return [
      {
        id: "mock_reading_" + Date.now(),
        deviceId: this.deviceId,
        fieldId: this.fieldId,
        timestamp: new Date().toISOString(),
        soilMoisture: 32.5,
        temperature: 28.2,
        humidity: 64.0,
        soilPH: 6.5,
        waterFlow: 0.0,
        sensorStatus: {
          soilMoisture: "online",
          temperature: "online",
          humidity: "online",
          soilPH: "online",
          waterFlow: "online",
        },
        source: "hardware",
        syncStatus: "LOCAL_ONLY",
      },
    ];
  }

  subscribeToReadings(callback: (reading: SensorReading) => void): Unsubscribe {
    this.assertAllowed();
    this.subscribers.add(callback);

    if (!this.intervalId && this.isConnected) {
      this.intervalId = setInterval(() => {
        if (!this.isConnected || !FEATURE_FLAGS.MOCK_HARDWARE_ENABLED) return;
        const reading: SensorReading = {
          id: "mock_stream_" + Date.now(),
          deviceId: this.deviceId,
          fieldId: this.fieldId,
          timestamp: new Date().toISOString(),
          soilMoisture: 30 + Math.random() * 5,
          temperature: 27 + Math.random() * 3,
          humidity: 60 + Math.random() * 10,
          soilPH: 6.4,
          waterFlow: 0,
          source: "hardware",
          syncStatus: "LOCAL_ONLY",
        };
        this.subscribers.forEach((cb) => cb(reading));
      }, 5000);
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0 && this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    };
  }

  async sendCommand(command: HardwareCommand): Promise<HardwareCommandResult> {
    this.assertAllowed();

    // Section 20: Mandatory deterministic safety checks before pump/valve actuation
    if (command.safetyCheckRequired) {
      if (command.command === "START_PUMP" && (command.durationSeconds || 0) > 3600) {
        return {
          success: false,
          commandId: "cmd_" + Date.now(),
          safetyBlocked: true,
          error: "Safety Interlock: Maximum continuous pump runtime exceeded 60 minutes.",
          message: "Command blocked by deterministic agronomic safety rules.",
        };
      }
    }

    return {
      success: true,
      commandId: "cmd_" + Date.now(),
      executedAt: new Date().toISOString(),
      message: `Simulated execution of ${command.command} on ${command.deviceId}`,
    };
  }
}
