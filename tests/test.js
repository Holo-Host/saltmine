var assert = require('assert');
var expect = require('chai').expect;

require('./mocks');

var rewire = require("rewire");
var saltmine = rewire("../saltmine.js");

var handleRequest = saltmine.__get__('handleRequest')
// var entropy = saltmine.__get__('entropy')

/*====================================
=            handleRequest            =
====================================*/

describe('handleRequest', () => {

  it('should handle a GET request with no headers or body and return some entropy (64 bytes)', async () => {

   console.log(`\n`);
   console.log(`=========================`)
   console.log(`\n`);

    const request = new Request('http://someurl', {
      method: 'GET'
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body.length).to.equal(64);
    console.log(response.headers)
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

    console.log(`\n`);
  })


  it('should handle a POST request with content-type form and no params', async () => {
   console.log(`\n`);
   console.log(`=========================`)
   console.log(`\n`);

    const request = new Request('http://someurl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(500);
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

    console.log(`\n`);
  })

  it('should handle a POST request with content-type form and email and salt', async () => {
    console.log(`\n`);
    console.log(`=========================`)
    console.log(`\n`);

    const request = new Request('http://someurl?email=asdfg&salt=12345', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body.salt).to.equal('12345'); // return the salt back again
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

    console.log(`\n`);
  })


  it('should handle a POST request with content-type form and email and salt, when user is already registered', async () => {
    console.log(`\n`);
    console.log(`=========================`)
    console.log(`\n`);

    const request = new Request('http://someurl?email=asdfg&salt=56789', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body).to.equal('[object Object]'); // return the original salt back again, not the new salt
    expect(response.body.message).to.equal('User already exists.'); // return the original salt back again, not the new salt
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

    console.log(`\n`);
  })


  it('should handle a POST request with content-type form and an email only', async () => {
    console.log(`\n`);
    console.log(`=========================`)
    console.log(`\n`);

    const request = new Request('http://someurl?email=asdfg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body.salt.length).to.equal(10); // this is just because of our mock hash implementation
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

    console.log(`\n`);
  })
})
/*=====  End of handleRequest  ======*/
