var assert = require('assert');
var expect = require('chai').expect;

// mock this so we can import saltmine
global.addEventListener = (name, callback) => {}
var { Request, Response } = require('node-fetch');
global.Request = Request;
global.Response = Response;

var rewire = require("rewire");
var saltmine = rewire("../saltmine.js");

var handleRequest = saltmine.__get__('handleRequest')

// /*====================================
// =            handleRequest            =
// ====================================*/
describe('handleRequest', () => {
  it('should handle a GET request', async () => {

    const request = new Request('someurl', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: undefined
    })

    const response = await handleRequest(request);
    expect(response.status).to.equal(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');

  })
})

// /*=====  End of parseRequest  ======*/
