"use client"

import { getVisibleGroups, getMobilePrimaryItems } from "@/lib/dashboard-nav"
import { AppBottomNav } from "@/components/app-bottom-nav"

type Props = {
  role: string
  moduleGym: boolean
  moduleCourts: boolean
}

export function MobileBottomNav({ role, moduleGym, moduleCourts }: Props) {
  const primaryItems = getMobilePrimaryItems(role, moduleGym, moduleCourts)
  const groups = getVisibleGroups(role, moduleGym, moduleCourts)

  return <AppBottomNav groups={groups} primaryItems={primaryItems} />
}
