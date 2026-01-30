"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const Navbar = () => {
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

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-primary backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 md:px-8">
                {/* Left Section: Logo */}
                <div className="flex items-center">
                    <Link href="/" className="text-2xl font-pixel font-black text-secondary tracking-wider">
                        KOLRANKO<span className="text-accent font-fat-kat">.</span>
                    </Link>
                </div>

                {/* Center/Right Section */}
                <div className="flex items-center gap-6 md:gap-8">
                    {/* Status Indicators */}
                    <div className="hidden flex-row gap-6 md:flex font-proxima-nova text-sm font-bold tracking-wider text-secondary">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#FF453A]"></div>
                            <span>{criticalCount} CRITICAL</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-[#FFD60A]"></div>
                            <span>{warningCount} WARNING</span>
                        </div>
                    </div>

                    {/* Time Display */}
                    <div className="font-proxima-nova text-lg font-medium text-secondary tabular-nums hidden sm:block">
                        {time}
                    </div>

                    {/* Mobile Menu Button (Hamburger) */}
                    <button className="md:hidden text-secondary p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;