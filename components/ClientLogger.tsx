"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ClientLogger() {
  const pathname = usePathname();

  useEffect(() => {
    console.log(
      "[NextFlow] Candidate LinkedIn: https://www.linkedin.com/in/rajkrishbuilds/"
    );
  }, [pathname]);

  return null;
}
