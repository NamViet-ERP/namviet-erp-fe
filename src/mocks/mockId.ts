/** Generate a pseudo-unique id for newly created mock records. */
export function mockId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
