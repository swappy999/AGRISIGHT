import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class WeatherWidget extends StatelessWidget {
  const WeatherWidget({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return ShadCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Weather', style: theme.textTheme.h4),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.sunny, size: 48, color: Colors.orange),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('28°C', style: theme.textTheme.h2),
                  Text('Sunny', style: theme.textTheme.muted),
                ],
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Humidity: 65%', style: theme.textTheme.small),
                  Text('Wind: 12 km/h', style: theme.textTheme.small),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
