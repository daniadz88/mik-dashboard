const router = require("express").Router({mergeParams: true});
const auth = require("../middleware/auth");
const {getDriver} = require("../drivers");
const db = require("../db.js");

function getDevice(req, res) {
    const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(req.params.id);
    if (!device) {
        res.status(404).json({error: "Device tidak ditemukan"});
        return null;
    }
    return device;
}

// ============== STATS ==============
router.get("/stats", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const stats = await driver.getStats();
        res.json(stats);
    } catch (e) {
        console.error(`[HOTSPOT STATS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({
            error: "Gagal mengambil statistik",
            detail: e.message,
            hint: "Pastikan MikroTik API aktif (port 8728/8729) dan kredensial benar",
        });
    }
});

// ============== ACTIVE USERS ==============
router.get("/active", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const active = await driver.getActive();
        res.json(active);
    } catch (e) {
        console.error(`[HOTSPOT ACTIVE ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil pengguna aktif", detail: e.message});
    }
});

router.delete("/active/:uid", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.kickActive(req.params.uid);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT KICK ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal kick pengguna", detail: e.message});
    }
});

// ============== HOTSPOT USERS ==============
router.get("/users", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const users = await driver.getUsers();
        res.json(users);
    } catch (e) {
        console.error(`[HOTSPOT USERS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil daftar user", detail: e.message});
    }
});

router.post("/users", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.addUser(req.body);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT ADD USER ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal menambah user", detail: e.message});
    }
});

router.patch("/users/:uid", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.updateUser(req.params.uid, req.body);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT UPDATE USER ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal update user", detail: e.message});
    }
});

router.delete("/users/:uid", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.deleteUser(req.params.uid);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT DELETE USER ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal menghapus user", detail: e.message});
    }
});

// ============== PROFILES ==============
router.get("/profiles", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const profiles = await driver.getProfiles();
        res.json(profiles);
    } catch (e) {
        console.error(`[HOTSPOT PROFILES ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil profil", detail: e.message});
    }
});

router.post("/profiles", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.addProfile(req.body);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT ADD PROFILE ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal menambah profil", detail: e.message});
    }
});

router.put("/profiles/:uid", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.updateProfile(req.params.uid, req.body);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT UPDATE PROFILE ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal update profil", detail: e.message});
    }
});

router.delete("/profiles/:uid", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const result = await driver.deleteProfile(req.params.uid);
        res.json(result);
    } catch (e) {
        console.error(`[HOTSPOT DELETE PROFILE ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal menghapus profil", detail: e.message});
    }
});

// ============== VOUCHERS ==============
router.get("/vouchers", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;
    try {
        const driver = getDriver(device);
        const vouchers = await driver.getVouchers();
        res.json(vouchers);
    } catch (e) {
        console.error(`[VOUCHERS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil vouchers", detail: e.message});
    }
});

router.post("/vouchers/generate", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;
    try {
        const driver = getDriver(device);
        const result = await driver.generateVouchers(req.body, req.user?.id || null);
        res.json(result);
    } catch (e) {
        console.error(`[GENERATE VOUCHERS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal generate vouchers", detail: e.message});
    }
});

router.patch("/vouchers/:voucherId", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;
    try {
        const driver = getDriver(device);
        const result = await driver.updateVoucher(req.params.voucherId, req.body);
        res.json(result);
    } catch (e) {
        console.error(`[UPDATE VOUCHER ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal update voucher", detail: e.message});
    }
});

router.delete("/vouchers/:voucherId", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;
    try {
        const driver = getDriver(device);
        const result = await driver.deleteVoucher(req.params.voucherId);
        res.json(result);
    } catch (e) {
        console.error(`[DELETE VOUCHER ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal hapus voucher", detail: e.message});
    }
});

// ============== LOGS ==============
router.get("/logs", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const logs = await driver.getLogs();
        res.json(logs);
    } catch (e) {
        console.error(`[LOGS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil logs", detail: e.message});
    }
});

// ============== INTERFACES ==============
router.get("/interfaces", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const interfaces = await driver.getInterfaces();
        res.json(interfaces);
    } catch (e) {
        console.error(`[INTERFACES ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil interfaces", detail: e.message});
    }
});

// ============== DHCP LEASES ==============
router.get("/dhcp-leases", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const leases = await driver.getDhcpLeases();
        res.json(leases);
    } catch (e) {
        console.error(`[DHCP LEASES ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil DHCP leases", detail: e.message});
    }
});

// ============== WIRELESS ==============
router.get("/wireless", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const regs = await driver.getWirelessRegistrations();
        res.json(regs);
    } catch (e) {
        console.error(`[WIRELESS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil wireless registrations", detail: e.message});
    }
});

// ============== ROUTES ==============
router.get("/routes", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const routes = await driver.getRoutes();
        res.json(routes);
    } catch (e) {
        console.error(`[ROUTES ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil routes", detail: e.message});
    }
});

// ============== FIREWALL ==============
router.get("/firewall-rules", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const rules = await driver.getFirewallRules();
        res.json(rules);
    } catch (e) {
        console.error(`[FIREWALL RULES ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil firewall rules", detail: e.message});
    }
});

router.get("/firewall-connections", auth, async (req, res) => {
    const device = getDevice(req, res);
    if (!device) return;

    try {
        const driver = getDriver(device);
        const conns = await driver.getFirewallConnections();
        res.json(conns);
    } catch (e) {
        console.error(`[FIREWALL CONNS ERROR] Device ${req.params.id}:`, e.message);
        res.status(500).json({error: "Gagal mengambil firewall connections", detail: e.message});
    }
});

module.exports = router;