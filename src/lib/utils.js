import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges CSS class names intelligently
 * Handles Tailwind CSS conflicts and conditional classes
 * @param {...(string|object|array)} inputs - Class names to combine
 * @returns {string} Merged class string
 */
export function combineClassNames(...inputs) {
  return twMerge(clsx(inputs));
}

// Legacy alias for backward compatibility
export const cn = combineClassNames;
