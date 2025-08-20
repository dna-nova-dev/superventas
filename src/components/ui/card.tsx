
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm transition-colors duration-200",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// New component specifically for data cards with icons
const DataCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon?: React.ReactNode;
    iconColor?: string;
    title?: string;
    value?: string | number;
    trend?: number;
    trendLabel?: string;
    footer?: React.ReactNode;
  }
>(({ className, icon, iconColor, title, value, trend, trendLabel, footer, ...props }, ref) => (
  <Card 
    ref={ref} 
    className={cn("overflow-hidden transition-all hover:shadow-md", className)}
    {...props}
  >
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          {title && <h3 className="font-medium text-sm text-muted-foreground mb-1">{title}</h3>}
          {value !== undefined && (
            <div className="text-2xl font-bold">{value}</div>
          )}
          {trend !== undefined && (
            <div className={cn(
              "text-xs font-medium mt-1 flex items-center",
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '–'}{' '}
              {Math.abs(trend)}%{trendLabel && ` ${trendLabel}`}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "flex items-center justify-center p-3 rounded-full bg-opacity-10",
            iconColor ? `bg-${iconColor}-100 text-${iconColor}-500` : "bg-primary/10 text-primary",
            "dark:bg-opacity-20"
          )}>
            {icon}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </CardContent>
  </Card>
))
DataCard.displayName = "DataCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, DataCard }
