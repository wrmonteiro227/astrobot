module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // 1. INTELIGÊNCIA DE NORMALIZAÇÃO
        const correcoes = {
            "laches": "lanches", "lanxe": "lanches", "otem": "ontem",
            "compa": "compra", "vlr": "valor", "pagamento": "pago"
        };
        Object.keys(correcoes).forEach(erro => {
            const regex = new RegExp(`\\b${erro}\\b`, 'g');
            frase = frase.replace(regex, correcoes[erro]);
        });

        // 2. TRATAMENTO DE VALORES (Consolidado: 50.000 = 50000)
        // BLINDAGEM: Ignora números que tenham "h", "hs" ou "horas" logo após
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas|min|minutos)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 3. LIMPEZA DE DESCRIÇÃO (Consolidado: Preserva VT Lixeiro)
        let descLimpa = fraseOriginal
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover|tenho que|tenho que pagar|tenho que gastar|fazer o pagamento)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // 4. EXCLUSÃO CIRÚRGICA (SNIPER)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoExclusao = "tarefas";
            if (frase.match(/(cofre|reserva|poupanca|juntei|guardei|economizei)\b/)) tipoExclusao = "reserva";
            
            let termoBusca = valor ? valor.toString() : frase
                .replace(/\b(apagar|apaga|deletar|excluir|remover|me pagou|quitou|o|a|os|as|minhas|meu|minha|cofre|saida|saidas|gasto|gastos|tarefa|tarefas)\b/g, '')
                .trim();

            return res.status(200).json({ 
                categoria: "exclusao", tipo: tipoExclusao, termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `Alvo: "${termoBusca}". Removendo...` : `Limpando ${tipoExclusao}.`
            });
        }

        // 5. CONSULTAS
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|extrato|ver|quais|como|onde|saldo|resumo|total|balanco)\b/)) && !ehComandoRegistro;
        if (ehPergunta) {
            let t = "gastos";
            if (frase.match(/\b(juntei|guardei|reserva|cofre|poupanca|economizei)\b/)) t = "reserva";
            else if (frase.match(/\b(recebi|ganhei|entrada|vendi|salario)\b/)) t = "entrada";
            else if (frase.match(/\b(eu devo|estou devendo|minhas dividas|devo)\b/)) t = "minhas_dividas";
            else if (frase.match(/\b(me deve|me devem|divida|quem deve)\b/)) t = "dividas";
            else if (frase.match(/\b(tarefa|fazer|agenda|lembrete|hoje|amanha|semana|ir|onde)\b/)) t = "tarefas";
            return res.status(200).json({ categoria: "consulta", tipo: t, mensagem: `Buscando relatório solicitado...` });
        }

        // 6. REGISTROS FINANCEIROS (SÓ SE TIVER VALOR REAL, NÃO HORÁRIO)
        if (valor !== null) {
            let t = "saida";
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|devo)\b/)) t = "minhas_dividas";
            else if (frase.match(/(me deve|devendo)/) && !frase.includes("eu")) t = "divida";
            else if (frase.match(/(guardei|cofre|reserva|poupanca|juntei|economizei)/)) t = "reserva";
            else if (frase.match(/(recebi|ganhei|entrou|vendi)/)) t = "entrada";
            
            return res.status(200).json({ categoria: "financa", tipo: t, valor: valor, descricao_limpa: descLimpa, mensagem: `Movimentação de R$ ${valor.toLocaleString('pt-BR')} confirmada.` });
        }

        // 7. TAREFAS (AGORA CAPTURA HORÁRIOS CORRETAMENTE)
        if (frase.match(/\b(tenho que fazer|fazer|ir|lembrar|tarefa|esperando|hoje|amanha|semana|anota|anotar|as|às)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: fraseOriginal, mensagem: `Pode deixar, Tony. Lembrete agendado: ${fraseOriginal}` });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Não consegui entender se é um registro ou tarefa. Pode repetir com mais detalhes?" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "INTERNAL_CORE_ERROR" });
    }
};
