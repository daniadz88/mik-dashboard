import React, {useState, useEffect, useCallback} from "react";
import {
    Plus,
    Trash2,
    Edit2,
    Printer,
    Search,
    RefreshCw,
    Copy,
    Eye,
    Shuffle,
    X,
    Check,
    Users,
    Clock,
    Database,
    Ticket,
    Save,
    Filter,
    Info,
    Image as ImageIcon,
    LayoutGrid,
    List,
    AlignJustify,
    Download,
    ClipboardList,
    BarChart2,
    ChevronDown,
} from "lucide-react";
import {useTheme} from "../components/ThemeContext";
import api from "../api.js";

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtBytes(str) {
    if (!str) return "";
    const n = parseFloat(str);
    if (isNaN(n)) return str;
    if (str.toUpperCase().includes("GB")) return n + " GB";
    if (str.toUpperCase().includes("MB")) return n + " MB";
    return str;
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(vouchers) {
    const header = ["Username", "Password", "Profile", "Time Limit", "Data Limit", "Shared Users", "Comment"];
    const rows = vouchers.map((v) => [
        v.username || "",
        v.password || "",
        v.profile || "",
        v.timeLimit || "",
        v.dataLimit || "",
        v.sharedUsers || 1,
        v.comment || "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type: "text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voucher-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Batch copy ────────────────────────────────────────────────────────────────
function batchCopyText(vouchers) {
    return vouchers.map((v) => `${v.username} / ${v.password}`).join("\n");
}

// ── Print HTML builder ────────────────────────────────────────────────────────
function buildPrintHTML(vouchers, cfg) {
    // Always read fresh settings from localStorage and merge with passed cfg
    let freshCfg = cfg || {};
    try {
        const local = localStorage.getItem("hotspot_settings");
        if (local) freshCfg = {...JSON.parse(local), ...cfg};
    } catch (e) {}
    cfg = freshCfg;

    const MAX_VOUCHERS = 500;
    const safeVouchers = vouchers.slice(0, MAX_VOUCHERS);

    const brand = cfg?.companyName || cfg?.appName || "";
    const domain = cfg?.showAddress !== false ? cfg?.address || "" : "";
    const phone = cfg?.showPhone !== false ? cfg?.phone || "" : "";
    const footer = cfg?.footerText || "";
    const logoUrl = cfg?.showLogo ? cfg?.logoUrl || "" : "";
    const size = cfg?.printSize || "default";
    const primaryColor = cfg?.primaryColor || "#7c3aed";

    const layout = {
        default: {
            cols: 4,
            cardH: "200px",
            brandSize: "13px",
            codeSize: "18px",
            metaSize: "9px",
            padding: "11px 13px",
            gap: "8px",
            margin: "8mm",
        },
        small: {
            cols: 5,
            cardH: "155px",
            brandSize: "11px",
            codeSize: "14px",
            metaSize: "8px",
            padding: "7px 9px",
            gap: "5px",
            margin: "6mm",
        },
        large: {
            cols: 3,
            cardH: "245px",
            brandSize: "15px",
            codeSize: "22px",
            metaSize: "10px",
            padding: "14px 16px",
            gap: "10px",
            margin: "10mm",
        },
        thermal58: {
            cols: 1,
            cardH: "auto",
            brandSize: "12px",
            codeSize: "20px",
            metaSize: "9px",
            padding: "8px 10px",
            gap: "6px",
            margin: "2mm",
            pageSize: "58mm",
        },
        thermal80: {
            cols: 2,
            cardH: "auto",
            brandSize: "12px",
            codeSize: "18px",
            metaSize: "9px",
            padding: "8px 10px",
            gap: "6px",
            margin: "2mm",
            pageSize: "80mm",
        },
    };

    const L = layout[size] || layout.default;
    const isThermal = size && size.startsWith("thermal");
    const pageSize = L.pageSize || "A4";
    const isFixedH = L.cardH !== "auto";
    const logoH = size === "small" ? "36px" : size === "large" ? "56px" : "48px";

    let cardsHtml = "";
    for (let i = 0; i < safeVouchers.length; i++) {
        const v = safeVouchers[i];
        const hasSeparatePwd = v.password && v.password !== (v.username || v.name);

        let c = '<div class="card"><div class="top-bar"></div><div class="inner"><div class="top">';
        if (logoUrl) c += '<img src="' + logoUrl + '" class="logo" alt="logo" style="height:' + logoH + '">';
        c += '<div class="brand">' + brand + "</div>";
        if (domain) c += '<div class="domain">' + domain + "</div>";
        if (phone) c += '<div class="phone">' + phone + "</div>";
        c += '</div><div class="cred-box"><div class="cred-label">Kode Voucher</div>';
        c += '<div class="cred-val">' + (v.username || v.name || "\u2014") + "</div>";
        if (hasSeparatePwd) {
            c += '<div class="cred-label" style="margin-top:5px">Password</div>';
            c +=
                '<div class="cred-val pwd" style="color:' +
                primaryColor +
                ';border-color:transparent">' +
                v.password +
                "</div>";
        }
        c += '</div><div class="bottom"><div class="meta">';
        const parts = [];
        if (v.profile) parts.push(v.profile);
        if (v.timeLimit) parts.push(v.timeLimit);
        if (v.dataLimit) parts.push(v.dataLimit);
        if (v.sharedUsers > 1) parts.push(v.sharedUsers + " user");
        c += parts.length ? parts.join(" \u00b7 ") : "\u2014";
        const qrData = encodeURIComponent(`${v.username || ""}:${v.password || ""}`);
        const qrImg = cfg?.showQrCode
            ? `<div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrData}&bgcolor=ffffff&color=000000" width="60" height="60" alt="QR"/></div>`
            : "";

        if (footer) c += `${qrImg}</div><div class="foot">${footer}</div></div></div></div>`;
        else c += `${qrImg}</div></div></div></div>`;
        cardsHtml += c;
    }

    let css = "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}";
    css += "body{background:#fff;font-family:'Segoe UI',Arial,sans-serif;padding:6px}";
    if (isThermal) {
        css += ".grid{display:flex;flex-direction:column;gap:" + L.gap + ";max-width:" + pageSize + ";margin:0 auto;}";
        css +=
            ".card{width:100%;margin-bottom:" +
            L.gap +
            ";border:1.5px dashed #94a3b8;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;" +
            (isFixedH ? "height:" + L.cardH + ";" : "") +
            "break-inside:avoid;page-break-inside:avoid}";
    } else {
        css +=
            ".grid{display:grid;grid-template-columns:repeat(" + L.cols + ",1fr);gap:" + L.gap + ";align-items:start;}";
        css +=
            ".card{border:1.5px dashed #94a3b8;border-radius:10px;overflow:hidden;display:flex;flex-direction:column;" +
            (isFixedH ? "height:" + L.cardH + ";" : "") +
            "break-inside:avoid;page-break-inside:avoid}";
    }
    css += ".top-bar{height:3px;background:linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7);flex-shrink:0}";
    css +=
        ".inner{padding:" +
        L.padding +
        ";display:flex;flex-direction:column;justify-content:space-between;flex:1;text-align:center}";
    css += ".top{flex-shrink:0;margin-bottom:4px}";
    css += ".logo{display:block;margin:0 auto 5px;width:auto;object-fit:contain;max-width:90%}";
    css += ".brand{font-size:" + L.brandSize + ";font-weight:900;color:#0f172a;word-break:break-word;line-height:1.25}";
    css += ".domain{font-size:" + L.metaSize + ";color:#475569;margin-top:1px;word-break:break-word}";
    css += ".phone{font-size:calc(" + L.metaSize + " - 1px);color:#64748b}";
    css +=
        ".cred-box{border-top:1.5px dashed #e2e8f0;border-bottom:1.5px dashed #e2e8f0;padding:6px 0;margin:4px 0;flex-shrink:0}";
    css +=
        ".cred-label{font-size:6.5px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.8px;font-weight:700;margin-bottom:2px}";
    css +=
        ".cred-val{font-size:" +
        L.codeSize +
        ";font-weight:900;font-family:'Courier New',monospace;letter-spacing:2px;border:1px solid #e2e8f0;border-radius:5px;padding:2px 8px;display:inline-block;max-width:100%;word-break:break-all;white-space:normal}";
    css += ".cred-val.pwd{font-size:calc(" + L.codeSize + " * 0.82)}";
    css += ".bottom{flex-shrink:0}";
    css += ".meta{font-size:" + L.metaSize + ";color:#475569;word-break:break-word}";
    css += ".qr{margin:4px 0;display:flex;justify-content:center}";
    css += ".qr img{border-radius:4px}";
    css +=
        ".foot{font-size:calc(" +
        L.metaSize +
        " - 1px);color:#94a3b8;font-style:italic;border-top:1px dashed #f1f5f9;padding-top:2px;margin-top:3px;word-break:break-word}";
    css += "@media print{html,body{height:auto}body{padding:0}";
    css += "@page{margin:" + L.margin + ";size:" + (isThermal ? pageSize + " auto" : "A4 portrait") + "}";
    if (!isThermal) {
        css += ".grid{display:flex;flex-wrap:wrap;gap:" + L.gap + "}";
        css += ".card{width:calc(" + 100 / L.cols + "% - " + L.gap + ");margin-bottom:" + L.gap + "}";
    }
    css += "}";

    let html =
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Voucher \u2014 ' +
        brand +
        "</title><style>" +
        css +
        "</style></head><body>";
    html += '<div class="grid">' + cardsHtml + "</div>";
    html += "<script>window.onload=function(){setTimeout(function(){window.print();},400)};</script>";
    html += "</body></html>";
    return html;
}

function printVouchers(vouchers, settings) {
    if (!vouchers.length) return;
    // If no settings passed, read fresh from localStorage
    if (!settings) {
        try {
            const local = localStorage.getItem("hotspot_settings");
            if (local) settings = JSON.parse(local);
        } catch (e) {}
    }
    const w = window.open("", "_blank", "width=960,height=720");
    if (!w) {
        alert("Popup diblokir browser \u2014 izinkan popup untuk halaman ini");
        return;
    }
    w.document.write(buildPrintHTML(vouchers, settings));
    w.document.close();
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({title, icon, onClose, children, isDark, maxW = "max-w-lg"}) {
    useEffect(() => {
        const h = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className={`w-full ${maxW} rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] ${
                    isDark ? "bg-[#0d1117] border-white/[0.08]" : "bg-white border-gray-200"
                }`}
            >
                <div
                    className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${
                        isDark ? "border-white/[0.06]" : "border-gray-100"
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
                            isDark
                                ? "hover:bg-white/[0.06] text-slate-500 hover:text-slate-300"
                                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ModalFooter({onClose, onSave, saveLabel, loading, isDark, saveCls}) {
    return (
        <div
            className={`flex items-center justify-end gap-2 px-5 py-4 border-t flex-shrink-0 ${
                isDark ? "border-white/[0.06]" : "border-gray-100"
            }`}
        >
            <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                    isDark
                        ? "bg-white/[0.03] border-white/[0.07] text-slate-400 hover:bg-white/[0.07]"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
            >
                Batal
            </button>
            <button
                onClick={onSave}
                disabled={loading}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${saveCls} text-white text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-50 flex items-center gap-2`}
            >
                {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <Save className="w-3.5 h-3.5" /> {saveLabel}
            </button>
        </div>
    );
}

function Field({label, hint, children, isDark}) {
    return (
        <div>
            <label
                className={`block text-[9px] font-bold uppercase tracking-[0.18em] mb-1 ${
                    isDark ? "text-slate-600" : "text-gray-400"
                }`}
                style={{fontFamily: "'JetBrains Mono',monospace"}}
            >
                {label}
            </label>
            {hint && (
                <p
                    className={`text-[10px] mb-1.5 flex items-start gap-1 ${
                        isDark ? "text-slate-500" : "text-gray-400"
                    }`}
                >
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
                    {hint}
                </p>
            )}
            {children}
        </div>
    );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({vouchers, isDark}) {
    const profileCounts = vouchers.reduce((acc, v) => {
        const p = v.profile || "default";
        acc[p] = (acc[p] || 0) + 1;
        return acc;
    }, {});
    const topProfiles = Object.entries(profileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
    const card = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    const textH = isDark ? "text-white" : "text-gray-900";
    const textD = isDark ? "text-slate-600" : "text-gray-400";

    const stats = [
        {label: "Total Voucher", value: vouchers.length, icon: Ticket, color: "text-violet-400"},
        {label: "Profile Aktif", value: Object.keys(profileCounts).length, icon: BarChart2, color: "text-sky-400"},
        {
            label: "Multi-Device",
            value: vouchers.filter((v) => (v.sharedUsers || 1) > 1).length,
            icon: Users,
            color: "text-emerald-400",
        },
        {
            label: "Ada Batas Waktu",
            value: vouchers.filter((v) => v.timeLimit).length,
            icon: Clock,
            color: "text-amber-400",
        },
    ];

    return (
        <div className={`border rounded-2xl overflow-hidden mb-4 ${card}`}>
            <div
                className={`grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 ${
                    isDark ? "divide-white/[0.06]" : "divide-gray-100"
                }`}
            >
                {stats.map(({label, value, icon: Icon, color}) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-3">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                        <div>
                            <p className={`text-[10px] ${textD}`} style={{fontFamily: "'JetBrains Mono',monospace"}}>
                                {label}
                            </p>
                            <p className={`text-xl font-black ${textH}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>
            {topProfiles.length > 0 && (
                <div
                    className={`px-4 py-2 border-t flex items-center gap-2 flex-wrap ${
                        isDark ? "border-white/[0.06] bg-white/[0.01]" : "border-gray-100 bg-gray-50/50"
                    }`}
                >
                    <span
                        className={`text-[9px] font-bold uppercase tracking-widest mr-1 ${textD}`}
                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                    >
                        Top profiles:
                    </span>
                    {topProfiles.map(([name, count]) => (
                        <span
                            key={name}
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                isDark
                                    ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                    : "bg-violet-50 border-violet-200 text-violet-600"
                            }`}
                        >
                            {name} <span className="opacity-60">({count})</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── VoucherPreviewMini ────────────────────────────────────────────────────────
function VoucherPreviewMini({form, isDark, settings}) {
    const len = Number(form.nameLength) || 4;
    const code = (form.prefix || "") + "XXXX".slice(0, len);
    const pwd = form.userMode === "username" ? code : "yyyy".slice(0, len);
    return (
        <div
            style={{
                border: "1.5px dashed #94a3b8",
                borderRadius: 10,
                overflow: "hidden",
                background: "#fff",
                color: "#1e293b",
                fontFamily: "'Segoe UI',Arial,sans-serif",
                textAlign: "center",
            }}
        >
            <div style={{height: 3, background: "linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7)"}} />
            <div style={{padding: "12px 14px 10px"}}>
                {settings?.logoUrl && (
                    <img
                        src={settings.logoUrl}
                        alt="logo"
                        style={{
                            height: 48,
                            width: "auto",
                            objectFit: "contain",
                            display: "block",
                            margin: "0 auto 6px",
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = "none";
                        }}
                    />
                )}
                {settings?.companyName && (
                    <div
                        style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: "#0f172a",
                            wordBreak: "break-word",
                            lineHeight: 1.25,
                            marginBottom: 1,
                        }}
                    >
                        {settings.companyName}
                    </div>
                )}
                {settings?.address && (
                    <div style={{fontSize: 9, color: "#475569", wordBreak: "break-word", marginBottom: 1}}>
                        {settings.address}
                    </div>
                )}
                {settings?.phone && (
                    <div style={{fontSize: 9, color: "#64748b", marginBottom: 4}}>{settings.phone}</div>
                )}
                <div
                    style={{
                        borderTop: "1.5px dashed #e2e8f0",
                        borderBottom: "1.5px dashed #e2e8f0",
                        padding: "8px 0",
                        margin: "6px 0",
                    }}
                >
                    <div
                        style={{
                            fontSize: 7,
                            color: "#94a3b8",
                            letterSpacing: 3,
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginBottom: 3,
                        }}
                    >
                        Kode Voucher
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 900,
                            fontFamily: "'Courier New',monospace",
                            letterSpacing: 2,
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "3px 10px",
                            display: "inline-block",
                            wordBreak: "break-all",
                        }}
                    >
                        {code}
                    </div>
                    {form.userMode !== "username" && (
                        <>
                            <div
                                style={{
                                    fontSize: 7,
                                    color: "#94a3b8",
                                    letterSpacing: 3,
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                    marginTop: 5,
                                    marginBottom: 2,
                                }}
                            >
                                Password
                            </div>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 900,
                                    fontFamily: "'Courier New',monospace",
                                    color: "#7c3aed",
                                    letterSpacing: 2,
                                    wordBreak: "break-all",
                                }}
                            >
                                {pwd}
                            </div>
                        </>
                    )}
                </div>
                <div style={{fontSize: 9, color: "#475569"}}>
                    {[
                        form.profile,
                        form.timeLimit,
                        form.dataLimit && form.dataLimit + form.dataLimitUnit,
                        form.sharedUsers > 1 ? `${form.sharedUsers} user` : null,
                    ]
                    .filter(Boolean)
                    .join(" \u00b7 ") || "\u2014"}
                </div>
                {settings?.footerText && (
                    <div
                        style={{
                            fontSize: 8,
                            color: "#94a3b8",
                            marginTop: 5,
                            fontStyle: "italic",
                            borderTop: "1px dashed #f1f5f9",
                            paddingTop: 5,
                        }}
                    >
                        {settings.footerText}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Profile badge color ───────────────────────────────────────────────────────
const PROFILE_COLORS = {
    default: "bg-slate-500/15 text-slate-300 border-slate-500/25",
    "1-hari": "bg-sky-500/15   text-sky-300   border-sky-500/25",
    "1-Jam": "bg-amber-500/15 text-amber-300 border-amber-500/25",
    Gaming: "bg-violet-500/15 text-violet-300 border-violet-500/25",
    "1-minggu-20rb": "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    "30-hari": "bg-rose-500/15  text-rose-300  border-rose-500/25",
};
const pColor = (p) => PROFILE_COLORS[p] || "bg-slate-500/15 text-slate-300 border-slate-500/25";

// ── VIEW MODES ────────────────────────────────────────────────────────────────
const VIEW_MODES = [
    {id: "grid", icon: LayoutGrid, label: "Grid", title: "Kartu grid"},
    {id: "list", icon: List, label: "List", title: "Tabel list"},
    {id: "compact", icon: AlignJustify, label: "Compact", title: "Baris padat"},
];

// ── Grid Card ─────────────────────────────────────────────────────────────────
function GridCard({v, selected, onToggle, onEdit, onDelete, onCopy, onPrint, onPreview, isDark}) {
    const textH = isDark ? "text-white" : "text-gray-900";
    const textD = isDark ? "text-slate-600" : "text-gray-400";
    const divider = isDark ? "border-white/[0.06]" : "border-gray-100";
    const cardBg = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    return (
        <div
            className={`group relative border rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-violet-900/10 hover:border-violet-500/30 ${
                selected ? "border-violet-500/50 ring-1 ring-violet-500/20" : cardBg
            }`}
        >
            <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="p-3">
                <div className="flex items-start justify-between mb-2.5 gap-1">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggle(v.id)}
                        className="w-3.5 h-3.5 rounded accent-violet-500 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(v)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                                isDark
                                    ? "text-slate-600 hover:bg-sky-500/15 hover:text-sky-400"
                                    : "text-gray-400 hover:bg-sky-50 hover:text-sky-500"
                            }`}
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => onDelete(v.id)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                                isDark
                                    ? "text-slate-600 hover:bg-red-500/15 hover:text-red-400"
                                    : "text-gray-400 hover:bg-red-50 hover:text-red-500"
                            }`}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div
                    className={`text-center py-3 mb-2.5 rounded-xl border ${
                        isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-gray-50 border-gray-100"
                    }`}
                >
                    <p className={`text-[8px] uppercase tracking-[3px] font-bold mb-1 ${textD}`}>Kode Voucher</p>
                    <p className={`text-sm font-black font-mono tracking-wider ${textH} break-all px-2 leading-snug`}>
                        {v.username || "\u2014"}
                    </p>
                    <div className={`my-2 border-t border-dashed ${divider}`} />
                    <p className={`text-[8px] uppercase tracking-[3px] font-bold mb-1 ${textD}`}>Password</p>
                    <p className="text-sm font-black font-mono tracking-wider text-violet-400 break-all px-2 leading-snug">
                        {v.password || "\u2014"}
                    </p>
                </div>
                <div className="flex items-start justify-between mb-2 gap-1">
                    <span
                        className={`text-[9px] px-2 py-0.5 rounded-full border font-bold break-all leading-snug ${pColor(
                            v.profile
                        )}`}
                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                    >
                        {v.profile || "default"}
                    </span>
                    <span className={`text-[9px] font-mono flex-shrink-0 ${textD}`}>\u00d7{v.sharedUsers || 1}</span>
                </div>
                {(v.timeLimit || v.dataLimit) && (
                    <div className={`flex items-center gap-2 flex-wrap text-[9px] mb-2.5 ${textD}`}>
                        {v.timeLimit && (
                            <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {v.timeLimit}
                            </span>
                        )}
                        {v.dataLimit && (
                            <span className="flex items-center gap-0.5">
                                <Database className="w-2.5 h-2.5" />
                                {fmtBytes(v.dataLimit)}
                            </span>
                        )}
                    </div>
                )}
                <div className={`flex gap-1 pt-2.5 border-t ${divider}`}>
                    {[
                        {
                            icon: Copy,
                            label: "Copy",
                            fn: () => onCopy(`${v.username} / ${v.password}`),
                            hov: isDark
                                ? "hover:bg-white/[0.07] hover:text-white"
                                : "hover:bg-gray-200 hover:text-gray-900",
                        },
                        {
                            icon: Printer,
                            label: "Cetak",
                            fn: () => onPrint([v]),
                            hov: isDark
                                ? "hover:bg-violet-500/15 hover:text-violet-400"
                                : "hover:bg-violet-50 hover:text-violet-600",
                        },
                        {
                            icon: Eye,
                            label: "Preview",
                            fn: () => onPreview(v),
                            hov: isDark
                                ? "hover:bg-sky-500/15 hover:text-sky-400"
                                : "hover:bg-sky-50 hover:text-sky-600",
                        },
                    ].map(({icon: Icon, label, fn, hov}) => (
                        <button
                            key={label}
                            onClick={fn}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition ${
                                isDark ? "bg-white/[0.03] text-slate-500" : "bg-gray-100 text-gray-400"
                            } ${hov}`}
                        >
                            <Icon className="w-2.5 h-2.5" /> {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({filtered, selected, onToggle, selectAll, onEdit, onDelete, onCopy, onPrint, onPreview, isDark}) {
    const textH = isDark ? "text-white" : "text-gray-900";
    const textS = isDark ? "text-slate-400" : "text-gray-500";
    const divider = isDark ? "border-white/[0.06]" : "border-gray-100";
    const card = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    return (
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[580px]">
                    <thead>
                        <tr className={`border-b ${divider} ${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={filtered.length > 0 && selected.length === filtered.length}
                                    onChange={selectAll}
                                    className="w-3.5 h-3.5 rounded accent-violet-500"
                                />
                            </th>
                            {["Username", "Password", "Profile", "Batas", "Aksi"].map((h) => (
                                <th
                                    key={h}
                                    className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest ${textS}`}
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${divider}`}>
                        {filtered.map((v) => (
                            <tr
                                key={v.id}
                                className={`transition-colors ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50"}`}
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(v.id)}
                                        onChange={() => onToggle(v.id)}
                                        className="w-3.5 h-3.5 rounded accent-violet-500"
                                    />
                                </td>
                                <td
                                    className={`px-4 py-3 font-mono font-bold text-sm ${textH} max-w-[140px] break-all`}
                                >
                                    {v.username}
                                </td>
                                <td className="px-4 py-3 font-mono text-sm text-violet-400 max-w-[140px] break-all">
                                    {v.password}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${pColor(
                                            v.profile
                                        )}`}
                                        style={{fontFamily: "'JetBrains Mono',monospace"}}
                                    >
                                        {v.profile || "default"}
                                    </span>
                                </td>
                                <td className={`px-4 py-3 text-xs ${textS}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {v.timeLimit && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {v.timeLimit}
                                            </span>
                                        )}
                                        {v.dataLimit && (
                                            <span className="flex items-center gap-1">
                                                <Database className="w-3 h-3" />
                                                {fmtBytes(v.dataLimit)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            \u00d7{v.sharedUsers || 1}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        {[
                                            {
                                                icon: Copy,
                                                fn: () => onCopy(`${v.username} / ${v.password}`),
                                                hov: "hover:text-white hover:bg-white/10",
                                                title: "Copy",
                                            },
                                            {
                                                icon: Printer,
                                                fn: () => onPrint([v]),
                                                hov: "hover:text-violet-400 hover:bg-violet-500/10",
                                                title: "Cetak",
                                            },
                                            {
                                                icon: Eye,
                                                fn: () => onPreview(v),
                                                hov: "hover:text-sky-400 hover:bg-sky-500/10",
                                                title: "Preview",
                                            },
                                            {
                                                icon: Edit2,
                                                fn: () => onEdit(v),
                                                hov: "hover:text-emerald-400 hover:bg-emerald-500/10",
                                                title: "Edit",
                                            },
                                            {
                                                icon: Trash2,
                                                fn: () => onDelete(v.id),
                                                hov: "hover:text-red-400 hover:bg-red-500/10",
                                                title: "Hapus",
                                            },
                                        ].map(({icon: Icon, fn, hov, title}) => (
                                            <button
                                                key={title}
                                                onClick={fn}
                                                title={title}
                                                className={`p-1.5 rounded-lg transition ${textS} ${hov}`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Compact View ──────────────────────────────────────────────────────────────
function CompactView({filtered, selected, onToggle, selectAll, onEdit, onDelete, onCopy, onPrint, onPreview, isDark}) {
    const textH = isDark ? "text-white" : "text-gray-900";
    const textS = isDark ? "text-slate-400" : "text-gray-500";
    const textD = isDark ? "text-slate-600" : "text-gray-400";
    const divider = isDark ? "divide-white/[0.05]" : "divide-gray-100";
    const card = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    return (
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
            <div
                className={`flex items-center gap-3 px-4 py-2.5 border-b ${
                    isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-100 bg-gray-50"
                }`}
            >
                <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onChange={selectAll}
                    className="w-3.5 h-3.5 rounded accent-violet-500"
                />
                <span
                    className={`text-[9px] font-bold uppercase tracking-widest ${textD}`}
                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                >
                    {filtered.length} voucher
                </span>
            </div>
            <div className={`divide-y ${divider}`}>
                {filtered.map((v, idx) => (
                    <div
                        key={v.id}
                        className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                            selected.includes(v.id)
                                ? isDark
                                    ? "bg-violet-500/[0.06]"
                                    : "bg-violet-50"
                                : isDark
                                ? "hover:bg-white/[0.02]"
                                : "hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                            <span className={`text-[9px] font-mono w-5 text-right ${textD}`}>{idx + 1}</span>
                            <input
                                type="checkbox"
                                checked={selected.includes(v.id)}
                                onChange={() => onToggle(v.id)}
                                className="w-3.5 h-3.5 rounded accent-violet-500"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                                <span className={`font-mono font-black text-sm ${textH} break-all leading-snug`}>
                                    {v.username || "\u2014"}
                                </span>
                                {v.password && v.password !== v.username && (
                                    <span className="font-mono text-sm text-violet-400 break-all leading-snug">
                                        / {v.password}
                                    </span>
                                )}
                            </div>
                            <div className={`flex items-center gap-2 mt-1 flex-wrap text-[9px] ${textD}`}>
                                <span
                                    className={`px-1.5 py-0.5 rounded-full border font-bold ${pColor(v.profile)}`}
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    {v.profile || "default"}
                                </span>
                                {v.timeLimit && (
                                    <span className="flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {v.timeLimit}
                                    </span>
                                )}
                                {v.dataLimit && (
                                    <span className="flex items-center gap-0.5">
                                        <Database className="w-2.5 h-2.5" />
                                        {fmtBytes(v.dataLimit)}
                                    </span>
                                )}
                                {v.sharedUsers > 1 && (
                                    <span className="flex items-center gap-0.5">
                                        <Users className="w-2.5 h-2.5" />
                                        \u00d7{v.sharedUsers}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {[
                                {
                                    icon: Copy,
                                    fn: () => onCopy(`${v.username} / ${v.password}`),
                                    hov: "hover:text-white hover:bg-white/10",
                                    title: "Copy",
                                },
                                {
                                    icon: Printer,
                                    fn: () => onPrint([v]),
                                    hov: "hover:text-violet-400 hover:bg-violet-500/10",
                                    title: "Cetak",
                                },
                                {
                                    icon: Eye,
                                    fn: () => onPreview(v),
                                    hov: "hover:text-sky-400 hover:bg-sky-500/10",
                                    title: "Preview",
                                },
                                {
                                    icon: Edit2,
                                    fn: () => onEdit(v),
                                    hov: "hover:text-emerald-400 hover:bg-emerald-500/10",
                                    title: "Edit",
                                },
                                {
                                    icon: Trash2,
                                    fn: () => onDelete(v.id),
                                    hov: "hover:text-red-400 hover:bg-red-500/10",
                                    title: "Hapus",
                                },
                            ].map(({icon: Icon, fn, hov, title}) => (
                                <button
                                    key={title}
                                    onClick={fn}
                                    title={title}
                                    className={`p-1.5 rounded-lg transition ${textS} ${hov}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function GenerateVoucher() {
    const {theme} = useTheme();
    const isDark = theme === "dark";

    const [vouchers, setVouchers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [settings, setSettings] = useState({
        companyName: "",
        address: "",
        phone: "",
        footerText: "",
        logoUrl: "",
        showLogo: false,
        showAddress: false,
        showPhone: true,
        showQrCode: false,
        primaryColor: "#8b5cf6",
        printSize: "default",
    });
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterProfile, setFilterProfile] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const [selected, setSelected] = useState([]);
    const [showSearch, setShowSearch] = useState(false);

    const [showGenModal, setShowGenModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingV, setEditingV] = useState(null);
    const [showPreviewM, setShowPreviewM] = useState(false);
    const [previewV, setPreviewV] = useState(null);
    const [showStats, setShowStats] = useState(true);
    const [notif, setNotif] = useState(null);

    const [genForm, setGenForm] = useState({
        qty: 1,
        server: "all",
        userMode: "username",
        nameLength: 4,
        prefix: "",
        character: "random",
        profile: "default",
        timeLimit: "",
        dataLimit: "",
        dataLimitUnit: "MB",
        sharedUsers: 1,
        comment: "",
    });

    useEffect(() => {
        (async () => {
            await fetchSettings();
            await fetchProfiles();
            await fetchVouchers();
        })();
    }, []);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "hotspot_settings" && e.newValue) {
                try {
                    setSettings((p) => ({...p, ...JSON.parse(e.newValue)}));
                } catch {}
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Force refresh settings from localStorage on mount (in case API failed)
    useEffect(() => {
        try {
            const local = localStorage.getItem("hotspot_settings");
            if (local) {
                const parsed = JSON.parse(local);
                setSettings((p) => ({...p, ...parsed}));
            }
        } catch (e) {}
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const data = await api.get("/devices/2/hotspot/users");
            setVouchers(
                (data || []).map((v) => ({
                    ...v,
                    username: v.username || v.name || "",
                    sharedUsers: v.sharedUsers || v["shared-users"] || 1,
                    timeLimit: v.timeLimit || v["limit-uptime"] || "",
                    dataLimit: v.dataLimit || v["limit-bytes-total"] || "",
                }))
            );
        } catch {
            showNotif("Gagal memuat voucher", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchProfiles = async () => {
        try {
            const data = await api.get("/devices/2/hotspot/profiles");
            setProfiles(data || []);
            if (data?.length > 0) setGenForm((p) => ({...p, profile: data[0].name}));
        } catch {}
    };

    const fetchSettings = async () => {
        try {
            const data = await api.get("/settings");
            if (data && Object.keys(data).length > 0) {
                setSettings((p) => ({...p, ...data}));
                return;
            }
        } catch {}
        try {
            const s = localStorage.getItem("hotspot_settings");
            if (s) setSettings((p) => ({...p, ...JSON.parse(s)}));
        } catch {}
    };

    const showNotif = useCallback((msg, type = "success") => {
        setNotif({msg, type});
        setTimeout(() => setNotif(null), 3000);
    }, []);

    const randStr = (len, type) => {
        const chars =
            type === "number"
                ? "0123456789"
                : type === "abcd"
                ? "abcdefghijklmnopqrstuvwxyz"
                : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array.from({length: len}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    };

    const handleGenerate = async () => {
        if (genForm.qty < 1 || genForm.qty > 200) {
            showNotif("Jumlah voucher harus antara 1\u2013200", "error");
            return;
        }
        setLoading(true);
        const created = [];
        try {
            for (let i = 0; i < genForm.qty; i++) {
                const uname = genForm.prefix + randStr(genForm.nameLength, genForm.character);
                const pwd = genForm.userMode === "username" ? uname : randStr(genForm.nameLength, genForm.character);
                
                // Build payload — skip empty/zero values
                const payload = {
                    name: uname,
                    password: pwd,
                    profile: genForm.profile,
                    comment: genForm.comment || `vc-${Date.now()}-${genForm.profile}`,
                };
                
                // Time limit — skip kalau kosong
                if (genForm.timeLimit && String(genForm.timeLimit).trim() !== "" && String(genForm.timeLimit).trim() !== "0") {
                    payload["time-limit"] = genForm.timeLimit;
                }
                
                // Data limit — skip kalau kosong atau 0
                const dataNum = parseInt(genForm.dataLimit);
                if (genForm.dataLimit && String(genForm.dataLimit).trim() !== "" && !isNaN(dataNum) && dataNum > 0) {
                    payload["data-limit"] = genForm.dataLimit + genForm.dataLimitUnit;
                }
                
                // Shared users
                if (genForm.sharedUsers && genForm.sharedUsers > 1) {
                    payload["shared-users"] = String(genForm.sharedUsers);
                }
                
                console.log("[Generate] Payload:", JSON.stringify(payload));
                
                const res = await api.post("/devices/2/hotspot/users", payload);
                created.push({
                    id: res?.id || `tmp-${Date.now()}-${i}`,
                    username: uname,
                    password: pwd,
                    profile: genForm.profile,
                    timeLimit: genForm.timeLimit || "",
                    dataLimit: genForm.dataLimit ? genForm.dataLimit + genForm.dataLimitUnit : "",
                    sharedUsers: genForm.sharedUsers,
                    comment: payload.comment,
                });
            }
            setVouchers((p) => [...created, ...p]);
            setShowGenModal(false);
            showNotif(`\u2713 ${genForm.qty} voucher berhasil dibuat`);
        } catch (err) {
            console.error("[Generate] Error:", err);
            showNotif("Gagal membuat voucher: " + (err?.message || err?.response?.data?.detail || "Unknown error"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Hapus voucher ini?")) return;
        try {
            await api.delete(`/devices/2/hotspot/users/${id}`);
            setVouchers((p) => p.filter((v) => v.id !== id));
            setSelected((p) => p.filter((x) => x !== id));
            showNotif("Dihapus");
        } catch {
            showNotif("Gagal hapus", "error");
        }
    };

    const handleDeleteSelected = async () => {
        if (!selected.length || !confirm(`Hapus ${selected.length} voucher yang dipilih?`)) return;
        try {
            await Promise.all(selected.map((id) => api.delete(`/devices/2/hotspot/users/${id}`)));
            setVouchers((p) => p.filter((v) => !selected.includes(v.id)));
            setSelected([]);
            showNotif(`${selected.length} voucher dihapus`);
        } catch {
            showNotif("Gagal hapus sebagian", "error");
        }
    };

    const handleUpdate = async () => {
        if (!editingV) return;
        try {
            await api.patch(`/devices/2/hotspot/users/${editingV.id}`, {
                name: editingV.username,
                password: editingV.password,
                profile: editingV.profile,
                comment: editingV.comment,
            });
            setVouchers((p) => p.map((v) => (v.id === editingV.id ? editingV : v)));
            setShowEditModal(false);
            setEditingV(null);
            showNotif("Voucher diperbarui");
        } catch {
            showNotif("Gagal update", "error");
        }
    };

    const copy = useCallback(
        (text) => {
            navigator.clipboard.writeText(text);
            showNotif("Disalin!");
        },
        [showNotif]
    );
    const toggle = useCallback(
        (id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
        []
    );

    const filtered = vouchers.filter((v) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            (v.username || "").toLowerCase().includes(q) ||
            (v.profile || "").toLowerCase().includes(q) ||
            (v.comment || "").toLowerCase().includes(q);
        const matchProfile = filterProfile === "all" || v.profile === filterProfile;
        return matchSearch && matchProfile;
    });

    const selectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((v) => v.id));
    const uniqueProfiles = ["all", ...Array.from(new Set(vouchers.map((v) => v.profile).filter(Boolean)))];
    const handlePrint = useCallback((targets) => printVouchers(targets, settings), [settings]);

    const bg = isDark ? "bg-[#060b14]" : "bg-gray-50";
    const card = isDark ? "bg-[#0d1117] border-white/[0.07]" : "bg-white border-gray-200";
    const textH = isDark ? "text-white" : "text-gray-900";
    const textS = isDark ? "text-slate-400" : "text-gray-500";
    const textD = isDark ? "text-slate-600" : "text-gray-400";
    const divider = isDark ? "border-white/[0.06]" : "border-gray-100";
    const inputCls = isDark
        ? "bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:ring-violet-500/30 focus:border-violet-500/40"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-violet-400/30 focus:border-violet-400";
    const selectCls = isDark
        ? "bg-[#0d1117] border-white/[0.08] text-white focus:ring-violet-500/30"
        : "bg-white border-gray-300 text-gray-900 focus:ring-violet-400/30";

    const sharedCardProps = {
        selected,
        onToggle: toggle,
        onEdit: (v) => {
            setEditingV({...v});
            setShowEditModal(true);
        },
        onDelete: handleDelete,
        onCopy: copy,
        onPrint: handlePrint,
        onPreview: (v) => {
            setPreviewV(v);
            setShowPreviewM(true);
        },
        isDark,
    };

    return (
        <div className={`min-h-screen ${bg} ${textH}`} style={{fontFamily: "'DM Sans',sans-serif"}}>
            {/* Notif */}
            {notif && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-xl ${
                        notif.type === "error"
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}
                >
                    {notif.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    {notif.msg}
                </div>
            )}

            {/* Sticky Header */}
            <div className={`sticky top-0 z-30 border-b backdrop-blur-xl ${card} ${divider}`}>
                <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Ticket className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                            <h1 className={`text-base font-black tracking-tight ${textH}`}>Generate Voucher</h1>
                            <p className={`text-[11px] ${textD}`}>
                                {vouchers.length} total · {filtered.length} ditampilkan
                                {selected.length > 0 && ` · ${selected.length} terpilih`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative hidden sm:block">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textD}`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari voucher..."
                                className={`pl-9 pr-4 py-2 w-48 rounded-xl text-sm border focus:outline-none focus:ring-1 transition ${inputCls}`}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${textD}`}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowSearch((p) => !p)}
                            className={`sm:hidden p-2.5 rounded-xl border transition ${card} ${textS}`}
                        >
                            <Search className="w-4 h-4" />
                        </button>

                        <div className={`flex items-center rounded-xl border overflow-hidden ${card}`}>
                            {VIEW_MODES.map(({id, icon: Icon, label, title}) => (
                                <button
                                    key={id}
                                    onClick={() => setViewMode(id)}
                                    title={title}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition ${
                                        viewMode === id
                                            ? "bg-violet-500/15 text-violet-400"
                                            : `${textS} ${isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-100"}`
                                    } ${
                                        id !== "grid"
                                            ? isDark
                                                ? "border-l border-white/[0.07]"
                                                : "border-l border-gray-200"
                                            : ""
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowStats((p) => !p)}
                            title="Statistik"
                            className={`p-2.5 rounded-xl border transition ${card} ${
                                showStats ? "text-violet-400 border-violet-500/30" : textS
                            }`}
                        >
                            <BarChart2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={fetchVouchers}
                            className={`p-2.5 rounded-xl border transition ${card} ${textS}`}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>
                {showSearch && (
                    <div className={`px-5 pb-3 sm:hidden border-t ${divider}`}>
                        <div className="relative mt-3">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textD}`} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari voucher..."
                                autoFocus
                                className={`pl-9 pr-4 py-2 w-full rounded-xl text-sm border focus:outline-none focus:ring-1 transition ${inputCls}`}
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 ${textD}`}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-5 py-5">
                {showStats && vouchers.length > 0 && <StatsBar vouchers={vouchers} isDark={isDark} />}

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowGenModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-900/25 transition active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> Generate Voucher
                        </button>

                        {selected.length > 0 && (
                            <>
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-semibold border border-red-500/20 transition"
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus ({selected.length})
                                </button>
                                <button
                                    onClick={() => handlePrint(vouchers.filter((v) => selected.includes(v.id)))}
                                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-sm font-semibold border border-sky-500/20 transition"
                                >
                                    <Printer className="w-4 h-4" /> Cetak ({selected.length})
                                </button>
                                <button
                                    onClick={() => {
                                        copy(batchCopyText(vouchers.filter((v) => selected.includes(v.id))));
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold border border-emerald-500/20 transition"
                                >
                                    <ClipboardList className="w-4 h-4" /> Copy Teks ({selected.length})
                                </button>
                                <button
                                    onClick={() => exportCSV(vouchers.filter((v) => selected.includes(v.id)))}
                                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-sm font-semibold border border-amber-500/20 transition"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button
                                    onClick={() => setSelected([])}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${card} ${textS}`}
                                >
                                    <X className="w-3.5 h-3.5" /> Batal
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => exportCSV(filtered)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition ${card} ${textS}`}
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button
                            onClick={() => handlePrint(filtered)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${card} ${textS}`}
                        >
                            <Printer className="w-4 h-4" /> Cetak {filterProfile !== "all" ? `"${filterProfile}"` : ""}{" "}
                            ({filtered.length})
                        </button>
                    </div>
                </div>

                {/* Profile Filter */}
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                    <Filter className={`w-3.5 h-3.5 ${textD} mr-1`} />
                    {uniqueProfiles.map((p) => (
                        <button
                            key={p}
                            onClick={() => setFilterProfile(p)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                                filterProfile === p
                                    ? "bg-violet-500/15 text-violet-400 border-violet-500/30"
                                    : isDark
                                    ? "bg-white/[0.02] text-slate-500 border-white/[0.05] hover:text-slate-300"
                                    : "bg-white text-gray-400 border-gray-200 hover:text-gray-700"
                            }`}
                        >
                            {p === "all" ? "Semua" : p}
                            <span
                                className={`ml-1.5 text-[10px] font-mono ${
                                    filterProfile === p ? "text-violet-400/70" : textD
                                }`}
                            >
                                {p === "all" ? vouchers.length : vouchers.filter((v) => v.profile === p).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Select All */}
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer w-fit select-none">
                    <input
                        type="checkbox"
                        checked={filtered.length > 0 && selected.length === filtered.length}
                        onChange={selectAll}
                        className="w-4 h-4 rounded accent-violet-500"
                    />
                    <span className={`text-sm ${textS}`}>
                        {selected.length > 0 ? `${selected.length} dari ${filtered.length} terpilih` : "Pilih semua"}
                    </span>
                </label>

                {/* Loading skeleton */}
                {loading && vouchers.length === 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({length: 10}).map((_, i) => (
                            <div key={i} className={`rounded-2xl border h-52 animate-pulse ${card}`} />
                        ))}
                    </div>
                )}

                {/* GRID */}
                {!loading && viewMode === "grid" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filtered.map((v) => (
                            <GridCard key={v.id} v={v} {...sharedCardProps} selected={selected.includes(v.id)} />
                        ))}
                    </div>
                )}
                {/* LIST */}
                {!loading && viewMode === "list" && (
                    <ListView
                        filtered={filtered}
                        selected={selected}
                        onToggle={toggle}
                        selectAll={selectAll}
                        onEdit={(v) => {
                            setEditingV({...v});
                            setShowEditModal(true);
                        }}
                        onDelete={handleDelete}
                        onCopy={copy}
                        onPrint={handlePrint}
                        onPreview={(v) => {
                            setPreviewV(v);
                            setShowPreviewM(true);
                        }}
                        isDark={isDark}
                    />
                )}
                {/* COMPACT */}
                {!loading && viewMode === "compact" && (
                    <CompactView
                        filtered={filtered}
                        selected={selected}
                        onToggle={toggle}
                        selectAll={selectAll}
                        onEdit={(v) => {
                            setEditingV({...v});
                            setShowEditModal(true);
                        }}
                        onDelete={handleDelete}
                        onCopy={copy}
                        onPrint={handlePrint}
                        onPreview={(v) => {
                            setPreviewV(v);
                            setShowPreviewM(true);
                        }}
                        isDark={isDark}
                    />
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                    <div className="text-center py-20">
                        <div
                            className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto mb-4 ${card}`}
                        >
                            <Ticket className={`w-6 h-6 ${textS}`} />
                        </div>
                        <p className={`font-semibold ${textS}`}>
                            {search || filterProfile !== "all" ? "Tidak ada voucher yang cocok" : "Belum ada voucher"}
                        </p>
                        <p className={`text-sm mt-1 ${textD}`}>
                            {search || filterProfile !== "all"
                                ? "Coba ubah kata kunci atau filter profile"
                                : `Klik "Generate Voucher" untuk membuat baru`}
                        </p>
                        {(search || filterProfile !== "all") && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterProfile("all");
                                }}
                                className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition"
                            >
                                Reset filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL GENERATE */}
            {showGenModal && (
                <Modal
                    title="Generate Voucher"
                    icon={<Shuffle className="w-4 h-4 text-violet-400" />}
                    onClose={() => setShowGenModal(false)}
                    isDark={isDark}
                >
                    <div className="overflow-y-auto max-h-[62vh]">
                        <div className="px-5 pt-4">
                            <p
                                className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${
                                    isDark ? "text-slate-600" : "text-gray-400"
                                }`}
                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                            >
                                Preview Cetak
                            </p>
                            <VoucherPreviewMini form={genForm} isDark={isDark} settings={settings} />
                        </div>
                        <div className="px-5 pb-5 mt-4 space-y-3.5">
                            <div className={`border-t ${isDark ? "border-white/[0.06]" : "border-gray-100"} -mx-5`} />

                            <Field
                                label="Jumlah Voucher"
                                hint="Buat beberapa voucher sekaligus. Maksimal 200 per batch."
                                isDark={isDark}
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={200}
                                        value={genForm.qty}
                                        onChange={(e) =>
                                            setGenForm((p) => ({
                                                ...p,
                                                qty: Math.min(200, Math.max(1, parseInt(e.target.value) || 1)),
                                            }))
                                        }
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                    />
                                    <div className="flex gap-1 flex-shrink-0">
                                        {[5, 10, 20, 50].map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setGenForm((p) => ({...p, qty: n}))}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                                                    genForm.qty === n
                                                        ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                                                        : isDark
                                                        ? "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Field>

                            <Field
                                label="Mode Username & Password"
                                hint={
                                    genForm.userMode === "username"
                                        ? "Username = password \u2014 lebih mudah diingat."
                                        : "Username & password berbeda \u2014 lebih aman."
                                }
                                isDark={isDark}
                            >
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        {value: "username", label: "Sama", sub: "username = password"},
                                        {value: "both", label: "Terpisah", sub: "lebih aman"},
                                    ].map(({value, label, sub}) => (
                                        <button
                                            key={value}
                                            onClick={() => setGenForm((p) => ({...p, userMode: value}))}
                                            className={`px-3 py-2 rounded-xl border text-left transition ${
                                                genForm.userMode === value
                                                    ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
                                                    : isDark
                                                    ? "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="text-xs font-bold">{label}</div>
                                            <div
                                                className={`text-[10px] mt-0.5 ${
                                                    isDark ? "text-slate-600" : "text-gray-400"
                                                }`}
                                            >
                                                {sub}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Panjang Kode" hint="4\u20136 karakter cukup." isDark={isDark}>
                                    <div className="flex gap-1 flex-wrap">
                                        {[2, 4, 5, 6, 8].map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setGenForm((p) => ({...p, nameLength: n}))}
                                                className={`flex-1 min-w-[32px] py-2 rounded-xl border text-xs font-bold transition ${
                                                    genForm.nameLength === n
                                                        ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                                                        : isDark
                                                        ? "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                                <Field label="Prefix (Awalan)" hint={`"vc-" \u2192 "vc-AB12"`} isDark={isDark}>
                                    <input
                                        value={genForm.prefix}
                                        onChange={(e) => setGenForm((p) => ({...p, prefix: e.target.value}))}
                                        placeholder="vc- (opsional)"
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                    />
                                </Field>
                            </div>

                            <Field label="Tipe Karakter" hint="Alphanumeric paling umum dipakai." isDark={isDark}>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        {value: "random", label: "A-Z + 0-9", sub: "Alphanumeric"},
                                        {value: "abcd", label: "a-z", sub: "Huruf kecil"},
                                        {value: "number", label: "0-9", sub: "Angka saja"},
                                    ].map(({value, label, sub}) => (
                                        <button
                                            key={value}
                                            onClick={() => setGenForm((p) => ({...p, character: value}))}
                                            className={`px-2 py-2 rounded-xl border text-center transition ${
                                                genForm.character === value
                                                    ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
                                                    : isDark
                                                    ? "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="text-xs font-black font-mono">{label}</div>
                                            <div
                                                className={`text-[9px] mt-0.5 ${
                                                    isDark ? "text-slate-600" : "text-gray-400"
                                                }`}
                                            >
                                                {sub}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            <Field
                                label="Profile MikroTik"
                                hint="Menentukan kecepatan & batasan dari router."
                                isDark={isDark}
                            >
                                <select
                                    value={genForm.profile}
                                    onChange={(e) => setGenForm((p) => ({...p, profile: e.target.value}))}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${selectCls}`}
                                >
                                    {profiles.length > 0 ? (
                                        profiles.map((p) => (
                                            <option key={p.name} value={p.name}>
                                                {p.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="default">default</option>
                                    )}
                                </select>
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    label="Batas Waktu"
                                    hint="1d \u00b7 12h \u00b7 30m. Kosong = \u221e"
                                    isDark={isDark}
                                >
                                    <input
                                        value={genForm.timeLimit}
                                        onChange={(e) => setGenForm((p) => ({...p, timeLimit: e.target.value}))}
                                        placeholder="1d / 12h / 30m"
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                    />
                                </Field>
                                <Field label="Batas Kuota" hint="Kosong = \u221e" isDark={isDark}>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="number"
                                            value={genForm.dataLimit}
                                            onChange={(e) => setGenForm((p) => ({...p, dataLimit: e.target.value}))}
                                            placeholder="0 = \u221e"
                                            className={`flex-1 min-w-0 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                        />
                                        <select
                                            value={genForm.dataLimitUnit}
                                            onChange={(e) => setGenForm((p) => ({...p, dataLimitUnit: e.target.value}))}
                                            className={`px-2 py-2.5 rounded-xl border text-sm focus:outline-none transition ${selectCls}`}
                                        >
                                            <option value="MB">MB</option>
                                            <option value="GB">GB</option>
                                        </select>
                                    </div>
                                </Field>
                            </div>

                            <Field
                                label="Maks. Perangkat (Shared Users)"
                                hint="Perangkat yang bisa login bersamaan dengan 1 voucher."
                                isDark={isDark}
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={genForm.sharedUsers}
                                        onChange={(e) =>
                                            setGenForm((p) => ({
                                                ...p,
                                                sharedUsers: Math.max(1, parseInt(e.target.value) || 1),
                                            }))
                                        }
                                        className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                    />
                                    <div className="flex gap-1 flex-shrink-0">
                                        {[1, 2, 3, 5].map((n) => (
                                            <button
                                                key={n}
                                                onClick={() => setGenForm((p) => ({...p, sharedUsers: n}))}
                                                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                                                    genForm.sharedUsers === n
                                                        ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                                                        : isDark
                                                        ? "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300"
                                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700"
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Field>

                            <Field
                                label="Label / Keterangan Batch"
                                hint="Catatan internal. Tidak tampil di voucher cetak."
                                isDark={isDark}
                            >
                                <input
                                    value={genForm.comment}
                                    onChange={(e) => setGenForm((p) => ({...p, comment: e.target.value}))}
                                    placeholder="Contoh: Paket Lebaran 2025"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                />
                            </Field>
                        </div>
                    </div>
                    <ModalFooter
                        onClose={() => setShowGenModal(false)}
                        onSave={handleGenerate}
                        loading={loading}
                        saveLabel={`Generate ${genForm.qty} Voucher`}
                        isDark={isDark}
                        saveCls="from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 shadow-violet-900/25"
                    />
                </Modal>
            )}

            {/* MODAL EDIT */}
            {showEditModal && editingV && (
                <Modal
                    title="Edit Voucher"
                    icon={<Edit2 className="w-4 h-4 text-sky-400" />}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingV(null);
                    }}
                    isDark={isDark}
                >
                    <div className="p-5 space-y-3.5">
                        {[
                            {label: "Username", key: "username", hint: "Kode yang dipakai pelanggan untuk login."},
                            {label: "Password", key: "password", hint: "Kata sandi login. Bisa sama dengan username."},
                        ].map(({label, key, hint}) => (
                            <Field key={key} label={label} hint={hint} isDark={isDark}>
                                <input
                                    value={editingV[key] || ""}
                                    onChange={(e) => setEditingV((p) => ({...p, [key]: e.target.value}))}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                                />
                            </Field>
                        ))}
                        <Field label="Profile MikroTik" hint="Ubah paket / kecepatan voucher ini." isDark={isDark}>
                            <select
                                value={editingV.profile || "default"}
                                onChange={(e) => setEditingV((p) => ({...p, profile: e.target.value}))}
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${selectCls}`}
                            >
                                {profiles.length > 0 ? (
                                    profiles.map((p) => (
                                        <option key={p.name} value={p.name}>
                                            {p.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="default">default</option>
                                )}
                            </select>
                        </Field>
                        <Field label="Keterangan" hint="Catatan internal." isDark={isDark}>
                            <input
                                value={editingV.comment || ""}
                                onChange={(e) => setEditingV((p) => ({...p, comment: e.target.value}))}
                                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 transition ${inputCls}`}
                            />
                        </Field>
                    </div>
                    <ModalFooter
                        onClose={() => {
                            setShowEditModal(false);
                            setEditingV(null);
                        }}
                        onSave={handleUpdate}
                        saveLabel="Simpan Perubahan"
                        isDark={isDark}
                        saveCls="from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-900/25"
                    />
                </Modal>
            )}

            {/* MODAL PREVIEW */}
            {showPreviewM && previewV && (
                <Modal
                    title="Preview Voucher"
                    icon={<Eye className="w-4 h-4 text-emerald-400" />}
                    onClose={() => setShowPreviewM(false)}
                    isDark={isDark}
                    maxW="max-w-xs"
                >
                    <div className="p-5">
                        <div
                            style={{
                                border: "1.5px dashed #94a3b8",
                                borderRadius: 10,
                                overflow: "hidden",
                                background: "#fff",
                                color: "#1e293b",
                                fontFamily: "'Segoe UI',Arial,sans-serif",
                                textAlign: "center",
                            }}
                        >
                            <div style={{height: 3, background: "linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7)"}} />
                            <div style={{padding: "14px 16px 12px"}}>
                                {settings.logoUrl && (
                                    <img
                                        src={settings.logoUrl}
                                        alt="logo"
                                        style={{
                                            height: 32,
                                            width: "auto",
                                            objectFit: "contain",
                                            display: "block",
                                            margin: "0 auto 6px",
                                        }}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 900,
                                        color: "#0f172a",
                                        wordBreak: "break-word",
                                        lineHeight: 1.25,
                                        marginBottom: 1,
                                    }}
                                >
                                    {settings.companyName || ""}
                                </div>
                                {settings.address && (
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "#475569",
                                            wordBreak: "break-word",
                                            marginBottom: 1,
                                        }}
                                    >
                                        {settings.address}
                                    </div>
                                )}
                                {settings.phone && (
                                    <div style={{fontSize: 10, color: "#64748b", marginBottom: 4}}>
                                        {settings.phone}
                                    </div>
                                )}
                                <div
                                    style={{
                                        borderTop: "1.5px dashed #e2e8f0",
                                        borderBottom: "1.5px dashed #e2e8f0",
                                        padding: "10px 0",
                                        margin: "6px 0",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 8,
                                            color: "#94a3b8",
                                            letterSpacing: 3,
                                            textTransform: "uppercase",
                                            fontWeight: 700,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Kode Voucher
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 900,
                                            fontFamily: "'Courier New',monospace",
                                            letterSpacing: 3,
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 6,
                                            padding: "4px 12px",
                                            display: "inline-block",
                                            wordBreak: "break-all",
                                            whiteSpace: "normal",
                                            maxWidth: "100%",
                                        }}
                                    >
                                        {previewV.username || "\u2014"}
                                    </div>
                                    {previewV.password && previewV.password !== previewV.username && (
                                        <>
                                            <div
                                                style={{
                                                    fontSize: 8,
                                                    color: "#94a3b8",
                                                    letterSpacing: 3,
                                                    textTransform: "uppercase",
                                                    fontWeight: 700,
                                                    marginTop: 5,
                                                    marginBottom: 3,
                                                }}
                                            >
                                                Password
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 900,
                                                    fontFamily: "'Courier New',monospace",
                                                    color: settings.primaryColor || "#7c3aed",
                                                    letterSpacing: 2,
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                {previewV.password}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{fontSize: 10, color: "#475569", marginBottom: 2}}>
                                    {[
                                        previewV.profile,
                                        previewV.timeLimit,
                                        previewV.dataLimit,
                                        previewV.sharedUsers > 1 ? `${previewV.sharedUsers} user` : null,
                                    ]
                                    .filter(Boolean)
                                    .join(" \u00b7 ")}
                                </div>
                                {settings.footerText && (
                                    <div
                                        style={{
                                            fontSize: 9,
                                            color: "#94a3b8",
                                            marginTop: 6,
                                            fontStyle: "italic",
                                            borderTop: "1px dashed #f1f5f9",
                                            paddingTop: 6,
                                        }}
                                    >
                                        {settings.footerText}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div
                        className={`flex gap-2 px-5 py-4 border-t ${
                            isDark ? "border-white/[0.06]" : "border-gray-100"
                        }`}
                    >
                        <button
                            onClick={() => handlePrint([previewV])}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold transition active:scale-95"
                        >
                            <Printer className="w-4 h-4" /> Cetak
                        </button>
                        <button
                            onClick={() => copy(`${previewV.username} / ${previewV.password}`)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${card} ${textS}`}
                        >
                            <Copy className="w-4 h-4" /> Copy
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
