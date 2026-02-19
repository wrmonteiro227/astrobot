export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Apenas POST permitido' });
    }

    try {
        const dadosDivPag = req.body;
        console.log("Recebido PIX da DivPag:", dadosDivPag);

        const statusPagamento = dadosDivPag.status || dadosDivPag.status_pagamento;
        
        // A MÁGICA: A Vercel vai ler o Telefone direto do link que configuramos no registro.html
        const telefoneCliente = req.query.telefone; 

        if ((statusPagamento === 'approved' || statusPagamento === 'PAID') && telefoneCliente) {
            
            const urlAstro = 'https://zqvfnykxwlcozvawqgrn.supabase.co';
            const chaveAstro = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdmZueWt4d2xjb3p2YXdxZ3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDkzNDQsImV4cCI6MjA4NTMyNTM0NH0.CevpF9vP4748mb2vFNsOp5Kq6u7Nfp_100bJcW7ogUQ';

            const supabaseApiUrl = `${urlAstro}/rest/v1/clientes?telefone=eq.${telefoneCliente}`;

            // Ativa o cliente no banco de dados
            const respostaSupabase = await fetch(supabaseApiUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': chaveAstro,
                    'Authorization': `Bearer ${chaveAstro}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ assinatura_ativa: true }) 
            });

            if (!respostaSupabase.ok) throw new Error("Erro banco de dados");
            
            return res.status(200).json({ sucesso: true, mensagem: `Cliente ${telefoneCliente} ativado!` });
        } else {
            return res.status(200).json({ aviso: 'Aguardando pagamento / Telefone vazio.' });
        }

    } catch (erro) {
        return res.status(500).json({ erro: 'Erro interno' });
    }
}
