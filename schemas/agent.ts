// types/index.ts

export interface ParsedDependency {
    package: string;
    version: string;
    vuln_ids: string[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    dependencies: ParsedDependency[];
}

export interface OSVVulnerability {
    id: string;
    summary: string;
    details: string;
    aliases?: string[];
    affected?: Array<{
        package: { name: string; ecosystem: string };
        ranges?: Array<{ type: string; events: Array<{ introduced?: string; fixed?: string }> }>;
    }>;
    severity?: Array<{ type: string; score: string }>;
    references?: Array<{ type: string; url: string }>;
    database_specific?: any;
}

export interface EnrichedVulnerability {
    vuln_id: string;
    package: string;
    version: string;
    osv_data: OSVVulnerability | null;
    found: boolean;
}

export interface AnalyzedVulnerability {
    source: "OSV" | "NVD" | "advisory" | "custom";
    classification: {
        cwe: string[];
        category: "injection" | "auth" | "crypto" | "supply-chain" | "logic" | "config" | "memory" | "other";
    };
    affected_component: {
        package: string;
        version_range: string;
    };
    severity: {
        base_score: number;
        severity_label: "low" | "medium" | "high" | "critical";
    };
    exploitability: {
        known_exploits: boolean;
        exploit_maturity: "none" | "poc" | "weaponized" | "in-the-wild";
        attack_complexity: number;
        attack_prerequisites: string[];
    };
    impact: {
        confidentiality: number;
        integrity: number;
        availability: number;
        data_types_at_risk: ("pii" | "auth" | "financial" | "internal" | "none")[];
        customer_impact: number;
    };
    recommendations: {
        priority: number;
        actions: string[];
        short_term_mitigation: string[];
        long_term_fix: string[];
    };
}

export interface FinalOutput {
    generated_at: string;
    aggregate_risk: {
        risk_score: number;
        risk_level: "low" | "medium" | "high" | "critical";
        blast_radius: number;
        exploit_likelihood: number;
        impact_potential: number;
        time_to_exploit_estimate_days: number;
        dominant_risk_factors: string[];
    };
    vulnerabilities: AnalyzedVulnerability[];
    action_plan: {
        immediate: string[];
        near_term: string[];
        long_term: string[];
        estimated_total_effort_hours: number;
    };
}