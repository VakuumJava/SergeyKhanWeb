"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import Link from "next/link";
// import {handleLogout} from "@shared/constants/func";
import {useRouter} from "next/navigation";

const SidebarUser = ({
  user,
}: {
  user: {
    name: string
    email: string
  }
}) => {
  const { isMobile } = useSidebar()





  const router = useRouter();

  const handleLogout = () => {
    // Очистка токена
    localStorage.removeItem("token");
    // Перенаправление на страницу входа
    router.push("/login");
  };




  return (
<SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={"data:image/png;base64,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"} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/*<span className="truncate font-medium">{user.name}</span>*/}
                <span className="truncate font-medium">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
<DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={"data:image/png;base64,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"} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                <Link href={"/profile"}>
                  Профиль
                </Link>
              </DropdownMenuItem>
              {/*<DropdownMenuItem>*/}
              {/*  <Bell />*/}
              {/*  Уведомления*/}
              {/*</DropdownMenuItem>*/}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut/>
              выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default SidebarUser