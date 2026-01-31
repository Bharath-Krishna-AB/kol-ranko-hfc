"use client";

import React, { useRef } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Mock data types
interface ImpactMetric {
    label: string;
    value: number; // 0-100
}

const ImpactRadarGraph = () => {
    const container = useRef(null);
    // Get top vulnerability for impact analysis
    const vulnerabilities = getVulnerabilities();
    const topVuln = vulnerabilities[0];
    const impact = topVuln?.impact_analysis;

    const DATA: ImpactMetric[] = [
        { label: "FINANCIAL", value: impact?.financial ?? 50 },
        { label: "REPUTATION", value: impact?.reputation ?? 50 },
        { label: "OPERATIONAL", value: impact?.operational ?? 50 },
        { label: "LEGAL", value: impact?.legal ?? 50 },
        { label: "COMPLIANCE", value: impact?.compliance ?? 50 },
    ];

    useGSAP(() => {
        const tl = gsap.timeline({ delay: 0.6 });

        // 1. Fade/Scale in the grid background
        tl.from(".grid-poly", {
            scale: 0,
            opacity: 0,
            transformOrigin: "center center",
            stagger: 0.1,
            duration: 0.8,
            ease: "back.out(1.7)"
        }, 0);

        // 2. Draw axis lines
        tl.from(".axis-line", {
            scale: 0,
            opacity: 0,
            transformOrigin: "center center",
            duration: 0.6,
            ease: "power2.out"
        }, 0.4);

        // 3. Scale up the data polygon
        tl.from(".data-poly", {
            scale: 0,
            opacity: 0,
            transformOrigin: "center center",
            duration: 1,
            ease: "elastic.out(1, 0.7)"
        }, 0.6);

        // 4. Pop in data points
        tl.from(".data-point", {
            scale: 0,
            opacity: 0,
            transformOrigin: "center center",
            stagger: 0.05,
            duration: 0.5,
            ease: "back.out(2)"
        }, 0.8);

        // 5. Fade in labels
        tl.from(".chart-label", {
            opacity: 0,
            y: 10,
            stagger: 0.05,
            duration: 0.5
        }, 0.8);

    }, { scope: container });

    // Graph configuration
    const size = 300;
    const center = size / 2;
    const radius = 130; // Radius of the chart itself
    const levels = 4; // Number of concentric grid lines

    // Helper to calculate points on the circle
    const getPoint = (value: number, index: number, total: number, scale = 1) => {
        const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
        const r = (value / 100) * radius * scale;
        return {
            x: center + Math.cos(angle) * r,
            y: center + Math.sin(angle) * r,
        };
    };

    // Generate grid polygons
    const gridPolygons = Array.from({ length: levels }).map((_, levelIndex) => {
        const factor = (levelIndex + 1) / levels;
        return DATA.map((_, i) => {
            const point = getPoint(100, i, DATA.length, factor);
            return `${point.x},${point.y}`;
        }).join(" ");
    });

    // Generate data polygon
    const dataPoints = DATA.map((d, i) => getPoint(d.value, i, DATA.length));
    const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    return (
        <div ref={container} className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border/50 bg-white/40 p-2 shadow-sm backdrop-blur-md overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col gap-1 shrink-0 z-10 px-2 pt-2">
                <div className="flex items-center justify-between">
                    <h2 className="font-space-mono font-bold text-xl uppercase tracking-tighter text-accent">
                        Impact Analysis
                    </h2>
                    <div className="rounded-full bg-accent/10 px-3 py-1 text-[10px] text-accent">
                        BUSINESS RISK
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 flex items-center justify-center relative min-h-0 w-full">
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {/* Background Grid Circles/Polygons */}
                    {gridPolygons.reverse().map((points, i) => (
                        <polygon
                            key={i}
                            points={points}
                            fill="transparent"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="1"
                            className="grid-poly"
                        />
                    ))}

                    {/* Axis Lines */}
                    {DATA.map((_, i) => {
                        const point = getPoint(100, i, DATA.length);
                        return (
                            <line
                                key={i}
                                x1={center}
                                y1={center}
                                x2={point.x}
                                y2={point.y}
                                stroke="rgba(0,0,0,0.05)"
                                strokeWidth="1"
                                className="axis-line"
                            />
                        );
                    })}

                    {/* Data Polygon */}
                    <polygon
                        points={dataPolygon}
                        fill="rgba(112, 62, 255, 0.2)" // Accent color with opacity
                        stroke="#703EFF" // Accent color
                        strokeWidth="2"
                        className="data-poly drop-shadow-[0_0_10px_rgba(112,62,255,0.3)]"
                        style={{
                            vectorEffect: "non-scaling-stroke",
                        }}
                    />

                    {/* Data Points (Dots) */}
                    {dataPoints.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="#fff"
                            stroke="#703EFF"
                            strokeWidth="2"
                            className="data-point"
                        />
                    ))}

                    {/* Labels */}
                    {DATA.map((d, i) => {
                        const point = getPoint(120, i, DATA.length); // Push labels out slightly more
                        // Calculate standard angle to determine text anchor
                        const angle = (Math.PI * 2 * i) / DATA.length - Math.PI / 2;

                        // Dynamic text anchor based on position
                        let textAnchor: "middle" | "start" | "end" = "middle";
                        if (Math.abs(Math.cos(angle)) > 0.1) {
                            textAnchor = Math.cos(angle) > 0 ? "start" : "end";
                        }

                        // Dynamic baseline
                        let dominantBaseline: "middle" | "hanging" | "auto" = "middle";
                        if (Math.abs(Math.sin(angle)) > 0.5) {
                            dominantBaseline = Math.sin(angle) > 0 ? "hanging" : "auto";
                        }

                        return (
                            <text
                                key={i}
                                x={point.x}
                                y={point.y}
                                textAnchor={textAnchor}
                                dominantBaseline={dominantBaseline}
                                className="chart-label fill-gray-500 font-space-mono text-[10px] font-bold tracking-tight uppercase"
                            >
                                {d.label}
                            </text>
                        );
                    })}
                </svg>

                {/* Center "Radar" Glow Effect */}
                <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl pointer-events-none"></div>
            </div>
        </div>
    );
};

export default ImpactRadarGraph;
