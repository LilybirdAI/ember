"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type GeneratedApp = {
  id: string;
  name: string;
  platform: string;
  framework: string;
  status: string;
  summary: string | null;
  preview_type: string | null;
  preview_notes: string | null;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  name: string;
  type: string;
};

async function parseJsonResponse(res: Response) {
  const rawText = await res.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `API returned non-JSON response. Status: ${res.status}. Body: ${rawText.slice(
        0,
        500
      )}`
    );
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GeneratedAppsPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [apps, setApps] = useState<GeneratedApp[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("unknown");
  const [framework, setFramework] = useState("unknown");
  const [projectId, setProjectId] = useState("");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function loadApps() {
    setLoading(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/app-builder/apps", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load generated apps.");
      }

      setApps(data.apps || []);
    } catch (error) {
      console.error("LOAD GENERATED APPS ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const token = await getAccessToken();

      const res = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load projects.");
      }

      setProjects(data.projects || []);
    } catch (error) {
      console.error("LOAD PROJECTS ERROR:", error);
    }
  }

  async function generateApp() {
    if (!prompt.trim()) {
      alert("Describe the app you want Embr to create.");
      return;
    }

    setGenerating(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/app-builder/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          platform,
          framework,
          projectId: projectId || null,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.output || data.error || "Failed to generate app.");
      }

      const id = data.generatedApp?.id;

      if (!id) {
        throw new Error("Generated app id was missing.");
      }

      router.push(`/generated-apps/${id}`);
    } catch (error) {
      console.error("GENERATE APP ERROR:", error);
      alert(error instanceof Error ? error.message : "Could not generate app.");
    } finally {
      setGenerating(false);
      await loadApps();
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabaseBrowser.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setAuthLoading(false);
      await Promise.all([loadApps(), loadProjects()]);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          Loading generated apps...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 xl:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <a href="/" className="text-sm text-yellow-400 hover:text-yellow-300">
              ← Back to Embr
            </a>

            <h1 className="mt-3 text-4xl font-bold text-yellow-400">
              Generated Apps
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Create app starters from prompts. Embr saves the files, organizes the project, and creates a preview when possible.
            </p>
          </div>

          <button
            type="button"
            onClick={loadApps}
            disabled={loading}
            className="rounded-lg border border-yellow-500 px-4 py-3 text-sm font-semibold text-yellow-400 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold">Create an App</h2>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
            placeholder="Example: Build me a simple CRM for a small cleaning business with lead capture, customer list, job notes, and dashboard."
          />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
            >
              <option value="unknown">Auto platform</option>
              <option value="web">Web</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
              <option value="cross_platform">Cross-platform</option>
              <option value="business_tool">Business tool</option>
            </select>

            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
            >
              <option value="unknown">Auto framework</option>
              <option value="Next.js">Next.js</option>
              <option value="SwiftUI">SwiftUI</option>
              <option value="Flutter">Flutter</option>
              <option value="HTML">HTML</option>
            </select>

            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
            >
              <option value="">No active project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={generateApp}
              disabled={generating}
              className="rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-50"
            >
              {generating ? "Creating..." : "Create App"}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {apps.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
              No generated apps yet.
            </div>
          )}

          {apps.map((app) => (
            <a
              key={app.id}
              href={`/generated-apps/${app.id}`}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 hover:border-yellow-500/60"
            >
              <div className="text-xl font-bold text-yellow-400">{app.name}</div>

              <div className="mt-1 text-sm text-slate-500">
                {app.platform} · {app.framework} · {app.status}
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                {app.summary || "No summary."}
              </p>

              <div className="mt-4 text-xs text-slate-500">
                Updated {formatDate(app.updated_at)}
              </div>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}
