import { Dependency } from "@/schemas/dependency";

export async function checkVirusTotal(dep: Dependency) {
    // In a real app, fetch("https://www.virustotal.com/api/v3/...")

    // Simulation:
    // If package name contains "evil" or "test-malware", flag it.
    const isSuspicious = dep.package_name.includes("evil") || dep.package_name.includes("hack");

    return {
        malicious: isSuspicious ? 5 : 0,
        suspicious: isSuspicious ? 2 : 0,
        harmless: 85
    };
}
