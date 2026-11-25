import type { Metadata } from "next"
import { Inter_Tight, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MP360 · Member Pulse",
  description: "Multi-tenant SaaS platform for gyms, sports clubs, and fitness studios.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${interTight.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
