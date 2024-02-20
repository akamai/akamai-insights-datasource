package plugin

import (
	"encoding/json"
	"fmt"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/client-v1"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/edgegrid"
	"io"
)

const DiscoveryApiUrl = "reporting-api/v2/%v"
const OpenApiDataUrl = DiscoveryApiUrl + "/data?start=%v&end=%v"

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

type DiscoveryApi struct {
	Name       string                   `json:"name"`
	Dimensions []map[string]interface{} `json:"dimensions"`
	Metrics    []map[string]interface{} `json:"metrics"`
}

type OpenApi struct {
	Data     []map[string]interface{} `json:"data"`
	Metadata Metadata                 `json:"metadata"`
}

type Metadata struct {
	AvailableDataEnds string   `json:"availableDataEnds"`
	End               string   `json:"end"`
	Interval          string   `json:"interval"`
	Name              string   `json:"name"`
	ObjectIds         []string `json:"objectIds"`
	ObjectType        string   `json:"objectType"`
	OutputType        string   `json:"outputType"`
	RowCount          int      `json:"rowCount"`
	Start             string   `json:"start"`
	Version           string   `json:"version"`
}

type Error struct {
	Title string `json:"title"`
	Type  string `json:"type"`
}

type OpenApiErrorRspDto struct {
	Errors   []Error `json:"errors"`
	Instance string  `json:"instance"`
	Title    string  `json:"title"`
	Type     string  `json:"type"`
}

func discoveryApiQuery(dataSourceSettings DataSourceSettings) (*DiscoveryApi, error) {
	config := EdgeGridConfig(dataSourceSettings)
	apireq, err := client.NewRequest(*config, "GET", createDiscoveryApiUrl(dataSourceSettings.DataSource), nil)

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

func dataQuery(dataSourceSettings DataSourceSettings, body io.Reader, from, to string) (*OpenApi, error) {
	config := EdgeGridConfig(dataSourceSettings)
	apireq, err := client.NewRequest(*config, "POST", createOpenApiDataUrl(dataSourceSettings.DataSource, from, to), body)

	if err != nil {
		return nil, err
	}

	apiresp, err := client.Do(*config, apireq)

	if err != nil {
		return nil, err
	}

	var rspDto OpenApi
	err = json.NewDecoder(apiresp.Body).Decode(&rspDto)

	if err != nil {
		return nil, err
	}

	return &rspDto, nil
}
