# Weather

地址：https://weather-green-zeta.vercel.app/

## 介绍

工程主要分为三部分

### 数据处理

`script/decompression.py` 用于解压原始文件

`script/filter.py` 由于 Vercel 部署有静态文件大小限制（需要小于 100 MB），使用该脚本降低数据量，主要是提取了所需的字段（t2m/u10/v10/tp6h），并且对经纬度进行降采样，最终结果为根目录下的 `weather_data.nc`

### 服务端

使用了 Vercel 提供的 Python Serverless 服务，实现了一个接口 `/api/weather`，根据时间和坐标从 `weather_data.nc` 提取数据，出入参如下所示

```typescript
type Request = {
    start_time: number; // 开始时间戳
    end_time: number; // 结束时间戳
    lat: number; // 纬度
    lon: number; // 经度
    type: "temperature" | "wind_speed" | "precipitation" // 数据类型
}

type Response = {
    data: [
        timestamp: number; // 时间戳每
        value: string; // 值（风速的值为向量，用于计算风向）
    ]{}
}
```

### 前端

基于 `Next.js` 构建，使用 `shadcn` 作为基础 ui 库，通过 `echart` 实现图表的绘制，主要组件如下

1. 轮播容器 `src/components/carousel-container.tsx`
2. 地图（经纬度选择）`src/components/china-map.tsx`
3. 图表渲染 `src/components/weather-char/content.tsx`

## 部署方式

使用 Vercel 链接仓库即可一键部署
