"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimelineSliderProps {
  minYear: number;
  maxYear: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export default function TimelineSlider({
  minYear,
  maxYear,
  value,
  onChange,
}: TimelineSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playYearRef = useRef(minYear);

  // Play animation: sweep from minYear to maxYear
  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current) clearInterval(playRef.current);
      return;
    }

    playRef.current = setInterval(() => {
      const next = playYearRef.current + 1;
      if (next > maxYear) {
        setIsPlaying(false);
        onChange([minYear, maxYear]);
        playYearRef.current = minYear;
      } else {
        playYearRef.current = next;
        onChange([minYear, next]);
      }
    }, 400);

    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, minYear, maxYear, onChange]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      playYearRef.current = minYear;
      onChange([minYear, minYear]);
      setIsPlaying(true);
    }
  }, [isPlaying, minYear, onChange]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    onChange([minYear, maxYear]);
  }, [minYear, maxYear, onChange]);

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = parseInt(e.target.value);
      onChange([value[0], newMax]);
    },
    [value, onChange]
  );

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = parseInt(e.target.value);
      onChange([newMin, value[1]]);
    },
    [value, onChange]
  );

  const isFiltered = value[0] !== minYear || value[1] !== maxYear;

  return (
    <div className="bg-[#12121a]/90 backdrop-blur border border-white/10 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Play button */}
        <button
          onClick={handlePlay}
          className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors shrink-0"
          title={isPlaying ? "Pause" : "Play timeline"}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Year labels & sliders */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1">
            <span className={isFiltered ? "text-white font-medium" : ""}>
              {value[0]}
            </span>
            <span className="text-white/30 text-[10px]">Timeline</span>
            <span className={isFiltered ? "text-white font-medium" : ""}>
              {value[1]}
            </span>
          </div>

          {/* Dual range slider */}
          <div className="relative h-1.5">
            {/* Track background */}
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            {/* Active range */}
            <div
              className="absolute h-full bg-primary/60 rounded-full"
              style={{
                left: `${((value[0] - minYear) / (maxYear - minYear)) * 100}%`,
                right: `${100 - ((value[1] - minYear) / (maxYear - minYear)) * 100}%`,
              }}
            />
            {/* Min slider */}
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={value[0]}
              onChange={handleMinChange}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer"
              style={{ zIndex: value[0] === maxYear ? 5 : 3 }}
            />
            {/* Max slider */}
            <input
              type="range"
              min={minYear}
              max={maxYear}
              value={value[1]}
              onChange={handleMaxChange}
              className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-pointer"
              style={{ zIndex: 4 }}
            />
          </div>
        </div>

        {/* Reset button */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="text-xs text-white/40 hover:text-white/70 transition-colors shrink-0"
            title="Reset timeline"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
