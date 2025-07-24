import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "button-base",
  {
    variants: {
      variant: {
        default: "primary-button",
        destructive: "error-button",
        outline: "secondary-button", 
        secondary: "secondary-button",
        ghost: "ghost-button",
        link: "link-button",
        cta: "cta-button",
        transaction: "transaction-action-button",
        quick: "quick-action-button"
      },
      size: {
        default: "button-default",
        sm: "button-small",
        lg: "button-large", 
        icon: "button-icon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
