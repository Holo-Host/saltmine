addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Utility function for sha256 hashing
 * @param {Sting} seed
 */
async function sha256(seed) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(seed)
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // convert bytes to hex string
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('')
  return hashHex
}

/**
 * Receive email, gen salt, store in KV, return salt
 * @param {Request} request
 */
async function handleRequest(request) {
  /*
  let requestHeaders = JSON.stringify([...request.headers], null, 2)
  console.log(`Request headers: ${requestHeaders}`)
  console.log(request);
  */
  let responseObj = {};
  let responseStatus = 500;

  // Wrap code in try/catch block to return error stack in the response body
  try {
    // Check request parameters first
    if (request.method.toLowerCase() !== 'post') {
        responseStatus = 400;
    } else if (request.headers.get("Content-Type") !== 'application/x-www-form-urlencoded') {
        responseStatus = 415;
    } else {
      // receive email, send salt
      const data = await request.formData();
      //console.log(data)
      const requestObj = {
        email: data.get('email')
      }
      console.log(requestObj);
      let email = encodeURIComponent(requestObj.email);

      // this is a direct hash
      //const hash1 = await crypto.subtle.digest('SHA-256', email)

      // this uses the function above
      let hash2 = await sha256(email)

      responseObj.salt = hash2;

//      responseObj.salt = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
      responseStatus = 200;
    }
    const init = {
      status: responseStatus,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    }
    console.log(responseObj);
    return new Response(JSON.stringify(responseObj), init);
  } catch (e) {
      // Display the error stack.
      return new Response(e.stack || e)
  }
}

