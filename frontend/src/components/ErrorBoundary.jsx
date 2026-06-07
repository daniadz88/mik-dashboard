import {Component} from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false, error: null, errorInfo: null};
    }

    static getDerivedStateFromError(error) {
        return {hasError: true, error};
    }

    componentDidCatch(error, errorInfo) {
        console.error("[React Error]", error, errorInfo);
        this.setState({errorInfo});
    }

    render() {
        if (this.state.hasError) {
            const isDark = document.documentElement.classList.contains("dark");
            const bg = isDark ? "#0f172a" : "#f8fafc";
            const cardBg = isDark ? "#1e293b" : "#ffffff";
            const text = isDark ? "#e2e8f0" : "#1e293b";
            const muted = isDark ? "#94a3b8" : "#64748b";
            const border = isDark ? "#334155" : "#e2e8f0";
            const accent = isDark ? "#06b6d4" : "#0891b2";
            const errorColor = isDark ? "#ef4444" : "#dc2626";

            const errorMessage = this.state.error?.message || "Error tidak diketahui";
            const errorStack = this.state.error?.stack || "";
            const componentStack = this.state.errorInfo?.componentStack || "";

            // Tentukan jenis error
            let errorType = "Error Umum";
            let errorHint = "Coba muat ulang halaman.";

            if (errorMessage.includes("Cannot find module") || errorMessage.includes("Failed to resolve")) {
                errorType = "Error Import Module";
                errorHint =
                    "File yang di-import tidak ditemukan. Cek apakah nama file dan path sudah benar (Vite butuh ekstensi lengkap: .js, .jsx, .css).";
            } else if (errorMessage.includes("undefined is not") || errorMessage.includes("Cannot read properties")) {
                errorType = "Error Data Undefined";
                errorHint =
                    "Data yang dibaca adalah undefined/null. Cek apakah API berjalan dan mengembalikan data yang benar.";
            } else if (errorMessage.includes("Network Error") || errorMessage.includes("ECONNREFUSED")) {
                errorType = "Error Koneksi Jaringan";
                errorHint = "Tidak bisa terhubung ke backend. Pastikan server backend berjalan di port 3001.";
            } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
                errorType = "Error Autentikasi";
                errorHint = "Sesi login habis. Silakan login ulang.";
            } else if (errorMessage.includes("500")) {
                errorType = "Error Server Backend";
                errorHint = "Backend mengalami error. Cek console terminal backend untuk detail.";
            }

            return (
                <div
                    style={{
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                        background: bg,
                        color: text,
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                    }}
                >
                    <div style={{maxWidth: "600px", width: "100%"}}>
                        {/* Logo */}
                        <div style={{textAlign: "center", marginBottom: "24px"}}>
                            <div
                                style={{
                                    width: "64px",
                                    height: "64px",
                                    margin: "0 auto 16px",
                                    background: cardBg,
                                    border: `2px solid ${border}`,
                                    borderRadius: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "28px",
                                }}
                            >
                                💥
                            </div>
                            <h1 style={{fontSize: "22px", fontWeight: 800, marginBottom: "4px"}}>Terjadi Kesalahan</h1>
                            <p style={{color: muted, fontSize: "14px"}}>
                                Aplikasi mengalami masalah yang tidak terduga
                            </p>
                        </div>

                        {/* Error Card */}
                        <div
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                                borderRadius: "24px",
                                padding: "32px",
                                boxShadow: `0 25px 50px -12px rgba(0,0,0,${isDark ? "0.5" : "0.1"})`,
                            }}
                        >
                            {/* Error Type Badge */}
                            <div
                                style={{
                                    display: "inline-block",
                                    background: `${errorColor}15`,
                                    color: errorColor,
                                    padding: "6px 14px",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    marginBottom: "16px",
                                }}
                            >
                                {errorType}
                            </div>

                            {/* Error Message */}
                            <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "8px"}}>{errorMessage}</h2>
                            <p style={{color: muted, fontSize: "14px", lineHeight: 1.6, marginBottom: "20px"}}>
                                {errorHint}
                            </p>

                            {/* Detail Error (Collapsible) */}
                            <details style={{marginBottom: "20px"}}>
                                <summary
                                    style={{
                                        color: muted,
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        userSelect: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    🔍 Lihat Detail Teknis (untuk developer)
                                </summary>
                                <div
                                    style={{
                                        background: isDark ? "#0f172a" : "#f1f5f9",
                                        borderRadius: "12px",
                                        padding: "16px",
                                        marginTop: "12px",
                                        fontFamily: "'SF Mono', 'Consolas', monospace",
                                        fontSize: "12px",
                                        overflow: "auto",
                                        maxHeight: "300px",
                                    }}
                                >
                                    <div style={{color: errorColor, marginBottom: "12px", fontWeight: 600}}>
                                        📍 Error Message:
                                    </div>
                                    <pre
                                        style={{
                                            color: muted,
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-all",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        {errorStack}
                                    </pre>

                                    {componentStack && (
                                        <>
                                            <div style={{color: accent, marginBottom: "12px", fontWeight: 600}}>
                                                🧩 Component Stack:
                                            </div>
                                            <pre style={{color: muted, whiteSpace: "pre-wrap", wordBreak: "break-all"}}>
                                                {componentStack}
                                            </pre>
                                        </>
                                    )}
                                </div>
                            </details>

                            {/* Actions */}
                            <div style={{display: "flex", gap: "12px", flexWrap: "wrap"}}>
                                <button
                                    onClick={() => window.location.reload()}
                                    style={{
                                        flex: 1,
                                        minWidth: "120px",
                                        padding: "12px 20px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: accent,
                                        color: "white",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                                    onMouseOut={(e) => (e.target.style.opacity = "1")}
                                >
                                    🔄 Muat Ulang
                                </button>
                                <button
                                    onClick={() => (window.location.href = "/")}
                                    style={{
                                        flex: 1,
                                        minWidth: "120px",
                                        padding: "12px 20px",
                                        borderRadius: "12px",
                                        border: `1px solid ${border}`,
                                        background: "transparent",
                                        color: muted,
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    🏠 Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        localStorage.clear();
                                        window.location.reload();
                                    }}
                                    style={{
                                        flex: 1,
                                        minWidth: "120px",
                                        padding: "12px 20px",
                                        borderRadius: "12px",
                                        border: `1px solid ${errorColor}30`,
                                        background: "transparent",
                                        color: errorColor,
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                    }}
                                >
                                    🗑️ Clear Data
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{textAlign: "center", marginTop: "24px", fontSize: "12px", color: muted}}>
                            MIKHMON v2.0 • Hotspot Manager •<span style={{color: accent}}> http://localhost:3001</span>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
