const express = require("express");
const router = express.Router();
const db = require("../db.js");

// ─── Helpers ───────────────────────────────────────────────────────────
function getAllSettings() {
    const rows = db.prepare("SELECT key, value FROM app_settings").all();
    const settings = {};
    rows.forEach(row => {
        try { settings[row.key] = JSON.parse(row.value); }
        catch { settings[row.key] = row.value; }
    });
    return settings;
}

function getSetting(key, defaultValue = "") {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key);
    if (!row) return defaultValue;
    try { return JSON.parse(row.value); }
    catch { return row.value; }
}

function setSetting(key, value) {
    const strValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    const exists = db.prepare("SELECT 1 FROM app_settings WHERE key = ?").get(key);
    if (exists) {
        db.prepare("UPDATE app_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?")
            .run(strValue, key);
    } else {
        db.prepare("INSERT INTO app_settings (key, value) VALUES (?, ?)").run(key, strValue);
    }
}

function buildSettingsResponse() {
    return {
        appName:      getSetting("app_name", ""),
        companyName:  getSetting("company_name", ""),
        address:      getSetting("app_address", ""),
        phone:        getSetting("app_phone", ""),
        footerText:   getSetting("voucher_footer", ""),
        showQrCode:   getSetting("show_qr", false),
        showLogo:     getSetting("show_logo", false),
        logoUrl:      getSetting("app_logo", ""),
        primaryColor: getSetting("primary_color", "#0ea5e9"),
        theme:        getSetting("app_theme", "dark"),
        printSize:    getSetting("print_size", "default"),
    };
}

// Frontend field → DB key mapping
const FIELD_MAP = {
    appName:      "app_name",
    companyName:  "company_name",
    address:      "app_address",
    phone:        "app_phone",
    footerText:   "voucher_footer",
    showQrCode:   "show_qr",
    showLogo:     "show_logo",
    logoUrl:      "app_logo",
    primaryColor: "primary_color",
    theme:        "app_theme",
    printSize:    "print_size",
};

// ─── GET /api/settings ─────────────────────────────────────────────────
router.get("/", (req, res) => {
    try {
        res.json(buildSettingsResponse());
    } catch (err) {
        console.error("[SETTINGS GET ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// ─── POST /api/settings ────────────────────────────────────────────────
router.post("/", (req, res) => {
    try {
        const body = req.body;

        // Validate logo size if base64 (max ~2MB = ~2.7MB base64)
        if (body.logoUrl && body.logoUrl.startsWith("data:")) {
            const sizeBytes = Math.ceil((body.logoUrl.length * 3) / 4);
            if (sizeBytes > 3 * 1024 * 1024) {
                return res.status(400).json({error: "Ukuran logo terlalu besar (maks 2MB)"});
            }
        }

        Object.entries(body).forEach(([key, value]) => {
            const dbKey = FIELD_MAP[key] || key;
            setSetting(dbKey, value);
        });

        res.json({success: true, settings: buildSettingsResponse()});
    } catch (err) {
        console.error("[SETTINGS SAVE ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// ─── POST /api/settings/logo ───────────────────────────────────────────
// Dedicated endpoint for logo upload (multipart optional, base64 body OK)
router.post("/logo", (req, res) => {
    try {
        const {logoUrl} = req.body;
        if (!logoUrl) return res.status(400).json({error: "logoUrl diperlukan"});

        // Validate it's a data URL or valid http URL
        const isDataUrl = logoUrl.startsWith("data:image/");
        const isHttpUrl = logoUrl.startsWith("http://") || logoUrl.startsWith("https://");
        if (!isDataUrl && !isHttpUrl) {
            return res.status(400).json({error: "Format logo tidak valid"});
        }

        if (isDataUrl) {
            const sizeBytes = Math.ceil((logoUrl.length * 3) / 4);
            if (sizeBytes > 3 * 1024 * 1024) {
                return res.status(400).json({error: "Ukuran logo terlalu besar (maks 2MB)"});
            }
        }

        setSetting("app_logo", logoUrl);
        res.json({success: true, logoUrl});
    } catch (err) {
        console.error("[LOGO UPLOAD ERROR]", err.message);
        res.status(500).json({error: err.message});
    }
});

// ─── DELETE /api/settings/logo ─────────────────────────────────────────
router.delete("/logo", (req, res) => {
    try {
        setSetting("app_logo", "");
        setSetting("show_logo", false);
        res.json({success: true});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;