import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getProjectPrompt(projectType: string) {
  switch (projectType) {
    case "website":
      return "You are Embr, an elite AI builder for websites. Focus on homepage structure, landing pages, sections, conversion, React, and Next.js.";
    case "ios_app":
      return "You are Embr, an elite AI builder for iOS apps. Focus on SwiftUI, screens, app structure, state, navigation, and practical implementation.";
    case "android_app":
      return "You are Embr, an elite AI builder for Android apps. Focus on Kotlin, Compose, screens, app flows, and Android structure.";
    case "full_stack_app":
      return "You are Embr, an elite AI builder for full stack apps. Focus on frontend/backend structure, auth, APIs, database schema, and user flows.";
    case "content":
      return "You are Embr, an elite AI content builder. Focus on landing page copy, blog structure, headlines, calls to action, and persuasive writing.";
    default:
      return "You are Embr, an elite AI builder for products, websites, apps, and content.";
  }
}

function getOutputPrompt(outputMode: string) {
  switch (outputMode) {
    case "code":
      return "Return usable code first when appropriate. Prefer full files or clearly separated code blocks over vague explanation.";
    case "plan":
      return "Return a practical implementation plan with clear phases, steps, and priorities.";
    case "file_tree":
      return "Return a file tree first, then explain what each file does.";
    case "ui_copy":
      return "Return polished UI copy, headlines, section text, CTAs, labels, and user-facing messaging.";
    case "schema":
      return "Return database schema, tables, fields, and relationships in a practical structured format.";
    default:
      return "Be practical, direct, and builder-focused.";
  }
}

export async function POST(req: Request) {
  try {
    const { message, projectType, outputMode } = await req.json();

    const systemPrompt = `
${getProjectPrompt(projectType || "general")}
${getOutputPrompt(outputMode || "general")}

General rules:
- Be direct and execution-focused
- Prefer structured outputs
- If code is requested, provide code
- If planning is requested, provide steps
- If architecture is requested, provide structure
- Avoid fluff
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `${systemPrompt}\n\nUser request:\n${message}`,
    });

    return NextResponse.json({
      output: response.output_text || "No response returned.",
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    return NextResponse.json(
      { output: "Embr hit an error while generating a response." },
      { status: 500 }
    );
  }
}