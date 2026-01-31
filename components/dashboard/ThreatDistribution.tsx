"use client";

import React, { useState, useEffect, useRef } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";

// --- Terminal Component ---

const TerminalLog = ({ vulnerabilities }: { vulnerabilities: any[] }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let stepIndex = 0;

        const generateBackendLog = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });

            // Random context for logs
            const vuln = vulnerabilities[Math.floor(Math.random() * vulnerabilities.length)] || { package: "unknown", vuln_id: "CVE-2024-XXXX" };
            const pkg = vuln.package || "lib-core";
            const id = vuln.vuln_id || "GHSA-xxxx-yyyy";

            // Simulation of the actual backend pipeline stages
            const stages = [
                { stage: "ORCHESTRATOR", msg: `[Pipeline] Starting multi-stage analysis for input stream...` },
                { stage: "PARSER", msg: `[Parser] Tokenizing input payload (${Math.floor(Math.random() * 500)}ms)` },
                { stage: "VALIDATOR", msg: `[Validator] Checking dependencies for ${pkg}...` },
                { stage: "VALIDATOR", msg: `[Validator] Regex match confirmed for ${id}` },
                { stage: "ENRICHER", msg: `[Enricher] Fetching metadata from OSV database for ${pkg}` },
                { stage: "ENRICHER", msg: `[Enricher] Retrieved CVSS vector: CVSS:3.1/AV:N/AC:L/PR:N/UI:N` },
                { stage: "ANALYZER", msg: `[Analyzer] Function: analyzeVulnerability(${id})` },
                { stage: "ANALYZER", msg: `[Analyzer] Context: Enterprise System Prompt (4k tokens)` },
                { stage: "ANALYZER", msg: `[Analyzer] Calculating Risk Score: Likelihood x Impact x Exposure` },
                { stage: "ANALYZER", msg: `[Analyzer] AI reasoning complete. Confidence: ${(0.85 + Math.random() * 0.14).toFixed(4)}` },
                { stage: "PRIORITIZER", msg: `[Prioritizer] Sorting ${vulnerabilities.length} vulnerabilities by business impact...` },
                { stage: "OUTPUT", msg: `[Pipeline] Validating final JSON schema compliance...` }
            ];

            // Pick a message based on a cycling step index to simulate linear progress
            // Modulo length ensures it loops forever
            const currentStage = stages[stepIndex % stages.length];

            const newLog = `[${time}] ${currentStage.msg}`;

            setLogs(prev => [...prev.slice(-18), newLog]);

            stepIndex++;

            // Vary speed based on "stage" complexity
            // Analyzer steps take longer, simple steps are fast
            const delay = currentStage.stage === "ANALYZER" ? Math.random() * 800 + 400 : Math.random() * 300 + 100;
            setTimeout(generateBackendLog, delay);
        };

        const timeout = setTimeout(generateBackendLog, 500);
        return () => clearTimeout(timeout);
    }, [vulnerabilities]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs]);

    return (
        <div className="flex flex-col h-full w-full bg-[#1e293b] rounded-lg border border-white/5 p-4 font-space-mono text-xs overflow-hidden relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2 z-10">
                <span className="text-accent font-bold tracking-wider">SENTINEL_CORE_V9</span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150"></div>
                </div>
            </div>

            {/* Logs: Explicit text-white for visibility */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 z-10 scrollbar-hide">
                {logs.map((log, i) => (
                    <div key={i} className="text-white/90 border-l-2 border-transparent hover:border-accent pl-2 transition-all break-words font-medium leading-relaxed">
                        <span className="text-accent mr-3">{">"}</span>
                        {log}
                    </div>
                ))}
                <div className="animate-pulse text-accent font-bold pl-2">_</div>
            </div>
        </div>
    );
};


const ThreatDistribution = () => {
    const rawVulnerabilities = getVulnerabilities();

    return (
        <div className="flex h-full w-full flex-col gap-4 rounded-2xl border border-border/50 bg-white/40 p-5 shadow-sm backdrop-blur-md overflow-hidden">

            {/* Header */}
            <div className="flex flex-col gap-2 shrink-0 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="font-space-mono font-bold text-2xl uppercase tracking-tighter text-accent">
                        Sentinel Terminal
                    </h2>
                    <div className="rounded-full bg-accent/10 px-4 py-1.5 text-xs text-accent">
                        LIVE MONITORING
                    </div>
                </div>
                <p className="text-base font-medium text-gray-500 max-w-md">
                    Real-time system integrity and threat feed.
                </p>
            </div>

            {/* Inner "Device" Window - Dark Theme (bg-secondary) */}
            <div className="flex flex-1 items-stretch justify-center overflow-hidden relative rounded-xl bg-secondary border border-border/10 shadow-inner p-2 group">
                {/* Visual Artifacts / Background for Terminal */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none opacity-20"></div>

                {/* SENTINEL TERMINAL - Full Width */}
                <div className="w-full h-full relative z-10">
                    <TerminalLog vulnerabilities={rawVulnerabilities} />
                </div>
            </div>
        </div>
    );
};

export default ThreatDistribution;
