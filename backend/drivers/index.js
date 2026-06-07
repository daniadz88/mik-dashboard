const MikroTikDriver = require("./mikrotik");
const db = require("../db.js");

function getDeviceFromDb(deviceId) {
    return db.prepare("SELECT * FROM devices WHERE id = ?").get(deviceId);
}

function getDriver(deviceOrId) {
    let device;
    if (typeof deviceOrId === "number" || typeof deviceOrId === "string") {
        device = getDeviceFromDb(deviceOrId);
        if (!device) throw new Error("Device tidak ditemukan di database");
    } else {
        device = deviceOrId;
    }
    const type = (device.type || "mikrotik").toLowerCase();
    switch (type) {
        case "mikrotik":
        default:
            return new MikroTikDriver(device);
    }
}

module.exports = { getDriver, MikroTikDriver };