import {useState, useEffect} from "react";
import {
    Users,
    RefreshCw,
    Search,
    Wifi,
    WifiOff,
    Power,
    PowerOff,
    Clock,
    ArrowDown,
    ArrowUp,
    Activity,
    Check,
    Monitor,
    Smartphone,
    Laptop,
    X,
} from "lucide-react";
import api from "../api.js";
import {useTheme} from "../components/ThemeContext";

export default function UserList() {
    const {theme} = useTheme();
    const isDark = theme === "dark";

    const [activeUsers, setActiveUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [notif, setNotif] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        fetchData();
        const iv = setInterval(() => {
            if (autoRefresh) fetchData();
        }, 30_000);
        return () => clearInterval(iv);
    }, [autoRefresh]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const active = await api.get("/devices/2/hotspot/active").catch(() => []);
            setActiveUsers(Array.isArray(active) ? active : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showNotif = (msg, type = "success") => {
        setNotif({msg, type});
        setTimeout(() => setNotif(null), 3000);
    };

    const handleKick = async (userId) => {
        if (!confirm("Yakin kick user ini?")) return;
        try {
            await api.delete(`/devices/2/hotspot/active/${encodeURIComponent(userId)}`);
            fetchData();
            showNotif("User dikick!");
        } catch {
            showNotif("Gagal kick user", "error");
        }
    };

    const formatBytes = (val) => {
        const bytes = parseInt(val) || 0;
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getDeviceIcon = (loginBy) => {
        if (loginBy?.includes("mac")) return <Smartphone className="w-4 h-4" />;
        if (loginBy?.includes("cookie")) return <Laptop className="w-4 h-4" />;
        return <Monitor className="w-4 h-4" />;
    };

    const loginBadge = (loginBy) => {
        const map = {
            "http-pap": "bg-sky-500/15 text-sky-400 border-sky-500/25",
            cookie: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        };
        const cls = map[loginBy] || "bg-slate-500/15 text-slate-400 border-slate-500/25";
        return (
            <span
                className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${cls}`}
                style={{fontFamily: "'JetBrains Mono',monospace"}}
            >
                {loginBy || "unknown"}
            </span>
        );
    };

    const filtered = activeUsers.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            u.user?.toLowerCase().includes(q) ||
            u.address?.includes(q) ||
            u["mac-address"]?.toLowerCase().includes(q);
        if (filter === "idle") return matchSearch && u["idle-time"] && u["idle-time"] !== "0s";
        return matchSearch;
    });

    // ── Style tokens ────────────────────────────────────────────────────────
    const bg = isDark ? "bg-[#060b14]" : "bg-gray-50";
    const card = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    const textH = isDark ? "text-white" : "text-gray-900";
    const textS = isDark ? "text-slate-400" : "text-gray-500";
    const textD = isDark ? "text-slate-600" : "text-gray-400";
    const divider = isDark ? "border-white/[0.06]" : "border-gray-100";
    const inputCls = isDark
        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:border-sky-500/40 focus:ring-sky-500/20"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-400 focus:ring-sky-400/20";

    const STATS = [
        {
            label: "Total Aktif",
            value: activeUsers.length,
            color: "emerald",
            borderCls: "border-emerald-500/20",
            iconBg: "bg-emerald-500/10 border-emerald-500/20",
            icon: <Users className="w-4 h-4 text-emerald-400" />,
        },
        {
            label: "HTTP PAP",
            value: activeUsers.filter((u) => u["login-by"] === "http-pap").length,
            color: "sky",
            borderCls: "border-sky-500/20",
            iconBg: "bg-sky-500/10 border-sky-500/20",
            icon: <Wifi className="w-4 h-4 text-sky-400" />,
        },
        {
            label: "Cookie",
            value: activeUsers.filter((u) => u["login-by"] === "cookie").length,
            color: "amber",
            borderCls: "border-amber-500/20",
            iconBg: "bg-amber-500/10 border-amber-500/20",
            icon: <WifiOff className="w-4 h-4 text-amber-400" />,
        },
        {
            label: "MAC Auth",
            value: activeUsers.filter((u) => u["login-by"]?.includes("mac")).length,
            color: "violet",
            borderCls: "border-violet-500/20",
            iconBg: "bg-violet-500/10 border-violet-500/20",
            icon: <Activity className="w-4 h-4 text-violet-400" />,
        },
    ];

    const idleCount = activeUsers.filter((u) => u["idle-time"] && u["idle-time"] !== "0s").length;

    return (
        <div className={`min-h-screen ${bg} ${textH}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            {/* ── Notification ── */}
            {notif && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl
                    shadow-2xl text-sm font-semibold border backdrop-blur-xl
                    ${
                        notif.type === "error"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                >
                    {notif.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {notif.msg}
                </div>
            )}

            {/* ── Sticky Header ── */}
            <div className={`sticky top-0 z-30 border-b backdrop-blur-xl ${card} ${divider}`}>
                <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-sky-400" />
                        </div>
                        <div>
                            <h1 className={`text-base font-black tracking-tight ${textH}`}>User Aktif</h1>
                            <p className={`text-[11px] ${textD}`}>{activeUsers.length} user online</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textD}`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari user / IP / MAC..."
                                className={`pl-9 pr-4 py-2 w-52 rounded-xl text-sm border focus:outline-none focus:ring-1 transition ${inputCls}`}
                            />
                        </div>

                        {/* Auto-refresh toggle */}
                        <button
                            onClick={() => setAutoRefresh((v) => !v)}
                            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
                            className={`p-2.5 rounded-xl border transition ${
                                autoRefresh ? "bg-sky-500/15 border-sky-500/30 text-sky-400" : `${card} ${textS}`
                            }`}
                        >
                            <Activity className="w-4 h-4" />
                        </button>

                        <button onClick={fetchData} className={`p-2.5 rounded-xl border transition ${card} ${textS}`}>
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-5 py-5">
                {/* ── Stats ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {STATS.map(({label, value, borderCls, iconBg, icon}) => (
                        <div
                            key={label}
                            className={`rounded-2xl border p-4 flex items-center gap-3 ${card} ${borderCls}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${iconBg}`}>
                                {icon}
                            </div>
                            <div>
                                <div className={`text-xl font-black ${textH}`}>{value}</div>
                                <div className={`text-[10px] font-mono ${textD}`}>{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter Tabs ── */}
                <div className="flex items-center gap-1.5 mb-4">
                    {[
                        {key: "all", label: "Semua", count: activeUsers.length},
                        {key: "idle", label: "Idle", count: idleCount},
                    ].map(({key, label, count}) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border
                                ${
                                    filter === key
                                        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                                        : isDark
                                        ? "bg-white/[0.02] text-slate-500 border-white/[0.05] hover:text-slate-300"
                                        : "bg-white text-gray-400 border-gray-200 hover:text-gray-700"
                                }`}
                        >
                            {label}
                            <span
                                className={`ml-1.5 text-[10px] font-mono ${filter === key ? "text-sky-400/70" : textD}`}
                            >
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Table ── */}
                <div className={`rounded-2xl border overflow-hidden ${card}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${divider} ${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
                                    {[
                                        {label: "User", cls: ""},
                                        {label: "IP", cls: ""},
                                        {label: "MAC", cls: "hidden md:table-cell"},
                                        {label: "Login", cls: ""},
                                        {label: "Uptime", cls: ""},
                                        {label: "Traffic", cls: "hidden lg:table-cell"},
                                        {label: "Aksi", cls: "text-right"},
                                    ].map(({label, cls}) => (
                                        <th
                                            key={label}
                                            className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${textS} ${cls}`}
                                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${divider}`}>
                                {filtered.map((user) => (
                                    <tr
                                        key={user[".id"]}
                                        className={`transition-colors ${
                                            isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"
                                        }`}
                                    >
                                        {/* User */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                                    {getDeviceIcon(user["login-by"])}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${textH}`}>{user.user}</div>
                                                    {user.server && (
                                                        <div className={`text-[10px] font-mono ${textD}`}>
                                                            {user.server}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* IP */}
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-mono ${textS}`}>{user.address}</span>
                                        </td>

                                        {/* MAC */}
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className={`text-xs font-mono ${textD}`}>{user["mac-address"]}</span>
                                        </td>

                                        {/* Login */}
                                        <td className="px-4 py-3">{loginBadge(user["login-by"])}</td>

                                        {/* Uptime */}
                                        <td className="px-4 py-3">
                                            <div className={`flex items-center gap-1.5 text-sm ${textS}`}>
                                                <Clock className={`w-3 h-3 ${textD}`} />
                                                {user.uptime}
                                            </div>
                                        </td>

                                        {/* Traffic */}
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="space-y-0.5">
                                                <div className={`flex items-center gap-1 text-[10px] ${textS}`}>
                                                    <ArrowDown className="w-3 h-3 text-emerald-400" />
                                                    {formatBytes(user["bytes-in"])}
                                                </div>
                                                <div className={`flex items-center gap-1 text-[10px] ${textS}`}>
                                                    <ArrowUp className="w-3 h-3 text-sky-400" />
                                                    {formatBytes(user["bytes-out"])}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => handleKick(user[".id"])}
                                                    title="Kick User"
                                                    className={`p-1.5 rounded-lg transition ${textD} hover:bg-red-500/15 hover:text-red-400`}
                                                >
                                                    <PowerOff className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Empty State ── */}
                {filtered.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div
                            className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${card}`}
                        >
                            <WifiOff className={`w-6 h-6 ${textD}`} />
                        </div>
                        <p className={`font-semibold ${textS}`}>Tidak ada user aktif</p>
                        <p className={`text-sm mt-1 ${textD}`}>Belum ada yang login ke hotspot</p>
                    </div>
                )}
            </div>
        </div>
    );
}
