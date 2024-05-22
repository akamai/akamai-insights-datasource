package plugin

import (
	"encoding/json"
	"fmt"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/client-v1"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/edgegrid"
	"io"
	"net/http"
)

const DiscoveryApiUrl = "reporting-api/v2/%v"
const ReportsApiUrl = "reporting-api/v2/reports"
const OpenApiDataUrl = "%v/data?start=%v&end=%v"

func createOpenApiDataUrl(datasource, from, to string) string {
	return fmt.Sprintf(OpenApiDataUrl, datasource, from, to)
}

func createDiscoveryApiUrl(datasource string) string {
	return fmt.Sprintf(DiscoveryApiUrl, datasource)
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

func reportApiQuery(dataSourceSettings DataSourceSettings) (*ReportsApi, error) {
	config := EdgeGridConfig(dataSourceSettings)
	apireq, err := client.NewRequest(*config, "GET", ReportsApiUrl, nil)
	addTrackingHeaderToRequest(*apireq)

	if err != nil {
		return nil, err
	}

	apiresp, err := client.Do(*config, apireq)

	if err != nil {
		return nil, err
	}

	var rspDto ReportsApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, err
	}

	return &rspDto, nil
}

func discoveryApiQuery(dataSourceSettings DataSourceSettings, targetUrl string) (*DiscoveryApi, error) {
	config := EdgeGridConfig(dataSourceSettings)
	apireq, err := client.NewRequest(*config, "GET", targetUrl, nil)
	addTrackingHeaderToRequest(*apireq)

	if err != nil {
		return nil, err
	}

	apiresp, err := client.Do(*config, apireq)

	if err != nil {
		return nil, err
	}

	var rspDto DiscoveryApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, err
	}

	return &rspDto, nil
}

func dataQuery(dataSourceSettings DataSourceSettings, url string, body io.Reader, from, to string) (*OpenApi, *OpenApiErrorRspDto) {
	var errorDto = OpenApiErrorRspDto{Status: http.StatusBadRequest, Title: "Unknown error"}
	config := EdgeGridConfig(dataSourceSettings)
	apireq, err := client.NewRequest(*config, "POST", createOpenApiDataUrl(url, from, to), body)
	addTrackingHeaderToRequest(*apireq)

	if err != nil {
		return nil, &errorDto
	}

	apiresp, err := client.Do(*config, apireq)

	if apiresp.StatusCode != 200 {
		var apiErrorDto OpenApiErrorRspDto
		err := json.NewDecoder(apiresp.Body).Decode(&apiErrorDto)

		if err != nil {
			return nil, &errorDto
		}

		return nil, &apiErrorDto
	}

	if err != nil {
		return nil, &errorDto
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
