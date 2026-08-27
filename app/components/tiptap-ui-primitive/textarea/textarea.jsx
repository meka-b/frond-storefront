"use client"

import * as React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/tiptap-utils"
import "./textarea.scss"

const Textarea = forwardRef(({
  className,
  ...props
}, ref) => {
  return <textarea ref={ref} data-slot="textarea" className={cn("textarea", className)} {...props} />
})
Textarea.displayName = "Textarea"

export { Textarea }
