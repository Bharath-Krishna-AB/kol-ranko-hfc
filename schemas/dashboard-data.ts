export interface ExecutiveVerdict {
    risk_concentration: string;
    exposure_reduction: string;
    business_priority: string;
}

export interface ImpactAnalysis {
    financial: number;
    reputation: number;
    operational: number;
    legal: number;
    compliance: number;
}

export interface FixRecommendation {
    action: string;
    est_time: string;
    mitigation: string;
}

export interface TechnicalDetails {
    cvss_vector: string;
    affected_components: string[];
    attack_vector: string;
    exploit_available: boolean;
    patch_available: boolean;
}

export interface CalculationBreakdown {
    likelihood: number;
    impact: number;
    exposure: number;
    formula_used: string;
}

export interface Vulnerability {
    vulnerability_id: string;
    name: string;
    current_score: number;
    severity: string;
    status_tags: string[];
    worst_case_scenario: string;
    executive_verdict: ExecutiveVerdict;
    impact_analysis: ImpactAnalysis;
    fix_recommendation: FixRecommendation;
    technical_details: TechnicalDetails;
    calculation_breakdown: CalculationBreakdown;
}

export interface DashboardData {
    success: boolean;
    data: {
        vulnerabilities: Vulnerability[];
        total_count: number;
        analyzed_at: string;
    };
    metadata: {
        model: string;
        tokens_used: number;
        prompt_tokens: number;
        completion_tokens: number;
    };
}
