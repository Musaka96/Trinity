import {
  LayoutDashboard,
  Users,
  Sparkles,
  CalendarClock,
  BarChart3,
  Upload,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chatters", label: "Chatters", icon: Users },
  { href: "/models", label: "Models", icon: Sparkles },
  { href: "/shifts", label: "Shifts", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/import", label: "Import", icon: Upload },
];
