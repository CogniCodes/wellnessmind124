import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Heart, MessageSquare, Bookmark, MoreHorizontal, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePersistent } from "@/lib/store";
import type { Post } from "@/lib/store";
import { SEED_POSTS } from "@/lib/seed";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Secret Space · SereneMind" }] }),
  component: Community,
});

const TAG_COLORS: Record<string, string> = {
  Anxiety: "var(--soft-pink)",
  Depression: "var(--soft-sky)",
  Motivation: "var(--soft-mint)",
  "Seeking Advice": "var(--lavender)",
  "Mental Health": "var(--soft-peach)",
};

const AVATAR_TINTS = ["var(--soft-pink)", "var(--lavender)", "var(--soft-peach)", "var(--soft-sky)", "var(--soft-mint)"];

function Community() {
  const [posts, setPosts] = usePersistent<Post[]>("sm.posts", SEED_POSTS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"Popular" | "Recent">("Popular");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);

  const filtered = posts
    .filter((p) => p.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "Popular" ? b.likes - a.likes : new Date(b.at).getTime() - new Date(a.at).getTime());

  const toggleLike = (id: string) => setPosts(p => p.map(x => x.id === id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x));
  const toggleSave = (id: string) => setPosts(p => p.map(x => x.id === id ? { ...x, saved: !x.saved } : x));

  const createPost = () => {
    if (!draft.trim()) return;
    setPosts(p => [{
      id: crypto.randomUUID(), body: draft.trim(), tags: draftTags.length ? draftTags : ["Mental Health"],
      emoji: "🌸", at: new Date().toISOString(), likes: 0, comments: 0, liked: false, saved: false,
    }, ...p]);
    setDraft(""); setDraftTags([]); setShowCreate(false);
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between py-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            Secret Space <span>💗</span>
          </h1>
          <p className="text-sm text-muted-foreground">A safe space to share and connect</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="grid h-11 w-11 place-items-center rounded-full text-white soft-shadow"
          style={{ background: "var(--primary)" }}>
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="flex gap-2 mb-4">
        <div className="glass-card rounded-full px-4 py-2 flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button onClick={() => setSort(sort === "Popular" ? "Recent" : "Popular")}
          className="glass-card rounded-full px-4 py-2 flex items-center gap-1 text-sm font-medium">
          {sort} <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => (
          <article key={p.id} className="glass-card rounded-3xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full text-base"
                  style={{ background: `color-mix(in oklab, ${AVATAR_TINTS[i % AVATAR_TINTS.length]} 80%, transparent)` }}>
                  {p.emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1">Anonymous <span>{p.emoji}</span></p>
                  <p className="text-[11px] text-muted-foreground">{timeAgo(p.at)}</p>
                </div>
              </div>
              <button><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <p className="text-sm leading-relaxed mb-3">{p.body}</p>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {p.tags.map(t => (
                <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `color-mix(in oklab, ${TAG_COLORS[t] ?? "var(--muted)"} 80%, transparent)`, color: "var(--foreground)" }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(p.id)} className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" fill={p.liked ? "var(--secondary)" : "none"} color={p.liked ? "var(--secondary)" : "currentColor"} />
                  <span className="text-xs">{p.likes}</span>
                </button>
                <button className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{p.comments}</span>
                </button>
              </div>
              <button onClick={() => toggleSave(p.id)}>
                <Bookmark className="h-4 w-4" fill={p.saved ? "var(--primary)" : "none"} color={p.saved ? "var(--primary)" : "currentColor"} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card rounded-3xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Share anonymously</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></button>
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
              placeholder="What's on your mind?" className="w-full rounded-2xl bg-muted/40 p-3 text-sm outline-none resize-none" />
            <div className="flex gap-1.5 flex-wrap mt-3">
              {Object.keys(TAG_COLORS).map(t => {
                const active = draftTags.includes(t);
                return (
                  <button key={t} onClick={() => setDraftTags(d => active ? d.filter(x => x !== t) : [...d, t])}
                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: active ? `color-mix(in oklab, ${TAG_COLORS[t]} 90%, transparent)` : "var(--muted)" }}>
                    {t}
                  </button>
                );
              })}
            </div>
            <button onClick={createPost} className="w-full mt-4 rounded-full py-3 text-white font-semibold"
              style={{ background: "var(--primary)" }}>Post</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
