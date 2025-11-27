package proxy

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/smartcity/proxy-service/utils"
)

// ReverseProxy wraps the standard reverse proxy with custom logic
type ReverseProxy struct {
	proxy *httputil.ReverseProxy
}

// NewReverseProxy creates a new reverse proxy to the upstream URL
func NewReverseProxy(upstreamURL *url.URL) *ReverseProxy {
	proxy := &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			originalPath := req.URL.Path
			originalQuery := req.URL.RawQuery

			// Rewrite request to point to upstream server
			req.URL.Scheme = upstreamURL.Scheme
			req.URL.Host = upstreamURL.Host
			req.URL.Path = singleJoiningSlash(upstreamURL.Path, originalPath)
			req.Host = upstreamURL.Host

			// Preserve query string
			if originalQuery != "" {
				req.URL.RawQuery = originalQuery
			}

			log.Printf("Forwarding: %s %s to %s", req.Method, originalPath, req.URL.String())
		},

		ModifyResponse: func(resp *http.Response) error {
			return nil
		},

		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			// log.Printf("ERROR proxying request: method=%s path=%s error=%v",
			// r.Method, r.URL.Path, err)
			utils.WriteJSONError(w, http.StatusBadGateway, "Failed to reach upstream server")
		},
	}

	return &ReverseProxy{proxy: proxy}
}

// ServeHTTP forwards the request to the upstream server
func (p *ReverseProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	p.proxy.ServeHTTP(w, r)
}

// singleJoiningSlash joins URL paths properly
func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}
