// ATENÇÃO: Este arquivo é PURO JAVASCRIPT. Não use <script> aqui.
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

    const { nome, tel, cpf } = req.body;

    // Coloque suas credenciais reais aqui
    const CLIENT_ID = 'wrmonteiro_9698775123'; 
    const CLIENT_SECRET = '05a6360e459d7cf2e28ba68e0abd94296826a1fe3c7273c5443bcc9bacc6f70c';

    try {
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('nome', nome);
        params.append('cpf', cpf);
        params.append('valor', '29.90');
        params.append('descricao', 'Assinatura Astro');
        params.append('urlnoty', `https://astrobot-ebon.vercel.app/api/webhook?telefone=${tel}`);

        const resposta = await fetch('https://divpag.com/v3/pix/qrcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        const data = await resposta.json();

        if (data.qrcode) {
            res.status(200).json({ qrcode: data.qrcode });
        } else {
            res.status(400).json({ erro: data.message || 'Erro na DivPag' });
        }
    } catch (error) {
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
}
