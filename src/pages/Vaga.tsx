import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Briefcase, Building2, DollarSign, Calendar } from "lucide-react";
import { FormularioCandidatura } from "@/components/FormularioCandidatura";
import { useState } from "react";

export default function Vaga() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { data: vaga, isLoading } = useQuery({
    queryKey: ['vaga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vagas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Carregando...</div>
      </div>
    );
  }

  if (!vaga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Vaga não encontrada</h2>
          <Button onClick={() => navigate('/')}>Voltar para vagas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mouse glow effect - hidden on mobile */}
      <div className="glow-cursor hidden md:block"></div>
      
      {/* Hero Section */}
      <div className="hero-gradient text-white py-12 md:py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 md:mb-6 text-primary hover:text-primary-glow"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Voltar para vagas
          </Button>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 animate-fade-in break-words">
            {vaga.titulo}
          </h1>
          
          <div className="flex flex-wrap gap-2 md:gap-4 text-xs sm:text-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-1 md:gap-2 glass-card px-2 py-1 md:px-4 md:py-2">
              <Building2 className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span className="truncate">{vaga.area}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 glass-card px-2 py-1 md:px-4 md:py-2">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span className="truncate">{vaga.localidade}</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2 glass-card px-2 py-1 md:px-4 md:py-2">
              <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span className="truncate">{vaga.modelo_trabalho}</span>
            </div>
            {vaga.salario && (
              <div className="flex items-center gap-1 md:gap-2 glass-card px-2 py-1 md:px-4 md:py-2">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                <span className="truncate">{vaga.salario}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="grid gap-6 md:gap-8">
          {/* Descrição */}
          <div className="glass-card p-4 md:p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4">Sobre a Vaga</h2>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {vaga.descricao}
            </p>
          </div>

          {/* Requisitos */}
          <div className="glass-card p-4 md:p-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4">Requisitos</h2>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {vaga.requisitos}
            </p>
          </div>

          {/* Informações Adicionais */}
          <div className="glass-card p-4 md:p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl md:text-2xl font-bold text-primary mb-3 md:mb-4">Informações da Vaga</h2>
            <div className="grid gap-3 md:gap-4">
              <div className="flex items-start gap-2 md:gap-3">
                <Briefcase className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm md:text-base">Tipo de Contrato</p>
                  <p className="text-foreground/70 text-sm md:text-base">{vaga.tipo_contrato}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 md:gap-3">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm md:text-base">Modelo de Trabalho</p>
                  <p className="text-foreground/70 text-sm md:text-base">{vaga.modelo_trabalho}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Candidatura */}
          {!mostrarFormulario ? (
            <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Button
                size="lg"
                className="btn-primary text-base md:text-lg px-6 py-4 md:px-12 md:py-6 w-full sm:w-auto"
                onClick={() => setMostrarFormulario(true)}
              >
                Candidatar-se para esta vaga
              </Button>
            </div>
          ) : (
            <div className="animate-scale-in">
              <FormularioCandidatura vagaId={vaga.id} vagaTitulo={vaga.titulo} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}