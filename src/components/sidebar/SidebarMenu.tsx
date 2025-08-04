import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SidebarMenuProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isExpanded: boolean;
  hasActiveChild: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  isCollapsed?: boolean;
  isMobile?: boolean;
}

const SidebarMenu = memo(({ 
  icon: Icon, 
  label, 
  isExpanded, 
  hasActiveChild, 
  onToggle, 
  children,
  isCollapsed = false,
  isMobile = false 
}: SidebarMenuProps) => {
  const menuClass = `
    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 w-full text-left justify-start bg-transparent
    ${isCollapsed ? 'px-2' : ''}
    ${hasActiveChild
      ? "text-white" 
      : "text-white hover:text-blue-100 hover:bg-transparent"
    }
  `;

  return (
    <div className={`transition-all duration-1000 ease-in-out ${isExpanded ? "bg-blue-800/30 rounded-lg backdrop-blur-sm" : ""}`}>
      <Button
        variant="ghost"
        className={menuClass}
        onClick={onToggle}
        title={isCollapsed && !isMobile ? label : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {(!isCollapsed || isMobile) && <span className="flex-1 text-left">{label}</span>}
        {(!isCollapsed || isMobile) && (
          <div className={`flex-shrink-0 transition-transform duration-1000 ease-in-out ${isExpanded ? "rotate-90" : ""}`}>
            <ChevronRight className="size-4" />
          </div>
        )}
      </Button>
      
      <div className={`overflow-hidden transition-all duration-1000 ease-in-out ${
        isExpanded && (!isCollapsed || isMobile) 
          ? "max-h-96 opacity-100" 
          : "max-h-0 opacity-0"
      }`}>
        {children}
      </div>
    </div>
  );
});

SidebarMenu.displayName = "SidebarMenu";

export default SidebarMenu;