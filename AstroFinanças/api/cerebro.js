module.exports = async function(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Só aceita POST' });

    const { texto, nomeUsuario } = req.body;
    const frase = texto.toLowerCase().trim();

    // ==========================================
    // 1. O MOTOR DE CARISMA
    // ==========================================
    const msgGastos = [
        `Anotado, chefe! R$ {valor} indo embora. Tem que controlar, hein? 💸`,
        `Gasto de R$ {valor} registrado. Doendo no bolso, mas tá salvo! 📉`,
        `Lá se vai R$ {valor}... Tá no sistema! 📝`
    ];
    const msgGanhos = [
        `Boa, ${nomeUsuario}! R$ {valor} na conta. O pai tá on! 🤑`,
        `Foguete não tem ré! R$ {valor} registrado nas entradas. 🚀`,
        `Dinheiro no bolso! Mais R$ {valor} pra conta do chefe. 💰`
    ];
    const msgTarefas = [
        `Missão dada é missão cumprida. Anotei na sua lista! 🫡`,
        `Deixa comigo, ${nomeUsuario}. Tá salvo nas tarefas! ✅`,
        `Memória de elefante aqui. Tarefa registrada com sucesso! 🐘`
    ];

    function sortearMsg(array, valor) {
        const msg = array[Math.floor(Math.random() * array.length)];
        return msg.replace('{valor}', valor);
    }

    const matchNumero = frase.match(/\d+(?:[.,]\d+)?/);
    const valor = matchNumero ? parseFloat(matchNumero[0].replace(',', '.')) : null;

    let resposta = {
        categoria: "conversa", tipo: null, periodo: null, valor: null, termo_busca: null,
        mensagem: `Aí me complicou, ${nomeUsuario}. Fala "gastei X", "recebi Y", "Fulano me deve Z", ou pede pra ver quem te deve!`
    };

    // ==========================================
    // 2. O CÉREBRO LÓGICO
    // ==========================================

    // A) PAGAMENTO DE DÍVIDA
    let matchPagou = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+pagou/);
    if (matchPagou) {
        let nomeDevedor = matchPagou[1].replace(/\b(o|a|que)\b/g, '').trim(); 
        resposta.categoria = "exclusao";
        resposta.tipo = "financas";
        resposta.termo_busca = nomeDevedor;
        resposta.mensagem = `Justo! O ${nomeDevedor} honrou o compromisso. Já risquei a dívida dele do caderninho! 🤝`;
        return res.status(200).json(resposta);
    }

    // B) NOVA DÍVIDA
    let matchDeve = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/);
    if (matchDeve && valor) {
        let nomeDevedor = matchDeve[1].replace(/\b(o|a)\b/g, '').trim();
        let dataVencimento = "";
        let matchData = frase.match(/(?:para|ate|no|na)\s+([a-z0-9\s]+)$/);
        if (matchData) dataVencimento = ` (Prazo: ${matchData[1].trim()})`;

        resposta.categoria = "financa";
        resposta.tipo = "divida";
        resposta.valor = valor;
        resposta.mensagem = `Tá no caderninho! ✍️ ${nomeDevedor} te deve R$ ${valor}${dataVencimento}. Ficarei de olho nessa cobrança, chefe.`;
        return res.status(200).json(resposta);
    }

    // C) CONSULTAS
    if (frase.includes("quanto") || frase.includes("quem") || frase.includes("extrato") || frase.includes("lista") || frase.includes("resumo")) {
        resposta.categoria = "consulta";
        if (frase.includes("deve") || frase.includes("devendo") || frase.includes("divida")) {
            resposta.tipo = "dividas";
            resposta.mensagem = "Puxando a lista de quem tá te devendo (o famoso caderninho do fiado): 📜👇";
        } else if (frase.includes("tarefa") || frase.includes("fazer")) {
            resposta.tipo = "tarefas";
            resposta.mensagem = "Aqui estão suas missões pendentes, pra não deixar nada passar: 🎯👇";
        } else if (frase.includes("ganhei") || frase.includes("recebi") || frase.includes("entrada")) {
            resposta.tipo = "entrada";
            resposta.mensagem = "Dinheiro limpo que entrou pra você. Dá uma olhada: 💸👇";
        } else {
            resposta.tipo = "gastos";
            resposta.mensagem = "Resumo do que saiu do seu bolso. Pega a visão: 📊👇";
        }
        resposta.periodo = frase.includes("semana") ? "semana" : frase.includes("mes") ? "mes" : "hoje";
        return res.status(200).json(resposta);
    }

    // D) EXCLUSÃO DIRETA
    if (frase.includes("apagar") || frase.includes("cancelar") || frase.includes("excluir")) {
        resposta.categoria = "exclusao";
        resposta.tipo = "financas";
        let partes = frase.split(" ");
        resposta.termo_busca = partes[partes.length - 1]; 
        resposta.mensagem = `Feito, meu parceiro! Apaguei tudo que encontrei com o nome "${resposta.termo_busca}". 🗑️`;
        return res.status(200).json(resposta);
    }

    // E) ENTRADAS
    if (frase.includes("recebi") || frase.includes("ganhei") || frase.includes("entrou") || frase.includes("vendi") || frase.includes("lucro")) {
        resposta.categoria = "financa";
        resposta.tipo = "entrada";
        resposta.valor = valor;
        resposta.mensagem = valor ? sortearMsg(msgGanhos, valor) : "Pô, faltou me dizer de quanto foi esse lucro! Manda de novo com o número.";
        return res.status(200).json(resposta);
    }

    // F) SAÍDAS
    if (frase.includes("gastei") || frase.includes("comprei") || frase.includes("paguei") || frase.includes("custou") || frase.includes("saiu")) {
        resposta.categoria = "financa";
        resposta.tipo = "saida";
        resposta.valor = valor;
        resposta.mensagem = valor ? sortearMsg(msgGastos, valor) : "Qual foi o tamanho do buraco? Manda a frase de novo com o valor do gasto!";
        return res.status(200).json(resposta);
    }

    // G) LEMBRETES E CONTAS A PAGAR (Nova Habilidade!)
    if ((frase.includes("pagar") && !valor) || frase.includes("dia de") || frase.includes("tenho que")) {
        resposta.categoria = "tarefa";
        resposta.tipo = "pendente";
        resposta.mensagem = `Anotado na agenda, chefe! Não vou deixar você dar calote. Lembrete salvo nas tarefas pra não esquecer! 🗓️💸`;
        return res.status(200).json(resposta);
    }

    // H) TAREFAS NORMAIS
    if (frase.includes("vou") || frase.includes("preciso") || frase.includes("lembrar") || frase.includes("tarefa")) {
        resposta.categoria = "tarefa";
        resposta.tipo = "pendente";
        resposta.mensagem = sortearMsg(msgTarefas, "");
        return res.status(200).json(resposta);
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    return res.status(200).json(resposta);
};
