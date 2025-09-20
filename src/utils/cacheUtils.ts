/**
 * Cache clearing utilities for complete user data cleanup
 */

/**
 * Clear all browser storage completely
 * Use this when user deletes their account to ensure complete data cleanup
 */
export const clearAllCache = (): void => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    // Silent fail - continue with account deletion flow
  }
};