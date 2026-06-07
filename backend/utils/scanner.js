const dgram = require("dgram");
const os = require("os");

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}

function getNetworkRange(ip) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

async function scanNetwork(timeout = 3000) {
    return new Promise((resolve) => {
        const devices = [];
        const localIP = getLocalIP();
        const subnet = getNetworkRange(localIP);
        const scanPromises = [];

        for (let i = 1; i <= 254; i++) {
            const targetIP = `${subnet}.${i}`;
            scanPromises.push(scanMikroTik(targetIP, timeout / 254).catch(() => null));
        }

        setTimeout(() => resolve(devices), timeout);
        Promise.all(scanPromises).then((results) => {
            results.forEach((r) => r && devices.push(r));
        });
    });
}

async function scanMikroTik(ip, timeout = 100) {
    return new Promise((resolve, reject) => {
        const socket = dgram.createSocket("udp4");
        socket.setTimeout(timeout);

        const buffer = Buffer.from([0, 0]);

        socket.on("message", (msg) => {
            socket.close();
            const data = parseWinBoxMsg(msg);
            if (data) {
                resolve({
                    ip,
                    mac: data.mac || "unknown",
                    model: data.model || "MikroTik",
                    version: data.version || "unknown",
                });
            } else {
                reject();
            }
        });

        socket.on("error", () => reject());
        socket.on("timeout", () => {
            socket.close();
            reject();
        });

        try {
            socket.send(buffer, 0, buffer.length, 5678, ip);
        } catch (e) {
            reject();
        }
    });
}

function parseWinBoxMsg(buffer) {
    try {
        const str = buffer.toString("utf8", 0, Math.min(buffer.length, 100));
        if (str.includes("MikroTik")) {
            return {model: "MikroTik", version: "unknown"};
        }
        return null;
    } catch {
        return null;
    }
}

async function discoverMikroTik(subnet = null) {
    if (!subnet) {
        const localIP = getLocalIP();
        subnet = getNetworkRange(localIP);
    }

    const devices = [];
    const scanPromises = [];

    for (let i = 1; i <= 254; i++) {
        const targetIP = `${subnet}.${i}`;
        scanPromises.push(
            (async () => {
                try {
                    const result = await scanMikroTik(targetIP, 50);
                    return result;
                } catch {
                    return null;
                }
            })()
        );
    }

    const results = await Promise.race([
        Promise.all(scanPromises),
        new Promise((resolve) => setTimeout(() => resolve([]), 5000)),
    ]);

    return results.filter((r) => r !== null);
}

module.exports = {discoverMikroTik, scanMikroTik, getLocalIP, getNetworkRange};
