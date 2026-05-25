export function countDistinctColors(colors: string[]): number {
  return new Set(colors.filter(Boolean)).size;
}
