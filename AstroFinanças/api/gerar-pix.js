export default async function handler(req, res) {
    // 1. Só aceita requisição POST
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    try {
        // 2. Recebe os dados do seu arquivo registro.html
        const { nome, cpf, telefone } = req.body;

        // 3. Suas credenciais seguras e escondidas no servidor
        const clientId = 'wrmonteiro_9698775123'; // 🔴 COLOQUE SEU ID AQUI
        const clientSecret = '05a6360e459d7cf2e28ba68e0abd94296826a1fe3c7273c5443bcc9bacc6f70c'; // 🔴 COLOQUE SUA CHAVE AQUI

        const divpagUrl = 'https://divpag.com/v3/pix/qrcode';

        // 4. Monta o pacote de dados para enviar à DivPag
        const dadosDivPag = new URLSearchParams();
        dadosDivPag.append('client_id', clientId);
        dadosDivPag.append('client_secret', clientSecret);
        dadosDivPag.append('nome', nome);
        dadosDivPag.append('cpf', cpf);
        dadosDivPag.append('valor', '14.99'); // PREÇO DA ASSINATURA
        dadosDivPag.append('descricao', 'Assinatura Mensal Astro');
        
        // Manda o telefone do cliente escondido no link pro Webhook saber quem pagou!
        dadosDivPag.append('urlnoty', `https://astrobot-ebon.vercel.app/api/webhook?telefone=${telefone}`);

        // 5. A Vercel conversa com a DivPag (Sem erro de CORS!)
        const respostaPix = await fetch(divpagUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: dadosDivPag
        });

        const pixJson = await respostaPix.json();

        // 6. Devolve o QRCode para a tela do usuário
        if (pixJson.qrcode) {
            return res.status(200).json({ qrcode: pixJson.qrcode });
        } else {
            return res.status(400).json({ erro: pixJson.message || 'Erro na DivPag' });
        }

    } catch (erro) {
        console.error("Erro ao gerar PIX:", erro);
        return res.status(500).json({ erro: 'Erro interno no servidor' });
    }

}
