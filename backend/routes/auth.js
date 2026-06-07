const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db.js");

const JWT_SECRET = process.env.JWT_SECRET || "mik-dashboard-secret-key-2025";

// ─── LOGIN ───────────────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({error: "Username dan password wajib diisi"});
    }

    const user = db.prepare("SELECT id, username, password, name, role, email, active FROM users WHERE username = ?").get(username);
    if (!user) {
        return res.status(401).json({error: "Username atau password salah"});
    }

    if (user.active === 0) {
        return res.status(403).json({error: "Akun dinonaktifkan"});
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
        return res.status(401).json({error: "Username atau password salah"});
    }

    const token = jwt.sign(
        {id: user.id, username: user.username, role: user.role},
        JWT_SECRET,
        {expiresIn: "7d"}
    );

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
        },
    });
});

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({error: "Token tidak ditemukan"});
    }

    const token = authHeader.slice(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare("SELECT id, username, name, role, email, active FROM users WHERE id = ?").get(decoded.id);
        if (!user || user.active === 0) {
            return res.status(401).json({error: "Akun tidak ditemukan atau dinonaktifkan"});
        }
        res.json({success: true, user});
    } catch {
        res.status(401).json({error: "Token tidak valid"});
    }
});

// ─── REGISTER (admin only) ───────────────────────────────────────────────────
router.post("/register", (req, res) => {
    const {username, password, name, email, role} = req.body;
    if (!username || !password) {
        return res.status(400).json({error: "Username dan password wajib diisi"});
    }

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
        return res.status(409).json({error: "Username sudah terdaftar"});
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
        "INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)"
    ).run(username, hash, name || "", email || "", role || "operator");

    res.json({success: true, id: result.lastInsertRowid});
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
router.post("/change-password", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({error: "Token tidak ditemukan"});
    }

    const token = authHeader.slice(7);
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(401).json({error: "Token tidak valid"});
    }

    const {oldPassword, newPassword} = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({error: "Password lama dan baru wajib diisi"});
    }

    const user = db.prepare("SELECT password FROM users WHERE id = ?").get(decoded.id);
    if (!user) {
        return res.status(404).json({error: "User tidak ditemukan"});
    }

    const valid = bcrypt.compareSync(oldPassword, user.password);
    if (!valid) {
        return res.status(401).json({error: "Password lama salah"});
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, decoded.id);

    res.json({success: true, message: "Password berhasil diubah"});
});

module.exports = router;