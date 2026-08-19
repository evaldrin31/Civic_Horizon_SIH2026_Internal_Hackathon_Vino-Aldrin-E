import * as React from "react"

import { cn } from "@/lib/utils"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'status-yes' | 'status-no' | 'status-partial' | 'status-unknown' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
      "status-yes": "bg-status-yesBg text-status-yes border-status-yes/20 hover:bg-status-yesBg/80",
      "status-no": "bg-status-noBg text-status-no border-status-no/20 hover:bg-status-noBg/80",
      "status-partial": "bg-status-partialBg text-status-partial border-status-partial/20 hover:bg-status-partialBg/80",
      "status-unknown": "bg-status-unknownBg text-status-unknown border-status-unknown/20 hover:bg-status-unknownBg/80",
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
