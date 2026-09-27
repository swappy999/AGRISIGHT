/**
 * AgriSight Hardware Abstraction Layer & Canonical Contracts
 * Implements Sections 4, 5, 7, and 21 of AgriSight Hardware-Ready Application Master Specification.
 *
 * Architecture Principles:
 * - Stable, decoupled interfaces for future ESP32, BLE, Wi-Fi, MQTT, or Serial providers.
 * - The UI never directly calls ESP32 code; it communicates solely through SensorService & HardwareProvider.
 * - Canonical SensorReading contract handles optional sensors without assuming 0 means failure.
 * - HardwareCommand contract enforces deterministic safety interlocks before actuation (pumps/valves).
 */

export type DeviceType =
  | "ESP32_SENSOR_NODE"
  | "IRRIGATION_CONTROLLER"
  | "WEATHER_NODE"
  | "SOIL_NODE"
  | "CUSTOM";

export type ConnectionType =
  | "WIFI"
  | "BLUETOOTH"
  | "BLE"
  | "MQTT"
  | "SERIAL";

export type DeviceStatus =
  | "online"
  | "offline"
  | "pairing"
  | "error"
  | "unpaired";

export type SensorHealthStatus = "online" | "offline" | "error";

export type ReadingSyncStatus =
  | "LOCAL_ONLY"
  | "PENDING_SYNC"
  | "SYNCING"
  | "SYNCED"
  | "SYNC_FAILED";

/**
 * Canonical Sensor Reading Schema (§5)
 * Every sensor metric is optional.
 */
export interface SensorReading {
  id: string;
  deviceId: string;
  fieldId: string;
  timestamp: string;

  soilMoisture?: number;
  temperature?: number;
  humidity?: number;
  soilPH?: number;
  waterFlow?: number;

  sensorStatus?: {
    soilMoisture?: SensorHealthStatus;
    temperature?: SensorHealthStatus;
    humidity?: SensorHealthStatus;
    soilPH?: SensorHealthStatus;
    waterFlow?: SensorHealthStatus;
  };

  source: "hardware" | "manual" | "imported";
  syncStatus: ReadingSyncStatus;
}

/**
 * Hardware Device Model (§7)
 */
export interface HardwareDevice {
  id: string;
  user_id: string;
  field_id?: string;
  device_name: string;
  device_type: DeviceType;
  device_identifier: string;
  connection_type: ConnectionType;
  firmware_version?: string;
  status: DeviceStatus;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hardware Connection State (§4)
 */
export interface HardwareConnection {
  connected: boolean;
  connectionType: ConnectionType;
  deviceId: string;
  endpoint?: string;
  connectedAt: string;
}

/**
 * Real-time Hardware Status (§4)
 */
export interface HardwareStatus {
  deviceId: string;
  status: DeviceStatus;
  batteryPct?: number;
  rssi?: number;
  firmwareVersion?: string;
  lastSeenAt?: string;
  errors?: string[];
}

/**
 * Future Hardware Command Contract (§21)
 * Enforces mandatory safety verification before actuation.
 */
export interface HardwareCommand {
  deviceId: string;
  fieldId: string;
  command:
    | "READ_SENSORS"
    | "START_PUMP"
    | "STOP_PUMP"
    | "OPEN_VALVE"
    | "CLOSE_VALVE";
  durationSeconds?: number;
  requestedBy: "USER" | "RULE_ENGINE" | "AUTOMATION";
  safetyCheckRequired: boolean;
}

export interface HardwareCommandResult {
  success: boolean;
  commandId: string;
  executedAt?: string;
  error?: string;
  safetyBlocked?: boolean;
  message: string;
}

export type Unsubscribe = () => void;

/**
 * Standard Hardware Provider Interface (§4)
 */
export interface HardwareProvider {
  connect(): Promise<HardwareConnection>;
  disconnect(): Promise<void>;
  getStatus(): Promise<HardwareStatus>;
  getLatestReadings(): Promise<SensorReading[]>;
  subscribeToReadings(
    callback: (reading: SensorReading) => void
  ): Unsubscribe;
  sendCommand(
    command: HardwareCommand
  ): Promise<HardwareCommandResult>;
}
