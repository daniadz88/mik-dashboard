import {useState, useEffect, useCallback} from "react";
import {useApp} from "../useApp";
import {useTheme} from "../components/ThemeContext";
import api from "../api";
import {Wifi, Loader2, AlertCircle, LogOut, RefreshCw, Activity, Cpu, Clock, Users} from "lucide-react";

export default function ActiveHotspot() {
    const {selectedDevice, addToast} = useApp();
    const {theme} = useTheme();
    const isDark = theme === "dark";
    const [activeUsers, setActiveUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!selectedDevice) {
            setError("Pilih device terlebih dahulu");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [s, a] = await Promise.all([
                api.get(`/devices/${selectedDevice.id}/hotspot/stats`).catch(() => null),
                api.get(`/devices/${selectedDevice.id}/hotspot/active`).catch(() => []),
            ]);
            setStats(s);
            setActiveUsers(Array.isArray(a) ? a : []);
        } catch (err) {
            setError(err?.error || "Gagal memuat data hotspot");
            setActiveUsers([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDevice]);

    useEffect(() => {
        fetchData();
        const iv = setInterval(fetchData, 10000);
        return () => clearInterval(iv);
    }, [fetchData]);

    const handleKick = async (id) => {
        if (!confirm("Kick user ini?")) return;
        try {
            await api.delete(`/devices/${selectedDevice.id}/hotspot/active/${id}`);
            addToast("User dikick", "success");
            fetchData();
        } catch (err) {
            addToast(err?.error || "Gagal kick user", "error");
        }
    };

    const c = isDark
        ? {
              bg: "bg-[#060b14]",
              card: "bg-[#0c1220] border-white/[0.05]",
              text: "text-white",
              sub: "text-slate-400",
              dim: "text-slate-600",
              thead: "bg-white/[0.02] border-white/[0.04]",
              div: "divide-white/[0.04]",
              hover: "hover:bg-white/[0.02]",
          }
        : {
              bg: "bg-gray-50",
              card: "bg-white border-gray-200",
              text: "text-gray-900",
              sub: "text-gray-500",
              dim: "text-gray-400",
              thead: "bg-gray-50 border-gray-200",
              div: "divide-gray-100",
              hover: "hover:bg-gray-50",
          };

    if (!selectedDevice)
        return (
            <div className={`min-h-screen ${c.bg} p-6`}>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-amber-500/8 border border-amber-500/20 text-amber-400 p-5 rounded-2xl">
                        <p className="font-bold text-sm">⚠️ Pilih device terlebih dahulu dari menu Devices</p>
                    </div>
                </div>
            </div>
        );

    const statItems = [
        {label: "Device", value: stats?.name, icon: Activity, color: "#22d3ee"},
        {label: "Uptime", value: stats?.uptime, icon: Clock, color: "#fbbf24"},
        {label: "CPU", value: stats?.cpu ? `${stats.cpu}%` : "—", icon: Cpu, color: "#60a5fa"},
        {label: "User Aktif", value: stats?.activeUsers, icon: Users, color: "#34d399"},
    ];

    return (
        <div className={`min-h-screen ${c.bg} ${c.text}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            <div className="max-w-6xl mx-auto p-5 lg:p-7 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Activity size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${c.text}`}>Hotspot Aktif</h1>
                            <p className={`text-xs ${c.dim}`}>Real-time · auto-refresh 10s</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className={`flex items-center gap-1.5 text-xs border px-3.5 py-2 rounded-xl transition ${c.card} ${c.sub}`}
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                        {loading ? "Memuat..." : "Refresh"}
                    </button>
                </div>

                {/* Stat cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {statItems.map(({label, value, icon: Icon, color}) => (
                            <div key={label} className={`rounded-2xl border p-4 ${c.card}`}>
                                <div className="flex items-center gap-2 mb-2.5">
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                                        style={{background: `${color}15`}}
                                    >
                                        <Icon size={12} style={{color}} />
                                    </div>
                                    <span
                                        className={`text-[9px] font-bold uppercase tracking-[0.18em] ${c.dim}`}
                                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                                    >
                                        {label}
                                    </span>
                                </div>
                                <p
                                    className={`text-xl font-black ${c.text}`}
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    {value ?? "—"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/8 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3">
                        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm">{error}</p>
                            <button onClick={fetchData} className="mt-1 text-xs underline">
                                Coba Lagi
                            </button>
                        </div>
                    </div>
                )}

                {loading && !error && activeUsers.length === 0 && (
                    <div className="flex items-center justify-center py-16 gap-3 text-emerald-400">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Memuat data...</span>
                    </div>
                )}

                {/* Table */}
                {!error && (
                    <div className={`rounded-2xl border overflow-hidden ${c.card}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${c.thead}`}>
                                        {["User", "IP Address", "MAC Address", "Uptime", "Aksi"].map((h, i) => (
                                            <th
                                                key={h}
                                                className={`px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] ${
                                                    c.dim
                                                }
                                                ${i === 2 ? "hidden lg:table-cell" : ""} ${
                                                    i === 4 ? "text-right" : ""
                                                }`}
                                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${c.div}`}>
                                    {activeUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-16 text-center">
                                                <Wifi size={28} className={`mx-auto mb-3 ${c.dim}`} />
                                                <p className={`text-sm font-medium ${c.sub}`}>Tidak ada user aktif</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        activeUsers.map((user, i) => (
                                            <tr key={user[".id"] || i} className={`transition ${c.hover}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                                                        <span className={`text-sm font-semibold ${c.text}`}>
                                                            {user.user || user.name || "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-xs font-mono ${c.sub}`}>
                                                    {user.address || user["ip-address"] || "—"}
                                                </td>
                                                <td
                                                    className={`px-4 py-3 text-xs font-mono hidden lg:table-cell ${c.dim}`}
                                                >
                                                    {user["mac-address"] || "—"}
                                                </td>
                                                <td className={`px-4 py-3 text-xs ${c.sub}`}>{user.uptime || "—"}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleKick(user[".id"])}
                                                        className="inline-flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/8 px-2.5 py-1.5 rounded-lg transition"
                                                    >
                                                        <LogOut size={11} /> Kick
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
