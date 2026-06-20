import React, { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  symbol: string;
  stockName: string;
  currentPrice: number;
  changePercent: number;
  highPrice: number;
  lowPrice: number;
  primaryColor: string;
}

export default function CandlestickChart({
  symbol,
  stockName,
  currentPrice,
  changePercent,
  highPrice,
  lowPrice,
  primaryColor
}: CandlestickChartProps) {
  const [interval, setIntervalState] = useState<string>("1D");
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch chart data on interval or symbol change
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/stocks/${symbol}/chart?range=${interval}`)
      .then(res => res.json())
      .then(data => {
        if (active) {
          setChartData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Chart error:", err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [symbol, interval]);

  // Keep the latest point matching the dynamic current live price directly
  useEffect(() => {
    if (chartData.length > 0 && !loading) {
      const updated = [...chartData];
      const lastIdx = updated.length - 1;
      const lastPoint = updated[lastIdx];
      
      // Update the close price of the final candle to match the current live sliding rate
      lastPoint.close = currentPrice;
      if (currentPrice > lastPoint.high) lastPoint.high = currentPrice;
      if (currentPrice < lastPoint.low) lastPoint.low = currentPrice;
      
      // Chaining updates to trigger re-render
      setChartData(updated);
    }
  }, [currentPrice]);

  const intervalsList = ["1D", "1W", "1M", "6M", "1Y"];

  // SVG Dimension setups
  const width = 360;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Find min/max values to scale the SVG coordinates
  const prices = chartData.flatMap(d => [d.open, d.close, d.high, d.low]);
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.002 : 100;
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.998 : 0;
  const priceRange = maxPrice - minPrice || 1;

  // Helper scales
  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingX;
    return paddingX + (index * (width - paddingX * 2) / (chartData.length - 1));
  };

  const getY = (price: number) => {
    return height - paddingY - ((price - minPrice) * (height - paddingY * 2) / priceRange);
  };

  // Helper for moving average (comparison line)
  const smaPeriod = 5;
  const getSMA = (index: number) => {
    if (index < smaPeriod - 1) return chartData[index]?.close;
    let sum = 0;
    for (let i = index - smaPeriod + 1; i <= index; i++) {
      sum += chartData[i]?.close;
    }
    return sum / smaPeriod;
  };

  return (
    <div 
      id={`chart-container-${symbol}`}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl overflow-hidden relative"
    >
      {/* Chart Meta Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg border border-blue-500/15">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span id="chart-stock-symbol" className="font-bold text-lg tracking-tight">{symbol}</span>
              <span id="chart-stock-name" className="text-xs text-slate-400 font-medium">{stockName}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span id="chart-current-price" className="text-xl font-mono font-bold text-sky-400 select-all">
                ฿{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span 
                id="chart-change-pill"
                className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  changePercent >= 0 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                }`}
              >
                {changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* High/Low Statuses */}
        <div id="stock-minmax-grid" className="grid grid-cols-2 gap-x-3 gap-y-1 text-right text-[10px] font-mono text-slate-400 bg-slate-950/40 p-2 rounded-xl border border-slate-800/50">
          <span>สถิติสูงสุด:</span>
          <span className="text-emerald-400 font-semibold">฿{highPrice.toLocaleString()}</span>
          <span>สถิติต่ำสุด:</span>
          <span className="text-rose-400 font-semibold">฿{lowPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Interval Toggles */}
      <div 
        id="chart-intervals-row"
        className="flex items-center justify-between p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4"
      >
        <div className="flex items-center gap-1 text-[10px] text-slate-400 px-2">
          <Clock size={11} />
          <span>เลือกมุมมอง:</span>
        </div>
        <div className="flex gap-1">
          {intervalsList.map((iv) => {
            const isSelected = interval === iv;
            return (
              <button
                id={`btn-interval-${iv}`}
                key={iv}
                onClick={() => setIntervalState(iv)}
                className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                  isSelected 
                    ? "bg-sky-500 text-white shadow-xs" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {iv === "1D" ? "รายวัน" : 
                 iv === "1W" ? "รายสัปดาห์" : 
                 iv === "1M" ? "รายเดือน" : 
                 iv === "6M" ? "6 เดือน" : "รายปี"}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div id="chart-svg-wrapper" className="relative h-[180px] w-full flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-sky-400" size={24} />
            <span className="text-xs">กำลังคำนวณกราฟประวัติ...</span>
          </div>
        ) : (
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
            {/* Grid Lines */}
            <line x1={paddingX} y1={getY(maxPrice)} x2={width - paddingX} y2={getY(maxPrice)} stroke="#1e293b" strokeDasharray="3,3" />
            <line x1={paddingX} y1={getY((maxPrice + minPrice) / 2)} x2={width - paddingX} y2={getY((maxPrice + minPrice) / 2)} stroke="#1e293b" strokeDasharray="3,3" />
            <line x1={paddingX} y1={getY(minPrice)} x2={width - paddingX} y2={getY(minPrice)} stroke="#1e293b" strokeDasharray="3,3" />

            {/* Price Coordinates Labels */}
            <text x={paddingX - 8} y={getY(maxPrice) + 4} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
              {maxPrice > 1000 ? (maxPrice / 1000).toFixed(1) + "k" : maxPrice.toFixed(1)}
            </text>
            <text x={paddingX - 8} y={getY((maxPrice + minPrice) / 2) + 4} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
              {((maxPrice + minPrice) / 2) > 1000 ? (((maxPrice + minPrice) / 2) / 1000).toFixed(1) + "k" : ((maxPrice + minPrice) / 2).toFixed(1)}
            </text>
            <text x={paddingX - 8} y={getY(minPrice) + 4} textAnchor="end" className="fill-slate-500 font-mono text-[9px]">
              {minPrice > 1000 ? (minPrice / 1000).toFixed(1) + "k" : minPrice.toFixed(1)}
            </text>

            {/* SMA Moving Average Overlay Line (เส้นเปรียบเทียบ) */}
            <path
              d={chartData.map((d, idx) => {
                const sma = getSMA(idx);
                const x = getX(idx);
                const y = getY(sma);
                return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ")}
              fill="none"
              stroke="#fbbf24" // gold SMA line
              strokeWidth="1.5"
              strokeLinecap="round"
              className="opacity-70 animate-pulse"
            />

            {/* Candles candles candles */}
            {chartData.map((d, idx) => {
              const x = getX(idx);
              const openY = getY(d.open);
              const closeY = getY(d.close);
              const highY = getY(d.high);
              const lowY = getY(d.low);

              const isUp = d.close >= d.open;
              const candleColor = isUp ? "#38bdf8" : "#ef4444"; // theme-sky (blue) for profit, red for loss

              const candleWidth = Math.max(3, (width - paddingX * 2) / chartData.length * 0.5);

              return (
                <g key={idx}>
                  {/* Shadow Line */}
                  <line 
                    x1={x} 
                    y1={highY} 
                    x2={x} 
                    y2={lowY} 
                    stroke={candleColor} 
                    strokeWidth="1.5" 
                  />
                  {/* Solid Body Rectangle */}
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(openY, closeY)}
                    width={candleWidth}
                    height={Math.max(1.5, Math.abs(openY - closeY))}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Time Indicators (First, Middle, Last) */}
            {chartData.length > 0 && (
              <>
                <text x={getX(0)} y={height - 2} textAnchor="start" className="fill-slate-500 text-[9px]">
                  {chartData[0].time}
                </text>
                <text x={getX(Math.floor(chartData.length / 2))} y={height - 2} textAnchor="middle" className="fill-slate-500 text-[9px]">
                  {chartData[Math.floor(chartData.length / 2)].time}
                </text>
                <text x={getX(chartData.length - 1)} y={height - 2} textAnchor="end" className="fill-slate-500 text-[9px]">
                  {chartData[chartData.length - 1].time}
                </text>
              </>
            )}
          </svg>
        )}
      </div>

      <div className="flex items-center gap-1.5 justify-center mt-2.5 text-[9px] text-slate-400 bg-slate-950/45 py-1 px-3 rounded-full border border-slate-800/40 w-fit mx-auto">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span>เส้นสีเหลืองคือ SMA(5) เส้นวิเคราะห์แนวโน้ม • ข้อมูลเชื่อมต่อกับอัตราตลาดหลักโดยตรง</span>
      </div>
    </div>
  );
}
