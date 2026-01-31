// agents/enricher.ts
import type { ParsedDependency, EnrichedVulnerability, OSVVulnerability } from '../types';

const OSV_API_BASE = 'https://api.osv.dev/v1';

async function fetchOSVVulnerability(vulnId: string): Promise<OSVVulnerability | null> {
    try {
        const response = await fetch(`${OSV_API_BASE}/vulns/${vulnId}`);

        if (!response.ok) {
            console.warn(`OSV API returned ${response.status} for ${vulnId}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${vulnId} from OSV:`, error);
        return null;
    }
}

async function queryOSVByPackage(packageName: string, ecosystem?: string): Promise<OSVVulnerability[]> {
    try {
        const query = {
            package: {
                name: packageName,
                ...(ecosystem && { ecosystem })
            }
        };

        const response = await fetch(`${OSV_API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.vulns || [];
    } catch (error) {
        console.error(`Error querying OSV for ${packageName}:`, error);
        return [];
    }
}

export async function enrichVulnerabilities(
    dependencies: ParsedDependency[]
): Promise<EnrichedVulnerability[]> {
    const enriched: EnrichedVulnerability[] = [];

    for (const dep of dependencies) {
        // If we have specific vulnerability IDs, fetch them
        if (dep.vuln_ids.length > 0) {
            for (const vulnId of dep.vuln_ids) {
                const osvData = await fetchOSVVulnerability(vulnId);
                enriched.push({
                    vuln_id: vulnId,
                    package: dep.package,
                    version: dep.version,
                    osv_data: osvData,
                    found: osvData !== null
                });
            }
        } else {
            // No specific vuln IDs, try to query by package name
            console.log(`No vuln IDs for ${dep.package}, querying OSV by package...`);
            const vulns = await queryOSVByPackage(dep.package);

            if (vulns.length > 0) {
                for (const vuln of vulns) {
                    enriched.push({
                        vuln_id: vuln.id,
                        package: dep.package,
                        version: dep.version,
                        osv_data: vuln,
                        found: true
                    });
                }
            } else {
                // No vulnerabilities found for this package
                console.log(`No vulnerabilities found for ${dep.package}`);
            }
        }
    }

    return enriched;
}