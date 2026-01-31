// agents/prioritizer.ts
import OpenAI from 'openai';
import type { AnalyzedVulnerability, FinalOutput } from '../types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function prioritizeAndFormat(
    vulnerabilities: AnalyzedVulnerability[]
): Promise<FinalOutput> {
    // Sort by severity score (highest first)
    const sorted = vulnerabilities.sort((a, b) => b.severity.base_score - a.severity.base_score);

    // Calculate aggregate risk metrics
    const aggregateRisk = calculateAggregateRisk(sorted);

    // Generate action plan using AI
    const actionPlan = await generateActionPlan(sorted);

    return {
        generated_at: new Date().toISOString(),
        aggregate_risk: aggregateRisk,
        vulnerabilities: sorted,
        action_plan: actionPlan
    };
}

function calculateAggregateRisk(vulnerabilities: AnalyzedVulnerability[]) {
    if (vulnerabilities.length === 0) {
        return {
            risk_score: 0,
            risk_level: 'low' as const,
            blast_radius: 0,
            exploit_likelihood: 0,
            impact_potential: 0,
            time_to_exploit_estimate_days: 0,
            dominant_risk_factors: []
        };
    }

    // Calculate average severity
    const avgSeverity = vulnerabilities.reduce((sum, v) => sum + v.severity.base_score, 0) / vulnerabilities.length;

    // Calculate blast radius (number of affected components)
    const uniquePackages = new Set(vulnerabilities.map(v => v.affected_component.package));
    const blastRadius = uniquePackages.size;

    // Calculate exploit likelihood (average of known exploits and maturity)
    const exploitLikelihood = vulnerabilities.reduce((sum, v) => {
        const maturityScore = {
            'none': 0,
            'poc': 3,
            'weaponized': 7,
            'in-the-wild': 10
        }[v.exploitability.exploit_maturity] || 0;

        const knownExploitBonus = v.exploitability.known_exploits ? 2 : 0;
        return sum + (maturityScore + knownExploitBonus);
    }, 0) / vulnerabilities.length / 12 * 10; // Normalize to 0-10

    // Calculate impact potential (average of CIA + customer impact)
    const impactPotential = vulnerabilities.reduce((sum, v) => {
        const ciaAvg = (v.impact.confidentiality + v.impact.integrity + v.impact.availability) / 3;
        const combined = (ciaAvg + v.impact.customer_impact) / 2;
        return sum + combined;
    }, 0) / vulnerabilities.length;

    // Estimate time to exploit (lower for higher maturity exploits)
    const criticalCount = vulnerabilities.filter(v => v.severity.severity_label === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity.severity_label === 'high').length;
    const inTheWildCount = vulnerabilities.filter(v => v.exploitability.exploit_maturity === 'in-the-wild').length;

    let timeToExploit = 30; // Default 30 days
    if (inTheWildCount > 0) timeToExploit = 1;
    else if (criticalCount > 0) timeToExploit = 7;
    else if (highCount > 0) timeToExploit = 14;

    // Calculate overall risk score (weighted combination)
    const riskScore = (
        avgSeverity * 0.4 +
        exploitLikelihood * 0.3 +
        impactPotential * 0.2 +
        (blastRadius / uniquePackages.size * 10) * 0.1
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 9) riskLevel = 'critical';
    else if (riskScore >= 7) riskLevel = 'high';
    else if (riskScore >= 4) riskLevel = 'medium';
    else riskLevel = 'low';

    // Identify dominant risk factors
    const dominantFactors: string[] = [];
    if (criticalCount > 0) dominantFactors.push(`${criticalCount} critical vulnerabilities`);
    if (inTheWildCount > 0) dominantFactors.push(`${inTheWildCount} actively exploited in the wild`);
    if (blastRadius > 3) dominantFactors.push(`High blast radius (${blastRadius} packages)`);
    if (exploitLikelihood > 7) dominantFactors.push('High exploit likelihood');

    return {
        risk_score: Math.round(riskScore * 10) / 10,
        risk_level: riskLevel,
        blast_radius: blastRadius,
        exploit_likelihood: Math.round(exploitLikelihood * 10) / 10,
        impact_potential: Math.round(impactPotential * 10) / 10,
        time_to_exploit_estimate_days: timeToExploit,
        dominant_risk_factors: dominantFactors.length > 0 ? dominantFactors : ['No major risk factors identified']
    };
}

async function generateActionPlan(vulnerabilities: AnalyzedVulnerability[]) {
    if (vulnerabilities.length === 0) {
        return {
            immediate: ['No vulnerabilities detected'],
            near_term: [],
            long_term: [],
            estimated_total_effort_hours: 0
        };
    }

    // Prepare summary for AI
    const summary = {
        total_vulns: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity.severity_label === 'critical').length,
        high: vulnerabilities.filter(v => v.severity.severity_label === 'high').length,
        medium: vulnerabilities.filter(v => v.severity.severity_label === 'medium').length,
        low: vulnerabilities.filter(v => v.severity.severity_label === 'low').length,
        top_vulns: vulnerabilities.slice(0, 5).map(v => ({
            package: v.affected_component.package,
            severity: v.severity.severity_label,
            priority: v.recommendations.priority,
            actions: v.recommendations.actions
        }))
    };

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a security remediation planner. Generate a prioritized action plan based on vulnerability data.

Return a JSON object with this structure:
{
  "immediate": ["actions to take within 24 hours"],
  "near_term": ["actions to take within 1-2 weeks"],
  "long_term": ["actions to take within 1-3 months"],
  "estimated_total_effort_hours": 0
}

Immediate actions should focus on critical/high severity vulnerabilities that are actively exploited.
Near-term should address remaining high/medium severity issues.
Long-term should cover medium/low severity and technical debt.

Estimate effort in hours realistically.`
            },
            {
                role: 'user',
                content: `Generate an action plan for these vulnerabilities:

${JSON.stringify(summary, null, 2)}`
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error('No action plan generated');
    }

    return JSON.parse(content);
}