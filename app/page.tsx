"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { setCurrentUser, initializeStorage, authenticateUser } from "@/lib/storage"
import type { User } from "@/lib/types"

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showDemoAccounts, setShowDemoAccounts] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Initialize storage with demo data if needed
        await initializeStorage();
        
        // Get users from localStorage
        const storedUsers = localStorage.getItem('beer_parlor_users');
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        }
          // Check for remembered email
          const rememberedEmail = localStorage.getItem('rememberedEmail');
          if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
          }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      }
      setLoading(false);
    };
    loadUsers();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setErrorMessage(null)
      setIsAuthenticating(true)

      const { user: authenticatedUser, error } = await authenticateUser(email, password)

      if (error) {
        setErrorMessage(error)
        setIsAuthenticating(false)
        return
      }

      if (!authenticatedUser) {
        setErrorMessage("Authentication failed")
        setIsAuthenticating(false)
        return
      }

      setCurrentUser(authenticatedUser)
      router.push(`/dashboard/${authenticatedUser.role}`)
    } catch (err) {
      console.error("Login error:", err)
      setErrorMessage((err as Error)?.message || "An error occurred during login.")
      setIsAuthenticating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">Beer Parlor Management</div>
          <div className="text-muted">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Beer Parlor</h1>
          <p className="text-black font-bold">Management System</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin(email, password)
          }}
          className="p-6 bg-card rounded-lg border border-border space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded disabled:opacity-50"
              disabled={isAuthenticating}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded disabled:opacity-50"
              disabled={isAuthenticating}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300"
                disabled={isAuthenticating}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                // TODO: Implement forgot password flow
                alert("Forgot password functionality coming soon!")
              }}
              disabled={isAuthenticating}
            >
              Forgot password?
            </button>
          </div>
          <div className="flex items-center justify-between">
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white rounded shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center space-x-2 hover:shadow-xl hover:scale-105 transform transition duration-150 ease-in-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent/60 active:scale-95"
                disabled={isAuthenticating}
                aria-busy={isAuthenticating ? "true" : "false"}
              >
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
            </button>
            <button
              type="button"
              className="text-sm text-secondary underline"
              onClick={() => {
                setEmail("")
                setPassword("")
                setErrorMessage(null)
              }}
                disabled={isAuthenticating}
            >
              Clear
            </button>
          </div>

          {errorMessage && (
            <div className={`mt-2 p-2 rounded text-sm ${errorMessage.includes('suspended') ? 'bg-yellow-100 text-yellow-900 border border-yellow-400 flex items-center gap-2' : 'bg-red-100 text-red-800'}`}>
              {errorMessage.includes('suspended') ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                  <div>
                    <strong>Account Suspended:</strong> {errorMessage}
                    <div className="text-xs mt-1">If you believe this is a mistake, please contact your administrator or support team for assistance.</div>
                  </div>
                </>
              ) : (
                <><strong>Error:</strong> {errorMessage}</>
              )}
            </div>
          )}
        </form>

          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="mt-4 text-sm text-secondary hover:text-primary transition-colors flex items-center space-x-1"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${showDemoAccounts ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Show demo accounts</span>
          </button>
        
          {showDemoAccounts && (
            <div className="mt-2 p-4 bg-card rounded-lg border border-border">
              <p className="text-xs text-secondary">
                <strong>Demo accounts:</strong>
                <br />
                Admin: admin@distinguishbarsgrills.com / admin123
                <br />
                Storekeeper: storekeeper@distinguishbarsgrills.com / store123
                <br />
                Attendant: attendant@distinguishbarsgrills.com / attend123
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
