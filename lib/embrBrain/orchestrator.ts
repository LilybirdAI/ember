import { runClaudeCritique } from "@/lib/aiProviders/claude";
import { runPerplexityResearch } from "@/lib/aiProviders/perplexity";
import { classifyRequest } from "@/lib/embrBrain/classifyRequest";

export async function runEmbrOrchestration(prompt: string) {
  const plan = classifyRequest(prompt);

  const steps: Array<{
    name: string;
    status: "passed" | "failed" | "skipped";
    output?: unknown;
    error?: string;
  }> = [];

  steps.push({
    name: "classify_request",
    status: "passed",
    output: plan,
  });

  let research: unknown = null;

  if (plan.useResearch) {
    try {
      research = await runPerplexityResearch({
        prompt,
        purpose:
          "Identify the specific business workflows, fields, modules, risks, and dashboard metrics this request should include.",
      });

      steps.push({
        name: "perplexity_research",
        status: research ? "passed" : "skipped",
        output: research,
      });
    } catch (error) {
      steps.push({
        name: "perplexity_research",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    steps.push({
      name: "perplexity_research",
      status: "skipped",
      output: "Research not required by classifier.",
    });
  }

  let critic: unknown = null;

  if (plan.useCritic) {
    try {
      critic = await runClaudeCritique({
        prompt,
        context: JSON.stringify(
          {
            plan,
            research,
          },
          null,
          2
        ),
      });

      steps.push({
        name: "claude_critic",
        status: critic ? "passed" : "skipped",
        output: critic,
      });
    } catch (error) {
      steps.push({
        name: "claude_critic",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    steps.push({
      name: "claude_critic",
      status: "skipped",
      output: "Critic not required by classifier.",
    });
  }

  return {
    prompt,
    plan,
    research,
    critic,
    steps,
  };
}
