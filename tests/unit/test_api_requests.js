const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.DEBUG_LEVEL || 'fatal',
});

const fs				= require('fs');
const assert				= require('assert');
const axios				= require('axios');
const Cloudworker			= require('@dollarshaveclub/cloudworker');
const { Response }			= Cloudworker;

const worker_code			= fs.readFileSync('./dist/worker.js', 'utf8');

const serialize				= function (obj) {
    var str = [];
    for (var p in obj)
	if (obj.hasOwnProperty(p)) {
	    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	}
    return str.join("&");
}



async function setup_for_cloudworker () {
    const bindings			= {
	//
	// Key value store for getting the entropy by email
	//
	"SALTMINE": new Cloudworker.KeyValueStore(),
    };

    const cw				= (new Cloudworker( worker_code, { bindings } )).context;

    const methods			= [
	"handleRequest", "Request", "SALTMINE",
    ];

    Object.assign( global, Object.fromEntries( methods.map(n => [n, cw[n]]) ));

    cw.log.setLevel( process.env.WORKER_DEBUG_LEVEL || 'error' );
}

async function setup_for_service_worker ( staging_url ) {
    global.Request = function Request ( url, config ) {
	this.url = url;
	this.config = config;
    }
    
    global.handleRequest = async function ( req ) {
	let response;
	try {
	    response			= await axios({
		"url": staging_url,
		"method": "POST",
		"transformResponse": null,
		"data": req.config.body,
		"headers": req.config.headers,
	    });
	} catch ( err ) {
	    log.error("%s", err );
	    response			= err.response;
	}

	return new Response( response.data, {
	    "status": response.status,
	    "headers": response.headers,
	});
    }
}


before(async function () {
    if ( process.env.TESTING_URL )
	await setup_for_service_worker( process.env.TESTING_URL );
    else
	await setup_for_cloudworker();
});


describe("Worker Test", function() {

    it("should get (64 byte) entropy with no input", async function () {
	let req				= new Request("https://worker.example.com/", {
	    "method": "GET",
	});
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.text();
	log.info("%s", body );

	assert.equal( resp.status, 200 );
	assert.equal( resp.headers.get("Access-Control-Allow-Origin"), "*" );
	assert.equal( body.length, 64 );
    });
    
    it("should create new entropy with email and salt input", async function () {
	let req				= new Request("https://worker.example.com", {
	    "method": "POST",
	    "body": serialize({
		"email": "asdfg",
		"salt": 12345,
	    }),
	    "headers": {
		"Content-Type": "application/x-www-form-urlencoded"
	    }
	});
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.json();
	log.info("%s", body );

	assert.equal( resp.status, 200 );
	assert.equal( resp.headers.get("Access-Control-Allow-Origin"), "*" );
	assert.equal( body.salt, '12345' );
    });
    
    it("should get existing entropy for email and salt input", async function () {
	let req				= new Request("https://worker.example.com", {
	    "method": "POST",
	    "body": serialize({
		"email": "asdfg",
		"salt": 56789,
	    }),
	    "headers": {
		"Content-Type": "application/x-www-form-urlencoded"
	    }
	});
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.json();
	log.info("%s", body );

	assert.equal( resp.status, 200 );
	assert.equal( resp.headers.get("Access-Control-Allow-Origin"), "*" );
	assert.equal( body.salt, '12345' );
    });
    
    it("should create new entropy with email input", async function () {
	let req				= new Request("https://worker.example.com", {
	    "method": "POST",
	    "body": serialize({
		"email": "test@example.com",
	    }),
	    "headers": {
		"Content-Type": "application/x-www-form-urlencoded"
	    }
	});
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.json();
	log.info("%s", body );

	assert.equal( resp.status, 200 );
	assert.equal( resp.headers.get("Access-Control-Allow-Origin"), "*" );
	assert.equal( body.salt.length, '64' );
    });

    
    // Failure modes
    
    it("should fail when POST request has no input", async function () {
	let req				= new Request("https://worker.example.com/", {
	    "method": "POST",
	    "headers": {
		"Content-Type": "application/x-www-form-urlencoded"
	    }
	});
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.text();
	log.info("%s", body );

	assert.equal( resp.status, 500 );
	assert.equal( resp.headers.get("Access-Control-Allow-Origin"), "*" );
	assert.equal( body.length, 0 );
    });

});
