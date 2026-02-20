export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não encontrada.' });
    }

    // --- O NOVO CÉREBRO: MAIS RÍGIDO E INTELIGENTE ---
    const prompt = `
    Você é o Astro, o assistente financeiro e organizador pessoal do usuário ${nomeUsuario}.
    
    Mensagem do usuário: "${texto}"
    
    Sua missão é classificar essa mensagem em UMA das 4 categorias abaixo, OBRIGATORIAMENTE:
    
    1. "consulta": O usuário está PERGUNTANDO o que tem para fazer, pedindo resumo, extrato ou histórico (Ex: "o que tenho pra hoje?", "quais as tarefas?", "quanto gastei?").
    2. "tarefa": O usuário está MANDANDO você anotar, avisando que vai fazer algo, ou criando um lembrete (Ex: "vou para a igreja", "lembrar de comprar pão").
    3. "financa": O usuário relata que GASTOU, PAGOU, RECEBEU ou COMPROU algo com valor em dinheiro (Ex: "gastei 50 conto", "recebi 100").
    4. "conversa": Apenas saudações ou bate-papo inútil ("oi", "tudo bem", "isso").
    
    Regras para a resposta ("mensagem"):
    - Se for "consulta", responda APENAS: "Aqui estão suas informações da semana/hoje:" (NÃO diga "Vou dar uma olhadinha", pois o sistema já vai exibir a lista automaticamente embaixo da sua resposta).
    - Se for "tarefa", confirme de forma amigável que você anotou.
    
    Retorne APENAS um JSON válido.
    Formato:
    {
        "categoria": "consulta", // ou financa, tarefa, conversa
        "tipo": "tarefas", // se for consulta (gastos ou tarefas). se financa (saida ou entrada). se tarefa (pendente).
        "periodo": "semana", // se for consulta (hoje, semana, mes). senão retorne null.
        "valor": null, // se financa, coloque o numero. senão retorne null.
        "mensagem": "Sua resposta direta aqui."
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
        const resultado = JSON.parse(textoJson);

        return res.status(200).json(resultado);
    } catch (error) {
        console.error("Erro na API do Gemini:", error);
        return res.status(500).json({ error: 'Erro ao processar a inteligência artificial.' });
    }
}
