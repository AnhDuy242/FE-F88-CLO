import type { LoanApplicationDraftStepCode } from "@/features/loan-onboarding/api/loan-application-draft.api";

export type DraftAutosaveStatus = "idle" | "saving" | "saved" | "error";

type UseDraftStepAutosaveParams = {
  draftCode?: string;
  stepCode: LoanApplicationDraftStepCode;
  data: Record<string, unknown> | null;
  enabled?: boolean;
  debounceMs?: number;
  skipInitialSave?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFileLike(value: unknown) {
  return (
    typeof File !== "undefined" && value instanceof File
  ) || (
    typeof Blob !== "undefined" && value instanceof Blob
  );
}

export function sanitizeDraftAutosavePayload(value: unknown): unknown {
  if (isFileLike(value)) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map(sanitizeDraftAutosavePayload)
      .filter((item) => item !== undefined);
  }

  if (!isRecord(value)) {
    if (typeof value === "string" && value.startsWith("data:")) {
      return undefined;
    }

    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, childValue]) => {
        return (
          childValue !== undefined &&
          !/(base64|blob|file|previewUrl)/i.test(key)
        );
      })
      .map(([key, childValue]) => [
        key,
        sanitizeDraftAutosavePayload(childValue),
      ])
      .filter(([, childValue]) => childValue !== undefined),
  );
}

export function useDraftStepAutosave({
  draftCode,
  stepCode,
  data,
  enabled = true,
  debounceMs = 1000,
  skipInitialSave = true,
}: UseDraftStepAutosaveParams) {
  void draftCode;
  void stepCode;
  void data;
  void enabled;
  void debounceMs;
  void skipInitialSave;

  return {
    status: "idle" as DraftAutosaveStatus,
    error: null,
  };
}
