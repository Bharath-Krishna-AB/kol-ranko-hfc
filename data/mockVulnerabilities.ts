export interface Vulnerability {
    id: string;
    title: string;
    riskScore: number; // 0-10
    severity: "Critical" | "High" | "Medium" | "Low";
    impact: string;
    tags: string[];
    exploitLikelihood: "High" | "Medium" | "Low";
    blastRadius: "Global" | "Regional" | "Local";
}

export const MOCK_VULNERABILITIES: Vulnerability[] = [
    {
        id: "V-2024-001",
        title: "Log4Shell Variant in Payment Gateway",
        riskScore: 9.8,
        severity: "Critical",
        impact: "Full System Compromise",
        tags: ["Internet-Facing", "Actively Exploited", "Production"],
        exploitLikelihood: "High",
        blastRadius: "Global",
    },
    {
        id: "V-2024-002",
        title: "SQL Injection in User Auth",
        riskScore: 9.5,
        severity: "Critical",
        impact: "Data Exfiltration",
        tags: ["Legacy Code", "PII Exposure"],
        exploitLikelihood: "High",
        blastRadius: "Global",
    },
    {
        id: "V-2024-003",
        title: "Exposed AWS Credentials",
        riskScore: 9.2,
        severity: "Critical",
        impact: "Unauthorized Access",
        tags: ["Misconfiguration", "Cloud Assets"],
        exploitLikelihood: "Medium",
        blastRadius: "Global",
    },
    {
        id: "V-2024-004",
        title: "XSS in Dashboard Analytics",
        riskScore: 8.8,
        severity: "High",
        impact: "Session Hijacking",
        tags: ["Client-Side", "Internal Tool"],
        exploitLikelihood: "Medium",
        blastRadius: "Regional",
    },
    {
        id: "V-2024-005",
        title: "Missing Patch for Nginx",
        riskScore: 8.5,
        severity: "High",
        impact: "Service Disruption",
        tags: ["Infrastructure", "Patch Available"],
        exploitLikelihood: "Low",
        blastRadius: "Regional",
    },
    {
        id: "V-2024-006",
        title: "Weak Encryption in Legacy API",
        riskScore: 8.0,
        severity: "High",
        impact: "Data Interception",
        tags: ["Compliance Violation", "Deprecated"],
        exploitLikelihood: "Low",
        blastRadius: "Local",
    },
    {
        id: "V-2024-007",
        title: "Open Redis Instance",
        riskScore: 7.8,
        severity: "Medium",
        impact: "Data Leak",
        tags: ["Misconfiguration", "Database"],
        exploitLikelihood: "Medium",
        blastRadius: "Local",
    },
    {
        id: "V-2024-008",
        title: "Expired SSL Certificate",
        riskScore: 7.5,
        severity: "Medium",
        impact: "Service Unavailability",
        tags: ["Operational", "Time-Sensitive"],
        exploitLikelihood: "Low",
        blastRadius: "Local",
    },
    {
        id: "V-2024-009",
        title: "Hardcoded API Key in Script",
        riskScore: 7.2,
        severity: "Medium",
        impact: "Unauthorized Access",
        tags: ["Code Quality", "DevOps"],
        exploitLikelihood: "Low",
        blastRadius: "Local",
    },
    {
        id: "V-2024-010",
        title: "Default Admin Password",
        riskScore: 7.0,
        severity: "Medium",
        impact: "Account Takeover",
        tags: ["Default Config", "IoT Device"],
        exploitLikelihood: "Medium",
        blastRadius: "Local",
    },
];
