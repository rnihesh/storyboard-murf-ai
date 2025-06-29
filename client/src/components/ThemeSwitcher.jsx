import { useContext, useEffect } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import { FiMoon, FiSun } from "react-icons/fi";

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Ensure the HTML element has the correct class
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all duration-300 ${
        theme === "light"
          ? "bg-gray-200 hover:bg-gray-300"
          : "bg-gray-800 hover:bg-gray-700 ring-1 ring-gray-700"
      }`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <FiMoon className="w-5 h-5 text-indigo-600" />
      ) : (
        <FiSun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
};

export default ThemeSwitcher;
