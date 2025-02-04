all: build

build:
	CGO_ENABLED=0 go build -o bin/installer

release:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/installer_linux_amd64
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o bin/installer_linux_arm64

clean:
	rm -f bin/installer
	rm -f bin/installer_linux_amd64
	rm -f bin/installer_linux_arm64
