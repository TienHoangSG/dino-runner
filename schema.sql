CREATE TABLE IF NOT EXISTS leaderboard (
  name_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS leaderboard_rank ON leaderboard(best_score DESC, updated_at ASC);
