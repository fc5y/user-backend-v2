import { getContestNameAndTitleById } from '../../utils/cached-requests/index';

export async function getContestNameById(contest_id: number) {
  const data = await getContestNameAndTitleById(contest_id);
  return data.contest_name;
}

export async function getContestTitleById(contest_id: number) {
  const data = await getContestNameAndTitleById(contest_id);
  return data.contest_title;
}
