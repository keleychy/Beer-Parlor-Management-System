"use client"

import type { Product } from "@/lib/types"
import { formatNaira } from "@/lib/currency"

interface InventoryOverviewProps {
  products: Product[]
}

export default function InventoryOverview({ products }: InventoryOverviewProps) {
  const lowStockProducts = products.filter((p) => p.quantity <= p.reorderLevel)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">All Products</h3>
        <div className="bg-card border border-border rounded-lg max-h-[60vh] md:max-h-[50vh] overflow-auto">
          <div className="w-full overflow-x-auto scroll-touch">
            <table className="w-full min-w-[640px] sm:min-w-full">
              <thead className="bg-background border-b border-border ">
                <tr>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Reorder Level</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Unit Price</th>
                  <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-background transition-colors">
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm font-medium">{product.name}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm text-secondary">{product.category}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm">{product.quantity}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm">{product.reorderLevel}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm">{formatNaira(product.unitPrice)}</td>
                    <td className="px-3 py-2 sm:px-6 sm:py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.quantity <= product.reorderLevel
                            ? "bg-error/10 text-error"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {product.quantity <= product.reorderLevel ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-warning">Low Stock Alert</h3>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-sm text-warning mb-3">The following items need restocking:</p>
            <ul className="space-y-2">
              {lowStockProducts.map((product) => (
                <li key={product.id} className="text-sm">
                  <span className="font-medium">{product.name}</span> - {product.quantity} units (Reorder at{" "}
                  {product.reorderLevel})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
