"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type Attribute } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.PropsWithChildren<{
  attribute?: Attribute
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 