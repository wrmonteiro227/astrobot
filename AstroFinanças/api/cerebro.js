module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // Blindagem de Horários vs Dinheiro
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // Identificação de Período (Brasil Timezone Safe)
        let periodoAlvo = "tudo";
        if (frase.match(/\b(ontem|otem)\b/)) periodoAlvo = "ontem";
        else if (frase.match(/\b(hoje|agora|hj)\b/)) periodoAlvo = "hoje";
        else if (frase.match(/\b(mes|mês)\b/)) periodoAlvo = "mes_atual";
        else if (frase.match(/\b(semana)\b/)) periodoAlvo = "semana";

        const ehPergunta = frase.match(/\b(quanto|lista|extrato|ver|total|gastei|recebi|saldo|oque|o que|hj|hoje)\b/);
        
        if (ehPergunta && !valor) {
            let tipo = "gastos";
            if (frase.match(/\b(ganhei|recebi|entrada|vendi)\b/)) tipo = "entrada";
            else if (frase.match(/\b(tarefa|fazer|agenda|ir)\b/)) tipo = "tarefas";
            
            return res.status(200).json({ 
                categoria: "consulta", 
                tipo: tipo, 
                periodo: periodoAlvo,
                mensagem: `Localizando registros de ${periodoAlvo}...` 
            });
        }

        if (valor !== null) {
            return res.status(200).json({ 
                categoria: "financa", 
                tipo: frase.match(/(recebi|ganhei|vendi)/) ? "entrada" : "saida", 
                valor: valor, 
                descricao_limpa: fraseOriginal.replace(/\d+/g, '').replace(/\b(gastei|paguei|reais|r\$)\b/gi, '').trim() || "Gasto",
                mensagem: `R$ ${valor.toLocaleString('pt-BR')} registrado. 💰` 
            });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Não entendi o comando, Tony." });
    } catch (e) { return res.status(500).json({ erro: "ERR" }); }
};
