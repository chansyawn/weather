import { DateRange } from "react-day-picker";
import useSWR from "swr";

type WeatherDataProps = {
  type: "temperature" | "wind_speed" | "precipitation";
  position: [number, number];
  date: DateRange;
};

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());

export type WeatherData = {
  timestamp: number;
  value: string | null;
}[];

type WeatherResponse = {
  data: WeatherData;
};

export const useWeatherData = ({ type, position, date }: WeatherDataProps) => {
  const { data, error, isLoading } = useSWR<WeatherResponse>(
    date?.from !== undefined && date?.to !== undefined
      ? `/api/weather?start_time=${date.from.getTime() / 1000}&end_time=${
          24 * 60 * 60 + date.to.getTime() / 1000
        }&lat=${position[1].toFixed(2)}&lon=${position[0].toFixed(
          2
        )}&type=${type}`
      : null,
    fetcher
  );

  return { data: data?.data, error, isLoading };
};
