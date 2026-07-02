"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"

type Props = {
  placeholder?: string
  basePath: string
  className?: string
}

export function GridSearch({ placeholder = "Search…", basePath, className }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  useEffect(() => {
    setValue(searchParams.get("q") ?? "")
  }, [searchParams])

  function submit(q: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (q.trim()) {
      params.set("q", q.trim())
    } else {
      params.delete("q")
    }
    router.push(`${basePath}?${params.toString()}`)
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("q")
    setValue("")
    router.push(params.toString() ? `${basePath}?${params}` : basePath)
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit(value)}
        placeholder={placeholder}
        className="h-9 w-64 rounded-md border border-border bg-white pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {value && (
        <button
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
