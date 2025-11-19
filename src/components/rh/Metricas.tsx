import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function Metricas() {
  const { data: candidatos } = useQuery({
    queryKey: ['candidatos-metricas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidatos')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: vagas } = useQuery({
    queryKey: ['vagas-metricas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vagas')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const totalCandidatos = candidatos?.length || 0;
  const totalVagas = vagas?.length || 0;
  const vagasAtivas = vagas?.filter(v => v.status === 'ativa').length || 0;

  const candidatosPorEtapa = candidatos?.reduce((acc, c) => {
    acc[c.etapa_atual] = (acc[c.etapa_atual] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const etapasData = Object.entries(candidatosPorEtapa).map(([etapa, count]) => ({
    name: etapa.charAt(0).toUpperCase() + etapa.slice(1),
    value: count,
  }));

  const candidatosPorVaga = candidatos?.reduce((acc, c) => {
    const vaga = vagas?.find(v => v.id === c.vaga_id);
    if (vaga) {
      acc[vaga.titulo] = (acc[vaga.titulo] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const vagasData = Object.entries(candidatosPorVaga)
    .map(([titulo, count]) => ({ name: titulo, candidatos: count }))
    .sort((a, b) => b.candidatos - a.candidatos)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="neo-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text">{totalCandidatos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Candidatos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="neo-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vagas Ativas</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text">{vagasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {totalVagas} vagas totais
            </p>
          </CardContent>
        </Card>

        <Card className="neo-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text">
              {totalCandidatos > 0 
                ? `${Math.round((candidatosPorEtapa['contratado'] || 0) / totalCandidatos * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Candidatos contratados
            </p>
          </CardContent>
        </Card>

        <Card className="neo-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold glow-text">
              {(candidatosPorEtapa['inscrito'] || 0) + (candidatosPorEtapa['triagem'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando avaliação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="neo-glass">
          <CardHeader>
            <CardTitle>Candidatos por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Candidatos",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={etapasData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {etapasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="neo-glass">
          <CardHeader>
            <CardTitle>Top 5 Vagas com Mais Candidatos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                candidatos: {
                  label: "Candidatos",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vagasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="candidatos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}