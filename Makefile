.PHONY: build build-release build-arm build-x86 test clean

build-release:
	@if [ -z "$(tag)" ]; then \
		echo "Error: tag is required. Usage: make build-release tag=<tag>"; \
		exit 1; \
	fi
	docker buildx build --platform linux/arm64,linux/amd64 -t fosrl/pangolin:latest -f Dockerfile --push .
	docker buildx build --platform linux/arm64,linux/amd64 -t fosrl/pangolin:$(tag) -f Dockerfile --push .
	docker buildx build --platform linux/arm64,linux/amd64 -t fosrl/pangolin:postgresql-latest -f Dockerfile.pg --push .
	docker buildx build --platform linux/arm64,linux/amd64 -t fosrl/pangolin:postgresql-$(tag) -f Dockerfile.pg --push .

build-arm:
	docker buildx build --platform linux/arm64 -t fosrl/pangolin:latest .

build-x86:
	docker buildx build --platform linux/amd64 -t fosrl/pangolin:latest .

build:
	docker build -t fosrl/pangolin:latest .

test:
	docker run -it -p 3000:3000 -p 3001:3001 -p 3002:3002 -v ./config:/app/config fosrl/pangolin:latest

clean:
	docker rmi pangolin
