.PHONY: test lint build run clean proto proto-go proto-ts sync-dashboard sync-dashboard-check

# ============================================
# Dashboard Sync Targets
# ============================================

UPSTREAM_REPO := CTU-SematX/Lego-Dashboard
DASHBOARD_PATH := dashboard

# Check for upstream dashboard updates
sync-dashboard-check:
	@echo "Checking for Lego-Dashboard updates..."
	@CURRENT=$$(jq -r '.version // "unknown"' $(DASHBOARD_PATH)/package.json); \
	UPSTREAM=$$(jq -r '.upstreamVersion // "unknown"' $(DASHBOARD_PATH)/package.json); \
	echo "Current version: $$CURRENT"; \
	echo "Upstream synced: $$UPSTREAM"; \
	echo "Check https://github.com/$(UPSTREAM_REPO)/releases for latest version"

# Sync dashboard from upstream (requires git)
sync-dashboard:
	@echo "Syncing dashboard from Lego-Dashboard..."
	@if [ -z "$(VERSION)" ]; then \
		echo "Usage: make sync-dashboard VERSION=v0.4.0-alpha"; \
		exit 1; \
	fi
	@echo "Cloning Lego-Dashboard $(VERSION)..."
	@rm -rf /tmp/lego-dashboard-sync
	@git clone --depth 1 --branch $(VERSION) https://github.com/$(UPSTREAM_REPO).git /tmp/lego-dashboard-sync
	@echo "Backing up LegoCity customizations..."
	@mkdir -p /tmp/legocity-backup
	@[ -f "$(DASHBOARD_PATH)/.env" ] && cp "$(DASHBOARD_PATH)/.env" /tmp/legocity-backup/ || true
	@[ -f "$(DASHBOARD_PATH)/.env.local" ] && cp "$(DASHBOARD_PATH)/.env.local" /tmp/legocity-backup/ || true
	@[ -d "$(DASHBOARD_PATH)/overrides" ] && cp -r "$(DASHBOARD_PATH)/overrides" /tmp/legocity-backup/ || true
	@echo "Syncing source files..."
	@for item in src/app src/blocks src/collections src/components src/fields src/Footer src/Header src/heros src/hooks src/lib src/plugins src/providers src/search src/types src/utilities src/access; do \
		if [ -e "/tmp/lego-dashboard-sync/$$item" ]; then \
			rm -rf "$(DASHBOARD_PATH)/$$item"; \
			cp -r "/tmp/lego-dashboard-sync/$$item" "$(DASHBOARD_PATH)/$$item"; \
			echo "  Synced: $$item"; \
		fi \
	done
	@echo "Syncing config files..."
	@for file in package.json tsconfig.json next.config.js tailwind.config.mjs postcss.config.js eslint.config.mjs vitest.config.mts components.json; do \
		if [ -f "/tmp/lego-dashboard-sync/$$file" ]; then \
			cp "/tmp/lego-dashboard-sync/$$file" "$(DASHBOARD_PATH)/$$file"; \
			echo "  Synced: $$file"; \
		fi \
	done
	@echo "Restoring LegoCity customizations..."
	@[ -f "/tmp/legocity-backup/.env" ] && cp /tmp/legocity-backup/.env "$(DASHBOARD_PATH)/" || true
	@[ -f "/tmp/legocity-backup/.env.local" ] && cp /tmp/legocity-backup/.env.local "$(DASHBOARD_PATH)/" || true
	@[ -d "/tmp/legocity-backup/overrides" ] && cp -r /tmp/legocity-backup/overrides "$(DASHBOARD_PATH)/" || true
	@echo "Updating version reference..."
	@cd $(DASHBOARD_PATH) && jq --arg ver "$(VERSION)" '.upstreamVersion = $$ver' package.json > package.json.tmp && mv package.json.tmp package.json
	@rm -rf /tmp/lego-dashboard-sync /tmp/legocity-backup
	@echo ""
	@echo "✅ Dashboard synced to $(VERSION)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. cd $(DASHBOARD_PATH) && pnpm install"
	@echo "  2. Review changes with: git diff $(DASHBOARD_PATH)"
	@echo "  3. Test: cd $(DASHBOARD_PATH) && pnpm test"
	@echo "  4. Commit changes"

# ============================================
# Protobuf Targets
# ============================================

proto: proto-go proto-ts
	@echo "All protobuf files generated successfully"

proto-go:
	@echo "Generating Go protobuf files..."
	@mkdir -p backend/types
	protoc --go_out=backend/types --go_opt=paths=source_relative \
		--go-grpc_out=backend/types --go-grpc_opt=paths=source_relative \
		--proto_path=proto \
		proto/*.proto
	@echo "Go types generated in backend/types"

proto-ts:
	@echo "Generating TypeScript protobuf files..."
	@mkdir -p frontend/types
	protoc --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
		--ts_proto_out=frontend/types \
		--ts_proto_opt=esModuleInterop=true \
		--ts_proto_opt=outputJsonMethods=true \
		--proto_path=proto \
		proto/*.proto
	@echo "TypeScript types generated in frontend/types"

# Run tests
test:
	cd backend && go test -v ./...

# Lint the code
lint:
	cd backend && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	cd backend && golangci-lint run

# Build the backend
build:
	cd backend && go build -o ../bin/smartcity main.go

# Run the backend
run:
	cd backend && go run main.go

# Clean build artifacts
clean:
	rm -rf bin/
