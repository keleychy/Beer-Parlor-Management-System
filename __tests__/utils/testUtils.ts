import { vi } from 'vitest'

// Create test data
export const testProduct = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Beer',
  category: 'Beer',
  quantity: 100,
  reorderLevel: 20,
  unitPrice: 5.99,
  quantityPerCrate: 24,
  lastRestocked: new Date().toISOString()
}

export const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'test@example.com',
  name: 'Test User',
  role: 'attendant' as const,
  created_at: new Date().toISOString()
}

export const testSale = {
  product_id: testProduct.id,
  product_name: testProduct.name,
  quantity: 2,
  unitPrice: testProduct.unitPrice,
  totalPrice: testProduct.unitPrice * 2,
  attendantId: testUser.id,
  attendant_name: testUser.name,
  timestamp: new Date().toISOString()
}

// Add any new test utilities here