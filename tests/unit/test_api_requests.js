const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.DEBUG_LEVEL || 'fatal',
});

const fs				= require('fs');
const assert				= require('assert');
const Cloudworker			= require('@dollarshaveclub/cloudworker');

const worker_code			= fs.readFileSync('./dist/worker.js', 'utf8');

const serialize				= function (obj) {
    var str = [];
    for (var p in obj)
	if (obj.hasOwnProperty(p)) {
	    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	}
    return str.join("&");
}


const domain				= "example.com";
const hash				= "made_up_happ_hash_for_test";
const host_list				= [
    "made_up_host_agent_id_for_test.holohost.net",
];
    


before(async function () {
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
});



describe('Worker Test', function() {

    it('send post data in urlencoded form', async function () {
	let req				= new Request('https://worker.example.com/', {
	    "method": "GET",
	});
	log.silly("%s", req );
	
	let resp			= await handleRequest( req );
	log.debug("%s", resp );
	let body			= await resp.text();
	log.debug("%s", body );

	assert.equal( resp.status, 200 );
	assert.equal( resp.headers.get('Access-Control-Allow-Origin'), '*' );
	assert.equal( body.length, 64 );
    })

    // it('send post data in JSON form', async function () {
    // 	let req				= new Request('https://worker.example.com/', {
    // 	    "method": "POST",
    // 	    "body": JSON.stringify({
    // 		"url": domain,
    // 	    }),
    // 	    "headers": {
    // 		"Content-Type": "application/json",
    // 	    },
    // 	});
	
    // 	let resp			= await handleRequest( req );
    // 	let body			= await resp.json();
	
    // 	assert.deepEqual( body, {
    // 	    "hash": hash,
    // 	    "hosts": host_list,
    // 	    "requestURL": domain,
    // 	});
    // })

});
