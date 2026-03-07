"use client"

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { month: "Jan", remembering: 40, understanding: 24, applying: 15 },
  { month: "Fev", remembering: 65, understanding: 40, applying: 30 },
  { month: "Mar", remembering: 80, understanding: 55, applying: 45 },
  { month: "Abr", remembering: 85, understanding: 70, applying: 58 },
  { month: "Mai", remembering: 90, understanding: 75, applying: 65 },
]

export function EvolutionChart() {
  return (
    <Card className="border-none shadow-md bg-white col-span-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Evolução de Competências (Média Geral)</CardTitle>
        <CardDescription>Percentual de alunos que atingiram cada nível da Taxonomia de Bloom</CardDescription>
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
                dataKey="remembering"
                name="Lembrar"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="understanding"
                name="Entender"
                stroke="hsl(var(--accent))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--accent))" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="applying"
                name="Aplicar"
                stroke="hsl(var(--chart-3))"
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--chart-3))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
