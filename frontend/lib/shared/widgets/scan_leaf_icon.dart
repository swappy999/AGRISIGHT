import 'package:flutter/material.dart';

/// A custom icon widget that displays a leaf inside a scanner frame
class ScanLeafIcon extends StatelessWidget {
  final double size;
  final Color? color;
  final bool outlined;

  const ScanLeafIcon({
    super.key,
    this.size = 24,
    this.color,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    final iconColor = color ?? IconTheme.of(context).color ?? Colors.black;
    
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _ScanLeafPainter(
          color: iconColor,
          outlined: outlined,
        ),
      ),
    );
  }
}

class _ScanLeafPainter extends CustomPainter {
  final Color color;
  final bool outlined;

  _ScanLeafPainter({
    required this.color,
    required this.outlined,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = size.width * 0.08
      ..strokeCap = StrokeCap.round
      ..style = outlined ? PaintingStyle.stroke : PaintingStyle.stroke;

    final double padding = size.width * 0.08;
    final double cornerLength = size.width * 0.28;

    // Top-left corner
    canvas.drawLine(
      Offset(padding, padding),
      Offset(padding + cornerLength, padding),
      paint,
    );
    canvas.drawLine(
      Offset(padding, padding),
      Offset(padding, padding + cornerLength),
      paint,
    );

    // Top-right corner
    canvas.drawLine(
      Offset(size.width - padding, padding),
      Offset(size.width - padding - cornerLength, padding),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - padding, padding),
      Offset(size.width - padding, padding + cornerLength),
      paint,
    );

    // Bottom-left corner
    canvas.drawLine(
      Offset(padding, size.height - padding),
      Offset(padding + cornerLength, size.height - padding),
      paint,
    );
    canvas.drawLine(
      Offset(padding, size.height - padding),
      Offset(padding, size.height - padding - cornerLength),
      paint,
    );

    // Bottom-right corner
    canvas.drawLine(
      Offset(size.width - padding, size.height - padding),
      Offset(size.width - padding - cornerLength, size.height - padding),
      paint,
    );
    canvas.drawLine(
      Offset(size.width - padding, size.height - padding),
      Offset(size.width - padding, size.height - padding - cornerLength),
      paint,
    );

    // Draw leaf in the center
    _drawLeaf(canvas, size, paint);
  }

  void _drawLeaf(Canvas canvas, Size size, Paint paint) {
    final leafPaint = Paint()
      ..color = color
      ..style = outlined ? PaintingStyle.stroke : PaintingStyle.fill
      ..strokeWidth = size.width * 0.06;

    final center = Offset(size.width / 2, size.height / 2);
    final leafWidth = size.width * 0.35;
    final leafHeight = size.height * 0.45;

    // Create leaf path
    final path = Path();
    
    // Leaf shape - pointed at top and bottom, curved on sides
    path.moveTo(center.dx, center.dy - leafHeight / 2); // Top point
    
    // Right curve
    path.quadraticBezierTo(
      center.dx + leafWidth,
      center.dy - leafHeight * 0.1,
      center.dx,
      center.dy + leafHeight / 2,
    );
    
    // Left curve (back to top)
    path.quadraticBezierTo(
      center.dx - leafWidth,
      center.dy - leafHeight * 0.1,
      center.dx,
      center.dy - leafHeight / 2,
    );

    canvas.drawPath(path, leafPaint);

    // Draw stem/vein line
    final veinPaint = Paint()
      ..color = outlined ? color : (color == Colors.white ? Colors.grey.shade600 : Colors.white.withValues(alpha: 0.6))
      ..strokeWidth = size.width * 0.04
      ..style = PaintingStyle.stroke;

    canvas.drawLine(
      Offset(center.dx, center.dy - leafHeight * 0.3),
      Offset(center.dx, center.dy + leafHeight * 0.35),
      veinPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ScanLeafPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.outlined != outlined;
  }
}
