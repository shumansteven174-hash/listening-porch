// Database setup for The Listening Porch (Node's built-in node:sqlite).
// File-based SQLite, same format as any other SQLite database.

const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "data", "porch.db");

function openDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

const CIRCLES = [
  { slug: "anxiety", name: "Anxiety", desc: "Worries, panic, racing thoughts — a place to set them down." },
  { slug: "grief-loss", name: "Grief & Loss", desc: "For those missing someone, or something, that mattered." },
  { slug: "loneliness", name: "Loneliness", desc: "For the nights that feel empty, and the days that feel far away." },
  { slug: "stress-work", name: "Stress & Work", desc: "Pressure, burnout, long shifts, and heavy weeks." },
  { slug: "family", name: "Family", desc: "Parents, partners, kids, and the ties that bind — and strain." },
  { slug: "faith-hope", name: "Faith & Hope", desc: "Spiritual questions, doubt, and the search for light." },
  { slug: "recovery", name: "Recovery", desc: "One day at a time — sobriety, healing, and starting over." },
  { slug: "small-wins", name: "Small Wins", desc: "Got out of bed? Made the call? That's a win. Share it here." },
];

function initDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      available_chat INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      hidden INTEGER DEFAULT 0,
      crisis_flag INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES threads(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      hidden INTEGER DEFAULT 0,
      crisis_flag INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS heard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, target_type, target_id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      recipient_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT,
      hidden INTEGER DEFAULT 0,
      crisis_flag INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      resolved INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blocker_id INTEGER NOT NULL REFERENCES users(id),
      blocked_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(blocker_id, blocked_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    );
  `);
}

const SEED_THREADS = [
  { circle: "anxiety", title: "Welcome to the Anxiety circle — pull up a chair", body: "Hi, I'm with the Porch Team. This circle is for the worries that keep you up at night, the racing thoughts, the tight chest. You don't have to explain it perfectly. Just say what it's like today, and someone here will listen. You're not alone in this." },
  { circle: "grief-loss", title: "Welcome to the Grief & Loss circle", body: "If you're missing someone, this is a place where that missing is understood. Grief has no deadline here. Share a memory, say their name, or just sit quietly with us for a while. We're here." },
  { circle: "loneliness", title: "Welcome to the Loneliness circle", body: "Loneliness is one of the heaviest things a person can carry — and one of the hardest to say out loud. You said it by coming here. That counts. Tell us how the days have been feeling, and let's keep each other company." },
  { circle: "stress-work", title: "Welcome to the Stress & Work circle", body: "Long shifts, heavy weeks, pressure that never seems to let up — if work is weighing on you, set it down here for a bit. Truckers, nurses, parents working two jobs, all of you: this porch is open." },
  { circle: "family", title: "Welcome to the Family circle", body: "Family can be the greatest comfort and the deepest ache, sometimes in the same day. This circle is for the hard conversations, the worry about loved ones, and the hope that things can get better." },
  { circle: "faith-hope", title: "Welcome to the Faith & Hope circle", body: "Questions of faith, doubt, hope, and meaning are welcome here — whatever you believe, or aren't sure you believe. Share a verse, a prayer, a doubt, or a quiet hope. All are welcome at this porch." },
  { circle: "recovery", title: "Welcome to the Recovery circle", body: "One day at a time. Whether you're on day one or year ten, this circle is for the work of healing and starting over. Share a milestone, a struggle, or just check in. We believe in second chances here." },
  { circle: "small-wins", title: "Welcome to the Small Wins circle", body: "Got out of bed today? Made a hard phone call? Drank water, took a walk, said no to something that hurts you? That is a win, and it belongs here. Small wins are how big changes start." },
];

const SEED_REPLIES = [
  { circle: "anxiety", body: "Thank you for making this place. I've been carrying a knot in my chest for weeks and I didn't know where to put it down. Reading these words helped already." },
  { circle: "recovery", body: "Day 14 for me today. I almost didn't make it through last weekend, but I called a friend instead of the old habit. Checking in here keeps me honest. One day at a time." },
  { circle: "small-wins", body: "My small win today: I got up, showered, and ate breakfast before noon. It sounds like nothing, but last week I couldn't do any of it. Progress is progress." },
];

function seed(db) {
  const existing = db.prepare("SELECT COUNT(*) AS n FROM users WHERE handle = 'Porch Team'").get();
  if (existing.n > 0) return;
  const hash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
  const r = db.prepare("INSERT INTO users (handle, password_hash, bio, available_chat) VALUES (?, ?, ?, 0)").run(
    "Porch Team",
    hash,
    "The folks who keep the porch light on. We welcome new members and keep the circles kind."
  );
  const porchId = r.lastInsertRowid;
  const insertThread = db.prepare(
    "INSERT INTO threads (circle, title, body, user_id) VALUES (?, ?, ?, ?)"
  );
  const threadIds = {};
  for (const t of SEED_THREADS) {
    const tr = insertThread.run(t.circle, t.title, t.body, porchId);
    threadIds[t.circle] = tr.lastInsertRowid;
  }
  const insertReply = db.prepare("INSERT INTO replies (thread_id, user_id, body) VALUES (?, ?, ?)");
  for (const rep of SEED_REPLIES) {
    insertReply.run(threadIds[rep.circle], porchId, rep.body);
  }
}

module.exports = { openDb, initDb, seed, CIRCLES, DB_PATH };
