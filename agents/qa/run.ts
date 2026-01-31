import { PipelineState } from "@/core/state";
import { callLLM } from "@/lib/llm";

export async function runQA(state: PipelineState) {
    console.log("🔬 [Agent: QA] Reviewing pipeline results...");

    // summarization prompt
    const context = {
        dependencies: state.parsedDependencies?.length,
        scores: state.scores,
        critical_issues: Object.entries(state.scores || {})
            .filter(([_, s]) => s.final > 50)
            .map(([pkg, s]) => ({ pkg, score: s.final, level: s.risk_level }))
    };

    try {
        const response = await callLLM({
            model: "Qwen/Qwen2.5-7B-Instruct", // Using Qwen for QA as well for cost/speed in this demo
            system: `You are a security QA arbiter. Review the pipeline results.
            
            DECISION RULES:
            1. If any package has CRITICAL risk, flag it.
            2. If multiple MEDIUM risks, require human review.
            3. Summarize findings in plain English.
            
            OUTPUT JSON:
            {
                "approved": boolean,
                "flagged_packages": ["pkg_names"],
                "summary": "string",
                "requires_human_review": boolean
            }`,
            user: JSON.stringify(context)
        });

        state.qaDecision = response;
    } catch (e) {
        console.error("QA Agent Failed", e);
        // Fallback safe defaults
        state.qaDecision = {
            approved: false,
            flagged_packages: [],
            summary: "QA Agent failed to generate summary.",
            requires_human_review: true
        };
    }
}
