import { WeatherData } from "./service";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type WeatherChartContentProps = {
  data: WeatherData;
};

export const WeatherChartContent = ({ data }: WeatherChartContentProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data?.length) return;

    chartInstance.current = echarts.init(chartRef.current);

    const times = data.map((item) =>
      new Date(item.timestamp * 1000).toLocaleDateString()
    );
    const temperatures = data.map((item) => item.value);

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
        data: times,
      },
      yAxis: {
        type: "value",
        name: "温度 (°C)",
        axisLabel: {
          formatter: "{value}°C",
        },
      },
      series: [
        {
          data: temperatures,
          type: "line",
          smooth: true,
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const point = params[0];
          return `${point.name}<br/>温度: ${point.value}°C`;
        },
      },
    };

    chartInstance.current.setOption(option);

    return () => {
      chartInstance.current?.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
};
