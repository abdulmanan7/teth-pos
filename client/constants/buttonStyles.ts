/**
 * Button style constants for consistent styling across the app
 */

export const buttonStyles = {
  // Primary button - main actions
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 font-semibold transition-colors",

  // Secondary button - alternative actions
  secondary:
    "bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 font-medium transition-colors",

  // Danger button - destructive actions
  danger:
    "bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors",

  // Success button - positive actions
  success:
    "bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition-colors",

  // Small button - compact actions
  small:
    "bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-sm font-medium transition-colors",

  // Disabled state modifier
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",

  // Icon button - for icon-only buttons
  icon: "p-2 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors",

  // Full width button
  fullWidth: "w-full",

  // Outline button - secondary style
  outline:
    "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 font-medium transition-colors",
};

/**
 * Combine button styles
 */
export const combineButtonStyles = (...styles: string[]): string => {
  return styles.join(" ");
};
