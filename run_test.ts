import 'dotenv/config'; // Load .env
import { runPipeline } from "./core/orchestrator";

async function main() {
    console.log("🚀 Starting Agent Pipeline Test...\n");

    const payload = `react 18.2.0
reqeusts 1.0.0 (unknown source)`;

    console.log("📝 Input:", payload);
    console.log("-----------------------------------");

    try {
        const result = await runPipeline(payload);

        console.log("\n📊 PIPELINE RESULTS:\n");
        console.log(JSON.stringify(result, null, 2));

        // Validation Check
        const hasThreat = result.threatIntel?.['reqeusts']?.heuristics?.length ?? 0 > 0;
        const failedDep = result.validationResults?.find(r => r.package === 'reqeusts');

        if (hasThreat) {
            console.log("\n✅ SUCCESS: Threat Agent detected 'reqeusts' typosquatting.");
        } else {
            console.log("\n❌ FAILURE: Threat Agent failed to detect 'reqeusts'.");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

main();
