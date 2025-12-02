"use client"

import type React from "react"
import { useState } from "react"
import type { Product } from "@/lib/types"
import { updateProduct, addInventoryLog, getCurrentUser } from "@/lib/storage"
import api from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CrateRestockFormProps {
  products: Product[]
}

export default function CrateRestockForm({ products }: CrateRestockFormProps) {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [crateQuantity, setCrateQuantity] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const user = getCurrentUser()

  const selectedProd = products.find((p) => p.id === selectedProduct)
  const unitsToAdd = selectedProd ? Number.parseInt(crateQuantity || "0") * selectedProd.quantityPerCrate : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedProduct || !crateQuantity) {
      setError("Please select a product and enter crate quantity")
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) {
      setError("Product not found")
      return
    }

    const crates = Number.parseInt(crateQuantity)
    if (crates <= 0) {
      setError("Crate quantity must be greater than 0")
      return
    }

    const totalUnits = crates * product.quantityPerCrate
    const newQuantity = product.quantity + totalUnits

    await api.updateProductRemote(selectedProduct, { quantity: newQuantity })

    if (user) {
      addInventoryLog({
        id: Date.now().toString(),
        productId: selectedProduct,
        productName: product.name,
        quantityIn: totalUnits,
        quantityOut: 0,
        reason: `Restock - ${crates} crate(s) (${totalUnits} bottles)`,
        timestamp: new Date().toISOString(),
        userId: user.id,
      })
    }

    setSubmitted(true)
    setTimeout(() => {
      setSelectedProduct("")
      setCrateQuantity("")
      setSubmitted(false)
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restock by Crates</CardTitle>
        <CardDescription>Add inventory by purchasing crates from vendors</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          {error && <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">{error}</div>}
          {submitted && (
            <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800 text-sm">
              Restocked successfully!
            </div>
          )}

          <div>
            <label htmlFor="product-select" className="block text-sm font-medium mb-2">Product</label>
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.quantityPerCrate} bottles/crate (Current: {product.quantity} bottles)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="crate-quantity" className="block text-sm font-medium mb-2">Number of Crates</label>
            <input
              id="crate-quantity"
              type="number"
              value={crateQuantity}
              onChange={(e) => setCrateQuantity(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter number of crates"
            />
          </div>

          {selectedProd && crateQuantity && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{crateQuantity}</strong> crate(s) × <strong>{selectedProd.quantityPerCrate}</strong> bottles/crate
                = <strong>{unitsToAdd}</strong> total bottles
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                New inventory: <strong>{selectedProd.quantity}</strong> + <strong>{unitsToAdd}</strong> ={" "}
                <strong>{selectedProd.quantity + unitsToAdd}</strong> bottles
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitted}>
            {submitted ? "Restocked!" : "Confirm Restock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
