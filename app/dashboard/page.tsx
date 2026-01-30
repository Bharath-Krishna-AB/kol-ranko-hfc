import React from 'react';
import ActionQueue from '@/components/dashboard/ActionQueue';

const DashboardPage = () => {
  return (
    <div className="min-h-screen w-full pt-16"> {/* pt-16 to account for fixed navbar height */}
      <main className="container mx-auto h-[calc(100vh-4rem)] px-4 md:px-6">
        <div className="grid h-full w-full grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Panel: Action Queue */}
          <section className="col-span-1 h-full lg:col-span-5 xl:col-span-4 border-r border-border/40 backdrop-blur-sm bg-white/30">
            <ActionQueue />
          </section>

          {/* Right Panel: Future Graphs Placeholder */}
          <section className="col-span-1 hidden h-full lg:col-span-7 lg:block xl:col-span-8 p-6">
            <div className="grid h-full grid-rows-2 gap-6">
              {/* Top: Large Graph Placeholder */}
              <div className="rounded-2xl border border-gray-100 bg-white/40 p-8 shadow-sm backdrop-blur-md flex items-center justify-center">
                <div className="text-center">
                  <h3 className="font-fat-kat text-2xl text-gray-300 uppercase">Impact Analysis Graph</h3>
                  <p className="font-proxima-nova text-sm text-gray-400">Coming Soon</p>
                </div>
              </div>

              {/* Bottom: Split Stats Placeholder */}
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-100 bg-white/40 p-8 shadow-sm backdrop-blur-md flex items-center justify-center">
                  <h3 className="font-fat-kat text-xl text-gray-300 uppercase">Threat Distribution</h3>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white/40 p-8 shadow-sm backdrop-blur-md flex items-center justify-center">
                  <h3 className="font-fat-kat text-xl text-gray-300 uppercase">Remediation Velocity</h3>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;