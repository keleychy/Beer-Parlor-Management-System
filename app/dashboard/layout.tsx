"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, clearSession, getSession } from "@/lib/storage"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar"
import { UserIcon, LogOutIcon, KeyRoundIcon } from "lucide-react"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import type { User } from "@/lib/types"

// SidebarHeaderContent hides the header when sidebar is collapsed
function SidebarHeaderContent() {
  const { state } = useSidebar();
  return (
    <div className="flex items-center justify-between p-4">
      {state !== 'collapsed' && (
        <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">Distinguish Bar</h1>
      )}
      <SidebarTrigger />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const session = getSession();
        if (!session) {
          console.error('No valid session found');
          router.push("/");
          return;
        }

        // Get user from localStorage
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.id !== session.userId) {
          console.error('No matching user found for session');
          clearSession();
          router.push("/");
          return;
        }
      
        setUser(currentUser);
        setLoading(false);

        // Set up session expiry check
        const checkInterval = setInterval(() => {
          const currentSession = getSession();
          if (!currentSession) {
            clearInterval(checkInterval);
            router.push("/");
          }
        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push("/");
      }
    };
  
    checkAuth();
  }, [router])

  const handleLogout = async () => {
    // Clear session and user data
    clearSession();
    
    // Redirect to login page
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar collapsible="icon" className="bg-white dark:bg-zinc-900 shadow-lg border-r border-border">
          <SidebarHeader>
            <SidebarHeaderContent />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  isActive={true}
                  className=""
                >
                  <a href="#">
                    <UserIcon className="mr-2" />
                    <span className="truncate">Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Add more menu items here as needed */}
            </SidebarMenu>
            {/* User info only visible when expanded */}
            <SidebarUserInfo user={user} />
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Change Password"
                  className=""
                >
                  <span>
                    <KeyRoundIcon className="mr-2" />
                    <ChangePasswordDialog userId={user?.id || ""} />
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Logout"
                  onClick={handleLogout}
                  className="text-red-600 dark:text-red-400"
                >
                  <span>
                    <LogOutIcon className="mr-2" />
                    <span className="truncate">Logout</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 min-h-screen w-full overflow-auto p-6 scroll-touch">{children}</div>
      </div>
    </SidebarProvider>
  )
}

// User info component that hides when sidebar is collapsed
function SidebarUserInfo({ user }: { user: User | null }) {
  const { state } = useSidebar();
  if (state === 'collapsed') return null;
  return (
    <div className="p-4 mt-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <UserIcon className="w-6 h-6 text-primary" />
        <div>
          <div className="font-semibold text-foreground">{user?.name}</div>
          <div className="text-xs text-secondary">{user?.email}</div>
        </div>
      </div>
      <div className="text-xs text-secondary uppercase tracking-wide">{user?.role}</div>
    </div>
  );
}
