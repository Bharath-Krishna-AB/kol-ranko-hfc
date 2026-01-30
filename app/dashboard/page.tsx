import React from 'react';
import ActionQueue from '@/components/dashboard/ActionQueue';
import ImpactRadarGraph from '@/components/dashboard/ImpactRadarGraph';
import ThreatDistribution from '@/components/dashboard/ThreatDistribution';
import RemediationVerdict from '@/components/dashboard/RemediationVerdict';

const DashboardPage = () => {
  return (
    <div className="max-h-screen overflow-hidden">
      <main className="container mx-auto h-full px-4 md:px-6 py-4">
        <div className="grid w-full grid-cols-2 lg:gap-8 gap-6 h-[calc(100vh-6rem)] min-h-[600px]">
          {/* Left Column (Action Queue & Threat Dist) - Even Split */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <section className="flex-1 min-h-0 overflow-hidden">
              <ActionQueue />
            </section>
            <section className="flex-1 min-h-0 overflow-hidden">
              <ThreatDistribution />
            </section>
          </div>

          {/* Right Column (Impact Radar & Verdict) - Custom Split */}
          <div className="flex flex-col gap-6 h-full min-h-0">
            <section className="h-[65%] min-h-0 overflow-hidden">
              <ImpactRadarGraph />
            </section>
            <section className="flex-1 min-h-0 overflow-hidden">
              <RemediationVerdict />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;