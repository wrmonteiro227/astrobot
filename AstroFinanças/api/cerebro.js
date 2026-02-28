// cerebro.js - VERSÃO COMERCIAL BLINDADA
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const input = message.toLowerCase().trim();

        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;

        // --- IDENTIFICAÇÃO DE INTENÇÕES EXPANDIDA ---
        const isExclusao = /\b(apagar|deletar|excluir|remover|tira|limpar)\b/i.test(input);
        const isDividaAlheia = /\b(quem|deve|me deve|receber)\b/i.test(input); // CORREÇÃO AQUI
        const isMinhaDivida = /\b(devo|pagar|conta|fatura|vencimento)\b/i.test(input);
        const isGasto = /\b(paguei|gastei|gasto)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar|agendar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|quais|ver|quem)\b/i.test(input);

        // 1. SNIPER
        if (isExclusao) {
            let termo = input.replace(/\b(apagar|deletar|excluir|remover|tira|limpar|o|a|os|as)\b/gi, '').trim();
            return res.status(200).json({ tipo: "exclusao_sniper", mensagem: `Removi "${termo}" dos registros.`, payload: { termo, tabela: isTarefa ? 'tarefas' : 'financas' } });
        }

        // 2. FINANCEIRO (REGISTRO)
        if (!isConsulta && (isGasto || isMinhaDivida || isDividaAlheia || isReserva)) {
            const match = input.match(regexValor);
            if (match) {
                let valor = match[1].replace(/\./g, '').replace(',', '.');
                let desc = input.replace(match[0], '').replace(/\b(paguei|gastei|reservei|cofre|com|na|no|me deve|devo)\b/gi, '').trim();
                desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                
                let tipoDB = 'saida';
                if (isReserva) tipoDB = 'reserva';
                if (isDividaAlheia) tipoDB = 'divida';
                if (isMinhaDivida) tipoDB = 'minhas_dividas';

                return res.status(200).json({ tipo: "financas", mensagem: `Registrado: R$ ${match[1]} - ${desc}.`, payload: { valor: parseFloat(valor), descricao: desc, tipo: tipoDB } });
            }
        }

        // 3. TAREFA
        if (isTarefa && !isConsulta) {
            let desc = input.replace(/\b(fazer|tarefa|lembrar|anotar)\b/gi, '').trim();
            return res.status(200).json({ tipo: "tarefa", mensagem: `Tarefa anotada: ${desc}.`, payload: { descricao: desc } });
        }

        // 4. CONSULTA (CORRIGIDO PARA "QUEM ME DEVE")
        if (isConsulta) {
            let filtro = 'saida';
            if (isDividaAlheia) filtro = 'divida';
            if (isMinhaDivida) filtro = 'minhas_dividas';
            if (isReserva) filtro = 'reserva';
            if (isTarefa) filtro = 'tarefa';

            return res.status(200).json({ tipo: "consulta", mensagem: "Localizei o seguinte:", filtro: filtro });
        }

        return res.status(200).json({ tipo: "conversa", mensagem: "Como posso ajudar com suas finanças ou tarefas hoje?", payload: null });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
