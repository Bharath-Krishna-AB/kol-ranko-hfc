"use client";

import React from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const SignInPage = () => {
    const container = React.useRef(null);

    useGSAP(() => {
        gsap.from(".form-item", {
            y: 15,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.2
        });
    }, { scope: container });

    return (
        <AuthLayout
            title="Identity Verification"
            subtitle="Enter credentials to access restricted networks."
        >
            <form ref={container} className="flex flex-col gap-6 px-1">

                {/* OTP Pass Key */}
                <div className="form-item">
                    <label className="mb-4 block text-center text-sm font-bold uppercase tracking-widest text-slate-500 font-space-mono">
                        Password (PIN)
                    </label>
                    <OtpInput length={4} onComplete={(code) => console.log("Code entered:", code)} />
                </div>

                {/* Persist Session Checkbox */}
                <div className="form-item flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 cursor-pointer group select-none">
                        <div className="relative flex items-center">
                            <input type="checkbox" className="peer h-4 w-4 appearance-none rounded border border-gray-300 bg-white checked:border-accent checked:bg-accent focus:ring-1 focus:ring-accent/50 transition-all" />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-secondary transition-colors">Persist Session</span>
                    </label>
                    <Link href="#" className="text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-accent transition-colors">
                        Lost Key?
                    </Link>
                </div>

                {/* Authenticate Button */}
                <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-xl bg-accent px-4 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                        </svg>
                        Verify Identity
                    </span>
                    <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />
                </button>
            </form>
        </AuthLayout>
    );
};

export default SignInPage;
