const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const auth = require("../middleware/auth");

// Migrate: tambah kolom yang belum ada
try { db.prepare("ALTER TABLE users ADD COLUMN name TEXT DEFAULT ''").run(); } catch {}
try { db.prepare("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''").run(); } catch {}
try { db.prepare("ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1").run(); } catch {}

// GET all users
router.get("/", auth, auth.adminOnly, (req, res) => {
    try {
        const users = db.prepare("SELECT id, username, name, email, role, active, created_at FROM users ORDER BY id DESC").all();
        res.json(users.map((u) => ({...u, active: u.active === 1 || u.active === true || u.active === "1"})));
    } catch (e) {
        res.status(500).json({error: "Gagal mengambil data user: " + e.message});
    }
});

// GET single user
router.get("/:id", auth, auth.adminOnly, (req, res) => {
    try {
        const user = db.prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?").get(req.params.id);
        if (!user) return res.status(404).json({error: "User tidak ditemukan"});
        res.json({...user, active: user.active === 1 || user.active === true || user.active === "1"});
    } catch (e) {
        res.status(500).json({error: "Gagal mengambil user: " + e.message});
    }
});

// POST add user
router.post("/", auth, auth.adminOnly, (req, res) => {
    const {username, password, role, name, email, active} = req.body;
    if (!username || !password) return res.status(400).json({error: "Username & password wajib"});

    try {
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (existing) return res.status(409).json({error: "Username sudah dipakai"});

        const hash = bcrypt.hashSync(password, 10);
        const result = db
        .prepare("INSERT INTO users (username, password, role, name, email, active) VALUES (?, ?, ?, ?, ?, ?)")
        .run(username, hash, role || "operator", name || "", email || "", active !== false && active !== "false" ? 1 : 0);

        res.json({
            id: result.lastInsertRowid, 
            username, 
            role: role || "operator", 
            name: name || "", 
            email: email || "", 
            active: active !== false && active !== "false"
        });
    } catch (e) {
        res.status(400).json({error: "Gagal membuat user: " + e.message});
    }
});

// PATCH update user (supports username change, password change, all fields)
router.patch("/:id", auth, auth.adminOnly, (req, res) => {
    const {username, name, email, role, active, password} = req.body;
    const id = parseInt(req.params.id);

    if (isNaN(id)) return res.status(400).json({error: "ID tidak valid"});

    try {
        // Check user exists
        const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        if (!existing) return res.status(404).json({error: "User tidak ditemukan"});

        // Check if new username is taken by another user
        if (username && username !== existing.username) {
            const taken = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, id);
            if (taken) return res.status(409).json({error: "Username sudah dipakai user lain"});
        }

        // Build dynamic update
        const updates = [];
        const params = [];

        if (username !== undefined) { updates.push("username = ?"); params.push(username); }
        if (name !== undefined) { updates.push("name = ?"); params.push(name); }
        if (email !== undefined) { updates.push("email = ?"); params.push(email); }
        if (role !== undefined) { updates.push("role = ?"); params.push(role); }
        if (active !== undefined) { updates.push("active = ?"); params.push(active !== false && active !== "false" ? 1 : 0); }

        if (password && password.trim() !== "") {
            const hash = bcrypt.hashSync(password, 10);
            updates.push("password = ?");
            params.push(hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({error: "Tidak ada data yang diupdate"});
        }

        params.push(id);
        db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);

        const updated = db.prepare("SELECT id, username, name, email, role, active, created_at FROM users WHERE id = ?").get(id);
        res.json({...updated, active: updated.active === 1 || updated.active === true || updated.active === "1"});
    } catch (e) {
        res.status(500).json({error: "Gagal update user: " + e.message});
    }
});

// DELETE user
router.delete("/:id", auth, auth.adminOnly, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({error: "ID tidak valid"});

    try {
        // Prevent deleting yourself
        if (id === req.user.id) {
            return res.status(400).json({error: "Tidak bisa menghapus diri sendiri"});
        }

        // Prevent deleting the last admin
        const target = db.prepare("SELECT role FROM users WHERE id = ?").get(id);
        if (!target) return res.status(404).json({error: "User tidak ditemukan"});

        if (target?.role === "admin") {
            const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
            if (adminCount <= 1) {
                return res.status(400).json({error: "Tidak bisa menghapus admin terakhir"});
            }
        }

        db.prepare("DELETE FROM users WHERE id = ?").run(id);
        res.json({ok: true, message: "User berhasil dihapus"});
    } catch (e) {
        res.status(500).json({error: "Gagal menghapus user: " + e.message});
    }
});

// PUT change own password
router.put("/me/password", auth, (req, res) => {
    const {oldPassword, newPassword} = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({error: "Password lama dan baru wajib diisi"});
    }

    try {
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
        if (!user) return res.status(404).json({error: "User tidak ditemukan"});

        if (!bcrypt.compareSync(oldPassword, user.password)) {
            return res.status(400).json({error: "Password lama salah"});
        }

        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(bcrypt.hashSync(newPassword, 10), req.user.id);
        res.json({ok: true, message: "Password berhasil diubah"});
    } catch (e) {
        res.status(500).json({error: "Gagal mengubah password: " + e.message});
    }
});

module.exports = router;