import { NavLink } from "react-router-dom";
import { Icon } from "./Icon";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/products", label: "Products", icon: "inventory_2" },
  { to: "/customers", label: "Customers", icon: "groups" },
  { to: "/orders", label: "Orders", icon: "shopping_cart" },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-on-surface/40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-lowest border-r border-outline-variant flex flex-col py-md z-50 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-lg mb-8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <Icon name="inventory_2" className="text-[20px]" filled />
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary leading-tight">
              InventoryPro
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Enterprise SaaS</p>
          </div>
        </div>

        <nav className="flex-1 px-md flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg border-l-2 transition-colors duration-200 font-label-md text-label-md ${
                  isActive
                    ? "text-primary font-bold border-primary bg-surface-container-low"
                    : "text-on-surface-variant border-transparent hover:bg-surface-container"
                }`
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-md mt-auto">
          <NavLink
            to="/orders/new"
            onClick={onClose}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-2.5 px-4 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="add" filled />
            Create New Order
          </NavLink>
        </div>
      </aside>
    </>
  );
}
