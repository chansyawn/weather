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
  precipitation: "降水量",
};

// Calculate wind direction from u10 and v10 components
const calculateWindDirection = (u10: number, v10: number): number => {
  // Convert to degrees and adjust for meteorological convention
  let direction = Math.atan2(v10, u10) * (180 / Math.PI);
  direction = (90 - direction + 360) % 360;
  return direction;
};

// Navigation2 icon as SVG string
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

    const times = data.map((item) =>
      new Date(item.timestamp * 1000).toLocaleDateString()
    );

    const unit = UNIT[type];
    const unitLabel = UNIT_LABEL[type];

    // Parse values based on data type
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

    // Calculate wind directions for wind_speed type
    const windDirections = type === "wind_speed" 
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
        windDirection: windDirections ? windDirections[index] : null
      }))
      .filter((item) => item.value !== null);

    const option: echarts.EChartsOption = {
      grid: {
        left: "3%",
        right: "4%",
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
          type: type === "precipitation" ? "bar" : "line",
          smooth: type !== "precipitation",
          lineStyle:
            type !== "precipitation"
              ? {
                  color: "#009588",
                }
              : undefined,
          itemStyle:
            type === "precipitation"
              ? {
                  color: "#009588",
                }
              : {
                  color: "#009588",
                },
          symbol: type !== "precipitation" ? "circle" : undefined,
          symbolSize: type !== "precipitation" ? 6 : undefined,
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const point = params[0];
          let tooltipContent = `${point.name}<br/>${unitLabel}: ${point.value}${unit}`;
          
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
