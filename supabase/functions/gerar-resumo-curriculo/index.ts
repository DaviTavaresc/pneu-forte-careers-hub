import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { candidatoId, curriculoUrl } = await req.json();

    console.log("Gerando resumo do currículo:", { candidatoId, curriculoUrl });

    // Download do currículo do storage
    const fileName = curriculoUrl.split('/').pop();
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('curriculos')
      .download(fileName);

    if (downloadError) throw downloadError;

    // Converter PDF para texto (simplificado - em produção usar biblioteca de PDF)
    const fileText = await fileData.text();
    
    // Gerar resumo com IA
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de RH especializado em análise de currículos. Analise o currículo e forneça um resumo objetivo em 2-4 frases, destacando: experiência profissional relevante, principais habilidades técnicas e pontos fortes do candidato.'
          },
          {
            role: 'user',
            content: `Analise este currículo e forneça um resumo profissional:\n\n${fileText.substring(0, 4000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const resumo = aiData.choices[0].message.content;

    // Atualizar o candidato com o resumo
    const { error: updateError } = await supabase
      .from('candidatos')
      .update({ resumo_ia: resumo })
      .eq('id', candidatoId);

    if (updateError) throw updateError;

    console.log("Resumo gerado com sucesso");

    return new Response(
      JSON.stringify({ success: true, resumo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});