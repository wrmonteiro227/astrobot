// cerebro.js - Versão Consolidada Astro
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message, userId } = req.body;
        const input = message.toLowerCase().trim();

        // --- REGEX CONSOLIDADO (NÃO ALTERAR) ---
        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;
        const regexData = /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/;
        
        // Identificadores de Intenção
        const isDivida = /\b(paguei|gastei|devo|divida|conta|pagar)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar|agendar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|quais|ver)\b/i.test(input);

        let resposta = {
            tipo: "indefinido",
            mensagem: "Não consegui processar. Tente: 'Gastei 50,00 com Mercado' ou 'Fazer academia 18h'.",
            data: null
        };

        // LÓGICA DE REGISTRO (FINANÇAS/RESERVA)
        if (!isConsulta && (isDivida || isReserva)) {
            const matchValor = input.match(regexValor);
            if (matchValor) {
                let valorLimpo = matchValor[1].replace(/\./g, '').replace(',', '.');
                let descricao = input.replace(matchValor[0], '').replace(/\b(paguei|gastei|reservei|cofre)\b/gi, '').trim();
                
                // Preservação de Nomes Compostos (Ex: VT Lixeiro)
                descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

                resposta = {
                    tipo: isReserva ? "reserva" : "financas",
                    mensagem: `Entendido, Tony. Registrei ${isReserva ? 'na reserva' : 'o gasto'} de R$ ${matchValor[1]} com ${descricao}.`,
                    payload: { valor: parseFloat(valorLimpo), descricao, categoria: isReserva ? 'Cofre' : 'Geral' }
                };
            }
        }

        // LÓGICA DE TAREFAS
        else if (isTarefa && !isConsulta) {
            let descricaoTarefa = input.replace(/\b(fazer|tarefa|lembrar|anotar)\b/gi, '').trim();
            descricaoTarefa = descricaoTarefa.charAt(0).toUpperCase() + descricaoTarefa.slice(1);

            resposta = {
                tipo: "tarefa",
                mensagem: `Anotado, Stark. Vou te lembrar de: ${descricaoTarefa}.`,
                payload: { descricao: descricaoTarefa, status: 'pendente' }
            };
        }

        // LÓGICA DE CONSULTA (LISTAGEM)
        else if (isConsulta) {
            resposta = {
                tipo: "consulta",
                mensagem: "Buscando seus dados agora...",
                filtro: isTarefa ? "tarefas" : (isReserva ? "reserva" : "financas")
            };
        }

        return res.status(200).json(resposta);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
