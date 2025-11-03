import type { User, Product, Sale, Inventory, Assignment } from "./types"
import bcrypt from "bcryptjs"

const STORAGE_KEYS = {
  USERS: "beer_parlor_users",
  PRODUCTS: "beer_parlor_products",
  SALES: "beer_parlor_sales",
  INVENTORY: "beer_parlor_inventory",
  CURRENT_USER: "beer_parlor_current_user",
  ASSIGNMENTS: "beer_parlor_assignments",
  LOGIN_ATTEMPTS: "beer_parlor_login_attempts",
  SESSION: "beer_parlor_session",
  ACTIVITY_LOG: "beer_parlor_activity_log",
  PASSWORD_HISTORY: "beer_parlor_password_history"
}

// Password utility functions
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }
  try {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

export async function verifyPassword(password: string, hashedPassword: string | undefined): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(password, hashedPassword);
}

// Security utility functions
interface LoginAttempt {
  email: string;
  timestamp: number;
  successful: boolean;
}

interface Session {
  userId: string;
  token: string;
  expiresAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

interface ActivityLog {
  timestamp: number;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

interface PasswordHistory {
  userId: string;
  password: string;
  changedAt: number;
}

function getLoginAttempts(email: string): LoginAttempt[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS) || "[]") as LoginAttempt[];
  // Only return attempts from the last 30 minutes
  const recentAttempts = attempts.filter(a => a.email === email && now - a.timestamp < 30 * 60 * 1000);
  return recentAttempts;
}

function recordLoginAttempt(email: string, successful: boolean) {
  if (typeof window === "undefined") return;
  const attempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS) || "[]") as LoginAttempt[];
  attempts.push({
    email,
    timestamp: Date.now(),
    successful
  });
  // Only keep the last 100 attempts
  if (attempts.length > 100) {
    attempts.shift();
  }
  localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
}

  // NOTE: Migration moved into initializeStorage to ensure it runs during app startup

async function createSession(userId: string): Promise<Session> {
  // Get IP address from a service (fallback to local if not available)
  let ipAddress = "local";
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    ipAddress = data.ip;
  } catch (error) {
    console.warn("Could not fetch IP address:", error);
  }

  const session: Session = {
    userId,
    token: crypto.randomUUID(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    lastActivity: Date.now(),
    ipAddress,
    userAgent: navigator.userAgent
  };
  
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  
  // Log session creation
  logActivity(userId, "SESSION_CREATE", `New session created from ${ipAddress}`);
  
  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const session = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!session) return null;
  
  const parsedSession = JSON.parse(session) as Session;
  
  // Check if session is expired
  if (Date.now() > parsedSession.expiresAt) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return null;
  }
  
  // Update last activity
  parsedSession.lastActivity = Date.now();
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(parsedSession));
  
  return parsedSession;
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Activity logging
export function logActivity(userId: string, action: string, details: string) {
  if (typeof window === "undefined") return;
  
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || "[]") as ActivityLog[];
  
  // Get IP address from session to maintain consistency
  const session = getSession();
  
  const log: ActivityLog = {
    timestamp: Date.now(),
    userId,
    action,
    details,
    ipAddress: session?.ipAddress || "unknown",
    userAgent: session?.userAgent || navigator.userAgent
  };
  
  logs.push(log);
  
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.shift();
  }
  
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(logs));
}

export function getActivityLogs(userId?: string): ActivityLog[] {
  if (typeof window === "undefined") return [];
  const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG) || "[]") as ActivityLog[];
  return userId ? logs.filter(log => log.userId === userId) : logs;
}

// Password management
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return { success: false, error: "User not found" };
  }
  
  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" };
  }
  
  // Check password history to prevent reuse
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORD_HISTORY) || "[]") as PasswordHistory[];
  const userHistory = history.filter(h => h.userId === userId);
  
  // Check last 5 passwords
  for (const entry of userHistory.slice(-5)) {
    const isReused = await verifyPassword(newPassword, entry.password);
    if (isReused) {
      return { success: false, error: "New password cannot be the same as any of your last 5 passwords" };
    }
  }
  
  // Hash new password
  const hashedPassword = await hashPassword(newPassword);
  
  // Update user password
  user.password = hashedPassword;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Add to password history
  history.push({
    userId,
    password: hashedPassword,
    changedAt: Date.now()
  });
  localStorage.setItem(STORAGE_KEYS.PASSWORD_HISTORY, JSON.stringify(history));
  
  // Log the activity
  logActivity(userId, "PASSWORD_CHANGE", "Password changed successfully");
  
  // Clear all sessions for this user
  clearSession();
  
  return { success: true };
}

// Initialize default data
export async function initializeStorage() {
  // Ensure existing users have a status field; migrate if missing
  try {
    const existingUsers = getUsers();
    let migrated = false;
    const migratedUsers = existingUsers.map(u => {
      if (!u.status) {
        migrated = true;
        return { ...u, status: 'active' };
      }
      return u;
    });
    if (migrated) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
      // Log migration for changed users
      migratedUsers.forEach(u => {
        if (u.status === 'active') logActivity(u.id, 'USER_MIGRATION', 'Status set to active by migration');
      });
    }
  } catch (err) {
    console.warn('User migration failed', err);
  }

 
  // Initialize users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    try {
      // Hash the default passwords
      const adminHash = await hashPassword("admin123");
      const storekeeperHash = await hashPassword("store123");
      const attendantHash = await hashPassword("attend123");
      
      const defaultUsers: User[] = [
        {
          id: "1",
          name: "Admin User",
          email: "admin@distinguishbarsgrills.com",
          role: "admin",
          password: adminHash,
          createdAt: new Date().toISOString()
        },
        {
          id: "2",
          name: "Store Keeper",
          email: "storekeeper@distinguishbarsgrills.com",
          role: "storekeeper",
          password: storekeeperHash,
          createdAt: new Date().toISOString()
        },
        {
          id: "3",
          name: "Attendant",
          email: "attendant@distinguishbarsgrills.com",
          role: "attendant",
          password: attendantHash,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    } catch (error) {
      console.error("Error initializing users:", error);
      throw error;
    }
  }

  // Initialize products
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const defaultProducts: Product[] = [
      {
        id: "1",
        name: "Heineken",
        category: "Beer",
        quantity: 300,
        reorderLevel: 24,
        unitPrice: 1200,
        quantityPerCrate: 12,
        lastRestocked: new Date().toISOString(),
      },
      {
        id: "6",
        name: "Heineken (small)",
        category: "Beer",
        quantity: 1200,
        reorderLevel: 24,
        unitPrice: 1000,
        quantityPerCrate: 24,
        lastRestocked: new Date().toISOString(),
      },
      {
        id: "7",
        name: "Life",
        category: "Beer",
        quantity: 300,
        reorderLevel: 24,
        unitPrice: 1000,
        quantityPerCrate: 12,
        lastRestocked: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Tiger",
        category: "Beer",
        quantity: 240,
        reorderLevel: 24,
        unitPrice: 1000,
        quantityPerCrate: 24,
        lastRestocked: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Guinness (medium stout)",
        category: "Beer",
        quantity: 80,
        reorderLevel: 30,
        unitPrice: 1000,
        quantityPerCrate: 12,
        lastRestocked: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Pepsi",
        category: "Soft Drink",
        quantity: 200,
        reorderLevel: 60,
        unitPrice: 500,
        quantityPerCrate: 24,
        lastRestocked: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts))
  }

  // Initialize sales
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]))
  }

  // Initialize inventory
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]))
  }

  // Initialize assignments
  if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify([]))
  }
}

// User operations
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  return data ? JSON.parse(data) : []
}

export function getUserById(id: string): User | null {
  const users = getUsers()
  return users.find((u) => u.id === id) || null
}

// User management
export async function addUser(user: Partial<User> & { password: string }) {
  if (typeof window === "undefined") return
  const users = getUsers()
  // Basic validation
  if (!user.email || !user.name || !user.role || !user.password) {
    throw new Error("Missing required user fields")
  }

  // Ensure unique email
  if (users.some((u) => u.email === user.email)) {
    throw new Error("A user with that email already exists")
  }

  const hashed = await hashPassword(user.password)

  const newUser: User = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: user.name,
    email: user.email,
    role: user.role as User['role'],
    password: hashed,
    createdAt: new Date().toISOString(),
    status: 'active' // Always set status
  }

  users.push(newUser)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  logActivity(newUser.id, 'USER_CREATE', `User ${newUser.email} created`)
}

export async function updateUser(id: string, updates: Partial<User>) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return

  // If password is being updated, hash it
  if (updates.password) {
    // @ts-ignore - allow passing raw password
    updates.password = await hashPassword(updates.password as string)
  }

  // Always set status to existing or 'active' if missing
  users[idx] = { ...users[idx], ...updates, status: updates.status || users[idx].status || 'active' }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  logActivity(id, 'USER_UPDATE', `User ${users[idx].email} updated`)
}

/**
 * Allow admins to reset passwords for attendants and storekeepers.
 * Validations:
 * - Only a user with role 'admin' (current user) can perform this action.
 * - Cannot reset another admin's password.
 * - Enforces minimal password length.
 */
export async function adminResetPassword(targetId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Not available" }

  const current = getCurrentUser()
  if (!current || current.role !== 'admin') {
    return { success: false, error: 'Only admins can reset passwords' }
  }

  const users = getUsers()
  const idx = users.findIndex(u => u.id === targetId)
  if (idx === -1) return { success: false, error: 'Target user not found' }

  if (users[idx].role === 'admin') {
    return { success: false, error: 'Cannot reset another admin password' }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long' }
  }

  try {
    const hashed = await hashPassword(newPassword)
    users[idx].password = hashed
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

    // Add to password history
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORD_HISTORY) || "[]") as PasswordHistory[]
    history.push({ userId: targetId, password: hashed, changedAt: Date.now() })
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HISTORY, JSON.stringify(history))

    // Log admin action
    logActivity(current.id, 'ADMIN_RESET_PASSWORD', `Admin ${current.email} reset password for ${users[idx].email}`)

    // If the target user had an active session, clear it
    const session = getSession()
    if (session?.userId === targetId) {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) }
  }
}

export function deleteUser(id: string) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const filtered = users.filter(u => u.id !== id)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered))
  logActivity(id, 'USER_DELETE', `User ${id} deleted`)
}

export function setUserStatus(id: string, status: 'active' | 'suspended' | 'frozen') {
  if (typeof window === "undefined") return
  const users = getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return
  users[idx].status = status
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  logActivity(id, 'USER_STATUS_CHANGE', `User ${users[idx].email} status set to ${status}`)
}

export async function authenticateUser(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  const users = getUsers()
  const user = users.find(u => u.email === email)
  
  // Check login attempts
  const recentAttempts = getLoginAttempts(email);
  const failedAttempts = recentAttempts.filter(a => !a.successful).length;
  
  if (failedAttempts >= 5) {
    const lastAttempt = recentAttempts[recentAttempts.length - 1];
    const timeLeft = Math.ceil((30 * 60 * 1000 - (Date.now() - lastAttempt.timestamp)) / 60000);
    return { 
      user: null, 
      error: `Too many failed attempts. Please try again in ${timeLeft} minutes.` 
    };
  }
  
  if (!user) {
    recordLoginAttempt(email, false);
    return { user: null, error: "Invalid email or password" };
  }

  // Block login for suspended users
  if (user.status === 'suspended') {
    return { user: null, error: "This account has been suspended. Please contact the administrator." };
  }

  // Check if user has a password set
  if (!user.password) {
    // Set up initial password
    try {
      const hashedPassword = await hashPassword(password);
      const usersList = getUsers();
      const userIndex = usersList.findIndex(u => u.id === user.id);
      usersList[userIndex] = { ...user, password: hashedPassword };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));

      // Create session and record successful attempt
      const updatedUser = usersList[userIndex];
      await createSession(updatedUser.id);
      recordLoginAttempt(email, true);

      const { password: _, ...userWithoutPassword } = updatedUser;
      return { user: userWithoutPassword as User };
    } catch (error) {
      return { user: null, error: "Error setting up initial password" };
    }
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    recordLoginAttempt(email, false);
    return { user: null, error: "Invalid email or password" };
  }

  // Successful login
  recordLoginAttempt(email, true);
  
  // Create new session
  await createSession(user.id);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User };
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user: User | null) {
  if (typeof window === "undefined") return
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  }
}

// Product operations
export function getProducts(): Product[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
  return data ? JSON.parse(data) : []
}

export function addProduct(product: Product) {
  if (typeof window === "undefined") return
  const products = getProducts()
  products.push(product)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
}

export function updateProduct(id: string, updates: Partial<Product>) {
  if (typeof window === "undefined") return
  const products = getProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  }
}

export function deleteProduct(id: string) {
  if (typeof window === "undefined") return
  const products = getProducts()
  const filtered = products.filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered))
}

// Sales operations
export function getSales(): Sale[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.SALES)
  return data ? JSON.parse(data) : []
}

export function addSale(sale: Sale) {
  if (typeof window === "undefined") return
  const sales = getSales()
  sales.push(sale)
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales))
}

// Inventory operations
export function getInventory(): Inventory[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.INVENTORY)
  return data ? JSON.parse(data) : []
}

export function addInventoryLog(log: Inventory) {
  if (typeof window === "undefined") return
  const inventory = getInventory()
  inventory.push(log)
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory))
}

export function getAssignments(): Assignment[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)
  return data ? JSON.parse(data) : []
}

export function getAssignmentsByAttendant(attendantId: string): Assignment[] {
  const assignments = getAssignments()
  return assignments.filter((a) => a.attendantId === attendantId)
}

export function addAssignment(assignment: Assignment) {
  if (typeof window === "undefined") return
  const assignments = getAssignments()
  assignments.push(assignment)
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments))
}

export function removeAssignment(id: string) {
  if (typeof window === "undefined") return
  const assignments = getAssignments()
  const filtered = assignments.filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(filtered))
}

export function updateAssignment(id: string, updates: Partial<Assignment>) {
  if (typeof window === "undefined") return
  const assignments = getAssignments()
  const index = assignments.findIndex((a) => a.id === id)
  if (index !== -1) {
    assignments[index] = { ...assignments[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments))
  }
}

// Saved carts (per-user) - persisted in localStorage under key `saved_carts:<userId>`
export function getSavedCartsForUser(userId: string) {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(`saved_carts:${userId}`)
  return data ? JSON.parse(data) : []
}

export function saveCartForUser(userId: string, cart: any) {
  if (typeof window === "undefined") return
  const carts = getSavedCartsForUser(userId)
  const next = carts.filter((c: any) => c.id !== cart.id).concat(cart)
  localStorage.setItem(`saved_carts:${userId}`, JSON.stringify(next))
}

export function deleteCartForUser(userId: string, cartId: string) {
  if (typeof window === "undefined") return
  const carts = getSavedCartsForUser(userId).filter((c: any) => c.id !== cartId)
  localStorage.setItem(`saved_carts:${userId}`, JSON.stringify(carts))
}

// Draft cart (autosave) per-user under key `cart_draft:<userId>`
export function getDraftCartForUser(userId: string) {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem(`cart_draft:${userId}`)
  return data ? JSON.parse(data) : null
}

export function saveDraftCartForUser(userId: string, draft: any) {
  if (typeof window === "undefined") return
  localStorage.setItem(`cart_draft:${userId}`, JSON.stringify(draft))
}

export function deleteDraftCartForUser(userId: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(`cart_draft:${userId}`)
}
