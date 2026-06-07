import {useState, useEffect, useCallback, useRef} from "react";
import {useApp} from "../useApp.jsx";
import {useTheme} from "../components/ThemeContext.jsx";
import {useSettings} from "../useSettings.js";
import api from "../api.js";
import {
    Settings, Save, Loader2, CheckCircle2,
    Type, Palette, Printer, RefreshCw, Upload, X, QrCode, Image,
} from "lucide-react";

/* ─── Stable Input ─── */
function StableInput({label, value, onChange, placeholder, type = "text", disabled, t}) {
    const inputRef = useRef(null);
    const [localValue, setLocalValue] = useState(value);
    useEffect(() => { setLocalValue(prev => prev !== value ? value : prev); }, [value]);
    return (
        <div>
            {label && <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 ${t.label}`}>{label}</label>}
            <input
                ref={inputRef}
                type={type}
                value={localValue}
                onChange={e => { setLocalValue(e.target.value); onChange(e.target.value); }}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition disabled:opacity-40 ${t.input}`}
            />
        </div>
    );
}

/* ─── Stable Textarea ─── */
function StableTextarea({label, value, onChange, placeholder, rows = 3, disabled, t}) {
    const [localValue, setLocalValue] = useState(value);
    useEffect(() => { setLocalValue(prev => prev !== value ? value : prev); }, [value]);
    return (
        <div>
            {label && <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 ${t.label}`}>{label}</label>}
            <textarea
                value={localValue}
                onChange={e => { setLocalValue(e.target.value); onChange(e.target.value); }}
                placeholder={placeholder}
                rows={rows}
                disabled={disabled}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition resize-none disabled:opacity-40 ${t.input}`}
            />
        </div>
    );
}

/* ─── Toggle Switch ─── */
function ToggleSwitch({label, description, checked, onChange, disabled, t, accentColor = "bg-cyan-500 border-cyan-500"}) {
    return (
        <div className="flex items-center justify-between py-1 gap-4">
            <div className="flex-1 min-w-0">
                <span className={`text-sm font-semibold block ${t.text}`}>{label}</span>
                {description && <span className={`text-[11px] leading-tight block mt-0.5 ${t.dim}`}>{description}</span>}
            </div>
            <button
                type="button"
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
                aria-checked={checked}
                role="switch"
                className={`w-11 h-6 rounded-full border-2 transition-all relative disabled:opacity-40 flex-shrink-0
                    ${checked ? accentColor : "bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600"}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                    ${checked ? "left-[22px]" : "left-0.5"}`} />
            </button>
        </div>
    );
}

/* ─── Section Card ─── */
function SectionCard({icon: Icon, title, color, children, t}) {
    return (
        <div className={`rounded-2xl border p-5 ${t.card}`}>
            <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${t.divider}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{background: `${color}18`, border: `1px solid ${color}30`}}>
                    <Icon size={13} style={{color}} />
                </div>
                <span className={`text-sm font-bold ${t.text}`}>{title}</span>
            </div>
            {children}
        </div>
    );
}

/* ─── Logo Upload Component ─── */
function LogoUpload({value, onChange, t, isDark}) {
    const fileRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);

    const processFile = useCallback((file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (e) => { onChange(e.target.result); setUploading(false); };
        reader.readAsDataURL(file);
    }, [onChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragOver(false);
        processFile(e.dataTransfer.files[0]);
    }, [processFile]);

    const handleChange = useCallback((e) => { processFile(e.target.files[0]); }, [processFile]);

    return (
        <div className="space-y-2">
            <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] ${t.label}`}>Logo Aplikasi</label>

            {value && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-gray-50"}`}>
                    <img src={value} alt="Logo preview" className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
                         style={{background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}} />
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t.text}`}>Logo terpasang</p>
                        <p className={`text-[11px] mt-0.5 ${t.dim}`}>{value.startsWith("data:") ? "File lokal (base64)" : "URL eksternal"}</p>
                    </div>
                    <button onClick={() => onChange("")}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-red-500/20 flex-shrink-0 ${t.dim}`}>
                        <X size={13} />
                    </button>
                </div>
            )}

            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                 onDragLeave={() => setDragOver(false)}
                 onDrop={handleDrop}
                 onClick={() => fileRef.current?.click()}
                 className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-5
                    ${dragOver ? "border-cyan-400 bg-cyan-400/5"
                        : isDark ? "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]"
                        : "border-gray-300 hover:border-cyan-400 hover:bg-gray-50"}`}>
                {uploading ? <Loader2 size={20} className="animate-spin text-cyan-400" /> : (
                    <>
                        <Upload size={18} className={dragOver ? "text-cyan-400" : t.dim} />
                        <div className="text-center">
                            <p className={`text-xs font-semibold ${dragOver ? "text-cyan-400" : t.sub}`}>{value ? "Ganti logo" : "Upload logo"}</p>
                            <p className={`text-[10px] mt-0.5 ${t.dim}`}>PNG, JPG, SVG · Maks 2MB</p>
                        </div>
                    </>
                )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
            <div>
                <label className={`block text-[10px] font-medium mb-1 ${t.dim}`}>atau masukkan URL gambar</label>
                <StableInput label="" value={value && !value.startsWith("data:") ? value : ""}
                    onChange={v => onChange(v)} placeholder="https://example.com/logo.png" t={t} />
            </div>
        </div>
    );
}

/* ─── QR Preview Box (QR asli via API) ─── */
function QrPreviewBox({enabled, t, isDark}) {
    if (!enabled) return (
        <div className={`flex flex-col items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
            <QrCode size={22} className={t.dim} />
            <p className={`text-[11px] ${t.dim}`}>QR Code dinonaktifkan</p>
        </div>
    );
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=user%3Apassword&bgcolor=ffffff&color=000000`;
    return (
        <div className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border ${isDark ? "border-white/[0.1] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
            <img src={qrUrl} alt="QR Preview" width={80} height={80} className="rounded-lg" />
            <p className={`text-[11px] font-medium ${t.sub}`}>QR Code aktif</p>
            <p className={`text-[10px] ${t.dim}`}>Akan muncul di print voucher</p>
        </div>
    );
}

/* ─── Preview Voucher Card (QR asli) ─── */
function PreviewCard({settings, t, isDark}) {
    const {appName, companyName, primaryColor, showLogo, logoUrl, footerText, showQrCode} = settings;
    const qrUrl = showQrCode
        ? `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=ABC123%3A12345678&bgcolor=ffffff&color=000000`
        : null;
    return (
        <div className={`rounded-2xl border p-4 ${t.card}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${t.dim}`}>Preview Voucher</p>
            <div className="rounded-xl border-2 border-dashed p-4 text-center space-y-2"
                 style={{borderColor: primaryColor + "50"}}>
                {showLogo && logoUrl && (
                    <img src={logoUrl} alt="logo" className="w-10 h-10 mx-auto rounded-lg object-contain"
                         style={{background: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}} />
                )}
                {showLogo && !logoUrl && (
                    <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                        <Image size={16} className={t.dim} />
                    </div>
                )}
                <h3 className="text-sm font-bold" style={{color: primaryColor}}>
                    {appName || "MIK Dashboard"}
                </h3>
                {companyName && <p className={`text-[11px] ${t.sub}`}>{companyName}</p>}
                <div className={`py-2 px-3 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                    <p className={`text-[11px] font-mono ${t.dim}`}>USER: <span className={t.text}>ABC123</span></p>
                    <p className={`text-[11px] font-mono ${t.dim}`}>PASS: <span className={t.text}>12345678</span></p>
                </div>
                {showQrCode && qrUrl && (
                    <div className="flex justify-center pt-1">
                        <img src={qrUrl} alt="QR Code" width={56} height={56} className="rounded" />
                    </div>
                )}
                {footerText && <p className={`text-[10px] ${t.dim}`}>{footerText}</p>}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function SystemSettings() {
    const {addToast} = useApp();
    const {theme} = useTheme();
    const savedSettings = useSettings();
    const isDark = theme === "dark";

    const [form, setForm] = useState({
        appName: "", companyName: "", address: "", phone: "",
        footerText: "", showQrCode: false, showLogo: false,
        logoUrl: "", primaryColor: "#0ea5e9", theme: "dark", printSize: "default",
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const initialized = useRef(false);

    // FIX: Only load saved settings ONCE on mount, never overwrite user changes
    useEffect(() => {
        if (initialized.current) return;

        let settingsToLoad = null;

        // Try localStorage first (fastest)
        try {
            const local = localStorage.getItem("hotspot_settings");
            if (local) settingsToLoad = JSON.parse(local);
        } catch (e) { /* ignore */ }

        // Fall back to useSettings hook if available
        if (!settingsToLoad && savedSettings && typeof savedSettings === "object") {
            settingsToLoad = savedSettings;
        }

        if (settingsToLoad) {
            setForm(prev => ({...prev, ...settingsToLoad}));
        }

        initialized.current = true;
        setLoading(false);
    }, []); // <-- EMPTY dependency array, runs ONCE only

    const updateField = useCallback((key, value) => {
        setForm(prev => ({...prev, [key]: value}));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post("/settings", form);
            if (res.success) {
                localStorage.setItem("hotspot_settings", JSON.stringify(res.settings || form));
                addToast("Settings berhasil disimpan", "success");
                window.dispatchEvent(new StorageEvent("storage", {
                    key: "hotspot_settings",
                    newValue: JSON.stringify(res.settings || form),
                }));
            }
        } catch (err) {
            addToast(err?.error || "Gagal menyimpan settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        try {
            const local = localStorage.getItem("hotspot_settings");
            if (local) {
                setForm(JSON.parse(local));
                addToast("Form direset", "info");
            }
        } catch (e) {
            addToast("Tidak ada data tersimpan", "info");
        }
    };

    const t = isDark ? {
        bg: "bg-[#060b14]",
        card: "bg-[#0c1220] border-white/[0.07]",
        text: "text-white",
        sub: "text-slate-300",
        dim: "text-slate-500",
        label: "text-slate-400",
        divider: "border-white/[0.06]",
        input: "bg-white/[0.06] border-white/[0.1] text-white placeholder-slate-600 focus:border-cyan-400/50",
        select: "bg-[#0c1220] border-white/[0.1] text-white",
        toggleBg: "bg-white/[0.04] border-white/[0.06]",
    } : {
        bg: "bg-gray-50",
        card: "bg-white border-gray-200",
        text: "text-gray-900",
        sub: "text-gray-600",
        dim: "text-gray-400",
        label: "text-gray-600",
        divider: "border-gray-100",
        input: "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-cyan-400",
        select: "bg-white border-gray-300 text-gray-900",
        toggleBg: "bg-gray-50 border-gray-100",
    };

    return (
        <div className={`min-h-screen ${t.bg}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            <div className="max-w-5xl mx-auto p-5 lg:p-7">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pt-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                            <Settings size={17} className={t.dim} />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${t.text}`}>System Settings</h1>
                            <p className={`text-xs ${t.dim}`}>Konfigurasi aplikasi &amp; voucher</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} disabled={saving || loading}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition disabled:opacity-40
                                ${isDark ? "border-white/10 text-slate-400 hover:text-slate-200 bg-white/5" : "border-gray-200 text-gray-500 hover:text-gray-700 bg-white"}`}>
                            <RefreshCw size={11} /> Reset
                        </button>
                        <button onClick={handleSave} disabled={saving || loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white text-sm font-bold transition shadow-lg disabled:opacity-40">
                            {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><Save size={14} /> Simpan</>}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3">
                        <Loader2 size={18} className="animate-spin text-cyan-400" />
                        <span className={t.dim}>Memuat settings...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Left (forms) */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Branding */}
                            <SectionCard icon={Type} title="Branding" color="#22d3ee" t={t}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <StableInput label="Nama Aplikasi" value={form.appName}
                                        onChange={v => updateField("appName", v)} placeholder="MIK Dashboard" t={t} />
                                    <StableInput label="Nama Perusahaan" value={form.companyName}
                                        onChange={v => updateField("companyName", v)} placeholder="PT. Contoh Sejahtera" t={t} />
                                    <StableInput label="Alamat" value={form.address}
                                        onChange={v => updateField("address", v)} placeholder="Jl. Contoh No. 123" t={t} />
                                    <StableInput label="Telepon" value={form.phone}
                                        onChange={v => updateField("phone", v)} placeholder="08123456789" t={t} />
                                </div>
                            </SectionCard>

                            {/* Appearance */}
                            <SectionCard icon={Palette} title="Appearance" color="#a78bfa" t={t}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 ${t.label}`}>Primary Color</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={form.primaryColor}
                                                onChange={e => updateField("primaryColor", e.target.value)}
                                                className="w-10 h-10 rounded-xl border cursor-pointer p-0.5 bg-transparent"
                                                style={{borderColor: isDark ? "rgba(255,255,255,0.1)" : "#d1d5db"}} />
                                            <StableInput label="" value={form.primaryColor}
                                                onChange={v => updateField("primaryColor", v)} placeholder="#0ea5e9" t={t} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 ${t.label}`}>Theme</label>
                                        <select value={form.theme} onChange={e => updateField("theme", e.target.value)}
                                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${t.select}`}>
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                        </select>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Logo */}
                            <SectionCard icon={Image} title="Logo Aplikasi" color="#f472b6" t={t}>
                                <div className="space-y-4">
                                    <div className={`p-3 rounded-xl border ${t.toggleBg}`}>
                                        <ToggleSwitch
                                            label="Tampilkan Logo di Voucher"
                                            description="Logo akan muncul di bagian atas saat cetak voucher"
                                            checked={!!form.showLogo}
                                            onChange={v => updateField("showLogo", v)}
                                            t={t}
                                            accentColor="bg-pink-500 border-pink-500"
                                        />
                                    </div>
                                    <LogoUpload value={form.logoUrl} onChange={v => updateField("logoUrl", v)} t={t} isDark={isDark} />
                                </div>
                            </SectionCard>

                            {/* Voucher & QR */}
                            <SectionCard icon={Printer} title="Voucher & QR Code" color="#fb923c" t={t}>
                                <div className="space-y-4">
                                    <StableTextarea label="Footer Text" value={form.footerText}
                                        onChange={v => updateField("footerText", v)}
                                        placeholder="Terima kasih telah menggunakan layanan kami" rows={2} t={t} />

                                    <div className={`p-4 rounded-xl border ${t.toggleBg}`}>
                                        <ToggleSwitch
                                            label="Tampilkan QR Code di Voucher"
                                            description="QR Code berisi username+password, bisa discan untuk login otomatis"
                                            checked={!!form.showQrCode}
                                            onChange={v => updateField("showQrCode", v)}
                                            t={t}
                                            accentColor="bg-orange-500 border-orange-500"
                                        />
                                        <div className="mt-4">
                                            <QrPreviewBox enabled={!!form.showQrCode} t={t} isDark={isDark} />
                                        </div>
                                        {!!form.showQrCode && (
                                            <p className={`text-[11px] mt-3 leading-relaxed ${t.dim}`}>
                                                💡 QR Code otomatis di-generate saat print voucher. Format: <code className={`text-xs px-1 py-0.5 rounded ${isDark ? "bg-white/10" : "bg-gray-100"}`}>user:password</code>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-[11px] font-bold uppercase tracking-[0.15em] mb-1.5 ${t.label}`}>Print Size</label>
                                        <select value={form.printSize} onChange={e => updateField("printSize", e.target.value)}
                                            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${t.select}`}>
                                            <option value="default">Default (80mm)</option>
                                            <option value="small">Small (58mm)</option>
                                            <option value="large">Large (A4)</option>
                                        </select>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Right (preview) */}
                        <div className="space-y-4">
                            <PreviewCard settings={form} t={t} isDark={isDark} />
                            <div className={`rounded-2xl border p-4 ${t.card}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                    <span className={`text-sm font-bold ${t.text}`}>Info</span>
                                </div>
                                <ul className={`text-xs leading-relaxed space-y-1.5 ${t.dim}`}>
                                    <li>• Logo disimpan sebagai base64 di database SQLite lokal</li>
                                    <li>• QR Code di-generate saat print, tidak perlu library eksternal</li>
                                    <li>• Settings tidak hilang saat server restart</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}