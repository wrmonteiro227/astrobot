export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não encontrada na Vercel.' });
    }

    // O INSTRUÇÃO SECRETA PARA A IA
    const prompt = `
    Você é o Astro, um assistente financeiro e de produtividade de WhatsApp muito inteligente.
    O nome do usuário com quem você está falando é ${nomeUsuario}.
    
    Analise a seguinte mensagem do usuário: "${texto}"
    
    Regras:
    1. Identifique se a frase é um gasto/recebimento (financa), uma anotação a fazer (tarefa), um pedido de extrato (consulta) ou apenas um bate-papo (conversa).
    2. Crie uma mensagem de resposta bem humanizada, direta e amigável (estilo WhatsApp) confirmando o que você entendeu.
    3. Se o usuário falar gírias de dinheiro ("conto", "pila", "barão"), entenda como reais.
    
    Retorne APENAS um objeto JSON válido.
    Formato OBRIGATÓRIO do JSON:
    {
        "categoria": "financa" ou "tarefa" ou "consulta" ou "conversa",
        "tipo": "saida" ou "entrada" (se financa) / "pendente" (se tarefa) / "gastos" ou "tarefas" (se consulta) / null (se conversa),
        "periodo": "hoje" ou "semana" ou "mes" (apenas se for consulta, senão null),
        "valor": numero float (apenas se houver valor financeiro, usando ponto para decimais. Ex: 150.00. Senão, null),
        "mensagem": "Sua resposta amigável e empática aqui."
    }
    `;

    try {
        // CONEXÃO COM O GOOGLE GEMINI
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // Força a IA a devolver em formato JSON limpo, sem erros
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