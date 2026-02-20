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
    
    Instruções de preenchimento:
    - 'tipo': se consulta use "gastos" ou "tarefas". se financa use "saida" ou "entrada". se tarefa use "pendente". se exclusao use "financas" ou "tarefas".
    - 'periodo': "hoje", "semana" ou "mes" (Apenas para consulta. Se não for consulta, use null).
    - 'valor': APENAS se a categoria for financa, coloque o numero. Senão, use null.
    - 'termo_busca': OBRIGATÓRIO se for exclusao (palavra-chave). Senão, use null.
    
    Retorne APENAS um JSON válido. Não adicione textos, crases (\`\`\`) ou comentários dentro do JSON.
    Formato EXATO:
    {
        "categoria": "consulta",
        "tipo": "gastos",
        "periodo": "semana",
        "valor": null,
        "termo_busca": null,
        "mensagem": "Certo! Vou puxar os seus gastos da semana aqui:"
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
        
        // SE O GOOGLE RECUSAR (COTA ESTOURADA, ETC), ELE VAI AVISAR AQUI:
        if (data.error) {
            throw new Error(`Google bloqueou: ${data.error.message}`);
        }

        const textoJson = data.candidates[0].content.parts[0].text;
        const jsonLimpo = textoJson.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // SE A IA MANDAR UM JSON QUEBRADO, O ERRO VAI PULAR AQUI:
        return res.status(200).json(JSON.parse(jsonLimpo));
    } catch (error) {
        console.error("Erro detalhado:", error.message);
        // O SITE VAI MOSTRAR EXATAMENTE O MOTIVO REAL NA SUA TELA:
        return res.status(500).json({ error: error.message });
    }
}
