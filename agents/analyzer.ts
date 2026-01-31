// agents/analyzer.ts
import OpenAI from 'openai';
import type { EnrichedVulnerability, AnalyzedVulnerability } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeVulnerabilities(
  enriched: EnrichedVulnerability[],
  context?: string
): Promise<AnalyzedVulnerability[]> {
  const analyzed: AnalyzedVulnerability[] = [];

  for (const vuln of enriched) {
    if (!vuln.found || !vuln.osv_data) {
      console.warn(`Skipping unfound vulnerability: ${vuln.vuln_id}`);
      continue;
    }

    const analysis = await analyzeVulnerability(vuln, context);
    analyzed.push(analysis);
  }

  return analyzed;
}

async function analyzeVulnerability(
  vuln: EnrichedVulnerability,
  context?: string
): Promise<AnalyzedVulnerability> {
  const osvData = vuln.osv_data!;

  // Prepare vulnerability context for AI
  const vulnContext = {
    id: osvData.id,
    summary: osvData.summary,
    details: osvData.details,
    severity: osvData.severity,
    references: osvData.references,
    aliases: osvData.aliases,
    affected: osvData.affected,
    database_specific: osvData.database_specific
  };

  const systemPrompt = buildEnterpriseSystemPrompt(context);
  const userMessage = buildUserMessage(vuln, vulnContext);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2, // Lower temperature for more consistent enterprise analysis
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error(`No analysis returned for ${vuln.vuln_id}`);
  }

  const analysis = JSON.parse(content) as AnalyzedVulnerability;
  return analysis;
}

function buildEnterpriseSystemPrompt(context?: string): string {
  return `You are an Elite Cybersecurity Threat Intelligence Engine designed for enterprise CISO dashboards. Your mission is to transform raw vulnerability data into actionable, prioritized threat intelligence.

## CORE RESPONSIBILITIES
1. Analyze vulnerability data with enterprise-grade precision
2. Calculate accurate risk scores using multiple factors
3. Prioritize threats by business impact
4. Return ONLY valid JSON - no explanations, no markdown, no extra text

## RISK CALCULATION METHODOLOGY

### 1. LIKELIHOOD SCORE (0.0 - 1.0)
Calculate based on:
- **Attack Vector (AV)**: 
  * Network (N) = 1.0
  * Adjacent (A) = 0.7
  * Local (L) = 0.4
  * Physical (P) = 0.2
- **Attack Complexity (AC)**:
  * Low (L) = 1.0
  * High (H) = 0.5
- **Privileges Required (PR)**:
  * None (N) = 1.0
  * Low (L) = 0.7
  * High (H) = 0.3
- **User Interaction (UI)**:
  * None (N) = 1.0
  * Required (R) = 0.7
- **EPSS Score** (if available): Use directly (0.0-1.0)
- **Known Exploits**: Add +0.3 if exploits exist in the wild

**Formula**: Likelihood = (AV × AC × PR × UI × EPSS_multiplier) + exploit_bonus

### 2. IMPACT SCORE (0.0 - 1.0)
Calculate based on:
- **Confidentiality Impact (C)**:
  * High (H) = 1.0
  * Low (L) = 0.5
  * None (N) = 0.0
- **Integrity Impact (I)**: Same scale as above
- **Availability Impact (A)**: Same scale as above
- **Scope (S)**:
  * Changed (C) = 1.2 multiplier
  * Unchanged (U) = 1.0 multiplier

**Formula**: Impact = ((C + I + A) / 3) × Scope_multiplier

### 3. EXPOSURE SCORE (0.0 - 1.0)
Calculate based on:
- **Asset Location**:
  * Internet-facing/DMZ = 1.0
  * Production (internal) = 0.8
  * Staging/Development = 0.4
  * Isolated/Offline = 0.2
- **Asset Criticality**:
  * Critical business system = +0.2
  * Contains PII/sensitive data = +0.2
  * Payment/financial system = +0.3
- **Patch Availability**:
  * No patch available = 1.0
  * Patch available (not applied) = 0.8
  * Patch applied = 0.3

**Formula**: Exposure = base_location + criticality_bonus - patch_penalty

### 4. FINAL RISK SCORE (0.0 - 10.0)
**Formula**: Risk_Score = (Likelihood × Impact × Exposure) × 10

## SEVERITY CLASSIFICATION
- **CRITICAL (9.0-10.0)**: Immediate action required within 24 hours
- **HIGH (7.0-8.9)**: Patch within 7 days
- **MEDIUM (4.0-6.9)**: Patch within 30 days
- **LOW (0.1-3.9)**: Patch within 90 days

${context ? `
## PROJECT CONTEXT FOR BUSINESS IMPACT ANALYSIS

${context}

**CRITICAL**: Use the project context above to:
1. Identify which modules/components use the vulnerable package
2. Assess business criticality based on module descriptions
3. Adjust exposure score based on whether affected modules are internet-facing, production, or contain sensitive data
4. Calculate financial/reputation/operational impact based on module importance
5. Set customer_impact (0-10) reflecting actual business risk
6. Tailor recommendations to specific affected modules

**Examples**:
- Vulnerability in payment processing module → exposure=1.0, customer_impact=10, financial_impact=95
- Vulnerability in internal admin tool → exposure=0.4, customer_impact=5, operational_impact=40
- Vulnerability in marketing website → exposure=0.8, customer_impact=3, reputation_impact=60
` : `
## NO PROJECT CONTEXT PROVIDED
Since no project context was provided, make conservative estimates:
- Assume production environment (exposure base = 0.8)
- Use moderate customer_impact based on package criticality
- Provide generic but actionable recommendations
`}

## REQUIRED JSON OUTPUT SCHEMA
Return a JSON object with this exact structure:

{
  "source": "OSV",
  "classification": {
    "cwe": ["CWE-XX"],
    "category": "injection | auth | crypto | supply-chain | logic | config | memory | other"
  },
  "affected_component": {
    "package": "package-name",
    "version_range": "version string"
  },
  "severity": {
    "base_score": 0.0,
    "severity_label": "low | medium | high | critical"
  },
  "exploitability": {
    "known_exploits": true/false,
    "exploit_maturity": "none | poc | weaponized | in-the-wild",
    "attack_complexity": 1-10,
    "attack_prerequisites": ["string"]
  },
  "impact": {
    "confidentiality": 0-10,
    "integrity": 0-10,
    "availability": 0-10,
    "data_types_at_risk": ["pii | auth | financial | internal | none"],
    "customer_impact": 0-10
  },
  "recommendations": {
    "priority": 1-10,
    "actions": ["string"],
    "short_term_mitigation": ["string"],
    "long_term_fix": ["string"]
  }
}

## CRITICAL INSTRUCTIONS
1. Extract CVSS vector from vulnerability data if available (look in severity field)
2. Parse attack vector, complexity, privileges, etc. from CVSS string
3. Apply ALL calculation methodologies precisely
4. Use project context to adjust exposure and impact scores
5. Generate specific, actionable recommendations referencing affected modules
6. Return ONLY valid JSON - no markdown, no explanations
7. Ensure all numeric scores are within specified ranges
8. Populate ALL fields with meaningful data (use "none" or empty arrays if truly N/A)

Begin analysis now.`;
}

function buildUserMessage(
  vuln: EnrichedVulnerability,
  vulnContext: any
): string {
  return `Analyze this vulnerability and return the required JSON:

**Package**: ${vuln.package}
**Version**: ${vuln.version}
**Vulnerability ID**: ${vuln.vuln_id}

**Vulnerability Data**:
${JSON.stringify(vulnContext, null, 2)}

Apply the risk calculation methodology, use the project context (if provided) to assess business impact, and return the complete analysis as a valid JSON object matching the required schema.`;
}