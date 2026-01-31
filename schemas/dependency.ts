export interface Dependency {
    package_name: string;
    version: string;
    source?: "npm" | "pypi" | "maven" | "unknown";
    repository_url?: string;
    confidence: number; // 0.0 to 1.0
    suspicious_indicators?: string[];
}
