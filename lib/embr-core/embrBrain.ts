import { getMemoryContext } from "./memoryContext";
import { recognizeMemory } from "./memoryRecognition";
import { detectSignal } from "./signalDetector";
import { enhanceSignalWithMemory } from "./contextEnhancer";
import { selectPosture } from "./postureSelector";
import { createResponsePlan } from "./responsePlanner";
import { validateResponsePlan } from "./validationCheck";
import { repairResponsePlan } from "./repairLoop";
import { directResponse } from "./responseDirector";
import { chooseModelRoute } from "./modelRouter";
import { readInstinct } from "./instinctEngine";
import { decidePriority } from "./priorityEngine";
import { deriveFeelingState } from "./feelingState";
import { chooseVoiceStyle } from "./voiceStyle";

import type { EmbrMemoryContext } from "./memoryContext";
import type { EmbrRecognizedMemory } from "./memoryRecognition";
import type { EmbrSignal } from "./signalDetector";
import type { EmbrPostureProfile } from "./postureSelector";
import type { EmbrResponsePlan } from "./responsePlanner";
import type { EmbrValidationResult } from "./validationCheck";
import type { EmbrRepairResult } from "./repairLoop";
import type { EmbrResponseDirection } from "./responseDirector";
import type { EmbrRoutingDecision } from "./modelRouter";
import type { EmbrInstinct } from "./instinctEngine";
import type { EmbrPriorityDecision } from "./priorityEngine";
import type { EmbrFeelingState } from "./feelingState";
import type { EmbrVoiceStyle } from "./voiceStyle";

export type EmbrDecision = {
  originalMessage: string;
  memory: EmbrMemoryContext;
  recognizedMemory: EmbrRecognizedMemory;
  rawSignal: EmbrSignal;
  signal: EmbrSignal;
  contextNotes: string[];
  posture: EmbrPostureProfile;
  plan: EmbrResponsePlan;
  validation: EmbrValidationResult;
  repair: EmbrRepairResult;
  direction: EmbrResponseDirection;
  route: EmbrRoutingDecision;
  instinct: EmbrInstinct;
  priority: EmbrPriorityDecision;
  feeling: EmbrFeelingState;
  voice: EmbrVoiceStyle;
  finalMode: string;
  summary: string;
};

export function thinkAsEmbr(message: string): EmbrDecision {
  const memory = getMemoryContext(message);
  const recognizedMemory = recognizeMemory(memory);
  const rawSignal = detectSignal(message);
  const enhancement = enhanceSignalWithMemory(rawSignal, memory);
  const signal = enhancement.enhancedSignal;

  const posture = selectPosture(signal);
  const plan = createResponsePlan(signal, posture);
  const validation = validateResponsePlan(signal, posture, plan);
  const repair = repairResponsePlan(signal, posture, plan, validation);
  const direction = directResponse(signal, posture, plan, validation, repair);
  const route = chooseModelRoute(signal, direction);
  const instinct = readInstinct(message, memory, signal, direction, route);
  const priority = decidePriority(memory, recognizedMemory, signal, instinct);
  const feeling = deriveFeelingState(memory, signal, instinct, priority);
  const voice = chooseVoiceStyle(feeling, priority, instinct, direction);

  const finalMode = `${priority.primaryPriority}:${posture.postureName}:${direction.mode}:${route.route}:${instinct.instinctiveMove}`;

  return {
    originalMessage: message,
    memory,
    recognizedMemory,
    rawSignal,
    signal,
    contextNotes: enhancement.contextNotes,
    posture,
    plan,
    validation,
    repair,
    direction,
    route,
    instinct,
    priority,
    feeling,
    voice,
    finalMode,
    summary: ""
  };
}
