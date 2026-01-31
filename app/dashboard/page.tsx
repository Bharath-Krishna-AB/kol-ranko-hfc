"use client";

import React, { useRef } from 'react';
import ActionQueue from '@/components/dashboard/ActionQueue';
import ImpactRadarGraph from '@/components/dashboard/ImpactRadarGraph';
import ThreatDistribution from '@/components/dashboard/ThreatDistribution';
import RemediationVerdict from '@/components/dashboard/RemediationVerdict';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const DashboardPage = () => {
  const container = useRef(null);

  useGSAP(() => {
    // Stagger animate all sections in
    gsap.from(".dashboard-section", {
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.2
    });
  }, { scope: container });

  return (
    <div className="max-h-screen overflow-hidden" ref={container}>
      <main className="container mx-auto h-full px-2 py-2">
        <div className="grid w-full grid-cols-2 gap-2 h-[calc(100vh-5rem)] min-h-[600px]">
          {/* Left Column (Action Queue & Threat Dist) - Even Split */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            <section className="dashboard-section flex-1 min-h-0 overflow-hidden">
              <ActionQueue />
            </section>
            <section className="dashboard-section flex-1 min-h-0 overflow-hidden">
              <ThreatDistribution />
            </section>
          </div>

          {/* Right Column (Impact Radar & Verdict) - Custom Split */}
          <div className="flex flex-col gap-2 h-full min-h-0">
            <section className="dashboard-section h-[65%] min-h-0 overflow-hidden">
              <ImpactRadarGraph />
            </section>
            <section className="dashboard-section flex-1 min-h-0 overflow-hidden">
              <RemediationVerdict />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;