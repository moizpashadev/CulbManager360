import type { Metadata, Viewport } from "next"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { InstallPrompt } from "@/components/install-prompt"

export const metadata: Metadata = {
  title: "Me360",
  description: "Your gym membership, invoices, bookings and progress — in one place. Powered by MP360.",
  manifest: "/member-manifest.json",
  icons: {
    icon: "/me360-icon.svg",
    // iOS Safari only honors apple-touch-icon (and requires PNG — it does
    // not render SVG here), never the web app manifest's icons array.
    apple: "/me360-icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Me360",
  },
}

export const viewport: Viewport = {
  themeColor: "#12B886",
}

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      <InstallPrompt />
      {children}
    </>
  )
}
