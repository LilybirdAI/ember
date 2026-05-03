"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Memory = {
  id: string;
  category: string;
  content: string;
  importance: number;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export default function MemoryPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [category, setCategory] = useState("general");
  const [source, setSource] = useState("manual");
  const [importance, setImportance] = useState(3);
  const [content, setContent] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("general");
  const [editSource, setEditSource] = useState("manual");
  const [editImportance, setEditImportance] = useState(3);
  const [editContent, setEditContent] = useState("");

  const categories = useMemo(() => {
    const unique = new Set(memories.map((memory) => memory.category));
    return ["all", ...Array.from(unique).sort()];
  }, [memories]);

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function loadMemories() {
    setLoading(true);

    try {
      const token = await getAccessToken();

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      const queryString = params.toString();
      const url = queryString ? `/api/memories?${queryString}` : "/api/memories";

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load memories.");
      }

      setMemories(data.memories || []);
    } catch (error) {
      console.error("LOAD MEMORIES ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createMemory() {
    if (!content.trim()) {
      alert("Memory content is required.");
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          source,
          importance,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create memory.");
      }

      setCategory("general");
      setSource("manual");
      setImportance(3);
      setContent("");

      await loadMemories();
    } catch (error) {
      console.error("CREATE MEMORY ERROR:", error);
      alert("Could not create memory. Check your terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(memory: Memory) {
    setEditingId(memory.id);
    setEditCategory(memory.category);
    setEditSource(memory.source || "manual");
    setEditImportance(memory.importance);
    setEditContent(memory.content);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditCategory("general");
    setEditSource("manual");
    setEditImportance(3);
    setEditContent("");
  }

  async function saveEdit() {
    if (!editingId) return;

    if (!editContent.trim()) {
      alert("Memory content cannot be empty.");
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/memories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingId,
          category: editCategory,
          source: editSource,
          importance: editImportance,
          content: editContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update memory.");
      }

      cancelEditing();
      await loadMemories();
    } catch (error) {
      console.error("UPDATE MEMORY ERROR:", error);
      alert("Could not update memory. Check your terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMemory(id: string) {
    const confirmed = window.confirm("Delete this memory?");

    if (!confirmed) return;

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/memories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete memory.");
      }

      if (editingId === id) {
        cancelEditing();
      }

      await loadMemories();
    } catch (error) {
      console.error("DELETE MEMORY ERROR:", error);
      alert("Could not delete memory. Check your terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function initAuth() {
      const { data } = await supabaseBrowser.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUserEmail(data.session.user.email || null);
      setAuthLoading(false);
      await loadMemories();
    }

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Embr</h1>
          <p className="text-slate-400">Loading memory manager...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <a href="/" className="text-sm text-yellow-400 hover:text-yellow-300">
              ← Back to Embr
            </a>

            <h1 className="text-4xl font-bold mt-4 text-yellow-400">
              Embr Memory Manager
            </h1>

            <p className="text-slate-400 mt-2">
              View, add, edit, and delete what Embr remembrs.
            </p>

            <p className="text-xs text-slate-500 mt-2">
              Signed in as {userEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={loadMemories}
            disabled={loading}
            className="rounded-lg border border-yellow-500 px-4 py-3 text-yellow-400 font-semibold disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-semibold mb-4">Add Memory</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
              placeholder="category"
            />

            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
              placeholder="source"
            />

            <select
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
            >
              <option value={1}>Importance 1</option>
              <option value={2}>Importance 2</option>
              <option value={3}>Importance 3</option>
              <option value={4}>Importance 4</option>
              <option value={5}>Importance 5</option>
            </select>

            <button
              type="button"
              onClick={createMemory}
              disabled={saving}
              className="rounded-lg bg-yellow-500 text-black px-4 py-3 font-bold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Memory"}
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-28 rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
            placeholder="Example: Matt wants to visit Georgia after getting his passport."
          />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadMemories();
              }}
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
              placeholder="Search memories..."
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={loadMemories}
              disabled={loading}
              className="rounded-lg border border-yellow-500 px-4 py-3 text-yellow-400 font-semibold disabled:opacity-50"
            >
              Search
            </button>
          </div>

          <div className="space-y-4">
            {memories.length === 0 && (
              <div className="rounded-xl bg-slate-800 p-4 text-slate-400">
                No memories found.
              </div>
            )}

            {memories.map((memory) => {
              const isEditing = editingId === memory.id;

              return (
                <article
                  key={memory.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  {!isEditing ? (
                    <>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-yellow-400">
                            {memory.category}
                          </span>

                          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">
                            importance {memory.importance}
                          </span>

                          <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">
                            {memory.source || "manual"}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(memory)}
                            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteMemory(memory.id)}
                            className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300 hover:bg-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p className="whitespace-pre-wrap leading-7 text-slate-100">
                        {memory.content}
                      </p>

                      <div className="mt-3 text-xs text-slate-500">
                        Updated: {new Date(memory.updated_at).toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
                          placeholder="category"
                        />

                        <input
                          value={editSource}
                          onChange={(e) => setEditSource(e.target.value)}
                          className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
                          placeholder="source"
                        />

                        <select
                          value={editImportance}
                          onChange={(e) =>
                            setEditImportance(Number(e.target.value))
                          }
                          className="rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
                        >
                          <option value={1}>Importance 1</option>
                          <option value={2}>Importance 2</option>
                          <option value={3}>Importance 3</option>
                          <option value={4}>Importance 4</option>
                          <option value={5}>Importance 5</option>
                        </select>
                      </div>

                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full min-h-32 rounded-lg bg-slate-800 border border-slate-700 p-3 outline-none"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving}
                          className="rounded-lg bg-yellow-500 text-black px-4 py-3 font-bold disabled:opacity-50"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-lg bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMemory(memory.id)}
                          className="rounded-lg bg-red-950 px-4 py-3 font-semibold text-red-300 hover:bg-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
