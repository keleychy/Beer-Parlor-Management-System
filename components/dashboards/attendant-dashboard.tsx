"use client"

import { useEffect, useState } from "react"
import api from '@/lib/api'
import { getProducts, getSales, getCurrentUser, getAssignmentsByAttendant } from "@/lib/storage"
import type { Product, Sale, Assignment } from "@/lib/types"
import POSSystem from "@/components/attendant/pos-system"
import SalesHistory from "@/components/attendant/sales-history"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOutIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useRouter } from "next/navigation"

export default function AttendantDashboard() {
  const router = useRouter()
  // Responsive logout handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session")
    }
    router.push("/")
  }
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [period, setPeriod] = useState<string>("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [activeTab, setActiveTab] = useState("pos")
  const user = getCurrentUser()
  const userId = user?.id

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const remoteProducts = await api.fetchProducts().catch(() => getProducts())
      const remoteSales = await api.fetchSales().catch(() => getSales())
      const remoteAssignments = await api.fetchAssignments().catch(() => (userId ? getAssignmentsByAttendant(userId) : []))
      if (!mounted) return
      setProducts(remoteProducts)
      setSales(remoteSales)
      if (userId) setAssignments(remoteAssignments.filter((a:any) => a.attendantId === userId))
    })()
    return () => { mounted = false }
  }, [userId])

  const userSales = sales.filter((s) => s.attendantId === user?.id)
  const userRevenue = userSales.reduce((sum, sale) => sum + sale.totalPrice, 0)

  const assignedProductIds = assignments.map((a) => a.productId)
  const assignedProducts = products.filter((p) => assignedProductIds.includes(p.id))

  const availableProducts = assignedProducts.length

  return (
    <div className="p-8 space-y-8 relative">
      {/* Responsive Logout Button: visible only on small/medium screens, with tooltip and animation */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleLogout}
            className="fixed top-4 right-4 z-50 flex items-center justify-center rounded-full bg-card shadow-lg border border-border p-2 text-destructive hover:bg-destructive hover:text-card transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 active:scale-95 animate-logout-btn"
            aria-label="Logout"
          >
            <LogOutIcon className="size-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Logout</TooltipContent>
      </Tooltip>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Attendant Dashboard</h1>
        <p className="text-secondary">Process sales and view your performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Your Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userSales.length}</div>
            <p className="text-xs text-secondary mt-1">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Your Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(userRevenue)}</div>
            <p className="text-xs text-secondary mt-1">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Assigned Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableProducts}</div>
            <p className="text-xs text-secondary mt-1">Products assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNaira(userSales.length > 0 ? userRevenue / userSales.length : 0)}
            </div>
            <p className="text-xs text-secondary mt-1">Average sale value</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pos">POS System</TabsTrigger>
          <TabsTrigger value="assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="history">Sales History</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-6">
          <POSSystem products={assignedProducts} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Assigned Products</CardTitle>
              <CardDescription>Products assigned to you by the storekeeper</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-secondary">Range:</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-2 py-1 border rounded"
                    title="Select period"
                    aria-label="Select period"
                  >
                    <option value="all">All</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>

                  {period === "custom" && (
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="px-2 py-1 border rounded"
                        title="Start date"
                        aria-label="Start date"
                      />
                      <span className="text-sm">to</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="px-2 py-1 border rounded"
                        title="End date"
                        aria-label="End date"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border rounded"
                    onClick={() => {
                      setPeriod("all")
                      setCustomStart("")
                      setCustomEnd("")
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Filter and sort assignments based on selected range */}
              {(() => {
                const now = new Date()
                let start: Date | null = null
                let end: Date | null = null
                if (period === "daily") {
                  start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                  end = new Date(start)
                  end.setDate(end.getDate() + 1)
                } else if (period === "weekly") {
                  start = new Date(now)
                  start.setDate(start.getDate() - 7)
                  end = new Date(now)
                } else if (period === "monthly") {
                  start = new Date(now)
                  start.setDate(start.getDate() - 30)
                  end = new Date(now)
                } else if (period === "custom" && customStart && customEnd) {
                  start = new Date(customStart)
                  end = new Date(customEnd)
                  // include whole end day
                  end.setDate(end.getDate() + 1)
                }

                const filtered = assignments
                  .filter((a) => {
                    if (!start || !end) return true
                    const d = new Date(a.assignedAt)
                    return d >= start && d < end
                  })
                  .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())

                return filtered.length === 0 ? (
                  <p className="text-center text-secondary py-8">
                    {assignments.length > 0 ? "No assignments match the selected filters" : "No products assigned yet"}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((assignment) => (
                      <div key={assignment.id} className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold mb-2">{assignment.productName}</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-secondary">
                            Quantity: {assignment.quantityAssigned} bottles
                            {assignment.assignmentType === "crates" &&
                              ` (${(assignment.quantityAssigned / (assignment.quantityPerCrate || 1)).toFixed(0)} crates)`}
                          </p>
                          <p className="text-secondary">Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Sales History</CardTitle>
              <CardDescription>View all your completed transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesHistory sales={userSales} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
