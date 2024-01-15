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
	"context"
	"encoding/json"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"net/http"
	"strings"
	"time"
)

type selectableValueStr struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

var supportedDimensions = []selectableValueStr{
	selectableValueStr{Label: "cpcode", Value: "cpcode"},
	selectableValueStr{Label: "time", Value: "time"},
	selectableValueStr{Label: "time5minutes", Value: "time5minutes"},
	selectableValueStr{Label: "time1hour", Value: "time1hour"},
	selectableValueStr{Label: "time1day", Value: "time1day"},
	selectableValueStr{Label: "hostname", Value: "hostname"},
	selectableValueStr{Label: "responseCode", Value: "responseCode"},
	selectableValueStr{Label: "responseClass", Value: "responseClass"},
	selectableValueStr{Label: "httpMethod", Value: "httpMethod"},
	selectableValueStr{Label: "cacheability", Value: "cacheability"},
	selectableValueStr{Label: "country", Value: "country"},
	selectableValueStr{Label: "state", Value: "state"},
	selectableValueStr{Label: "city", Value: "city"},
	selectableValueStr{Label: "serverCountry", Value: "serverCountry"},
	selectableValueStr{Label: "tlsVersion", Value: "tlsVersion"},
}



// The datasource configuration supplied by the front-end.
type dataSourceSettingsJson struct {
	ClientSecret string `json:"clientSecret"`
	Host         string `json:"host"`
	AccessToken  string `json:"accessToken"`
	ClientToken  string `json:"clientToken"`
}

// Query information supplied by the front-end
type dataQueryJson struct {
	DataSourceId   uint               `json:"dataSourceId"`
	IntervalMs     uint               `json:"intervalMs"`
	MaxDataPoints  uint               `json:"maxDataPoints"`
	SelectedReport selectableValueStr `json:"selectedReport"`
	ZoneNames      string             `json:"zoneNames"` // Comma-separated zone names
	MetricsName     string             `json:"metricsName"`
	DimensionsName     string          `json:"dimensionsName"`

}

// Grafana structures and functions
func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &instanceSettings{
		httpClient: &http.Client{},
	}, nil
}

type instanceSettings struct {
	httpClient *http.Client
}

// Called before creating a new instance to allow plugin to cleanup.
func (s *instanceSettings) Dispose() {
}

func NewDatasource() datasource.ServeOpts {
	// Creates a instance manager for the plugin. The function passed
	// into `NewInstanceManger` is called when the instance is created
	// for the first time or when datasource configuration changes.
	im := datasource.NewInstanceManager(newDataSourceInstance)

	ds := &AkamaiEdgeDnsDatasource{
		im: im,
	}

	return datasource.ServeOpts{
		QueryDataHandler:    ds,
		CheckHealthHandler:  ds,
		CallResourceHandler: ds,
	}
}

type AkamaiEdgeDnsDatasource struct {
	im instancemgmt.InstanceManager
}

// QueryData handles multiple queries and returns multiple responses.
// 'req' contains the queries []DataQuery (where each query contains RefID as a unique identifer).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response contains Frames ([]*Frame).
func (td *AkamaiEdgeDnsDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {

	// create response struct
	response := backend.NewQueryDataResponse()

	log.DefaultLogger.Info("QueryData", "Login", req.PluginContext.User.Login)
	log.DefaultLogger.Info("QueryData", "Role", req.PluginContext.User.Role)

	var dss dataSourceSettingsJson
	err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &dss)
	if err != nil {
		return response, err
	}

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := td.query(ctx, q, dss)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

func (td *AkamaiEdgeDnsDatasource) query(ctx context.Context, query backend.DataQuery, dss dataSourceSettingsJson) backend.DataResponse {
	 log.DefaultLogger.Info("QueryData", "clientSecret", dss.ClientSecret)
	 log.DefaultLogger.Info("QueryData", "host", dss.Host)
	 log.DefaultLogger.Info("QueryData", "accessToken", dss.AccessToken)
	 log.DefaultLogger.Info("QueryData", "clientToken", dss.ClientToken)
	log.DefaultLogger.Info("Przemek Is running stuff", "clientToken", dss.ClientToken)
	log.DefaultLogger.Info("QueryData", "RefID", query.RefID)

	response := backend.DataResponse{}
	log.DefaultLogger.Info("================= response ============", "response", response)
	// Unmarshal the (query request input) json into the 'dataQueryJson' structure
	var dqj dataQueryJson
	response.Error = json.Unmarshal(query.JSON, &dqj)
	if response.Error != nil {
		return response
	}

	log.DefaultLogger.Info("query", "query.TimeRange.From", query.TimeRange.From)
	log.DefaultLogger.Info("query", "query.TimeRange.To", query.TimeRange.To)
	log.DefaultLogger.Info("QUERY PARAMS", "VALUES", query)
	log.DefaultLogger.Info("Dimensions", "Dimensions", dqj.DimensionsName)
	log.DefaultLogger.Info("Metrics", "Metrics", dqj.MetricsName)


	/*// 'interval' and fixed-up 'from' and 'to' times are needed to make the OPEN API POST URL
	interval := calculateInterval(query.TimeRange.From, query.TimeRange.To, dqj.MaxDataPoints)
	fromRounded, toRounded, err := adjustQueryTimes(query.TimeRange.From, query.TimeRange.To, interval)
	if err != nil {
		response.Error = err
		return response
	}
*/

	// The OPEN API returns the data to graph.
	openApiRspDto, err := reportingOpenApiQuery(dqj.DimensionsName, dqj.MetricsName, query.TimeRange.From, query.TimeRange.To, dss.ClientSecret, dss.Host, dss.AccessToken, dss.ClientToken)
	if err != nil {
		response.Error = err
		return response
	}
	log.DefaultLogger.Info("00000000000000000000", "numDataRows", openApiRspDto)
	// The number of datapoints in the response
	numDataRows := len(openApiRspDto.Data)
	log.DefaultLogger.Info("query", "numDataRows", numDataRows)

	// Create slices that will be added to the dataframe.
	//dimension := make([]time.Time, numDataRows)
	edgeHitsSum := make([]float64, numDataRows)
	totalBytes := make([]float64, numDataRows)
	log.DefaultLogger.Info("11111111111111111111111", "numDataRows", openApiRspDto.Data)
	var dimName string
	dimName = dqj.DimensionsName
	timeDimension := make([]time.Time, numDataRows)
	nonTimeDimension := make([]string, numDataRows)



	for index, dataMap := range openApiRspDto.Data {
		log.DefaultLogger.Info("index", "index", index)
		log.DefaultLogger.Info(dqj.DimensionsName, dqj.DimensionsName, dimName)
//time1hour

		//time1day[index], _ = time.Parse(time.RFC3339, dataMap["time1day"].(string))



		if strings.Contains(dqj.DimensionsName, "time") {
			timeFloat64, ok := dataMap[dqj.DimensionsName].(float64)
			if !ok {
				log.DefaultLogger.Error("Invalid type conversion for time1hour")
				continue
			}
			timeValue := time.Unix(int64(timeFloat64), 0)
			timeDimension[index] = timeValue
		} else {
			nonTimeDimension[index], _ = dataMap[dimName].(string)
		}
		edgeHitsSum[index], _ = dataMap["edgeHitsSum"].(float64)
		totalBytes[index], _ = dataMap["totalBytes"].(float64)
	}
	log.DefaultLogger.Info("222222222222222dimensiondimensiondimensiondimension", "timeDimension", timeDimension)
	log.DefaultLogger.Info("222222222222222dimensiondimensiondimensiondimension", "nonTimeDimension", nonTimeDimension)
	// Create the response data frame.
	frame := data.NewFrame("response")

	// Add data to the response data frame.
	if strings.Contains(dqj.DimensionsName, "time") {
		frame.Fields = append(frame.Fields, data.NewField("time", nil, timeDimension))     // add the time dimension to dataframe
	} else {
		frame.Fields = append(frame.Fields, data.NewField(dqj.DimensionsName, nil, nonTimeDimension))     // add the time dimension to dataframe
	}
	if len(dqj.MetricsName) == 0 {
		frame.Fields = append(frame.Fields, data.NewField("edgeHitsSum", nil, edgeHitsSum)) // add values to dataframe
		frame.Fields = append(frame.Fields, data.NewField("totalBytes", nil, totalBytes)) // add values to dataframe
	} else {
		if strings.Contains(dqj.MetricsName, "edgeHitsSum") {
			frame.Fields = append(frame.Fields, data.NewField("edgeHitsSum", nil, edgeHitsSum))
		} else {
			frame.Fields = append(frame.Fields, data.NewField("totalBytes", nil, totalBytes))
		}
	}

	// Add the dataframe to the response

	log.DefaultLogger.Info("222222222222222", "frame.Fields", frame.Fields)
	response.Frames = append(response.Frames, frame)

	//return response

	// Create frame and add it to the response
	dataResp := backend.DataResponse{
		Frames: []*data.Frame{
			frame,
		},
	}

	return dataResp
}

// The 'Save & Test' button on the datasource configuration page allows users to verify that the datasource is working as expected.
func (td *AkamaiEdgeDnsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {

	var ds dataSourceSettingsJson
	err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &ds)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusUnknown,
			Message: "Internal error. Failed to unmarshal healthcheck JSON",
		}, err
	}

	// Verify that the OPEN API responds.
	message, status := openApiHealthCheck(ds.ClientSecret, ds.Host, ds.AccessToken, ds.ClientToken)

	return &backend.CheckHealthResult{
		Status:  status,
		Message: message,
	}, nil
}

// 'CallResource' returns non-metric data to the front-end, in this case, the list of supported EdgeDns reports.
func (td *AkamaiEdgeDnsDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	log.DefaultLogger.Info("CallResource", "path", req.Path)

	switch req.Path {
	case "datasource/resource/dimensions":
		b, err := json.Marshal(supportedDimensions)
		if err != nil {
			log.DefaultLogger.Error("Error marshalling reports", "err", err)
			return sender.Send(&backend.CallResourceResponse{
				Status: http.StatusInternalServerError,
				Body:   []byte(err.Error()),
			})
		}
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   b,
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte("Unexpected resource URI: " + req.Path),
		})
	}
}
