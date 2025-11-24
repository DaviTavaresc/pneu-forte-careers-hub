import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is RH/Admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isRH = roles?.some(r => r.role === 'rh' || r.role === 'admin') || false;

    // Define tools based on user role
    const tools = [
      {
        type: "function",
        function: {
          name: "listar_vagas_ativas",
          description: "Lista todas as vagas ativas disponíveis para candidatura",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "buscar_status_candidatura",
          description: "Busca o status das candidaturas do usuário atual",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "info_empresa",
          description: "Retorna informações sobre a Pneu Forte (empresa, cultura, benefícios, processo seletivo)",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      }
    ];

    // Add RH-only tools
    if (isRH) {
      tools.push(
        {
          type: "function",
          function: {
            name: "listar_candidatos_por_etapa",
            description: "Lista candidatos filtrados por etapa do processo (inscrito, triagem, entrevista, teste_tecnico, finalizado, reprovado)",
            parameters: {
              type: "object",
              properties: {
                etapa: {
                  type: "string",
                  enum: ["inscrito", "triagem", "entrevista", "teste_tecnico", "finalizado", "reprovado"],
                  description: "Etapa do processo seletivo"
                }
              },
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "buscar_candidato_por_nome",
            description: "Busca candidatos pelo nome (busca parcial case-insensitive)",
            parameters: {
              type: "object",
              properties: {
                nome: {
                  type: "string",
                  description: "Nome ou parte do nome do candidato"
                }
              },
              required: []
            }
          }
        },
        {
          type: "function",
          function: {
            name: "estatisticas_sistema",
            description: "Retorna estatísticas gerais do sistema (total de candidatos, vagas, distribuição por etapa)",
            parameters: {
              type: "object",
              properties: {},
              required: []
            }
          }
        }
      );
    }

    // System prompt based on role
    const systemPrompt = isRH 
      ? `Você é o assistente virtual da Pneu Forte, um mecânico amigável e prestativo. Você está falando com um membro da equipe de RH.

Sua personalidade:
- Profissional mas descontraído, como um mecânico experiente
- Use metáforas relacionadas a mecânica/pneus quando apropriado
- Seja direto e objetivo nas respostas
- Ajude a equipe de RH a gerenciar candidatos e vagas

Você tem acesso a informações sobre candidatos, vagas e estatísticas do sistema. Use as ferramentas disponíveis quando necessário para buscar dados atualizados.`
      : `Você é o assistente virtual da Pneu Forte, um mecânico amigável e prestativo. Você está falando com um candidato.

Sua personalidade:
- Amigável e encorajador, como um mecânico de bairro confiável
- Use metáforas relacionadas a mecânica/pneus quando apropriado (ex: "vamos calibrar seu currículo", "acelerar sua carreira")
- Seja claro e transparente sobre o processo seletivo
- Motive o candidato e forneça orientações úteis

Você pode ajudar com:
- Status de candidaturas
- Informações sobre vagas abertas
- Detalhes sobre a empresa e cultura
- Dicas para o processo seletivo

Use as ferramentas disponíveis quando precisar buscar informações específicas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Handle tool calls
    if (aiResponse.choices[0].message.tool_calls) {
      const toolCalls = aiResponse.choices[0].message.tool_calls;
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || '{}');
        
        let result;

        switch (functionName) {
          case "listar_vagas_ativas":
            const { data: vagas } = await supabase
              .from('vagas')
              .select('id, titulo, area, localidade, modelo_trabalho, tipo_contrato, salario')
              .eq('status', 'ativa')
              .order('criada_em', { ascending: false });
            result = vagas || [];
            break;

          case "buscar_status_candidatura":
            const { data: candidaturas } = await supabase
              .from('candidatos')
              .select('id, nome, etapa_atual, enviado_em, vagas(titulo, area)')
              .eq('user_id', user.id)
              .order('enviado_em', { ascending: false });
            result = candidaturas || [];
            break;

          case "info_empresa":
            result = {
              nome: "Pneu Forte",
              descricao: "Somos uma empresa líder no setor de pneus e serviços automotivos, comprometida com excelência e inovação.",
              valores: ["Qualidade", "Confiabilidade", "Inovação", "Trabalho em Equipe"],
              beneficios: [
                "Plano de saúde e odontológico",
                "Vale alimentação e refeição",
                "Auxílio transporte",
                "Programas de desenvolvimento profissional",
                "Ambiente de trabalho colaborativo"
              ],
              processo_seletivo: {
                etapas: [
                  "Inscrição - Envio do currículo",
                  "Triagem - Análise inicial dos candidatos",
                  "Entrevista - Conversa com RH e gestores",
                  "Teste Técnico - Avaliação de habilidades específicas (quando aplicável)",
                  "Finalização - Feedback e proposta"
                ],
                tempo_medio: "2-4 semanas dependendo da vaga",
                dicas: [
                  "Mantenha seu currículo atualizado e objetivo",
                  "Seja pontual e profissional",
                  "Pesquise sobre a empresa antes da entrevista",
                  "Seja autêntico e mostre suas experiências relevantes"
                ]
              }
            };
            break;

          case "listar_candidatos_por_etapa":
            if (!isRH) {
              result = { error: "Acesso negado" };
              break;
            }
            const { data: candidatosPorEtapa } = await supabase
              .from('candidatos')
              .select('id, nome, email, telefone, etapa_atual, enviado_em, vagas(titulo)')
              .eq('etapa_atual', args.etapa)
              .order('enviado_em', { ascending: false });
            result = candidatosPorEtapa || [];
            break;

          case "buscar_candidato_por_nome":
            if (!isRH) {
              result = { error: "Acesso negado" };
              break;
            }
            const { data: candidatosPorNome } = await supabase
              .from('candidatos')
              .select('id, nome, email, telefone, etapa_atual, enviado_em, vagas(titulo)')
              .ilike('nome', `%${args.nome}%`)
              .order('enviado_em', { ascending: false });
            result = candidatosPorNome || [];
            break;

          case "estatisticas_sistema":
            if (!isRH) {
              result = { error: "Acesso negado" };
              break;
            }
            const { count: totalCandidatos } = await supabase
              .from('candidatos')
              .select('*', { count: 'exact', head: true });
            
            const { count: totalVagas } = await supabase
              .from('vagas')
              .select('*', { count: 'exact', head: true });
            
            const { data: porEtapa } = await supabase
              .from('candidatos')
              .select('etapa_atual');
            
            const distribuicaoEtapas = porEtapa?.reduce((acc: any, c: any) => {
              acc[c.etapa_atual] = (acc[c.etapa_atual] || 0) + 1;
              return acc;
            }, {}) || {};

            result = {
              total_candidatos: totalCandidatos,
              total_vagas: totalVagas,
              distribuicao_etapas: distribuicaoEtapas
            };
            break;

          default:
            result = { error: "Função não encontrada" };
        }

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }

      // Make second AI call with tool results
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            aiResponse.choices[0].message,
            ...toolResults
          ],
          temperature: 0.7,
        }),
      });

      const finalAiResponse = await finalResponse.json();
      return new Response(JSON.stringify(finalAiResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in assistente-ia function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
