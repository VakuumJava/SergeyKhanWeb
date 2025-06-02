import React from 'react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@workspace/ui/components/sidebar"
import AppSidebar from '@/components/sidebar/sidebar'
import { Separator } from '@workspace/ui/components/separator'
import HeaderBreadcrumb from '@/components/header/header-breadcrumb'
import ThemeSwitcher from '@/components/theme-switcher'
import Link from 'next/link';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky inset-x-0 top-0 isolate z-10 flex shrink-0 items-center gap-2 border-b">
          <div className="flex h-14 w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1.5" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <HeaderBreadcrumb></HeaderBreadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/abonents" className="px-3 py-1 text-sm font-medium hover:bg-gray-200 rounded">
                Абоненты
              </Link>
              <ThemeSwitcher></ThemeSwitcher>
            </div>
          </div>
        </header>
        <main className='container px-8 py-4'>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout