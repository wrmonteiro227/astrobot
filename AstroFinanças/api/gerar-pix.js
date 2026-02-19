export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { nome, tel, cpf } = req.body;

    // Coloque suas credenciais reais da DivPag aqui:
    const CLIENT_ID = 'SEU_CLIENT_ID_AQUI'; 
    const CLIENT_SECRET = 'SUA_SECRET_KEY_AQUI';

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('nome', nome);
        params.append('cpf', cpf);
        params.append('valor', '29.90');
        params.append('descricao', 'Assinatura Astro');
        // Este link avisa ao Webhook quem pagou:
        params.append('urlnoty', `https://astrobot-ebon.vercel.app/api/webhook?telefone=${tel}`);

        const resposta = await fetch('https://divpag.com/v3/pix/qrcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const data = await resposta.json();

        if (data.qrcode) {
            return res.status(200).json({ qrcode: data.qrcode });
        } else {
            return res.status(400).json({ erro: data.message || 'Erro na DivPag' });
        }
    } catch (error) {
        return res.status(500).json({ erro: 'Erro interno no servidor' });
    }
}
