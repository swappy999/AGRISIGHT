import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class CropHealthSummaryWidget extends StatelessWidget {
  const CropHealthSummaryWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ShadCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Health Summary', style: theme.textTheme.h4),
          const SizedBox(height: 16),
          Text(
            'Nitrogen levels are optimal. Soil moisture is slightly low in Sector 4. Recommendation: Increase irrigation by 10% for the next 2 days to prevent stress.',
            style: theme.textTheme.p.copyWith(height: 1.5),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: [
              ShadBadge(
                child: const Text('Nitrogen: Optimal'),
              ),
              ShadBadge.destructive(
                child: const Text('Moisture: Low'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
