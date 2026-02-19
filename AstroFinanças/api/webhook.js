export default async function handler(req, res) {
    // 1. Só aceita mensagens que vêm via POST (padrão de Webhooks)
    if (req.method !== 'POST') {
        return res.status(405).json({ erro: 'Método não permitido' });
    }

    try {
        // 2. Lê os dados que a DivPag enviou
        const dadosDivPag = req.body;
        console.log("Recebido da DivPag:", dadosDivPag);

        // Verifica se o status do pagamento é "Aprovado" ou "Pago"
        // (Isso varia na DivPag, geralmente é "approved" ou "PAID")
        const statusPagamento = dadosDivPag.status || dadosDivPag.status_pagamento;
        
        // Aqui pegamos o número do cliente que a DivPag nos devolve
        // Geralmente vem no campo "reference", "external_reference" ou "cliente_telefone"
        const telefoneCliente = dadosDivPag.reference || dadosDivPag.external_reference;

        if (statusPagamento === 'approved' || statusPagamento === 'PAID') {
            
            // 3. Conecta no Supabase e ativa o cliente
            const urlAstro = 'https://zqvfnykxwlcozvawqgrn.supabase.co';
            const chaveAstro = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdmZueWt4d2xjb3p2YXdxZ3JuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDkzNDQsImV4cCI6MjA4NTMyNTM0NH0.CevpF9vP4748mb2vFNsOp5Kq6u7Nfp_100bJcW7ogUQ';

            const supabaseApiUrl = `${urlAstro}/rest/v1/clientes?telefone=eq.${telefoneCliente}`;

            const respostaSupabase = await fetch(supabaseApiUrl, {
                method: 'PATCH',
                headers: {
                    'apikey': chaveAstro,
                    'Authorization': `Bearer ${chaveAstro}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ assinatura_ativa: true }) // A MÁGICA ACONTECE AQUI!
            });

            if (!respostaSupabase.ok) {
                throw new Error("Erro ao atualizar o Supabase");
            }

            // Responde para a DivPag que deu tudo certo!
            return res.status(200).json({ sucesso: true, mensagem: `Cliente ${telefoneCliente} ativado com sucesso!` });
        } else {
            // Se o pagamento foi recusado ou ainda está pendente
            return res.status(200).json({ aviso: 'Pagamento não está aprovado ainda.' });
        }

    } catch (erro) {
        console.error("Erro no Webhook:", erro);
        return res.status(500).json({ erro: 'Erro interno no servidor' });
    }
}