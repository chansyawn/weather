"use client";
import { ChinaMap } from "@/components/china-map";
import { WeatherPopup } from "@/components/weather-popup";
import { useState } from "react";

export default function Home() {
  const [selectedPoint, setSelectedPoint] = useState<
    [number, number] | undefined
  >(undefined);

  return (
    <div className="h-screen w-screen">
      <ChinaMap onSelect={setSelectedPoint} />
      <WeatherPopup
        position={selectedPoint}
        onClose={() => setSelectedPoint(undefined)}
      />
    </div>
  );
}
