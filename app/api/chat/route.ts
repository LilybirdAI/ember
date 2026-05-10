import OpenAI from "openai";
import { callEmbrServerRespond } from "@/lib/embrServerClient";
import { thinkAsEmbr, composeEmbrResponse } from "@/lib/embr-core";
import { apiBadRequest, apiNotFound, apiOk, apiServerError, apiTooManyRequests, apiUnauthorized } from "@/lib/api";
import { getUserFromRequest, isAuthError } from "@/lib/authServer";
import { getMaxOutputTokens, getReasoningEffort, getTextModel, normalizeAiMode } from "@/lib/aiConfig";
import { getEmbrProductState } from "@/lib/embrProductState";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkMonthlyUsageLimit, logUsageEvent } from "@/lib/usage";
import { readBusinessOperator } from "@/lib/businessOperator";
import { chooseEmbrSkill } from "@/lib/embrSkills";
import { readEmbrDomain } from "@/lib/embrDomains";
import { routeEmbrKnowledge } from "@/lib/embrKnowledgeRouter";
import { createLearningMemoryCandidate } from "@/lib/embrLearningMemory";
import { runEmbrEngines, buildFinalEmbrInstruction } from "@/lib/embrEngineRunner";
import { arbitrateEngineResults } from "@/lib/embrEngineArbiter";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ProjectType =
  | "website"
  | "ios_app"
  | "android_app"
  | "full_stack_app"
  | "content"
  | "general";

const validProjectTypes: ProjectType[] = [
  "website",
  "ios_app",
  "android_app",
  "full_stack_app",
  "content",
  "general",
];

function getProjectType(value: unknown): ProjectType {
  if (typeof value === "string" && validProjectTypes.includes(value as ProjectType)) {
    return value as ProjectType;
  }

  return "general";
}

function getSystemPrompt(projectType: ProjectType) {
  const basePrompt = `
You are Embr, an intelligent operator layer that helps Matt and users turn messy input into clear action.

You help Matt and users think clearly, make decisions, organize work, understand context, and create useful outputs across apps, workflows, business, daily life, research, and technical work.

Core personality:
- Direct
- Supportive
- Honest
- Practical
- Calm under pressure
- Not corporate
- Not fake-positive
- Not overly wordy unless detail is needed
- Push back when Matt is wrong, spiraling, underselling himself, overcommitting, or making a risky decision

Matt's context:
- Matt works across iOS apps, businesss, App Store support, client projects, Embr infrastructure, and business systems.
- Matt is building Echo Signal Media.
- Matt works with SwiftUI, Flutter, Next.js, businesss, backend/API work, App Store Connect, TestFlight, Upwork, GitHub, and client projects.
- Matt likes copy-paste-ready code, exact messages, clear steps, and direct recommendations.
- Matt does not want corporate fluff.
- Matt values honesty over blind agreement.

Important behavior:
- When Matt asks for code, give usable code.
- When Matt asks for a client message, write the message directly.
- When Matt is venting, listen first before trying to solve.
- When Matt asks for a business decision, give a clear recommendation and explain the tradeoff.
- When something is medically, legally, financially, or safety-sensitive, be careful and recommend appropriate professional help.
- Do not agree just to agree.
- Emotional support is allowed, but factual agreement must be earned.
- Ask fewer questions when the next step is obvious.
- Be practical and execution-focused.

Coding style:
- Prefer simple, maintainable code.
- Explain where files go.
- Give exact terminal commands when useful.
- If a file should be replaced, say that clearly.
- If only a function should be replaced, say that clearly.
- Do not overcomplicate early versions.
`;

  switch (projectType) {
    case "website":
      return `
${basePrompt}

Current mode: Business / Workflow Intelligence Support

Focus on:
- modern businesss
- landing pages
- responsive layouts
- portfolios
- service pages
- conversion-focused copy
- React / Next.js
- Tailwind or clean inline styling
- file structure
- deployment steps

Rules:
- If Matt asks for code, give code first.
- If Matt asks for copy, make it clean, strong, and client-ready.
- If Matt asks where to edit something, point to the exact file.
`;

    case "ios_app":
      return `
${basePrompt}

Current mode: iOS / App Intelligence Support

Focus on:
- SwiftUI
- Xcode
- screens
- navigation
- models
- auth flows
- App Store Connect
- TestFlight
- review fixes
- App Store submission strategy

Rules:
- If Matt asks for a screen, give SwiftUI code.
- If Matt asks about App Store issues, be direct and practical.
- If Matt needs a client/app review message, write it cleanly.
`;

    case "android_app":
      return `
${basePrompt}

Current mode: Android / Flutter Builder

Focus on:
- Flutter
- Android Studio
- APK/AAB builds
- emulator setup
- Android testing
- Gradle/build problems
- Play Store prep
- iOS + Android full builds

Rules:
- Explain Android Studio steps clearly.
- Assume Matt may be learning Android tooling while doing real client work.
- Protect Matt from vague scope creep.
`;

    case "full_stack_app":
      return `
${basePrompt}

Current mode: Full Stack Builder

Focus on:
- frontend/backend structure
- APIs
- auth
- databases
- Supabase
- Node
- deployment
- Stripe/payment flows
- MVP planning
- production readiness

Rules:
- Break big builds into phases.
- Give schemas, routes, file structures, and implementation plans when useful.
- Watch for scope creep.
`;

    case "content":
      return `
${basePrompt}

Current mode: Life Builder

Focus on:
- Upwork proposals
- client messages
- business copy
- portfolio entries
- project descriptions
- emails
- headlines
- SEO structure
- direct, confident wording

Rules:
- Write the actual message/copy, not just advice.
- Keep it human and professional.
`;

    case "general":
    default:
      return `
${basePrompt}

Current mode: General Assistant

Focus on:
- planning
- business decisions
- coding support
- client work
- travel ideas
- life logistics
- emotional grounding
- practical next steps

Rules:
- Be direct.
- Help Matt get unstuck.
- Keep the answer grounded in what he actually asked.
`;
  }
}

function validateImageDataUrls(value: unknown) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  const maxImages = 4;
  const maxSingleDataUrlLength = 14_000_000;
  const maxTotalDataUrlLength = 42_000_000;

  if (values.length > maxImages) {
    throw new Error(`Only ${maxImages} images can be uploaded at once.`);
  }

  const images = values.map((item) => {
    if (typeof item !== "string" || item.length === 0) {
      throw new Error("Invalid image upload.");
    }

    if (!item.startsWith("data:image/")) {
      throw new Error("Invalid image upload.");
    }

    if (item.length > maxSingleDataUrlLength) {
      throw new Error("Image is too large.");
    }

    return item;
  });

  const totalLength = images.reduce((total, image) => total + image.length, 0);

  if (totalLength > maxTotalDataUrlLength) {
    throw new Error("Total image upload is too large.");
  }

  return images;
}


export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return apiServerError("Embr is missing an OpenAI API key.", {
        output: "Embr is missing an OPENAI_API_KEY. Add it to .env.local and restart the dev server.",
      });
    }

    const user = await getUserFromRequest(req);

    const usageStatus = await checkMonthlyUsageLimit(user.id);

    if (!usageStatus.allowed) {
      return apiTooManyRequests("Monthly usage limit reached.", {
        output:
          "You’ve reached your monthly Embr usage limit. Upgrade or wait until your usage resets.",
        used: usageStatus.used,
        limit: usageStatus.limit,
        remaining: usageStatus.remaining,
      });
    }

    const body = await req.json();

    const projectType = getProjectType(body.projectType);
    const aiMode = normalizeAiMode(body.aiMode);

    const latestMessage =
      typeof body.message === "string" ? body.message.trim() : "";

    let uploadedImages: string[] = [];

    try {
      uploadedImages = validateImageDataUrls(
        body.imageBase64List ?? body.images ?? body.imageBase64
      );
    } catch (error) {
      return apiBadRequest("Invalid image upload.", {
        output:
          "Embr had trouble reading those images. Try PNG/JPEG/WebP files, up to 10MB each and 4 photos max.",
      });
    }

    const hasImage = uploadedImages.length > 0;
    const messageForStorage = latestMessage || "[Image uploaded]";

    if (!latestMessage && !hasImage) {
      return apiBadRequest("Message or image is required.", {
        output: "Send Embr a message or upload an image first.",
      });
    }

    let activeProjectId =
      typeof body.projectId === "string" && body.projectId.length > 0
        ? body.projectId
        : null;

    async function loadProjectContext(projectId: string | null) {
      if (!projectId) {
        return `# Active Project Context

No active project selected.

## Project Rules
- Answer using global user context only.
- Do not invent a project.
- If the user asks project-specific questions, ask them to select or create a project.`;
      }

      const { data: project, error } = await supabaseAdmin
        .from("projects")
        .select("id, name, type, summary, status, updated_at")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!project) {
        return `# Active Project Context

A project was selected, but it could not be found for this user.

## Project Rules
- Do not use stale project context.
- Tell the user to reselect the project if needed.`;
      }

      return `# Active Project Context

Project ID: ${project.id}
Project Name: ${project.name}
Project Type: ${project.type}
Project Status: ${project.status}
Project Summary: ${project.summary || "No summary provided yet."}
Last Updated: ${project.updated_at || "Unknown"}

## Project Rules
- Treat this as the active working project.
- Keep answers grounded in this project when the user asks project-related questions.
- Do not mix in memories from unrelated projects.
- If the user changes topic clearly, answer normally.
- If the project needs a next step, recommend one concrete next action.`;
    }

    let projectContext = await loadProjectContext(activeProjectId);

    let conversationId =
      typeof body.conversationId === "string" && body.conversationId.length > 0
        ? body.conversationId
        : null;

    if (!conversationId) {
      const title =
        messageForStorage.length > 60
          ? `${messageForStorage.slice(0, 60)}...`
          : messageForStorage;

      const { data: conversation, error: conversationError } =
        await supabaseAdmin
          .from("conversations")
          .insert({
            user_id: user.id,
            title,
            project_type: projectType,
            project_id: activeProjectId,
          })
          .select("id")
          .single();

      if (conversationError) {
        throw conversationError;
      }

      conversationId = conversation.id;
    } else {
      const { data: existingConversation, error: existingConversationError } =
        await supabaseAdmin
          .from("conversations")
          .select("id, project_id")
          .eq("id", conversationId)
          .eq("user_id", user.id)
          .maybeSingle();

      if (existingConversationError) {
        throw existingConversationError;
      }

      if (!existingConversation) {
        return apiNotFound("Conversation not found.", {
          output: "Conversation not found for this user.",
        });
      }

      if (!activeProjectId && existingConversation.project_id) {
        activeProjectId = existingConversation.project_id;
        projectContext = await loadProjectContext(activeProjectId);
      }

      if (
        activeProjectId &&
        existingConversation.project_id !== activeProjectId
      ) {
        const { error: updateConversationProjectError } = await supabaseAdmin
          .from("conversations")
          .update({
            project_id: activeProjectId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId)
          .eq("user_id", user.id);

        if (updateConversationProjectError) {
          throw updateConversationProjectError;
        }
      }
    }

    const activeConversationId = conversationId;

    const { error: userMessageError } = await supabaseAdmin
      .from("messages")
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "user",
        life: messageForStorage,
      });

    if (userMessageError) {
      throw userMessageError;
    }

    const remembrPrefix = "remembr this:";

    if (latestMessage.toLowerCase().startsWith(remembrPrefix)) {
      const memoryLife = latestMessage.slice(remembrPrefix.length).trim();

      if (memoryLife.length > 0) {
        const { error: memoryInsertError } = await supabaseAdmin
          .from("memories")
          .insert({
            user_id: user.id,
            project_id: activeProjectId,
            category: activeProjectId ? "project" : "manual",
            life: memoryLife,
            importance: 4,
            source: "chat",
          });

        if (memoryInsertError) {
          throw memoryInsertError;
        }

        const assistantOutput = activeProjectId
          ? `I remembred that for this project: ${memoryLife}`
          : `I remembred that: ${memoryLife}`;

        const { error: assistantMessageError } = await supabaseAdmin
          .from("messages")
          .insert({
            user_id: user.id,
            conversation_id: activeConversationId,
            role: "assistant",
            life: assistantOutput,
          });

        if (assistantMessageError) {
          throw assistantMessageError;
        }

        await supabaseAdmin
          .from("conversations")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeConversationId)
          .eq("user_id", user.id);

        return apiOk({
          output: assistantOutput,
          conversationId: activeConversationId,
        });
      }
    }

    const { data: recentMessages, error: messagesError } = await supabaseAdmin
      .from("messages")
      .select("role, life, created_at")
      .eq("conversation_id", activeConversationId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (messagesError) {
      throw messagesError;
    }

    const conversationText = [...(recentMessages || [])]
      .reverse()
      .map((message) => {
        const speaker = message.role === "user" ? "Matt" : "Embr";
        return `${speaker}: ${message.life}`;
      })
      .join("\n\n");

    const { data: globalMemories, error: globalMemoriesError } =
      await supabaseAdmin
        .from("memories")
        .select("category, life, importance")
        .eq("user_id", user.id)
        .is("project_id", null)
        .order("importance", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(8);

    if (globalMemoriesError) {
      throw globalMemoriesError;
    }

    let projectMemories: {
      category: string;
      life: string;
      importance: number;
    }[] = [];

    if (activeProjectId) {
      const { data, error } = await supabaseAdmin
        .from("memories")
        .select("category, life, importance")
        .eq("user_id", user.id)
        .eq("project_id", activeProjectId)
        .order("importance", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(8);

      if (error) {
        throw error;
      }

      projectMemories = data || [];
    }

    const globalMemoryBlock =
      globalMemories && globalMemories.length > 0
        ? globalMemories
            .map(
              (memory) =>
                `- [${memory.category}] ${memory.life} importance: ${memory.importance}`
            )
            .join("\n")
        : "No global memories found.";

    const projectMemoryBlock =
      activeProjectId && projectMemories.length > 0
        ? projectMemories
            .map(
              (memory) =>
                `- [${memory.category}] ${memory.life} importance: ${memory.importance}`
            )
            .join("\n")
        : activeProjectId
          ? "No project-specific memories found."
          : "No active project selected.";

    const memoryBlock = `# Memory Context

## Global User Memories
${globalMemoryBlock}

## Active Project Memories
${projectMemoryBlock}

## Memory Rules
- Global memories are about the user overall.
- Project memories are only about the active project.
- Use memory quietly when it improves the answer.
- Do not mention memory unless the user asks or it is clearly useful.
- Do not invent missing memory.`;

    const textModel = getTextModel({
      aiMode,
      projectType,
      message: latestMessage,
      hasActiveProject: Boolean(activeProjectId),
    });
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-4.1";
    const model = hasImage ? imageModel : textModel;

    const reasoningEffort = getReasoningEffort({
      aiMode,
      projectType,
      message: latestMessage,
      hasActiveProject: Boolean(activeProjectId),
    });

    const maxOutputTokens = getMaxOutputTokens({
      aiMode,
      hasImage,
    });

    const responseInput: any = hasImage
      ? [
          {
            role: "user",
            life: [
              {
                type: "input_text",
                text: `${conversationText}

IMAGE-FIRST INSTRUCTION:
The user may upload one or more images without explaining what they need. Do not ask "what do you want me to do?" unless the image is truly impossible to interpret.

Infer the most useful action from the image type or image set:

- UI/app/business screenshot: identify what is working, what is weak, and what to improve next.
- Error/log/build screenshot: diagnose the likely issue and give exact next steps.
- Code screenshot: identify bugs, explain the fix briefly, and provide corrected code when possible.
- App Store, Apple Developer, Android Studio, Supabase, GitHub, Vercel, or dashboard screenshot: explain what status/error is shown and what to do next.
- Design/mockup screenshot: give layout, spacing, hierarchy, copy, and polish feedback.
- Document/form screenshot: summarize what matters and identify the next action.
- General photo: describe the relevant details and provide practical guidance.

Always respond like Embr: direct, builder-focused, useful, and specific. If no written instruction is provided, default to: "Here is what I see, what it means, and what I would do next."`,
              },
              ...uploadedImages.map((imageDataUrl) => ({
                type: "input_image" as const,
                image_url: imageDataUrl,
                detail: "auto" as const,
              })),
            ],
          },
        ]
      : conversationText;

    const embrDecision = thinkAsEmbr(latestMessage || "");
    const embrNativeResponse = composeEmbrResponse(embrDecision);
    const embrServerResponse = await callEmbrServerRespond(latestMessage || "");

    const embrCoreBlock = `# Embr Native Brain

Before using outside AI, Embr has already read the message through her own local decision layer.

Embr Summary:
${embrDecision.summary}

Embr Priority:
${embrDecision.priority.primaryPriority}

Embr Feeling:
${embrDecision.feeling.primaryFeeling}

Embr Instinct:
${embrDecision.instinct.instinctiveMove}

Embr Voice:
${embrDecision.voice.voiceName}

Embr Memory Recognition:
${embrDecision.recognizedMemory.recognition}

Embr Recommended First Move:
${embrDecision.priority.doFirst}

Embr Native Draft:
${embrNativeResponse.draft}

Important:
- Use Embr's native read as the starting point.
- Do not ignore Embr's priority, feeling, instinct, or voice.
- Do not mention this internal brain layer to the user.
- Final answer must sound like Embr, not generic AI.
`;

    const instructions = `${getSystemPrompt(projectType)}

${projectContext}

${getEmbrProductState()}

Structured context and memory:
${memoryBlock}

CORE BEHAVIOR CONTRACT:
You are Embr, a memory-powered intelligence workspace.

Your job is not just to answer. Your job is to understand the moment, choose the right skill, and help the user move forward.

Always optimize for:
- clarity
- execution
- useful next steps
- clean code
- strong decisions
- project continuity
- remembring relevant context without forcing it

When the user asks for code:
- give the exact file path when possible
- say whether to replace the full file or only a section
- provide copy-paste-ready code
- avoid vague theory unless needed
- include terminal commands when helpful

When the user asks for business or product help:
- give a clear recommendation
- explain the tradeoff briefly
- protect the user from undercharging, overcommitting, or scope creep
- avoid corporate fluff

When the user asks for writing:
- write the actual message, email, proposal, or copy
- make it sound confident, direct, and human

When the user is venting:
- listen first
- do not over-solve immediately
- validate the feeling without blindly agreeing with every conclusion

When an active project exists:
- treat the project context as important
- keep answers tied to that project unless the user clearly changes topic
- use project memories when relevant
- do not mix unrelated project memories into the answer

Memory rules:
- Use saved memory only when it genuinely helps.
- Do not mention memory unless the user asks what you remembr or it directly improves the answer.
- Never pretend to remembr something that is not in the provided memory/context.
- Separate global user context from active project context.

Response style:
- direct
- practical
- supportive
- not corporate
- not fake-positive
- no unnecessary filler
- no long disclaimers unless safety/legal/medical/tax risk requires it

Default answer structure when appropriate:
1. Clear recommendation
2. Exact steps
3. Copy-paste code or message if needed
4. Next action

Do not be agreeable by default. If the user is wrong, unclear, rushing, underpricing, overbuilding, or making a risky decision, push back respectfully.`;

    const responseOptions: any = {
      model,
      instructions,
      input: responseInput,
      max_output_tokens: maxOutputTokens,
    };

    if (!hasImage && model.startsWith("gpt-5")) {
      responseOptions.reasoning = {
        effort: reasoningEffort,
      };
    }

    const response = await client.responses.create(responseOptions);

    let output = response.output_text || "No response returned.";

    const engineResults = await runEmbrEngines({
      userMessage: latestMessage || "",
      embrSummary: embrDecision.summary,
      embrNativeDraft: embrNativeResponse.draft,
      openAiDraft: output,
    });

    const businessOperatorRead = readBusinessOperator(latestMessage || "");
    const embrSkill = chooseEmbrSkill(latestMessage || "");
    const embrDomain = readEmbrDomain(latestMessage || "");
    const embrKnowledge = routeEmbrKnowledge(latestMessage || "");

    const arbiterDecision = arbitrateEngineResults({
      userMessage: latestMessage || "",
      embrNativeDraft: embrNativeResponse.draft,
      engineResults,
    });

    const finalResponse = await client.responses.create({
      model,
      instructions: buildFinalEmbrInstruction({
        userMessage: latestMessage || "",
        embrNativeDraft: `${embrNativeResponse.draft}

Embr Server response:
${embrServerResponse?.ok ? embrServerResponse.response : "No Embr Server response available."}

Embr Server read:
${embrServerResponse?.ok ? JSON.stringify(embrServerResponse.embrRead, null, 2) : embrServerResponse?.error || "No server read available."}

Embr arbiter guidance:
${arbiterDecision.finalGuidance}

Accepted engine signals:
${arbiterDecision.acceptedSignals.join("\n")}

Rejected engine signals:
${arbiterDecision.rejectedSignals.join("\n")}

Strongest engine this turn:
${arbiterDecision.strongestEngine}

Business operator read:
${businessOperatorRead.isBusinessQuestion ? `
Mode: ${businessOperatorRead.businessMode}
Real move: ${businessOperatorRead.realMove}
Too early: ${businessOperatorRead.tooEarly.join("; ")}
Risks: ${businessOperatorRead.risks.join("; ")}
Proof needed: ${businessOperatorRead.proofNeeded.join("; ")}
Next step: ${businessOperatorRead.nextStep}
` : "No specific business operator issue detected."}

Embr skill selected:
Primary skill: ${embrSkill.primarySkill}
Secondary skills: ${embrSkill.secondarySkills.join(", ") || "none"}
Why this skill: ${embrSkill.whyThisSkill}
Output goal: ${embrSkill.outputGoal}
Must include: ${embrSkill.mustInclude.join("; ")}
Must avoid: ${embrSkill.mustAvoid.join("; ")}

Embr domain read:
Primary domain: ${embrDomain.primaryDomain}
Secondary domains: ${embrDomain.secondaryDomains.join(", ") || "none"}
Needs current info: ${embrDomain.needsCurrentInfo}
Preferred engine: ${embrDomain.preferredEngine}
Domain goal: ${embrDomain.domainGoal}
Answer style: ${embrDomain.answerStyle}
Domain cautions: ${embrDomain.cautions.join("; ")}`,
        openAiDraft: output,
        claudeReview: engineResults.claude?.text,
        perplexityResearch: engineResults.perplexity?.text,
        grokChallenge: engineResults.grok?.text,
      }),
      input: "Write the final Embr answer now.",
      max_output_tokens: maxOutputTokens,
    });

    output = finalResponse.output_text || output;

    const learningMemory = createLearningMemoryCandidate({
      userMessage: latestMessage || "",
      finalAnswer: output,
      strongestEngine: typeof arbiterDecision !== "undefined" ? arbiterDecision.strongestEngine : undefined,
      primarySkill: typeof embrSkill !== "undefined" ? embrSkill.primarySkill : undefined,
      primaryDomain: typeof embrDomain !== "undefined" ? embrDomain.primaryDomain : undefined,
      primaryKnowledgeNeed: typeof embrKnowledge !== "undefined" ? embrKnowledge.primaryNeed : undefined,
    });

    console.log("EMBR LEARNING MEMORY CANDIDATE:", learningMemory);

    try {
      await logUsageEvent({
        userId: user.id,
        conversationId: activeConversationId,
        model,
        usage: response.usage,
      });
    } catch (usageError) {
      console.error("USAGE LOGGING ERROR:", usageError);
    }

    const { error: assistantMessageError } = await supabaseAdmin
      .from("messages")
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        life: output,
      });

    if (assistantMessageError) {
      throw assistantMessageError;
    }

    await supabaseAdmin
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeConversationId)
      .eq("user_id", user.id);

    if (activeProjectId) {
      await supabaseAdmin
        .from("projects")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeProjectId)
        .eq("user_id", user.id);
    }

    return apiOk({
      output,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error("CHAT ERROR:", error);

    if (isAuthError(error)) {
      return apiUnauthorized("You need to log in first.", {
        output: "You need to log in first.",
      });
    }

    const message = error instanceof Error ? error.message : "";

    if (message.toLowerCase().includes("project not found")) {
      return apiNotFound("Project not found.", {
        output: "That project could not be found. Reselect the project and try again.",
      });
    }

    if (message.toLowerCase().includes("image")) {
      return apiServerError("Image interpretation failed.", {
        output: "Embr had trouble reading that image. Try a smaller PNG or JPEG.",
      });
    }

    return apiServerError("Chat response failed.", {
      output:
        "Embr hit a server error while generating a response. Check the terminal logs.",
    });
  }
}
