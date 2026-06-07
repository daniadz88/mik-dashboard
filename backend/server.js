require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const {spawn, exec} = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const app = express();
app.use(cors());
app.use(express.json({limit: "10mb"}));

require("./db.js");

const processes = new Map();

// ==========================================
// API Routes
// ==========================================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/app-users", require("./routes/appUsers"));
app.use("/api/scan", require("./routes/scan"));
app.use("/api/settings", require("./routes/settings"));

// PENTING: hotspot SEBELUM devices agar tidak tertangkap router devices
app.use("/api/devices/:id/hotspot", require("./routes/hotspot"));
app.use("/api/devices", require("./routes/devices"));

app.get("/api/health", (req, res) => res.json({ok: true, time: new Date()}));

// ==========================================
// BUILD & DEV ENDPOINTS
// ==========================================

function getFrontendPath() {
    return path.resolve(__dirname, "../frontend");
}

function getNpmPath() {
    const possiblePaths = [
        "npm.cmd",
        "npm",
        path.join(process.env.APPDATA || "", "npm/npm.cmd"),
        path.join(process.env.ProgramFiles || "", "nodejs/npm.cmd"),
        path.join(process.env.LOCALAPPDATA || "", "Programs/nodejs/npm.cmd"),
        "C:\\Program Files\\nodejs\\npm.cmd",
        "C:\\Program Files (x86)\\nodejs\\npm.cmd",
    ];

    for (const npmPath of possiblePaths) {
        try {
            require("child_process").execSync(`"${npmPath}" --version`, {stdio: "pipe"});
            console.log("[NPM] Found:", npmPath);
            return npmPath;
        } catch (e) {
            continue;
        }
    }
    return "npm.cmd";
}

app.post("/api/build", async (req, res) => {
    if (processes.has("build")) {
        return res.json({message: "Build sedang berjalan...", status: "building"});
    }

    const frontendPath = getFrontendPath();
    const npmPath = getNpmPath();
    const packageJsonPath = path.join(frontendPath, "package.json");

    if (!fs.existsSync(packageJsonPath)) {
        return res.status(500).json({
            error: "package.json tidak ditemukan",
            detail: "Cek path: " + packageJsonPath,
        });
    }

    try {
        res.json({message: "Build dimulai", status: "started"});

        console.log("[BUILD] Memulai build frontend...");
        const isWindows = process.platform === "win32";
        let buildProcess;

        if (isWindows) {
            const cmdCommand = `cd /d "${frontendPath}" && "${npmPath}" run build`;
            buildProcess = spawn("cmd.exe", ["/c", cmdCommand], {
                shell: false,
                stdio: "pipe",
                windowsHide: true,
                env: {...process.env, PATH: process.env.PATH},
            });
        } else {
            buildProcess = spawn(npmPath, ["run", "build"], {
                cwd: frontendPath,
                shell: true,
                stdio: "pipe",
            });
        }

        processes.set("build", buildProcess);

        buildProcess.stdout.on("data", (data) => console.log("[BUILD]", data.toString().trim()));
        buildProcess.stderr.on("data", (data) => console.error("[BUILD ERR]", data.toString().trim()));

        buildProcess.on("close", (code) => {
            processes.delete("build");
            console.log(`[BUILD] Selesai dengan code: ${code}`);
            if (code === 0) {
                const distPath = path.join(frontendPath, "dist", "index.html");
                if (fs.existsSync(distPath)) {
                    console.log("[BUILD] ✅ Build berhasil! Restart server dalam 3 detik...");
                    setTimeout(() => restartServer(), 3000);
                }
            }
        });
    } catch (e) {
        res.status(500).json({error: "Gagal memulai build", detail: e.message});
    }
});

app.get("/api/build/status", (req, res) => {
    const frontendPath = getFrontendPath();
    const distPath = path.join(frontendPath, "dist", "index.html");
    res.json({
        distExists: fs.existsSync(distPath),
        isBuilding: processes.has("build"),
        isDevRunning: processes.has("dev"),
        timestamp: new Date().toISOString(),
    });
});

app.post("/api/dev", (req, res) => {
    if (processes.has("dev")) {
        return res.json({message: "Dev server sudah berjalan", url: "http://localhost:5173", status: "running"});
    }
    res.json({message: "Dev server dimulai", url: "http://localhost:5173", status: "started"});
});

// ==========================================
// STATIC FILES
// ==========================================

let isProduction = false;

function serveStaticOrLanding() {
    const frontendPath = getFrontendPath();
    const distPath = path.join(frontendPath, "dist");
    const indexPath = path.join(distPath, "index.html");

    if (fs.existsSync(indexPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            if (req.path.startsWith("/api")) {
                return res.status(404).json({error: "API endpoint tidak ditemukan"});
            }
            res.sendFile(indexPath);
        });
        isProduction = true;
        console.log("[MODE] ✅ Production - Serving static frontend");
        return true;
    } else {
        app.get("/", (req, res) => res.send(landingPageHTML()));
        console.log("[MODE] ⚠️ Setup Mode - Frontend belum di-build");
        return false;
    }
}

function restartServer() {
    const dev = processes.get("dev");
    if (dev) {
        if (process.platform === "win32") exec(`taskkill /pid ${dev.pid} /T /F`);
        else dev.kill("SIGTERM");
        processes.delete("dev");
    }
    console.log("[RESTART] Server perlu direstart manual atau gunakan pm2");
}

function landingPageHTML() {
    return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><title>MIK Dashboard - Setup</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.container{max-width:520px;text-align:center;padding:20px}
.card{background:#1e293b;border:1px solid #334155;border-radius:24px;padding:40px}
h1{margin:0 0 8px;font-size:24px}.status{color:#10b981;background:#10b98118;padding:6px 16px;border-radius:20px;display:inline-block;font-size:13px;font-weight:700;margin-bottom:20px}
.btn{background:#06b6d4;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;margin:8px}
.btn:hover{opacity:.9}</style></head>
<body><div class="container"><div class="card"><h1>📡 MIK Dashboard</h1><div class="status">● Backend Online</div>
<p style="color:#94a3b8">Frontend belum di-build. Jalankan <code>npm run build</code> di folder frontend.</p>
<button class="btn" onclick="fetch('/api/build',{method:'POST'}).then(()=>alert('Build dimulai!'))">🔄 Auto Build</button>
</div></div></body></html>`;
}

serveStaticOrLanding();

// Global error handler
app.use((err, req, res, next) => {
    console.error("[ERROR]", err.stack || err.message);
    if (req.path.startsWith("/api")) {
        return res.status(err.status || 500).json({error: err.message || "Server error"});
    }
    res.status(500).send("Server Error");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`
========================================
    MIK Dashboard Server
========================================
API:      http://localhost:${PORT}/api
Web:      http://localhost:${PORT}
Login:    admin / admin123
Mode:     ${isProduction ? "✅ Production" : "⚠️ Setup"}
========================================`);
});