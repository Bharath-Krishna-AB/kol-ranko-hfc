import data from "./output.json";
import { DashboardData, Vulnerability } from "@/schemas/dashboard-data";

// Type assertion to ensure the JSON matches our interface
const rawData = data as DashboardData;

// Safer accessor with fallback to empty array
export const getVulnerabilities = (): Vulnerability[] => {
  return rawData?.data?.vulnerabilities || [];
};

export const getAnalysisMeta = () => {
  return {
    totalCount: rawData?.data?.total_count || 0,
    analyzedAt: rawData?.data?.analyzed_at || new Date().toISOString(),
  };
};

// Fallback vulnerability for defaults if needed
export const DEFAULT_VULNERABILITY: Partial<Vulnerability> = {
  vulnerability_id: "UNKNOWN-ID",
  name: "Unknown Vulnerability",
  current_score: 0,
  severity: "UNKNOWN",
  status_tags: [],
  worst_case_scenario: "No data available.",
  impact_analysis: {
    financial: 0,
    reputation: 0,
    operational: 0,
    legal: 0,
    compliance: 0,
  },
  // ... add more defaults as needed for robust rendering
};
