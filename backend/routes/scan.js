const express = require("express");
const router = express.Router();
const os = require("os");
const net = require("net");
const dgram = require("dgram");
const {RouterOSAPI} = require("node-routeros");

// ========== MNDP DISCOVERY ==========
const MNDP_PORT = 5678;

function parseMndpResponse(buffer) {
    const devices = [];
    let offset = 0;

    while (offset < buffer.length) {
        if (offset + 2 > buffer.length) break;
        const type = buffer[offset];
        const len = buffer[offset + 1];
        offset += 2;
        if (offset + len > buffer.length) break;
        if (type === 0) { offset += len; continue; }

        const data = buffer.slice(offset, offset + len);
        offset += len;

        const device = {};
        let innerOffset = 0;

        while (innerOffset < data.length) {
            if (innerOffset + 2 > data.length) break;
            const innerType = data[innerOffset];
            const innerLen = data[innerOffset + 1];
            innerOffset += 2;
            if (innerOffset + innerLen > data.length) break;
            const innerData = data.slice(innerOffset, innerOffset + innerLen);
            innerOffset += innerLen;

            switch (innerType) {
                case 1: device.mac = Array.from(innerData).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase(); break;
                case 2: device.identity = innerData.toString('utf8'); break;
                case 3: device.version = innerData.toString('utf8'); break;
                case 4: device.platform = innerData.toString('utf8'); break;
                case 7: device.board = innerData.toString('utf8'); break;
                case 9: if (innerLen === 4) device.ip = Array.from(innerData).join('.'); break;
                case 10: device.interface = innerData.toString('utf8'); break;
            }
        }

        if (device.ip && device.mac) devices.push(device);
    }
    return devices;
}

function discoverMikroTik(timeout = 3000) {
    return new Promise((resolve) => {
        const socket = dgram.createSocket("udp4");
        const devices = [];
        let timer = null;

        socket.on("message", (msg, rinfo) => {
            try {
                const parsed = parseMndpResponse(msg);
                for (const dev of parsed) {
                    if (!devices.find(d => d.ip === dev.ip && d.mac === dev.mac)) {
                        devices.push({...dev, source: rinfo.address, port: rinfo.port});
                    }
                }
            } catch (e) {}
        });

        socket.on("error", () => {
            socket.close();
            resolve(devices);
        });

        socket.bind(() => {
            socket.setBroadcast(true);
            const discoveryPacket = Buffer.from([0x00, 0x00]);
            const interfaces = os.networkInterfaces();

            for (const [name, addrs] of Object.entries(interfaces)) {
                for (const addr of addrs) {
                    if (addr.family === "IPv4" && !addr.internal) {
                        const broadcast = getBroadcastAddress(addr.address, addr.netmask);
                        try {
                            socket.send(discoveryPacket, 0, discoveryPacket.length, MNDP_PORT, broadcast);
                        } catch (e) {}
                    }
                }
            }

            try {
                socket.send(discoveryPacket, 0, discoveryPacket.length, MNDP_PORT, "255.255.255.255");
            } catch (e) {}

            timer = setTimeout(() => {
                socket.close();
                resolve(devices);
            }, timeout);
        });
    });
}

function getBroadcastAddress(ip, netmask) {
    const ipParts = ip.split(".").map(Number);
    const maskParts = netmask.split(".").map(Number);
    return ipParts.map((part, i) => part | (~maskParts[i] & 255)).join(".");
}

// ========== TCP PROBE ==========
function tcpProbe(host, port, timeout = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let resolved = false;
        socket.setTimeout(timeout);
        socket.on("connect", () => {
            if (!resolved) { resolved = true; socket.destroy(); resolve(true); }
        });
        socket.on("timeout", () => {
            if (!resolved) { resolved = true; socket.destroy(); resolve(false); }
        });
        socket.on("error", () => {
            if (!resolved) { resolved = true; resolve(false); }
        });
        socket.connect(port, host);
    });
}

// ========== ROUTES ==========

router.get("/networks", (req, res) => {
    const interfaces = os.networkInterfaces();
    const networks = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            const isIPv4 = addr.family === "IPv4" || addr.family === 4;
            if (isIPv4 && !addr.internal) {
                const cidr = getCidrFromNetmask(addr.netmask);
                const subnet = getSubnet(addr.address, addr.netmask);
                const base = subnet.replace(/\.0$/, "");
                networks.push({
                    id: name + "_" + addr.address,
                    name: cleanAdapterName(name),
                    rawName: name,
                    address: addr.address,
                    netmask: addr.netmask,
                    mac: addr.mac,
                    cidr: cidr,
                    subnet: subnet,
                    base: base,
                    broadcast: getBroadcastAddress(addr.address, addr.netmask),
                    range: `${base}.1 - ${base}.254`,
                    isUp: true,
                });
            }
        }
    }

    res.json({networks, count: networks.length, success: true});
});

// FULL SCAN: MNDP + TCP fallback
router.get("/scan", async (req, res) => {
    const timeout = parseInt(req.query.timeout) || 3000;
    console.log("[SCAN] Starting full scan...");

    // Step 1: MNDP discovery
    const mndpDevices = await discoverMikroTik(timeout);
    console.log(`[SCAN] MNDP found: ${mndpDevices.length}`);

    if (mndpDevices.length > 0) {
        return res.json({
            success: true,
            count: mndpDevices.length,
            devices: mndpDevices.map(d => ({
                ip: d.ip,
                mac: d.mac,
                identity: d.identity || "MikroTik",
                version: d.version || "",
                platform: d.platform || "",
                board: d.board || "",
                interface: d.interface || "",
                method: "mndp"
            })),
            method: "mndp"
        });
    }

    // Step 2: TCP fallback — scan gateway and common IPs
    console.log("[SCAN] MNDP empty, trying TCP fallback...");
    const interfaces = os.networkInterfaces();
    const found = [];
    const checked = new Set();

    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.family === "IPv4" && !addr.internal) {
                const base = getSubnet(addr.address, addr.netmask).replace(/\.0$/, "");
                // Check gateway (usually .1)
                const gateway = `${base}.1`;
                if (!checked.has(gateway)) {
                    checked.add(gateway);
                    const open8728 = await tcpProbe(gateway, 8728, 1500);
                    const open8291 = await tcpProbe(gateway, 8291, 1500);
                    if (open8728 || open8291) {
                        found.push({
                            ip: gateway,
                            mac: "",
                            identity: `MikroTik-${gateway.split(".").pop()}`,
                            version: "",
                            platform: "",
                            board: "",
                            interface: name,
                            method: "tcp"
                        });
                    }
                }
            }
        }
    }

    console.log(`[SCAN] TCP fallback found: ${found.length}`);
    res.json({
        success: true,
        count: found.length,
        devices: found,
        method: found.length > 0 ? "tcp" : "none"
    });
});

router.get("/probe", async (req, res) => {
    const {ip} = req.query;
    if (!ip) return res.status(400).json({error: "IP required"});

    const ports = [
        {port: 8728, name: "mikrotik-api"},
        {port: 8291, name: "winbox"},
        {port: 80, name: "http"},
        {port: 443, name: "https"},
    ];

    const results = [];
    for (const p of ports) {
        const open = await tcpProbe(ip, p.port, 1200);
        results.push({port: p.port, name: p.name, open});
    }

    const isMikroTik = results.some(r => (r.port === 8728 || r.port === 8291) && r.open);

    res.json({
        ip,
        found: isMikroTik,
        ports: results,
        identity: isMikroTik ? `MikroTik-${ip.split(".").pop()}` : null,
    });
});

router.post("/test", async (req, res) => {
    console.log("SCAN TEST HIT, body:", req.body);
    const {ip, port = 8728, username, password} = req.body;

    if (!ip) return res.status(400).json({error: "IP wajib diisi"});
    if (!username) return res.status(400).json({error: "Username wajib diisi"});

    try {
        const result = await mikrotikLogin(ip, parseInt(port), username, password || "");
        if (result.success) {
            res.json({
                success: true,
                ip,
                port,
                identity: result.identity || "MikroTik",
                version: result.version || "",
                message: `Terhubung ke ${result.identity || "MikroTik"} (${ip})`,
            });
        } else {
            res.status(400).json({success: false, error: result.error || "Login gagal"});
        }
    } catch (err) {
        res.status(400).json({success: false, error: err.message || "Tidak bisa terhubung"});
    }
});

async function mikrotikLogin(host, port, username, password) {
    return new Promise((resolve) => {
        const conn = new RouterOSAPI({
            host,
            port,
            user: username,
            password: password || "",
            timeout: 10000,
        });

        conn.connect()
            .then(async () => {
                let identity = "MikroTik";
                let version = "";
                try {
                    const res = await conn.write("/system/identity/print");
                    identity = res[0]?.name || "MikroTik";
                } catch {}
                try {
                    const res = await conn.write("/system/resource/print");
                    version = res[0]?.version || "";
                } catch {}
                conn.close();
                resolve({success: true, identity, version});
            })
            .catch((err) => {
                let errorMsg = "Tidak bisa terhubung";
                const msg = err.message || "";
                if (msg.includes("ECONNREFUSED")) errorMsg = "Koneksi ditolak — cek IP dan port API";
                else if (msg.includes("ETIMEDOUT") || msg.includes("timeout")) errorMsg = "Timeout — MikroTik tidak merespons";
                else if (msg.includes("ENETUNREACH")) errorMsg = "Network unreachable";
                else if (msg.includes("invalid user") || msg.includes("wrong password") || msg.includes("login")) errorMsg = "Username atau password salah";
                else errorMsg = msg || "Tidak bisa terhubung";
                resolve({success: false, error: errorMsg});
            });
    });
}

function getCidrFromNetmask(netmask) {
    return netmask.split(".").reduce((acc, octet) => acc + parseInt(octet).toString(2).replace(/0/g, "").length, 0);
}

function getSubnet(ip, netmask) {
    const ipParts = ip.split(".").map(Number);
    const maskParts = netmask.split(".").map(Number);
    return ipParts.map((part, i) => part & maskParts[i]).join(".");
}

function cleanAdapterName(name) {
    if (name.toLowerCase().includes("wi-fi") || name.toLowerCase().includes("wireless")) return "Wi-Fi";
    if (name.toLowerCase().includes("ethernet")) return "Ethernet";
    if (name.toLowerCase().includes("vmware")) return "VMware";
    if (name.toLowerCase().includes("virtualbox")) return "VirtualBox";
    if (name.toLowerCase().includes("loopback")) return "Loopback";
    return name;
}

module.exports = router;