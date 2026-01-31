export interface LLMRequest {
    model: string;
    system: string;
    user: string | object;
    max_tokens?: number;
    temperature?: number;
}

const HF_ROUTER_URL = 'https://router.huggingface.co/v1/chat/completions';
const DEFAULT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';

export async function callLLM(request: LLMRequest): Promise<any> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
        throw new Error("Missing HUGGINGFACE_API_KEY");
    }

    const userContent = typeof request.user === 'string'
        ? request.user
        : JSON.stringify(request.user, null, 2);

    try {
        const response = await fetch(HF_ROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: request.model || DEFAULT_MODEL,
                messages: [
                    { role: "system", content: request.system },
                    { role: "user", content: userContent }
                ],
                max_tokens: request.max_tokens || 1000,
                temperature: request.temperature || 0.1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error("Empty response from LLM");
        }

        // Auto-clean code blocks if present
        const cleaned = content.replace(/```json\n?|```/g, "").trim();

        try {
            return JSON.parse(cleaned);
        } catch {
            return cleaned; // Return raw text if not valid JSON
        }

    } catch (error) {
        console.error("LLM Call Failed:", error);
        throw error;
    }
}
