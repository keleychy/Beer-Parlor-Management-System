"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { updateProduct } from "@/lib/storage"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InventoryManagementProps {
  products: Product[]
}

export default function InventoryManagement({ products }: InventoryManagementProps) {
  const [lowStockProducts, setLowStockProducts] = useState(products.filter((p) => p.quantity <= p.reorderLevel))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Product>>({})
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setEditValues(product)
  }

  const handleSave = (productId: string) => {
    if (editValues.reorderLevel !== undefined) {
      updateProduct(productId, {
        reorderLevel: editValues.reorderLevel,
      })
    }
    setEditingId(null)
    setEditValues({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Current Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>Total: {filteredProducts.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Bottles/Crate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Current Stock (Bottles)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Bottle Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-background transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-secondary">{product.category}</td>
                    <td className="px-6 py-4 text-sm font-medium text-accent">{product.quantityPerCrate}</td>
                    <td className="px-6 py-4 text-sm">
                      {product.quantity}
                      <span className="text-xs text-secondary ml-2">
                        ({Math.floor(product.quantity / product.quantityPerCrate)} crates)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValues.reorderLevel || 0}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              reorderLevel: Number.parseInt(e.target.value),
                            })
                          }
                          className="w-20"
                        />
                      ) : (
                        product.reorderLevel
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{formatNaira(product.unitPrice)}</td>
                    <td className="px-6 py-4 text-sm">
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
                    <td className="px-6 py-4 text-sm">
                      {editingId === product.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSave(product.id)}
                            className="text-xs"
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} className="text-xs bg-transparent">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)} className="text-xs">
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-warning">Low Stock Alert</CardTitle>
            <CardDescription>{lowStockProducts.length} items need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {lowStockProducts.map((product) => (
                <li key={product.id} className="text-sm flex justify-between items-center">
                    <span>
                      <strong>{product.name}</strong> - {product.quantity} bottles (Reorder at {product.reorderLevel})
                      <span className="text-xs text-secondary ml-2">- {product.quantityPerCrate} bottles/crate</span>
                    </span>
                    <span className="text-xs text-secondary">{product.reorderLevel - product.quantity} bottles short</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
