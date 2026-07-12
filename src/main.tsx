import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Intercept fetch to support iframe environments where third-party session cookies are blocked
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, "fetch", {
    value: async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const savedUser = localStorage.getItem("trackifyUser");
      let userId = "";
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          userId = parsed.id;
        } catch (e) {}
      }

      if (userId) {
        const customInit = init || {};
        const headers = customInit.headers || {};
        
        if (headers instanceof Headers) {
          headers.set("x-user-id", userId);
          customInit.headers = headers;
        } else if (Array.isArray(headers)) {
          headers.push(["x-user-id", userId]);
          customInit.headers = headers;
        } else {
          const recordHeaders = headers as Record<string, string>;
          recordHeaders["x-user-id"] = userId;
          customInit.headers = recordHeaders;
        }
        init = customInit;
      }

      return originalFetch(input, init);
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Failed to safely intercept window.fetch:", e);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for offline PWA functionality
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[Service Worker] Registered successfully scope:", registration.scope);
      })
      .catch((error) => {
        console.error("[Service Worker] Registration failed:", error);
      });
  });
}

