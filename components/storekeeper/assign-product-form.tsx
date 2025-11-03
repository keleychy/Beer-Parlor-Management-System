"use client"

import type React from "react"

import { useState } from "react"
import { getUsers, getProducts, addAssignment, updateProduct } from "@/lib/storage"
import type { Assignment } from "@/lib/types"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AssignProductForm() {
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedAttendant, setSelectedAttendant] = useState("")
  const [quantity, setQuantity] = useState("")
  const [assignmentType, setAssignmentType] = useState<"crates" | "bottles">("bottles")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const products = getProducts()
  const users = getUsers().filter((u) => u.role === "attendant")
  const product = products.find((p) => p.id === selectedProduct)
  const attendant = users.find((u) => u.id === selectedAttendant)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedProduct || !selectedAttendant || !quantity) {
      setError("Please fill in all fields")
      return
    }

    const quantityNum = Number.parseInt(quantity)
    if (quantityNum <= 0) {
      setError("Quantity must be greater than 0")
      return
    }

    if (!product || !attendant) {
      setError("Invalid product or attendant")
      return
    }

  // Calculate actual bottles to assign
  const unitsToAssign = assignmentType === "crates" ? quantityNum * product.quantityPerCrate : quantityNum

    // Check if enough stock available
    if (unitsToAssign > product.quantity) {
      setError(`Not enough stock. Available: ${product.quantity} bottles`)
      return
    }

    // Create assignment
    const assignment: Assignment = {
      id: Date.now().toString() + Math.random(),
      productId: product.id,
      productName: product.name,
      attendantId: attendant.id,
      attendantName: attendant.name,
      quantityAssigned: unitsToAssign,
      assignmentType,
      quantityPerCrate: product.quantityPerCrate,
      assignedAt: new Date().toISOString(),
    }

    addAssignment(assignment)

    // Reduce product quantity
    updateProduct(product.id, { quantity: product.quantity - unitsToAssign })

    setSubmitted(true)
    setSelectedProduct("")
    setSelectedAttendant("")
    setQuantity("")
    setAssignmentType("bottles")
    setTimeout(() => setSubmitted(false), 2000)
  }

  const crateEquivalent =
    product && assignmentType === "bottles" ? (Number.parseInt(quantity) / product.quantityPerCrate).toFixed(2) : quantity

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Products to Attendants</CardTitle>
        <CardDescription>Distribute products to attendants in crates or bottles</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-error/10 text-error rounded text-sm">{error}</div>}
          {submitted && (
            <div className="p-3 bg-success/10 text-success rounded text-sm">Product assigned successfully!</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.quantity} bottles available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Attendant Selection */}
            <div className="space-y-2">
              <Label htmlFor="attendant">Attendant</Label>
              <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
                <SelectTrigger id="attendant">
                  <SelectValue placeholder="Select an attendant" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Assign By</Label>
              <Select value={assignmentType} onValueChange={(value) => setAssignmentType(value as "crates" | "bottles")}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="crates">Crates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity ({assignmentType === "crates" ? "crates" : "bottles"})</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          {/* Preview */}
          {product && quantity && (
            <div className="p-4 bg-background rounded border border-border space-y-2">
              <h4 className="font-semibold text-sm">Assignment Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-secondary">Product</p>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <p className="text-secondary">Attendant</p>
                  <p className="font-medium">{attendant?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-secondary">Bottles to Assign</p>
                  <p className="font-medium">
                    {assignmentType === "crates"
                      ? `${quantity} crates = ${Number.parseInt(quantity) * product.quantityPerCrate} bottles`
                      : `${quantity} bottles`}
                  </p>
                </div>
                <div>
                  <p className="text-secondary">Total Value</p>
                  <p className="font-medium">
                    {formatNaira(
                      product.unitPrice *
                        (assignmentType === "crates"
                          ? Number.parseInt(quantity) * product.quantityPerCrate
                          : Number.parseInt(quantity)),
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            Assign Product
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
