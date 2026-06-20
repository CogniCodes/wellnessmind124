import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { useVisitor } from "@/lib/visitor";
import { toast } from "sonner";

export function WelcomeGate({ children }: { children: ReactNode }) {
  const { visitor, loading } = useVisitor();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!visitor) return <Welcome />;
  return <>{children}</>;
}

function Welcome() {
  const { onboard } = useVisitor();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onboard(name);
      toast.success(`Welcome, ${name.trim()} 💜`);
    } catch (err) {
      console.error(err);
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen grid place-items-center px-5 py-10"
      style={{
        background:
          "radial-gradient(ellipse at top, color-mix(in oklab, var(--lavender) 50%, transparent), transparent 60%), radial-gradient(ellipse at bottom, color-mix(in oklab, var(--soft-pink) 45%, transparent), transparent 60%), var(--background)",
      }}
    >
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-[32px] p-8 w-full max-w-md text-center soft-shadow"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] soft-shadow mb-4"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
        >
          <Sparkles className="h-9 w-9 text-primary-foreground" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold">Welcome to SereneMind</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Your safe space for wellness, reflection, and support.
        </p>

        <label className="block text-left mt-7">
          <span className="text-xs font-medium text-muted-foreground">Your name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className="w-full mt-1.5 rounded-2xl bg-muted/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            maxLength={40}
          />
        </label>

        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full mt-5 rounded-full py-3.5 font-display font-semibold text-white soft-shadow disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue
        </button>

        <p className="text-[11px] text-muted-foreground mt-5">
          No account needed. Your space is private and saved to this device. 🌿
        </p>
      </motion.form>
    </div>
  );
}
