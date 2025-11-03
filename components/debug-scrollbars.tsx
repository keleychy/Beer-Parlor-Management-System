"use client"

import { useEffect } from "react"

/**
 * Small development helper that applies the `.debug-scrollbars` class to the
 * documentElement (html) when running in development or when the URL has
 * ?debugScrollbars=1. This makes scrollbars visible on small-screen simulators
 * for debugging scrolling behavior. The class is removed on cleanup.
 */
export default function DebugScrollbars() {
  useEffect(() => {
    try {
      const enabledViaUrl = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debugScrollbars") === "1"
      const isDev = process.env.NODE_ENV === "development"
      if (isDev || enabledViaUrl) {
        document.documentElement.classList.add("debug-scrollbars")
        return () => document.documentElement.classList.remove("debug-scrollbars")
      }
    } catch (e) {
      // No-op — don't block the app in rare environments.
    }
    return () => {}
  }, [])

  return null
}
