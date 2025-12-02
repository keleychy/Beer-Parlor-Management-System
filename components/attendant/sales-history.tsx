"use client"

import type { Sale } from "@/lib/types"
import { formatNaira } from "@/lib/currency"

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { getSales } from '@/lib/storage'

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>(() => getSales())

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const remote = await api.fetchSales()
      if (!mounted) return
      setSales(remote)
    })()
    return () => { mounted = false }
  }, [])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-card border border-border rounded-lg">
          <p className="text-sm text-secondary mb-2">Total Sales</p>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-lg">
          <p className="text-sm text-secondary mb-2">Total Revenue</p>
          <p className="text-2xl font-bold">{formatNaira(totalRevenue)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Sales History</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Quantity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Bottle Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="px-6 py-4 text-sm font-medium">{sale.productName}</td>
                  <td className="px-6 py-4 text-sm">{sale.quantity}</td>
                  <td className="px-6 py-4 text-sm">{formatNaira(sale.unitPrice)}</td>
                  <td className="px-6 py-4 text-sm font-semibold">{formatNaira(sale.totalPrice)}</td>
                  <td className="px-6 py-4 text-sm text-secondary">{new Date(sale.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
