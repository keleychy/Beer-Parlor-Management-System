export type UserRole = 'admin' | 'storekeeper' | 'attendant'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  password: string // hashed password
  createdAt: string
  status?: 'active' | 'suspended' | 'frozen'
}

export interface Product {
  id: string
  name: string
  category: string
  quantity: number
  reorderLevel: number
  unitPrice: number
  quantityPerCrate: number
  lastRestocked: string
}

export interface Sale {
  id?: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  attendantId: string
  attendantName: string
  timestamp: string
}

export interface Inventory {
  id?: string
  productId: string
  productName: string
  quantityIn: number
  quantityOut: number
  reason: string
  timestamp: string
  userId: string
}

export type AssignmentType = 'crates' | 'bottles'

export interface Assignment {
  id?: string
  productId: string
  productName: string
  attendantId: string
  attendantName: string
  quantityAssigned: number
  assignmentType: AssignmentType
  quantityPerCrate?: number
  assignedAt: string
}

export interface SavedCartItem {
  productId: string
  quantity: number
}

export interface SavedCart {
  id: string
  name: string
  createdAt: string
  items: SavedCartItem[]
}


export interface HealthCheck {
  id: number
  status: string
  checkedAt: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        // Note: DB columns use snake_case; application types use camelCase
        Insert: any
        Update: any
      }
      products: {
        Row: Product
        Insert: any
        Update: any
      }
      sales: {
        Row: Sale
        Insert: any
        Update: never // Sales shouldn't be updated
      }
      inventory: {
        Row: Inventory
        Insert: any
        Update: never // Inventory records shouldn't be updated
      }
      assignments: {
        Row: Assignment
        Insert: any
        Update: never // Assignments shouldn't be updated
      }
      health_check: {
        Row: HealthCheck
        Insert: any
        Update: any
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
    }
  }
}
