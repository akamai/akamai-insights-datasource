package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"math"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"time"
)

type DataRequest struct {
	Body RequestBody `json:"body"`
	From string      `json:"from"`
	To   string      `json:"to"`
}

type RequestBody struct {
	Dimensions []string                 `json:"dimensions"`
	Metrics    []string                 `json:"metrics"`
	Filters    []map[string]interface{} `json:"filters"`
	SortBys    []map[string]interface{} `json:"sortBys"`
}

type QueryModel struct {
	ReportLink string                   `json:"reportLink"`
	Dimensions []string                 `json:"dimensions"`
	Metrics    []string                 `json:"metrics"`
	Filters    []map[string]interface{} `json:"filters"`
	SortBys    []map[string]interface{} `json:"sortBys"`
}

type DataSourceSettings struct {
	ClientSecret string `json:"clientSecret"`
	Host         string `json:"host"`
	AccessToken  string `json:"accessToken"`
	ClientToken  string `json:"clientToken"`
}

func newDataSourceInstance(ctx context.Context, setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	dss := DataSourceSettings{
		ClientSecret: setting.DecryptedSecureJSONData["clientSecret"],
		Host:         setting.DecryptedSecureJSONData["host"],
		AccessToken:  setting.DecryptedSecureJSONData["accessToken"],
		ClientToken:  setting.DecryptedSecureJSONData["clientToken"],
	}

	if dss.ClientSecret == "" || dss.Host == "" || dss.AccessToken == "" || dss.ClientToken == "" {
		return 1, fmt.Errorf("incomplete datasource configuration")
	}

	return &instanceSettings{
		httpClient: &http.Client{},
	}, nil
}

type instanceSettings struct {
	httpClient *http.Client
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
		CheckHealthHandler:  ds,
		QueryDataHandler:    ds,
		CallResourceHandler: ds,
	}
}

type AkamaiEdgeDnsDatasource struct {
	im instancemgmt.InstanceManager
}

func (td *AkamaiEdgeDnsDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	dataSourceSettings := DataSourceSettings{
		ClientSecret: req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientSecret"],
		Host:         req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["host"],
		AccessToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["accessToken"],
		ClientToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientToken"],
	}

	_, err := reportApiQuery(dataSourceSettings)
	if err != nil {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "Data source test failed. Check credentials and try again.",
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working properly.",
	}, nil
}

func (td *AkamaiEdgeDnsDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	dataSourceSettings := DataSourceSettings{
		ClientSecret: req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientSecret"],
		Host:         req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["host"],
		AccessToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["accessToken"],
		ClientToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientToken"],
	}

	for _, query := range req.Queries {
		var queryModel QueryModel
		if err := json.Unmarshal(query.JSON, &queryModel); err != nil {
			response.Responses[query.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, "invalid query payload")
			continue
		}

		if queryModel.ReportLink == "" {
			response.Responses[query.RefID] = backend.ErrDataResponse(backend.StatusBadRequest, "reportLink is required")
			continue
		}

		requestBody := RequestBody{}
		if len(queryModel.Dimensions) > 0 {
			requestBody.Dimensions = queryModel.Dimensions
		}
		if len(queryModel.Metrics) > 0 {
			requestBody.Metrics = queryModel.Metrics
		}
		if len(queryModel.Filters) > 0 {
			requestBody.Filters = queryModel.Filters
		}
		if len(queryModel.SortBys) > 0 {
			requestBody.SortBys = queryModel.SortBys
		}

		marshal, err := json.Marshal(requestBody)
		if err != nil {
			response.Responses[query.RefID] = backend.ErrDataResponse(backend.StatusInternal, "could not build query body")
			continue
		}

		from := query.TimeRange.From.UTC().Format(time.RFC3339Nano)
		to := query.TimeRange.To.UTC().Format(time.RFC3339Nano)

		openApiResponse, errorResponse := dataQuery(dataSourceSettings, queryModel.ReportLink, bytes.NewBuffer(marshal), from, to)
		if errorResponse != nil {
			message := errorResponse.Detail
			if message == "" {
				message = errorResponse.Title
			}
			if message == "" {
				message = "query failed"
			}
			response.Responses[query.RefID] = backend.ErrDataResponse(backend.Status(errorResponse.Status), message)
			continue
		}

		discoveryApiResponse, err := discoveryApiQuery(dataSourceSettings, queryModel.ReportLink)
		if err != nil {
			response.Responses[query.RefID] = backend.ErrDataResponse(backend.StatusInternal, err.Error())
			continue
		}

		frame := convertToDataFrame(query.RefID, openApiResponse.Data, discoveryApiResponse)
		response.Responses[query.RefID] = backend.DataResponse{
			Frames: data.Frames{frame},
		}
	}

	return response, nil
}

func (td *AkamaiEdgeDnsDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	dataSourceSettings := DataSourceSettings{
		ClientSecret: req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientSecret"],
		Host:         req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["host"],
		AccessToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["accessToken"],
		ClientToken:  req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["clientToken"],
	}

	switch req.Path {
	case "reports":
		query, err := reportApiQuery(dataSourceSettings)

		if err != nil {
			return err
		}

		body, err := json.Marshal(query)

		if err != nil {
			return err
		}

		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   body,
		})
	case "discovery":
		parse, err := url.Parse(req.URL)
		if err != nil {
			return err
		}
		var targetUrl = parse.Query().Get("targetUrl")

		query, err := discoveryApiQuery(dataSourceSettings, targetUrl)

		if err != nil {
			return err
		}

		body, err := json.Marshal(query)

		if err != nil {
			return err
		}

		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   body,
		})
	case "data":
		parse, err := url.Parse(req.URL)
		if err != nil {
			return err
		}
		var targetUrl = parse.Query().Get("targetUrl")

		var requestData DataRequest
		err = json.Unmarshal(req.Body, &requestData)

		if err != nil {
			return err
		}

		marshal, err := json.Marshal(requestData.Body)

		if err != nil {
			return err
		}

		b := bytes.NewBuffer(marshal)
		query, errorResponse := dataQuery(dataSourceSettings, targetUrl, b, requestData.From, requestData.To)

		if errorResponse != nil {
			var readableError, _ = json.Marshal(errorResponse)
			return sender.Send(&backend.CallResourceResponse{
				Status: errorResponse.Status,
				Body:   readableError,
			})
		}

		body, err := json.Marshal(query)

		if err != nil {
			return err
		}

		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusOK,
			Body:   body,
		})
	default:
		return sender.Send(&backend.CallResourceResponse{
			Status: http.StatusNotFound,
			Body:   []byte("Unexpected resource URI: " + req.Path),
		})
	}
}

const (
	dataTypeString       = "STRING"
	dataTypeTimestampSec = "TIMESTAMP_SEC"
	dataTypeDateISO8601  = "DATE_ISO8601"
	dataTypeTimestampMs  = "TIMESTAMP_MS"
)

func convertToDataFrame(refID string, rows []map[string]interface{}, discovery *DiscoveryApi) *data.Frame {
	fieldTypeByName := map[string]string{}
	orderedKeys := []string{}
	knownKeySet := map[string]struct{}{}

	for _, dimension := range discovery.Dimensions {
		name, ok := mapValueAsString(dimension, "name")
		if !ok || name == "" {
			continue
		}
		kind, _ := mapValueAsString(dimension, "type")
		fieldTypeByName[name] = kind
		orderedKeys = append(orderedKeys, name)
		knownKeySet[name] = struct{}{}
	}

	for _, metric := range discovery.Metrics {
		name, ok := mapValueAsString(metric, "name")
		if !ok || name == "" {
			continue
		}
		kind, _ := mapValueAsString(metric, "type")
		fieldTypeByName[name] = kind
		if _, exists := knownKeySet[name]; !exists {
			orderedKeys = append(orderedKeys, name)
			knownKeySet[name] = struct{}{}
		}
	}

	rowKeySet := map[string]struct{}{}
	for _, row := range rows {
		for key := range row {
			rowKeySet[key] = struct{}{}
		}
	}

	additionalKeys := make([]string, 0, len(rowKeySet))
	for key := range rowKeySet {
		if _, exists := knownKeySet[key]; exists {
			continue
		}
		additionalKeys = append(additionalKeys, key)
	}
	sort.Strings(additionalKeys)

	keys := make([]string, 0, len(orderedKeys)+len(additionalKeys))
	for _, key := range orderedKeys {
		if _, exists := rowKeySet[key]; exists {
			keys = append(keys, key)
		}
	}
	keys = append(keys, additionalKeys...)

	fields := make([]*data.Field, 0, len(keys))
	for _, key := range keys {
		fieldType := fieldTypeByName[key]
		switch fieldType {
		case dataTypeTimestampSec, dataTypeDateISO8601, dataTypeTimestampMs:
			values := make([]*time.Time, len(rows))
			for idx, row := range rows {
				values[idx] = mapValueAsTime(row[key], fieldType)
			}
			fields = append(fields, data.NewField(key, nil, values))
		case dataTypeString:
			values := make([]*string, len(rows))
			for idx, row := range rows {
				values[idx] = mapValueAsStringPointer(row[key])
			}
			fields = append(fields, data.NewField(key, nil, values))
		default:
			values := make([]*float64, len(rows))
			for idx, row := range rows {
				values[idx] = mapValueAsFloat64(row[key])
			}
			fields = append(fields, data.NewField(key, nil, values))
		}
	}

	return data.NewFrame(refID, fields...).SetRefID(refID)
}

func mapValueAsString(source map[string]interface{}, key string) (string, bool) {
	value, ok := source[key]
	if !ok || value == nil {
		return "", false
	}
	stringValue, ok := value.(string)
	if !ok {
		return "", false
	}
	return stringValue, true
}

func mapValueAsStringPointer(value interface{}) *string {
	switch typed := value.(type) {
	case nil:
		return nil
	case string:
		v := typed
		return &v
	default:
		v := fmt.Sprintf("%v", typed)
		return &v
	}
}

func mapValueAsFloat64(value interface{}) *float64 {
	switch typed := value.(type) {
	case nil:
		return nil
	case float64:
		v := typed
		return &v
	case float32:
		v := float64(typed)
		return &v
	case int:
		v := float64(typed)
		return &v
	case int8:
		v := float64(typed)
		return &v
	case int16:
		v := float64(typed)
		return &v
	case int32:
		v := float64(typed)
		return &v
	case int64:
		v := float64(typed)
		return &v
	case uint:
		v := float64(typed)
		return &v
	case uint8:
		v := float64(typed)
		return &v
	case uint16:
		v := float64(typed)
		return &v
	case uint32:
		v := float64(typed)
		return &v
	case uint64:
		v := float64(typed)
		return &v
	case json.Number:
		if parsed, err := typed.Float64(); err == nil {
			v := parsed
			return &v
		}
	case string:
		if parsed, err := strconv.ParseFloat(typed, 64); err == nil {
			v := parsed
			return &v
		}
	}
	return nil
}

func mapValueAsTime(value interface{}, dataType string) *time.Time {
	switch dataType {
	case dataTypeDateISO8601:
		stringValue, ok := value.(string)
		if !ok || stringValue == "" {
			return nil
		}
		if parsed, err := time.Parse(time.RFC3339Nano, stringValue); err == nil {
			return &parsed
		}
		if parsed, err := time.Parse(time.RFC3339, stringValue); err == nil {
			return &parsed
		}
		return nil
	case dataTypeTimestampMs:
		floatValue := mapValueAsFloat64(value)
		if floatValue == nil {
			return nil
		}
		ms := *floatValue
		sec := int64(ms / 1000)
		nsec := int64(math.Mod(ms, 1000) * float64(time.Millisecond))
		t := time.Unix(sec, nsec).UTC()
		return &t
	default:
		floatValue := mapValueAsFloat64(value)
		if floatValue == nil {
			return nil
		}
		seconds := *floatValue
		sec := int64(seconds)
		nsec := int64((seconds - float64(sec)) * float64(time.Second))
		t := time.Unix(sec, nsec).UTC()
		return &t
	}
}
