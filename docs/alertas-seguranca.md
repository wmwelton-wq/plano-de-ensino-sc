# Alertas de segurança

Só 3 pessoas usam o aplicativo. Qualquer coisa fora disso gera alerta por e-mail para o administrador.

Banco (Supabase): `contas_autorizadas` (lista; e-mails exatos e um padrão para wm_welton e variações +teste), `alertas_seguranca` (histórico), `alertas_config` (token interno, sem acesso público).
Funções: `conta_autorizada`, `registrar_alerta`, `disparar_envio_alertas` (pg_net -> /api/alertas/enviar com o token), `reservar_alertas` e `concluir_alerta` (só funcionam com o token), `verificar_contas_nao_autorizadas` (pg_cron, a cada 5 min).
Gatilhos: login de conta fora da lista, conta criada fora da lista, e-mail alterado, papel (role) alterado, lista autorizada alterada.
Para autorizar alguém: inserir o e-mail em `contas_autorizadas` (isso também gera um alerta, de propósito).
Limite conhecido: tentativas de cadastro BLOQUEADAS são desfeitas pelo banco e não geram alerta (ficam nos logs de Auth do Supabase).
