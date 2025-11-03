"use client"

import { useEffect, useState } from "react"
import { getProducts, getUsers, getSales, getInventory } from "@/lib/storage"
import type { Product, User, Sale, Inventory } from "@/lib/types"
import UserManagement from "@/components/admin/user-management"
import InventoryOverview from "@/components/admin/inventory-overview"
import SalesAnalytics from "@/components/admin/sales-analytics"
import ProductManagement from "@/components/admin/product-management"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomeIcon, BoxIcon, UsersIcon, ArchiveIcon, BarChart2Icon, LogOutIcon } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()
  // Responsive logout handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session")
    }
    router.push("/")
  }
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    setProducts(getProducts())
    setUsers(getUsers())
    setSales(getSales())
    setInventory(getInventory())
  }, [])

  const handleProductAdded = () => {
    setProducts(getProducts())
  }

  const handleProductsChanged = () => {
    setProducts(getProducts())
  }

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  const totalSales = sales.length
  const lowStockProducts = products.filter((p) => p.quantity <= p.reorderLevel)
  const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)

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
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-secondary">Manage inventory, users, and view analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="text-xl md:text-2xl font-bold wrap-break-word">{formatNaira(totalRevenue)}</div>
            <p className="text-xs text-secondary mt-1">From {totalSales} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="text-xl md:text-2xl font-bold wrap-break-word">{totalSales}</div>
            <p className="text-xs text-secondary mt-1">Completed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="text-xl md:text-2xl font-bold wrap-break-word">{formatNaira(totalInventoryValue)}</div>
            <p className="text-xs text-secondary mt-1">{products.length} products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="text-xl md:text-2xl font-bold text-warning wrap-break-word">{lowStockProducts.length}</div>
            <p className="text-xs text-secondary mt-1">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
        {/* Responsive tabs: wrap into multiple rows on very small screens, centered at all breakpoints; icon-only up to md, labels visible at lg+ */}
        <TabsList className="flex flex-wrap gap-2 overflow-x-auto scroll-touch mx-auto max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl md:grid md:grid-cols-5 md:gap-0 md:overflow-visible">
            <TabsTrigger className="flex-none md:flex-1 text-xs lg:text-sm" value="overview" aria-label="Overview">
              <HomeIcon className="size-4" />
              <span className="ml-2 hidden lg:inline">Overview</span>
            </TabsTrigger>

            <TabsTrigger className="flex-none md:flex-1 text-xs lg:text-sm" value="add-product" aria-label="Products">
              <BoxIcon className="size-4" />
              <span className="ml-2 hidden lg:inline">Products</span>
            </TabsTrigger>

            <TabsTrigger className="flex-none md:flex-1 text-xs lg:text-sm" value="users" aria-label="Users">
              <UsersIcon className="size-4" />
              <span className="ml-2 hidden lg:inline">Users</span>
            </TabsTrigger>

            <TabsTrigger className="flex-none md:flex-1 text-xs lg:text-sm" value="inventory" aria-label="Inventory">
              <ArchiveIcon className="size-4" />
              <span className="ml-2 hidden lg:inline">Inventory</span>
            </TabsTrigger>

            <TabsTrigger className="flex-none md:flex-1 text-xs lg:text-sm" value="analytics" aria-label="Analytics">
              <BarChart2Icon className="size-4" />
              <span className="ml-2 hidden lg:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="mt-6">
          <InventoryOverview products={products} />
        </TabsContent>

        <TabsContent value="add-product" className="mt-6">
          <ProductManagement onProductsChanged={handleProductsChanged} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Monitor stock levels and product details</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryOverview products={products} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <SalesAnalytics sales={sales} products={products} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
