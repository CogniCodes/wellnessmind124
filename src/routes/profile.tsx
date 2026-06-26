import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { User, LogOut, Moon, Sun, Bell, Lock, Sparkles, Copy, Check, Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { useVisitor } from "@/lib/visitor";
import { useMoods, useSymptoms } from "@/lib/db-hooks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SereneMind" }] }),
  component: Profile,
});

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Profile() {
  const router = useRouter();
  const { visitor, updateProfile, signOut } = useVisitor();
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields (pre-filled from visitor)
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [contact, setContact] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  useEffect(() => {
    if (!visitor) return;
    setName(visitor.name ?? "");
    setDob(visitor.dob ?? "");
    setGender(visitor.gender ?? "");
    setBloodGroup(visitor.blood_group ?? "");
    setContact(visitor.contact_number ?? "");
    setHeight(visitor.height_cm != null ? String(visitor.height_cm) : "");
    setWeight(visitor.weight_kg != null ? String(visitor.weight_kg) : "");
    setMedications(visitor.medications ?? "");
    setAllergies(visitor.allergies ?? "");
  }, [visitor]);

  const streak = (() => {
    const days = new Set(moods.map((m) => new Date(m.created_at).toDateString()));
    let s = 0; const cur = new Date();
    while (days.has(cur.toDateString())) { s++; cur.setDate(cur.getDate() - 1); }
    return s;
  })();

  const hasEnoughData = moods.length >= 3 || symptoms.length >= 1;
  const wellness = (() => {
    if (!hasEnoughData) return null;
    const SCORE: Record<string, number> = { Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3, "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1 };
    const recent = moods.slice(0, 14);
    const avg = recent.length ? recent.reduce((s, m) => s + (SCORE[m.mood] ?? 3), 0) / recent.length : 3;
    const sevPenalty = symptoms.slice(0, 10).reduce((s, x) => s + x.severity, 0);
    return Math.max(10, Math.min(100, Math.round((avg / 5) * 100) - Math.min(30, sevPenalty)));
  })();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (contact && !/^\d{6,15}$/.test(contact)) e.contact = "Digits only (6–15)";
    if (height && (!/^\d+(\.\d+)?$/.test(height) || Number(height) <= 0 || Number(height) > 272)) e.height = "Enter cm (1–272)";
    if (weight && (!/^\d+(\.\d+)?$/.test(weight) || Number(weight) <= 0 || Number(weight) > 500)) e.weight = "Enter kg (1–500)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        dob: dob || null,
        gender: gender || null,
        blood_group: bloodGroup || null,
        contact_number: contact || null,
        height_cm: height ? Number(height) : null,
        weight_kg: weight ? Number(weight) : null,
        medications: medications.trim() || null,
        allergies: allergies.trim() || null,
      });
      toast.success("Profile saved 💜");
    } catch (err) {
      console.error(err);
      toast.error("Could not save profile.");
    } finally { setSaving(false); }
  };

  const handleAvatarPick = () => fileRef.current?.click();
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !visitor) return;
    if (!/^image\//.test(file.type)) { toast.error("Please choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max image size is 5 MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${visitor.userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (sErr) throw sErr;
      await updateProfile({ avatar_url: signed.signedUrl });
      toast.success("Photo updated 💜");
    } catch (err) {
      console.error(err);
      toast.error("Could not upload photo.");
    } finally { setUploading(false); }
  };

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your wellness journey"
        icon={<User className="h-5 w-5 text-primary" />} />

      <div className="glass-card rounded-3xl p-5 mb-4 text-center">
        <div className="relative mx-auto h-20 w-20">
          {visitor?.avatar_url ? (
            <img src={visitor.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-full grid place-items-center text-3xl"
              style={{ background: "linear-gradient(135deg, var(--soft-pink), var(--lavender))" }}>
              🐻
            </div>
          )}
          <button
            onClick={handleAvatarPick}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-white soft-shadow disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>
        <h2 className="font-display text-xl font-bold mt-3">{visitor?.name ?? "—"}</h2>
        <UserIdBadge userId={visitor?.userId ?? ""} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--soft-pink) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-display font-bold text-lg">{streak} day{streak === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--lavender) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Wellness</p>
            <p className="font-display font-bold text-lg">{wellness == null ? "—" : `${wellness}/100`}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 mb-4 space-y-3">
        <h3 className="font-display font-bold text-base">Personal details</h3>
        <Field label="Display name" value={name} onChange={setName} error={errors.name} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth" type="date" value={dob} onChange={setDob} />
          <SelectField label="Gender" value={gender} onChange={setGender} options={GENDERS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Blood group" value={bloodGroup} onChange={setBloodGroup} options={BLOOD} />
          <Field label="Contact number" value={contact}
            onChange={(v) => setContact(v.replace(/\D/g, ""))}
            inputMode="numeric" placeholder="Digits only" error={errors.contact} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)" value={height}
            onChange={(v) => setHeight(v.replace(/[^\d.]/g, ""))}
            inputMode="decimal" error={errors.height} />
          <Field label="Weight (kg)" value={weight}
            onChange={(v) => setWeight(v.replace(/[^\d.]/g, ""))}
            inputMode="decimal" error={errors.weight} />
        </div>
        <TextareaField label="Current medications" value={medications} onChange={setMedications}
          placeholder="e.g. Vitamin D, 1000 IU once daily" />
        <TextareaField label="Allergies" value={allergies} onChange={setAllergies}
          placeholder="e.g. Peanuts, penicillin" />
        <button onClick={handleSave} disabled={saving}
          className="w-full rounded-full py-3 mt-2 text-white font-semibold disabled:opacity-60"
          style={{ background: "var(--primary)" }}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <div className="glass-card rounded-3xl p-2">
        <button onClick={() => setNotifOpen(true)} className="w-full text-left">
          <Row icon={<Bell className="h-4 w-4" />} label="Notifications" />
        </button>
        <Row icon={dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} label="Dark mode"
          right={
            <button onClick={() => setDark((d) => !d)}
              className="h-6 w-11 rounded-full relative transition-colors"
              style={{ background: dark ? "var(--primary)" : "var(--muted)" }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: dark ? "calc(100% - 22px)" : "2px" }} />
            </button>
          } />
        <Link to="/privacy"><Row icon={<Lock className="h-4 w-4" />} label="Privacy" /></Link>
        <Link to="/about"><Row icon={<Sparkles className="h-4 w-4" />} label="About SereneMind" /></Link>
      </div>

      <button
        onClick={() => {
          if (confirm("Sign out of this device? Save your User ID first — you'll need it to sign back in.")) {
            signOut();
            toast.success("Signed out");
            router.navigate({ to: "/" });
          }
        }}
        className="w-full mt-4 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
        <LogOut className="h-4 w-4" /> Log Out
      </button>

      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </AppShell>
  );
}

function Row({ icon, label, right }: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/40">
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-muted/40">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {right}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", inputMode, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string; error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        type={type} inputMode={inputMode} placeholder={placeholder}
        className={`w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none ${error ? "ring-2 ring-destructive" : ""}`} />
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </label>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={2}
        className="w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none resize-none" />
    </label>
  );
}

function UserIdBadge({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 1800);
    } catch { toast.error("Could not copy"); }
  };
  return (
    <button onClick={copy}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-semibold tracking-widest hover:bg-muted/60"
      title="Copy your User ID">
      <span className="text-muted-foreground font-normal">ID</span>
      <span>{userId || "—"}</span>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
