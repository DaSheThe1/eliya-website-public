# Cloudflare Worker and n8n setup

This is a provider-mutation runbook, not an automatic setup script. Freeze the
approved Cloudflare account, zone, Worker name, HTTPS route, environment, and
secret names in the deployment decision before any provider change. Never put
secret values in Git, workflow inputs, shell history, task packets, or logs.

## Approval boundaries

Treat each of these as a separate current approval:

1. create or bootstrap the Worker identity;
2. upload a non-active Worker version;
3. create or rotate Worker secrets;
4. change routes, DNS, workers.dev, or preview URL exposure;
5. deploy an exact reviewed Worker version;
6. run fresh authenticated provider verification.

`wrangler secret put` and Cloudflare dashboard secret edits can immediately
deploy a new Worker version. Do not use either in this journey. For an existing
versioned Worker, a platform operator may use the reviewed non-activating
`wrangler versions secret put` flow only after explicit secret-mutation
approval. Supply values interactively to Cloudflare and verify names/presence
only; never print or copy values into evidence.

A brand-new Worker may need an initial non-active version before versioned
secret management is available. Keep `worker/IMPLEMENTATION-BLOCKER.md` and the
release blocker in place until a provider-aware platform task has reviewed the
account's exact non-activating bootstrap path. If the operator cannot prove a
bootstrap action is non-activating, stop instead of substituting an activating
secret command.

After the required secret names exist in Cloudflare, the separately approved
manual workflow packages the exact source commit and performs the code deploy
through the protected `cloudflare-worker-production` environment. Secret
mutation, code deployment, route/DNS activation, and release verification do
not imply one another.
