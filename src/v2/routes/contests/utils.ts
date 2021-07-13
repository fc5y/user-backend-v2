import { GetContestsData } from '../../utils/database-gateway/contests';

export function formatMaterials(materialsRaw: string) {
  const materials = JSON.parse(materialsRaw) as Record<string, string>;
  const result = [];
  for (const key in materials) {
    result.push({ name: key, value: materials[key] });
  }
  return result;
}

export function materialsToDatabaseFormat(materials: Array<{ name: string; value: string }> = []): string {
  const result: Record<string, string> = {};
  for (const { name, value } of materials) {
    result[name] = value;
  }
  return JSON.stringify(result);
}

export function formatDateTime(dateTimeRaw: string | number) {
  if (typeof dateTimeRaw === 'number') return dateTimeRaw;
  return Math.floor(new Date(dateTimeRaw).getTime() / 1000);
}

export function formatContest(
  contest: GetContestsData['items'][number],
  { total_participations }: { total_participations: number },
) {
  return {
    name: contest.contest_name,
    title: contest.contest_title,
    start_time: contest.start_time,
    duration: contest.duration,
    total_participations,
    can_enter: contest.can_enter,
    materials: formatMaterials(contest.materials),
  };
}
