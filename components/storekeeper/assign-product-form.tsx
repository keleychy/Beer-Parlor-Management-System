"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getUsers, getProducts } from "@/lib/storage"
import api from '@/lib/api'
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

  const [products, setProducts] = useState(() => getProducts())
  const [users, setUsers] = useState(() => getUsers().filter((u) => u.role === "attendant"))
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

  const assignAllToAttendant = async (e: React.FormEvent) => {
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
    const prodMap = await api.fetchProducts().catch(() => getProducts())
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

    // Perform assignments (remote-first, fall back to local storage)
    const newAssignments: Assignment[] = [];
    for (const item of assignmentCart) {
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
      // Try to add assignment remotely, fallback handled inside api
      await api.addAssignmentRemote(assignment)
      // Update product quantity remotely, fallback handled inside api
      await api.updateProductRemote(item.productId, { quantity: ( (await api.fetchProducts().catch(() => getProducts())).find((p:any)=>p.id===item.productId)?.quantity || 0) - units })
      newAssignments.push(assignment)
    }

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

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const remote = await api.fetchProducts().catch(() => getProducts())
      const attendants = await api.fetchAttendants().catch(() => getUsers().filter((u) => u.role === 'attendant'))
      if (!mounted) return
      setProducts(remote)
      setUsers(attendants)
    })()
    return () => { mounted = false }
  }, [])

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
                // XP80 receipt printer format: monospaced, narrow, text-only
                const printWindow = window.open('', '', 'width=384,height=600');
                if (printWindow) {
                  const pad = (str: string, len: number) => (str.length > len ? str.slice(0, len) : str.padEnd(len, ' '));
                  const now = new Date();
                  const dateStr = now.getDate().toString().padStart(2, '0') + '/' + (now.getMonth()+1).toString().padStart(2, '0') + '/' + now.getFullYear();
                  const timeStr = now.toLocaleTimeString();

                  // Build rows and totals
                  const rows: string[] = [];
                  let totalBottles = 0;
                  let totalAmount = 0;
                  lastAssignments.forEach(a => {
                    const qtyLabel = a.assignmentType === 'crates'
                      ? (a.quantityAssigned / (a.quantityPerCrate || 1)).toFixed(0) + ' CRT'
                      : a.quantityAssigned + ' BTL';
                    const prod = pad(a.productName, 18);
                    const att = pad(a.attendantName, 14);
                    const dt = new Date(a.assignedAt);
                    const d = dt.getDate().toString().padStart(2, '0') + '/' + (dt.getMonth()+1).toString().padStart(2, '0') + '/' + dt.getFullYear();
                    rows.push(prod + '| ' + att + '| ' + pad(qtyLabel, 7) + '| ' + d);
                    totalBottles += a.quantityAssigned || 0;
                    const prodInfo = products.find(p => p.id === a.productId);
                    const unitPrice = prodInfo ? prodInfo.unitPrice : 0;
                    totalAmount += (a.quantityAssigned || 0) * unitPrice;
                  });

                  const totalCrates = lastAssignments.reduce((s, a) => s + ((a.quantityPerCrate && a.quantityPerCrate > 0) ? a.quantityAssigned / a.quantityPerCrate : 0), 0);

                  // Build HTML receipt with monospaced formatting but allowing bold via <strong>
                  const colHeader = pad('PRODUCT', 18) + '| ' + pad('ATTENDANT', 14) + '| ' + pad('QTY', 7) + '| DATE';
                  const width = 50; // total characters to fit inside the box
                  const divider = '='.repeat(width);
                  const centerText = (text: string) => {
                    const padding = Math.max(0, Math.floor((width - text.length) / 2));
                    return ' '.repeat(padding) + text + ' '.repeat(Math.max(0, width - padding - text.length));
                  };
                  let receiptHtml = '';
                  receiptHtml += '<strong>' + centerText('DISTINGUISH BAR & GRILLS') + '</strong>\n';
                  receiptHtml += '<strong>' + centerText('ASSIGNMENT RECEIPT') + '</strong>\n';
                  receiptHtml += divider + '\n';
                  receiptHtml += `DATE: ${dateStr}  TIME: ${timeStr}\n`;
                  receiptHtml += divider + '\n';
                  receiptHtml += colHeader + '\n';
                  receiptHtml += divider + '\n';
                  receiptHtml += rows.join('\n') + '\n';
                  receiptHtml += divider + '\n';
                  receiptHtml += `<strong>TOTAL PRODUCTS: ${totalBottles} BTL</strong>\n`;
                  receiptHtml += `<strong>TOTAL AMOUNT: ${formatNaira(totalAmount)}</strong>\n`;
                  receiptHtml += divider + '\n';
                  receiptHtml += centerText('Thank you!') + '\n\n';

                  printWindow.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>body{font-family:monospace;font-size:12px;width:384px;margin:0;padding:6px;} .box{border:4px solid #000;padding:6px;box-sizing:border-box;border-radius:0;margin:0 auto;width:100%;} .content{white-space:pre;font-family:monospace;} strong{font-weight:bold;}</style></head><body><div class="box"><div class="content">${receiptHtml}</div></div></body></html>`);
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
