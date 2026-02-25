module.exports = async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    try {
        const { texto, nomeUsuario } = req.body;
        const frase = texto ? texto.toLowerCase().trim() : "";

        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/);
            if (!match) return null;
            let num = match[0].replace(/\./g, '').replace(',', '.');
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        let descLimpa = texto
            .replace(/\b(registrar|anote|salve|anotar|registra|lembrar|paguei|recebi|gastei|reais|r\$|me pagou|quitou|me deve|eu devo|estou devendo|apagar|deletar|excluir|remover|tenho que|tenho que pagar|tenho que gastar|fazer o pagamento|conclui|pago|meta|limite|já|ja|conta|da|do|de)\b/gi, '')
            .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\s+/g, ' ').trim();
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        // 1. EXCLUSÃO (Prioridade)
        if (frase.match(/\b(apagar|apaga|deletar|excluir|remover)\b/)) {
            let tipoEx = frase.match(/(tarefa|fazer)/) ? "tarefas" : (frase.match(/(cofre|reserva|juntei|guardei)/) ? "reserva" : "financas");
            return res.status(200).json({ categoria: "exclusao", tipo: tipoEx, termo_busca: valor ? valor.toString() : descLimpa, mensagem: `Solicitando exclusão de: "${valor || descLimpa}".` });
        }

        // 2. STATUS (UPDATE) - Sem valor
        if (frase.match(/\b(paguei|quitei|conclui|concluido|pago)\b/) && !valor && !frase.match(/\b(quanto|lista|ver)\b/)) {
            let tipoUp = frase.match(/(tarefa|fazer)/) ? "tarefas" : "financas";
            // Envia apenas o primeiro nome/termo para facilitar o match no banco
            let termoSniper = descLimpa.split(' ')[0]; 
            return res.status(200).json({ categoria: "update", tipo: tipoUp, termo_busca: termoSniper, mensagem: `Vou marcar os registros de "${termoSniper}" como concluídos.` });
        }

        // 3. CONSULTAS
        const ehPergunta = (frase.includes("?") || frase.match(/\b(quem|quanto|quando|quand|mostrar|lista|tenho|extrato|ver|saldo|total)\b/));
        if (ehPergunta) {
            let p = "tudo";
            if (frase.match(/\b(hoje|agora)\b/)) p = "hoje";
            else if (frase.match(/\b(ontem|otem)\b/)) p = "ontem";
            let t = "gastos";
            if (frase.match(/\b(juntei|guardei|reserva|cofre|economizei)\b/)) t = "reserva";
            else if (frase.match(/\b(recebi|ganhei|entrada|vendi)\b/)) t = "entrada";
            else if (frase.match(/\b(eu devo|estou devendo|devo)\b/)) t = "minhas_dividas";
            else if (frase.match(/\b(me deve|me devem|divida)\b/)) t = "dividas";
            else if (frase.match(/\b(tarefa|fazer|agenda|ir|para onde)\b/)) t = "tarefas";
            return res.status(200).json({ categoria: "consulta", tipo: t, periodo: p, mensagem: `Relatório (${p}):` });
        }

        if (frase.match(/\b(meta|limite|objetivo)\b/) && valor) {
            return res.status(200).json({ categoria: "meta", tipo: frase.match(/(guardar|economizar|juntar|cofre)/) ? "reserva" : "saida", valor, descricao: descLimpa, mensagem: `Meta de R$ ${valor.toLocaleString('pt-BR')} registrada.` });
        }

        if (valor) {
            let t = "saida";
            if (frase.match(/\b(eu devo|estou devendo|devo)\b/)) t = "minhas_dividas";
            else if (frase.match(/(me deve|devendo)/)) t = "divida";
            else if (frase.match(/(guardei|cofre|reserva|juntei|economizei)/)) t = "reserva";
            else if (frase.match(/(recebi|ganhei|entrou|vendi)/)) t = "entrada";
            return res.status(200).json({ categoria: "financa", tipo: t, valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor.toLocaleString('pt-BR')} registrado.` });
        }

        if (frase.match(/\b(fazer|ir|lembrar|tarefa|tenho que)\b/)) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Lembrete indexado.` });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Não entendi o comando, Tony." });
    } catch (e) { return res.status(500).json({ erro: "ERR" }); }
};
