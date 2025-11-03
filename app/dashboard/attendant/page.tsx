"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/storage"
import AttendantDashboard from "@/components/dashboards/attendant-dashboard"

export default function AttendantPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user?.role !== "attendant" && user?.role !== "admin") {
      router.push("/")
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) return null

  return <AttendantDashboard />
}
