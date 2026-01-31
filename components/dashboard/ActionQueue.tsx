"use client";

import React from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";
import VulnerabilityCard from "./VulnerabilityCard";

const ActionQueue = () => {
    const vulnerabilities = getVulnerabilities();

    return (
        <div className="flex h-full w-full min-h-0 flex-col gap-4 rounded-2xl border border-border/50 bg-white/40 p-5 shadow-sm backdrop-blur-md overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="font-space-mono font-bold text-2xl uppercase tracking-tighter text-accent">
                        Action Queue
                    </h2>
                    <div className="rounded-full bg-accent/10 px-4 py-1.5 text-xs text-accent">
                        LIVE RISK FEED
                    </div>
                </div>
                <p className="text-base font-medium text-gray-500 max-w-md">
                    Prioritized by contextual risk: <span className="text-black font-bold">Likelihood × Impact × Exposure</span>.
                </p>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="flex flex-col gap-3 pb-6">
                    {vulnerabilities.map((vuln, index) => (
                        <VulnerabilityCard key={vuln.vulnerability_id} vulnerability={vuln} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActionQueue;
