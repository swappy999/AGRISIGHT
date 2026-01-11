import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:agrisight/features/dashboard/widgets/weather_widget.dart';
import 'package:agrisight/features/dashboard/widgets/crop_health_status_widget.dart';
import 'package:agrisight/features/dashboard/widgets/crop_health_summary_widget.dart';
import 'package:agrisight/features/dashboard/widgets/health_trend_graph.dart';
import 'package:agrisight/features/dashboard/widgets/notification_panel.dart';
import 'package:agrisight/features/dashboard/widgets/profile_panel.dart';
import 'package:agrisight/features/dashboard/widgets/ipm_strategy_widget.dart';
import 'package:agrisight/shared/widgets/scan_leaf_icon.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedNavIndex = 0;
  
  // Sample notification data
  final List<NotificationItem> _notifications = [
    NotificationItem(
      id: '1',
      title: 'Irrigation Alert',
      message: 'Sector 4 moisture levels are critically low. Immediate action required.',
      time: DateTime.now().subtract(const Duration(minutes: 5)),
      isRead: false,
      type: NotificationType.alert,
    ),
    NotificationItem(
      id: '2',
      title: 'Crop Health Update',
      message: 'Nitrogen levels in Field A have improved by 15% this week.',
      time: DateTime.now().subtract(const Duration(hours: 1)),
      isRead: false,
      type: NotificationType.info,
    ),
    NotificationItem(
      id: '3',
      title: 'Weather Warning',
      message: 'Heavy rainfall expected in the next 48 hours. Plan accordingly.',
      time: DateTime.now().subtract(const Duration(hours: 3)),
      isRead: false,
      type: NotificationType.warning,
    ),
    NotificationItem(
      id: '4',
      title: 'Harvest Reminder',
      message: 'Optimal harvest window for wheat field opens in 3 days.',
      time: DateTime.now().subtract(const Duration(hours: 6)),
      isRead: true,
      type: NotificationType.reminder,
    ),
    NotificationItem(
      id: '5',
      title: 'System Update',
      message: 'New AI model deployed for better pest detection accuracy.',
      time: DateTime.now().subtract(const Duration(days: 1)),
      isRead: true,
      type: NotificationType.info,
    ),
  ];

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void _openNotificationPanel() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Notifications',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return NotificationPanel(
          notifications: _notifications,
          onClose: () => Navigator.of(context).pop(),
          onMarkAsRead: (id) {
            setState(() {
              final index = _notifications.indexWhere((n) => n.id == id);
              if (index != -1) {
                _notifications[index] = _notifications[index].copyWith(isRead: true);
              }
            });
          },
          onMarkAllAsRead: () {
            setState(() {
              for (int i = 0; i < _notifications.length; i++) {
                _notifications[i] = _notifications[i].copyWith(isRead: true);
              }
            });
          },
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: child,
        );
      },
    );
  }

  void _openProfilePanel() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Profile',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return ProfilePanel(
          onClose: () => Navigator.of(context).pop(),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: child,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Home', style: theme.textTheme.h3),
        actions: [
          // Scan Leaf button
          IconButton(
            icon: const ScanLeafIcon(size: 24, outlined: true),
            tooltip: 'Scan Leaf',
            onPressed: () => context.go('/scan-leaf'),
          ),
          // Notification button with badge
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: _openNotificationPanel,
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                    child: Text(
                      unreadCount > 9 ? '9+' : unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: _openProfilePanel,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1200),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: WeatherWidget(),
                    ),
                    SizedBox(width: 24),
                    Expanded(
                      flex: 3,
                      child: CropHealthStatusWidget(),
                    ),
                  ],
                ),
                SizedBox(height: 24),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 1,
                      child: CropHealthSummaryWidget(),
                    ),
                    SizedBox(width: 24),
                    Expanded(
                      flex: 1,
                      child: HealthTrendGraph(),
                    ),
                  ],
                ),
                SizedBox(height: 24),
                IpmStrategyWidget(),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.background,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  icon: Icons.home_outlined,
                  selectedIcon: Icons.home,
                  label: 'Home',
                  isSelected: _selectedNavIndex == 0,
                  onTap: () => setState(() => _selectedNavIndex = 0),
                ),
                _buildNavItem(
                  icon: Icons.mic_outlined,
                  selectedIcon: Icons.mic,
                  label: 'Voice AI',
                  isSelected: _selectedNavIndex == 1,
                  onTap: () => context.go('/voice-ai'),
                  isSpecial: true,
                ),
                _buildNavItem(
                  icon: Icons.chat_bubble_outline,
                  selectedIcon: Icons.chat_bubble,
                  label: 'Chat',
                  isSelected: _selectedNavIndex == 2,
                  onTap: () => context.go('/chat'),
                  badgeCount: 2, // Example unread chat count
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData selectedIcon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    int badgeCount = 0,
    bool isSpecial = false,
  }) {
    final theme = ShadTheme.of(context);
    final color = isSpecial 
        ? Colors.white 
        : isSelected 
            ? const Color(0xFF6B8E6B) 
            : theme.colorScheme.mutedForeground;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          gradient: isSpecial 
              ? LinearGradient(
                  colors: [
                    const Color(0xFF6B8E6B),
                    const Color(0xFF4A7C4A),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: !isSpecial && isSelected ? const Color(0xFF6B8E6B).withValues(alpha: 0.1) : (!isSpecial ? Colors.transparent : null),
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSpecial ? [
            BoxShadow(
              color: const Color(0xFF6B8E6B).withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? selectedIcon : icon,
                  color: color,
                  size: 24,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: -8,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        badgeCount > 9 ? '9+' : badgeCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
