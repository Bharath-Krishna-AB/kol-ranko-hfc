"use client";

import React, { useMemo, useRef } from "react";
import { getVulnerabilities } from "@/data/vulnerabilities";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const RemediationVerdict = () => {
    const container = useRef(null);
    const vulnerabilities = getVulnerabilities();

    const stats = useMemo(() => {
        const sorted = [...vulnerabilities].sort((a, b) => (b.current_score || 0) - (a.current_score || 0));
        const totalScore = sorted.reduce((sum, v) => sum + (v.current_score || 0), 0);

        // Stats for top 3
        const top3 = sorted.slice(0, 3);
        const top3Score = top3.reduce((sum, v) => sum + (v.current_score || 0), 0);
        const riskPercent = totalScore > 0 ? Math.round((top3Score / totalScore) * 100) : 0;

        // Stats for top 2 fix
        const top2 = sorted.slice(0, 2);
        const top2Score = top2.reduce((sum, v) => sum + (v.current_score || 0), 0);
        const reductionPercent = totalScore > 0 ? Math.round((top2Score / totalScore) * 100) : 0;

        return {
            count: top3.length,
            riskPercent,
            fixCount: top2.length,
            reductionPercent
        };
    }, [vulnerabilities]);

    useGSAP(() => {
        const tl = gsap.timeline({ delay: 0.8 });

        // 1. Text slide in
        tl.from(".verdict-label", { x: -20, opacity: 0, duration: 0.5 }, 0);
        tl.from(".verdict-content span", {
            y: 20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.6,
            ease: "power2.out"
        }, 0.2);

        // 2. Line expand
        tl.from(".verdict-line", { scaleX: 0, opacity: 0, duration: 0.8, ease: "power2.out", transformOrigin: "left center" }, 0.4);

        // 3. Blob continuous animation
        gsap.to(".blob-bg", {
            x: 20,
            y: 20,
            rotation: 360,
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, { scope: container });

    return (
        <div ref={container} className="flex h-full w-full flex-col justify-center rounded-2xl border border-border/50 bg-white/40 p-4 shadow-sm backdrop-blur-md relative overflow-hidden group">

            {/* Ambient Background Glow - Subtle & Calm */}
            <div className="blob-bg absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-100/30 blur-3xl pointer-events-none group-hover:bg-blue-100/50 transition-colors duration-1000"></div>

            {/* Label - Minimal Context */}
            <div className="verdict-label absolute top-3 left-4">
                <span className="font-space-mono text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    Executive Verdict
                </span>
            </div>

            {/* The Verdict Sentence */}
            <div className="verdict-content relative z-10 max-w-lg">
                <p className="font-space-mono text-base md:text-lg leading-relaxed text-secondary font-medium">
                    <span><span className="text-secondary font-bold">{stats.count || 0} vulnerabilities</span> account for{" "}</span>
                    <span><span className="text-secondary font-bold">{stats.riskPercent}%</span> of breach risk.</span>
                    <br className="mb-2 block" />
                    <span>Fixing <span className="text-accent font-bold">{stats.fixCount}</span> reduces exposure by{" "}</span>
                    <span><span className="text-accent font-bold">{stats.reductionPercent}%</span>.</span>
                </p>
            </div>

            {/* Semantic Line/Accent - "Finality" */}
            <div className="verdict-line absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-transparent via-accent/20 to-transparent opacity-50"></div>
        </div>
    );
};

export default RemediationVerdict;
