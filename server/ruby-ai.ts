// server/ruby-ai.ts

export async function processRubyMessage(message: string): Promise<string> {
  try {
    // Normaliza mensagem
    const text = message.trim().toLowerCase();

    // Respostas para comandos básicos
    if (text === "/start") {
      return "👋 Olá! Eu sou o Ruby Assistente de Ocorrências.\n\nUse /login para acessar ou digite sua mensagem.";
    }

    if (text === "/login") {
      return "🔑 Para fazer login, informe seu *login* e *senha* no formato:\n\n`login:seu_login senha:sua_senha`";
    }

    if (text.includes("ocorrência")) {
      return "📝 Recebi sua solicitação de ocorrência. Nossa equipe irá analisar!";
    }

    // Resposta padrão
    return "🤖 Não entendi sua mensagem. Use /start para começar.";
  } catch (err) {
    console.error("Erro dentro do ruby-ai.ts:", err);
    return "⚠️ Ocorreu um erro interno ao processar sua mensagem.";
  }
}
