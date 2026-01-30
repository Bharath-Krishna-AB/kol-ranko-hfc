"use client";

import React, { useEffect, useState } from "react";

// Mock data types
interface ImpactMetric {
    label: string;
    value: number; // 0-100
}

const DATA: ImpactMetric[] = [
    { label: "FINANCIAL", value: 85 },
    { label: "REPUTATION", value: 92 },
    { label: "OPERATIONAL", value: 65 },
    { label: "LEGAL", value: 45 },
    { label: "COMPLIANCE", value: 78 },
];

const ImpactRadarGraph = () => {
    const [animatedValues, setAnimatedValues] = useState<number[]>(DATA.map(() => 0));

    // Animation effect on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedValues(DATA.map((d) => d.value));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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
    const dataPoints = animatedValues.map((val, i) => getPoint(val, i, DATA.length));
    const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    return (
        <div className="flex h-full w-full flex-col gap-6 rounded-2xl border border-border/50 bg-white/40 p-6 shadow-sm backdrop-blur-md overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col gap-2 shrink-0 z-10">
                <div className="flex items-center justify-between">
                    <h2 className="font-space-mono font-bold text-4xl capitalise tracking-tighter text-accent">
                        Impact Analysis
                    </h2>
                    <div className="rounded-full bg-accent/10 px-3 py-1 text-[12px] text-accent">
                        BUSINESS RISK
                    </div>
                </div>
            </div>

            {/* Chart Container */}
            <div className="flex-1 flex items-center justify-center relative min-h-0">
                <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                    {/* Background Grid Circles/Polygons */}
                    {gridPolygons.reverse().map((points, i) => (
                        <polygon
                            key={i}
                            points={points}
                            fill="transparent"
                            stroke="rgba(0,0,0,0.05)"
                            strokeWidth="1"
                            className="transition-all duration-500"
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
                            />
                        );
                    })}

                    {/* Data Polygon */}
                    <polygon
                        points={dataPolygon}
                        fill="rgba(112, 62, 255, 0.2)" // Accent color with opacity
                        stroke="#703EFF" // Accent color
                        strokeWidth="2"
                        className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(112,62,255,0.3)]"
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
                            className="transition-all duration-1000 ease-out"
                        />
                    ))}

                    {/* Labels */}
                    {DATA.map((d, i) => {
                        const point = getPoint(120, i, DATA.length); // Push labels out slightly more
                        // Calculate standard angle to determine text anchor
                        const angle = (Math.PI * 2 * i) / DATA.length - Math.PI / 2;
                        const degrees = (angle * 180) / Math.PI;

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
                                className="fill-gray-500 font-space-mono text-[10px] font-bold tracking-tight uppercase"
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
