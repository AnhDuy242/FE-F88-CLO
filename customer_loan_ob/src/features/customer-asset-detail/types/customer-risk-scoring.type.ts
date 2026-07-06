export type CustomerRiskScoringData = {
  score?: number;
  grade?: string;
  riskLevel?: string;
  description?: string;
};

export type CustomerRiskScoringSource = {
  score?: number;
  overallScore?: number;
  scoreGrade?: string;
  grade?: string;
  rank?: string | number;
  riskLevel?: string;
  risk_level?: string;
  description?: string;
  riskDescription?: string;
  matchedRuleName?: string;
  matchedRuleCode?: string;
};
