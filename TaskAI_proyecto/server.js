const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "cambia-esta-clave-en-produccion";

const db = new Database(path.join(__dirname, "taskai.db"));
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  theme TEXT DEFAULT 'light',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date TEXT,
  category TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'Media',
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  points INTEGER DEFAULT 10,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT DEFAULT '',
  type TEXT DEFAULT 'Evento',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autenticado" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ error: "Completa los datos. La contraseña debe tener al menos 6 caracteres." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)"
    ).run(name.trim(), email.trim().toLowerCase(), hash);
    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase() };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (e) {
    if (String(e).includes("UNIQUE")) return res.status(409).json({ error: "Ese email ya está registrado." });
    res.status(500).json({ error: "No se pudo crear la cuenta." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const row = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").trim().toLowerCase());
  if (!row || !(await bcrypt.compare(password || "", row.password_hash))) {
    return res.status(401).json({ error: "Email o contraseña incorrectos." });
  }
  const user = { id: row.id, name: row.name, email: row.email };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user, theme: row.theme });
});

app.get("/api/me", auth, (req, res) => {
  const user = db.prepare("SELECT id,name,email,theme,created_at FROM users WHERE id=?").get(req.user.id);
  res.json(user);
});

app.put("/api/me", auth, (req, res) => {
  const { name, theme } = req.body;
  db.prepare("UPDATE users SET name=COALESCE(?,name), theme=COALESCE(?,theme) WHERE id=?")
    .run(name || null, theme || null, req.user.id);
  res.json({ ok: true });
});

app.get("/api/tasks", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks WHERE user_id=? ORDER BY due_date IS NULL, due_date, id DESC").all(req.user.id);
  res.json(rows);
});

app.post("/api/tasks", auth, (req, res) => {
  const { title, description="", due_date=null, category="General", priority="Media", points=10 } = req.body;
  if (!title) return res.status(400).json({ error: "La tarea necesita un título." });
  const result = db.prepare(`
    INSERT INTO tasks (user_id,title,description,due_date,category,priority,points)
    VALUES (?,?,?,?,?,?,?)
  `).run(req.user.id, title, description, due_date || null, category, priority, Number(points) || 10);
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(result.lastInsertRowid));
});

app.put("/api/tasks/:id", auth, (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id=? AND user_id=?").get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: "Tarea no encontrada." });

  const allowed = ["title","description","due_date","category","priority","status","progress","points"];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];

  if (data.progress !== undefined) {
    data.progress = Math.max(0, Math.min(100, Number(data.progress)));
    if (data.progress === 100) data.status = "completed";
    else if (data.progress > 0) data.status = "in_progress";
    else data.status = "pending";
  }

  const keys = Object.keys(data);
  if (keys.length) {
    db.prepare(`UPDATE tasks SET ${keys.map(k => `${k}=?`).join(", ")} WHERE id=? AND user_id=?`)
      .run(...keys.map(k => data[k]), req.params.id, req.user.id);
  }
  res.json(db.prepare("SELECT * FROM tasks WHERE id=?").get(req.params.id));
});

app.delete("/api/tasks/:id", auth, (req, res) => {
  db.prepare("DELETE FROM tasks WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

app.get("/api/events", auth, (req, res) => {
  res.json(db.prepare("SELECT * FROM events WHERE user_id=? ORDER BY event_date,event_time").all(req.user.id));
});

app.post("/api/events", auth, (req, res) => {
  const { title, event_date, event_time="", type="Evento" } = req.body;
  if (!title || !event_date) return res.status(400).json({ error: "Título y fecha son obligatorios." });
  const result = db.prepare("INSERT INTO events (user_id,title,event_date,event_time,type) VALUES (?,?,?,?,?)")
    .run(req.user.id, title, event_date, event_time, type);
  res.json(db.prepare("SELECT * FROM events WHERE id=?").get(result.lastInsertRowid));
});

app.delete("/api/events/:id", auth, (req, res) => {
  db.prepare("DELETE FROM events WHERE id=? AND user_id=?").run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// Endpoint de IA de demostración.
// Para una IA real, conecta aquí OpenAI, Gemini u otro proveedor y guarda la API key en .env.
app.post("/api/assistant", auth, async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ error: "Escribe un mensaje." });

  const tasks = db.prepare("SELECT title,progress,status,due_date FROM tasks WHERE user_id=? ORDER BY due_date LIMIT 8").all(req.user.id);
  const pending = tasks.filter(t => t.status !== "completed").slice(0, 3);

  let reply = "¡Claro! Puedo ayudarte a organizar tus tareas, crear planes y revisar tu progreso.";
  if (/tarea|pendiente|pendientes/i.test(message)) {
    reply = pending.length
      ? "Tus próximas tareas pendientes son: " + pending.map(t => `${t.title} (${t.progress}%)`).join(", ") + "."
      : "No tienes tareas pendientes. ¡Buen trabajo!";
  } else if (/hola|buenas/i.test(message)) {
    reply = "¡Hola! Soy tu asistente TaskAI. Puedo ayudarte a organizar tu día.";
  } else if (/plan|organizar|día/i.test(message)) {
    reply = "Te recomiendo: 1) termina una tarea corta, 2) avanza la tarea de mayor prioridad y 3) deja 15 minutos para revisar el calendario.";
  }

  res.json({ reply, demo: true });
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`TaskAI funcionando en http://localhost:${PORT}`));
