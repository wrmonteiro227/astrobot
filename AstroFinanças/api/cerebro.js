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

        // 2. LIMPEZA DE DESCRIÇÃO (Preserva VT Lixeiro, Alana Gorda, etc)
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);

        // 3. EXCLUSÃO CIRÚRGICA (MODO SNIPER)
        if (frase.match(/\b(apagar|deletar|excluir|remover|me pagou|quitou)\b/)) {
            let tipoExclusao = "financas";
            if (frase.includes("tarefa")) tipoExclusao = "tarefas";
            let termoBusca = frase
                .replace(/\b(apagar|deletar|excluir|remover|tarefa|gasto|conta|me pagou|quitou|o|a|os|as)\b/g, '')
                .trim();
            return res.status(200).json({ 
                categoria: "exclusao", 
                tipo: tipoExclusao, 
                termo_busca: termoBusca || "tudo", 
                mensagem: termoBusca ? `ALVO LOCALIZADO: "${termoBusca}". DELETANDO... 🚀` : `Limpando base de dados de ${tipoExclusao}... 🧹`
            });
        }

        // 4. CONSULTAS (SÓ SE NÃO FOR REGISTRO)
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|mostrar|lista|tenho|extrato|ver|quais)\b/)) && !ehComandoRegistro;
        if (ehPergunta) {
            let tipo = "gastos";
            // QUEM EU DEVO
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|minhas dividas)\b/)) {
                tipo = "minhas_dividas";
            } 
            // QUEM ME DEVE (Ajustado para "quem está me devendo")
            else if (frase.match(/\b(me deve|me devem|devendo|divida|quem deve|quem esta|quem está)\b/)) {
                tipo = "dividas";
            }
            else if (frase.match(/(tarefa|fazer|agenda|compromisso)/)) {
                tipo = "tarefas";
            }
            return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Acessando protocolos de consulta... 📊" });
        }

        // 5. REGISTROS FINANCEIROS
        if (valor) {
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|devo)\b/)) {
                return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Dívida registrada: R$ ${valor.toLocaleString('pt-BR')} para ${descLimpa}. 📝` });
            }
            if (frase.match(/(deve|devendo)/) && !frase.includes("eu")) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: descLimpa, mensagem: `Caderninho atualizado! ${descLimpa} te deve R$ ${valor.toLocaleString('pt-BR')}. ✍️` });
            }
            let tipo = "saida";
            if (frase.match(/(recebi|ganhei|entrou|vendi)/)) tipo = "entrada";
            else if (frase.match(/(guardei|cofre|reserva|poupanca)/)) tipo = "reserva";
            return res.status(200).json({ categoria: "financa", tipo, valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor.toLocaleString('pt-BR')} processado em ${tipo}. 💰` });
        }

        // 6. TAREFAS (DULCE / COMANDO REGISTRAR)
        if (frase.match(/\b(esperando|fazer|ir|lembrar|tarefa)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Tarefa indexada com sucesso: ${descLimpa} ✅` });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Astro Jarvis online. Aguardando comandos, Wallace. 🚀" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "CRITICAL_CORE_ERROR" });
    }
};
