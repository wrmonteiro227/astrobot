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

        const msgPoupanca = [`Aí sim, parceiro! R$ {valor} guardados no cofre. Estamos mais perto do objetivo! 💰🔒` , `Mais R$ {valor} pra sua reserva. 🚀📈` ] ;
        function sortearMsg(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

        const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
        const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

        let textoBase = texto.toLowerCase()
            .replace(/\b(ol[aá]|oi|bom dia|boa tarde|boa noite|r\$|reais|me|de|da|do|para|com|o|a)\b/g, ' ')
            .replace(/\s+/g, ' ').trim();

        let descLimpa = textoBase.replace(/\b(gastei|comprei|paguei|recebi|ganhei|guardei|poupei|juntei|anotar|registra)\b/g, '')
                                 .replace(/\d+(?:[.,]\d+)?/g, '')
                                 .replace(/\s+/g, ' ').trim();

        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        let resposta = {
            categoria: "conversa", tipo: null, periodo: "tudo", valor: null, termo_busca: null, descricao_limpa: descLimpa,
            mensagem: `Opa, parceiro! Não captei a mensagem. Manda um gasto, ganho, valor que juntou ou um lembrete! 🚀`
        };

        // 1. DÍVIDAS E EXCLUSÃO
        let matchDivida = frase.match(/([a-zãõáéíóúç]+)\s+(?:está\s+)?(?:me\s+)?(?:deve|devendo|pagou)/);
        if (matchDivida) {
            let nomePessoa = matchDivida[1].trim();
            if (frase.includes("pagou")) return res.status(200).json({ categoria: "exclusao", tipo: "financas", termo_busca: nomePessoa, mensagem: `Justo! O ${nomePessoa} honrou o compromisso. 🤝` });
            if (valor) return res.status(200).json({ categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nomePessoa}`, mensagem: `Tá no caderninho! ✍️ ${nomePessoa} te deve R$ ${valor}.` });
        }

        // 2. CONSULTAS (Mudado para periodo: "tudo" por padrão)
        const ehPergunta = frase.includes("?") || frase.match(/\b(quem|quanto|quais|qual|lista|ver|mostrar|tenho|agenda|extrato)\b/);
        if (ehPergunta) {
            resposta.categoria = "consulta";
            // Adicionado "juntei" e "junto" na busca do cofre
            if (frase.match(/\b(guardado|cofre|poupanca|reserva|juntei|junto|guardei)\b/)) {
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

        // 3. REGISTROS (Adicionado "juntei" e "juntar")
        if (frase.match(/\b(guardei|guardar|poupei|cofre|depositei|juntei|juntar|junto)\b/) && valor) {
            return res.status(200).json({ categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgPoupanca, valor) });
        }

        // ... Restante dos registros (entrada/saida/tarefa) permanecem iguais ...
        if (frase.match(/\b(recebi|ganhei|entrou|vendi)\b/) && valor) return res.status(200).json({ categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descLimpa, mensagem: "Boa! Dinheiro no bolso. 💰" });
        if (frase.match(/\b(gastei|comprei|paguei|custou|saiu)\b/) && valor) return res.status(200).json({ categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descLimpa, mensagem: "Anotado! Gasto registrado. 📉" });
        if (frase.match(/\b(tenho que|vou|preciso|lembrar|amanha|domingo|segunda|terca|quarta|quinta|sexta|sabado|fazer|ir)\b/)) return res.status(200).json({ categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descLimpa, mensagem: "Pode deixar, já anotei na agenda! ✅" });

        return res.status(200).json(resposta);
    } catch (erro) { return res.status(500).json({ erro: "Erro interno" }); }
};
