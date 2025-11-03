import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "./ClientLayout"
import DebugScrollbars from "../components/debug-scrollbars"
import { metadata } from './metadata'

const _geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen h-full">
        {/* Dev helper: enable visible scrollbars on mobile simulators when in dev or with ?debugScrollbars=1 */}
        <DebugScrollbars />
        <ClientLayout>
          <main className="flex-1 min-h-screen h-full w-full">{children}</main>
        </ClientLayout>
      </body>
    </html>
  )
}
