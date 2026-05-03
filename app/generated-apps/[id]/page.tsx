"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type GeneratedApp = {
  id: string;
  name: string;
  platform: string;
  framework: string;
  status: string;
  summary: string | null;
  build_prompt: string;
  preview_html: string | null;
  preview_type: string | null;
  preview_notes: string | null;
  created_at: string;
  updated_at: string;
};

type GeneratedFile = {
  id: string;
  path: string;
  content: string;
  language: string | null;
  purpose: string | null;
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


function safeDownloadName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "generated-app"
  );
}

export default function GeneratedAppDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = typeof params.id === "string" ? params.id : "";

  const [authLoading, setAuthLoading] = useState(true);
  const [app, setApp] = useState<GeneratedApp | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingBuild, setCheckingBuild] = useState(false);
  const [buildResult, setBuildResult] = useState<{
    success: boolean;
    stage: string;
    output: string;
  } | null>(null);

  const selectedFile = useMemo(() => {
    return files.find((file) => file.id === selectedFileId) || files[0] || null;
  }, [files, selectedFileId]);

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  async function loadGeneratedApp() {
    if (!id) return;

    setLoading(true);

    try {
      const token = await getAccessToken();

      const res = await fetch(`/api/app-builder/apps?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load generated app.");
      }

      setApp(data.app || null);
      setFiles(data.files || []);

      if (data.files?.[0]?.id) {
        setSelectedFileId(data.files[0].id);
      }
    } catch (error) {
      console.error("LOAD GENERATED APP ERROR:", error);
      alert("Could not load generated app. Check terminal logs.");
    } finally {
      setLoading(false);
    }
  }

  async function copySelectedFile() {
    if (!selectedFile) return;

    await navigator.clipboard.writeText(selectedFile.content);
    alert("File copied.");
  }

  async function runBuildCheck() {
    if (!app) return;

    setCheckingBuild(true);
    setBuildResult(null);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/app-builder/build-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          generatedAppId: app.id,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Build check failed.");
      }

      setBuildResult(data.build || null);
    } catch (error) {
      console.error("BUILD CHECK UI ERROR:", error);
      alert(error instanceof Error ? error.message : "Could not run build check.");
    } finally {
      setCheckingBuild(false);
    }
  }

  async function exportZip() {
    if (!app) return;

    try {
      const token = await getAccessToken();

      const res = await fetch(`/api/app-builder/export?id=${app.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Export failed.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeDownloadName(app.name)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("EXPORT ZIP ERROR:", error);
      alert("Could not export ZIP. Check terminal logs.");
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
      await loadGeneratedApp();
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          Loading generated app...
        </div>
      </main>
    );
  }

  if (!app) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <a href="/generated-apps" className="text-yellow-400">
          ← Generated Apps
        </a>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          {loading ? "Loading..." : "Generated app not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 xl:p-6">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <a
              href="/generated-apps"
              className="text-sm text-yellow-400 hover:text-yellow-300"
            >
              ← Generated Apps
            </a>

            <h1 className="mt-3 text-4xl font-bold text-yellow-400">
              {app.name}
            </h1>

            <div className="mt-1 text-sm text-slate-500">
              {app.platform} · {app.framework} · {app.status}
            </div>

            <p className="mt-3 max-w-3xl text-slate-300">
              {app.summary || "No summary."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportZip}
              className="rounded-lg bg-yellow-500 px-4 py-3 text-sm font-bold text-black"
            >
              Export ZIP
            </button>

            <button
              type="button"
              onClick={runBuildCheck}
              disabled={checkingBuild}
              className="rounded-lg border border-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-50"
            >
              {checkingBuild ? "Checking..." : "Build Check"}
            </button>

            <button
              type="button"
              onClick={loadGeneratedApp}
              className="rounded-lg border border-yellow-500 px-4 py-3 text-sm font-semibold text-yellow-400"
            >
              Refresh
            </button>
          </div>
        </div>

        {buildResult && (
          <section
            className={
              buildResult.success
                ? "rounded-xl border border-emerald-800 bg-emerald-950/40 p-4"
                : "rounded-xl border border-red-800 bg-red-950/40 p-4"
            }
          >
            <div className="mb-2 text-sm font-bold">
              {buildResult.success ? "Build passed" : "Build failed"} · {buildResult.stage}
            </div>

            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-200">
              {buildResult.output || "No build output."}
            </pre>
          </section>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 xl:max-h-[78vh] xl:overflow-y-auto">
            <div className="mb-3 text-sm font-semibold text-slate-200">
              Files
            </div>

            <div className="space-y-2">
              {files.length === 0 && (
                <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-400">
                  No files found yet.
                </div>
              )}

              {files.map((file) => {
                const active = file.id === selectedFile?.id;

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedFileId(file.id)}
                    className={
                      active
                        ? "w-full rounded-lg border border-yellow-500 bg-yellow-500/10 p-3 text-left"
                        : "w-full rounded-lg border border-slate-800 bg-slate-800 p-3 text-left hover:bg-slate-700"
                    }
                  >
                    <div className="break-words text-sm font-semibold text-slate-100">
                      {file.path}
                    </div>

                    {file.purpose && (
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {file.purpose}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-200">
                  Preview
                </div>

                <div className="text-xs text-slate-500">
                  {app.preview_type || "none"}
                </div>
              </div>

              {app.preview_html ? (
                <iframe
                  title={`${app.name} preview`}
                  srcDoc={app.preview_html}
                  sandbox="allow-scripts allow-forms"
                  className="h-[620px] w-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <div className="flex h-[620px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-slate-500">
                  No preview was generated for this app.
                </div>
              )}

              {app.preview_notes && (
                <div className="mt-3 text-xs leading-5 text-slate-500">
                  {app.preview_notes}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Code
                  </div>

                  <div className="break-words text-xs text-slate-500">
                    {selectedFile?.path || "No file selected"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copySelectedFile}
                  disabled={!selectedFile}
                  className="rounded-lg bg-yellow-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                >
                  Copy
                </button>
              </div>

              {selectedFile ? (
                <pre className="h-[620px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  <code>{selectedFile.content}</code>
                </pre>
              ) : (
                <div className="flex h-[620px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-6 text-slate-500">
                  Select a file.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
