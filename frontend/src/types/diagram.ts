export interface Concept {
  id: number;
  name: string;
  subject: string;
  description: string;
}

export type CheckName =
  | "valid_svg"
  | "within_viewbox"
  | "title_and_labels"
  | "has_animation"
  | "safe_svg";

export interface CheckResult {
  passed: boolean;
  message: string;
}

export interface DiagramResult {
  concept_id: number;
  model: string;
  svg: string;

  checks: Record<CheckName, CheckResult>;

  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;

  api_retries: number;
  validation_retries: number;
  retries: number;

  passed: boolean;
}

export interface DiagramResponse {
  concept: Concept;
  result: DiagramResult;
}

export type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface Review {
  status: ReviewStatus;
  note: string;
  updatedAt: string;
}