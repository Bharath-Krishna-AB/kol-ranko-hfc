"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";

interface OtpInputProps {
    length?: number;
    onComplete?: (code: string) => void;
}

const OtpInput = ({ length = 4, onComplete }: OtpInputProps) => {
    const [code, setCode] = useState<string[]>(new Array(length).fill(""));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const processInput = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
        const num = e.target.value;
        if (/[^0-9]/.test(num)) return; // Only allow numbers

        const newCode = [...code];
        newCode[slot] = num;
        setCode(newCode);

        // Auto-focus next
        if (slot < length - 1 && num) {
            inputs.current[slot + 1]?.focus();
        }

        // Trigger onComplete
        if (newCode.every(digit => digit !== "") && onComplete) {
            onComplete(newCode.join(""));
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, slot: number) => {
        // Backspace focus handling
        if (e.key === "Backspace" && !code[slot] && slot > 0) {
            inputs.current[slot - 1]?.focus();
        }
    };

    // Focus Animation
    const handleFocus = (slot: number) => {
        gsap.to(inputs.current[slot], {
            scale: 1.05,
            borderColor: "var(--accent)", // Use global accent
            boxShadow: "0 4px 12px rgba(112, 62, 255, 0.15)", // Accent shadow
            duration: 0.2
        });
    };

    const handleBlur = (slot: number) => {
        gsap.to(inputs.current[slot], {
            scale: 1,
            borderColor: "var(--border)", // Use global border
            boxShadow: "none",
            duration: 0.2
        });
    };

    // Paste Support
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, length).split("");
        if (pastedData.every(char => /[0-9]/.test(char))) {
            const newCode = [...code];
            pastedData.forEach((val, i) => {
                if (i < length) newCode[i] = val;
            });
            setCode(newCode);
            if (pastedData.length === length && onComplete) onComplete(pastedData.join(""));
            const nextEmpty = newCode.findIndex(c => !c);
            const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
            inputs.current[focusIndex]?.focus();
        }
    };

    return (
        <div className="flex w-full justify-center gap-4">
            {code.map((num, idx) => (
                <input
                    key={idx}
                    ref={(el) => { inputs.current[idx] = el }}
                    type="text"
                    maxLength={1}
                    value={num}
                    inputMode="numeric"
                    onChange={(e) => processInput(e, idx)}
                    onKeyUp={(e) => handleKeyUp(e, idx)}
                    onFocus={() => handleFocus(idx)}
                    onBlur={() => handleBlur(idx)}
                    onPaste={handlePaste}
                    className="caret-transparent h-16 w-16 rounded-2xl border border-border bg-slate-50 text-center font-space-mono text-3xl font-bold text-secondary outline-none transition-all placeholder:text-gray-200 focus:bg-white"
                    placeholder=""
                />
            ))}
        </div>
    );
};

export default OtpInput;
