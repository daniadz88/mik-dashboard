const express = require("express");
const router = express.Router({mergeParams: true});
const {RouterOSAPI} = require("node-routeros");

// Get MikroTik connection - lazy load models, fallback to env vars
async function getMikrotikConnection(deviceId) {
    let device = null;

    // Try to get from database models (LAZY LOAD - inside try-catch)
    try {
        const models = require("../models");
        if (models && models.Device && models.Device.findByPk) {
            device = await models.Device.findByPk(deviceId);
        }
    } catch (e) {
        // Models not available, continue to fallback
    }

    // If no device from DB, try to get from a simple JSON file
    if (!device) {
        try {
            const fs = require("fs");
            const path = require("path");
            const devicesFile = path.join(__dirname, "../data/devices.json");
            if (fs.existsSync(devicesFile)) {
                const devices = JSON.parse(fs.readFileSync(devicesFile, "utf8"));
                device = devices.find((d) => d.id == deviceId || d.id == parseInt(deviceId));
            }
        } catch (e) {
            // No devices file
        }
    }

    // Last resort - use environment variables for default device
    if (!device) {
        device = {
            ip: process.env.MIKROTIK_IP || "192.168.111.1",
            port: parseInt(process.env.MIKROTIK_PORT) || 8728,
            username: process.env.MIKROTIK_USER || "admin",
            password: process.env.MIKROTIK_PASS || "",
        };
    }

    const conn = new RouterOSAPI({
        host: device.ip || device.host || "192.168.111.1",
        port: device.port || 8728,
        user: device.username || device.user || "admin",
        password: device.password || device.pass || "",
        timeout: 15000,
    });

    await conn.connect();
    return conn;
}

// GET /api/devices/:id/hotspot/users
router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const users = await conn.write("/ip/hotspot/user/print");
        await conn.close();

        const formatted = users.map((u) => ({
            id: u[".id"],
            username: u.name,
            password: u.password || "",
            profile: u.profile || "default",
            server: u.server || "",
            comment: u.comment || "",
            macAddress: u["mac-address"] || "",
            uptime: u.uptime || "00:00:00",
            bytesIn: u["bytes-in"] || "0",
            bytesOut: u["bytes-out"] || "0",
            disabled: u.disabled === "true",
            sharedUsers: u["shared-users"] || "1",
            timeLimit: u["limit-uptime"] || "",
            dataLimit: u["limit-bytes-total"] || "",
        }));

        res.json(formatted);
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[HOTSPOT USERS ERROR] Device " + req.params.id + ":", err.message);
        res.status(500).json({error: err.message});
    }
});

// POST /api/devices/:id/hotspot/users
router.post("/", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const params = [];

        if (req.body.name) params.push(`=name=${req.body.name}`);
        if (req.body.password) params.push(`=password=${req.body.password}`);
        if (req.body.profile) params.push(`=profile=${req.body.profile}`);
        if (req.body.server) params.push(`=server=${req.body.server}`);
        if (req.body.comment) params.push(`=comment=${req.body.comment}`);
        if (req.body["time-limit"]) params.push(`=limit-uptime=${req.body["time-limit"]}`);
        if (req.body["data-limit"]) params.push(`=limit-bytes-total=${req.body["data-limit"]}`);
        if (req.body["shared-users"]) params.push(`=shared-users=${req.body["shared-users"]}`);

        const result = await conn.write("/ip/hotspot/user/add", params);
        await conn.close();
        res.json({success: true, id: result});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[ADD USER ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// PATCH /api/devices/:id/hotspot/users/:userId
router.patch("/:userId", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const params = [`=.id=${req.params.userId}`];

        if (req.body.name !== undefined) params.push(`=name=${req.body.name}`);
        if (req.body.password !== undefined) params.push(`=password=${req.body.password}`);
        if (req.body.profile !== undefined) params.push(`=profile=${req.body.profile}`);
        if (req.body.comment !== undefined) params.push(`=comment=${req.body.comment}`);
        if (req.body.disabled !== undefined) params.push(`=disabled=${req.body.disabled ? "yes" : "no"}`);

        await conn.write("/ip/hotspot/user/set", params);
        await conn.close();
        res.json({success: true});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[UPDATE USER ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// DELETE /api/devices/:id/hotspot/users/:userId
router.delete("/:userId", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        await conn.write("/ip/hotspot/user/remove", [`=.id=${req.params.userId}`]);
        await conn.close();
        res.json({success: true});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[DELETE USER ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
