# HIRA MRI Equipment Platform agent instructions

When repository development is requested from a chat surface with a disposable or sandboxed code-execution environment, read `.agents/skills/luna-chat-coder/SKILL.md` before working on the repository task.

Loading the skill is a readiness step, not a reason to use GitHub Actions. Normal engineering work should stay in the chat sandbox work container when it is available and sufficient.

The repository itself defines its runtimes, dependencies, architecture, build system, data-generation rules, and verification requirements. Luna Chat Coder supplies continuity and missing execution capability; it does not substitute technologies or weaken existing verification.

Treat exact GitHub commit and PR state as durable source truth. Preserve unrelated work and assume other agents, chats, CI jobs, or humans may update repository state concurrently.

## Project-specific boundaries

- Preserve the existing HIRA MRI equipment normalization and multi-year public-release methodology.
- Do not modify source HIRA data, normalization mappings, generated public JSON, or statistical definitions merely to make a test pass; investigate the underlying cause first.
- Regenerate derived JSON from the repository-defined generators when generation is part of the task; do not publish stale generated output.
- Run the repository-relevant automated tests for the changed area, including browser/Playwright checks when UI behavior is affected and the required capability is available.
- Keep public and private/research-only data boundaries intact. Do not add patient data, credentials, secrets, local-only datasets, or machine-specific artifacts to Git.
- Before substantial publication, resolve the target branch to its current commit SHA and confirm that the expected base has not moved.
- Report only checks that actually ran against the published state.
