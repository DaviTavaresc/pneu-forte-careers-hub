import { useState } from "react";
import AssistenteIA from '@/components/AssistenteIA';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Briefcase, Building2, ChevronRight, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user, isRH, signOut } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroLocalidade, setFiltroLocalidade] = useState("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const [filtroModelo, setFiltroModelo] = useState("todos");

  const { data: vagas, isLoading } = useQuery({
    queryKey: ['vagas', busca, filtroLocalidade, filtroArea, filtroModelo],
    queryFn: async () => {
      let query = supabase
        .from('vagas')
        .select('*')
        .eq('status', 'ativa')
        .order('criada_em', { ascending: false });

      if (busca) {
        query = query.or(`titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`);
      }
      if (filtroLocalidade !== 'todos') {
        query = query.eq('localidade', filtroLocalidade);
      }
      if (filtroArea !== 'todos') {
        query = query.eq('area', filtroArea);
      }
      if (filtroModelo !== 'todos') {
        query = query.eq('modelo_trabalho', filtroModelo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const localidades = [...new Set(vagas?.map(v => v.localidade) || [])];
  const areas = [...new Set(vagas?.map(v => v.area) || [])];
  const modelos = [...new Set(vagas?.map(v => v.modelo_trabalho) || [])];

  return (
    <div className="min-h-screen bg-background">
      {/* Mouse glow effect - hidden on mobile */}
      <div className="glow-cursor hidden md:block"></div>
      
      {/* Hero Section */}
      <div className="hero-gradient text-white py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        
        {/* Botões de navegação - Responsivo */}
        <div className="relative md:absolute md:top-6 md:right-6 z-20 flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 mb-6 md:mb-0">
          {user ? (
            <>
              {isRH && (
                <Button 
                  onClick={() => navigate('/rh')}
                  variant="outline"
                  size="sm"
                  className="bg-background/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300 text-xs md:text-sm"
                >
                  <Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span> RH
                </Button>
              )}
              <Button 
                onClick={signOut}
                variant="outline"
                size="icon"
                className="bg-background/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300 h-8 w-8 md:h-10 md:w-10"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              size="sm"
              className="bg-background/10 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300 text-xs md:text-sm"
            >
              <User className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Entrar / Cadastrar
            </Button>
          )}
        </div>

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 animate-fade-in px-2">
            Acelere sua carreira com a{" "}
            <span className="text-primary glow-text">Pneu Forte</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 md:mb-12 max-w-2xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.1s' }}>
            Faça parte de uma das maiores distribuidoras de pneus do Norte do Brasil
          </p>

          {/* Barra de busca */}
          <div className="max-w-3xl mx-auto glass-card p-4 md:p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar vagas..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 md:pl-10 bg-background/50"
                />
              </div>
              <Button className="btn-primary w-full sm:w-auto">Buscar</Button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Select value={filtroLocalidade} onValueChange={setFiltroLocalidade}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Localidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as localidades</SelectItem>
                  {localidades.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroArea} onValueChange={setFiltroArea}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as áreas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroModelo} onValueChange={setFiltroModelo}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Modelo de trabalho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os modelos</SelectItem>
                  {modelos.map(modelo => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Vagas */}
      <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-foreground">
          Vagas Disponíveis
          {vagas && <span className="text-primary ml-2 md:ml-3">({vagas.length})</span>}
        </h2>

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : vagas && vagas.length > 0 ? (
          <div className="grid gap-6">
            {vagas.map((vaga, index) => (
              <div
                key={vaga.id}
                className="glass-card p-4 md:p-6 hover:scale-[1.01] md:hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/vaga/${vaga.id}`)}
              >
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors break-words">
                      {vaga.titulo}
                    </h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3 text-xs sm:text-sm text-foreground/70">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Building2 className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        <span className="truncate">{vaga.area}</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        <span className="truncate">{vaga.localidade}</span>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        <span className="truncate">{vaga.modelo_trabalho}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
                
                <p className="text-foreground/70 line-clamp-2 text-sm md:text-base">
                  {vaga.descricao}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-foreground/70 text-lg">
              Nenhuma vaga encontrada com os filtros selecionados.
            </p>
          </div>
        )}
      </div>
      <AssistenteIA />
    </div>
  );
}
