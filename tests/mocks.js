
// mocks that are required for a cloudflare worker to run correctly in node

module.exports = (() => {

	global.addEventListener = (name, callback) => {}

	var { Request, Response } = require('node-fetch');

	Request.prototype['formData'] = function() {
	  var obj
	  try {
	    var str = this.url.split('?')[1]
	    obj = str.split("&").reduce(function(prev, curr, i, arr) {
	      var p = curr.split("=");
	      prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
	      return prev;
	    }, {});
	  } catch (e) {
	    obj = {}
	  }
	  return {get: i => obj[i]}
	}

	// set these on the global object for the worker
	global.Request = Request;
	global.Response = Response;
	global.URL = require('url').URL;
	global.TextEncoder = require('util').TextEncoder;


	// a stubbed keyvalue store that exists for the life of the test
	let kv = {}
	global.SALTMINE = {
	  get: k => { 
	    console.log(`getting ${k} = ${kv[k]}`)
	    return JSON.stringify(kv[k]) || JSON.stringify({})
	  },
	  put: (k, v) => {
	    console.log(`storing ${k} = ${v}`)
	    kv[k] = v
	  }
	}


	// very stubbed crypto functions
	global.crypto = {
	  getRandomValues: arr => arr,
	  subtle: {
	    digest: (algo, buffer) => buffer
	  }
	};

})();