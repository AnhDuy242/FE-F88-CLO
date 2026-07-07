import { useEffect, useMemo, useRef, useState } from "react";

import {
  loanApplicationDraftApi,
  type LoanApplicationDraftStepCode,
} from "@/features/loan-onboarding/api/loan-application-draft.api";

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
  const [status, setStatus] = useState<DraftAutosaveStatus>("idle");
  const [error, setError] = useState<unknown>(null);
  const hasInitializedRef = useRef(false);
  const lastSavedSignatureRef = useRef("");

  const payload = useMemo(() => {
    const sanitized = sanitizeDraftAutosavePayload(data);
    return isRecord(sanitized) ? sanitized : null;
  }, [data]);

  const signature = useMemo(() => {
    if (!payload || Object.keys(payload).length === 0) {
      return "";
    }

    return JSON.stringify(payload);
  }, [payload]);

  useEffect(() => {
    if (!enabled || !draftCode || !stepCode || !payload || !signature) {
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (skipInitialSave) {
        lastSavedSignatureRef.current = signature;
        return;
      }
    }

    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setStatus("saving");
      setError(null);

      try {
        const response = await loanApplicationDraftApi.saveStep(
          draftCode,
          stepCode,
          {
            status: "IN_PROGRESS",
            payload,
          },
        );

        if (response.success === false) {
          throw response;
        }

        lastSavedSignatureRef.current = signature;
        setStatus("saved");
      } catch (autosaveError) {
        console.error("Autosave draft step error:", autosaveError);

        if (
          autosaveError &&
          typeof autosaveError === "object" &&
          "raw" in autosaveError
        ) {
          console.error(
            "Autosave draft step response.data:",
            (autosaveError as { raw?: unknown }).raw,
          );
        }

        setError(autosaveError);
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [
    debounceMs,
    draftCode,
    enabled,
    payload,
    signature,
    skipInitialSave,
    stepCode,
  ]);

  return {
    status,
    error,
  };
}
