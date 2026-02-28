export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const input = message.toLowerCase().trim();
        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;

        const isExclusao = /\b(apagar|deletar|excluir|remover|tira|limpar)\b/i.test(input);
        const isDividaAlheia = /\b(quem|me deve|receber|divida dele|divida dela)\b/i.test(input);
        const isMinhaDivida = /\b(devo|pagar|conta|fatura|minha divida)\b/i.test(input);
        const isGasto = /\b(paguei|gastei|gasto)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|ver|quem|quais)\b/i.test(input);

        // SNIPER
        if (isExclusao) {
            let termo = input.replace(/\b(apagar|deletar|excluir|remover|tira|limpar|o|a|os|as)\b/gi, '').trim();
            return res.status(200).json({ tipo: "exclusao_sniper", mensagem: `Registro "${termo}" removido.`, payload: { termo, tabela: isTarefa ? 'tarefas' : 'financas' } });
        }

        // REGISTRO
        if (!isConsulta && (isGasto || isMinhaDivida || isDividaAlheia || isReserva)) {
            const match = input.match(regexValor);
            if (match) {
                let v = match[1].replace(/\./g, '').replace(',', '.');
                let desc = input.replace(match[0], '').replace(/\b(paguei|gastei|reservei|cofre|com|na|no|me deve|devo)\b/gi, '').trim();
                desc = desc.charAt(0).toUpperCase() + desc.slice(1);
                let tipo = isReserva ? 'reserva' : (isDividaAlheia ? 'divida' : (isMinhaDivida ? 'minhas_dividas' : 'saida'));
                return res.status(200).json({ tipo: "financas", mensagem: `Registrado: R$ ${match[1]} em "${desc}".`, payload: { valor: parseFloat(v), descricao: desc, tipo } });
            }
        }

        // TAREFA
        if (isTarefa && !isConsulta) {
            let desc = input.replace(/\b(fazer|tarefa|lembrar|anotar)\b/gi, '').trim();
            desc = desc.charAt(0).toUpperCase() + desc.slice(1);
            return res.status(200).json({ tipo: "tarefa", mensagem: `Tarefa anotada: ${desc}.`, payload: { descricao: desc } });
        }

        // CONSULTA
        if (isConsulta) {
            let f = isTarefa ? 'tarefa' : (isReserva ? 'reserva' : (isDividaAlheia ? 'divida' : (isMinhaDivida ? 'minhas_dividas' : 'saida')));
            return res.status(200).json({ tipo: "consulta", mensagem: "Localizei os seguintes registros:", filtro: f });
        }

        return res.status(200).json({ tipo: "conversa", mensagem: "Olá! Como posso ajudar com suas finanças ou tarefas hoje?", payload: null });
    } catch (e) { return res.status(500).json({ error: e.message }); }
}
