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
    const request = new Request('http://someurl', {
      method: 'GET'
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body.length).to.equal(64);
    console.log(response.headers)
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
  })


  it('should handle a POST request with content-type form and no params', async () => {
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
  })

  it('should handle a POST request with content-type form and email and salt', async () => {
      const request = new Request('http://someurl?email=asdfg&salt=12345', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const response = await handleRequest(request);
      console.log(response)
      expect(response.status).to.equal(200);
      expect(response.body).to.equal('12345'); // return the salt back again
      expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
    })
  })

  it('should handle a GET request with an email only', async () => {
    // let mockSalt = await entropy(32);

    const postRequest = new Request('http://someurl?email=asdfg&salt=12345', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const request = new Request('http://someurl?email=asdfg', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body).to.equal('12345'); // return back the salt back registred in previous POST
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
  })


  it('should handle a POST request with content-type form and an email only', async () => {
    const request = new Request('http://someurl?email=asdfg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const response = await handleRequest(request);
    console.log(response)
    expect(response.status).to.equal(200);
    expect(response.body.length).to.equal(10); // this is just because of our mock hash implementation
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
  })




// it('should return a 404 error message when making a GET request with only an email that returns no salt', async () => {
//   const request = new Request('http://someurl?email=asdfg', {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded'
//     }
//   })
//
//   const response = await handleRequest(request);
//   console.log(response)
//   expect(response.status).to.equal(404);
//   expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
// })

/*=====  End of handleRequest  ======*/
