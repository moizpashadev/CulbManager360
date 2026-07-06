"use client"

import { adminNavGroups, getAdminMobilePrimaryItems } from "@/components/admin-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"

export function AdminMobileNav() {
  return <AppBottomNav groups={adminNavGroups} primaryItems={getAdminMobilePrimaryItems()} menuTitle="Admin Menu" />
}
