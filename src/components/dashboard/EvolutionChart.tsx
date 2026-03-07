"use client"

import { Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", remembering: 40, understanding: 24, applying: 15 },
  { month: "Fev", remembering: 65, understanding: 40, applying: 30 },
  { month: "Mar", remembering: 80, understanding: 55, applying: 45 },
  { month: "Abr", remembering: 85, understanding: 70, applying: 58 },
  { month: "Mai", remembering: 90, understanding: 75, applying: 65 },
]

const chartConfig = {
  remembering: {
    label: "Lembrar",
    color: "hsl(var(--primary))",
  },
  understanding: {
    label: "Entender",
    color: "hsl(var(--accent))",
  },
  applying: {
    label: "Aplicar",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function EvolutionChart() {
  return (
    <Card className="border-none shadow-md bg-white col-span-4">
      <CardHeader>
        <CardTitle className="text-lg">Evolução de Competências (Média Geral)</CardTitle>
        <CardDescription>Percentual de alunos que atingiram cada nível da Taxonomia de Bloom</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center h-[200px]">
        <ChartContainer config={chartConfig}>
          <LineChart 
            width={275} 
            height={155} 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))' }} 
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="remembering"
              stroke="var(--color-remembering)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-remembering)" }}
            />
            <Line
              type="monotone"
              dataKey="understanding"
              stroke="var(--color-understanding)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-understanding)" }}
            />
            <Line
              type="monotone"
              dataKey="applying"
              stroke="var(--color-applying)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--color-applying)" }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
