const axios = require("axios");

class OpenWRTDriver {
    constructor(device) {
        const proto = device.https ? "https" : "http";
        this.base = `${proto}://${device.host}:${device.port || 80}`;
        this.device = device;
        this.authToken = null;
        this.client = axios.create({baseURL: this.base, timeout: 8000});
    }

    async login() {
        const r = await this.client.post("/cgi-bin/luci/rpc/auth", {
            id: 1,
            method: "login",
            params: [this.device.username, this.device.password],
        });
        this.authToken = r.data?.result;
        return this.authToken;
    }

    async rpc(service, method, params = {}) {
        if (!this.authToken) await this.login();
        const r = await this.client.post(`/cgi-bin/luci/rpc/${service}?auth=${this.authToken}`, {
            id: 1,
            method,
            params,
        });
        return r.data?.result;
    }

    async testConnection() {
        await this.login();
        return !!this.authToken;
    }

    async getStats() {
        const info = await this.rpc("sys", "exec", {cmd: "cat /proc/uptime"});
        return {uptime: info, activeUsers: 0};
    }

    async getUsers() {
        return this.rpc("sys", "exec", {cmd: "chilli_query listusers"}).then((r) => r || []);
    }
    async addUser(data) {
        return {ok: true, note: "Gunakan RADIUS untuk user management di OpenWRT"};
    }
    async deleteUser(id) {
        return this.rpc("sys", "exec", {cmd: `chilli_query logout ${id}`});
    }
    async getProfiles() {
        return [];
    }
    async addProfile(data) {
        return {ok: true};
    }
    async updateProfile(id, data) {
        return {ok: true};
    }
    async deleteProfile(id) {
        return {ok: true};
    }
    async getActive() {
        return this.rpc("sys", "exec", {cmd: "chilli_query listusers"}).then((r) => r || []);
    }
    async kickActive(id) {
        return this.rpc("sys", "exec", {cmd: `chilli_query logout ${id}`});
    }
}

module.exports = OpenWRTDriver;
