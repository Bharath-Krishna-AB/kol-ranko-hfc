"use client";

import React, { useMemo } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";

const ThreatDistribution = () => {
    const vulnerabilities = getVulnerabilities();

    const data = useMemo(() => {
        const counts = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };

        vulnerabilities.forEach(v => {
            const sev = v.severity?.toUpperCase() ?? "LOW";
            if (sev === "CRITICAL") counts.CRITICAL++;
            else if (sev === "HIGH") counts.HIGH++;
            else if (sev === "MEDIUM") counts.MEDIUM++;
            else counts.LOW++;
        });

        const total = vulnerabilities.length || 1; // avoid divide by zero for percentages
        // We will display percentages
        return [
            { label: "CRITICAL", value: Math.round((counts.CRITICAL / total) * 100), color: "#ef4444", delta: "+0%", deltaType: "neutral" },
            { label: "HIGH", value: Math.round((counts.HIGH / total) * 100), color: "#f97316", delta: "+0%", deltaType: "neutral" },
            { label: "MEDIUM", value: Math.round((counts.MEDIUM / total) * 100), color: "#eab308", delta: "-0%", deltaType: "neutral" },
            // { label: "LOW", value: ... } // Donut usually shows top risks, but let's stick to 3 segments if that was the design, or add Low
        ].filter(d => d.value > 0);
    }, [vulnerabilities]);

    // Fill defaults if empty
    const derivedData = data.length > 0 ? data : [
        { label: "NO DATA", value: 100, color: "#cbd5e1", delta: "0%", deltaType: "neutral" }
    ];

    // Calculate total for donut segments (should be ~100)
    const totalPercentage = derivedData.reduce((acc, curr) => acc + curr.value, 0);

    // Calculate stroke dashes
    let accumulatedValue = 0;
    const size = 200;
    const strokeWidth = 25; // Thicker donut
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const segments = derivedData.map((item) => {
        const strokeDasharray = `${(item.value / totalPercentage) * circumference} ${circumference}`;
        const strokeDashoffset = -((accumulatedValue / totalPercentage) * circumference);
        accumulatedValue += item.value;
        return {
            ...item,
            strokeDasharray,
            strokeDashoffset,
        };
    });

    return (
        <div className="flex h-full w-full flex-col gap-6 rounded-2xl border border-border/50 bg-white/40 p-6 shadow-sm backdrop-blur-md overflow-hidden relative group">

            {/* Header */}
            <div className="flex flex-col gap-1 z-10">
                <h3 className="font-space-mono font-bold text-2xl uppercase tracking-tighter text-accent">
                    Threat Distribution
                </h3>
                <p className="font-space-mono text-[10px] text-gray-500 uppercase tracking-widest">
                    Live Risk Composition
                </p>
            </div>

            <div className="flex flex-1 items-center justify-between gap-6 overflow-hidden">

                {/* Donut Chart */}
                <div className="relative flex items-center justify-center h-full aspect-square shrink-0">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${size} ${size}`}
                        className="transform -rotate-90 overflow-visible"
                    >
                        {segments.map((segment, index) => (
                            <circle
                                key={segment.label}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={segment.strokeDasharray}
                                strokeDashoffset={segment.strokeDashoffset}
                                strokeLinecap="round" // Rounded ends for style
                                className="transition-all duration-1000 ease-out opacity-90 hover:opacity-100 hover:stroke-[30px]" // Hover effect
                            />
                        ))}
                    </svg>
                    {/* Inner Text or Icon */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="font-space-mono text-xs text-gray-400 font-bold">TOTAL</span>
                        <span className="font-space-mono text-2xl font-bold text-gray-700">{vulnerabilities.length}</span>
                    </div>
                </div>

                {/* Legend & Deltas */}
                <div className="flex flex-col justify-center gap-4 flex-1">
                    {derivedData.map((item) => (
                        <div key={item.label} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="font-space-mono text-xs font-bold text-gray-600">
                                        {item.label}
                                    </span>
                                </div>
                                <span className="font-space-mono text-lg font-bold text-gray-800">
                                    {item.value}%
                                </span>
                            </div>

                            {/* Delta */}
                            <div className="flex items-center gap-2 pl-4">
                                <span className={`font-space-mono text-[10px] font-bold ${item.deltaType === 'increase' ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {item.deltaType === 'increase' ? '↑' : (item.deltaType === 'decrease' ? '↓' : '•')} {item.delta}
                                </span>
                                <span className="font-space-mono text-[9px] text-gray-400 capitalize">
                                    since yesterday
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative Background Glow */}
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default ThreatDistribution;
