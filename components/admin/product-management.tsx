"use client"

import type React from "react"
import { useState } from "react"
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/storage"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/currency"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductManagement({ onProductsChanged }: { onProductsChanged: () => void }) {
  const [products, setProducts] = useState<Product[]>(getProducts())
  const [activeTab, setActiveTab] = useState("list")
  const [editingId, setEditingId] = useState<string | null>(null)
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      reorderLevel: "",
      unitPrice: "",
      quantityPerCrate: "",
    })
    setEditingId(null)
    setError("")
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity.toString(),
      reorderLevel: product.reorderLevel.toString(),
      unitPrice: product.unitPrice.toString(),
      quantityPerCrate: product.quantityPerCrate.toString(),
    })
    setActiveTab("form")
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

    if (editingId) {
      updateProduct(editingId, {
        name: formData.name,
        category: formData.category,
        quantity,
        reorderLevel,
        unitPrice,
        quantityPerCrate,
      })
    } else {
      const newProduct: Product = {
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
    }

    setSubmitted(true)
    setTimeout(() => {
      setProducts(getProducts())
      resetForm()
      setSubmitted(false)
      setActiveTab("list")
      onProductsChanged()
    }, 1500)
  }

  const handleDelete = (id: string) => {
    deleteProduct(id)
    setProducts(getProducts())
    setDeleteConfirm(null)
    onProductsChanged()
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="list">Products List</TabsTrigger>
        <TabsTrigger value="form">{editingId ? "Edit Product" : "Add Product"}</TabsTrigger>
      </TabsList>

      {/* Products List Tab */}
      <TabsContent value="list" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>View, edit, or remove products from inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-secondary text-center py-8">No products found</p>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <div className="text-sm text-secondary space-y-1 mt-1">
                        <p>Category: {product.category}</p>
                        <p>
                          Stock: {product.quantity} bottles ({Math.floor(product.quantity / product.quantityPerCrate)}{" "}
                          crates)
                        </p>
                        <p>Price: {formatNaira(product.unitPrice)} per bottle</p>
                        <p>Reorder Level: {product.reorderLevel} bottles</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="bg-accent/10 hover:bg-accent/20 text-accent border-accent/30"
                      >
                        Edit
                      </Button>
                      {deleteConfirm === product.id ? (
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                            Confirm
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(product.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Add/Edit Form Tab */}
      <TabsContent value="form" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Product" : "Add New Product"}</CardTitle>
            <CardDescription>
              {editingId ? "Update product details" : "Create a new product in the inventory"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-sm">{error}</div>
              )}

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
                  <label className="block text-sm font-medium mb-2">Quantity (Bottles)</label>
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

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitted}>
                  {submitted
                    ? editingId
                      ? "Product Updated!"
                      : "Product Added!"
                    : editingId
                      ? "Update Product"
                      : "Add Product"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
