export type Ranking = { name: string; score: number };

export async function loadLeaderboard(): Promise<Ranking[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/leaderboard`);
  if (!response.ok) throw new Error('Không tải được bảng xếp hạng.');
  const data = await response.json() as { entries: Ranking[] };
  return data.entries;
}

export async function saveBestScore(name: string, score: number): Promise<void> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/leaderboard`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, score })
  });
  if (!response.ok) throw new Error('Không lưu được điểm.');
}
