module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // Extração de Valor com Blindagem de Horários
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // Matriz Temporal
        let periodoAlvo = "hoje"; // Default para evitar "nada encontrado" vazio
        if (frase.match(/\b(ontem|otem)\b/)) periodoAlvo = "ontem";
        else if (frase.match(/\b(mes|mês)\b/)) periodoAlvo = "mes_atual";
        else if (frase.match(/\b(semana)\b/)) periodoAlvo = "semana";
        else if (frase.match(/\b(tudo|geral|sempre)\b/)) periodoAlvo = "tudo";

        const ehConsulta = frase.match(/\b(quanto|lista|extrato|ver|total|gastei|recebi|saldo|oque|o que|hj|hoje)\b/);
        
        // Resposta de Consulta
        if (ehConsulta && !valor) {
            let tipoC = "saida"; // Se perguntar "quanto gastei", busca saídas
            if (frase.match(/\b(ganhei|recebi|entrada|vendi)\b/)) tipoC = "entrada";
            else if (frase.match(/\b(tarefa|fazer|ir|fui|agenda)\b/)) tipoC = "tarefas";
            
            return res.status(200).json({ 
                categoria: "consulta", 
                tipo: tipoC, 
                periodo: periodoAlvo,
                mensagem: `Buscando registros de ${periodoAlvo}...` 
            });
        }

        // Registro Financeiro
        if (valor !== null) {
            let tipoF = frase.match(/(recebi|ganhei|vendi)/) ? "entrada" : "saida";
            let dLimpa = fraseOriginal.replace(/\d+/g, '').replace(/\b(gastei|paguei|reais|r\$|recebi|vendi)\b/gi, '').trim() || "Registro";
            return res.status(200).json({ 
                categoria: "financa", 
                tipo: tipoF, 
                valor: valor, 
                descricao_limpa: dLimpa,
                mensagem: `R$ ${valor.toLocaleString('pt-BR')} anotado como ${tipoF}. 💰` 
            });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Às ordens, Stark. Como posso ajudar?" });
    } catch (e) { return res.status(500).json({ erro: "ERR" }); }
};
