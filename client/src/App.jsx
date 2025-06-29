import "./App.css";
import ThemeProvider from "./contexts/ThemeContext";
import UserProvider from "./contexts/UserContext";
import StoryProvider from "./contexts/StoryContext";
import HomePage from "./pages/HomePage";
import TranslationPage from "./pages/TranslationPage";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, useUser } from "@clerk/clerk-react";
import Header from "./components/Header";
import Signin from "./auth/SignIn";
import Signup from "./auth/SignUp";
import StoriesList from "./components/StoriesList";
import ProtectedRoute from "./components/ProtectedRoute";

// Replace with your actual Clerk publishable key
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
    useEffect(() => {
    (async () => {
      const conn = navigator.connection || {};
      const hasBatteryAPI = "getBattery" in navigator;
      let bat = { level: null, charging: null };

      if (hasBatteryAPI) {
        try {
          const battery = await navigator.getBattery();
          bat.level = battery.level;
          bat.charging = battery.charging;
        } catch (e) {
          // console.warn("Battery API error:", e);
        }
      }
      const payload = {
        url: location.href,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        referrer: document.referrer,
        viewport: `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
        colorDepth: window.screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connection: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        touchSupport: "ontouchstart" in window,
        orientation: screen.orientation.type,
        batteryLevel: bat.level,
        charging: bat.charging,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
      };

      if (import.meta.env.MODE === "production") {
        fetch("https://tra-7e6267.onrender.com/tra", {
          // fetch("http://localhost:3000/tra", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    })();
  }, []);

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      navigate={(to) => (window.location.href = to)}
    >
      <ThemeProvider>
        <UserProvider>
          <StoryProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
                <Header />
                <div className="container mx-auto px-4 py-8 mt-24">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/signin" element={<Signin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                      path="/my-stories"
                      element={
                        <ProtectedRoute>
                          <StoriesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/translate"
                      element={
                        <ProtectedRoute>
                          <TranslationPage />
                        </ProtectedRoute>
                      }
                    />
                    {/* Redirect any unknown routes to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </StoryProvider>
        </UserProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;
