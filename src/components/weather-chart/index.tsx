import { DateRange } from "react-day-picker";
import { useWeatherData } from "./service";
import { WeatherChartContent } from "./content";
import { Loader2 } from "lucide-react";

type WeatherChartProps = {
  type: "temperature" | "wind_speed" | "precipitation";
  position: [number, number];
  date: DateRange;
};

export const WeatherChart = ({ type, position, date }: WeatherChartProps) => {
  const { data, error, isLoading } = useWeatherData({
    type,
    position,
    date,
  });

  if (error)
    return (
      <div className="w-full h-full flex items-center justify-center">
        Error: {error.message}
      </div>
    );
  if (isLoading)
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return <WeatherChartContent data={data!} type={type} />;
};
