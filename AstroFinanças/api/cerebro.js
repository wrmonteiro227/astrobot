module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    
    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();
    
    // Captura o valor para finanças
    const matchNum = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNum ? parseFloat(matchNum[0].replace(',', '.')) : null;

    // --- TESOURA INTELIGENTE (Versão Laboratório) ---
    // Remove palavras de comando, mas PRESERVA números se for tarefa (ex: "as 15h")
    let descLimpa = texto.toLowerCase()
        .replace(/r\$/g, '')
        .replace(/\b(depositei|guardei|gastei|paguei|recebi|ganhei|juntei|reais|hoje|ontem|anota ai|lembrar)\b/g, '')
        .replace(/\s+/g, ' ').trim();

    // Se NÃO for tarefa, removemos os números da descrição (comportamento de finanças)
    if (!frase.includes("lembrar") && !frase.includes("tarefa") && !frase.includes("avisar")) {
        descLimpa = descLimpa.replace(/\d+(?:[.,]\d+)?/g, '').trim();
    }
    
    descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

    let resposta = { categoria: "conversa", mensagem: `E aí ${nomeUsuario}, como posso ajudar?` };

    // 1. LÓGICA DE CONSULTA (Blindada após testes)
    if (frase.includes("quanto") || frase.includes("extrato") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        if (frase.includes("cofre") || frase.includes("juntei") || frase.includes("juntar") || frase.includes("reserva")) {
            resposta.tipo = "reserva";
        } else if (frase.includes("deposit") || frase.includes("ganh") || frase.includes("receb") || frase.includes("entrada")) {
            resposta.tipo = "entrada";
        } else {
            resposta.tipo = "gastos";
        }
        resposta.mensagem = "Puxando seus dados aqui:";
    } 
    // 2. LÓGICA DE REGISTRO - COFRE (RESERVA)
    else if (frase.includes("guard") || frase.includes("junt") || frase.includes("cofre")) {
        resposta = { categoria: "financa", tipo: "reserva", valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor} guardados no cofre. 🔒` };
    } 
    // 3. LÓGICA DE REGISTRO - ENTRADA
    else if (frase.includes("deposit") || frase.includes("receb") || frase.includes("ganh")) {
        resposta = { categoria: "financa", tipo: "entrada", valor, descricao_limpa: descLimpa, mensagem: `Depósito de R$ ${valor} registrado. ✅` };
    } 
    // 4. LÓGICA DE REGISTRO - GASTOS
    else if (frase.includes("gast") || frase.includes("pagu") || frase.includes("compr")) {
        resposta = { categoria: "financa", tipo: "saida", valor, descricao_limpa: descLimpa, mensagem: `Gasto de R$ ${valor} anotado. 📉` };
    }
    // 5. LÓGICA DE TAREFAS
    else if (frase.includes("lembrar") || frase.includes("tarefa") || frase.includes("anota")) {
        resposta = { categoria: "tarefa", tipo: "pendente", mensagem: `Pode deixar, vou te lembrar de: ${descLimpa}` };
    }

    return res.status(200).json(resposta);
};
