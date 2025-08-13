export async function processRubyMessage(text: string) {
  // Aqui você pode integrar GPT, OpenAI ou lógica própria
  return {
    message: `🤖 Ruby respondeu: "${text}"`,
    options: { parse_mode: 'Markdown' }
  };
}
