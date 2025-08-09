"use client";

import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

type ChinaMapProps = {
  onSelect: (position: [number, number]) => void;
};

export const ChinaMap: React.FC<ChinaMapProps> = ({ onSelect }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化 ECharts 实例
    chartInstance.current = echarts.init(chartRef.current);

    // 加载中国地图数据
    const loadChinaMap = async () => {
      try {
        // 使用 ECharts 内置的中国地图数据
        // 这里我们使用一个公开的中国地图 GeoJSON 数据
        const response = await fetch("/geo.json");
        const geoJson = await response.json();

        // 注册地图
        echarts.registerMap("china", geoJson);

        // 配置选项
        const option: echarts.EChartsOption = {
          series: [
            {
              name: "中国地图",
              type: "map",
              map: "china",
              roam: true,
              emphasis: {
                label: {
                  show: false,
                },
                itemStyle: {
                  areaColor: "#009588",
                },
              },
              select: {
                disabled: true,
              },
            },
          ],
        };

        // 设置配置选项
        chartInstance.current?.setOption(option);

        // 添加点击事件监听器
        chartInstance.current?.on("click", function (params: any) {
          // 如果有经纬度信息，则打印
          if (params.event && params.event.offsetX && params.event.offsetY) {
            // 获取点击位置相对于图表的坐标
            const pointInPixel = [params.event.offsetX, params.event.offsetY];

            // 将像素坐标转换为地理坐标
            const pointInGeo = chartInstance.current?.convertFromPixel(
              { seriesIndex: 0 },
              pointInPixel
            );

            if (pointInGeo) {
              const [longitude, latitude] = pointInGeo;
              onSelect([longitude, latitude]);
            }
          }
        });

        // 监听窗口大小变化
        const handleResize = () => {
          chartInstance.current?.resize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        console.error("加载地图数据失败:", error);
      }
    };

    loadChinaMap();

    // 清理函数
    return () => {
      chartInstance.current?.dispose();
    };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};
