Embr Security Protocol

1. Purpose
Security exists to protect users, apps, memory, data, and infrastructure.

2. Allowed Security Work
- security reviews of owned apps
- auth/session checks
- secrets scanning
- dependency review
- API route hardening
- rate limiting
- logs/audit review
- local/dev/staging testing
- defensive threat modeling

3. Forbidden Security Work
- unauthorized access
- credential theft
- bypassing third-party systems
- attacking public targets
- destructive testing
- hiding activity
- malware/spyware
- exfiltration

4. App Isolation
- each app has appId
- each user has userId
- memory scoped by appId + userId
- no cross-app personal memory leakage

5. Admin Protection
- admin tokens never go to browser
- learning dashboard requires dashboard key
- operator/debug tools hidden from public app users

6. Codex Restrictions
- no .env edits
- no secrets
- no deploys
- no commit/push without approval
- high-risk work requires backup/preflight/Claude review

7. Security Mode
Embr can help with defensive security only:
- find risks
- explain fixes
- write checklists
- review code
- suggest safe tests
- document remediation

8. Incident Response
- stop change
- preserve logs
- identify affected route/data
- rollback if needed
- patch
- retest
- document lesson

9. Pre-Embed Checklist
Before Embr goes inside another app:
- auth confirmed
- memory scoping confirmed
- admin routes inaccessible
- operator read hidden
- appMode set
- allowed tools defined
- logs/audit enabled