// agents/parser.ts
import OpenAI from 'openai';
import type { ParsedDependency } from '../types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function parseInput(text: string): Promise<ParsedDependency[]> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are a parser that extracts dependency and vulnerability information from unstructured text.
Extract all dependencies mentioned with their versions and any associated vulnerability IDs (CVEs, GHSAs, etc.).

Return a JSON array of objects with this structure:
{
  "package": "package-name",
  "version": "version-string",
  "vuln_ids": ["CVE-XXXX-XXXX", "GHSA-XXXX-XXXX-XXXX"]
}

If no vulnerability IDs are mentioned for a package, return an empty array for vuln_ids.
If version is not specified, use "unknown".
Be generous in extraction - capture anything that looks like a dependency or package.`
            },
            {
                role: 'user',
                content: text
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);

    // Handle both array and object with dependencies key
    const dependencies = Array.isArray(parsed) ? parsed : (parsed.dependencies || []);

    return dependencies as ParsedDependency[];
}