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


function shouldCreateAppCommand(value: string) {
  const lower = value.toLowerCase();

  if (!lower.trim()) return false;

  const appNouns = [
    "app",
    "dashboard",
    "tracker",
    "crm",
    "portal",
    "system",
    "tool",
    "website",
    "client portal",
    "lead tracker",
    "invoice tracker",
    "real estate",
    "booking system",
  ];

  const buildVerbs = [
    "build",
    "create",
    "make",
    "generate",
    "design",
    "turn this into",
  ];

  const explicitBuild =
    buildVerbs.some((verb) => lower.includes(verb)) &&
    appNouns.some((noun) => lower.includes(noun));

  const directBusinessApp =
    lower.includes("i need a crm") ||
    lower.includes("i need an app") ||
    lower.includes("i need a dashboard") ||
    lower.includes("i need a tracker") ||
    lower.includes("make me a crm") ||
    lower.includes("make me an app") ||
    lower.includes("real estate lead tracker") ||
    lower.includes("invoice tracker") ||
    lower.includes("booking system") ||
    lower.includes("client portal");

  return explicitBuild || directBusinessApp;
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

    const shouldCreateApp =
      selectedImages.length === 0 && shouldCreateAppCommand(userMessage);

    try {
      const token = await getAccessToken();

      if (shouldCreateApp) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Embr is creating the app now. I’ll open the generated app when it is ready.",
          },
        ]);

        const res = await fetch("/api/app-builder/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: userMessage,
            projectId: selectedProjectId,
          }),
        });

        const data = await parseJsonResponse(res);

        if (!res.ok) {
          throw new Error(data.output || data.error || "Embr could not create the app.");
        }

        const generatedAppId = data.generatedApp?.id;

        if (!generatedAppId) {
          throw new Error("Generated app id was missing.");
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Created ${data.generatedApp?.name || "the app"}. Opening it now.`,
          },
        ]);

        await Promise.all([loadConversations(), loadUsage(), loadProjects()]);

        router.push(`/generated-apps/${generatedAppId}`);
        return;
      }

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
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 xl:h-[88vh] xl:grid-cols-1">
        <section className="flex min-h-[70vh] flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 xl:h-full">
          <div className="mb-4">
            <div className="text-3xl font-bold text-yellow-400">Embr</div>
            <div className="mt-1 text-sm text-slate-500">
              Type what you need. Embr will decide whether to answer, analyze, or build.
            </div>
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
                Embr is working...
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
                    ? `Ask Embr about ${activeProject.name}, build something, or upload a photo...`
                    : "Type anything — ask, build, analyze, or upload a photo..."
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
