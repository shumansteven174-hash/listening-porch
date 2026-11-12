// The Listening Porch — peer support community.
// Node.js + Express + SQLite (node:sqlite). Server-rendered, no build step.

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const { openDb, initDb, seed, CIRCLES } = require("./db");
const { dailyLight, dailyByCategory } = require("./lib/daily");
const { containsCrisisLanguage } = require("./lib/crisis");

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const ADMIN_HANDLES = (process.env.ADMIN_HANDLES || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && !SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET must be set in production.");
  process.exit(1);
}

const db = openDb();
initDb(db);
seed(db);

// ---- SQLite-backed session store (survives restarts, unlike MemoryStore) ----
class SqliteStore extends session.Store {
  get(sid, cb) {
    try {
      const row = db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expire > ?").get(sid, Date.now());
      cb(null, row ? JSON.parse(row.sess) : null);
    } catch (e) { cb(e); }
  }
  set(sid, sess, cb) {
    try {
      const expire = Date.now() + (sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : 86400000);
      db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?) ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expire = excluded.expire")
        .run(sid, JSON.stringify(sess), expire);
      cb(null);
    } catch (e) { cb(e); }
  }
  destroy(sid, cb) {
    try { db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid); cb(null); } catch (e) { cb(e); }
  }
  touch(sid, sess, cb) {
    try {
      const expire = Date.now() + (sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : 86400000);
      db.prepare("UPDATE sessions SET expire = ? WHERE sid = ?").run(expire, sid);
      cb(null);
    } catch (e) { cb(e); }
  }
}

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  store: new SqliteStore(),
  secret: SESSION_SECRET || "dev-only-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ---- helpers ----
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function timeAgo(iso) {
  const t = new Date(iso + "Z").getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " hr ago";
  const d = Math.floor(h / 24);
  return d + (d === 1 ? " day ago" : " days ago");
}

const DISCLAIMER = "Peer support, not professional counseling. Not a substitute for a therapist or crisis services. If you are in crisis, call or text 988.";

function crisisStrip() {
  return `<div class="crisis-strip" role="alert">
    <strong>Need help right now?</strong>
    Call or text <a href="tel:988"><strong>988</strong></a> (Suicide &amp; Crisis Lifeline) &nbsp;·&nbsp;
    Text <strong>HOME</strong> to <a href="sms:741741"><strong>741741</strong></a> (Crisis Text Line) &nbsp;·&nbsp;
    Call <a href="tel:911"><strong>911</strong></a> in an emergency.
  </div>`;
}

function crisisBanner() {
  return `<div class="crisis-banner" role="alert">
    <h2>💛 You matter, and help is right here.</h2>
    <p>It sounds like you may be going through something very hard right now. Please reach out — you do not have to face this alone.</p>
    <p class="crisis-actions">
      <a class="btn btn-crisis" href="tel:988">Call or text 988</a>
      <a class="btn btn-crisis" href="sms:741741?&body=HOME">Text HOME to 741741</a>
      <a class="btn" href="/help">More ways to get help</a>
    </p>
    <p class="small">If you feel you may act on these thoughts, call 911 or go to your nearest emergency room now.</p>
  </div>`;
}

function layout(req, title, body, opts = {}) {
  const user = req.session.user || null;
  const flash = req.session.flash;
  delete req.session.flash;
  const nav = user
    ? `<a href="/circles">Circles</a><a href="/messages">Messages</a><a href="/listeners">Listeners</a><a href="/breathing">Breathe</a><a href="/profile">${esc(user.handle)}</a><form class="inline" method="post" action="/logout"><button class="linklike" type="submit">Log out</button></form>`
    : `<a href="/circles">Circles</a><a href="/listeners">Listeners</a><a href="/breathing">Breathe</a><a href="/login">Log in</a><a class="btn btn-small" href="/signup">Join free</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · The Listening Porch</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
${crisisStrip()}
<header class="site-header">
  <a class="brand" href="/"><span class="lamp">🏮</span> The Listening Porch</a>
  <nav>${nav}</nav>
</header>
<main class="wrap">
  ${flash ? `<div class="flash ${esc(flash.type || "")}">${esc(flash.text)}</div>` : ""}
  ${opts.crisis ? crisisBanner() : ""}
  ${body}
</main>
<footer class="site-footer">
  <p>${DISCLAIMER}</p>
  <p class="small">The Listening Porch is a peer support community. Members are not counselors or medical professionals. Never give or follow medical advice here.</p>
  <p class="small"><a href="/help">Crisis resources</a> · <a href="/">Home</a> · <a href="/breathing">Guided breathing</a></p>
</footer>
<script src="/client.js"></script>
</body>
</html>`;
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.session.flash = { type: "warn", text: "Please log in or join free to do that." };
    return res.redirect("/login");
  }
  next();
}

function isAdmin(user) {
  return !!user && ADMIN_HANDLES.includes(String(user.handle).toLowerCase());
}

// Simple in-memory rate limit for auth endpoints.
const authAttempts = new Map();
function rateLimitAuth(req, res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const rec = authAttempts.get(key) || { count: 0, reset: now + 15 * 60 * 1000 };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + 15 * 60 * 1000; }
  rec.count += 1;
  authAttempts.set(key, rec);
  if (rec.count > 20) return res.status(429).send("Too many attempts. Please wait 15 minutes and try again.");
  next();
}

function getUserByHandle(handle) {
  return db.prepare("SELECT * FROM users WHERE lower(handle) = lower(?)").get(handle);
}

function blockedBetween(a, b) {
  const row = db.prepare(
    "SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1"
  ).get(a, b, b, a);
  return !!row;
}

function canMessage(sender, recipient) {
  if (sender.id === recipient.id) return false;
  if (blockedBetween(sender.id, recipient.id)) return false;
  if (recipient.available_chat) return true;
  const prior = db.prepare(
    "SELECT 1 FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?) LIMIT 1"
  ).get(sender.id, recipient.id, recipient.id, sender.id);
  return !!prior;
}

function heardCount(type, id) {
  return db.prepare("SELECT COUNT(*) AS n FROM heard WHERE target_type = ? AND target_id = ?").get(type, id).n;
}

function heardBy(type, id, userId) {
  if (!userId) return false;
  return !!db.prepare("SELECT 1 FROM heard WHERE target_type = ? AND target_id = ? AND user_id = ?").get(type, id, userId);
}

// ---- public pages ----
app.get("/health", (req, res) => res.status(200).send("ok"));

app.get("/", (req, res) => {
  const user = req.session.user;
  const cat = ["quote", "reading", "poem"].includes(req.query.light) ? req.query.light : null;
  const today = dailyLight();
  const byCat = dailyByCategory();
  const showCat = cat || today.category;
  const entry = byCat[showCat];
  const circles = CIRCLES.map((c) => {
    const n = db.prepare("SELECT COUNT(*) AS n FROM threads WHERE circle = ? AND hidden = 0").get(c.slug).n;
    return { ...c, count: n };
  });
  const listeners = db.prepare(
    "SELECT handle, bio FROM users WHERE available_chat = 1 AND handle != 'Porch Team' ORDER BY created_at DESC LIMIT 6"
  ).all();

  const lightHtml = (category, e) => {
    if (category === "poem") {
      return `<h3>${esc(e.title)}</h3><div class="poem">${e.lines.map((l) => esc(l)).join("<br>")}</div>`;
    }
    if (category === "reading") {
      return `<h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>`;
    }
    return `<blockquote>“${esc(e.text)}”</blockquote><p class="by">— ${esc(e.by)}</p>`;
  };

  const body = `
  <section class="hero">
    <h1>Welcome to the porch.</h1>
    <p class="lede">A free place to talk about life, to ask for help, and to offer a listening ear — no judgment, no cost, no real name needed.</p>
    ${user ? `<p><a class="btn" href="/circles">Visit the circles</a> <a class="btn btn-ghost" href="/messages">Your messages</a></p>`
      : `<p><a class="btn" href="/signup">Join free — pick a handle</a> <a class="btn btn-ghost" href="/circles">Look around first</a></p>`}
  </section>

  <section class="card daily-light">
    <h2>✨ Daily Light <span class="small">— ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span></h2>
    <div class="tabs">
      <a class="${showCat === "quote" ? "active" : ""}" href="/?light=quote">Inspirational quote</a>
      <a class="${showCat === "reading" ? "active" : ""}" href="/?light=reading">Spiritual reading</a>
      <a class="${showCat === "poem" ? "active" : ""}" href="/?light=poem">Poem</a>
    </div>
    ${lightHtml(showCat, entry)}
    <p class="small">A new one appears every day. ${showCat === today.category ? "This is today's." : "Today's is the " + today.category + " — tap the tabs to read all three."}</p>
  </section>

  <section>
    <h2>Conversation circles</h2>
    <div class="grid">
      ${circles.map((c) => `<a class="circle-card" href="/circles/${c.slug}">
        <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
        <span class="small">${c.count} ${c.count === 1 ? "thread" : "threads"}</span>
      </a>`).join("")}
    </div>
  </section>

  <section class="card">
    <h2>🫂 Listeners available now</h2>
    ${listeners.length ? `<ul class="listener-list">${listeners.map((l) => `<li><strong>${esc(l.handle)}</strong>${l.bio ? ` — ${esc(l.bio)}` : ""}</li>`).join("")}</ul>
    <p><a class="btn btn-small" href="/listeners">See all listeners</a></p>`
      : `<p>No members have marked themselves available to chat yet. <a href="/profile">Be the first — turn on “available to chat” in your profile.</a></p>`}
  </section>

  <section class="card calm">
    <h2>🌬️ Need a minute?</h2>
    <p>Try a slow guided breathing exercise. Four seconds in, four hold, four out. <a href="/breathing">Start breathing →</a></p>
  </section>`;
  res.send(layout(req, "Home", body));
});

app.get("/help", (req, res) => {
  const body = `
  <h1>Help, right now</h1>
  <p class="lede">If you are in crisis, please reach out immediately. You deserve support, and it is available right now.</p>
  <div class="grid">
    <div class="card"><h3>988 Suicide &amp; Crisis Lifeline</h3><p>Call or text <a href="tel:988"><strong>988</strong></a> — free, confidential, 24/7 in the US.</p></div>
    <div class="card"><h3>Crisis Text Line</h3><p>Text <strong>HOME</strong> to <a href="sms:741741"><strong>741741</strong></a> — free, confidential, 24/7.</p></div>
    <div class="card"><h3>SAMHSA National Helpline</h3><p>Call <a href="tel:18006624357"><strong>1-800-662-4357</strong></a> — free, confidential, 24/7, for mental health and substance use.</p></div>
    <div class="card"><h3>NAMI Helpline</h3><p>Call <a href="tel:18009506264"><strong>1-800-950-6264</strong></a> — Mon–Fri, 10am–10pm ET.</p></div>
    <div class="card"><h3>Emergency</h3><p>Call <a href="tel:911"><strong>911</strong></a> or go to your nearest emergency room if you feel you may act on harmful thoughts.</p></div>
    <div class="card"><h3>Find help worldwide</h3><p><a href="https://findahelpline.org" target="_blank" rel="noopener">findahelpline.org</a> — crisis lines in many countries.</p></div>
  </div>
  <p>${DISCLAIMER}</p>`;
  res.send(layout(req, "Crisis resources", body));
});

app.get("/breathing", (req, res) => {
  const body = `
  <h1>Guided breathing</h1>
  <p class="lede">Box breathing: breathe in for 4 seconds, hold for 4, breathe out for 4, hold for 4. Repeat for a few minutes. It is one of the simplest ways to calm a racing heart.</p>
  <div class="card breath-wrap">
    <div id="breath-circle" class="breath-circle"><span id="breath-label">Ready?</span></div>
    <p><button class="btn" id="breath-start" type="button">Start breathing</button>
    <button class="btn btn-ghost" id="breath-stop" type="button" disabled>Stop</button></p>
    <p class="small">This exercise runs entirely in your browser. It is not a medical treatment. If you feel unwell, stop and rest.</p>
  </div>`;
  res.send(layout(req, "Guided breathing", body));
});

// ---- circles & threads ----
app.get("/circles", (req, res) => {
  const rows = CIRCLES.map((c) => {
    const n = db.prepare("SELECT COUNT(*) AS n FROM threads WHERE circle = ? AND hidden = 0").get(c.slug).n;
    return { ...c, count: n };
  });
  const body = `<h1>Conversation circles</h1>
  <p class="lede">Pick a circle, read what others have shared, and add your own voice when you're ready.</p>
  <div class="grid">${rows.map((c) => `<a class="circle-card" href="/circles/${c.slug}">
    <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><span class="small">${c.count} ${c.count === 1 ? "thread" : "threads"}</span>
  </a>`).join("")}</div>`;
  res.send(layout(req, "Circles", body));
});

app.get("/circles/:slug", (req, res) => {
  const circle = CIRCLES.find((c) => c.slug === req.params.slug);
  if (!circle) return res.status(404).send(layout(req, "Not found", "<h1>That circle doesn't exist.</h1><p><a href='/circles'>Back to circles</a></p>"));
  const user = req.session.user;
  const threads = db.prepare(
    `SELECT t.*, u.handle FROM threads t JOIN users u ON u.id = t.user_id
     WHERE t.circle = ? AND t.hidden = 0 ORDER BY t.created_at DESC`
  ).all(circle.slug);
  const body = `<h1>${esc(circle.name)}</h1><p class="lede">${esc(circle.desc)}</p>
  ${threads.length ? `<ul class="thread-list">${threads.map((t) => {
    const replies = db.prepare("SELECT COUNT(*) AS n FROM replies WHERE thread_id = ? AND hidden = 0").get(t.id).n;
    return `<li><a href="/thread/${t.id}"><strong>${esc(t.title)}</strong></a>
      <span class="small">by ${esc(t.handle)} · ${timeAgo(t.created_at)} · ${replies} ${replies === 1 ? "reply" : "replies"} · 🤍 ${heardCount("thread", t.id)}</span></li>`;
  }).join("")}</ul>` : `<p>No threads yet in this circle. Be the first to open the conversation.</p>`}
  ${user ? `<section class="card"><h2>Start a thread</h2>
    <form method="post" action="/thread">
      <input type="hidden" name="circle" value="${esc(circle.slug)}">
      <label>Title<br><input name="title" required maxlength="140" placeholder="Give your thread a gentle title"></label>
      <label>What's on your mind?<br><textarea name="body" required rows="5" maxlength="4000" placeholder="Share as much or as little as you like. No real name needed."></textarea></label>
      <button class="btn" type="submit">Post to ${esc(circle.name)}</button>
    </form></section>`
    : `<p><a class="btn" href="/signup">Join free to start a thread</a></p>`}`;
  res.send(layout(req, circle.name, body, { crisis: req.query.crisis === "1" }));
});

app.post("/thread", requireLogin, (req, res) => {
  const circle = CIRCLES.find((c) => c.slug === req.body.circle);
  const title = String(req.body.title || "").trim();
  const bodyText = String(req.body.body || "").trim();
  if (!circle || !title || !bodyText) {
    req.session.flash = { type: "warn", text: "Please give your thread a title and some words." };
    return res.redirect("/circles");
  }
  const crisis = containsCrisisLanguage(title + " " + bodyText) ? 1 : 0;
  const r = db.prepare("INSERT INTO threads (circle, title, body, user_id, crisis_flag) VALUES (?, ?, ?, ?, ?)")
    .run(circle.slug, title.slice(0, 140), bodyText.slice(0, 4000), req.session.user.id, crisis);
  res.redirect(`/thread/${r.lastInsertRowid}${crisis ? "?crisis=1" : ""}`);
});

app.get("/thread/:id", (req, res) => {
  const t = db.prepare(
    "SELECT t.*, u.handle FROM threads t JOIN users u ON u.id = t.user_id WHERE t.id = ? AND t.hidden = 0"
  ).get(req.params.id);
  if (!t) return res.status(404).send(layout(req, "Not found", "<h1>That thread isn't here.</h1><p><a href='/circles'>Back to circles</a></p>"));
  const circle = CIRCLES.find((c) => c.slug === t.circle) || { name: t.circle, slug: t.circle };
  const user = req.session.user;
  const myBlocks = user
    ? db.prepare("SELECT blocked_id FROM blocks WHERE blocker_id = ?").all(user.id).map((r) => r.blocked_id)
    : [];
  const replies = db.prepare(
    `SELECT r.*, u.handle FROM replies r JOIN users u ON u.id = r.user_id
     WHERE r.thread_id = ? AND r.hidden = 0 ORDER BY r.created_at ASC`
  ).all(t.id).filter((r) => !myBlocks.includes(r.user_id));
  const showCrisis = req.query.crisis === "1" || t.crisis_flag || replies.some((r) => r.crisis_flag);
  const body = `
  <p class="small"><a href="/circles/${esc(circle.slug)}">← ${esc(circle.name)}</a></p>
  <article class="card thread">
    <h1>${esc(t.title)}</h1>
    <p class="small">by ${esc(t.handle)} · ${timeAgo(t.created_at)}</p>
    <p class="thread-body">${esc(t.body).replace(/\n/g, "<br>")}</p>
    <p>
      <form class="inline" method="post" action="/heard">
        <input type="hidden" name="type" value="thread"><input type="hidden" name="id" value="${t.id}">
        <button class="btn btn-small ${user && heardBy("thread", t.id, user.id) ? "btn-heard" : ""}" type="submit" ${user ? "" : "disabled"}>🤍 You are heard (${heardCount("thread", t.id)})</button>
      </form>
      ${user && user.id !== t.user_id ? `<form class="inline" method="post" action="/report" onsubmit="return confirm('Report this post to the Porch Team?')">
        <input type="hidden" name="type" value="thread"><input type="hidden" name="id" value="${t.id}">
        <button class="linklike" type="submit">Report</button></form>` : ""}
      ${!user ? `<span class="small"><a href="/login">Log in</a> to tap “You are heard”.</span>` : ""}
    </p>
  </article>
  <h2>Replies (${replies.length})</h2>
  ${replies.length ? replies.map((r) => `<article class="card reply">
    <p class="small"><strong>${esc(r.handle)}</strong> · ${timeAgo(r.created_at)}</p>
    <p>${esc(r.body).replace(/\n/g, "<br>")}</p>
    <p><form class="inline" method="post" action="/heard">
      <input type="hidden" name="type" value="reply"><input type="hidden" name="id" value="${r.id}">
      <button class="btn btn-small ${user && heardBy("reply", r.id, user.id) ? "btn-heard" : ""}" type="submit" ${user ? "" : "disabled"}>🤍 You are heard (${heardCount("reply", r.id)})</button>
    </form>
    ${user && user.id !== r.user_id ? `<form class="inline" method="post" action="/report" onsubmit="return confirm('Report this reply to the Porch Team?')">
      <input type="hidden" name="type" value="reply"><input type="hidden" name="id" value="${r.id}">
      <button class="linklike" type="submit">Report</button></form>` : ""}</p>
  </article>`).join("") : `<p>No replies yet. A kind word here can mean the world.</p>`}
  ${user ? `<section class="card"><h2>Reply</h2>
    <form method="post" action="/thread/${t.id}/reply">
      <label><textarea name="body" required rows="4" maxlength="4000" placeholder="Listen first, then reply with kindness."></textarea></label>
      <button class="btn" type="submit">Post reply</button>
    </form></section>`
    : `<p><a class="btn" href="/signup">Join free to reply</a></p>`}`;
  res.send(layout(req, t.title, body, { crisis: !!showCrisis }));
});

app.post("/thread/:id/reply", requireLogin, (req, res) => {
  const t = db.prepare("SELECT * FROM threads WHERE id = ? AND hidden = 0").get(req.params.id);
  if (!t) return res.status(404).send("Thread not found.");
  const bodyText = String(req.body.body || "").trim();
  if (!bodyText) { req.session.flash = { type: "warn", text: "Please write a reply first." }; return res.redirect(`/thread/${t.id}`); }
  const crisis = containsCrisisLanguage(bodyText) ? 1 : 0;
  db.prepare("INSERT INTO replies (thread_id, user_id, body, crisis_flag) VALUES (?, ?, ?, ?)")
    .run(t.id, req.session.user.id, bodyText.slice(0, 4000), crisis);
  res.redirect(`/thread/${t.id}${crisis ? "?crisis=1" : ""}`);
});

app.post("/heard", requireLogin, (req, res) => {
  const type = req.body.type === "reply" ? "reply" : "thread";
  const id = parseInt(req.body.id, 10);
  if (!id) return res.redirect("/");
  const table = type === "reply" ? "replies" : "threads";
  const exists = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
  if (!exists) return res.redirect("/");
  const already = db.prepare("SELECT id FROM heard WHERE user_id = ? AND target_type = ? AND target_id = ?")
    .get(req.session.user.id, type, id);
  if (already) {
    db.prepare("DELETE FROM heard WHERE id = ?").run(already.id);
  } else {
    db.prepare("INSERT INTO heard (user_id, target_type, target_id) VALUES (?, ?, ?)").run(req.session.user.id, type, id);
  }
  const back = req.get("Referer") || "/";
  res.redirect(back);
});

// ---- auth ----
app.get("/signup", (req, res) => {
  if (req.session.user) return res.redirect("/");
  const body = `<h1>Join the porch — free</h1>
  <p class="lede">Pick a handle. No real name needed, no email required. Your handle is how other members will know you.</p>
  <form class="card auth-form" method="post" action="/signup">
    <label>Handle (3–24 letters, numbers, underscores)<br><input name="handle" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="username"></label>
    <label>Password (at least 8 characters)<br><input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
    <label>Short bio (optional)<br><input name="bio" maxlength="160" placeholder="A line about you, if you'd like"></label>
    <label class="check"><input type="checkbox" name="available_chat" value="1"> I'm open to one-on-one chats with other members</label>
    <button class="btn" type="submit">Create my account</button>
    <p class="small">Already a member? <a href="/login">Log in</a></p>
  </form>`;
  res.send(layout(req, "Join free", body));
});

app.post("/signup", rateLimitAuth, (req, res) => {
  const handle = String(req.body.handle || "").trim();
  const password = String(req.body.password || "");
  const bio = String(req.body.bio || "").trim().slice(0, 160);
  const available = req.body.available_chat === "1" ? 1 : 0;
  if (!/^[A-Za-z0-9_]{3,24}$/.test(handle)) {
    req.session.flash = { type: "warn", text: "Handle must be 3–24 letters, numbers, or underscores." };
    return res.redirect("/signup");
  }
  if (password.length < 8) {
    req.session.flash = { type: "warn", text: "Password must be at least 8 characters." };
    return res.redirect("/signup");
  }
  if (getUserByHandle(handle)) {
    req.session.flash = { type: "warn", text: "That handle is already taken. Please pick another." };
    return res.redirect("/signup");
  }
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare("INSERT INTO users (handle, password_hash, bio, available_chat) VALUES (?, ?, ?, ?)")
    .run(handle, hash, bio, available);
  req.session.user = { id: r.lastInsertRowid, handle };
  req.session.flash = { type: "ok", text: `Welcome to the porch, ${handle}. We're glad you're here.` };
  res.redirect("/");
});

app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  const body = `<h1>Log in</h1>
  <form class="card auth-form" method="post" action="/login">
    <label>Handle<br><input name="handle" required autocomplete="username"></label>
    <label>Password<br><input type="password" name="password" required autocomplete="current-password"></label>
    <button class="btn" type="submit">Log in</button>
    <p class="small">New here? <a href="/signup">Join free</a></p>
  </form>`;
  res.send(layout(req, "Log in", body));
});

app.post("/login", rateLimitAuth, (req, res) => {
  const handle = String(req.body.handle || "").trim();
  const password = String(req.body.password || "");
  const user = getUserByHandle(handle);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    req.session.flash = { type: "warn", text: "That handle or password didn't match. Please try again." };
    return res.redirect("/login");
  }
  req.session.user = { id: user.id, handle: user.handle };
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ---- profile & listeners ----
app.get("/profile", requireLogin, (req, res) => {
  const me = db.prepare("SELECT * FROM users WHERE id = ?").get(req.session.user.id);
  const body = `<h1>Your profile</h1>
  <form class="card auth-form" method="post" action="/profile">
    <p><strong>Handle:</strong> ${esc(me.handle)}</p>
    <label>Short bio<br><input name="bio" maxlength="160" value="${esc(me.bio)}"></label>
    <label class="check"><input type="checkbox" name="available_chat" value="1" ${me.available_chat ? "checked" : ""}> Available to chat one-on-one with other members</label>
    <button class="btn" type="submit">Save profile</button>
  </form>
  <section class="card"><h2>People you've blocked</h2>
  ${(() => {
    const blocked = db.prepare("SELECT u.handle FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ?").all(me.id);
    return blocked.length ? `<ul>${blocked.map((b) => `<li>${esc(b.handle)} <form class="inline" method="post" action="/unblock"><input type="hidden" name="handle" value="${esc(b.handle)}"><button class="linklike" type="submit">Unblock</button></form></li>`).join("")}</ul>` : "<p>You haven't blocked anyone.</p>";
  })()}</section>
  ${isAdmin(me) ? `<p><a class="btn btn-small" href="/admin/reports">Review reported posts</a></p>` : ""}`;
  res.send(layout(req, "Your profile", body));
});

app.post("/profile", requireLogin, (req, res) => {
  const bio = String(req.body.bio || "").trim().slice(0, 160);
  const available = req.body.available_chat === "1" ? 1 : 0;
  db.prepare("UPDATE users SET bio = ?, available_chat = ? WHERE id = ?").run(bio, available, req.session.user.id);
  req.session.flash = { type: "ok", text: "Profile saved." };
  res.redirect("/profile");
});

app.get("/listeners", (req, res) => {
  const user = req.session.user;
  const listeners = db.prepare(
    "SELECT id, handle, bio, created_at FROM users WHERE available_chat = 1 AND handle != 'Porch Team' ORDER BY created_at DESC"
  ).all();
  const body = `<h1>Listeners</h1>
  <p class="lede">These members have said they're open to a one-on-one chat. Reach out gently — a simple “hi, I'm having a hard day” is a fine start.</p>
  ${listeners.length ? `<ul class="listener-list">${listeners.map((l) => `<li class="card">
    <strong>${esc(l.handle)}</strong>${l.bio ? ` — ${esc(l.bio)}` : ""}
    ${user && user.id !== l.id ? ` <a class="btn btn-small" href="/messages/${esc(l.handle)}">Message</a>` : ""}
    ${!user ? ` <span class="small"><a href="/login">Log in</a> to message.</span>` : ""}
  </li>`).join("")}</ul>` : `<p>No members are available to chat right now. <a href="/profile">Turn on “available to chat” in your profile to be the first.</a></p>`}`;
  res.send(layout(req, "Listeners", body));
});

// ---- one-on-one messages ----
app.get("/messages", requireLogin, (req, res) => {
  const me = req.session.user;
  const convos = db.prepare(`
    SELECT u.id AS other_id, u.handle AS other_handle, u.bio AS other_bio,
      (SELECT body FROM messages m WHERE (m.sender_id = u.id AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = u.id) ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_body,
      (SELECT created_at FROM messages m WHERE (m.sender_id = u.id AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = u.id) ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_at,
      (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.read_at IS NULL AND m.hidden = 0) AS unread
    FROM users u
    WHERE u.id IN (SELECT DISTINCT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END FROM messages WHERE sender_id = ? OR recipient_id = ?)
    ORDER BY last_at DESC
  `).all(me.id, me.id, me.id, me.id, me.id, me.id, me.id, me.id);
  const body = `<h1>Your messages</h1>
  ${convos.length ? `<ul class="convo-list">${convos.map((c) => `<li><a href="/messages/${esc(c.other_handle)}"><strong>${esc(c.other_handle)}</strong>
    ${c.unread ? `<span class="unread-badge">${c.unread} new</span>` : ""}
    <span class="small">${c.last_body ? esc(c.last_body).slice(0, 90) : ""} · ${c.last_at ? timeAgo(c.last_at) : ""}</span></a></li>`).join("")}</ul>`
    : `<p>No conversations yet. Visit the <a href="/listeners">listeners</a> to reach out to someone, or reply to a thread and a conversation may begin there.</p>`}`;
  res.send(layout(req, "Messages", body));
});

app.get("/messages/:handle", requireLogin, (req, res) => {
  const me = req.session.user;
  const other = getUserByHandle(req.params.handle);
  if (!other || other.id === me.id) return res.status(404).send(layout(req, "Not found", "<h1>That person isn't here.</h1><p><a href='/listeners'>Back to listeners</a></p>"));
  const allowed = canMessage(me, other);
  const msgs = db.prepare(`
    SELECT * FROM messages
    WHERE ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) AND hidden = 0
    ORDER BY created_at ASC, id ASC
  `).all(me.id, other.id, other.id, me.id);
  // mark their messages to me as read
  db.prepare("UPDATE messages SET read_at = datetime('now') WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL").run(other.id, me.id);
  const showCrisis = req.query.crisis === "1" || msgs.some((m) => m.crisis_flag);
  const body = `<p class="small"><a href="/messages">← All messages</a></p>
  <h1>Chat with ${esc(other.handle)}</h1>
  ${other.bio ? `<p class="small">${esc(other.bio)}</p>` : ""}
  ${msgs.length ? `<div class="chat">${msgs.map((m) => {
    const mine = m.sender_id === me.id;
    return `<div class="msg ${mine ? "mine" : "theirs"}"><p>${esc(m.body).replace(/\n/g, "<br>")}</p><span class="small">${timeAgo(m.created_at)}</span></div>`;
  }).join("")}</div>` : `<p>No messages yet. Say hello — gently.</p>`}
  ${allowed ? `<form class="card" method="post" action="/messages/${esc(other.handle)}">
    <label><textarea name="body" required rows="3" maxlength="4000" placeholder="Write with kindness. You're talking to a real person."></textarea></label>
    <button class="btn" type="submit">Send</button>
  </form>` : `<p class="card">You can message ${esc(other.handle)} once they mark themselves available to chat, or after you've already talked. <a href="/listeners">Find a listener →</a></p>`}
  <form class="inline" method="post" action="/block" onsubmit="return confirm('Block ${esc(other.handle)}? They will no longer be able to message you, and you will not see their posts.')">
    <input type="hidden" name="handle" value="${esc(other.handle)}"><button class="linklike" type="submit">Block ${esc(other.handle)}</button>
  </form>`;
  res.send(layout(req, `Chat with ${other.handle}`, body, { crisis: !!showCrisis }));
});

app.post("/messages/:handle", requireLogin, (req, res) => {
  const me = req.session.user;
  const other = getUserByHandle(req.params.handle);
  if (!other || other.id === me.id) return res.status(404).send("Person not found.");
  if (!canMessage(me, other)) {
    req.session.flash = { type: "warn", text: "You can't message this person right now." };
    return res.redirect(`/messages/${other.handle}`);
  }
  const bodyText = String(req.body.body || "").trim();
  if (!bodyText) return res.redirect(`/messages/${other.handle}`);
  const crisis = containsCrisisLanguage(bodyText) ? 1 : 0;
  db.prepare("INSERT INTO messages (sender_id, recipient_id, body, crisis_flag) VALUES (?, ?, ?, ?)")
    .run(me.id, other.id, bodyText.slice(0, 4000), crisis);
  res.redirect(`/messages/${other.handle}${crisis ? "?crisis=1" : ""}`);
});

// ---- report / block ----
app.post("/report", requireLogin, (req, res) => {
  const type = ["thread", "reply", "message"].includes(req.body.type) ? req.body.type : "thread";
  const id = parseInt(req.body.id, 10);
  const reason = String(req.body.reason || "").trim().slice(0, 300);
  if (!id) return res.redirect("/");
  const table = type === "thread" ? "threads" : type === "reply" ? "replies" : "messages";
  const exists = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
  if (!exists) return res.redirect("/");
  db.prepare("INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)")
    .run(req.session.user.id, type, id, reason);
  req.session.flash = { type: "ok", text: "Thank you. The Porch Team has been notified and will review it." };
  res.redirect(req.get("Referer") || "/");
});

app.post("/block", requireLogin, (req, res) => {
  const other = getUserByHandle(String(req.body.handle || ""));
  if (!other || other.id === req.session.user.id) return res.redirect("/");
  db.prepare("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)").run(req.session.user.id, other.id);
  req.session.flash = { type: "ok", text: `You have blocked ${other.handle}.` };
  res.redirect("/messages");
});

app.post("/unblock", requireLogin, (req, res) => {
  const other = getUserByHandle(String(req.body.handle || ""));
  if (other) db.prepare("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?").run(req.session.user.id, other.id);
  res.redirect("/profile");
});

// ---- admin (handles listed in ADMIN_HANDLES env) ----
app.get("/admin/reports", requireLogin, (req, res) => {
  if (!isAdmin(req.session.user)) return res.status(403).send(layout(req, "Not allowed", "<h1>That page is for the Porch Team.</h1>"));
  const reports = db.prepare(`
    SELECT r.*, u.handle AS reporter FROM reports r JOIN users u ON u.id = r.reporter_id
    ORDER BY r.resolved ASC, r.created_at DESC
  `).all();
  const preview = (type, id) => {
    const table = type === "thread" ? "threads" : type === "reply" ? "replies" : "messages";
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    if (!row) return "(already removed)";
    const text = row.title ? `${row.title} — ${row.body}` : row.body;
    return String(text).slice(0, 200);
  };
  const body = `<h1>Reported content</h1>
  ${reports.length ? reports.map((r) => `<article class="card">
    <p><strong>${esc(r.target_type)} #${r.id}</strong> reported by ${esc(r.reporter)} · ${timeAgo(r.created_at)} · ${r.resolved ? "resolved" : "open"}</p>
    <p>${esc(preview(r.target_type, r.target_id))}</p>
    ${r.reason ? `<p class="small">Reason: ${esc(r.reason)}</p>` : ""}
    <p>
      <form class="inline" method="post" action="/admin/hide"><input type="hidden" name="type" value="${esc(r.target_type)}"><input type="hidden" name="id" value="${r.id}"><button class="btn btn-small" type="submit">Hide content</button></form>
      <form class="inline" method="post" action="/admin/unhide"><input type="hidden" name="type" value="${esc(r.target_type)}"><input type="hidden" name="id" value="${r.id}"><button class="btn btn-small btn-ghost" type="submit">Unhide</button></form>
      <form class="inline" method="post" action="/admin/resolve"><input type="hidden" name="id" value="${r.id}"><button class="btn btn-small btn-ghost" type="submit">Mark resolved</button></form>
    </p>
  </article>`).join("") : "<p>No reports. The porch is peaceful.</p>"}`;
  res.send(layout(req, "Reported content", body));
});

app.post("/admin/hide", requireLogin, (req, res) => {
  if (!isAdmin(req.session.user)) return res.status(403).send("Not allowed.");
  const type = ["thread", "reply", "message"].includes(req.body.type) ? req.body.type : "thread";
  const id = parseInt(req.body.id, 10);
  const table = type === "thread" ? "threads" : type === "reply" ? "replies" : "messages";
  if (id) db.prepare(`UPDATE ${table} SET hidden = 1 WHERE id = ?`).run(id);
  res.redirect("/admin/reports");
});

app.post("/admin/unhide", requireLogin, (req, res) => {
  if (!isAdmin(req.session.user)) return res.status(403).send("Not allowed.");
  const type = ["thread", "reply", "message"].includes(req.body.type) ? req.body.type : "thread";
  const id = parseInt(req.body.id, 10);
  const table = type === "thread" ? "threads" : type === "reply" ? "replies" : "messages";
  if (id) db.prepare(`UPDATE ${table} SET hidden = 0 WHERE id = ?`).run(id);
  res.redirect("/admin/reports");
});

app.post("/admin/resolve", requireLogin, (req, res) => {
  if (!isAdmin(req.session.user)) return res.status(403).send("Not allowed.");
  const id = parseInt(req.body.id, 10);
  if (id) db.prepare("UPDATE reports SET resolved = 1 WHERE id = ?").run(id);
  res.redirect("/admin/reports");
});

// ---- 404 ----
app.use((req, res) => {
  res.status(404).send(layout(req, "Not found", "<h1>That page isn't on the porch.</h1><p><a href='/'>Head back home →</a></p>"));
});

app.listen(PORT, () => {
  console.log(`The Listening Porch is listening on http://localhost:${PORT}`);
  console.log(`Database: ${process.env.DATABASE_PATH || "data/porch.db"}`);
  if (ADMIN_HANDLES.length) console.log(`Admin handles: ${ADMIN_HANDLES.join(", ")}`);
});
