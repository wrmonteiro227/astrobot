module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const fraseOriginal = texto ? texto.trim() : "";
        let frase = fraseOriginal.toLowerCase();

        // 1. TRATAMENTO DE VALORES (Consolidado: 50.000 = 50000 | Blindagem de Horas)
        function extrairValor(str) {
            if (str.match(/\d+\s?(h|hs|hora|horas)\b/)) return null;
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // 2. MATRIZ TEMPORAL (Hj, Ontem, Meses)
        let periodoAlvo = "tudo";
        const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
        meses.forEach((mes, index) => { if (frase.includes(mes)) periodoAlvo = `mes_${index}`; });
        
        if (frase.match(/\b(ontem|otem)\b/)) periodoAlvo = "ontem";
        else if (frase.match(/\b(hoje|agora|hj)\b/)) periodoAlvo = "hoje";
        else if (frase.match(/\b(esta semana|essa semana)\b/)) periodoAlvo = "semana";
        else if (frase.match(/\b(este mes|esse mes|este mês|esse mês)\b/)) periodoAlvo = "mes_atual";
        else if (frase.match(/\b(mes passado|mês passado)\b/)) periodoAlvo = "mes_passado";

        // 3. IDENTIFICAÇÃO DE COMANDO
        const ehConsulta = frase.match(/\b(quanto|lista|extrato|ver|total|gastei|recebi|saldo|oque|o que|hj|hoje)\b/);
        const ehExclusao = frase.match(/\b(apagar|apaga|deletar|excluir|remover)\b/);

        // 4. LÓGICA DE EXCLUSÃO SNIPER
        if (ehExclusao) {
            let tipoEx = "financas";
            if (frase.match(/(tarefa|fazer)/)) tipoEx = "tarefas";
            let termo = frase.replace(/\b(apagar|apaga|deletar|excluir|remover|gasto|saida|tarefa|o|a|os|as)\b/g, '').trim();
            return res.status(200).json({ categoria: "exclusao", tipo: tipoEx, termo_busca: termo || "tudo", mensagem: `Protocolo Sniper: Alvo "${termo}" localizado.` });
        }

        // 5. LÓGICA DE CONSULTA
        if (ehConsulta && !valor) {
            let tipoC = "gastos";
            if (frase.match(/\b(ganhei|recebi|entrada|vendi)\b/)) tipoC = "entrada";
            else if (frase.match(/\b(me deve|me devem|divida)\b/)) tipoC = "dividas";
            else if (frase.match(/\b(eu devo|pagar|devo)\b/)) tipoC = "minhas_dividas";
            else if (frase.match(/\b(tarefa|fazer|ir|fui|agenda)\b/)) tipoC = "tarefas";
            
            return res.status(200).json({ categoria: "consulta", tipo: tipoC, periodo: periodoAlvo, mensagem: `Analisando registros de ${periodoAlvo.replace('_', ' ')}...` });
        }

        // 6. REGISTRO FINANCEIRO
        if (valor !== null) {
            let tipoF = frase.match(/(recebi|ganhei|vendi)/) ? "entrada" : "saida";
            if (frase.match(/\b(eu devo|devo|pagar)\b/)) tipoF = "minhas_dividas";
            let dLimpa = fraseOriginal.replace(/\d+/g, '').replace(/\b(gastei|paguei|reais|r\$)\b/gi, '').trim() || "Gasto";
            return res.status(200).json({ categoria: "financa", tipo: tipoF, valor: valor, descricao_limpa: dLimpa, mensagem: `R$ ${valor.toLocaleString('pt-BR')} registrado no sistema. 💰` });
        }

        // 7. TAREFAS
        if (frase.match(/\b(fazer|ir|lembrar|tarefa|anota|marcar)\b/)) {
            return res.status(200).json({ categoria: "tarefa", descricao_limpa: fraseOriginal, mensagem: "Lembrete indexado com sucesso. ✅" });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Às ordens, Tony Stark. Como posso ajudar?" });

    } catch (e) {
        return res.status(500).json({ erro: "INTERNAL_ERROR" });
    }
};
