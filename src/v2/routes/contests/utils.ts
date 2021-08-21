import { GetContestsData } from '../../utils/database-gateway/contests';
import { GetParticipationsData } from '../../utils/database-gateway/participations';

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

export function formatParticipation(participation: GetParticipationsData['items'][number]) {
  return {
    is_hidden: participation.is_hidden,
    contest_rank: participation.rank_in_contest,
    rating: participation.rating,
    rating_change: participation.rating_change,
    score: participation.score,
  };
}

export function formatContest(
  contest: GetContestsData['items'][number],
  {
    total_participations,
    my_participation,
  }: { total_participations: number; my_participation?: ReturnType<typeof formatParticipation> },
) {
  return {
    name: contest.contest_name,
    title: contest.contest_title,
    start_time: contest.start_time,
    duration: contest.duration,
    total_participations,
    can_enter: contest.can_enter,
    materials: formatMaterials(contest.materials),
    my_participation,
  };
}

export function zip<T1, T2>(list1: T1[], list2: T2[]): [T1, T2][] {
  const result: [T1, T2][] = [];
  for (let i = 0; i < list1.length && i < list2.length; i++) {
    result.push([list1[i], list2[i]]);
  }
  return result;
}
