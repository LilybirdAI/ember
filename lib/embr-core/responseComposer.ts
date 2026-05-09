import type { EmbrDecision } from "./embrBrain";

export type EmbrComposedResponse = {
  draft: string;
  usedVoice: string;
  notes: string[];
};

export function composeEmbrResponse(decision: EmbrDecision): EmbrComposedResponse {
  const notes: string[] = [];

  const message = decision.originalMessage.toLowerCase();
  const voice = decision.voice.voiceName;
  const priority = decision.priority.primaryPriority;
  const tags = decision.memory.tags;

  // 1. Stabilize / protector mode
  if (priority === "stabilize_user") {
    notes.push("Used stabilize_user response composer.");

    const likelyEmbrBuild =
      tags.includes("embr") ||
      message.includes("embr") ||
      message.includes("core") ||
      message.includes("build");

    const taskLine = likelyEmbrBuild
      ? "Then come back and do one tiny EmbrCore task only: one file, one test, one commit."
      : "Then come back and do one tiny task only: one file, one message, one test, or one commit.";

    return {
      usedVoice: voice,
      notes,
      draft:
`You’re running hot right now. The next move is control, not more pressure.

Stop for ten minutes first. Water. Stand up. Breathe. No decisions.

${taskLine}

Work for 30–45 minutes max, then reassess.

You are not losing momentum by resting. You are protecting the engine that creates the momentum.`
    };
  }

  // 2. Gina / account ownership / Google Play
  if (decision.recognizedMemory.primaryMemory === "gina") {
    notes.push("Used Gina memory-recognition response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Handle Gina gently, but keep the boundary clear.

The app/build phase can be closed based on the work completed. The remaining Google Play/account steps are different because they require her ownership and verification.

Send something like:

“Hi Gina, I want to keep this clear and organized. The app work/build phase has been completed as far as I can take it from my side, so I think we can close that current phase.

I’m still going to help guide you through the Google Play side as my contribution because I believe in the project. I just need to be clear that the Google account ownership and verification steps have to be completed by you directly for security reasons.

I’ll guide you step by step, but I can’t log in as you or take over the account verification process.”`
    };
  }

  // 3. Bashen/Bastion scope boundary
  if (decision.recognizedMemory.primaryMemory === "bashen_bastion") {
    notes.push("Used Bashen/Bastion scope response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Keep this scoped.

The current milestone is iOS only. Google Play / Android recovery is separate because that is a different platform, a different review system, and a different problem.

Say:

“For this current milestone, I’m keeping the scope focused on the iOS side so we can get the Apple update handled properly. The Google Play issue is separate because the app has already been removed there, and that would need its own review/recovery process and separate milestone.”`
    };
  }

  // 4. Paul / BeeClean
  if (decision.recognizedMemory.primaryMemory === "paul") {
    notes.push("Used Paul memory-recognition response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Do not reopen that loop.

Paul/BeeClean was not a skill failure. It was a scope mismatch: messy codebase, too many hands, unclear ownership, and far too much work for the budget.

The lesson is simple: do not take Paul-type jobs again.

The next move is not to fix Paul. The next move is to protect future scope, pricing, and client selection.`
    };
  }

  // 5. Embr building / product direction
  if (priority === "build_embr" || decision.recognizedMemory.primaryMemory === "embr") {
    notes.push("Used Embr build response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`This is real, but not finished.

The next move is not hype. The next move is one layer.

Right now Embr needs to turn her internal decision into better final responses. That means the next correct piece is the response composer: memory, signal, priority, feeling, and voice all shaping what she actually says.

Build proof before claims. One layer at a time.`
    };
  }

  // 6. Technical/build mode
  if (priority === "solve_technical_issue") {
    notes.push("Used technical response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Start with the exact failure.

Do not touch unrelated files yet.

Run the command again, capture the first real error, and work one issue at a time. The next move is:

1. Reproduce the error.
2. Copy the exact terminal output.
3. Identify the file or config it points to.
4. Fix only that.
5. Test again.

Send the output before changing anything else.`
    };
  }

  // 7. Pricing / business
  if (priority === "protect_business") {
    notes.push("Used business/pricing response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Protect the value.

For Embr integration work, separate setup from monthly support.

A beta client can get a lower test price if they are helping prove the system. A normal client should pay for the real work: planning, integration, backend/API wiring, testing, prompt behavior, usage limits, and support.

Do not price it like “one AI call.” Price it like product infrastructure.`
    };
  }

  // 8. Teaching
  if (priority === "explain_clearly") {
    notes.push("Used teacher response composer.");

    return {
      usedVoice: voice,
      notes,
      draft:
`Think of it like this.

An API key is like a private password that lets one app talk to another service.

For example, if Embr needs to ask OpenAI, Claude, or Perplexity for help, she needs a key so that service knows:

1. who is asking,
2. who to charge,
3. what access is allowed.

You do not put that key inside a public app where users can see it. You keep it on your backend/server, and your app talks to your backend instead.`
    };
  }

  // 9. Default warm response
  notes.push("Used default warm response composer.");

  return {
    usedVoice: voice,
    notes,
    draft:
`That makes sense.

The next move is to keep it simple: one clear step, one small result, then reassess.

Stay grounded. Do not turn one thought into ten jobs.`
  };
}
