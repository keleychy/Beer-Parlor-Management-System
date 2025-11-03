"use client"

import ServiceWorkerProvider from "@/components/ServiceWorkerProvider"
// Add script for testing offline features in development
const isDev = process.env.NODE_ENV === 'development'

export default function ClientLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ServiceWorkerProvider>
      <div className="flex flex-col min-h-screen h-full w-full">
        {children}
      </div>
    </ServiceWorkerProvider>
  )
}