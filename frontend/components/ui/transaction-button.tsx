"use client"

import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ButtonHTMLAttributes } from "react"

interface TransactionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function TransactionButton({
  loading,
  loadingText,
  children,
  className,
  disabled,
  variant = "default",
  size = "default",
  ...props
}: TransactionButtonProps) {
  return (
    <Button
      className={cn(
        "relative",
        variant === "default" &&
          "bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50",
        className
      )}
      disabled={disabled || loading}
      variant={variant === "default" ? "default" : variant}
      size={size}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? "Processing..."}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}
