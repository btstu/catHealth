"use client";

import Image from "next/image";
import { useState } from "react";

export function CatLogo() {
  const [src, setSrc] = useState("/cat-logo.png");

  const handleError = () => {
    // Fallback to an inline SVG if the image fails to load
    setSrc("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%23ff6b9d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z'/%3E%3Cpath d='M8 11h.01M16 11h.01M11.5 7.5c1.5 0 3 .5 3 2.5M12.5 16.5c2 0 3-1 3-2.5'/%3E%3C/svg%3E");
  };

  return (
    <Image 
      src={src}
      alt="CatHealth Logo" 
      width={80} 
      height={80}
      className="drop-shadow-lg"
      priority
      onError={handleError}
    />
  );
}