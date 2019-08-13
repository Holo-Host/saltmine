
const path			= require('path');
const npm_conf			= require('./package.json');

module.exports			= {
    entry: './saltmine.js',

    // Not optional - must compile for a 'webworker' target or else several expectations (such as
    // the `global` variable) won't be available.
    target: 'webworker',

    // Required for testing - without this setting, the `handleRequest` method won't be visible for
    // our unit testing framework.
    output: {
	libraryTarget: 'global',
    },
};
