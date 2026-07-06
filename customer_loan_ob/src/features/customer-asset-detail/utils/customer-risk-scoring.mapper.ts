import type {
  CustomerRiskScoringData,
  CustomerRiskScoringSource,
} from "@/features/customer-asset-detail/types/customer-risk-scoring.type";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  return value as Record<string, unknown>;
}

function getString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function getNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const normalizedValue = Number(value.replace(/[^\d.-]/g, ""));

      if (Number.isFinite(normalizedValue)) {
        return normalizedValue;
      }
    }
  }

  return undefined;
}

export function mapCustomerRiskScoring(
  source?: CustomerRiskScoringSource | unknown,
): CustomerRiskScoringData | null {
  const record = toRecord(source);

  if (!record) return null;

  const score = getNumber(record, ["score", "overallScore"]);
  const grade = getString(record, ["grade", "scoreGrade", "rank"]);
  const riskLevel = getString(record, ["riskLevel", "risk_level"]);
  const description = getString(record, [
    "description",
    "riskDescription",
    "matchedRuleName",
    "matchedRuleCode",
  ]);

  if (
    score === undefined &&
    !grade &&
    !riskLevel &&
    !description
  ) {
    return null;
  }

  return {
    score,
    grade,
    riskLevel,
    description,
  };
}
