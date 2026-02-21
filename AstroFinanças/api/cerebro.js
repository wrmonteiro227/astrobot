module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    
    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();

    // O SEU BRASILEIRÊS DE VOLTA
    const msgGastos = [`Anotado, chefe! R$ {valor} indo embora. 💸`, `Gasto de R$ {valor} registrado. Olho no orçamento! 📉`, `Putz, mais R$ {valor} pra conta dos gastos. Anotado! 📝`];
    const msgGanhos = [`Boa, chefe! R$ {valor} na conta. O pai tá on! 🤑`, `Dinheiro no bolso! Mais R$ {valor} pra conta. 💰🚀`, `Aí sim! R$ {valor} de entrada garantida. ✅`];
    const msgTarefas = [`Irei registrar isso no seu histórico! Missão dada é missão cumprida. 🫡`, `Pode deixar, já anotei na sua agenda! ✅`];
    const msgPoupanca = [`Aí sim, parceiro! R$ {valor} trancados no cofre. Rumo ao topo! 💰🔒`, `Pega a visão: quem guarda, tem! Mais R$ {valor} pra sua reserva. 🚀📈`, `Cofre alimentado com R$ {valor}. Isso que é disciplina! 🛡️`];

    function sortearMsg(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

    const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

    let textoBase = texto.toLowerCase().replace(/\b(ol[aá]|eu|que|gastei|comprei|paguei|custou|saiu|recebi|ganhei|entrou|vendi|hoje|ontem|amanh[aã]|r\$|reais|exagerei|acho otimo|com|na|no|o|a|para|desse|mes|fui|irei|vou|preciso|lembrar|lembre|lembrete|me|de|fazer|guardei|guardar|poupei|economizei|come[çc]arei|proxima|semana|juntei|juntar|junto|adicionei|depositei|depostei|deposito|conta|quannto|quanto|limpar|apagar)\b/g, ' ');

    let descLimpa = textoBase.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim();
    descLimpa = descLimpa ? descLimpa.charAt(0).toUpperCase() + descLimpa.slice(1) : "";

    // LÓGICA DE GAVETAS
    let tipoFinanca = null;
    if (frase.includes("guard") || frase.includes("junt") || frase.includes("cofre")) tipoFinanca = "reserva";
    else if (frase.includes("deposit") || frase.includes("receb") || frase.includes("ganh") || frase.includes("entrou")) tipoFinanca = "entrada";
    else if (frase.includes("gast") || frase.includes("compr") || frase.includes("pagu") || frase.includes("custou") || frase.includes("saiu")) tipoFinanca = "saida";

    // NOMEIA CORRETAMENTE SE VOCÊ NÃO DER DETALHES (Fim do "Registro financeiro" repetido)
    if (descLimpa === "") {
        if (tipoFinanca === "entrada") descLimpa = "Depósito / Entrada";
        else if (tipoFinanca === "reserva") descLimpa = "Valor Guardado no Cofre";
        else if (tipoFinanca === "saida") descLimpa = "Gasto Avulso";
        else descLimpa = "Lembrete";
    }

    let resposta = { categoria: "conversa", mensagem: `Opa, parceiro! Sobre esse assunto eu não vou conseguir te ajudar. Minha missão aqui é organizar finanças, reservas e tarefas. Manda aí um gasto, ganho, cofre ou lembrete! 🚀💼` };

    // CONSULTAS
    if (frase.includes("quanto") || frase.includes("quannto") || frase.includes("extrato") || frase.includes("resumo") || frase.includes("lista")) {
        resposta.categoria = "consulta";
        if (frase.includes("cofre") || frase.includes("reserva") || frase.includes("guard") || frase.includes("junt")) {
            resposta.tipo = "reserva"; resposta.mensagem = "Abrindo o cofre pra ver sua construção de riqueza: 🏦👇";
        } else if (frase.includes("deposit") || frase.includes("ganh") || frase.includes("receb") || frase.includes("entrada")) {
            resposta.tipo = "entrada"; resposta.mensagem = "Dinheiro que entrou: 💸👇";
        } else if (frase.includes("tarefa") || frase.includes("fazer") || frase.includes("fui")) {
            resposta.tipo = "tarefas"; resposta.mensagem = "Sua agenda e registros: 🎯👇";
        } else {
            resposta.tipo = "gastos"; resposta.mensagem = "Resumo do que saiu do bolso: 📊👇";
        }
        return res.status(200).json(resposta);
    }

    // REGISTROS (Reserva, Entrada, Saída e Tarefa)
    if (tipoFinanca === "reserva") {
        if (valor) resposta = { categoria: "financa", tipo: "reserva", valor, descricao_limpa: descLimpa, mensagem: sortearMsg(msgPoupanca, valor) };
        else resposta = { categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: `Plano anotado, chefe! Quando separar a grana de verdade, manda o valor exato pra eu trancar no cofre! 🔒💰` };
    } 
    else if (tipoFinanca === "entrada") {
        resposta = { categoria: "financa", tipo: "entrada", valor, descricao_limpa: descLimpa, mensagem: valor ? sortearMsg(msgGanhos, valor) : "Faltou o número da entrada!" };
    } 
    else if (tipoFinanca === "saida") {
        resposta = { categoria: "financa", tipo: "saida", valor, descricao_limpa: descLimpa, mensagem: valor ? sortearMsg(msgGastos, valor) : "Faltou o número do gasto!" };
    } 
    else if (frase.includes("lembrar") || frase.includes("fui") || frase.includes("vou") || frase.includes("amanha") || frase.includes("tarefa")) {
        resposta = { categoria: "tarefa", tipo: "pendente", descricao_limpa: descLimpa, mensagem: sortearMsg(msgTarefas, "") };
    }

    // EXCLUSÃO ÚNICA
    if (frase.includes("apagar") && !frase.includes("tudo")) {
        let termo = frase.split(" ").pop();
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: termo, mensagem: `Apaguei registros que continham "${termo}". 🗑️` };
    }

    return res.status(200).json(resposta);
};
