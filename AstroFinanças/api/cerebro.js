module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES (50.000 = 50000)
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

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // 3. EXCLUSÃO CIRÚRGICA (MODO SNIPER)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoExclusao = "tarefas";
            if (frase.match(/(cofre|reserva|poupanca|juntei|guardei|economizei|econimizei)/)) tipoExclusao = "reserva";
            
            let termoBusca = valor ? valor.toString() : frase
                .replace(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou|o|a|os|as|minhas|meu|minha|cofre|reserva|poupanca|poupado|juntei|guardei)\b/g, '')
                .trim();

            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `Solicitação de exclusão para o termo: "${termoBusca}".` : `Limpando registros de ${tipoExclusao}.`
            });
        }

        // 4. INTELIGÊNCIA TEMPORAL (PILAR 1)
        let periodo = "tudo";
        if (frase.match(/\b(hoje|agora)\b/)) periodo = "hoje";
        else if (frase.match(/\b(ontem|otem)\b/)) periodo = "ontem";
        else if (frase.match(/\b(semana)\b/)) periodo = "semana";
        else if (frase.match(/\b(mes|mês)\b/)) periodo = "mes";

        // 5. STATUS E BAIXAS (PILAR 2 - "JÁ PAGUEI", "CONCLUÍDO")
        if (frase.match(/\b(paguei|quitei|conclui|concluido|ja paguei|está pago|esta pago)\b/) && !frase.match(/\b(quanto|lista|ver)\b/)) {
            let tipoUpdate = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoUpdate = "tarefas";
            return res.status(200).json({
                categoria: "update",
                tipo: tipoUpdate,
                termo_busca: valor ? valor.toString() : descLimpa,
                mensagem: `Entendido, Tony. Vou marcar como pago/concluído agora mesmo.`
            });
        }

        // 6. METAS (PILAR 3 - "MINHA META É", "AVISO SE")
        if (frase.match(/\b(meta|limite|objetivo|avisar|aviso)\b/) && valor) {
            return res.status(200).json({
                categoria: "meta",
                tipo: frase.match(/(guardar|economizar|juntar|cofre)/) ? "reserva" : "gasto",
                valor: valor,
                descricao: descLimpa,
                mensagem: `Meta de R$ ${valor.toLocaleString('pt-BR')} estabelecida. Vou monitorar para você.`
            });
        }

        // 7. CONSULTAS (INTELIGÊNCIA EXPANDIDA)
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|tenho|extrato|ver|quais|como|onde|saldo|resumo|total|balanco)\b/)) && !ehComandoRegistro;
        if (ehPergunta) {
            if (frase.match(/\b(juntei|guardei|reserva|cofre|poupanca|poupado|economizei|econimizei|guardado|acumulado)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "reserva", periodo, mensagem: `Relatório de ativos (Cofre) - Período: ${periodo}:` });
            }
            if (frase.match(/\b(recebi|ganhei|ganho|ganhos|entrou|entrada|entradas|vendi|recebimentos|faturamento|salario|pix recebido)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "entrada", periodo, mensagem: `Fluxo de caixa (Entradas) - Período: ${periodo}:` });
            }
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|minhas dividas|devo|quanto devo|quando devo|contas|boletos|vencimento|pagamentos pendentes)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "minhas_dividas", periodo, mensagem: `Obrigações e contas - Período: ${periodo}:` });
            } 
            if (frase.match(/\b(me deve|me devem|devendo|divida|quem deve|quem esta|quem está|calote|pendentes comigo|dinheiro na rua)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "dividas", periodo, mensagem: `Valores a receber - Período: ${periodo}:` });
            }
            if (frase.match(/\b(tarefa|fazer|agenda|compromisso|pendente|lembrete|hoje|amanha|semana|lista de tarefas|tenho que ir|onde ir|para onde)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "tarefas", periodo, mensagem: `Cronograma de tarefas - Período: ${periodo}:` });
            }
            return res.status(200).json({ categoria: "consulta", tipo: "gastos", periodo, mensagem: `Movimentações de saída - Período: ${periodo}:` });
        }

        // 8. REGISTROS FINANCEIROS
        if (valor) {
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|tenho que gastar|fazer o pagamento|devo)\b/)) {
                return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Compromisso de R$ ${valor.toLocaleString('pt-BR')} registrado.` });
            }
            if (frase.match(/(me deve|devendo)/) && !frase.includes("eu")) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: descLimpa, mensagem: `Débito de R$ ${valor.toLocaleString('pt-BR')} vinculado a ${descLimpa}.` });
            }
            if (frase.match(/(guardei|cofre|reserva|poupanca|juntei|economizei|econimizei)/)) {
                return res.status(200).json({ categoria: "financa", tipo: "reserva", valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor.toLocaleString('pt-BR')} adicionado ao Cofre.` });
            }
            if (frase.match(/(recebi|ganhei|entrou|vendi|faturamento)/)) {
                return res.status(200).json({ categoria: "financa", tipo: "entrada", valor, descricao_limpa: descLimpa, mensagem: `Entrada de R$ ${valor.toLocaleString('pt-BR')} registrada.` });
            }
            return res.status(200).json({ categoria: "financa", tipo: "saida", valor, descricao_limpa: descLimpa, mensagem: `Movimentação de R$ ${valor.toLocaleString('pt-BR')} confirmada.` });
        }

        // 9. TAREFAS
        if (frase.match(/\b(tenho que fazer|fazer|ir|lembrar|tarefa|esperando|tenho que ir|onde ir|para onde)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Lembrete indexado: ${descLimpa}.` });
        }

        return res.status(200).json({ 
            categoria: "conversa", 
            mensagem: `Não foi possível processar este comando. Tente registrar, pagar, receber ou apagar.` 
        });
        
    } catch (erro) {
        return res.status(500).json({ erro: "INTERNAL_CORE_ERROR" });
    }
};
