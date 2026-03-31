export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  recommended?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 120B",
    provider: "NVIDIA",
    description: "Fast, reasoning-focused",
    recommended: true,
  },
  {
    id: "arcee-ai/trinity-mini:free",
    name: "Trinity Mini",
    provider: "Arcee",
    description: "Compact, efficient",
  },
  {
    id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    name: "Dolphin Mistral 24B",
    provider: "CognitiveComputations",
    description: "Balanced, versatile",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    name: "Qwen3 Next 80B",
    provider: "Qwen",
    description: "Large, powerful reasoning",
  },
  {
    id: "stepfun/step-3.5-flash:free",
    name: "Step 3.5 Flash",
    provider: "StepFun",
    description: "Fast, cost-effective",
  },
];

export const DEFAULT_MODEL: AIModel = AI_MODELS[0];
