import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class ConversationHistoryPanel extends StatelessWidget {
  final VoidCallback onClose;
  final Function(ConversationHistory) onSelectConversation;
  final List<ConversationHistory> conversations;

  const ConversationHistoryPanel({
    super.key,
    required this.onClose,
    required this.onSelectConversation,
    required this.conversations,
  });

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final panelWidth = screenWidth > 600 ? 380.0 : screenWidth * 0.85;

    return Stack(
      children: [
        // Barrier
        GestureDetector(
          onTap: onClose,
          child: Container(color: Colors.transparent),
        ),
        
        // Panel
        Positioned(
          right: 0,
          top: 0,
          bottom: 0,
          width: panelWidth,
          child: Material(
            color: theme.colorScheme.background,
            elevation: 16,
            child: Column(
              children: [
                // Header
                Container(
                  padding: EdgeInsets.only(
                    top: MediaQuery.of(context).padding.top + 16,
                    left: 20,
                    right: 20,
                    bottom: 16,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.background,
                    border: Border(
                      bottom: BorderSide(color: theme.colorScheme.border),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6B8E6B), Color(0xFF4A7C4A)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.history, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Chat History',
                              style: theme.textTheme.h4,
                            ),
                            Text(
                              '${conversations.length} conversations',
                              style: theme.textTheme.muted,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: onClose,
                      ),
                    ],
                  ),
                ),
                
                // New chat button
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: GestureDetector(
                    onTap: () {
                      onClose();
                      // Start new conversation
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6B8E6B), Color(0xFF4A7C4A)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6B8E6B).withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add, color: Colors.white),
                          SizedBox(width: 8),
                          Text(
                            'New Conversation',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Search bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.muted.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: theme.colorScheme.border),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search, color: theme.colorScheme.mutedForeground, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            decoration: InputDecoration(
                              hintText: 'Search conversations...',
                              hintStyle: TextStyle(color: theme.colorScheme.mutedForeground),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            style: TextStyle(color: theme.colorScheme.foreground),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Conversation list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: conversations.length,
                    itemBuilder: (context, index) {
                      return _buildConversationTile(
                        context,
                        theme,
                        conversations[index],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildConversationTile(
    BuildContext context,
    ShadThemeData theme,
    ConversationHistory conversation,
  ) {
    return GestureDetector(
      onTap: () {
        onSelectConversation(conversation);
        onClose();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: conversation.isActive 
              ? const Color(0xFF6B8E6B).withValues(alpha: 0.1)
              : theme.colorScheme.muted.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: conversation.isActive 
                ? const Color(0xFF6B8E6B).withValues(alpha: 0.3)
                : theme.colorScheme.border.withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            // Icon based on category
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: _getCategoryColor(conversation.category).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                _getCategoryIcon(conversation.category),
                color: _getCategoryColor(conversation.category),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.title,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.foreground,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.isActive)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF6B8E6B),
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    conversation.lastMessage,
                    style: theme.textTheme.muted.copyWith(fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        _formatDate(conversation.timestamp),
                        style: TextStyle(
                          fontSize: 11,
                          color: theme.colorScheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getCategoryColor(conversation.category).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          conversation.category,
                          style: TextStyle(
                            fontSize: 10,
                            color: _getCategoryColor(conversation.category),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              color: theme.colorScheme.mutedForeground,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'disease':
        return Colors.red;
      case 'irrigation':
        return Colors.blue;
      case 'pests':
        return Colors.orange;
      case 'general':
        return Colors.green;
      case 'weather':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'disease':
        return Icons.local_hospital;
      case 'irrigation':
        return Icons.water_drop;
      case 'pests':
        return Icons.bug_report;
      case 'general':
        return Icons.chat;
      case 'weather':
        return Icons.wb_sunny;
      default:
        return Icons.forum;
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}

class ConversationHistory {
  final String id;
  final String title;
  final String lastMessage;
  final DateTime timestamp;
  final String category;
  final bool isActive;
  final int messageCount;

  const ConversationHistory({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.timestamp,
    required this.category,
    this.isActive = false,
    this.messageCount = 0,
  });
}
