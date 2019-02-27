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
  // all the types of requests we respond to
  // and the responses
  /*
  DEFAULT response is 500
  GET
    return crypto string, 200
  GET with token
    token invalid, return 401
    token valid, use email to get salt, return salt, 200
  POST with no content-type header
    return error, 415
  POST email but no salt
    ?
  POST email and salt
    salt valid, do stuff, return salt, 200
    salt invalid, do stuff, email token, return salt, 200
  POST invalid email not found in KV store
    return crypto string, same as GET, 200
  POST email with valid salt
    return retrieved salt, 200
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
      let existing_data = JSON.parse(await getDataByEmail(requestObj.email));
      if(existing_data){
        console.log('data found',existing_data);
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
  'token' : (token) => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = token;
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
  'no sent salt' : () => {
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
  'existing salt' : (salt) => {
    console.log(response);
    responseInit.status = 200;
    responseObj.body = salt;
    return {responseObj, responseInit};
  }
})[response] || ( () => {
  note = 'default response';
  console.log(note);
  responseInit.status = 500;
  responseObj.body = note;
  return {responseObj, responseInit};
} )();

async function getDataByEmail(email){
  existing_data = await SALTMINE.get(email);
  return existing_data;
}
function sendTokenEmail(email,token){
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
    let requestObj = await parseRequest(request);
    console.log(requestObj);

    // ALL RESPONSES ARE HERE
    if (requestObj.method === 'get' && !requestObj.token) {
      // return random
      let prng = await entropy(32);
      let r = response('no token')(prng);
      return new Response(responseObj.body, responseInit);
    } else if (requestObj.method === 'get' && requestObj.token) {
      let incoming_token = requestObj.token;
      //console.log('incoming token', incoming_token);
      // try to get from KV store
      let store_token_email = await EMAIL_TOKEN_STORE.get(incoming_token);
      //console.log('store_token_email',store_token_email);
      // if token is invalid
      if(!store_token_email){
        // return Invalid token
        console.log("Invalid token", incoming_token);
        // return 401
        return new Response('Invalid token', {status: 401});
      }
      // if token is valid
      // 1. use email to get data
      // 2. set status to active
      // 3. delete token entry
      // 4. return salt
      if(store_token_email){
        //console.log("Valid token", incoming_token);
        // try to get from KV store
        // TO DO :: need to try/catch this
        try {
          // 1. get data
          let json = await SALTMINE.get(store_token_email, "json");
          //console.log("retrieved json", json)
          // 2. change data
          salt = json.salt;
          newJSON = {
            "status": "active",
            "salt": salt
          }
          //console.log("new json", newJSON)
          await SALTMINE.put(store_token_email, JSON.stringify(newJSON));
          // 3. delete token
          // NAMESPACE.delete(key)
          // not active at this time
          // TO DO :: try/catch this if we need it to succeed
          // EMAIL_TOKEN_STORE.delete(incoming_token)
          // 4. return salt
          //console.log("retrieved salt", salt)
          let r = response('existing salt')(salt);
          return new Response(responseObj.body, responseInit);
        } catch (e) {
          // Display the error stack.
          return new Response(e.stack || e)
        }
      }
    } else if (requestObj.method === 'post' && !requestObj.hasForm) {
      // no content-type
      let r = response('no content-type')();
      return new Response(responseObj.body, responseInit);
      //return response;
    } else if (requestObj.method === 'post' && requestObj.hasForm && !requestObj.email) {
      // no email
      let r = response('no email')();
      return new Response(responseObj.body, responseInit);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && !requestObj.sent_salt) {
      // no sent salt
      let r = response('no sent salt')();
      return new Response(responseObj.body, responseInit);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.sent_salt && !requestObj.salt) {
      // no existing salt
      // 2. email token, write data:
      // this is for later
      let prng = await entropy(4);
      // sendTokenEmail(email,prng);
      // let values = "something goes here";
      //writeData(values);
      let r = response('sent salt')(requestObj.sent_salt);
      return new Response(responseObj.body, responseInit);
    } else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.sent_salt && requestObj.salt) {
      // 3. if existing, then what?
      // waiting for clarification here
      console.log('data found',requestObj.salt);
      let r = response('existing salt')(requestObj.salt);
      return new Response(responseObj.body, responseInit);
    }
/*
        if(sent_salt){
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
              // no json retrieved from kv
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
