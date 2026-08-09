# Contributing to Chat-Box

Thank you for your interest in contributing! This document outlines the process and standards for contributing to **@hey-amanthakur/chat-bot**.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Writing Tests](#writing-tests)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [License](#license)

---

## Code of Conduct

Be respectful and constructive. Harassment or personal attacks will not be tolerated. By participating, you agree to uphold these standards in every issue, PR, and discussion.

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20` (run `node --version` to check)
- **npm** `>= 10` (bundled with Node 20+)

### Setup

```bash
git clone https://github.com/hey-amanthakur/chat-bot.git
cd chat-bot
npm install
```

Verify everything works:

```bash
npm run build   # build shared, server, and widget
npm test        # node:test server suite
```

---

## Development Workflow

1. **Fork & clone** the repository.
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. **Make changes** following the [coding standards](#coding-standards).
4. **Add or update tests** for any new or changed behavior.
5. **Run all checks** before committing:
   ```bash
   npm run build   # type-checks + builds every workspace
   npm test        # runs the server test suite
   ```
6. **Commit** using [Conventional Commits](#commit-message-guidelines).
7. **Open a pull request** targeting `main`.

---

## Project Structure

```
chat-bot/
├── apps/
│   └── server/                    # Plain Node.js server (tsc-compiled)
│       └── src/
│           ├── ai/                # OpenRouter (fetch), RAG, lead detection
│           ├── auth/              # JWT (HS256), pure-JS bcrypt, scrypt hashing
│           ├── chat/              # Chat processing
│           ├── admin/             # Client management
│           ├── leads/             # Lead capture
│           ├── health/            # Health endpoints
│           ├── http/              # Router, validation, rate limiter, static files
│           ├── adapters/          # Express / Fastify / Koa / NestJS mounting
│           ├── config.ts          # Env + .env loader
│           ├── routes.ts          # Route table
│           ├── server.ts          # createChatServer / startChatServer
│           ├── index.ts           # Library API (ChatBot.start)
│           └── __tests__/         # node:test suites
├── packages/
│   ├── shared/                    # Common types used by server and widget
│   └── widget/                    # Embeddable JS widget (Rollup)
├── data/
│   ├── clients/                   # Per-client knowledge bases (JSON)
│   └── leads/                     # Captured leads per client
├── examples/                      # Framework adapter examples
├── dist/                          # Published build output (gitignored)
└── package.json                   # npm workspaces root
```

---

## Coding Standards

### General Principles

- **Zero runtime dependencies.** The server must not gain npm runtime dependencies — it runs on `node:http`, `node:crypto`, and global `fetch` only. Dev dependencies for tooling, types, and testing are fine.
- **Route table over controllers.** Add endpoints in `src/routes.ts`, not controllers. Validate via `src/http/validate.ts` helpers (`expectString`, `expectEmail`, etc.), never inline checks.
- **Client IDs are slugs.** Use slugs like `dr-smith-dental`, not UUIDs.
- **Strict TypeScript.** All workspaces compile with `strict` enabled. Your code must build with zero errors.
- **No comments unless necessary.** Only add comments to explain *why* non-obvious code exists, not *what* it does.
- **Consistent style.** 2-space indentation, semicolons, single quotes, trailing commas in multi-line structures.

### Security

- **No hardcoded secrets.** All API keys come from env vars or `ChatBot.start()` options. Never commit `.env` files.
- **Rate limit new endpoints.** Auth: 5 attempts/15min. Chat: 20/min. Leads: 10/min. Admin GET: 30/min. Admin writes: 10/hour.
- **Validate all inputs.** Max 2000 chars for messages, 10 KB body limit, reject unknown keys.

---

## Writing Tests

Tests use the built-in [`node:test`](https://nodejs.org/api/test.html) runner with `node:assert/strict`. No external test framework is needed.

### Test File Conventions

- Test files live in `apps/server/src/__tests__/` and match the source filename: `src/http/validate.ts` → `__tests__/validate.test.ts`.
- Tests are compiled via `tsconfig.spec.json` to `dist-test/` and run with `node --test`.

### What to Test

- **Unit tests** for pure logic (validators, rate limiter, JWT, bcrypt/scrypt, path resolution).
- **Service tests** for RAG loading, OpenRouter fallback, and password hashing.
- **End-to-end tests** for the full server (routing, CORS, static widget serving, rate limiting, admin CRUD).
- **Bug fixes** must include a regression test.

### Running Tests

```bash
npm test   # build tests + run node --test
```

---

## Commit Message Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types

| Type | Use for |
| --- | --- |
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation changes (README, CONTRIBUTING, examples) |
| `refactor` | Code restructuring without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Tooling, configs, CI, dependency bumps |
| `breaking` | Breaking change (use with `!` after type, e.g. `feat!:`) |

### Examples

```
feat(leads): add conversation history to lead capture
fix(auth): make JWT secret required in production
docs(readme): add NestJS adapter example
test(validate): add regression test for email validator
```

---

## Pull Request Process

1. **One change per PR.** Keep PRs focused — a single feature, fix, or refactor.
2. **Update tests.** Every PR that changes behavior must include or update tests.
3. **Update documentation.** If you add a public API, update the README. If you add a new adapter, add an example.
4. **Pass all checks.** Your PR must pass `npm run build` and `npm test`.
5. **Keep the diff clean.** Rebase onto `main` before submitting.
6. **Describe the change.** In the PR description, explain what changed and why, how it was tested, and any breaking changes.

### PR Checklist

- [ ] Branch is up to date with `main`
- [ ] `npm run build` passes with no errors
- [ ] `npm test` passes (all tests green)
- [ ] No new runtime dependencies added
- [ ] Commit messages follow Conventional Commits
- [ ] Documentation updated (README, examples) if API changed
- [ ] Tests added or updated for any new/changed behavior

---

## Reporting Issues

### Bug Reports

Open a [bug report](https://github.com/hey-amanthakur/chat-bot/issues/new?labels=bug&template=bug.md) and include:

- **Node.js version** (`node --version`)
- **Chat-Box version** (`npm ls @hey-amanthakur/chat-bot`)
- **Framework and version** (if using an adapter)
- **Minimal reproduction** (a code snippet or a repo link)
- **Expected behavior** vs. **actual behavior**
- **Error output** (stack trace if applicable)

### Feature Requests

Open a [feature request](https://github.com/hey-amanthakur/chat-bot/issues/new?labels=enhancement&template=feature.md) and describe:

- **The problem** you're trying to solve
- **The proposed solution** (API sketch if possible)
- **Alternatives considered**

---

## License

By contributing to Chat-Box, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

Thank you for contributing!
