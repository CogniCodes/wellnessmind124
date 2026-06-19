import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Plus, ChevronRight, Heart, Shield, Pill, FileText, Activity, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { usePersistent } from "@/lib/store";
import type { MedicalItem } from "@/lib/store";
import { SEED_MEDICAL } from "@/lib/seed";

export const Route = createFileRoute("/medical")({
  head: () => ({ meta: [{ title: "Past Medical History · SereneMind" }] }),
  component: Medical,
});

type SectionKey = "chronic" | "allergies" | "illnesses" | "medications" | "notes";

const SECTIONS: { key: SectionKey; title: string; icon: any; tint: string }[] = [
  { key: "chronic", title: "Chronic Conditions", icon: Heart, tint: "var(--soft-pink)" },
  { key: "allergies", title: "Allergies", icon: Shield, tint: "var(--lavender)" },
  { key: "illnesses", title: "Past Illnesses", icon: Activity, tint: "var(--soft-mint)" },
  { key: "medications", title: "Current Medications", icon: Pill, tint: "var(--soft-peach)" },
  { key: "notes", title: "Medical Notes", icon: FileText, tint: "var(--soft-sky)" },
];

const ALLERGY_TINTS: Record<string, string> = {
  Mild: "var(--success)", Moderate: "var(--warning)", Severe: "var(--destructive)",
};

function Medical() {
  const [data, setData] = usePersistent<Record<string, MedicalItem[]>>("sm.medical", SEED_MEDICAL);
  const [editing, setEditing] = useState<{ key: SectionKey; item?: MedicalItem } | null>(null);

  const saveItem = (key: SectionKey, item: MedicalItem) => {
    setData(prev => {
      const list = prev[key] ?? [];
      const exists = list.some(x => x.id === item.id);
      return { ...prev, [key]: exists ? list.map(x => x.id === item.id ? item : x) : [...list, { ...item, id: item.id || crypto.randomUUID() }] };
    });
    setEditing(null);
  };
  const removeItem = (key: SectionKey, id: string) => {
    setData(prev => ({ ...prev, [key]: (prev[key] ?? []).filter(x => x.id !== id) }));
    setEditing(null);
  };

  return (
    <AppShell>
      <PageHeader title="Past Medical History" subtitle="Your health records at a glance"
        icon={<HeartPulse className="h-5 w-5 text-primary" />}
        right={
          <button onClick={() => setEditing({ key: "chronic" })}
            className="grid h-11 w-11 place-items-center rounded-full text-white soft-shadow"
            style={{ background: "var(--primary)" }}>
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const items = data[s.key] ?? [];
          return (
            <div key={s.key} className="glass-card rounded-3xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl"
                    style={{ background: `color-mix(in oklab, ${s.tint} 70%, transparent)` }}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <p className="font-display font-bold">{s.title}</p>
                </div>
                <button onClick={() => setEditing({ key: s.key })} className="text-primary text-xs font-medium">+ Add</button>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground">No items added yet</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <button key={item.id} onClick={() => setEditing({ key: s.key, item })}
                      className="w-full flex items-center justify-between py-1.5 text-left">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.tag && (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: `color-mix(in oklab, ${ALLERGY_TINTS[item.tag] ?? "var(--muted)"} 40%, transparent)` }}>
                            {item.tag}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <Editor
          section={editing.key}
          item={editing.item}
          onSave={(it) => saveItem(editing.key, it)}
          onDelete={editing.item ? () => removeItem(editing.key, editing.item!.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

function Editor({ section, item, onSave, onDelete, onClose }: {
  section: SectionKey;
  item?: MedicalItem;
  onSave: (i: MedicalItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [detail, setDetail] = useState(item?.detail ?? "");
  const [tag, setTag] = useState(item?.tag ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">{item ? "Edit" : "Add"} {SECTIONS.find(s => s.key === section)?.title}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Detail" value={detail} onChange={setDetail} />
          {section === "allergies" && (
            <div className="flex gap-2">
              {["Mild", "Moderate", "Severe"].map(t => (
                <button key={t} onClick={() => setTag(t)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium"
                  style={{ background: tag === t ? `color-mix(in oklab, ${ALLERGY_TINTS[t]} 50%, transparent)` : "var(--muted)" }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          {onDelete && (
            <button onClick={onDelete} className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onSave({ id: item?.id ?? "", title, detail, tag: tag || undefined })}
            className="flex-1 rounded-full py-3 text-white font-semibold" style={{ background: "var(--primary)" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none" />
    </label>
  );
}
