import React from "react";

export default function LoadingScreen() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* Radial Gradient Glow */}
      <div 
        className="absolute w-[600px] h-[600px] bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200 rounded-full blur-[100px] opacity-40 mix-blend-multiply"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Concentric Circles Animation */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          {/* Inner dot */}
          <div className="absolute w-3 h-3 bg-gray-600 rounded-full" />
          
          {/* Inner circle 1 */}
          <div className="absolute w-10 h-10 border-[3px] border-gray-300 rounded-full" />
          
          {/* Inner circle 2 */}
          <div className="absolute w-[72px] h-[72px] border-[3px] border-gray-300 rounded-full" />
          
          {/* Outer circle with rotating black arc */}
          <svg className="absolute w-full h-full animate-spin" style={{ animationDuration: "1.5s" }} viewBox="0 0 100 100">
            {/* Background track */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#d1d5db" strokeWidth="4" />
            {/* Rotating black arc (approx 1/4 of the circle) */}
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="none" 
              stroke="#111827" 
              strokeWidth="4" 
              strokeLinecap="round"
              strokeDasharray="289" 
              strokeDashoffset="216" 
            />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-[17px] font-medium text-gray-800 text-center max-w-[280px] leading-relaxed tracking-tight">
          This is what 'working smart' actually looks like ✨
        </h2>

        {/* 3 Loading Dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[11px] text-gray-500 tracking-wide">
          NextFlow • The #1 All-in-One AI Platform
        </p>
      </div>
    </div>
  );
}
