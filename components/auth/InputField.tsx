"use client";

import React, { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}

const InputField = ({ label, icon, className, ...props }: InputFieldProps) => {
    return (
        <div className="group relative mb-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-accent font-space-mono">
                {label}
            </label>
            <div className="relative">
                <input
                    {...props}
                    className={`w-full rounded-xl border border-gray-200 bg-white/50 px-4 py-3 pl-4 text-sm font-medium text-secondary outline-none transition-all placeholder:text-gray-300 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 disabled:opacity-50 ${icon ? "pl-11" : ""} ${className}`}
                />
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-accent">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputField;
