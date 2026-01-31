// agents/output-validator.ts
import type { FinalOutput, ValidationResult } from '../types';

export async function validateOutput(output: FinalOutput): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate generated_at
    if (!output.generated_at || typeof output.generated_at !== 'string') {
        errors.push('Missing or invalid generated_at timestamp');
    }

    // Validate aggregate_risk
    if (!output.aggregate_risk) {
        errors.push('Missing aggregate_risk object');
    } else {
        const ar = output.aggregate_risk;

        if (typeof ar.risk_score !== 'number' || ar.risk_score < 0 || ar.risk_score > 10) {
            warnings.push('risk_score should be between 0 and 10');
        }

        if (!['low', 'medium', 'high', 'critical'].includes(ar.risk_level)) {
            errors.push('Invalid risk_level value');
        }

        if (typeof ar.blast_radius !== 'number' || ar.blast_radius < 0) {
            warnings.push('blast_radius should be a non-negative number');
        }

        if (typeof ar.exploit_likelihood !== 'number') {
            warnings.push('exploit_likelihood should be a number');
        }

        if (typeof ar.impact_potential !== 'number') {
            warnings.push('impact_potential should be a number');
        }

        if (typeof ar.time_to_exploit_estimate_days !== 'number') {
            warnings.push('time_to_exploit_estimate_days should be a number');
        }

        if (!Array.isArray(ar.dominant_risk_factors)) {
            errors.push('dominant_risk_factors should be an array');
        }
    }

    // Validate vulnerabilities array
    if (!Array.isArray(output.vulnerabilities)) {
        errors.push('vulnerabilities should be an array');
    } else {
        output.vulnerabilities.forEach((vuln, idx) => {
            // Validate source
            if (!['OSV', 'NVD', 'advisory', 'custom'].includes(vuln.source)) {
                warnings.push(`Vulnerability ${idx}: invalid source value`);
            }

            // Validate classification
            if (!vuln.classification || !vuln.classification.category) {
                warnings.push(`Vulnerability ${idx}: missing classification`);
            }

            // Validate severity
            if (!vuln.severity || typeof vuln.severity.base_score !== 'number') {
                warnings.push(`Vulnerability ${idx}: invalid severity`);
            }

            // Validate exploitability
            if (!vuln.exploitability) {
                warnings.push(`Vulnerability ${idx}: missing exploitability`);
            }

            // Validate impact
            if (!vuln.impact) {
                warnings.push(`Vulnerability ${idx}: missing impact`);
            }

            // Validate recommendations
            if (!vuln.recommendations) {
                warnings.push(`Vulnerability ${idx}: missing recommendations`);
            }
        });
    }

    // Validate action_plan
    if (!output.action_plan) {
        errors.push('Missing action_plan object');
    } else {
        const ap = output.action_plan;

        if (!Array.isArray(ap.immediate)) {
            errors.push('action_plan.immediate should be an array');
        }

        if (!Array.isArray(ap.near_term)) {
            errors.push('action_plan.near_term should be an array');
        }

        if (!Array.isArray(ap.long_term)) {
            errors.push('action_plan.long_term should be an array');
        }

        if (typeof ap.estimated_total_effort_hours !== 'number') {
            warnings.push('estimated_total_effort_hours should be a number');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        dependencies: [] // Not used in output validation
    };
}