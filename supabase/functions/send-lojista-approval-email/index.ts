// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface RequestData {
  email: string;
  name: string;
}

console.log("Edge Function: Send Lojista Approval Email");

Deno.serve(async (req) => {
  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse do corpo da requisição
    const { email, name }: RequestData = await req.json();

    // Validações básicas
    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Obter chave da API do Resend das variáveis de ambiente
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Preparar conteúdo do e-mail
    const subject = 'Seu cadastro como lojista foi aprovado 🎉';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #003049; text-align: center;">${subject}</h1>

            <p>Olá <strong>${name}</strong>!</p>

            <p>Seu cadastro como lojista no <strong>Portal Modelo</strong> foi aprovado com sucesso.</p>

            <p>Agora você já pode acessar o painel e cadastrar seus produtos ou serviços.</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #003049;">Próximos passos:</h3>
              <ul>
                <li>Acesse seu painel de lojista</li>
                <li>Cadastre suas informações da loja</li>
                <li>Adicione seus produtos ou serviços</li>
                <li>Comece a vender!</li>
              </ul>
            </div>

            <p>Desejamos muito sucesso nos seus negócios!</p>

            <p>Atenciosamente,<br>
            <strong>Equipe Portal Modelo</strong></p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="font-size: 12px; color: #666; text-align: center;">
              Esta é uma mensagem automática. Por favor, não responda este e-mail.
            </p>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Olá ${name}!

Seu cadastro como lojista no Portal Modelo foi aprovado com sucesso.

Agora você já pode acessar o painel e cadastrar seus produtos ou serviços.

Desejamos muito sucesso!
Equipe Portal Modelo
    `.trim();

    // Enviar e-mail via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portal Modelo <noreply@portalmodelo.com>',
        to: [email],
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const resendData = await resendResponse.json();
    console.log('Email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        emailId: resendData.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-lojista-approval-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"email":"lojista@email.com","name":"João Silva"}'

*/
