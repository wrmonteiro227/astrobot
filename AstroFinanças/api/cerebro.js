module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        // 1. TRATAMENTO DE VALORES (Garante que 50.000 some como 50000)
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. LIMPEZA DE DESCRIÇÃO (Preserva VT Lixeiro, Alana Gorda, etc)
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        // 3. DEFINIÇÃO DE COMANDO VS PERGUNTA
        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|mostrar|lista|tenho|extrato|ver)\b/)) && !ehComandoRegistro;

        // --- INÍCIO DO PROCESSAMENTO ---

        // A. EXCLUSÕES (ME PAGOU / QUITOU) - Prioridade Máxima
        if (frase.includes("me pagou") || frase.includes("quitou")) {
            let nomeParaBusca = frase.replace(/\b(me pagou|quitou|o|a|pago)\b/g, '').trim();
            if (!nomeParaBusca) nomeParaBusca = descLimpa;
            return res.status(200).json({ categoria: "exclusao", tipo: "financas", termo_busca: nomeParaBusca, mensagem: `Entendido! Baixando os registros de "${nomeParaBusca}". 🤝` });
        }

        // B. CONSULTAS (SÓ ENTRA SE NÃO FOR COMANDO DE SALVAR)
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/(eu devo|minhas dividas|devo pagar)/)) tipo = "minhas_dividas";
            else if (frase.match(/(quem me deve|me devem|dividas)/)) tipo = "dividas";
            else if (frase.match(/(tarefa|fazer|agenda)/)) tipo = "tarefas";
            return res.status(200).json({ categoria: "consulta", tipo, mensagem: "Acessando banco de dados... 📊" });
        }

        // C. REGISTROS FINANCEIROS
        if (valor) {
            // Se eu devo para alguém
            if (frase.match(/\b(eu devo|estou devendo|tenho que pagar|devo)\b/)) {
                return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Anotado, Wallace. Você deve R$ ${valor.toLocaleString('pt-BR')} (${descLimpa}). 📝💸` });
            }
            // Se alguém me deve
            if (frase.match(/(deve|devendo)/) && !frase.includes("eu")) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: descLimpa, mensagem: `Tá no caderninho! ${descLimpa} te deve R$ ${valor.toLocaleString('pt-BR')}. ✍️` });
            }
            // Entradas, Cofre e Saídas comuns
            let tipo = "saida";
            if (frase.match(/(recebi|ganhei|entrou)/)) tipo = "entrada";
            else if (frase.match(/(guardei|cofre|reserva|poupanca)/)) tipo = "reserva";
            
            return res.status(200).json({ categoria: "financa", tipo, valor, descricao_limpa: descLimpa, mensagem: `Registro de R$ ${valor.toLocaleString('pt-BR')} realizado. 💰` });
        }

        // D. TAREFAS (CASO DULCE)
        if (frase.match(/\b(esperando|fazer|ir|lembrar|tarefa)\b/) || ehComandoRegistro) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Tarefa indexada: ${descLimpa} ✅` });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Astro online. No que posso ajudar? 🚀" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro no core" });
    }
};
