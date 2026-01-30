import React from "react";

const BackgroundGrid = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none grid grid-cols-5 h-full w-full">
            <div className="border-r border-border h-full"></div>
            <div className="border-r border-border h-full"></div>
            <div className="border-r border-border h-full"></div>
            <div className="border-r border-border h-full"></div>
            <div className="h-full"></div> {/* No border on the last one, or border-l/r depending on need. Usually 3 internal lines for 4 cols. */}
        </div>
    );
};

export default BackgroundGrid;
