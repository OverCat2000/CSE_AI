import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-pearl-aqua text-white hover:bg-pearl-aqua/80",
        secondary: "border-transparent bg-secondary text-white hover:bg-secondary/80",
        destructive: "border-transparent bg-tomato text-white hover:bg-tomato/80",
        outline: "text-foreground",
        pink: "border-transparent bg-pink-mist text-white hover:bg-pink-mist/80",
        banana: "border-transparent bg-banana-cream text-gray-900 hover:bg-banana-cream/80",
        grape: "border-transparent bg-dusty-grape text-white hover:bg-dusty-grape/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
