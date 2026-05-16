import type { EmbrLearningEvent } from "./learningEvent";

export type EmbrReflection = {
  id: string;
  lesson: string;
  category:
    | "conversation"
    | "technical"
    | "business"
    | "tone"
    | "routing";
  confidence: number;
  createdAt: string;
};

const reflections: EmbrReflection[] = [
  {
    id: "answer-first",
    lesson:
      "Users respond better when Embr answers first and refines second instead of asking clarifying questions immediately.",
    category: "conversation",
    confidence: 0.95,
    createdAt: new Date().toISOString()
  },
  {
    id: "hide-orchestration",
    lesson:
      "Internal routing, engine selection, and orchestration details should stay invisible during normal conversation.",
    category: "routing",
    confidence: 1,
    createdAt: new Date().toISOString()
  }
];

export function getReflectionMemory() {
  return reflections;
}
export function reflectionFromLearningEvent(
  event: EmbrLearningEvent
): EmbrReflection {
  return {
    id: event.id,
    lesson: event.lesson,
    category:
      event.category === "tone" ||
      event.category === "routing"
        ? event.category
        : "conversation",
    confidence: event.confidence,
    createdAt: event.createdAt
  };
}
export function addReflection(reflection: EmbrReflection) {
  reflections.push(reflection);
}