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
  let responseBody = {};

  // Wrap code in try/catch block to return error stack in the response body
  try {
    // Check request parameters first
    if (request.method.toLowerCase() !== 'post') {
  console.log(request.method);
        responseStatus = 400;
    } else if (request.headers.get("Content-Type") !== 'application/x-www-form-urlencoded') {
        responseStatus = 415;
    } else {
      // get form data
      const data = await request.formData();
      // console.log(data)
      // require email
      // else invalid
      let email = data.get('email')
      if(!email){
        // invalid
        console.log("email missing")
        responseStatus = 400;
      } else {
        // we have everything so request is valid
        console.log("all request parameters VALID")

        // url encode, this isn't strictly necessary
        let enc_email = encodeURIComponent(email);
        //console.log("url_encoded email: ", enc_email);

        // return salt if exists in KV store
        // generate one if it doesn't
        let salt = "";
        // try to get from KV store
        salt = await SALTMINE.get(email)
        console.log("retrieved salt"); //,salt)
        if(!salt){
          // this uses the function above
          salt = await sha256(enc_email)
        }
        responseObj.salt = salt;
        responseStatus = 200;
      }
    }
    // return Response
    // default responseStatus is 500, see above
    responseInit = {
      status: responseStatus,
      headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
      }
    }
    console.log(responseStatus, responseObj);
    return new Response(JSON.stringify(responseObj), responseInit);

  } catch (e) {
      // Display the error stack.
      return new Response(e.stack || e)
  }
}
