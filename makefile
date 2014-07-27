NODE=node
QUNIT=node_modules/qunit-cli/bin/qunit-cli
TSC=node_modules/typescript/bin/tsc.js
OUT=bin
TS_LIST=$(call rwildcard,src/,*.ts)
TEST_FILES=$(call rwildcard,$(OUT)/tests/,*.js)

rwildcard=$(filter $(subst *,%,$2),$(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2) $d))

all: build test

.PHONY: npm
npm:
	npm install

.PHONY: build
build: npm
	$(NODE) $(TSC) -m commonjs -t es5 --outDir $(OUT) $(TS_LIST)

define TEST_RUN
$(NODE) $(QUNIT) $(1);
endef

.PHONY: test
test: build
	$(NODE) $(QUNIT) $(TEST_FILES)

.PHONY: clean
clean:
	rm -rf $(OUT)
