# Cinkacka Bot - Agent Instructions

## Commands

### Development
- `bun run dev` - Start development server with watch mode (hot reload)
- `bun run <script>` - Run any package.json script

### Database (Drizzle ORM)
- `bun run db:generate` - Generate migration files from schema changes
- `bun run db:migrate` - Apply migrations to the database
- `bun run db:push` - Push schema directly to database (for dev)
- `bun run db:studio` - Open Drizzle Studio for database inspection

### Testing
No test framework is currently set up. Use `bun test <file>` if tests are added.

## Code Style

### Imports
- Use ES modules: `import { x } from "package"`
- Local modules use relative paths: `import { x } from "./file"`
- Load dotenv explicitly: `import 'dotenv/config'` at top of files
- Group imports: external packages first, then local modules

### TypeScript
- Strict mode enabled with `noUncheckedIndexedAccess` and `noImplicitOverride`
- Use `int({ mode: 'boolean' })` for Drizzle boolean fields
- Type assertions used sparingly: `as any` only when necessary (e.g., AI SDK compatibility)
- Non-null assertions (`!`) used for guaranteed values like env vars

### Formatting
- 4-space indentation
- Semicolons always used
- Trailing commas in multi-line objects, arrays, function calls
- Consistent spacing: space after keywords, around operators

### Naming Conventions
- Variables/functions: `camelCase`
- Types/interfaces: `PascalCase`
- Database tables: `snake_case` (e.g., `video_ideas`)
- Schema exports: `PascalCase` mapping to tables (e.g., `videoIdeas`)
- Tool functions: `camelCase` starting with action (e.g., `getDbSchema`)

### Error Handling
- Always wrap async operations in try-catch blocks
- Extract error messages: `error instanceof Error ? error.message : String(error)`
- Log errors: `console.error("Context:", error)`
- Return error objects: `{ error: string }` pattern
- Fail gracefully: continue execution or return meaningful errors

### Comments
- Use JSDoc-style comments for complex functions
- Keep comments concise and explanatory
- Comment "why" not "what"

### Project Architecture

#### Bot Structure
- Two bot modes: owner (full access) and guest (limited access)
- Owner bot: AI-powered assistant with tools, image OCR, code execution
- Guest bot: Limited functionality based on friend approval status

#### Database (Drizzle ORM + Turso/LibSQL)
- Schema in `src/db/schema.ts`
- Client in `src/db/client.ts`
- Utility functions in `src/db/utils.ts`
- All tables have `id` (auto-increment int primary key) and `created` (date)

#### AI Tools Pattern
Define tools using `tool()` from `ai` SDK:
```ts
const toolName = tool({
  description: "Tool description",
  inputSchema: z.object({ ... }),
  execute: async ({ param1, param2 }) => {
    try {
      // Logic
      return result;
    } catch (error) {
      console.error("Error in toolName:", error);
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
});
```

#### Scheduling
- Use `croner` package for cron jobs
- Store scheduled messages in `scheduledMessages` table
- Jobs tracked in-memory with `Map<number, Cron>`
- Timezone: `Europe/Vienna`

## Environment Variables
Required in `.env`:
- `BOT_TOKEN` - Telegram bot token
- `OWNER_CHAT_ID` - Owner's Telegram chat ID (string)
- `TURSO_DATABASE_URL` - Turso database URL
- `TURSO_AUTH_TOKEN` - Turso auth token
- `DEFAULT_MODEL` - Default AI model (e.g., `mistral-large-latest`)

## Key Libraries
- **gramio**: Telegram bot framework
- **drizzle-orm**: TypeScript ORM for database operations
- **@ai-sdk/mistral** + **@openrouter/ai-sdk-provider**: AI model providers
- **@e2b/code-interpreter**: Code execution in sandbox
- **croner**: Job scheduling

## Patterns to Follow

### Database CRUD
Use `db_crud` tool pattern for operations:
```ts
// Create
await db.insert(tableName).values(data).returning();
// Read
await db.select().from(tableName);
// Update
await db.update(tableName).set(data).where(eq(tableName.id, id)).returning();
// Delete
await db.delete(tableName).where(eq(tableName.id, id)).returning();
```

### Telegram Message Sending
Owner: `sendTelegramMessageToOwner()`, `sendTelegramImageToOwner()`
Guest: `sendTelegramMessageToChat(chatId, ...)`, `sendTelegramImageToChat(chatId, ...)`

### In-Memory State
Use `Map` for tracking state: `const activeJobs = new Map<number, Cron>()`
