"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/storage"
import StorekeeperDashboard from "@/components/dashboards/storekeeper-dashboard"

export default function StorekeeperPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user?.role !== "storekeeper" && user?.role !== "admin") {
      router.push("/")
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) return null

  return <StorekeeperDashboard />
}
