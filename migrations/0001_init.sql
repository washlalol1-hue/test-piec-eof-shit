-- VidLog initial schema (Cloudflare D1 / SQLite)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS videos (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  url              TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  -- tags stored as a JSON array of strings, e.g. '["tutorial","web"]'
  tags             TEXT NOT NULL DEFAULT '[]',
  added_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_videos_added_at ON videos(added_at);

CREATE TABLE IF NOT EXISTS watch_log (
  user_id          TEXT NOT NULL,
  video_id         TEXT NOT NULL,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  watched          INTEGER NOT NULL DEFAULT 0,    -- 0 or 1
  note             TEXT NOT NULL DEFAULT '',
  watched_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, video_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_watch_user_time ON watch_log(user_id, watched_at);
CREATE INDEX IF NOT EXISTS idx_watch_time ON watch_log(watched_at);

CREATE TABLE IF NOT EXISTS announcements (
  id           TEXT PRIMARY KEY,
  tag          TEXT NOT NULL DEFAULT 'Notice',
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_pub ON announcements(published_at);

CREATE TABLE IF NOT EXISTS feedback (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- ---------- Seed data ----------
-- A few example videos using public-domain Big Buck Bunny clips so the
-- library has something to render right after `wrangler d1 migrations apply`.
INSERT OR IGNORE INTO videos (id, title, description, url, duration_seconds, tags, added_at) VALUES
  ('seed-bbb-1',
   'Big Buck Bunny - Sample',
   'A short public-domain animation used to verify video playback.',
   'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
   10,
   '["sample","animation","public-domain"]',
   datetime('now', '-3 days')),
  ('seed-elephant',
   'Elephants Dream - Trailer',
   'Short Blender open-movie clip.',
   'https://test-videos.co.uk/vids/elephantsdream/mp4/h264/360/Elephants_Dream_360_10s_1MB.mp4',
   10,
   '["sample","animation","public-domain"]',
   datetime('now', '-2 days')),
  ('seed-jellyfish',
   'Jellyfish - Demo Clip',
   'A short test clip for verifying smooth playback.',
   'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
   10,
   '["sample","nature"]',
   datetime('now', '-1 days'));

INSERT OR IGNORE INTO announcements (id, tag, title, body, published_at) VALUES
  ('seed-ann-welcome',
   'Release',
   'Welcome to VidLog',
   'Your personal video library is ready. Browse the seed videos in the Library tab to test playback and watch tracking.',
   datetime('now', '-1 days')),
  ('seed-ann-tip',
   'Tip',
   'Resume from anywhere',
   'VidLog saves your progress every few seconds. Open a video on a different device and pick up where you left off.',
   datetime('now'));
