"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Coffee,
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  PenSquare,
  MapPin,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { label: "Дашборд", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Продажи", icon: TrendingUp, href: "/sales" },
  { label: "Операционные", icon: BarChart3, href: "/operations" },
  { label: "Импорт", icon: PenSquare, href: "/import" },
  { label: "Кофейни", icon: MapPin, href: "/locations" },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
          <Coffee className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            Balance Coffee
          </span>
          <span className="text-xs text-sidebar-foreground/60">Управление бизнесом</span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <TooltipProvider>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "text-white bg-sidebar-accent"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        isActive ? "text-white" : "text-sidebar-foreground/50"
                      )}
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="md:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.name || "Пользователь"}
            </span>
            <Badge
              variant="secondary"
              className="mt-0.5 w-fit bg-sidebar-accent text-[10px] text-sidebar-foreground/70 hover:bg-sidebar-accent"
            >
              {(user as { role?: string } | undefined)?.role === "ADMIN"
                ? "Администратор"
                : "Менеджер"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="shrink-0 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Выйти"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
