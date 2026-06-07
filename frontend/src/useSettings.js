import {useState, useEffect, useCallback} from "react";
import api from "./api.js";

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export function useSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            const s = localStorage.getItem("hotspot_settings");
            return s ? JSON.parse(s) : {};
        } catch {
            return {};
        }
    });

    const refresh = useCallback(async () => {
        try {
            const data = await api.get("/settings");
            if (data && Object.keys(data).length > 0) {
                cache = data;
                cacheTime = Date.now();
                localStorage.setItem("hotspot_settings", JSON.stringify(data));
                setSettings(data);
            }
        } catch (e) {
            console.error("[useSettings] fetch error:", e);
        }
    }, []);

    useEffect(() => {
        if (cache && Date.now() - cacheTime < CACHE_TTL) {
            setSettings(cache);
            return;
        }
        refresh();

        const onStorage = (e) => {
            if (e.key === "hotspot_settings" && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    cache = parsed;
                    setSettings(parsed);
                } catch {}
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [refresh]);

    return {...settings, refresh};
}
