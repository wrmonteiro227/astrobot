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

        const msgGastos = [`Anotado! R$ {valor} indo embora. 💸`, `Gasto de R$ {valor} registrado. 📉`];
        const msgGanhos = [`Boa! R$ {valor} na conta. 🤑`, `Dinheiro no bolso! Mais R$ {valor}. 💰`];
        const msgTarefas = [`Irei registrar isso no seu histórico! Missão dada é missão cumprida. 🫡`, `Pode deixar, já anotei na sua agenda! ✅`];
        const msgPoupanca = [`Aí sim, parceiro! R$ {valor} guardados no cofre. Estamos mais perto do objetivo! 💰🔒` , `Mais R$ {valor} pra sua reserva. 🚀📈`];

        function sortearMsg(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

        const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
        const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

        let textoBase = texto.toLowerCase()
            .replace(/\b(ol[aá]|oi|bom dia|boa tarde|boa noite|r\$|reais|me|de|da|do|para|com|o|a|um|uma|esse|essa|mes|semana)\b/g, ' ')
            .replace(/\s+/g, ' ').trim();

        // Limpeza de verbos (para o banco de dados ficar com texto limpo)
        let descLimpa = textoBase.replace(/\b(gastei|comprei|paguei|recebi|ganhei|guardei|poupei|juntei|juntar|anotar|registra|lembrar|preciso|precisei|precisa|gastar|devendo|devo|estoou|estou|apagar|quitar|quitei)\b/g, '')
                                 .replace(/\d+(?:[.,]\d+)?/g, '')
                                 .replace(/\s+/g, ' ').trim();

        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        let resposta = {
            categoria: "conversa", tipo: null, periodo: "tudo", valor: null, termo_busca: null, descricao_limpa: descLimpa,
            mensagem: `Opa, parceiro! Não captei a mensagem. Manda um gasto, ganho, valor que juntou ou um lembrete! 🚀`
        };

        // 1. SAUDAÇÕES
        if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite)( astro)?$/i.test(frase)) {
            return res.status(200).json({ categoria: "conversa", mensagem: `E aí, parceiro! O Astro tá na área. O que manda hoje? 🚀` });
        }

        // 2. EXCLUSÃO RÁPIDA VIA TEXTO
        let matchMePagou = frase.match(/([a-zãõáéíóúç]+)\s+(?:me\s+)?(?:pagou|quitou)/);
        if (matchMePagou && !frase.includes("eu")) {
            let nome = matchMePagou[1].trim();
            return res.status(200).json({ categoria: "exclusao", tipo: "financas", termo_busca: nome, mensagem: `Justo! O ${nome} honrou o compromisso. 🤝` });
        }

        let matchEuPaguei = frase.match(/\b(paguei|quitei|apagar)\s+(?:a\s+|o\s+|divida\s+(?:de\s+|do\s+|da\s+)?)?([a-zãõáéíóúç\s]+)/);
        if (matchEuPaguei && !valor) { 
            let termo = matchEuPaguei[2].trim();
            return res.status(200).json({ categoria: "exclusao", tipo: "minhas_dividas", termo_busca: termo, mensagem: `Boa! Dívida/Conta de "${termo}" baixada com sucesso. Menos um peso! 💸` });
        }

        // 3. DÍVIDAS DOS OUTROS (Eles me devem)
        let matchDivida = frase.match(/([a-zãõáéíóúç]+)\s+(?:está\s+)?(?:me\s+)?(?:deve|devendo|precisa me pagar|tem que me pagar)/);
        if (matchDivida && !frase.match(/\b(eu devo|estou devendo|estoou devendo|devo|o que|quem estou|para quem|quanto estou|quanto eu)\b/)) {
            let nomePessoa = matchDivida[1].trim();
            if (valor) return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nomePessoa}`, mensagem: `Tá no caderninho! ✍️ ${nomePessoa} te deve R$ ${valor}.` });
        }

        // 4. MINHAS DÍVIDAS / CONTAS A PAGAR (Eu devo)
        if (frase.match(/\b(estou devendo|estoou devendo|eu devo|devo|tenho que pagar|preciso pagar|fiquei devendo)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "minhas_dividas", valor: valor, descricao_limpa: descLimpa, mensagem: `Tá anotado! Você tem uma conta a pagar de R$ ${valor} (${descLimpa}). Não vai esquecer! 📝💸` });
        }

        // 5. CONSULTAS (Agora com a regra de ENTRADAS/RECEBIMENTOS)
        const ehPergunta = frase.includes("?") || frase.match(/\b(quem|quanto|quando|quais|qual|lista|ver|mostrar|tenho|agenda|extrato|o que)\b/);
        if (ehPergunta) {
            resposta.categoria = "consulta";
            
            if (frase.match(/\b(eu devo|tenho que pagar|minhas dividas|contas a pagar|devo|estou devendo|o que estou devendo|quem estou devendo|para quem estou devendo|quanto estou devendo|quanto eu devo|quando devo|quando estou devendo)\b/)) {
                resposta.tipo = "minhas_dividas"; resposta.mensagem = "Suas contas a pagar (Suas Dívidas): 💸👇";
            
            } else if (frase.match(/\b(guardado|cofre|poupanca|reserva|juntei|junto|guardei)\b/)) {
                resposta.tipo = "reserva"; resposta.mensagem = "Abrindo o cofre pra ver sua construção de riqueza: 🏦👇";
            
            } else if (frase.match(/\b(deve|devem|devendo|divida|dividas|devedor|quem me|me devem)\b/)) {
                resposta.tipo = "dividas"; resposta.mensagem = "Lista de quem tá no caderninho (A receber): 📜👇";
            
            // 👇 A MÁGICA NOVA AQUI 👇
            } else if (frase.match(/\b(recebi|ganhei|ganho|ganhos|entrou|entrada|entradas|vendi)\b/)) {
                resposta.tipo = "entrada"; resposta.mensagem = "Suas entradas e ganhos: 📈👇";
            
            } else if (frase.match(/\b(tarefa|fazer|agenda|compromisso|lembrete)\b/)) {
                resposta.tipo = "tarefas"; resposta.mensagem = "Buscando na sua agenda de tarefas: 🎯👇";
            
            } else {
                resposta.tipo = "gastos"; resposta.mensagem = "Resumo financeiro: 📊👇";
            }
            return res.status(200).json(resposta);
        }

        // 6. REGISTROS PADRÃO
        if (frase.match(/\b(guardei|guardar|poupei|cofre|depositei|juntei|juntar|junto)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgPoupanca, valor) });
        }
        if (frase.match(/\b(recebi|ganhei|entrou|vendi)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGanhos, valor) });
        }
        if (frase.match(/\b(gastei|comprei|paguei|custou|saiu|gastar)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGastos, valor) });
        }

        // 7. TAREFAS
        if (frase.match(/\b(tenho que|vou|preciso|lembrar|amanha|domingo|segunda|terca|quarta|quinta|sexta|sabado|dia|fazer|ir|igreja|balneario)\b/)) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descLimpa, mensagem: sortearMsg(msgTarefas, "") });
        }

        return res.status(200).json(resposta);
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
    }
};
