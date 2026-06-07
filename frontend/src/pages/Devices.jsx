import {useState, useEffect, useCallback} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {useApp} from "../useApp.jsx";
import {useTheme} from "../components/ThemeContext.jsx";
import api from "../api.js";
import {Router, Plus, Trash2, Edit2, CheckCircle2, Wifi, WifiOff, X, Save, Lock, ArrowRight, ScanLine} from "lucide-react";

function StableInput({label, value, onChange, placeholder, type = "text"}) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue((prev) => (prev !== value ? value : prev));
    }, [value]);

    return (
        <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 text-white/30"
                   style={{fontFamily: "'JetBrains Mono',monospace"}}>
                {label}
            </label>
            <input
                type={type}
                value={localValue}
                onChange={(e) => {
                    setLocalValue(e.target.value);
                    onChange(e.target.value);
                }}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5
                           text-sm text-white/80 placeholder-white/20
                           focus:outline-none focus:border-cyan-400/40 focus:bg-white/8
                           transition backdrop-blur-sm"
            />
        </div>
    );
}

export default function Devices() {
    const {selectedDevice, setSelectedDevice, addToast} = useApp();
    const {theme} = useTheme();
    const isDark = theme === "dark";
    const navigate = useNavigate();
    const location = useLocation();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        host: "",
        port: "8728",
        username: "admin",
        password: "",
        https: false,
    });

    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const d = await api.get("/devices");
            setDevices(Array.isArray(d) ? d : []);
        } catch (err) {
            setError(err?.error || "Gagal memuat device");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const noDeviceAlert = location.state?.reason === "no-device";

    const updateFormField = useCallback((key, value) => {
        setFormData((prev) => ({...prev, [key]: value}));
    }, []);

    const handleSubmit = async () => {
        try {
            const payload = {
                ...formData,
                port: parseInt(formData.port) || 8728,
                https: formData.https ? 1 : 0,
            };
            if (editing) {
                await api.put(`/devices/${editing}`, payload);
                addToast("Device diupdate", "success");
                // FIX: update selectedDevice di localStorage jika device yg diedit adalah device aktif
                if (selectedDevice?.id === editing) {
                    const updated = {...selectedDevice, ...payload, id: editing};
                    setSelectedDevice(updated);
                }
            } else {
                await api.post("/devices", payload);
                addToast("Device ditambahkan", "success");
            }
            setShowForm(false);
            setEditing(null);
            setFormData({name: "", host: "", port: "8728", username: "admin", password: "", https: false});
            // FIX: fetch ulang lalu auto-select device baru jika belum ada yang dipilih
            const refreshed = await api.get("/devices");
            const list = Array.isArray(refreshed) ? refreshed : [];
            setDevices(list);
            if (!selectedDevice && !editing && list.length > 0) {
                const newest = list[list.length - 1];
                setSelectedDevice(newest);
                addToast(`"${newest.name}" otomatis dipilih`, "info");
            }
        } catch (err) {
            addToast(err?.error || "Gagal menyimpan", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus device ini?")) return;
        try {
            await api.delete(`/devices/${id}`);
            if (selectedDevice?.id === id) setSelectedDevice(null);
            addToast("Device dihapus", "success");
            fetchDevices();
        } catch (err) {
            addToast(err?.error || "Gagal menghapus", "error");
        }
    };

    const handleEdit = (device) => {
        setEditing(device.id);
        setFormData({
            name: device.name,
            host: device.host,
            port: String(device.port || 8728),
            username: device.username,
            password: "",
            https: device.https === 1,
        });
        setShowForm(true);
    };

    const handleSelect = (device) => {
        setSelectedDevice(device);
        addToast(`"${device.name}" dipilih sebagai device aktif`, "success");
        setTimeout(() => navigate("/dashboard"), 500);
    };

    const c = isDark
        ? {
              bg: "bg-[#060b14]",
              card: "bg-[#0c1220] border-white/[0.05]",
              text: "text-white",
              sub: "text-slate-400",
              dim: "text-slate-600",
              input: "bg-white/[0.03] border-white/[0.07] text-white placeholder-slate-700 focus:border-cyan-500/40 focus:bg-cyan-500/[0.02]",
          }
        : {
              bg: "bg-gray-50",
              card: "bg-white border-gray-200",
              text: "text-gray-900",
              sub: "text-gray-500",
              dim: "text-gray-400",
              input: "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-400",
          };

    return (
        <div className={`min-h-screen ${c.bg} ${c.text}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            <div className="max-w-4xl mx-auto p-5 lg:p-7">
                <div className="flex items-center justify-between mb-6 pt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Router size={17} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${c.text}`}>Devices</h1>
                            <p className={`text-xs ${c.dim}`}>{devices.length} perangkat terdaftar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate("/scanner")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10
                                       bg-white/5 text-xs text-cyan-400 hover:bg-cyan-500/10 transition"
                        >
                            <ScanLine size={13} /> Scanner
                        </button>
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditing(null);
                                setFormData({name: "", host: "", port: "8728", username: "admin", password: "", https: false});
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-sm font-bold transition shadow-lg shadow-cyan-900/20 active:scale-95"
                        >
                            {showForm ? <><X size={14} /> Batal</> : <><Plus size={14} /> Tambah</>}
                        </button>
                    </div>
                </div>

                {noDeviceAlert && (
                    <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="text-sm font-bold text-amber-400">Pilih Perangkat Terlebih Dahulu</p>
                            <p className="text-xs text-amber-400/60 mt-0.5">
                                Pilih salah satu device MikroTik di bawah untuk mengakses Dashboard dan fitur lainnya.
                            </p>
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className={`rounded-2xl border mb-5 overflow-hidden ${c.card}`}>
                        <div className="px-5 py-3.5 border-b border-white/[0.04]">
                            <h2 className={`text-xs font-bold uppercase tracking-[0.15em] ${c.dim}`}
                                style={{fontFamily: "'JetBrains Mono',monospace"}}>
                                {editing ? "Edit Device" : "Tambah Device Baru"}
                            </h2>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StableInput label="Nama" value={formData.name} onChange={(v) => updateFormField("name", v)} placeholder="Main Router" />
                            <StableInput label="Host / IP" value={formData.host} onChange={(v) => updateFormField("host", v)} placeholder="192.168.1.1" />
                            <StableInput label="Port API" value={formData.port} onChange={(v) => updateFormField("port", v)} placeholder="8728" />
                            <StableInput label="Username" value={formData.username} onChange={(v) => updateFormField("username", v)} placeholder="admin" />
                            <StableInput label="Password" value={formData.password} onChange={(v) => updateFormField("password", v)} placeholder={editing ? "Kosongkan jika tidak diubah" : "••••••••"} type="password" />
                            <div className="flex items-end">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="checkbox" checked={formData.https} onChange={(e) => updateFormField("https", e.target.checked)} className="w-4 h-4 rounded accent-cyan-500" />
                                    <span className={`text-sm ${c.sub} flex items-center gap-1.5`}>
                                        <Lock size={12} className="text-amber-400" /> Gunakan HTTPS (API-SSL)
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <button onClick={handleSubmit}
                                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 transition shadow-lg shadow-cyan-900/20 active:scale-[0.99] flex items-center justify-center gap-2">
                                <Save size={14} /> {editing ? "Update Device" : "Simpan Device"}
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/8 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-4 text-sm">{error}</div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <span className={`text-sm ${c.dim}`}>Memuat device...</span>
                    </div>
                )}

                {!loading && devices.length === 0 && (
                    <div className="text-center py-20">
                        <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${c.card}`}>
                            <Router size={28} className={c.dim} />
                        </div>
                        <p className={`font-semibold ${c.sub}`}>Belum ada device</p>
                        <p className={`text-sm mt-1 ${c.dim}`}>Klik "Tambah" untuk mendaftarkan perangkat MikroTik</p>
                        <button onClick={() => navigate("/scanner")}
                            className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/10 transition">
                            <ScanLine size={14} /> Scan Jaringan
                        </button>
                    </div>
                )}

                <div className="space-y-3">
                    {devices.map((device) => {
                        const isSelected = selectedDevice?.id === device.id;
                        return (
                            <div key={device.id}
                                className={`rounded-2xl border p-5 transition-all ${c.card} ${isSelected ? "border-cyan-500/25 shadow-lg shadow-cyan-900/10" : ""}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border
                                            ${isSelected ? "bg-cyan-500/10 border-cyan-500/25" : isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
                                            {isSelected ? <Wifi size={19} className="text-cyan-400" /> : <WifiOff size={19} className={c.dim} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className={`font-bold text-sm ${c.text}`}>{device.name}</h3>
                                                {isSelected && (
                                                    <span className="text-[9px] px-2 py-0.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-full font-bold tracking-wider"
                                                          style={{fontFamily: "'JetBrains Mono',monospace"}}>ACTIVE</span>
                                                )}
                                            </div>
                                            <p className={`text-xs font-mono ${c.dim}`}>{device.host}:{device.port}</p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${isDark ? "bg-white/[0.03] border-white/[0.05] text-slate-500" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                                                    {device.type || "mikrotik"}
                                                </span>
                                                {device.https === 1 && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold flex items-center gap-1">
                                                        <Lock size={8} /> SSL
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <button onClick={() => handleSelect(device)}
                                            className={`p-2 rounded-xl transition ${isSelected ? "bg-cyan-500/15 text-cyan-400" : `${c.dim} hover:text-cyan-400 hover:bg-cyan-500/8`}`}
                                            title={isSelected ? "Aktif" : "Pilih & ke Dashboard"}>
                                            {isSelected ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
                                        </button>
                                        <button onClick={() => handleEdit(device)}
                                            className={`p-2 rounded-xl transition ${c.dim} hover:text-amber-400 hover:bg-amber-500/8`} title="Edit">
                                            <Edit2 size={15} />
                                        </button>
                                        <button onClick={() => handleDelete(device.id)}
                                            className={`p-2 rounded-xl transition ${c.dim} hover:text-red-400 hover:bg-red-500/8`} title="Hapus">
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}