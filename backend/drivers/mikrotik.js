const {RouterOSAPI} = require("node-routeros");
const db = require("../db.js");

class MikroTikDriver {
    constructor(device) {
        this.device = device;

        let port = parseInt(device.port);
        if (!port || port === 80 || port === 443) port = 8728;

        const isHttps = device.https === 1 || device.https === true || device.https === "1";
        if (isHttps && port === 8728) port = 8729;

        this.config = {
            host: device.host,
            user: device.username,
            password: device.password || "",
            port: port,
            timeout: 15,
        };

        if (isHttps) this.config.tls = { rejectUnauthorized: false };

        console.log(`[MikroTikDriver] Konek ke ${device.host}:${port} (HTTPS: ${isHttps})`);
    }

    async connect() {
        try {
            const conn = new RouterOSAPI(this.config);
            await conn.connect();
            return conn;
        } catch (err) {
            throw new Error(`Gagal konek ke ${this.device.host}:${this.config.port} — ${err.message}`);
        }
    }

    async getStats() {
        const conn = await this.connect();
        try {
            const [identity, resource, active, users, servers] = await Promise.all([
                conn.write("/system/identity/print").catch(() => [{name: "-"}]),
                conn.write("/system/resource/print").catch(() => [{}]),
                conn.write("/ip/hotspot/active/print").catch(() => []),
                conn.write("/ip/hotspot/user/print", ["=.proplist=.id"]).catch(() => []),
                conn.write("/ip/hotspot/print", ["=.proplist=.id"]).catch(() => []),
            ]);
            let filterCount = 0, natCount = 0, mangleCount = 0, connCount = 0;
            try { filterCount = (await conn.write("/ip/firewall/filter/print", ["=.proplist=.id"])).length; } catch {}
            try { natCount = (await conn.write("/ip/firewall/nat/print", ["=.proplist=.id"])).length; } catch {}
            try { mangleCount = (await conn.write("/ip/firewall/mangle/print", ["=.proplist=.id"])).length; } catch {}
            try { connCount = (await conn.write("/ip/firewall/connection/print", ["=.proplist=.id"])).length; } catch {}
            const res = resource[0] || {};
            return {
                deviceId: this.device.id,
                name: identity[0]?.name ?? "-",
                timestamp: new Date().toISOString(),
                totalUsers: users.length,
                activeUsers: active.length,
                totalServers: servers.length,
                uptime: res.uptime || "0d 0h 0m",
                cpu: parseFloat(res["cpu-load"]) || 0,
                memory: { total: res["total-memory"] || "0", free: res["free-memory"] || "0" },
                hdd: { total: res["total-hdd-space"] || "0", free: res["free-hdd-space"] || "0" },
                board: res["board-name"] || "",
                version: res.version || "",
                architecture: res["architecture-name"] || res.architecture || "",
                cpuCount: parseInt(res["cpu-count"]) || 1,
                firewall: { filterRules: filterCount, natRules: natCount, mangleRules: mangleCount, connections: connCount },
            };
        } finally { conn.close(); }
    }

    async getActive() {
        const conn = await this.connect();
        try {
            const active = await conn.write("/ip/hotspot/active/print");
            return (Array.isArray(active) ? active : []).map((a) => ({
                id: a[".id"], user: a.user || "", address: a.address || "",
                macAddress: a["mac-address"] || "", loginBy: a["login-by"] || "",
                uptime: a.uptime || "00:00:00", bytesIn: a["bytes-in"] || "0", bytesOut: a["bytes-out"] || "0",
            }));
        } finally { conn.close(); }
    }

    async kickActive(id) {
        const conn = await this.connect();
        try {
            await conn.write("/ip/hotspot/active/remove", [`=.id=${id}`]);
            return {success: true};
        } finally { conn.close(); }
    }

    async getUsers() {
        const conn = await this.connect();
        try {
            const users = await conn.write("/ip/hotspot/user/print");
            return (Array.isArray(users) ? users : []).map((u) => ({
                id: u[".id"], username: u.name || "", password: u.password || "",
                profile: u.profile || "default", server: u.server || "", comment: u.comment || "",
                macAddress: u["mac-address"] || "", uptime: u.uptime || "00:00:00",
                bytesIn: u["bytes-in"] || "0", bytesOut: u["bytes-out"] || "0",
                disabled: u.disabled === "true", timeLimit: u["limit-uptime"] || "", dataLimit: u["limit-bytes-total"] || "",
            }));
        } finally { conn.close(); }
    }

    async addUser(data) {
        const conn = await this.connect();
        try {
            const p = [];
            if (data.name || data.username) p.push(`=name=${data.name || data.username}`);
            if (data.password) p.push(`=password=${data.password}`);
            if (data.profile) p.push(`=profile=${data.profile}`);
            if (data.server) p.push(`=server=${data.server}`);
            if (data.comment) p.push(`=comment=${data.comment}`);
            if (data["time-limit"]) p.push(`=limit-uptime=${data["time-limit"]}`);
            if (data["data-limit"]) p.push(`=limit-bytes-total=${data["data-limit"]}`);
            if (data["shared-users"]) p.push(`=shared-users=${data["shared-users"]}`);
            if (data.disabled !== undefined) p.push(`=disabled=${data.disabled ? "yes" : "no"}`);
            const result = await conn.write("/ip/hotspot/user/add", p);
            return {success: true, id: result};
        } finally { conn.close(); }
    }

    async updateUser(uid, data) {
        const conn = await this.connect();
        try {
            const p = [`=.id=${uid}`];
            if (data.name !== undefined) p.push(`=name=${data.name}`);
            if (data.password !== undefined) p.push(`=password=${data.password}`);
            if (data.profile !== undefined) p.push(`=profile=${data.profile}`);
            if (data.comment !== undefined) p.push(`=comment=${data.comment}`);
            if (data.disabled !== undefined) p.push(`=disabled=${data.disabled ? "yes" : "no"}`);
            if (data["time-limit"] !== undefined) p.push(`=limit-uptime=${data["time-limit"]}`);
            if (data["data-limit"] !== undefined) p.push(`=limit-bytes-total=${data["data-limit"]}`);
            if (data["shared-users"] !== undefined) p.push(`=shared-users=${data["shared-users"]}`);
            await conn.write("/ip/hotspot/user/set", p);
            return {success: true};
        } finally { conn.close(); }
    }

    async deleteUser(uid) {
        const conn = await this.connect();
        try {
            await conn.write("/ip/hotspot/user/remove", [`=.id=${uid}`]);
            return {success: true};
        } finally { conn.close(); }
    }

    async getProfiles() {
        const conn = await this.connect();
        try {
            const profiles = await conn.write("/ip/hotspot/user/profile/print");
            return (Array.isArray(profiles) ? profiles : []).map((p) => ({
                id: p[".id"], name: p.name || "", sharedUsers: p["shared-users"] || "",
                rateLimit: p["rate-limit"] || "", sessionTimeout: p["session-timeout"] || "",
                idleTimeout: p["idle-timeout"] || "", keepaliveTimeout: p["keepalive-timeout"] || "",
                addressPool: p["address-pool"] || "", disabled: p.disabled === "true",
            }));
        } finally { conn.close(); }
    }

    async addProfile(data) {
        const conn = await this.connect();
        try {
            const p = [];
            if (data.name) p.push(`=name=${data.name}`);
            if (data["shared-users"]) p.push(`=shared-users=${data["shared-users"]}`);
            if (data["rate-limit"]) p.push(`=rate-limit=${data["rate-limit"]}`);
            if (data["session-timeout"]) p.push(`=session-timeout=${data["session-timeout"]}`);
            if (data["idle-timeout"]) p.push(`=idle-timeout=${data["idle-timeout"]}`);
            if (data["keepalive-timeout"]) p.push(`=keepalive-timeout=${data["keepalive-timeout"]}`);
            if (data["address-pool"]) p.push(`=address-pool=${data["address-pool"]}`);
            if (data.disabled !== undefined) p.push(`=disabled=${data.disabled ? "yes" : "no"}`);
            const result = await conn.write("/ip/hotspot/user/profile/add", p);
            return {success: true, id: result};
        } finally { conn.close(); }
    }

    async updateProfile(uid, data) {
        const conn = await this.connect();
        try {
            const p = [`=.id=${uid}`];
            Object.entries(data).forEach(([k, v]) => {
                if (k === "id" || v === undefined || v === null || v === "") return;
                p.push(k === "disabled" ? `=disabled=${v ? "yes" : "no"}` : `=${k}=${v}`);
            });
            await conn.write("/ip/hotspot/user/profile/set", p);
            return {success: true};
        } finally { conn.close(); }
    }

    async deleteProfile(uid) {
        const conn = await this.connect();
        try {
            await conn.write("/ip/hotspot/user/profile/remove", [`=.id=${uid}`]);
            return {success: true};
        } finally { conn.close(); }
    }

    async getVouchers() {
        return db.prepare("SELECT * FROM vouchers ORDER BY created_at DESC").all();
    }

    async generateVouchers(data, createdBy = null) {
        const {count = 1, profile = "default", prefix = "", length = 6, duration = "", price = 0} = data;
        const generated = [];
        for (let i = 0; i < count; i++) {
            const code = prefix + _randomCode(length);
            const password = _randomCode(4);
            try {
                db.prepare(
                    `INSERT INTO vouchers (code, username, password, profile, duration, price, status, printed, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).run(code, code, password, profile, duration, price, "unused", 0, createdBy);
                generated.push({code, username: code, password, profile, duration, price, status: "unused"});
            } catch { i--; }
        }
        return {success: true, generated};
    }

    async updateVoucher(id, data) {
        const fields = [], values = [];
        if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
        if (data.printed !== undefined) { fields.push("printed = ?"); values.push(data.printed ? 1 : 0); }
        if (data.used_at !== undefined) { fields.push("used_at = ?"); values.push(data.used_at); }
        if (fields.length === 0) return {success: true};
        values.push(id);
        db.prepare(`UPDATE vouchers SET ${fields.join(", ")} WHERE id = ?`).run(...values);
        return {success: true};
    }

    async deleteVoucher(id) {
        db.prepare("DELETE FROM vouchers WHERE id = ?").run(id);
        return {success: true};
    }

    async getLogs() {
        const conn = await this.connect();
        try {
            const logs = await conn.write("/log/print");
            return (Array.isArray(logs) ? logs : []).map((l) => ({
                id: l[".id"], time: l.time || "", topics: l.topics || "", message: l.message || "",
            }));
        } finally { conn.close(); }
    }

    async getInterfaces() {
        const conn = await this.connect();
        try {
            const list = await conn.write("/interface/print");
            return (Array.isArray(list) ? list : []).map((i) => ({
                id: i[".id"], name: i.name || "", type: i.type || "",
                macAddress: i["mac-address"] || "", running: i.running === "true",
                disabled: i.disabled === "true", rxBytes: i["rx-byte"] || "0", txBytes: i["tx-byte"] || "0",
            }));
        } finally { conn.close(); }
    }

    async getDhcpLeases() {
        const conn = await this.connect();
        try {
            const leases = await conn.write("/ip/dhcp-server/lease/print");
            return (Array.isArray(leases) ? leases : []).map((l) => ({
                id: l[".id"], address: l.address || "", macAddress: l["mac-address"] || "",
                hostname: l["host-name"] || "", server: l.server || "", status: l.status || "",
                dynamic: l.dynamic === "true", disabled: l.disabled === "true",
            }));
        } finally { conn.close(); }
    }

    async getWirelessRegistrations() {
        const conn = await this.connect();
        try {
            const regs = await conn.write("/interface/wireless/registration-table/print");
            return (Array.isArray(regs) ? regs : []).map((r) => ({
                id: r[".id"], interface: r.interface || "", macAddress: r["mac-address"] || "",
                uptime: r.uptime || "", signal: r.signal || "", rxRate: r["rx-rate"] || "", txRate: r["tx-rate"] || "",
            }));
        } finally { conn.close(); }
    }

    async getRoutes() {
        const conn = await this.connect();
        try {
            const routes = await conn.write("/ip/route/print");
            return (Array.isArray(routes) ? routes : []).map((r) => ({
                id: r[".id"], dstAddress: r["dst-address"] || "", gateway: r.gateway || "",
                distance: r.distance || "", active: r.active === "true", dynamic: r.dynamic === "true",
                disabled: r.disabled === "true",
            }));
        } finally { conn.close(); }
    }

    async getFirewallRules() {
        const conn = await this.connect();
        try {
            let filterRules = [], natRules = [], mangleRules = [], connCount = 0;
            try { filterRules = await conn.write("/ip/firewall/filter/print"); } catch {}
            try { natRules = await conn.write("/ip/firewall/nat/print"); } catch {}
            try { mangleRules = await conn.write("/ip/firewall/mangle/print"); } catch {}
            try { connCount = (await conn.write("/ip/firewall/connection/print", ["=.proplist=.id"])).length; } catch {}
            return {
                filterRules: filterRules.length, natRules: natRules.length,
                mangleRules: mangleRules.length, connections: connCount,
                filterDetail: filterRules.map((r) => ({
                    id: r[".id"], chain: r.chain || "", action: r.action || "",
                    protocol: r.protocol || "", srcAddress: r["src-address"] || "",
                    dstAddress: r["dst-address"] || "", disabled: r.disabled === "true",
                    comment: r.comment || "", packets: r.packets || "0", bytes: r.bytes || "0",
                })),
            };
        } finally { conn.close(); }
    }

    async getFirewallConnections() {
        const conn = await this.connect();
        try {
            const conns = await conn.write("/ip/firewall/connection/print", ["=.proplist=.id"]);
            return {count: Array.isArray(conns) ? conns.length : 0};
        } finally { conn.close(); }
    }

    _formatBytes(bytes) {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024, sizes = ["B","KB","MB","GB","TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
}

function _randomCode(length) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let r = "";
    for (let i = 0; i < length; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return r;
}

module.exports = MikroTikDriver;