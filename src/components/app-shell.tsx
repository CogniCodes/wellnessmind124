import { useState } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import {
  Home, MessageCircle, Users, Bot, BarChart3, ClipboardList,
  HeartPulse, Gamepad2, User, LogOut, Sparkles, Menu, Lock, Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const more = [
  { to: "/privacy", label: "Privacy", icon: Lock },
  { to: "/about", label: "About SereneMind", icon: Info },
];

function useLogout() {
  const router = useRouter();
  const { signOut, visitor } = useVisitor();
  const [open, setOpen] = useState(false);
  const confirm = () => {
    if (!visitor) return;
    signOut();
    toast.success("Signed out");
    router.navigate({ to: "/" });
  };
  return { open, setOpen, confirm };
}

export function DesktopSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open, setOpen, confirm } = useLogout();

  return (
    <>
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

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </aside>
      <LogoutDialog open={open} onOpenChange={setOpen} onConfirm={confirm} />
    </>
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

const mobileBottom = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/community", label: "Space", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: logoutOpen, setOpen: setLogoutOpen, confirm } = useLogout();

  return (
    <>
      <nav className="md:hidden fixed bottom-3 inset-x-3 z-40 glass-card rounded-3xl px-2 py-2 flex justify-around">
        {mobileBottom.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} className="flex flex-col items-center justify-center px-2 py-1.5 rounded-2xl relative min-w-0">
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
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center justify-center px-2 py-1.5 rounded-2xl min-w-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Menu</span>
        </button>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-sm flex flex-col gap-0 p-0">
          <SheetHeader className="p-5 border-b">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="font-display text-base text-left">SereneMind</SheetTitle>
                <SheetDescription className="text-xs text-left">All your features</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-3">
            <Group label="Main">
              {primary.map((item) => (
                <DrawerLink key={item.to} {...item} active={pathname === item.to} onClick={() => setMenuOpen(false)} />
              ))}
            </Group>
            <Group label="Your history">
              {history.map((item) => (
                <DrawerLink key={item.to} {...item} active={pathname === item.to} onClick={() => setMenuOpen(false)} />
              ))}
            </Group>
            <Group label="More">
              {more.map((item) => (
                <DrawerLink key={item.to} {...item} active={pathname === item.to} onClick={() => setMenuOpen(false)} />
              ))}
            </Group>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={() => { setMenuOpen(false); setLogoutOpen(true); }}
              className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 text-destructive bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} onConfirm={confirm} />
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DrawerLink({ to, label, icon: Icon, active, onClick }: {
  to: string; label: string; icon: any; active: boolean; onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors"
      style={active
        ? { color: "var(--primary)", background: "color-mix(in oklab, var(--primary) 12%, transparent)" }
        : { color: "var(--foreground)" }}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

function LogoutDialog({ open, onOpenChange, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of this device?</AlertDialogTitle>
          <AlertDialogDescription>
            Make sure you've saved your <strong>User ID</strong> — you'll need it to sign back in.
            Your data stays linked to your User ID.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-white hover:bg-destructive/90">
            Log Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
