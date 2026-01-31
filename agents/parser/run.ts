import { PipelineState } from "@/core/state";
import { callLLM } from "@/lib/llm";
import { PARSER_PROMPT } from "./prompt";

export async function runParser(state: PipelineState) {
    try {
        console.log("🔍 [Agent: Parser] Running...");
        const response = await callLLM({
            model: "Qwen/Qwen2.5-7B-Instruct",
            system: PARSER_PROMPT,
            user: state.rawInput,
            temperature: 0.1
        });

        // Ensure we handle both nested "dependencies" key or direct array
        const results = response.dependencies || (Array.isArray(response) ? response : []);

        state.parsedDependencies = results;
        console.log(`✅ [Agent: Parser] Extracted ${results.length} dependencies`);
    } catch (error: any) {
        console.error("❌ [Agent: Parser] Failed:", error);
        state.errors = [...(state.errors || []), `Parser Error: ${error.message}`];
        state.parsedDependencies = [];
    }
}
