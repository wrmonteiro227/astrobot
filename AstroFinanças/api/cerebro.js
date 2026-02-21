module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
    
    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();

    const msgGastos = [`Anotado! R$ {valor} indo embora. 💸`, `Gasto de R$ {valor} registrado. 📉`];
    const msgGanhos = [`Boa! R$ {valor} na conta. 🤑`, `Dinheiro no bolso! Mais R$ {valor}. 💰`];
    const msgTarefas = [`Irei registrar isso no seu histórico! Missão dada é missão cumprida. 🫡`, `Pode deixar, já anotei na sua agenda! ✅`];
    const msgPoupanca = [`Aí sim, parceiro! R$ {valor} guardados no cofre. Estamos mais perto do objetivo! 💰🔒`, `Pega a visão: quem guarda, tem! Mais R$ {valor} pra sua reserva. 🚀📈`];

    function sortearMsg(array, valor) { return array[Math.floor(Math.random() * array.length)].replace('{valor}', valor); }

    const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

    let textoBase = texto.toLowerCase()
        .replace(/\b(ol[aá]|eu|que|gastei|comprei|paguei|custou|saiu|recebi|ganhei|entrou|vendi|hoje|ontem|amanh[aã]|r\$|reais|exagerei|acho otimo|com|na|no|o|a|para|desse|mes|fui|irei|vou|preciso|lembrar|lembre|lembrete|me|de|fazer|guardei|guardar|poupei|economizei|come[çc]arei|proxima|semana|juntei|juntar|junto|adicionei|depositei|depostei|deposito|conta)\b/g, ' ');

    let descFinanca = textoBase.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim();
    let descTarefa = textoBase.replace(/\s+/g, ' ').trim(); 
    
    descFinanca = descFinanca ? descFinanca.charAt(0).toUpperCase() + descFinanca.slice(1) : "";
    descTarefa = descTarefa ? descTarefa.charAt(0).toUpperCase() + descTarefa.slice(1) : "";
    
    if (descFinanca === "") descFinanca = "Registro";
    if (descTarefa === "") descTarefa = "Lembrete";

    let resposta = {
        categoria: "conversa", tipo: null, periodo: null, valor: null, termo_busca: null, descricao_limpa: null,
        mensagem: `Opa, parceiro! Sobre esse assunto eu não vou conseguir te ajudar. Minha missão aqui é única: tirar o peso das suas costas e organizar as finanças, reservas e tarefas que sobrecarregam o seu dia a dia. Manda aí um gasto, um ganho, um valor guardado ou um lembrete pra gente focar no que importa! 🚀💼`
    };

    let matchQuantoDeve = frase.match(/quanto\s+([a-zãõáéíóúç\s]+)\s+me\s+deve/);
    if (matchQuantoDeve) {
        let nomeConsulta = matchQuantoDeve[1].trim();
        resposta = { categoria: "consulta", tipo: "dividas", termo_busca: nomeConsulta, mensagem: `Consultando a ficha do ${nomeConsulta} aqui nas dívidas... 🔎👇` };
        return res.status(200).json(resposta);
    }

    let matchPagou = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+pagou/);
    if (matchPagou) {
        let nomeDevedor = matchPagou[1].replace(/\b(o|a|que)\b/g, '').trim(); 
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: nomeDevedor, mensagem: `Justo! O ${nomeDevedor} honrou o compromisso. 🤝` };
        return res.status(200).json(resposta);
    }

    if (frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/) && valor) {
        let matchDeve = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/);
        let nomeDevedor = matchDeve[1].replace(/\b(o|a)\b/g, '').trim();
        resposta = { categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nomeDevedor}`, mensagem: `Tá no caderninho! ✍️ ${nomeDevedor} te deve R$ ${valor}.` };
        return res.status(200).json(resposta);
    }

    // CONSULTAS: "DEPOSITEI" AGORA FAZ PARTE DO COFRE
    if (frase.includes("quanto") || frase.includes("quem") || frase.includes("extrato") || frase.includes("lista") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        resposta.periodo = frase.includes("semana") ? "semana" : frase.includes("mes") ? "mes" : "hoje";
        
        if (frase.includes("guardado") || frase.includes("cofre") || frase.includes("reserva") || frase.includes("guardei") || frase.includes("guardar") || frase.includes("poupanca") || frase.includes("poupei") || frase.includes("juntei") || frase.includes("juntar") || frase.includes("junto") || frase.includes("deposit")) {
            resposta.tipo = "reserva"; resposta.mensagem = "Abrindo o cofre pra ver como tá a sua construção de riqueza: 🏦👇";
        } else if (frase.includes("deve") || frase.includes("devendo") || frase.includes("divida")) {
            resposta.tipo = "dividas"; resposta.mensagem = "Lista de quem tá te devendo: 📜👇";
        } else if (frase.includes("tarefa") || frase.includes("fazer") || frase.includes("fui") || frase.includes("irei") || frase.includes("lembretes")) {
            resposta.tipo = "tarefas"; resposta.mensagem = "Sua agenda de tarefas e registros: 🎯👇";
        } else if (frase.includes("ganhei") || frase.includes("recebi") || frase.includes("entrou")) {
            resposta.tipo = "entrada"; resposta.mensagem = "Dinheiro que entrou: 💸👇";
        } else {
            resposta.tipo = "gastos"; resposta.mensagem = "Resumo do que saiu do bolso: 📊👇";
        }
        return res.status(200).json(resposta);
    }

    if (frase.includes("apagar") || frase.includes("cancelar") || frase.includes("excluir")) {
        let partes = frase.split(" ");
        let termo = partes[partes.length - 1]; 
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: termo, mensagem: `Apaguei tudo de "${termo}". 🗑️` };
        return res.status(200).json(resposta);
    }

    // REGISTROS: "DEPOSITEI" AGORA GUARDA NO COFRE
    if (frase.includes("guardei") || frase.includes("guardar") || frase.includes("poupei") || frase.includes("economizei") || frase.includes("cofre") || frase.includes("juntei") || frase.includes("juntar") || frase.includes("deposit")) {
        if (valor) {
            resposta = { categoria: "financa", tipo: "reserva", valor: valor, descricao_limpa: descFinanca, mensagem: sortearMsg(msgPoupanca, valor) };
        } else {
            resposta = { categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descTarefa, mensagem: `Plano anotado, chefe! Quando separar a grana de verdade, me manda o valor exato pra eu trancar no cofre! 🔒💰` };
        }
        return res.status(200).json(resposta);
    }

    if (frase.includes("recebi") || frase.includes("ganhei") || frase.includes("entrou") || frase.includes("vendi") || frase.includes("adicionei")) {
        resposta = { categoria: "financa", tipo: "entrada", valor: valor, descricao_limpa: descFinanca, mensagem: valor ? sortearMsg(msgGanhos, valor) : "Faltou o número!" };
    }
    else if (frase.includes("gastei") || frase.includes("comprei") || frase.includes("paguei") || frase.includes("custou") || frase.includes("saiu")) {
        resposta = { categoria: "financa", tipo: "saida", valor: valor, descricao_limpa: descFinanca, mensagem: valor ? sortearMsg(msgGastos, valor) : "Faltou o número do gasto!" };
    }
    else if ((frase.includes("pagar") && !valor) || frase.includes("dia ") || frase.includes("tenho que") || frase.includes("vou") || frase.includes("preciso") || frase.includes("lembrar") || frase.includes("lembre") || frase.includes("lembrete") || frase.includes("tarefa") || frase.includes("irei") || frase.includes("fui") || frase.includes("ontem") || frase.includes("amanha") || frase.includes("come[çc]arei")) {
        resposta = { categoria: "tarefa", tipo: "pendente", valor: null, descricao_limpa: descTarefa, mensagem: sortearMsg(msgTarefas, "") };
    }

    return res.status(200).json(resposta);
};
