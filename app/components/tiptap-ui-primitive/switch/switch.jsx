import * as React from "react"
import { forwardRef } from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/tiptap-utils"

import "./switch.scss"

const Switch = forwardRef(({
  className,
  size = "default",
  ...props
}, ref) => {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="tiptap-switch"
      data-size={size}
      className={cn("tiptap-switch", className)}
      {...props}>
      <SwitchPrimitive.Thumb data-slot="tiptap-switch-thumb" className="tiptap-switch-thumb" />
    </SwitchPrimitive.Root>
  )
})
Switch.displayName = "Switch"

export { Switch }
