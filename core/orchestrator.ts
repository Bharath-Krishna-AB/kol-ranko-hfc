import { PipelineState } from "./state";
import { runParser } from "@/agents/parser/run";
import { runValidator } from "@/agents/validator/run";
import { runThreatIntel } from "@/agents/threat-intel/run";
import { runScoring } from "@/agents/scoring/engine";
import { runQA } from "@/agents/qa/run";

export async function runPipeline(rawInput: string): Promise<PipelineState> {
    const state: PipelineState = {
        rawInput,
        errors: []
    };

    try {
        // 1. Parsing
        await runParser(state);

        if (!state.parsedDependencies || state.parsedDependencies.length === 0) {
            state.errors?.push("No dependencies parsed. Aborting pipeline.");
            return state;
        }

        // 2. Validation & Threat Intel (Parallel-ish capability, but keeping sequential for safety)
        runValidator(state);
        await runThreatIntel(state);

        // 3. Scoring
        runScoring(state);

        // 4. QA Arbiter
        await runQA(state);

    } catch (error: any) {
        console.error("🔥 Pipeline Fatal Error:", error);
        state.errors?.push(`Fatal: ${error.message}`);
    }

    return state;
}
