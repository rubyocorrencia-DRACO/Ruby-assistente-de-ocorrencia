# Ruby Ocorrências Bot – Telegram

## Overview
This project is a Telegram bot designed for registering and tracking technical occurrences in the field. It enables technicians to quickly and efficiently log incidents, offering features for authentication, historical tracking, and contract-based inquiries. The bot now integrates with external Fillout.com forms for occurrence data collection, bypassing direct in-chat input for user preference. It includes a master user system for occurrence management, unique IDs for each occurrence, and separate command functionalities for managers and technicians in Telegram groups. The system is designed for 24/7 operation with robust error recovery and continuous monitoring.

**Business Vision & Market Potential**: This bot streamlines field technical support operations, reducing manual data entry and improving incident response times. It offers a standardized, accessible platform for technicians, enhancing operational efficiency for service providers. Its modular design allows for easy adaptation to various field service scenarios, making it highly scalable.

**Project Ambition**: To be the go-to solution for field service management via Telegram, providing a seamless, reliable, and user-friendly experience for both technicians and managers, ultimately contributing to faster resolution times and better service quality.

## User Preferences
Preferred communication style: Simple Portuguese, everyday language (manter tudo em português).

## System Architecture

The application adopts a backend-centric architecture integrated with a Telegram bot.

### UI/UX Decisions
The bot's interface relies on Telegram's native UI elements, providing inline buttons for status changes and direct links to external forms. The design prioritizes simplicity and directness, aligning with the user's preference for simple language and straightforward interactions. HTML documentation is provided as an alternative to complex PDF dependencies, accessible via bot buttons.

### Technical Implementations
- **Backend**: Express.js server in TypeScript, handling REST API endpoints and Telegram bot operations.
- **Database**: PostgreSQL with Drizzle ORM for permanent data persistence.
- **Bot Integration**: `node-telegram-bot-api` library for Telegram API interaction.
- **Environment Handling**: Supports both development (polling) and production (webhook) environments, with automatic configuration for Render deployment.
- **Session Management**: Manages conversational flows and user authentication states.
- **Unique IDs**: Generates 8-character alphanumeric unique IDs for each occurrence for independent tracking.
- **Case-Insensitivity**: All commands function regardless of case (e.g., `/OCORRENCIA` or `/ocorrencia`).

### Feature Specifications
- **User Authentication**: Login system with permanent authentication. Master users have elevated privileges for managing occurrences.
- **Occurrence Registration**: Technicians initiate registration via `/ocorrencia`, then receive direct links to external Fillout.com forms based on selected occurrence type.
- **Occurrence Management (Master Users)**: `/master` to view pending occurrences, `/gerenciar <ID>` to change occurrence status (Em análise, Devolutiva, Atuado) via inline buttons.
- **Historical Tracking**: `/historico` displays user's past occurrences with unique IDs.
- **Status Inquiry**: `/status <contrato>` shows all occurrences for a given contract with their unique IDs.
- **Group Commands**:
    - `/atualizar <contrato> <status>` for managers in group chats.
    - `/buscar <contrato>` for technicians in group chats.
- **Keep-Alive System**: Implemented for 24/7 operation, including automatic pings, health checks, and error recovery for continuous uptime.

### System Design Choices
- **Hybrid Data Storage**: PostgreSQL as the primary database, complemented by Google Sheets for initial user authentication and new user registration (for "PANILHA DE COLABORADORES").
- **External Form Integration**: Utilizes Fillout.com forms for detailed occurrence data collection, shifting complex conversational forms out of the bot for simplified user experience.
- **Modular Design**: Separation of concerns between bot logic, database operations, and external API integrations.
- **Scalability**: Designed for continuous operation and easy deployment on platforms like Render.

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **node-telegram-bot-api**: Official library for Telegram Bot API.
- **drizzle-orm**: TypeScript ORM for database interactions.
- **express**: Web framework for building the backend server.
- **Fillout.com**: External platform for hosting occurrence forms.
- **Google Sheets API**: Used for user authentication and new user registration sheets.

### Development Tools
- **drizzle-kit**: Database migration and schema management.
- **tsx**: TypeScript execution for development.
- **esbuild**: JavaScript bundler for optimized production builds.

### Deployment Platform
- **Render**: Cloud platform for hosting the application, configured for 24/7 operation with webhook support.