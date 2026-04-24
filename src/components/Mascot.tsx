import React from 'react';
import { motion } from 'motion/react';

interface MascotProps {
  size?: number;
  className?: string;
  showText?: string;
}

export default function Mascot({ size = 80, className = "", showText }: MascotProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Antennae */}
          <line x1="40" y1="20" x2="35" y2="10" stroke="#F4A026" strokeWidth="2" />
          <circle cx="35" cy="10" r="3" fill="#F4A026" />
          <line x1="60" y1="20" x2="65" y2="10" stroke="#F4A026" strokeWidth="2" />
          <circle cx="65" cy="10" r="3" fill="#F4A026" />

          {/* Body */}
          <circle cx="50" cy="50" r="28" fill="#1A6B5A" />
          
          {/* Eyes */}
          <circle cx="42" cy="45" r="5" fill="white" />
          <circle cx="42" cy="45" r="2" fill="black" />
          <circle cx="58" cy="45" r="5" fill="white" />
          <circle cx="58" cy="45" r="2" fill="black" />
          
          {/* Smile */}
          <path
            d="M40 58C40 58 45 62 50 62C55 62 60 58 60 58"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          
          {/* Heart on chest */}
          <path
            d="M50 54L48.5 52.5C43.5 47.5 40 44.5 40 41C40 38 42.5 35.5 45.5 35.5C47.2 35.5 48.8 36.3 50 37.6C51.2 36.3 52.8 35.5 54.5 35.5C57.5 35.5 60 38 60 41C60 44.5 56.5 47.5 51.5 52.5L50 54Z"
            fill="#F4A026"
            transform="scale(0.4) translate(75, 75)"
          />

          {/* Arms */}
          <rect x="18" y="45" width="6" height="12" rx="3" fill="#1A6B5A" />
          <rect x="76" y="45" width="6" height="12" rx="3" fill="#1A6B5A" />
        </svg>
      </motion.div>
      {showText && (
        <p className="text-sm font-medium text-text-primary bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {showText}
        </p>
      )}
    </div>
  );
}
