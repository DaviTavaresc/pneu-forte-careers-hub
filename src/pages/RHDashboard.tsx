import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Building2 } from 'lucide-react';
import { GestaoVagas } from '@/components/rh/GestaoVagas';
import { PipelineCandidatos } from '@/components/rh/PipelineCandidatos';
import { Metricas } from '@/components/rh/Metricas';

export default function RHDashboard() {
  const { user, isRH, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !isRH)) {
      navigate('/auth');
    }
  }, [user, isRH, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isRH) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Dashboard RH</h1>
              <p className="text-sm text-muted-foreground">Sistema de Recrutamento</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="metricas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="vagas">Vagas</TabsTrigger>
          </TabsList>

          <TabsContent value="metricas">
            <Metricas />
          </TabsContent>

          <TabsContent value="candidatos">
            <PipelineCandidatos />
          </TabsContent>

          <TabsContent value="vagas">
            <GestaoVagas />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}