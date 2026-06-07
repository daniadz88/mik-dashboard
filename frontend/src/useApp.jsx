import {createContext, useContext, useState, useCallback, useEffect} from "react";
import api from "./api.js";

const AppCtx = createContext(null);

export function AppProvider({children}) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    const [toasts, setToasts] = useState([]);

    const [selectedDevice, setSelectedDeviceState] = useState(() => {
        try {
            const saved = localStorage.getItem("selectedDevice");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setSelectedDevice = useCallback((device) => {
        setSelectedDeviceState(device);
        if (device) {
            localStorage.setItem("selectedDevice", JSON.stringify(device));
        } else {
            localStorage.removeItem("selectedDevice");
        }
    }, []);

    // Validate saved device still exists on mount
    useEffect(() => {
        const saved = localStorage.getItem("selectedDevice");
        if (!saved || !user) return;
        try {
            const device = JSON.parse(saved);
            api.get("/devices")
                .then((devices) => {
                    if (!Array.isArray(devices)) return;
                    const stillExists = devices.find((d) => d.id === device.id);
                    if (stillExists) {
                        setSelectedDeviceState(stillExists);
                        localStorage.setItem("selectedDevice", JSON.stringify(stillExists));
                    } else {
                        setSelectedDeviceState(null);
                        localStorage.removeItem("selectedDevice");
                    }
                })
                .catch(() => {});
        } catch {
            localStorage.removeItem("selectedDevice");
        }
    }, [user]);

    const addToast = useCallback((message, type = "info") => {
        const id = Date.now();
        setToasts((p) => [...p, {id, message, type}]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    }, []);

    const login = (token, userData) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("selectedDevice");
        setUser(null);
        setSelectedDeviceState(null);
    };

    return (
        <AppCtx.Provider
            value={{
                user,
                login,
                logout,
                toasts,
                addToast,
                selectedDevice,
                setSelectedDevice,
            }}
        >
            {children}
        </AppCtx.Provider>
    );
}

export const useApp = () => useContext(AppCtx);
