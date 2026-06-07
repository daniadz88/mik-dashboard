import React, {useState, useEffect} from "react";
import {
    Users,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Search,
    RefreshCw,
    Shield,
    User,
    Mail,
    Key,
    Check,
    AlertCircle,
} from "lucide-react";
import {useTheme} from "../components/ThemeContext";
import api from "../api.js";

export default function AppUsers() {
    const {theme} = useTheme();
    const isDark = theme === "dark";
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEdit] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [notification, setNotif] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        username: "",
        password: "",
        role: "operator",
        active: true,
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const d = await api.get(`/app-users`);
            setUsers(d || []);
        } catch {
            showNotif("Gagal memuat users", "error");
        } finally {
            setLoading(false);
        }
    };

    const showNotif = (message, type = "success") => {
        setNotif({message, type});
        setTimeout(() => setNotif(null), 3000);
    };

    const handleAdd = async () => {
        try {
            await api.post(`/app-users`, formData);
            setShowAddModal(false);
            resetForm();
            fetchUsers();
            showNotif("User berhasil ditambahkan!");
        } catch (err) {
            showNotif(err?.error || "Gagal menambahkan user", "error");
        }
    };

    const handleUpdate = async () => {
        if (!editingUser) return;
        try {
            await api.patch(`/app-users/${editingUser.id}`, editingUser);
            setShowEdit(false);
            setEditingUser(null);
            fetchUsers();
            showNotif("User diperbarui!");
        } catch (err) {
            showNotif(err?.error || "Gagal memperbarui", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Yakin hapus user ini?")) return;
        try {
            await api.delete(`/app-users/${id}`);
            fetchUsers();
            showNotif("User dihapus");
        } catch {
            showNotif("Gagal menghapus", "error");
        }
    };

    const resetForm = () =>
        setFormData({name: "", email: "", username: "", password: "", role: "operator", active: true});

    const filtered = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const avatarColor = (name) => {
        const colors = [
            "from-violet-500 to-purple-700",
            "from-cyan-500 to-blue-700",
            "from-emerald-500 to-teal-700",
            "from-amber-500 to-orange-700",
            "from-rose-500 to-pink-700",
        ];
        return colors[(name?.charCodeAt(0) || 0) % colors.length];
    };

    const c = isDark
        ? {
              bg: "bg-[#060b14]",
              card: "bg-[#0c1220] border-white/[0.05]",
              text: "text-white",
              sub: "text-slate-400",
              dim: "text-slate-600",
              thead: "bg-white/[0.02] border-white/[0.04]",
              divider: "divide-white/[0.04]",
              hover: "hover:bg-white/[0.02]",
              input: "bg-white/[0.03] border-white/[0.07] text-white placeholder-slate-700 focus:border-rose-500/40",
              sel: "bg-[#0c1220] border-white/[0.07] text-white",
          }
        : {
              bg: "bg-gray-50",
              card: "bg-white border-gray-200",
              text: "text-gray-900",
              sub: "text-gray-500",
              dim: "text-gray-400",
              thead: "bg-gray-50 border-gray-200",
              divider: "divide-gray-100",
              hover: "hover:bg-gray-50",
              input: "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-rose-400",
              sel: "bg-white border-gray-300 text-gray-900",
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
                    {notification.message}
                </div>
            )}

            <div className="max-w-5xl mx-auto p-5 lg:p-7 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${c.text}`}>App Users</h1>
                            <p className={`text-xs ${c.dim}`}>{users.length} pengguna terdaftar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden sm:block">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${c.dim}`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari user..."
                                className={`pl-9 pr-4 py-2 w-44 rounded-xl border text-sm focus:outline-none transition ${c.input}`}
                            />
                        </div>
                        <button
                            onClick={fetchUsers}
                            className={`p-2.5 rounded-xl border transition ${c.card} ${c.dim}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-sm font-bold shadow-lg shadow-rose-900/20 transition active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Tambah
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className={`rounded-2xl border overflow-hidden ${c.card}`}>
                    <table className="w-full">
                        <thead>
                            <tr className={`border-b ${c.thead}`}>
                                {["User", "Email", "Role", "Status", "Aksi"].map((h, i) => (
                                    <th
                                        key={h}
                                        className={`px-4 py-3 text-left text-[9px] font-bold uppercase tracking-[0.18em] ${
                                            c.dim
                                        }
                                        ${h === "Email" ? "hidden md:table-cell" : ""} ${
                                            h === "Aksi" ? "text-right" : ""
                                        }`}
                                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${c.divider}`}>
                            {filtered.map((user) => (
                                <tr key={user.id} className={`transition group ${c.hover}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${avatarColor(
                                                    user.name
                                                )} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}
                                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                                            >
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`font-semibold text-sm ${c.text}`}>{user.name}</div>
                                                <div className={`text-[10px] font-mono ${c.dim}`}>@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className={`text-xs ${c.sub}`}>{user.email}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider
                                            ${
                                                user.role === "admin"
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                            }`}
                                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    user.active ? "bg-emerald-400" : "bg-slate-600"
                                                }`}
                                            />
                                            <span
                                                className={`text-xs font-medium ${
                                                    user.active ? "text-emerald-400" : c.dim
                                                }`}
                                            >
                                                {user.active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingUser({...user});
                                                    setShowEdit(true);
                                                }}
                                                className={`p-1.5 rounded-lg transition ${c.dim} hover:text-sky-400 hover:bg-sky-500/8`}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className={`p-1.5 rounded-lg transition ${c.dim} hover:text-red-400 hover:bg-red-500/8`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <Users className={`w-10 h-10 mx-auto mb-3 ${c.dim}`} />
                            <p className={`font-medium text-sm ${c.sub}`}>Belum ada user</p>
                        </div>
                    )}
                </div>
            </div>

            {showAddModal && (
                <UserModal
                    title="Tambah User"
                    isDark={isDark}
                    c={c}
                    isNew
                    data={formData}
                    onChange={(k, v) => setFormData((p) => ({...p, [k]: v}))}
                    onClose={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}
                    onSave={handleAdd}
                    saveCls="from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-rose-900/20"
                />
            )}
            {showEditModal && editingUser && (
                <UserModal
                    title="Edit User"
                    isDark={isDark}
                    c={c}
                    data={editingUser}
                    onChange={(k, v) => setEditingUser((p) => ({...p, [k]: v}))}
                    onClose={() => {
                        setShowEdit(false);
                        setEditingUser(null);
                    }}
                    onSave={handleUpdate}
                    saveCls="from-sky-500 to-blue-700 hover:from-sky-400 hover:to-blue-600 shadow-sky-900/20"
                />
            )}
        </div>
    );
}

// Ganti UserModal function dengan ini:
function UserModal({title, isDark, c, data, onChange, onClose, onSave, saveCls, isNew}) {
    const fields = [
        {label: "Nama Lengkap", key: "name", type: "text", icon: User},
        {label: "Username", key: "username", type: "text", icon: Key},
        {label: "Email", key: "email", type: "email", icon: Mail},
        {
            label: "Password" + (isNew ? "" : " (kosongkan jika tidak diubah)"),
            key: "password",
            type: "password",
            icon: Key,
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
                className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col
                ${isDark ? "bg-[#0c1220] border-white/[0.07]" : "bg-white border-gray-200"}`}
            >
                <div
                    className={`flex items-center justify-between px-5 py-4 border-b
                    ${isDark ? "border-white/[0.05]" : "border-gray-100"}`}
                >
                    <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h2>
                    <button
                        onClick={onClose}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition
                            ${isDark ? "hover:bg-white/[0.08] text-slate-500" : "hover:bg-gray-100 text-gray-400"}`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-3">
                    {fields.map(({label, key, type, icon: Icon}) => (
                        <div key={key}>
                            <label
                                className={`block text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5
                                ${isDark ? "text-slate-600" : "text-gray-400"}`}
                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                            >
                                {label}
                            </label>
                            <div className="relative">
                                <Icon
                                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5
                                    ${isDark ? "text-slate-700" : "text-gray-400"}`}
                                />
                                <input
                                    type={type}
                                    value={data[key] || ""}
                                    onChange={(e) => onChange(key, e.target.value)}
                                    placeholder={!isNew && key === "password" ? "••••••••" : ""}
                                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition ${c.input}`}
                                />
                            </div>
                        </div>
                    ))}

                    <div>
                        <label
                            className={`block text-[9px] font-bold uppercase tracking-[0.18em] mb-1.5
                            ${isDark ? "text-slate-600" : "text-gray-400"}`}
                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                        >
                            Role
                        </label>
                        <select
                            value={data.role || "operator"}
                            onChange={(e) => onChange("role", e.target.value)}
                            className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none transition ${c.sel}`}
                        >
                            <option value="admin">Admin</option>
                            <option value="operator">Operator</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                        <input
                            type="checkbox"
                            checked={data.active !== false}
                            onChange={(e) => onChange("active", e.target.checked)}
                            className="w-4 h-4 rounded accent-rose-500"
                        />
                        <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>Aktif</span>
                    </label>
                </div>

                <div
                    className={`flex items-center justify-end gap-2 px-5 py-4 border-t
                    ${isDark ? "border-white/[0.05]" : "border-gray-100"}`}
                >
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition
                            ${
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
                        <Save className="w-3.5 h-3.5" /> Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
