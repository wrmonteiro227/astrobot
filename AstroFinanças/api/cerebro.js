module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        if (!frase) return res.status(200).json({ categoria: "conversa", mensagem: "Fala, chefe! Tô na escuta." });

        // --- 🎯 TRATAMENTO DE VALORES (Milhar e Decimal) ---
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // --- 🎯 LIMPEZA CIRÚRGICA (Não corta nomes como VT ou Alana) ---
        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        // --- 🎯 TRAVAS DE LOGICA ---
        const ehComandoRegistro = frase.match(/\b(registrar|anote|salve|anotar|registra)\b/);
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quais|qual|lista|ver|mostrar|tenho|extrato|o que)\b/)) && !ehComandoRegistro;

        // 1. SAUDAÇÕES
        if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite)( astro)?$/i.test(frase)) {
            return res.status(200).json({ categoria: "conversa", mensagem: `E aí, ${nomeUsuario || 'parceiro'}! O que manda hoje? 🚀` });
        }

        // 2. CONSULTAS (Só entra se NÃO for comando de registro)
        if (ehPergunta) {
            let resp = { categoria: "consulta", tipo: "gastos", mensagem: "Resumo financeiro: 📊👇" };
            if (frase.match(/(devo|pagar|dividas)/) && frase.includes("eu")) resp.tipo = "minhas_dividas";
            else if (frase.match(/(deve|devendo|me devem)/)) resp.tipo = "dividas";
            else if (frase.match(/(recebi|ganhos|entrada)/)) resp.tipo = "entrada";
            else if (frase.match(/(tarefa|fazer|agenda)/)) resp.tipo = "tarefas";
            else if (frase.match(/(cofre|guardado|poupanca)/)) resp.tipo = "reserva";
            return res.status(200).json(resp);
        }

        // 3. REGISTROS FINANCEIROS
        if (valor) {
            let tipo = "saida";
            let msg = `Anotado! R$ ${valor.toLocaleString('pt-BR')} registrado. 📉`;
            
            if (frase.match(/(recebi|ganhei|entrou|vendi)/)) {
                tipo = "entrada";
                msg = `Dinheiro no bolso! Mais R$ ${valor.toLocaleString('pt-BR')}. 💰`;
            } else if (frase.match(/(guardei|poupanca|cofre|reserva)/)) {
                tipo = "reserva";
                msg = `Aí sim! R$ ${valor.toLocaleString('pt-BR')} guardados no cofre. 💰🔒`;
            } else if (frase.match(/(deve|devendo)/) && !frase.includes("eu")) {
                tipo = "divida";
                msg = `Tá no caderninho! ${descLimpa} te deve R$ ${valor.toLocaleString('pt-BR')}. ✍️`;
            } else if (frase.includes("eu devo") || frase.includes("estou devendo")) {
                tipo = "minhas_dividas";
                msg = `Anotado. Você deve R$ ${valor.toLocaleString('pt-BR')} (${descLimpa}). 📝`;
            }

            return res.status(200).json({ categoria: "financa", tipo, valor, descricao_limpa: descLimpa, mensagem: msg });
        }

        // 4. TAREFAS (CASO DULCE)
        if (frase.match(/\b(esperando|ir|fazer|comprar|lembrar|tarefa)\b/) || ehComandoRegistro) {
            return res.status(200).json({ 
                categoria: "tarefa", tipo: "pendente", 
                descricao_limpa: descLimpa, 
                mensagem: `Pode deixar, já anotei na sua agenda: ${descLimpa} ✅` 
            });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Não entendi, chefe. Quer registrar algo ou ver seu extrato? 🚀" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
    }
};
