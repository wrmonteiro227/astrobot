// cerebro.js - Versão Consolidada Tony Stark
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const input = message.toLowerCase().trim();

        // --- REGEX DE MILHAR E VALORES (CONSOLIDADO) ---
        const regexValor = /(?:r\$\s?|vlr\s?)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/i;

        // --- IDENTIFICAÇÃO DE INTENÇÕES ---
        const isExclusao = /\b(apagar|deletar|excluir|remover|tira|limpar)\b/i.test(input);
        const isDivida = /\b(paguei|gastei|devo|divida|conta|pagar)\b/i.test(input);
        const isTarefa = /\b(fazer|tarefa|lembrar|anotar|agendar)\b/i.test(input);
        const isReserva = /\b(guardei|reservei|cofre|poupar|reserva)\b/i.test(input);
        const isConsulta = /\b(quanto|listar|extrato|quais|ver)\b/i.test(input);

        // --- LÓGICA SNIPER (EXCLUSÃO) ---
        if (isExclusao) {
            let termo = input.replace(/\b(apagar|deletar|excluir|remover|tira|o|a|os|as|limpar)\b/gi, '').trim();
            const tabela = isTarefa ? 'tarefas' : 'financas';
            return res.status(200).json({
                tipo: "exclusao_sniper",
                mensagem: `Sniper ativado. Removi "${termo}" da sua lista de ${tabela === 'tarefas' ? 'tarefas' : 'finanças'}.`,
                payload: { termo, tabela }
            });
        }

        // --- LÓGICA DE REGISTRO FINANCEIRO (VALOR 50.000) ---
        if (!isConsulta && (isDivida || isReserva)) {
            const matchValor = input.match(regexValor);
            if (matchValor) {
                // Tratamento de milhar: remove pontos e troca vírgula por ponto
                let valorLimpo = matchValor[1].replace(/\./g, '').replace(',', '.');
                let descricao = input.replace(matchValor[0], '')
                                     .replace(/\b(paguei|gastei|reservei|cofre|r\$|com|no|na)\b/gi, '')
                                     .trim();
                
                // Preservação de nomes compostos (ex: VT Lixeiro)
                descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

                return res.status(200).json({
                    tipo: isReserva ? "reserva" : "financas",
                    mensagem: `Registrado: R$ ${matchValor[1]} em ${descricao}.`,
                    payload: { valor: parseFloat(valorLimpo), descricao }
                });
            }
        }

        // --- LÓGICA DE TAREFAS ---
        if (isTarefa && !isConsulta) {
            let descTarefa = input.replace(/\b(fazer|tarefa|lembrar|anotar|marcar)\b/gi, '').trim();
            descTarefa = descTarefa.charAt(0).toUpperCase() + descTarefa.slice(1);

            return res.status(200).json({
                tipo: "tarefa",
                mensagem: `Tarefa anotada: ${descTarefa}. Pode deixar comigo.`,
                payload: { descricao: descTarefa }
            });
        }

        // RESPOSTA PADRÃO / CONSULTA
        return res.status(200).json({
            tipo: isConsulta ? "consulta" : "conversa",
            mensagem: isConsulta ? "Vou verificar seus registros agora..." : "Não entendi bem. Quer registrar um gasto ou uma tarefa?",
            payload: null
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
