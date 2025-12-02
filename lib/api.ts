import supabase from './supabase'
import * as storage from './storage'
import type { Assignment, User } from './types'

function dbAssignmentToApp(r: any): Assignment {
  return {
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    attendantId: r.attendant_id,
    attendantName: r.attendant_name,
    quantityAssigned: r.quantity_assigned,
    assignmentType: r.assignment_type,
    quantityPerCrate: r.quantity_per_crate,
    assignedAt: r.assigned_at
  }
}

export async function fetchAssignments(): Promise<Assignment[]> {
  if (typeof window === 'undefined') return storage.getAssignments()
  try {
    const { data, error } = await supabase.from('assignments').select('*')
    if (error || !data) throw error || new Error('No data')
    return data.map(dbAssignmentToApp)
  } catch (err) {
    // fallback to localStorage
    return storage.getAssignments()
  }
}

export async function addAssignmentRemote(a: Assignment): Promise<boolean> {
  try {
    const row = {
      id: a.id,
      product_id: a.productId,
      product_name: a.productName,
      attendant_id: a.attendantId,
      attendant_name: a.attendantName,
      quantity_assigned: a.quantityAssigned,
      assignment_type: a.assignmentType,
      quantity_per_crate: a.quantityPerCrate,
      assigned_at: a.assignedAt
    }
    const { error } = await supabase.from('assignments').insert([row])
    if (error) throw error
    return true
  } catch (err) {
    const storageModule = await import('./storage')
    storageModule.addAssignment(a)
    return false
  }
}

export async function removeAssignmentRemote(id: string): Promise<boolean> {
  if (typeof window === 'undefined') { storage.removeAssignment(id); return true }
  try {
    const { error } = await supabase.from('assignments').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    // fallback: remove locally
    storage.removeAssignment(id)
    return false
  }
}

export async function fetchAttendants(): Promise<User[]> {
  if (typeof window === 'undefined') return storage.getUsers().filter(u => u.role === 'attendant')
  try {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'attendant')
    if (error || !data) throw error || new Error('No data')
    return data.map((u: any) => ({ id: u.id, email: u.email, name: u.name, role: u.role, password: u.password || '', createdAt: u.created_at, status: u.status || 'active' }))
  } catch (err) {
    return storage.getUsers().filter(u => u.role === 'attendant')
  }
}

// Products
export async function fetchProducts(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('products').select('*')
    if (error || !data) throw error || new Error('No data')
    return data
  } catch (err) {
    // fallback to local storage
    const storageModule = await import('./storage')
    return storageModule.getProducts()
  }
}

export async function updateProductRemote(id: string, updates: Record<string, any>): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').update(updates).eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    // fallback: update local storage
    const storageModule = await import('./storage')
    storageModule.updateProduct(id, updates as any)
    return false
  }
}

export async function addSaleRemote(sale: any): Promise<boolean> {
  try {
    const { error } = await supabase.from('sales').insert([{
      id: sale.id,
      product_id: sale.productId,
      product_name: sale.productName,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      total_price: sale.totalPrice,
      attendant_id: sale.attendantId,
      attendant_name: sale.attendantName,
      created_at: sale.timestamp
    }])
    if (error) throw error
    return true
  } catch (err) {
    const storageModule = await import('./storage')
    storageModule.addSale(sale)
    return false
  }
}

// Products CRUD
export async function addProductRemote(p: any): Promise<boolean> {
  try {
    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      reorder_level: p.reorderLevel ?? p.reorder_level,
      unit_price: p.unitPrice ?? p.unit_price,
      quantity_per_crate: p.quantityPerCrate ?? p.quantity_per_crate,
      last_restocked: p.lastRestocked ?? p.last_restocked,
    }
    const { error } = await supabase.from('products').insert([row])
    if (error) throw error
    return true
  } catch (err) {
    const storageModule = await import('./storage')
    storageModule.addProduct(p)
    return false
  }
}

export async function deleteProductRemote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    return true
  } catch (err) {
    const storageModule = await import('./storage')
    storageModule.deleteProduct(id)
    return false
  }
}

export async function fetchSales(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('sales').select('*')
    if (error || !data) throw error || new Error('No data')
    return data
  } catch (err) {
    const storageModule = await import('./storage')
    return storageModule.getSales()
  }
}

export default {
  fetchAssignments,
  removeAssignmentRemote,
  fetchAttendants
  , fetchProducts, updateProductRemote, addSaleRemote, addProductRemote, deleteProductRemote, fetchSales
  , addAssignmentRemote
}
