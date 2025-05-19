/**
 * Color Reference Guide for MyEvent Platform
 *
 * This file contains all the color codes used in the dashboard header and sidebar
 * for easy reference and consistency across the application.
 */

export const colorCodes = {
  // Primary Colors
  primary: {
    main: "#3B82F6", // blue-500 - Primary blue
    light: "#60A5FA", // blue-400 - Lighter blue
    dark: "#2563EB", // blue-600 - Darker blue
    hover: "#1D4ED8", // blue-700 - Hover state
    focus: "#3B82F6", // blue-500 - Focus state
    gradient: {
      from: "#3B82F6", // blue-600 - Gradient start (from-blue-600)
      to: "#06B6D4", // cyan-500 - Gradient end (to-cyan-500)
    },
  },

  // Secondary Colors
  secondary: {
    main: "#06B6D4", // cyan-500 - Secondary cyan
    light: "#22D3EE", // cyan-400 - Lighter cyan
    dark: "#0891B2", // cyan-600 - Darker cyan
    hover: "#0E7490", // cyan-700 - Hover state
    focus: "#06B6D4", // cyan-500 - Focus state
  },

  // Background Colors
  background: {
    main: "#FFFFFF", // white - Main background
    muted: "#F8FAFC", // slate-50 - Muted background
    hover: "#F1F5F9", // slate-100 - Hover background
    active: "#E2E8F0", // slate-200 - Active background
    header: "rgba(255, 255, 255, 0.95)", // bg-background/95 - Header background with opacity
    headerBlur: "rgba(255, 255, 255, 0.6)", // bg-background/60 - Header background with blur
  },

  // Text Colors
  text: {
    primary: "#0F172A", // slate-900 - Primary text
    secondary: "#64748B", // slate-500 - Secondary text
    muted: "#94A3B8", // slate-400 - Muted text
    white: "#FFFFFF", // white - White text
    link: "#3B82F6", // blue-500 - Link text
  },

  // Border Colors
  border: {
    main: "#E2E8F0", // slate-200 - Main border
    input: "#CBD5E1", // slate-300 - Input border
    focus: "#3B82F6", // blue-500 - Focus border
  },

  // Status Colors
  status: {
    success: "#10B981", // emerald-500 - Success
    error: "#EF4444", // red-500 - Error
    warning: "#F59E0B", // amber-500 - Warning
    info: "#3B82F6", // blue-500 - Info
  },

  // Sidebar Specific
  sidebar: {
    iconBackground: "rgba(59, 130, 246, 0.1)", // from-blue-500/10 to-cyan-500/10 - Icon background
    iconText: "#3B82F6", // blue-600 - Icon text
    activeItem: "rgba(59, 130, 246, 0.1)", // from-blue-500/10 to-cyan-500/10 - Active item background
    activeText: "#1D4ED8", // blue-700 - Active item text
    hoverBackground: "#F1F5F9", // slate-100 - Hover background
    headerGradient: {
      from: "#3B82F6", // blue-600 - Header gradient start
      to: "#06B6D4", // cyan-500 - Header gradient end
    },
  },

  // Header Specific
  header: {
    logoGradient: {
      from: "#3B82F6", // blue-600 - Logo gradient start
      to: "#06B6D4", // cyan-500 - Logo gradient end
    },
    userAvatarGradient: {
      from: "#3B82F6", // blue-500 - User avatar gradient start
      to: "#06B6D4", // cyan-400 - User avatar gradient end
    },
  },
}

/**
 * Usage Examples:
 *
 * Header Background:
 * - bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
 *
 * Logo Text:
 * - bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent
 *
 * Sidebar Icon Background:
 * - bg-gradient-to-r from-blue-500/10 to-cyan-500/10
 *
 * Active Navigation Item:
 * - bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 font-medium
 *
 * User Avatar:
 * - bg-gradient-to-br from-blue-500 to-cyan-400
 */
