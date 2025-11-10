"use client"

import { useState, useEffect } from "react"
import type { Product, Sale, User } from "@/lib/types"
import { addSale, updateProduct, getCurrentUser, getSavedCartsForUser, saveCartForUser, deleteCartForUser, getProducts, getDraftCartForUser, saveDraftCartForUser, deleteDraftCartForUser } from "@/lib/storage"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from '@/hooks/use-toast'
import { formatNaira } from "@/lib/currency"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { DownloadIcon, Trash2Icon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface POSSystemProps {
  products: Product[]
}

export default function POSSystem({ products }: POSSystemProps) {
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([])
  const [savedCarts, setSavedCarts] = useState<Array<any>>([])
  const [currentCartId, setCurrentCartId] = useState<string | null>(null)
  const [saveName, setSaveName] = useState<string>("")
  const [submitted, setSubmitted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const { toast } = useToast()

  const categories = Array.from(new Set(products.map((p) => p.category)))
  const filteredProducts = products
    .filter((p) => p.quantity > 0)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((p) => categoryFilter === "all" || p.category === categoryFilter)

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
    }
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.product.unitPrice * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // load saved carts for the current user
  useEffect(() => {
    // Initialize user and load saved carts/draft on mount or when user changes
    if (typeof window === 'undefined') return
    const current = getCurrentUser()
    setUser(current)
    if (current && current.id) {
      setSavedCarts(getSavedCartsForUser(current.id))
      // load draft if available
      const draft = getDraftCartForUser(current.id)
      if (draft && Array.isArray(draft.items) && draft.items.length > 0) {
        const mapped = draft.items
          .map((it: any) => {
            const p = products.find((pp) => pp.id === it.productId)
            if (!p) return null
            return { product: p, quantity: it.quantity }
          })
          .filter(Boolean)
        setCart(mapped as any)
        if (draft.currentCartId) setCurrentCartId(draft.currentCartId)
      }
    }
    // We intentionally only want this to run on mount (and when products change if needed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCheckout = () => {
    if (cart.length === 0 || !user) return

    // Final stock validation: re-read products and ensure sufficient stock
    const latest = getProducts()
    const problems: string[] = []
    cart.forEach((item) => {
      const p = latest.find((x) => x.id === item.product.id)
      if (!p) {
        problems.push(`${item.product.name} is no longer available`)
      } else if (p.quantity < item.quantity) {
        problems.push(`${item.product.name} has only ${p.quantity} left (requested ${item.quantity})`)
      }
    })
    if (problems.length > 0) {
      toast({ title: 'Checkout blocked', description: problems.join('; ') })
      return
    }

    cart.forEach((item) => {
      const newQuantity = item.product.quantity - item.quantity
      updateProduct(item.product.id, { quantity: newQuantity })

      const sale: Sale = {
        id: Date.now().toString() + Math.random(),
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.unitPrice,
        totalPrice: item.product.unitPrice * item.quantity,
        attendantId: user.id,
        attendantName: user.name,
        timestamp: new Date().toISOString(),
      }
      addSale(sale)
    })

    setSubmitted(true)
    setCart([])
    setTimeout(() => setSubmitted(false), 2000)
    // if we checked out a saved cart, remove it
    if (user && currentCartId) {
      deleteCartForUser(user.id, currentCartId)
      setSavedCarts(getSavedCartsForUser(user.id))
      setCurrentCartId(null)
    }
    // remove draft after successful checkout
    if (user) deleteDraftCartForUser(user.id)
  }

  const saveCurrentCart = () => {
    if (!user) return
    if (cart.length === 0) return
    const id = Date.now().toString() + Math.random()
    const payload = {
      id,
      name: saveName || `Cart ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
    }
    saveCartForUser(user.id, payload)
    setSavedCarts(getSavedCartsForUser(user.id))
    setCurrentCartId(id)
    setSaveName("")
    // also remove any existing draft since user explicitly saved
    if (user) deleteDraftCartForUser(user.id)
  }

  const loadSavedCart = (id: string) => {
    if (!user) return
    const list = getSavedCartsForUser(user.id)
    const found = list.find((c: any) => c.id === id)
    if (!found) return
    // map saved items to product objects
    const loaded = found.items
      .map((it: any) => {
        const p = products.find((pp) => pp.id === it.productId)
        if (!p) return null
        return { product: p, quantity: it.quantity }
      })
      .filter(Boolean)
    setCart(loaded as any)
    setCurrentCartId(id)
  }

  const removeSavedCart = (id: string) => {
    if (!user) return
    deleteCartForUser(user.id, id)
    setSavedCarts(getSavedCartsForUser(user.id))
    if (currentCartId === id) {
      setCurrentCartId(null)
      setCart([])
    }
  }

  // use debounced autosave for drafts
  const saveDraft = useDebounce((userId: string, draft: any) => {
    saveDraftCartForUser(userId, draft)
  }, 800) // 800ms delay

  // autosave draft on cart change
  useEffect(() => {
    if (!user || !user.id) return
    const draft = {
      items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      currentCartId,
      updatedAt: new Date().toISOString(),
    }
    saveDraft(user.id, draft)
  }, [cart, currentCartId, user, saveDraft])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>Select items to add to cart</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved carts quick access (also shown here for visibility while selecting products) */}
            {user && savedCarts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {savedCarts.map((sc: any) => (
                  <div
                    key={sc.id}
                    className="shrink-0 bg-background border border-border rounded px-3 py-2 flex items-center gap-3 min-w-[220px]"
                    role="group"
                    aria-label={`Saved cart ${sc.name}`}
                  >
                    <div className="text-sm min-w-0 flex-1">
                      <div className="font-medium truncate leading-tight">{sc.name}</div>
                      <div className="text-xs text-secondary truncate">{sc.items.length} items</div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Button size="icon" variant="outline" aria-label="Load cart" onClick={() => loadSavedCart(sc.id)}>
                        <DownloadIcon className="size-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label="Delete cart">
                            <Trash2Icon className="size-4 text-error" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete saved cart?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this saved cart. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => removeSavedCart(sc.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Search and Filter */}
            <div className="space-y-3">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("all")}
                >
                  All
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-card border border-border rounded-lg hover:border-primary transition-colors"
                >
                  <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                  <p className="text-xs text-secondary mb-2">{product.category}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg">{formatNaira(product.unitPrice)}</span>
                    <span className="text-xs text-secondary">Stock: {product.quantity} bottles</span>
                  </div>
                  <Button onClick={() => addToCart(product)} size="sm" className="w-full">
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-secondary">No products available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div>
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>Shopping Cart</CardTitle>
            <CardDescription>{itemCount} items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Saved carts controls (persisted per-user) */}
            {user && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Save name (optional)"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveCurrentCart} size="sm" disabled={cart.length === 0}>
                    Save
                  </Button>
                </div>

                {savedCarts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-secondary">Saved carts</div>
                    <div className="flex flex-col gap-2">
                      {savedCarts.map((sc: any) => (
                        <div key={sc.id} className="flex items-center justify-between bg-background border border-border rounded px-3 py-2 gap-3">
                          <div className="text-sm min-w-0 flex-1">
                            <div className="font-medium truncate leading-tight">{sc.name}</div>
                            <div className="text-xs text-secondary truncate">{new Date(sc.createdAt).toLocaleString()} · {sc.items.length} items</div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Button size="icon" variant="outline" aria-label="Load cart" onClick={() => loadSavedCart(sc.id)}>
                              <DownloadIcon className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" aria-label="Delete cart">
                                  <Trash2Icon className="size-4 text-error" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete saved cart?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this saved cart. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction variant="destructive" onClick={() => removeSavedCart(sc.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {cart.length === 0 ? (
              <p className="text-sm text-secondary text-center py-8">Cart is empty</p>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-3 bg-background rounded border border-border space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-secondary">{formatNaira(item.product.unitPrice)} per bottle</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-error hover:text-error h-auto p-0 text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, Number.parseInt(e.target.value) || 0)}
                          className="h-8 w-12 text-center text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <p className="text-sm font-semibold text-right">
                        {formatNaira(item.product.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatNaira(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatNaira(totalAmount)}</span>
                  </div>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="lg"
                          variant="ghost"
                          className="flex-1"
                          disabled={cart.length === 0}
                        >
                          Clear Cart
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear cart?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove all items from your cart. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => {
                            setCart([])
                            if (user) deleteDraftCartForUser(user.id)
                            setCurrentCartId(null)
                          }}>
                            Clear
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      onClick={handleCheckout}
                      size="lg"
                      className="flex-1 bg-success hover:bg-success/90 text-primary-foreground"
                    >
                      {submitted ? "Completed!" : "Checkout"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
