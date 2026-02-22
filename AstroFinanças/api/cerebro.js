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
        .replace(/\b(ol[aá]|oi|bom dia|boa tarde|boa noite|eu|que|gastei|comprei|paguei|custou|saiu|recebi|ganhei|entrou|vendi|hoje|ontem|amanh[aã]|r\$|reais|exagerei|acho otimo|com|na|no|o|a|para|desse|mes|fui|irei|vou|preciso|lembrar|lembre|lembrete|me|de|fazer|guardei|guardar|poupei|economizei|come[çc]arei|proxima|semana|juntei|juntar|junto|adicionei|depositei|depostei|deposito|conta|oque|o que|tenho|mostre|mostrar|quando|qual dia|que dia|mandar|segunda|ter[çc]a|quarta|quinta|sexta|s[aá]bado|domingo|feira|devedor|devedores|algo|estou|devendo|terei|astro|quantas|quantos|pessoas|algum|compromisso)\b/g, ' ');

    let descFinanca = textoBase.replace(/\d+(?:[.,]\d+)?/g, '').replace(/\s+/g, ' ').trim();
    let descTarefa = textoBase.replace(/\s+/g, ' ').trim();

    descFinanca = descFinanca ? descFinanca.charAt(0).toUpperCase() + descFinanca.slice(1) : "";
    descTarefa = descTarefa ? descTarefa.charAt(0).toUpperCase() + descTarefa.slice(1) : "";

    if (descFinanca === "") descFinanca = "Registro financeiro";
    if (descTarefa === "") descTarefa = "Lembrete";

    let resposta = {
        categoria: "conversa", tipo: null, periodo: null, valor: null, termo_busca: null, descricao_limpa: null,
        mensagem: `Opa, parceiro! Sobre esse assunto eu não vou conseguir te ajudar. Minha missão aqui é única: tirar o peso das suas costas e organizar as finanças, reservas e tarefas que sobrecarregam o seu dia a dia. Manda aí um gasto, um ganho, um valor guardado ou um lembrete pra gente focar no que importa! 🚀💼`
    };

    if (/^(ol[aá]|oi|bom dia|boa tarde|boa noite)( astro)?$/i.test(frase)) {
        resposta = { categoria: "conversa", mensagem: `E aí, parceiro! O Astro tá na área. Pronto pra anotar seus gastos, tarefas, cobrar dívidas e trancar grana no cofre. O que manda hoje? 🚀` };
        return res.status(200).json(resposta);
    }

    if (frase.startsWith("apagar ") || frase.startsWith("limpar ") || frase.includes("apagar tudo") || frase.includes("limpar tudo")) {
        if (frase !== "apagar" && frase !== "limpar" && frase !== "apagar tudo" && frase !== "limpar tudo") {
            resposta = { categoria: "conversa", mensagem: `⚠️ Para iniciar a limpeza do sistema de forma segura, me envie somente a palavra "limpar" ou "apagar" para que eu possa lhe enviar as opções do que pode ser apagado.` };
            return res.status(200).json(resposta);
        }
    }

    const ehPergunta = frase.includes("?") || frase.includes("quem") || frase.includes("quanto") || frase.includes("quantos") || frase.includes("quantas") || frase.includes("quais") || frase.includes("qual") || frase.includes("oque") || frase.includes("o que") || frase.includes("extrato") || frase.includes("lista") || frase.includes("resumo") || frase.includes("mostre") || frase.includes("mostrar") || frase.includes("quando") || frase.includes("que dia") || frase.includes("devedores") || frase.includes("tenho algo") || frase.includes("algum compromisso");

    let matchPagou = frase.match(/([a-zãõáéíóúç0-9\s]+)\s+(?:me\s+)?pagou/);
    if (matchPagou && !ehPergunta) {
        let partesNome = matchPagou[1].trim().split(" ");
        let nomeDevedor = partesNome[partesNome.length - 1]; 
        if(nomeDevedor === "o" || nomeDevedor === "a" || nomeDevedor === "que" || nomeDevedor === "ja") nomeDevedor = partesNome[partesNome.length - 2] || nomeDevedor;
        
        resposta = { categoria: "exclusao", tipo: "financas", termo_busca: nomeDevedor, mensagem: `Justo! O ${nomeDevedor} honrou o compromisso. 🤝` };
        return res.status(200).json(resposta);
    }

    let matchQuantoDeve = frase.match(/quanto\s+([a-zãõáéíóúç\s]+)\s+me\s+deve/);
    if (matchQuantoDeve) {
        let nomeConsulta = matchQuantoDeve[1].trim();
        resposta = { categoria: "consulta", tipo: "dividas", termo_busca: nomeConsulta, mensagem: `Consultando a ficha do ${nomeConsulta} aqui nas dívidas... 🔎👇` };
        return res.status(200).json(resposta);
    }

    if (frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/) && valor) {
        let matchDeve = frase.match(/([a-zãõáéíóúç\s]+)\s+me\s+deve/);
        let partesNome = matchDeve[1].trim().split(" ");
        let nomeDevedor = partesNome[partesNome.length - 1];
        if(nomeDevedor === "o" || nomeDevedor === "a" || nomeDevedor === "que") nomeDevedor = partesNome[partesNome.length - 2] || nomeDevedor;
        
        resposta = { categoria: "financa", tipo: "divida", valor: valor, descricao_limpa: `Dívida de ${nomeDevedor}`, mensagem: `Tá no caderninho! ✍️ ${nomeDevedor} te deve R$ ${valor}.` };
        return res.status(200).json(resposta);
    }

    if (ehPergunta) {
        resposta.categoria = "consulta";
        resposta.periodo = frase.includes("semana") ? "semana" : frase.includes("mes") ? "mes" : "hoje";

        if (frase.includes("guardado") || frase.includes("cofre") || frase.includes("reserva") || frase.includes("guardei") || frase.includes("guardar") || frase.includes("poupanca") || frase.includes("poupei") || frase.includes("juntei") || frase.includes("juntar") || frase.includes("junto") || frase.includes("deposit")) {
            resposta.tipo = "reserva"; resposta.mensagem = "Abrindo o cofre pra ver como tá a sua construção de riqueza: 🏦👇";
        } else if (frase.includes("deve") || frase.includes("devendo") || frase.includes("divida") || frase.includes("devedor") || frase.includes("pagou") || frase.includes("pagaram") || frase.includes("pessoas")) {
            resposta.tipo = "dividas"; resposta.mensagem = "Lista de quem tá no caderninho (Dívidas): 📜👇";
        } else if (frase.includes("tarefa") || frase.includes("fazer") || frase.includes("fui") || frase.includes("irei") || frase.includes("lembretes") || frase.includes("tenho") || frase.includes("quando") || frase.includes("que dia") || frase.includes("algo") || frase.includes("compromisso")) {
            resposta.tipo = "tarefas"; resposta.mensagem = "Buscando na sua agenda de tarefas: 🎯👇";
        } else if (
