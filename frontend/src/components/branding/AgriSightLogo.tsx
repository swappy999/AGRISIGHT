import React from "react";
import Image from "next/image";

export interface AgriSightLogoProps {
  /**
   * "icon" - Just the crosshair target & leaf emblem
   * "horizontal" - Icon mark + "AgriSight" title (and optional subtitle)
   * "full" - Vertical stacked icon with typography
   */
  variant?: "icon" | "horizontal" | "full";
  /**
   * Size presets or custom pixel size for the icon mark
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /**
   * Subtitle text for horizontal variant (e.g. "Precision Farming")
   */
  subtitle?: string;
  /**
   * Optional custom className for the outermost container
   */
  className?: string;
  /**
   * Next.js image priority flag
   */
  priority?: boolean;
  /**
   * Invert colors to monochrome white (e.g. inside dark solid buttons)
   */
  monochrome?: boolean;
}

const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const AgriSightLogo: React.FC<AgriSightLogoProps> = ({
  variant = "horizontal",
  size = "md",
  subtitle,
  className = "",
  priority = false,
  monochrome = false,
}) => {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 40;

  // Icon only
  if (variant === "icon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/logo-mark.png"
          alt="AgriSight"
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          className={`w-full h-full object-contain ${monochrome ? "brightness-0 invert" : ""}`}
        />
      </div>
    );
  }

  // Full stacked
  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div
          className="relative inline-flex items-center justify-center shrink-0 mb-3"
          style={{ width: pixelSize * 1.5, height: pixelSize * 1.5 }}
        >
          <Image
            src="/logo-mark.png"
            alt="AgriSight"
            width={Math.round(pixelSize * 1.5)}
            height={Math.round(pixelSize * 1.5)}
            priority={priority}
            className={`w-full h-full object-contain ${monochrome ? "brightness-0 invert" : ""}`}
          />
        </div>
        <span className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight leading-tight">
          AgriSight
        </span>
        {subtitle && (
          <span className="text-xs font-semibold text-on-surface-variant mt-1">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Horizontal (Default)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-1.5 shadow-2xs overflow-hidden"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Image
          src="/logo-mark.png"
          alt="AgriSight"
          width={pixelSize}
          height={pixelSize}
          priority={priority}
          className={`w-full h-full object-contain ${monochrome ? "brightness-0 invert" : ""}`}
        />
      </div>
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-black text-on-surface tracking-tight leading-none">
          AgriSight
        </span>
        {subtitle && (
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-primary mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default AgriSightLogo;
