"use client";

import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

type ChinaMapProps = {
  onSelect: (position: { position: [number, number]; name: string }) => void;
};

export const ChinaMap: React.FC<ChinaMapProps> = ({ onSelect }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
    lon?: number;
    lat?: number;
  } | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  useEffect(() => {
    if (!chartRef.current) return;

    // 更新容器尺寸
    const updateContainerSize = () => {
      if (chartRef.current) {
        setContainerSize({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    };

    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);

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
        echarts.registerMap("china_map", geoJson);

        // 配置选项
        const option: echarts.EChartsOption = {
          tooltip: {
            trigger: "item",
            formatter: function (params: any) {
              return params.name || "";
            },
            borderColor: "#009588",
          },
          series: [
            {
              name: "中国地图",
              type: "map",
              map: "china_map",
              roam: true,
              emphasis: {
                label: {
                  show: false,
                },
                itemStyle: {
                  areaColor: "#00958833",
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
              onSelect({ position: [longitude, latitude], name: params.name });
            }
          }
        });

        // 添加鼠标移动事件监听器
        chartInstance.current?.on("mousemove", function (params: any) {
          if (params.event && params.event.offsetX && params.event.offsetY) {
            const pointInPixel = [params.event.offsetX, params.event.offsetY];
            const pointInGeo = chartInstance.current?.convertFromPixel(
              { seriesIndex: 0 },
              pointInPixel
            );

            if (pointInGeo) {
              const [longitude, latitude] = pointInGeo;
              setMousePosition({
                x: params.event.offsetX,
                y: params.event.offsetY,
                lon: longitude,
                lat: latitude,
              });
            } else {
              setMousePosition({
                x: params.event.offsetX,
                y: params.event.offsetY,
              });
            }
          }
        });

        // 添加鼠标离开事件监听器
        chartInstance.current?.on("globalout", function () {
          setMousePosition(null);
        });

        // 监听窗口大小变化
        const handleResize = () => {
          chartInstance.current?.resize();
          updateContainerSize();
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
      window.removeEventListener("resize", updateContainerSize);
    };
  }, []);

  return (
    <div ref={chartRef} className="w-full h-full relative">
      {/* 十字线 */}
      {mousePosition && (
        <>
          {/* 垂直线 */}
          <div
            className="absolute top-0 bottom-0 w-px bg-primary opacity-60 pointer-events-none z-10"
            style={{ left: mousePosition.x }}
          />
          {/* 水平线 */}
          <div
            className="absolute left-0 right-0 h-px bg-primary opacity-60 pointer-events-none z-10"
            style={{ top: mousePosition.y }}
          />
        </>
      )}

      {/* 坐标显示 */}
      {mousePosition &&
        mousePosition.lon !== undefined &&
        mousePosition.lat !== undefined && (
          <div
            className="absolute bg-black/80 text-white px-2 py-1 rounded text-xs pointer-events-none z-20"
            style={{
              left: Math.min(
                Math.max(mousePosition.x + 10, 10),
                containerSize.width - 100
              ),
              top: Math.max(
                Math.min(mousePosition.y - 50, containerSize.height - 40),
                10
              ),
            }}
          >
            经度: {mousePosition.lon.toFixed(2)}°<br />
            纬度: {mousePosition.lat.toFixed(2)}°
          </div>
        )}
    </div>
  );
};
