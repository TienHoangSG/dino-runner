const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const respond = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

export async function onRequestGet({ env }) {
  if (!env.DB) return respond({ error: 'Bảng xếp hạng chưa được cấu hình.' }, 503);
  try {
    const { results } = await env.DB.prepare('SELECT display_name AS name, best_score AS score FROM leaderboard ORDER BY best_score DESC, updated_at ASC LIMIT 10').all();
    return respond({ entries: results });
  } catch {
    return respond({ error: 'Không thể tải bảng xếp hạng.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return respond({ error: 'Bảng xếp hạng chưa được cấu hình.' }, 503);
  let body;
  try { body = await request.json(); } catch { return respond({ error: 'Dữ liệu không hợp lệ.' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return respond({ error: 'Dữ liệu không hợp lệ.' }, 400);
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const score = body.score;
  if (!name || name.length > 24 || /[<>]/u.test(name) || Array.from(name).some(char => char.charCodeAt(0) < 32) || !Number.isSafeInteger(score) || score < 0 || score > 1000000) {
    return respond({ error: 'Tên hoặc điểm không hợp lệ.' }, 400);
  }
  const nameKey = name.toLocaleLowerCase('vi');
  try {
    await env.DB.prepare(`INSERT INTO leaderboard (name_key, display_name, best_score)
      VALUES (?, ?, ?)
      ON CONFLICT(name_key) DO UPDATE SET
        best_score = MAX(leaderboard.best_score, excluded.best_score),
        updated_at = CASE WHEN excluded.best_score > leaderboard.best_score THEN CURRENT_TIMESTAMP ELSE leaderboard.updated_at END`).bind(nameKey, name, score).run();
    const row = await env.DB.prepare('SELECT display_name AS name, best_score AS score FROM leaderboard WHERE name_key = ?').bind(nameKey).first();
    return respond(row);
  } catch {
    return respond({ error: 'Không thể lưu điểm.' }, 500);
  }
}
