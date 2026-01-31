"use client";

import React, { useRef, useMemo } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const ThreatDistribution = () => {
    const container = useRef(null);
    const pathRef = useRef<SVGPathElement>(null);
    const areaRef = useRef<SVGPathElement>(null);
    const topGradientRef = useRef<SVGStopElement>(null);

    const rawVulnerabilities = getVulnerabilities();

    // Chart Dimensions (Virtual Units)
    const width = 600;
    const height = 300;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Process Data
    const chartData = useMemo(() => {
        return rawVulnerabilities.slice(0, 10).map((v, i) => ({
            id: v.vulnerability_id,
            score: v.current_score || 0,
            label: `V${i + 1}`
        }));
    }, [rawVulnerabilities]);

    // Helpers
    const getX = (i: number) => padding + (i / (chartData.length - 1)) * graphWidth;
    const getY = (score: number) => padding + graphHeight - (score / 10) * graphHeight;
    const baselineY = height - padding;

    // Path Builder Function
    const buildPath = (data: { score: number }[], progress: number) => {
        if (data.length === 0) return "";
        return data.map((d, i) => {
            const targetY = getY(d.score);
            // Interpolate between baseline (0 score) and targetY
            const currentY = baselineY - ((baselineY - targetY) * progress);
            return `${i === 0 ? 'M' : 'L'} ${getX(i)},${currentY}`;
        }).join(" ");
    };

    useGSAP(() => {
        const tl = gsap.timeline({ delay: 0.2 });

        // 1. Chart Structure Entrance
        tl.from(".chart-header", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" });
        tl.from(".chart-grid", { scaleX: 0, opacity: 0, duration: 0.6, stagger: 0.05 }, "-=0.4");

        // 2. "Elastic Spring" Graph Animation
        // We animate a proxy value and update the DOM directly for performance
        const animState = { val: 0 };

        tl.to(animState, {
            val: 1,
            duration: 2,
            ease: "elastic.out(1, 0.5)",
            onUpdate: () => {
                const currentPath = buildPath(chartData, animState.val);
                const currentArea = `${currentPath} L ${getX(chartData.length - 1)},${baselineY} L ${getX(0)},${baselineY} Z`;

                if (pathRef.current) pathRef.current.setAttribute("d", currentPath);
                if (areaRef.current) areaRef.current.setAttribute("d", currentArea);
            }
        }, "-=0.4");

        // 3. Reveal Points (Pop in)
        tl.from(".data-point", {
            scale: 0,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: "back.out(2)"
        }, "-=1.5");

        // 4. Reveal Labels
        tl.from(".chart-label", { opacity: 0, y: 10, duration: 0.4, stagger: 0.05 }, "-=1.5");

        // 5. Active Scanner Loop
        gsap.to(".scanner-line", {
            x: graphWidth,
            duration: 3,
            ease: "power1.inOut",
            repeat: -1,
            yoyo: true
        });

        // 6. Gradient Pulse
        gsap.to(topGradientRef.current, {
            stopOpacity: 0.6,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: container, dependencies: [chartData] });

    // Initial Path (Flat) for hydration match
    const initialPath = buildPath(chartData, 0);

    return (
        <div ref={container} className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border/50 bg-white/40 p-5 shadow-sm backdrop-blur-md overflow-hidden relative group">

            {/* Header */}
            <div className="chart-header flex flex-col gap-1 shrink-0 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="font-space-mono font-bold text-xl uppercase tracking-tighter text-accent">
                        Risk Distribution
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        <div className="rounded-full bg-accent/10 px-3 py-1 text-[10px] text-accent">
                            LIVE FEED
                        </div>
                    </div>
                </div>
                <p className="text-sm font-medium text-gray-500">
                    Real-time risk metrics across endpoints.
                </p>
            </div>

            {/* Chart Container */}
            <div className="flex-1 w-full min-h-0 relative flex items-center justify-center">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop ref={topGradientRef} offset="0%" stopColor="var(--accent-color, #4f46e5)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--accent-color, #4f46e5)" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 2.5, 5, 7.5, 10].map((val) => (
                        <g key={val} className="chart-grid">
                            <line
                                x1={padding}
                                y1={getY(val)}
                                x2={width - padding}
                                y2={getY(val)}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        </g>
                    ))}

                    {/* Area Fill */}
                    <path
                        ref={areaRef}
                        d={`${initialPath} L ${getX(chartData.length - 1)},${baselineY} L ${getX(0)},${baselineY} Z`}
                        fill="url(#riskGradient)"
                        className="transition-opacity duration-1000"
                    />

                    {/* Line Stroke with Glow */}
                    <path
                        ref={pathRef}
                        d={initialPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-accent"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />

                    {/* Active Scanner Line */}
                    <line
                        className="scanner-line text-accent/50 opacity-50"
                        x1={padding}
                        y1={padding}
                        x2={padding}
                        y2={height - padding}
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                    />

                    {/* Data Points */}
                    {chartData.map((d, i) => (
                        <g key={d.id} className="group/point">
                            <circle
                                cx={getX(i)}
                                cy={getY(d.score)}
                                r="4"
                                className="data-point fill-white stroke-accent stroke-[2px] transition-all duration-300 group-hover/point:scale-150 group-hover/point:r-6 cursor-pointer z-20 relative"
                            />
                            {/* Detailed Hover Tooltip */}
                            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none z-30 transform -translate-y-2 group-hover/point:translate-y-0 transition-transform">
                                <rect
                                    x={getX(i) - 35}
                                    y={getY(d.score) - 45}
                                    width="70"
                                    height="30"
                                    rx="6"
                                    fill="#0f172a"
                                    className="shadow-xl"
                                />
                                <text
                                    x={getX(i)}
                                    y={getY(d.score) - 26}
                                    textAnchor="middle"
                                    className="text-[12px] fill-white font-bold font-space-mono"
                                    alignmentBaseline="middle"
                                >
                                    Risk: {d.score.toFixed(1)}
                                </text>
                            </g>
                        </g>
                    ))}

                    {/* X Axis Labels */}
                    {chartData.map((d, i) => (
                        <text
                            key={i}
                            x={getX(i)}
                            y={height - padding + 20}
                            textAnchor="middle"
                            className="chart-label text-[10px] fill-gray-400 font-bold uppercase tracking-wider"
                        >
                            {d.label}
                        </text>
                    ))}
                </svg>
            </div>
        </div>
    );
};

export default ThreatDistribution;
