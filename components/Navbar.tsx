"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const Navbar = () => {
    const container = useRef(null);
    const pathname = usePathname();
    const [time, setTime] = useState("");

    // Static numbers for Critical and Warning (to be made dynamic later)
    const criticalCount = 2;
    const warningCount = 8;

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        };

        // Initial call
        updateTime();

        // Update every second to ensure minute changes are caught accurately
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline();

        // 1. Navbar Slide Down
        tl.from(container.current, {
            yPercent: -100,
            opacity: 0,
            duration: 1,
            ease: "power4.out"
        });

        // 2. Content Stagger Entrance
        tl.from(".nav-item", {
            y: -20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
        }, "-=0.5");

        // 3. Continuous Pulse for Status Dots
        gsap.to(".status-dot-critical", {
            boxShadow: "0 0 10px rgba(255, 69, 58, 0.5)",
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            ease: "sine.inOut"
        });

        gsap.to(".status-dot-warning", {
            boxShadow: "0 0 10px rgba(255, 214, 10, 0.5)",
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            delay: 0.5, // Offset pulse
            ease: "sine.inOut"
        });

    }, { scope: container });

    return (
        <nav ref={container} className="sticky top-0 z-50 w-full border-b border-border bg-primary/80 backdrop-blur-md supports-backdrop-filter:bg-primary/60">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
                {/* Left Section: Logo */}
                <div className="nav-item flex items-center">
                    <Link href="/" className="text-2xl font-pixel font-black text-secondary tracking-wider hover:text-accent transition-colors duration-300">
                        KOLRANKO<span className="text-accent font-fat-kat">.</span>
                    </Link>
                </div>

                {/* Center/Right Section */}
                {pathname !== "/signin" && (
                    <div className="flex items-center gap-6 md:gap-8">
                        {/* Status Indicators */}
                        <div className="hidden flex-row gap-6 md:flex text-sm font-bold tracking-wider text-secondary">
                            <div className="nav-item flex items-center gap-2 cursor-default">
                                <div className="status-dot-critical h-3 w-3 rounded-full bg-[#FF453A]"></div>
                                <span>{criticalCount} CRITICAL</span>
                            </div>
                            <div className="nav-item flex items-center gap-2 cursor-default">
                                <div className="status-dot-warning h-3 w-3 rounded-full bg-[#FFD60A]"></div>
                                <span>{warningCount} WARNING</span>
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="nav-item flex items-center gap-2 text-lg font-medium text-secondary tabular-nums">
                            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">TIMESTAMP</span>
                            {time}
                        </div>

                        {/* Mobile Menu Button (Hamburger) */}
                        <button className="nav-item md:hidden text-secondary p-2 hover:bg-secondary/10 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;