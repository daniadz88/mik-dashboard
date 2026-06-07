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

// GET /api/devices/:id/hotspot/active
router.get("/", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        const active = await conn.write("/ip/hotspot/active/print");
        await conn.close();

        const formatted = active.map((a) => ({
            id: a[".id"],
            user: a.user,
            domain: a.domain || "",
            address: a.address,
            macAddress: a["mac-address"] || "",
            loginBy: a["login-by"] || "",
            uptime: a.uptime || "00:00:00",
            idleTime: a["idle-time"] || "00:00:00",
            idleTimeout: a["idle-timeout"] || "",
            keepaliveTimeout: a["keepalive-timeout"] || "",
            bytesIn: a["bytes-in"] || "0",
            bytesOut: a["bytes-out"] || "0",
            packetsIn: a["packets-in"] || "0",
            packetsOut: a["packets-out"] || "0",
            radius: a.radius === "true",
        }));

        res.json(formatted);
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[HOTSPOT ACTIVE ERROR] Device " + req.params.id + ":", err.message);
        res.status(500).json({error: err.message});
    }
});

// DELETE /api/devices/:id/hotspot/active/:activeId - Kick user
router.delete("/:activeId", async (req, res) => {
    let conn;
    try {
        conn = await getMikrotikConnection(req.params.id);
        await conn.write("/ip/hotspot/active/remove", [`=.id=${req.params.activeId}`]);
        await conn.close();
        res.json({success: true});
    } catch (err) {
        if (conn) await conn.close().catch(() => {});
        console.error("[KICK USER ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
