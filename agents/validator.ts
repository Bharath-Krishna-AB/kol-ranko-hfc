// agents/validator.ts
import type { ParsedDependency, ValidationResult } from '@/schemas/agent';

export async function validateDependencies(
    dependencies: ParsedDependency[]
): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(dependencies) || dependencies.length === 0) {
        errors.push('No dependencies found in parsed input');
        return { valid: false, errors, warnings, dependencies: [] };
    }

    const validDependencies: ParsedDependency[] = [];

    for (const dep of dependencies) {
        // Check required fields
        if (!dep.package || typeof dep.package !== 'string') {
            warnings.push(`Skipping dependency with missing/invalid package name`);
            continue;
        }

        if (!dep.version || typeof dep.version !== 'string') {
            warnings.push(`Dependency ${dep.package} has missing/invalid version`);
            dep.version = 'unknown';
        }

        if (!Array.isArray(dep.vuln_ids)) {
            warnings.push(`Dependency ${dep.package} has invalid vuln_ids, defaulting to empty array`);
            dep.vuln_ids = [];
        }

        // Validate vulnerability ID formats
        const validVulnIds = dep.vuln_ids.filter(id => {
            const isCVE = /^CVE-\d{4}-\d{4,}$/i.test(id);
            const isGHSA = /^GHSA(-[a-z0-9]{4}){3}$/i.test(id);
            const isOther = id.startsWith('OSV-') || id.startsWith('PYSEC-') || id.startsWith('RUSTSEC-');

            if (!isCVE && !isGHSA && !isOther) {
                warnings.push(`Invalid vulnerability ID format: ${id} in ${dep.package}`);
                return false;
            }
            return true;
        });

        validDependencies.push({
            ...dep,
            vuln_ids: validVulnIds
        });
    }

    if (validDependencies.length === 0) {
        errors.push('No valid dependencies after validation');
        return { valid: false, errors, warnings, dependencies: [] };
    }

    return {
        valid: true,
        errors,
        warnings,
        dependencies: validDependencies
    };
}