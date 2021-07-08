import db from '../../utils/database-gateway';

export async function getContestNameAndTitleById(contest_id: number) {
  const { error, data } = await db.contests.getContests({
    offset: 0,
    limit: 1,
    id: contest_id,
  });
  const result =
    !error && data != null && data.items.length
      ? { contest_name: data.items[0].contest_name, contest_title: data.items[0].contest_title }
      : { contest_name: '', contest_title: '' };
  return result;
}
export async function getUsernameById(user_id: number) {
  const { error, data } = await db.users.getUsers({
    offset: 0,
    limit: 1,
    id: user_id,
  });
  const result = !error && data != null && data.items.length ? data.items[0].username : '';
  return result;
}
