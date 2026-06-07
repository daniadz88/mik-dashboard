import {BrowserRouter, Routes, Route, Navigate, useLocation} from "react-router-dom";
import {AppProvider, useApp} from "./useApp.jsx";
import {ThemeProvider} from "./components/ThemeContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Devices from "./pages/Devices.jsx";
import Scanner from "./pages/Scanner.jsx";
import ActiveHotspot from "./pages/ActiveHotspot.jsx";
import GenerateVoucher from "./pages/GenerateVoucher.jsx";
import UserList from "./pages/UserList.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import SystemSettings from "./pages/SystemSettings.jsx";
import AppUsers from "./pages/AppUsers.jsx";
import {useState, useEffect} from "react";
import api from "./api";

// ──────────────────────────────────────────────
// Connection Check Banner
// ──────────────────────────────────────────────
function ConnectionBanner() {
    const [devices, setDevices] = useState([]);
    const [status, setStatus] = useState("checking");
    const [dismissed, setDismissed] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        checkConnections();
    }, [location.pathname]);

    const checkConnections = async () => {
        setStatus("checking");
        try {
            const devs = await api.get("/devices");
            if (!devs?.length) {
                setStatus("none");
                setDevices([]);
                return;
            }

            const results = await Promise.allSettled(
                devs.map((d) =>
                    api.get(`/devices/${d.id}/status`).then(() => ({...d, online: true}))
                       .catch(() => ({...d, online: false}))
                )
            );

            const checked = results.map((r) => r.value);
            setDevices(checked);

            const allOffline = checked.every((d) => !d.online);
            const someOffline = checked.some((d) => !d.online);

            if (allOffline) setStatus("all-offline");
            else if (someOffline) setStatus("warn");
            else setStatus("ok");

            setDismissed(false);
        } catch {
            setStatus("error");
        }
    };

    if (location.pathname === "/login") return null;
    if (dismissed) return null;
    if (status === "ok" || status === "checking") return null;

    const configs = {
        none: {
            bg: "from-amber-500/15 to-orange-500/10 border-amber-500/25",
            icon: "⚠️",
            title: "Belum Ada Perangkat",
            desc: "Tambahkan MikroTik terlebih dahulu di halaman Devices atau gunakan Scanner.",
            action: { label: "Tambah Perangkat →", href: "/devices" },
            dot: "bg-amber-400",
        },
        warn: {
            bg: "from-yellow-500/15 to-amber-500/10 border-yellow-500/25",
            icon: "🔌",
            title: "Beberapa Perangkat Offline",
            desc: `${devices.filter((d) => !d.online).map((d) => d.name).join(", ")} tidak dapat dijangkau.`,
            action: { label: "Lihat Perangkat →", href: "/devices" },
            dot: "bg-yellow-400",
        },
        "all-offline": {
            bg: "from-red-500/15 to-rose-500/10 border-red-500/25",
            icon: "📡",
            title: "Semua Perangkat Offline",
            desc: "Tidak ada MikroTik yang dapat dijangkau. Periksa koneksi jaringan.",
            action: { label: "Coba Lagi", onClick: checkConnections },
            dot: "bg-red-400 animate-pulse",
        },
        error: {
            bg: "from-red-500/15 to-rose-500/10 border-red-500/25",
            icon: "❌",
            title: "Gagal Memeriksa Koneksi",
            desc: "Tidak dapat menghubungi API server. Pastikan backend berjalan.",
            action: { label: "Coba Lagi", onClick: checkConnections },
            dot: "bg-red-500 animate-pulse",
        },
    };

    const c = configs[status];
    if (!c) return null;

    return (
        <div className={`mx-4 mt-3 rounded-2xl border bg-gradient-to-r backdrop-blur-xl
                         flex items-start gap-3 px-4 py-3 shadow-lg ${c.bg}`}
             style={{fontFamily: "'DM Sans', sans-serif"}}>
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm">{c.icon}</span>
                    <span className="text-sm font-bold text-white/80">{c.title}</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{c.desc}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {c.action.href ? (
                    <a href={c.action.href}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition whitespace-nowrap">
                        {c.action.label}
                    </a>
                ) : (
                    <button onClick={c.action.onClick}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition whitespace-nowrap">
                        {c.action.label}
                    </button>
                )}
                <button onClick={() => setDismissed(true)}
                    className="text-white/20 hover:text-white/50 transition ml-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Auth Guard
// ──────────────────────────────────────────────
function RequireAuth({children}) {
    const token = localStorage.getItem("token");
    const location = useLocation();
    if (!token) return <Navigate to="/login" state={{from: location}} replace />;
    return children;
}

// ──────────────────────────────────────────────
// Device Guard - redirect to /devices if no device selected
// ──────────────────────────────────────────────
function RequireDevice({children}) {
    const {selectedDevice} = useApp();
    const location = useLocation();
    if (!selectedDevice) return <Navigate to="/devices" state={{from: location, reason: "no-device"}} replace />;
    return children;
}

// ──────────────────────────────────────────────
// 404
// ──────────────────────────────────────────────
function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
                        flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 border border-white/5
                                rounded-3xl flex items-center justify-center text-4xl">
                    🔍
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-3">404</h1>
                <p className="text-gray-400 mb-6">Halaman tidak ditemukan</p>
                <a href="/"
                   className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500
                              text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
                    ← Kembali
                </a>
            </div>
        </div>
    );
}

// Error logger
window.onerror = (msg, url, line, col, error) => {
    console.error("[Global Error]", {msg, url, line, col, error});
    return false;
};
window.onunhandledrejection = (event) => {
    console.error("[Unhandled Promise]", event.reason);
};

// ──────────────────────────────────────────────
// App
// ──────────────────────────────────────────────
function App() {
    return (
        <AppProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />

                        <Route
                            element={
                                <RequireAuth>
                                    <>
                                        <ConnectionBanner />
                                        <Layout />
                                    </>
                                </RequireAuth>
                            }
                        >
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={
                                <RequireDevice><Dashboard /></RequireDevice>
                            } />
                            <Route path="/devices" element={<Devices />} />
                            <Route path="/scanner" element={<Scanner />} />
                            <Route path="/active" element={
                                <RequireDevice><ActiveHotspot /></RequireDevice>
                            } />
                            <Route path="/voucher" element={
                                <RequireDevice><GenerateVoucher /></RequireDevice>
                            } />
                            <Route path="/users" element={
                                <RequireDevice><UserList /></RequireDevice>
                            } />
                            <Route path="/profiles" element={
                                <RequireDevice><UserProfile /></RequireDevice>
                            } />
                            <Route path="/settings" element={<SystemSettings />} />
                            <Route path="/app-users" element={<AppUsers />} />
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </AppProvider>
    );
}

export default App;