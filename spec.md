# Holo "Saltmine" Spec v1

**This is Pre-Alpha software only for testing purposes.**

This repository is the javascript code for a Cloudflare worker that works in accordance with the documentation found at :

[https://holo-host.github.io/saltmine/](https://holo-host.github.io/saltmine/)


# Holo Salt Service

### Support Service for Holo Light-Client Key Management Onboarding

> **INTERNAL NOTES**
> 
> Holo light-client users want to access holo-hosted websites with a username and password scheme. In the background, they will still need cryptographic keypairs. The scheme to support generating keypairs securely from a password that are difficult to brute-force, we need some consistent entropic salt to be stored that can be fetched to hash with their password.
>
> This service will allow users to initially register the salt with their username (email address) so it can be fetched in the future.
>
> This service will be written in Cloudflare Service Workers, using a KV store to associate email addresses with SALT.
>
> Every API in this service will always return 32 hex encoded bytes with mime type text/plain. Post requests will accept content-type of application/x-www-form-urlencoded. Response headers will include Access-Control-Allow-Origin: “*” for CORS.
>
> We can have this service live at https://saltmine.holohost.net

In the descriptions below:

* **URL Parameters** refers to parameters being passed into the API via the URL "querystring".
* **Query Parameters** referst to parameters being passed into the API via POSTed data.


## Retrieve Entropy

> **INTERNAL NOTES**
> 
> Not all devices can produce cryptographically secure entropy. Any GET request to this service will return 32 bytes Web Crypto random bytes. Clients will locally generate 32 bytes, and XOR them with the bytes from the server to achieve a salt that is a mixture of the entropies.


Any GET request to this service will return 32 bytes Web Crypto random bytes.

(We provide this service because not all devices can produce cryptographically secure entropy).

### HTTP Request
**Method** `GET https://saltmine.holohost.net`

### URL Parameters
URL parameters are ignored for this request.

### Query Parameters
Query parameters are ignored for this request.

### Responses
Code | Response
---------- | -------
200 | 32 bytes Web Crypto random bytes as mime-type text/plain.
500 | Server Error


```shell
curl -X GET "https://saltmine.holohost.net"
```
> The above command returns 32 hex encoded bytes with mime-type text/plain


## Register Salt or Retrieve Salt

> **INTERNAL NOTES**
> 
> A holo user wishes to register 32 bytes of SALT with the salt service. They have already generated this salt with the XOR scheme described in #1  - Entropy. They make a POST request to this service, content-type application/x-www-form-urlencoded:
>
> ```email=address%40domain.com&salt=abc123```
>
> If this email does not already have salt associated with it, an email will be sent to the user to verify that they have this email address. The email will contain a random token. The random token can be 4 hex encoded random bytes.
> 
> If the email address is found in the KV store, the 32 bytes of salt is returned to the user.
>
> If a bad actor is looking up random emails to see if they have salt, we don’t want to alert them to whether or not that email has a salt associated. We will perform a sha256 hash on the email address concatenated to 32 bytes that we hard-code into the service, to consistently generate 32 bytes to output without having to store anything. Return the generated 32 bytes.
>
> (EMAIL SENDING IS DEFERRED FOR CLOSED ALPHA)
>
> * A value will be stored in a KV associating their email with a “pending” note, the salt.
> * A second KV stores email and the verification token and token expiration.
>
> **coding in progress**


This request is used to register 32 bytes of SALT with the salt service.

It is a POST request with a "Content-type" header of "application/x-www-form-urlencoded".

* If the POSTed email is in our system:
  * If the POSTed email does not already have a salt associated with it, an email will be sent to the user to verify that they have this email address. The email will contain a token that the user can use to verify their email address.
 * If the POSTed email does already have a salt associated with it, then we will return it.
* If the POSTed email is **not** in our system:
  * A salt will be generated and returned to the user in the response.

### HTTP Request
**Method** `POST https://saltmine.holohost.net`

### URL Parameters
URL parameters are ignored for this request.

### Query Parameters

Parameter | Required | Description
--------- | ----------- | -----------
Email | Required | An email address.
Salt | Optional | A salt to be registered.

### Responses
Code | Response
---------- | -------
200 | The salt as mime-type text/plain.
500 | Server Error


  ```shell
  curl -X POST "https://saltmine.holohost.net" -H "Content-Type: application/x-www-form-urlencoded" --data "email=address@domain.com&salt=abc123"

  or

  curl -X POST "https://saltmine.holohost.net" -H "Content-Type: application/x-www-form-urlencoded" --data "email=address@domain.com"

  ```
  > The above commands return a salt with mime-type text/plain


## Verify Email Address

> **INTERNAL NOTES**
> 
> A holo user will receive the email with the random token. They will go again to the salt service via a URL with the following `querystring`:
>
> ```?token=abc123```
>
> If the verification token matches, the “pending” note will be changed to “active”, and the token can be deleted. If not, a 401 unauthorized will be returned.
>
> (FOR CLOSED ALPHA, THIS CAN SKIP THE TOKEN VERIFICATION)
>
> The salt will be sent to the user in response.
> 
> **coding in progress**


This request is used to verify an email using a token.
GET url with token querystring.  The token is sent on the URL querystring as:

`?token=sometoken`

* If the token is valid, then the email address will be used to retrieve the salt associated with the email address, which will be returned to the user in the response.
* If the token is expired or not found then a 401 unauthorized will be returned.

### HTTP Request
**Method** `GET https://saltmine.holohost.net?token=sometoken`

### URL Parameters

Parameter | Description
--------- | -----------
Token | The token used to verify the email

### Query Parameters
Query parameters are ignored for this request.

### Responses
Code | Response
---------- | -------
200 | The salt as mime-type text/plain.
401 | Unauthorized: if the token is invalid or expired
500 | Server Error


## Reference

[Holo Internal Google Doc discussion/spec](https://docs.google.com/document/d/1VIbQDdSnnd4BNgjtupjVeH9PPNe8kgqETpPhIIWyGBU)


