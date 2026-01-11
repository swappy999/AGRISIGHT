import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:agrisight/theme/theme_provider.dart';

class ProfilePanel extends StatefulWidget {
  final VoidCallback onClose;

  const ProfilePanel({
    super.key,
    required this.onClose,
  });

  @override
  State<ProfilePanel> createState() => _ProfilePanelState();
}

class _ProfilePanelState extends State<ProfilePanel> with SingleTickerProviderStateMixin {
  bool _notificationsEnabled = true;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    themeProvider.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    themeProvider.removeListener(_onThemeChanged);
    _animController.dispose();
    super.dispose();
  }

  void _onThemeChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isDarkMode = themeProvider.isDarkMode;
    
    // Colors that animate smoothly
    final backgroundColor = isDarkMode ? const Color(0xFF121212) : const Color(0xFFF5F5F5);
    final cardColor = isDarkMode ? const Color(0xFF1E1E1E) : Colors.white;
    final textColor = isDarkMode ? Colors.white : Colors.black87;
    final subtextColor = isDarkMode ? Colors.white60 : Colors.black54;
    final dividerColor = isDarkMode ? Colors.white12 : Colors.black12;

    return Align(
      alignment: Alignment.centerRight,
      child: Material(
        color: Colors.transparent,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOutQuart,
          width: 380,
          height: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF6B8E6B), // Sage green header stays the same
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(-5, 0),
              ),
            ],
          ),
          child: Column(
            children: [
              // Header with close button
              Padding(
                padding: const EdgeInsets.only(top: 16, right: 16),
                child: Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: widget.onClose,
                  ),
                ),
              ),

              // Profile section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    // Avatar with camera icon
                    Stack(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            color: Colors.grey.shade300,
                          ),
                          child: const ClipOval(
                            child: Icon(Icons.person, size: 60, color: Colors.white),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF6B8E6B), width: 2),
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              size: 16,
                              color: Color(0xFF6B8E6B),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Johnathan Doe',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'AgriSight User',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Scrollable content area with smooth color transition
              Expanded(
                child: TweenAnimationBuilder<Color?>(
                  tween: ColorTween(
                    begin: backgroundColor,
                    end: backgroundColor,
                  ),
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeOutQuart,
                  builder: (context, color, child) {
                    return Container(
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(24),
                          topRight: Radius.circular(24),
                        ),
                      ),
                      child: child,
                    );
                  },
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Account Settings
                        _buildSectionCard(
                          title: 'Account Settings',
                          cardColor: cardColor,
                          textColor: textColor,
                          dividerColor: dividerColor,
                          children: [
                            _buildMenuItem(
                              icon: Icons.email_outlined,
                              title: 'Email & Password',
                              onTap: () {},
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                            _buildDivider(dividerColor),
                            _buildMenuItem(
                              icon: Icons.devices_outlined,
                              title: 'Linked Devices',
                              onTap: () {},
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Farm Details
                        _buildSectionCard(
                          title: 'Farm Details',
                          cardColor: cardColor,
                          textColor: textColor,
                          dividerColor: dividerColor,
                          children: [
                            _buildMenuItem(
                              icon: Icons.person_outline,
                              title: 'Personal Info',
                              onTap: () {},
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                            _buildDivider(dividerColor),
                            _buildMenuItem(
                              icon: Icons.location_on_outlined,
                              title: 'Farm Location (GPS)',
                              onTap: () {},
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                            _buildDivider(dividerColor),
                            _buildMenuItem(
                              icon: Icons.grass_outlined,
                              title: 'Crops Grown',
                              onTap: () {},
                              hasExpand: true,
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Preferences
                        _buildSectionCard(
                          title: 'Preferences',
                          cardColor: cardColor,
                          textColor: textColor,
                          dividerColor: dividerColor,
                          children: [
                            _buildToggleItem(
                              icon: Icons.notifications_outlined,
                              title: 'Notifications',
                              value: _notificationsEnabled,
                              onChanged: (value) {
                                setState(() {
                                  _notificationsEnabled = value;
                                });
                              },
                              textColor: textColor,
                            ),
                            _buildDivider(dividerColor),
                            _buildToggleItem(
                              icon: Icons.dark_mode_outlined,
                              title: 'Dark Mode',
                              value: isDarkMode,
                              onChanged: (value) {
                                themeProvider.setDarkMode(value);
                              },
                              textColor: textColor,
                            ),
                            _buildDivider(dividerColor),
                            _buildMenuItem(
                              icon: Icons.language_outlined,
                              title: 'Language',
                              subtitle: 'English',
                              onTap: () {},
                              textColor: textColor,
                              subtextColor: subtextColor,
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Help & Support
                        _buildSectionCard(
                          title: 'Help & Support',
                          cardColor: cardColor,
                          textColor: textColor,
                          dividerColor: dividerColor,
                          children: [
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFD9725B),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(25),
                                    ),
                                  ),
                                  child: const Text(
                                    'Help & Support',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Logout
                        Center(
                          child: TextButton.icon(
                            onPressed: () {},
                            icon: const Icon(Icons.logout, color: Colors.red),
                            label: const Text(
                              'Logout',
                              style: TextStyle(color: Colors.red, fontSize: 16),
                            ),
                          ),
                        ),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
    required Color cardColor,
    required Color textColor,
    required Color dividerColor,
  }) {
    return TweenAnimationBuilder<Color?>(
      tween: ColorTween(begin: cardColor, end: cardColor),
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutQuart,
      builder: (context, color, child) {
        return Container(
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: child,
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 500),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: textColor,
              ),
              child: Text(title),
            ),
          ),
          ...children,
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
    bool hasExpand = false,
    required Color textColor,
    required Color subtextColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF6B8E6B), size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 500),
                style: TextStyle(fontSize: 15, color: textColor),
                child: Text(title),
              ),
            ),
            if (subtitle != null)
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 500),
                style: TextStyle(fontSize: 14, color: subtextColor),
                child: Text(subtitle),
              ),
            if (hasExpand)
              Icon(Icons.expand_more, color: subtextColor, size: 20),
            if (!hasExpand && subtitle == null)
              Icon(Icons.chevron_right, color: subtextColor, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleItem({
    required IconData icon,
    required String title,
    required bool value,
    required ValueChanged<bool> onChanged,
    required Color textColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF6B8E6B), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 500),
              style: TextStyle(fontSize: 15, color: textColor),
              child: Text(title),
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF6B8E6B),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider(Color color) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      height: 1,
      margin: const EdgeInsets.only(left: 50, right: 16),
      color: color,
    );
  }
}
