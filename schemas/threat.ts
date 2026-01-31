export interface ThreatIntel {
    vt: {
        malicious: number;
        suspicious: number;
        harmless: number;
    };
    cve: string[]; // List of CVE IDs
    heuristics: string[]; // e.g. ["typosquatting_detected"]
}

export interface ThreatIntelMap {
    [package_name: string]: ThreatIntel;
}
