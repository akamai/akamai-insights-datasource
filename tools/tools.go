//go:build tools
// +build tools

// Package tools pins security-sensitive indirect dependencies so that
// `go mod tidy` does not remove their explicit version floor from go.mod.
// These blank imports are never compiled into production binaries.
package tools

import (
	_ "github.com/apache/thrift/lib/go/thrift"
	_ "github.com/go-jose/go-jose/v4"
	_ "github.com/yuin/goldmark"
)
