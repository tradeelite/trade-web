"use client";

import { SearchCommand } from "./search-command";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";

type HeaderProps = {
  onOpenMobileNav?: () => void;
};

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobileNav}
          title="Open navigation"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
        <SearchCommand />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        {user && (
          <>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                {user.displayName?.[0] ?? user.email?.[0] ?? "U"}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
