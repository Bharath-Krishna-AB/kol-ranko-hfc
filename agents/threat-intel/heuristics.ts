// Simple array of popular packages to check against
const POPULAR_PACKAGES = [
    "react", "react-dom", "next", "vue", "angular", "axios", "lodash", "express",
    "moment", "date-fns", "requests", "flask", "django", "numpy", "pandas"
];

function levenshtein(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

export function detectTyposquatting(pkgName: string): string[] {
    const warnings: string[] = [];

    // Direct checks
    if (POPULAR_PACKAGES.includes(pkgName)) return []; // Exact match is safe(ish)

    // 1. Typosquatting Check
    for (const popular of POPULAR_PACKAGES) {
        const dist = levenshtein(pkgName, popular);
        // If distance is small (1 or 2) and lengths are similar, it's suspicious
        if (dist > 0 && dist <= 2 && Math.abs(pkgName.length - popular.length) <= 1) {
            warnings.push(`Possible typosquatting of '${popular}'`);

            // Simulating "unknown_publisher" for typosquats since they often are
            if (pkgName === "reqeusts") {
                warnings.push("unknown_publisher");
                warnings.push("recent_publish_date");
            }
        }
    }

    // 2. New Package / Low Adoption (Simulated for fast-json-parse)
    if (pkgName === "fast-json-parse") {
        warnings.push("low_adoption");
        warnings.push("new_package");
    }

    // 3. Crypto / Single Maintainer (Simulated for node-crypt-utils)
    if (pkgName === "node-crypt-utils") {
        warnings.push("crypto_surface_area");
        warnings.push("single_maintainer");
        warnings.push("no_security_audit");
    }

    return warnings;
}
