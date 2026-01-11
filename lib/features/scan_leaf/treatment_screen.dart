import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:agrisight/shared/widgets/scan_leaf_icon.dart';

class TreatmentScreen extends StatelessWidget {
  final String diseaseId;

  const TreatmentScreen({super.key, required this.diseaseId});

  // Mock treatment data based on disease
  Map<String, dynamic> _getTreatmentData(String id) {
    // Default data for late blight
    return {
      'diseaseName': 'Late Blight',
      'severity': 'Moderate',
      'overview': 'Late Blight requires immediate treatment to prevent spread. Follow the steps below for effective management.',
      'steps': [
        {
          'title': 'Remove Infected Parts',
          'description': 'Carefully remove and destroy all infected leaves, stems, and fruit. Do not compost infected material.',
          'icon': 'cut',
        },
        {
          'title': 'Apply Fungicide',
          'description': 'Apply a copper-based fungicide or chlorothalonil to all plants, including seemingly healthy ones.',
          'icon': 'spray',
        },
        {
          'title': 'Improve Air Circulation',
          'description': 'Prune plants to improve air flow and reduce humidity around foliage.',
          'icon': 'air',
        },
        {
          'title': 'Adjust Watering',
          'description': 'Water at the base of plants in the morning. Avoid wetting leaves and reduce overall moisture.',
          'icon': 'water',
        },
        {
          'title': 'Monitor Daily',
          'description': 'Check plants daily for new infections. Repeat fungicide application every 7-10 days.',
          'icon': 'monitor',
        },
      ],
      'products': [
        {
          'name': 'Copper Fungicide Spray',
          'type': 'Organic Treatment',
          'price': '₹450 - ₹650',
          'effectiveness': 0.85,
        },
        {
          'name': 'Chlorothalonil 75% WP',
          'type': 'Chemical Fungicide',
          'price': '₹320 - ₹480',
          'effectiveness': 0.92,
        },
        {
          'name': 'Mancozeb 75% WP',
          'type': 'Protective Fungicide',
          'price': '₹280 - ₹400',
          'effectiveness': 0.88,
        },
      ],
      'stores': [
        {
          'name': 'Krishi Seva Kendra',
          'distance': '2.3 km',
          'address': 'Main Market Road, Near Bus Stand',
          'phone': '+91 98765 43210',
          'available': true,
        },
        {
          'name': 'Farmers Agro Store',
          'distance': '4.8 km',
          'address': 'Agricultural Complex, Sector 5',
          'phone': '+91 98765 43211',
          'available': true,
        },
        {
          'name': 'Green Fields Agri Shop',
          'distance': '7.2 km',
          'address': 'Highway Junction, NH-44',
          'phone': '+91 98765 43212',
          'available': false,
        },
      ],
      'tips': [
        'Plant resistant varieties when possible',
        'Rotate crops each season',
        'Avoid overhead irrigation',
        'Keep garden free of debris',
        'Space plants adequately for air circulation',
      ],
    };
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'low':
        return Colors.green;
      case 'moderate':
        return Colors.orange;
      case 'severe':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStepIcon(String iconName) {
    switch (iconName) {
      case 'cut':
        return Icons.content_cut;
      case 'spray':
        return Icons.cleaning_services;
      case 'air':
        return Icons.air;
      case 'water':
        return Icons.water_drop;
      case 'monitor':
        return Icons.visibility;
      default:
        return Icons.check_circle;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final data = _getTreatmentData(diseaseId);
    final severityColor = _getSeverityColor(data['severity'] as String);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/scan-leaf'),
        ),
        title: Text('Treatment', style: theme.textTheme.h3),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              // Share functionality placeholder
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Disease Header
                _buildHeaderCard(theme, data, severityColor),
                const SizedBox(height: 24),

                // Treatment Steps
                _buildTreatmentStepsCard(theme, data),
                const SizedBox(height: 24),

                // Two column layout for products and stores
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _buildProductsCard(theme, data),
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: _buildStoresCard(theme, data),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Prevention Tips
                _buildTipsCard(theme, data),
                const SizedBox(height: 24),

                // Back to Scan Button
                _buildBackToScanButton(context),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderCard(
      ShadThemeData theme, Map<String, dynamic> data, Color severityColor) {
    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: severityColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              Icons.medical_services,
              color: severityColor,
              size: 36,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      data['diseaseName'] as String,
                      style: theme.textTheme.h3,
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: severityColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        data['severity'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  data['overview'] as String,
                  style: theme.textTheme.muted,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTreatmentStepsCard(
      ShadThemeData theme, Map<String, dynamic> data) {
    final steps = data['steps'] as List;

    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF6B8E6B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.format_list_numbered,
                  color: Color(0xFF6B8E6B),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text('Treatment Steps', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 20),
          ...steps.asMap().entries.map((entry) {
            final index = entry.key;
            final step = entry.value as Map<String, dynamic>;
            final isLast = index == steps.length - 1;

            return _buildStepItem(
              index + 1,
              step['title'] as String,
              step['description'] as String,
              _getStepIcon(step['icon'] as String),
              isLast,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildStepItem(
    int number,
    String title,
    String description,
    IconData icon,
    bool isLast,
  ) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF6B8E6B),
                      const Color(0xFF4A7C4A),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '$number',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    color: const Color(0xFF6B8E6B).withValues(alpha: 0.3),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Container(
              margin: EdgeInsets.only(bottom: isLast ? 0 : 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF6B8E6B).withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: const Color(0xFF6B8E6B).withValues(alpha: 0.15),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(icon, color: const Color(0xFF6B8E6B), size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          description,
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ],
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

  Widget _buildProductsCard(ShadThemeData theme, Map<String, dynamic> data) {
    final products = data['products'] as List;

    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.purple.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.shopping_bag,
                  color: Colors.purple,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text('Recommended Products', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 20),
          ...products.map((product) {
            final p = product as Map<String, dynamic>;
            return _buildProductItem(
              p['name'] as String,
              p['type'] as String,
              p['price'] as String,
              p['effectiveness'] as double,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildProductItem(
    String name,
    String type,
    String price,
    double effectiveness,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF6B8E6B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  type,
                  style: const TextStyle(
                    color: Color(0xFF6B8E6B),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                price,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Row(
                children: [
                  Text(
                    '${(effectiveness * 100).toInt()}%',
                    style: const TextStyle(
                      color: Color(0xFF6B8E6B),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'effective',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStoresCard(ShadThemeData theme, Map<String, dynamic> data) {
    final stores = data['stores'] as List;

    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.store,
                  color: Colors.blue,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text('Where to Buy', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 20),
          ...stores.map((store) {
            final s = store as Map<String, dynamic>;
            return _buildStoreItem(
              s['name'] as String,
              s['distance'] as String,
              s['address'] as String,
              s['phone'] as String,
              s['available'] as bool,
            );
          }),
        ],
      ),
    );
  }

  Widget _buildStoreItem(
    String name,
    String distance,
    String address,
    String phone,
    bool available,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: available
            ? Colors.green.withValues(alpha: 0.05)
            : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: available
              ? Colors.green.withValues(alpha: 0.2)
              : Colors.grey.shade300,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              Row(
                children: [
                  Icon(Icons.location_on, size: 14, color: Colors.grey.shade600),
                  const SizedBox(width: 2),
                  Text(
                    distance,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            address,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.phone, size: 14, color: Colors.blue),
                  const SizedBox(width: 4),
                  Text(
                    phone,
                    style: const TextStyle(
                      color: Colors.blue,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: available ? Colors.green : Colors.grey,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  available ? 'In Stock' : 'Out of Stock',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTipsCard(ShadThemeData theme, Map<String, dynamic> data) {
    final tips = data['tips'] as List;

    return ShadCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.lightbulb,
                  color: Colors.amber,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Text('Prevention Tips', style: theme.textTheme.h4),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: tips.map((tip) {
              return Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.amber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.amber.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle,
                        size: 16, color: Colors.amber),
                    const SizedBox(width: 6),
                    Text(
                      tip as String,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildBackToScanButton(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.go('/scan-leaf'),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFF6B8E6B),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ScanLeafIcon(size: 24, color: Color(0xFF6B8E6B)),
              SizedBox(width: 10),
              Text(
                'Scan Another Leaf',
                style: TextStyle(
                  color: Color(0xFF6B8E6B),
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
