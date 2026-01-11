import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class SignupScreen extends StatelessWidget {
  const SignupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: ShadCard(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Create Your Account', style: theme.textTheme.h3),
                const SizedBox(height: 24),
                const ShadInput(
                  placeholder: Text('Full Name'),
                ),
                const SizedBox(height: 16),
                const ShadInput(
                  placeholder: Text('Email'),
                ),
                const SizedBox(height: 16),
                const ShadInput(
                  placeholder: Text('Password'),
                  obscureText: true,
                ),
                const SizedBox(height: 24),
                ShadButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Sign Up'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
