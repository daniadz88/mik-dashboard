const axios = require("axios");
const https = require("https");

class TPLinkDriver {
    constructor(device) {
        const proto = device.https ? "https" : "http";
        this.base = `${proto}://${device.host}:${device.port || 8088}`;
        this.device = device;
        this.token = null;
        this.client = axios.create({
            baseURL: this.base,
            timeout: 8000,
            httpsAgent: new https.Agent({rejectUnauthorized: false}),
        });
    }

    async login() {
        const r = await this.client.post("/api/v2/hotspot/login", {
            username: this.device.username,
            password: this.device.password,
        });
        this.token = r.data?.result?.token;
        return this.token;
    }

    async req(method, path, data) {
        if (!this.token) await this.login();
        const r = await this.client.request({
            method,
            url: path,
            data,
            headers: {Authorization: `Bearer ${this.token}`},
        });
        return r.data?.result || r.data;
    }

    async testConnection() {
        await this.login();
        return true;
    }
    async getStats() {
        return this.req("GET", "/api/v2/hotspot/status");
    }
    async getUsers() {
        return this.req("GET", "/api/v2/hotspot/users");
    }
    async addUser(data) {
        return this.req("POST", "/api/v2/hotspot/users", data);
    }
    async deleteUser(id) {
        return this.req("DELETE", `/api/v2/hotspot/users/${id}`);
    }
    async getProfiles() {
        return this.req("GET", "/api/v2/hotspot/profiles");
    }
    async addProfile(data) {
        return this.req("POST", "/api/v2/hotspot/profiles", data);
    }
    async updateProfile(id, data) {
        return this.req("PUT", `/api/v2/hotspot/profiles/${id}`, data);
    }
    async deleteProfile(id) {
        return this.req("DELETE", `/api/v2/hotspot/profiles/${id}`);
    }
    async getActive() {
        return this.req("GET", "/api/v2/hotspot/active");
    }
    async kickActive(id) {
        return this.req("DELETE", `/api/v2/hotspot/active/${id}`);
    }
}

module.exports = TPLinkDriver;
