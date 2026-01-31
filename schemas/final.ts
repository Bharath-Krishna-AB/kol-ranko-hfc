export interface PipelineScore {
    validation: number;
    threat: number;
    patterns: number;
    reputation: number;
    final: number; // 0-100
    risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
}

export interface ScoreMap {
    [package_name: string]: PipelineScore;
}

export interface QADecision {
    approved: boolean;
    flagged_packages: string[];
    summary: string;
    requires_human_review: boolean;
}
