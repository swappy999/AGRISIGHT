import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:intl/intl.dart';

enum NotificationType { alert, warning, info, reminder }

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final DateTime time;
  final bool isRead;
  final NotificationType type;

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    required this.isRead,
    required this.type,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? message,
    DateTime? time,
    bool? isRead,
    NotificationType? type,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      time: time ?? this.time,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
    );
  }
}

class NotificationPanel extends StatelessWidget {
  final List<NotificationItem> notifications;
  final VoidCallback onClose;
  final Function(String) onMarkAsRead;
  final VoidCallback onMarkAllAsRead;

  const NotificationPanel({
    super.key,
    required this.notifications,
    required this.onClose,
    required this.onMarkAsRead,
    required this.onMarkAllAsRead,
  });

  IconData _getIconForType(NotificationType type) {
    switch (type) {
      case NotificationType.alert:
        return Icons.error_outline;
      case NotificationType.warning:
        return Icons.warning_amber_outlined;
      case NotificationType.info:
        return Icons.info_outline;
      case NotificationType.reminder:
        return Icons.schedule;
    }
  }

  Color _getColorForType(NotificationType type) {
    switch (type) {
      case NotificationType.alert:
        return Colors.red;
      case NotificationType.warning:
        return Colors.orange;
      case NotificationType.info:
        return Colors.blue;
      case NotificationType.reminder:
        return Colors.purple;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return DateFormat('MMM d').format(time);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return Align(
      alignment: Alignment.centerRight,
      child: Material(
        color: theme.colorScheme.background,
        elevation: 16,
        child: Container(
          width: 380,
          height: double.infinity,
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(
                color: theme.colorScheme.border,
                width: 1,
              ),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: theme.colorScheme.border,
                      width: 1,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text('Notifications', style: theme.textTheme.h4),
                        if (unreadCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              unreadCount.toString(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Row(
                      children: [
                        if (unreadCount > 0)
                          TextButton(
                            onPressed: onMarkAllAsRead,
                            child: Text(
                              'Mark all read',
                              style: TextStyle(
                                color: theme.colorScheme.primary,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: onClose,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Notifications list
              Expanded(
                child: notifications.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.notifications_none,
                              size: 48,
                              color: theme.colorScheme.mutedForeground,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No notifications',
                              style: theme.textTheme.muted,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: notifications.length,
                        itemBuilder: (context, index) {
                          final notification = notifications[index];
                          return InkWell(
                            onTap: () {
                              if (!notification.isRead) {
                                onMarkAsRead(notification.id);
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: notification.isRead
                                    ? Colors.transparent
                                    : theme.colorScheme.primary.withOpacity(0.05),
                                border: Border(
                                  bottom: BorderSide(
                                    color: theme.colorScheme.border,
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Icon
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: _getColorForType(notification.type).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _getIconForType(notification.type),
                                      color: _getColorForType(notification.type),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Content
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                notification.title,
                                                style: TextStyle(
                                                  fontWeight: notification.isRead
                                                      ? FontWeight.normal
                                                      : FontWeight.bold,
                                                  fontSize: 14,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Text(
                                              _formatTime(notification.time),
                                              style: theme.textTheme.small.copyWith(
                                                color: theme.colorScheme.mutedForeground,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          notification.message,
                                          style: theme.textTheme.small.copyWith(
                                            color: theme.colorScheme.mutedForeground,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Unread indicator
                                  if (!notification.isRead)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      margin: const EdgeInsets.only(left: 8, top: 6),
                                      decoration: const BoxDecoration(
                                        color: Colors.blue,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
