import {useState, useEffect, useRef} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api";
import {useApp} from "../useApp.jsx";
import {useTheme} from "../components/ThemeContext.jsx";
import {
    Wifi, HardDrive, Search, X, Check, Save, Loader2, AlertCircle,
    Radio, Plug, ArrowLeft, ScanLine, MonitorSmartphone, Network
} from "lucide-react";

/* ══════════════════════════════════════════
   WINBOX-STYLE SCANNER
══════════════════════════════════════════ */
export default function Scanner() {
    const navigate = useNavigate();
    const {setSelectedDevice: setAppDevice} = useApp();
    const {theme} = useTheme();
    const isDark = theme === "dark";

    const [step, setStep] = useState("scanning");
    const [networks, setNetworks] = useState([]);
    const [foundDevices, setFoundDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [credentials, setCredentials] = useState({username: "admin", password: ""});
    const [testStatus, setTestStatus] = useState(null);
    const [testMessage, setTestMessage] = useState("");
    const [error, setError] = useState("");
    const [logs, setLogs] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        doFullScan();
    }, []);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [logs]);

    const addLog = (msg, type = "info") => {
        const time = new Date().toLocaleTimeString("id-ID", {hour12: false});
        setLogs(prev => [...prev, {time, msg, type}]);
    };

    const doFullScan = async () => {
        setIsScanning(true);
        setStep("scanning");
        setFoundDevices([]);
        setSelectedDevice(null);
        setError("");
        addLog("Membaca adapter jaringan...", "info");

        try {
            const netRes = await api.get("/scan/networks");
            const nets = netRes.networks || [];
            setNetworks(nets);
            addLog(`${nets.length} adapter ditemukan`, "success");

            for (const net of nets) {
                addLog(`Scan ${net.name}: ${net.subnet}/${net.cidr}`, "info");
            }

            addLog("MNDP discovery...", "info");
            const scanRes = await api.get("/scan/scan?timeout=3000");
            const devices = scanRes.devices || [];

            if (devices.length > 0) {
                setFoundDevices(devices);
                addLog(`${devices.length} MikroTik ditemukan!`, "success");
                if (devices.length === 1) {
                    setSelectedDevice(devices[0]);
                    setStep("connect");
                } else {
                    setStep("list");
                }
            } else {
                addLog("Tidak ada MikroTik ditemukan", "error");
                setStep("manual");
            }
        } catch (err) {
            addLog("Scan gagal: " + (err.message || "Error"), "error");
            setStep("manual");
        }
        setIsScanning(false);
    };

    const testConnection = async () => {
        const targetIP = selectedDevice?.ip;
        const targetPort = 8728;
        if (!targetIP) {
            setError("Pilih device dulu");
            return;
        }

        setTestStatus("testing");
        setTestMessage("");
        setError("");
        addLog(`Tes koneksi ke ${targetIP}...`, "info");

        try {
            const res = await api.post("/scan/test", {
                ip: targetIP,
                port: targetPort,
                username: credentials.username,
                password: credentials.password
            });
            if (res?.success) {
                setTestStatus("ok");
                setTestMessage(`Terhubung — ${res.identity || "MikroTik"}`);
                addLog(`Berhasil — ${res.identity || "MikroTik"}`, "success");
            } else {
                setTestStatus("fail");
                setTestMessage(res?.error || "Login ditolak");
                addLog(`Gagal: ${res?.error || "Login ditolak"}`, "error");
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || "Tidak bisa terhubung";
            setTestStatus("fail");
            setTestMessage(msg);
            addLog(`Gagal: ${msg}`, "error");
        }
    };

    const saveDevice = async () => {
        const targetIP = selectedDevice?.ip;
        const targetPort = 8728;
        const targetIdentity = selectedDevice?.identity || `MikroTik ${targetIP}`;
        setStep("adding");
        setError("");
        addLog(`Menyimpan ${targetIP}...`, "info");

        try {
            const res = await api.post("/devices", {
                name: targetIdentity,
                host: targetIP,
                username: credentials.username,
                password: credentials.password,
                port: targetPort
            });
            if (res?.id) {
                setAppDevice(res);
                addLog("Tersimpan!", "success");
            }
            setStep("done");
            setTimeout(() => navigate("/devices"), 2000);
        } catch (err) {
            setStep("connect");
            const msg = err.response?.data?.error || err.message || "Gagal menyimpan";
            setError(msg);
            addLog(msg, "error");
        }
    };

    const t = isDark ? {
        bg: "bg-[#060b14]",
        card: "bg-[#0c1220] border-white/[0.07]",
        text: "text-white",
        sub: "text-slate-400",
        dim: "text-slate-600",
        label: "text-slate-500",
        input: "bg-white/[0.05] border-white/[0.08] text-white placeholder-slate-700 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10",
        btnPrimary: "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg shadow-cyan-900/20",
        btnSecondary: "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12]",
        accent: "text-cyan-400",
        accentBg: "bg-cyan-500/10",
        tableHeader: "bg-white/[0.03] text-slate-400 text-[10px] font-bold uppercase tracking-wider",
        tableRow: "hover:bg-white/[0.03] border-b border-white/[0.04] transition-colors cursor-pointer",
        tableRowSelected: "bg-cyan-500/[0.08] border-l-2 border-l-cyan-500",
    } : {
        bg: "bg-gray-50",
        card: "bg-white border-gray-200",
        text: "text-gray-900",
        sub: "text-gray-500",
        dim: "text-gray-400",
        label: "text-gray-500",
        input: "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10",
        btnPrimary: "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg",
        btnSecondary: "bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300",
        accent: "text-cyan-600",
        accentBg: "bg-cyan-50",
        tableHeader: "bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider",
        tableRow: "hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer",
        tableRowSelected: "bg-cyan-50 border-l-2 border-l-cyan-500",
    };

    return (
        <div className={`min-h-screen ${t.bg}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            <div className="max-w-5xl mx-auto p-5 lg:p-7">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}>
                        <ScanLine size={17} className={t.dim}/>
                    </div>
                    <div>
                        <h1 className={`text-xl font-black tracking-tight ${t.text}`}>Smart Scanner</h1>
                        <p className={`text-xs ${t.dim}`}>Deteksi MikroTik otomatis dari semua adapter</p>
                    </div>
                </div>

                {/* ─── STEP: SCANNING ─── */}
                {step === "scanning" && (
                    <div className={`rounded-2xl border p-10 text-center ${t.card}`}>
                        <div className="relative w-24 h-24 mx-auto mb-5">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"/>
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Loader2 size={32} className="text-white animate-spin"/>
                            </div>
                        </div>
                        <h2 className={`text-lg font-black ${t.text}`}>Menscan Jaringan...</h2>
                        <p className={`text-xs ${t.sub} mt-1`}>MNDP + TCP fallback</p>
                        <div className={`mt-4 flex gap-2 justify-center flex-wrap`}>
                            {networks.map(n => (
                                <span key={n.id} className={`text-[10px] px-2 py-1 rounded border ${isDark ? "bg-white/[0.03] border-white/[0.08] text-slate-400" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                                    {n.name}: {n.subnet}/{n.cidr}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STEP: LIST (WinBox Style Table) ─── */}
                {step === "list" && (
                    <div className="space-y-4">
                        <div className={`rounded-2xl border overflow-hidden ${t.card}`}>
                            <div className={`flex items-center justify-between p-4 border-b ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                                        <Check size={13} className={isDark ? "text-emerald-400" : "text-emerald-600"}/>
                                    </div>
                                    <span className={`text-sm font-bold ${t.text}`}>{foundDevices.length} MikroTik Ditemukan</span>
                                </div>
                                <button onClick={doFullScan} disabled={isScanning}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition border ${t.btnSecondary}`}>
                                    <Loader2 size={11} className={isScanning ? "animate-spin" : ""}/>
                                    {isScanning ? "Scanning..." : "Refresh"}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={t.tableHeader}>
                                            <th className="px-4 py-2.5">MAC Address</th>
                                            <th className="px-4 py-2.5">IP Address</th>
                                            <th className="px-4 py-2.5">Identity</th>
                                            <th className="px-4 py-2.5">Version</th>
                                            <th className="px-4 py-2.5">Board</th>
                                            <th className="px-4 py-2.5">Uptime</th>
                                            <th className="px-4 py-2.5 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {foundDevices.map((device, idx) => {
                                            const selected = selectedDevice?.ip === device.ip;
                                            return (
                                                <tr key={idx} onClick={() => { setSelectedDevice(device); setStep("connect"); }}
                                                    className={`${selected ? t.tableRowSelected : t.tableRow}`}>
                                                    <td className={`px-4 py-3 font-mono text-xs ${t.sub}`}>{device.mac || "—"}</td>
                                                    <td className={`px-4 py-3 font-mono text-xs ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{device.ip}</td>
                                                    <td className={`px-4 py-3 text-sm font-bold ${t.text}`}>{device.identity || "MikroTik"}</td>
                                                    <td className={`px-4 py-3 text-xs ${t.sub}`}>{device.version || "—"}</td>
                                                    <td className={`px-4 py-3 text-xs ${t.sub}`}>{device.board || "—"}</td>
                                                    <td className={`px-4 py-3 text-xs ${t.dim}`}>{device.uptime || "—"}</td>
                                                    <td className="px-4 py-3">
                                                        {selected && <Check size={14} className={isDark ? "text-cyan-400" : "text-cyan-600"}/>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP: CONNECT (WinBox-style login) ─── */}
                {step === "connect" && selectedDevice && (
                    <div className="space-y-4">
                        <div className={`rounded-2xl border p-6 ${t.card}`}>
                            <div className="flex items-center gap-2 mb-5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-violet-500/10" : "bg-violet-50"}`}>
                                    <Plug size={13} className={isDark ? "text-violet-400" : "text-violet-600"}/>
                                </div>
                                <div>
                                    <span className={`text-sm font-bold ${t.text}`}>Connect To</span>
                                    <span className={`text-xs ml-2 font-mono ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{selectedDevice.ip}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>Login</label>
                                    <input type="text" value={credentials.username}
                                        onChange={e => setCredentials({...credentials, username: e.target.value})}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>Password</label>
                                    <input type="password" value={credentials.password}
                                        onChange={e => setCredentials({...credentials, password: e.target.value})}
                                        placeholder="Kosong jika tidak ada"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                            </div>

                            {testStatus && (
                                <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold w-fit
                                    ${testStatus === "ok" ? `${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`
                                     : testStatus === "fail" ? `${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`
                                     : `${isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-700"}`}`}>
                                    {testStatus === "testing" && <Loader2 size={13} className="animate-spin"/>}
                                    {testStatus === "ok" && <Check size={13}/>}
                                    {testStatus === "fail" && <X size={13}/>}
                                    {testMessage}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep("list")}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${t.btnSecondary}`}>
                                    <ArrowLeft size={13} className="inline mr-1"/> Kembali
                                </button>
                                <button onClick={testConnection} disabled={testStatus === "testing"}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition border
                                        ${testStatus === "testing" ? "opacity-50 cursor-not-allowed " + (isDark ? "bg-white/[0.04] border-white/[0.08] text-slate-500" : "bg-gray-100 border-gray-200 text-gray-400")
                                         : testStatus === "ok" ? `${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`
                                         : testStatus === "fail" ? `${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`
                                         : t.btnSecondary}`}>
                                    {testStatus === "testing" && <Loader2 size={13} className="animate-spin"/>}
                                    {testStatus === "ok" && <Check size={13}/>}
                                    {testStatus === "fail" && <X size={13}/>}
                                    {testStatus === "testing" ? "Menghubungkan..." : testStatus === "ok" ? "Tes Berhasil" : testStatus === "fail" ? "Tes Gagal" : "Connect"}
                                </button>
                                <button onClick={saveDevice} disabled={testStatus !== "ok"}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition
                                        ${testStatus === "ok" ? t.btnPrimary : "opacity-40 cursor-not-allowed bg-gray-200 text-gray-400"}`}>
                                    <Save size={13}/> Simpan Device
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP: MANUAL (fallback) ─── */}
                {step === "manual" && (
                    <div className="space-y-4">
                        <div className={`rounded-2xl border p-6 ${t.card}`}>
                            <div className="flex items-center gap-2 mb-5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}>
                                    <AlertCircle size={13} className={isDark ? "text-amber-400" : "text-amber-600"}/>
                                </div>
                                <div>
                                    <span className={`text-sm font-bold ${t.text}`}>Scan Gagal</span>
                                    <p className={`text-xs ${t.sub}`}>Tidak ada MikroTik ditemukan otomatis</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>IP Address</label>
                                    <input type="text" value={selectedDevice?.ip || ""}
                                        onChange={e => setSelectedDevice(prev => prev ? {...prev, ip: e.target.value} : {ip: e.target.value, identity: "MikroTik"})}
                                        placeholder="12.12.12.1"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>Port API</label>
                                    <input type="number" value="8728" readOnly
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>Login</label>
                                    <input type="text" value={credentials.username}
                                        onChange={e => setCredentials({...credentials, username: e.target.value})}
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5 ${t.label}`}>Password</label>
                                    <input type="password" value={credentials.password}
                                        onChange={e => setCredentials({...credentials, password: e.target.value})}
                                        placeholder="Kosong jika tidak ada"
                                        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${t.input}`}/>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={doFullScan}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${t.btnSecondary}`}>
                                    <ScanLine size={13} className="inline mr-1"/> Scan Ulang
                                </button>
                                <button onClick={() => { if (selectedDevice?.ip) setStep("connect"); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${t.btnPrimary}`}>
                                    <Plug size={13}/> Connect
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP: ADDING ─── */}
                {step === "adding" && (
                    <div className={`rounded-2xl border p-12 text-center ${t.card}`}>
                        <div className="relative w-24 h-24 mx-auto mb-5">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping"/>
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Loader2 size={32} className="text-white animate-spin"/>
                            </div>
                        </div>
                        <h2 className={`text-lg font-black ${t.text}`}>Menyimpan...</h2>
                        <p className={`text-xs ${t.sub} mt-1`}>{selectedDevice?.ip}</p>
                    </div>
                )}

                {/* ─── STEP: DONE ─── */}
                {step === "done" && (
                    <div className={`rounded-2xl border p-12 text-center ${t.card}`}>
                        <div className={`w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center ${isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200"}`}>
                            <Check size={36} className={isDark ? "text-emerald-400" : "text-emerald-600"} strokeWidth={2.5}/>
                        </div>
                        <h2 className={`text-lg font-black ${t.text}`}>Berhasil!</h2>
                        <p className={`text-xs ${t.sub} mt-1`}>{selectedDevice?.identity || `MikroTik ${selectedDevice?.ip}`} ditambahkan</p>
                        <p className={`text-xs mt-2 ${t.accent}`}>Mengalihkan...</p>
                    </div>
                )}

                {/* Console Log */}
                <div className={`mt-5 rounded-2xl border overflow-hidden ${isDark ? "border-white/[0.06] bg-[#060b14]" : "border-gray-200 bg-white"}`}>
                    <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                        <MonitorSmartphone size={12} className={t.dim}/>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${t.dim}`}>Console Log</span>
                    </div>
                    <div className="h-40 overflow-y-auto p-3 space-y-1 font-mono text-[11px]">
                        {logs.length === 0 && (
                            <div className={`italic text-center py-6 ${t.dim}`}>Menunggu aktivitas...</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${
                                log.type === "success" ? (isDark ? "text-emerald-400" : "text-emerald-600") :
                                log.type === "error"   ? (isDark ? "text-red-400"     : "text-red-600")     :
                                log.type === "warn"    ? (isDark ? "text-amber-400"   : "text-amber-600")   : t.sub
                            }`}>
                                <span className={`flex-shrink-0 ${t.dim}`}>[{log.time}]</span>
                                <span className="break-all">{log.msg}</span>
                            </div>
                        ))}
                        <div ref={logEndRef}/>
                    </div>
                </div>
            </div>
        </div>
    );
}