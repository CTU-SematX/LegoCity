package server

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/smartcity/proxy-service/config"
	"github.com/smartcity/proxy-service/middleware"
	"github.com/smartcity/proxy-service/proxy"
)

// Server represents the HTTP server with all dependencies
type Server struct {
	cfg            *config.Config
	httpServer     *http.Server
	proxy          *proxy.ReverseProxy
	authMiddleware *middleware.AuthMiddleware
}

// New creates a new server instance
func New(cfg *config.Config, reverseProxy *proxy.ReverseProxy, authMiddleware *middleware.AuthMiddleware) *Server {
	srv := &Server{
		cfg:            cfg,
		proxy:          reverseProxy,
		authMiddleware: authMiddleware,
	}

	// Create HTTP handler
	handler := http.HandlerFunc(srv.handleRequest)

	// Create HTTP server with timeouts
	srv.httpServer = &http.Server{
		Addr:         net.JoinHostPort("", cfg.Port),
		Handler:      handler,
		ReadTimeout:  time.Duration(cfg.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(cfg.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(cfg.IdleTimeout) * time.Second,
	}

	return srv
}

// handleRequest is the main HTTP handler with authentication logic
func (s *Server) handleRequest(w http.ResponseWriter, r *http.Request) {
	// Validate authentication if needed (POST requests)
	if !s.authMiddleware.Validate(w, r) {
		return
	}

	// Forward request to upstream server
	s.proxy.ServeHTTP(w, r)
}

// Start starts the HTTP server with graceful shutdown support
func (s *Server) Start() error {
	// Setup graceful shutdown
	idleConnsClosed := make(chan struct{})
	go s.setupGracefulShutdown(idleConnsClosed)

	// Start server
	log.Printf("Proxy server is ready and listening on :%s", s.cfg.Port)
	log.Printf("Forwarding requests to: %s", s.cfg.UpstreamBaseURL)

	if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}

	// Wait for graceful shutdown to complete
	<-idleConnsClosed
	log.Println("Server stopped gracefully")
	return nil
}

// setupGracefulShutdown handles OS signals for graceful shutdown
func (s *Server) setupGracefulShutdown(done chan struct{}) {
	sigch := make(chan os.Signal, 1)
	signal.Notify(sigch, syscall.SIGINT, syscall.SIGTERM)
	sig := <-sigch
	log.Printf("Received shutdown signal: %v", sig)

	// Give active connections time to finish
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(s.cfg.ShutdownTimeout)*time.Second)
	defer cancel()

	if err := s.httpServer.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}
	close(done)
}
