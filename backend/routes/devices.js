const express = require("express");
const router = express.Router();
const db = require("../db.js");
const auth = require("../middleware/auth");
const {RouterOSAPI} = require("node-routeros");

// Connection cache to avoid repeated reconnections
const connectionCache = new Map();
const lastStatusCheck = new Map();
const STATUS_CACHE_MS = 10000; // 10 seconds cache for status checks

function getCachedConnection(device) {
    const key = `${device.host}:${device.port || 8728}`;
    const cached = connectionCache.get(key);

    if (cached && cached.connected) {
        return cached;
    }

    // Remove broken connection
    if (cached) {
        try { cached.close(); } catch(e) {}
        connectionCache.delete(key);
    }

    return null;
}

function createConnection(device) {
    const key = `${device.host}:${device.port || 8728}`;

    const conn = new RouterOSAPI({
        host: device.host,
        port: device.port || 8728,
        user: device.username,
        password: device.password,
        timeout: 5000,
    });

    connectionCache.set(key, conn);
    return conn;
}

// ⚠️ GUARD: jangan proses request yang seharusnya ke hotspot router
// Ini terjadi kalau Express salah route karena prefix match
router.use("/:id/hotspot", (req, res) => {
    res.status(404).json({error: "Hotspot route tidak ditemukan di devices router — cek server.js"});
});

// GET all devices
router.get("/", auth, async (req, res) => {
    try {
        const devices = db.prepare("SELECT * FROM devices ORDER BY created_at DESC").all();
        res.json(devices);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// GET single device
router.get("/:id", auth, async (req, res) => {
    try {
        const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
        if (!device) return res.status(404).json({error: "Device tidak ditemukan"});
        res.json(device);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// POST create device
router.post("/", auth, async (req, res) => {
    try {
        const {name, type, host, port, username, password, https} = req.body;
        if (!name || !host || !username) {
            return res.status(400).json({error: "Name, host, dan username wajib diisi"});
        }
        const result = db.prepare(
            "INSERT INTO devices (name, type, host, port, username, password, https) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).run(name, type || "mikrotik", host, port || 8728, username, password || "", https ? 1 : 0);
        res.json({id: result.lastInsertRowid, ...req.body});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// PUT update device
router.put("/:id", auth, async (req, res) => {
    try {
        const {name, type, host, port, username, password, https} = req.body;
        const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
        if (!device) return res.status(404).json({error: "Device tidak ditemukan"});

        // Clear cache if connection details changed
        if (host && host !== device.host || port && port !== device.port) {
            const oldKey = `${device.host}:${device.port || 8728}`;
            const oldConn = connectionCache.get(oldKey);
            if (oldConn) {
                try { oldConn.close(); } catch(e) {}
                connectionCache.delete(oldKey);
            }
            lastStatusCheck.delete(device.id);
        }

        db.prepare(
            "UPDATE devices SET name = ?, type = ?, host = ?, port = ?, username = ?, password = ?, https = ? WHERE id = ?"
        ).run(
            name || device.name,
            type || device.type,
            host || device.host,
            port || device.port,
            username || device.username,
            password || device.password,
            https !== undefined ? (https ? 1 : 0) : device.https,
            req.params.id
        );
        res.json({success: true});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// DELETE device
router.delete("/:id", auth, async (req, res) => {
    try {
        const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
        if (device) {
            const key = `${device.host}:${device.port || 8728}`;
            const conn = connectionCache.get(key);
            if (conn) {
                try { conn.close(); } catch(e) {}
                connectionCache.delete(key);
            }
            lastStatusCheck.delete(device.id);
        }

        db.prepare("DELETE FROM devices WHERE id = ?").run(req.params.id);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// GET device status (ping test) - WITH RATE LIMITING
router.get("/:id/status", auth, async (req, res) => {
    try {
        const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
        if (!device) return res.status(404).json({error: "Device tidak ditemukan"});

        const now = Date.now();
        const lastCheck = lastStatusCheck.get(device.id) || 0;

        // Return cached status if checked within last 10 seconds
        if (now - lastCheck < STATUS_CACHE_MS) {
            // Try to use cached connection state
            const cached = getCachedConnection(device);
            return res.json({
                online: cached && cached.connected,
                cached: true,
                device: {id: device.id, name: device.name, host: device.host}
            });
        }

        lastStatusCheck.set(device.id, now);

        let conn = getCachedConnection(device);
        if (!conn) {
            conn = createConnection(device);
        }

        try {
            if (!conn.connected) {
                await conn.connect();
            }
            res.json({online: true, device: {id: device.id, name: device.name, host: device.host}});
        } catch (err) {
            // Connection failed, remove from cache
            const key = `${device.host}:${device.port || 8728}`;
            connectionCache.delete(key);
            res.json({online: false, error: err.message, device: {id: device.id, name: device.name, host: device.host}});
        }
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// Cleanup on server shutdown
process.on("SIGINT", () => {
    connectionCache.forEach((conn, key) => {
        try { conn.close(); } catch(e) {}
    });
    process.exit(0);
});

module.exports = router;