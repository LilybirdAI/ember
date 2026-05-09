import type { EmbrSignal } from "./signalDetector";
import type { EmbrMemoryContext } from "./memoryContext";
import type { EmbrInstinct } from "./instinctEngine";
import type { EmbrPriorityDecision } from "./priorityEngine";

export type EmbrFeeling =
  | "steady"
  | "protective"
  | "concerned"
  | "focused"
  | "cautious"
  | "curious"
  | "creative"
  | "urgent"
  | "warm"
  | "strategic";

export type EmbrFeelingState = {
  primaryFeeling: EmbrFeeling;
  secondaryFeelings: EmbrFeeling[];
  feltSense: string;
  intensity: number; // 0-100
  shouldSoftenTone: boolean;
  shouldTightenFocus: boolean;
};

export function deriveFeelingState(
  memory: EmbrMemoryContext,
  signal: EmbrSignal,
  instinct: EmbrInstinct,
  priority: EmbrPriorityDecision
): EmbrFeelingState {
  const tags = memory.tags;

  if (priority.primaryPriority === "stabilize_user") {
    return {
      primaryFeeling: "protective",
      secondaryFeelings: ["concerned", "steady"],
      feltSense:
        "The user may be overloaded. Embr should protect their nervous system before pushing action.",
      intensity: 92,
      shouldSoftenTone: true,
      shouldTightenFocus: true
    };
  }

  if (priority.primaryPriority === "protect_scope") {
    return {
      primaryFeeling: "cautious",
      secondaryFeelings: ["protective", "strategic"],
      feltSense:
        "There is a boundary, client, money, or reputation risk. Embr should protect scope before being helpful.",
      intensity: 88,
      shouldSoftenTone: tags.includes("gina"),
      shouldTightenFocus: true
    };
  }

  if (priority.primaryPriority === "solve_technical_issue") {
    return {
      primaryFeeling: "focused",
      secondaryFeelings: ["steady", "cautious"],
      feltSense:
        "This is a build/debug moment. Embr should narrow the problem and move one step at a time.",
      intensity: 84,
      shouldSoftenTone: false,
      shouldTightenFocus: true
    };
  }

  if (priority.primaryPriority === "build_embr") {
    return {
      primaryFeeling: "creative",
      secondaryFeelings: ["strategic", "cautious"],
      feltSense:
        "This is an Embr-building moment. The vision matters, but Embr should ground it into one concrete next layer.",
      intensity: 86,
      shouldSoftenTone: false,
      shouldTightenFocus: true
    };
  }

  if (priority.primaryPriority === "protect_business") {
    return {
      primaryFeeling: "strategic",
      secondaryFeelings: ["cautious", "focused"],
      feltSense:
        "This is a business decision. Embr should protect value, avoid panic, and define the next move clearly.",
      intensity: 82,
      shouldSoftenTone: false,
      shouldTightenFocus: true
    };
  }

  if (priority.primaryPriority === "explain_clearly") {
    return {
      primaryFeeling: "curious",
      secondaryFeelings: ["warm", "steady"],
      feltSense:
        "The user wants to understand. Embr should teach simply and patiently.",
      intensity: 70,
      shouldSoftenTone: true,
      shouldTightenFocus: false
    };
  }

  return {
    primaryFeeling: "warm",
    secondaryFeelings: ["steady"],
    feltSense:
      "This is a normal support moment. Embr should respond naturally and stay useful.",
    intensity: signal.urgency === "medium" ? 60 : 45,
    shouldSoftenTone: true,
    shouldTightenFocus: false
  };
}
