"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
    const container = useRef(null);
    const bgRef = useRef(null);

    useGSAP(() => {
        const tl = gsap.timeline();

        // 1. Background Entrance
        tl.from(bgRef.current, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.out"
        });

        // 2. Card Entrance
        tl.from(".auth-card", {
            y: 50,
            opacity: 0,
            scale: 0.95,
            duration: 1,
            ease: "power3.out",
            delay: 0.2
        }, "-=1.2");

        // 3. Content Stagger
        tl.from(".auth-header > *", {
            y: 15,
            opacity: 0,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out"
        }, "-=0.6");

        // Background Blob Animation (Subtle & Light)
        gsap.to(".auth-blob", {
            x: "random(-40, 40)",
            y: "random(-40, 40)",
            rotation: "random(-20, 20)",
            scale: "random(0.9, 1.1)",
            duration: "random(10, 15)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: {
                amount: 4,
                from: "random"
            }
        });

    }, { scope: container });

    return (
        <div ref={container} className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-primary text-secondary selection:bg-accent/20 py-10">

            {/* Animated Background - Light & Airy */}
            <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid Pattern (Subtle Gray) */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

                {/* Ethereal Blobs (Pastels) */}
                <div className="auth-blob absolute top-0 -left-20 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[80px] mix-blend-multiply" />
                <div className="auth-blob absolute bottom-0 -right-20 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[80px] mix-blend-multiply" />
                <div className="auth-blob absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[100px] mix-blend-multiply" />
            </div>

            {/* Auth Card - White Glass */}
            <div className="auth-card relative z-10 w-full max-w-md rounded-4xl border border-white/60 bg-white/70 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-2xl md:p-12 ring-1 ring-black/5">

                {/* Header */}
                <div className="auth-header relative z-10 mb-8 text-center">
                    <div className="mb-6 flex justify-center">
                        {/* Logo Mark - Light Theme */}
                        <div className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/20 transition-transform duration-500 hover:scale-105 hover:rotate-3 cursor-default">
                            <div className="absolute inset-0 rounded-2xl border border-white/20" />
                            <span className="font-space-mono text-2xl font-bold tracking-tighter">K</span>
                        </div>
                    </div>
                    <h1 className="font-space-mono text-2xl font-bold uppercase tracking-tight text-secondary md:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs mx-auto text-balance">
                        {subtitle}
                    </p>
                </div>

                {/* Content (Form) */}
                <div className="auth-content relative z-10">
                    {children}
                </div>
            </div>

            {/* Footer Credit */}
            <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-space-mono opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                System Secure
            </div>
        </div>
    );
};

export default AuthLayout;
