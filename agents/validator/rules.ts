import { Dependency } from "@/schemas/dependency";
import { ValidationResult } from "@/schemas/validation";

const SUSPICIOUS_PATTERNS = [
    /^[0-9]+$/, // Numeric only names
    /[^\x20-\x7E]/, // Non-printable ASCII
];

const SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Simple "Known" list for demo
const KNOWN_PACKAGES = ["react", "next", "axios", "lodash", "requests", "express", "moment"];

export function validatePackage(dep: Dependency): ValidationResult {
    const issues: string[] = [];

    // 1. Semver Check
    if (!SEMVER_REGEX.test(dep.version)) {
        issues.push("Invalid Semantic Version");
    }

    // 2. Name Checks
    if (dep.package_name.length < 2) {
        issues.push("Package name too short");
    }

    if (SUSPICIOUS_PATTERNS.some(p => p.test(dep.package_name))) {
        issues.push("Suspicious characters in name");
    }

    // 3. Known Package check (simplified)
    // In a real app, this would check npm registry

    // SIMULATION: "reqeusts" does not exist in registry
    if (dep.package_name === "reqeusts") {
        issues.push("package_not_found_in_registry");
    }

    // SIMULATION: "fast-json-parse" has low download volume
    if (dep.package_name === "fast-json-parse") {
        issues.push("low_download_volume");
    }

    // SIMULATION: "node-crypt-utils" is pre-1.0
    if (dep.package_name === "node-crypt-utils" && dep.version.startsWith("0.")) {
        issues.push("non_semver_pre_1_release");
    }

    return {
        package: dep.package_name,
        isValid: issues.length === 0,
        issues,
        confidenceScore: Math.max(0, 100 - (issues.length * 20))
    };
}
