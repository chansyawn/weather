"use client";
import { ChinaMap } from "@/components/china-map";
import { WeatherPopup } from "@/components/weather-popup";
import { useState } from "react";

export default function Home() {
  const [selected, setSelected] = useState<
    { position: [number, number]; name: string } | undefined
  >(undefined);

  return (
    <div className="h-screen w-screen">
      <ChinaMap onSelect={setSelected} />
      <WeatherPopup
        selected={selected}
        onClose={() => setSelected(undefined)}
      />
    </div>
  );
}
