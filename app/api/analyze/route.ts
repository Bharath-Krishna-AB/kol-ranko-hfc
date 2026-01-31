import { NextResponse } from "next/server";
import { runPipeline } from "@/core/orchestrator";

export const maxDuration = 60; // Allow longer timeouts for agent chains

export async function POST(req: Request) {
    try {
        const { rawDependabotOutput } = await req.json();

        if (!rawDependabotOutput) {
            return NextResponse.json(
                { error: "Missing 'rawDependabotOutput' in body" },
                { status: 400 }
            );
        }

        const state = await runPipeline(rawDependabotOutput);

        return NextResponse.json(state);

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
