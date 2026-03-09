# mcp-protocol-guardian

## Role
Enforces MCP SDK compliance across all tool definitions. Ensures tool schemas are valid, responses are well-formed, and the server adheres to the Model Context Protocol specification.

## Scope
- `packages/mcp-server/src/tools/*.ts`
- `packages/mcp-server/src/index.ts`
- `packages/core/src/types.ts` (tool-facing types)

## Rules
1. Every tool MUST have a Zod input schema — no unvalidated inputs
2. Tool names MUST follow `volt_*` naming convention
3. Tool responses MUST be `{ content: [{ type: "text", text: string }] }` format
4. Every tool MUST handle the "no data available" case gracefully
5. Tool descriptions MUST be concise (< 120 chars) and start with a verb
6. NEVER expose internal errors to the agent — wrap in user-friendly messages
7. All tools MUST be registered in `index.ts` with `server.tool()`
8. Input schemas MUST have sensible defaults for optional parameters
9. NEVER add tools that require API keys or authentication from the agent
10. Tool responses MUST be deterministic given the same feed state

## Checklist for new tools
- [ ] Zod schema with descriptions on every field
- [ ] Default values for optional params
- [ ] Graceful empty-state handling
- [ ] Registered in index.ts
- [ ] Tool name matches `volt_[action]` pattern
- [ ] Response is plain text, formatted for readability
- [ ] No side effects beyond spend tracking

## Anti-patterns
- Returning JSON blobs (agents need readable text)
- Exposing internal IDs or implementation details
- Tools that mutate pricing feed state
- Tools that require external auth
