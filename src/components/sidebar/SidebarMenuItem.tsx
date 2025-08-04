import React, { memo } from "react";
import { Button } from "@/components/ui/button";

interface SidebarMenuItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}

const SidebarMenuItem = memo(({ label, isActive, onClick, badge }: SidebarMenuItemProps) => {
  const itemClass = `
    flex items-center gap-3 pl-8 pr-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent
    ${isActive 
      ? "text-white" 
      : "text-blue-100 hover:text-white hover:bg-transparent"
    }
  `;

  return (
    <Button 
      onClick={onClick}
      variant="ghost"
      className={itemClass}
    >
      <div className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {badge}
    </Button>
  );
});

SidebarMenuItem.displayName = "SidebarMenuItem";

export default SidebarMenuItem;