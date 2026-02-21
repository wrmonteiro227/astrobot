module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();

    // Sorteador de Carisma do Astro
    const msgGastos = [`Anotado, ${nomeUsuario}! R$ {valor} indo embora. 👀💸`, `Gasto de R$ {valor} registrado. Olho no orçamento! 📉`];
    const msgGanhos = [`Boa, chefe! R$ {valor} na conta. O pai tá on! 🤑`, `Dinheiro no bolso! Mais R$ {valor} pra conta. 💰🚀`];
    const msgTarefas = [`Irei registrar isso no seu histórico! Missão dada é missão cumprida. 🫡`, `Pode deixar, já anotei na sua agenda! ✅`];
    const msgPoupanca = [`Aí sim! R$ {valor} guardados no cofre. Estamos mais perto do objetivo! 💰🔒`, `Pega a visão: quem guarda, tem! Mais R$ {valor} pra sua reserva. 🚀📈`];

    function sortear(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

    const matchNum = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNum ? parseFloat(matchNum[0].replace(',', '.')) : null;

    // A TESOURA HACKER (Limpa a descrição para o banco de dados)
    let textoBase = texto.toLowerCase().replace(/r\$/g, ' ')
        .replace(/\b(ol[aá]|eu|que|gastei|comprei|paguei|custou|saiu|recebi|ganhei|entrou|vendi|hoje|ontem|amanh[aã]|reais|exagerei|acho otimo|com|na|no|o|a|para|desse|mes|fui|irei|vou|preciso|lembrar|lembre|lembrete|me|de|fazer|guardei|guardar|poupei|economizei|come[çc]arei|proxima|semana|juntei|juntar|junto|adicionei|depositei|depostei|deposito|conta)\b/g, ' ');

    let descFinanca = textoBase.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim();
    let descTarefa = textoBase.replace(/\s+/g, ' ').trim(); 
    descFinanca = descFinanca ? descFinanca.charAt(0).toUpperCase() + descFinanca.slice(1) : "Registro financeiro";
    descTarefa = descTarefa ? descTarefa.charAt(0).toUpperCase() + descTarefa.slice(1) : "Lembrete";

    let resposta = {
        categoria: "conversa", tipo: null, periodo: null, valor: null, termo_busca: null, descricao_limpa: null,
        mensagem: `Opa, parceiro! Sobre esse assunto não consigo te ajudar. Minha missão é organizar suas finanças, reservas e tarefas! Manda um gasto, ganho ou lembrete. 🚀`
    };

    // LÓGICA DE DECISÃO
    if (frase.match(/quanto\s+([a-zãõáéíóúç\s]+)\s+me\s+deve/)) {
        let nome = frase.match(/quanto\s+([a-zãõáéíóúç\s]+)\s+me\s+deve/)[1].trim();
        resposta = { categoria: "consulta", tipo: "dividas", termo_busca: nome, mensagem: `Consultando a ficha do ${nome} aqui nas dívidas... 🔎` };
    } 
    else if (frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+pagou/)) {
        let nome = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+pagou/)[1].replace(/\b(o|a|que)\b/g, '').trim();
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: nome, mensagem: `Justo! O ${nome} honrou o compromisso. Já risquei da lista! 🤝` };
    }
    else if (frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/) && valor) {
        let nome = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/)[1].replace(/\b(o|a)\b/g, '').trim();
        resposta = { categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nome}`, mensagem: `Tá no caderninho! ✍️ ${nome} te deve R$ ${valor}.` };
    }
    else if (frase.includes("quanto") || frase.includes("quem") || frase.includes("extrato") || frase.includes("lista") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        resposta.periodo = frase.includes("semana") ? "semana" : frase.includes("mes") ? "mes" : "hoje";
        if (frase.includes("guardado") || frase.includes("cofre") || frase.includes("reserva") || frase.includes("juntei") || frase.includes("junto")) resposta.tipo = "reserva";
        else if (frase.includes("deve") || frase.includes("divida")) resposta.tipo = "dividas";
        else if (frase.includes("tarefa") || frase.includes("fazer") || frase.includes("fui") || frase.includes("irei")) resposta.tipo = "tarefas";
        else if (frase.includes("ganhei") || frase.includes("recebi")) resposta.tipo = "entrada";
        else resposta.tipo = "gastos";
        resposta.mensagem = "Puxando seus registros aqui no sistema: 📊👇";
    }
    else if (frase.includes("guardei") || frase.includes("guardar") || frase.includes("cofre") || frase.includes("juntei") || frase.includes("juntar")) {
        resposta = valor ? { categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descFinanca, mensagem: sortear(msgPoupanca, valor) } 
                           : { categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descTarefa, mensagem: `Plano anotado! Quando guardar a grana, me fala o valor pra eu trancar no cofre! 🔒` };
    }
    else if (frase.includes("recebi") || frase.includes("ganhei") || frase.includes("entrou") || frase.includes("vendi") || frase.includes("adicionei") || frase.includes("depost") || frase.includes("deposito")) {
        resposta = { categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descFinanca, mensagem: valor ? sortear(msgGanhos, valor) : "Faltou o valor!" };
    }
    else if (frase.includes("gastei") || frase.includes("comprei") || frase.includes("paguei") || frase.includes("custou") || frase.includes("saiu")) {
        resposta = { categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descFinanca, mensagem: valor ? sortear(msgGastos, valor) : "Qual foi o valor do gasto?" };
    }
    else if (frase.includes("apagar") || frase.includes("excluir")) {
        let termo = frase.split(" ").pop();
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: termo, mensagem: `Apaguei os registros de "${termo}". 🗑️` };
    }
    else if (frase.includes("dia") || frase.includes("vou") || frase.includes("preciso") || frase.includes("lembrar") || frase.includes("tarefa") || frase.includes("irei") || frase.includes("fui") || frase.includes("ontem")) {
        resposta = { categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descTarefa, mensagem: sortear(msgTarefas, "") };
    }

    return res.status(200).json(resposta);
};
