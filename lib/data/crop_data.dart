/// Shared crop data model that provides consistent data across all screens
class CropData {
  // Singleton pattern for consistent data
  static final CropData _instance = CropData._internal();
  factory CropData() => _instance;
  CropData._internal();

  // Current crop health status
  final CropHealthLevel healthLevel = CropHealthLevel.moderate;
  final int areasNeedingAttention = 2;
  
  // Overall status description
  String get statusDescription {
    switch (healthLevel) {
      case CropHealthLevel.good:
        return 'All systems healthy - No immediate action required';
      case CropHealthLevel.moderate:
        return 'Attention Required - $areasNeedingAttention areas need immediate action';
      case CropHealthLevel.severe:
        return 'Critical Alert - Immediate intervention required';
    }
  }

  // Crop details
  final String cropType = 'Wheat (Triticum aestivum)';
  final String fieldSize = '12.5 Hectares';
  final String growthStage = 'Tillering (Stage 2)';
  final int daysSincePlanting = 45;
  final String expectedHarvest = '85-90 days';
  
  // Soil & environment
  final double soilPH = 6.8;
  final String soilPHStatus = 'Optimal';
  final int nitrogenLevel = 42; // ppm
  final String nitrogenStatus = 'Low';
  final int moisturePercent = 28;
  final String moistureStatus = 'Below Normal';
  final int temperature = 24; // Celsius
  final String temperatureStatus = 'Optimal';

  // Terrain details
  final TerrainData terrain = TerrainData(
    elevation: '245m above sea level',
    slope: '3.2° (Gentle)',
    soilType: 'Loamy Clay',
    drainageClass: 'Well Drained',
    topography: 'Rolling Plains',
    waterTable: '4.5m depth',
  );

  // Danger zones
  final List<DangerZone> dangerZones = [
    DangerZone(
      name: 'Zone A',
      issue: 'Pest Infestation',
      severity: ZoneSeverity.high,
      description: 'High nitrogen deficiency detected. Aphid presence confirmed.',
    ),
    DangerZone(
      name: 'Zone B',
      issue: 'Water Stress',
      severity: ZoneSeverity.medium,
      description: 'Soil moisture at 18%. Below optimal range of 35-45%.',
    ),
  ];

  // AI Recommendations
  final List<Recommendation> recommendations = [
    Recommendation(
      icon: 'water_drop',
      title: 'Increase Irrigation',
      description: 'Increase water supply to Zone B by 20% for the next 5 days.',
      priority: 'High',
    ),
    Recommendation(
      icon: 'bug_report',
      title: 'Apply Pesticide',
      description: 'Apply Imidacloprid to Zone A to control aphid infestation.',
      priority: 'High',
    ),
    Recommendation(
      icon: 'science',
      title: 'Nitrogen Supplement',
      description: 'Apply 25kg/hectare urea to affected areas within 48 hours.',
      priority: 'Medium',
    ),
  ];

  // Health trend data (last 7 days)
  final List<double> healthTrend = [75, 72, 68, 65, 60, 58, 55];
}

enum CropHealthLevel { good, moderate, severe }

enum ZoneSeverity { low, medium, high }

class TerrainData {
  final String elevation;
  final String slope;
  final String soilType;
  final String drainageClass;
  final String topography;
  final String waterTable;

  const TerrainData({
    required this.elevation,
    required this.slope,
    required this.soilType,
    required this.drainageClass,
    required this.topography,
    required this.waterTable,
  });
}

class DangerZone {
  final String name;
  final String issue;
  final ZoneSeverity severity;
  final String description;

  const DangerZone({
    required this.name,
    required this.issue,
    required this.severity,
    required this.description,
  });
}

class Recommendation {
  final String icon;
  final String title;
  final String description;
  final String priority;

  const Recommendation({
    required this.icon,
    required this.title,
    required this.description,
    required this.priority,
  });
}
