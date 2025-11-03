"use client"

import { useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/types"
import { getUsers, addUser, updateUser, deleteUser, setUserStatus, adminResetPassword } from "@/lib/storage"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { passwordStrength, passwordsMatch } from '@/lib/utils'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]) 
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", role: "attendant" as UserRole, password: "", confirmPassword: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    setUsers(getUsers())
  }, [])

  const refresh = () => setUsers(getUsers())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name || !form.email || !form.role || !form.password) {
      setError("All fields required to create a user")
      return
    }
    setLoading(true)
    try {
      await addUser({ name: form.name, email: form.email, role: form.role, password: form.password })
      setForm({ name: "", email: "", role: "attendant", password: "" })
      refresh()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (u: User) => {
    setEditingId(u.id)
    setForm({ name: u.name, email: u.email, role: u.role as UserRole, password: "" })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    try {
      const updates: Partial<User> = { name: form.name, email: form.email, role: form.role }
      if (form.password) updates.password = form.password
      await updateUser(editingId, updates)
      setEditingId(null)
      setForm({ name: "", email: "", role: "attendant", password: "" })
      refresh()
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({ name: "", email: "", role: "attendant", password: "" })
    setError("")
  }

  const handleDelete = (id: string) => {
    // open confirm dialog instead of using window.confirm
    const u = getUsers().find((x) => x.id === id)
    if (!u) return
    setDeleteTarget(u)
    setDeleteOpen(true)
  }

  const handleSuspend = (id: string) => {
    setUserStatus(id, 'suspended')
    refresh()
  }

  const handleActivate = (id: string) => {
    setUserStatus(id, 'active')
    refresh()
  }

  const handleFreeze = (id: string) => {
    setUserStatus(id, 'frozen')
    refresh()
  }

  // Reset password handling
  const handleResetPassword = (id: string) => {
    const user = getUsers().find((x) => x.id === id)
    if (!user) return
    setResetPasswordTarget(user)
    setResetPasswordOpen(true)
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordTarget || !form.password) return
      try {
      const res = await adminResetPassword(resetPasswordTarget.id, form.password)
      if (!res.success) {
        setError(res.error || 'Failed to reset password')
        return
      }
      // success
      setError("")
      // show success toast
      toast({ title: 'Password reset', description: `Password for ${resetPasswordTarget.email} has been reset.` })
      setResetPasswordOpen(false)
      setResetPasswordTarget(null)
      setForm((s) => ({ ...s, password: "" }))
      refresh()
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteUser(deleteTarget.id)
    refresh()
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-card border border-border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Create user</h3>
        <form onSubmit={editingId ? handleSaveEdit : handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium mb-1">Name</label>
            <input id="user-name" name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium mb-1">Email</label>
            <input id="user-email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium mb-1">Role</label>
            <select id="user-role" name="role" value={form.role} onChange={handleChange} className="w-full px-3 py-2 border rounded">
              <option value="attendant">Attendant</option>
              <option value="storekeeper">Storekeeper</option>
            </select>
          </div>
          <div>
            <label htmlFor="user-password" className="block text-sm font-medium mb-1">Password</label>
            <input id="user-password" name="password" value={form.password} onChange={handleChange} type="password" className="w-full px-3 py-2 border rounded" placeholder={editingId ? "Leave blank to keep" : "Initial password"} />
          </div>

          <div className="sm:col-span-4">
            {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{editingId ? 'Save' : 'Create'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
            </div>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg max-h-[60vh] md:max-h-[50vh] lg:max-h-[65vh] overflow-auto">
  <div className="w-full overflow-x-auto scroll-touch">
          <table className="w-full min-w-[640px] sm:min-w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-semibold">Name</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Role</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Status</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Created</th>
                <th className="px-3 py-2 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-background transition-colors">
                  <td className="px-3 py-2 text-sm">{user.name}</td>
                  <td className="px-3 py-2 text-sm text-secondary">{user.email}</td>
                  <td className="px-3 py-2 text-sm"><span className="px-2 py-1 bg-card border border-border rounded text-xs font-medium capitalize">{user.role}</span></td>
                  <td className="px-3 py-2 text-sm">
                    {(user.status === 'active' || !user.status) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-xs font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-900 border border-yellow-400 rounded text-xs font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                        </svg>
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-secondary">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startEdit(user)}>Edit</Button>
                      {user.status !== 'suspended' && <Button size="sm" variant="outline" onClick={() => handleSuspend(user.id)}>Suspend</Button>}
                      {user.status === 'suspended' && <Button size="sm" variant="outline" onClick={() => handleActivate(user.id)}>Activate</Button>}
                      {user.role !== 'admin' && (
                        <Button size="sm" variant="outline" onClick={() => handleResetPassword(user.id)}>
                          Reset Password
                        </Button>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(user.id)}
                            aria-label="Delete user"
                            className="transform transition duration-150 ease-in-out hover:scale-105"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent sideOffset={4}>Delete user</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* Delete confirmation dialog */}
        
        {/* Reset password dialog */}
        <AlertDialog 
          open={resetPasswordOpen} 
          onOpenChange={(v) => { 
            setResetPasswordOpen(v); 
            if (!v) {
              setResetPasswordTarget(null);
              setForm((s) => ({ ...s, password: "" }));
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Password</AlertDialogTitle>
              <AlertDialogDescription>
                Enter new password for <span className="font-medium text-foreground">{resetPasswordTarget?.email}</span>
              </AlertDialogDescription>
              <div className="mt-2">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded bg-background text-foreground"
                  placeholder="New password"
                />

                <div className="mt-2 flex items-center justify-between gap-4">
                  {/* Strength meter */}
                  <div className="flex-1">
                    {(() => {
                      const { score, label } = passwordStrength(form.password)
                      const pct = Math.min(100, (score / 4) * 100)
                      const color = score >= 3 ? 'bg-green-500' : score === 2 ? 'bg-yellow-400' : 'bg-red-400'
                      return (
                        <>
                          <div className="h-2 w-full rounded bg-muted">
                            <div className={`${color} h-2 rounded`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="text-xs mt-1 text-secondary">{label}</div>
                        </>
                      )
                    })()}
                  </div>
                </div>

                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="mt-2 w-full px-3 py-2 border rounded bg-background text-foreground"
                  placeholder="Confirm password"
                />
                {!passwordsMatch(form.password, form.confirmPassword) && form.confirmPassword && (
                  <div className="text-xs text-red-600 mt-1">Passwords do not match</div>
                )}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmResetPassword}
                disabled={
                  !form.password ||
                  !form.confirmPassword ||
                  !passwordsMatch(form.password, form.confirmPassword) ||
                  passwordStrength(form.password).score < 2
                }
              >
                Reset Password
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={(v) => { setDeleteOpen(v); if (!v) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user</AlertDialogTitle>
              <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.email ?? 'this user'}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
