# Checkout Pro Mercado Pago

O site usa a Orders API do Checkout Pro: o servidor cria uma order com preço recalculado do catálogo e redireciona o cliente para `checkout_url`. O navegador nunca define o valor final e o retorno do checkout não confirma pagamento.

## Variáveis

- `MERCADO_PAGO_ACCESS_TOKEN`: Access Token privado da aplicação Mercado Pago.
- `MERCADO_PAGO_WEBHOOK_SECRET`: assinatura secreta gerada na configuração de Webhooks.
- `NEXT_PUBLIC_SITE_URL`: domínio HTTPS público do site.

Configure as variáveis apenas no servidor de produção e no ambiente de teste correspondente. Não use prefixo `NEXT_PUBLIC_` nos tokens.

## Webhook

No painel do Mercado Pago, abra a aplicação, configure Webhooks para Teste e Produção, informe `https://SEU_DOMINIO/api/webhooks/mercado-pago` e habilite o evento **Order (Mercado Pago)**. Salve a assinatura secreta em `MERCADO_PAGO_WEBHOOK_SECRET`.

O endpoint valida `x-signature` por HMAC-SHA256, consulta a order em `/v1/orders/{id}`, compara referência, moeda e valor pago, e registra eventos idempotentes. Somente pagamento aprovado atualiza o pedido para `payment_confirmed`. Prepare, envio e entrega são atualizados pela equipe em **Administração → Pedidos e entregas**.

## Cliente e frete

`/conta/acessar` cria usuário com e-mail/senha Supabase Auth e dados cadastrais. Perfil, data de nascimento e endereço ficam em `customer_profiles`; carrinho sincronizado em `customer_cart`; compras e snapshot dos itens em `customer_orders`. RLS limita perfil, carrinho e histórico ao dono. A senha fica somente no Supabase Auth.

O frete de produtos é cotado manualmente depois da compra e não integra o valor cobrado no checkout. O endereço cadastrado acompanha o pedido. Workshops não têm frete.

## Ativação

As migrations `20261124203953_mercado_pago_customer_checkout.sql` e `20261124211503_catalog_payment_preferences.sql` estão aplicadas no Supabase. Preencha as três variáveis acima no deploy e configure a URL/tópico do Webhook no painel antes de processar compras reais.

## Preferência por produto e workshop

No cadastro/edição do admin, escolha um modelo: padrão do Mercado Pago, cartão à vista, até 3x, 6x ou 12x, ou sem boleto. O checkout envia as restrições por order. Em carrinhos mistos, aplica o menor limite de parcelas e reúne os meios excluídos. O Mercado Pago continua oferecendo os meios habilitados pela conta. A preferência pode excluir meios e limitar parcelas pela Orders API: [documentação oficial](https://www.mercadopago.com.br/developers/en/docs/checkout-pro-orders/additional-settings/exclude-payment-methods?scope=prod).

