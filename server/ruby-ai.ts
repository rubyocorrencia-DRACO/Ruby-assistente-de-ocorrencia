// ruby-ai.ts
export async function handleMessage(text: string): Promise<string> {
  text = text.toLowerCase();

  if (text.includes("oi") || text.includes("olá")) {
    return "👋 Olá! Eu sou a Ruby, sua assistente de ocorrências. Como posso ajudar?";
  }

  if (text.includes("ocorrência") || text.includes("abrir")) {
    return "📋 Para abrir uma ocorrência, me envie os seguintes dados:\n- Nome do técnico\n- Local da ocorrência\n- Descrição do problema";
  }

  if (text.includes("ajuda") || text.includes("suporte")) {
    return "🤝 Claro! Estou aqui para ajudar.\nVocê pode abrir uma ocorrência ou consultar informações de rede.";
  }

  if (text.includes("rede")) {
    return "🌐 Detectei que você mencionou *rede*. Deseja abrir uma ocorrência relacionada a Rede Externa ou Interna?";
  }

  return "❓ Não entendi sua mensagem. Digite *ajuda* para ver o que eu consigo fazer.";
}
