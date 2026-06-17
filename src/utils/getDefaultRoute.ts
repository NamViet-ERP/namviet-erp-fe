/**
 * Helper utility to get the default route based on user role.
 * Currently, all roles are directed to the main dashboard.
 */
export function getDefaultRoute(_role?: string): string {
  return '/dashboard';
}
