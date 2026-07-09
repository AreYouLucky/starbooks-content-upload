import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const buttonVariants = cva(
  "inline-flex hover:scale-[1.1] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,box-shadow,transform] hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-sky-700 hover:text-white",
        destructive:
          "bg-destructive text-white shadow-xs  focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background text-sky-700 shadow-xs hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-sky-100 hover:text-sky-800",
        ghost: "hover:bg-sky-50 hover:text-sky-700",
        link: "text-primary underline-offset-4 ",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
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
  popover,
  popoverSide = "top",
  title,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "popover"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    popover?: React.ReactNode
    popoverSide?: React.ComponentProps<typeof TooltipContent>["side"]
  }) {
  const Comp = asChild ? Slot : "button"
  const popoverContent = popover

  const button = (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      title={title}
      {...props}
    >
      {children}
    </Comp>
  )

  if (!popoverContent) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side={popoverSide}
        className="bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-950/10 [&_svg]:fill-sky-600"
      >
        {popoverContent}
      </TooltipContent>
    </Tooltip>
  )
}

export { Button, buttonVariants }
