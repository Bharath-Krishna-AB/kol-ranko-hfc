import 'dotenv/config';
import { runPipeline } from "./core/orchestrator";

async function main() {
    console.log("🚀 Starting Complex Mock Data Test...\n");

    const payload = `react 18.2.0
axios 0.21.4
lodash 4.17.19
reqeusts 1.0.0 (unknown source)
fast-json-parse 1.0.3
node-crypt-utils 0.1.0`;

    console.log("📝 Input:", payload);
    console.log("-----------------------------------");

    try {
        const result = await runPipeline(payload);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

main();
