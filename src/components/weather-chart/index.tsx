import { DateRange } from "react-day-picker";
import { useWeatherData } from "./service";
import { TemperatureChart } from "./temperature";

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

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  if (type === "temperature") {
    return <TemperatureChart data={data!} />;
  }

  return null;
};
