"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type TaskStatus = "open" | "in_progress" | "blocked" | "done";

type Task = {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type ShipPathPanelProps = {
  projectId: string | null;
  projectName: string | null;
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

function statusLabel(status: TaskStatus) {
  return statusOptions.find((item) => item.value === status)?.label || status;
}

export default function ShipPathPanel({
  projectId,
  projectName,
}: ShipPathPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(3);

  const groupedTasks = useMemo(() => {
    return statusOptions.map((status) => ({
      ...status,
      tasks: tasks.filter((task) => task.status === status.value),
    }));
  }, [tasks]);

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      window.location.href = "/login";
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function loadTasks() {
    if (!projectId) {
      setTasks([]);
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessToken();

      const res = await fetch(`/api/tasks?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load tasks.");
      }

      setTasks(data.tasks || []);
    } catch (error) {
      console.error("LOAD TASKS ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask() {
    if (!projectId) {
      alert("Select a project first.");
      return;
    }

    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          priority,
          status: "open",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create task.");
      }

      setTitle("");
      setPriority(3);
      await loadTasks();
    } catch (error) {
      console.error("CREATE TASK ERROR:", error);
      alert("Could not create task. Check terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(id: string, status: TaskStatus) {
    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update task.");
      }

      await loadTasks();
    } catch (error) {
      console.error("UPDATE TASK ERROR:", error);
      alert("Could not update task. Check terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id: string) {
    const confirmed = window.confirm("Delete this task?");

    if (!confirmed) return;

    setSaving(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete task.");
      }

      await loadTasks();
    } catch (error) {
      console.error("DELETE TASK ERROR:", error);
      alert("Could not delete task. Check terminal logs.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-200">
            Ship Path
          </div>

          <div className="text-xs text-slate-500">
            {projectName ? projectName : "Select a project"}
          </div>
        </div>

        <button
          type="button"
          onClick={loadTasks}
          disabled={loading || !projectId}
          className="text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-40"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {!projectId ? (
        <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-400">
          Select or create a project to build its Ship Path.
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createTask();
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm outline-none"
              placeholder="Add next task..."
            />

            <div className="flex gap-2">
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm outline-none"
              >
                <option value={5}>Priority 5</option>
                <option value={4}>Priority 4</option>
                <option value={3}>Priority 3</option>
                <option value={2}>Priority 2</option>
                <option value={1}>Priority 1</option>
              </select>

              <button
                type="button"
                onClick={createTask}
                disabled={saving}
                className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {groupedTasks.map((group) => (
              <div key={group.value}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-slate-500">
                    {group.label}
                  </div>

                  <div className="text-xs text-slate-600">
                    {group.tasks.length}
                  </div>
                </div>

                <div className="space-y-2">
                  {group.tasks.length === 0 && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-600">
                      No tasks.
                    </div>
                  )}

                  {group.tasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                    >
                      <div className="mb-2 text-sm font-semibold text-slate-100">
                        {task.title}
                      </div>

                      <div className="mb-3 text-xs text-slate-500">
                        Priority {task.priority} · {statusLabel(task.status)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.value as TaskStatus)
                          }
                          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs outline-none"
                        >
                          {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          className="rounded-lg bg-red-950 px-2 py-2 text-xs text-red-300 hover:bg-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
