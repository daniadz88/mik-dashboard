import React, {useState, useEffect} from "react";
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    ChevronDown,
    Wifi,
    Zap,
    Timer,
    RefreshCw,
    Search,
    AlertCircle,
    Check,
} from "lucide-react";
import {useTheme} from "../components/ThemeContext";
import api from "../api.js";

const PALETTE = {
    default: {
        bar: "from-slate-400 to-slate-600",
        accent: "#94a3b8",
        bg: "rgba(148,163,184,0.08)",
        border: "rgba(148,163,184,0.15)",
    },
    "1-hari": {
        bar: "from-sky-400 to-blue-600",
        accent: "#38bdf8",
        bg: "rgba(56,189,248,0.08)",
        border: "rgba(56,189,248,0.15)",
    },
    "1-Jam": {
        bar: "from-amber-400 to-orange-600",
        accent: "#fbbf24",
        bg: "rgba(251,191,36,0.08)",
        border: "rgba(251,191,36,0.15)",
    },
    "Gaming-1H": {
        bar: "from-violet-400 to-purple-600",
        accent: "#a78bfa",
        bg: "rgba(167,139,250,0.08)",
        border: "rgba(167,139,250,0.15)",
    },
    "1-minggu-20rb": {
        bar: "from-emerald-400 to-teal-600",
        accent: "#34d399",
        bg: "rgba(52,211,153,0.08)",
        border: "rgba(52,211,153,0.15)",
    },
    "30-hari": {
        bar: "from-rose-400 to-pink-600",
        accent: "#fb7185",
        bg: "rgba(251,113,133,0.08)",
        border: "rgba(251,113,133,0.15)",
    },
};
const getP = (name) =>
    PALETTE[name] || {
        bar: "from-cyan-400 to-blue-600",
        accent: "#22d3ee",
        bg: "rgba(34,211,238,0.08)",
        border: "rgba(34,211,238,0.15)",
    };

export default function UserProfile() {
    const {theme} = useTheme();
    const isDark = theme === "dark";
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedProfile, setExpanded] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProfile, setEditing] = useState(null);
    const [notification, setNotif] = useState(null);

    const empty = {
        name: "",
        "shared-users": "1",
        "rate-limit": "",
        "session-timeout": "",
        "idle-timeout": "",
        "keepalive-timeout": "",
        "status-autorefresh": "",
        "mac-cookie-timeout": "",
        "transparent-proxy": false,
        "add-mac-cookie": true,
    };
    const [formData, setFormData] = useState(empty);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const d = await api.get(`/devices/2/hotspot/profiles`);
            setProfiles(d || []);
        } catch {
            showNotif("Gagal memuat profile", "error");
        } finally {
            setLoading(false);
        }
    };

    const showNotif = (msg, type = "success") => {
        setNotif({msg, type});
        setTimeout(() => setNotif(null), 3000);
    };
    const handleAdd = async () => {
        try {
            await api.post(`/devices/2/hotspot/profiles`, formData);
            setShowAddModal(false);
            setFormData(empty);
            fetchProfiles();
            showNotif("Profile ditambahkan!");
        } catch {
            showNotif("Gagal menambahkan", "error");
        }
    };
    const handleUpdate = async () => {
        if (!editingProfile) return;
        try {
            await api.patch(`/devices/2/hotspot/profiles/${editingProfile.id || editingProfile.name}`, editingProfile);
            setEditing(null);
            fetchProfiles();
            showNotif("Profile diperbarui!");
        } catch {
            showNotif("Gagal memperbarui", "error");
        }
    };
    const handleDelete = async (profile) => {
        if (!confirm(`Hapus profile "${profile.name}"?`)) return;
        try {
            await api.delete(`/devices/2/hotspot/profiles/${profile.id || profile.name}`);
            fetchProfiles();
            showNotif("Profile dihapus");
        } catch {
            showNotif("Gagal menghapus", "error");
        }
    };

    const filtered = profiles.filter(
        (p) =>
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p["rate-limit"]?.toLowerCase().includes(search.toLowerCase())
    );

    const c = isDark
        ? {
              bg: "bg-[#060b14]",
              text: "text-white",
              sub: "text-slate-400",
              dim: "text-slate-600",
          }
        : {
              bg: "bg-gray-50",
              text: "text-gray-900",
              sub: "text-gray-500",
              dim: "text-gray-400",
          };

    return (
        <div className={`min-h-screen ${c.bg} ${c.text}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            {notification && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-xl
                    ${
                        notification.type === "error"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                >
                    {notification.type === "error" ? (
                        <AlertCircle className="w-4 h-4" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    {notification.msg}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-5 lg:p-7">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Wifi size={16} className="text-amber-400" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${c.text}`}>Hotspot Profiles</h1>
                            <p className={`text-xs ${c.dim}`}>{profiles.length} profile · bandwidth & session</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${c.dim}`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari profile..."
                                className={`pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition w-44 border
                                ${
                                    isDark
                                        ? "bg-white/[0.03] border-white/[0.07] text-white placeholder-slate-700 focus:border-amber-500/30"
                                        : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                                }`}
                            />
                        </div>
                        <button
                            onClick={fetchProfiles}
                            className={`p-2.5 rounded-xl border transition ${
                                isDark
                                    ? "bg-[#0c1220] border-white/[0.05] text-slate-600"
                                    : "bg-white border-gray-200 text-gray-400"
                            }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-900/20 transition active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                </div>

                {/* Loading skeleton */}
                {loading && profiles.length === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-44 rounded-2xl border animate-pulse ${
                                    isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-100 border-gray-200"
                                }`}
                            />
                        ))}
                    </div>
                )}

                {/* Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((profile) => {
                            const ac = getP(profile.name);
                            const isOpen = expandedProfile === profile.name;
                            return (
                                <div
                                    key={profile.id || profile.name}
                                    className={`group relative rounded-2xl border overflow-hidden transition-all duration-300
                                        ${isDark ? "bg-[#0c1220]" : "bg-white"}`}
                                    style={{borderColor: ac.border}}
                                >
                                    {/* Top bar */}
                                    <div className={`h-[2px] w-full bg-gradient-to-r ${ac.bar}`} />

                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                                                    style={{background: ac.bg, border: `1px solid ${ac.border}`}}
                                                >
                                                    <Wifi size={17} style={{color: ac.accent}} />
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-[14px] leading-tight ${c.text}`}>
                                                        {profile.name}
                                                    </h3>
                                                    <p className={`text-[10px] mt-0.5 ${c.dim}`}>
                                                        {profile["shared-users"] || 1} shared user
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditing({...profile})}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                                        isDark
                                                            ? "bg-white/[0.03] text-slate-600 hover:bg-sky-500/15 hover:text-sky-400"
                                                            : "bg-gray-50 text-gray-400 hover:bg-sky-50 hover:text-sky-500"
                                                    }`}
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile)}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                                                        isDark
                                                            ? "bg-white/[0.03] text-slate-600 hover:bg-red-500/15 hover:text-red-400"
                                                            : "bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                                    }`}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Stat chips */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            {[
                                                {
                                                    icon: Zap,
                                                    label: "Rate Limit",
                                                    val: profile["rate-limit"] || "Unlimited",
                                                },
                                                {icon: Timer, label: "Session", val: profile["session-timeout"] || "∞"},
                                            ].map(({icon: Icon, label, val}) => (
                                                <div
                                                    key={label}
                                                    className={`rounded-xl px-3 py-2.5 border ${
                                                        isDark
                                                            ? "bg-white/[0.02] border-white/[0.04]"
                                                            : "bg-gray-50 border-gray-100"
                                                    }`}
                                                >
                                                    <div
                                                        className="flex items-center gap-1 mb-1"
                                                        style={{color: ac.accent}}
                                                    >
                                                        <Icon size={9} />
                                                        <span
                                                            className="text-[8px] font-bold uppercase tracking-[0.15em]"
                                                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                                                        >
                                                            {label}
                                                        </span>
                                                    </div>
                                                    <div className={`text-xs font-bold truncate ${c.text}`}>{val}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Expand */}
                                        <button
                                            onClick={() => setExpanded(isOpen ? null : profile.name)}
                                            className={`w-full flex items-center justify-between text-[10px] uppercase tracking-[0.15em] font-bold transition-colors pt-2 border-t ${
                                                isDark
                                                    ? "border-white/[0.04] text-slate-700 hover:text-slate-400"
                                                    : "border-gray-100 text-gray-300 hover:text-gray-500"
                                            }`}
                                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                                        >
                                            <span>{isOpen ? "Sembunyikan" : "Detail lengkap"}</span>
                                            <ChevronDown
                                                size={12}
                                                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div
                                                className={`mt-3 space-y-1 pt-3 border-t ${
                                                    isDark ? "border-white/[0.04]" : "border-gray-100"
                                                }`}
                                            >
                                                {[
                                                    {label: "Idle Timeout", val: profile["idle-timeout"]},
                                                    {label: "Keepalive", val: profile["keepalive-timeout"]},
                                                    {label: "Autorefresh", val: profile["status-autorefresh"]},
                                                    {label: "MAC Cookie", val: profile["mac-cookie-timeout"]},
                                                    {
                                                        label: "Transparent Proxy",
                                                        val: profile["transparent-proxy"] ? "Enabled" : "Disabled",
                                                    },
                                                    {
                                                        label: "Add MAC Cookie",
                                                        val: profile["add-mac-cookie"] !== false ? "Yes" : "No",
                                                    },
                                                ].map(({label, val}) => (
                                                    <div key={label} className="flex items-center justify-between py-1">
                                                        <span className={`text-[10px] ${c.dim}`}>{label}</span>
                                                        <span
                                                            className={`text-[10px] font-semibold font-mono ${
                                                                val && val !== "Disabled" && val !== "No"
                                                                    ? c.sub
                                                                    : c.dim
                                                            }`}
                                                        >
                                                            {val || "—"}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add placeholder */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className={`h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group
                                ${
                                    isDark
                                        ? "border-white/[0.05] text-slate-700 hover:text-slate-400 hover:border-white/[0.10] hover:bg-white/[0.01]"
                                        : "border-gray-200 text-gray-300 hover:text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                                    isDark
                                        ? "bg-white/[0.03] group-hover:bg-white/[0.05]"
                                        : "bg-gray-50 group-hover:bg-gray-100"
                                }`}
                            >
                                <Plus size={18} />
                            </div>
                            <span
                                className="text-[10px] font-bold uppercase tracking-[0.15em]"
                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                            >
                                Tambah Profile
                            </span>
                        </button>
                    </div>
                )}

                {filtered.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div
                            className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${
                                isDark ? "bg-white/[0.02] border-white/[0.04]" : "bg-gray-50 border-gray-200"
                            }`}
                        >
                            <Wifi size={24} className={c.dim} />
                        </div>
                        <p className={`font-semibold text-sm ${c.sub}`}>Belum ada profile</p>
                    </div>
                )}
            </div>

            {showAddModal && (
                <ProfileModal
                    title="Tambah Profile"
                    icon={<Plus size={14} className="text-emerald-400" />}
                    data={formData}
                    onChange={(k, v) => setFormData((p) => ({...p, [k]: v}))}
                    onClose={() => {
                        setShowAddModal(false);
                        setFormData(empty);
                    }}
                    onSave={handleAdd}
                    saveLabel="Buat Profile"
                    isDark={isDark}
                    saveCls="from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500"
                />
            )}
            {editingProfile && (
                <ProfileModal
                    title="Edit Profile"
                    icon={<Edit2 size={14} className="text-sky-400" />}
                    data={editingProfile}
                    onChange={(k, v) => setEditing((p) => ({...p, [k]: v}))}
                    onClose={() => setEditing(null)}
                    onSave={handleUpdate}
                    saveLabel="Simpan"
                    isDark={isDark}
                    saveCls="from-sky-500 to-blue-700 hover:from-sky-400 hover:to-blue-600"
                />
            )}
        </div>
    );
}

function ProfileModal({title, icon, data, onChange, onClose, onSave, saveLabel, isDark, saveCls}) {
    const fields = [
        {label: "Nama Profile", key: "name", ph: "Contoh: 1-hari", span: 2},
        {label: "Shared Users", key: "shared-users", ph: "1", type: "number"},
        {label: "Rate Limit", key: "rate-limit", ph: "1M/1M"},
        {label: "Session Timeout", key: "session-timeout", ph: "1d, 12h"},
        {label: "Idle Timeout", key: "idle-timeout", ph: "5m"},
        {label: "Keepalive Timeout", key: "keepalive-timeout", ph: "15m"},
        {label: "MAC Cookie Timeout", key: "mac-cookie-timeout", ph: "3d"},
        {label: "Autorefresh", key: "status-autorefresh", ph: "1m"},
    ];
    const inputCls = isDark
        ? "w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/40 transition"
        : "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
                className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] ${
                    isDark ? "bg-[#0c1220] border-white/[0.07]" : "bg-white border-gray-200"
                }`}
            >
                <div
                    className={`flex items-center justify-between px-5 py-4 border-b ${
                        isDark ? "border-white/[0.05]" : "border-gray-100"
                    }`}
                >
                    <h2
                        className={`text-sm font-bold flex items-center gap-2 ${
                            isDark ? "text-white" : "text-gray-900"
                        }`}
                    >
                        {icon}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                            isDark ? "hover:bg-white/8 text-slate-500" : "hover:bg-gray-100 text-gray-400"
                        }`}
                    >
                        <X size={14} />
                    </button>
                </div>
                <div className="overflow-y-auto p-5">
                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(({label, key, ph, type, span}) => (
                            <div key={key} className={span === 2 ? "col-span-2" : ""}>
                                <label
                                    className={`block text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5 ${
                                        isDark ? "text-slate-600" : "text-gray-400"
                                    }`}
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    {label}
                                </label>
                                <input
                                    type={type || "text"}
                                    value={data[key] || ""}
                                    placeholder={ph}
                                    onChange={(e) => onChange(key, e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        ))}
                    </div>
                    <div
                        className={`flex items-center gap-5 mt-4 pt-4 border-t ${
                            isDark ? "border-white/[0.05]" : "border-gray-100"
                        }`}
                    >
                        {[
                            {key: "transparent-proxy", label: "Transparent Proxy"},
                            {key: "add-mac-cookie", label: "Add MAC Cookie"},
                        ].map(({key, label}) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data[key] || false}
                                    onChange={(e) => onChange(key, e.target.checked)}
                                    className="w-4 h-4 rounded accent-cyan-500"
                                />
                                <span className={`text-xs ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                <div
                    className={`flex items-center justify-end gap-2 px-5 py-4 border-t ${
                        isDark ? "border-white/[0.05]" : "border-gray-100"
                    }`}
                >
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                            isDark
                                ? "bg-white/[0.03] border-white/[0.07] text-slate-400 hover:bg-white/[0.06]"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                        }`}
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        className={`px-4 py-2 rounded-xl bg-gradient-to-r ${saveCls} text-white text-sm font-bold shadow-lg transition active:scale-95 flex items-center gap-2`}
                    >
                        <Save size={13} /> {saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
