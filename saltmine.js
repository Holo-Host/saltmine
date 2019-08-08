// saltmine.js deployed via wrangler
//
// THIS VERSION IS STRIPPED DOWN FOR CLOSED ALPHA !!!!!!
//

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Utility function for sha256 hashing
 * @param {String} seed
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
 * @param {int} length
 */
async function entropy(length){
  let array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let hexArray = toHexString(array);
  return hexArray;
}

/**
 * Utility function for bytes into hex
 * @param {ArrayBuffer} byteArray
 */
function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

async function getSaltmineDataByEmail(email){
  existing_data = await SALTMINE.get(email);
  return existing_data;
}

async function putSaltmineData(email, newJSON){
  console.log('email',email);
  console.log("new json", newJSON);
  // try/catch ?
  await SALTMINE.put(email, JSON.stringify(newJSON));
}

//
// THIS VERSION IS STRIPPED DOWN FOR CLOSED ALPHA !!!!!!
//
/**
 * Utility function responseObj
 */
async function parseRequest(request){
  let requestObj = {};
  requestObj.method = request.method.toLowerCase();
  const url = new URL(request.url);
  requestObj.token = url.searchParams.get("token");
  if ((request.method.toLowerCase()==='post') && (request.headers.get("Content-Type") === 'application/x-www-form-urlencoded')) {
    requestObj.hasForm = true;
    const data = await request.formData();
    requestObj.email = data.get('email');
    requestObj.sent_salt = data.get('salt');
    if(requestObj.email){
      // try/catch ?
      let existing_data = JSON.parse(await getSaltmineDataByEmail(requestObj.email));
      if(existing_data){
        //console.log('data found',existing_data);
        requestObj.status = existing_data.status;
        requestObj.token = existing_data.token;
        requestObj.salt = existing_data.salt;
      } else {
        // something ?
      }
    }
  }
  return requestObj;
};


/**
 * Utility function responseInit
 * @param {int} responseStatus
 */
const responseInitGenerator = (status) => ({
  status,
  headers: {
  'Access-Control-Allow-Origin': '*'
  }
});

/*
1. ENTROPY
  GET
    return crypto string, 200
2. REGISTER OR RETRIEVE SALT
  POST email and salt together
    unless conflict, store email and salt, return salt, 200
  POST email which has existing salt
    return salt, 200
  POST new email not found in KV store
    gen salt, store email and salt, return salt, 200
3. ERRORS
  DEFAULT response is 500
  POST with no content-type header
    return error, 415
*/
/**
 * Utility function response
 */
const responseGenerator = (responseCode) => {
  console.log(responseCode)
  const responseData =  {
    'return entropy' : (prng) => {
      return {
        body: prng.toString(),
        init: responseInitGenerator(200)
      };
    },
    'return salt' : (salt) => {
      return {
        body: salt,
        init: responseInitGenerator(200)
      };
    },
    'no content-type' : () => {
      return {
        init: responseInitGenerator(415)
      };
    },
  }[responseCode];

  return responseData || {
    init: responseInitGenerator(500)
  };
};

//
// THIS VERSION IS STRIPPED DOWN FOR CLOSED ALPHA !!!!!!
//
/**
 * Request Handler
 * @param {Request} request
 */
async function handleRequest(request) {
  // Wrap code in try/catch block to return error stack in the response body
  try {
    let requestObj = await parseRequest(request);
    console.log(requestObj);

    // ALL CURRENTLY IMPLEMENTED RESPONSES ARE HERE
    if (requestObj.method === 'get' && !requestObj.token) {
      // 1. ENTROPY, return crypto string
      // try/catch ?
      let prng = await entropy(32);
      // return entropy
      const {body, init} = responseGenerator('return entropy')(prng);
      return new Response(body, init);
    } else if (requestObj.method === 'post' && !requestObj.hasForm) {
      // no content-type header, return 415
      const {body, init} = responseGenerator('no content-type')();
      return new Response(body, init);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && !requestObj.sent_salt) {
      // 1. email sent, no salt sent
      // gen salt, store email and salt, return salt, 200
      let enc_email = encodeURIComponent(requestObj.email);
      console.log("generate salt");
      // generate salt via function above
      salt = await sha256(enc_email);
      // store email and salt, put
      newJSON = {
        "status": "active",
        "salt": salt
      }
      // try/catch ?
      await putSaltmineData(requestObj.email, newJSON);
      // return salt
      const {body, init} = responseGenerator('return salt')(salt);
      return new Response(body, init);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.sent_salt && !requestObj.salt) {
      // 2. email sent, salt sent, email has no existing salt
      // store email and salt, put
      newJSON = {
        "status": "active",
        "salt": requestObj.sent_salt
      }
      // try/catch ?
      await putSaltmineData(requestObj.email, newJSON);
      // return salt
      const {body, init} = responseGenerator('return salt')(requestObj.sent_salt);
      return new Response(body, init);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.salt) {
      // 3. email sent, email has existing salt, keep existing salt, return existing salt
      //console.log('data found',requestObj.salt);
      // return salt
      const {body, init} = responseGenerator('return salt')(requestObj.salt);
      return new Response(body, init);
    }
    // if everything above fails to match, return default Response, 500
    // console.log('invoking final default response');
    // default response is NOT a function
    // so don't add extra parens on this
    const {body, init} =  responseGenerator();
    return new Response(body, init);
  } catch (e) {
      // Display the error stack.
      return new Response(e.stack || e)
  }
}
