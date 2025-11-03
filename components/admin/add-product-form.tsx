"use client"

import type React from "react"
import { useState } from "react"
import { addProduct } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AddProductForm({ onProductAdded }: { onProductAdded: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    reorderLevel: "",
    unitPrice: "",
    quantityPerCrate: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (
      !formData.name ||
      !formData.category ||
      !formData.quantity ||
      !formData.reorderLevel ||
      !formData.unitPrice ||
      !formData.quantityPerCrate
    ) {
      setError("All fields are required")
      return
    }

    const quantity = Number.parseInt(formData.quantity)
    const reorderLevel = Number.parseInt(formData.reorderLevel)
    const unitPrice = Number.parseFloat(formData.unitPrice)
    const quantityPerCrate = Number.parseInt(formData.quantityPerCrate)

    if (quantity < 0 || reorderLevel < 0 || unitPrice < 0 || quantityPerCrate <= 0) {
      setError("Values cannot be negative, and quantity per crate must be greater than 0")
      return
    }

    const newProduct = {
      id: Date.now().toString(),
      name: formData.name,
      category: formData.category,
      quantity,
      reorderLevel,
      unitPrice,
      quantityPerCrate,
      lastRestocked: new Date().toISOString(),
    }

    addProduct(newProduct)

    setSubmitted(true)
    setTimeout(() => {
      setFormData({
        name: "",
        category: "",
        quantity: "",
        reorderLevel: "",
        unitPrice: "",
        quantityPerCrate: "",
      })
      setSubmitted(false)
      onProductAdded()
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Create a new product in the inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          {error && <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-2">Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g., Budweiser"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a category</option>
              <option value="Beer">Beer</option>
              <option value="Soft Drink">Soft Drink</option>
              <option value="Wine">Wine</option>
              <option value="Spirits">Spirits</option>
              <option value="Snacks">Snacks</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Quantity (Bottles)</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity Per Crate</label>
              <input
                type="number"
                name="quantityPerCrate"
                value={formData.quantityPerCrate}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="e.g., 12 or 24"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reorder Level</label>
              <input
                type="number"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bottle Price (₦)</label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="0.00"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitted}>
            {submitted ? "Product Added!" : "Add Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
