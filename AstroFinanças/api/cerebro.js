export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Chave da API não encontrada.' });

    const prompt = `
    Você é o Astro, o assistente financeiro e organizador pessoal do usuário ${nomeUsuario}.
    Mensagem do usuário: "${texto}"
    
    Classifique a mensagem em UMA das 5 categorias:
    1. "consulta": Perguntar o que tem para fazer, resumo, extrato (Ex: "o que tenho pra hoje?").
    2. "tarefa": Anotar algo novo para fazer (Ex: "vou para a igreja").
    3. "financa": Gastos, pagamentos ou recebimentos (Ex: "gastei 50 conto").
    4. "exclusao": Pedir para apagar, remover ou excluir uma tarefa ou gasto específico (Ex: "apagar tarefa da igreja"). ATENÇÃO: Você só consegue apagar por PALAVRA-CHAVE. Se o usuário falar "apagar a 1", "apagar a ultima", devolva a categoria "conversa" e peça gentilmente: "Por favor, me diga uma palavra da tarefa que você quer apagar (ex: apagar igreja)".
    5. "conversa": Bate-papo inútil ou saudações.
    
    Retorne APENAS um JSON válido.
    Formato:
    {
        "categoria": "consulta", // ou financa, tarefa, exclusao, conversa
        "tipo": "tarefas", // se for exclusao: "tarefas" ou "financas".
        "periodo": "semana", // ou null
        "valor": null, // ou numero
        "termo_busca": "igreja", // OBRIGATÓRIO se for exclusao (apenas a palavra-chave principal). Senão, null.
        "mensagem": "Sua resposta curta e amigável aqui."
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
        if (data.error) throw new Error(data.error.message);

        const textoJson = data.candidates[0].content.parts[0].text;
        return res.status(200).json(JSON.parse(textoJson));
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao processar a inteligência artificial.' });
    }
}
