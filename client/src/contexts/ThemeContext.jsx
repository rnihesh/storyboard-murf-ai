import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Check if user has previously set theme
  const [theme, setTheme] = useState(() => {
    // Force dark mode by default
    localStorage.setItem("theme", "dark");
    return "dark";
  });

  // Update theme and save to localStorage
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  // Apply theme to document on change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // For Tailwind dark mode to work properly
    if (theme === "dark") {
      document.body.style.backgroundColor = "#111827"; // dark gray-900
    } else {
      document.body.style.backgroundColor = "#f9fafb"; // light gray-50
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
