import * as React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/tiptap-utils"
import "@/components/tiptap-ui-primitive/input/input.scss"

const Input = forwardRef(({
  className,
  type,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="tiptap-input"
      className={cn("tiptap-input", className)}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
