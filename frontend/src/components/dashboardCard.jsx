import React from "react";

const DashboardCard = ({ title, value, icon, color, subtitle = "" }) => {
  return (
    <div
      className={`
        relative
        overflow-hidden
        h-36
        rounded-2xl
        border border-white/10
        p-4
        text-white
        shadow-lg
        transition-all
        duration-300
        hover:scale-105
        hover:shadow-2xl
        cursor-pointer
        ${color}
      `}
    >
      {/* Background Decoration */}
      <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-6 -left-6 h-14 w-14 rounded-full bg-white/10"></div>

      <div className="relative flex h-full items-center justify-between">
        {/* Left Side */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-semibold text-white/90">{title}</p>

            <h2 className="mt-2 text-4xl font-bold leading-none">{value}</h2>
          </div>

          {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
        </div>

        {/* Right Side */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <span className="text-3xl text-white">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
