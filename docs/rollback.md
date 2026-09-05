# Restore the previous website

Recovery source: `17b712c1fdbefe43c64abc2c9c36b3a4bfa50eee`.
The remote tag `rollback/aekr-web-pre-refresh-2026-09-04` preserves that baseline.
Ed also has a local verified Git bundle, source archive and checksum manifest in
the sibling backup directory named `aekr-web-backups`, under `pre-refresh-2026-09-04`.
Its README contains isolated source recovery steps.

To restore the previous live Worker version from this repository with the
existing Cloudflare account session:

```sh
npx wrangler rollback ba65459d-a6a6-4475-884f-6d084528b6d5 --name aekr-web --message "Restore pre-refresh website"
```

Verify the live website afterward. This restores deployment state, not Git
history. If the source branch must also go back, revert the refresh commit
normally; avoid reset or force-push. Otherwise a future push may redeploy it.
The backup contains no credentials or Worker secret values; those remain managed
by Cloudflare. No rollback was executed while preparing this backup.
