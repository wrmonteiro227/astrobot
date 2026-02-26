module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // Tratamento de Valores (Consolidado: 50.000 = 50000)
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // MATRIZ TEMPORAL ELITE
        let periodoAlvo = "tudo";
        const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        
        meses.forEach((mes, index) => { if (frase.includes(mes)) periodoAlvo = `mes_${index}`; });
        if (frase.match(/\b(ontem|otem)\b/)) periodoAlvo = "ontem";
        else if (frase.match(/\b(hoje|agora)\b/)) periodoAlvo = "hoje";
        else if (frase.match(/\b(esta semana|essa semana)\b/)) periodoAlvo = "semana_atual";
        else if (frase.match(/\b(semana passada)\b/)) periodoAlvo = "semana_passada";
        else if (frase.match(/\b(este mes|esse mes|este mês|esse mês)\b/)) periodoAlvo = "mes_atual";
        else if (frase.match(/\b(mes passado|mês passado)\b/)) periodoAlvo = "mes_passado";

        const ehPergunta = frase.match(/\b(quanto|lista|extrato|ver|total|gastei|recebi|saldo|quem|onde|fui|tenho que ir)\b/);
        
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/\b(ganhei|recebi|entrada|vendi)\b/)) tipo = "entrada";
            else if (frase.match(/\b(me deve|me devem|divida)\b/)) tipo = "dividas";
            else if (frase.match(/\b(eu devo|pagar)\b/)) tipo = "minhas_dividas";
            else if (frase.match(/\b(tarefa|fazer|ir|fui|agenda)\b/)) tipo = "tarefas";
            
            return res.status(200).json({ 
                categoria: "consulta", 
                tipo: tipo, 
                periodo: periodoAlvo,
                mensagem: `Analisando ${tipo} para o período solicitado... 📂` 
            });
        }

        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover)\b/)) {
            let termo = frase.replace(/\b(apagar|apaga|deletar|excluir|remover|gasto|saida|tarefa)\b/g, '').trim();
            return res.status(200).json({ categoria: "exclusao", termo_busca: termo || "tudo", mensagem: `Solicitação de exclusão para o termo: "${termo}".` });
        }

        if (valor !== null) {
            let tipo = frase.match(/(recebi|ganhei|vendi)/) ? "entrada" : "saida";
            if (frase.match(/\b(eu devo|devo|pagar)\b/)) tipo = "minhas_dividas";
            return res.status(200).json({ 
                categoria: "financa", 
                tipo: tipo, 
                valor: valor, 
                descricao_limpa: fraseOriginal.replace(/\d+/g, '').replace(/\b(gastei|paguei|reais|r\$)\b/gi, '').trim() || "Registro",
                mensagem: `Movimentação de R$ ${valor.toLocaleString('pt-BR')} confirmada.` 
            });
        }

        if (frase.match(/\b(fazer|ir|lembrar|tarefa|anota)\b/)) {
            return res.status(200).json({ categoria: "tarefa", descricao_limpa: fraseOriginal, mensagem: "Lembrete indexado com sucesso. ✅" });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Às ordens, Stark. Como posso ajudar?" });
    } catch (e) { return res.status(500).json({ erro: "INTERNAL_ERROR" }); }
};
