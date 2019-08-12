// saltmine.js deployed via wrangler
//
// THIS VERSION IS STRIPPED DOWN FOR CLOSED ALPHA !!!
//
import { logging }	from './log.js';

const log = logging.getLogger('resolver.js');
log.setLevel('error');


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

/**
 * Utility function for sha256 hashing
 * @param {String} seed
 */
async function sha256( seed ) {
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
async function entropy( length ) {
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

async function getSaltmineDataByEmail( email ) {
    return await SALTMINE.get( email, 'json' );
}

async function putSaltmineData( email, newJSON ) {
    const payload = JSON.stringify( newJSON );
    
    log.info("Storing data for email (%s): %s", email, payload );

    await SALTMINE.put( email, payload );
}

//
// THIS VERSION IS STRIPPED DOWN FOR CLOSED ALPHA !!!!!!
//
/**
 * Utility function responseObj
 */
async function parseRequest ( request ) {
    const url		= new URL( request.url );
    const method	= request.method.toLowerCase();
    const content_type	= request.headers.get("Content-Type");
    
    const requestObj	= {
	method,
	"token": url.searchParams.get("token"),
    };
    
    log.debug("Parsing request: %s %s", method, url );
    if ( method === 'post' && content_type === 'application/x-www-form-urlencoded' ) {
	requestObj.hasForm		= true;
	
	const data			= await request.formData();
	const email			= data.get('email');
	
	requestObj.email		= email;
	requestObj.sent_salt		= data.get('salt');
	
	if ( email ) {
	    const sm_data		= await getSaltmineDataByEmail( email );
	    
	    if ( sm_data ) {
		log.info("Found existing data for '%s': %s", email, sm_data );
		requestObj.status	= sm_data.status;
		requestObj.token	= sm_data.token;
		requestObj.salt		= sm_data.salt;
	    } else {
		// something ?
	    }
	}
    }

    log.debug("Parsed request object: %s", requestObj );
    return requestObj;
};


/**
 * Utility function responseInit
 * @param {int} responseStatus
 */
const responseInitGenerator = ( status ) => {
    return {
	status,
	headers: {
	    'Access-Control-Allow-Origin': '*'
	}
    };
};

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
    log.info("Getting response generator for code: %s", responseCode );
    const responseData =  {
	// USE CASE: When successful GET API call was made for entropy.
	'return entropy' : (prng) => {
	    return {
		body: prng.toString(),
		init: responseInitGenerator(200)
	    };
	},
	// USE CASE: When user has successfully signed up or logged in, returning salt to user.
	'return salt' : (salt) => {
	    return {
		body: {salt: salt},
		init: responseInitGenerator(200)
	    };
	},
	// USE CASE: Error-handling for misconfigured headers
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

	// ALL CURRENTLY IMPLEMENTED RESPONSES ARE HERE
	if (requestObj.method === 'get' && !requestObj.token) {
	    // 1. GET call for ENTROPY: return crypto string as entropy; status code 200
	    // try/catch ?
	    let prng = await entropy(32);
	    // return entropy
	    const {body, init} = responseGenerator('return entropy')(prng);
	    return new Response(body, init);

	} else if (requestObj.method === 'post' && !requestObj.hasForm) {
	    // 2. POST with no content-type header: return status code 415
	    const {body, init} = responseGenerator('no content-type')();
	    return new Response(body, init);

	} else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.salt && !requestObj.sent_salt) {
	    // 3. Email sent ONLY & email has existing salt: keep existing salt & return existing salt; status code 200
	    // Context: Returning user logs in.

	    //console.log('data found',requestObj.salt);
	    const {body, init} = responseGenerator('return salt')(requestObj.salt);
	    const user_message = {message:"Log-in successful."}
	    const msg_body = {...body, user_message};
	    const stringified_body = JSON.stringify(msg_body);
	    return new Response(stringified_body, init);

	} else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && !requestObj.sent_salt) {
	    // 4. Email sent ONLY, & email does NOT have existing salt : gen salt, store email and salt & return salt; status code 200
	    // Context: User 'signs up' on 'log in' page.
	    let enc_email = encodeURIComponent(requestObj.email);
	    log.info("Generate salt");
	    // generate salt via function above
	    let salt = await sha256(enc_email);
	    // store email and salt, put
	    // try/catch ?
	    await putSaltmineData(requestObj.email, {
		"status": "active",
		"salt": salt
	    });
	    // return salt
	    const {body, init} = responseGenerator('return salt')(salt);
	    const user_message = {message:"Created entropy and new salt for new user."}
	    const msg_body = {...body, user_message};
	    const stringified_body = JSON.stringify(msg_body);
	    return new Response(stringified_body, init);

	} else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.salt && requestObj.sent_salt) {
	    // 5. Email & Salt sent, but email alredy has existing salt: keep existing salt & return existing salt and user message; status code 200
	    // Context: Returning user tries to `log in` on `sign up` page.

	    //console.log('data found',requestObj.salt);
	    const {body, init} = responseGenerator('return salt')(requestObj.salt);
	    const user_message = {message:"User already exists."}
	    const msg_body = {...body, user_message};
	    const stringified_body = JSON.stringify(msg_body);
	    return new Response(stringified_body, init);

	} else if (requestObj.method === 'post' && requestObj.hasForm && requestObj.email && requestObj.sent_salt && !requestObj.salt) {
	    // 6. Email & Salt sent, and email does NOT have existing salt : store email and salt (put) & return salt; status code 200
	    // Context: User signs up for first time.
	    // try/catch ?
	    await putSaltmineData(requestObj.email, {
		"status": "active",
		"salt": requestObj.sent_salt
	    });
	    // return salt
	    const {body, init} = responseGenerator('return salt')(requestObj.sent_salt);
	    const user_message = {message:"Produced new salt for new user."}
	    const msg_body = {...body , user_message};
	    const stringified_body = JSON.stringify(msg_body);
	    return new Response(stringified_body, init);
	}

	// 7. DEFAULT : if everything above fails to match, return default Response, 500
	// console.log('invoking final default response');
	// default response is NOT a function
	// so don't add extra parens on this
	const {body, init} =  responseGenerator();

	log.debug("Final response: %s", body );
	return new Response(body, init);

    } catch ( err ) {
	log.error("Failed to process request: %s", String(err) );
	console.log( err );
	return new Response( err.stack || err );
    }
}

export {
    log,
    handleRequest,
};
