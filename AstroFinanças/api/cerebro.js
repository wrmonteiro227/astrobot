// cerebro.js - VERSÃO FINAL CONSOLIDADA TONY STARK
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const input = message.toLowerCase().trim();

        // --- REGEX DE MILHAR E VALORES (50.000) ---
        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;

        // --- IDENTIFICAÇÃO DE INTENÇÕES ---
        const isExclusao = /\b(apagar|deletar|excluir|remover|tira|limpar)\b/i.test(input);
        const isDivida = /\b(paguei|gastei|devo|divida|conta|pagar)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar|agendar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|quais|ver)\b/i.test(input);

        // 1. SNIPER
        if (isExclusao) {
            let termo = input.replace(/\b(apagar|deletar|excluir|remover|tira|limpar|o|a|os|as)\b/gi, '').trim();
            return res.status(200).json({ tipo: "exclusao_sniper", mensagem: `Sniper: Removi "${termo}"!`, payload: { termo, tabela: isTarefa ? 'tarefas' : 'financas' } });
        }

        // 2. FINANCEIRO
        if (!isConsulta && (isDivida || isReserva)) {
            const match = input.match(regexValor);
            if (match) {
                let valor = match[1].replace(/\./g, '').replace(',', '.');
                let desc = input.replace(match[0], '').replace(/\b(paguei|gastei|reservei|cofre|com|na|no)\b/gi, '').trim();
                desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                return res.status(200).json({ tipo: isReserva ? "reserva" : "financas", mensagem: `Registrado: R$ ${match[1]} com ${desc}.`, payload: { valor: parseFloat(valor), descricao: desc } });
            }
        }

        // 3. TAREFA
        if (isTarefa && !isConsulta) {
            let desc = input.replace(/\b(fazer|tarefa|lembrar|anotar)\b/gi, '').trim();
            return res.status(200).json({ tipo: "tarefa", mensagem: `Anotado: ${desc}.`, payload: { descricao: desc } });
        }

        // 4. CONSULTA
        if (isConsulta) {
            return res.status(200).json({ tipo: "consulta", mensagem: "Aqui está o que encontrei:", filtro: isTarefa ? 'tarefas' : (isReserva ? 'reserva' : 'gastos') });
        }

        return res.status(200).json({ tipo: "conversa", mensagem: "Sistemas prontos. O que manda, Stark?", payload: null });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
