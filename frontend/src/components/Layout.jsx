import React from "react";
import {Outlet, Link, useLocation, useNavigate} from "react-router-dom";
import {useTheme} from "./ThemeContext.jsx";
import {useApp} from "../useApp.jsx";
import {useSettings} from "../useSettings.js";
import {
    LayoutDashboard,
    Router,
    ScanLine,
    Wifi,
    Ticket,
    Users,
    UserCog,
    Settings,
    Shield,
    Sun,
    Moon,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Radio,
    Menu,
    X,
} from "lucide-react";

// ==========================================
// MENU ITEMS WITH ROLE REQUIREMENTS
// ==========================================
const menuItems = [
    {path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", accent: "#22d3ee", dot: "bg-cyan-400", roles: ["admin", "operator"]},
    {path: "/devices", icon: Router, label: "Devices", accent: "#60a5fa", dot: "bg-blue-400", roles: ["admin", "operator"]},
    {path: "/scanner", icon: ScanLine, label: "Scanner", accent: "#a78bfa", dot: "bg-violet-400", roles: ["admin", "operator"]},
    {path: "/active", icon: Radio, label: "Active", accent: "#34d399", dot: "bg-emerald-400", roles: ["admin", "operator"]},
    {path: "/voucher", icon: Ticket, label: "Voucher", accent: "#c084fc", dot: "bg-purple-400", roles: ["admin", "operator"]},
    {path: "/users", icon: Users, label: "Users", accent: "#38bdf8", dot: "bg-sky-400", roles: ["admin", "operator"]},
    {path: "/profiles", icon: UserCog, label: "Profiles", accent: "#fbbf24", dot: "bg-amber-400", roles: ["admin", "operator"]},
    {path: "/app-users", icon: Shield, label: "App Users", accent: "#fb7185", dot: "bg-rose-400", roles: ["admin"]},  // ⬅️ ADMIN ONLY
    {path: "/settings", icon: Settings, label: "Settings", accent: "#94a3b8", dot: "bg-slate-400", roles: ["admin", "operator"]},
];

function SidebarContent({collapsed, setMobileOpen, appName, companyName, s, isDark, user, toggleTheme, handleLogout, location}) {
    // Filter menu based on user role
    const visibleMenu = React.useMemo(() => {
        const userRole = user?.role || "operator";
        return menuItems.filter(item => item.roles.includes(userRole));
    }, [user?.role]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Logo ── */}
            <div className={`h-[60px] flex items-center justify-between px-4 border-b ${s.border} flex-shrink-0`}>
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/50">
                            <Wifi className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#090f1a] animate-pulse" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p
                                className={`font-black text-[14px] tracking-[0.08em] uppercase truncate ${s.text}`}
                                style={{fontFamily: "'JetBrains Mono',monospace"}}
                            >
                                {appName || <span className={s.muted}>MIK Dashboard</span>}
                            </p>
                            <p className={`text-[9px] tracking-[0.15em] uppercase ${s.muted} truncate`}>
                                {companyName || "v2.0 · Hotspot OS"}
                            </p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setMobileOpen(false)}
                    className={`lg:hidden p-1.5 rounded-lg ${s.muted} ${s.hover}`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-[2px]">
                {visibleMenu.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            title={collapsed ? item.label : ""}
                            className={`relative flex items-center gap-3 px-3 py-[9px] rounded-xl
                                text-[13px] font-medium transition-all duration-150
                                ${collapsed ? "justify-center" : ""}
                                ${active ? s.hover : `${s.sub} ${s.hover}`}`}
                            style={active ? {color: item.accent} : {}}
                        >
                            {active && (
                                <span
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                    style={{backgroundColor: item.accent}}
                                />
                            )}
                            <item.icon
                                className="w-[17px] h-[17px] flex-shrink-0 transition-colors"
                                style={active ? {color: item.accent} : {}}
                            />
                            {!collapsed && (
                                <>
                                    <span className="flex-1" style={{fontFamily: "'DM Sans',sans-serif"}}>
                                        {item.label}
                                    </span>
                                    {active && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Bottom ── */}
            <div className={`px-2 pb-3 pt-2 border-t ${s.border} flex-shrink-0 space-y-[2px]`}>
                {user && (
                    <div
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1.5 ${s.user}
                        ${!collapsed ? "" : "justify-center"}`}
                    >
                        <div
                            className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700
                            flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                        >
                            {(user.name || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div className="min-w-0 flex-1">
                                <p className={`text-xs font-semibold truncate ${s.text}`}>
                                    {user.name || user.username}
                                </p>
                                <p
                                    className={`text-[10px] truncate ${s.muted} capitalize`}
                                    style={{fontFamily: "'JetBrains Mono',monospace"}}
                                >
                                    {user.role || "operator"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    title={collapsed ? "Toggle theme" : ""}
                    className={`w-full flex items-center gap-3 px-3 py-[8px] rounded-xl text-[13px] font-medium transition-all
                        ${s.sub} ${s.hover} ${collapsed ? "justify-center" : ""}`}
                >
                    {isDark ? (
                        <Sun className={`w-[16px] h-[16px] flex-shrink-0 ${s.muted}`} />
                    ) : (
                        <Moon className={`w-[16px] h-[16px] flex-shrink-0 ${s.muted}`} />
                    )}
                    {!collapsed && (
                        <span style={{fontFamily: "'DM Sans',sans-serif"}}>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    )}
                </button>

                <button
                    onClick={handleLogout}
                    title={collapsed ? "Logout" : ""}
                    className={`w-full flex items-center gap-3 px-3 py-[8px] rounded-xl text-[13px] font-medium
                        transition-all text-red-400/60 hover:bg-red-500/[0.08] hover:text-red-400
                        ${collapsed ? "justify-center" : ""}`}
                >
                    <LogOut className="w-[16px] h-[16px] flex-shrink-0" />
                    {!collapsed && <span style={{fontFamily: "'DM Sans',sans-serif"}}>Logout</span>}
                </button>
            </div>
        </div>
    );
}

export default function Layout() {
    const {theme, toggleTheme} = useTheme();
    const {user, logout} = useApp();
    const settings = useSettings();
    const location = useLocation();
    const navigate = useNavigate();

    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const isDark = theme === "dark";

    const appName = settings.appName || "MIK Dashboard";
    const companyName = settings.companyName || "";

    // Update document title based on settings
    React.useEffect(() => {
        const pageName = menuItems.find((m) => m.path === location.pathname)?.label || "";
        document.title = pageName
            ? `${pageName} · ${appName}`
            : appName;
    }, [location.pathname, appName]);

    const handleLogout = () => {
        logout?.();
        navigate("/login");
    };

    const s = isDark
        ? {
              sidebar: "bg-[#090f1a]",
              border: "border-white/[0.05]",
              main: "bg-[#060b14]",
              text: "text-white",
              muted: "text-slate-500",
              sub: "text-slate-400",
              hover: "hover:bg-white/[0.04]",
              user: "bg-white/[0.03]",
          }
        : {
              sidebar: "bg-white",
              border: "border-gray-200",
              main: "bg-gray-50",
              text: "text-gray-900",
              muted: "text-gray-400",
              sub: "text-gray-500",
              hover: "hover:bg-gray-100",
              user: "bg-gray-50",
          };

    const sidebarProps = {
        collapsed,
        setCollapsed,
        setMobileOpen,
        appName,
        companyName,
        s,
        isDark,
        user,
        toggleTheme,
        handleLogout,
        location,
    };

    return (
        <div className={`flex h-screen overflow-hidden ${s.main}`}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-60 border-r flex flex-col transition-transform duration-300 lg:hidden
                ${s.sidebar} ${s.border} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Desktop sidebar */}
            <aside
                className={`relative hidden lg:flex flex-col flex-shrink-0 border-r transition-all duration-300
                ${collapsed ? "w-[56px]" : "w-[220px]"} ${s.sidebar} ${s.border}`}
            >
                <SidebarContent {...sidebarProps} />

                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className={`absolute -right-3 top-1/2 -translate-y-1/2 z-10
                        w-6 h-10 rounded-r-xl border border-l-0
                        flex items-center justify-center
                        transition-all duration-200
                        ${
                            isDark
                                ? "bg-[#090f1a] border-white/[0.07] text-slate-500 hover:text-slate-300 hover:bg-[#0d1320]"
                                : "bg-white border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile topbar */}
                <header
                    className={`lg:hidden h-13 flex items-center gap-3 px-4 border-b flex-shrink-0 ${s.sidebar} ${s.border}`}
                >
                    <button onClick={() => setMobileOpen(true)} className={`p-2 rounded-xl ${s.muted} ${s.hover}`}>
                        <Menu className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                            <Wifi className="w-3 h-3 text-white" />
                        </div>
                        <span
                            className={`font-black text-sm tracking-widest ${s.text}`}
                            style={{fontFamily: "'JetBrains Mono',monospace"}}
                        >
                            {appName}
                        </span>
                    </div>
                </header>

                <main className={`flex-1 overflow-auto ${s.main}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}