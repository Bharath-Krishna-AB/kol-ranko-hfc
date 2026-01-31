import { PipelineState } from "@/core/state";
import { validatePackage } from "./rules";

export function runValidator(state: PipelineState) {
    if (!state.parsedDependencies) return;

    console.log("✅ [Agent: Validator] Running rules...");

    state.validationResults = state.parsedDependencies.map(dep =>
        validatePackage(dep)
    );
}
