"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const defaultData = [
  { month: "Jan", value: 40 },
  { month: "Fev", value: 65 },
  { month: "Mar", value: 80 },
  { month: "Abr", value: 85 },
  { month: "Mai", value: 90 },
]

interface EvolutionChartProps {
  data?: any[];
}

/**
 * EvolutionChart: Componente de gráfico de linha otimizado para Next.js.
 * Utiliza altura fixa para evitar loops de renderização do ResponsiveContainer.
 */
export function EvolutionChart({ data = defaultData }: EvolutionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="border-none shadow-md bg-white col-span-4 h-[450px]">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Carregando gráfico...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md bg-white col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Evolução de Competências</CardTitle>
        <CardDescription>Média de aproveitamento nos níveis da Taxonomia de Bloom</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '350px', minHeight: '350px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Line
                type="monotone"
                dataKey="value"
                name="Aproveitamento"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
