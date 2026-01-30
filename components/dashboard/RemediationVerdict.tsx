"use client";

import React from "react";

const RemediationVerdict = () => {
    return (
        <div className="flex h-full w-full flex-col justify-center rounded-2xl border border-border/50 bg-white/40 p-8 shadow-sm backdrop-blur-md relative overflow-hidden group">

            {/* Ambient Background Glow - Subtle & Calm */}
            <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-blue-100/30 blur-3xl pointer-events-none group-hover:bg-blue-100/50 transition-colors duration-1000"></div>

            {/* Label - Minimal Context */}
            <div className="absolute top-6 left-8">
                <span className="font-space-mono text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    Executive Verdict
                </span>
            </div>

            {/* The Verdict Sentence */}
            <div className="relative z-10 max-w-lg">
                <p className="font-space-mono text-xl md:text-2xl leading-relaxed text-secondary font-medium">
                    <span className="text-secondary font-bold">3 vulnerabilities</span> account for{" "}
                    <span className="text-secondary font-bold">68%</span> of breach risk.
                    <br className="mb-2 block" />
                    Fixing <span className="text-accent font-bold">2</span> reduces exposure by{" "}
                    <span className="text-accent font-bold">41%</span>.
                </p>
            </div>

            {/* Semantic Line/Accent - "Finality" */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-50"></div>
        </div>
    );
};

export default RemediationVerdict;
