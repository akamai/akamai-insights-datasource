package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"net/http"
	"net/url"
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

type DataSourceSettings struct {
	ClientSecret string `json:"clientSecret"`
	Host         string `json:"host"`
	AccessToken  string `json:"accessToken"`
	ClientToken  string `json:"clientToken"`
}

func newDataSourceInstance(ctx context.Context, setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var dss DataSourceSettings
	err := json.Unmarshal(setting.JSONData, &dss)

	if err != nil {
		return 1, err
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
		CallResourceHandler: ds,
	}
}

type AkamaiEdgeDnsDatasource struct {
	im instancemgmt.InstanceManager
}

func (td *AkamaiEdgeDnsDatasource) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	var dataSourceSettings DataSourceSettings

	if err := json.Unmarshal(req.PluginContext.DataSourceInstanceSettings.JSONData, &dataSourceSettings); err != nil {
		return err
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
