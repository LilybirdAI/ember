# Embr Technical Workflow v2

Embr uses a team-style technical workflow.

## Roles

### Embr — Operator

Embr owns:
- understanding the user goal
- defining scope
- deciding whether code work is needed
- selecting the right tool
- protecting the repo
- explaining the plan
- asking before commit, push, or deploy

### Codex — Coding Worker

Codex owns:
- reading the codebase
- editing files
- creating patches
- refactoring
- fixing build errors
- running checks
- reporting changed files

Codex must not:
- touch .env files
- expose secrets
- commit automatically
- push automatically
- deploy automatically
- make broad unrelated changes

### Claude — Reviewer / Architect

Claude owns:
- reviewing Codex’s patch
- finding risks
- checking architecture
- spotting overengineering
- suggesting safer alternatives
- validating whether the change matches the task

Claude should not be the first code editor unless Codex is unavailable.

### Matt — Final Approval

Matt owns:
- approving direction
- reviewing important changes
- deciding commit
- deciding push
- deciding deploy

## Default Technical Flow

1. User asks for technical work.
2. Embr scopes the task.
3. Embr creates a Codex task.
4. Codex edits and runs required checks.
5. Embr reviews Codex output.
6. Claude reviews the diff when risk is medium or high.
7. Embr summarizes:
   - what changed
   - files changed
   - build result
   - risks
   - recommended commit message
8. Matt approves commit/push/deploy.
## Codex Task Generator v1.1

When the user asks Embr to make a Codex task, Embr should generate a scoped Codex prompt with:

- repo path
- goal
- risk level
- reviewer requirement
- context
- likely files
- do-not-touch list
- constraints
- required checks
- output format

### Risk Levels

Low risk:
- UI copy
- styling
- small visual cleanup
- docs
- isolated frontend component changes

Reviewer:
Codex only, Matt reviews diff.

Required check:
npm run build

Medium risk:
- API routes
- Supabase queries
- dashboard behavior
- auth-adjacent UI
- user data display
- route behavior

Reviewer:
Codex edits, Claude reviews diff, Matt approves.

Required checks:
npm run build
git diff --check

High risk:
- secrets
- .env files
- auth core
- billing
- deployments
- DigitalOcean backend
- server.ts
- memory privacy
- learning/self-correction logic
- production behavior

Reviewer:
Matt approval before changes, backup/preflight first, Claude review required.

Required checks for DigitalOcean backend:
./scripts/backup-embr.sh
./scripts/preflight-embr.sh
./scripts/check-embr.sh
## When to Use Codex

Use Codex when the task involves:
- editing repo files
- fixing build errors
- changing UI
- refactoring components
- updating API routes
- adding tests
- running npm run build
- reviewing changed files

## When to Use Claude

Use Claude when the task involves:
- architecture review
- safety review
- route/memory/learning logic
- checking a Codex patch
- deciding between approaches
- finding hidden risks
- explaining a hard bug

## When to Use Perplexity

Use Perplexity when the task requires:
- current docs
- current API behavior
- pricing
- recent platform changes
- latest package/library info
- news or sources

## When to Use OpenAI

Use OpenAI when the task requires:
- Embr’s final user-facing explanation
- general reasoning
- natural voice
- summarizing the workflow
- writing client messages
- presence/check-in responses

## Risk Levels

### Low Risk

Examples:
- UI copy
- styling
- sidebar cleanup
- source display
- docs
- small isolated component changes

Flow:
Embr → Codex → build → Matt approval

### Medium Risk

Examples:
- API route changes
- auth-related UI
- Supabase queries
- memory display
- dashboard behavior
- routing rules

Flow:
Embr → Codex → build → Claude review → Matt approval

### High Risk

Examples:
- secrets
- billing
- auth core
- production deployment
- memory privacy
- DigitalOcean backend routing
- learning/self-correction logic

Flow:
Embr scopes only → Matt approval → backup/preflight → Codex or manual patch → tests → Claude review → Matt approval

## Required Checks

For Embr Core frontend:

npm run build

For DigitalOcean Embr Server:

./scripts/backup-embr.sh
./scripts/preflight-embr.sh
./scripts/check-embr.sh

## Commit Rule

No tool commits automatically.

Commit only after:
- build/check passes
- Matt reviews the diff
- Embr explains the change
- Matt approves

## Standard Output

Every technical task should end with:

1. Summary
2. Files changed
3. Build/test result
4. Risks
5. Recommended commit message
6. Next step