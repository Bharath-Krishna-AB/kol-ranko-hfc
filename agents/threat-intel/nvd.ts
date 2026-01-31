import { Dependency } from "@/schemas/dependency";

export async function checkNVD(dep: Dependency) {
    // Simulation:
    // Randomly assign a CVE for "log4j" or specific versions
    if (dep.package_name.includes("log4j")) {
        return ["CVE-2021-44228"];
    }

    // CVE-2021-3749 for axios 0.21.4 (Simulated)
    if (dep.package_name === "axios" && dep.version === "0.21.4") {
        return ["CVE-2021-3749"];
    }

    // CVE-2020-8203 for lodash 4.17.19 (Simulated)
    if (dep.package_name === "lodash" && dep.version === "4.17.19") {
        return ["CVE-2020-8203"];
    }

    return [];
}
