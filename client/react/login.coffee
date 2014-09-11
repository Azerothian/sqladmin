{React} = require "../util"
debug = require("debug")("sqladmin:react:login")

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
        "connectionOptions": {
          "user": @refs.txtUsername.getValue()
          "password": @refs.txtPassword.getValue()
          "host": @refs.txtHost.getValue()
          "port": @refs.txtPort.getValue()
        }
        "databaseType": @refs.ddlDatabaseType.getValue()
      }
      context: @
    }
    $.ajax(options).done () ->
      window.location = "/"

  render: () ->
    isLoading = @state.isLoading

    loginButtonOptions = {
      bsStyle:"primary"
      onClick: if isLoading then null else @onLoginClick
      disabled: isLoading
      className: "pull-right"
    }
    loginButtonText = if isLoading then "Please Wait" else "Login"

    labelClassName = "col-xs-12 col-sm-4"
    wrapperClassName = "col-xs-12 col-sm-8"

    div { className: "container" },
      form {className: "form-horizontal"},
        Input {
          type: "select"
          label: "Database Type"
          labelClassName: labelClassName
          wrapperClassName: wrapperClassName
          defaultValue:"pg"
          ref:"ddlDatabaseType"
        },
          option { value:"pg" }, "Postgresql"
          option { value:"mysql" }, "MySql"
        Input {
          type: "text"
          label: "Username"
          labelClassName: labelClassName
          wrapperClassName: wrapperClassName
          ref: "txtUsername"
          defaultValue: "postgres"
        }
        Input {
          type: "password"
          label: "Password"
          labelClassName: labelClassName
          wrapperClassName: wrapperClassName
          ref: "txtPassword"
          defaultValue: "12qwaszx"
        }
        Input {
          type: "text"
          label: "Host"
          labelClassName: labelClassName
          wrapperClassName: wrapperClassName
          defaultValue:"127.0.0.1"
          ref: "txtHost"
        }
        Input {
          type: "text"
          label: "Port"
          labelClassName: labelClassName
          wrapperClassName: wrapperClassName
          defaultValue:"5432"
          ref: "txtPort"
        }
        Button loginButtonOptions, loginButtonText
}
