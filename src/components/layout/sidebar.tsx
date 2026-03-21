"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Database,
  Home,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TradeEliteLogo from "@/components/ui/trade-elite-logo";
import { TeAriaBadge } from "@/components/ai/te-aria-badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/data-viewer", label: "Market Data", icon: Database },
  { href: "/portfolio", label: "Portfolios", icon: Briefcase },
  { href: "/options", label: "Options", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

type SidebarNavProps = {
  pathname: string;
  onNavigate?: () => void;
};

function SidebarNav({ pathname, onNavigate }: SidebarNavProps) {
  const isAssistantActive = pathname.startsWith("/assistant");

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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

      <Link
        href="/assistant"
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isAssistantActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <TeAriaBadge size="sm" />
      </Link>
    </nav>
  );
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r bg-background md:flex">
        <div className="flex h-24 items-center border-b px-4">
          <Link href="/" className="flex items-center">
            <TradeEliteLogo width={256} showWordmark={true} />
          </Link>
        </div>
        <SidebarNav pathname={pathname} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 sm:max-w-[280px]"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-20 items-center border-b px-4">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => onMobileOpenChange(false)}
            >
              <TradeEliteLogo width={220} showWordmark={true} />
            </Link>
          </div>
          <SidebarNav
            pathname={pathname}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
