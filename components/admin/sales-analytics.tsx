"use client"

import type { Sale, Product } from "@/lib/types"
import { formatNaira, formatNairaShort } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface SalesAnalyticsProps {
  sales: Sale[]
  products: Product[]
}

export default function SalesAnalytics({ sales, products }: SalesAnalyticsProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)
  const avgSaleValue = sales.length > 0 ? totalRevenue / sales.length : 0

  // Top selling products
  const productSales = products
    .map((product) => {
      const productSalesData = sales.filter((s) => s.productId === product.id)
      return {
        name: product.name,
        quantity: productSalesData.reduce((sum, s) => sum + s.quantity, 0),
        revenue: productSalesData.reduce((sum, s) => sum + s.totalPrice, 0),
      }
    })
    .filter((p) => p.quantity > 0)
    .sort((a, b) => b.revenue - a.revenue)

  // Sales by category
  const categorySales = products
    .reduce(
      (acc, product) => {
        const productSalesData = sales.filter((s) => s.productId === product.id)
        const revenue = productSalesData.reduce((sum, s) => sum + s.totalPrice, 0)
        const existing = acc.find((c) => c.name === product.category)
        if (existing) {
          existing.value += revenue
        } else {
          acc.push({ name: product.category, value: revenue })
        }
        return acc
      },
      [] as Array<{ name: string; value: number }>,
    )
    .sort((a, b) => b.value - a.value)

  // Sales by attendant
  const attendantSales = sales.reduce(
    (acc, sale) => {
      const existing = acc.find((a) => a.name === sale.attendantName)
      if (existing) {
        existing.sales += 1
        existing.revenue += sale.totalPrice
      } else {
        acc.push({ name: sale.attendantName, sales: 1, revenue: sale.totalPrice })
      }
      return acc
    },
    [] as Array<{ name: string; sales: number; revenue: number }>,
  )

  // Daily sales trend (last 7 days)
  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const daySales = sales.filter((s) => new Date(s.timestamp).toLocaleDateString() === date.toLocaleDateString())
    return {
      date: dateStr,
      revenue: daySales.reduce((sum, s) => sum + s.totalPrice, 0),
      transactions: daySales.length,
    }
  })

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(totalRevenue)}</div>
            <p className="text-xs text-secondary mt-1">From {sales.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-secondary mt-1">Completed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-secondary">Average Sale Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNaira(avgSaleValue)}</div>
            <p className="text-xs text-secondary mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (7 Days)</CardTitle>
            <CardDescription>Daily revenue and transaction count</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue (₦)" />
                <Line type="monotone" dataKey="transactions" stroke="#10b981" name="Transactions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatNairaShort(value as number)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categorySales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNaira(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>By revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productSales.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-35}
                textAnchor="end"
                height={60}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₦)" />
              <Bar dataKey="quantity" fill="#10b981" name="Quantity Sold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attendant Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Attendant Performance</CardTitle>
          <CardDescription>Sales and revenue by attendant</CardDescription>
        </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] sm:min-w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Attendant</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Transactions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Avg Sale</th>
                </tr>
              </thead>
              <tbody>
                {attendantSales.map((attendant, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-background transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{attendant.name}</td>
                    <td className="px-6 py-4 text-sm">{attendant.sales}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{formatNaira(attendant.revenue)}</td>
                    <td className="px-6 py-4 text-sm">{formatNaira(attendant.revenue / attendant.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest 10 transactions</CardDescription>
        </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] sm:min-w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Attendant</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .slice(-10)
                  .reverse()
                  .map((sale, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-background transition-colors">
                      <td className="px-6 py-4 text-sm">{sale.productName}</td>
                      <td className="px-6 py-4 text-sm">{sale.quantity}</td>
                      <td className="px-6 py-4 text-sm">{formatNaira(sale.totalPrice)}</td>
                      <td className="px-6 py-4 text-sm text-secondary">{sale.attendantName}</td>
                      <td className="px-6 py-4 text-sm text-secondary">
                        {new Date(sale.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
