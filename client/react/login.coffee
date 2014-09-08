debug = require("debug")("sqladmin:react:login")

React = require "react"
ReactBootstrap = require "react-bootstrap"

$ = require "jquery"

{div, form, input, option} = React.DOM
{Input, Button} = ReactBootstrap
module.exports = React.createClass {
  getInitialState: ->
    {
      isLoading: false
    }

  onLoginClick: () ->
    @setState { isLoading: true }
    options = {
      url: "/login"
      dataType: "json"
      type: "POST"
      contentType: "application/json"
      data: JSON.stringify {
        "_csrf": @props._csrf
        "username": @refs.txtUsername.getValue()
        "password": @refs.txtPassword.getValue()
        "host": @refs.txtHost.getValue()
        "port": @refs.txtPort.getValue()
        "databasetype": @refs.ddlDatabaseType.getValue()
      }
      context: @
    }
    $.ajax(options).done () ->
      debug "response", arguments
      @setState { isLoading: false }
      window.location = "/"

  render: () ->
    isLoading = @state.isLoading

    loginButtonOptions = {
      bsStyle:"primary"
      onClick: if isLoading then null else @onLoginClick
      disabled: isLoading
    }
    loginButtonText = if isLoading then "Please Wait" else "Login"

    div { className: "container" },
      form {className: "form-horizontal"},
        Input { type: "text", label: "Username", labelClassName:"col-xs-2", wrapperClassName: "col-xs-10", ref: "txtUsername" }
        Input { type: "password", label: "Password", labelClassName:"col-xs-2", wrapperClassName: "col-xs-10", ref: "txtPassword" }
        Input { type: "text", label: "Host", labelClassName:"col-xs-2", wrapperClassName: "col-xs-10", defaultValue:"127.0.0.1", ref: "txtHost" }
        Input { type: "text", label: "Port", labelClassName:"col-xs-2", wrapperClassName: "col-xs-10", defaultValue:"5432", ref: "txtPort" }
        Input { type: "select", label: "Database Type", labelClassName:"col-xs-2", wrapperClassName: "col-xs-10", defaultValue:"pg", ref:"ddlDatabaseType" },
          option { value:"pg" }, "Postgresql"
          option { value:"mysql" }, "MySql"
          option { value:"mariasql" }, "MariaSql"
        Button loginButtonOptions, loginButtonText
}
