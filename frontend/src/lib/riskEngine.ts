export interface RiskContributor {
  factor: string;
  impact_points: number;
  direction: "increase" | "mitigation";
  domain: "Disease" | "Pest" | "Irrigation" | "Weather" | "Lifecycle" | "Historical";
  description: string;
}

export interface ActionablePrescription {
  domain: string;
  urgency: "Immediate" | "Scheduled" | "Watchlist";
  title: string;
  detail: string;
}

export interface FieldRiskBreakdown {
  field_id: string;
  field_name: string;
  risk_score: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  top_threat: string;
}

export interface MultiVectorRiskReport {
  overall_risk_score: number;
  risk_level: "Low" | "Moderate" | "High" | "Critical";
  disease_risk: number;
  pest_risk: number;
  water_stress_risk: number;
  weather_risk: number;
  top_contributors: RiskContributor[];
  actionable_prescriptions: ActionablePrescription[];
  field_breakdown: FieldRiskBreakdown[];
  calculated_at: string;
}

export function getRiskColorClass(scoreOrLevel: number | string): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  const level =
    typeof scoreOrLevel === "string"
      ? scoreOrLevel.toLowerCase()
      : scoreOrLevel >= 80
      ? "critical"
      : scoreOrLevel >= 60
      ? "high"
      : scoreOrLevel >= 30
      ? "moderate"
      : "low";

  switch (level) {
    case "critical":
      return {
        bg: "bg-red-500/15",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-500/30",
        accent: "#dc2626",
      };
    case "high":
      return {
        bg: "bg-amber-500/15",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-500/30",
        accent: "#d97706",
      };
    case "moderate":
      return {
        bg: "bg-yellow-500/15",
        text: "text-yellow-800 dark:text-yellow-300",
        border: "border-yellow-500/30",
        accent: "#ca8a04",
      };
    default:
      return {
        bg: "bg-emerald-500/15",
        text: "text-emerald-800 dark:text-emerald-300",
        border: "border-emerald-500/30",
        accent: "#059669",
      };
  }
}
