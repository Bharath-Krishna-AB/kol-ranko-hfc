// core/orchestrator.ts
import { parseInput } from '../agents/parser';
import { validateDependencies } from '../agents/validator';
import { enrichVulnerabilities } from '../agents/enricher';
import { analyzeVulnerabilities } from '../agents/analyzer';
import { validateOutput } from '../agents/output-validator';
import { prioritizeAndFormat } from '../agents/prioritizer';
import type { FinalOutput } from '@/schemas/agent';

export async function runPipeline(unstructuredText: string, context?: string): Promise<FinalOutput> {
    console.log('[Pipeline] Starting multi-stage analysis...');

    // Stage 1: Parse unstructured input
    console.log('[Pipeline] Stage 1: Parsing input...');
    const parsed = await parseInput(unstructuredText);

    // Stage 2: Validate parsed dependencies
    console.log('[Pipeline] Stage 2: Validating dependencies...');
    const validation = await validateDependencies(parsed);

    if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Stage 3: Enrich with vulnerability data from OSV
    console.log('[Pipeline] Stage 3: Enriching with vulnerability data...');
    const enriched = await enrichVulnerabilities(validation.dependencies);

    // Stage 4: Analyze and score vulnerabilities (with context)
    console.log('[Pipeline] Stage 4: Analyzing vulnerabilities...');
    const analyzed = await analyzeVulnerabilities(enriched, context);

    // Stage 5: Prioritize and format output
    console.log('[Pipeline] Stage 5: Prioritizing and formatting...');
    const output = await prioritizeAndFormat(analyzed);

    // Stage 6: Validate final output
    console.log('[Pipeline] Stage 6: Validating output...');
    const outputValidation = await validateOutput(output);

    if (!outputValidation.valid) {
        console.warn('[Pipeline] Output validation warnings:', outputValidation.warnings);
    }

    console.log('[Pipeline] Complete!');
    return output;
}