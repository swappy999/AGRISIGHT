import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:agrisight/data/crop_data.dart';

class CropStatusScreen extends StatelessWidget {
  const CropStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final cropData = CropData();
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
        title: Text('Crop Status', style: theme.textTheme.h3),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with overall status
                _buildOverallStatusCard(theme, cropData),
                const SizedBox(height: 24),
                
                // Main content row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left column - Image with danger zones
                    Expanded(
                      flex: 1,
                      child: _buildDangerZoneImageCard(theme, cropData),
                    ),
                    const SizedBox(width: 24),
                    
                    // Right column - Details
                    Expanded(
                      flex: 1,
                      child: Column(
                        children: [
                          _buildCropDetailsCard(theme, cropData),
                          const SizedBox(height: 24),
                          _buildTerrainDetailsCard(theme, cropData),
                          const SizedBox(height: 24),
                          _buildTrendChartCard(theme, cropData),
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 24),
                
                // Recommendations section
                _buildRecommendationsCard(theme, cropData),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOverallStatusCard(ShadThemeData theme, CropData cropData) {
    Color statusColor;
    IconData statusIcon;
    String statusLabel;
    
    switch (cropData.healthLevel) {
      case CropHealthLevel.good:
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusLabel = 'Good';
        break;
      case CropHealthLevel.moderate:
        statusColor = Colors.orange;
        statusIcon = Icons.warning_amber;
        statusLabel = 'Moderate';
        break;
      case CropHealthLevel.severe:
        statusColor = Colors.red;
        statusIcon = Icons.error;
        statusLabel = 'Severe';
        break;
    }

    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(statusIcon, size: 32, color: statusColor),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Overall Crop Status', style: theme.textTheme.h4),
                const SizedBox(height: 4),
                Text(
                  cropData.statusDescription,
                  style: theme.textTheme.muted,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              statusLabel,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDangerZoneImageCard(ShadThemeData theme, CropData cropData) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Field Analysis', style: theme.textTheme.h4),
          const SizedBox(height: 8),
          Text('Areas highlighted in red require attention', style: theme.textTheme.muted),
          const SizedBox(height: 16),
          
          // Simulated field image with danger zones
          Container(
            height: 300,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: Colors.green.shade100,
            ),
            child: Stack(
              children: [
                // Background - healthy field
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      colors: [
                        Colors.green.shade300,
                        Colors.green.shade400,
                        Colors.green.shade500,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
                
                // Grid lines (field rows)
                CustomPaint(
                  size: const Size(double.infinity, 300),
                  painter: _FieldGridPainter(),
                ),
                
                // Danger zone 1 - Top right
                Positioned(
                  top: 30,
                  right: 40,
                  child: _buildDangerZone(
                    size: 70,
                    label: cropData.dangerZones[0].name,
                    severity: cropData.dangerZones[0].severity,
                  ),
                ),
                
                // Danger zone 2 - Bottom left
                Positioned(
                  bottom: 50,
                  left: 60,
                  child: _buildDangerZone(
                    size: 55,
                    label: cropData.dangerZones[1].name,
                    severity: cropData.dangerZones[1].severity,
                  ),
                ),
                
                // Legend
                Positioned(
                  bottom: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircleAvatar(backgroundColor: Colors.red, radius: 5),
                            SizedBox(width: 6),
                            Text('High Risk', style: TextStyle(color: Colors.white, fontSize: 10)),
                          ],
                        ),
                        SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircleAvatar(backgroundColor: Colors.orange, radius: 5),
                            SizedBox(width: 6),
                            Text('Medium Risk', style: TextStyle(color: Colors.white, fontSize: 10)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Zone details from shared data
          for (final zone in cropData.dangerZones) ...[
            _buildZoneDetail(
              zone.name,
              zone.issue,
              zone.severity == ZoneSeverity.high ? Colors.red : Colors.orange,
              zone.description,
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  Widget _buildDangerZone({required double size, required String label, required ZoneSeverity severity}) {
    final color = severity == ZoneSeverity.high ? Colors.red : Colors.orange;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: 0.3),
        border: Border.all(color: color, width: 3),
      ),
      child: Center(
        child: Container(
          width: size * 0.5,
          height: size * 0.5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color.withValues(alpha: 0.6),
          ),
        ),
      ),
    );
  }

  Widget _buildZoneDetail(String zone, String issue, Color color, String description) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.warning, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(zone, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
                    const SizedBox(width: 8),
                    Text('• $issue', style: const TextStyle(fontWeight: FontWeight.w500)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropDetailsCard(ShadThemeData theme, CropData cropData) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.grass, color: Colors.green.shade600),
              const SizedBox(width: 8),
              Text('Crop Details', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Crop Type', cropData.cropType),
          _buildDetailRow('Field Size', cropData.fieldSize),
          _buildDetailRow('Growth Stage', cropData.growthStage),
          _buildDetailRow('Days Since Planting', '${cropData.daysSincePlanting} days'),
          _buildDetailRow('Expected Harvest', cropData.expectedHarvest),
          const Divider(height: 24),
          _buildDetailRow('Soil pH', '${cropData.soilPH} (${cropData.soilPHStatus})'),
          _buildDetailRow('Nitrogen Level', '${cropData.nitrogenLevel} ppm (${cropData.nitrogenStatus})'),
          _buildDetailRow('Moisture %', '${cropData.moisturePercent}% (${cropData.moistureStatus})'),
          _buildDetailRow('Temperature', '${cropData.temperature}°C (${cropData.temperatureStatus})'),
        ],
      ),
    );
  }

  Widget _buildTerrainDetailsCard(ShadThemeData theme, CropData cropData) {
    final terrain = cropData.terrain;
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.terrain, color: Colors.brown.shade600),
              const SizedBox(width: 8),
              Text('Terrain Details', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Elevation', terrain.elevation),
          _buildDetailRow('Slope', terrain.slope),
          _buildDetailRow('Soil Type', terrain.soilType),
          _buildDetailRow('Drainage Class', terrain.drainageClass),
          _buildDetailRow('Topography', terrain.topography),
          _buildDetailRow('Water Table', terrain.waterTable),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendChartCard(ShadThemeData theme, CropData cropData) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.show_chart, color: Colors.blue.shade600),
              const SizedBox(width: 8),
              Text('Health Trend (Last 7 Days)', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 150,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: 25,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: Colors.grey.shade300,
                    strokeWidth: 1,
                  ),
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 35,
                      interval: 25,
                      getTitlesWidget: (value, meta) => Text(
                        '${value.toInt()}%',
                        style: const TextStyle(fontSize: 10),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        if (value.toInt() < days.length) {
                          return Text(days[value.toInt()], style: const TextStyle(fontSize: 10));
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: cropData.healthTrend.asMap().entries.map(
                      (e) => FlSpot(e.key.toDouble(), e.value),
                    ).toList(),
                    isCurved: true,
                    color: Colors.orange,
                    barWidth: 3,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Colors.orange.withValues(alpha: 0.2),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendationsCard(ShadThemeData theme, CropData cropData) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lightbulb_outline, color: Colors.amber),
              const SizedBox(width: 8),
              Text('AI Recommendations', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 16),
          for (int i = 0; i < cropData.recommendations.length; i++) ...[
            _buildRecommendation(
              icon: _getIconFromString(cropData.recommendations[i].icon),
              title: cropData.recommendations[i].title,
              description: cropData.recommendations[i].description,
              priority: cropData.recommendations[i].priority,
            ),
            if (i < cropData.recommendations.length - 1) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }

  IconData _getIconFromString(String iconName) {
    switch (iconName) {
      case 'water_drop':
        return Icons.water_drop;
      case 'bug_report':
        return Icons.bug_report;
      case 'science':
        return Icons.science;
      default:
        return Icons.info;
    }
  }

  Widget _buildRecommendation({
    required IconData icon,
    required String title,
    required String description,
    required String priority,
  }) {
    final color = priority == 'High' ? Colors.red : Colors.orange;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 45,
            height: 45,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        priority,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FieldGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green.shade600.withValues(alpha: 0.3)
      ..strokeWidth = 1;

    // Draw horizontal lines
    for (double i = 0; i <= size.height; i += 30) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
    
    // Draw vertical lines
    for (double i = 0; i <= size.width; i += 40) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
