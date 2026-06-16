const viCollator = new Intl.Collator('vi', { sensitivity: 'base' });

export function compareVi(a: string, b: string): number {
  return viCollator.compare(a.trim(), b.trim());
}

export function sortVi(values: readonly string[]): string[] {
  return [...values].sort(compareVi);
}

export function sortViBy<T>(items: readonly T[], getLabel: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareVi(getLabel(a), getLabel(b)));
}
