import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class IpmStrategyWidget extends StatelessWidget {
  const IpmStrategyWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    
    return GestureDetector(
      onTap: () => context.go('/ipm-strategy'),
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: ShadCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.teal.shade400,
                          Colors.teal.shade600,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.eco, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('IPM Strategy', style: theme.textTheme.h4),
                        Text('Integrated Pest Management', style: theme.textTheme.muted),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward_ios, size: 16, color: theme.colorScheme.mutedForeground),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Summary text
              Text(
                'Long-term sustainable pest management combining companion planting, predictive analytics, and optimized timing.',
                style: theme.textTheme.muted.copyWith(height: 1.4),
              ),
              
              const SizedBox(height: 16),
              
              // Quick stats row
              Row(
                children: [
                  _buildQuickStat(
                    context,
                    icon: Icons.local_florist,
                    label: 'Companion',
                    value: '3 plants',
                    color: Colors.green,
                  ),
                  const SizedBox(width: 12),
                  _buildQuickStat(
                    context,
                    icon: Icons.trending_up,
                    label: 'Risk Level',
                    value: 'Low',
                    color: Colors.blue,
                  ),
                  const SizedBox(width: 12),
                  _buildQuickStat(
                    context,
                    icon: Icons.schedule,
                    label: 'Next Action',
                    value: '2 days',
                    color: Colors.orange,
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // View details hint
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.teal.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.touch_app, size: 14, color: Colors.teal.shade600),
                    const SizedBox(width: 6),
                    Text(
                      'Tap for detailed strategy',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.teal.shade600,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStat(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: color.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
