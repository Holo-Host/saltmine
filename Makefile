
./node_modules:
	npm install


.PHONY: test test-debug test-live
test:		./node_modules
	npm run build && npm run test

test-debug:	./node_modules
	npm run build &&				\
		DEBUG_LEVEL=silly			\
		WORKER_DEBUG_LEVEL=trace		\
		./node_modules/.bin/mocha -c --recursive ./tests

# CI tests depend on ./node_modules as defined in the package-lock.json file;
# the `npm ci` command ensures that node_modules is generated from it.
# Run these targets with the appropriate CF_EMAIL="..." CF_API_KEY="..."
# environment variables to allow the `wrangler publish ...` to proceed.
.PHONY: test-ci test-ci-deploy
test-ci:	test-ci-deploy
	DEBUG_LEVEL=silly				\
	WORKER_DEBUG_LEVEL=trace			\
	TESTING_URL=http://saltmine-ci.holohost.net	\
		npx mocha -c --recursive ./tests

test-ci-deploy:	wrangler-ci.toml
	npm ci
	npm run build
	cp wrangler-ci.toml wrangler.toml
	echo "Deploy dist/worker.js to http://saltmine-ci.holohost.net"
	npx wrangler publish --release \
	  || ( echo "Failed to deploy Cloudflare worker"; exit 1 )
	sleep 15 # allow time for Cloudflare to propagate Service workers
	echo "Lookup example.com mapping via http://saltmine-ci.holohost.net"
