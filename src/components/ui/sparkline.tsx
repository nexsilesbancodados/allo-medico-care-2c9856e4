import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
  animated?: boolean;
  showDot?: boolean;
}

/**
 * Tiny inline sparkline — no axes, no grid.
 * Shows a gradient area chart with optional tooltip and end-dot.
 */
const Sparkline = ({
  data,
  color = "hsl(var(--primary))",
  height = 48,
  showTooltip = false,
  animated = true,
  showDot = true,
}: SparklineProps) => {
  const chartData = useMemo(() => data.map((value, i) => ({ i, value })), [data]);
  const gradientId = useMemo(() => `spark-${color.replace(/[^a-z0-9]/gi, "")}-${Math.random().toString(36).slice(2, 6)}`, [color]);

  const trend = data.length >= 2 ? data[data.length - 1] - data[0] : 0;
  const trendColor = trend >= 0 ? color : "hsl(var(--destructive))";

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="text-xs bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-md text-foreground font-medium">
                    {payload[0].value}
                  </div>
                ) : null
              }
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={showDot ? { r: 3.5, fill: trendColor, strokeWidth: 2, stroke: "hsl(var(--card))" } : false}
            isAnimationActive={animated}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      {/* End dot indicator */}
      {showDot && data.length > 0 && (
        <div
          className="absolute right-1 bottom-1 w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: trendColor }}
        />
      )}
    </div>
  );
};

export default Sparkline;
