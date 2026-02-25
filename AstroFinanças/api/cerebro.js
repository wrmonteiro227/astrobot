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
        const msgPoupanca = [`Aí sim, parceiro! R$ {valor} guardados no cofre. Estamos mais perto do objetivo! 💰🔒` , `Mais R$ {valor} pra sua reserva. 🚀📈` ] ;

        function sortearMsg(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

        const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
        const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

        // --- NOVA LIMPEZA INTELIGENTE (Preserva Datas e Sujeitos) ---
        let textoBase = texto.toLowerCase()
            .replace(/\b(ol[aá]|oi|bom dia|boa tarde|boa noite|r\$|reais|me|de|da|do|para|com|o|a|um|uma)\b/g, ' ')
            .replace(/\s+/g, ' ').trim();

        // Extração de Descrição (Removendo apenas verbos de comando)
        let descLimpa = textoBase.replace(/\b(gastei|comprei|paguei|recebi|ganhei|guardei|poupei|lembrar|anotar|registra)\b/g, '')
                                 .replace(/\d+(?:[.,]\d+)?/g, '') // Remove números
                                 .replace(/\s+/g, ' ').trim();

        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        let resposta = {
            categoria: "conversa", tipo: null, periodo: null, valor: null, termo_busca: null, descricao_limpa: descLimpa,
            mensagem: `Opa, parceiro! Sobre esse assunto eu não vou conseguir te ajudar agora. Manda aí um gasto, ganho ou lembrete! 🚀`
        };

        // 1. SAUDAÇÕES
        if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite)( astro)?$/i.test(frase)) {
            return res.status(200).json({ categoria: "conversa", mensagem: `E aí, parceiro! O Astro tá na área. O que manda hoje? 🚀` });
        }

        // 2. EXTRAÇÃO DE DÍVIDAS (MELHORADA)
        // Pega quem vem antes de "me deve", "esta devendo" ou "pagou"
        let matchDivida = frase.match(/([a-zãõáéíóúç]+)\s+(?:está\s+)?(?:me\s+)?(?:deve|devendo|pagou)/);
        
        if (matchDivida) {
            let nomePessoa = matchDivida[1].trim();
            
            // Caso: Fulano PAGOU
            if (frase.includes("pagou")) {
                return res.status(200).json({ categoria: "exclusao", tipo: "financas", termo_busca: nomePessoa, mensagem: `Justo! O ${nomePessoa} honrou o compromisso. 🤝` });
            }
            
            // Caso: Fulano DEVE (com valor)
            if (valor) {
                return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nomePessoa}`, mensagem: `Tá no caderninho! ✍️ ${nomePessoa} te deve R$ ${valor}.` });
            }
        }

        // 3. CONSULTAS (PERGUNTAS)
        const ehPergunta = frase.includes("?") || frase.match(/\b(quem|quanto|quais|qual|lista|ver|mostrar|tenho|agenda)\b/);
        if (ehPergunta) {
            resposta.categoria = "consulta";
            if (frase.match(/\b(guardado|cofre|poupanca|reserva)\b/)) {
                resposta.tipo = "reserva"; resposta.mensagem = "Abrindo o cofre pra ver sua construção de riqueza: 🏦👇";
            } else if (frase.match(/\b(deve|devendo|divida|devedor|quem)\b/)) {
                resposta.tipo = "dividas"; resposta.mensagem = "Lista de quem tá no caderninho: 📜👇";
            } else if (frase.match(/\b(tarefa|fazer|agenda|compromisso|lembrete)\b/)) {
                resposta.tipo = "tarefas"; resposta.mensagem = "Buscando na sua agenda de tarefas: 🎯👇";
            } else {
                resposta.tipo = "gastos"; resposta.mensagem = "Resumo financeiro: 📊👇";
            }
            return res.status(200).json(resposta);
        }

        // 4. REGISTROS DE FINANÇAS E TAREFAS
        if (frase.match(/\b(guardei|guardar|poupei|cofre|depositei)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgPoupanca, valor) });
        }

        if (frase.match(/\b(recebi|ganhei|entrou|vendi)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGanhos, valor) });
        }

        if (frase.match(/\b(gastei|comprei|paguei|custou|saiu)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGastos, valor) });
        }

        // TAREFAS (Tudo que não tem valor e indica ação futura)
        if (frase.match(/\b(tenho que|vou|preciso|lembrar|amanha|domingo|segunda|terca|quarta|quinta|sexta|sabado|dia|fazer|ir|igreja|balneario)\b/)) {
            return res.status(200).json({ categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descLimpa, mensagem: sortearMsg(msgTarefas, "") });
        }

        return res.status(200).json(resposta);
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
    }
};
