import * as React from "react"
import { forwardRef } from "react"
import "@/components/tiptap-ui-primitive/separator/separator.scss"
import { cn } from "@/lib/tiptap-utils"

export const Separator = forwardRef(({
  decorative,
  orientation = "vertical",
  className,
  ...props
}, ref) => {
  const ariaOrientation = orientation === "vertical" ? orientation : undefined
  const semanticProps = decorative
    ? { role: "none" }
    : { "aria-orientation": ariaOrientation, role: "separator" }

  return (
    <div
      ref={ref}
      className={cn("tiptap-separator", className)}
      data-orientation={orientation}
      {...semanticProps}
      {...props}
    />
  )
})
Separator.displayName = "Separator"
