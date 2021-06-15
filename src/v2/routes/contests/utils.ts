export function formatMaterials(materialsRaw: string) {
  const materials = JSON.parse(materialsRaw) as Record<string, string>;
  const result = [];
  for (const key in materials) {
    result.push({ name: key, value: materials[key] });
  }
  return result;
}

export function formatDateTime(dateTimeRaw: string | number) {
  if (typeof dateTimeRaw === 'number') return dateTimeRaw;
  return Math.floor(new Date(dateTimeRaw).getTime() / 1000);
}
