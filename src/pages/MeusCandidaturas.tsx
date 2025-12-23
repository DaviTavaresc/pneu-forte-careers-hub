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
      reprovado: 'Não Aprovado',
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
      reprovado: 'destructive',
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
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold truncate">Minhas Candidaturas</h1>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="flex-shrink-0 text-xs md:text-sm">
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary"></div>
          </div>
        ) : candidaturas.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <Briefcase className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Nenhuma candidatura ainda</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                Explore as vagas disponíveis e candidate-se!
              </p>
              <Button onClick={() => navigate('/')}>Ver Vagas</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidaturas.map((candidatura) => (
              <Card key={candidatura.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                  <CardTitle className="text-base md:text-lg break-words">
                    {candidatura.vagas?.titulo || 'Vaga Removida'}
                  </CardTitle>
                  <Badge variant={getEtapaBadge(candidatura.etapa_atual)} className="w-fit text-xs">
                    {getEtapaLabel(candidatura.etapa_atual)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Briefcase className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">{candidatura.vagas?.area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="truncate">{candidatura.vagas?.localidade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>
                      Enviado em{' '}
                      {format(new Date(candidatura.enviado_em), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {candidatura.resumo_ia && (
                    <div className="mt-3 md:mt-4 p-2 md:p-3 bg-muted rounded-lg">
                      <p className="text-xs md:text-sm">{candidatura.resumo_ia}</p>
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
