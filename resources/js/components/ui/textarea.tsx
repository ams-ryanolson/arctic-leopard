import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition focus-visible:border-white/40 focus-visible:ring-4 focus-visible:ring-amber-500/20 placeholder:text-white/40 selection:bg-amber-500/30 selection:text-white disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "aria-invalid:border-rose-400 aria-invalid:text-rose-100 aria-invalid:focus-visible:ring-rose-500/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }




