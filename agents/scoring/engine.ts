import { PipelineState } from "@/core/state";
import { Dependency } from "@/schemas/dependency";
import { ScoreMap, PipelineScore } from "@/schemas/final";

function getValidationScore(dep: Dependency, state: PipelineState): number {
    const res = state.validationResults?.find(r => r.package === dep.package_name);
    return res ? res.confidenceScore : 50; // Default to neutral if missing
}

function getThreatScore(dep: Dependency, state: PipelineState): number {
    const intel = state.threatIntel?.[dep.package_name];
    if (!intel) return 100; // Assume safe? No, let's assume risk if unknown. Actually 100 is "good score" usually. 
    // Wait, "Suspicion Score" implies higher is bad. "Confidence Score" implies higher is good. 
    // Let's stick to "Risk Score" where 100 is BAD (Critical) and 0 is SAFE.

    // But the prompt says: 
    // suspicion_score = (validation_confidence * 0.3...)
    // validation_confidence is usually "how good it is". 
    // Let's invert validation for risk: (100 - valid_conf)

    // Simpler: Let's output a RISK score (0-100).

    let score = 0;
    if (intel.vt.malicious > 0) score += 100;
    if (intel.cve.length > 0) score += 50;
    if (intel.heuristics.length > 0) score += 30;

    return Math.min(100, score);
}

function calculateRisk(validationConf: number, threatRisk: number): number {
    // High validation confidence reduced risk? No.
    // Low validation (bad package) increases risk.
    const validationRisk = 100 - validationConf;

    // Weighted Average
    return (validationRisk * 0.3) + (threatRisk * 0.7);
}

export function runScoring(state: PipelineState) {
    if (!state.parsedDependencies) return;

    console.log("🎯 [Agent: Scoring] Calculating risk scores...");
    const scores: ScoreMap = {};

    for (const dep of state.parsedDependencies) {
        const valScore = getValidationScore(dep, state); // 0-100 (Goodness)
        const threatRisk = getThreatScore(dep, state);   // 0-100 (Badness)

        const finalRisk = calculateRisk(valScore, threatRisk);

        let riskLevel: PipelineScore["risk_level"] = "LOW";
        if (finalRisk > 80) riskLevel = "CRITICAL";
        else if (finalRisk > 60) riskLevel = "HIGH";
        else if (finalRisk > 30) riskLevel = "MEDIUM";
        else if (finalRisk < 10) riskLevel = "SAFE";

        scores[dep.package_name] = {
            validation: valScore,
            threat: threatRisk,
            patterns: 0,
            reputation: 0,
            final: Math.round(finalRisk),
            risk_level: riskLevel
        };
    }

    state.scores = scores;
}
