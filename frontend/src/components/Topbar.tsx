import { useState } from "react";
import { Icon } from "./Icon";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user?.full_name ?? "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-260px)] h-16 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center px-margin-mobile md:px-lg">
      <div className="flex items-center gap-3 flex-1">
        <button
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-full"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Icon name="menu" />
        </button>
        <div className="hidden sm:flex items-center w-full max-w-md relative">
          <Icon name="search" className="absolute left-3 text-outline text-[20px]" />
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-body-sm text-body-sm transition-all"
            placeholder="Search inventory, orders..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
          <Icon name="notifications" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md border border-outline-variant cursor-pointer"
          >
            {initials}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-20 py-1">
                <div className="px-4 py-3 border-b border-outline-variant">
                  <p className="font-label-md text-label-md text-on-surface truncate">
                    {user?.full_name}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-on-surface-variant hover:bg-surface-container transition-colors font-label-md text-label-md"
                >
                  <Icon name="logout" className="text-[20px]" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
