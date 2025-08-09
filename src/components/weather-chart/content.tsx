import { WeatherData } from "./service";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type WeatherChartContentProps = {
  data: WeatherData;
  type?: "temperature" | "wind_speed" | "precipitation";
};

const UNIT: Record<string, string> = {
  temperature: "°C",
  wind_speed: "m/s",
  precipitation: "mm",
};

const UNIT_LABEL: Record<string, string> = {
  temperature: "温度",
  wind_speed: "风速",
  precipitation: "6h累计降水量",
};

const calculateWindDirection = (u10: number, v10: number): number => {
  let direction = Math.atan2(v10, u10) * (180 / Math.PI);
  direction = (90 - direction + 360) % 360;
  return direction;
};

const getNavigation2Icon = (rotation: number) => {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; transform: rotate(${rotation}deg); vertical-align: middle;">
    <polygon points="12 2 19 21 12 17 5 21 12 2"/>
  </svg>`;
};

export const WeatherChartContent = ({
  data,
  type = "temperature",
}: WeatherChartContentProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data?.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const times = data.map((item) => {
      const date = new Date(item.timestamp * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      const hour = String(date.getUTCHours()).padStart(2, "0");
      return `${year}/${month}/${day} ${hour}:00`;
    });

    const unit = UNIT[type];
    const unitLabel = UNIT_LABEL[type];

    const values = data.map((item) => {
      if (item.value === null) return null;

      if (type === "wind_speed") {
        const [u10, v10] = item.value.split(",").map((v) => parseFloat(v));
        if (isNaN(u10) || isNaN(v10)) return null;
        return Math.sqrt(u10 * u10 + v10 * v10);
      } else {
        const numValue = parseFloat(item.value);
        return isNaN(numValue) ? null : numValue;
      }
    });

    const windDirections =
      type === "wind_speed"
        ? data.map((item) => {
            if (item.value === null) return null;
            const [u10, v10] = item.value.split(",").map((v) => parseFloat(v));
            if (isNaN(u10) || isNaN(v10)) return null;
            return calculateWindDirection(u10, v10);
          })
        : null;

    const validData = values
      .map((value, index) => ({
        value,
        time: times[index],
        windDirection: windDirections ? windDirections[index] : null,
      }))
      .filter((item) => item.value !== null);

    const option: echarts.EChartsOption = {
      grid: {
        left: "2%",
        right: "2%",
        top: "3%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: validData.map((item) => item.time),
        axisLabel: {
          color: "#737373",
        },
        axisLine: {
          lineStyle: {
            color: "#009588",
            type: type === "temperature" ? "dashed" : "solid",
          },
        },
      },
      yAxis: {
        type: "value",
        name: `${unitLabel}(${unit})`,
        axisLabel: {
          formatter: (value: number) => `${value}${unit}`,
          color: "#737373",
        },
        nameTextStyle: {
          color: "#737373",
        },
      },
      series: [
        {
          data: validData.map((item) => ({
            value: item.value,
            unit: unit,
            windDirection: item.windDirection,
          })),
          type: "line",
          smooth: true,
          lineStyle: {
            color: "#009588",
          },
          itemStyle: {
            color: "#009588",
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const point = params[0];
          let tooltipContent = `${
            point.name
          }<br/>${unitLabel}: ${point.value.toFixed(4)}${unit}`;

          if (type === "wind_speed" && point.data.windDirection !== null) {
            const direction = point.data.windDirection;
            const iconSvg = getNavigation2Icon(direction);
            tooltipContent += `<br/>风向: ${iconSvg} ${direction.toFixed(1)}°`;
          }

          return tooltipContent;
        },
      },
    };

    chartInstance.current.setOption(option);

    return () => {
      chartInstance.current?.dispose();
    };
  }, [data, type]);

  return <div ref={chartRef} className="w-full h-full" />;
};
