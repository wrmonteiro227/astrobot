export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Chave da API não encontrada.' });

    const prompt = `
    Você é o Astro, o assistente financeiro e organizador pessoal do usuário ${nomeUsuario}.
    Mensagem do usuário: "${texto}"
    
    Classifique a mensagem em UMA das 5 categorias:
    1. "consulta": O usuário está PERGUNTANDO sobre o passado ou pedindo para LER os dados. Palavras: "quanto", "quais", "mostre", "resumo". (Ex: "quanto gastei essa semana?", "o que tenho pra fazer?").
    2. "tarefa": Anotar algo NOVO para fazer (Ex: "vou para a igreja").
    3. "financa": Registrar um GASTO ou GANHO NOVO. A frase OBRIGATORIAMENTE tem um NÚMERO. (Ex: "gastei 50 reais"). ATENÇÃO: Se a frase for "quanto gastei", é "consulta" (gastos), NÃO é "financa".
    4. "exclusao": Pedir para apagar algo usando uma palavra-chave (Ex: "apagar igreja").
    5. "conversa": Bate-papo inútil.
    
    Retorne APENAS um JSON válido.
    Formato:
    {
        "categoria": "consulta", // ou financa, tarefa, exclusao, conversa
        "tipo": "gastos", // se consulta: "gastos" ou "tarefas". se financa: "saida" ou "entrada". se tarefa: "pendente". se exclusao: "financas" ou "tarefas".
        "periodo": "semana", // "hoje", "semana", "mes" (apenas para consulta, senao null)
        "valor": null, // APENAS se categoria for financa, coloque o numero. Senão null.
        "termo_busca": "igreja", // OBRIGATÓRIO se for exclusao. Senão null.
        "mensagem": "Sua resposta amigável e direta aqui. Se for consulta, apenas confirme que vai mostrar."
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
