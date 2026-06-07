const axios = require("axios");
const https = require("https");

class RuijieDriver {
    constructor(device) {
        const proto = device.https ? "https" : "http";
        this.base = `${proto}://${device.host}:${device.port || 80}`;
        this.device = device;
        this.session = null;
        this.client = axios.create({
            baseURL: this.base,
            timeout: 8000,
            httpsAgent: new https.Agent({rejectUnauthorized: false}),
        });
    }

    async login() {
        const r = await this.client.post("/api/v1/login", {
            username: this.device.username,
            password: this.device.password,
        });
        this.session = r.data?.session || r.data?.token;
        return this.session;
    }

    async req(method, path, data) {
        if (!this.session) await this.login();
        const r = await this.client.request({
            method,
            url: path,
            data,
            headers: {"X-Session-Token": this.session},
        });
        return r.data?.data || r.data;
    }

    async testConnection() {
        await this.login();
        return true;
    }
    async getStats() {
        return this.req("GET", "/api/v1/hotspot/overview");
    }
    async getUsers() {
        return this.req("GET", "/api/v1/hotspot/users");
    }
    async addUser(data) {
        return this.req("POST", "/api/v1/hotspot/users", data);
    }
    async deleteUser(id) {
        return this.req("DELETE", `/api/v1/hotspot/users/${id}`);
    }
    async getProfiles() {
        return this.req("GET", "/api/v1/hotspot/profiles");
    }
    async addProfile(data) {
        return this.req("POST", "/api/v1/hotspot/profiles", data);
    }
    async updateProfile(id, data) {
        return this.req("PUT", `/api/v1/hotspot/profiles/${id}`, data);
    }
    async deleteProfile(id) {
        return this.req("DELETE", `/api/v1/hotspot/profiles/${id}`);
    }
    async getActive() {
        return this.req("GET", "/api/v1/hotspot/active");
    }
    async kickActive(id) {
        return this.req("DELETE", `/api/v1/hotspot/active/${id}`);
    }
}

module.exports = RuijieDriver;
