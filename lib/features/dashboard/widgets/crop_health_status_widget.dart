import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:agrisight/data/crop_data.dart';

class CropHealthStatusWidget extends StatelessWidget {
  const CropHealthStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final cropData = CropData();
    
    Color color;
    String label;
    IconData icon;

    switch (cropData.healthLevel) {
      case CropHealthLevel.good:
        color = Colors.green;
        label = 'Good';
        icon = Icons.check_circle;
        break;
      case CropHealthLevel.moderate:
        color = Colors.orange;
        label = 'Needs Attention';
        icon = Icons.warning;
        break;
      case CropHealthLevel.severe:
        color = Colors.red;
        label = 'Severe';
        icon = Icons.error;
        break;
    }

    return GestureDetector(
      onTap: () => context.go('/crop-status'),
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: ShadCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(child: Text('Crop Health', style: theme.textTheme.h4)),
                  Icon(Icons.arrow_forward_ios, size: 16, color: theme.colorScheme.mutedForeground),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                   Icon(icon, size: 40, color: color),
                   const SizedBox(width: 16),
                   Expanded(
                     child: Column(
                       crossAxisAlignment: CrossAxisAlignment.start,
                       children: [
                         Text(label, style: theme.textTheme.h3.copyWith(color: color)),
                         if (cropData.areasNeedingAttention > 0 && cropData.healthLevel != CropHealthLevel.good)
                           Text(
                             '${cropData.areasNeedingAttention} areas need action',
                             style: theme.textTheme.muted,
                           ),
                       ],
                     ),
                   ),
                ],
              ),
              const SizedBox(height: 8),
              Text('Tap to view detailed analysis', style: theme.textTheme.muted),
            ],
          ),
        ),
      ),
    );
  }
}
