import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Plus, ChevronRight, Heart, Shield, Pill, FileText, Activity, Trash2, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useMedical, useSaveMedical, useDeleteMedical, type MedicalRow } from "@/lib/db-hooks";
import { toast } from "sonner";

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

function Medical() {
  const { data: items = [], isLoading } = useMedical();
  const save = useSaveMedical();
  const del = useDeleteMedical();
  const [editing, setEditing] = useState<{ key: SectionKey; item?: MedicalRow } | null>(null);

  const grouped = SECTIONS.reduce<Record<SectionKey, MedicalRow[]>>((acc, s) => {
    acc[s.key] = items.filter((i) => i.category === s.key);
    return acc;
  }, { chronic: [], allergies: [], illnesses: [], medications: [], notes: [] });

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

      {isLoading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map((s) => {
            const list = grouped[s.key];
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
                  <button onClick={() => setEditing({ key: s.key })}
                    className="text-primary text-xs font-medium">+ Add</button>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No items added yet</p>
                ) : (
                  <div className="space-y-2">
                    {list.map((item) => (
                      <button key={item.id} onClick={() => setEditing({ key: s.key, item })}
                        className="w-full flex items-center justify-between py-1.5 text-left">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Editor
          section={editing.key}
          item={editing.item}
          saving={save.isPending}
          onSave={async (it) => {
            await save.mutateAsync({
              id: editing.item?.id, category: editing.key,
              title: it.title, description: it.description || null,
            });
            setEditing(null);
            toast.success("Saved");
          }}
          onDelete={editing.item ? async () => {
            await del.mutateAsync(editing.item!.id);
            setEditing(null);
            toast.success("Removed");
          } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

function Editor({ section, item, saving, onSave, onDelete, onClose }: {
  section: SectionKey;
  item?: MedicalRow;
  saving: boolean;
  onSave: (i: { title: string; description: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="glass-card rounded-3xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">{item ? "Edit" : "Add"} {SECTIONS.find((s) => s.key === section)?.title}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Title" value={title} onChange={setTitle} />
          <Field label="Detail" value={description} onChange={setDescription} />
        </div>
        <div className="flex gap-2 mt-5">
          {onDelete && (
            <button onClick={onDelete} className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => onSave({ title, description })}
            disabled={saving || !title.trim()}
            className="flex-1 rounded-full py-3 text-white font-semibold disabled:opacity-50"
            style={{ background: "var(--primary)" }}>
            {saving ? "Saving..." : "Save"}
          </button>
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
