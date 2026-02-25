module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES (Consolidado)
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. LIMPEZA DE DESCRIÇÃO (Consolidado)
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover|tenho que|tenho que pagar|tenho que gastar|fazer o pagamento)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // 3. EXCLUSÃO CIRÚRGICA (MODO SNIPER - LIMPEZA TOTAL DE CATEGORIA)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoExclusao = "tarefas";
            if (frase.match(/(cofre|reserva|poupanca|juntei|guardei)/)) tipoExclusao = "reserva";
            
            // Sniper: Remove o comando E as palavras da categoria para não sujar a busca no banco
            let termoBusca = frase
                .replace(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou|o|a|os|as|reais|r\$|minhas|meu|minha|cofre|reserva|poupanca|poupado)\b/g, '')
                .trim();

            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `Solicitação de exclusão para o termo: "${termoBusca}".` : `Limpando registros de ${tipoExclusao}.`
            });
        }

        // 4. CONSULTAS (INTELIGÊNCIA EXPANDIDA)
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|tenho|extrato|ver|quais|como|onde|saldo|resumo|total|balanco)\b/)) && !ehComandoRegistro;
        
        if (ehPergunta) {
            if (frase.match(/\b(juntei|guardei|reserva|cofre|poupanca|poupado|economizei|guardado|acumulado|no banco)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "reserva", mensagem: "Relatório de ativos e reservas financeiras:" });
            }
            if (frase.match(/\b(recebi|ganhei|ganho|ganhos|entrou|entrada|entradas|vendi|recebimentos|faturamento|salario|pix recebido)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Análise de fluxo de caixa (Entradas):" });
            }
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|minhas dividas|devo|quanto devo|quando devo|contas|boletos|vencimento|pagamentos pendentes)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "minhas_dividas", mensagem: "Relatório de obrigações e contas a pagar:" });
            } 
            if (frase.match(/\b(me deve|me devem|devendo|divida|quem deve|quem esta|quem está|calote|pendentes comigo|dinheiro na rua)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "dividas", mensagem: "Relatório de créditos e valores a receber:" });
            }
            if (frase.match(/\b(tarefa|fazer|agenda|compromisso|pendente|lembrete|hoje|amanha|semana|lista de tarefas)\b/)) {
                return res.status(200).json({ categoria: "consulta", tipo: "tarefas", mensagem: "Cronograma de atividades e lembretes:" });
            }
            return res.status(200).json({ categoria: "consulta", tipo: "gastos", mensagem: "Relatório geral de movimentações de saída:" });
        }

        // 5. REGISTROS FINANCEIROS
        if (valor) {
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|tenho que gastar|fazer o pagamento|devo)\b/)) {
                return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Compromisso de R$ ${valor.toLocaleString('pt-BR')} registrado em sua agenda financeira.` });
            }
            if (frase.match(/(me deve|devendo)/) && !frase.includes("eu")) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: descLimpa, mensagem: `Débito de R$ ${valor.toLocaleString('pt-BR')} vinculado a ${descLimpa}.` });
            }
            let tipo = "saida";
            if (frase.match(/(recebi|ganhei|entrou|vendi)/)) tipo = "entrada";
            else if (frase.match(/(guardei|cofre|reserva|poupanca)/)) tipo = "reserva";
            return res.status(200).json({ categoria: "financa", tipo, valor, descricao_limpa: descLimpa, mensagem: `Movimentação de R$ ${valor.toLocaleString('pt-BR')} confirmada.` });
        }

        // 6. TAREFAS
        if (frase.match(/\b(tenho que fazer|fazer|ir|lembrar|tarefa|esperando)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Lembrete indexado: ${descLimpa}.` });
        }

        return res.status(200).json({ 
            categoria: "conversa", 
            mensagem: `Não foi possível processar este comando. O Astro ainda não reconhece essa estrutura.\n\nPor favor, tente utilizar palavras-chave como: registrar, pagar, receber ou apagar para uma melhor indexação.` 
        });
        
    } catch (erro) {
        return res.status(500).json({ erro: "INTERNAL_CORE_ERROR" });
    }
};
