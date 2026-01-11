import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  void _showPolicyDialog() {
    bool agreedToTerms = false;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Terms and Conditions'),
            content: SizedBox(
              width: 450,
              height: 300,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Privacy Policy',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Your privacy is important to us. This policy outlines how we collect, use, and protect your data. By using AgriSight, you consent to the collection of data related to your farm operations, including but not limited to crop health metrics, weather data, and usage patterns.',
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Terms of Service',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'By accessing or using AgriSight, you agree to be bound by these Terms of Service. The service is provided "as is" without warranties of any kind. We reserve the right to modify or discontinue the service at any time.',
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Data Usage',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'We may use anonymized data to improve our AI models and provide better recommendations. Your personal information will never be sold to third parties.',
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  ShadCheckbox(
                    value: agreedToTerms,
                    onChanged: (value) {
                      setDialogState(() {
                        agreedToTerms = value ?? false;
                      });
                    },
                  ),
                  const SizedBox(width: 8),
                  const Text('I agree to the Terms and Conditions'),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  ShadButton.outline(
                    onPressed: () => Navigator.of(dialogContext).pop(),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  ShadButton(
                    enabled: agreedToTerms,
                    onPressed: agreedToTerms
                        ? () {
                            Navigator.of(dialogContext).pop();
                                context.go('/transition');
                          }
                        : null,
                    child: const Text('OK'),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: ShadCard(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Welcome Back', style: theme.textTheme.h2),
                const SizedBox(height: 8),
                Text('Enter your credentials to access your farm data.', style: theme.textTheme.muted),
                const SizedBox(height: 24),
                ShadInput(
                  placeholder: const Text('name@example.com'),
                ),
                const SizedBox(height: 16),
                ShadInput(
                  placeholder: const Text('Password'),
                  obscureText: true,
                ),
                const SizedBox(height: 24),
                ShadButton(
                  onPressed: _showPolicyDialog,
                  child: const Text('Sign In'),
                ),
                const SizedBox(height: 16),
                ShadButton.outline(
                  onPressed: () => context.push('/signup'),
                  child: const Text('Create Account'),
                ),
                const SizedBox(height: 16),
                ShadButton.ghost(
                  onPressed: () => context.push('/privacy'),
                  child: const Text('Privacy Policy & Terms'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
