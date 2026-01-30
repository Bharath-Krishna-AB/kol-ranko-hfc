"use client";

import React from "react";
import { MOCK_VULNERABILITIES } from "@/data/mockVulnerabilities";
import VulnerabilityCard from "./VulnerabilityCard";

const ActionQueue = () => {
    return (
        <div className="flex h-full w-full flex-col gap-6 p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="font-fat-kat text-4xl uppercase tracking-tighter text-primary">
                        Action Queue
                    </h2>
                    <div className="rounded-full bg-accent/10 px-4 py-1.5 font-pixel text-xs font-bold text-accent">
                        LIVE RISK FEED
                    </div>
                </div>
                <p className="font-proxima-nova text-base font-medium text-gray-500 max-w-md">
                    Prioritized by contextual risk: <span className="text-black font-bold">Likelihood × Impact × Exposure</span>.
                </p>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                <div className="flex flex-col gap-4 pb-10">
                    {MOCK_VULNERABILITIES.map((vuln, index) => (
                        <VulnerabilityCard key={vuln.id} vulnerability={vuln} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActionQueue;
