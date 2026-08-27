import * as React from "react"
import { forwardRef } from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/tiptap-utils"

import { Input } from "@/components/tiptap-ui-primitive/input"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Textarea } from "@/components/tiptap-ui-primitive/textarea"

import "./input-group.scss"

const InputGroup = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      data-slot="tiptap-input-group"
      role="group"
      className={cn("tiptap-input-group", className)}
      {...props}
    />
  )
})
InputGroup.displayName = "InputGroup"

const inputGroupAddonVariants = cva("tiptap-input-group-addon", {
  variants: {
    align: {
      "inline-start": "tiptap-input-group-addon--inline-start",
      "inline-end": "tiptap-input-group-addon--inline-end",
      "block-start": "tiptap-input-group-addon--block-start",
      "block-end": "tiptap-input-group-addon--block-end",
    },
  },
  defaultVariants: {
    align: "inline-start",
  },
})

const InputGroupAddon = forwardRef(({
  className,
  align = "inline-start",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      data-slot="tiptap-input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if (e.target.closest("button")) return
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
})
InputGroupAddon.displayName = "InputGroupAddon"

const inputGroupButtonVariants = cva("tiptap-input-group-button", {
  variants: {
    size: {
      "extra-small": "tiptap-input-group-button--extra-small",
      small: "tiptap-input-group-button--small",
      medium: "tiptap-input-group-button--medium",
      large: "tiptap-input-group-button--large",
    },
  },
  defaultVariants: {
    size: "small",
  },
})

const InputGroupButton = forwardRef(({
  className,
  type = "button",
  size = "small",
  variant = "ghost",
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
})
InputGroupButton.displayName = "InputGroupButton"

const InputGroupText = forwardRef(({
  className,
  ...props
}, ref) => {
  return <span ref={ref} className={cn("tiptap-input-group-text", className)} {...props} />
})
InputGroupText.displayName = "InputGroupText"

const InputGroupInput = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      data-slot="tiptap-input-group-control"
      className={cn("tiptap-input-group-control", className)}
      {...props}
    />
  )
})
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <Textarea
      ref={ref}
      data-slot="tiptap-input-group-control"
      className={cn(
        "tiptap-input-group-control tiptap-input-group-control--textarea",
        className
      )}
      {...props}
    />
  )
})
InputGroupTextarea.displayName = "InputGroupTextarea"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
