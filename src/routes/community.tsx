import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search, Heart, MessageSquare, ChevronDown, X, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  usePosts, useCreatePost, useLikePost, useComments, useAddComment, type PostRow,
} from "@/lib/db-hooks";
import { toast } from "sonner";

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
  const { data: posts = [], isLoading } = usePosts();
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"Popular" | "Recent">("Recent");
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const filtered = posts
    .filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === "Popular"
        ? b.likes_count - a.likes_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const submit = async () => {
    if (!draft.trim()) return;
    try {
      await createPost.mutateAsync({
        content: draft.trim(),
        tags: draftTags.length ? draftTags : ["Mental Health"],
      });
      setDraft(""); setDraftTags([]); setShowCreate(false);
      toast.success("Shared anonymously 💗");
    } catch (e) {
      console.error(e); toast.error("Could not post.");
    }
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
        <button onClick={() => setShowCreate(true)}
          className="grid h-11 w-11 place-items-center rounded-full text-white soft-shadow"
          style={{ background: "var(--primary)" }}>
          <Plus className="h-5 w-5" />
        </button>
      </header>

      <div className="flex gap-2 mb-4">
        <div className="glass-card rounded-full px-4 py-2 flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <button onClick={() => setSort(sort === "Popular" ? "Recent" : "Popular")}
          className="glass-card rounded-full px-4 py-2 flex items-center gap-1 text-sm font-medium">
          {sort} <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-3xl mb-2">🌸</p>
          <p className="font-display font-bold">Be the first to share</p>
          <p className="text-sm text-muted-foreground mt-1">No posts yet — your story might help someone today.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <PostCard
              key={p.id}
              post={p}
              index={i}
              onLike={() => likePost.mutate(p)}
              commentsOpen={openComments === p.id}
              toggleComments={() => setOpenComments((c) => (c === p.id ? null : p.id))}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-card rounded-3xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Share anonymously</h3>
              <button onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></button>
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
              placeholder="What's on your mind?"
              className="w-full rounded-2xl bg-muted/40 p-3 text-sm outline-none resize-none" />
            <div className="flex gap-1.5 flex-wrap mt-3">
              {Object.keys(TAG_COLORS).map(t => {
                const active = draftTags.includes(t);
                return (
                  <button key={t}
                    onClick={() => setDraftTags(d => active ? d.filter(x => x !== t) : [...d, t])}
                    className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: active ? `color-mix(in oklab, ${TAG_COLORS[t]} 90%, transparent)` : "var(--muted)" }}>
                    {t}
                  </button>
                );
              })}
            </div>
            <button onClick={submit} disabled={createPost.isPending}
              className="w-full mt-4 rounded-full py-3 text-white font-semibold disabled:opacity-50"
              style={{ background: "var(--primary)" }}>
              {createPost.isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function PostCard({ post, index, onLike, commentsOpen, toggleComments }: {
  post: PostRow; index: number; onLike: () => void;
  commentsOpen: boolean; toggleComments: () => void;
}) {
  return (
    <article className="glass-card rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="grid h-9 w-9 place-items-center rounded-full text-base"
          style={{ background: `color-mix(in oklab, ${AVATAR_TINTS[index % AVATAR_TINTS.length]} 80%, transparent)` }}>
          🌸
        </div>
        <div>
          <p className="text-sm font-semibold">{post.anonymous_name}</p>
          <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>{timeAgo(post.created_at)}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {post.tags.map((t) => (
          <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
            style={{ background: `color-mix(in oklab, ${TAG_COLORS[t] ?? "var(--muted)"} 80%, transparent)` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button onClick={onLike} className="flex items-center gap-1.5">
          <Heart className="h-4 w-4" />
          <span className="text-xs">{post.likes_count}</span>
        </button>
        <button onClick={toggleComments} className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">Comments</span>
        </button>
      </div>
      {commentsOpen && <Comments postId={post.id} />}
    </article>
  );
}

function Comments({ postId }: { postId: string }) {
  const { data: comments = [], isLoading } = useComments(postId);
  const add = useAddComment();
  const [text, setText] = useState("");

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    await add.mutateAsync({ post_id: postId, comment: value });
    setText("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
      {isLoading ? (
        <div className="grid place-items-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Be the first to comment.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="rounded-2xl px-3 py-2 text-sm"
            style={{ background: "color-mix(in oklab, var(--muted) 60%, transparent)" }}>
            <p className="leading-relaxed">{c.comment}</p>
            <p className="text-[10px] text-muted-foreground mt-1" suppressHydrationWarning>{timeAgo(c.created_at)}</p>
          </div>
        ))
      )}
      <div className="flex gap-2 items-center">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Write a kind comment..."
          className="flex-1 rounded-full bg-muted/40 px-3 py-2 text-sm outline-none" />
        <button onClick={submit} disabled={!text.trim() || add.isPending}
          className="grid h-9 w-9 place-items-center rounded-full text-white disabled:opacity-50"
          style={{ background: "var(--primary)" }}>
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
