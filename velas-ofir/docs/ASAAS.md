# ASAAS: pedidos assistidos e homologação

A integração está implementada no painel em **Pedidos e ASAAS**, para owner/admin com MFA. Nesta etapa, a equipe escolhe um produto ou tipo de ingresso por pedido, confirma quantidade, frete e condições e gera um link de checkout hospedado. A loja pública continua no fluxo de contato; não foi liberado checkout automático, emissão de ingresso/QR, check-in ou envio de e-mails.

## Configuração local de sandbox

Preencha diretamente em `.env.local`, sem enviar os valores ao chat:

- `ASAAS_ENVIRONMENT=sandbox`
- `ASAAS_API_KEY`: chave da conta sandbox do ASAAS, independente de produção.
- `ASAAS_WEBHOOK_TOKEN`: segredo aleatório de pelo menos 32 caracteres, igual ao `authToken` cadastrado no ASAAS.
- `SUPABASE_SECRET_KEY`: chave exclusivamente do servidor, já usada pelo projeto.
- `NEXT_PUBLIC_SITE_URL`: origem do site; localhost é aceito apenas em sandbox.
- `ASAAS_SANDBOX_ENABLED=true`: habilita somente a geração assistida de links de teste.

Mantenha `COMMERCE_ENABLED=false`, `ASAAS_PRODUCTION_APPROVED=false` e `REDIS_ENABLED=false`. As chaves ASAAS e do webhook ainda não estavam preenchidas ao concluir esta implementação. Nenhuma cobrança ou pedido de teste foi criado na conta remota. O código foi validado com testes locais; a homologação na conta ASAAS depende dessas configurações.

## Webhook

No ASAAS do mesmo ambiente, cadastre uma URL HTTPS acessível publicamente:

`https://SEU_DOMINIO/api/webhooks/asaas`

Configure entrega `SEQUENTIALLY` e os eventos `CHECKOUT_CREATED`, `CHECKOUT_PAID`, `CHECKOUT_CANCELED` e `CHECKOUT_EXPIRED`. Informe o mesmo segredo de `ASAAS_WEBHOOK_TOKEN` no campo `authToken`. O ASAAS o envia no header `asaas-access-token`; isso não é a chave usada no header `access_token` das chamadas à API.

Localhost não recebe webhooks da internet. Não foi feito deploy, criado túnel nem cadastrado um webhook remoto. Use um ambiente HTTPS de homologação autorizado antes de pagar no sandbox.

## Comportamento implementado

- Migração `20261112215550_asaas_order_flow.sql`, tabelas `commerce_orders` e `asaas_events`, RLS e funções transacionais executáveis apenas pelo backend `service_role`. Não usa SECURITY DEFINER nas RPCs e não altera tabelas antigas de clientes/compras/pagamentos.
- Preço e disponibilidade são lidos do catálogo no banco. O total esperado pela equipe é comparado com o valor atual; alterações de preço impedem o pagamento até revisão. Estoque desconhecido deve ser conferido antes de cobrar. Encomendas exigem prazo de produção.
- Em sandbox, reservas são simuladas por ambiente: não baixam estoque real nem ocupam vagas de produção. Indicadores financeiros gerais incluem o legado e novos pedidos de produção, excluindo testes. Identidades são conciliadas por e-mail quando há correspondência no cadastro legado.
- O banco reserva estoque/vagas em transação, com bloqueio do produto/turma e limites por tipo de ingresso. Nome, quantidade, preço e frete ficam registrados no pedido. Ingressos gratuitos não passam pelo checkout pago.
- O ID do pedido funciona como chave de idempotência. Um pedido só pode ser reivindicado uma vez para criar checkout. O navegador guarda essa referência em `sessionStorage` para preservar a tentativa após atualização da página.
- Timeout, HTTP 5xx ou resposta inconclusiva mantêm pedido/reserva para conciliação; não há POST automático repetido. Rejeição explícita 400/401/403/404/422 libera a reserva. `CHECKOUT_CREATED` vincula o ID do checkout, inclusive quando recebido antes da persistência da resposta da API. O callback contém apenas o ID interno, sem dados pessoais.
- Webhook exige token válido, persiste o ID do evento e trata duplicatas atomicamente. Dados pessoais/cartão do payload não são armazenados. Total de itens recebido deve corresponder ao pedido para marcar como pago. Divergências e pagamento após liberação da reserva exigem revisão manual, sem reemitir vagas nem comprometer novo estoque.
- Callback do navegador nunca confirma compra. Cancelamentos são solicitados ao ASAAS; a reserva só é liberada após confirmação de cancelamento/expiração. A liberação é idempotente. Eventos antigos não desfazem pagamento já confirmado.
- A geração de links é restrita ao painel: a equipe deve conferir endereço, modalidade, frete, prazo e políticas com a cliente. Dados do cartão/CPF são informados diretamente na página do ASAAS; não são coletados pelo site. O nome/e-mail interno são referências de atendimento, não prova automática da identidade de quem pagou.

## Limites antes de produção

Produção permanece desativada. Além das credenciais de produção, o código exige `COMMERCE_ENABLED=true` e `ASAAS_PRODUCTION_APPROVED=true`; só configure após revisão das pendências abaixo e homologação. Não misture chave, webhook e ambiente. Antes de mudar o ambiente, concilie os pedidos pendentes no ambiente anterior.

- Revisão comercial/legal, CNPJ, conta ASAAS e condições de entrega aprovadas.
- Teste real em sandbox de Pix/cartão, webhook duplicado/atrasado, expiração e cancelamento; testes concorrentes em Postgres hospedado. PGlite valida lógica sequencial e permissões, não uma simulação completa de múltiplas conexões.
- Conciliação operacional de respostas inconclusivas e eventos sem vínculo. Esses eventos retornam erro temporário para o ASAAS reenviar; acompanhe a fila de webhooks.
- Reembolsos, chargebacks e demais eventos financeiros não estão automatizados. Eventos fora do conjunto de checkout são registrados como `unsupported` e exigem tratamento manual, sinalizado no painel. O painel de pedidos não deve ser usado como substituto da conciliação financeira no ASAAS.
- Não há reposição automática de produtos devolvidos, reembolso iniciado pelo site ou promessa de prazo/custo de frete calculado automaticamente. Estoque de devoluções só deve voltar após conferência física.
- Inscrições nominais, emissão de ingresso/QR, check-in, e-mails, sacola com múltiplos itens e checkout público ainda são etapas próprias.

Referências oficiais: [criar checkout](https://docs.asaas.com/reference/criar-novo-checkout), [eventos de checkout](https://docs.asaas.com/docs/eventos-para-checkout), [erros e boas práticas](https://docs.asaas.com/docs/erros-comuns-e-boas-pr%C3%A1ticas).
