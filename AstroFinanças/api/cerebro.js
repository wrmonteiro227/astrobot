// cerebro.js - VERSÃO CONSOLIDADA TONY STARK (NÃO SIMPLIFICAR)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message, userId } = req.body;
        const input = message.toLowerCase().trim();

        // --- REGEX DE ESTRESSE (CONSOLIDADO) ---
        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;

        // --- IDENTIFICAÇÃO DE INTENÇÕES ---
        const isExclusao = /\b(apagar|deletar|excluir|remover|tira|limpar)\b/i.test(input);
        const isDivida = /\b(paguei|gastei|devo|divida|conta|pagar)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar|agendar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|quais|ver)\b/i.test(input);

        // 1. LÓGICA SNIPER (EXCLUSÃO)
        if (isExclusao) {
            let termo = input.replace(/\b(apagar|deletar|excluir|remover|tira|o|a|os|as|limpar)\b/gi, '').trim();
            const tabela = isTarefa ? 'tarefas' : 'financas';
            return res.status(200).json({
                tipo: "exclusao_sniper",
                mensagem: `Sniper ativado. Removi "${termo}" da sua base de dados.`,
                payload: { termo, tabela }
            });
        }

        // 2. REGISTRO FINANCEIRO (TRATAMENTO 50.000)
        if (!isConsulta && (isDivida || isReserva)) {
            const matchValor = input.match(regexValor);
            if (matchValor) {
                let valorLimpo = matchValor[1].replace(/\./g, '').replace(',', '.');
                let descricao = input.replace(matchValor[0], '')
                                     .replace(/\b(paguei|gastei|reservei|cofre|r\$|com|no|na)\b/gi, '')
                                     .trim();
                
                // Preservação de Nomes Compostos
                descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

                return res.status(200).json({
                    tipo: isReserva ? "reserva" : "financas",
                    mensagem: `Feito, Stark. R$ ${matchValor[1]} com "${descricao}" registrado.`,
                    payload: { valor: parseFloat(valorLimpo), descricao }
                });
            }
        }

        // 3. REGISTRO DE TAREFAS
        if (isTarefa && !isConsulta) {
            let descTarefa = input.replace(/\b(fazer|tarefa|lembrar|anotar|marcar)\b/gi, '').trim();
            descTarefa = descTarefa.charAt(0).toUpperCase() + descTarefa.slice(1);

            return res.status(200).json({
                tipo: "tarefa",
                mensagem: `Anotado. Vou te lembrar de: ${descTarefa}.`,
                payload: { descricao: descTarefa }
            });
        }

        // 4. CONSULTA
        if (isConsulta) {
            const alvo = isTarefa ? "tarefas" : (isReserva ? "reserva" : "financas");
            return res.status(200).json({
                tipo: "consulta",
                mensagem: `Buscando dados de ${alvo} no servidor...`,
                filtro: alvo
            });
        }

        return res.status(200).json({
            tipo: "conversa",
            mensagem: "Sistemas online, Tony. Como posso ajudar?",
            payload: null
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
