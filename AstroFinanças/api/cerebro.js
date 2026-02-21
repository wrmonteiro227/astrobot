module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();
    const matchNum = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNum ? parseFloat(matchNum[0].replace(',', '.')) : null;

    let textoBase = texto.toLowerCase().replace(/r\$/g, ' ')
        .replace(/\b(ol[aá]|eu|que|gastei|comprei|paguei|custou|saiu|recebi|ganhei|entrou|vendi|hoje|ontem|amanh[aã]|reais|com|na|no|o|a|para|desse|mes|fui|irei|vou|preciso|lembrar|lembre|me|de|fazer|guardei|guardar|poupei|economizei|juntei|juntar|junto|adicionei|depositei|depostei|deposito|conta)\b/g, ' ');

    let descLimpa = textoBase.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim();
    descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "Registro";

    let resposta = { categoria: "conversa", tipo: null, valor: valor, descricao_limpa: descLimpa, mensagem: `Olá, ${nomeUsuario}. Não entendi esse comando. Pode falar sobre gastos, depósitos ou cofre?` };

    if (frase.includes("quanto") || frase.includes("extrato") || frase.includes("lista") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        if (frase.includes("guardado") || frase.includes("cofre") || frase.includes("reserva") || frase.includes("juntei") || frase.includes("junto")) resposta.tipo = "reserva";
        else if (frase.includes("depositei") || frase.includes("ganhei") || frase.includes("recebi") || frase.includes("entrada")) resposta.tipo = "entrada";
        else if (frase.includes("deve") || frase.includes("divida")) resposta.tipo = "dividas";
        else resposta.tipo = "gastos";
        resposta.mensagem = "Localizando seus registros no sistema...";
    } 
    else if (frase.includes("guardei") || frase.includes("guardar") || frase.includes("cofre") || frase.includes("juntei") || frase.includes("juntar")) {
        resposta = { categoria: "financa", tipo: "reserva", valor: valor, mensagem: `R$ ${valor} foram guardados no seu cofre com sucesso. 🔒` };
    }
    else if (frase.includes("recebi") || frase.includes("ganhei") || frase.includes("entrou") || frase.includes("adicionei") || frase.includes("deposit") || frase.includes("depost")) {
        resposta = { categoria: "financa", tipo: "entrada", valor: valor, mensagem: `Depósito de R$ ${valor} registrado na sua conta. ✅` };
    }
    else if (frase.includes("gastei") || frase.includes("comprei") || frase.includes("paguei")) {
        resposta = { categoria: "financa", tipo: "saida", valor: valor, mensagem: `Gasto de R$ ${valor} computado. 📉` };
    }

    return res.status(200).json(resposta);
};
