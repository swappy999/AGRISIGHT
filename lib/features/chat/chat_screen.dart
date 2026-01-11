import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:agrisight/features/chat/widgets/conversation_history_panel.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  
  bool _isListening = false;
  bool _isTyping = false;
  bool _isAiTyping = false;
  late AnimationController _micPulseController;
  late Animation<double> _micPulseAnimation;
  
  String _currentConversationId = 'current';
  
  List<ChatMessage> _messages = [
    ChatMessage(
      text: "Hello! I'm your AgriSight AI assistant. I can help you with:\n\n🌿 Plant identification\n🐛 Pest & disease diagnosis\n💧 Irrigation advice\n🌡️ Weather-based recommendations\n📊 Crop health analysis\n\nHow can I assist you today?",
      isUser: false,
      timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
    ),
  ];

  // Sample conversation history
  final List<ConversationHistory> _conversationHistory = [
    ConversationHistory(
      id: '1',
      title: 'Tomato Leaf Disease',
      lastMessage: 'Based on the symptoms, this appears to be Early Blight...',
      timestamp: DateTime.now().subtract(const Duration(minutes: 30)),
      category: 'Disease',
      isActive: true,
      messageCount: 8,
    ),
    ConversationHistory(
      id: '2',
      title: 'Irrigation Schedule',
      lastMessage: 'For wheat crops, I recommend watering every 3-4 days...',
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      category: 'Irrigation',
      messageCount: 5,
    ),
    ConversationHistory(
      id: '3',
      title: 'Aphid Infestation',
      lastMessage: 'Apply neem oil solution to affected areas...',
      timestamp: DateTime.now().subtract(const Duration(hours: 5)),
      category: 'Pests',
      messageCount: 12,
    ),
    ConversationHistory(
      id: '4',
      title: 'Weather Advisory',
      lastMessage: 'Heavy rain expected, postpone fertilizer application...',
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
      category: 'Weather',
      messageCount: 4,
    ),
    ConversationHistory(
      id: '5',
      title: 'Crop Rotation Help',
      lastMessage: 'After legumes, consider planting cereals for best results...',
      timestamp: DateTime.now().subtract(const Duration(days: 2)),
      category: 'General',
      messageCount: 6,
    ),
    ConversationHistory(
      id: '6',
      title: 'Nutrient Deficiency',
      lastMessage: 'Yellow leaves with green veins indicate iron deficiency...',
      timestamp: DateTime.now().subtract(const Duration(days: 3)),
      category: 'Disease',
      messageCount: 9,
    ),
  ];

  // Stored messages for each conversation
  final Map<String, List<ChatMessage>> _storedConversations = {
    '1': [
      ChatMessage(text: 'My tomato plant leaves have brown spots with rings. What could it be?', isUser: true, timestamp: DateTime.now().subtract(const Duration(minutes: 35))),
      ChatMessage(text: 'Based on the symptoms you\'re describing - brown spots with concentric rings - this appears to be **Early Blight (Alternaria solani)**.\n\n**Key Indicators:**\n• Brown spots with target-like rings\n• Usually starts on lower/older leaves\n• Yellow halos around spots\n\nCan you share a photo for confirmation?', isUser: false, timestamp: DateTime.now().subtract(const Duration(minutes: 34))),
      ChatMessage(text: 'Yes, the spots are exactly like that. The lower leaves are affected first.', isUser: true, timestamp: DateTime.now().subtract(const Duration(minutes: 32))),
      ChatMessage(text: 'That confirms Early Blight. Here\'s your treatment plan:\n\n**Immediate Actions:**\n1. Remove all affected leaves\n2. Apply copper-based fungicide\n3. Improve air circulation\n\n**Prevention:**\n• Water at soil level\n• Mulch around plants\n• Rotate crops next season', isUser: false, timestamp: DateTime.now().subtract(const Duration(minutes: 30))),
    ],
    '2': [
      ChatMessage(text: 'How often should I water my wheat crop?', isUser: true, timestamp: DateTime.now().subtract(const Duration(hours: 3))),
      ChatMessage(text: 'For wheat crops, irrigation depends on the growth stage:\n\n**Recommended Schedule:**\n• Germination: Keep soil moist\n• Tillering: Every 3-4 days\n• Heading: Critical - every 2-3 days\n• Grain filling: Every 4-5 days\n\nCurrent moisture in your area looks adequate. Would you like a customized schedule?', isUser: false, timestamp: DateTime.now().subtract(const Duration(hours: 2))),
    ],
    '3': [
      ChatMessage(text: 'I found small green bugs on my plants. They seem to be multiplying!', isUser: true, timestamp: DateTime.now().subtract(const Duration(hours: 6))),
      ChatMessage(text: 'Those are likely **Aphids** - one of the most common garden pests.\n\n**Identification:**\n• Small, soft-bodied insects\n• Usually green, but can be black or brown\n• Found in clusters on new growth\n\n**Natural Solutions:**\n1. Spray with neem oil solution\n2. Introduce ladybugs\n3. Use insecticidal soap', isUser: false, timestamp: DateTime.now().subtract(const Duration(hours: 5))),
    ],
    '4': [
      ChatMessage(text: 'Is it going to rain this week?', isUser: true, timestamp: DateTime.now().subtract(const Duration(days: 1, hours: 2))),
      ChatMessage(text: '**Weather Advisory for Your Area:**\n\n⛈️ Heavy rain expected in 48 hours\n🌧️ Precipitation: 25-35mm\n💨 Wind: 15-20 km/h\n\n**Recommendations:**\n• Postpone fertilizer application\n• Ensure proper drainage\n• Harvest any ripe produce\n• Secure young plants', isUser: false, timestamp: DateTime.now().subtract(const Duration(days: 1))),
    ],
    '5': [
      ChatMessage(text: 'What should I plant after harvesting beans?', isUser: true, timestamp: DateTime.now().subtract(const Duration(days: 2, hours: 1))),
      ChatMessage(text: 'Great question! Legumes like beans fix nitrogen in the soil.\n\n**Ideal crops to follow beans:**\n1. 🌾 Cereals (wheat, corn, rice)\n2. 🥬 Leafy greens (cabbage, lettuce)\n3. 🍅 Heavy feeders (tomatoes, peppers)\n\n**Avoid:**\n• Other legumes (peas, lentils)\n\nThis rotation maximizes the nitrogen boost from your bean crop!', isUser: false, timestamp: DateTime.now().subtract(const Duration(days: 2))),
    ],
    '6': [
      ChatMessage(text: 'My plant leaves are yellow but the veins are still green. Why?', isUser: true, timestamp: DateTime.now().subtract(const Duration(days: 3, hours: 1))),
      ChatMessage(text: 'This is a classic symptom of **Iron Deficiency** (Iron Chlorosis).\n\n**Causes:**\n• High soil pH (alkaline soil)\n• Overwatering\n• Poor drainage\n\n**Solutions:**\n1. Apply chelated iron fertilizer\n2. Add sulfur to lower pH\n3. Improve drainage\n4. Use iron-rich compost\n\nThe yellowing with green veins is the telltale sign - nitrogen deficiency looks different!', isUser: false, timestamp: DateTime.now().subtract(const Duration(days: 3))),
    ],
  };

  @override
  void initState() {
    super.initState();
    _micPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _micPulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _micPulseController, curve: Curves.easeInOut),
    );
    
    _messageController.addListener(() {
      setState(() {
        _isTyping = _messageController.text.isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _micPulseController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    setState(() {
      _messages.add(ChatMessage(
        text: text,
        isUser: true,
        timestamp: DateTime.now(),
      ));
      _messageController.clear();
      _isAiTyping = true;
    });
    
    _scrollToBottom();
    
    // Simulate AI response
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isAiTyping = false;
          _messages.add(ChatMessage(
            text: _generateAiResponse(text),
            isUser: false,
            timestamp: DateTime.now(),
          ));
        });
        _scrollToBottom();
      }
    });
  }

  String _generateAiResponse(String query) {
    final lowerQuery = query.toLowerCase();
    
    if (lowerQuery.contains('disease') || lowerQuery.contains('sick') || lowerQuery.contains('yellow')) {
      return '''Based on your description, this could be a few things:

**Possible Causes:**
1. **Nitrogen Deficiency** - Yellowing starts from older leaves
2. **Overwatering** - Can cause root rot and yellowing
3. **Early Blight** - Look for brown spots with rings

**Recommended Actions:**
• Take a clear photo of affected leaves
• Check soil moisture levels
• Inspect undersides of leaves for pests

Would you like me to analyze a photo of your plant?''';
    } else if (lowerQuery.contains('water') || lowerQuery.contains('irrigation')) {
      return '''For optimal irrigation, consider these factors:

**Current Recommendations:**
• Morning watering is most effective (6-10 AM)
• Check soil moisture 2 inches deep before watering
• Your region's forecast shows no rain for 3 days

**Based on your crops:**
• Wheat: 1.5-2 inches/week
• Vegetables: 1-1.5 inches every 2-3 days

Shall I set up irrigation reminders for you?''';
    } else if (lowerQuery.contains('pest') || lowerQuery.contains('bug') || lowerQuery.contains('insect')) {
      return '''I can help identify pests! Here's what to look for:

**Common Pests This Season:**
• 🐛 Aphids - Small, soft-bodied insects
• 🦗 Grasshoppers - Visible damage on leaf edges
• 🐌 Slugs - Silvery trails and holes

**Quick Check:**
1. Inspect undersides of leaves
2. Look for discoloration or holes
3. Check early morning when pests are active

Upload a photo for precise identification!''';
    } else {
      return '''Thank you for your question! 

I'm here to help with all your agricultural needs. For the best assistance, you can:

📸 **Upload a photo** - Tap the + button to share images
🎤 **Use voice** - Tap the mic for hands-free input
💬 **Ask anything** - I'm here 24/7

What specific aspect of farming would you like help with today?''';
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _toggleMic() {
    setState(() {
      _isListening = !_isListening;
      if (_isListening) {
        _micPulseController.repeat(reverse: true);
        // Simulate voice recognition
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted && _isListening) {
            setState(() {
              _messageController.text = 'Why are my tomato leaves turning yellow?';
              _isListening = false;
              _micPulseController.stop();
              _micPulseController.reset();
            });
          }
        });
      } else {
        _micPulseController.stop();
        _micPulseController.reset();
      }
    });
  }

  void _loadConversation(ConversationHistory conversation) {
    final messages = _storedConversations[conversation.id];
    if (messages != null) {
      setState(() {
        _currentConversationId = conversation.id;
        _messages = List.from(messages);
      });
      _scrollToBottom();
    }
  }

  void _showHistoryPanel() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'History',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return ConversationHistoryPanel(
          conversations: _conversationHistory,
          onClose: () => Navigator.of(context).pop(),
          onSelectConversation: (conversation) {
            Navigator.of(context).pop(); // Close panel first
            _loadConversation(conversation);
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

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildAttachmentSheet(),
    );
  }

  Widget _buildAttachmentSheet() {
    final theme = ShadTheme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.colorScheme.background,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: theme.colorScheme.muted,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          Text('Add Attachment', style: theme.textTheme.h4),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildAttachmentOption(
                icon: Icons.camera_alt,
                label: 'Camera',
                color: Colors.blue,
                onTap: () {
                  Navigator.pop(context);
                  // Camera functionality
                },
              ),
              _buildAttachmentOption(
                icon: Icons.photo_library,
                label: 'Gallery',
                color: Colors.green,
                onTap: () {
                  Navigator.pop(context);
                  // Gallery functionality
                },
              ),
              _buildAttachmentOption(
                icon: Icons.insert_drive_file,
                label: 'Document',
                color: Colors.orange,
                onTap: () {
                  Navigator.pop(context);
                  // Document functionality
                },
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildAttachmentOption({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/home'),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF6B8E6B),
                    const Color(0xFF4A7C4A),
                  ],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AgriSight AI', style: theme.textTheme.p.copyWith(fontWeight: FontWeight.bold)),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text('Online', style: theme.textTheme.muted.copyWith(fontSize: 12)),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: _showHistoryPanel,
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: _messages.length + (_isAiTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (_isAiTyping && index == _messages.length) {
                  return _buildTypingIndicator(theme);
                }
                return _buildMessageBubble(_messages[index], theme);
              },
            ),
          ),
          
          // Input bar
          _buildInputBar(theme),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message, ShadThemeData theme) {
    return Padding(
      padding: EdgeInsets.only(
        left: message.isUser ? 48 : 0,
        right: message.isUser ? 0 : 48,
        bottom: 12,
      ),
      child: Row(
        mainAxisAlignment: message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!message.isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6B8E6B), Color(0xFF4A7C4A)],
                ),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.psychology, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: message.isUser 
                    ? const Color(0xFF6B8E6B)
                    : theme.colorScheme.muted.withValues(alpha: 0.3),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(20),
                  topRight: const Radius.circular(20),
                  bottomLeft: Radius.circular(message.isUser ? 20 : 6),
                  bottomRight: Radius.circular(message.isUser ? 6 : 20),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    message.text,
                    style: TextStyle(
                      color: message.isUser ? Colors.white : theme.colorScheme.foreground,
                      fontSize: 15,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(message.timestamp),
                    style: TextStyle(
                      color: message.isUser 
                          ? Colors.white.withValues(alpha: 0.7)
                          : theme.colorScheme.mutedForeground,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (message.isUser) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: theme.colorScheme.muted,
              child: Icon(Icons.person, size: 18, color: theme.colorScheme.mutedForeground),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(ShadThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(right: 48, bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF6B8E6B), Color(0xFF4A7C4A)],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.psychology, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: theme.colorScheme.muted.withValues(alpha: 0.3),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(6),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTypingDot(0),
                const SizedBox(width: 4),
                _buildTypingDot(1),
                const SizedBox(width: 4),
                _buildTypingDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 600 + (index * 200)),
      builder: (context, value, child) {
        return Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: Colors.grey.withValues(alpha: 0.4 + (0.4 * ((value + index * 0.3) % 1))),
            shape: BoxShape.circle,
          ),
        );
      },
    );
  }

  Widget _buildInputBar(ShadThemeData theme) {
    return Container(
      padding: EdgeInsets.only(
        left: 12,
        right: 12,
        top: 12,
        bottom: MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.background,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Add attachment button
          _buildInputButton(
            icon: Icons.add,
            onTap: _showAttachmentOptions,
            backgroundColor: theme.colorScheme.muted.withValues(alpha: 0.3),
          ),
          const SizedBox(width: 8),
          
          // Text input
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.muted.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: _focusNode.hasFocus 
                      ? const Color(0xFF6B8E6B)
                      : theme.colorScheme.border,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      focusNode: _focusNode,
                      decoration: InputDecoration(
                        hintText: _isListening ? 'Listening...' : 'Ask AgriSight AI...',
                        hintStyle: TextStyle(color: theme.colorScheme.mutedForeground),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      style: TextStyle(color: theme.colorScheme.foreground),
                      maxLines: 4,
                      minLines: 1,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          
          // Mic button
          AnimatedBuilder(
            animation: _micPulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isListening ? _micPulseAnimation.value : 1.0,
                child: _buildInputButton(
                  icon: _isListening ? Icons.stop : Icons.mic,
                  onTap: _toggleMic,
                  backgroundColor: _isListening 
                      ? Colors.red 
                      : theme.colorScheme.muted.withValues(alpha: 0.3),
                  iconColor: _isListening ? Colors.white : null,
                ),
              );
            },
          ),
          const SizedBox(width: 8),
          
          // Send button
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            child: _buildInputButton(
              icon: Icons.arrow_upward,
              onTap: _sendMessage,
              backgroundColor: _isTyping 
                  ? const Color(0xFF6B8E6B)
                  : theme.colorScheme.muted.withValues(alpha: 0.3),
              iconColor: _isTyping ? Colors.white : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputButton({
    required IconData icon,
    required VoidCallback onTap,
    Color? backgroundColor,
    Color? iconColor,
  }) {
    final theme = ShadTheme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: backgroundColor ?? theme.colorScheme.muted,
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: iconColor ?? theme.colorScheme.foreground,
          size: 22,
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final String? imageUrl;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.imageUrl,
  });
}
