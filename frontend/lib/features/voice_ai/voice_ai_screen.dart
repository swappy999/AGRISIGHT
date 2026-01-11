import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class VoiceAIScreen extends StatefulWidget {
  const VoiceAIScreen({super.key});

  @override
  State<VoiceAIScreen> createState() => _VoiceAIScreenState();
}

class _VoiceAIScreenState extends State<VoiceAIScreen>
    with SingleTickerProviderStateMixin {
  bool _isListening = false;
  bool _isCameraActive = true;
  bool _isFlashOn = false;
  bool _isProcessing = false;
  String _transcribedText = '';
  String _aiResponse = '';
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _toggleListening() {
    setState(() {
      _isListening = !_isListening;
      if (_isListening) {
        _pulseController.repeat(reverse: true);
        _transcribedText = '';
        _aiResponse = '';
        // Simulate voice recognition
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted && _isListening) {
            setState(() {
              _transcribedText = 'What disease does this plant have?';
            });
          }
        });
      } else {
        _pulseController.stop();
        _pulseController.reset();
        if (_transcribedText.isNotEmpty) {
          _processQuery();
        }
      }
    });
  }

  void _processQuery() {
    setState(() {
      _isProcessing = true;
    });
    
    // Simulate AI processing
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _aiResponse = '''Based on my analysis of the plant image:

**Diagnosis: Early Blight (Alternaria solani)**

**Symptoms Detected:**
• Brown spots with concentric rings on lower leaves
• Yellowing around affected areas
• Leaf curling at edges

**Recommended Treatment:**
1. Remove affected leaves immediately
2. Apply copper-based fungicide
3. Improve air circulation
4. Water at soil level to avoid wet foliage

**Prevention:**
• Rotate crops annually
• Use disease-resistant varieties
• Maintain proper spacing''';
        });
      }
    });
  }

  void _captureAndAnalyze() {
    setState(() {
      _isProcessing = true;
      _transcribedText = 'Analyzing captured image...';
    });
    
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _aiResponse = '''**Plant Health Analysis Complete**

**Species Identified:** Tomato (Solanum lycopersicum)

**Overall Health Score:** 72/100 ⚠️

**Issues Detected:**
• Nutrient deficiency (Nitrogen) - Moderate
• Early signs of pest activity - Low
• Water stress indicators - Mild

**Recommendations:**
1. Apply balanced NPK fertilizer (10-10-10)
2. Check undersides of leaves for aphids
3. Increase watering frequency slightly
4. Monitor for 48 hours and reassess''';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final screenSize = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview area (simulated)
          if (_isCameraActive)
            Container(
              width: double.infinity,
              height: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.green.shade900,
                    Colors.green.shade800,
                    Colors.green.shade700,
                  ],
                ),
              ),
              child: Stack(
                children: [
                  // Simulated plant image background
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.local_florist,
                          size: 120,
                          color: Colors.green.shade300.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Point camera at plant',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Scan frame overlay
                  Center(
                    child: Container(
                      width: screenSize.width * 0.75,
                      height: screenSize.width * 0.75,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _isProcessing 
                              ? Colors.amber 
                              : Colors.white.withValues(alpha: 0.5),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Stack(
                        children: [
                          // Corner accents
                          ..._buildCornerAccents(),
                          
                          // Processing indicator
                          if (_isProcessing)
                            Center(
                              child: Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: const Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    CircularProgressIndicator(
                                      color: Colors.amber,
                                      strokeWidth: 3,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'Analyzing...',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          
          // Top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  _buildCircleButton(
                    icon: Icons.arrow_back,
                    onTap: () => context.go('/home'),
                  ),
                  
                  // Title
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _isListening ? Colors.red : Colors.green,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _isListening ? 'Listening...' : 'Voice AI',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Flash toggle
                  _buildCircleButton(
                    icon: _isFlashOn ? Icons.flash_on : Icons.flash_off,
                    onTap: () => setState(() => _isFlashOn = !_isFlashOn),
                    isActive: _isFlashOn,
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom panel
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.8),
                    Colors.black,
                  ],
                ),
              ),
              child: SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Transcribed text display
                      if (_transcribedText.isNotEmpty)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.mic,
                                color: Colors.amber.shade300,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _transcribedText,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      
                      // AI Response
                      if (_aiResponse.isNotEmpty)
                        Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          constraints: const BoxConstraints(maxHeight: 200),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: theme.colorScheme.primary.withValues(alpha: 0.3),
                            ),
                          ),
                          child: SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.psychology,
                                      color: theme.colorScheme.primary,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'AI Diagnosis',
                                      style: TextStyle(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  _aiResponse,
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    fontSize: 13,
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      
                      // Control buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          // Gallery button
                          _buildControlButton(
                            icon: Icons.photo_library_outlined,
                            label: 'Gallery',
                            onTap: () {},
                          ),
                          
                          // Main mic button
                          GestureDetector(
                            onTap: _toggleListening,
                            child: AnimatedBuilder(
                              animation: _pulseAnimation,
                              builder: (context, child) {
                                return Transform.scale(
                                  scale: _isListening ? _pulseAnimation.value : 1.0,
                                  child: Container(
                                    width: 80,
                                    height: 80,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: _isListening
                                          ? LinearGradient(
                                              colors: [
                                                Colors.red.shade400,
                                                Colors.red.shade600,
                                              ],
                                            )
                                          : LinearGradient(
                                              colors: [
                                                theme.colorScheme.primary,
                                                theme.colorScheme.primary.withValues(alpha: 0.8),
                                              ],
                                            ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: (_isListening ? Colors.red : theme.colorScheme.primary)
                                              .withValues(alpha: 0.4),
                                          blurRadius: _isListening ? 20 : 10,
                                          spreadRadius: _isListening ? 5 : 2,
                                        ),
                                      ],
                                    ),
                                    child: Icon(
                                      _isListening ? Icons.stop : Icons.mic,
                                      color: Colors.white,
                                      size: 36,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          
                          // Capture button
                          _buildControlButton(
                            icon: Icons.camera_alt_outlined,
                            label: 'Capture',
                            onTap: _captureAndAnalyze,
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Quick actions
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildQuickAction('🌿 Identify Plant'),
                            _buildQuickAction('🐛 Check for Pests'),
                            _buildQuickAction('💧 Water Needs'),
                            _buildQuickAction('🌡️ Disease Scan'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildCornerAccents() {
    return [
      // Top left
      Positioned(
        top: -2,
        left: -2,
        child: _buildCorner(isTopLeft: true),
      ),
      // Top right
      Positioned(
        top: -2,
        right: -2,
        child: _buildCorner(isTopRight: true),
      ),
      // Bottom left
      Positioned(
        bottom: -2,
        left: -2,
        child: _buildCorner(isBottomLeft: true),
      ),
      // Bottom right
      Positioned(
        bottom: -2,
        right: -2,
        child: _buildCorner(isBottomRight: true),
      ),
    ];
  }

  Widget _buildCorner({
    bool isTopLeft = false,
    bool isTopRight = false,
    bool isBottomLeft = false,
    bool isBottomRight = false,
  }) {
    final color = _isProcessing ? Colors.amber : Colors.white;
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        border: Border(
          top: (isTopLeft || isTopRight)
              ? BorderSide(color: color, width: 4)
              : BorderSide.none,
          bottom: (isBottomLeft || isBottomRight)
              ? BorderSide(color: color, width: 4)
              : BorderSide.none,
          left: (isTopLeft || isBottomLeft)
              ? BorderSide(color: color, width: 4)
              : BorderSide.none,
          right: (isTopRight || isBottomRight)
              ? BorderSide(color: color, width: 4)
              : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: isTopLeft ? const Radius.circular(20) : Radius.zero,
          topRight: isTopRight ? const Radius.circular(20) : Radius.zero,
          bottomLeft: isBottomLeft ? const Radius.circular(20) : Radius.zero,
          bottomRight: isBottomRight ? const Radius.circular(20) : Radius.zero,
        ),
      ),
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isActive ? Colors.amber : Colors.black45,
        ),
        child: Icon(
          icon,
          color: isActive ? Colors.black : Colors.white,
          size: 22,
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.15),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: Icon(icon, color: Colors.white, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.8),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(String label) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _transcribedText = label.substring(2).trim(); // Remove emoji
          });
          _processQuery();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
            ),
          ),
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
