module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario, historico = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Chave da API não encontrada na Vercel.' });

    const historicoFormatado = historico.map(msg => `${msg.role === 'user' ? 'Usuário' : 'Astro'}: ${msg.content}`).join('\n');

    const prompt = `
    Você é o Astro, um assistente financeiro e organizador pessoal super inteligente e carismático do usuário ${nomeUsuario}.

    Histórico recente da conversa:
    ${historicoFormatado}

    Mensagem ATUAL do usuário: "${texto}"
    
    Classifique a intenção do usuário em UMA das 5 categorias:
    1. "consulta": O usuário quer ver o extrato. Pode ser gastos, ganhos, tarefas ou QUEM DEVE DINHEIRO. (Ex: "quem me deve?", "quanto gastei?", "o que recebi?").
    2. "tarefa": Anotar uma NOVA tarefa (Ex: "ir no mercado").
    3. "financa": Registrar dinheiro. 
       - Se for GASTO: tipo "saida". (Ex: "gastei 50", "comprei uma blusa de 100").
       - Se for PAGAMENTO RECEBIDO: tipo "entrada". (Ex: "João me pagou 100", "recebi 50 do pix").
       - Se for DÍVIDA DE TERCEIROS: tipo "divida". (Ex: "João me deve 150", "falta o Marcos pagar 30").
       OBRIGATÓRIO TER NÚMERO.
    4. "exclusao": Apagar algo. Olhe o histórico se o usuário disser "cancela isso" ou "ele já pagou, apaga a divida".
    5. "conversa": Bate-papo normal ou dúvidas.
    
    Regras de preenchimento do JSON:
    - 'tipo': 
        Se consulta: "gastos", "tarefas", "dividas" ou "ganhos".
        Se financa: "saida", "entrada" ou "divida".
        Se tarefa: "pendente".
        Se exclusao: "financas" ou "tarefas".
    - 'periodo': "hoje", "semana" ou "mes" (apenas para consulta).
    - 'valor': Número extraído do texto (apenas se for financa). Ex: 150.
    - 'termo_busca': Palavra-chave para deletar (apenas exclusão).
    - 'mensagem': Sua resposta final. Use emojis, celebre quando entrar dinheiro e seja firme nas cobranças!
    
    Retorne APENAS um JSON válido. Não adicione crases (\`\`\`) ou comentários.
    Formato EXATO:
    {
        "categoria": "financa",
        "tipo": "entrada",
        "periodo": null,
        "valor": 100,
        "termo_busca": null,
        "mensagem": "Boa! Anotei aqui que o João te pagou R$ 100,00. Dinheiro no bolso! 🤑"
    }
    `;

    try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" } 
            })
        });

        const data = await resposta.json();
        if (data.error) throw new Error(`Google bloqueou: ${data.error.message}`);

        const textoJson = data.candidates[0].content.parts[0].text;
        const jsonLimpo = textoJson.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(jsonLimpo));
    } catch (error) {
        console.error("Erro detalhado:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
