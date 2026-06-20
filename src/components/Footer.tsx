import React from "react";
import { TrendingUp, Wallet, ReceiptText, UserCircle } from "lucide-react";

interface FooterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  primaryColor: string;
}

export default function Footer({ 
  activeTab, 
  setActiveTab, 
  primaryColor 
}: FooterProps) {
  const menus = [
    {
      id: "quotes",
      label: "ราคา",
      icon: (color: string) => (
        <div className="relative flex items-center justify-center">
          <TrendingUp size={20} style={{ color }} />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }}></span>
          </span>
        </div>
      )
    },
    {
      id: "assets",
      label: "สินทรัพย์",
      icon: (color: string) => <Wallet size={20} style={{ color }} />
    },
    {
      id: "trading",
      label: "บันทึกเทรด",
      icon: (color: string) => <ReceiptText size={20} style={{ color }} />
    },
    {
      id: "profile",
      label: "ของฉัน",
      icon: (color: string) => <UserCircle size={20} style={{ color }} />
    }
  ];

  return (
    <nav 
      id="mitrade-footer-nav"
      className="fixed bottom-0 left-0 right-0 max-w-7xl mx-auto w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-100/80 shadow-lg pb-safe"
    >
      <div className="grid grid-cols-4 h-16">
        {menus.map((menu) => {
          const isActive = activeTab === menu.id;
          const iconColor = isActive ? primaryColor : "#94a3b8";
          const textColor = isActive ? primaryColor : "text-slate-400";
          
          return (
            <button
              id={`nav-btn-${menu.id}`}
              key={menu.id}
              onClick={() => setActiveTab(menu.id)}
              className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 duration-150"
            >
              <div id={`nav-btn-icon-${menu.id}`}>
                {menu.icon(iconColor)}
              </div>
              <span 
                id={`nav-btn-label-${menu.id}`}
                className={`text-[11px] font-medium tracking-tight ${isActive ? "font-bold" : "font-normal"} ${textColor}`}
              >
                {menu.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
