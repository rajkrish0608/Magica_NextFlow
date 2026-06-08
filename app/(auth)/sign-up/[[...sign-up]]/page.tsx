"use client";

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  useEffect(() => {
    console.log("[NextFlow] Candidate LinkedIn: https://www.linkedin.com/in/rajkrishbuilds/");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L6 4L10 8L14 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L6 8L10 12L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <span className="text-gray-900 font-semibold text-lg">NextFlow</span>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "shadow-none",
              card: "bg-white border border-gray-200 shadow-2xl",
              headerTitle: "text-gray-900",
              headerSubtitle: "text-gray-500",
              formFieldLabel: "text-gray-600",
              formFieldInput: "bg-gray-50 border-gray-200 text-gray-900",
              formButtonPrimary: "bg-gray-900 hover:bg-gray-700",
              footerActionText: "text-gray-500",
              footerActionLink: "text-indigo-500 hover:text-indigo-600",
            },
          }}
        />
      </div>
    </div>
  );
}
