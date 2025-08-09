"use client";
import { ChinaMap } from "@/components/china-map";
import { useState } from "react";

export default function Home() {
  const [selectedPoint, setSelectedPoint] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  return (
    <div className="h-screen w-screen">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <p>
          {selectedPoint?.longitude}, {selectedPoint?.latitude}
        </p>
      </div>
      <ChinaMap
        onSelect={(longitude, latitude) =>
          setSelectedPoint({ longitude, latitude })
        }
      />
    </div>
  );
}
