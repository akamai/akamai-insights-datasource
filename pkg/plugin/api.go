/*
 * Copyright 2021 Akamai Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package plugin

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/client-v1"
	"github.com/akamai/AkamaiOPEN-edgegrid-golang/edgegrid"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"net/http/httputil"
	"net/url"
	"time"
)


// Akamai OPEN EdgeGrid for GoLang v1
const URL_FORMAT = "reporting-api/v2/reports/poc-analytics/cdn-observability/data?start=%v&end=%v"


// Is the time before the oldest available data?
func timeBeforeOldestData(t time.Time, oldestDataTime time.Time) bool {
	return t.Before(oldestDataTime)
}

// Start time cannot be before the oldest available data.  If it it, fix it.
func limitTimeToOldestData(timeRounded time.Time, oldestDataTime time.Time) time.Time {
	if timeRounded.Before(oldestDataTime) {
		return oldestDataTime
	}
	return timeRounded
}

// The time format required by OPEN API
func openApiUrlTimeFormat(t time.Time) string {
	return url.QueryEscape(t.Format(time.RFC3339))
}

// The OPEN API URL
func createOpenUrl(fromRounded time.Time, toRounded time.Time) string {
	return fmt.Sprintf(URL_FORMAT, openApiUrlTimeFormat(fromRounded), openApiUrlTimeFormat(toRounded))
}

// EdgeGrid configuration structure constructor
func NewEdgegridConfig(clientSecret string, host string, accessToken string, clientToken string) *edgegrid.Config {
	return &edgegrid.Config{
		ClientSecret: clientSecret,
		Host:         host,
		AccessToken:  accessToken,
		ClientToken:  clientToken,
		MaxBody:      131072,
		Debug:        false,
	}
}

// OPEN API REQUEST

// Example request bodies:
//{
//     "dimensions": [
//        "time1day"
//    ],
//    "metrics": [ "totalBytes", "edgeHitsSum"]
//
//}


// OPEN API request body contructor
func NewReportingAPIReqDto(dimensions string, metrics string) *ReportingReqDto {
	allMetrics := []string { "totalBytes", "edgeHitsSum" }

	if len(metrics) > 0 {
		allMetrics = []string {metrics}
	}
	log.DefaultLogger.Info("metrics", "metrics", allMetrics)

	return &ReportingReqDto{
		Dimensions:  []string {dimensions},
		Metrics:     allMetrics,
	}
}

type ReportingReqDto struct {
	Dimensions []string `json:"dimensions"`
	Metrics    []string `json:"metrics"`
}

// OPEN API NORMAL RESPONSE
type ResponseDataObject struct {
	Data []map[string]interface{} `json:"data"`
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

type EdgeDnsTrafficByTimeRspDto struct {
	Data []map[string]interface{} `json:"data"`
}

// OPEN API ERROR RESPONSE

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

// OPEN API REQUEST METHODS

// Verify that the datasource can reach the OPEN API
func openApiHealthCheck(clientSecret string, host string, accessToken string, clientToken string) (string, backend.HealthStatus) {

	// Success response
	return "Data source is working", backend.HealthStatusOk
}

// Get data needed to populate the graph.
func reportingOpenApiQuery(dimensionName string, metricName string, fromRounded time.Time, toRounded time.Time,
	clientSecret string, host string, accessToken string, clientToken string) (*EdgeDnsTrafficByTimeRspDto, error) {
	log.DefaultLogger.Info("====+++++++++metricName", "metricName", metricName)
	reqDto := NewReportingAPIReqDto(dimensionName, metricName) // the POST body
	openurl := createOpenUrl(fromRounded, toRounded)           // the POST URL
	log.DefaultLogger.Info("reportingOpenApiQuery", "openurl", openurl)
	log.DefaultLogger.Info("reportingOpenApiQuery", "Body", reqDto)
	// POST to the OPEN API
	postBodyJson, err := json.Marshal(reqDto)
	log.DefaultLogger.Info("reportingOpenApiQuery", "postBodyJson", postBodyJson)
	if err != nil {
		log.DefaultLogger.Error("Error marshaling POST request JSON", "err", err)
		return nil, err
	}
	config := NewEdgegridConfig(clientSecret, host, accessToken, clientToken)
	log.DefaultLogger.Info("config", "config", config)
	apireq, err := client.NewRequest(*config, "POST", openurl, bytes.NewBuffer(postBodyJson))
	if err != nil {
		log.DefaultLogger.Error("Error creating POST request", "err", err)
		return nil, err
	}
	log.DefaultLogger.Info("apireq", "apireq", apireq)
	apiresp, err := client.Do(*config, apireq)
	if err != nil {
		log.DefaultLogger.Error("OPEN API communication error", "err", err)
		return nil, err
	}
	defer apiresp.Body.Close()
	log.DefaultLogger.Info("reportingOpenApiQuery", "Status", apiresp.Status)
	respDump, err := httputil.DumpResponse(apiresp, true)
	log.DefaultLogger.Info("respDump", "respDump", string(respDump))
	// OPEN API error response
	if apiresp.StatusCode != 200 {
		var rspDto OpenApiErrorRspDto // the expected "error" response body
		err := json.NewDecoder(apiresp.Body).Decode(&rspDto)
		if err != nil { // A JSON decode error. Not the expected body. Use the response status for the error message.
			err = errors.New(apiresp.Status)
		} else {
			err = errors.New(rspDto.Errors[0].Title) // E.g. "Some of the requested objects are unauthorized: [foo.bar.com]"
		}
		log.DefaultLogger.Info("reportingOpenApiQueryError", "err", err)

		return nil, err
	}

	// OPEN API normal response
	var rspDto EdgeDnsTrafficByTimeRspDto // the POST response body

	json.NewDecoder(apiresp.Body).Decode(&rspDto)
	log.DefaultLogger.Info("rspDto", "rspDto", rspDto)
	return &rspDto, nil
}
