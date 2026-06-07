const jwt = require("jsonwebtoken");
const db = require("../db.js");

const JWT_SECRET = process.env.JWT_SECRET || "mik-dashboard-secret-key-2025";

function auth(req, res, next) {
    // Debug log (remove in production)
    // console.log("[AUTH] Headers:", req.headers.authorization ? "Bearer present" : "No Bearer", "X-User-Id:", req.headers["x-user-id"]);

    // 1. Try Bearer token first (proper JWT auth)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = db.prepare("SELECT id, username, name, role, email, active FROM users WHERE id = ?").get(decoded.id);
            if (user && user.active !== 0) {
                req.user = user;
                // console.log("[AUTH] JWT auth success:", user.username, "role:", user.role);
                return next();
            }
        } catch (err) {
            // token invalid, continue to next method
            // console.log("[AUTH] JWT invalid:", err.message);
        }
    }

    // 2. Fallback: X-User-Id header (for dev/simple auth)
    const userId = req.headers["x-user-id"];
    if (userId) {
        const user = db.prepare("SELECT id, username, name, role, email, active FROM users WHERE id = ?").get(userId);
        if (user && user.active !== 0) {
            req.user = user;
            // console.log("[AUTH] X-User-Id auth success:", user.username, "role:", user.role);
            return next();
        }
    }

    // 3. Last resort: auto-login as admin ONLY if no auth headers were sent at all
    // This is for development convenience - remove in production
    if (!authHeader && !userId) {
        const admin = db.prepare("SELECT id, username, name, role, email FROM users WHERE role = 'admin' LIMIT 1").get();
        if (admin) {
            req.user = admin;
            // console.log("[AUTH] Auto-admin fallback:", admin.username);
            return next();
        }
    }

    // 4. No auth at all
    return res.status(401).json({error: "Unauthorized - login required"});
}

auth.adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({error: "Akses ditolak - admin only", currentRole: req.user?.role || "none"});
    }
    next();
};

module.exports = auth;