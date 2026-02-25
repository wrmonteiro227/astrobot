module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. LIMPEZA DE DESCRIÇÃO
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // --- 🎯 NOVIDADE: LÓGICA DE EXCLUSÃO CIRÚRGICA (SNIPER) ---
        if (frase.match(/\b(apagar|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas"; // Padrão
            if (frase.includes("tarefa")) tipoExclusao = "tarefas";
            if (frase.includes("gasto") || frase.includes("ganho") || frase.includes("divida")) tipoExclusao = "financas";

            // Pega o que sobrou da frase para usar como busca (ex: "dulce" ou "barbeiro")
            let termoBusca = frase
                .replace(/\b(apagar|deletar|excluir|remover|tarefa|gasto|conta|me pagou|quitou|o|a|os|as)\b/g, '')
                .trim();

            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `Comando recebido. Eliminando "${termoBusca}" do sistema... 🚀` : `Limpando todos os registros de ${tipoExclusao}... 🧹`
            });
        }

        // 3. CONSULTAS (Corrigido: Quem estou devendo)
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|mostrar|lista|tenho|extrato|ver)\b/)) && !ehComandoRegistro;
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/(estou devendo|eu devo|devo pagar|minhas dividas)/)) tipo = "minhas_dividas";
            else if (frase.match(/(quem me deve|me devem|dividas)/)) tipo = "dividas";
            else if (frase.match(/(tarefa|fazer|agenda)/)) tipo = "tarefas";
            return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Acessando banco de dados... 📊" });
        }

        // 4. REGISTROS FINANCEIROS
        if (valor) {
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|devo)\b/)) {
                return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Anotado. Você deve R$ ${valor.toLocaleString('pt-BR')} (${descLimpa}). 📝💸` });
            }
            if (frase.match(/(deve|devendo)/) && !frase.includes("eu")) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: descLimpa, mensagem: `Tá no caderninho! ${descLimpa} te deve R$ ${valor.toLocaleString('pt-BR')}. ✍️` });
            }
            let tipo = "saida";
            if (frase.match(/(recebi|ganhei|entrou)/)) tipo = "entrada";
            else if (frase.match(/(guardei|cofre|reserva|poupanca)/)) tipo = "reserva";
            return res.status(200).json({ categoria: "financa", tipo, valor, descricao_limpa: descLimpa, mensagem: `Registro de R$ ${valor.toLocaleString('pt-BR')} realizado. 💰` });
        }

        // 5. TAREFAS
        if (frase.match(/\b(esperando|fazer|ir|lembrar|tarefa)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Tarefa indexada: ${descLimpa} ✅` });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Astro online. No que posso ajudar? 🚀" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro no core" });
    }
};
