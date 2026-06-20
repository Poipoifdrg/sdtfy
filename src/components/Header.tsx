import React from "react";
import { TrendingUp, User as UserIcon, ShieldAlert } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  siteTitle: string;
  logoUrl?: string;
  user: User | null;
  onOpenAdmin: () => void;
  primaryColor: string;
}

export default function Header({ 
  siteTitle, 
  logoUrl, 
  user, 
  onOpenAdmin,
  primaryColor 
}: HeaderProps) {
  return (
    <header 
      id="mitrade-header"
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-blue-50 px-4 py-3.5 flex items-center justify-between shadow-xs"
    >
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img 
            id="mitrade-logo-img"
            src={logoUrl} 
            alt="Logo" 
            className="w-8 h-8 rounded-lg object-contain border border-blue-100"
            onError={(e) => {
              // Fallback
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div 
            id="mitrade-logo-placeholder"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: primaryColor }}
          >
            M
          </div>
        )}
        <div>
          <h1 
            id="mitrade-title"
            className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryColor}, #1D4ED8)`
            }}
          >
            {siteTitle || "MiTrade"}
          </h1>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium -mt-1">
            <TrendingUp size={10} className="text-emerald-500" />
            <span>Professional Multi-Platform Broker</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && user.isAdmin && (
          <button
            id="btn-admin-panel-shortcut"
            onClick={onOpenAdmin}
            className="flex items-center gap-1 bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-bold px-2.5 py-1.5 rounded-full hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <ShieldAlert size={12} className="animate-pulse" />
            <span>จัดการหลังบ้าน</span>
          </button>
        )}

        {user ? (
          <div 
            id="user-badge"
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-full"
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {user.username ? user.username.charAt(0).toUpperCase() : <UserIcon size={10} />}
            </div>
            <div className="flex flex-col text-left">
              <span id="header-user-name" className="text-[11px] font-semibold text-gray-700 max-w-[70px] truncate leading-none">
                {user.username}
              </span>
              <span id="header-vip-tag" className="text-[9px] text-amber-500 font-bold leading-none mt-0.5">
                VIP {user.vipLevel}
              </span>
            </div>
          </div>
        ) : (
          <div id="guest-badge" className="text-xs text-gray-400 bg-slate-55 border border-dashed border-slate-200 px-2.5 py-1.5 rounded-full flex items-center gap-1">
            <span>โปรดลงชื่อเข้าใช้</span>
          </div>
        )}
      </div>
    </header>
  );
}
