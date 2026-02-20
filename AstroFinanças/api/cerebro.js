module.exports = async function(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Só aceita POST' });
    }

    // Agora o cérebro recebe o histórico da conversa!
    const { texto, nomeUsuario, historico = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não encontrada na Vercel.' });
    }

    // Formata o histórico para a IA ler de forma clara
    const historicoFormatado = historico.map(msg => `${msg.role === 'user' ? 'Usuário' : 'Astro'}: ${msg.content}`).join('\n');

    const prompt = `
    Você é o Astro, um assistente financeiro e organizador pessoal super inteligente, carismático e descolado do usuário ${nomeUsuario}.
    Você fala de forma natural, amigável, usa emojis e dá conselhos ou dicas se o usuário quiser bater papo.

    Histórico recente da conversa para você ter contexto:
    ${historicoFormatado}

    Mensagem ATUAL do usuário: "${texto}"
    
    Com base no histórico e na mensagem atual, classifique a intenção do usuário em UMA das 5 categorias:
    1. "consulta": O usuário quer ver dados, extrato ou tarefas. (Ex: "quanto gastei?", "o que tenho pra fazer?").
    2. "tarefa": Anotar uma NOVA tarefa. (Ex: "vou para a igreja").
    3. "financa": Registrar um GASTO ou GANHO. Tem que ter um NÚMERO no contexto. (Ex: "gastei 50 reais").
    4. "exclusao": Apagar algo. Precisa de uma palavra-chave. IMPORTANTE: Se o usuário disser "cancela isso", "apaga a última", olhe o HISTÓRICO acima para descobrir qual foi a última tarefa ou gasto e extraia a palavra-chave principal para colocar em 'termo_busca'.
    5. "conversa": Bate-papo normal, dúvidas financeiras, conselhos, ou saudações. Seja super prestativo, humano e dê respostas completas!
    
    Regras de preenchimento do JSON:
    - 'tipo': consulta ("gastos" ou "tarefas"), financa ("saida" ou "entrada"), tarefa ("pendente"), exclusao ("financas" ou "tarefas").
    - 'periodo': "hoje", "semana" ou "mes" (apenas para consulta).
    - 'valor': Número do gasto/ganho (apenas para financa).
    - 'termo_busca': A palavra-chave EXATA para deletar no banco de dados (exclusão).
    - 'mensagem': Sua resposta final. Seja carismático, útil e aja como um parceiro do dia a dia.
    
    Retorne APENAS um JSON válido. Não adicione crases (\`\`\`) ou comentários.
    Formato EXATO:
    {
        "categoria": "conversa",
        "tipo": null,
        "periodo": null,
        "valor": null,
        "termo_busca": null,
        "mensagem": "Sua resposta com muita personalidade aqui!"
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
        
        if (data.error) {
            throw new Error(`Google bloqueou: ${data.error.message}`);
        }

        const textoJson = data.candidates[0].content.parts[0].text;
        const jsonLimpo = textoJson.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return res.status(200).json(JSON.parse(jsonLimpo));
    } catch (error) {
        console.error("Erro detalhado:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
