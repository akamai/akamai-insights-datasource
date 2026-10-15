package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

const testReportPath = "/reporting-api/v2/reports/delivery/traffic/current"
const testFrom = "2026-01-01T00:00:00Z"
const testTo = "2026-01-02T00:00:00Z"

func testSettings(host string) DataSourceSettings {
	return DataSourceSettings{
		Host: host, ClientToken: "test-client-token",
		AccessToken: "test-access-token", ClientSecret: "test-client-secret",
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}

func TestReportingHostValidation(t *testing.T) {
	for _, host := range []string{
		"akab-test.luna.akamaiapis.net", "https://akab-test.luna.akamaiapis.net", "akab-test.luna.akamaiapis.net:443", "https://akab-test.luna.akamaiapis.net:443",
		"AKAB-TEST.LUNA.AKAMAIAPIS.NET",
	} {
		t.Run(host, func(t *testing.T) {
			if _, err := newReportingClient(testSettings(host)); err != nil {
				t.Fatal(err)
			}
		})
	}
	for _, host := range []string{
		"", "http://akab-test.luna.akamaiapis.net", "//akab-test.luna.akamaiapis.net", "akab-test.luna.akamaiapis.net/",
		"akab-test.luna.akamaiapis.net/path", "akab-test.luna.akamaiapis.net?query=value", "akab-test.luna.akamaiapis.net?",
		"akab-test.luna.akamaiapis.net#fragment", "akab-test.luna.akamaiapis.net#", "user:password@akab-test.luna.akamaiapis.net",
		"akab-test.luna.akamaiapis.net:80", "akab-test.luna.akamaiapis.net:8443", "akab-test.luna.akamaiapis.net:", "akab-test.luna.akamaiapis.net:invalid",
		"akab-test.luna.akamaiapis.net\\path", "akab-test.luna.akamaiapis.net\n", "https:///akab-test.luna.akamaiapis.net",
		"attacker.test", "akamaiapis.net", "evilakamaiapis.net", "akamaiapis.net.attacker.test",
		"akab-test.luna.akamaiapis.net.attacker.test", "attacker.test/.akamaiapis.net",
		"attacker.test?.akamaiapis.net", "attacker.test#.akamaiapis.net", "127.0.0.1", "[::1]",
	} {
		t.Run("reject "+host, func(t *testing.T) {
			if _, err := newReportingClient(testSettings(host)); !errors.Is(err, errInvalidReportingRequest) {
				t.Fatalf("expected invalid configuration, got %v", err)
			}
		})
	}
}

func TestReportingPathsRejectURLOverrides(t *testing.T) {
	client, err := newReportingClient(testSettings("akab-test.luna.akamaiapis.net"))
	if err != nil {
		t.Fatal(err)
	}
	calls := 0
	client.httpClient.Transport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		calls++
		return nil, errors.New("unexpected outbound request")
	})
	for _, target := range []string{
		"", "https://attacker.test/report", "http://attacker.test/report",
		"https://akab-test.luna.akamaiapis.net" + testReportPath, "//attacker.test/report",
		"///attacker.test/report", "////attacker.test/report",
		"https://akab-test.luna.akamaiapis.net@attacker.test/report", "https://akab-test.luna.akamaiapis.net:8443" + testReportPath,
		"/other-api/v2/reports", "/reporting-api/v2/reports-extra/report",
		"/reporting-api/v1/reports/report", testReportPath + "?host=attacker.test",
		testReportPath + "?", testReportPath + "#fragment", testReportPath + "#",
		testReportPath + "/../..", testReportPath + "/./data", testReportPath + "//data",
		testReportPath + "/", testReportPath + "\\data", testReportPath + "/%2e%2e",
		testReportPath + "/%252e%252e", testReportPath + "%2fdata", testReportPath + "%5cdata",
		testReportPath + "\r\nHost: attacker.test", "https:attacker.test",
	} {
		t.Run(target, func(t *testing.T) {
			_, err := client.request(context.Background(), http.MethodGet, target, nil, nil)
			if !errors.Is(err, errInvalidReportingRequest) {
				t.Fatalf("expected invalid reporting request, got %v", err)
			}
		})
	}
	if calls != 0 {
		t.Fatalf("invalid targets caused %d outbound requests", calls)
	}
}

func TestReportingRequestsUseConfiguredOrigin(t *testing.T) {
	for _, target := range []string{
		ReportsApiUrl, testReportPath, strings.TrimPrefix(testReportPath, "/"),
		"/reporting-reports-executor-api/v2/reports/delivery/traffic",
	} {
		t.Run(target, func(t *testing.T) {
			client, err := newReportingClient(testSettings("https://akab-test.luna.akamaiapis.net:443"))
			if err != nil {
				t.Fatal(err)
			}
			calls := 0
			client.httpClient.Transport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
				calls++
				if req.URL.Scheme != "https" || req.URL.Host != "akab-test.luna.akamaiapis.net:443" || req.Host != "akab-test.luna.akamaiapis.net:443" {
					t.Fatalf("unexpected request destination: %s", req.URL)
				}
				if req.URL.Path != "/"+strings.TrimPrefix(target, "/") {
					t.Fatalf("unexpected request path: %s", req.URL.Path)
				}
				if !strings.HasPrefix(req.Header.Get("Authorization"), "EG1-HMAC-SHA256 ") {
					t.Error("request is not EdgeGrid signed")
				}
				if req.Header.Get("Request-Source") != "reporting-grafana-plugin" || req.Header.Get("User-Agent") == "" {
					t.Error("missing tracking headers")
				}
				return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader("{}")), Header: make(http.Header)}, nil
			})
			resp, err := client.request(context.Background(), http.MethodGet, target, nil, nil)
			if err != nil {
				t.Fatal(err)
			}
			resp.Body.Close()
			if calls != 1 {
				t.Fatalf("expected one outbound request, got %d", calls)
			}
		})
	}
}

func TestReportingRedirectsAreBlocked(t *testing.T) {
	for _, status := range []int{301, 302, 303, 307, 308} {
		for _, location := range []string{
			"https://attacker.test/report", "http://akab-test.luna.akamaiapis.net" + testReportPath,
			"//attacker.test/report", testReportPath + "/redirect",
		} {
			t.Run(http.StatusText(status)+" "+location, func(t *testing.T) {
				client, err := newReportingClient(testSettings("akab-test.luna.akamaiapis.net"))
				if err != nil {
					t.Fatal(err)
				}
				calls := 0
				client.httpClient.Transport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
					calls++
					return &http.Response{
						StatusCode: status, Header: http.Header{"Location": {location}},
						Body: io.NopCloser(strings.NewReader("")), Request: req,
					}, nil
				})
				resp, err := client.request(context.Background(), http.MethodGet, testReportPath, nil, nil)
				if resp != nil {
					resp.Body.Close()
				}
				if err == nil || calls != 1 {
					t.Fatalf("redirect was not blocked: requests=%d error=%v", calls, err)
				}
			})
		}
	}
}

func testPluginContext() backend.PluginContext {
	settings := testSettings("akab-test.luna.akamaiapis.net")
	return backend.PluginContext{DataSourceInstanceSettings: &backend.DataSourceInstanceSettings{
		DecryptedSecureJSONData: map[string]string{
			"host": settings.Host, "clientToken": settings.ClientToken,
			"accessToken": settings.AccessToken, "clientSecret": settings.ClientSecret,
		},
	}}
}

type resourceResponseSender struct {
	response *backend.CallResourceResponse
}

func (s *resourceResponseSender) Send(response *backend.CallResourceResponse) error {
	s.response = response
	return nil
}

func TestInvalidTargetsRejectedByAllEntryPoints(t *testing.T) {
	originalTransport := http.DefaultTransport
	t.Cleanup(func() { http.DefaultTransport = originalTransport })
	calls := 0
	http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		calls++
		return nil, errors.New("unexpected outbound request")
	})
	ds := &AkamaiEdgeDnsDatasource{}
	for _, target := range []string{"https://attacker.test/report", "//attacker.test/report", testReportPath + "/%2e%2e"} {
		for _, resource := range []string{"discovery", "data"} {
			t.Run(resource+" "+target, func(t *testing.T) {
				body, err := json.Marshal(DataRequest{From: testFrom, To: testTo})
				if err != nil {
					t.Fatal(err)
				}
				sender := &resourceResponseSender{}
				err = ds.CallResource(context.Background(), &backend.CallResourceRequest{
					PluginContext: testPluginContext(), Path: resource,
					URL: "/" + resource + "?targetUrl=" + url.QueryEscape(target), Body: body,
				}, sender)
				if err != nil {
					t.Fatal(err)
				}
				if sender.response == nil || sender.response.Status != http.StatusBadRequest {
					t.Fatalf("expected HTTP 400, got %+v", sender.response)
				}
			})
		}
		t.Run("query "+target, func(t *testing.T) {
			query, err := json.Marshal(QueryModel{ReportLink: target})
			if err != nil {
				t.Fatal(err)
			}
			response, err := ds.QueryData(context.Background(), &backend.QueryDataRequest{
				PluginContext: testPluginContext(),
				Queries: []backend.DataQuery{{RefID: "A", JSON: query, TimeRange: backend.TimeRange{
					From: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
					To:   time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
				}}},
			})
			if err != nil {
				t.Fatal(err)
			}
			if result := response.Responses["A"]; result.Error == nil || result.Status != backend.StatusBadRequest {
				t.Fatalf("expected bad request, got %+v", result)
			}
		})
	}
	if calls != 0 {
		t.Fatalf("invalid targets caused %d outbound requests", calls)
	}
}

func TestReportingAPISuccess(t *testing.T) {
	var paths []string
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		paths = append(paths, req.URL.Path)
		if req.Host != "akab-test.luna.akamaiapis.net" || req.Header.Get("Authorization") == "" {
			t.Error("expected signed request to configured host")
		}
		switch {
		case req.URL.Path == "/"+ReportsApiUrl:
			io.WriteString(w, `{"reports":[{"reportName":"Traffic","reportLink":"`+testReportPath+`"}]}`)
		case req.URL.Path == testReportPath:
			io.WriteString(w, `{"name":"Traffic","dimensions":[],"metrics":[]}`)
		case req.URL.Path == testReportPath+"/data":
			if req.Method != http.MethodPost || req.URL.Query().Get("start") != testFrom || req.URL.Query().Get("end") != testTo {
				t.Error("unexpected data method or query")
			}
			body, err := io.ReadAll(req.Body)
			if err != nil || string(body) != "{}" {
				t.Error("request body was not preserved after signing")
			}
			io.WriteString(w, `{"data":[]}`)
		default:
			t.Errorf("unexpected path %s", req.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()
	transport := server.Client().Transport.(*http.Transport).Clone()
	// httptest certificates are issued for example.com; requests still target the Akamai hostname.
	transport.TLSClientConfig.ServerName = "example.com"
	transport.DialContext = func(ctx context.Context, network, addr string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, network, server.Listener.Addr().String())
	}
	defer transport.CloseIdleConnections()
	originalTransport := http.DefaultTransport
	http.DefaultTransport = transport
	t.Cleanup(func() { http.DefaultTransport = originalTransport })

	settings := testSettings("akab-test.luna.akamaiapis.net")
	if reports, err := reportApiQuery(context.Background(), settings); err != nil || len(reports.Reports) != 1 {
		t.Fatalf("reports request failed: %v", err)
	}
	if discovery, err := discoveryApiQuery(context.Background(), settings, testReportPath); err != nil || discovery.Name != "Traffic" {
		t.Fatalf("discovery request failed: %v", err)
	}
	if data, apiErr := dataQuery(context.Background(), settings, testReportPath, bytes.NewBufferString("{}"), testFrom, testTo); apiErr != nil || data == nil {
		t.Fatalf("data request failed: %+v", apiErr)
	}
	if len(paths) != 3 {
		t.Fatalf("expected three requests, got %d", len(paths))
	}
}

func TestDataQueryRejectsTimestampInjection(t *testing.T) {
	for _, invalid := range []string{"", "invalid", testFrom + "&accountSwitchKey=attacker", testFrom + "#fragment"} {
		for _, timestamps := range [][2]string{{invalid, testTo}, {testFrom, invalid}} {
			_, apiErr := dataQuery(context.Background(), testSettings("akab-test.luna.akamaiapis.net"), testReportPath, nil, timestamps[0], timestamps[1])
			if apiErr == nil || apiErr.Status != http.StatusBadRequest {
				t.Fatalf("expected bad request for timestamps, got %+v", apiErr)
			}
		}

	}
}

type trackedResponseBody struct {
	io.Reader
	closed bool
}

func (b *trackedResponseBody) Close() error {
	b.closed = true
	return nil
}

func TestReportingAPIFailures(t *testing.T) {
	for _, scenario := range []struct {
		name   string
		status int
		body   string
	}{
		{name: "network error"},
		{name: "invalid JSON", status: http.StatusOK, body: "not JSON"},
		{name: "API error", status: http.StatusForbidden, body: `{"status":200,"title":"Forbidden"}`},
		{name: "redirect", status: http.StatusFound, body: "{}"},
	} {
		t.Run(scenario.name, func(t *testing.T) {
			var bodies []*trackedResponseBody
			calls := 0
			originalTransport := http.DefaultTransport
			t.Cleanup(func() { http.DefaultTransport = originalTransport })
			http.DefaultTransport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
				calls++
				if scenario.status == 0 {
					return nil, errors.New("test transport failure")
				}
				body := &trackedResponseBody{Reader: strings.NewReader(scenario.body)}
				bodies = append(bodies, body)
				return &http.Response{
					StatusCode: scenario.status, Body: body, Request: req,
					Header: http.Header{"Location": {"https://attacker.test/report"}},
				}, nil
			})
			settings := testSettings("akab-test.luna.akamaiapis.net")
			if _, err := reportApiQuery(context.Background(), settings); err == nil {
				t.Error("report request unexpectedly succeeded")
			}
			if _, err := discoveryApiQuery(context.Background(), settings, testReportPath); err == nil {
				t.Error("discovery request unexpectedly succeeded")
			}
			_, apiErr := dataQuery(context.Background(), settings, testReportPath, nil, testFrom, testTo)
			expectedStatus := http.StatusBadGateway
			if scenario.status == http.StatusForbidden {
				expectedStatus = http.StatusForbidden
			}
			if apiErr == nil || apiErr.Status != expectedStatus {
				t.Fatalf("expected data error status %d, got %+v", expectedStatus, apiErr)
			}
			if calls != 3 {
				t.Errorf("expected three requests with no redirects, got %d", calls)
			}
			for _, body := range bodies {
				if !body.closed {
					t.Error("response body was not closed")
				}
			}
		})
	}
}

func TestReportingRequestHonoursContextCancellation(t *testing.T) {
	client, err := newReportingClient(testSettings("akab-test.luna.akamaiapis.net"))
	if err != nil {
		t.Fatal(err)
	}
	client.httpClient.Transport = roundTripFunc(func(req *http.Request) (*http.Response, error) {
		<-req.Context().Done()
		return nil, req.Context().Err()
	})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := client.request(ctx, http.MethodGet, testReportPath, nil, nil); !errors.Is(err, context.Canceled) {
		t.Fatalf("expected context cancellation, got %v", err)
	}
}
