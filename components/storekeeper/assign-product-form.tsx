"use client"

import type React from "react"

import { useState } from "react"
import { getUsers, getProducts, addAssignment, updateProduct } from "@/lib/storage"
import { useToast } from '@/hooks/use-toast'
import type { Assignment } from "@/lib/types"
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
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
  const [assignmentCart, setAssignmentCart] = useState<Array<{ productId: string; productName: string; quantity: number; assignmentType: "crates" | "bottles"; quantityPerCrate?: number }>>([])
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [lastAssignments, setLastAssignments] = useState<Assignment[]>([])
  const { toast } = useToast()

  const products = getProducts()
  const users = getUsers().filter((u) => u.role === "attendant")
  const product = products.find((p) => p.id === selectedProduct)
  const attendant = users.find((u) => u.id === selectedAttendant)

  // Add current selection to the assignment cart
  const addToAssignmentCart = (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")

    if (!selectedProduct || !quantity) {
      setError("Please select a product and enter quantity before adding to cart")
      return
    }

    const quantityNum = Number.parseInt(quantity)
    if (quantityNum <= 0) {
      setError("Quantity must be greater than 0")
      return
    }

    if (!product) {
      setError("Invalid product")
      return
    }

    const unitsToAssign = assignmentType === "crates" ? quantityNum * product.quantityPerCrate : quantityNum

    if (unitsToAssign > product.quantity) {
      setError(`Not enough stock. Available: ${product.quantity} bottles`)
      return
    }

    setAssignmentCart((c) => [
      ...c,
      {
        productId: product.id,
        productName: product.name,
        quantity: quantityNum,
        assignmentType,
        quantityPerCrate: product.quantityPerCrate,
      },
    ])

    // reset selection for next item
    setSelectedProduct("")
    setQuantity("")
    setAssignmentType("bottles")
  }

  const removeFromAssignmentCart = (index: number) => {
    setAssignmentCart((c) => c.filter((_, i) => i !== index))
  }

  const updateCartItemQuantity = (index: number, q: number) => {
    setAssignmentCart((c) => c.map((it, i) => (i === index ? { ...it, quantity: q } : it)))
  }

  const assignAllToAttendant = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedAttendant) {
      setError("Please select an attendant to assign to")
      return
    }

    const attendantUser = users.find((u) => u.id === selectedAttendant)
    if (!attendantUser) {
      setError("Invalid attendant selected")
      return
    }

    if (assignmentCart.length === 0) {
      setError("No items in the assignment cart")
      return
    }

    // Final validation: check stock for all items
    const prodMap = getProducts()
    for (const item of assignmentCart) {
      const prod = prodMap.find((p) => p.id === item.productId)
      if (!prod) {
        setError(`Product ${item.productName} no longer available`)
        return
      }
      const units = item.assignmentType === 'crates' ? item.quantity * (item.quantityPerCrate || 1) : item.quantity
      if (units > prod.quantity) {
        setError(`${item.productName} has only ${prod.quantity} bottles left (requested ${units})`)
        return
      }
    }

    // Perform assignments
    const newAssignments: Assignment[] = [];
    assignmentCart.forEach((item) => {
      const units = item.assignmentType === 'crates' ? item.quantity * (item.quantityPerCrate || 1) : item.quantity
      const assignment: Assignment = {
        id: Date.now().toString() + Math.random(),
        productId: item.productId,
        productName: item.productName,
        attendantId: attendantUser.id,
        attendantName: attendantUser.name,
        quantityAssigned: units,
        assignmentType: item.assignmentType,
        quantityPerCrate: item.quantityPerCrate,
        assignedAt: new Date().toISOString(),
      }
      addAssignment(assignment)
      updateProduct(item.productId, { quantity: (getProducts().find((p) => p.id === item.productId)?.quantity || 0) - units })
      newAssignments.push(assignment)
    })

    setLastAssignments(newAssignments)
    setShowPrintDialog(true)
    setSubmitted(true)
    setAssignmentCart([])
    setSelectedAttendant("")
    toast({ title: 'Assignments created', description: 'Products assigned to attendant successfully' })
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
  <form onSubmit={addToAssignmentCart} className="space-y-6">
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

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add to Assignment Cart
            </Button>
            <Button onClick={addToAssignmentCart} variant="outline" className="flex-1">
              Add & Continue
            </Button>
          </div>
        </form>

        {/* Assignment Cart */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Assignment Cart</h4>
          {assignmentCart.length === 0 ? (
            <div className="text-sm text-secondary">No items in cart. Add items above to batch assign.</div>
          ) : (
            <div className="space-y-3">
              {assignmentCart.map((it, idx) => (
                <div key={`${it.productId}-${idx}`} className="p-3 bg-background rounded border border-border flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{it.productName}</div>
                    <div className="text-xs text-secondary">{it.assignmentType} · {it.quantity} {it.assignmentType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={it.quantity} onChange={(e) => updateCartItemQuantity(idx, Number.parseInt(e.target.value) || 0)} className="w-20" />
                    <Button size="sm" variant="ghost" onClick={() => removeFromAssignmentCart(idx)}>Remove</Button>
                  </div>
                </div>
              ))}

              <form onSubmit={assignAllToAttendant} className="flex gap-2">
                <Select value={selectedAttendant} onValueChange={setSelectedAttendant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select attendant" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" className="flex-1">Assign All to Attendant</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!assignmentCart.length) return
                    if (!confirm('Clear assignment cart? This will remove all items.')) return
                    setAssignmentCart([])
                  }}
                >
                  Clear Cart
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Print Dialog */}
        <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Print Assigned Products?</AlertDialogTitle>
              <AlertDialogDescription>
                Would you like to print the list of products just assigned to the attendant(s)?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowPrintDialog(false)}>No</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowPrintDialog(false);
                // Open a new window for printing with just the assignment list
                const printWindow = window.open('', '', 'height=400,width=600');
                if (printWindow) {
                  const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Assigned Products</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { text-align: center; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background-color: #f4f4f4; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                        .summary { margin-top: 20px; font-size: 14px; }
                        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
                      </style>
                    </head>
                    <body>
                      <h1>Assignment Report</h1>
                      <p>Date: ${new Date().toLocaleString()}</p>
                      <table>
                        <thead>
                          <tr>
                            <th>Product Name</th>
                            <th>Attendant</th>
                            <th>Quantity</th>
                            <th>Assigned At</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${lastAssignments.map((a) => `
                            <tr>
                              <td>${a.productName}</td>
                              <td>${a.attendantName}</td>
                              <td>${a.assignmentType === 'crates' ? (a.quantityAssigned / (a.quantityPerCrate || 1)).toFixed(0) + ' crates' : a.quantityAssigned + ' bottles'}</td>
                              <td>${new Date(a.assignedAt).toLocaleString()}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      <div class="summary">
                        <p><strong>Total Items Assigned:</strong> ${lastAssignments.length}</p>
                      </div>
                      <div class="footer">
                        <p>This report was generated by Beer Parlor Management System</p>
                      </div>
                    </body>
                    </html>
                  `;
                  printWindow.document.write(html);
                  printWindow.document.close();
                  setTimeout(() => printWindow.print(), 250);
                }
              }}>Yes, Print</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
