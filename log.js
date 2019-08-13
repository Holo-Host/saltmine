
import * as chalker	from 'chalk';
import * as logging	from 'loglevel';
import * as prefix	from 'loglevel-plugin-prefix';

const chalk		= chalker.constructor({ enabled: true });
chalk.level		= 3;

const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red,
};

prefix.reg( logging );
prefix.apply( logging, {
    levelFormatter( level ) {
    	return ( level.toUpperCase() + "     " ).slice(0,5);
    },
    timestampFormatter( date ) {
	return date.toISOString();
    },
    format(level, name, timestamp) {
	let t		= chalk.gray(`[${timestamp}]`);
	let l		= colors[ level.trim() ]( level );
	let n		= chalk.green(`${name}:`);
	
	return `${t} ${l} ${n}`;
    },
});

export {
    logging,
};
