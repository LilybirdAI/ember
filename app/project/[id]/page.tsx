"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProjectType =
  | "website"
  | "ios_app"
  | "android_app"
  | "full_stack_app"
  | "content"
  | "general";

type OutputMode =
  | "code"
  | "plan"
  | "file_tree"
  | "ui_copy"
  | "schema"
  | "general";

export default function ProjectPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>("website");
  const [outputMode, setOutputMode] = useState<OutputMode>("code");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Embr is ready. Choose a project type and output mode, then tell me what you want to build.",
    },
  ]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          projectType,
          outputMode,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.output || "No response returned.",
        },
      ]);
    } catch (err) {
      console.error("SEND ERROR:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Embr hit an error while generating a response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-slate-800 rounded-xl p-4 bg-slate-900">
          <h1 className="text-2xl font-bold mb-4 text-yellow-400">
            Embr Workspace
          </h1>

          <div className="text-sm text-slate-400 mb-2">Project Type</div>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as ProjectType)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 mb-4 outline-none"
          >
            <option value="website">Website</option>
            <option value="ios_app">iOS App</option>
            <option value="android_app">Android App</option>
            <option value="full_stack_app">Full Stack App</option>
            <option value="content">Content</option>
            <option value="general">General</option>
          </select>

          <div className="text-sm text-slate-400 mb-2">Output Mode</div>
          <select
            value={outputMode}
            onChange={(e) => setOutputMode(e.target.value as OutputMode)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 p-3 mb-6 outline-none"
          >
            <option value="code">Code</option>
            <option value="plan">Plan</option>
            <option value="file_tree">File Tree</option>
            <option value="ui_copy">UI Copy</option>
            <option value="schema">Schema</option>
            <option value="general">General</option>
          </select>

          <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Ideas
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <button
              type="button"
              onClick={() =>
                setInput("Build me a homepage structure for a dental office")
              }
              className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Build me a homepage structure for a dental office
            </button>

            <button
              type="button"
              onClick={() =>
                setInput("Create a SwiftUI login screen with email and Apple sign in")
              }
              className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Create a SwiftUI login screen with email and Apple sign in
            </button>

            <button
              type="button"
              onClick={() =>
                setInput("Plan a SaaS app for real estate lead generation")
              }
              className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Plan a SaaS app for real estate lead generation
            </button>
          </div>
        </div>

        <div className="md:col-span-2 border border-slate-800 rounded-xl p-4 bg-slate-900 flex flex-col h-[80vh]">
          <div className="text-lg font-semibold mb-4">Builder Chat</div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[80%] rounded-2xl bg-blue-600 px-4 py-3 text-white"
                    : "mr-auto max-w-[80%] rounded-2xl bg-slate-800 border border-yellow-500 px-4 py-3 text-slate-100"
                }
              >
                <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
                  {message.role}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mr-auto max-w-[80%] rounded-2xl bg-slate-800 border border-yellow-500 px-4 py-3 text-slate-100">
                Embr is thinking...
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              className="flex-1 p-3 rounded-lg bg-slate-800 border border-slate-700 outline-none"
              placeholder="Ask Embr to build something..."
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
              className="bg-yellow-500 text-black px-4 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}