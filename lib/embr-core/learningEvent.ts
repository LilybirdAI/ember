export type EmbrLearningEvent = {
  id: string;
  source: "user_feedback" | "conversation_outcome" | "manual_rule" | "system_reflection";
  lesson: string;
  category: "tone" | "routing" | "technical" | "business" | "memory" | "safety";
  confidence: number;
  approved: boolean;
  createdAt: string;
};

export function createLearningEvent(input: Omit<EmbrLearningEvent, "id" | "createdAt">): EmbrLearningEvent {
  return {
    ...input,
    id: `learn_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
}
