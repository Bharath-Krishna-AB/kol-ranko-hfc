import React from 'react';
import ActionQueue from '@/components/dashboard/ActionQueue';

const DashboardPage = () => {
  return (
    <div className="min-h-screen w-full pt-16">
      <main className="container mx-auto h-full px-4 md:px-6 py-6">
        <div className="grid w-full grid-cols-2 lg:gap-8 gap-6 h-[calc(100vh-6rem)] min-h-[600px]">
          {/* Top Left: Action Queue */}
          <section className="col-span-1 row-span-1 min-h-0 overflow-hidden">
            <ActionQueue />
          </section>

          {/* Top Right: Impact Analysis Graph */}
          <section className="col-span-1 row-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white/40 p-8 shadow-sm backdrop-blur-md flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="font-fat-kat text-2xl text-gray-300 uppercase">Impact Analysis Graph</h3>
                <p className="font-proxima-nova text-sm text-gray-400">Coming Soon</p>
              </div>
            </div>
          </section>

          {/* Bottom Left: Threat Distribution */}
          <section className="col-span-1 row-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white/40 p-6 shadow-sm backdrop-blur-md flex items-center justify-center h-full">
              <h3 className="font-fat-kat text-xl text-gray-300 uppercase">Threat Distribution</h3>
            </div>
          </section>

          {/* Bottom Right: Remediation Velocity */}
          <section className="col-span-1 row-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white/40 p-6 shadow-sm backdrop-blur-md flex items-center justify-center h-full">
              <h3 className="font-fat-kat text-xl text-gray-300 uppercase">Remediation Velocity</h3>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;