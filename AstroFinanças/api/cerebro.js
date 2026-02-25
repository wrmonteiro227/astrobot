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

        // --- 🎯 REGRA DE OURO PARA VALORES (50.000 agora é 50000) ---
        function extrairValor(str) {
            const match = str.match(/\d+(?:\.\d{3})*(?:,\d+)?/); // Pega 50.000,00 ou 50000
            if (!match) return null;
            let num = match[0].replace(/\./g, ''); // Remove ponto de milhar
            num = num.replace(',', '.'); // Troca vírgula por ponto decimal
            return parseFloat(num);
        }
        const valor = extrairValor(frase);

        // --- 🎯 REGRA DE OURO PARA DESCRIÇÃO (VT Lixeiro / Alana Gorda) ---
        // Agora ele remove apenas palavras de comando, mantendo os nomes próprios
        function limparDescricao(str) {
            return str
                .replace(/\b(registre|anote|salve|anotar|registra|lembrar|preciso|paguei|recebi|gastei|deve|devendo|tem que|me deve|eu devo|estou devendo|reais|r\$)\b/gi, '')
                .replace(/\d+(?:\.\d{3})*(?:,\d+)?/g, '') // Remove o valor da descrição
                .replace(/\s+/g, ' ').trim();
        }
        let descLimpa = limparDescricao(texto); // Usa o texto original (com maiúsculas) para preservar nomes
        descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

        const msgGastos = [`Anotado! R$ {valor} indo embora. 💸`, `Gasto de R$ {valor} registrado. 📉`];
        const msgGanhos = [`Boa! R$ {valor} na conta. 🤑`, `Dinheiro no bolso! Mais R$ {valor}. 💰`];
        const msgTarefas = [`Missão dada é missão cumprida! Anotei: {desc} 🫡`, `Pode deixar, já anotei na sua agenda! ✅`];

        function sortearMsg(array, v, d = "") { 
            return array[Math.floor(Math.random() * array.length)]
                .replace('{valor}', v ? v.toLocaleString('pt-BR') : "")
                .replace('{desc}', d); 
        }

        // 1. SAUDAÇÕES
        if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite)( astro)?$/i.test(frase)) {
            return res.status(200).json({ categoria: "conversa", mensagem: `E aí, ${nomeUsuario || 'parceiro'}! O Astro tá na área. O que manda hoje? 🚀` });
        }

        // 2. EXCLUSÕES (PAGAMENTOS)
        if (frase.includes("me pagou") || frase.includes("quitou")) {
            let nome = frase.replace(/\b(me pagou|quitou|o|a)\b/g, '').trim();
            return res.status(200).json({ categoria: "exclusao", tipo: "financas", termo_busca: nome, mensagem: `Justo! O ${nome} honrou o compromisso. 🤝` });
        }

        // 3. DÍVIDAS (QUEM TE DEVE) - PRIORIDADE
        if (frase.match(/(deve|devendo|pagar)/) && !frase.includes("eu") && valor) {
            return res.status(200).json({ 
                categoria: "financa", tipo: "divida", valor: valor, 
                descricao_limpa: descLimpa, 
                mensagem: `Tá no caderninho! ✍️ ${descLimpa} te deve R$ ${valor.toLocaleString('pt-BR')}.` 
            });
        }

        // 4. CONSULTAS (PERGUNTAS)
        const ehPergunta = frase.includes("?") || frase.match(/\b(quem|quanto|quando|quais|qual|lista|ver|mostrar|tenho|extrato|o que)\b/);
        const ehComandoRegistro = frase.match(/\b(registre|anote|salve|anotar)\b/);

        if (ehPergunta && !ehComandoRegistro) {
            let resposta = { categoria: "consulta", tipo: "gastos", mensagem: "Resumo financeiro: 📊👇" };
            if (frase.match(/(devo|minhas dividas|pagar)/)) { resposta.tipo = "minhas_dividas"; resposta.mensagem = "Suas contas a pagar: 💸👇"; }
            else if (frase.match(/(me deve|me devem|dividas)/)) { resposta.tipo = "dividas"; resposta.mensagem = "Lista de quem tá no caderninho: 📜👇"; }
            else if (frase.match(/(recebi|ganhos|entradas)/)) { resposta.tipo = "entrada"; resposta.mensagem = "Suas entradas: 📈👇"; }
            else if (frase.match(/(tarefa|fazer|agenda)/)) { resposta.tipo = "tarefas"; resposta.mensagem = "Sua agenda: 🎯👇"; }
            return res.status(200).json(resposta);
        }

        // 5. REGISTROS (AQUI É ONDE SALVA A DULCE E O LIXEIRO)
        if (valor) {
            if (frase.match(/(guardei|poupanca|cofre)/)) 
                return res.status(200).json({ categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGanhos, valor) });
            
            if (frase.match(/(recebi|ganhei|entrou|vendi)/))
                return res.status(200).json({ categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGanhos, valor) });

            return res.status(200).json({ categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgGastos, valor) });
        }

        // 6. TAREFAS (CASO DULCE)
        if (frase.match(/\b(esperando|ir|fazer|comprar|lembrar|anote|registre|tarefa)\b/) || ehComandoRegistro) {
            return res.status(200).json({ 
                categoria: "tarefa", tipo: "pendente", 
                descricao_limpa: descLimpa, 
                mensagem: sortearMsg(msgTarefas, null, descLimpa) 
            });
        }

        return res.status(200).json({ categoria: "conversa", mensagem: "Não entendi bem, parceiro. Quer registrar um gasto, uma dívida ou uma tarefa? 🚀" });
        
    } catch (erro) {
        return res.status(500).json({ erro: "Erro interno", detalhes: erro.message });
    }
};
