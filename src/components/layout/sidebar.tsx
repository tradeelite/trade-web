"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Briefcase,
  Home,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TradeEliteLogo from "@/components/ui/trade-elite-logo";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/portfolio", label: "Portfolios", icon: Briefcase },
  { href: "/options", label: "Options", icon: BarChart3 },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r bg-background">
      <div className="flex h-24 items-center border-b px-4">
        <Link href="/" className="flex items-center">
          <TradeEliteLogo width={256} showWordmark={true} />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
