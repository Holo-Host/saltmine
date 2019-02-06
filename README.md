# Holo "Saltmine"

**This is Pre-Alpha software only for testing purposes.**

This repository is the javascript code for a Cloudflare worker that works in accordance with the documentation found at :

[https://holo-host.github.io/saltmine/](https://holo-host.github.io/saltmine/)


# Holo Salt Service

### Support Service for Holo Light-Client Key Management Onboarding

Holo light-client users want to access holo-hosted websites with a username and password scheme. In the background, they will still need cryptographic keypairs. The scheme to support generating keypairs securely from a password that are difficult to brute-force, we need some consistent entropic salt to be stored that can be fetched to hash with their password.

This service will allow users to initially register the salt with their username (email address) so it can be fetched in the future.

This service will be written in Cloudflare Service Workers, using a KV store to associate email addresses with SALT.

Every API in this service will always return 32 hex encoded bytes with mime type text/plain. Post requests will accept content-type of application/x-www-form-urlencoded. Response headers will include Access-Control-Allow-Origin: “*” for CORS.

We can have this service live at https://saltmine.holohost.net

## 1 - Entropy (GET /)

Not all devices can produce cryptographically secure entropy. Any GET request to this service will return 32 bytes Web Crypto random bytes. Clients will locally generate 32 bytes, and XOR them with the bytes from the server to achieve a salt that is a mixture of the entropies.

* Method
  * GET
* Request Parameters
  * none/ignored
* Responses
  * 32 bytes Web Crypto random bytes
  * error

## 2 - Register Salt (POST /)

**coding in progress**

A holo user wishes to register 32 bytes of SALT with the salt service. They have already generated this salt with the XOR scheme described in #1  - Entropy. They make a POST request to this service, content-type application/x-www-form-urlencoded:

```email=address%40domain.com&salt=abc123```

If this email does not already have salt associated with it, an email will be sent to the user to verify that they have this email address. The email will contain a random token. The random token can be 4 hex encoded random bytes.

(EMAIL SENDING IS DEFERRED FOR CLOSED ALPHA)

* A value will be stored in a KV associating their email with a “pending” note, the salt.
* A second KV stores email and the verification token and token expiration.
	
The salt will be echoed to the user in the response.

* Method
  * POST
* Request Parameters
  * email (required)
  * salt (required)
* Responses
  * salt
  * error


## 3 - Verify Email (GET /)

**coding in progress**

A holo user will receive the email with the random token. They will go again to the salt service via a URL with the following `querystring`:

```?token=abc123```

If the verification token matches, the “pending” note will be changed to “active”, and the token can be deleted. If not, a 401 unauthorized will be returned.

(FOR CLOSED ALPHA, THIS CAN SKIP THE TOKEN VERIFICATION)

The salt will be sent to the user in response.

* Method
  * POST
* Request Parameters
  * token (required)
* Response
  * salt
  * 401 Unauthorized
  * error


## 4 - Bad Email Lookup (POST /)

User inputs post data:

```email=bad.address%40domain.com```

We don’t find this address in the KV store. If a bad actor is looking up random emails to see if they have salt, we don’t want to alert them to whether or not that email has a salt associated. We will perform a sha256 hash on the email address concatenated to 32 bytes that we hard-code into the service, to consistently generate 32 bytes to output without having to store anything.

Return the generated 32 bytes.

* Method
  * POST
* Request Parameters
  * email (required)
* Response
  * generated salt
  * error


## 5 - Good Email Lookup (POST /)

User inputs post data:

```email=address%40domain.com```

If the email address is found in the KV store, the 32 bytes of salt is returned to the user.

* Method
  * POST
* Request Parameters
  * email (required)
* Response
  * salt
  * error

## Reference

https://docs.google.com/document/d/1VIbQDdSnnd4BNgjtupjVeH9PPNe8kgqETpPhIIWyGBU

