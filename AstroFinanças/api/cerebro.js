module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES (Garante que 50.000 seja 50000)
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. LIMPEZA DE DESCRIÇÃO (Preserva VT Lixeiro)
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover|tenho que|tenho que pagar|tenho que gastar|fazer o pagamento)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // 3. EXCLUSÃO CIRÚRGICA (MODO SNIPER - EXTRATOR DE CHAVES)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoExclusao = "tarefas";
            if (frase.match(/(cofre|reserva|poupanca|juntei|guardei)/)) tipoExclusao = "reserva";
            
            // Sniper: Remove apenas os comandos e artigos. 
            // Se você disser "apagar cofre guardei 1245", ele manda "guardei 1245"
            let termoBusca = frase
                .replace(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou|o|a|os|as|reais|r\$|cofre|reserva|poupanca|minhas|meu|minha)\b/g, '')
                .trim();

            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `Solicitação de exclusão para o termo: "${termoBusca}".` : `Limpando registros de ${tipoExclusao}.`
            });
        }

        // 4. CONSULTAS
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|tenho|extrato|ver|quais)\b/)) && !ehComandoRegistro;
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/\b(juntei|guardei|reserva|cofre|poupanca|poupado)\b/)) {
                tipo = "reserva";
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Acessando seu saldo em reserva e cofre:" });
            }
            else if (frase.match(/\b(recebi|ganhei|ganho|ganhos|entrou|entrada|entradas|vendi)\b/)) {
                tipo = "entrada";
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Relatório de entradas e ganhos identificados:" });
            }
            else if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|minhas dividas|devo|quanto devo|quando devo)\b/)) {
                tipo = "minhas_dividas";
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Relatório de obrigações financeiras:" });
            } 
            else if (frase.match(/\b(me deve|me devem|devendo|divida|quem deve|quem esta|quem está)\b/)) {
                tipo = "dividas";
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Relatório de valores a receber:" });
            }
            else if (frase.match(/(tarefa|fazer|agenda|compromisso)/)) {
                tipo = "tarefas";
                return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Cronograma de tarefas pendentes:" });
            }
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
