export type EmotionalState =
  | "calm"
  | "stressed"
  | "overwhelmed"
  | "excited"
  | "angry"
  | "tired";

export type Urgency = "low" | "medium" | "high";

export type TaskType =
  | "business"
  | "coding"
  | "client_message"
  | "emotional_support"
  | "planning"
  | "research"
  | "unknown";

export type Posture =
  | "friend"
  | "operator"
  | "builder"
  | "teacher"
  | "protector"
  | "closer";

export type NextMove =
  | "answer"
  | "ask_clarifying_question"
  | "create_plan"
  | "write_message"
  | "route_to_model"
  | "slow_user_down";

export type EmbrSignal = {
  emotionalState: EmotionalState;
  urgency: Urgency;
  taskType: TaskType;
  posture: Posture;
  needsOutsideModel: boolean;
  nextMove: NextMove;
};

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function detectSignal(message: string): EmbrSignal {
  const text = message.toLowerCase();

  const overwhelmed = includesAny(text, [
    "overwhelmed",
    "freaking out",
    "can't breathe",
    "cant breathe",
    "too much",
    "lost"
  ]);

  const excited = includesAny(text, [
    "holy shit",
    "this is huge",
    "billion",
    "breakthrough"
  ]);

  const angry = includesAny(text, [
    "wtf",
    "pissed",
    "fuck",
    "mad",
    "angry",
    "furious",
    "irritated"
  ]);

  const tired = includesAny(text, [
    "no sleep",
    "exhausted",
    "crashed",
    "tired",
    "slept one hour",
    "slept",
    "only slept",
    "barely slept"
  ]);

  const clientMessage = includesAny(text, [
    "write a message",
    "send him",
    "send her",
    "reply"
  ]);

  const coding = includesAny(text, [
    "terminal",
    "xcode",
    "swift",
    "build failed",
    "repo",
    "api",
    "api key",
    "signing issue",
    "missing file"
  ]);

  const business = includesAny(text, [
    "client",
    "contract",
    "milestone",
    "pricing",
    "scope",
    "upwork",
    "business",
    "bigger than an app",
    "service layer",
    "setup fee",
    "monthly",
    "partner",
    "trademark",
    "charge",
    "how much should i charge",
    "what should i charge",
    "price",
    "pricing",
    "quote",
    "proposal",
    "integration",
    "setup",
    "retainer",
    "monthly support"
  ]);

  const teaching = includesAny(text, [
    "explain",
    "what is",
    "what does",
    "like i'm new",
    "like im new",
    "teach me",
    "i don't understand",
    "i dont understand",
    "beginner"
  ]);

  const planning = includesAny(text, [
    "next step",
    "what should i do",
    "plan",
    "roadmap",
    "where do i start",
    "how do i"
  ]);

  if (overwhelmed || tired) {
    return {
      emotionalState: overwhelmed ? "overwhelmed" : "tired",
      urgency: "high",
      taskType: business ? "business" : coding ? "coding" : "emotional_support",
      posture: tired && coding ? "builder" : "protector",
      needsOutsideModel: tired && coding,
      nextMove: tired && coding ? "create_plan" : "slow_user_down"
    };
  }

  if (clientMessage) {
    return {
      emotionalState: angry ? "angry" : "calm",
      urgency: "medium",
      taskType: "client_message",
      posture: "closer",
      needsOutsideModel: false,
      nextMove: "write_message"
    };
  }

  if (teaching) {
    return {
      emotionalState: angry ? "angry" : "calm",
      urgency: "low",
      taskType: "planning",
      posture: "teacher",
      needsOutsideModel: true,
      nextMove: "answer"
    };
  }

  if (coding) {
    return {
      emotionalState: angry ? "angry" : "calm",
      urgency: "medium",
      taskType: "coding",
      posture: "builder",
      needsOutsideModel: true,
      nextMove: "create_plan"
    };
  }

  if (business || planning) {
    return {
      emotionalState: excited ? "excited" : angry ? "angry" : "calm",
      urgency: business ? "medium" : "low",
      taskType: business ? "business" : "planning",
      posture: business ? "operator" : "teacher",
      needsOutsideModel: true,
      nextMove: "create_plan"
    };
  }

  return {
    emotionalState: excited ? "excited" : angry ? "angry" : "calm",
    urgency: excited ? "medium" : "low",
    taskType: "unknown",
    posture: "friend",
    needsOutsideModel: true,
    nextMove: "answer"
  };
}
