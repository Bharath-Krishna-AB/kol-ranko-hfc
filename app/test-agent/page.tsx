import { runPipeline } from "@/core/orchestrator";

export default async function Page() {
    const payload = "react 18.2.0\nreqeusts 1.0.0 (unknown source)";

    let result;
    try {
        result = await runPipeline(payload);
    } catch (e: any) {
        result = { error: e.message };
    }

    return (
        <div className="p-10 font-mono whitespace-pre-wrap">
            <h1 className="text-xl font-bold mb-4">Agent Pipeline Test Results</h1>
            <div className="bg-gray-100 p-4 rounded text-black">
                {JSON.stringify(result, null, 2)}
            </div>
        </div>
    );
}
