import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-amber-500/20 placeholder:text-white/40 selection:bg-amber-500/30 selection:text-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "file:inline-flex file:h-9 file:rounded-lg file:border file:border-white/10 file:bg-white/10 file:px-3 file:text-sm file:font-medium file:uppercase file:tracking-[0.2em]",
        "aria-invalid:border-rose-400 aria-invalid:text-rose-100 aria-invalid:focus-visible:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
