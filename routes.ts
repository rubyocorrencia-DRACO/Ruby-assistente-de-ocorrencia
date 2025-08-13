import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeGoogleSheets, buscarUsuario, validarFormatoLogin } from "./google-sheets";
import { GitHubIntegration } from "./github-integration";
import { getBot } from "./bot/index";
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all users
  app.get("/api/usuarios", async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      keepAlive: "active"
    });
  });

  // Telegram webhook endpoint for production
  app.post("/webhook/telegram", (req, res) => {
    const bot = getBot();
    if (bot && process.env.NODE_ENV === 'production') {
      try {
        bot.processUpdate(req.body);
        res.sendStatus(200);
      } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.sendStatus(500);
      }
    } else {
      res.sendStatus(404);
    }
  });

  // Generate HTML documentation 
  app.get("/api/generate-pdf", async (req, res) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ruby Ocorrências Bot - Preview das Interfaces</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; color: #333; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            h1 { text-align: center; margin-bottom: 30px; color: #333; font-size: 28px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .interface-card { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { padding: 20px; color: white; font-weight: bold; font-size: 18px; }
            .header.tecnico { background: #3b82f6; }
            .header.admin { background: #dc2626; }
            .content { padding: 20px; }
            .command-example { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 15px; }
            .command-input { background: #e3f2fd; color: #1976d2; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; display: inline-block; margin-bottom: 10px; }
            .command-output { background: white; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 11px; line-height: 1.4; }
            .command-output.admin { border-left-color: #f44336; }
            .commands-list { border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; }
            .command-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
            .command-code { font-family: monospace; font-weight: bold; }
            .workflow { background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); padding: 20px; margin-top: 30px; }
            .workflow-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px; }
            .workflow-step { text-align: center; padding: 15px; border: 1px solid #e9ecef; border-radius: 6px; }
            .workflow-step.tecnico { background: #e3f2fd; }
            .workflow-step.admin { background: #fff3e0; }
            .workflow-step.final { background: #e8f5e8; }
            .emoji { font-size: 24px; margin-bottom: 10px; }
            h2 { font-size: 16px; margin-bottom: 10px; }
            h3 { font-size: 14px; margin-bottom: 8px; }
            h4 { font-size: 12px; margin-bottom: 5px; }
            p { font-size: 11px; margin-bottom: 5px; }
            .subtitle { font-size: 12px; opacity: 0.8; margin-top: 5px; }
            .print-info { text-align: center; margin: 20px 0; padding: 15px; background: #e3f2fd; border-radius: 8px; }
            @media print {
              body { background: white; }
              .print-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Ruby Ocorrências Bot - Preview das Interfaces</h1>
            
            <div class="print-info">
              <p><strong>Para salvar como PDF:</strong> Use Ctrl+P (ou Cmd+P no Mac) e selecione "Salvar como PDF" no destino</p>
            </div>
            
            <div class="grid">
              <!-- Interface do Técnico -->
              <div class="interface-card">
                <div class="header tecnico">
                  👷 Interface do Técnico
                  <div class="subtitle">Comandos disponíveis para técnicos em campo</div>
                </div>
                
                <div class="content">
                  <div class="command-example">
                    <div class="command-input">/buscar 123456789</div>
                    <div class="command-output">
                      <strong>📋 Contrato 123456789</strong><br>
                      <strong>📊 2 ocorrências encontradas</strong><br><br>
                      <strong>🔹 ID 1A9B7F3C</strong><br>
                      <strong>📄 CONTRATO:</strong> 123456789<br>
                      <strong>👤</strong> NATALI BOCAIUVA<br>
                      <strong>👷 TÉCNICO:</strong> VANESSA M.<br>
                      <strong>🔧</strong> Rede Externa<br>
                      <strong>📊</strong> 📄 Em análise<br>
                      <strong>⏰</strong> 18/07, 10:15<br><br>
                      <strong>🔹 ID X8M4K7P9</strong><br>
                      <strong>📄 CONTRATO:</strong> 123456789<br>
                      <strong>👤</strong> NATALI BOCAIUVA<br>
                      <strong>👷 TÉCNICO:</strong> VANESSA M.<br>
                      <strong>🔧</strong> Rede Externa NAP GPON<br>
                      <strong>📊</strong> 🟢 Atuado<br>
                      <strong>⏰</strong> 19/07, 08:30
                    </div>
                  </div>

                  <div class="commands-list">
                    <h3>📋 Comandos Disponíveis</h3>
                    <div class="command-row">
                      <span class="command-code">/start</span>
                      <span>Iniciar bot</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/login</span>
                      <span>Fazer login</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/ocorrencia</span>
                      <span>Nova ocorrência</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/historico</span>
                      <span>Ver histórico</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/status &lt;contrato&gt;</span>
                      <span>Status por contrato</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/buscar &lt;contrato&gt;</span>
                      <span>Buscar em grupos</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Interface do Administrador -->
              <div class="interface-card">
                <div class="header admin">
                  🎛️ Interface do Administrador
                  <div class="subtitle">Comandos master para gestão de ocorrências</div>
                </div>
                
                <div class="content">
                  <div class="command-example">
                    <div class="command-input">/master</div>
                    <div class="command-output admin">
                      <strong>🎛️ SISTEMA MASTER - Pendências</strong><br>
                      <strong>📄 4 ocorrências aguardando análise</strong><br><br>
                      <strong>🔹 ID 1A9B7F3C</strong><br>
                      <strong>📄 CONTRATO:</strong> 123456789<br>
                      <strong>👤</strong> NATALI BOCAIUVA<br>
                      <strong>🔧</strong> Rede Externa<br>
                      <strong>📊</strong> 📄 Em análise<br>
                      <strong>⏰</strong> 18/07, 10:15<br><br>
                      <strong>🔹 ID Z4K8M2N1</strong><br>
                      <strong>📄 CONTRATO:</strong> 12345<br>
                      <strong>👤</strong> LUCAS COSTA<br>
                      <strong>🔧</strong> Backbone<br>
                      <strong>📊</strong> 📄 Em análise<br>
                      <strong>⏰</strong> 17/07, 14:22<br><br>
                      💡 Para gerenciar: /gerenciar &lt;ID&gt;<br>
                      📋 Exemplo: /gerenciar 1A9B7F3C
                    </div>
                  </div>

                  <div class="command-example">
                    <div class="command-input">/atualizar 123456789 Atuado</div>
                    <div class="command-output" style="border-left-color: #4caf50;">
                      <strong>✅ Status atualizado com sucesso</strong><br><br>
                      <strong>📋 Contrato:</strong> 123456789<br>
                      <strong>📊 Novo status:</strong> 🟢 Atuado<br>
                      <strong>🔄 Ocorrências atualizadas:</strong> 2<br><br>
                      <strong>⏰ Atualizado por:</strong> ADMIN MASTER<br>
                      <strong>🕐 Data:</strong> 19/07/2025, 11:05:23
                    </div>
                  </div>

                  <div class="commands-list">
                    <h3>🎛️ Comandos Master</h3>
                    <div class="command-row">
                      <span class="command-code">/master</span>
                      <span>Ver pendências</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/gerenciar &lt;ID&gt;</span>
                      <span>Alterar status</span>
                    </div>
                    <div class="command-row">
                      <span class="command-code">/atualizar &lt;contrato&gt; &lt;status&gt;</span>
                      <span>Atualizar em grupos</span>
                    </div>
                    
                    <h4 style="margin-top: 10px;">📊 Status Disponíveis</h4>
                    <div style="font-size: 11px; margin-top: 5px;">
                      📄 Em análise (padrão)<br>
                      🟠 Devolutiva (sem problema)<br>
                      🟢 Atuado (resolvido)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fluxo de trabalho -->
            <div class="workflow">
              <h2>🔄 Fluxo de Trabalho</h2>
              <div class="workflow-grid">
                <div class="workflow-step tecnico">
                  <div class="emoji">👷</div>
                  <h3>1. Técnico</h3>
                  <p>Cria ocorrência via /ocorrencia</p>
                  <p>Status inicial: 📄 Em análise</p>
                </div>
                <div class="workflow-step admin">
                  <div class="emoji">🎛️</div>
                  <h3>2. Admin</h3>
                  <p>Vê pendência no /master</p>
                  <p>Altera status via /gerenciar</p>
                </div>
                <div class="workflow-step final">
                  <div class="emoji">✅</div>
                  <h3>3. Finalização</h3>
                  <p>Status: 🟠 Devolutiva ou 🟢 Atuado</p>
                  <p>Sai automaticamente do /master</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
      
    } catch (error) {
      console.error('Erro ao gerar documentação:', error);
      res.status(500).json({ message: 'Erro ao gerar documentação', error: error.message });
    }
  });

  // Test Google Sheets integration
  app.get("/api/test-google-sheets", async (req, res) => {
    try {
      const sheetsInitialized = initializeGoogleSheets();
      const testLogin = "Z123456";
      const formatoValido = validarFormatoLogin(testLogin);
      
      let usuario = null;
      let erro = null;
      
      try {
        usuario = await buscarUsuario(testLogin);
      } catch (error) {
        erro = error.message;
      }
      
      res.json({
        sheetsInitialized,
        formatoValido,
        testLogin,
        usuario,
        erro,
        hasCredentials: !!process.env.GOOGLE_CREDENTIALS_JSON
      });
    } catch (error) {
      console.error("Erro no teste Google Sheets:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error.message 
      });
    }
  });

  // User endpoints
  app.get("/api/users/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Ocorrência endpoints
  app.get("/api/users/:telegramId/ocorrencias", async (req, res) => {
    try {
      const { telegramId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      const ocorrencias = await storage.getOcorrenciasByUserId(user.id, limit);
      res.json(ocorrencias);
    } catch (error) {
      console.error("Erro ao buscar ocorrências:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/ocorrencias/contrato/:numero", async (req, res) => {
    try {
      const { numero } = req.params;
      const ocorrencias = await storage.getOcorrenciasByContrato(numero);
      res.json(ocorrencias);
    } catch (error) {
      console.error("Erro ao buscar ocorrências por contrato:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/ocorrencias", async (req, res) => {
    try {
      const ocorrencia = await storage.createOcorrencia(req.body);
      res.status(201).json(ocorrencia);
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/ocorrencias/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ocorrencia = await storage.updateOcorrencia(parseInt(id), req.body);
      
      if (!ocorrencia) {
        return res.status(404).json({ message: "Ocorrência não encontrada" });
      }
      
      res.json(ocorrencia);
    } catch (error) {
      console.error("Erro ao atualizar ocorrência:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // GitHub Integration Routes
  app.post("/api/github/setup", async (req, res) => {
    try {
      const { githubToken, owner, repo } = req.body;
      
      if (!githubToken || !owner || !repo) {
        return res.status(400).json({ 
          error: "Parâmetros obrigatórios: githubToken, owner, repo" 
        });
      }

      const github = new GitHubIntegration({ 
        token: githubToken, 
        owner, 
        repo 
      });

      // Verificar se o token e repositório são válidos
      const repoExists = await github.checkRepository();
      
      res.json({
        success: true,
        message: repoExists ? "Repositório encontrado!" : "Repositório será criado",
        repositoryExists: repoExists,
        githubUrl: `https://github.com/${owner}/${repo}`
      });

    } catch (error) {
      console.error("Erro na configuração GitHub:", error);
      res.status(500).json({ 
        error: "Erro ao configurar GitHub", 
        details: error.message 
      });
    }
  });

  app.post("/api/github/deploy", async (req, res) => {
    try {
      const { githubToken, owner, repo } = req.body;
      
      if (!githubToken || !owner || !repo) {
        return res.status(400).json({ 
          error: "Parâmetros obrigatórios: githubToken, owner, repo" 
        });
      }

      const github = new GitHubIntegration({ 
        token: githubToken, 
        owner, 
        repo 
      });

      console.log(`🚀 Iniciando deploy para ${owner}/${repo}...`);
      
      const success = await github.deployFullProject();
      
      if (success) {
        res.json({
          success: true,
          message: "Deploy completo realizado com sucesso!",
          githubUrl: `https://github.com/${owner}/${repo}`,
          actionsUrl: `https://github.com/${owner}/${repo}/actions`
        });
      } else {
        res.status(500).json({
          error: "Falha no deploy automático"
        });
      }

    } catch (error) {
      console.error("Erro no deploy GitHub:", error);
      res.status(500).json({ 
        error: "Erro no deploy para GitHub", 
        details: error.message 
      });
    }
  });

  app.get("/api/github/status/:owner/:repo", async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const { githubToken } = req.query;
      
      if (!githubToken) {
        return res.status(400).json({ error: "GitHub token necessário" });
      }

      const github = new GitHubIntegration({ 
        token: githubToken as string, 
        owner, 
        repo 
      });

      const repoExists = await github.checkRepository();
      
      res.json({
        repositoryExists: repoExists,
        githubUrl: `https://github.com/${owner}/${repo}`,
        actionsUrl: `https://github.com/${owner}/${repo}/actions`,
        settings: `https://github.com/${owner}/${repo}/settings`
      });

    } catch (error) {
      console.error("Erro ao verificar status GitHub:", error);
      res.status(500).json({ 
        error: "Erro ao verificar repositório", 
        details: error.message 
      });
    }
  });

  // Download routes for GitHub deployment - WEBHOOK 24/7 FILES
  app.get("/api/github/download/server-index", (req, res) => {
    res.download(path.join(process.cwd(), "server/index.ts"), "index.ts");
  });

  app.get("/api/github/download/package-json", (req, res) => {
    res.download(path.join(process.cwd(), "package.json"), "package.json");
  });

  app.get("/api/github/download/render-yaml", (req, res) => {
    res.download(path.join(process.cwd(), "render.yaml"), "render.yaml");
  });

  app.get("/api/github/download/bot-index", (req, res) => {
    res.download(path.join(process.cwd(), "server/bot/index.ts"), "index.ts");
  });

  app.get("/api/github/download/server-routes", (req, res) => {
    res.download(path.join(process.cwd(), "server/routes.ts"), "routes.ts");
  });

  app.get("/api/github/download/replit-md", (req, res) => {
    res.download(path.join(process.cwd(), "replit.md"), "replit.md");
  });

  app.get("/api/github/download/webhook-setup", (req, res) => {
    res.download(path.join(process.cwd(), "docs/WEBHOOK_SETUP_RENDER.md"), "WEBHOOK_SETUP_RENDER.md");
  });

  app.get("/api/github/download/config-webhook", (req, res) => {
    res.download(path.join(process.cwd(), "CONFIGURACAO_RENDER_WEBHOOK.md"), "CONFIGURACAO_RENDER_WEBHOOK.md");
  });

  app.get("/api/github/download/package-lock", (req, res) => {
    res.download(path.join(process.cwd(), "package-lock.json"), "package-lock.json");
  });

  app.get("/api/github/download/ruby-ai", (req, res) => {
    res.download(path.join(process.cwd(), "server/bot/ruby-ai.ts"), "ruby-ai.ts");
  });

  app.get("/api/github/download/renderignore", (req, res) => {
    res.download(path.join(process.cwd(), ".renderignore"), ".renderignore");
  });

  app.get("/api/github/download/dockerignore", (req, res) => {
    res.download(path.join(process.cwd(), ".dockerignore"), ".dockerignore");
  });

  app.get("/api/github/download/nixpacks", (req, res) => {
    res.download(path.join(process.cwd(), "nixpacks.toml"), "nixpacks.toml");
  });

  // Telegram Webhook Route for Render deployment
  app.post("/webhook/telegram", async (req, res) => {
    try {
      // Import bot instance to handle webhook updates
      const { getBot } = await import("./bot");
      const bot = getBot();
      
      if (!bot) {
        console.error("Bot not initialized for webhook");
        return res.status(500).json({ error: "Bot not initialized" });
      }

      // Process the update
      await bot.processUpdate(req.body);
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
