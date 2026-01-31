import { PipelineState } from "@/core/state";
import { ThreatIntelMap } from "@/schemas/threat";
import { checkVirusTotal } from "./virustotal";
import { checkNVD } from "./nvd";
import { detectTyposquatting } from "./heuristics";

export async function runThreatIntel(state: PipelineState) {
    if (!state.parsedDependencies) return;

    console.log("⚠️ [Agent: Threat Intel] Scanning external databases...");
    const intel: ThreatIntelMap = {};

    for (const dep of state.parsedDependencies) {
        intel[dep.package_name] = {
            vt: await checkVirusTotal(dep),
            cve: await checkNVD(dep),
            heuristics: detectTyposquatting(dep.package_name)
        };
    }

    state.threatIntel = intel;
}
