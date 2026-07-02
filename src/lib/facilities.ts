export const FACILITY_CATALOG = [
  { type: "SWIMMING_POOL",    label: "Swimming Pool",      icon: "🏊", category: "Aquatics" },
  { type: "JACUZZI",          label: "Jacuzzi",            icon: "🛁", category: "Aquatics" },
  { type: "SAUNA",            label: "Sauna",              icon: "🔥", category: "Wellness" },
  { type: "STEAM_ROOM",       label: "Steam Room",         icon: "💨", category: "Wellness" },
  { type: "MASSAGE_THERAPY",  label: "Massage Therapy",    icon: "💆", category: "Wellness" },
  { type: "MEDITATION_ROOM",  label: "Meditation Room",    icon: "🧘", category: "Wellness" },
  { type: "YOGA_STUDIO",      label: "Yoga Studio",        icon: "🧘", category: "Studios" },
  { type: "CYCLING_STUDIO",   label: "Cycling / Spin",     icon: "🚴", category: "Studios" },
  { type: "CROSSFIT_AREA",    label: "CrossFit Area",      icon: "🏋️", category: "Studios" },
  { type: "FREE_WEIGHTS",     label: "Free Weights",       icon: "🏋️", category: "Gym Floor" },
  { type: "CARDIO_ZONE",      label: "Cardio Zone",        icon: "🏃", category: "Gym Floor" },
  { type: "BOXING_RING",      label: "Boxing / MMA",       icon: "🥊", category: "Sports" },
  { type: "SQUASH_COURT",     label: "Squash Court",       icon: "🎾", category: "Sports" },
  { type: "BADMINTON_COURT",  label: "Badminton Court",    icon: "🏸", category: "Sports" },
  { type: "BASKETBALL_COURT", label: "Basketball Court",   icon: "🏀", category: "Sports" },
  { type: "LOCKER_ROOMS",     label: "Locker Rooms",       icon: "🔒", category: "Amenities" },
  { type: "PARKING",          label: "Parking",            icon: "🅿️", category: "Amenities" },
  { type: "JUICE_BAR",        label: "Juice Bar / Café",   icon: "🥤", category: "Amenities" },
  { type: "PHYSICAL_THERAPY", label: "Physical Therapy",   icon: "🩺", category: "Health" },
  { type: "CHILDCARE",        label: "Childcare / Crèche", icon: "👶", category: "Amenities" },
] as const

export type FacilityCatalogItem = typeof FACILITY_CATALOG[number]
