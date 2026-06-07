import React, {createContext, useContext, useState, useEffect} from "react";

const ThemeContext = createContext({
    theme: "dark",
    toggleTheme: () => {},
});

export function ThemeProvider({children}) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem("mikhmon_theme");
        return saved || "dark";
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("mikhmon_theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return <ThemeContext.Provider value={{theme, toggleTheme}}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeContext;
