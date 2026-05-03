"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imagePreviews?: string[];
};

type SelectedImage = {
  id: string;
  file: File;
  preview: string;
};

type ProjectType =
  | "website"
  | "ios_app"
  | "android_app"
  | "full_stack_app"
  | "content"
  | "general";

type AIMode = "auto" | "light" | "heavy";

type Conversation = {
  id: string;
  title: string;
  project_type: ProjectType;
  project_id: string | null;
  created_at: string;
  updated_at: string;
};

type Project = {
  id: string;
  name: string;
  type: ProjectType;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type UsageStatus = {
  used: number;
  limit: number;
  remaining: number;
};

const projectTypes: ProjectType[] = [
  "general",
  "website",
  "ios_app",
  "android_app",
  "full_stack_app",
  "content",
];

function isProjectType(value: unknown): value is ProjectType {
  return typeof value === "string" && projectTypes.includes(value as ProjectType);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
}

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        resolve(result);
        return;
      }

      reject(new Error("Failed to read image."));
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFriendlyErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Embr hit an unexpected error. Try again.";
  }

  const message = error.message;
  const lower = message.toLowerCase();

  if (lower.includes("not logged in")) {
    return "Your session expired. Please log back in.";
  }

  if (lower.includes("monthly") || message.includes("429")) {
    return "You’ve reached your monthly usage limit. Check your plan or try again after reset.";
  }

  if (lower.includes("project not found")) {
    return "That project could not be found. Reselect the project and try again.";
  }

  if (lower.includes("non-json")) {
    return "Embr’s server returned an invalid response. Check the terminal logs.";
  }

  if (lower.includes("image")) {
    return "Embr had trouble reading that image. Try a smaller PNG, JPEG, or WebP.";
  }

  if (lower.includes("api error")) {
    return "Embr’s API hit an error. Check the terminal logs and try again.";
  }

  return message || "Embr hit an error. Try again.";
}

export default function EmbrPage() {
  const router = useRouter();
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectType>("general");
  const [aiMode, setAiMode] = useState<AIMode>("auto");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState<ProjectType>("general");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showProjectTools, setShowProjectTools] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Embr is ready. Tell me what you want to build.",
    },
  ]);

  const activeProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const visibleConversations = useMemo(() => {
    if (!selectedProjectId) return conversations;

    return conversations.filter(
      (conversation) => conversation.project_id === selectedProjectId
    );
  }, [conversations, selectedProjectId]);

  useEffect(() => {
    const chatElement = chatScrollRef.current;

    if (!chatElement) return;

    const timeout = window.setTimeout(() => {
      chatElement.scrollTo({
        top: chatElement.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [messages, loading]);

  async function getAccessToken() {
    const { data, error } = await supabaseBrowser.auth.getSession();

    if (error || !data.session) {
      router.replace("/login");
      throw new Error("Not logged in.");
    }

    return data.session.access_token;
  }

  function clearSelectedImages(revoke = true) {
    setSelectedImages((current) => {
      if (revoke) {
        current.forEach((image) => URL.revokeObjectURL(image.preview));
      }

      return [];
    });
  }

  function resetChatForProject(project?: Project | null) {
    setConversationId(null);
    setInput("");
    clearSelectedImages();

    setMessages([
      {
        role: "assistant",
        content: project
          ? `New chat started for ${project.name}. What are we building?`
          : "New chat started. Tell me what you want to build.",
      },
    ]);
  }

  function addSelectedImages(fileList: FileList | null) {
    if (!fileList) return;

    const maxImages = 4;
    const maxBytesPerImage = 10 * 1024 * 1024;
    const maxTotalBytes = 30 * 1024 * 1024;

    const incomingFiles = Array.from(fileList);
    const nextImages = [...selectedImages];
    const rejected: string[] = [];

    for (const file of incomingFiles) {
      if (nextImages.length >= maxImages) {
        rejected.push(`Only ${maxImages} images can be uploaded at once.`);
        break;
      }

      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} is not an image.`);
        continue;
      }

      if (file.size > maxBytesPerImage) {
        rejected.push(`${file.name} is larger than 10MB.`);
        continue;
      }

      const totalBytes =
        nextImages.reduce((total, image) => total + image.file.size, 0) +
        file.size;

      if (totalBytes > maxTotalBytes) {
        rejected.push("Total image upload size must stay under 30MB.");
        continue;
      }

      nextImages.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (rejected.length > 0) {
      alert(Array.from(new Set(rejected)).join("\n"));
    }

    setSelectedImages(nextImages);
  }

  function removeSelectedImage(id: string) {
    setSelectedImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }

      return current.filter((image) => image.id !== id);
    });
  }

  async function handleLogout() {
    clearSelectedImages();
    await supabaseBrowser.auth.signOut();
    router.replace("/login");
  }

  async function loadUsage() {
    setLoadingUsage(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/usage", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load usage.");
      }

      setUsage({
        used: Number(data.used || 0),
        limit: Number(data.limit || 0),
        remaining: Number(data.remaining || 0),
      });
    } catch (error) {
      console.error("LOAD USAGE ERROR:", error);
    } finally {
      setLoadingUsage(false);
    }
  }

  async function loadProjects() {
    setLoadingProjects(true);

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
    } finally {
      setLoadingProjects(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) {
      alert("Project name is required.");
      return;
    }

    setCreatingProject(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          type: newProjectType,
          summary: "",
          status: "active",
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project.");
      }

      const createdProject = data.project as Project;

      setNewProjectName("");
      setNewProjectType("general");

      await loadProjects();

      setSelectedProjectId(createdProject.id);
      setProjectType(createdProject.type || "general");
      resetChatForProject(createdProject);
      setShowProjectTools(false);
    } catch (error) {
      console.error("CREATE PROJECT ERROR:", error);
      alert("Could not create project. Check terminal logs.");
    } finally {
      setCreatingProject(false);
    }
  }

  async function loadConversations() {
    setLoadingConversations(true);

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load conversations.");
      }

      setConversations(data.conversations || []);
    } catch (error) {
      console.error("LOAD CONVERSATIONS ERROR:", error);
    } finally {
      setLoadingConversations(false);
    }
  }

  async function loadConversation(id: string) {
    setLoading(true);

    try {
      const token = await getAccessToken();

      const res = await fetch(`/api/conversations?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load conversation.");
      }

      const loadedMessages: ChatMessage[] = (data.messages || []).map(
        (message: { role: "user" | "assistant"; content: string }) => ({
          role: message.role,
          content: message.content,
        })
      );

      setConversationId(id);

      if (isProjectType(data.conversation?.project_type)) {
        setProjectType(data.conversation.project_type);
      }

      setSelectedProjectId(data.conversation?.project_id || null);

      setMessages(
        loadedMessages.length > 0
          ? loadedMessages
          : [
              {
                role: "assistant",
                content: "This conversation has no messages yet.",
              },
            ]
      );
    } catch (error) {
      console.error("LOAD CONVERSATION ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Embr could not load that conversation.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id: string) {
    const confirmed = window.confirm("Delete this conversation?");
    if (!confirmed) return;

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/conversations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete conversation.");
      }

      if (conversationId === id) {
        resetChatForProject(activeProject);
      }

      await loadConversations();
    } catch (error) {
      console.error("DELETE CONVERSATION ERROR:", error);
      alert("Could not delete conversation. Check terminal logs.");
    }
  }

  function handleProjectChange(projectId: string) {
    const nextProjectId = projectId || null;
    const nextProject =
      projects.find((project) => project.id === nextProjectId) || null;

    setSelectedProjectId(nextProjectId);

    if (nextProject && isProjectType(nextProject.type)) {
      setProjectType(nextProject.type);
    } else {
      setProjectType("general");
    }

    resetChatForProject(nextProject);
  }

  async function sendMessage() {
    if ((!input.trim() && selectedImages.length === 0) || loading) return;

    const userMessage = input.trim();
    const displayContent = userMessage || "[Images uploaded]";
    const imagePreviewsForMessage = selectedImages.map((image) => image.preview);

    const nextMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: displayContent,
        imagePreviews: imagePreviewsForMessage,
      },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const token = await getAccessToken();

      const imageBase64List =
        selectedImages.length > 0
          ? await Promise.all(
              selectedImages.map((image) => fileToDataUrl(image.file))
            )
          : [];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          messages: nextMessages,
          projectType,
          aiMode,
          projectId: selectedProjectId,
          conversationId,
          imageBase64List,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data.output || data.error || `API error: ${res.status}`);
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.output || "No response returned.",
        },
      ]);

      clearSelectedImages(false);

      await Promise.all([loadConversations(), loadUsage(), loadProjects()]);
    } catch (error) {
      console.error("SEND ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: getFriendlyErrorMessage(error),
        },
      ]);
    } finally {
      setLoading(false);
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

      await Promise.all([loadConversations(), loadUsage(), loadProjects()]);
    }

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Embr</h1>
          <p className="text-slate-400">Loading your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 xl:p-6">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 xl:h-[88vh] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 xl:h-full xl:overflow-y-auto">
          <h1 className="text-2xl font-bold text-yellow-400">Embr</h1>

          <div className="mt-1 truncate text-xs text-slate-500">
            {userEmail}
          </div>

          <a
            href="/generated-apps"
            className="mt-4 block rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-center text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20"
          >
            Generated Apps
          </a>

          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                Active Project
              </div>

              <select
                value={selectedProjectId || ""}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm outline-none"
              >
                <option value="">No project / General</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {activeProject && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
                <div className="font-semibold text-yellow-400">
                  {activeProject.name}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {activeProject.type} · {activeProject.status}
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                Mode
              </div>

              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm outline-none"
              >
                <option value="general">General</option>
                <option value="website">Website</option>
                <option value="ios_app">iOS App</option>
                <option value="android_app">Android App</option>
                <option value="full_stack_app">Full Stack App</option>
                <option value="content">Content</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                AI Power
              </div>

              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as AIMode)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-sm outline-none"
              >
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="heavy">Heavy</option>
              </select>

              <div className="mt-1 text-xs text-slate-500">
                Auto saves usage. Heavy thinks harder.
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProjectTools((current) => !current)}
                className="flex-1 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20"
              >
                {showProjectTools ? "Hide Project Tools" : "+ New Project"}
              </button>

              <button
                type="button"
                onClick={loadProjects}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Refresh
              </button>
            </div>

            {showProjectTools && (
              <div className="mt-3 space-y-2">
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm outline-none"
                  placeholder="Project name"
                />

                <select
                  value={newProjectType}
                  onChange={(e) =>
                    setNewProjectType(e.target.value as ProjectType)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm outline-none"
                >
                  <option value="general">General</option>
                  <option value="website">Website</option>
                  <option value="ios_app">iOS App</option>
                  <option value="android_app">Android App</option>
                  <option value="full_stack_app">Full Stack App</option>
                  <option value="content">Content</option>
                </select>

                <button
                  type="button"
                  onClick={createProject}
                  disabled={creatingProject}
                  className="w-full rounded-lg bg-yellow-500 px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
                >
                  {creatingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            )}
          </section>

          <section className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">
                Monthly Usage
              </div>

              <button
                type="button"
                onClick={loadUsage}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                Refresh
              </button>
            </div>

            {loadingUsage && !usage ? (
              <div className="text-sm text-slate-500">Loading usage...</div>
            ) : usage ? (
              <>
                <div className="mb-2 text-xs text-slate-400">
                  {formatTokens(usage.used)} used / {formatTokens(usage.limit)} limit
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{
                      width: `${Math.min(
                        100,
                        usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  {formatTokens(usage.remaining)} remaining this month
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">No usage data yet.</div>
            )}
          </section>

          <section className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">
                Conversations
              </div>

              <button
                type="button"
                onClick={loadConversations}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {loadingConversations && (
                <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-400">
                  Loading conversations...
                </div>
              )}

              {!loadingConversations && visibleConversations.length === 0 && (
                <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-400">
                  No conversations yet.
                </div>
              )}

              {visibleConversations.map((conversation) => {
                const active = conversation.id === conversationId;

                return (
                  <div
                    key={conversation.id}
                    className={
                      active
                        ? "rounded-lg border border-yellow-500 bg-yellow-500/10 p-3"
                        : "rounded-lg border border-slate-800 bg-slate-800 p-3 hover:bg-slate-700"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => loadConversation(conversation.id)}
                      className="w-full text-left"
                    >
                      <div className="break-words text-sm font-semibold text-slate-100">
                        {conversation.title}
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>{conversation.project_type}</span>
                        <span>{formatDate(conversation.updated_at)}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteConversation(conversation.id)}
                      className="mt-2 text-xs text-red-300 hover:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-6 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-950"
            >
              Log Out
            </button>
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 xl:h-full">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Builder Chat</div>

              <div className="text-xs text-slate-500">
                {activeProject
                  ? `Project: ${activeProject.name}`
                  : conversationId
                    ? "Saved conversation active"
                    : "New conversation"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => resetChatForProject(activeProject)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              New Chat
            </button>
          </div>

          <div
            ref={chatScrollRef}
            className="mb-4 flex-1 space-y-4 overflow-y-auto pr-1"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl bg-blue-600 px-4 py-3 text-white"
                    : "mr-auto max-w-[85%] rounded-2xl border border-yellow-500 bg-slate-800 px-4 py-3 text-slate-100"
                }
              >
                <div className="mb-1 text-xs uppercase tracking-wide opacity-70">
                  {message.role}
                </div>

                {message.imagePreviews && message.imagePreviews.length > 0 && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    {message.imagePreviews.map((preview, imageIndex) => (
                      <img
                        key={imageIndex}
                        src={preview}
                        alt="Uploaded image"
                        className="max-h-64 rounded-lg border border-slate-700 object-contain"
                      />
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mr-auto max-w-[85%] rounded-2xl border border-yellow-500 bg-slate-800 px-4 py-3 text-slate-100">
                Embr is thinking...
              </div>
            )}
          </div>

          <div className="space-y-3">
            {selectedImages.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Image Preview · {selectedImages.length}
                  </div>

                  <button
                    type="button"
                    onClick={() => clearSelectedImages()}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove all
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="h-28 w-full rounded-lg border border-slate-700 object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeSelectedImage(image.id)}
                        className="absolute right-1 top-1 rounded bg-red-950 px-2 py-1 text-xs text-red-200"
                      >
                        ✕
                      </button>

                      <div className="mt-1 truncate text-xs text-slate-500">
                        {(image.file.size / (1024 * 1024)).toFixed(1)}MB
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row">
              <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-slate-700">
                Upload Photos
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addSelectedImages(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-3 outline-none"
                placeholder={
                  activeProject
                    ? `Ask Embr about ${activeProject.name} or upload photos...`
                    : "Type a message or upload photos — Embr will infer the next step..."
                }
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={loading}
                className="rounded-lg bg-yellow-500 px-4 py-3 font-semibold text-black disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
