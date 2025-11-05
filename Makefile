.PHONY: test lint build run clean proto proto-go proto-ts

proto: proto-go proto-ts
	@echo "All protobuf files generated successfully"

proto-go:
	@echo "Generating Go protobuf files..."
	@mkdir -p backend/types
	protoc --go_out=backend/types --go_opt=paths=source_relative \
		--go-grpc_out=backend/types --go-grpc_opt=paths=source_relative \
		--proto_path=proto \
		proto/weather.proto
	@echo "Go types generated in backend/types"

proto-ts:
	@echo "Generating TypeScript protobuf files..."
	@mkdir -p frontend/types
	protoc --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
		--ts_proto_out=frontend/types \
		--ts_proto_opt=esModuleInterop=true \
		--ts_proto_opt=outputJsonMethods=true \
		--proto_path=proto \
		proto/weather.proto
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
