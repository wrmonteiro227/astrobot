module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // 1. TRATAMENTO DE VALORES (Consolidado: 50.000 = 50000)
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. MATRIZ TEMPORAL (Inteligência de Pretérito, Presente e Futuro)
        let tempo = { alvo: "atual", contexto: "presente" };
        
        // Meses específicos
        const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        meses.forEach((mes, index) => {
            if (frase.includes(mes)) tempo = { alvo: index, contexto: "mes_especifico" };
        });

        // Relativos
        if (frase.match(/\b(ontem|otem)\b/)) tempo = { alvo: "ontem", contexto: "passado" };
        else if (frase.match(/\b(hoje|agora)\b/)) tempo = { alvo: "hoje", contexto: "presente" };
        else if (frase.match(/\b(amanha|amanhã)\b/)) tempo = { alvo: "amanha", contexto: "futuro" };
        else if (frase.match(/\b(esta semana|essa semana)\b/)) tempo = { alvo: "semana_atual", contexto: "presente" };
        else if (frase.match(/\b(semana passada)\b/)) tempo = { alvo: "semana_passada", contexto: "passado" };
        else if (frase.match(/\b(este mes|esse mes|este mês|esse mês)\b/)) tempo = { alvo: "mes_atual", contexto: "presente" };
        else if (frase.match(/\b(mes passado|mês passado)\b/)) tempo = { alvo: "mes_passado", contexto: "passado" };

        // 3. CONSULTAS PROFISSIONAIS
        const ehPergunta = frase.match(/\b(quanto|lista|extrato|ver|total|gastei|recebi|saldo|quem|onde|para onde|fui|tenho que ir)\b/);
        if (ehPergunta) {
            let tipo = "gastos";
            if (frase.match(/\b(ganhei|recebi|entrada|vendi)\b/)) tipo = "entrada";
            if (frase.match(/\b(deve|devem|me deve)\b/)) tipo = "dividas";
            if (frase.match(/\b(devo|tenho que pagar)\b/)) tipo = "minhas_dividas";
            if (frase.match(/\b(tarefa|fazer|ir|fui|compromisso)\b/)) tipo = "tarefas";
            
            return res.status(200).json({ 
                categoria: "consulta", 
                tipo: tipo, 
                periodo: tempo,
                mensagem: `Relatório de ${tipo} solicitado (${frase.includes('fui') ? 'Histórico' : 'Agenda'}). 📂` 
            });
        }

        // 4. EXCLUSÃO SNIPER (Blindada)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover)\b/)) {
            let termo = frase.replace(/\b(apagar|apaga|deletar|excluir|remover|gasto|saida|tarefa|o|a|os|as)\b/g, '').trim();
            return res.status(200).json({ 
                categoria: "exclusao", 
                termo_busca: termo || "tudo", 
                mensagem: `Sniper ativado. Alvo: "${termo}". 🎯` 
            });
        }

        // 5. REGISTROS FINANCEIROS (Presente/Passado)
        if (valor !== null) {
            let desc = fraseOriginal.replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '').replace(/\b(gastei|paguei|reais|r\$|recebi|ganhei)\b/gi, '').trim();
            return res.status(200).json({ 
                categoria: "financa", 
                tipo: frase.match(/(recebi|ganhei|vendi)/) ? "entrada" : "saida", 
                valor: valor, 
                descricao_limpa: desc || "Gasto",
                tempo: tempo,
                mensagem: `R$ ${valor.toLocaleString('pt-BR')} registrado com sucesso. 💰` 
            });
        }

        // 6. TAREFAS / AGENDA (Futuro/Presente)
        if (frase.match(/\b(fazer|ir|lembrar|tarefa|anota|marcar)\b/)) {
            return res.status(200).json({ 
                categoria: "tarefa", 
                descricao_limpa: fraseOriginal, 
                tempo: tempo,
                mensagem: "Lembrete indexado com sucesso. ✅" 
            });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Às suas ordens, Tony Stark. Como posso ajudar?" });
    } catch (e) { return res.status(500).json({ erro: "INTERNAL_CORE_ERROR" }); }
};
