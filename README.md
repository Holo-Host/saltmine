# Holo "Saltmine"

**This is Pre-Alpha software only for testing purposes.**

This repository is the javascript code for a Cloudflare worker that works in accordance with the documentation found at :

[https://holo-host.github.io/saltmine/](https://holo-host.github.io/saltmine/)

The original internal spec (with notes) is at [spec.md](spec.md)

## Wrangler

Wrangler process to deploy this code:

1. Install wrangler ( [https://github.com/cloudflare/wrangler](https://github.com/cloudflare/wrangler) )
1. Setup `wrangler config` with correct email and api key
1. Create `package.json` file with correct package info
1. Setup `wrangler.toml` file with correct Cloudflare info
1. Run a command line:

```
wrangler publish --release
```
