
./node_modules:
	npm install

test:		./node_modules
	npm run build && npm run test

test-debug:	./node_modules
	npm run build &&				\
		DEBUG_LEVEL=silly			\
		WORKER_DEBUG_LEVEL=trace		\
		./node_modules/.bin/mocha -c --recursive ./tests
