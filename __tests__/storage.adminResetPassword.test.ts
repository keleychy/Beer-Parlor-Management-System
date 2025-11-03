import { describe, it, expect, beforeEach } from 'vitest'
import { addUser, getUsers, setCurrentUser, adminResetPassword, getCurrentUser } from '@/lib/storage'

// Clean localStorage between tests
beforeEach(() => {
  localStorage.clear()
})

describe('adminResetPassword', () => {
  it('should prevent non-admins from resetting passwords', async () => {
    // create a non-admin user and a target user
    await addUser({ name: 'Attendant', email: 'att@example.com', role: 'attendant', password: 'attend123' })
    await addUser({ name: 'Target', email: 'target@example.com', role: 'attendant', password: 'target123' })

    const users = getUsers()
    const nonAdmin = users.find(u => u.email === 'att@example.com')!
    const target = users.find(u => u.email === 'target@example.com')!

    // set current user to non-admin
    setCurrentUser(nonAdmin)

    const res = await adminResetPassword(target.id, 'newpass123')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Only admins/i)
  })

  it('should not allow admin to reset another admin password', async () => {
    // create two admins
    await addUser({ name: 'Admin1', email: 'a1@example.com', role: 'admin', password: 'admin123' })
    await addUser({ name: 'Admin2', email: 'a2@example.com', role: 'admin', password: 'admin123' })

    const users = getUsers()
    const admin1 = users.find(u => u.email === 'a1@example.com')!
    const admin2 = users.find(u => u.email === 'a2@example.com')!

    setCurrentUser(admin1)

    const res = await adminResetPassword(admin2.id, 'newpass123')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/Cannot reset another admin/i)
  })

  it('should allow admin to reset attendant password', async () => {
    await addUser({ name: 'Admin', email: 'admin@example.com', role: 'admin', password: 'admin123' })
    await addUser({ name: 'Attendant', email: 'att@example.com', role: 'attendant', password: 'attend123' })

    const users = getUsers()
    const admin = users.find(u => u.email === 'admin@example.com')!
    const attendant = users.find(u => u.email === 'att@example.com')!

    setCurrentUser(admin)

    const res = await adminResetPassword(attendant.id, 'newstrongpass')
    expect(res.success).toBe(true)

    // confirm password was changed (hashed value should exist and not match raw)
    const updated = getUsers().find(u => u.id === attendant.id)!
    expect(updated.password).toBeTruthy()
    expect(updated.password).not.toBe('newstrongpass')
  })
})
