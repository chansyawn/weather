import { WeatherData } from "./service";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type WeatherChartContentProps = {
  data: WeatherData;
  type?: "temperature" | "wind_speed" | "precipitation";
};

export const WeatherChartContent = ({ data, type = "temperature" }: WeatherChartContentProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data?.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const times = data.map((item) =>
      new Date(item.timestamp * 1000).toLocaleDateString()
    );
    
    // Parse values based on data type
    const values = data.map((item) => {
      if (item.value === null) return null;
      
      if (type === "wind_speed") {
        // For wind_speed, parse the comma-separated vector values
        const [u10, v10] = item.value.split(',').map(v => parseFloat(v));
        if (isNaN(u10) || isNaN(v10)) return null;
        // Calculate wind speed magnitude for display
        return Math.sqrt(u10 * u10 + v10 * v10);
      } else {
        // For temperature and precipitation, parse as float
        const numValue = parseFloat(item.value);
        return isNaN(numValue) ? null : numValue;
      }
    });

    // Filter out null values
    const validData = values.map((value, index) => ({ value, time: times[index] })).filter(item => item.value !== null);

    const option = {
      grid: {
        left: "3%",
        right: "4%",
        top: "3%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: validData.map(item => item.time),
      },
      yAxis: {
        type: "value",
        name: type === "temperature" ? "温度 (°C)" : type === "wind_speed" ? "风速 (m/s)" : "降水量 (mm)",
        axisLabel: {
          formatter: type === "temperature" ? "{value}°C" : type === "wind_speed" ? "{value} m/s" : "{value} mm",
        },
      },
      series: [
        {
          data: validData.map(item => item.value),
          type: "line",
          smooth: true,
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const point = params[0];
          const unit = type === "temperature" ? "°C" : type === "wind_speed" ? " m/s" : " mm";
          const label = type === "temperature" ? "温度" : type === "wind_speed" ? "风速" : "降水量";
          return `${point.name}<br/>${label}: ${point.value}${unit}`;
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
