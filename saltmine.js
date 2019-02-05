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

/**
 * Utility function responseObj
 */
const responseObj = () => ({})();

/**
 * Utility function responseInit
 * @param {int} responseStatus
 */
const responseInit = (responseStatus) => ({
  status: responseStatus,
  headers: {
  'Access-Control-Allow-Origin': '*'
  }
})();

/**
 * Utility function response
 */
const response = (response) => ({
  'no token' : (prng) => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = prng.toString();
    console.log({responseObj, responseInit});
    console.log(responseObj.body);
    return {responseObj, responseInit};

  },
  'token' : () => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = response;
    return {responseObj, responseInit};
  },
  'no content-type' : () => {
    console.log(response);
    responseInit.status = 415;
    responseObj.body = response;
    return {responseObj, responseInit};
  },
  'no email' : () => {
    console.log(response);
    responseInit.status = 400;
    responseObj.body = response;
    return {responseObj, responseInit};
  },
  'no salt' : () => {
    console.log(response);
    responseInit.status = 400;
    responseObj.body = response;
    return {responseObj, responseInit};
  },
  'sent salt' : (salt) => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = salt;
    return {responseObj, responseInit};
  },
  'post tmp' : (incoming) => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = incoming;
    return {responseObj, responseInit};
  }
})[response] || ( () => {
  note = 'default response';
  console.log(note);
  responseInit.status = 500;
  responseObj.body = note;
  return {responseObj, responseInit};
} )();

async function doGET(request){
  // process token or return random
  const url = new URL(request.url);
  // token or not?
  const hasToken = url.searchParams.has("token") === true;
  if(hasToken){
    // process token
    console.log('token', url.searchParams.get("token"));
    // do more here

    let r = response('token')();
    return new Response(r.responseObj.body, r.responseInit);
  } else {
    // return random
    let prng = await entropy(32);
    let r = response('no token')(prng);
    return new Response(responseObj.body, responseInit);
  }
}

async function doPOST(request){
  if (request.headers.get("Content-Type") !== 'application/x-www-form-urlencoded') {
    let r = response('no content-type')();
    return new Response(responseObj.body, responseInit);
  } else {
    // if method and headers are correct
    // get form data
    const data = await request.formData();
    let email = data.get('email');
    if(!email){
      let r = response('no email')();
      return new Response(responseObj.body, responseInit);
    } else {
      // 1. check for existing salt
      // 2. if none, email token and write data:
      //   'pending', salt, token
      let sent_salt = data.get('salt');
      if(sent_salt){
        let existing_data = await getDataByEmail(email);
      if(!existing_data){
          salt = sent_salt;
          // gen token
          let prng = await entropy(4);
          // this is for later
          //sendTokenEmail(email,token);

          let values = "something goes here";
          writeData(values);

          let r = response('sent salt')(salt);
          return new Response(responseObj.body, responseInit);
        } else {
          // waiting for clarification here
          let existing = JSON.parse(existing_data);
          console.log(existing.salt);
          console.log('data found',existing.salt);
          salt = existing.salt;

          let r = response('sent salt')(salt);
          return new Response(responseObj.body, responseInit);
        }
      } else {
        let r = response('no salt')();
        return new Response(responseObj.body, responseInit);
      }





    }
  }
}

async function getDataByEmail(email){
  existing_data = await SALTMINE.get(email);
  return existing_data;
}
function sentTokenEmail(email,token){
  // does nothing for now
  // possibly return success/fail
}
async function writeData(data){
  // rewrite this according to new docs
  /*
  let status = "pending";
  let token = prng.toString();
  let data_string = `{"status":"${status}", "token":"${token}", "salt":"${sent_salt}"}`;
  console.log("putting",data_string);
  SALTMINE.put(email, data_string);
  */
  // possible return something
  // but there is no way to know if .put worked
}


/**
 * Receive email, gen salt, store in KV, return salt
 * @param {Request} request
 */
async function handleRequest(request) {
  // Wrap code in try/catch block to return error stack in the response body
  try {
    // starting over
    if (request.method.toLowerCase() == 'get') {
      let response = await doGET(request);
      return response;
    } else if(request.method.toLowerCase() === 'post') {
      console.log('post');
      let response = await doPOST(request);
      return response;
    }





/*

        if(sent_salt){
          if(!existing_salt){

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
*/
    // return Response
    console.log('invoking final default response');
    // default response is NOT a function
    // so don't put extra parens on this
    let r = response();
    //console.log(r);
    return new Response(r.responseObj.body, r.responseInit);

  } catch (e) {
      // Display the error stack.
      return new Response(e.stack || e)
  }
}
