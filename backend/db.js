const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.join(__dirname, "data.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'mikrotik',
    host TEXT NOT NULL,
    port INTEGER DEFAULT 8728,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    https INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    detail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    username TEXT,
    password TEXT,
    profile TEXT,
    duration TEXT,
    price INTEGER,
    status TEXT DEFAULT 'unused',
    printed INTEGER DEFAULT 0,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
  );
`);

// Default admin
const existing = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!existing) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run("admin", hash, "admin", "Administrator");
    console.log("[DB] Admin default dibuat: admin / admin123");
}

// Default settings
const defaultSettings = {
    app_name: "MIK Dashboard",
    company_name: "",
    app_version: "2.0",
    app_address: "",
    app_phone: "",
    app_logo: "",
    app_theme: "dark",
    voucher_template: "default",
    voucher_footer: "",
    server_port: "3001",
    auto_start: "false",
    primary_color: "#0ea5e9",
    show_qr: false,
    show_logo: false,
    print_size: "default",
};

Object.entries(defaultSettings).forEach(([key, value]) => {
    const exists = db.prepare("SELECT 1 FROM app_settings WHERE key = ?").get(key);
    if (!exists) {
        db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run(key, String(value));
    }
});

module.exports = db;