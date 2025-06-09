
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface PerformanceChartProps {
  dailyActivity: { date: string; count: number }[];
  moduleUsage: { module: string; count: number; percentage: number }[];
}

const PerformanceChart = ({ dailyActivity, moduleUsage }: PerformanceChartProps) => {
  const chartConfig = {
    count: {
      label: "Questions",
      color: "hsl(var(--primary))",
    },
  };

  const moduleColors = [
    "hsl(220, 70%, 50%)",
    "hsl(160, 60%, 45%)",
    "hsl(30, 95%, 55%)",
    "hsl(280, 65%, 60%)",
    "hsl(10, 80%, 50%)"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Activity Chart */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-5 w-5" />
            Daily Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  className="text-blue-600"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-blue-600"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(220, 70%, 50%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Module Usage Chart */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <BarChart3 className="h-5 w-5" />
            Module Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moduleUsage}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ module, percentage }) => `${module.split(' ')[0]} (${percentage}%)`}
                  labelLine={false}
                >
                  {moduleUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={moduleColors[index % moduleColors.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{data.module}</p>
                          <p className="text-sm text-gray-600">{data.count} interactions ({data.percentage}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;
