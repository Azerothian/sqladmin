{React} = require "./util"
{div} = React.DOM
module.exports = React.createClass {
  getDefaultProps: ->
    {
      theme: "monokai"
      mode: "javascript"
      content: ""
    }

  render: ->
    @transferPropsTo div { ref: "content" }

  componentDidMount: ->
    @editor = ace.edit @refs.content.getDOMNode()
    @editor.setTheme "ace/theme/#{@props.theme}"
    @editor.getSession().setMode("ace/mode/#{@props.mode}")
    @editor.setValue(@props.content)

  componentWillUnmount: ->

  getValue: ->
    return @editor.getValue()

}
