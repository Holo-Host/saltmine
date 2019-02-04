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
 * Utility function for entropy
 */
async function entropy(length){
  let array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let hexArray = toHexString(array);
  return hexArray;
}

/**
 * Utility function for bytes into hex
 */
function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Utility function responseObj
 */
const responseObj = () => ({
  let responseObj = {};
  return responseObj;
});

/**
 * Utility function responseInit
 */
const responseInit = (responseStatus) => ({
  responseInit = {
    status: responseStatus,
    headers: {
    'Access-Control-Allow-Origin': '*'
    }
  };
  return responseInit;
});

/**
 * Utility function response
 */
const builtResponse = (responseObj, responseInit) => ({
  let response = {
    "responseObj" : responseObj,
    "responseInit" : responseInit
  };
  return response;
});

/**
 * Utility function response
 */
const response = (response) => ({
  'no token' : (prng) => {
    console.log('no token');
    responseStatus = 200;
    let responseObj = responseObj();
    responseObj.prng = prng.toString();
    responseInit = responseInit(200);
    return builtResponse(responseObj,responseInit);
  },
  'no content-type' : () => {
    console.log('no content-type');
    let responseObj = responseObj();
    responseInit = responseInit(415);
    return builtResponse(responseObj,responseInit);
  },
  'no email' : () => {
    console.log('no email');
    let responseObj = responseObj();
    responseInit = responseInit(400);
    return builtResponse(responseObj,responseInit);
  }
})[response] || ( () => {
  console.log('default response');
  let responseObj = responseObj();
  responseInit = responseInit(500);
  return builtResponse(responseObj,responseInit);
} )();

/**
 * Receive email, gen salt, store in KV, return salt
 * @param {Request} request
 */
async function handleRequest(request) {
  // Wrap code in try/catch block to return error stack in the response body
  try {
    // Check request parameters first
    if (request.method.toLowerCase() !== 'post') {
      // check to see if method is GET
      if (request.method.toLowerCase() == 'get') {
        //console.log('is get')
        // process token or return random
        const url = new URL(request.url);
        // token or not?
        const hasToken = url.searchParams.has("token") === true;
        if(hasToken){
          // process token
          console.log('token', url.searchParams.get("token"));
          // do more here
        } else {
          // console.log('no token');
          // return random
          let prng = await entropy(32);
          //console.log(response('no token')(prng));
          let r = response('no token')(prng);
          return new Response(r.responseObj.prng, r.responseInit);
          // ternary
          // const isGreaterThan5 = x => x > 5 ? 'Yep' : 'Nope'
        }
      }
    } else if (request.headers.get("Content-Type") !== 'application/x-www-form-urlencoded') {
        let r = response('no content-type')();
        return new Response(r.responseObj, r.responseInit);
    } else {
      // if method and headers are correct
      // get form data
      const data = await request.formData();
      // console.log(data)
      // require email
      // else invalid
      let email = data.get('email')
      if(!email){
        // invalid
        //console.log("no email")
        let r = response('no email')();
        return new Response(r.responseObj, r.responseInit);
      } else {
        let salt = "";
        // from documentation
        // if incoming salt, then process it
        let sent_salt = data.get('salt')
        if(sent_salt){
          console.log("salt sent");
          // 1. check for existing salt
          // 2. if none, email token and write data:
          //   'pending', salt, token

          existing_salt = await SALTMINE.get(email);
          if(!existing_salt){
            console.log("no existing salt");
            // gen token
            let prng = await entropy(4);
            console.log(prng);
            // send email (later)
            //
            // put key,value into store
            // Cloudflare will ignore duplicate keys
            // we can check for duplicates later
            //   so we can have nice error message
            // At present there is no way to verify
            // the ".put" command succeeds
            // According to documentation
            // eventual consistency < 10 seconds globally
            let status = "pending";
            let token = prng.toString();
            let data_string = `{"status":"${status}", "token":"${token}", "salt":"${sent_salt}"}`;
            console.log("putting",data_string);
            SALTMINE.put(email, data_string);
          } else {
            // waitin for clarification here
            console.log('data found',existing_salt);
          }
          salt = sent_salt;
        } else {
          // if no salt sent in
          // look for incoming token
          let sent_token = data.get('token');
          if(sent_token){
            console.log("sent token", sent_token);
            // verify token, change note
            // return salt, else 401 error
            let json = await SALTMINE.get(email, "json");
            console.log(json);
            if(json){
              // verify token
              if(sent_token == json.token){
                console.log("token is good:", sent_token);
                let status = "active";
                let token = json.token;
                salt = json.salt;
                let data_string = `{"status":"${status}", "token":"${token}", "salt":"${salt}"}`;
                console.log("putting",data_string);
                SALTMINE.put(email, data_string);

              } else {
                // bad token
                console.log("token is bad:", sent_token);
                responseStatus = 401;
                responseInit = {
                  status: responseStatus,
                }
                return new Response('Invalid token', responseInit);
              }
            } else {
              // error out
              responseStatus = 404;
              responseInit = {
                status: responseStatus,
              }
              return new Response('No data found', responseInit);
            }
          } else {
            // if neither salt nor token incoming
            // url encode, this isn't strictly necessary
            let enc_email = encodeURIComponent(email);
            //console.log("url_encoded email: ", enc_email);
            // return salt if exists in KV store
            // generate one if it doesn't
            // try to get from KV store
            let json = await SALTMINE.get(email, "json");
            //console.log(json);
            if(!salt){
              console.log("generate salt");
              // this uses the function above
              salt = await sha256(enc_email);
            } else {
              console.log("retrieved salt", salt)
              salt = obj.salt;
            }
          }
        }
        // final response
        responseObj.salt = salt;
        responseStatus = 200;
      }
    }
    // return Response
    console.log('EOL');
    response();

  } catch (e) {
      // Display the error stack.
      return new Response(e.stack || e)
  }
}
