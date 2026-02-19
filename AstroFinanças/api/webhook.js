export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ erro: 'Apenas POST' });

    try {
        const dadosDivPag = req.body;
        const statusPagamento = dadosDivPag.status || dadosDivPag.status_pagamento;
        
        // Ele pega o telefone que enviamos via URL no urlnoty
        const telefoneCliente = req.query.telefone; 

        if ((statusPagamento === 'approved' || statusPagamento === 'PAID') && telefoneCliente) {
            const urlAstro = 'https://zqvfnykxwlcozvawqgrn.supabase.co';
            const chaveAstro = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdmZueWt4d2xjb3p2YXdxZ3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDkzNDQsImV4cCI6MjA4NTMyNTM0NH0.CevpF9vP4748mb2vFNsOp5Kq6u7Nfp_100bJcW7ogUQ';

            const supabaseApiUrl = `${urlAstro}/rest/v1/clientes?telefone=eq.${telefoneCliente}`;

            await fetch(supabaseApiUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': chaveAstro,
                    'Authorization': `Bearer ${chaveAstro}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assinatura_ativa: true }) 
            });

            return res.status(200).json({ status: 'Cliente Ativado' });
        }
        return res.status(200).json({ status: 'Aguardando' });
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro no Webhook' });
    }
}
