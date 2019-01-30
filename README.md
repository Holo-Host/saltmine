# Holo "Saltmine"

**This is Pre-Alpha software only for testing purposes.**

This repository is the javascript code for a Cloudflare worker that:

1. receives and email (by POST)
1. generates a SHA256 hash
1. returns the hash to the sender

Eventually it may do this also

1. checks the KV store for the email and a salt
1. generates a salt if necessary
1. stores the email and salt in the KV store if it is new

