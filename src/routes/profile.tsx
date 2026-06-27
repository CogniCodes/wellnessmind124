import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { User, LogOut, Moon, Sun, Bell, Lock, Sparkles, Copy, Check, Camera, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import { useVisitor, type ProfileUpdate } from "@/lib/visitor";
import { useMoods, useSymptoms } from "@/lib/db-hooks";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SereneMind" }] }),
  component: Profile,
});

const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type SectionKey = "name" | "personal" | "health" | "medical";

function Profile() {
  const router = useRouter();
  const { visitor, updateProfile, signOut } = useVisitor();
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [editing, setEditing] = useState<SectionKey | null>(null);
  const [pendingSave, setPendingSave] = useState<{ section: SectionKey; patch: ProfileUpdate } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const startEdit = (s: SectionKey) => setEditing(s);
  const cancelEdit = () => setEditing(null);

  const requestSave = (section: SectionKey, patch: ProfileUpdate) => {
    setPendingSave({ section, patch });
  };

  const confirmSave = async () => {
    if (!pendingSave) return;
    setSaving(true);
    try {
      await updateProfile(pendingSave.patch);
      toast.success("Changes saved 💜");
      setEditing(null);
      setPendingSave(null);
    } catch (e) {
      console.error(e);
      toast.error("Could not save. Try again.");
    } finally { setSaving(false); }
  };

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

      {/* Header card with avatar and name */}
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

      {/* Name section */}
      <SectionCard
        title="Display name"
        editing={editing === "name"}
        onEdit={() => startEdit("name")}
        onCancel={cancelEdit}
      >
        {editing === "name" ? (
          <NameEditor
            initial={visitor?.name ?? ""}
            onCancel={cancelEdit}
            onSave={(name) => requestSave("name", { name })}
          />
        ) : (
          <ReadRow label="Name" value={visitor?.name ?? "—"} />
        )}
      </SectionCard>

      {/* Personal */}
      <SectionCard
        title="Personal details"
        editing={editing === "personal"}
        onEdit={() => startEdit("personal")}
        onCancel={cancelEdit}
      >
        {editing === "personal" ? (
          <PersonalEditor
            initial={{
              dob: visitor?.dob ?? "",
              gender: visitor?.gender ?? "",
              bloodGroup: visitor?.blood_group ?? "",
              contact: visitor?.contact_number ?? "",
            }}
            onCancel={cancelEdit}
            onSave={(p) => requestSave("personal", {
              dob: p.dob || null,
              gender: p.gender || null,
              blood_group: p.bloodGroup || null,
              contact_number: p.contact || null,
            })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ReadRow label="Date of birth" value={visitor?.dob ?? "—"} />
            <ReadRow label="Gender" value={visitor?.gender ?? "—"} />
            <ReadRow label="Blood group" value={visitor?.blood_group ?? "—"} />
            <ReadRow label="Contact" value={visitor?.contact_number ?? "—"} />
          </div>
        )}
      </SectionCard>

      {/* Health */}
      <SectionCard
        title="Body measurements"
        editing={editing === "health"}
        onEdit={() => startEdit("health")}
        onCancel={cancelEdit}
      >
        {editing === "health" ? (
          <HealthEditor
            initial={{
              height: visitor?.height_cm != null ? String(visitor.height_cm) : "",
              weight: visitor?.weight_kg != null ? String(visitor.weight_kg) : "",
            }}
            onCancel={cancelEdit}
            onSave={(p) => requestSave("health", {
              height_cm: p.height ? Number(p.height) : null,
              weight_kg: p.weight ? Number(p.weight) : null,
            })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <ReadRow label="Height" value={visitor?.height_cm != null ? `${visitor.height_cm} cm` : "—"} />
            <ReadRow label="Weight" value={visitor?.weight_kg != null ? `${visitor.weight_kg} kg` : "—"} />
          </div>
        )}
      </SectionCard>

      {/* Medical */}
      <SectionCard
        title="Medical"
        editing={editing === "medical"}
        onEdit={() => startEdit("medical")}
        onCancel={cancelEdit}
      >
        {editing === "medical" ? (
          <MedicalEditor
            initial={{
              medications: visitor?.medications ?? "",
              allergies: visitor?.allergies ?? "",
            }}
            onCancel={cancelEdit}
            onSave={(p) => requestSave("medical", {
              medications: p.medications.trim() || null,
              allergies: p.allergies.trim() || null,
            })}
          />
        ) : (
          <div className="space-y-3">
            <ReadRow label="Current medications" value={visitor?.medications ?? "—"} multiline />
            <ReadRow label="Allergies" value={visitor?.allergies ?? "—"} multiline />
          </div>
        )}
      </SectionCard>

      <div className="glass-card rounded-3xl p-2 mt-4">
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
        onClick={() => setLogoutOpen(true)}
        className="w-full mt-4 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
        <LogOut className="h-4 w-4" /> Log Out
      </button>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of this device?</AlertDialogTitle>
            <AlertDialogDescription>
              Save your <strong>User ID</strong> first — you'll need it to sign back in. Your data stays linked to your User ID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { signOut(); toast.success("Signed out"); router.navigate({ to: "/" }); }}
              className="bg-destructive text-white hover:bg-destructive/90">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save confirmation */}
      <AlertDialog open={!!pendingSave} onOpenChange={(o) => { if (!o && !saving) setPendingSave(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes to your profile?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave} disabled={saving}
              className="bg-primary text-white hover:bg-primary/90">
              {saving ? "Saving…" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </AppShell>
  );
}

function SectionCard({ title, editing, onEdit, onCancel, children }: {
  title: string; editing: boolean; onEdit: () => void; onCancel: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-3xl p-5 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-base">{title}</h3>
        {editing ? (
          <button onClick={onCancel} aria-label="Cancel edit"
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/50 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={onEdit} aria-label={`Edit ${title}`}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/50 hover:bg-muted text-primary">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ReadRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`text-sm mt-0.5 ${multiline ? "whitespace-pre-line" : "truncate"}`}>{value || "—"}</p>
    </div>
  );
}

function EditActions({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 mt-3 justify-end">
      <button onClick={onCancel}
        className="rounded-full px-4 py-2 text-sm font-medium bg-muted/60 hover:bg-muted">
        Cancel
      </button>
      <button onClick={onSave} disabled={disabled}
        className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "var(--primary)" }}>
        Save
      </button>
    </div>
  );
}

function NameEditor({ initial, onCancel, onSave }: { initial: string; onCancel: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial);
  const error = name.trim() ? "" : "Name is required";
  return (
    <div>
      <Field label="Name" value={name} onChange={setName} error={error} />
      <EditActions onCancel={onCancel} onSave={() => onSave(name.trim())} disabled={!!error} />
    </div>
  );
}

function PersonalEditor({ initial, onCancel, onSave }: {
  initial: { dob: string; gender: string; bloodGroup: string; contact: string };
  onCancel: () => void;
  onSave: (p: { dob: string; gender: string; bloodGroup: string; contact: string }) => void;
}) {
  const [dob, setDob] = useState(initial.dob);
  const [gender, setGender] = useState(initial.gender);
  const [bloodGroup, setBloodGroup] = useState(initial.bloodGroup);
  const [contact, setContact] = useState(initial.contact);
  const contactErr = contact && !/^\d{6,15}$/.test(contact) ? "Digits only (6–15)" : "";
  const canSave = !contactErr;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth" type="date" value={dob} onChange={setDob} />
        <SelectField label="Gender" value={gender} onChange={setGender} options={GENDERS} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Blood group" value={bloodGroup} onChange={setBloodGroup} options={BLOOD} />
        <Field label="Contact number" value={contact}
          onChange={(v) => setContact(v.replace(/\D/g, ""))}
          inputMode="numeric" placeholder="Digits only" error={contactErr} />
      </div>
      <EditActions onCancel={onCancel} onSave={() => onSave({ dob, gender, bloodGroup, contact })} disabled={!canSave} />
    </div>
  );
}

function HealthEditor({ initial, onCancel, onSave }: {
  initial: { height: string; weight: string };
  onCancel: () => void;
  onSave: (p: { height: string; weight: string }) => void;
}) {
  const [height, setHeight] = useState(initial.height);
  const [weight, setWeight] = useState(initial.weight);
  const heightErr = height && (!/^\d+(\.\d+)?$/.test(height) || Number(height) <= 0 || Number(height) > 272) ? "Enter cm (1–272)" : "";
  const weightErr = weight && (!/^\d+(\.\d+)?$/.test(weight) || Number(weight) <= 0 || Number(weight) > 500) ? "Enter kg (1–500)" : "";
  const canSave = !heightErr && !weightErr;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Height (cm)" value={height}
          onChange={(v) => setHeight(v.replace(/[^\d.]/g, ""))}
          inputMode="decimal" error={heightErr} />
        <Field label="Weight (kg)" value={weight}
          onChange={(v) => setWeight(v.replace(/[^\d.]/g, ""))}
          inputMode="decimal" error={weightErr} />
      </div>
      <EditActions onCancel={onCancel} onSave={() => onSave({ height, weight })} disabled={!canSave} />
    </div>
  );
}

function MedicalEditor({ initial, onCancel, onSave }: {
  initial: { medications: string; allergies: string };
  onCancel: () => void;
  onSave: (p: { medications: string; allergies: string }) => void;
}) {
  const [medications, setMedications] = useState(initial.medications);
  const [allergies, setAllergies] = useState(initial.allergies);
  return (
    <div className="space-y-3">
      <TextareaField label="Current medications" value={medications} onChange={setMedications}
        placeholder="e.g. Vitamin D, 1000 IU once daily" />
      <TextareaField label="Allergies" value={allergies} onChange={setAllergies}
        placeholder="e.g. Peanuts, penicillin" />
      <EditActions onCancel={onCancel} onSave={() => onSave({ medications, allergies })} />
    </div>
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
    <label className="block min-w-0">
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
    <label className="block min-w-0">
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
        placeholder={placeholder} rows={3}
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
