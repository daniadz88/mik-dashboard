const dgram = require("dgram");
const net = require("net");
const os = require("os");

class MikroTikScanner {
    // Ambil SEMUA interface IPv4 non-internal
    getAllInterfaces() {
        const ifaces = os.networkInterfaces();
        const result = [];
        for (const name of Object.keys(ifaces)) {
            for (const iface of ifaces[name]) {
                if (iface.family === "IPv4" && !iface.internal) {
                    const parts = iface.address.split(".");
                    const base = parts.slice(0, 3).join(".");
                    result.push({
                        name,
                        address: iface.address,
                        netmask: iface.netmask,
                        base,
                        broadcast: `${base}.255`,
                        startIP: `${base}.1`,
                        endIP: `${base}.254`,
                        cidr: `${base}.0/24`,
                    });
                }
            }
        }
        return result;
    }

    async getLocalNetworkSuggestion() {
        const ifaces = this.getAllInterfaces();
        if (ifaces.length === 0) return null;
        // Prioritas: interface yang bukan 192.168.x.x VirtualBox/Docker
        const preferred =
            ifaces.find((i) => !i.name.toLowerCase().includes("vbox") && !i.name.toLowerCase().includes("docker")) ||
            ifaces[0];
        return {
            localIP: preferred.address,
            startIP: preferred.startIP,
            endIP: preferred.endIP,
            cidr: preferred.cidr,
            subnet: preferred.netmask,
            interface: preferred.name,
            allInterfaces: ifaces, // kirim semua biar frontend bisa pilih
        };
    }

    parseMNDP(buffer) {
        const device = {type: "mikrotik"};
        let offset = 4;
        while (offset + 4 <= buffer.length) {
            const type = buffer.readUInt16LE(offset);
            const len = buffer.readUInt16LE(offset + 2);
            offset += 4;
            if (offset + len > buffer.length) break;
            const value = buffer.slice(offset, offset + len);
            offset += len;
            switch (type) {
                case 1:
                    device.mac = Array.from(value)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(":");
                    break;
                case 5:
                    device.identity = value.toString("utf8").replace(/\0/g, "");
                    break;
                case 7:
                    device.version = value.toString("utf8").replace(/\0/g, "");
                    break;
                case 8:
                    device.platform = value.toString("utf8").replace(/\0/g, "");
                    break;
                case 10:
                    device.softwareId = value.toString("utf8").replace(/\0/g, "");
                    break;
                case 11:
                    device.board = value.toString("utf8").replace(/\0/g, "");
                    break;
            }
        }
        return device;
    }

    async discoverBroadcast(broadcastAddr = "255.255.255.255", timeout = 3000) {
        return new Promise((resolve) => {
            const devices = [];
            const socket = dgram.createSocket({type: "udp4", reuseAddr: true});
            socket.on("error", () => {
                try {
                    socket.close();
                } catch (_) {}
                resolve(devices);
            });
            socket.on("message", (msg, rinfo) => {
                if (msg.length < 4) return;
                try {
                    const device = this.parseMNDP(msg);
                    device.ip = rinfo.address;
                    device.discovered = "mndp";
                    if (!devices.find((d) => d.ip === rinfo.address)) devices.push(device);
                } catch (_) {}
            });
            socket.bind(0, () => {
                try {
                    socket.setBroadcast(true);
                    const packet = Buffer.alloc(4, 0);
                    socket.send(packet, 5678, broadcastAddr);
                } catch (e) {
                    socket.close();
                    resolve(devices);
                }
            });
            setTimeout(() => {
                try {
                    socket.close();
                } catch (_) {}
                resolve(devices);
            }, timeout);
        });
    }

    checkPort(ip, port, timeout = 800) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            let done = false;
            const finish = (r) => {
                if (done) return;
                done = true;
                socket.destroy();
                resolve(r);
            };
            socket.setTimeout(timeout);
            socket.on("connect", () => finish(true));
            socket.on("timeout", () => finish(false));
            socket.on("error", () => finish(false));
            socket.connect(port, ip);
        });
    }

    async probeIP(ip, timeout = 1000) {
        const ports = [
            {port: 8291, service: "winbox"},
            {port: 8728, service: "api"},
            {port: 80, service: "http"},
            {port: 443, service: "https"},
        ];
        const results = await Promise.all(
            ports.map((p) => this.checkPort(ip, p.port, timeout).then((ok) => (ok ? p : null)))
        );
        const found = results.find(Boolean);
        if (!found) return null;
        return {ip, port: found.port, service: found.service, type: "mikrotik", discovered: "tcp"};
    }

    async scanRange(startIP, endIP, timeout = 5000) {
        const start = this.ipToNum(startIP);
        const end = this.ipToNum(endIP);
        if (end < start) throw new Error("endIP harus lebih besar dari startIP");
        if (end - start > 255) throw new Error("Maksimal 256 IP per scan");

        const devices = new Map();

        // MNDP broadcast ke subnet yang di-scan
        const bcast = startIP.split(".").slice(0, 3).join(".") + ".255";
        try {
            const mndpResult = await this.discoverBroadcast(bcast, Math.min(timeout * 0.5, 2500));
            for (const dev of mndpResult) {
                const n = this.ipToNum(dev.ip);
                if (n >= start && n <= end) devices.set(dev.ip, dev);
            }
        } catch (_) {}

        // TCP probe sisa IP
        const BATCH = 30;
        const probeTimeout = Math.max(600, Math.floor(timeout / 5));
        for (let i = start; i <= end; i += BATCH) {
            const batch = [];
            for (let j = i; j < Math.min(i + BATCH, end + 1); j++) {
                const ip = this.numToIp(j);
                if (!devices.has(ip)) batch.push(this.probeIP(ip, probeTimeout));
            }
            const results = await Promise.all(batch);
            for (const r of results) {
                if (r) devices.set(r.ip, r);
            }
        }

        return Array.from(devices.values());
    }

    async scanCIDR(cidr, timeout = 5000) {
        const [baseIP, prefixStr] = cidr.split("/");
        const prefix = parseInt(prefixStr);
        if (isNaN(prefix) || prefix < 24 || prefix > 32) throw new Error("CIDR harus antara /24 dan /32");
        const base = this.ipToNum(baseIP);
        const mask = ~((1 << (32 - prefix)) - 1) >>> 0;
        const network = (base & mask) >>> 0;
        const broadcast = (network | (~mask >>> 0)) >>> 0;
        return this.scanRange(this.numToIp(network + 1), this.numToIp(broadcast - 1), timeout);
    }

    ipToNum(ip) {
        return ip.split(".").reduce((acc, o) => (acc << 8) + parseInt(o), 0) >>> 0;
    }
    numToIp(num) {
        return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join(".");
    }
}

module.exports = MikroTikScanner;
