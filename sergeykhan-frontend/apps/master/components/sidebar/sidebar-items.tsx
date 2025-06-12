import React from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/ui";

import Link from "next/link";

import { sidebar_items } from "@/constants/sidebar";

const SidebarItems = () => {
  return (
    <SidebarContent>
      {sidebar_items.map((section) => {
        return (
          <SidebarGroup key={section.name}>
            <SidebarGroupLabel>{section.name}</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu>
                {section.list.map((item) => {
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        );
      })}
    </SidebarContent>
  );
};

export default SidebarItems;
