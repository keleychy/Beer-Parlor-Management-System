"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/storage"
import AdminDashboard from "@/components/dashboards/admin-dashboard"


export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user?.role !== "admin") {
      router.push("/")
    } else {
      setAuthorized(true)
    }
  }, [router])

  if (!authorized) return null
  

  return <AdminDashboard />
}
