import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { setupCommands, handleCallbackQuery } from './commands';
import { processRubyAI } from './ruby-ai';
import { log } from '../vite';

let bot: TelegramBot | null = null;
let lastBotActivity = Date.now();

// Export function to get bot instance (for webhook)
export function getBot(): TelegramBot | null {
  return bot;
}

// Bot health monitoring
function setupBotHealthMonitoring(botInstance: TelegramBot) {
  // Monitor bot activity
  botInstance.on('message', () => {
    lastBotActivity = Date.now();
  });

  botInstance.on('callback_query', () => {
    lastBotActivity = Date.now();
  });

  // Check bot health every 5 minutes
  setInterval(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastBotActivity;
    const maxInactiveTime = 10 * 60 * 1000; // 10 minutes

    if (timeSinceLastActivity > maxInactiveTime) {
      log(`Bot inactive for ${Math.round(timeSinceLastActivity / 60000)} minutes`);
      
      // Test bot responsiveness
      testBotResponsiveness(botInstance);
    } else {
      log(`Bot health check: active (last activity ${Math.round(timeSinceLastActivity / 60000)} min ago)`);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Test if bot is responsive
async function testBotResponsiveness(botInstance: TelegramBot) {
  try {
    const me = await botInstance.getMe();
    log(`Bot responsiveness test passed: @${me.username}`);
    lastBotActivity = Date.now(); // Update activity since bot responded
  } catch (error) {
    log(`Bot responsiveness test failed: ${error.message}`);
    console.error('Bot health check failed:', error);
  }
}

export async function initBot(): Promise<TelegramBot> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
  }

  // In production (Render), use webhook mode
  // In development, use polling mode
  const isProduction = process.env.NODE_ENV === 'production';
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  
  if (isProduction && webhookUrl) {
    // Production mode with webhook
    bot = new TelegramBot(token, { webHook: true });
    const webhookPath = '/webhook/telegram';
    
    try {
      // Set webhook URL for Telegram
      await bot.setWebHook(`${webhookUrl}${webhookPath}`);
      log(`Telegram bot initialized with webhook: ${webhookUrl}${webhookPath}`);
    } catch (error) {
      log(`Failed to set webhook: ${error.message}`);
      // Fallback to polling if webhook fails
      bot = new TelegramBot(token, { polling: true });
      log('Falling back to polling mode due to webhook failure');
    }
  } else {
    // Enhanced polling with auto-recovery
    bot = new TelegramBot(token, { 
      polling: {
        interval: 300,  // Check every 300ms
        autoStart: true,
        params: {
          timeout: 10,  // Long polling timeout
        }
      }
    });
    
    // Setup automatic recovery for polling errors
    bot.on('polling_error', (error) => {
      log(`Polling error occurred: ${error.message}`);
      
      // Attempt to restart polling after 5 seconds
      setTimeout(() => {
        try {
          bot?.stopPolling();
          setTimeout(() => {
            if (bot && token) {
              bot.startPolling();
              log('Bot polling restarted after error');
            }
          }, 2000);
        } catch (restartError) {
          log(`Failed to restart polling: ${restartError.message}`);
        }
      }, 5000);
    });
    
    log('Telegram bot initialized with enhanced polling mode');
  }

  // Setup bot commands
  await setupCommands(bot);
  
  // Setup Ruby AI conversational system
  bot.on('message', async (msg) => {
    // Skip if message is a command (starts with /)
    if (msg.text && !msg.text.startsWith('/')) {
      try {
        const response = await processRubyAI(
          msg.from.id.toString(),
          msg.from.username || msg.from.first_name,
          msg.chat.id,
          msg.text
        );
        
        // Only send response if Ruby AI returned something (not null)
        if (response) {
          await bot.sendMessage(msg.chat.id, response, { 
            parse_mode: 'Markdown',
            reply_to_message_id: msg.message_id 
          });
        }
      } catch (error) {
        log(`Ruby AI error: ${error.message}`);
        console.error('Ruby AI processing error:', error);
      }
    }
  });
  
  // Setup callback query handler for inline buttons
  bot.on('callback_query', (query) => {
    handleCallbackQuery(bot, query);
  });

  // Error handling with recovery
  bot.on('error', (error) => {
    console.error('Telegram bot error:', error);
    log(`Bot error detected: ${error.message}`);
  });

  bot.on('polling_error', (error) => {
    console.error('Telegram polling error:', error);
    log(`Bot polling error: ${error.message}`);
    
    // Attempt to restart polling after polling errors
    if (!isProduction) {
      setTimeout(() => {
        try {
          log('Attempting to restart bot polling...');
          bot.startPolling({ restart: true });
        } catch (restartError) {
          console.error('Failed to restart bot polling:', restartError);
        }
      }, 5000); // Wait 5 seconds before restart
    }
  });

  // Setup bot health monitoring
  setupBotHealthMonitoring(bot);

  return bot;
}



export async function sendNotificationToUser(telegramId: string, message: string): Promise<void> {
  try {
    const botInstance = getBot();
    await botInstance.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`Failed to send notification to user ${telegramId}:`, error);
  }
}
