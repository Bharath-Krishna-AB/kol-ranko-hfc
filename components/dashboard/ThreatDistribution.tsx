"use client";

import React, { useState, useEffect, useRef } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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
            const pkg = vuln.package || "next-auth";
            const id = vuln.vuln_id || "GHSA-7rjr-3q5j-2c77";

            // Simulation of the ACTUAL Python CLI architecture (kolranko.py)
            const stages = [
                { stage: "CLI_INIT", msg: `[VulnerabilityScanner] Initializing workspace scan...` },
                { stage: "EXTRACTOR", msg: `[DependencyExtractor] Parsing package.json dependencies...` },
                { stage: "EXTRACTOR", msg: `[DependencyExtractor] Found ${Math.floor(Math.random() * 50) + 20} dependencies in node_modules` },
                { stage: "OSV_CLIENT", msg: `[OSVClient] Querying https://api.osv.dev/v1/querybatch` },
                { stage: "OSV_CLIENT", msg: `[OSVClient] Response: Found potential match for ${pkg}` },
                { stage: "DEPENDABOT", msg: `[DependabotClient] Fetching alerts from GitHub API` },
                { stage: "CONTEXT", msg: `[ContextCollector] Reading context.md from /components/auth` },
                { stage: "ORCHESTRATOR", msg: `[VulnerabilityAnalyzer] Sending payload to /api/analyze` },
                { stage: "AI_ENGINE", msg: `[GPT-4o] Analyzing ${id} against enterprise context...` },
                { stage: "AI_ENGINE", msg: `[GPT-4o] Risk assessment: High confidentiality impact` },
                { stage: "Orchestrator", msg: `[Pipeline] Saving results to vulnerability_analysis.json` },
                { stage: "Orchestrator", msg: `[Pipeline] Calculated aggregate risk score: ${(Math.random() * 10).toFixed(1)}/10` }
            ];

            // Pick a message based on a cycling step index to simulate linear progress
            // Modulo length ensures it loops forever
            const currentStage = stages[stepIndex % stages.length];

            const newLog = `[${time}] ${currentStage.msg}`;

            setLogs(prev => [...prev.slice(-18), newLog]);

            stepIndex++;

            // Vary speed based on "stage" complexity
            // Network requests take longer
            const delay = currentStage.stage.includes("CLIENT") || currentStage.stage.includes("AI") ?
                Math.random() * 1000 + 500 :
                Math.random() * 300 + 100;
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
                    <div key={i} className="text-white/90 border-l-2 border-transparent hover:border-accent pl-2 transition-all break-all font-medium leading-relaxed">
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
    const container = useRef(null);
    const rawVulnerabilities = getVulnerabilities();

    useGSAP(() => {
        const tl = gsap.timeline({ delay: 0.4 });

        // 1. Header slide in
        tl.from(".terminal-header", { y: -10, opacity: 0, duration: 0.5 });

        // 2. Power-on effect for screen (scale Y from center)
        tl.from(".terminal-screen", {
            scaleY: 0,
            opacity: 0,
            duration: 0.4,
            ease: "power2.inOut",
            transformOrigin: "center center"
        });

        // 3. Horizontal expand
        tl.from(".terminal-screen", {
            scaleX: 0.95,
            duration: 0.2,
            ease: "power2.out"
        }, "+=0");

        // 4. Subtle flicker
        tl.to(".terminal-screen", { opacity: 0.8, duration: 0.05, yoyo: true, repeat: 3 });
        tl.to(".terminal-screen", { opacity: 1, duration: 0.1 });

    }, { scope: container });

    return (
        <div ref={container} className="flex h-full w-full flex-col gap-4 rounded-2xl border border-border/50 bg-white/40 p-5 shadow-sm backdrop-blur-md overflow-hidden">

            {/* Header */}
            <div className="terminal-header flex flex-col gap-2 shrink-0 z-10">
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
            <div className="terminal-screen flex flex-1 items-stretch justify-center overflow-hidden relative rounded-xl bg-secondary border border-border/10 shadow-inner p-2 group">
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
