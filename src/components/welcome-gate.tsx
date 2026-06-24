import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowLeft, Copy, Check } from "lucide-react";
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

type Mode = "signin" | "create" | "show-id";

function Welcome() {
  const { signInWithId, createAccount } = useVisitor();
  const [mode, setMode] = useState<Mode>("signin");
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [generatedId, setGeneratedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const doSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userId.trim() || submitting) return;
    setSubmitting(true);
    try {
      const u = await signInWithId(userId);
      toast.success(`Welcome back, ${u.name} 💜`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const doCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const u = await createAccount(name);
      setGeneratedId(u.userId);
      setMode("show-id");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(generatedId);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-[32px] p-8 w-full max-w-md soft-shadow"
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

        <h1 className="font-display text-3xl font-bold text-center">Welcome to SereneMind</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed text-center">
          Your safe space for wellness, reflection, and support.
        </p>

        {mode === "signin" && (
          <form onSubmit={doSignIn} className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Existing User
            </p>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Your User ID</span>
              <input
                autoFocus
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                placeholder="e.g. SHA-7K29"
                className="w-full mt-1.5 rounded-2xl bg-muted/50 px-4 py-3 text-sm tracking-wider outline-none focus:ring-2 focus:ring-primary/40 uppercase"
                maxLength={20}
              />
            </label>
            <button
              type="submit"
              disabled={!userId.trim() || submitting}
              className="w-full mt-4 rounded-full py-3.5 font-display font-semibold text-white soft-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">New User?</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={() => { setMode("create"); setName(""); }}
              className="w-full rounded-full py-3 text-sm font-semibold border border-border hover:bg-muted/40"
            >
              Create New Account
            </button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={doCreate} className="mt-7">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3 hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Create New Account
            </p>
            <label className="block">
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
              className="w-full mt-4 rounded-full py-3.5 font-display font-semibold text-white soft-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Account
            </button>
            <p className="text-[11px] text-muted-foreground mt-4 text-center">
              We'll generate a unique User ID for you. Save it — it's how you sign back in.
            </p>
          </form>
        )}

        {mode === "show-id" && (
          <div className="mt-7 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your User ID
            </p>
            <div className="mt-3 rounded-2xl bg-muted/40 px-4 py-5">
              <p className="font-display text-3xl font-bold tracking-widest">{generatedId}</p>
            </div>
            <button
              type="button"
              onClick={copyId}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-border hover:bg-muted/40"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy User ID"}
            </button>
            <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
              Save this somewhere safe. You'll need it to sign back in on any device — without it, your data cannot be recovered.
            </p>
            <button
              type="button"
              onClick={() => toast.success("Welcome to SereneMind 💜")}
              className="w-full mt-5 rounded-full py-3.5 font-display font-semibold text-white soft-shadow flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(90deg, var(--primary), var(--secondary))" }}
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
