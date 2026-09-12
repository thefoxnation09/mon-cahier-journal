export function groupByDomaine<T extends { domaine: string }>(items: T[]): { domaine: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.domaine.trim() || 'Sans domaine';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([domaine, domaineItems]) => ({ domaine, items: domaineItems }));
}
