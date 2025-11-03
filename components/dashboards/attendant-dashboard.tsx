"use client"

import { useEffect, useState } from "react"
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
  const [activeTab, setActiveTab] = useState("pos")
  const user = getCurrentUser()
  const userId = user?.id

  useEffect(() => {
    setProducts(getProducts())
    setSales(getSales())
    if (userId) {
      setAssignments(getAssignmentsByAttendant(userId))
    }
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
              {assignments.length === 0 ? (
                <p className="text-center text-secondary py-8">No products assigned yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border border-border rounded-lg">
                      <h4 className="font-semibold mb-2">{assignment.productName}</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-secondary">
                          Quantity: {assignment.quantityAssigned} bottles
                          {assignment.assignmentType === "crates" &&
                            ` (${(assignment.quantityAssigned / (assignment.quantityPerCrate || 1)).toFixed(0)} crates)`}
                        </p>
                        <p className="text-secondary">
                          Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
