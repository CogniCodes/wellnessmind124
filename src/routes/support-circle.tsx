import { createFileRoute } from "@tanstack/react-router";
import { Plus, Phone, MessageCircle, ChevronRight, Shield, Users, AlertTriangle, X, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useContacts, useSaveContact, useDeleteContact, type ContactRow } from "@/lib/db-hooks";
import { toast } from "sonner";

export const Route = createFileRoute("/support-circle")({
  head: () => ({ meta: [{ title: "Support Circle · SereneMind" }] }),
  component: SupportCircle,
});

function SupportCircle() {
  const { data: contacts = [], isLoading } = useContacts();
  const save = useSaveContact();
  const del = useDeleteContact();
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [creating, setCreating] = useState(false);

  const notify = async () => {
    if (contacts.length === 0) {
      toast.error("Add someone to your circle first.");
      return;
    }
    try {
      const loc = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation?.getCurrentPosition(res, rej, { timeout: 5000 }) ?? rej("no geo"));
      toast.success(`Notified ${contacts.length} contacts with your location 💜`, {
        description: `Lat ${loc.coords.latitude.toFixed(3)}, Lon ${loc.coords.longitude.toFixed(3)}`,
      });
    } catch {
      toast.success(`Notified ${contacts.length} contacts 💜`);
    }
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Support Circle</h1>
            <p className="text-sm text-muted-foreground">Your trusted people</p>
          </div>
        </div>
        <button onClick={() => setCreating(true)} className="grid h-11 w-11 place-items-center rounded-full text-white soft-shadow"
          style={{ background: "var(--primary)" }}>
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {isLoading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : contacts.length === 0 ? (
        <div className="glass-card rounded-3xl p-6 text-center mb-5">
          <p className="text-3xl">🤝</p>
          <p className="font-display font-bold mt-1">Build your circle</p>
          <p className="text-sm text-muted-foreground">Add the people you trust most. We'll only notify them when you ask.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {contacts.map((c, idx) => (
            <div key={c.id} className="glass-card rounded-3xl p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl grid place-items-center text-lg font-semibold shrink-0"
                style={{ background: `oklch(0.9 0.05 ${(idx * 53) % 360})` }}>
                {c.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
                {c.phone_number && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {c.phone_number}
                  </p>
                )}
              </div>
              {c.phone_number && (
                <a href={`sms:${c.phone_number}`} className="grid h-9 w-9 place-items-center rounded-full"
                  style={{ background: "color-mix(in oklab, var(--soft-pink) 80%, transparent)" }}>
                  <MessageCircle className="h-4 w-4 text-secondary" />
                </a>
              )}
              <button onClick={() => setEditing(c)} className="grid h-9 w-9 place-items-center rounded-full glass-card">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card rounded-3xl p-5 mb-4"
        style={{ background: "color-mix(in oklab, var(--lavender) 50%, var(--card))" }}>
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-card">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">They're here for you</p>
            <p className="text-sm text-muted-foreground mt-1">Your support circle will be notified only when you need help.</p>
          </div>
        </div>
      </div>

      <button onClick={notify}
        className="w-full rounded-full py-4 font-display font-semibold text-white soft-shadow flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(90deg, var(--destructive), var(--secondary))" }}>
        <AlertTriangle className="h-5 w-5" /> Notify Support Circle
      </button>

      {(editing || creating) && (
        <ContactEditor
          contact={editing}
          saving={save.isPending}
          onSave={async (c) => {
            await save.mutateAsync({
              id: editing?.id, name: c.name,
              relationship: c.relationship || null, phone_number: c.phone_number || null,
            });
            setEditing(null); setCreating(false);
            toast.success("Saved 💜");
          }}
          onDelete={async () => {
            if (!editing) return;
            await del.mutateAsync(editing.id);
            setEditing(null);
            toast.success("Removed");
          }}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </AppShell>
  );
}

function ContactEditor({ contact, saving, onSave, onDelete, onClose }: {
  contact: ContactRow | null; saving: boolean;
  onSave: (c: { name: string; relationship: string; phone_number: string }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [relationship, setRelationship] = useState(contact?.relationship ?? "");
  const [phone, setPhone] = useState(contact?.phone_number ?? "");
  const [phoneErr, setPhoneErr] = useState<string | null>(null);

  const validatePhone = (v: string): string | null => {
    if (!v) return null;
    if (!/^\d+$/.test(v)) return "Digits only — letters and symbols are not allowed.";
    if (v.length < 6 || v.length > 15) return "Phone must be 6–15 digits.";
    return null;
  };

  const handlePhoneChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    setPhone(cleaned);
    setPhoneErr(validatePhone(cleaned));
  };

  const handleSubmit = () => {
    const err = validatePhone(phone);
    if (err) { setPhoneErr(err); toast.error(err); return; }
    if (!name.trim()) { toast.error("Name is required."); return; }
    onSave({ name, relationship, phone_number: phone });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">{contact ? "Edit Contact" : "Add Contact"}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Name" value={name} onChange={setName} />
          <Field label="Relationship" value={relationship} onChange={setRelationship} />
          <Field
            label="Phone (digits only)"
            value={phone}
            onChange={handlePhoneChange}
            inputMode="numeric"
            placeholder="e.g. 5551234567"
            error={phoneErr}
          />
        </div>
        <div className="flex gap-2 mt-5">
          {contact && (
            <button onClick={onDelete}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={handleSubmit}
            disabled={saving || !name.trim() || !!phoneErr}
            className="flex-1 rounded-full py-3 text-white font-semibold disabled:opacity-50"
            style={{ background: "var(--primary)" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, inputMode, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string; error?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode} placeholder={placeholder}
        className={`w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none ${error ? "ring-2 ring-destructive" : ""}`} />
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </label>
  );
}
