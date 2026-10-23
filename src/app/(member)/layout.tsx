import type { Metadata, Viewport } from "next"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { InstallPrompt } from "@/components/install-prompt"

export const metadata: Metadata = {
  manifest: "/member-manifest.json",
  icons: {
    icon: "/icon.svg",
    // iOS Safari only honors apple-touch-icon (and requires PNG — it does
    // not render SVG here), never the web app manifest's icons array.
    apple: "/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Club Manager 360",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a8f5c",
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
