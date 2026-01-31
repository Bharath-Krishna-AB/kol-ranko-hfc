"use client";

import React from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRouter, useSearchParams } from "next/navigation";

const SignInPage = () => {
  const container = React.useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useGSAP(
    () => {
      gsap.from(".form-item", {
        y: 15,
        stagger: 0.1,
        duration: 0.6,
        ease: "power2.out",
        delay: 0.2,
      });
    },
    { scope: container },
  );

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();

    const encoded = searchParams.get("data");
    if (!encoded) {
      router.push("/dashboard");
      return;
    }

    let decoded: string;
    try {
      decoded = atob(encoded);
    } catch {
      router.push("/dashboard");
      return;
    }

    const timestamp = Date.now().toString();
    localStorage.setItem(timestamp, decoded);
    console.log(decoded);

    router.push(`/dashboard/${timestamp}`);
  };

  return (
    <AuthLayout
      title="Identity Verification"
      subtitle="Enter credentials to access restricted networks."
    >
      <form
        ref={container}
        onSubmit={handleSignIn}
        className="flex flex-col gap-6 px-1"
      >
        <div className="form-item">
          <label className="mb-4 block text-center text-sm font-bold uppercase tracking-widest text-slate-500 font-space-mono">
            Password (PIN)
          </label>
          <OtpInput length={4} onComplete={() => {}} />
        </div>

        <div className="form-item flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group select-none">
            <input
              type="checkbox"
              className="peer h-4 w-4 appearance-none rounded border border-gray-300 bg-white checked:border-accent checked:bg-accent"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Persist Session
            </span>
          </label>
          <Link
            href="#"
            className="text-[10px] font-bold uppercase tracking-wider text-gray-400"
          >
            Lost Key?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-accent px-4 py-4 text-sm font-bold uppercase tracking-widest text-white"
        >
          Verify Identity
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignInPage;
