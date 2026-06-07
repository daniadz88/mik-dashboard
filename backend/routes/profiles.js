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

// GET /api/devices/:id/hotspot/profiles
router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const profiles = await conn.write("/ip/hotspot/user/profile/print");
        await conn.close();
        res.json(profiles);
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[HOTSPOT PROFILES ERROR] Device " + req.params.id + ":", err.message);
        res.status(500).json({error: err.message, detail: "Pastikan MikroTik API aktif dan kredensial benar"});
    }
});

// POST /api/devices/:id/hotspot/profiles
router.post("/", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const params = Object.entries(req.body)
        .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
        .flatMap(([k, v]) => [`=${k}=${v}`]);

        const result = await conn.write("/ip/hotspot/user/profile/add", params);
        await conn.close();
        res.json({success: true, id: result});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[ADD PROFILE ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// PATCH /api/devices/:id/hotspot/profiles/:profileId
router.patch("/:profileId", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const params = [`=.id=${req.params.profileId}`];

        Object.entries(req.body)
        .filter(([k, v]) => k !== "id" && v !== undefined && v !== "" && v !== null)
        .forEach(([k, v]) => params.push(`=${k}=${v}`));

        await conn.write("/ip/hotspot/user/profile/set", params);
        await conn.close();
        res.json({success: true});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[UPDATE PROFILE ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// DELETE /api/devices/:id/hotspot/profiles/:profileId
router.delete("/:profileId", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        await conn.write("/ip/hotspot/user/profile/remove", [`=.id=${req.params.profileId}`]);
        await conn.close();
        res.json({success: true});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[DELETE PROFILE ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
