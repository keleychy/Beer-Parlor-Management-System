"use client"

import type React from "react"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { updateProduct, addInventoryLog, getCurrentUser } from "@/lib/storage"
import api from '@/lib/api'

interface RestockFormProps {
  products: Product[]
}

export default function RestockForm({ products }: RestockFormProps) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("restock")
  const [submitted, setSubmitted] = useState(false)
  const user = getCurrentUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const newQuantity = product.quantity + Number.parseInt(quantity)
    await api.updateProductRemote(selectedProduct, { quantity: newQuantity })

    if (user) {
      addInventoryLog({
        id: Date.now().toString(),
        productId: selectedProduct,
        productName: product.name,
        quantityIn: Number.parseInt(quantity),
        quantityOut: 0,
        reason,
        timestamp: new Date().toISOString(),
        userId: user.id,
      })
    }

    setSubmitted(true)
    setTimeout(() => {
      setSelectedProduct("")
      setQuantity("")
      setReason("restock")
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Restock Inventory</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Current: {product.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity to Add</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="restock">Restock</option>
              <option value="return">Return</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            {submitted ? "Restocked!" : "Restock"}
          </button>
        </form>
      </div>
    </div>
  )
}
