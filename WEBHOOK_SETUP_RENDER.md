# Configuração Webhook para Render - Ruby Ocorrências Bot

## 🚀 Deploy no Render com Webhook 24/7

### 1. Preparação dos Arquivos

O sistema já está configurado para webhook no Render:
- ✅ Endpoint `/webhook/telegram` criado
- ✅ `render.yaml` atualizado com URL do webhook
- ✅ Bot configurado para modo webhook em produção

### 2. Deploy no Render

1. **Conectar repositório no Render:**
   - Vá para [render.com](https://render.com)
   - Conecte seu repositório GitHub
   - O Render detectará automaticamente o arquivo `render.yaml`

2. **Configurar variáveis de ambiente:**
   ```
   NODE_ENV=production
   TELEGRAM_BOT_TOKEN=seu_token_aqui
   TELEGRAM_WEBHOOK_URL=https://ruby-ocorrencias-bot.onrender.com
   DATABASE_URL=sua_url_postgresql
   GOOGLE_CREDENTIALS_JSON=suas_credenciais_google
   ```

### 3. Configuração Automática do Webhook

O bot configurará automaticamente o webhook quando deployado:
- URL: `https://ruby-ocorrencias-bot.onrender.com/webhook/telegram`
- Método: POST
- O Telegram enviará updates diretamente para esta URL

### 4. Verificação do Deploy

Após o deploy, verifique:

1. **Health Check:**
   ```bash
   curl https://ruby-ocorrencias-bot.onrender.com/api/health
   ```

2. **Status do Webhook:**
   - O bot deve mostrar no log: "Telegram bot initialized with webhook"
   - Teste enviando `/start` no Telegram

### 5. Diferenças: Webhook vs Polling

| Aspecto | Polling (Desenvolvimento) | Webhook (Produção/Render) |
|---------|---------------------------|---------------------------|
| **Funcionamento** | Bot pergunta ao Telegram por updates | Telegram envia updates automaticamente |
| **Quando funciona** | Apenas quando app está rodando localmente | Funciona 24/7, mesmo se você fechar o PC |
| **Recursos** | Usa mais CPU (verifica constantemente) | Mais eficiente (recebe apenas quando há mensagens) |
| **Configuração** | Simples (só precisa do token) | Requer URL pública e endpoint webhook |

### 6. Resolução de Problemas

**Se o bot não funcionar após deploy:**

1. **Verificar logs no Render:**
   - Vá no dashboard do Render
   - Clique em "Logs" para ver mensagens de erro

2. **Webhook não configurado:**
   ```bash
   # Verificar webhook atual do bot
   curl "https://api.telegram.org/bot<SEU_TOKEN>/getWebhookInfo"
   ```

3. **Forçar reconfiguração do webhook:**
   - Redeploy no Render
   - O bot tentará configurar o webhook novamente

### 7. Comandos de Teste

Após deploy bem-sucedido:
```
/start - Iniciar bot
/whoami - Ver status
/health - Teste básico
```

### 8. Monitoramento

O bot inclui:
- Health check em `/api/health` (usado pelo Render)
- Auto-recovery em caso de falhas
- Logs detalhados para debug

---

## ⚠️ IMPORTANTE

**Webhook vs Polling:**
- **Desenvolvimento (local):** Usa polling (bot pergunta por updates)
- **Produção (Render):** Usa webhook (Telegram envia updates automaticamente)

**Por que o bot para quando você fecha o PC:**
- No desenvolvimento, o bot roda no seu computador
- No Render, o bot roda nos servidores 24/7, independente do seu PC

**Configuração automática:**
- O código detecta automaticamente se está em produção
- Se `NODE_ENV=production` e `TELEGRAM_WEBHOOK_URL` existem = webhook
- Caso contrário = polling

---

✅ **Com essa configuração, o bot funcionará 24/7 no Render mesmo quando você fechar o sistema!**