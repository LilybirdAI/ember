# Embr App Context Protocol

This protocol defines how Embr is safely embedded into other apps.

Embr Core is the main operator system.
Other apps can use Embr through app-specific context.

## Purpose

App Context lets Embr adapt to each product without leaking memory, tools, or debug behavior across apps.

Examples:
- Embr Core
- Mindshot Golf
- client support apps
- wellness apps
- business apps
- developer tools

## Required Fields

Every app request to Embr should include:

appId:
A stable identifier for the app.

appMode:
The role Embr should take inside that app.

userId:
The signed-in user ID from that app.

message:
The user’s message.

messages:
Recent conversation history, if available.

## Optional Fields

appContext:
Extra context about the app.

allowedTools:
Tools this app is allowed to use.

hiddenTools:
Tools that should not be exposed to the user.

voiceRules:
Tone and behavior rules for this app.

memoryScope:
How memory should be scoped.

securityLevel:
low, medium, or high.

## Example Payload

{
  "appId": "mindshot-golf",
  "appMode": "mental_game_companion",
  "userId": "signed-in-user-id",
  "message": "I had a rough round today",
  "messages": [],
  "appContext": {
    "appName": "Mindshot Golf",
    "role": "calm mental-game companion for golfers"
  },
  "allowedTools": ["openai", "profile-memory", "learning-log"],
  "hiddenTools": ["operator-read", "codex", "server-debug"],
  "memoryScope": "app_user",
  "securityLevel": "medium"
}

## App Modes

### core

Used by Embr Core.

Allows:
- full operator routing
- learning dashboard
- operator read
- developer/debug tools when enabled

### mindshot

Used by Mindshot Golf.

Embr should act as:
- calm mental-game companion
- reflective coach
- post-round reviewer
- focus/pressure/patience guide

Do not expose:
- operator read
- Codex
- backend details
- learning dashboard
- internal routing metadata

### client_support

Used inside client/customer apps.

Embr should act as:
- product support assistant
- user guide
- troubleshooting helper

Do not expose:
- internal tool names
- operator read
- admin routes
- unrelated app memory

### developer

Used for internal developer tools.

Allows:
- technical routing
- Codex task generation
- Claude review
- debug metadata when enabled

Requires:
- authenticated developer/admin user

### wellness

Used for support/wellness apps.

Embr should:
- be calm
- be careful
- avoid diagnosis
- suggest professional help when needed
- stay within app-specific scope

## Memory Scope

Memory must be scoped by both appId and userId.

Correct:

profile-memory/<appId>/<userId>.json

Incorrect:

profile-memory/<userId>.json

Reason:
The same user may use Embr differently in different apps.

Example:
- Mindshot Golf memory should not affect business app memory.
- Business app memory should not affect wellness app memory.
- Matt’s preferences should not apply to other users.

## Tool Boundaries

Each app defines allowed tools.

Example Mindshot Golf allowed tools:
- openai
- profile-memory
- learning-log

Example Mindshot Golf hidden tools:
- codex
- operator-read
- server-debug
- learning-dashboard

## Security Rules

- Never expose admin tokens to app frontends.
- Never expose operator read unless developer/debug mode is explicitly allowed.
- Never share memory across apps.
- Never use another user’s profile memory.
- Never expose learning logs to public app users.
- Never allow Codex in public user-facing app mode.

## Developer Mode

Developer mode can expose more tools only when:
- user is authenticated
- user has admin/developer role
- app explicitly allows developer mode

Developer mode may show:
- engine
- model
- domain
- priority
- next move
- tool output
- logs summary

## Public App Mode

Public app mode should hide:
- engine names
- model names
- operator read
- internal tools
- debug metadata
- learning dashboard
- Codex

Public app users should only see the app-appropriate Embr response.

## Pre-Embed Checklist

Before embedding Embr in another app:

- appId defined
- appMode defined
- signed-in userId passed
- memory scoped by appId + userId
- allowed tools listed
- hidden tools listed
- operator read hidden
- dashboard/admin endpoints blocked
- prompt-injection risks reviewed
- logging/audit plan defined
- security level assigned
- rollback plan exists

## Default Rule

If appId or userId is missing, Embr should not write persistent personal memory.

If appMode is missing, Embr should default to safe general behavior.