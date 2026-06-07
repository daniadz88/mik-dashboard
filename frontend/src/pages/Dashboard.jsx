import {useState, useEffect, useCallback} from "react";
import {useApp} from "../useApp.jsx";
import {useTheme} from "../components/ThemeContext.jsx";
import api from "../api.js";
import {
    Users,
    Cpu,
    Clock,
    Router,
    RefreshCw,
    AlertCircle,
    Database,
    Signal,
    Zap,
    Server,
    Wifi,
    Activity,
    MemoryStick,
    TrendingUp,
    Minus,
    ArrowDown,
    ArrowUp,
    Network,
    Globe,
    Shield,
    Terminal,
    Radio,
    Layers,
    ChevronRight,
    Circle,
    HardDrive,
    BarChart2,
    Eye,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
} from "lucide-react";

// ── Skeleton ─────────────────────────────────────────────────────────────
function Sk({w = "w-full", h = "h-4", isDark}) {
    return <div className={`${w} ${h} rounded-lg animate-pulse ${isDark ? "bg-white/[0.07]" : "bg-gray-200"}`} />;
}

// ── Label kecil ───────────────────────────────────────────────────────────
function Cap({children, className = ""}) {
    return (
        <span
            className={`text-[9px] font-black uppercase tracking-[0.2em] ${className}`}
            style={{fontFamily: "'JetBrains Mono',monospace"}}
        >
            {children}
        </span>
    );
}

// ── Progress bar ──────────────────────────────────────────────────────────
function Bar({pct = 0, color = "#22d3ee", isDark, thin = false, animated = false}) {
    return (
        <div
            className={`${thin ? "h-1" : "h-1.5"} w-full rounded-full overflow-hidden
            ${isDark ? "bg-white/[0.06]" : "bg-black/[0.07]"}`}
        >
            <div
                className={`h-full rounded-full transition-all duration-700 ${animated ? "animate-pulse" : ""}`}
                style={{width: `${Math.min(pct, 100)}%`, background: color}}
            />
        </div>
    );
}

// ── Badge ─────────────────────────────────────────────────────────────────
function Badge({children, color = "emerald", isDark}) {
    const map = {
        emerald: isDark
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-emerald-50 text-emerald-600 border-emerald-200",
        red: isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-500 border-red-200",
        amber: isDark
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-amber-50 text-amber-600 border-amber-200",
        blue: isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-200",
        purple: isDark
            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
            : "bg-purple-50 text-purple-600 border-purple-200",
        cyan: isDark ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-50 text-cyan-600 border-cyan-200",
    };
    return (
        <span
            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                map[color] || map.emerald
            }`}
            style={{fontFamily: "'JetBrains Mono',monospace"}}
        >
            {children}
        </span>
    );
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHeader({icon: Icon, title, subtitle, color, badge, isDark, t, action}) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{background: `${color}15`, border: `1px solid ${color}25`}}
                >
                    <Icon size={14} style={{color}} />
                </div>
                <div>
                    <p className={`text-sm font-bold leading-none ${t.text}`}>{title}</p>
                    {subtitle && <p className={`text-[10px] mt-0.5 ${t.dim}`}>{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {badge}
                {action}
            </div>
        </div>
    );
}

// ── Format bytes ──────────────────────────────────────────────────────────
function fmtBytes(b) {
    if (!b && b !== 0) return "—";
    const n = Number(b);
    if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
    if (n >= 1048576) return (n / 1048576).toFixed(2) + " MB";
    if (n >= 1024) return (n / 1024).toFixed(1) + " KB";
    return n + " B";
}

function fmtRate(bps) {
    if (!bps && bps !== 0) return "0 bps";
    const n = Number(bps);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + " Mbps";
    if (n >= 1000) return (n / 1000).toFixed(0) + " Kbps";
    return n + " bps";
}

// ── Mini sparkline ────────────────────────────────────────────────────────
function Sparkline({data = [], color = "#22d3ee", height = 32}) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w = 80,
        h = height;
    const pts = data
        .map((v, i) => {
            const x = (i / Math.max(data.length - 1, 1)) * w;
            const y = h - (v / max) * h;
            return `${x},${y}`;
        })
        .join(" ");
    return (
        <svg width={w} height={h} className="opacity-70">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pts}
            />
        </svg>
    );
}

// ── Firewall Card ─────────────────────────────────────────────────────────
function FirewallCard({firewall, t, isDark}) {
    if (!firewall) return null;
    return (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
            <SectionHeader
                icon={Shield}
                title="Firewall"
                subtitle="Traffic filtering stats"
                color="#f87171"
                isDark={isDark}
                t={t}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                    {label: "Filter Rules", val: firewall.filterRules ?? "—", color: "#60a5fa"},
                    {label: "NAT Rules",    val: firewall.natRules    ?? "—", color: "#fbbf24"},
                    {label: "Mangle",       val: firewall.mangleRules ?? "—", color: "#c084fc"},
                    {label: "Connections",  val: firewall.connections ?? "—", color: "#34d399"},
                ].map(({label, val, color}) => (
                    <div key={label} className={`p-3 rounded-xl ${t.inner}`}>
                        <Cap className={t.dim}>{label}</Cap>
                        <p
                            className="text-xl font-black mt-1 font-mono"
                            style={{color, fontFamily: "'JetBrains Mono',monospace"}}
                        >
                            {val}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Storage Card ──────────────────────────────────────────────────────────
function StorageCard({stats, t, isDark}) {
    const hasHdd = stats?.hdd || stats?.freeHdd;
    return (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
            <SectionHeader
                icon={HardDrive}
                title="Storage"
                subtitle="Disk usage"
                color="#fbbf24"
                isDark={isDark}
                t={t}
            />
            {hasHdd ? (
                (() => {
                    const total = parseInt(stats?.hdd?.total || stats?.totalHdd || 0, 10);
                    const free  = parseInt(stats?.hdd?.free  || stats?.freeHdd   || 0, 10);
                    const used  = total - free;
                    const pct   = total ? Math.round((used / total) * 100) : 0;
                    const col   = pct > 80 ? "#f87171" : pct > 60 ? "#fb923c" : "#fbbf24";
                    return (
                        <div className="space-y-2">
                            {[
                                {label: "Total",   val: fmtBytes(total), pct: 100,       color: "#fbbf24"},
                                {label: "Dipakai", val: fmtBytes(used),  pct,            color: col},
                                {label: "Bebas",   val: fmtBytes(free),  pct: 100 - pct, color: isDark ? "#34d399" : "#059669"},
                            ].map(({label, val, pct: p, color}) => (
                                <div key={label} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${t.cardAlt}`}>
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: color}} />
                                    <span className={`text-xs w-16 flex-shrink-0 ${t.sub}`}>{label}</span>
                                    <div className="flex-1">
                                        <Bar pct={p} color={color} isDark={isDark} thin />
                                    </div>
                                    <span className={`text-xs font-mono font-bold ${t.text}`}>{val}</span>
                                </div>
                            ))}
                            <div className={`px-3 py-3 rounded-xl ${t.cardAlt}`}>
                                <div
                                    className={`h-2.5 rounded-full overflow-hidden flex ${
                                        isDark ? "bg-white/[0.05]" : "bg-gray-200"
                                    }`}
                                >
                                    <div
                                        className="h-full transition-all duration-700"
                                        style={{
                                            width: `${pct}%`,
                                            background: col,
                                            borderRadius: pct > 0 && pct < 100 ? "9999px 0 0 9999px" : "9999px",
                                        }}
                                    />
                                    <div
                                        className="h-full flex-1"
                                        style={{
                                            background: isDark ? "#34d399" : "#059669",
                                            borderRadius: pct < 100 ? "0 9999px 9999px 0" : "9999px",
                                        }}
                                    />
                                </div>
                                <p className={`text-[10px] mt-1.5 ${t.dim}`}>{pct}% terpakai</p>
                            </div>
                        </div>
                    );
                })()
            ) : (
                <div className={`text-center py-8 ${t.dim}`}>
                    <HardDrive size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Data storage tidak tersedia</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30000;
const MAX_CPU_HISTORY  = 20;
const MAX_LOG_ENTRIES  = 20;
const MAX_ROUTES       = 8;
const PAGE_SIZE        = 50; // for DHCP / session pagination

// ─────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const {selectedDevice} = useApp();
    const {theme} = useTheme();
    const isDark = theme === "dark";

    const [stats,      setStats]      = useState(null);
    const [interfaces, setInterfaces] = useState([]);
    const [sessions,   setSessions]   = useState([]);
    const [dhcp,       setDhcp]       = useState([]);
    const [logs,       setLogs]       = useState([]);
    const [wireless,   setWireless]   = useState([]);
    const [routes,     setRoutes]     = useState([]);
    const [firewall,   setFirewall]   = useState(null);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [cpuHistory, setCpuHistory] = useState([]);
    const [activeTab,  setActiveTab]  = useState("overview");

    // ── Fetch semua data paralel ──────────────────────────────────────────
    const fetchAll = useCallback(
        async (manual = false) => {
            if (!selectedDevice) return;
            if (manual) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            try {
                const data = await api.get(`/devices/${selectedDevice.id}/hotspot/stats`);
                setStats(data);
                if (data?.firewall) {
                    setFirewall(data.firewall);
                }
                setCpuHistory((prev) => [
                    ...prev.slice(-(MAX_CPU_HISTORY - 1)),
                    parseInt(data?.cpu || 0, 10),
                ]);
                setError(null);
                setLastUpdated(new Date());

                const safe = async (fn) => {
                    try { return await fn(); } catch { return null; }
                };

                const [ifaces, sess, leases, syslog, wl, rt, fw] = await Promise.all([
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/interfaces`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/active`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/dhcp-leases`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/logs`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/wireless`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/routes`)),
                    safe(() => api.get(`/devices/${selectedDevice.id}/hotspot/firewall-rules`)),
                ]);

                if (ifaces)  setInterfaces(Array.isArray(ifaces)  ? ifaces            : []);
                if (sess)    setSessions(  Array.isArray(sess)    ? sess              : []);
                if (leases)  setDhcp(      Array.isArray(leases)  ? leases            : []);
                if (syslog)  setLogs(      Array.isArray(syslog)  ? syslog.slice(0, MAX_LOG_ENTRIES) : []);
                if (wl)      setWireless(  Array.isArray(wl)      ? wl                : []);
                if (rt)      setRoutes(    Array.isArray(rt)       ? rt.slice(0, MAX_ROUTES)          : []);
                if (fw && !data?.firewall) setFirewall(fw);
            } catch (err) {
                setError(err?.error || "Gagal memuat data");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedDevice]
    );

    useEffect(() => {
        fetchAll();
        const iv = setInterval(() => fetchAll(), REFRESH_INTERVAL);
        return () => clearInterval(iv);
    }, [fetchAll]);

    // ── Computed ──────────────────────────────────────────────────────────
    const memTotal = stats?.memory?.total ? parseInt(stats.memory.total, 10) : 0;
    const memFree  = stats?.memory?.free  ? parseInt(stats.memory.free,  10) : 0;
    const memUsed  = memTotal - memFree;
    const memPct   = memTotal ? Math.round((memUsed / memTotal) * 100) : 0;
    const cpuVal   = parseInt(stats?.cpu || 0, 10);
    const cpuColor = cpuVal > 80 ? "#f87171" : cpuVal > 50 ? "#fb923c" : "#34d399";
    const memColor = memPct > 80 ? "#f87171" : memPct > 60 ? "#fb923c" : "#60a5fa";

    const totalRx = interfaces.reduce((s, i) => s + parseInt(i["rx-byte"] || i.rxBytes || 0, 10), 0);
    const totalTx = interfaces.reduce((s, i) => s + parseInt(i["tx-byte"] || i.txBytes || 0, 10), 0);

    const dhcpBound = dhcp.filter((d) => d.status === "bound" || d["active-address"]).length || dhcp.length;

    // ── Theme tokens ──────────────────────────────────────────────────────
    const t = isDark
        ? {
              bg:      "bg-[#07101d]",
              card:    "bg-[#0c1829] border-white/[0.07]",
              cardAlt: "bg-[#0f1e32] border-white/[0.04]",
              inner:   "bg-[#111f35]",
              text:    "text-white",
              sub:     "text-slate-400",
              dim:     "text-slate-600",
              divider: "border-white/[0.06]",
              hover:   "hover:bg-white/[0.04] transition-colors",
              input:   "bg-white/[0.05]",
              table:   "divide-white/[0.04]",
              // FIX: tab hover — literal classes agar Tailwind tidak purge
              tabActive:   "bg-white/[0.1] text-white shadow-sm",
              tabInactive: "text-slate-400 hover:text-white",
          }
        : {
              bg:      "bg-[#eef2f9]",
              card:    "bg-white border-gray-200/80",
              cardAlt: "bg-gray-50/80 border-gray-200",
              inner:   "bg-gray-100",
              text:    "text-gray-900",
              sub:     "text-gray-500",
              dim:     "text-gray-400",
              divider: "border-gray-100",
              hover:   "hover:bg-gray-50 transition-colors",
              input:   "bg-gray-100",
              table:   "divide-gray-100",
              // FIX: tab hover — literal classes agar Tailwind tidak purge
              tabActive:   "bg-white text-gray-900 shadow-sm",
              tabInactive: "text-gray-500 hover:text-gray-900",
          };

    // ── Tabs ──────────────────────────────────────────────────────────────
    const tabs = [
        {id: "overview", label: "Overview", icon: BarChart2},
        {id: "network",  label: "Network",  icon: Network},
        {id: "hotspot",  label: "Hotspot",  icon: Wifi},
        {id: "system",   label: "System",   icon: Terminal},
    ];

    return (
        <div className={`min-h-screen ${t.bg} ${t.text}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-xl font-black tracking-tight ${t.text}`}>Dashboard</h1>
                        {selectedDevice ? (
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className={`text-xs font-bold ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                                    {selectedDevice.name}
                                </span>
                                <span className={`text-xs ${t.dim}`}>· {selectedDevice.host}</span>
                                {stats?.version && <Badge color="cyan"   isDark={isDark}>v{stats.version}</Badge>}
                                {stats?.board   && <Badge color="purple" isDark={isDark}>{stats.board}</Badge>}
                            </div>
                        ) : (
                            <p className={`text-xs mt-0.5 ${t.dim}`}>Pilih perangkat untuk mulai</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className={`hidden sm:flex flex-col items-end text-[10px] font-mono leading-tight ${t.dim}`}>
                                <span>Updated</span>
                                <span className={isDark ? "text-slate-300" : "text-gray-600"}>
                                    {lastUpdated.toLocaleTimeString("id-ID")}
                                </span>
                            </span>
                        )}
                        <button
                            onClick={() => fetchAll(true)}
                            disabled={!selectedDevice || refreshing}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold
                                    disabled:opacity-30 ${t.card} ${t.sub} ${t.hover}`}
                        >
                            <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* ── Alerts ─────────────────────────────────────────────── */}
                {!selectedDevice && (
                    <div
                        className={`flex items-start gap-3 p-4 rounded-2xl border
                        ${isDark
                            ? "bg-amber-500/[0.08] border-amber-500/20 text-amber-400"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                    >
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Belum ada perangkat dipilih</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-amber-400/60" : "text-amber-600/70"}`}>
                                Buka menu Devices dan pilih perangkat MikroTik
                            </p>
                        </div>
                    </div>
                )}
                {error && (
                    <div
                        className={`flex items-center gap-3 p-4 rounded-2xl border
                        ${isDark
                            ? "bg-red-500/[0.08] border-red-500/20 text-red-400"
                            : "bg-red-50 border-red-200 text-red-600"
                        }`}
                    >
                        <AlertCircle size={14} />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* ── KPI Strip ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {[
                        {label: "User Aktif",  val: stats?.activeUsers ?? "—", unit: "online", icon: Users,      color: "#34d399", pct: null},
                        {label: "CPU Load",    val: stats?.cpu ?? "—",         unit: "%",      icon: Cpu,        color: cpuColor,  pct: cpuVal},
                        {label: "Memory",      val: memPct || "—",             unit: "%",      icon: MemoryStick, color: memColor, pct: memPct},
                        {label: "Uptime",      val: stats?.uptime ?? "—",      unit: null,     icon: Clock,      color: "#fbbf24", pct: null},
                        {label: "Interfaces",  val: interfaces.length || "—",  unit: "iface",  icon: Network,    color: "#60a5fa", pct: null},
                        {label: "DHCP",        val: dhcpBound || "—",          unit: "client", icon: Globe,      color: "#c084fc", pct: null},
                        {label: "Total RX",    val: fmtBytes(totalRx),         unit: null,     icon: ArrowDown,  color: "#34d399", pct: null},
                        {label: "Total TX",    val: fmtBytes(totalTx),         unit: null,     icon: ArrowUp,    color: "#f87171", pct: null},
                    ].map(({label, val, unit, icon: Icon, color, pct}) => (
                        <div key={label} className={`rounded-2xl border p-3 ${t.card}`}>
                            <div className="flex items-center justify-between mb-2">
                                <Cap className={t.dim}>{label}</Cap>
                                <div
                                    className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{background: `${color}18`, border: `1px solid ${color}28`}}
                                >
                                    <Icon size={10} style={{color}} />
                                </div>
                            </div>
                            {loading && !stats ? (
                                <Sk w="w-full" h="h-5" isDark={isDark} />
                            ) : (
                                <div className="flex items-baseline gap-0.5">
                                    <span
                                        className="text-base font-black leading-none truncate"
                                        style={{fontFamily: "'JetBrains Mono',monospace", color}}
                                    >
                                        {val}
                                    </span>
                                    {unit && (
                                        <span className="text-[9px] font-bold ml-0.5" style={{color, opacity: 0.6}}>
                                            {unit}
                                        </span>
                                    )}
                                </div>
                            )}
                            {pct !== null && (
                                <div className="mt-1.5">
                                    <Bar pct={pct} color={color} isDark={isDark} thin />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Tabs ───────────────────────────────────────────────── */}
                <div className={`flex gap-1 p-1 rounded-2xl border ${t.card}`}>
                    {tabs.map(({id, label, icon: Icon}) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl
                                    text-xs font-bold transition-all duration-200
                                    ${activeTab === id ? t.tabActive : t.tabInactive}`}
                        >
                            <Icon size={11} />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    TAB: OVERVIEW
                ══════════════════════════════════════════════════════════ */}
                {activeTab === "overview" && (
                    <div className="space-y-3">
                        {/* Row 1 — CPU / Memory / System Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {/* CPU card */}
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={Cpu}
                                    title="CPU Load"
                                    subtitle="Processor utilization"
                                    color="#60a5fa"
                                    isDark={isDark}
                                    t={t}
                                    badge={
                                        <span
                                            className="text-2xl font-black font-mono"
                                            style={{fontFamily: "'JetBrains Mono',monospace", color: cpuColor}}
                                        >
                                            {stats?.cpu ?? "—"}
                                            {stats?.cpu ? <span className="text-sm">%</span> : ""}
                                        </span>
                                    }
                                />
                                <Bar pct={cpuVal} color={cpuColor} isDark={isDark} />
                                <div className={`flex justify-between text-[9px] mt-1 font-mono ${t.dim}`}>
                                    <span>0%</span>
                                    <span style={{color: cpuColor}}>{cpuVal}% now</span>
                                    <span>100%</span>
                                </div>
                                {cpuHistory.length > 1 && (
                                    <div className={`mt-3 p-2.5 rounded-xl ${t.inner} flex items-end justify-between`}>
                                        <div>
                                            <Cap className={t.dim}>History</Cap>
                                            <p className={`text-[10px] mt-0.5 ${t.sub}`}>
                                                avg{" "}
                                                {Math.round(
                                                    cpuHistory.reduce((a, b) => a + b, 0) / cpuHistory.length
                                                )}%
                                            </p>
                                        </div>
                                        <Sparkline data={cpuHistory} color={cpuColor} />
                                    </div>
                                )}
                                {stats?.cpuFrequency && (
                                    <div className={`mt-2 flex items-center justify-between px-3 py-2 rounded-xl ${t.cardAlt}`}>
                                        <span className={`text-[11px] ${t.sub}`}>Frequency</span>
                                        <span className={`text-[11px] font-mono font-bold ${t.text}`}>
                                            {stats.cpuFrequency} MHz
                                        </span>
                                    </div>
                                )}
                                {stats?.cpuCount && (
                                    <div className={`mt-1 flex items-center justify-between px-3 py-2 rounded-xl ${t.cardAlt}`}>
                                        <span className={`text-[11px] ${t.sub}`}>CPU Count</span>
                                        <span className={`text-[11px] font-mono font-bold ${t.text}`}>
                                            {stats.cpuCount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Memory card */}
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={MemoryStick}
                                    title="Memory"
                                    subtitle="RAM utilization"
                                    color="#22d3ee"
                                    isDark={isDark}
                                    t={t}
                                    badge={
                                        <span
                                            className={`text-xs font-black px-2 py-1 rounded-lg font-mono flex items-center gap-1
                                                       ${memPct > 80
                                                           ? isDark ? "bg-red-500/10 text-red-400"       : "bg-red-50 text-red-500"
                                                           : memPct > 60
                                                           ? isDark ? "bg-orange-500/10 text-orange-400" : "bg-orange-50 text-orange-500"
                                                           : isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                                                       }`}
                                        >
                                            {memPct > 60 ? <TrendingUp size={10} /> : <Minus size={10} />}
                                            {memPct}%
                                        </span>
                                    }
                                />
                                {loading && !stats ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => <Sk key={i} h="h-10" isDark={isDark} />)}
                                    </div>
                                ) : stats?.memory ? (
                                    <div className="space-y-1.5">
                                        {[
                                            {label: "Total",    val: stats.memory.total,    pct: 100,         color: isDark ? "#22d3ee" : "#0891b2"},
                                            {label: "Terpakai", val: `${memUsed} KiB`,      pct: memPct,      color: memColor},
                                            {label: "Bebas",    val: stats.memory.free,     pct: 100 - memPct, color: isDark ? "#34d399" : "#059669"},
                                        ].map(({label, val, pct, color}) => (
                                            <div key={label} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${t.cardAlt}`}>
                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: color}} />
                                                <span className={`text-xs w-14 flex-shrink-0 ${t.sub}`}>{label}</span>
                                                <div className="flex-1">
                                                    <Bar pct={pct} color={color} isDark={isDark} thin />
                                                </div>
                                                <span className={`text-[11px] font-mono font-bold flex-shrink-0 ${t.text}`}>
                                                    {val}
                                                </span>
                                            </div>
                                        ))}
                                        {/* Stacked bar */}
                                        <div className={`px-3 py-2.5 rounded-xl ${t.cardAlt}`}>
                                            <div className="flex justify-between text-[9px] mb-1.5">
                                                <Cap className={t.dim}>Distribusi</Cap>
                                                <div className="flex items-center gap-2">
                                                    {[
                                                        {c: memColor,                        l: `Used ${memPct}%`},
                                                        {c: isDark ? "#34d399" : "#059669",  l: `Free ${100 - memPct}%`},
                                                    ].map(({c, l}) => (
                                                        <span key={l} className={`flex items-center gap-1 ${t.dim}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{background: c}} />
                                                            {l}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className={`h-2.5 rounded-full overflow-hidden flex ${isDark ? "bg-white/[0.05]" : "bg-gray-200"}`}>
                                                <div
                                                    className="h-full transition-all duration-700"
                                                    style={{
                                                        width: `${memPct}%`,
                                                        background: memColor,
                                                        borderRadius: memPct > 0 && memPct < 100 ? "9999px 0 0 9999px" : "9999px",
                                                    }}
                                                />
                                                <div
                                                    className="h-full flex-1 transition-all"
                                                    style={{
                                                        background: isDark ? "#34d399" : "#059669",
                                                        borderRadius: memPct < 100 ? "0 9999px 9999px 0" : "9999px",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-sm ${t.dim}`}>Data memori tidak tersedia</p>
                                )}
                            </div>

                            {/* System Info */}
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={Server}
                                    title="System Info"
                                    subtitle="Device details"
                                    color="#a78bfa"
                                    isDark={isDark}
                                    t={t}
                                    badge={
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                            </span>
                                            <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                                                Online
                                            </span>
                                        </div>
                                    }
                                />
                                <div className="space-y-0.5">
                                    {[
                                        {label: "Host",      val: selectedDevice?.host,                                icon: Server,    color: "#60a5fa"},
                                        {label: "Port",      val: selectedDevice?.port || 8728,                        icon: Zap,       color: "#fbbf24"},
                                        {label: "Protokol",  val: selectedDevice?.https ? "HTTPS" : "HTTP",            icon: Shield,    color: "#34d399"},
                                        {label: "Board",     val: stats?.board || "—",                                 icon: HardDrive, color: "#c084fc"},
                                        {label: "RouterOS",  val: stats?.version || "—",                               icon: Layers,    color: "#22d3ee"},
                                        {label: "Uptime",    val: stats?.uptime || "—",                                icon: Clock,     color: "#fbbf24"},
                                        {label: "Identity",  val: stats?.name || selectedDevice?.name || "—",          icon: Router,    color: "#f472b6"},
                                        {label: "Users",     val: stats?.activeUsers !== undefined ? `${stats.activeUsers} online` : "—", icon: Users, color: "#34d399"},
                                    ].map(({label, val, icon: Icon, color}) => (
                                        <div key={label} className={`flex items-center justify-between px-2.5 py-2 rounded-xl ${t.hover}`}>
                                            <div className="flex items-center gap-2">
                                                <Icon size={11} style={{color, opacity: 0.8}} />
                                                <span className={`text-[11px] ${t.sub}`}>{label}</span>
                                            </div>
                                            <span className={`text-[11px] font-mono font-semibold truncate max-w-[120px] text-right ${t.text}`}>
                                                {val || "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 2 — Wireless */}
                        {wireless.length > 0 && (
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={Radio}
                                    title="Wireless"
                                    subtitle="Access Point status"
                                    color="#f472b6"
                                    isDark={isDark}
                                    t={t}
                                    badge={<Badge color="purple" isDark={isDark}>{wireless.length} AP</Badge>}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {wireless.map((ap, i) => {
                                        const reg  = parseInt(ap["registered-clients"]    || ap.clients || 0, 10);
                                        const auth = parseInt(ap["authenticated-clients"] || ap.auth    || 0, 10);
                                        return (
                                            <div key={i} className={`p-3 rounded-xl border ${t.cardAlt}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-bold truncate ${t.text}`}>
                                                        {ap.name || ap.ssid || `AP ${i + 1}`}
                                                    </span>
                                                    <Badge
                                                        color={ap.running || ap.disabled === "false" ? "emerald" : "red"}
                                                        isDark={isDark}
                                                    >
                                                        {ap.running || ap.disabled === "false" ? "UP" : "DOWN"}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    {ap.ssid && (
                                                        <div className="flex justify-between">
                                                            <span className={`text-[10px] ${t.dim}`}>SSID</span>
                                                            <span className={`text-[10px] font-mono ${t.sub}`}>{ap.ssid}</span>
                                                        </div>
                                                    )}
                                                    {ap.band && (
                                                        <div className="flex justify-between">
                                                            <span className={`text-[10px] ${t.dim}`}>Band</span>
                                                            <span className={`text-[10px] font-mono ${t.sub}`}>{ap.band}</span>
                                                        </div>
                                                    )}
                                                    {ap.frequency && (
                                                        <div className="flex justify-between">
                                                            <span className={`text-[10px] ${t.dim}`}>Freq</span>
                                                            <span className={`text-[10px] font-mono ${t.sub}`}>{ap.frequency} MHz</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className={`text-[10px] ${t.dim}`}>Clients</span>
                                                        <span className={`text-[10px] font-mono font-bold ${t.text}`}>
                                                            {auth}/{reg}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Row 3 — Firewall */}
                        <FirewallCard firewall={firewall || stats?.firewall} t={t} isDark={isDark} />
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    TAB: NETWORK
                ══════════════════════════════════════════════════════════ */}
                {activeTab === "network" && (
                    <div className="space-y-3">
                        {/* Interfaces */}
                        <div className={`rounded-2xl border p-5 ${t.card}`}>
                            <SectionHeader
                                icon={Network}
                                title="Interfaces"
                                subtitle="Network adapters"
                                color="#60a5fa"
                                isDark={isDark}
                                t={t}
                                badge={<Badge color="blue" isDark={isDark}>{interfaces.length} iface</Badge>}
                            />
                            {loading && !interfaces.length ? (
                                <div className="space-y-2">
                                    {[1, 2, 3, 4].map((i) => <Sk key={i} h="h-12" isDark={isDark} />)}
                                </div>
                            ) : interfaces.length ? (
                                <div className="space-y-1.5">
                                    {interfaces.map((iface, i) => {
                                        const running = iface.running || iface.disabled === "false";
                                        const rx     = parseInt(iface["rx-byte"]            || iface.rxBytes || 0, 10);
                                        const tx     = parseInt(iface["tx-byte"]            || iface.txBytes || 0, 10);
                                        const rxRate = parseInt(iface["rx-bits-per-second"] || iface.rxRate  || 0, 10);
                                        const txRate = parseInt(iface["tx-bits-per-second"] || iface.txRate  || 0, 10);
                                        return (
                                            <div key={i} className={`px-3 py-2.5 rounded-xl border ${t.cardAlt} ${t.hover}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${running ? "bg-emerald-400" : "bg-red-400"}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-xs font-bold truncate ${t.text}`}>{iface.name}</span>
                                                            {iface.type && <Badge color="blue" isDark={isDark}>{iface.type}</Badge>}
                                                            {iface["mac-address"] && (
                                                                <span className={`text-[10px] font-mono ${t.dim} hidden sm:inline`}>
                                                                    {iface["mac-address"]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                                                            <span className={`flex items-center gap-1 text-[10px] ${t.dim}`}>
                                                                <ArrowDown size={9} className="text-emerald-400" />
                                                                {fmtBytes(rx)}
                                                                {rxRate > 0 && <span className="text-emerald-400">({fmtRate(rxRate)})</span>}
                                                            </span>
                                                            <span className={`flex items-center gap-1 text-[10px] ${t.dim}`}>
                                                                <ArrowUp size={9} className="text-red-400" />
                                                                {fmtBytes(tx)}
                                                                {txRate > 0 && <span className="text-red-400">({fmtRate(txRate)})</span>}
                                                            </span>
                                                            {iface.comment && (
                                                                <span className={`text-[10px] italic ${t.dim} hidden sm:inline`}>
                                                                    {iface.comment}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Badge color={running ? "emerald" : "red"} isDark={isDark}>
                                                        {running ? "UP" : "DOWN"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-8 ${t.dim}`}>
                                    <Network size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Data interface tidak tersedia</p>
                                </div>
                            )}
                        </div>

                        {/* Routes */}
                        {routes.length > 0 && (
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={Globe}
                                    title="Routing Table"
                                    subtitle="Active routes"
                                    color="#34d399"
                                    isDark={isDark}
                                    t={t}
                                    badge={<Badge color="emerald" isDark={isDark}>{routes.length} routes</Badge>}
                                />
                                <div className={`rounded-xl overflow-hidden border ${t.cardAlt}`}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className={`border-b ${t.divider}`}>
                                                {["Dst. Address", "Gateway", "Interface", "Distance", "Status"].map((h) => (
                                                    <th key={h} className={`text-left px-3 py-2 ${t.dim} font-semibold text-[10px]`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${t.table}`}>
                                            {routes.map((r, i) => (
                                                <tr key={i} className={t.hover}>
                                                    <td className={`px-3 py-2 font-mono ${t.text}`}>{r["dst-address"] || r.dst || "—"}</td>
                                                    <td className={`px-3 py-2 font-mono ${t.sub}`}>{r.gateway || r["gateway-status"] || "—"}</td>
                                                    <td className={`px-3 py-2 ${t.sub}`}>{r.interface || "—"}</td>
                                                    <td className={`px-3 py-2 font-mono ${t.dim}`}>{r.distance || "—"}</td>
                                                    <td className="px-3 py-2">
                                                        <Badge
                                                            color={r.active ? "emerald" : r.disabled ? "red" : "amber"}
                                                            isDark={isDark}
                                                        >
                                                            {r.active ? "active" : r.disabled ? "disabled" : "inactive"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* DHCP Leases — with simple pagination */}
                        <DhcpTable dhcp={dhcp} loading={loading} t={t} isDark={isDark} />
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    TAB: HOTSPOT
                ══════════════════════════════════════════════════════════ */}
                {activeTab === "hotspot" && (
                    <div className="space-y-3">
                        {/* Stats bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                {
                                    label: "Active Sessions",
                                    val: sessions.length,
                                    color: "#34d399",
                                    icon: Users,
                                },
                                {
                                    label: "Total RX",
                                    val: fmtBytes(sessions.reduce((s, u) => s + parseInt(u["bytes-in"]  || u.bytesIn  || 0, 10), 0)),
                                    color: "#60a5fa",
                                    icon: ArrowDown,
                                },
                                {
                                    label: "Total TX",
                                    val: fmtBytes(sessions.reduce((s, u) => s + parseInt(u["bytes-out"] || u.bytesOut || 0, 10), 0)),
                                    color: "#f87171",
                                    icon: ArrowUp,
                                },
                                {
                                    label: "Uptime Avg",
                                    val: sessions.length ? "active" : "—",
                                    color: "#fbbf24",
                                    icon: Clock,
                                },
                            ].map(({label, val, color, icon: Icon}) => (
                                <div key={label} className={`rounded-2xl border p-4 ${t.card}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon size={12} style={{color}} />
                                        <Cap className={t.dim}>{label}</Cap>
                                    </div>
                                    <p className="text-xl font-black font-mono" style={{color, fontFamily: "'JetBrains Mono',monospace"}}>
                                        {val}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Active sessions — with pagination */}
                        <SessionsTable sessions={sessions} loading={loading} t={t} isDark={isDark} />
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    TAB: SYSTEM
                ══════════════════════════════════════════════════════════ */}
                {activeTab === "system" && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {/* Resource detail */}
                            <div className={`rounded-2xl border p-5 ${t.card}`}>
                                <SectionHeader
                                    icon={Activity}
                                    title="Resource Detail"
                                    subtitle="System resource usage"
                                    color="#22d3ee"
                                    isDark={isDark}
                                    t={t}
                                />
                                <div className="space-y-0.5">
                                    {[
                                        {label: "Architecture", val: stats?.architecture || stats?.arch || "—"},
                                        {label: "CPU",          val: stats?.cpu ? `${stats.cpu}%` : "—"},
                                        {label: "Free Memory",  val: stats?.memory?.free  || "—"},
                                        {label: "Total Memory", val: stats?.memory?.total || "—"},
                                        {label: "Free HDD",     val: stats?.hdd?.free     || stats?.freeHdd   || "—"},
                                        {label: "Total HDD",    val: stats?.hdd?.total    || stats?.totalHdd  || "—"},
                                        {label: "Uptime",       val: stats?.uptime        || "—"},
                                        {label: "RouterOS",     val: stats?.version       || "—"},
                                        {label: "Build Time",   val: stats?.buildTime     || stats?.["build-time"]          || "—"},
                                        {label: "Factory FW",   val: stats?.factoryFirmware || stats?.["factory-firmware"]  || "—"},
                                    ].map(({label, val}) => (
                                        <div key={label} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${t.hover}`}>
                                            <span className={`text-xs ${t.sub}`}>{label}</span>
                                            <span className={`text-xs font-mono font-semibold ${t.text}`}>{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Storage */}
                            <StorageCard stats={stats} t={t} isDark={isDark} />
                        </div>

                        {/* System Logs */}
                        <div className={`rounded-2xl border p-5 ${t.card}`}>
                            <SectionHeader
                                icon={Terminal}
                                title="System Log"
                                subtitle="Recent log entries"
                                color="#94a3b8"
                                isDark={isDark}
                                t={t}
                                badge={<Badge color="blue" isDark={isDark}>{logs.length} entries</Badge>}
                            />
                            {loading && !logs.length ? (
                                <div className="space-y-1.5">
                                    {[1, 2, 3, 4, 5].map((i) => <Sk key={i} h="h-8" isDark={isDark} />)}
                                </div>
                            ) : logs.length ? (
                                <div className={`rounded-xl border overflow-hidden ${t.cardAlt}`}>
                                    <div className="overflow-y-auto max-h-80">
                                        {logs.map((log, i) => {
                                            const topics  = log.topics || log.topic || "";
                                            const isErr   = topics.includes("error")   || topics.includes("critical");
                                            const isWarn  = topics.includes("warning");
                                            const lineColor = isErr
                                                ? isDark ? "text-red-400"   : "text-red-500"
                                                : isWarn
                                                ? isDark ? "text-amber-400" : "text-amber-600"
                                                : t.sub;
                                            const DotIcon  = isErr ? XCircle : isWarn ? AlertTriangle : CheckCircle;
                                            const dotColor = isErr ? "#f87171" : isWarn ? "#fbbf24" : "#34d399";
                                            return (
                                                <div key={i} className={`flex items-start gap-2.5 px-3 py-2 border-b last:border-0 ${t.divider} ${t.hover}`}>
                                                    <DotIcon size={10} className="mt-0.5 flex-shrink-0" style={{color: dotColor}} />
                                                    <span className={`text-[10px] font-mono flex-shrink-0 ${t.dim} w-20`}>{log.time || "—"}</span>
                                                    {topics && (
                                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${isDark ? "bg-white/[0.05]" : "bg-gray-200"} ${t.dim}`}>
                                                            {topics}
                                                        </span>
                                                    )}
                                                    <span className={`text-[11px] flex-1 ${lineColor}`}>
                                                        {log.message || log.msg || "—"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className={`text-center py-10 ${t.dim}`}>
                                    <Terminal size={24} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Log tidak tersedia — pastikan endpoint /logs sudah ada di backend</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── DHCP Table with pagination ────────────────────────────────────────────
function DhcpTable({dhcp, loading, t, isDark}) {
    const [page, setPage] = useState(0);
    const PAGE = 50;
    const total = dhcp.length;
    const pages = Math.ceil(total / PAGE);
    const slice = dhcp.slice(page * PAGE, page * PAGE + PAGE);

    return (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
            <SectionHeader
                icon={Globe}
                title="DHCP Leases"
                subtitle="IP address assignments"
                color="#c084fc"
                isDark={isDark}
                t={t}
                badge={<Badge color="purple" isDark={isDark}>{total} leases</Badge>}
            />
            {loading && !dhcp.length ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Sk key={i} h="h-10" isDark={isDark} />)}
                </div>
            ) : dhcp.length ? (
                <>
                    <div className={`rounded-xl overflow-hidden border ${t.cardAlt}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[500px]">
                                <thead>
                                    <tr className={`border-b ${t.divider}`}>
                                        {["IP Address", "MAC Address", "Hostname", "Status", "Expires"].map((h) => (
                                            <th key={h} className={`text-left px-3 py-2 ${t.dim} font-semibold text-[10px]`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${t.table}`}>
                                    {slice.map((d, i) => {
                                        const ip   = d["active-address"] || d.address || d.ip   || "—";
                                        const mac  = d["active-mac-address"] || d["mac-address"] || d.mac || "—";
                                        const host = d["host-name"] || d.hostname || d.comment   || "—";
                                        const stat = d.status || "—";
                                        const exp  = d["expires-after"] || d.expires             || "—";
                                        return (
                                            <tr key={i} className={t.hover}>
                                                <td className={`px-3 py-2 font-mono font-semibold ${t.text}`}>{ip}</td>
                                                <td className={`px-3 py-2 font-mono ${t.dim} text-[10px]`}>{mac}</td>
                                                <td className={`px-3 py-2 ${t.sub}`}>{host}</td>
                                                <td className="px-3 py-2">
                                                    <Badge color={stat === "bound" ? "emerald" : "amber"} isDark={isDark}>{stat}</Badge>
                                                </td>
                                                <td className={`px-3 py-2 font-mono text-[10px] ${t.dim}`}>{exp}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {pages > 1 && (
                        <Pagination page={page} pages={pages} onPage={setPage} t={t} isDark={isDark} />
                    )}
                </>
            ) : (
                <div className={`text-center py-8 ${t.dim}`}>
                    <Globe size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Data DHCP tidak tersedia</p>
                </div>
            )}
        </div>
    );
}

// ── Sessions Table with pagination ───────────────────────────────────────
function SessionsTable({sessions, loading, t, isDark}) {
    const [page, setPage] = useState(0);
    const PAGE = 50;
    const total = sessions.length;
    const pages = Math.ceil(total / PAGE);
    const slice = sessions.slice(page * PAGE, page * PAGE + PAGE);

    return (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
            <SectionHeader
                icon={Users}
                title="Active Sessions"
                subtitle="Connected hotspot users"
                color="#34d399"
                isDark={isDark}
                t={t}
                badge={<Badge color="emerald" isDark={isDark}>{total} online</Badge>}
            />
            {loading && !sessions.length ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => <Sk key={i} h="h-10" isDark={isDark} />)}
                </div>
            ) : sessions.length ? (
                <>
                    <div className={`rounded-xl overflow-hidden border ${t.cardAlt}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[600px]">
                                <thead>
                                    <tr className={`border-b ${t.divider}`}>
                                        {["User", "IP Address", "MAC", "Uptime", "RX / TX", "Signal"].map((h) => (
                                            <th key={h} className={`text-left px-3 py-2 ${t.dim} font-semibold text-[10px]`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${t.table}`}>
                                    {slice.map((u, i) => {
                                        const rx = parseInt(u["bytes-in"]  || u.bytesIn  || 0, 10);
                                        const tx = parseInt(u["bytes-out"] || u.bytesOut || 0, 10);
                                        return (
                                            <tr key={i} className={t.hover}>
                                                <td className={`px-3 py-2 font-semibold ${t.text}`}>{u.user || u.username || "—"}</td>
                                                <td className={`px-3 py-2 font-mono ${t.sub}`}>{u.address || u.ip || "—"}</td>
                                                <td className={`px-3 py-2 font-mono text-[10px] ${t.dim}`}>{u["mac-address"] || u.mac || "—"}</td>
                                                <td className={`px-3 py-2 font-mono ${t.sub}`}>{u.uptime || "—"}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-0.5 text-emerald-400">
                                                            <ArrowDown size={8} />{fmtBytes(rx)}
                                                        </span>
                                                        <span className="flex items-center gap-0.5 text-red-400">
                                                            <ArrowUp size={8} />{fmtBytes(tx)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`px-3 py-2 font-mono text-[10px] ${t.dim}`}>
                                                    {u.signal || u["rx-signal"] || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {pages > 1 && (
                        <Pagination page={page} pages={pages} onPage={setPage} t={t} isDark={isDark} />
                    )}
                </>
            ) : (
                <div className={`text-center py-10 ${t.dim}`}>
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada sesi aktif</p>
                </div>
            )}
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({page, pages, onPage, t, isDark}) {
    return (
        <div className="flex items-center justify-between mt-3">
            <span className={`text-[11px] font-mono ${t.dim}`}>
                Hal. {page + 1} / {pages}
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => onPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border disabled:opacity-30
                        ${t.card} ${t.sub} ${t.hover}`}
                >
                    ‹ Prev
                </button>
                <button
                    onClick={() => onPage((p) => Math.min(pages - 1, p + 1))}
                    disabled={page >= pages - 1}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border disabled:opacity-30
                        ${t.card} ${t.sub} ${t.hover}`}
                >
                    Next ›
                </button>
            </div>
        </div>
    );
}