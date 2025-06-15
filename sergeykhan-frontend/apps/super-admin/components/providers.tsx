"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
      forcedTheme={undefined} // This ensures the system theme is respected
    >
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </NextThemesProvider>
  )
}
