import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Home, MessageCircle, Users, Bot, BarChart3, ClipboardList,
  HeartPulse, Gamepad2, User, LogOut, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useVisitor } from "@/lib/visitor";

const primary = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/community", label: "Secret Space", icon: MessageCircle },
  { to: "/games", label: "Games", icon: Gamepad2 },
];

const history = [
  { to: "/mood-history", label: "Mood History", icon: BarChart3 },
  { to: "/symptoms-history", label: "Symptoms History", icon: ClipboardList },
  { to: "/medical", label: "Medical History", icon: HeartPulse },
  { to: "/support-circle", label: "Support Circle", icon: Users },
];

export function DesktopSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col gap-4 p-4 sticky top-0 h-screen">
      <div className="flex items-center gap-3 px-2 py-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary soft-shadow">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display text-lg font-bold leading-tight">SereneMind</p>
          <p className="text-xs text-muted-foreground">Your wellness companion</p>
        </div>
      </div>

      <nav className="glass-card rounded-3xl p-3 flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-thin">
        {primary.map((item) => (
          <NavLink key={item.to} {...item} active={pathname === item.to} />
        ))}
        <div className="my-3 h-px bg-border/70" />
        {history.map((item) => (
          <NavLink key={item.to} {...item} active={pathname === item.to} />
        ))}

        <div className="mt-auto rounded-2xl p-4 text-center"
          style={{ background: "linear-gradient(160deg, color-mix(in oklab, var(--soft-pink) 60%, transparent), color-mix(in oklab, var(--lavender) 70%, transparent))" }}>
          <div className="text-3xl mb-1">🤗</div>
          <p className="font-display font-semibold text-sm leading-snug">
            Take care of<br/>your mind and<br/>body. You matter.
          </p>
          <button className="mt-3 text-xs rounded-full px-3 py-1.5 bg-primary text-primary-foreground font-medium">
            You're doing great! 💜
          </button>
        </div>
      </nav>

      <button className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <LogOut className="h-4 w-4" /> Log Out
      </button>
    </aside>
  );
}

function NavLink({ to, label, icon: Icon, active }: { to: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      to={to}
      className="relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors"
      style={active ? { color: "var(--primary)" } : { color: "var(--foreground)" }}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-2xl"
          style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="h-5 w-5 relative" />
      <span className="relative">{label}</span>
    </Link>
  );
}

const mobile = [
  { to: "/", label: "Home", icon: Home },
  { to: "/community", label: "Secret Space", icon: MessageCircle },
  { to: "/support-circle", label: "Support", icon: Users },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 glass-card rounded-3xl px-2 py-2 flex justify-around">
      {mobile.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} className="flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl relative min-w-0">
            {active && (
              <motion.span
                layoutId="bottom-active"
                className="absolute inset-0 rounded-2xl"
                style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)" }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Icon className="h-5 w-5 relative" style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }} />
            <span className="text-[10px] font-medium relative mt-0.5" style={{ color: active ? "var(--primary)" : "var(--muted-foreground)" }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 pb-28 md:pb-8 md:pr-6 md:pt-4">
        <div className="mx-auto max-w-5xl px-4 md:px-2">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
