var assert = require('assert');
var expect = require('chai').expect;

// mock this so we can import saltmine
global.addEventListener = (name, callback) => {}
var { Request, Response } = require('node-fetch');
global.Request = Request;
global.Response = Response;

var rewire = require("rewire");
var saltmine = rewire("../saltmine.js");

var responseGenerator = saltmine.__get__('responseGenerator')
var handleRequest = saltmine.__get__('handleRequest')

/*=========================================
=            responseGenerator            =
=========================================*/

describe('responseGenerator', () => {
  it('should give the default response if no params given', () => {
    
    const expectedBody = undefined
    const expectedInit =  {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    }

    const {body, init} =  responseGenerator();
    expect(body).to.deep.equal(expectedBody);
    expect(init).to.deep.equal(expectedInit);

  });
});




// /*=====  End of responseGenerator  ======*/
