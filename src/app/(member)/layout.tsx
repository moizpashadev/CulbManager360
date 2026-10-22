import type { Metadata } from "next"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { InstallPrompt } from "@/components/install-prompt"

export const metadata: Metadata = {
  manifest: "/member-manifest.json",
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
