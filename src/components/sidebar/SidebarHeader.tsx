import React, { memo } from "react";
import { FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onDashboardClick: () => void;
  onToggleSidebar?: () => void;
}

const SidebarHeader = memo(({ 
  isCollapsed, 
  isMobile, 
  onDashboardClick, 
  onToggleSidebar 
}: SidebarHeaderProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border-0 shadow-lg flex-shrink-0">
      <div className="p-4">
        <div className={`flex items-center gap-3 w-full text-left hover:bg-white/20 rounded-lg p-3 transition-all duration-200 backdrop-blur-sm ${isCollapsed && !isMobile ? 'justify-center' : ''}`}>
          {(!isCollapsed || isMobile) && (
            <div
              className="w-10 h-10 bg-white/25 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-lg cursor-pointer"
              onClick={onDashboardClick}
            >
              <FileText className="size-6 text-white" />
            </div>
          )}
          {(!isCollapsed || isMobile) && (
            <div
              className="grid flex-1 text-left text-sm leading-tight cursor-pointer"
              onClick={onDashboardClick}
            >
              <span className="truncate font-bold text-lg text-white">ContractPRO</span>
              <span className="truncate text-xs text-blue-100">Gestão de Contratos</span>
            </div>
          )}
          
          {!isMobile && onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className={`w-8 h-8 p-0 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 ${isCollapsed ? 'mx-auto' : 'ml-auto'}`}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;