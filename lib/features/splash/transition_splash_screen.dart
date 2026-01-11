import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:flutter_animate/flutter_animate.dart';

class TransitionSplashScreen extends StatefulWidget {
  const TransitionSplashScreen({super.key});

  @override
  State<TransitionSplashScreen> createState() => _TransitionSplashScreenState();
}

class _TransitionSplashScreenState extends State<TransitionSplashScreen> {
  bool _fadeOut = false;

  @override
  void initState() {
    super.initState();
    // Start fade out after 2 seconds
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) {
        setState(() {
          _fadeOut = true;
        });
      }
    });
    
    // Navigate to home after fade out completes
    Future.delayed(const Duration(milliseconds: 2800), () {
      if (mounted) {
        context.go('/home');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      body: AnimatedOpacity(
        opacity: _fadeOut ? 0.0 : 1.0,
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeOut,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo with animation
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.green.shade400,
                      Colors.green.shade700,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.4),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Icon(Icons.eco, size: 60, color: Colors.white),
              )
                  .animate()
                  .fade(duration: 400.ms)
                  .scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1), curve: Curves.elasticOut, duration: 600.ms)
                  .then()
                  .shimmer(duration: 800.ms, color: Colors.white.withOpacity(0.3)),
              
              const SizedBox(height: 32),
              
              // Welcome message
              Text(
                'Welcome!',
                style: theme.textTheme.h1.copyWith(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              )
                  .animate()
                  .fade(delay: 300.ms, duration: 500.ms)
                  .slideY(begin: 0.3, end: 0, delay: 300.ms, duration: 500.ms, curve: Curves.easeOut),
              
              const SizedBox(height: 12),
              
              // Tagline
              Text(
                'Loading home screen...',
                style: theme.textTheme.muted.copyWith(
                  fontSize: 16,
                  letterSpacing: 1,
                ),
              )
                  .animate()
                  .fade(delay: 600.ms, duration: 500.ms)
                  .slideY(begin: 0.3, end: 0, delay: 600.ms, duration: 500.ms, curve: Curves.easeOut),
            ],
          ),
        ),
      ),
    );
  }
}
