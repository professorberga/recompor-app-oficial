
"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit } from 'lucide-react';

interface EvolutionChartProps {
  data?: any[];
}

export function EvolutionChart({ data = [] }: EvolutionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center bg-slate-50 rounded-lg border border-dashed">
        <p className="text-xs text-muted-foreground font-black uppercase animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-md bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Evolução de Competências</CardTitle>
        <CardDescription>Média de aproveitamento baseada nas avaliações lançadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '350px', minHeight: '350px', position: 'relative' }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px', textTransform: 'uppercase' }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Aproveitamento"
                  stroke="hsl(var(--primary))"
                  strokeWidth={4}
                  dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border-2 border-dashed opacity-30 grayscale">
              <BrainCircuit className="h-16 w-16 mb-4 text-primary" />
              <p className="text-xs font-black uppercase tracking-widest">Nenhuma avaliação registrada</p>
              <p className="text-[10px] font-bold mt-1">Os indicadores surgirão conforme os lançamentos.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
