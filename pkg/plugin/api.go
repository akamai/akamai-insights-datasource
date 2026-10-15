package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/client-v1"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/edgegrid"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const DiscoveryApiUrl = "reporting-api/v2/%v"
const ReportsApiUrl = "reporting-api/v2/reports"

func createDiscoveryApiUrl(datasource string) string {
	return fmt.Sprintf(DiscoveryApiUrl, datasource)
}

var errInvalidReportingRequest = errors.New("invalid reporting request")

// EdgeGrid credential hosts are issued as akab-*.luna.akamaiapis.net.
const akamaiAPIHostSuffix = ".akamaiapis.net"

type reportingClient struct {
	config     edgegrid.Config
	origin     url.URL
	httpClient *http.Client
}

func newReportingClient(settings DataSourceSettings) (*reportingClient, error) {
	host := settings.Host
	if !strings.HasPrefix(host, "https://") {
		host = "https://" + host
	}
	origin, err := url.Parse(host)
	if err != nil || origin.Scheme != "https" || origin.Hostname() == "" ||
		origin.User != nil || origin.Opaque != "" || origin.Path != "" ||
		origin.RawQuery != "" || origin.ForceQuery || strings.Contains(host, "#") ||
		(origin.Port() != "" && origin.Port() != "443") ||
		strings.HasSuffix(origin.Host, ":") ||
		!strings.HasSuffix(strings.ToLower(origin.Hostname()), akamaiAPIHostSuffix) {
		return nil, fmt.Errorf("%w: configured host must be an Akamai API hostname (*%s) with no path, credentials, query or non-HTTPS port", errInvalidReportingRequest, akamaiAPIHostSuffix)
	}

	return &reportingClient{
		config: *EdgeGridConfig(settings),
		origin: *origin,
		httpClient: &http.Client{
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return errors.New("reporting API redirects are not allowed")
			},
		},
	}, nil
}

func validateReportingPath(target string) (string, error) {
	// Report links are paths, never URL references resolved against the credential host.
	reportPath := "/" + strings.TrimPrefix(target, "/")
	segments := strings.Split(reportPath, "/")
	if len(segments) < 4 ||
		(segments[1] != "reporting-api" && segments[1] != "reporting-reports-executor-api") ||
		segments[2] != "v2" || segments[3] != "reports" {
		return "", fmt.Errorf("%w: unsupported reporting path", errInvalidReportingRequest)
	}
	for _, segment := range segments[1:] {
		if segment == "" || segment == "." || segment == ".." {
			return "", fmt.Errorf("%w: invalid reporting path segment", errInvalidReportingRequest)
		}
		for _, char := range segment {
			if !(char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' ||
				char >= '0' && char <= '9' || char == '-' || char == '_' || char == '.') {
				return "", fmt.Errorf("%w: invalid character in reporting path", errInvalidReportingRequest)
			}
		}
	}
	return reportPath, nil
}

func (c *reportingClient) request(ctx context.Context, method, target string, body io.Reader, query url.Values) (*http.Response, error) {
	reportPath, err := validateReportingPath(target)
	if err != nil {
		return nil, err
	}
	destination := c.origin
	destination.Path = reportPath
	destination.RawQuery = query.Encode()
	req, err := http.NewRequestWithContext(ctx, method, destination.String(), body)
	if err != nil {
		return nil, err
	}
	addTrackingHeaderToRequest(*req)
	req.Header.Set("User-Agent", client.UserAgent)
	// Do not use client-v1.Do: it overrides redirect policy and signs redirect destinations.
	edgegrid.AddRequestHeader(c.config, req)
	return c.httpClient.Do(req)
}

func EdgeGridConfig(dataSourceSettings DataSourceSettings) *edgegrid.Config {
	return &edgegrid.Config{
		ClientSecret: dataSourceSettings.ClientSecret,
		Host:         dataSourceSettings.Host,
		AccessToken:  dataSourceSettings.AccessToken,
		ClientToken:  dataSourceSettings.ClientToken,
		MaxBody:      131072,
		Debug:        false,
	}
}

type ReportsApi struct {
	Reports []Reports `json:"reports"`
}

type Reports struct {
	ReportName string `json:"reportName"`
	ReportLink string `json:"reportLink"`
}

type DiscoveryApi struct {
	Name       string                   `json:"name"`
	Dimensions []map[string]interface{} `json:"dimensions"`
	Metrics    []map[string]interface{} `json:"metrics"`
	Defaults   Defaults                 `json:"defaults"`
}

type OpenApi struct {
	Data     []map[string]interface{} `json:"data"`
	Metadata Metadata                 `json:"metadata"`
}

type Defaults struct {
	DefaultMetrics    []string                 `json:"defaultMetrics"`
	DefaultDimensions []string                 `json:"defaultDimensions"`
	DefaultSortBys    []map[string]interface{} `json:"defaultSortBys"`
}

type Metadata struct {
	Name       string                   `json:"name"`
	Start      string                   `json:"start"`
	End        string                   `json:"end"`
	Metrics    []map[string]interface{} `json:"metrics"`
	Dimensions []map[string]interface{} `json:"dimensions"`
	Filters    []map[string]interface{} `json:"filters"`
	Limit      int                      `json:"limit"`
}

type OpenApiErrorRspDto struct {
	Title     string `json:"title"`
	Type      string `json:"type"`
	Status    int    `json:"status"`
	Detail    string `json:"detail"`
	ProblemId string `json:"problemId"`
}

func reportApiQuery(ctx context.Context, dataSourceSettings DataSourceSettings) (*ReportsApi, error) {
	client, err := newReportingClient(dataSourceSettings)
	if err != nil {
		return nil, err
	}
	apiresp, err := client.request(ctx, http.MethodGet, ReportsApiUrl, nil, nil)
	if err != nil {
		return nil, err
	}
	defer apiresp.Body.Close()
	if apiresp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reporting API returned HTTP %d", apiresp.StatusCode)
	}

	var rspDto ReportsApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, err
	}

	return &rspDto, nil
}

func discoveryApiQuery(ctx context.Context, dataSourceSettings DataSourceSettings, targetUrl string) (*DiscoveryApi, error) {
	client, err := newReportingClient(dataSourceSettings)
	if err != nil {
		return nil, err
	}
	apiresp, err := client.request(ctx, http.MethodGet, targetUrl, nil, nil)
	if err != nil {
		return nil, err
	}
	defer apiresp.Body.Close()
	if apiresp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reporting API returned HTTP %d", apiresp.StatusCode)
	}

	var rspDto DiscoveryApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, err
	}

	return &rspDto, nil
}

func dataQuery(ctx context.Context, dataSourceSettings DataSourceSettings, targetURL string, body io.Reader, from, to string) (*OpenApi, *OpenApiErrorRspDto) {
	errorDto := OpenApiErrorRspDto{Status: http.StatusBadGateway, Title: "Reporting API request failed"}
	client, err := newReportingClient(dataSourceSettings)
	if err != nil {
		return nil, &OpenApiErrorRspDto{Status: http.StatusBadRequest, Title: err.Error()}
	}
	reportPath, err := validateReportingPath(targetURL)
	if err != nil {
		return nil, &OpenApiErrorRspDto{Status: http.StatusBadRequest, Title: err.Error()}
	}
	for _, timestamp := range []string{from, to} {
		if _, err := time.Parse(time.RFC3339Nano, timestamp); err != nil {
			return nil, &OpenApiErrorRspDto{Status: http.StatusBadRequest, Title: "from and to must be RFC3339 timestamps"}
		}
	}
	apiresp, err := client.request(ctx, http.MethodPost, reportPath+"/data", body, url.Values{"start": {from}, "end": {to}})
	if err != nil {
		return nil, &errorDto
	}
	defer apiresp.Body.Close()
	if apiresp.StatusCode != http.StatusOK {
		var apiErrorDto OpenApiErrorRspDto
		err := json.NewDecoder(apiresp.Body).Decode(&apiErrorDto)

		if err != nil {
			return nil, &errorDto
		}

		apiErrorDto.Status = apiresp.StatusCode
		return nil, &apiErrorDto
	}

	var rspDto OpenApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, &errorDto
	}

	return &rspDto, nil
}

func addTrackingHeaderToRequest(req http.Request) {
	req.Header.Set("Request-Source", "reporting-grafana-plugin")
}
