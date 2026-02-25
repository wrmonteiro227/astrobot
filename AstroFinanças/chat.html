module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES (Consolidado: 50.000 = 50000)
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. LIMPEZA DE DESCRIÇÃO (Consolidado: Preserva VT Lixeiro)
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover|tenho que|tenho que pagar|tenho que gastar|fazer o pagamento|conclui|pago|meta|limite)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        // 3. PRIORIDADE MÁXIMA: EXCLUSÃO (MODO SNIPER)
        // Se a palavra apagar estiver presente, ele IGNORA o registro, mesmo com valor.
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover)\b/)) {
            let tipoExclusao = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoExclusao = "tarefas";
            if (frase.match(/(cofre|reserva|poupanca|juntei|guardei|economizei)/)) tipoExclusao = "reserva";
            
            let termoBusca = valor ? valor.toString() : descLimpa;
            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca, 
                mensagem: `Solicitando exclusão de: "${termoBusca}".` 
            });
        }

        // 4. PRIORIDADE 2: STATUS E BAIXAS (Só ativa se NÃO houver valor na frase)
        if (frase.match(/\b(paguei|quitei|conclui|concluido|pago)\b/) && !valor && !frase.match(/\b(quanto|lista|ver)\b/)) {
            let tipoUpdate = frase.match(/(tarefa|fazer)/) ? "tarefas" : "financas";
            return res.status(200).json({
                categoria: "update",
                tipo: tipoUpdate,
                termo_busca: descLimpa,
                mensagem: `Entendido, Tony. Vou marcar "${descLimpa}" como concluído.`
            });
        }

        // 5. INTELIGÊNCIA TEMPORAL
        let periodo = "tudo";
        if (frase.match(/\b(hoje|agora)\b/)) periodo = "hoje";
        else if (frase.match(/\b(ontem|otem)\b/)) periodo = "ontem";
        else if (frase.match(/\b(semana)\b/)) periodo = "semana";
        else if (frase.match(/\b(mes|mês)\b/)) periodo = "mes";

        // 6. METAS (PILAR 3)
        if (frase.match(/\b(meta|limite|objetivo)\b/) && valor) {
            return res.status(200).json({
                categoria: "meta",
                tipo: frase.match(/(guardar|economizar|juntar|cofre)/) ? "reserva" : "saida",
                valor: valor,
                descricao: descLimpa,
                mensagem: `Meta de R$ ${valor.toLocaleString('pt-BR')} estabelecida para ${descLimpa}.`
            });
        }

        // 7. CONSULTAS (REFINADO)
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|tenho|extrato|ver|saldo|total)\b/));
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/\b(juntei|guardei|reserva|cofre|poupanca|economizei)\b/)) tipo = "reserva";
            else if (frase.match(/\b(recebi|ganhei|entrada|vendi|salario)\b/)) tipo = "entrada";
            else if (frase.match(/\b(eu devo|estou devendo|minhas dividas|devo)\b/)) tipo = "minhas_dividas";
            else if (frase.match(/\b(me deve|me devem|divida|quem deve)\b/)) tipo = "dividas";
            else if (frase.match(/\b(tarefa|fazer|agenda|pendente|ir)\b/)) tipo = "tarefas";
            
            return res.status(200).json({ categoria: "consulta", tipo, periodo, mensagem: `Relatório solicitado (${periodo}):` });
        }

        // 8. REGISTROS FINANCEIROS (Consolidado)
        if (valor) {
            let tipo = "saida";
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|devo)\b/)) tipo = "minhas_dividas";
            else if (frase.match(/(me deve|devendo)/)) tipo = "divida";
            else if (frase.match(/(guardei|cofre|reserva|juntei|economizei)/)) tipo = "reserva";
            else if (frase.match(/(recebi|ganhei|entrou|vendi)/)) tipo = "entrada";
            
            return res.status(200).json({ 
                categoria: "financa", 
                tipo, 
                valor, 
                descricao_limpa: descLimpa, 
                mensagem: `Movimentação de R$ ${valor.toLocaleString('pt-BR')} confirmada.` 
            });
        }

        // 9. TAREFAS
        if (frase.match(/\b(fazer|ir|lembrar|tarefa)\b/)) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Lembrete indexado: ${descLimpa}.` });
        }

        return res.status(200).json({ 
            categoria: "conversa", 
            mensagem: `Não entendi bem o comando, Tony. Tente usar palavras como registrar, pagar ou quanto tenho.` 
        });
        
    } catch (erro) {
        return res.status(500).json({ erro: "INTERNAL_CORE_ERROR" });
    }
};
