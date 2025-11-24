import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import AssistenteIA from '@/components/AssistenteIA';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhasCandidaturas() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: candidaturas = [], isLoading } = useQuery({
    queryKey: ['minhas-candidaturas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('candidatos')
        .select('*, vagas(titulo, area, localidade)')
        .eq('user_id', user.id)
        .order('enviado_em', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getEtapaLabel = (etapa: string) => {
    const labels: Record<string, string> = {
      inscrito: 'Inscrito',
      triagem: 'Em Triagem',
      entrevista: 'Entrevista',
      teste_tecnico: 'Teste Técnico',
      finalizado: 'Finalizado',
    };
    return labels[etapa] || etapa;
  };

  const getEtapaBadge = (etapa: string) => {
    const variants: Record<string, any> = {
      inscrito: 'secondary',
      triagem: 'outline',
      entrevista: 'default',
      teste_tecnico: 'default',
      finalizado: 'default',
    };
    return variants[etapa] || 'secondary';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Você precisa estar logado para ver suas candidaturas.
            </p>
            <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Minhas Candidaturas</h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : candidaturas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma candidatura ainda</h3>
              <p className="text-muted-foreground mb-6">
                Explore as vagas disponíveis e candidate-se!
              </p>
              <Button onClick={() => navigate('/')}>Ver Vagas</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidaturas.map((candidatura) => (
              <Card key={candidatura.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {candidatura.vagas?.titulo || 'Vaga Removida'}
                  </CardTitle>
                  <Badge variant={getEtapaBadge(candidatura.etapa_atual)}>
                    {getEtapaLabel(candidatura.etapa_atual)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{candidatura.vagas?.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{candidatura.vagas?.localidade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Enviado em{' '}
                      {format(new Date(candidatura.enviado_em), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {candidatura.resumo_ia && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{candidatura.resumo_ia}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <AssistenteIA />
    </div>
  );
}
