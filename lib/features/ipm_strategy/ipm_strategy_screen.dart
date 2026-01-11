import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class IpmStrategyScreen extends StatelessWidget {
  const IpmStrategyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
        title: Text('IPM Strategy', style: theme.textTheme.h3),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.download_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1000),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
                _buildHeaderCard(theme),
                const SizedBox(height: 24),
                
                // Main content in two columns on larger screens
                LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth > 700) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildLeftColumn(theme)),
                          const SizedBox(width: 24),
                          Expanded(child: _buildRightColumn(theme)),
                        ],
                      );
                    }
                    return Column(
                      children: [
                        _buildLeftColumn(theme),
                        const SizedBox(height: 24),
                        _buildRightColumn(theme),
                      ],
                    );
                  },
                ),
                
                const SizedBox(height: 24),
                
                // Action Timeline
                _buildActionTimeline(theme),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.teal.shade400, Colors.teal.shade600],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.eco, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Integrated Pest Management Plan', style: theme.textTheme.h3),
                const SizedBox(height: 8),
                Text(
                  'A sustainable, long-term approach combining biological, cultural, and chemical controls for effective pest management.',
                  style: theme.textTheme.muted,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeftColumn(ShadThemeData theme) {
    return Column(
      children: [
        _buildCompanionPlantingCard(theme),
        const SizedBox(height: 24),
        _buildPredictiveRiskCard(theme),
      ],
    );
  }

  Widget _buildRightColumn(ShadThemeData theme) {
    return Column(
      children: [
        _buildTimingOptimizationCard(theme),
        const SizedBox(height: 24),
        _buildCurrentConditionsCard(theme),
      ],
    );
  }

  Widget _buildCompanionPlantingCard(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.local_florist, color: Colors.green.shade600, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Companion Planting', style: theme.textTheme.h4),
                    Text('Natural pest repellents', style: theme.textTheme.muted),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          Text(
            'Strategic planting of companion crops to naturally repel pests and attract beneficial insects.',
            style: theme.textTheme.muted.copyWith(height: 1.5),
          ),
          
          const SizedBox(height: 16),
          
          _buildCompanionPlant(
            theme,
            name: 'Marigolds',
            benefit: 'Repels aphids, mosquitoes, and nematodes',
            icon: '🌼',
            placement: 'Border around main crops',
          ),
          const SizedBox(height: 12),
          _buildCompanionPlant(
            theme,
            name: 'Basil',
            benefit: 'Deters flies, mosquitoes, and thrips',
            icon: '🌿',
            placement: 'Between tomato rows',
          ),
          const SizedBox(height: 12),
          _buildCompanionPlant(
            theme,
            name: 'Nasturtiums',
            benefit: 'Trap crop for aphids, attracts predators',
            icon: '🌸',
            placement: 'Field edges as sacrificial plants',
          ),
        ],
      ),
    );
  }

  Widget _buildCompanionPlant(
    ShadThemeData theme, {
    required String name,
    required String benefit,
    required String icon,
    required String placement,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(benefit, style: theme.textTheme.muted.copyWith(fontSize: 13)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.place, size: 14, color: Colors.green.shade600),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        placement,
                        style: TextStyle(fontSize: 12, color: Colors.green.shade600),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPredictiveRiskCard(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.analytics, color: Colors.blue.shade600, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Predictive Risk Analysis', style: theme.textTheme.h4),
                    Text('AI-powered outbreak prediction', style: theme.textTheme.muted),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          Text(
            'Correlating local weather data with AI training to predict pest outbreaks before they happen.',
            style: theme.textTheme.muted.copyWith(height: 1.5),
          ),
          
          const SizedBox(height: 16),
          
          // Risk indicators
          _buildRiskIndicator(
            theme,
            pest: 'Aphids',
            risk: 0.25,
            color: Colors.green,
            trigger: 'Humidity > 70% + Temp 20-25°C',
          ),
          const SizedBox(height: 10),
          _buildRiskIndicator(
            theme,
            pest: 'Fungal Disease',
            risk: 0.60,
            color: Colors.orange,
            trigger: 'Rain expected + High humidity',
          ),
          const SizedBox(height: 10),
          _buildRiskIndicator(
            theme,
            pest: 'Caterpillars',
            risk: 0.15,
            color: Colors.green,
            trigger: 'Moth activity + Warm nights',
          ),
          
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.blue.shade600),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Monitor fungal risk closely - conditions favorable in next 48 hours.',
                    style: TextStyle(color: Colors.blue.shade700, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiskIndicator(
    ShadThemeData theme, {
    required String pest,
    required double risk,
    required Color color,
    required String trigger,
  }) {
    final riskLabel = risk < 0.3 ? 'Low' : risk < 0.6 ? 'Medium' : 'High';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.muted.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(pest, style: const TextStyle(fontWeight: FontWeight.w600)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  riskLabel,
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: risk,
              backgroundColor: Colors.grey.shade300,
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Trigger: $trigger',
            style: TextStyle(fontSize: 11, color: theme.colorScheme.mutedForeground),
          ),
        ],
      ),
    );
  }

  Widget _buildTimingOptimizationCard(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.schedule, color: Colors.orange.shade600, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Timing Optimization', style: theme.textTheme.h4),
                    Text('Maximize treatment effectiveness', style: theme.textTheme.muted),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          Text(
            'Advising optimal spray times when wind speeds are low and pests are in their most vulnerable stages.',
            style: theme.textTheme.muted.copyWith(height: 1.5),
          ),
          
          const SizedBox(height: 16),
          
          // Optimal windows
          _buildOptimalWindow(
            theme,
            title: 'Next Spray Window',
            time: 'Tomorrow, 6:00 AM - 8:00 AM',
            conditions: ['Wind: 5 km/h', 'Humidity: 65%', 'No rain expected'],
            isOptimal: true,
          ),
          const SizedBox(height: 12),
          _buildOptimalWindow(
            theme,
            title: 'Backup Window',
            time: 'Tomorrow, 5:00 PM - 7:00 PM',
            conditions: ['Wind: 8 km/h', 'Humidity: 55%', 'Clear skies'],
            isOptimal: false,
          ),
          
          const SizedBox(height: 16),
          
          // Pest lifecycle info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.orange.withValues(alpha: 0.1),
                  Colors.yellow.withValues(alpha: 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.bug_report, color: Colors.orange.shade600),
                    const SizedBox(width: 8),
                    const Text('Pest Lifecycle Target', style: TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Current aphid population is in larval stage - most vulnerable to treatment. Effectiveness is 85% higher compared to adult stage.',
                  style: theme.textTheme.muted.copyWith(fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptimalWindow(
    ShadThemeData theme, {
    required String title,
    required String time,
    required List<String> conditions,
    required bool isOptimal,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isOptimal 
            ? Colors.green.withValues(alpha: 0.1)
            : theme.colorScheme.muted.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOptimal 
              ? Colors.green.withValues(alpha: 0.3)
              : theme.colorScheme.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isOptimal)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'OPTIMAL',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.access_time, size: 16, color: isOptimal ? Colors.green.shade600 : Colors.grey),
              const SizedBox(width: 6),
              Text(time, style: TextStyle(color: isOptimal ? Colors.green.shade700 : null)),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: conditions.map((c) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.muted.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(c, style: const TextStyle(fontSize: 11)),
            )).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentConditionsCard(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.purple.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.cloud, color: Colors.purple.shade600, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current Conditions', style: theme.textTheme.h4),
                    Text('Environmental factors', style: theme.textTheme.muted),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          Row(
            children: [
              _buildConditionItem(theme, icon: Icons.thermostat, value: '24°C', label: 'Temperature'),
              _buildConditionItem(theme, icon: Icons.water_drop, value: '68%', label: 'Humidity'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildConditionItem(theme, icon: Icons.air, value: '12 km/h', label: 'Wind'),
              _buildConditionItem(theme, icon: Icons.wb_sunny, value: '6 hrs', label: 'Sunlight'),
            ],
          ),
          
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.purple.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green.shade600),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Conditions favorable for field inspection and preventive measures.',
                    style: TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConditionItem(ShadThemeData theme, {required IconData icon, required String value, required String label}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        margin: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: theme.colorScheme.muted.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: theme.colorScheme.mutedForeground),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(label, style: TextStyle(fontSize: 11, color: theme.colorScheme.mutedForeground)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionTimeline(ShadThemeData theme) {
    return ShadCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.indigo.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.timeline, color: Colors.indigo.shade600, size: 22),
              ),
              const SizedBox(width: 12),
              Text('Recommended Action Timeline', style: theme.textTheme.h4),
            ],
          ),
          
          const SizedBox(height: 20),
          
          _buildTimelineItem(
            theme,
            day: 'Today',
            action: 'Field inspection and monitoring',
            detail: 'Check undersides of leaves for early pest signs',
            icon: Icons.search,
            color: Colors.blue,
            isCompleted: false,
          ),
          _buildTimelineItem(
            theme,
            day: 'Tomorrow',
            action: 'Apply neem oil spray',
            detail: 'Optimal window: 6:00 AM - 8:00 AM',
            icon: Icons.water_drop_outlined,
            color: Colors.green,
            isCompleted: false,
          ),
          _buildTimelineItem(
            theme,
            day: 'Day 3',
            action: 'Plant companion crops',
            detail: 'Marigolds around field borders',
            icon: Icons.local_florist,
            color: Colors.orange,
            isCompleted: false,
          ),
          _buildTimelineItem(
            theme,
            day: 'Day 7',
            action: 'Follow-up inspection',
            detail: 'Assess treatment effectiveness',
            icon: Icons.assessment,
            color: Colors.purple,
            isCompleted: false,
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(
    ShadThemeData theme, {
    required String day,
    required String action,
    required String detail,
    required IconData icon,
    required Color color,
    required bool isCompleted,
    bool isLast = false,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isCompleted ? color : color.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isCompleted ? Icons.check : icon,
                  color: isCompleted ? Colors.white : color,
                  size: 18,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: theme.colorScheme.border,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      day,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(action, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(detail, style: theme.textTheme.muted.copyWith(fontSize: 13)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
