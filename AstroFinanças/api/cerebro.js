module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();
    
    // Captura o valor numérico
    const matchNum = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNum ? parseFloat(matchNum[0].replace(',', '.')) : null;

    // Tesoura: remove comandos mas preserva o que é importante
    let descLimpa = texto.toLowerCase()
        .replace(/r\$/g, '')
        .replace(/\b(depositei|guardei|gastei|paguei|recebi|ganhei|juntei|no cofre|hoje|ontem|reais)\b/g, '')
        .replace(/\d+(?:[.,]\d+)?/g, '')
        .replace(/\s+/g, ' ').trim();
    
    descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro Financeiro";

    let resposta = {
        categoria: "conversa", tipo: null, valor: valor, descricao_limpa: descLimpa,
        mensagem: `Olá ${nomeUsuario}, não consegui processar esse comando. Tente algo como 'gastei 50 com lanche' ou 'guardei 100 no cofre'.`
    };

    // Lógica de Consulta
    if (frase.includes("quanto") || frase.includes("extrato") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        if (frase.includes("cofre") || frase.includes("juntei") || frase.includes("reserva")) resposta.tipo = "reserva";
        else if (frase.includes("depositei") || frase.includes("ganhei") || frase.includes("entrada")) resposta.tipo = "entrada";
        else resposta.tipo = "gastos";
        resposta.mensagem = "Buscando seus dados no sistema...";
    }
    // Lógica de Registro
    else if (frase.includes("guard") || frase.includes("junt") || frase.includes("cofre")) {
        resposta = { categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor} foram adicionados ao seu cofre. 🔒` };
    }
    else if (frase.includes("deposit") || frase.includes("receb") || frase.includes("ganh")) {
        resposta = { categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descLimpa, mensagem: `R$ ${valor} creditados com sucesso. ✅` };
    }
    else if (frase.includes("gast") || frase.includes("pagu") || frase.includes("compr")) {
        resposta = { categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descLimpa, mensagem: `Gasto de R$ ${valor} registrado. 📉` };
    }

    return res.status(200).json(resposta);
};
