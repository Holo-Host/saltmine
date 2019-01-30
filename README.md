# Holo "Saltmine"

**This is Pre-Alpha software only for testing purposes.**

This repository is the javascript code for a Cloudflare worker that:

1. receives email (by POST)
1. looks for stored salt/hash by email
1. ***if*** not found, ***then*** generates a SHA256 hash
1. returns the hash to the sender

Eventually it may do this also

1. stores the email and salt in the KV store if it is new

