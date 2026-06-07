import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useApp} from "../useApp.jsx";
import {useSettings} from "../useSettings.js";
import api from "../api.js";
import {Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Wifi} from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const {login} = useApp();
    const navigate = useNavigate();
    const settings = useSettings();

    const appName = settings.appName || settings.companyName || "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Username dan password wajib diisi");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/auth/login", {username, password});
            if (!res.token || !res.user) throw new Error("Response tidak valid");
            login(res.token, res.user);
            navigate("/dashboard");
        } catch (err) {
            let msg = err?.error || err?.message || "Login gagal";
            if (msg.includes("Unauthorized") || msg.includes("invalid")) msg = "Username atau password salah";
            else if (msg.includes("Network") || msg.includes("ECONNREFUSED")) msg = "Tidak bisa terhubung ke server";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-[#060b14] flex items-center justify-center p-4 relative overflow-hidden"
            style={{fontFamily: "'DM Sans',sans-serif"}}
        >
            {/* Background grid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.04) 1px, transparent 1px)`,
                        backgroundSize: "48px 48px",
                    }}
                />
                <div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                    style={{background: "radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)"}}
                />
                <div
                    className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full"
                    style={{background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)"}}
                />
            </div>

            <div className="w-full max-w-[380px] relative z-10">
                {/* ── Header ── */}
                <div className="text-center mb-8">
                    <div className="relative w-16 h-16 mx-auto mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/25 flex items-center justify-center backdrop-blur-xl">
                            <Wifi size={28} className="text-cyan-400" />
                        </div>
                        <div
                            className="absolute inset-0 rounded-2xl border border-cyan-500/20 animate-ping"
                            style={{animationDuration: "3s"}}
                        />
                    </div>

                    {/* Nama dari settings — tidak hardcode */}
                    {appName ? (
                        <h1
                            className="text-2xl font-black text-white tracking-[0.12em] uppercase mb-1"
                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                        >
                            {appName}
                        </h1>
                    ) : (
                        // Kalau settings belum load / kosong, tampilkan dot loader
                        <div className="h-8 flex items-center justify-center gap-1 mb-1">
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className="w-1.5 h-1.5 bg-cyan-500/40 rounded-full animate-pulse"
                                    style={{animationDelay: `${i * 0.2}s`}}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-px bg-gradient-to-r from-transparent to-cyan-500/40" />
                        <p className="text-[11px] text-slate-500 tracking-[0.2em] uppercase">Hotspot Manager v2.0</p>
                        <div className="w-12 h-px bg-gradient-to-l from-transparent to-cyan-500/40" />
                    </div>
                </div>

                {/* ── Card ── */}
                <div
                    className="relative rounded-2xl border border-white/[0.06] overflow-hidden"
                    style={{background: "rgba(13,17,30,0.85)", backdropFilter: "blur(20px)"}}
                >
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                    <div className="p-7">
                        {error && (
                            <div className="flex items-start gap-2.5 bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3.5 mb-5">
                                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label
                                    className="block text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-semibold"
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    autoComplete="username"
                                    placeholder="admin"
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (error) setError("");
                                    }}
                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3
                                               text-sm text-white placeholder-slate-700
                                               focus:outline-none focus:border-cyan-500/40 focus:bg-cyan-500/[0.03] transition-all"
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    className="block text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2 font-semibold"
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={password}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (error) setError("");
                                        }}
                                        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-11
                                                   text-sm text-white placeholder-slate-700
                                                   focus:outline-none focus:border-cyan-500/40 focus:bg-cyan-500/[0.03] transition-all"
                                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition p-0.5"
                                    >
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading || !username || !password}
                                className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm text-white
                                           bg-gradient-to-r from-cyan-600 to-blue-700
                                           hover:from-cyan-500 hover:to-blue-600
                                           disabled:opacity-30 disabled:cursor-not-allowed
                                           shadow-lg shadow-cyan-900/30 active:scale-[0.98] transition-all
                                           flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" /> Memverifikasi...
                                    </>
                                ) : (
                                    <>
                                        <span>Masuk ke Sistem</span>
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-white/[0.04]">
                            <p className="text-center text-[10px] text-slate-600 mb-2 tracking-[0.1em] uppercase">
                                Default Credentials
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <code
                                    className="bg-white/[0.03] border border-white/[0.06] text-cyan-400/80 px-2.5 py-1 rounded-lg text-[11px]"
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    admin
                                </code>
                                <span className="text-slate-700 text-xs">/</span>
                                <code
                                    className="bg-white/[0.03] border border-white/[0.06] text-cyan-400/80 px-2.5 py-1 rounded-lg text-[11px]"
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    admin123
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] text-slate-700 mt-5 tracking-[0.1em]">Hotspot Manager v2.0</p>
            </div>
        </div>
    );
}
