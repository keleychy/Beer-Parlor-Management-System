"use client"

import { useEffect, useState } from "react"
import api from '@/lib/api'
import { getProducts, getInventory } from "@/lib/storage"
import type { Product, Inventory } from "@/lib/types"
import InventoryManagement from "@/components/storekeeper/inventory-management"
import CrateRestockForm from "@/components/storekeeper/crate-restock-form"
import RestockForm from "@/components/storekeeper/restock-form" // Import RestockForm
import AssignProductForm from "@/components/storekeeper/assign-product-form"
import AssignmentHistory from "@/components/storekeeper/assignment-history"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOutIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useRouter } from "next/navigation"

export default function StorekeeperDashboard() {
  const router = useRouter()
  // Responsive logout handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session")
    }
    router.push("/")
  }
  const [products, setProducts] = useState<Product[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [activeTab, setActiveTab] = useState("inventory")

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const remoteProducts = await api.fetchProducts().catch(() => getProducts())
      if (!mounted) return
      setProducts(remoteProducts)
      setInventory(getInventory())
    })()
    return () => { mounted = false }
  }, [])

  const lowStockCount = products.filter((p) => p.quantity <= p.reorderLevel).length
  const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
  const averageStockLevel = products.length > 0 ? products.reduce((sum, p) => sum + p.quantity, 0) / products.length : 0

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
        <h1 className="text-4xl font-bold mb-2">Storekeeper Dashboard</h1>
        <p className="text-secondary">Manage inventory and restocking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-secondary mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-secondary mt-1">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(totalInventoryValue)}</div>
            <p className="text-xs text-secondary mt-1">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Avg Stock Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageStockLevel)}</div>
            <p className="text-xs text-secondary mt-1">Units per product</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="crate-restock">Restock by Crates</TabsTrigger>
          <TabsTrigger value="restock">Manual Restock</TabsTrigger>
          <TabsTrigger value="assign">Assign to Attendants</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Inventory</CardTitle>
              <CardDescription>Monitor all products and stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryManagement products={products} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crate-restock" className="mt-6">
          <CrateRestockForm products={products} />
        </TabsContent>

        <TabsContent value="restock" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Manual Restock</CardTitle>
              <CardDescription>Add bottles manually (for adjustments)</CardDescription>
            </CardHeader>
            <CardContent>
              <RestockForm products={products} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign" className="mt-6 space-y-6">
          <AssignProductForm />
          <AssignmentHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
