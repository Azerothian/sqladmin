require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":2}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],4:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var PanelGroup = require('./PanelGroup');

var Accordion = React.createClass({displayName: 'Accordion',
  render: function () {
    return this.transferPropsTo(
      PanelGroup( {accordion:true}, 
        this.props.children
      )
    );
  }
});

module.exports = Accordion;
},{"./PanelGroup":39}],5:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var AffixMixin = require('./AffixMixin');
var domUtils = require('./utils/domUtils');

var Affix = React.createClass({displayName: 'Affix',
  statics: {
    domUtils: domUtils
  },

  mixins: [AffixMixin],

  render: function () {
    var holderStyle = {top: this.state.affixPositionTop};
    return this.transferPropsTo(
      React.DOM.div( {className:this.state.affixClass, style:holderStyle}, 
        this.props.children
      )
    );
  }
});

module.exports = Affix;
},{"./AffixMixin":6,"./utils/domUtils":59}],6:[function(require,module,exports){
/* global window, document */

var React = (window.React || React);
var domUtils = require('./utils/domUtils');
var EventListener = require('./utils/EventListener');

var AffixMixin = {
  propTypes: {
    offset: React.PropTypes.number,
    offsetTop: React.PropTypes.number,
    offsetBottom: React.PropTypes.number
  },

  getInitialState: function () {
    return {
      affixClass: 'affix-top'
    };
  },

  getPinnedOffset: function (DOMNode) {
    if (this.pinnedOffset) {
      return this.pinnedOffset;
    }

    DOMNode.className = DOMNode.className.replace(/affix-top|affix-bottom|affix/, '');
    DOMNode.className += DOMNode.className.length ? ' affix' : 'affix';

    this.pinnedOffset = domUtils.getOffset(DOMNode).top - window.pageYOffset;

    return this.pinnedOffset;
  },

  checkPosition: function () {
    var DOMNode, scrollHeight, scrollTop, position, offsetTop, offsetBottom,
        affix, affixType, affixPositionTop;

    // TODO: or not visible
    if (!this.isMounted()) {
      return;
    }

    DOMNode = this.getDOMNode();
    scrollHeight = document.documentElement.offsetHeight;
    scrollTop = window.pageYOffset;
    position = domUtils.getOffset(DOMNode);
    offsetTop;
    offsetBottom;

    if (this.affixed === 'top') {
      position.top += scrollTop;
    }

    offsetTop = this.props.offsetTop != null ?
      this.props.offsetTop : this.props.offset;
    offsetBottom = this.props.offsetBottom != null ?
      this.props.offsetBottom : this.props.offset;

    if (offsetTop == null && offsetBottom == null) {
      return;
    }
    if (offsetTop == null) {
      offsetTop = 0;
    }
    if (offsetBottom == null) {
      offsetBottom = 0;
    }

    if (this.unpin != null && (scrollTop + this.unpin <= position.top)) {
      affix = false;
    } else if (offsetBottom != null && (position.top + DOMNode.offsetHeight >= scrollHeight - offsetBottom)) {
      affix = 'bottom';
    } else if (offsetTop != null && (scrollTop <= offsetTop)) {
      affix = 'top';
    } else {
      affix = false;
    }

    if (this.affixed === affix) {
      return;
    }

    if (this.unpin != null) {
      DOMNode.style.top = '';
    }

    affixType = 'affix' + (affix ? '-' + affix : '');

    this.affixed = affix;
    this.unpin = affix === 'bottom' ?
      this.getPinnedOffset(DOMNode) : null;

    if (affix === 'bottom') {
      DOMNode.className = DOMNode.className.replace(/affix-top|affix-bottom|affix/, 'affix-top');
      affixPositionTop = scrollHeight - offsetBottom - DOMNode.offsetHeight - domUtils.getOffset(DOMNode).top;
    }

    this.setState({
      affixClass: affixType,
      affixPositionTop: affixPositionTop
    });
  },

  checkPositionWithEventLoop: function () {
    setTimeout(this.checkPosition, 0);
  },

  componentDidMount: function () {
    this._onWindowScrollListener =
      EventListener.listen(window, 'scroll', this.checkPosition);
    this._onDocumentClickListener =
      EventListener.listen(document, 'click', this.checkPositionWithEventLoop);
  },

  componentWillUnmount: function () {
    if (this._onWindowScrollListener) {
      this._onWindowScrollListener.remove();
    }

    if (this._onDocumentClickListener) {
      this._onDocumentClickListener.remove();
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (prevState.affixClass === this.state.affixClass) {
      this.checkPositionWithEventLoop();
    }
  }
};

module.exports = AffixMixin;
},{"./utils/EventListener":53,"./utils/domUtils":59}],7:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');


var Alert = React.createClass({displayName: 'Alert',
  mixins: [BootstrapMixin],

  propTypes: {
    onDismiss: React.PropTypes.func,
    dismissAfter: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      bsClass: 'alert',
      bsStyle: 'info'
    };
  },

  renderDismissButton: function () {
    return (
      React.DOM.button(
        {type:"button",
        className:"close",
        onClick:this.props.onDismiss,
        'aria-hidden':"true"}, 
        " × "
      )
    );
  },

  render: function () {
    var classes = this.getBsClassSet();
    var isDismissable = !!this.props.onDismiss;

    classes['alert-dismissable'] = isDismissable;

    return this.transferPropsTo(
      React.DOM.div( {className:classSet(classes)}, 
        isDismissable ? this.renderDismissButton() : null,
        this.props.children
      )
    );
  },

  componentDidMount: function() {
    if (this.props.dismissAfter && this.props.onDismiss) {
      this.dismissTimer = setTimeout(this.props.onDismiss, this.props.dismissAfter);
    }
  },

  componentWillUnmount: function() {
    clearTimeout(this.dismissTimer);
  }
});

module.exports = Alert;
},{"./BootstrapMixin":9,"./utils/classSet":56}],8:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var classSet = require('./utils/classSet');

var Badge = React.createClass({displayName: 'Badge',
  propTypes: {
    pullRight: React.PropTypes.bool,
  },

  render: function () {
    var classes = {
      'pull-right': this.props.pullRight,
      'badge': ValidComponentChildren.hasValidComponent(this.props.children)
    };
    return this.transferPropsTo(
      React.DOM.span( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = Badge;

},{"./utils/ValidComponentChildren":55,"./utils/classSet":56}],9:[function(require,module,exports){
var React = (window.React || React);
var constants = require('./constants');

var BootstrapMixin = {
  propTypes: {
    bsClass: React.PropTypes.oneOf(Object.keys(constants.CLASSES)),
    bsStyle: React.PropTypes.oneOf(Object.keys(constants.STYLES)),
    bsSize: React.PropTypes.oneOf(Object.keys(constants.SIZES))
  },

  getBsClassSet: function () {
    var classes = {};

    var bsClass = this.props.bsClass && constants.CLASSES[this.props.bsClass];
    if (bsClass) {
      classes[bsClass] = true;

      var prefix = bsClass + '-';

      var bsSize = this.props.bsSize && constants.SIZES[this.props.bsSize];
      if (bsSize) {
        classes[prefix + bsSize] = true;
      }

      var bsStyle = this.props.bsStyle && constants.STYLES[this.props.bsStyle];
      if (this.props.bsStyle) {
        classes[prefix + bsStyle] = true;
      }
    }

    return classes;
  }
};

module.exports = BootstrapMixin;
},{"./constants":50}],10:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');

var Button = React.createClass({displayName: 'Button',
  mixins: [BootstrapMixin],

  propTypes: {
    active:   React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    block:    React.PropTypes.bool,
    navItem:    React.PropTypes.bool,
    navDropdown: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      bsClass: 'button',
      bsStyle: 'default',
      type: 'button'
    };
  },

  render: function () {
    var classes = this.props.navDropdown ? {} : this.getBsClassSet();
    var renderFuncName;

    classes['active'] = this.props.active;
    classes['btn-block'] = this.props.block;

    if (this.props.navItem) {
      return this.renderNavItem(classes);
    }

    renderFuncName = this.props.href || this.props.navDropdown ?
      'renderAnchor' : 'renderButton';

    return this[renderFuncName](classes);
  },

  renderAnchor: function (classes) {
    var href = this.props.href || '#';
    classes['disabled'] = this.props.disabled;

    return this.transferPropsTo(
      React.DOM.a(
        {href:href,
        className:classSet(classes),
        role:"button"}, 
        this.props.children
      )
    );
  },

  renderButton: function (classes) {
    return this.transferPropsTo(
      React.DOM.button(
        {className:classSet(classes)}, 
        this.props.children
      )
    );
  },

  renderNavItem: function (classes) {
    var liClasses = {
      active: this.props.active
    };

    return (
      React.DOM.li( {className:classSet(liClasses)}, 
        this.renderAnchor(classes)
      )
    );
  }
});

module.exports = Button;
},{"./BootstrapMixin":9,"./utils/classSet":56}],11:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');
var Button = require('./Button');

var ButtonGroup = React.createClass({displayName: 'ButtonGroup',
  mixins: [BootstrapMixin],

  propTypes: {
    vertical:  React.PropTypes.bool,
    justified: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      bsClass: 'button-group'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();
    classes['btn-group'] = !this.props.vertical;
    classes['btn-group-vertical'] = this.props.vertical;
    classes['btn-group-justified'] = this.props.justified;

    return this.transferPropsTo(
      React.DOM.div(
        {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = ButtonGroup;
},{"./BootstrapMixin":9,"./Button":10,"./utils/classSet":56}],12:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');
var Button = require('./Button');

var ButtonGroup = React.createClass({displayName: 'ButtonGroup',
  mixins: [BootstrapMixin],

  getDefaultProps: function () {
    return {
      bsClass: 'button-toolbar'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();

    return this.transferPropsTo(
      React.DOM.div(
        {role:"toolbar",
        className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = ButtonGroup;
},{"./BootstrapMixin":9,"./Button":10,"./utils/classSet":56}],13:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var BootstrapMixin = require('./BootstrapMixin');
var ValidComponentChildren = require('./utils/ValidComponentChildren');

var Carousel = React.createClass({displayName: 'Carousel',
  mixins: [BootstrapMixin],

  propTypes: {
    slide: React.PropTypes.bool,
    indicators: React.PropTypes.bool,
    controls: React.PropTypes.bool,
    pauseOnHover: React.PropTypes.bool,
    wrap: React.PropTypes.bool,
    onSelect: React.PropTypes.func,
    onSlideEnd: React.PropTypes.func,
    activeIndex: React.PropTypes.number,
    defaultActiveIndex: React.PropTypes.number,
    direction: React.PropTypes.oneOf(['prev', 'next'])
  },

  getDefaultProps: function () {
    return {
      slide: true,
      interval: 5000,
      pauseOnHover: true,
      wrap: true,
      indicators: true,
      controls: true
    };
  },

  getInitialState: function () {
    return {
      activeIndex: this.props.defaultActiveIndex == null ?
        0 : this.props.defaultActiveIndex,
      previousActiveIndex: null,
      direction: null
    };
  },

  getDirection: function (prevIndex, index) {
    if (prevIndex === index) {
      return null;
    }

    return prevIndex > index ?
      'prev' : 'next';
  },

  componentWillReceiveProps: function (nextProps) {
    var activeIndex = this.getActiveIndex();

    if (nextProps.activeIndex != null && nextProps.activeIndex !== activeIndex) {
      clearTimeout(this.timeout);
      this.setState({
        previousActiveIndex: activeIndex,
        direction: nextProps.direction != null ?
          nextProps.direction : this.getDirection(activeIndex, nextProps.activeIndex)
      });
    }
  },

  componentDidMount: function () {
    this.waitForNext();
  },

  componentWillUnmount: function() {
    clearTimeout(this.timeout);
  },

  next: function (e) {
    if (e) {
      e.preventDefault();
    }

    var index = this.getActiveIndex() + 1;
    var count = ValidComponentChildren.numberOf(this.props.children);

    if (index > count - 1) {
      if (!this.props.wrap) {
        return;
      }
      index = 0;
    }

    this.handleSelect(index, 'next');
  },

  prev: function (e) {
    if (e) {
      e.preventDefault();
    }

    var index = this.getActiveIndex() - 1;

    if (index < 0) {
      if (!this.props.wrap) {
        return;
      }
      index = ValidComponentChildren.numberOf(this.props.children) - 1;
    }

    this.handleSelect(index, 'prev');
  },

  pause: function () {
    this.isPaused = true;
    clearTimeout(this.timeout);
  },

  play: function () {
    this.isPaused = false;
    this.waitForNext();
  },

  waitForNext: function () {
    if (!this.isPaused && this.props.slide && this.props.interval &&
        this.props.activeIndex == null) {
      this.timeout = setTimeout(this.next, this.props.interval);
    }
  },

  handleMouseOver: function () {
    if (this.props.pauseOnHover) {
      this.pause();
    }
  },

  handleMouseOut: function () {
    if (this.isPaused) {
      this.play();
    }
  },

  render: function () {
    var classes = {
      carousel: true,
      slide: this.props.slide
    };

    return this.transferPropsTo(
      React.DOM.div(
        {className:classSet(classes),
        onMouseOver:this.handleMouseOver,
        onMouseOut:this.handleMouseOut}, 
        this.props.indicators ? this.renderIndicators() : null,
        React.DOM.div( {className:"carousel-inner", ref:"inner"}, 
          ValidComponentChildren.map(this.props.children, this.renderItem)
        ),
        this.props.controls ? this.renderControls() : null
      )
    );
  },

  renderPrev: function () {
    return (
      React.DOM.a( {className:"left carousel-control", href:"#prev", key:0, onClick:this.prev}, 
        React.DOM.span( {className:"glyphicon glyphicon-chevron-left"} )
      )
    );
  },

  renderNext: function () {
    return (
      React.DOM.a( {className:"right carousel-control", href:"#next", key:1, onClick:this.next}, 
        React.DOM.span( {className:"glyphicon glyphicon-chevron-right"})
      )
    );
  },

  renderControls: function () {
    if (this.props.wrap) {
      var activeIndex = this.getActiveIndex();
      var count = ValidComponentChildren.numberOf(this.props.children);

      return [
        (activeIndex !== 0) ? this.renderPrev() : null,
        (activeIndex !== count - 1) ? this.renderNext() : null
      ];
    }

    return [
      this.renderPrev(),
      this.renderNext()
    ];
  },

  renderIndicator: function (child, index) {
    var className = (index === this.getActiveIndex()) ?
      'active' : null;

    return (
      React.DOM.li(
        {key:index,
        className:className,
        onClick:this.handleSelect.bind(this, index, null)} )
    );
  },

  renderIndicators: function () {
    var indicators = [];
    ValidComponentChildren
      .forEach(this.props.children, function(child, index) {
        indicators.push(
          this.renderIndicator(child, index),

          // Force whitespace between indicator elements, bootstrap
          // requires this for correct spacing of elements.
          ' '
        );
      }, this);

    return (
      React.DOM.ol( {className:"carousel-indicators"}, 
        indicators
      )
    );
  },

  getActiveIndex: function () {
    return this.props.activeIndex != null ? this.props.activeIndex : this.state.activeIndex;
  },

  handleItemAnimateOutEnd: function () {
    this.setState({
      previousActiveIndex: null,
      direction: null
    }, function() {
      this.waitForNext();

      if (this.props.onSlideEnd) {
        this.props.onSlideEnd();
      }
    });
  },

  renderItem: function (child, index) {
    var activeIndex = this.getActiveIndex();
    var isActive = (index === activeIndex);
    var isPreviousActive = this.state.previousActiveIndex != null &&
            this.state.previousActiveIndex === index && this.props.slide;

    return cloneWithProps(
        child,
        {
          active: isActive,
          ref: child.props.ref,
          key: child.props.key != null ?
            child.props.key : index,
          index: index,
          animateOut: isPreviousActive,
          animateIn: isActive && this.state.previousActiveIndex != null && this.props.slide,
          direction: this.state.direction,
          onAnimateOutEnd: isPreviousActive ? this.handleItemAnimateOutEnd: null
        }
      );
  },

  handleSelect: function (index, direction) {
    clearTimeout(this.timeout);

    var previousActiveIndex = this.getActiveIndex();
    direction = direction || this.getDirection(previousActiveIndex, index);

    if (this.props.onSelect) {
      this.props.onSelect(index, direction);
    }

    if (this.props.activeIndex == null && index !== previousActiveIndex) {
      if (this.state.previousActiveIndex != null) {
        // If currently animating don't activate the new index.
        // TODO: look into queuing this canceled call and
        // animating after the current animation has ended.
        return;
      }

      this.setState({
        activeIndex: index,
        previousActiveIndex: previousActiveIndex,
        direction: direction
      });
    }
  }
});

module.exports = Carousel;
},{"./BootstrapMixin":9,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57}],14:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var TransitionEvents = require('./utils/TransitionEvents');

var CarouselItem = React.createClass({displayName: 'CarouselItem',
  propTypes: {
    direction: React.PropTypes.oneOf(['prev', 'next']),
    onAnimateOutEnd: React.PropTypes.func,
    active: React.PropTypes.bool,
    caption: React.PropTypes.renderable
  },

  getInitialState: function () {
    return {
      direction: null
    };
  },

  getDefaultProps: function () {
    return {
      animation: true
    };
  },

  handleAnimateOutEnd: function () {
    if (this.props.onAnimateOutEnd && this.isMounted()) {
      this.props.onAnimateOutEnd(this.props.index);
    }
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.active !== nextProps.active) {
      this.setState({
        direction: null
      });
    }
  },

  componentDidUpdate: function (prevProps) {
    if (!this.props.active && prevProps.active) {
      TransitionEvents.addEndEventListener(
        this.getDOMNode(),
        this.handleAnimateOutEnd
      );
    }

    if (this.props.active !== prevProps.active) {
      setTimeout(this.startAnimation, 20);
    }
  },

  startAnimation: function () {
    if (!this.isMounted()) {
      return;
    }

    this.setState({
      direction: this.props.direction === 'prev' ?
        'right' : 'left'
    });
  },

  render: function () {
    var classes = {
      item: true,
      active: (this.props.active && !this.props.animateIn) || this.props.animateOut,
      next: this.props.active && this.props.animateIn && this.props.direction === 'next',
      prev: this.props.active && this.props.animateIn && this.props.direction === 'prev'
    };

    if (this.state.direction && (this.props.animateIn || this.props.animateOut)) {
      classes[this.state.direction] = true;
    }

    return this.transferPropsTo(
      React.DOM.div( {className:classSet(classes)}, 
        this.props.children,
        this.props.caption ? this.renderCaption() : null
      )
    );
  },

  renderCaption: function () {
    return (
      React.DOM.div( {className:"carousel-caption"}, 
        this.props.caption
      )
    );
  }
});

module.exports = CarouselItem;
},{"./utils/TransitionEvents":54,"./utils/classSet":56}],15:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var CustomPropTypes = require('./utils/CustomPropTypes');
var constants = require('./constants');


var Col = React.createClass({displayName: 'Col',
  propTypes: {
    xs: React.PropTypes.number,
    sm: React.PropTypes.number,
    md: React.PropTypes.number,
    lg: React.PropTypes.number,
    xsOffset: React.PropTypes.number,
    smOffset: React.PropTypes.number,
    mdOffset: React.PropTypes.number,
    lgOffset: React.PropTypes.number,
    xsPush: React.PropTypes.number,
    smPush: React.PropTypes.number,
    mdPush: React.PropTypes.number,
    lgPush: React.PropTypes.number,
    xsPull: React.PropTypes.number,
    smPull: React.PropTypes.number,
    mdPull: React.PropTypes.number,
    lgPull: React.PropTypes.number,
    componentClass: CustomPropTypes.componentClass
  },

  getDefaultProps: function () {
    return {
      componentClass: React.DOM.div
    };
  },

  render: function () {
    var componentClass = this.props.componentClass;
    var classes = {};

    Object.keys(constants.SIZES).forEach(function (key) {
      var size = constants.SIZES[key];
      var prop = size;
      var classPart = size + '-';

      if (this.props[prop]) {
        classes['col-' + classPart + this.props[prop]] = true;
      }

      prop = size + 'Offset';
      classPart = size + '-offset-';
      if (this.props[prop]) {
        classes['col-' + classPart + this.props[prop]] = true;
      }

      prop = size + 'Push';
      classPart = size + '-push-';
      if (this.props[prop]) {
        classes['col-' + classPart + this.props[prop]] = true;
      }

      prop = size + 'Pull';
      classPart = size + '-pull-';
      if (this.props[prop]) {
        classes['col-' + classPart + this.props[prop]] = true;
      }
    }, this);

    return this.transferPropsTo(
      componentClass( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = Col;
},{"./constants":50,"./utils/CustomPropTypes":52,"./utils/classSet":56}],16:[function(require,module,exports){
var React = (window.React || React);
var TransitionEvents = require('./utils/TransitionEvents');

var CollapsableMixin = {

  propTypes: {
    collapsable: React.PropTypes.bool,
    defaultExpanded: React.PropTypes.bool,
    expanded: React.PropTypes.bool
  },

  getInitialState: function () {
    return {
      expanded: this.props.defaultExpanded != null ? this.props.defaultExpanded : null,
      collapsing: false
    };
  },

  handleTransitionEnd: function () {
    this._collapseEnd = true;
    this.setState({
      collapsing: false
    });
  },

  componentWillReceiveProps: function (newProps) {
    if (this.props.collapsable && newProps.expanded !== this.props.expanded) {
      this._collapseEnd = false;
      this.setState({
        collapsing: true
      });
    }
  },

  _addEndTransitionListener: function () {
    var node = this.getCollapsableDOMNode();

    if (node) {
      TransitionEvents.addEndEventListener(
        node,
        this.handleTransitionEnd
      );
    }
  },

  _removeEndTransitionListener: function () {
    var node = this.getCollapsableDOMNode();

    if (node) {
      TransitionEvents.addEndEventListener(
        node,
        this.handleTransitionEnd
      );
    }
  },

  componentDidMount: function () {
    this._afterRender();
  },

  componentWillUnmount: function () {
    this._removeEndTransitionListener();
  },

  componentWillUpdate: function (nextProps) {
    var dimension = (typeof this.getCollapsableDimension === 'function') ?
      this.getCollapsableDimension() : 'height';
    var node = this.getCollapsableDOMNode();

    this._removeEndTransitionListener();
    if (node && nextProps.expanded !== this.props.expanded && this.props.expanded) {
      node.style[dimension] = this.getCollapsableDimensionValue() + 'px';
    }
  },

  componentDidUpdate: function (prevProps, prevState) {
    if (this.state.collapsing !== prevState.collapsing) {
      this._afterRender();
    }
  },

  _afterRender: function () {
    if (!this.props.collapsable) {
      return;
    }

    this._addEndTransitionListener();
    setTimeout(this._updateDimensionAfterRender, 0);
  },

  _updateDimensionAfterRender: function () {
    var dimension = (typeof this.getCollapsableDimension === 'function') ?
      this.getCollapsableDimension() : 'height';
    var node = this.getCollapsableDOMNode();

    if (node) {
      node.style[dimension] = this.isExpanded() ?
        this.getCollapsableDimensionValue() + 'px' : '0px';
    }
  },

  isExpanded: function () {
    return (this.props.expanded != null) ?
      this.props.expanded : this.state.expanded;
  },

  getCollapsableClassSet: function (className) {
    var classes = {};

    if (typeof className === 'string') {
      className.split(' ').forEach(function (className) {
        if (className) {
          classes[className] = true;
        }
      });
    }

    classes.collapsing = this.state.collapsing;
    classes.collapse = !this.state.collapsing;
    classes['in'] = this.isExpanded() && !this.state.collapsing;

    return classes;
  }
};

module.exports = CollapsableMixin;
},{"./utils/TransitionEvents":54}],17:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var createChainedFunction = require('./utils/createChainedFunction');
var BootstrapMixin = require('./BootstrapMixin');
var DropdownStateMixin = require('./DropdownStateMixin');
var Button = require('./Button');
var ButtonGroup = require('./ButtonGroup');
var DropdownMenu = require('./DropdownMenu');
var ValidComponentChildren = require('./utils/ValidComponentChildren');


var DropdownButton = React.createClass({displayName: 'DropdownButton',
  mixins: [BootstrapMixin, DropdownStateMixin],

  propTypes: {
    pullRight: React.PropTypes.bool,
    dropup:    React.PropTypes.bool,
    title:     React.PropTypes.renderable,
    href:      React.PropTypes.string,
    onClick:   React.PropTypes.func,
    onSelect:  React.PropTypes.func,
    navItem:   React.PropTypes.bool
  },

  render: function () {
    var className = 'dropdown-toggle';

    var renderMethod = this.props.navItem ?
      'renderNavItem' : 'renderButtonGroup';

    return this[renderMethod]([
      this.transferPropsTo(Button(
        {ref:"dropdownButton",
        className:className,
        onClick:this.handleDropdownClick,
        key:0,
        navDropdown:this.props.navItem,
        navItem:null,
        title:null,
        pullRight:null,
        dropup:null}, 
        this.props.title,' ',
        React.DOM.span( {className:"caret"} )
      )),
      DropdownMenu(
        {ref:"menu",
        'aria-labelledby':this.props.id,
        pullRight:this.props.pullRight,
        key:1}, 
        ValidComponentChildren.map(this.props.children, this.renderMenuItem)
      )
    ]);
  },

  renderButtonGroup: function (children) {
    var groupClasses = {
        'open': this.state.open,
        'dropup': this.props.dropup
      };

    return (
      ButtonGroup(
        {bsSize:this.props.bsSize,
        className:classSet(groupClasses)}, 
        children
      )
    );
  },

  renderNavItem: function (children) {
    var classes = {
        'dropdown': true,
        'open': this.state.open,
        'dropup': this.props.dropup
      };

    return (
      React.DOM.li( {className:classSet(classes)}, 
        children
      )
    );
  },

  renderMenuItem: function (child) {
    // Only handle the option selection if an onSelect prop has been set on the
    // component or it's child, this allows a user not to pass an onSelect
    // handler and have the browser preform the default action.
    var handleOptionSelect = this.props.onSelect || child.props.onSelect ?
      this.handleOptionSelect : null;

    return cloneWithProps(
      child,
      {
        // Capture onSelect events
        onSelect: createChainedFunction(child.props.onSelect, handleOptionSelect),

        // Force special props to be transferred
        key: child.props.key,
        ref: child.props.ref
      }
    );
  },

  handleDropdownClick: function (e) {
    e.preventDefault();

    this.setDropdownState(!this.state.open);
  },

  handleOptionSelect: function (key) {
    if (this.props.onSelect) {
      this.props.onSelect(key);
    }

    this.setDropdownState(false);
  }
});

module.exports = DropdownButton;
},{"./BootstrapMixin":9,"./Button":10,"./ButtonGroup":11,"./DropdownMenu":18,"./DropdownStateMixin":19,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],18:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var createChainedFunction = require('./utils/createChainedFunction');
var ValidComponentChildren = require('./utils/ValidComponentChildren');

var DropdownMenu = React.createClass({displayName: 'DropdownMenu',
  propTypes: {
    pullRight: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  render: function () {
    var classes = {
        'dropdown-menu': true,
        'dropdown-menu-right': this.props.pullRight
      };

    return this.transferPropsTo(
        React.DOM.ul(
          {className:classSet(classes),
          role:"menu"}, 
          ValidComponentChildren.map(this.props.children, this.renderMenuItem)
        )
      );
  },

  renderMenuItem: function (child) {
    return cloneWithProps(
      child,
      {
        // Capture onSelect events
        onSelect: createChainedFunction(child.props.onSelect, this.props.onSelect),

        // Force special props to be transferred
        key: child.props.key,
        ref: child.props.ref
      }
    );
  }
});

module.exports = DropdownMenu;
},{"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],19:[function(require,module,exports){
var React = (window.React || React);
var EventListener = require('./utils/EventListener');

/**
 * Checks whether a node is within
 * a root nodes tree
 *
 * @param {DOMElement} node
 * @param {DOMElement} root
 * @returns {boolean}
 */
function isNodeInRoot(node, root) {
  while (node) {
    if (node === root) {
      return true;
    }
    node = node.parentNode;
  }

  return false;
}

var DropdownStateMixin = {
  getInitialState: function () {
    return {
      open: false
    };
  },

  setDropdownState: function (newState, onStateChangeComplete) {
    if (newState) {
      this.bindRootCloseHandlers();
    } else {
      this.unbindRootCloseHandlers();
    }

    this.setState({
      open: newState
    }, onStateChangeComplete);
  },

  handleDocumentKeyUp: function (e) {
    if (e.keyCode === 27) {
      this.setDropdownState(false);
    }
  },

  handleDocumentClick: function (e) {
    // If the click originated from within this component
    // don't do anything.
    if (isNodeInRoot(e.target, this.getDOMNode())) {
      return;
    }

    this.setDropdownState(false);
  },

  bindRootCloseHandlers: function () {
    this._onDocumentClickListener =
      EventListener.listen(document, 'click', this.handleDocumentClick);
    this._onDocumentKeyupListener =
      EventListener.listen(document, 'keyup', this.handleDocumentKeyUp);
  },

  unbindRootCloseHandlers: function () {
    if (this._onDocumentClickListener) {
      this._onDocumentClickListener.remove();
    }

    if (this._onDocumentKeyupListener) {
      this._onDocumentKeyupListener.remove();
    }
  },

  componentWillUnmount: function () {
    this.unbindRootCloseHandlers();
  }
};

module.exports = DropdownStateMixin;
},{"./utils/EventListener":53}],20:[function(require,module,exports){
var React = (window.React || React);

// TODO: listen for onTransitionEnd to remove el
module.exports = {
  _fadeIn: function () {
    var els;

    if (this.isMounted()) {
      els = this.getDOMNode().querySelectorAll('.fade');
      if (els.length) {
        Array.prototype.forEach.call(els, function (el) {
          el.className += ' in';
        });
      }
    }
  },

  _fadeOut: function () {
    var els = this._fadeOutEl.querySelectorAll('.fade.in');

    if (els.length) {
      Array.prototype.forEach.call(els, function (el) {
        el.className = el.className.replace(/\bin\b/, '');
      });
    }

    setTimeout(this._handleFadeOutEnd, 300);
  },

  _handleFadeOutEnd: function () {
    if (this._fadeOutEl && this._fadeOutEl.parentNode) {
      this._fadeOutEl.parentNode.removeChild(this._fadeOutEl);
    }
  },

  componentDidMount: function () {
    if (document.querySelectorAll) {
      // Firefox needs delay for transition to be triggered
      setTimeout(this._fadeIn, 20);
    }
  },

  componentWillUnmount: function () {
    var els = this.getDOMNode().querySelectorAll('.fade');
    if (els.length) {
      this._fadeOutEl = document.createElement('div');
      document.body.appendChild(this._fadeOutEl);
      this._fadeOutEl.appendChild(this.getDOMNode().cloneNode(true));
      // Firefox needs delay for transition to be triggered
      setTimeout(this._fadeOut, 20);
    }
  }
};

},{}],21:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');
var constants = require('./constants');

var Glyphicon = React.createClass({displayName: 'Glyphicon',
  mixins: [BootstrapMixin],

  propTypes: {
    glyph: React.PropTypes.oneOf(constants.GLYPHS).isRequired
  },

  getDefaultProps: function () {
    return {
      bsClass: 'glyphicon'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();

    classes['glyphicon-' + this.props.glyph] = true;

    return this.transferPropsTo(
      React.DOM.span( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = Glyphicon;
},{"./BootstrapMixin":9,"./constants":50,"./utils/classSet":56}],22:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var CustomPropTypes = require('./utils/CustomPropTypes');


var Grid = React.createClass({displayName: 'Grid',
  propTypes: {
    fluid: React.PropTypes.bool,
    componentClass: CustomPropTypes.componentClass
  },

  getDefaultProps: function () {
    return {
      componentClass: React.DOM.div
    };
  },

  render: function () {
    var componentClass = this.props.componentClass;

    return this.transferPropsTo(
      componentClass( {className:this.props.fluid ? 'container-fluid' : 'container'}, 
        this.props.children
      )
    );
  }
});

module.exports = Grid;
},{"./utils/CustomPropTypes":52}],23:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');

var Input = React.createClass({displayName: 'Input',
  propTypes: {
    type: React.PropTypes.string,
    label: React.PropTypes.renderable,
    help: React.PropTypes.renderable,
    addonBefore: React.PropTypes.renderable,
    addonAfter: React.PropTypes.renderable,
    bsStyle: React.PropTypes.oneOf(['success', 'warning', 'error']),
    hasFeedback: React.PropTypes.bool,
    groupClassName: React.PropTypes.string,
    wrapperClassName: React.PropTypes.string,
    labelClassName: React.PropTypes.string
  },

  getInputDOMNode: function () {
    return this.refs.input.getDOMNode();
  },

  getValue: function () {
    if (this.props.type === 'static') {
      return this.props.value;
    }
    else if (this.props.type) {
      return this.getInputDOMNode().value;
    }
    else {
      throw Error('Cannot use getValue without specifying input type.');
    }
  },

  getChecked: function () {
    return this.getInputDOMNode().checked;
  },

  isCheckboxOrRadio: function () {
    return this.props.type === 'radio' || this.props.type === 'checkbox';
  },

  renderInput: function () {
    var input = null;

    if (!this.props.type) {
      return this.props.children
    }

    switch (this.props.type) {
      case 'select':
        input = (
          React.DOM.select( {className:"form-control", ref:"input", key:"input"}, 
            this.props.children
          )
        );
        break;
      case 'textarea':
        input = React.DOM.textarea( {className:"form-control", ref:"input", key:"input"} );
        break;
      case 'static':
        input = (
          React.DOM.p( {className:"form-control-static", ref:"input",  key:"input"}, 
            this.props.value
          )
        );
        break;
      default:
        var className = this.isCheckboxOrRadio() ? '' : 'form-control';
        input = React.DOM.input( {className:className, ref:"input", key:"input"} );
    }

    return this.transferPropsTo(input);
  },

  renderInputGroup: function (children) {
    var addonBefore = this.props.addonBefore ? (
      React.DOM.span( {className:"input-group-addon", key:"addonBefore"}, 
        this.props.addonBefore
      )
    ) : null;

    var addonAfter = this.props.addonAfter ? (
      React.DOM.span( {className:"input-group-addon", key:"addonAfter"}, 
        this.props.addonAfter
      )
    ) : null;

    return addonBefore || addonAfter ? (
      React.DOM.div( {className:"input-group", key:"input-group"}, 
        addonBefore,
        children,
        addonAfter
      )
    ) : children;
  },

  renderIcon: function () {
    var classes = {
      'glyphicon': true,
      'form-control-feedback': true,
      'glyphicon-ok': this.props.bsStyle === 'success',
      'glyphicon-warning-sign': this.props.bsStyle === 'warning',
      'glyphicon-remove': this.props.bsStyle === 'error'
    };

    return this.props.hasFeedback ? (
      React.DOM.span( {className:classSet(classes), key:"icon"} )
    ) : null;
  },

  renderHelp: function () {
    return this.props.help ? (
      React.DOM.span( {className:"help-block", key:"help"}, 
        this.props.help
      )
    ) : null;
  },

  renderCheckboxandRadioWrapper: function (children) {
    var classes = {
      'checkbox': this.props.type === 'checkbox',
      'radio': this.props.type === 'radio'
    };

    return (
      React.DOM.div( {className:classSet(classes), key:"checkboxRadioWrapper"}, 
        children
      )
    );
  },

  renderWrapper: function (children) {
    return this.props.wrapperClassName ? (
      React.DOM.div( {className:this.props.wrapperClassName, key:"wrapper"}, 
        children
      )
    ) : children;
  },

  renderLabel: function (children) {
    var classes = {
      'control-label': !this.isCheckboxOrRadio()
    };
    classes[this.props.labelClassName] = this.props.labelClassName;

    return this.props.label ? (
      React.DOM.label( {htmlFor:this.props.id, className:classSet(classes), key:"label"}, 
        children,
        this.props.label
      )
    ) : children;
  },

  renderFormGroup: function (children) {
    var classes = {
      'form-group': true,
      'has-feedback': this.props.hasFeedback,
      'has-success': this.props.bsStyle === 'success',
      'has-warning': this.props.bsStyle === 'warning',
      'has-error': this.props.bsStyle === 'error'
    };
    classes[this.props.groupClassName] = this.props.groupClassName;

    return (
      React.DOM.div( {className:classSet(classes)}, 
        children
      )
    );
  },

  render: function () {
    if (this.isCheckboxOrRadio()) {
      return this.renderFormGroup(
        this.renderWrapper([
          this.renderCheckboxandRadioWrapper(
            this.renderLabel(
              this.renderInput()
            )
          ),
          this.renderHelp()
        ])
      );
    }
    else {
      return this.renderFormGroup([
        this.renderLabel(),
        this.renderWrapper([
          this.renderInputGroup(
            this.renderInput()
          ),
          this.renderIcon(),
          this.renderHelp()
        ])
      ]);
    }
  }
});

module.exports = Input;

},{"./utils/classSet":56}],24:[function(require,module,exports){
// https://www.npmjs.org/package/react-interpolate-component
'use strict';

var React = (window.React || React);
var merge = require('./utils/merge');
var ValidComponentChildren = require('./utils/ValidComponentChildren');

var REGEXP = /\%\((.+?)\)s/;

var Interpolate = React.createClass({
  displayName: 'Interpolate',

  propTypes: {
    format: React.PropTypes.string
  },

  getDefaultProps: function() {
    return { component: React.DOM.span };
  },

  render: function() {
    var format = ValidComponentChildren.hasValidComponent(this.props.children) ? this.props.children : this.props.format;
    var parent = this.props.component;
    var unsafe = this.props.unsafe === true;
    var props = merge(this.props);

    delete props.children;
    delete props.format;
    delete props.component;
    delete props.unsafe;

    if (unsafe) {
      var content = format.split(REGEXP).reduce(function(memo, match, index) {
        var html;

        if (index % 2 === 0) {
          html = match;
        } else {
          html = props[match];
          delete props[match];
        }

        if (React.isValidComponent(html)) {
          throw new Error('cannot interpolate a React component into unsafe text');
        }

        memo += html;

        return memo;
      }, '');

      props.dangerouslySetInnerHTML = { __html: content };

      return parent(props);
    } else {
      var args = format.split(REGEXP).reduce(function(memo, match, index) {
        var child;

        if (index % 2 === 0) {
          if (match.length === 0) {
            return memo;
          }

          child = match;
        } else {
          child = props[match];
          delete props[match];
        }

        memo.push(child);

        return memo;
      }, [props]);

      return parent.apply(null, args);
    }
  }
});

module.exports = Interpolate;

},{"./utils/ValidComponentChildren":55,"./utils/merge":60}],25:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);

var Jumbotron = React.createClass({displayName: 'Jumbotron',

  render: function () {
    return this.transferPropsTo(
      React.DOM.div( {className:"jumbotron"}, 
        this.props.children
      )
    );
  }
});

module.exports = Jumbotron;
},{}],26:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');

var Label = React.createClass({displayName: 'Label',
  mixins: [BootstrapMixin],

  getDefaultProps: function () {
    return {
      bsClass: 'label',
      bsStyle: 'default'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();

    return this.transferPropsTo(
      React.DOM.span( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = Label;
},{"./BootstrapMixin":9,"./utils/classSet":56}],27:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');

var MenuItem = React.createClass({displayName: 'MenuItem',
  propTypes: {
    header:   React.PropTypes.bool,
    divider:  React.PropTypes.bool,
    href:     React.PropTypes.string,
    title:    React.PropTypes.string,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  handleClick: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();
      this.props.onSelect(this.props.key);
    }
  },

  renderAnchor: function () {
    return (
      React.DOM.a( {onClick:this.handleClick, href:this.props.href, title:this.props.title, tabIndex:"-1"}, 
        this.props.children
      )
    );
  },

  render: function () {
    var classes = {
        'dropdown-header': this.props.header,
        'divider': this.props.divider
      };

    var children = null;
    if (this.props.header) {
      children = this.props.children;
    } else if (!this.props.divider) {
      children = this.renderAnchor();
    }

    return this.transferPropsTo(
      React.DOM.li( {role:"presentation", title:null, href:null, className:classSet(classes)}, 
        children
      )
    );
  }
});

module.exports = MenuItem;
},{"./utils/classSet":56}],28:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');
var FadeMixin = require('./FadeMixin');
var EventListener = require('./utils/EventListener');


// TODO:
// - aria-labelledby
// - Add `modal-body` div if only one child passed in that doesn't already have it
// - Tests

var Modal = React.createClass({displayName: 'Modal',
  mixins: [BootstrapMixin, FadeMixin],

  propTypes: {
    title: React.PropTypes.renderable,
    backdrop: React.PropTypes.oneOf(['static', true, false]),
    keyboard: React.PropTypes.bool,
    closeButton: React.PropTypes.bool,
    animation: React.PropTypes.bool,
    onRequestHide: React.PropTypes.func.isRequired
  },

  getDefaultProps: function () {
    return {
      bsClass: 'modal',
      backdrop: true,
      keyboard: true,
      animation: true,
      closeButton: true
    };
  },

  render: function () {
    var modalStyle = {display: 'block'};
    var dialogClasses = this.getBsClassSet();
    delete dialogClasses.modal;
    dialogClasses['modal-dialog'] = true;

    var classes = {
      modal: true,
      fade: this.props.animation,
      'in': !this.props.animation || !document.querySelectorAll
    };

    var modal = this.transferPropsTo(
      React.DOM.div(
        {title:null,
        tabIndex:"-1",
        role:"dialog",
        style:modalStyle,
        className:classSet(classes),
        onClick:this.props.backdrop === true ? this.handleBackdropClick : null,
        ref:"modal"}, 
        React.DOM.div( {className:classSet(dialogClasses)}, 
          React.DOM.div( {className:"modal-content"}, 
            this.props.title ? this.renderHeader() : null,
            this.props.children
          )
        )
      )
    );

    return this.props.backdrop ?
      this.renderBackdrop(modal) : modal;
  },

  renderBackdrop: function (modal) {
    var classes = {
      'modal-backdrop': true,
      'fade': this.props.animation
    };

    classes['in'] = !this.props.animation || !document.querySelectorAll;

    var onClick = this.props.backdrop === true ?
      this.handleBackdropClick : null;

    return (
      React.DOM.div(null, 
        React.DOM.div( {className:classSet(classes), ref:"backdrop", onClick:onClick} ),
        modal
      )
    );
  },

  renderHeader: function () {
    var closeButton;
    if (this.props.closeButton) {
      closeButton = (
          React.DOM.button( {type:"button", className:"close", 'aria-hidden':"true", onClick:this.props.onRequestHide}, "×")
        );
    }

    return (
      React.DOM.div( {className:"modal-header"}, 
        closeButton,
        this.renderTitle()
      )
    );
  },

  renderTitle: function () {
    return (
      React.isValidComponent(this.props.title) ?
        this.props.title : React.DOM.h4( {className:"modal-title"}, this.props.title)
    );
  },

  componentDidMount: function () {
    this._onDocumentKeyupListener =
      EventListener.listen(document, 'keyup', this.handleDocumentKeyUp);
  },

  componentWillUnmount: function () {
    this._onDocumentKeyupListener.remove();
  },

  handleBackdropClick: function (e) {
    if (e.target !== e.currentTarget) {
      return;
    }

    this.props.onRequestHide();
  },

  handleDocumentKeyUp: function (e) {
    if (this.props.keyboard && e.keyCode === 27) {
      this.props.onRequestHide();
    }
  }
});

module.exports = Modal;

},{"./BootstrapMixin":9,"./FadeMixin":20,"./utils/EventListener":53,"./utils/classSet":56}],29:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var OverlayMixin = require('./OverlayMixin');
var cloneWithProps = require('./utils/cloneWithProps');
var createChainedFunction = require('./utils/createChainedFunction');

var ModalTrigger = React.createClass({displayName: 'ModalTrigger',
  mixins: [OverlayMixin],

  propTypes: {
    modal: React.PropTypes.renderable.isRequired
  },

  getInitialState: function () {
    return {
      isOverlayShown: false
    };
  },

  show: function () {
    this.setState({
      isOverlayShown: true
    });
  },

  hide: function () {
    this.setState({
      isOverlayShown: false
    });
  },

  toggle: function () {
    this.setState({
      isOverlayShown: !this.state.isOverlayShown
    });
  },

  renderOverlay: function () {
    if (!this.state.isOverlayShown) {
      return React.DOM.span(null );
    }

    return cloneWithProps(
      this.props.modal,
      {
        onRequestHide: this.hide
      }
    );
  },

  render: function () {
    var child = React.Children.only(this.props.children);
    return cloneWithProps(
      child,
      {
        onClick: createChainedFunction(child.props.onClick, this.toggle)
      }
    );
  }
});

module.exports = ModalTrigger;
},{"./OverlayMixin":33,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],30:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var BootstrapMixin = require('./BootstrapMixin');
var CollapsableMixin = require('./CollapsableMixin');
var classSet = require('./utils/classSet');
var domUtils = require('./utils/domUtils');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var createChainedFunction = require('./utils/createChainedFunction');


var Nav = React.createClass({displayName: 'Nav',
  mixins: [BootstrapMixin, CollapsableMixin],

  propTypes: {
    bsStyle: React.PropTypes.oneOf(['tabs','pills']),
    stacked: React.PropTypes.bool,
    justified: React.PropTypes.bool,
    onSelect: React.PropTypes.func,
    collapsable: React.PropTypes.bool,
    expanded: React.PropTypes.bool,
    navbar: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      bsClass: 'nav'
    };
  },

  getCollapsableDOMNode: function () {
    return this.getDOMNode();
  },

  getCollapsableDimensionValue: function () {
    var node = this.refs.ul.getDOMNode(),
        height = node.offsetHeight,
        computedStyles = domUtils.getComputedStyles(node);

    return height + parseInt(computedStyles.marginTop, 10) + parseInt(computedStyles.marginBottom, 10);
  },

  render: function () {
    var classes = this.props.collapsable ? this.getCollapsableClassSet() : {};

    classes['navbar-collapse'] = this.props.collapsable;

    if (this.props.navbar && !this.props.collapsable) {
      return this.transferPropsTo(this.renderUl());
    }

    return this.transferPropsTo(
      React.DOM.nav( {className:classSet(classes)}, 
        this.renderUl()
      )
    );
  },

  renderUl: function () {
    var classes = this.getBsClassSet();

    classes['nav-stacked'] = this.props.stacked;
    classes['nav-justified'] = this.props.justified;
    classes['navbar-nav'] = this.props.navbar;
    classes['pull-right'] = this.props.pullRight;

    return (
      React.DOM.ul( {className:classSet(classes), ref:"ul"}, 
        ValidComponentChildren.map(this.props.children, this.renderNavItem)
      )
    );
  },

  getChildActiveProp: function (child) {
    if (child.props.active) {
      return true;
    }
    if (this.props.activeKey != null) {
      if (child.props.key === this.props.activeKey) {
        return true;
      }
    }
    if (this.props.activeHref != null) {
      if (child.props.href === this.props.activeHref) {
        return true;
      }
    }

    return child.props.active;
  },

  renderNavItem: function (child) {
    return cloneWithProps(
      child,
      {
        active: this.getChildActiveProp(child),
        activeKey: this.props.activeKey,
        activeHref: this.props.activeHref,
        onSelect: createChainedFunction(child.props.onSelect, this.props.onSelect),
        ref: child.props.ref,
        key: child.props.key,
        navItem: true
      }
    );
  }
});

module.exports = Nav;

},{"./BootstrapMixin":9,"./CollapsableMixin":16,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58,"./utils/domUtils":59}],31:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');

var NavItem = React.createClass({displayName: 'NavItem',
  mixins: [BootstrapMixin],

  propTypes: {
    onSelect: React.PropTypes.func,
    active: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    href: React.PropTypes.string,
    title: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  render: function () {
    var classes = {
      'active': this.props.active,
      'disabled': this.props.disabled
    };

    return this.transferPropsTo(
      React.DOM.li( {className:classSet(classes)}, 
        React.DOM.a(
          {href:this.props.href,
          title:this.props.title,
          onClick:this.handleClick,
          ref:"anchor"}, 
          this.props.children
        )
      )
    );
  },

  handleClick: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();

      if (!this.props.disabled) {
        this.props.onSelect(this.props.key,this.props.href);
      }
    }
  }
});

module.exports = NavItem;
},{"./BootstrapMixin":9,"./utils/classSet":56}],32:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var BootstrapMixin = require('./BootstrapMixin');
var CustomPropTypes = require('./utils/CustomPropTypes');
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var createChainedFunction = require('./utils/createChainedFunction');
var Nav = require('./Nav');


var Navbar = React.createClass({displayName: 'Navbar',
  mixins: [BootstrapMixin],

  propTypes: {
    fixedTop: React.PropTypes.bool,
    fixedBottom: React.PropTypes.bool,
    staticTop: React.PropTypes.bool,
    inverse: React.PropTypes.bool,
    fluid: React.PropTypes.bool,
    role: React.PropTypes.string,
    componentClass: CustomPropTypes.componentClass,
    brand: React.PropTypes.renderable,
    toggleButton: React.PropTypes.renderable,
    onToggle: React.PropTypes.func,
    navExpanded: React.PropTypes.bool,
    defaultNavExpanded: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      bsClass: 'navbar',
      bsStyle: 'default',
      role: 'navigation',
      componentClass: React.DOM.nav
    };
  },

  getInitialState: function () {
    return {
      navExpanded: this.props.defaultNavExpanded
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onSelect` handler.
    return !this._isChanging;
  },

  handleToggle: function () {
    if (this.props.onToggle) {
      this._isChanging = true;
      this.props.onToggle();
      this._isChanging = false;
    }

    this.setState({
      navOpen: !this.state.navOpen
    });
  },

  isNavOpen: function () {
    return this.props.navOpen != null ? this.props.navOpen : this.state.navOpen;
  },

  render: function () {
    var classes = this.getBsClassSet();
    var componentClass = this.props.componentClass;

    classes['navbar-fixed-top'] = this.props.fixedTop;
    classes['navbar-fixed-bottom'] = this.props.fixedBottom;
    classes['navbar-static-top'] = this.props.staticTop;
    classes['navbar-inverse'] = this.props.inverse;

    return this.transferPropsTo(
      componentClass( {className:classSet(classes)}, 
        React.DOM.div( {className:this.props.fluid ? 'container-fluid' : 'container'}, 
          (this.props.brand || this.props.toggleButton || this.props.toggleNavKey) ? this.renderHeader() : null,
          ValidComponentChildren.map(this.props.children, this.renderChild)
        )
      )
    );
  },

  renderChild: function (child) {
    return cloneWithProps(child, {
      navbar: true,
      collapsable: this.props.toggleNavKey != null && this.props.toggleNavKey === child.props.key,
      expanded: this.props.toggleNavKey != null && this.props.toggleNavKey === child.props.key && this.isNavOpen(),
      key: child.props.key,
      ref: child.props.ref
    });
  },

  renderHeader: function () {
    var brand;

    if (this.props.brand) {
      brand = React.isValidComponent(this.props.brand) ?
        cloneWithProps(this.props.brand, {
          className: 'navbar-brand'
        }) : React.DOM.span( {className:"navbar-brand"}, this.props.brand);
    }

    return (
      React.DOM.div( {className:"navbar-header"}, 
        brand,
        (this.props.toggleButton || this.props.toggleNavKey != null) ? this.renderToggleButton() : null
      )
    );
  },

  renderToggleButton: function () {
    var children;

    if (React.isValidComponent(this.props.toggleButton)) {
      return cloneWithProps(this.props.toggleButton, {
        className: 'navbar-toggle',
        onClick: createChainedFunction(this.handleToggle, this.props.toggleButton.props.onClick)
      });
    }

    children = (this.props.toggleButton != null) ?
      this.props.toggleButton : [
        React.DOM.span( {className:"sr-only", key:0}, "Toggle navigation"),
        React.DOM.span( {className:"icon-bar", key:1}),
        React.DOM.span( {className:"icon-bar", key:2}),
        React.DOM.span( {className:"icon-bar", key:3})
    ];

    return (
      React.DOM.button( {className:"navbar-toggle", type:"button", onClick:this.handleToggle}, 
        children
      )
    );
  }
});

module.exports = Navbar;

},{"./BootstrapMixin":9,"./Nav":30,"./utils/CustomPropTypes":52,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],33:[function(require,module,exports){
var React = (window.React || React);
var CustomPropTypes = require('./utils/CustomPropTypes');

module.exports = {
  propTypes: {
    container: CustomPropTypes.mountable
  },

  getDefaultProps: function () {
    return {
      container: typeof document !== 'undefined' ? document.body : {
        // If we are in an environment that doesnt have `document` defined it should be
        // safe to assume that `componentDidMount` will not run and this will be needed,
        // just provide enough fake API to pass the propType validation.
        getDOMNode: function noop() {}
      }
    };
  },

  componentWillUnmount: function () {
    this._unrenderOverlay();
    if (this._overlayTarget) {
      this.getContainerDOMNode()
        .removeChild(this._overlayTarget);
      this._overlayTarget = null;
    }
  },

  componentDidUpdate: function () {
    this._renderOverlay();
  },

  componentDidMount: function () {
    this._renderOverlay();
  },

  _mountOverlayTarget: function () {
    this._overlayTarget = document.createElement('div');
    this.getContainerDOMNode()
      .appendChild(this._overlayTarget);
  },

  _renderOverlay: function () {
    if (!this._overlayTarget) {
      this._mountOverlayTarget();
    }

    // Save reference to help testing
    this._overlayInstance = React.renderComponent(this.renderOverlay(), this._overlayTarget);
  },

  _unrenderOverlay: function () {
    React.unmountComponentAtNode(this._overlayTarget);
    this._overlayInstance = null;
  },

  getOverlayDOMNode: function () {
    if (!this.isMounted()) {
      throw new Error('getOverlayDOMNode(): A component must be mounted to have a DOM node.');
    }

    return this._overlayInstance.getDOMNode();
  },

  getContainerDOMNode: function () {
    return this.props.container.getDOMNode ?
      this.props.container.getDOMNode() : this.props.container;
  }
};

},{"./utils/CustomPropTypes":52}],34:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var OverlayMixin = require('./OverlayMixin');
var domUtils = require('./utils/domUtils');
var cloneWithProps = require('./utils/cloneWithProps');
var createChainedFunction = require('./utils/createChainedFunction');
var merge = require('./utils/merge');

/**
 * Check if value one is inside or equal to the of value
 *
 * @param {string} one
 * @param {string|array} of
 * @returns {boolean}
 */
function isOneOf(one, of) {
  if (Array.isArray(of)) {
    return of.indexOf(one) >= 0;
  }
  return one === of;
}

var OverlayTrigger = React.createClass({displayName: 'OverlayTrigger',
  mixins: [OverlayMixin],

  propTypes: {
    trigger: React.PropTypes.oneOfType([
      React.PropTypes.oneOf(['manual', 'click', 'hover', 'focus']),
      React.PropTypes.arrayOf(React.PropTypes.oneOf(['click', 'hover', 'focus']))
    ]),
    placement: React.PropTypes.oneOf(['top','right', 'bottom', 'left']),
    delay: React.PropTypes.number,
    delayShow: React.PropTypes.number,
    delayHide: React.PropTypes.number,
    defaultOverlayShown: React.PropTypes.bool,
    overlay: React.PropTypes.renderable.isRequired
  },

  getDefaultProps: function () {
    return {
      placement: 'right',
      trigger: ['hover', 'focus']
    };
  },

  getInitialState: function () {
    return {
      isOverlayShown: this.props.defaultOverlayShown == null ?
        false : this.props.defaultOverlayShown,
      overlayLeft: null,
      overlayTop: null
    };
  },

  show: function () {
    this.setState({
      isOverlayShown: true
    }, function() {
      this.updateOverlayPosition();
    });
  },

  hide: function () {
    this.setState({
      isOverlayShown: false
    });
  },

  toggle: function () {
    this.state.isOverlayShown ?
      this.hide() : this.show();
  },

  renderOverlay: function () {
    if (!this.state.isOverlayShown) {
      return React.DOM.span(null );
    }

    return cloneWithProps(
      this.props.overlay,
      {
        onRequestHide: this.hide,
        placement: this.props.placement,
        positionLeft: this.state.overlayLeft,
        positionTop: this.state.overlayTop
      }
    );
  },

  render: function () {
    var props = {};

    if (isOneOf('click', this.props.trigger)) {
      props.onClick = createChainedFunction(this.toggle, this.props.onClick);
    }

    if (isOneOf('hover', this.props.trigger)) {
      props.onMouseOver = createChainedFunction(this.handleDelayedShow, this.props.onMouseOver);
      props.onMouseOut = createChainedFunction(this.handleDelayedHide, this.props.onMouseOut);
    }

    if (isOneOf('focus', this.props.trigger)) {
      props.onFocus = createChainedFunction(this.handleDelayedShow, this.props.onFocus);
      props.onBlur = createChainedFunction(this.handleDelayedHide, this.props.onBlur);
    }

    return cloneWithProps(
      React.Children.only(this.props.children),
      props
    );
  },

  componentWillUnmount: function() {
    clearTimeout(this._hoverDelay);
  },

  handleDelayedShow: function () {
    if (this._hoverDelay != null) {
      clearTimeout(this._hoverDelay);
      this._hoverDelay = null;
      return;
    }

    var delay = this.props.delayShow != null ?
      this.props.delayShow : this.props.delay;

    if (!delay) {
      this.show();
      return;
    }

    this._hoverDelay = setTimeout(function() {
      this._hoverDelay = null;
      this.show();
    }.bind(this), delay);
  },

  handleDelayedHide: function () {
    if (this._hoverDelay != null) {
      clearTimeout(this._hoverDelay);
      this._hoverDelay = null;
      return;
    }

    var delay = this.props.delayHide != null ?
      this.props.delayHide : this.props.delay;

    if (!delay) {
      this.hide();
      return;
    }

    this._hoverDelay = setTimeout(function() {
      this._hoverDelay = null;
      this.hide();
    }.bind(this), delay);
  },

  updateOverlayPosition: function () {
    if (!this.isMounted()) {
      return;
    }

    var pos = this.calcOverlayPosition();

    this.setState({
      overlayLeft: pos.left,
      overlayTop: pos.top
    });
  },

  calcOverlayPosition: function () {
    var childOffset = this.getPosition();

    var overlayNode = this.getOverlayDOMNode();
    var overlayHeight = overlayNode.offsetHeight;
    var overlayWidth = overlayNode.offsetWidth;

    switch (this.props.placement) {
      case 'right':
        return {
          top: childOffset.top + childOffset.height / 2 - overlayHeight / 2,
          left: childOffset.left + childOffset.width
        };
      case 'left':
        return {
          top: childOffset.top + childOffset.height / 2 - overlayHeight / 2,
          left: childOffset.left - overlayWidth
        };
      case 'top':
        return {
          top: childOffset.top - overlayHeight,
          left: childOffset.left + childOffset.width / 2 - overlayWidth / 2
        };
      case 'bottom':
        return {
          top: childOffset.top + childOffset.height,
          left: childOffset.left + childOffset.width / 2 - overlayWidth / 2
        };
      default:
        throw new Error('calcOverlayPosition(): No such placement of "' + this.props.placement + '" found.');
    }
  },

  getPosition: function () {
    var node = this.getDOMNode();
    var container = this.getContainerDOMNode();

    var offset = container.tagName == 'BODY' ?
      domUtils.getOffset(node) : domUtils.getPosition(node, container);

    return merge(offset, {
      height: node.offsetHeight,
      width: node.offsetWidth
    });
  }
});

module.exports = OverlayTrigger;
},{"./OverlayMixin":33,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58,"./utils/domUtils":59,"./utils/merge":60}],35:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);

var PageHeader = React.createClass({displayName: 'PageHeader',

  render: function () {
    return this.transferPropsTo(
      React.DOM.div( {className:"page-header"}, 
        React.DOM.h1(null, this.props.children)
      )
    );
  }
});

module.exports = PageHeader;
},{}],36:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');

var PageItem = React.createClass({displayName: 'PageItem',

  propTypes: {
    disabled: React.PropTypes.bool,
    previous: React.PropTypes.bool,
    next: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      href: '#'
    };
  },

  render: function () {
    var classes = {
      'disabled': this.props.disabled,
      'previous': this.props.previous,
      'next': this.props.next
    };

    return this.transferPropsTo(
      React.DOM.li(
        {className:classSet(classes)}, 
        React.DOM.a(
          {href:this.props.href,
          title:this.props.title,
          onClick:this.handleSelect,
          ref:"anchor"}, 
          this.props.children
        )
      )
    );
  },

  handleSelect: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();

      if (!this.props.disabled) {
        this.props.onSelect(this.props.key, this.props.href);
      }
    }
  }
});

module.exports = PageItem;
},{"./utils/classSet":56}],37:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var createChainedFunction = require('./utils/createChainedFunction');

var Pager = React.createClass({displayName: 'Pager',

  propTypes: {
    onSelect: React.PropTypes.func
  },

  render: function () {
    return this.transferPropsTo(
      React.DOM.ul(
        {className:"pager"}, 
        ValidComponentChildren.map(this.props.children, this.renderPageItem)
      )
    );
  },

  renderPageItem: function (child) {
    return cloneWithProps(
      child,
      {
        onSelect: createChainedFunction(child.props.onSelect, this.props.onSelect),
        ref: child.props.ref,
        key: child.props.key
      }
    );
  }
});

module.exports = Pager;
},{"./utils/ValidComponentChildren":55,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],38:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var BootstrapMixin = require('./BootstrapMixin');
var CollapsableMixin = require('./CollapsableMixin');

var Panel = React.createClass({displayName: 'Panel',
  mixins: [BootstrapMixin, CollapsableMixin],

  propTypes: {
    header: React.PropTypes.renderable,
    footer: React.PropTypes.renderable,
    onClick: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      bsClass: 'panel',
      bsStyle: 'default'
    };
  },

  handleSelect: function (e) {
    if (this.props.onSelect) {
      this._isChanging = true;
      this.props.onSelect(this.props.key);
      this._isChanging = false;
    }

    e.preventDefault();

    this.setState({
      expanded: !this.state.expanded
    });
  },

  shouldComponentUpdate: function () {
    return !this._isChanging;
  },

  getCollapsableDimensionValue: function () {
    return this.refs.body.getDOMNode().offsetHeight;
  },

  getCollapsableDOMNode: function () {
    if (!this.isMounted() || !this.refs || !this.refs.panel) {
      return null;
    }

    return this.refs.panel.getDOMNode();
  },

  render: function () {
    var classes = this.getBsClassSet();
    classes['panel'] = true;

    return this.transferPropsTo(
      React.DOM.div( {className:classSet(classes), id:this.props.collapsable ? null : this.props.id}, 
        this.renderHeading(),
        this.props.collapsable ? this.renderCollapsableBody() : this.renderBody(),
        this.renderFooter()
      )
    );
  },

  renderCollapsableBody: function () {
    return (
      React.DOM.div( {className:classSet(this.getCollapsableClassSet('panel-collapse')), id:this.props.id, ref:"panel"}, 
        this.renderBody()
      )
    );
  },

  renderBody: function () {
    return (
      React.DOM.div( {className:"panel-body", ref:"body"}, 
        this.props.children
      )
    );
  },

  renderHeading: function () {
    var header = this.props.header;

    if (!header) {
      return null;
    }

    if (!React.isValidComponent(header) || Array.isArray(header)) {
      header = this.props.collapsable ?
        this.renderCollapsableTitle(header) : header;
    } else if (this.props.collapsable) {
      header = cloneWithProps(header, {
        className: 'panel-title',
        children: this.renderAnchor(header.props.children)
      });
    } else {
      header = cloneWithProps(header, {
        className: 'panel-title'
      });
    }

    return (
      React.DOM.div( {className:"panel-heading"}, 
        header
      )
    );
  },

  renderAnchor: function (header) {
    return (
      React.DOM.a(
        {href:'#' + (this.props.id || ''),
        className:this.isExpanded() ? null : 'collapsed',
        onClick:this.handleSelect}, 
        header
      )
    );
  },

  renderCollapsableTitle: function (header) {
    return (
      React.DOM.h4( {className:"panel-title"}, 
        this.renderAnchor(header)
      )
    );
  },

  renderFooter: function () {
    if (!this.props.footer) {
      return null;
    }

    return (
      React.DOM.div( {className:"panel-footer"}, 
        this.props.footer
      )
    );
  }
});

module.exports = Panel;
},{"./BootstrapMixin":9,"./CollapsableMixin":16,"./utils/classSet":56,"./utils/cloneWithProps":57}],39:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var BootstrapMixin = require('./BootstrapMixin');
var ValidComponentChildren = require('./utils/ValidComponentChildren');

var PanelGroup = React.createClass({displayName: 'PanelGroup',
  mixins: [BootstrapMixin],

  propTypes: {
    collapsable: React.PropTypes.bool,
    activeKey: React.PropTypes.any,
    defaultActiveKey: React.PropTypes.any,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      bsClass: 'panel-group'
    };
  },

  getInitialState: function () {
    var defaultActiveKey = this.props.defaultActiveKey;

    return {
      activeKey: defaultActiveKey
    };
  },

  render: function () {
    return this.transferPropsTo(
      React.DOM.div( {className:classSet(this.getBsClassSet())}, 
        ValidComponentChildren.map(this.props.children, this.renderPanel)
      )
    );
  },

  renderPanel: function (child) {
    var activeKey =
      this.props.activeKey != null ? this.props.activeKey : this.state.activeKey;

    var props = {
      bsStyle: child.props.bsStyle || this.props.bsStyle,
      key: child.props.key,
      ref: child.props.ref
    };

    if (this.props.accordion) {
      props.collapsable = true;
      props.expanded = (child.props.key === activeKey);
      props.onSelect = this.handleSelect;
    }

    return cloneWithProps(
      child,
      props
    );
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onSelect` handler.
    return !this._isChanging;
  },

  handleSelect: function (key) {
    if (this.props.onSelect) {
      this._isChanging = true;
      this.props.onSelect(key);
      this._isChanging = false;
    }

    if (this.state.activeKey === key) {
      key = null;
    }

    this.setState({
      activeKey: key
    });
  }
});

module.exports = PanelGroup;
},{"./BootstrapMixin":9,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57}],40:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');


var Popover = React.createClass({displayName: 'Popover',
  mixins: [BootstrapMixin],

  propTypes: {
    placement: React.PropTypes.oneOf(['top','right', 'bottom', 'left']),
    positionLeft: React.PropTypes.number,
    positionTop: React.PropTypes.number,
    arrowOffsetLeft: React.PropTypes.number,
    arrowOffsetTop: React.PropTypes.number,
    title: React.PropTypes.renderable
  },

  getDefaultProps: function () {
    return {
      placement: 'right'
    };
  },

  render: function () {
    var classes = {};
    classes['popover'] = true;
    classes[this.props.placement] = true;
    classes['in'] = this.props.positionLeft != null || this.props.positionTop != null;

    var style = {};
    style['left'] = this.props.positionLeft;
    style['top'] = this.props.positionTop;
    style['display'] = 'block';

    var arrowStyle = {};
    arrowStyle['left'] = this.props.arrowOffsetLeft;
    arrowStyle['top'] = this.props.arrowOffsetTop;

    return (
      React.DOM.div( {className:classSet(classes), style:style}, 
        React.DOM.div( {className:"arrow", style:arrowStyle} ),
        this.props.title ? this.renderTitle() : null,
        React.DOM.div( {className:"popover-content"}, 
            this.props.children
        )
      )
    );
  },

  renderTitle: function() {
    return (
      React.DOM.h3( {className:"popover-title"}, this.props.title)
    );
  }
});

module.exports = Popover;
},{"./BootstrapMixin":9,"./utils/classSet":56}],41:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var Interpolate = require('./Interpolate');
var BootstrapMixin = require('./BootstrapMixin');
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');


var ProgressBar = React.createClass({displayName: 'ProgressBar',
  propTypes: {
    min: React.PropTypes.number,
    now: React.PropTypes.number,
    max: React.PropTypes.number,
    label: React.PropTypes.renderable,
    srOnly: React.PropTypes.bool,
    striped: React.PropTypes.bool,
    active: React.PropTypes.bool
  },

  mixins: [BootstrapMixin],

  getDefaultProps: function () {
    return {
      bsClass: 'progress-bar',
      min: 0,
      max: 100
    };
  },

  getPercentage: function (now, min, max) {
    return Math.ceil((now - min) / (max - min) * 100);
  },

  render: function () {
    var classes = {
        progress: true
      };

    if (this.props.active) {
      classes['progress-striped'] = true;
      classes['active'] = true;
    } else if (this.props.striped) {
      classes['progress-striped'] = true;
    }

    if (!ValidComponentChildren.hasValidComponent(this.props.children)) {
      if (!this.props.isChild) {
        return this.transferPropsTo(
          React.DOM.div( {className:classSet(classes)}, 
            this.renderProgressBar()
          )
        );
      } else {
        return this.transferPropsTo(
          this.renderProgressBar()
        );
      }
    } else {
      return this.transferPropsTo(
        React.DOM.div( {className:classSet(classes)}, 
          ValidComponentChildren.map(this.props.children, this.renderChildBar)
        )
      );
    }
  },

  renderChildBar: function (child) {
    return cloneWithProps(child, {
      isChild: true,
      key: child.props.key,
      ref: child.props.ref
    });
  },

  renderProgressBar: function () {
    var percentage = this.getPercentage(
        this.props.now,
        this.props.min,
        this.props.max
      );

    var label;

    if (typeof this.props.label === "string") {
      label = this.renderLabel(percentage);
    } else if (this.props.label) {
      label = this.props.label;
    }

    if (this.props.srOnly) {
      label = this.renderScreenReaderOnlyLabel(label);
    }

    return (
      React.DOM.div( {className:classSet(this.getBsClassSet()), role:"progressbar",
        style:{width: percentage + '%'},
        'aria-valuenow':this.props.now,
        'aria-valuemin':this.props.min,
        'aria-valuemax':this.props.max}, 
        label
      )
    );
  },

  renderLabel: function (percentage) {
    var InterpolateClass = this.props.interpolateClass || Interpolate;

    return (
      InterpolateClass(
        {now:this.props.now,
        min:this.props.min,
        max:this.props.max,
        percent:percentage,
        bsStyle:this.props.bsStyle}, 
        this.props.label
      )
    );
  },

  renderScreenReaderOnlyLabel: function (label) {
    return (
      React.DOM.span( {className:"sr-only"}, 
        label
      )
    );
  }
});

module.exports = ProgressBar;

},{"./BootstrapMixin":9,"./Interpolate":24,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57}],42:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var CustomPropTypes = require('./utils/CustomPropTypes');


var Row = React.createClass({displayName: 'Row',
  propTypes: {
    componentClass: CustomPropTypes.componentClass
  },

  getDefaultProps: function () {
    return {
      componentClass: React.DOM.div
    };
  },

  render: function () {
    var componentClass = this.props.componentClass;

    return this.transferPropsTo(
      componentClass( {className:"row"}, 
        this.props.children
      )
    );
  }
});

module.exports = Row;
},{"./utils/CustomPropTypes":52}],43:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');
var DropdownStateMixin = require('./DropdownStateMixin');
var Button = require('./Button');
var ButtonGroup = require('./ButtonGroup');
var DropdownMenu = require('./DropdownMenu');

var SplitButton = React.createClass({displayName: 'SplitButton',
  mixins: [BootstrapMixin, DropdownStateMixin],

  propTypes: {
    pullRight:     React.PropTypes.bool,
    title:         React.PropTypes.renderable,
    href:          React.PropTypes.string,
    dropdownTitle: React.PropTypes.renderable,
    onClick:       React.PropTypes.func,
    onSelect:      React.PropTypes.func,
    disabled:      React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      dropdownTitle: 'Toggle dropdown'
    };
  },

  render: function () {
    var groupClasses = {
        'open': this.state.open,
        'dropup': this.props.dropup
      };

    var button = this.transferPropsTo(
      Button(
        {ref:"button",
        onClick:this.handleButtonClick,
        title:null,
        id:null}, 
        this.props.title
      )
    );

    var dropdownButton = this.transferPropsTo(
      Button(
        {ref:"dropdownButton",
        className:"dropdown-toggle",
        onClick:this.handleDropdownClick,
        title:null,
        id:null}, 
        React.DOM.span( {className:"sr-only"}, this.props.dropdownTitle),
        React.DOM.span( {className:"caret"} )
      )
    );

    return (
      ButtonGroup(
        {bsSize:this.props.bsSize,
        className:classSet(groupClasses),
        id:this.props.id}, 
        button,
        dropdownButton,
        DropdownMenu(
          {ref:"menu",
          onSelect:this.handleOptionSelect,
          'aria-labelledby':this.props.id,
          pullRight:this.props.pullRight}, 
          this.props.children
        )
      )
    );
  },

  handleButtonClick: function (e) {
    if (this.state.open) {
      this.setDropdownState(false);
    }

    if (this.props.onClick) {
      this.props.onClick(e);
    }
  },

  handleDropdownClick: function (e) {
    e.preventDefault();

    this.setDropdownState(!this.state.open);
  },

  handleOptionSelect: function (key) {
    if (this.props.onSelect) {
      this.props.onSelect(key);
    }

    this.setDropdownState(false);
  }
});

module.exports = SplitButton;

},{"./BootstrapMixin":9,"./Button":10,"./ButtonGroup":11,"./DropdownMenu":18,"./DropdownStateMixin":19,"./utils/classSet":56}],44:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var createChainedFunction = require('./utils/createChainedFunction');
var BootstrapMixin = require('./BootstrapMixin');


var SubNav = React.createClass({displayName: 'SubNav',
  mixins: [BootstrapMixin],

  propTypes: {
    onSelect: React.PropTypes.func,
    active: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    href: React.PropTypes.string,
    title: React.PropTypes.string,
    text: React.PropTypes.renderable
  },

  getDefaultProps: function () {
    return {
      bsClass: 'nav'
    };
  },

  handleClick: function (e) {
    if (this.props.onSelect) {
      e.preventDefault();

      if (!this.props.disabled) {
        this.props.onSelect(this.props.key, this.props.href);
      }
    }
  },

  isActive: function () {
    return this.isChildActive(this);
  },

  isChildActive: function (child) {
    if (child.props.active) {
      return true;
    }

    if (this.props.activeKey != null && this.props.activeKey === child.props.key) {
      return true;
    }

    if (this.props.activeHref != null && this.props.activeHref === child.props.href) {
      return true;
    }

    if (child.props.children) {
      var isActive = false;

      ValidComponentChildren.forEach(
        child.props.children,
        function (child) {
          if (this.isChildActive(child)) {
            isActive = true;
          }
        },
        this
      );

      return isActive;
    }

    return false;
  },

  getChildActiveProp: function (child) {
    if (child.props.active) {
      return true;
    }
    if (this.props.activeKey != null) {
      if (child.props.key === this.props.activeKey) {
        return true;
      }
    }
    if (this.props.activeHref != null) {
      if (child.props.href === this.props.activeHref) {
        return true;
      }
    }

    return child.props.active;
  },

  render: function () {
    var classes = {
      'active': this.isActive(),
      'disabled': this.props.disabled
    };

    return this.transferPropsTo(
      React.DOM.li( {className:classSet(classes)}, 
        React.DOM.a(
          {href:this.props.href,
          title:this.props.title,
          onClick:this.handleClick,
          ref:"anchor"}, 
          this.props.text
        ),
        React.DOM.ul( {className:"nav"}, 
          ValidComponentChildren.map(this.props.children, this.renderNavItem)
        )
      )
    );
  },

  renderNavItem: function (child) {
    return cloneWithProps(
      child,
      {
        active: this.getChildActiveProp(child),
        onSelect: createChainedFunction(child.props.onSelect, this.props.onSelect),
        ref: child.props.ref,
        key: child.props.key
      }
    );
  }
});

module.exports = SubNav;

},{"./BootstrapMixin":9,"./utils/ValidComponentChildren":55,"./utils/classSet":56,"./utils/cloneWithProps":57,"./utils/createChainedFunction":58}],45:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var TransitionEvents = require('./utils/TransitionEvents');

var TabPane = React.createClass({displayName: 'TabPane',
  getDefaultProps: function () {
    return {
      animation: true
    };
  },

  getInitialState: function () {
    return {
      animateIn: false,
      animateOut: false
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (this.props.animation) {
      if (!this.state.animateIn && nextProps.active && !this.props.active) {
        this.setState({
          animateIn: true
        });
      } else if (!this.state.animateOut && !nextProps.active && this.props.active) {
        this.setState({
          animateOut: true
        });
      }
    }
  },

  componentDidUpdate: function () {
    if (this.state.animateIn) {
      setTimeout(this.startAnimateIn, 0);
    }
    if (this.state.animateOut) {
      TransitionEvents.addEndEventListener(
        this.getDOMNode(),
        this.stopAnimateOut
      );
    }
  },

  startAnimateIn: function () {
    if (this.isMounted()) {
      this.setState({
        animateIn: false
      });
    }
  },

  stopAnimateOut: function () {
    if (this.isMounted()) {
      this.setState({
        animateOut: false
      });

      if (typeof this.props.onAnimateOutEnd === 'function') {
        this.props.onAnimateOutEnd();
      }
    }
  },

  render: function () {
    var classes = {
      'tab-pane': true,
      'fade': true,
      'active': this.props.active || this.state.animateOut,
      'in': this.props.active && !this.state.animateIn
    };

    return this.transferPropsTo(
      React.DOM.div( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = TabPane;
},{"./utils/TransitionEvents":54,"./utils/classSet":56}],46:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var BootstrapMixin = require('./BootstrapMixin');
var cloneWithProps = require('./utils/cloneWithProps');
var ValidComponentChildren = require('./utils/ValidComponentChildren');
var Nav = require('./Nav');
var NavItem = require('./NavItem');

function getDefaultActiveKeyFromChildren(children) {
  var defaultActiveKey;

  ValidComponentChildren.forEach(children, function(child) {
    if (defaultActiveKey == null) {
      defaultActiveKey = child.props.key;
    }
  });

  return defaultActiveKey;
}

var TabbedArea = React.createClass({displayName: 'TabbedArea',
  mixins: [BootstrapMixin],

  propTypes: {
    bsStyle: React.PropTypes.oneOf(['tabs','pills']),
    animation: React.PropTypes.bool,
    onSelect: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      bsStyle: "tabs",
      animation: true
    };
  },

  getInitialState: function () {
    var defaultActiveKey = this.props.defaultActiveKey != null ?
      this.props.defaultActiveKey : getDefaultActiveKeyFromChildren(this.props.children);

    // TODO: In __DEV__ mode warn via `console.warn` if no `defaultActiveKey` has
    // been set by this point, invalid children or missing key properties are likely the cause.

    return {
      activeKey: defaultActiveKey,
      previousActiveKey: null
    };
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.activeKey != null && nextProps.activeKey !== this.props.activeKey) {
      this.setState({
        previousActiveKey: this.props.activeKey
      });
    }
  },

  handlePaneAnimateOutEnd: function () {
    this.setState({
      previousActiveKey: null
    });
  },

  render: function () {
    var activeKey =
      this.props.activeKey != null ? this.props.activeKey : this.state.activeKey;

    function renderTabIfSet(child) {
      return child.props.tab != null ? this.renderTab(child) : null;
    }

    var nav = this.transferPropsTo(
      Nav( {activeKey:activeKey, onSelect:this.handleSelect, ref:"tabs"}, 
        ValidComponentChildren.map(this.props.children, renderTabIfSet, this)
      )
    );

    return (
      React.DOM.div(null, 
        nav,
        React.DOM.div( {id:this.props.id, className:"tab-content", ref:"panes"}, 
          ValidComponentChildren.map(this.props.children, this.renderPane)
        )
      )
    );
  },

  getActiveKey: function () {
    return this.props.activeKey != null ? this.props.activeKey : this.state.activeKey;
  },

  renderPane: function (child) {
    var activeKey = this.getActiveKey();

    return cloneWithProps(
        child,
        {
          active: (child.props.key === activeKey &&
            (this.state.previousActiveKey == null || !this.props.animation)),
          ref: child.props.ref,
          key: child.props.key,
          animation: this.props.animation,
          onAnimateOutEnd: (this.state.previousActiveKey != null &&
            child.props.key === this.state.previousActiveKey) ? this.handlePaneAnimateOutEnd: null
        }
      );
  },

  renderTab: function (child) {
    var key = child.props.key;
    return (
      NavItem(
        {ref:'tab' + key,
        key:key}, 
        child.props.tab
      )
    );
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onSelect` handler.
    return !this._isChanging;
  },

  handleSelect: function (key) {
    if (this.props.onSelect) {
      this._isChanging = true;
      this.props.onSelect(key);
      this._isChanging = false;
    } else if (key !== this.getActiveKey()) {
      this.setState({
        activeKey: key,
        previousActiveKey: this.getActiveKey()
      });
    }
  }
});

module.exports = TabbedArea;
},{"./BootstrapMixin":9,"./Nav":30,"./NavItem":31,"./utils/ValidComponentChildren":55,"./utils/cloneWithProps":57}],47:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');

var Table = React.createClass({displayName: 'Table',
  propTypes: {
    striped: React.PropTypes.bool,
    bordered: React.PropTypes.bool,
    condensed: React.PropTypes.bool,
    hover: React.PropTypes.bool,
    responsive: React.PropTypes.bool
  },

  render: function () {
    var classes = {
      'table': true,
      'table-striped': this.props.striped,
      'table-bordered': this.props.bordered,
      'table-condensed': this.props.condensed,
      'table-hover': this.props.hover
    };
    var table = this.transferPropsTo(
      React.DOM.table( {className:classSet(classes)}, 
        this.props.children
      )
    );

    return this.props.responsive ? (
      React.DOM.div( {className:"table-responsive"}, 
        table
      )
    ) : table;
  }
});

module.exports = Table;
},{"./utils/classSet":56}],48:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');


var Tooltip = React.createClass({displayName: 'Tooltip',
  mixins: [BootstrapMixin],

  propTypes: {
    placement: React.PropTypes.oneOf(['top','right', 'bottom', 'left']),
    positionLeft: React.PropTypes.number,
    positionTop: React.PropTypes.number,
    arrowOffsetLeft: React.PropTypes.number,
    arrowOffsetTop: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      placement: 'right'
    };
  },

  render: function () {
    var classes = {};
    classes['tooltip'] = true;
    classes[this.props.placement] = true;
    classes['in'] = this.props.positionLeft != null || this.props.positionTop != null;

    var style = {};
    style['left'] = this.props.positionLeft;
    style['top'] = this.props.positionTop;

    var arrowStyle = {};
    arrowStyle['left'] = this.props.arrowOffsetLeft;
    arrowStyle['top'] = this.props.arrowOffsetTop;

    return (
        React.DOM.div( {className:classSet(classes), style:style}, 
          React.DOM.div( {className:"tooltip-arrow", style:arrowStyle} ),
          React.DOM.div( {className:"tooltip-inner"}, 
            this.props.children
          )
        )
      );
  }
});

module.exports = Tooltip;
},{"./BootstrapMixin":9,"./utils/classSet":56}],49:[function(require,module,exports){
/** @jsx React.DOM */

var React = (window.React || React);
var classSet = require('./utils/classSet');
var BootstrapMixin = require('./BootstrapMixin');

var Well = React.createClass({displayName: 'Well',
  mixins: [BootstrapMixin],

  getDefaultProps: function () {
    return {
      bsClass: 'well'
    };
  },

  render: function () {
    var classes = this.getBsClassSet();

    return this.transferPropsTo(
      React.DOM.div( {className:classSet(classes)}, 
        this.props.children
      )
    );
  }
});

module.exports = Well;
},{"./BootstrapMixin":9,"./utils/classSet":56}],50:[function(require,module,exports){
module.exports = {
  CLASSES: {
    'alert': 'alert',
    'button': 'btn',
    'button-group': 'btn-group',
    'button-toolbar': 'btn-toolbar',
    'column': 'col',
    'input-group': 'input-group',
    'form': 'form',
    'glyphicon': 'glyphicon',
    'label': 'label',
    'panel': 'panel',
    'panel-group': 'panel-group',
    'progress-bar': 'progress-bar',
    'nav': 'nav',
    'navbar': 'navbar',
    'modal': 'modal',
    'row': 'row',
    'well': 'well'
  },
  STYLES: {
    'default': 'default',
    'primary': 'primary',
    'success': 'success',
    'info': 'info',
    'warning': 'warning',
    'danger': 'danger',
    'link': 'link',
    'inline': 'inline',
    'tabs': 'tabs',
    'pills': 'pills'
  },
  SIZES: {
    'large': 'lg',
    'medium': 'md',
    'small': 'sm',
    'xsmall': 'xs'
  },
  GLYPHS: [
    'asterisk',
    'plus',
    'euro',
    'minus',
    'cloud',
    'envelope',
    'pencil',
    'glass',
    'music',
    'search',
    'heart',
    'star',
    'star-empty',
    'user',
    'film',
    'th-large',
    'th',
    'th-list',
    'ok',
    'remove',
    'zoom-in',
    'zoom-out',
    'off',
    'signal',
    'cog',
    'trash',
    'home',
    'file',
    'time',
    'road',
    'download-alt',
    'download',
    'upload',
    'inbox',
    'play-circle',
    'repeat',
    'refresh',
    'list-alt',
    'lock',
    'flag',
    'headphones',
    'volume-off',
    'volume-down',
    'volume-up',
    'qrcode',
    'barcode',
    'tag',
    'tags',
    'book',
    'bookmark',
    'print',
    'camera',
    'font',
    'bold',
    'italic',
    'text-height',
    'text-width',
    'align-left',
    'align-center',
    'align-right',
    'align-justify',
    'list',
    'indent-left',
    'indent-right',
    'facetime-video',
    'picture',
    'map-marker',
    'adjust',
    'tint',
    'edit',
    'share',
    'check',
    'move',
    'step-backward',
    'fast-backward',
    'backward',
    'play',
    'pause',
    'stop',
    'forward',
    'fast-forward',
    'step-forward',
    'eject',
    'chevron-left',
    'chevron-right',
    'plus-sign',
    'minus-sign',
    'remove-sign',
    'ok-sign',
    'question-sign',
    'info-sign',
    'screenshot',
    'remove-circle',
    'ok-circle',
    'ban-circle',
    'arrow-left',
    'arrow-right',
    'arrow-up',
    'arrow-down',
    'share-alt',
    'resize-full',
    'resize-small',
    'exclamation-sign',
    'gift',
    'leaf',
    'fire',
    'eye-open',
    'eye-close',
    'warning-sign',
    'plane',
    'calendar',
    'random',
    'comment',
    'magnet',
    'chevron-up',
    'chevron-down',
    'retweet',
    'shopping-cart',
    'folder-close',
    'folder-open',
    'resize-vertical',
    'resize-horizontal',
    'hdd',
    'bullhorn',
    'bell',
    'certificate',
    'thumbs-up',
    'thumbs-down',
    'hand-right',
    'hand-left',
    'hand-up',
    'hand-down',
    'circle-arrow-right',
    'circle-arrow-left',
    'circle-arrow-up',
    'circle-arrow-down',
    'globe',
    'wrench',
    'tasks',
    'filter',
    'briefcase',
    'fullscreen',
    'dashboard',
    'paperclip',
    'heart-empty',
    'link',
    'phone',
    'pushpin',
    'usd',
    'gbp',
    'sort',
    'sort-by-alphabet',
    'sort-by-alphabet-alt',
    'sort-by-order',
    'sort-by-order-alt',
    'sort-by-attributes',
    'sort-by-attributes-alt',
    'unchecked',
    'expand',
    'collapse-down',
    'collapse-up',
    'log-in',
    'flash',
    'log-out',
    'new-window',
    'record',
    'save',
    'open',
    'saved',
    'import',
    'export',
    'send',
    'floppy-disk',
    'floppy-saved',
    'floppy-remove',
    'floppy-save',
    'floppy-open',
    'credit-card',
    'transfer',
    'cutlery',
    'header',
    'compressed',
    'earphone',
    'phone-alt',
    'tower',
    'stats',
    'sd-video',
    'hd-video',
    'subtitles',
    'sound-stereo',
    'sound-dolby',
    'sound-5-1',
    'sound-6-1',
    'sound-7-1',
    'copyright-mark',
    'registration-mark',
    'cloud-download',
    'cloud-upload',
    'tree-conifer',
    'tree-deciduous'
  ]
};

},{}],51:[function(require,module,exports){
module.exports = {
  Accordion: require('./Accordion'),
  Affix: require('./Affix'),
  AffixMixin: require('./AffixMixin'),
  Alert: require('./Alert'),
  BootstrapMixin: require('./BootstrapMixin'),
  Badge: require('./Badge'),
  Button: require('./Button'),
  ButtonGroup: require('./ButtonGroup'),
  ButtonToolbar: require('./ButtonToolbar'),
  Carousel: require('./Carousel'),
  CarouselItem: require('./CarouselItem'),
  Col: require('./Col'),
  CollapsableMixin: require('./CollapsableMixin'),
  DropdownButton: require('./DropdownButton'),
  DropdownMenu: require('./DropdownMenu'),
  DropdownStateMixin: require('./DropdownStateMixin'),
  FadeMixin: require('./FadeMixin'),
  Glyphicon: require('./Glyphicon'),
  Grid: require('./Grid'),
  Input: require('./Input'),
  Interpolate: require('./Interpolate'),
  Jumbotron: require('./Jumbotron'),
  Label: require('./Label'),
  MenuItem: require('./MenuItem'),
  Modal: require('./Modal'),
  Nav: require('./Nav'),
  Navbar: require('./Navbar'),
  NavItem: require('./NavItem'),
  ModalTrigger: require('./ModalTrigger'),
  OverlayTrigger: require('./OverlayTrigger'),
  OverlayMixin: require('./OverlayMixin'),
  PageHeader: require('./PageHeader'),
  Panel: require('./Panel'),
  PanelGroup: require('./PanelGroup'),
  PageItem: require('./PageItem'),
  Pager: require('./Pager'),
  Popover: require('./Popover'),
  ProgressBar: require('./ProgressBar'),
  Row: require('./Row'),
  SplitButton: require('./SplitButton'),
  SubNav: require('./SubNav'),
  TabbedArea: require('./TabbedArea'),
  Table: require('./Table'),
  TabPane: require('./TabPane'),
  Tooltip: require('./Tooltip'),
  Well: require('./Well')
};
},{"./Accordion":4,"./Affix":5,"./AffixMixin":6,"./Alert":7,"./Badge":8,"./BootstrapMixin":9,"./Button":10,"./ButtonGroup":11,"./ButtonToolbar":12,"./Carousel":13,"./CarouselItem":14,"./Col":15,"./CollapsableMixin":16,"./DropdownButton":17,"./DropdownMenu":18,"./DropdownStateMixin":19,"./FadeMixin":20,"./Glyphicon":21,"./Grid":22,"./Input":23,"./Interpolate":24,"./Jumbotron":25,"./Label":26,"./MenuItem":27,"./Modal":28,"./ModalTrigger":29,"./Nav":30,"./NavItem":31,"./Navbar":32,"./OverlayMixin":33,"./OverlayTrigger":34,"./PageHeader":35,"./PageItem":36,"./Pager":37,"./Panel":38,"./PanelGroup":39,"./Popover":40,"./ProgressBar":41,"./Row":42,"./SplitButton":43,"./SubNav":44,"./TabPane":45,"./TabbedArea":46,"./Table":47,"./Tooltip":48,"./Well":49}],52:[function(require,module,exports){
var React = (window.React || React);

var CustomPropTypes = {
  /**
   * Checks whether a prop is a valid React class
   *
   * @param props
   * @param propName
   * @param componentName
   * @returns {Error|undefined}
   */
  componentClass: function (props, propName, componentName) {
    if (!React.isValidClass(props[propName])) {
      return new Error('Invalid `' + propName + '` prop in `' + componentName + '`, expected be ' +
        'a valid React class');
    }
  },

  /**
   * Checks whether a prop provides a DOM element
   *
   * The element can be provided in two forms:
   * - Directly passed
   * - Or passed an object which has a `getDOMNode` method which will return the required DOM element
   *
   * @param props
   * @param propName
   * @param componentName
   * @returns {Error|undefined}
   */
  mountable: function (props, propName, componentName) {
    if (typeof props[propName] !== 'object' ||
      typeof props[propName].getDOMNode !== 'function' && props[propName].nodeType !== 1) {
      return new Error('Invalid `' + propName + '` prop in `' + componentName + '`, expected be ' +
        'a DOM element or an object that has a `getDOMNode` method');
    }
  }
};

module.exports = CustomPropTypes;
},{}],53:[function(require,module,exports){
/**
 * React EventListener.listen
 *
 * Copyright 2013-2014 Facebook, Inc.
 * @licence https://github.com/facebook/react/blob/0.11-stable/LICENSE
 *
 * This file contains a modified version of:
 *  https://github.com/facebook/react/blob/0.11-stable/src/vendor/stubs/EventListener.js
 *
 * TODO: remove in favour of solution provided by:
 *  https://github.com/facebook/react/issues/285
 */

/**
 * Does not take into account specific nature of platform.
 */
var EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param {DOMEventTarget} target DOM element to register listener on.
   * @param {string} eventType Event type, e.g. 'click' or 'mouseover'.
   * @param {function} callback Callback function.
   * @return {object} Object with a `remove` method.
   */
  listen: function(target, eventType, callback) {
    if (target.addEventListener) {
      target.addEventListener(eventType, callback, false);
      return {
        remove: function() {
          target.removeEventListener(eventType, callback, false);
        }
      };
    } else if (target.attachEvent) {
      target.attachEvent('on' + eventType, callback);
      return {
        remove: function() {
          target.detachEvent('on' + eventType, callback);
        }
      };
    }
  }
};

module.exports = EventListener;

},{}],54:[function(require,module,exports){
/**
 * React TransitionEvents
 *
 * Copyright 2013-2014 Facebook, Inc.
 * @licence https://github.com/facebook/react/blob/0.11-stable/LICENSE
 *
 * This file contains a modified version of:
 *  https://github.com/facebook/react/blob/0.11-stable/src/addons/transitions/ReactTransitionEvents.js
 *
 */

var canUseDOM = !!(
  typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  );

/**
 * EVENT_NAME_MAP is used to determine which event fired when a
 * transition/animation ends, based on the style property used to
 * define that event.
 */
var EVENT_NAME_MAP = {
  transitionend: {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'mozTransitionEnd',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd'
  },

  animationend: {
    'animation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd',
    'MozAnimation': 'mozAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd'
  }
};

var endEvents = [];

function detectEvents() {
  var testEl = document.createElement('div');
  var style = testEl.style;

  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are useable, and if not remove them
  // from the map
  if (!('AnimationEvent' in window)) {
    delete EVENT_NAME_MAP.animationend.animation;
  }

  if (!('TransitionEvent' in window)) {
    delete EVENT_NAME_MAP.transitionend.transition;
  }

  for (var baseEventName in EVENT_NAME_MAP) {
    var baseEvents = EVENT_NAME_MAP[baseEventName];
    for (var styleName in baseEvents) {
      if (styleName in style) {
        endEvents.push(baseEvents[styleName]);
        break;
      }
    }
  }
}

if (canUseDOM) {
  detectEvents();
}

// We use the raw {add|remove}EventListener() call because EventListener
// does not know how to remove event listeners and we really should
// clean up. Also, these events are not triggered in older browsers
// so we should be A-OK here.

function addEventListener(node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false);
}

var ReactTransitionEvents = {
  addEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      // If CSS transitions are not supported, trigger an "end animation"
      // event immediately.
      window.setTimeout(eventListener, 0);
      return;
    }
    endEvents.forEach(function(endEvent) {
      addEventListener(node, endEvent, eventListener);
    });
  },

  removeEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      return;
    }
    endEvents.forEach(function(endEvent) {
      removeEventListener(node, endEvent, eventListener);
    });
  }
};

module.exports = ReactTransitionEvents;

},{}],55:[function(require,module,exports){
var React = (window.React || React);

/**
 * Maps children that are typically specified as `props.children`,
 * but only iterates over children that are "valid components".
 *
 * The mapFunction provided index will be normalised to the components mapped,
 * so an invalid component would not increase the index.
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} mapFunction.
 * @param {*} mapContext Context for mapFunction.
 * @return {object} Object containing the ordered map of results.
 */
function mapValidComponents(children, func, context) {
  var index = 0;

  return React.Children.map(children, function (child) {
    if (React.isValidComponent(child)) {
      var lastIndex = index;
      index++;
      return func.call(context, child, lastIndex);
    }

    return child;
  });
}

/**
 * Iterates through children that are typically specified as `props.children`,
 * but only iterates over children that are "valid components".
 *
 * The provided forEachFunc(child, index) will be called for each
 * leaf child with the index reflecting the position relative to "valid components".
 *
 * @param {?*} children Children tree container.
 * @param {function(*, int)} forEachFunc.
 * @param {*} forEachContext Context for forEachContext.
 */
function forEachValidComponents(children, func, context) {
  var index = 0;

  return React.Children.forEach(children, function (child) {
    if (React.isValidComponent(child)) {
      func.call(context, child, index);
      index++;
    }
  });
}

/**
 * Count the number of "valid components" in the Children container.
 *
 * @param {?*} children Children tree container.
 * @returns {number}
 */
function numberOfValidComponents(children) {
  var count = 0;

  React.Children.forEach(children, function (child) {
    if (React.isValidComponent(child)) { count++; }
  });

  return count;
}

/**
 * Determine if the Child container has one or more "valid components".
 *
 * @param {?*} children Children tree container.
 * @returns {boolean}
 */
function hasValidComponent(children) {
  var hasValid = false;

  React.Children.forEach(children, function (child) {
    if (!hasValid && React.isValidComponent(child)) {
      hasValid = true;
    }
  });

  return hasValid;
}

module.exports = {
  map: mapValidComponents,
  forEach: forEachValidComponents,
  numberOf: numberOfValidComponents,
  hasValidComponent: hasValidComponent
};
},{}],56:[function(require,module,exports){
/**
 * React classSet
 *
 * Copyright 2013-2014 Facebook, Inc.
 * @licence https://github.com/facebook/react/blob/0.11-stable/LICENSE
 *
 * This file is unmodified from:
 *  https://github.com/facebook/react/blob/0.11-stable/src/vendor/stubs/cx.js
 *
 */

/**
 * This function is used to mark string literals representing CSS class names
 * so that they can be transformed statically. This allows for modularization
 * and minification of CSS class names.
 *
 * In static_upstream, this function is actually implemented, but it should
 * eventually be replaced with something more descriptive, and the transform
 * that is used in the main stack should be ported for use elsewhere.
 *
 * @param string|object className to modularize, or an object of key/values.
 *                      In the object case, the values are conditions that
 *                      determine if the className keys should be included.
 * @param [string ...]  Variable list of classNames in the string case.
 * @return string       Renderable space-separated CSS className.
 */
function cx(classNames) {
  if (typeof classNames == 'object') {
    return Object.keys(classNames).filter(function(className) {
      return classNames[className];
    }).join(' ');
  } else {
    return Array.prototype.join.call(arguments, ' ');
  }
}

module.exports = cx;
},{}],57:[function(require,module,exports){
/**
 * React cloneWithProps
 *
 * Copyright 2013-2014 Facebook, Inc.
 * @licence https://github.com/facebook/react/blob/0.11-stable/LICENSE
 *
 * This file contains modified versions of:
 *  https://github.com/facebook/react/blob/0.11-stable/src/utils/cloneWithProps.js
 *  https://github.com/facebook/react/blob/0.11-stable/src/core/ReactPropTransferer.js
 *  https://github.com/facebook/react/blob/0.11-stable/src/utils/joinClasses.js
 *
 * TODO: This should be replaced as soon as cloneWithProps is available via
 *  the core React package or a separate package.
 *  @see https://github.com/facebook/react/issues/1906
 *
 */

var React = (window.React || React);
var merge = require('./merge');

/**
 * Combines multiple className strings into one.
 * http://jsperf.com/joinclasses-args-vs-array
 *
 * @param {...?string} classes
 * @return {string}
 */
function joinClasses(className/*, ... */) {
  if (!className) {
    className = '';
  }
  var nextClass;
  var argLength = arguments.length;
  if (argLength > 1) {
    for (var ii = 1; ii < argLength; ii++) {
      nextClass = arguments[ii];
      nextClass && (className += ' ' + nextClass);
    }
  }
  return className;
}

/**
 * Creates a transfer strategy that will merge prop values using the supplied
 * `mergeStrategy`. If a prop was previously unset, this just sets it.
 *
 * @param {function} mergeStrategy
 * @return {function}
 */
function createTransferStrategy(mergeStrategy) {
  return function(props, key, value) {
    if (!props.hasOwnProperty(key)) {
      props[key] = value;
    } else {
      props[key] = mergeStrategy(props[key], value);
    }
  };
}

var transferStrategyMerge = createTransferStrategy(function(a, b) {
  // `merge` overrides the first object's (`props[key]` above) keys using the
  // second object's (`value`) keys. An object's style's existing `propA` would
  // get overridden. Flip the order here.
  return merge(b, a);
});

function emptyFunction() {}

/**
 * Transfer strategies dictate how props are transferred by `transferPropsTo`.
 * NOTE: if you add any more exceptions to this list you should be sure to
 * update `cloneWithProps()` accordingly.
 */
var TransferStrategies = {
  /**
   * Never transfer `children`.
   */
  children: emptyFunction,
  /**
   * Transfer the `className` prop by merging them.
   */
  className: createTransferStrategy(joinClasses),
  /**
   * Never transfer the `key` prop.
   */
  key: emptyFunction,
  /**
   * Never transfer the `ref` prop.
   */
  ref: emptyFunction,
  /**
   * Transfer the `style` prop (which is an object) by merging them.
   */
  style: transferStrategyMerge
};

/**
 * Mutates the first argument by transferring the properties from the second
 * argument.
 *
 * @param {object} props
 * @param {object} newProps
 * @return {object}
 */
function transferInto(props, newProps) {
  for (var thisKey in newProps) {
    if (!newProps.hasOwnProperty(thisKey)) {
      continue;
    }

    var transferStrategy = TransferStrategies[thisKey];

    if (transferStrategy && TransferStrategies.hasOwnProperty(thisKey)) {
      transferStrategy(props, thisKey, newProps[thisKey]);
    } else if (!props.hasOwnProperty(thisKey)) {
      props[thisKey] = newProps[thisKey];
    }
  }
  return props;
}

/**
 * Merge two props objects using TransferStrategies.
 *
 * @param {object} oldProps original props (they take precedence)
 * @param {object} newProps new props to merge in
 * @return {object} a new object containing both sets of props merged.
 */
function mergeProps(oldProps, newProps) {
  return transferInto(merge(oldProps), newProps);
}

var ReactPropTransferer = {
  mergeProps: mergeProps
};

var CHILDREN_PROP = 'children';

/**
 * Sometimes you want to change the props of a child passed to you. Usually
 * this is to add a CSS class.
 *
 * @param {object} child child component you'd like to clone
 * @param {object} props props you'd like to modify. They will be merged
 * as if you used `transferPropsTo()`.
 * @return {object} a clone of child with props merged in.
 */
function cloneWithProps(child, props) {
  var newProps = ReactPropTransferer.mergeProps(props, child.props);

  // Use `child.props.children` if it is provided.
  if (!newProps.hasOwnProperty(CHILDREN_PROP) &&
    child.props.hasOwnProperty(CHILDREN_PROP)) {
    newProps.children = child.props.children;
  }

  // Huge hack to support both the 0.10 API and the new way of doing things
  // TODO: remove when support for 0.10 is no longer needed
  if (React.version.indexOf('0.10.') === 0) {
    return child.constructor.ConvenienceConstructor(newProps);
  }


  // The current API doesn't retain _owner and _context, which is why this
  // doesn't use ReactDescriptor.cloneAndReplaceProps.
  return child.constructor(newProps);
}

module.exports = cloneWithProps;
},{"./merge":60}],58:[function(require,module,exports){
/**
 * Safe chained function
 *
 * Will only create a new function if needed,
 * otherwise will pass back existing functions or null.
 *
 * @param {function} one
 * @param {function} two
 * @returns {function|null}
 */
function createChainedFunction(one, two) {
  var hasOne = typeof one === 'function';
  var hasTwo = typeof two === 'function';

  if (!hasOne && !hasTwo) { return null; }
  if (!hasOne) { return two; }
  if (!hasTwo) { return one; }

  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

module.exports = createChainedFunction;
},{}],59:[function(require,module,exports){

/**
 * Shortcut to compute element style
 *
 * @param {HTMLElement} elem
 * @returns {CssStyle}
 */
function getComputedStyles(elem) {
  return elem.ownerDocument.defaultView.getComputedStyle(elem, null);
}

/**
 * Get elements offset
 *
 * TODO: REMOVE JQUERY!
 *
 * @param {HTMLElement} DOMNode
 * @returns {{top: number, left: number}}
 */
function getOffset(DOMNode) {
  if (window.jQuery) {
    return window.jQuery(DOMNode).offset();
  }

  var docElem = document.documentElement;
  var box = { top: 0, left: 0 };

  // If we don't have gBCR, just use 0,0 rather than error
  // BlackBerry 5, iOS 3 (original iPhone)
  if ( typeof DOMNode.getBoundingClientRect !== 'undefined' ) {
    box = DOMNode.getBoundingClientRect();
  }

  return {
    top: box.top + window.pageYOffset - docElem.clientTop,
    left: box.left + window.pageXOffset - docElem.clientLeft
  };
}

/**
 * Get elements position
 *
 * TODO: REMOVE JQUERY!
 *
 * @param {HTMLElement} elem
 * @param {HTMLElement?} offsetParent
 * @returns {{top: number, left: number}}
 */
function getPosition(elem, offsetParent) {
  if (window.jQuery) {
    return window.jQuery(elem).position();
  }

  var offset,
      parentOffset = {top: 0, left: 0};

  // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
  if (getComputedStyles(elem).position === 'fixed' ) {
    // We assume that getBoundingClientRect is available when computed position is fixed
    offset = elem.getBoundingClientRect();

  } else {
    if (!offsetParent) {
      // Get *real* offsetParent
      offsetParent = offsetParent(elem);
    }

    // Get correct offsets
    offset = getOffset(elem);
    if ( offsetParent.nodeName !== 'HTML') {
      parentOffset = getOffset(offsetParent);
    }

    // Add offsetParent borders
    parentOffset.top += parseInt(getComputedStyles(offsetParent).borderTopWidth, 10);
    parentOffset.left += parseInt(getComputedStyles(offsetParent).borderLeftWidth, 10);
  }

  // Subtract parent offsets and element margins
  return {
    top: offset.top - parentOffset.top - parseInt(getComputedStyles(elem).marginTop, 10),
    left: offset.left - parentOffset.left - parseInt(getComputedStyles(elem).marginLeft, 10)
  };
}

/**
 * Get parent element
 *
 * @param {HTMLElement?} elem
 * @returns {HTMLElement}
 */
function offsetParent(elem) {
  var docElem = document.documentElement;
  var offsetParent = elem.offsetParent || docElem;

  while ( offsetParent && ( offsetParent.nodeName !== 'HTML' &&
    getComputedStyles(offsetParent).position === 'static' ) ) {
    offsetParent = offsetParent.offsetParent;
  }

  return offsetParent || docElem;
}

module.exports = {
  getComputedStyles: getComputedStyles,
  getOffset: getOffset,
  getPosition: getPosition,
  offsetParent: offsetParent
};
},{}],60:[function(require,module,exports){
/**
 * Merge helper
 *
 * TODO: to be replaced with ES6's `Object.assign()` for React 0.12
 */

/**
 * Shallow merges two structures by mutating the first parameter.
 *
 * @param {object} one Object to be merged into.
 * @param {?object} two Optional object with properties to merge from.
 */
function mergeInto(one, two) {
  if (two != null) {
    for (var key in two) {
      if (!two.hasOwnProperty(key)) {
        continue;
      }
      one[key] = two[key];
    }
  }
}

/**
 * Shallow merges two structures into a return value, without mutating either.
 *
 * @param {?object} one Optional object with properties to merge from.
 * @param {?object} two Optional object with properties to merge from.
 * @return {object} The shallow extension of one by two.
 */
function merge(one, two) {
  var result = {};
  mergeInto(result, one);
  mergeInto(result, two);
  return result;
}

module.exports = merge;
},{}],"app":[function(require,module,exports){
var $, Button, Input, React, ReactBootstrap, debug, div, form, input, option, _ref;

debug = require("debug")("sqladmin:react:login");

React = (window.React || React);

ReactBootstrap = require("react-bootstrap");

$ = (window.$ || jQuery);

_ref = React.DOM, div = _ref.div, form = _ref.form, input = _ref.input, option = _ref.option;

Input = ReactBootstrap.Input, Button = ReactBootstrap.Button;

module.exports = React.createClass({
  getInitialState: function() {
    return {
      isLoading: false
    };
  },
  onLoginClick: function() {
    var options;
    this.setState({
      isLoading: true
    });
    options = {
      url: "/login",
      dataType: "json",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        "_csrf": this.props._csrf,
        "username": this.refs.txtUsername.getValue(),
        "password": this.refs.txtPassword.getValue(),
        "host": this.refs.txtHost.getValue(),
        "port": this.refs.txtPort.getValue(),
        "databasetype": this.refs.ddlDatabaseType.getValue()
      }),
      context: this
    };
    return $.ajax(options).done(function() {
      debug("response", arguments);
      this.setState({
        isLoading: false
      });
      return window.location = "/";
    });
  },
  render: function() {
    var isLoading, loginButtonOptions, loginButtonText;
    isLoading = this.state.isLoading;
    loginButtonOptions = {
      bsStyle: "primary",
      onClick: isLoading ? null : this.onLoginClick,
      disabled: isLoading
    };
    loginButtonText = isLoading ? "Please Wait" : "Login";
    return div({
      className: "container"
    }, form({
      className: "form-horizontal"
    }, Input({
      type: "text",
      label: "Username",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      ref: "txtUsername"
    }), Input({
      type: "password",
      label: "Password",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      ref: "txtPassword"
    }), Input({
      type: "text",
      label: "Host",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      defaultValue: "127.0.0.1",
      ref: "txtHost"
    }), Input({
      type: "text",
      label: "Port",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      defaultValue: "5432",
      ref: "txtPort"
    }), Input({
      type: "select",
      label: "Database Type",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      defaultValue: "pg",
      ref: "ddlDatabaseType"
    }, option({
      value: "pg"
    }, "Postgresql"), option({
      value: "mysql"
    }, "MySql"), option({
      value: "mariasql"
    }, "MariaSql")), Button(loginButtonOptions, loginButtonText)));
  }
});



},{"debug":1,"react-bootstrap":51}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxHaXRodWJcXHNxbGFkbWluXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL2RlYnVnL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FjY29yZGlvbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FmZml4LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWZmaXhNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FsZXJ0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQmFkZ2UuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Cb290c3RyYXBNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbkdyb3VwLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uVG9vbGJhci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Nhcm91c2VsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ2Fyb3VzZWxJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sbGFwc2FibGVNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Ryb3Bkb3duQnV0dG9uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25NZW51LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25TdGF0ZU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRmFkZU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR2x5cGhpY29uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR3JpZC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0lucHV0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvSW50ZXJwb2xhdGUuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9KdW1ib3Ryb24uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9MYWJlbC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL01lbnVJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTW9kYWwuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Nb2RhbFRyaWdnZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXYuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTmF2YmFyLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheVRyaWdnZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlSGVhZGVyLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFnZUl0ZW0uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhbmVsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFuZWxHcm91cC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BvcG92ZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Qcm9ncmVzc0Jhci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Jvdy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1NwbGl0QnV0dG9uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvU3ViTmF2LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvVGFiUGFuZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmJlZEFyZWEuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9UYWJsZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Rvb2x0aXAuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9XZWxsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvY29uc3RhbnRzLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvbWFpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0N1c3RvbVByb3BUeXBlcy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0V2ZW50TGlzdGVuZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9UcmFuc2l0aW9uRXZlbnRzLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2NsYXNzU2V0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvY2xvbmVXaXRoUHJvcHMuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9kb21VdGlscy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL21lcmdlLmpzIiwiRDpcXEdpdGh1Ylxcc3FsYWRtaW5cXGNsaWVudFxccmVhY3RcXGxvZ2luLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0EsSUFBQSw4RUFBQTs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBQSxDQUFpQixzQkFBakIsQ0FBUixDQUFBOztBQUFBLEtBRUEsR0FBUSxPQUFBLENBQVEsT0FBUixDQUZSLENBQUE7O0FBQUEsY0FHQSxHQUFpQixPQUFBLENBQVEsaUJBQVIsQ0FIakIsQ0FBQTs7QUFBQSxDQUtBLEdBQUksT0FBQSxDQUFRLFFBQVIsQ0FMSixDQUFBOztBQUFBLE9BTzZCLEtBQUssQ0FBQyxHQUFuQyxFQUFDLFdBQUEsR0FBRCxFQUFNLFlBQUEsSUFBTixFQUFZLGFBQUEsS0FBWixFQUFtQixjQUFBLE1BUG5CLENBQUE7O0FBQUEsdUJBUUMsS0FBRCxFQUFRLHdCQUFBLE1BUlIsQ0FBQTs7QUFBQSxNQVNNLENBQUMsT0FBUCxHQUFpQixLQUFLLENBQUMsV0FBTixDQUFrQjtBQUFBLEVBQ2pDLGVBQUEsRUFBaUIsU0FBQSxHQUFBO1dBQ2Y7QUFBQSxNQUNFLFNBQUEsRUFBVyxLQURiO01BRGU7RUFBQSxDQURnQjtBQUFBLEVBTWpDLFlBQUEsRUFBYyxTQUFBLEdBQUE7QUFDWixRQUFBLE9BQUE7QUFBQSxJQUFBLElBQUMsQ0FBQSxRQUFELENBQVU7QUFBQSxNQUFFLFNBQUEsRUFBVyxJQUFiO0tBQVYsQ0FBQSxDQUFBO0FBQUEsSUFDQSxPQUFBLEdBQVU7QUFBQSxNQUNSLEdBQUEsRUFBSyxRQURHO0FBQUEsTUFFUixRQUFBLEVBQVUsTUFGRjtBQUFBLE1BR1IsSUFBQSxFQUFNLE1BSEU7QUFBQSxNQUlSLFdBQUEsRUFBYSxrQkFKTDtBQUFBLE1BS1IsSUFBQSxFQUFNLElBQUksQ0FBQyxTQUFMLENBQWU7QUFBQSxRQUNuQixPQUFBLEVBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQURHO0FBQUEsUUFFbkIsVUFBQSxFQUFZLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQWxCLENBQUEsQ0FGTztBQUFBLFFBR25CLFVBQUEsRUFBWSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFsQixDQUFBLENBSE87QUFBQSxRQUluQixNQUFBLEVBQVEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBZCxDQUFBLENBSlc7QUFBQSxRQUtuQixNQUFBLEVBQVEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBZCxDQUFBLENBTFc7QUFBQSxRQU1uQixjQUFBLEVBQWdCLElBQUMsQ0FBQSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQXRCLENBQUEsQ0FORztPQUFmLENBTEU7QUFBQSxNQWFSLE9BQUEsRUFBUyxJQWJEO0tBRFYsQ0FBQTtXQWdCQSxDQUFDLENBQUMsSUFBRixDQUFPLE9BQVAsQ0FBZSxDQUFDLElBQWhCLENBQXFCLFNBQUEsR0FBQTtBQUNuQixNQUFBLEtBQUEsQ0FBTSxVQUFOLEVBQWtCLFNBQWxCLENBQUEsQ0FBQTtBQUFBLE1BQ0EsSUFBQyxDQUFBLFFBQUQsQ0FBVTtBQUFBLFFBQUUsU0FBQSxFQUFXLEtBQWI7T0FBVixDQURBLENBQUE7YUFFQSxNQUFNLENBQUMsUUFBUCxHQUFrQixJQUhDO0lBQUEsQ0FBckIsRUFqQlk7RUFBQSxDQU5tQjtBQUFBLEVBNEJqQyxNQUFBLEVBQVEsU0FBQSxHQUFBO0FBQ04sUUFBQSw4Q0FBQTtBQUFBLElBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBbkIsQ0FBQTtBQUFBLElBRUEsa0JBQUEsR0FBcUI7QUFBQSxNQUNuQixPQUFBLEVBQVEsU0FEVztBQUFBLE1BRW5CLE9BQUEsRUFBWSxTQUFILEdBQWtCLElBQWxCLEdBQTRCLElBQUMsQ0FBQSxZQUZuQjtBQUFBLE1BR25CLFFBQUEsRUFBVSxTQUhTO0tBRnJCLENBQUE7QUFBQSxJQU9BLGVBQUEsR0FBcUIsU0FBSCxHQUFrQixhQUFsQixHQUFxQyxPQVB2RCxDQUFBO1dBU0EsR0FBQSxDQUFJO0FBQUEsTUFBRSxTQUFBLEVBQVcsV0FBYjtLQUFKLEVBQ0UsSUFBQSxDQUFLO0FBQUEsTUFBQyxTQUFBLEVBQVcsaUJBQVo7S0FBTCxFQUNFLEtBQUEsQ0FBTTtBQUFBLE1BQUUsSUFBQSxFQUFNLE1BQVI7QUFBQSxNQUFnQixLQUFBLEVBQU8sVUFBdkI7QUFBQSxNQUFtQyxjQUFBLEVBQWUsVUFBbEQ7QUFBQSxNQUE4RCxnQkFBQSxFQUFrQixXQUFoRjtBQUFBLE1BQTZGLEdBQUEsRUFBSyxhQUFsRztLQUFOLENBREYsRUFFRSxLQUFBLENBQU07QUFBQSxNQUFFLElBQUEsRUFBTSxVQUFSO0FBQUEsTUFBb0IsS0FBQSxFQUFPLFVBQTNCO0FBQUEsTUFBdUMsY0FBQSxFQUFlLFVBQXREO0FBQUEsTUFBa0UsZ0JBQUEsRUFBa0IsV0FBcEY7QUFBQSxNQUFpRyxHQUFBLEVBQUssYUFBdEc7S0FBTixDQUZGLEVBR0UsS0FBQSxDQUFNO0FBQUEsTUFBRSxJQUFBLEVBQU0sTUFBUjtBQUFBLE1BQWdCLEtBQUEsRUFBTyxNQUF2QjtBQUFBLE1BQStCLGNBQUEsRUFBZSxVQUE5QztBQUFBLE1BQTBELGdCQUFBLEVBQWtCLFdBQTVFO0FBQUEsTUFBeUYsWUFBQSxFQUFhLFdBQXRHO0FBQUEsTUFBbUgsR0FBQSxFQUFLLFNBQXhIO0tBQU4sQ0FIRixFQUlFLEtBQUEsQ0FBTTtBQUFBLE1BQUUsSUFBQSxFQUFNLE1BQVI7QUFBQSxNQUFnQixLQUFBLEVBQU8sTUFBdkI7QUFBQSxNQUErQixjQUFBLEVBQWUsVUFBOUM7QUFBQSxNQUEwRCxnQkFBQSxFQUFrQixXQUE1RTtBQUFBLE1BQXlGLFlBQUEsRUFBYSxNQUF0RztBQUFBLE1BQThHLEdBQUEsRUFBSyxTQUFuSDtLQUFOLENBSkYsRUFLRSxLQUFBLENBQU07QUFBQSxNQUFFLElBQUEsRUFBTSxRQUFSO0FBQUEsTUFBa0IsS0FBQSxFQUFPLGVBQXpCO0FBQUEsTUFBMEMsY0FBQSxFQUFlLFVBQXpEO0FBQUEsTUFBcUUsZ0JBQUEsRUFBa0IsV0FBdkY7QUFBQSxNQUFvRyxZQUFBLEVBQWEsSUFBakg7QUFBQSxNQUF1SCxHQUFBLEVBQUksaUJBQTNIO0tBQU4sRUFDRSxNQUFBLENBQU87QUFBQSxNQUFFLEtBQUEsRUFBTSxJQUFSO0tBQVAsRUFBdUIsWUFBdkIsQ0FERixFQUVFLE1BQUEsQ0FBTztBQUFBLE1BQUUsS0FBQSxFQUFNLE9BQVI7S0FBUCxFQUEwQixPQUExQixDQUZGLEVBR0UsTUFBQSxDQUFPO0FBQUEsTUFBRSxLQUFBLEVBQU0sVUFBUjtLQUFQLEVBQTZCLFVBQTdCLENBSEYsQ0FMRixFQVNFLE1BQUEsQ0FBTyxrQkFBUCxFQUEyQixlQUEzQixDQVRGLENBREYsRUFWTTtFQUFBLENBNUJ5QjtDQUFsQixDQVRqQixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIFBhbmVsR3JvdXAgPSByZXF1aXJlKCcuL1BhbmVsR3JvdXAnKTtcblxudmFyIEFjY29yZGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FjY29yZGlvbicsXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFBhbmVsR3JvdXAoIHthY2NvcmRpb246dHJ1ZX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWNjb3JkaW9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBBZmZpeE1peGluID0gcmVxdWlyZSgnLi9BZmZpeE1peGluJyk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG5cbnZhciBBZmZpeCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FmZml4JyxcbiAgc3RhdGljczoge1xuICAgIGRvbVV0aWxzOiBkb21VdGlsc1xuICB9LFxuXG4gIG1peGluczogW0FmZml4TWl4aW5dLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBob2xkZXJTdHlsZSA9IHt0b3A6IHRoaXMuc3RhdGUuYWZmaXhQb3NpdGlvblRvcH07XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnN0YXRlLmFmZml4Q2xhc3MsIHN0eWxlOmhvbGRlclN0eWxlfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZmZpeDsiLCIvKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBFdmVudExpc3RlbmVyID0gcmVxdWlyZSgnLi91dGlscy9FdmVudExpc3RlbmVyJyk7XG5cbnZhciBBZmZpeE1peGluID0ge1xuICBwcm9wVHlwZXM6IHtcbiAgICBvZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgb2Zmc2V0VG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG9mZnNldEJvdHRvbTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhZmZpeENsYXNzOiAnYWZmaXgtdG9wJ1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0UGlubmVkT2Zmc2V0OiBmdW5jdGlvbiAoRE9NTm9kZSkge1xuICAgIGlmICh0aGlzLnBpbm5lZE9mZnNldCkge1xuICAgICAgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0O1xuICAgIH1cblxuICAgIERPTU5vZGUuY2xhc3NOYW1lID0gRE9NTm9kZS5jbGFzc05hbWUucmVwbGFjZSgvYWZmaXgtdG9wfGFmZml4LWJvdHRvbXxhZmZpeC8sICcnKTtcbiAgICBET01Ob2RlLmNsYXNzTmFtZSArPSBET01Ob2RlLmNsYXNzTmFtZS5sZW5ndGggPyAnIGFmZml4JyA6ICdhZmZpeCc7XG5cbiAgICB0aGlzLnBpbm5lZE9mZnNldCA9IGRvbVV0aWxzLmdldE9mZnNldChET01Ob2RlKS50b3AgLSB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cbiAgICByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXQ7XG4gIH0sXG5cbiAgY2hlY2tQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBET01Ob2RlLCBzY3JvbGxIZWlnaHQsIHNjcm9sbFRvcCwgcG9zaXRpb24sIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tLFxuICAgICAgICBhZmZpeCwgYWZmaXhUeXBlLCBhZmZpeFBvc2l0aW9uVG9wO1xuXG4gICAgLy8gVE9ETzogb3Igbm90IHZpc2libGVcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBET01Ob2RlID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgc2Nyb2xsSGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgcG9zaXRpb24gPSBkb21VdGlscy5nZXRPZmZzZXQoRE9NTm9kZSk7XG4gICAgb2Zmc2V0VG9wO1xuICAgIG9mZnNldEJvdHRvbTtcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT09ICd0b3AnKSB7XG4gICAgICBwb3NpdGlvbi50b3AgKz0gc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIG9mZnNldFRvcCA9IHRoaXMucHJvcHMub2Zmc2V0VG9wICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5vZmZzZXRUb3AgOiB0aGlzLnByb3BzLm9mZnNldDtcbiAgICBvZmZzZXRCb3R0b20gPSB0aGlzLnByb3BzLm9mZnNldEJvdHRvbSAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMub2Zmc2V0Qm90dG9tIDogdGhpcy5wcm9wcy5vZmZzZXQ7XG5cbiAgICBpZiAob2Zmc2V0VG9wID09IG51bGwgJiYgb2Zmc2V0Qm90dG9tID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG9mZnNldFRvcCA9PSBudWxsKSB7XG4gICAgICBvZmZzZXRUb3AgPSAwO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0Qm90dG9tID09IG51bGwpIHtcbiAgICAgIG9mZnNldEJvdHRvbSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCAmJiAoc2Nyb2xsVG9wICsgdGhpcy51bnBpbiA8PSBwb3NpdGlvbi50b3ApKSB7XG4gICAgICBhZmZpeCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAob2Zmc2V0Qm90dG9tICE9IG51bGwgJiYgKHBvc2l0aW9uLnRvcCArIERPTU5vZGUub2Zmc2V0SGVpZ2h0ID49IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkpIHtcbiAgICAgIGFmZml4ID0gJ2JvdHRvbSc7XG4gICAgfSBlbHNlIGlmIChvZmZzZXRUb3AgIT0gbnVsbCAmJiAoc2Nyb2xsVG9wIDw9IG9mZnNldFRvcCkpIHtcbiAgICAgIGFmZml4ID0gJ3RvcCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFmZml4ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PT0gYWZmaXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsKSB7XG4gICAgICBET01Ob2RlLnN0eWxlLnRvcCA9ICcnO1xuICAgIH1cblxuICAgIGFmZml4VHlwZSA9ICdhZmZpeCcgKyAoYWZmaXggPyAnLScgKyBhZmZpeCA6ICcnKTtcblxuICAgIHRoaXMuYWZmaXhlZCA9IGFmZml4O1xuICAgIHRoaXMudW5waW4gPSBhZmZpeCA9PT0gJ2JvdHRvbScgP1xuICAgICAgdGhpcy5nZXRQaW5uZWRPZmZzZXQoRE9NTm9kZSkgOiBudWxsO1xuXG4gICAgaWYgKGFmZml4ID09PSAnYm90dG9tJykge1xuICAgICAgRE9NTm9kZS5jbGFzc05hbWUgPSBET01Ob2RlLmNsYXNzTmFtZS5yZXBsYWNlKC9hZmZpeC10b3B8YWZmaXgtYm90dG9tfGFmZml4LywgJ2FmZml4LXRvcCcpO1xuICAgICAgYWZmaXhQb3NpdGlvblRvcCA9IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSAtIERPTU5vZGUub2Zmc2V0SGVpZ2h0IC0gZG9tVXRpbHMuZ2V0T2Zmc2V0KERPTU5vZGUpLnRvcDtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGFmZml4Q2xhc3M6IGFmZml4VHlwZSxcbiAgICAgIGFmZml4UG9zaXRpb25Ub3A6IGFmZml4UG9zaXRpb25Ub3BcbiAgICB9KTtcbiAgfSxcblxuICBjaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcDogZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQodGhpcy5jaGVja1Bvc2l0aW9uLCAwKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uV2luZG93U2Nyb2xsTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4od2luZG93LCAnc2Nyb2xsJywgdGhpcy5jaGVja1Bvc2l0aW9uKTtcbiAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2NsaWNrJywgdGhpcy5jaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIGlmIChwcmV2U3RhdGUuYWZmaXhDbGFzcyA9PT0gdGhpcy5zdGF0ZS5hZmZpeENsYXNzKSB7XG4gICAgICB0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFmZml4TWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBBbGVydCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FsZXJ0JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uRGlzbWlzczogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgZGlzbWlzc0FmdGVyOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdhbGVydCcsXG4gICAgICBic1N0eWxlOiAnaW5mbydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlckRpc21pc3NCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbihcbiAgICAgICAge3R5cGU6XCJidXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOlwiY2xvc2VcIixcbiAgICAgICAgb25DbGljazp0aGlzLnByb3BzLm9uRGlzbWlzcyxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzpcInRydWVcIn0sIFxuICAgICAgICBcIiDDlyBcIlxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgaXNEaXNtaXNzYWJsZSA9ICEhdGhpcy5wcm9wcy5vbkRpc21pc3M7XG5cbiAgICBjbGFzc2VzWydhbGVydC1kaXNtaXNzYWJsZSddID0gaXNEaXNtaXNzYWJsZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgaXNEaXNtaXNzYWJsZSA/IHRoaXMucmVuZGVyRGlzbWlzc0J1dHRvbigpIDogbnVsbCxcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnByb3BzLmRpc21pc3NBZnRlciAmJiB0aGlzLnByb3BzLm9uRGlzbWlzcykge1xuICAgICAgdGhpcy5kaXNtaXNzVGltZXIgPSBzZXRUaW1lb3V0KHRoaXMucHJvcHMub25EaXNtaXNzLCB0aGlzLnByb3BzLmRpc21pc3NBZnRlcik7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kaXNtaXNzVGltZXIpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbGVydDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgQmFkZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCYWRnZScsXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAncHVsbC1yaWdodCc6IHRoaXMucHJvcHMucHVsbFJpZ2h0LFxuICAgICAgJ2JhZGdlJzogVmFsaWRDb21wb25lbnRDaGlsZHJlbi5oYXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhZGdlO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKTtcblxudmFyIEJvb3RzdHJhcE1peGluID0ge1xuICBwcm9wVHlwZXM6IHtcbiAgICBic0NsYXNzOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLkNMQVNTRVMpKSxcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLlNUWUxFUykpLFxuICAgIGJzU2l6ZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKE9iamVjdC5rZXlzKGNvbnN0YW50cy5TSVpFUykpXG4gIH0sXG5cbiAgZ2V0QnNDbGFzc1NldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG5cbiAgICB2YXIgYnNDbGFzcyA9IHRoaXMucHJvcHMuYnNDbGFzcyAmJiBjb25zdGFudHMuQ0xBU1NFU1t0aGlzLnByb3BzLmJzQ2xhc3NdO1xuICAgIGlmIChic0NsYXNzKSB7XG4gICAgICBjbGFzc2VzW2JzQ2xhc3NdID0gdHJ1ZTtcblxuICAgICAgdmFyIHByZWZpeCA9IGJzQ2xhc3MgKyAnLSc7XG5cbiAgICAgIHZhciBic1NpemUgPSB0aGlzLnByb3BzLmJzU2l6ZSAmJiBjb25zdGFudHMuU0laRVNbdGhpcy5wcm9wcy5ic1NpemVdO1xuICAgICAgaWYgKGJzU2l6ZSkge1xuICAgICAgICBjbGFzc2VzW3ByZWZpeCArIGJzU2l6ZV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgYnNTdHlsZSA9IHRoaXMucHJvcHMuYnNTdHlsZSAmJiBjb25zdGFudHMuU1RZTEVTW3RoaXMucHJvcHMuYnNTdHlsZV07XG4gICAgICBpZiAodGhpcy5wcm9wcy5ic1N0eWxlKSB7XG4gICAgICAgIGNsYXNzZXNbcHJlZml4ICsgYnNTdHlsZV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3RzdHJhcE1peGluOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBhY3RpdmU6ICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGJsb2NrOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuYXZJdGVtOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuYXZEcm9wZG93bjogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2J1dHRvbicsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCcsXG4gICAgICB0eXBlOiAnYnV0dG9uJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLm5hdkRyb3Bkb3duID8ge30gOiB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgcmVuZGVyRnVuY05hbWU7XG5cbiAgICBjbGFzc2VzWydhY3RpdmUnXSA9IHRoaXMucHJvcHMuYWN0aXZlO1xuICAgIGNsYXNzZXNbJ2J0bi1ibG9jayddID0gdGhpcy5wcm9wcy5ibG9jaztcblxuICAgIGlmICh0aGlzLnByb3BzLm5hdkl0ZW0pIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlck5hdkl0ZW0oY2xhc3Nlcyk7XG4gICAgfVxuXG4gICAgcmVuZGVyRnVuY05hbWUgPSB0aGlzLnByb3BzLmhyZWYgfHwgdGhpcy5wcm9wcy5uYXZEcm9wZG93biA/XG4gICAgICAncmVuZGVyQW5jaG9yJyA6ICdyZW5kZXJCdXR0b24nO1xuXG4gICAgcmV0dXJuIHRoaXNbcmVuZGVyRnVuY05hbWVdKGNsYXNzZXMpO1xuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICB2YXIgaHJlZiA9IHRoaXMucHJvcHMuaHJlZiB8fCAnIyc7XG4gICAgY2xhc3Nlc1snZGlzYWJsZWQnXSA9IHRoaXMucHJvcHMuZGlzYWJsZWQ7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uYShcbiAgICAgICAge2hyZWY6aHJlZixcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICByb2xlOlwiYnV0dG9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQnV0dG9uOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5idXR0b24oXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICB2YXIgbGlDbGFzc2VzID0ge1xuICAgICAgYWN0aXZlOiB0aGlzLnByb3BzLmFjdGl2ZVxuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGxpQ2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJBbmNob3IoY2xhc3NlcylcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG5cbnZhciBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbkdyb3VwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHZlcnRpY2FsOiAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAganVzdGlmaWVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uLWdyb3VwJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBjbGFzc2VzWydidG4tZ3JvdXAnXSA9ICF0aGlzLnByb3BzLnZlcnRpY2FsO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cC12ZXJ0aWNhbCddID0gdGhpcy5wcm9wcy52ZXJ0aWNhbDtcbiAgICBjbGFzc2VzWydidG4tZ3JvdXAtanVzdGlmaWVkJ10gPSB0aGlzLnByb3BzLmp1c3RpZmllZDtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbkdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xuXG52YXIgQnV0dG9uR3JvdXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCdXR0b25Hcm91cCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2J1dHRvbi10b29sYmFyJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtyb2xlOlwidG9vbGJhclwiLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbkdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBDYXJvdXNlbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nhcm91c2VsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHNsaWRlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBpbmRpY2F0b3JzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjb250cm9sczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcGF1c2VPbkhvdmVyOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB3cmFwOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25TbGlkZUVuZDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlSW5kZXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVmYXVsdEFjdGl2ZUluZGV4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRpcmVjdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsncHJldicsICduZXh0J10pXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNsaWRlOiB0cnVlLFxuICAgICAgaW50ZXJ2YWw6IDUwMDAsXG4gICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICB3cmFwOiB0cnVlLFxuICAgICAgaW5kaWNhdG9yczogdHJ1ZSxcbiAgICAgIGNvbnRyb2xzOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlSW5kZXg6IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUluZGV4ID09IG51bGwgP1xuICAgICAgICAwIDogdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlSW5kZXgsXG4gICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBudWxsLFxuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBnZXREaXJlY3Rpb246IGZ1bmN0aW9uIChwcmV2SW5kZXgsIGluZGV4KSB7XG4gICAgaWYgKHByZXZJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBwcmV2SW5kZXggPiBpbmRleCA/XG4gICAgICAncHJldicgOiAnbmV4dCc7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcblxuICAgIGlmIChuZXh0UHJvcHMuYWN0aXZlSW5kZXggIT0gbnVsbCAmJiBuZXh0UHJvcHMuYWN0aXZlSW5kZXggIT09IGFjdGl2ZUluZGV4KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBhY3RpdmVJbmRleCxcbiAgICAgICAgZGlyZWN0aW9uOiBuZXh0UHJvcHMuZGlyZWN0aW9uICE9IG51bGwgP1xuICAgICAgICAgIG5leHRQcm9wcy5kaXJlY3Rpb24gOiB0aGlzLmdldERpcmVjdGlvbihhY3RpdmVJbmRleCwgbmV4dFByb3BzLmFjdGl2ZUluZGV4KVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy53YWl0Rm9yTmV4dCgpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgfSxcblxuICBuZXh0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpICsgMTtcbiAgICB2YXIgY291bnQgPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLm51bWJlck9mKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXG4gICAgaWYgKGluZGV4ID4gY291bnQgLSAxKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMud3JhcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbmRleCA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVTZWxlY3QoaW5kZXgsICduZXh0Jyk7XG4gIH0sXG5cbiAgcHJldjogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKSAtIDE7XG5cbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMud3JhcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbmRleCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbikgLSAxO1xuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlU2VsZWN0KGluZGV4LCAncHJldicpO1xuICB9LFxuXG4gIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gIH0sXG5cbiAgcGxheTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG4gIH0sXG5cbiAgd2FpdEZvck5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNQYXVzZWQgJiYgdGhpcy5wcm9wcy5zbGlkZSAmJiB0aGlzLnByb3BzLmludGVydmFsICYmXG4gICAgICAgIHRoaXMucHJvcHMuYWN0aXZlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm5leHQsIHRoaXMucHJvcHMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVNb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgIHRoaXMucGF1c2UoKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlTW91c2VPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1BhdXNlZCkge1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgY2Fyb3VzZWw6IHRydWUsXG4gICAgICBzbGlkZTogdGhpcy5wcm9wcy5zbGlkZVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICBvbk1vdXNlT3Zlcjp0aGlzLmhhbmRsZU1vdXNlT3ZlcixcbiAgICAgICAgb25Nb3VzZU91dDp0aGlzLmhhbmRsZU1vdXNlT3V0fSwgXG4gICAgICAgIHRoaXMucHJvcHMuaW5kaWNhdG9ycyA/IHRoaXMucmVuZGVySW5kaWNhdG9ycygpIDogbnVsbCxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNhcm91c2VsLWlubmVyXCIsIHJlZjpcImlubmVyXCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckl0ZW0pXG4gICAgICAgICksXG4gICAgICAgIHRoaXMucHJvcHMuY29udHJvbHMgPyB0aGlzLnJlbmRlckNvbnRyb2xzKCkgOiBudWxsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQcmV2OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwibGVmdCBjYXJvdXNlbC1jb250cm9sXCIsIGhyZWY6XCIjcHJldlwiLCBrZXk6MCwgb25DbGljazp0aGlzLnByZXZ9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFwifSApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwicmlnaHQgY2Fyb3VzZWwtY29udHJvbFwiLCBocmVmOlwiI25leHRcIiwga2V5OjEsIG9uQ2xpY2s6dGhpcy5uZXh0fSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0XCJ9KVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29udHJvbHM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCk7XG4gICAgICB2YXIgY291bnQgPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLm51bWJlck9mKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXG4gICAgICByZXR1cm4gW1xuICAgICAgICAoYWN0aXZlSW5kZXggIT09IDApID8gdGhpcy5yZW5kZXJQcmV2KCkgOiBudWxsLFxuICAgICAgICAoYWN0aXZlSW5kZXggIT09IGNvdW50IC0gMSkgPyB0aGlzLnJlbmRlck5leHQoKSA6IG51bGxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRoaXMucmVuZGVyUHJldigpLFxuICAgICAgdGhpcy5yZW5kZXJOZXh0KClcbiAgICBdO1xuICB9LFxuXG4gIHJlbmRlckluZGljYXRvcjogZnVuY3Rpb24gKGNoaWxkLCBpbmRleCkge1xuICAgIHZhciBjbGFzc05hbWUgPSAoaW5kZXggPT09IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKSkgP1xuICAgICAgJ2FjdGl2ZScgOiBudWxsO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5saShcbiAgICAgICAge2tleTppbmRleCxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzTmFtZSxcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVNlbGVjdC5iaW5kKHRoaXMsIGluZGV4LCBudWxsKX0gKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVySW5kaWNhdG9yczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbmRpY2F0b3JzID0gW107XG4gICAgVmFsaWRDb21wb25lbnRDaGlsZHJlblxuICAgICAgLmZvckVhY2godGhpcy5wcm9wcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQsIGluZGV4KSB7XG4gICAgICAgIGluZGljYXRvcnMucHVzaChcbiAgICAgICAgICB0aGlzLnJlbmRlckluZGljYXRvcihjaGlsZCwgaW5kZXgpLFxuXG4gICAgICAgICAgLy8gRm9yY2Ugd2hpdGVzcGFjZSBiZXR3ZWVuIGluZGljYXRvciBlbGVtZW50cywgYm9vdHN0cmFwXG4gICAgICAgICAgLy8gcmVxdWlyZXMgdGhpcyBmb3IgY29ycmVjdCBzcGFjaW5nIG9mIGVsZW1lbnRzLlxuICAgICAgICAgICcgJ1xuICAgICAgICApO1xuICAgICAgfSwgdGhpcyk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLm9sKCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtaW5kaWNhdG9yc1wifSwgXG4gICAgICAgIGluZGljYXRvcnNcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldEFjdGl2ZUluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuYWN0aXZlSW5kZXggIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlSW5kZXggOiB0aGlzLnN0YXRlLmFjdGl2ZUluZGV4O1xuICB9LFxuXG4gIGhhbmRsZUl0ZW1BbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBudWxsLFxuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG5cbiAgICAgIGlmICh0aGlzLnByb3BzLm9uU2xpZGVFbmQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNsaWRlRW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVySXRlbTogZnVuY3Rpb24gKGNoaWxkLCBpbmRleCkge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICB2YXIgaXNBY3RpdmUgPSAoaW5kZXggPT09IGFjdGl2ZUluZGV4KTtcbiAgICB2YXIgaXNQcmV2aW91c0FjdGl2ZSA9IHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCAhPSBudWxsICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggPT09IGluZGV4ICYmIHRoaXMucHJvcHMuc2xpZGU7XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICAgIGNoaWxkLFxuICAgICAgICB7XG4gICAgICAgICAgYWN0aXZlOiBpc0FjdGl2ZSxcbiAgICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSAhPSBudWxsID9cbiAgICAgICAgICAgIGNoaWxkLnByb3BzLmtleSA6IGluZGV4LFxuICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICBhbmltYXRlT3V0OiBpc1ByZXZpb3VzQWN0aXZlLFxuICAgICAgICAgIGFuaW1hdGVJbjogaXNBY3RpdmUgJiYgdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwgJiYgdGhpcy5wcm9wcy5zbGlkZSxcbiAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuc3RhdGUuZGlyZWN0aW9uLFxuICAgICAgICAgIG9uQW5pbWF0ZU91dEVuZDogaXNQcmV2aW91c0FjdGl2ZSA/IHRoaXMuaGFuZGxlSXRlbUFuaW1hdGVPdXRFbmQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChpbmRleCwgZGlyZWN0aW9uKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cbiAgICB2YXIgcHJldmlvdXNBY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24gfHwgdGhpcy5nZXREaXJlY3Rpb24ocHJldmlvdXNBY3RpdmVJbmRleCwgaW5kZXgpO1xuXG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3QoaW5kZXgsIGRpcmVjdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSW5kZXggPT0gbnVsbCAmJiBpbmRleCAhPT0gcHJldmlvdXNBY3RpdmVJbmRleCkge1xuICAgICAgaWYgKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCAhPSBudWxsKSB7XG4gICAgICAgIC8vIElmIGN1cnJlbnRseSBhbmltYXRpbmcgZG9uJ3QgYWN0aXZhdGUgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgLy8gVE9ETzogbG9vayBpbnRvIHF1ZXVpbmcgdGhpcyBjYW5jZWxlZCBjYWxsIGFuZFxuICAgICAgICAvLyBhbmltYXRpbmcgYWZ0ZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGhhcyBlbmRlZC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYWN0aXZlSW5kZXg6IGluZGV4LFxuICAgICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBwcmV2aW91c0FjdGl2ZUluZGV4LFxuICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvblxuICAgICAgfSk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJvdXNlbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgQ2Fyb3VzZWxJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ2Fyb3VzZWxJdGVtJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlyZWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydwcmV2JywgJ25leHQnXSksXG4gICAgb25BbmltYXRlT3V0RW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNhcHRpb246IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlQW5pbWF0ZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCAmJiB0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCh0aGlzLnByb3BzLmluZGV4KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSAhPT0gbmV4dFByb3BzLmFjdGl2ZSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcykge1xuICAgIGlmICghdGhpcy5wcm9wcy5hY3RpdmUgJiYgcHJldlByb3BzLmFjdGl2ZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdldERPTU5vZGUoKSxcbiAgICAgICAgdGhpcy5oYW5kbGVBbmltYXRlT3V0RW5kXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSAhPT0gcHJldlByb3BzLmFjdGl2ZSkge1xuICAgICAgc2V0VGltZW91dCh0aGlzLnN0YXJ0QW5pbWF0aW9uLCAyMCk7XG4gICAgfVxuICB9LFxuXG4gIHN0YXJ0QW5pbWF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBkaXJlY3Rpb246IHRoaXMucHJvcHMuZGlyZWN0aW9uID09PSAncHJldicgP1xuICAgICAgICAncmlnaHQnIDogJ2xlZnQnXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICBpdGVtOiB0cnVlLFxuICAgICAgYWN0aXZlOiAodGhpcy5wcm9wcy5hY3RpdmUgJiYgIXRoaXMucHJvcHMuYW5pbWF0ZUluKSB8fCB0aGlzLnByb3BzLmFuaW1hdGVPdXQsXG4gICAgICBuZXh0OiB0aGlzLnByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFuaW1hdGVJbiAmJiB0aGlzLnByb3BzLmRpcmVjdGlvbiA9PT0gJ25leHQnLFxuICAgICAgcHJldjogdGhpcy5wcm9wcy5hY3RpdmUgJiYgdGhpcy5wcm9wcy5hbmltYXRlSW4gJiYgdGhpcy5wcm9wcy5kaXJlY3Rpb24gPT09ICdwcmV2J1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24gJiYgKHRoaXMucHJvcHMuYW5pbWF0ZUluIHx8IHRoaXMucHJvcHMuYW5pbWF0ZU91dCkpIHtcbiAgICAgIGNsYXNzZXNbdGhpcy5zdGF0ZS5kaXJlY3Rpb25dID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW4sXG4gICAgICAgIHRoaXMucHJvcHMuY2FwdGlvbiA/IHRoaXMucmVuZGVyQ2FwdGlvbigpIDogbnVsbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ2FwdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtY2FwdGlvblwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2FwdGlvblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcm91c2VsSXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG5cbnZhciBDb2wgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb2wnLFxuICBwcm9wVHlwZXM6IHtcbiAgICB4czogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c09mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbU9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZE9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ09mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c1B1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc21QdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ1B1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgeHNQdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZFB1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGdQdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3NcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5kaXZcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKGNvbnN0YW50cy5TSVpFUykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgc2l6ZSA9IGNvbnN0YW50cy5TSVpFU1trZXldO1xuICAgICAgdmFyIHByb3AgPSBzaXplO1xuICAgICAgdmFyIGNsYXNzUGFydCA9IHNpemUgKyAnLSc7XG5cbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdPZmZzZXQnO1xuICAgICAgY2xhc3NQYXJ0ID0gc2l6ZSArICctb2Zmc2V0LSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHNpemUgKyAnUHVzaCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1wdXNoLSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHNpemUgKyAnUHVsbCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1wdWxsLSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2w7IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHtcblxuICBwcm9wVHlwZXM6IHtcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGVmYXVsdEV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBleHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMuZGVmYXVsdEV4cGFuZGVkICE9IG51bGwgPyB0aGlzLnByb3BzLmRlZmF1bHRFeHBhbmRlZCA6IG51bGwsXG4gICAgICBjb2xsYXBzaW5nOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlVHJhbnNpdGlvbkVuZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NvbGxhcHNlRW5kID0gdHJ1ZTtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGNvbGxhcHNpbmc6IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuY29sbGFwc2FibGUgJiYgbmV3UHJvcHMuZXhwYW5kZWQgIT09IHRoaXMucHJvcHMuZXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuX2NvbGxhcHNlRW5kID0gZmFsc2U7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgY29sbGFwc2luZzogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9hZGRFbmRUcmFuc2l0aW9uTGlzdGVuZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICBub2RlLFxuICAgICAgICB0aGlzLmhhbmRsZVRyYW5zaXRpb25FbmRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIF9yZW1vdmVFbmRUcmFuc2l0aW9uTGlzdGVuZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICBub2RlLFxuICAgICAgICB0aGlzLmhhbmRsZVRyYW5zaXRpb25FbmRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYWZ0ZXJSZW5kZXIoKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICB2YXIgZGltZW5zaW9uID0gKHR5cGVvZiB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uKCkgOiAnaGVpZ2h0JztcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICB0aGlzLl9yZW1vdmVFbmRUcmFuc2l0aW9uTGlzdGVuZXIoKTtcbiAgICBpZiAobm9kZSAmJiBuZXh0UHJvcHMuZXhwYW5kZWQgIT09IHRoaXMucHJvcHMuZXhwYW5kZWQgJiYgdGhpcy5wcm9wcy5leHBhbmRlZCkge1xuICAgICAgbm9kZS5zdHlsZVtkaW1lbnNpb25dID0gdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlKCkgKyAncHgnO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIGlmICh0aGlzLnN0YXRlLmNvbGxhcHNpbmcgIT09IHByZXZTdGF0ZS5jb2xsYXBzaW5nKSB7XG4gICAgICB0aGlzLl9hZnRlclJlbmRlcigpO1xuICAgIH1cbiAgfSxcblxuICBfYWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFbmRUcmFuc2l0aW9uTGlzdGVuZXIoKTtcbiAgICBzZXRUaW1lb3V0KHRoaXMuX3VwZGF0ZURpbWVuc2lvbkFmdGVyUmVuZGVyLCAwKTtcbiAgfSxcblxuICBfdXBkYXRlRGltZW5zaW9uQWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGltZW5zaW9uID0gKHR5cGVvZiB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uKCkgOiAnaGVpZ2h0JztcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgbm9kZS5zdHlsZVtkaW1lbnNpb25dID0gdGhpcy5pc0V4cGFuZGVkKCkgP1xuICAgICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWUoKSArICdweCcgOiAnMHB4JztcbiAgICB9XG4gIH0sXG5cbiAgaXNFeHBhbmRlZDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5wcm9wcy5leHBhbmRlZCAhPSBudWxsKSA/XG4gICAgICB0aGlzLnByb3BzLmV4cGFuZGVkIDogdGhpcy5zdGF0ZS5leHBhbmRlZDtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZUNsYXNzU2V0OiBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIGlmICh0eXBlb2YgY2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgY2xhc3NOYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICBjbGFzc2VzW2NsYXNzTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjbGFzc2VzLmNvbGxhcHNpbmcgPSB0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG4gICAgY2xhc3Nlcy5jb2xsYXBzZSA9ICF0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMuaXNFeHBhbmRlZCgpICYmICF0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG5cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsYXBzYWJsZU1peGluOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIERyb3Bkb3duU3RhdGVNaXhpbiA9IHJlcXVpcmUoJy4vRHJvcGRvd25TdGF0ZU1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcbnZhciBCdXR0b25Hcm91cCA9IHJlcXVpcmUoJy4vQnV0dG9uR3JvdXAnKTtcbnZhciBEcm9wZG93bk1lbnUgPSByZXF1aXJlKCcuL0Ryb3Bkb3duTWVudScpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxuXG52YXIgRHJvcGRvd25CdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdEcm9wZG93bkJ1dHRvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBEcm9wZG93blN0YXRlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZHJvcHVwOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB0aXRsZTogICAgIFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGhyZWY6ICAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBvbkNsaWNrOiAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG9uU2VsZWN0OiAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgbmF2SXRlbTogICBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc05hbWUgPSAnZHJvcGRvd24tdG9nZ2xlJztcblxuICAgIHZhciByZW5kZXJNZXRob2QgPSB0aGlzLnByb3BzLm5hdkl0ZW0gP1xuICAgICAgJ3JlbmRlck5hdkl0ZW0nIDogJ3JlbmRlckJ1dHRvbkdyb3VwJztcblxuICAgIHJldHVybiB0aGlzW3JlbmRlck1ldGhvZF0oW1xuICAgICAgdGhpcy50cmFuc2ZlclByb3BzVG8oQnV0dG9uKFxuICAgICAgICB7cmVmOlwiZHJvcGRvd25CdXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzTmFtZSxcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZURyb3Bkb3duQ2xpY2ssXG4gICAgICAgIGtleTowLFxuICAgICAgICBuYXZEcm9wZG93bjp0aGlzLnByb3BzLm5hdkl0ZW0sXG4gICAgICAgIG5hdkl0ZW06bnVsbCxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgcHVsbFJpZ2h0Om51bGwsXG4gICAgICAgIGRyb3B1cDpudWxsfSwgXG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUsJyAnLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImNhcmV0XCJ9IClcbiAgICAgICkpLFxuICAgICAgRHJvcGRvd25NZW51KFxuICAgICAgICB7cmVmOlwibWVudVwiLFxuICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5Jzp0aGlzLnByb3BzLmlkLFxuICAgICAgICBwdWxsUmlnaHQ6dGhpcy5wcm9wcy5wdWxsUmlnaHQsXG4gICAgICAgIGtleToxfSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTWVudUl0ZW0pXG4gICAgICApXG4gICAgXSk7XG4gIH0sXG5cbiAgcmVuZGVyQnV0dG9uR3JvdXA6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBncm91cENsYXNzZXMgPSB7XG4gICAgICAgICdvcGVuJzogdGhpcy5zdGF0ZS5vcGVuLFxuICAgICAgICAnZHJvcHVwJzogdGhpcy5wcm9wcy5kcm9wdXBcbiAgICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgQnV0dG9uR3JvdXAoXG4gICAgICAgIHtic1NpemU6dGhpcy5wcm9wcy5ic1NpemUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChncm91cENsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgJ2Ryb3Bkb3duJzogdHJ1ZSxcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck1lbnVJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAvLyBPbmx5IGhhbmRsZSB0aGUgb3B0aW9uIHNlbGVjdGlvbiBpZiBhbiBvblNlbGVjdCBwcm9wIGhhcyBiZWVuIHNldCBvbiB0aGVcbiAgICAvLyBjb21wb25lbnQgb3IgaXQncyBjaGlsZCwgdGhpcyBhbGxvd3MgYSB1c2VyIG5vdCB0byBwYXNzIGFuIG9uU2VsZWN0XG4gICAgLy8gaGFuZGxlciBhbmQgaGF2ZSB0aGUgYnJvd3NlciBwcmVmb3JtIHRoZSBkZWZhdWx0IGFjdGlvbi5cbiAgICB2YXIgaGFuZGxlT3B0aW9uU2VsZWN0ID0gdGhpcy5wcm9wcy5vblNlbGVjdCB8fCBjaGlsZC5wcm9wcy5vblNlbGVjdCA/XG4gICAgICB0aGlzLmhhbmRsZU9wdGlvblNlbGVjdCA6IG51bGw7XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgLy8gQ2FwdHVyZSBvblNlbGVjdCBldmVudHNcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgaGFuZGxlT3B0aW9uU2VsZWN0KSxcblxuICAgICAgICAvLyBGb3JjZSBzcGVjaWFsIHByb3BzIHRvIGJlIHRyYW5zZmVycmVkXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgICAgfVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlRHJvcGRvd25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoIXRoaXMuc3RhdGUub3Blbik7XG4gIH0sXG5cbiAgaGFuZGxlT3B0aW9uU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkJ1dHRvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBEcm9wZG93bk1lbnUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdEcm9wZG93bk1lbnUnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24tbWVudSc6IHRydWUsXG4gICAgICAgICdkcm9wZG93bi1tZW51LXJpZ2h0JzogdGhpcy5wcm9wcy5wdWxsUmlnaHRcbiAgICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgIFJlYWN0LkRPTS51bChcbiAgICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICAgIHJvbGU6XCJtZW51XCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck1lbnVJdGVtKVxuICAgICAgICApXG4gICAgICApO1xuICB9LFxuXG4gIHJlbmRlck1lbnVJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgLy8gQ2FwdHVyZSBvblNlbGVjdCBldmVudHNcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG5cbiAgICAgICAgLy8gRm9yY2Ugc3BlY2lhbCBwcm9wcyB0byBiZSB0cmFuc2ZlcnJlZFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bk1lbnU7IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgRXZlbnRMaXN0ZW5lciA9IHJlcXVpcmUoJy4vdXRpbHMvRXZlbnRMaXN0ZW5lcicpO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyB3aXRoaW5cbiAqIGEgcm9vdCBub2RlcyB0cmVlXG4gKlxuICogQHBhcmFtIHtET01FbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHJvb3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc05vZGVJblJvb3Qobm9kZSwgcm9vdCkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlID09PSByb290KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxudmFyIERyb3Bkb3duU3RhdGVNaXhpbiA9IHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW46IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBzZXREcm9wZG93blN0YXRlOiBmdW5jdGlvbiAobmV3U3RhdGUsIG9uU3RhdGVDaGFuZ2VDb21wbGV0ZSkge1xuICAgIGlmIChuZXdTdGF0ZSkge1xuICAgICAgdGhpcy5iaW5kUm9vdENsb3NlSGFuZGxlcnMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51bmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3BlbjogbmV3U3RhdGVcbiAgICB9LCBvblN0YXRlQ2hhbmdlQ29tcGxldGUpO1xuICB9LFxuXG4gIGhhbmRsZURvY3VtZW50S2V5VXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZURvY3VtZW50Q2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgLy8gSWYgdGhlIGNsaWNrIG9yaWdpbmF0ZWQgZnJvbSB3aXRoaW4gdGhpcyBjb21wb25lbnRcbiAgICAvLyBkb24ndCBkbyBhbnl0aGluZy5cbiAgICBpZiAoaXNOb2RlSW5Sb290KGUudGFyZ2V0LCB0aGlzLmdldERPTU5vZGUoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9LFxuXG4gIGJpbmRSb290Q2xvc2VIYW5kbGVyczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAnY2xpY2snLCB0aGlzLmhhbmRsZURvY3VtZW50Q2xpY2spO1xuICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAna2V5dXAnLCB0aGlzLmhhbmRsZURvY3VtZW50S2V5VXApO1xuICB9LFxuXG4gIHVuYmluZFJvb3RDbG9zZUhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudW5iaW5kUm9vdENsb3NlSGFuZGxlcnMoKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blN0YXRlTWl4aW47IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbi8vIFRPRE86IGxpc3RlbiBmb3Igb25UcmFuc2l0aW9uRW5kIHRvIHJlbW92ZSBlbFxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIF9mYWRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzO1xuXG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIGVscyA9IHRoaXMuZ2V0RE9NTm9kZSgpLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mYWRlJyk7XG4gICAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVscywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgZWwuY2xhc3NOYW1lICs9ICcgaW4nO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgX2ZhZGVPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzID0gdGhpcy5fZmFkZU91dEVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mYWRlLmluJyk7XG5cbiAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbHMsIGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZSgvXFxiaW5cXGIvLCAnJyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KHRoaXMuX2hhbmRsZUZhZGVPdXRFbmQsIDMwMCk7XG4gIH0sXG5cbiAgX2hhbmRsZUZhZGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fZmFkZU91dEVsICYmIHRoaXMuX2ZhZGVPdXRFbC5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9mYWRlT3V0RWwpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAvLyBGaXJlZm94IG5lZWRzIGRlbGF5IGZvciB0cmFuc2l0aW9uIHRvIGJlIHRyaWdnZXJlZFxuICAgICAgc2V0VGltZW91dCh0aGlzLl9mYWRlSW4sIDIwKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzID0gdGhpcy5nZXRET01Ob2RlKCkucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUnKTtcbiAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fZmFkZU91dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuX2ZhZGVPdXRFbCk7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwuYXBwZW5kQ2hpbGQodGhpcy5nZXRET01Ob2RlKCkuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgIC8vIEZpcmVmb3ggbmVlZHMgZGVsYXkgZm9yIHRyYW5zaXRpb24gdG8gYmUgdHJpZ2dlcmVkXG4gICAgICBzZXRUaW1lb3V0KHRoaXMuX2ZhZGVPdXQsIDIwKTtcbiAgICB9XG4gIH1cbn07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKTtcblxudmFyIEdseXBoaWNvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0dseXBoaWNvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBnbHlwaDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKGNvbnN0YW50cy5HTFlQSFMpLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2dseXBoaWNvbidcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICBjbGFzc2VzWydnbHlwaGljb24tJyArIHRoaXMucHJvcHMuZ2x5cGhdID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHbHlwaGljb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG5cblxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZmx1aWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3NcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5kaXZcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBjb21wb25lbnRDbGFzcygge2NsYXNzTmFtZTp0aGlzLnByb3BzLmZsdWlkID8gJ2NvbnRhaW5lci1mbHVpZCcgOiAnY29udGFpbmVyJ30sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gR3JpZDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBJbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0lucHV0JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgdHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaGVscDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYWRkb25CZWZvcmU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGFkZG9uQWZ0ZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3N1Y2Nlc3MnLCAnd2FybmluZycsICdlcnJvciddKSxcbiAgICBoYXNGZWVkYmFjazogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZ3JvdXBDbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgd3JhcHBlckNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBsYWJlbENsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldElucHV0RE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnMuaW5wdXQuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIGdldFZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMudHlwZSA9PT0gJ3N0YXRpYycpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3BzLnZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldElucHV0RE9NTm9kZSgpLnZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgdXNlIGdldFZhbHVlIHdpdGhvdXQgc3BlY2lmeWluZyBpbnB1dCB0eXBlLicpO1xuICAgIH1cbiAgfSxcblxuICBnZXRDaGVja2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRET01Ob2RlKCkuY2hlY2tlZDtcbiAgfSxcblxuICBpc0NoZWNrYm94T3JSYWRpbzogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLnR5cGUgPT09ICdyYWRpbycgfHwgdGhpcy5wcm9wcy50eXBlID09PSAnY2hlY2tib3gnO1xuICB9LFxuXG4gIHJlbmRlcklucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlucHV0ID0gbnVsbDtcblxuICAgIGlmICghdGhpcy5wcm9wcy50eXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5wcm9wcy50eXBlKSB7XG4gICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICBpbnB1dCA9IChcbiAgICAgICAgICBSZWFjdC5ET00uc2VsZWN0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgICBpbnB1dCA9IFJlYWN0LkRPTS50ZXh0YXJlYSgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJpbnB1dFwiLCBrZXk6XCJpbnB1dFwifSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0YXRpYyc6XG4gICAgICAgIGlucHV0ID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5wKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sLXN0YXRpY1wiLCByZWY6XCJpbnB1dFwiLCAga2V5OlwiaW5wdXRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy52YWx1ZVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5pc0NoZWNrYm94T3JSYWRpbygpID8gJycgOiAnZm9ybS1jb250cm9sJztcbiAgICAgICAgaW5wdXQgPSBSZWFjdC5ET00uaW5wdXQoIHtjbGFzc05hbWU6Y2xhc3NOYW1lLCByZWY6XCJpbnB1dFwiLCBrZXk6XCJpbnB1dFwifSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhpbnB1dCk7XG4gIH0sXG5cbiAgcmVuZGVySW5wdXRHcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGFkZG9uQmVmb3JlID0gdGhpcy5wcm9wcy5hZGRvbkJlZm9yZSA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIiwga2V5OlwiYWRkb25CZWZvcmVcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmFkZG9uQmVmb3JlXG4gICAgICApXG4gICAgKSA6IG51bGw7XG5cbiAgICB2YXIgYWRkb25BZnRlciA9IHRoaXMucHJvcHMuYWRkb25BZnRlciA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIiwga2V5OlwiYWRkb25BZnRlclwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuYWRkb25BZnRlclxuICAgICAgKVxuICAgICkgOiBudWxsO1xuXG4gICAgcmV0dXJuIGFkZG9uQmVmb3JlIHx8IGFkZG9uQWZ0ZXIgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIiwga2V5OlwiaW5wdXQtZ3JvdXBcIn0sIFxuICAgICAgICBhZGRvbkJlZm9yZSxcbiAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgIGFkZG9uQWZ0ZXJcbiAgICAgIClcbiAgICApIDogY2hpbGRyZW47XG4gIH0sXG5cbiAgcmVuZGVySWNvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2dseXBoaWNvbic6IHRydWUsXG4gICAgICAnZm9ybS1jb250cm9sLWZlZWRiYWNrJzogdHJ1ZSxcbiAgICAgICdnbHlwaGljb24tb2snOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdzdWNjZXNzJyxcbiAgICAgICdnbHlwaGljb24td2FybmluZy1zaWduJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnd2FybmluZycsXG4gICAgICAnZ2x5cGhpY29uLXJlbW92ZSc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ2Vycm9yJ1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5oYXNGZWVkYmFjayA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJpY29uXCJ9IClcbiAgICApIDogbnVsbDtcbiAgfSxcblxuICByZW5kZXJIZWxwOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuaGVscCA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaGVscC1ibG9ja1wiLCBrZXk6XCJoZWxwXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5oZWxwXG4gICAgICApXG4gICAgKSA6IG51bGw7XG4gIH0sXG5cbiAgcmVuZGVyQ2hlY2tib3hhbmRSYWRpb1dyYXBwZXI6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2NoZWNrYm94JzogdGhpcy5wcm9wcy50eXBlID09PSAnY2hlY2tib3gnLFxuICAgICAgJ3JhZGlvJzogdGhpcy5wcm9wcy50eXBlID09PSAncmFkaW8nXG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJjaGVja2JveFJhZGlvV3JhcHBlclwifSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJXcmFwcGVyOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy53cmFwcGVyQ2xhc3NOYW1lID8gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnByb3BzLndyYXBwZXJDbGFzc05hbWUsIGtleTpcIndyYXBwZXJcIn0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJMYWJlbDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnY29udHJvbC1sYWJlbCc6ICF0aGlzLmlzQ2hlY2tib3hPclJhZGlvKClcbiAgICB9O1xuICAgIGNsYXNzZXNbdGhpcy5wcm9wcy5sYWJlbENsYXNzTmFtZV0gPSB0aGlzLnByb3BzLmxhYmVsQ2xhc3NOYW1lO1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMubGFiZWwgPyAoXG4gICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOnRoaXMucHJvcHMuaWQsIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwga2V5OlwibGFiZWxcIn0sIFxuICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgdGhpcy5wcm9wcy5sYWJlbFxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJGb3JtR3JvdXA6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2Zvcm0tZ3JvdXAnOiB0cnVlLFxuICAgICAgJ2hhcy1mZWVkYmFjayc6IHRoaXMucHJvcHMuaGFzRmVlZGJhY2ssXG4gICAgICAnaGFzLXN1Y2Nlc3MnOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdzdWNjZXNzJyxcbiAgICAgICdoYXMtd2FybmluZyc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3dhcm5pbmcnLFxuICAgICAgJ2hhcy1lcnJvcic6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ2Vycm9yJ1xuICAgIH07XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLmdyb3VwQ2xhc3NOYW1lXSA9IHRoaXMucHJvcHMuZ3JvdXBDbGFzc05hbWU7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNDaGVja2JveE9yUmFkaW8oKSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRm9ybUdyb3VwKFxuICAgICAgICB0aGlzLnJlbmRlcldyYXBwZXIoW1xuICAgICAgICAgIHRoaXMucmVuZGVyQ2hlY2tib3hhbmRSYWRpb1dyYXBwZXIoXG4gICAgICAgICAgICB0aGlzLnJlbmRlckxhYmVsKFxuICAgICAgICAgICAgICB0aGlzLnJlbmRlcklucHV0KClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVySGVscCgpXG4gICAgICAgIF0pXG4gICAgICApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlckZvcm1Hcm91cChbXG4gICAgICAgIHRoaXMucmVuZGVyTGFiZWwoKSxcbiAgICAgICAgdGhpcy5yZW5kZXJXcmFwcGVyKFtcbiAgICAgICAgICB0aGlzLnJlbmRlcklucHV0R3JvdXAoXG4gICAgICAgICAgICB0aGlzLnJlbmRlcklucHV0KClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVySWNvbigpLFxuICAgICAgICAgIHRoaXMucmVuZGVySGVscCgpXG4gICAgICAgIF0pXG4gICAgICBdKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0O1xuIiwiLy8gaHR0cHM6Ly93d3cubnBtanMub3JnL3BhY2thZ2UvcmVhY3QtaW50ZXJwb2xhdGUtY29tcG9uZW50XG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZScpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIFJFR0VYUCA9IC9cXCVcXCgoLis/KVxcKXMvO1xuXG52YXIgSW50ZXJwb2xhdGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGRpc3BsYXlOYW1lOiAnSW50ZXJwb2xhdGUnLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGZvcm1hdDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHsgY29tcG9uZW50OiBSZWFjdC5ET00uc3BhbiB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvcm1hdCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uaGFzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5jaGlsZHJlbikgPyB0aGlzLnByb3BzLmNoaWxkcmVuIDogdGhpcy5wcm9wcy5mb3JtYXQ7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMucHJvcHMuY29tcG9uZW50O1xuICAgIHZhciB1bnNhZmUgPSB0aGlzLnByb3BzLnVuc2FmZSA9PT0gdHJ1ZTtcbiAgICB2YXIgcHJvcHMgPSBtZXJnZSh0aGlzLnByb3BzKTtcblxuICAgIGRlbGV0ZSBwcm9wcy5jaGlsZHJlbjtcbiAgICBkZWxldGUgcHJvcHMuZm9ybWF0O1xuICAgIGRlbGV0ZSBwcm9wcy5jb21wb25lbnQ7XG4gICAgZGVsZXRlIHByb3BzLnVuc2FmZTtcblxuICAgIGlmICh1bnNhZmUpIHtcbiAgICAgIHZhciBjb250ZW50ID0gZm9ybWF0LnNwbGl0KFJFR0VYUCkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIG1hdGNoLCBpbmRleCkge1xuICAgICAgICB2YXIgaHRtbDtcblxuICAgICAgICBpZiAoaW5kZXggJSAyID09PSAwKSB7XG4gICAgICAgICAgaHRtbCA9IG1hdGNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGh0bWwgPSBwcm9wc1ttYXRjaF07XG4gICAgICAgICAgZGVsZXRlIHByb3BzW21hdGNoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGh0bWwpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaW50ZXJwb2xhdGUgYSBSZWFjdCBjb21wb25lbnQgaW50byB1bnNhZmUgdGV4dCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVtbyArPSBodG1sO1xuXG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgfSwgJycpO1xuXG4gICAgICBwcm9wcy5kYW5nZXJvdXNseVNldElubmVySFRNTCA9IHsgX19odG1sOiBjb250ZW50IH07XG5cbiAgICAgIHJldHVybiBwYXJlbnQocHJvcHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IGZvcm1hdC5zcGxpdChSRUdFWFApLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGNoaWxkO1xuXG4gICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICBpZiAobWF0Y2gubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZCA9IG1hdGNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoaWxkID0gcHJvcHNbbWF0Y2hdO1xuICAgICAgICAgIGRlbGV0ZSBwcm9wc1ttYXRjaF07XG4gICAgICAgIH1cblxuICAgICAgICBtZW1vLnB1c2goY2hpbGQpO1xuXG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgfSwgW3Byb3BzXSk7XG5cbiAgICAgIHJldHVybiBwYXJlbnQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcnBvbGF0ZTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxudmFyIEp1bWJvdHJvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0p1bWJvdHJvbicsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImp1bWJvdHJvblwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBKdW1ib3Ryb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgTGFiZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYWJlbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2xhYmVsJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0J1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMYWJlbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBNZW51SXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01lbnVJdGVtJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgaGVhZGVyOiAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpdmlkZXI6ICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBocmVmOiAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0aXRsZTogICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaHJlZjogJyMnXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYSgge29uQ2xpY2s6dGhpcy5oYW5kbGVDbGljaywgaHJlZjp0aGlzLnByb3BzLmhyZWYsIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsIHRhYkluZGV4OlwiLTFcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgJ2Ryb3Bkb3duLWhlYWRlcic6IHRoaXMucHJvcHMuaGVhZGVyLFxuICAgICAgICAnZGl2aWRlcic6IHRoaXMucHJvcHMuZGl2aWRlclxuICAgICAgfTtcblxuICAgIHZhciBjaGlsZHJlbiA9IG51bGw7XG4gICAgaWYgKHRoaXMucHJvcHMuaGVhZGVyKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMucHJvcHMuY2hpbGRyZW47XG4gICAgfSBlbHNlIGlmICghdGhpcy5wcm9wcy5kaXZpZGVyKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMucmVuZGVyQW5jaG9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7cm9sZTpcInByZXNlbnRhdGlvblwiLCB0aXRsZTpudWxsLCBocmVmOm51bGwsIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBGYWRlTWl4aW4gPSByZXF1aXJlKCcuL0ZhZGVNaXhpbicpO1xudmFyIEV2ZW50TGlzdGVuZXIgPSByZXF1aXJlKCcuL3V0aWxzL0V2ZW50TGlzdGVuZXInKTtcblxuXG4vLyBUT0RPOlxuLy8gLSBhcmlhLWxhYmVsbGVkYnlcbi8vIC0gQWRkIGBtb2RhbC1ib2R5YCBkaXYgaWYgb25seSBvbmUgY2hpbGQgcGFzc2VkIGluIHRoYXQgZG9lc24ndCBhbHJlYWR5IGhhdmUgaXRcbi8vIC0gVGVzdHNcblxudmFyIE1vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTW9kYWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgRmFkZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYmFja2Ryb3A6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3N0YXRpYycsIHRydWUsIGZhbHNlXSksXG4gICAga2V5Ym9hcmQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNsb3NlQnV0dG9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBhbmltYXRpb246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uUmVxdWVzdEhpZGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ21vZGFsJyxcbiAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAga2V5Ym9hcmQ6IHRydWUsXG4gICAgICBhbmltYXRpb246IHRydWUsXG4gICAgICBjbG9zZUJ1dHRvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1vZGFsU3R5bGUgPSB7ZGlzcGxheTogJ2Jsb2NrJ307XG4gICAgdmFyIGRpYWxvZ0NsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBkZWxldGUgZGlhbG9nQ2xhc3Nlcy5tb2RhbDtcbiAgICBkaWFsb2dDbGFzc2VzWydtb2RhbC1kaWFsb2cnXSA9IHRydWU7XG5cbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgZmFkZTogdGhpcy5wcm9wcy5hbmltYXRpb24sXG4gICAgICAnaW4nOiAhdGhpcy5wcm9wcy5hbmltYXRpb24gfHwgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGxcbiAgICB9O1xuXG4gICAgdmFyIG1vZGFsID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7dGl0bGU6bnVsbCxcbiAgICAgICAgdGFiSW5kZXg6XCItMVwiLFxuICAgICAgICByb2xlOlwiZGlhbG9nXCIsXG4gICAgICAgIHN0eWxlOm1vZGFsU3R5bGUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSxcbiAgICAgICAgb25DbGljazp0aGlzLnByb3BzLmJhY2tkcm9wID09PSB0cnVlID8gdGhpcy5oYW5kbGVCYWNrZHJvcENsaWNrIDogbnVsbCxcbiAgICAgICAgcmVmOlwibW9kYWxcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGRpYWxvZ0NsYXNzZXMpfSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWNvbnRlbnRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA/IHRoaXMucmVuZGVySGVhZGVyKCkgOiBudWxsLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5iYWNrZHJvcCA/XG4gICAgICB0aGlzLnJlbmRlckJhY2tkcm9wKG1vZGFsKSA6IG1vZGFsO1xuICB9LFxuXG4gIHJlbmRlckJhY2tkcm9wOiBmdW5jdGlvbiAobW9kYWwpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdtb2RhbC1iYWNrZHJvcCc6IHRydWUsXG4gICAgICAnZmFkZSc6IHRoaXMucHJvcHMuYW5pbWF0aW9uXG4gICAgfTtcblxuICAgIGNsYXNzZXNbJ2luJ10gPSAhdGhpcy5wcm9wcy5hbmltYXRpb24gfHwgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw7XG5cbiAgICB2YXIgb25DbGljayA9IHRoaXMucHJvcHMuYmFja2Ryb3AgPT09IHRydWUgP1xuICAgICAgdGhpcy5oYW5kbGVCYWNrZHJvcENsaWNrIDogbnVsbDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCByZWY6XCJiYWNrZHJvcFwiLCBvbkNsaWNrOm9uQ2xpY2t9ICksXG4gICAgICAgIG1vZGFsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJIZWFkZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xvc2VCdXR0b247XG4gICAgaWYgKHRoaXMucHJvcHMuY2xvc2VCdXR0b24pIHtcbiAgICAgIGNsb3NlQnV0dG9uID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImNsb3NlXCIsICdhcmlhLWhpZGRlbic6XCJ0cnVlXCIsIG9uQ2xpY2s6dGhpcy5wcm9wcy5vblJlcXVlc3RIaWRlfSwgXCLDl1wiKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgY2xvc2VCdXR0b24sXG4gICAgICAgIHRoaXMucmVuZGVyVGl0bGUoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuaXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLnRpdGxlKSA/XG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUgOiBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJtb2RhbC10aXRsZVwifSwgdGhpcy5wcm9wcy50aXRsZSlcbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuaGFuZGxlRG9jdW1lbnRLZXlVcCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lci5yZW1vdmUoKTtcbiAgfSxcblxuICBoYW5kbGVCYWNrZHJvcENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wcm9wcy5vblJlcXVlc3RIaWRlKCk7XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRLZXlVcDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5rZXlib2FyZCAmJiBlLmtleUNvZGUgPT09IDI3KSB7XG4gICAgICB0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGUoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIE92ZXJsYXlNaXhpbiA9IHJlcXVpcmUoJy4vT3ZlcmxheU1peGluJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcblxudmFyIE1vZGFsVHJpZ2dlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vZGFsVHJpZ2dlcicsXG4gIG1peGluczogW092ZXJsYXlNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgbW9kYWw6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNPdmVybGF5U2hvd246IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogdHJ1ZVxuICAgIH0pO1xuICB9LFxuXG4gIGhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiBmYWxzZVxuICAgIH0pO1xuICB9LFxuXG4gIHRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246ICF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93bikge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zcGFuKG51bGwgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICB0aGlzLnByb3BzLm1vZGFsLFxuICAgICAge1xuICAgICAgICBvblJlcXVlc3RIaWRlOiB0aGlzLmhpZGVcbiAgICAgIH1cbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZCA9IFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbik7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIG9uQ2xpY2s6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vbkNsaWNrLCB0aGlzLnRvZ2dsZSlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbFRyaWdnZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIENvbGxhcHNhYmxlTWl4aW4gPSByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcblxuXG52YXIgTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIENvbGxhcHNhYmxlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RhYnMnLCdwaWxscyddKSxcbiAgICBzdGFja2VkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBqdXN0aWZpZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdmJhcjogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ25hdidcbiAgICB9O1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnJlZnMudWwuZ2V0RE9NTm9kZSgpLFxuICAgICAgICBoZWlnaHQgPSBub2RlLm9mZnNldEhlaWdodCxcbiAgICAgICAgY29tcHV0ZWRTdHlsZXMgPSBkb21VdGlscy5nZXRDb21wdXRlZFN0eWxlcyhub2RlKTtcblxuICAgIHJldHVybiBoZWlnaHQgKyBwYXJzZUludChjb21wdXRlZFN0eWxlcy5tYXJnaW5Ub3AsIDEwKSArIHBhcnNlSW50KGNvbXB1dGVkU3R5bGVzLm1hcmdpbkJvdHRvbSwgMTApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IHRoaXMuZ2V0Q29sbGFwc2FibGVDbGFzc1NldCgpIDoge307XG5cbiAgICBjbGFzc2VzWyduYXZiYXItY29sbGFwc2UnXSA9IHRoaXMucHJvcHMuY29sbGFwc2FibGU7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5uYXZiYXIgJiYgIXRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyh0aGlzLnJlbmRlclVsKCkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5uYXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJVbCgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJVbDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICBjbGFzc2VzWyduYXYtc3RhY2tlZCddID0gdGhpcy5wcm9wcy5zdGFja2VkO1xuICAgIGNsYXNzZXNbJ25hdi1qdXN0aWZpZWQnXSA9IHRoaXMucHJvcHMuanVzdGlmaWVkO1xuICAgIGNsYXNzZXNbJ25hdmJhci1uYXYnXSA9IHRoaXMucHJvcHMubmF2YmFyO1xuICAgIGNsYXNzZXNbJ3B1bGwtcmlnaHQnXSA9IHRoaXMucHJvcHMucHVsbFJpZ2h0O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgcmVmOlwidWxcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck5hdkl0ZW0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBnZXRDaGlsZEFjdGl2ZVByb3A6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmtleSA9PT0gdGhpcy5wcm9wcy5hY3RpdmVLZXkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUhyZWYgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmhyZWYgPT09IHRoaXMucHJvcHMuYWN0aXZlSHJlZikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQucHJvcHMuYWN0aXZlO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBhY3RpdmU6IHRoaXMuZ2V0Q2hpbGRBY3RpdmVQcm9wKGNoaWxkKSxcbiAgICAgICAgYWN0aXZlS2V5OiB0aGlzLnByb3BzLmFjdGl2ZUtleSxcbiAgICAgICAgYWN0aXZlSHJlZjogdGhpcy5wcm9wcy5hY3RpdmVIcmVmLFxuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICBuYXZJdGVtOiB0cnVlXG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgTmF2SXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdkl0ZW0nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaHJlZjogJyMnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdhY3RpdmUnOiB0aGlzLnByb3BzLmFjdGl2ZSxcbiAgICAgICdkaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWRcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICAgIHtocmVmOnRoaXMucHJvcHMuaHJlZixcbiAgICAgICAgICB0aXRsZTp0aGlzLnByb3BzLnRpdGxlLFxuICAgICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVDbGljayxcbiAgICAgICAgICByZWY6XCJhbmNob3JcIn0sIFxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKCF0aGlzLnByb3BzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXksdGhpcy5wcm9wcy5ocmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgTmF2ID0gcmVxdWlyZSgnLi9OYXYnKTtcblxuXG52YXIgTmF2YmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2YmFyJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGZpeGVkVG9wOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBmaXhlZEJvdHRvbTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgc3RhdGljVG9wOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBpbnZlcnNlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBmbHVpZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcm9sZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzLFxuICAgIGJyYW5kOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICB0b2dnbGVCdXR0b246IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uVG9nZ2xlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBuYXZFeHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGVmYXVsdE5hdkV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbmF2YmFyJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0JyxcbiAgICAgIHJvbGU6ICduYXZpZ2F0aW9uJyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00ubmF2XG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmF2RXhwYW5kZWQ6IHRoaXMucHJvcHMuZGVmYXVsdE5hdkV4cGFuZGVkXG4gICAgfTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVUb2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblRvZ2dsZSkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uVG9nZ2xlKCk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBuYXZPcGVuOiAhdGhpcy5zdGF0ZS5uYXZPcGVuXG4gICAgfSk7XG4gIH0sXG5cbiAgaXNOYXZPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMubmF2T3BlbiAhPSBudWxsID8gdGhpcy5wcm9wcy5uYXZPcGVuIDogdGhpcy5zdGF0ZS5uYXZPcGVuO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIGNsYXNzZXNbJ25hdmJhci1maXhlZC10b3AnXSA9IHRoaXMucHJvcHMuZml4ZWRUb3A7XG4gICAgY2xhc3Nlc1snbmF2YmFyLWZpeGVkLWJvdHRvbSddID0gdGhpcy5wcm9wcy5maXhlZEJvdHRvbTtcbiAgICBjbGFzc2VzWyduYXZiYXItc3RhdGljLXRvcCddID0gdGhpcy5wcm9wcy5zdGF0aWNUb3A7XG4gICAgY2xhc3Nlc1snbmF2YmFyLWludmVyc2UnXSA9IHRoaXMucHJvcHMuaW52ZXJzZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6dGhpcy5wcm9wcy5mbHVpZCA/ICdjb250YWluZXItZmx1aWQnIDogJ2NvbnRhaW5lcid9LCBcbiAgICAgICAgICAodGhpcy5wcm9wcy5icmFuZCB8fCB0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiB8fCB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSkgPyB0aGlzLnJlbmRlckhlYWRlcigpIDogbnVsbCxcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckNoaWxkKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDaGlsZDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKGNoaWxkLCB7XG4gICAgICBuYXZiYXI6IHRydWUsXG4gICAgICBjb2xsYXBzYWJsZTogdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCAmJiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSA9PT0gY2hpbGQucHJvcHMua2V5LFxuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ICE9IG51bGwgJiYgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgPT09IGNoaWxkLnByb3BzLmtleSAmJiB0aGlzLmlzTmF2T3BlbigpLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBicmFuZDtcblxuICAgIGlmICh0aGlzLnByb3BzLmJyYW5kKSB7XG4gICAgICBicmFuZCA9IFJlYWN0LmlzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5icmFuZCkgP1xuICAgICAgICBjbG9uZVdpdGhQcm9wcyh0aGlzLnByb3BzLmJyYW5kLCB7XG4gICAgICAgICAgY2xhc3NOYW1lOiAnbmF2YmFyLWJyYW5kJ1xuICAgICAgICB9KSA6IFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwibmF2YmFyLWJyYW5kXCJ9LCB0aGlzLnByb3BzLmJyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm5hdmJhci1oZWFkZXJcIn0sIFxuICAgICAgICBicmFuZCxcbiAgICAgICAgKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIHx8IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ICE9IG51bGwpID8gdGhpcy5yZW5kZXJUb2dnbGVCdXR0b24oKSA6IG51bGxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclRvZ2dsZUJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZHJlbjtcblxuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uKSkge1xuICAgICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ25hdmJhci10b2dnbGUnLFxuICAgICAgICBvbkNsaWNrOiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVUb2dnbGUsIHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uLnByb3BzLm9uQ2xpY2spXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjaGlsZHJlbiA9ICh0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiAhPSBudWxsKSA/XG4gICAgICB0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiA6IFtcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzci1vbmx5XCIsIGtleTowfSwgXCJUb2dnbGUgbmF2aWdhdGlvblwiKSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpY29uLWJhclwiLCBrZXk6MX0pLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImljb24tYmFyXCIsIGtleToyfSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaWNvbi1iYXJcIiwga2V5OjN9KVxuICAgIF07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcIm5hdmJhci10b2dnbGVcIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlVG9nZ2xlfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2YmFyO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb3BUeXBlczoge1xuICAgIGNvbnRhaW5lcjogQ3VzdG9tUHJvcFR5cGVzLm1vdW50YWJsZVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb250YWluZXI6IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudC5ib2R5IDoge1xuICAgICAgICAvLyBJZiB3ZSBhcmUgaW4gYW4gZW52aXJvbm1lbnQgdGhhdCBkb2VzbnQgaGF2ZSBgZG9jdW1lbnRgIGRlZmluZWQgaXQgc2hvdWxkIGJlXG4gICAgICAgIC8vIHNhZmUgdG8gYXNzdW1lIHRoYXQgYGNvbXBvbmVudERpZE1vdW50YCB3aWxsIG5vdCBydW4gYW5kIHRoaXMgd2lsbCBiZSBuZWVkZWQsXG4gICAgICAgIC8vIGp1c3QgcHJvdmlkZSBlbm91Z2ggZmFrZSBBUEkgdG8gcGFzcyB0aGUgcHJvcFR5cGUgdmFsaWRhdGlvbi5cbiAgICAgICAgZ2V0RE9NTm9kZTogZnVuY3Rpb24gbm9vcCgpIHt9XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3VucmVuZGVyT3ZlcmxheSgpO1xuICAgIGlmICh0aGlzLl9vdmVybGF5VGFyZ2V0KSB7XG4gICAgICB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKVxuICAgICAgICAucmVtb3ZlQ2hpbGQodGhpcy5fb3ZlcmxheVRhcmdldCk7XG4gICAgICB0aGlzLl9vdmVybGF5VGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVuZGVyT3ZlcmxheSgpO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVuZGVyT3ZlcmxheSgpO1xuICB9LFxuXG4gIF9tb3VudE92ZXJsYXlUYXJnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vdmVybGF5VGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5nZXRDb250YWluZXJET01Ob2RlKClcbiAgICAgIC5hcHBlbmRDaGlsZCh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgfSxcblxuICBfcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5fb3ZlcmxheVRhcmdldCkge1xuICAgICAgdGhpcy5fbW91bnRPdmVybGF5VGFyZ2V0KCk7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSByZWZlcmVuY2UgdG8gaGVscCB0ZXN0aW5nXG4gICAgdGhpcy5fb3ZlcmxheUluc3RhbmNlID0gUmVhY3QucmVuZGVyQ29tcG9uZW50KHRoaXMucmVuZGVyT3ZlcmxheSgpLCB0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgfSxcblxuICBfdW5yZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgICB0aGlzLl9vdmVybGF5SW5zdGFuY2UgPSBudWxsO1xuICB9LFxuXG4gIGdldE92ZXJsYXlET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldE92ZXJsYXlET01Ob2RlKCk6IEEgY29tcG9uZW50IG11c3QgYmUgbW91bnRlZCB0byBoYXZlIGEgRE9NIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlJbnN0YW5jZS5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgZ2V0Q29udGFpbmVyRE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbnRhaW5lci5nZXRET01Ob2RlID9cbiAgICAgIHRoaXMucHJvcHMuY29udGFpbmVyLmdldERPTU5vZGUoKSA6IHRoaXMucHJvcHMuY29udGFpbmVyO1xuICB9XG59O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIE92ZXJsYXlNaXhpbiA9IHJlcXVpcmUoJy4vT3ZlcmxheU1peGluJyk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vdXRpbHMvbWVyZ2UnKTtcblxuLyoqXG4gKiBDaGVjayBpZiB2YWx1ZSBvbmUgaXMgaW5zaWRlIG9yIGVxdWFsIHRvIHRoZSBvZiB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvbmVcbiAqIEBwYXJhbSB7c3RyaW5nfGFycmF5fSBvZlxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzT25lT2Yob25lLCBvZikge1xuICBpZiAoQXJyYXkuaXNBcnJheShvZikpIHtcbiAgICByZXR1cm4gb2YuaW5kZXhPZihvbmUpID49IDA7XG4gIH1cbiAgcmV0dXJuIG9uZSA9PT0gb2Y7XG59XG5cbnZhciBPdmVybGF5VHJpZ2dlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ092ZXJsYXlUcmlnZ2VyJyxcbiAgbWl4aW5zOiBbT3ZlcmxheU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICB0cmlnZ2VyOiBSZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ21hbnVhbCcsICdjbGljaycsICdob3ZlcicsICdmb2N1cyddKSxcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5hcnJheU9mKFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ2NsaWNrJywgJ2hvdmVyJywgJ2ZvY3VzJ10pKVxuICAgIF0pLFxuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgZGVsYXk6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVsYXlTaG93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlbGF5SGlkZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWZhdWx0T3ZlcmxheVNob3duOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvdmVybGF5OiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZS5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIHRyaWdnZXI6IFsnaG92ZXInLCAnZm9jdXMnXVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0aGlzLnByb3BzLmRlZmF1bHRPdmVybGF5U2hvd24gPT0gbnVsbCA/XG4gICAgICAgIGZhbHNlIDogdGhpcy5wcm9wcy5kZWZhdWx0T3ZlcmxheVNob3duLFxuICAgICAgb3ZlcmxheUxlZnQ6IG51bGwsXG4gICAgICBvdmVybGF5VG9wOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogdHJ1ZVxuICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVPdmVybGF5UG9zaXRpb24oKTtcbiAgICB9KTtcbiAgfSxcblxuICBoaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogZmFsc2VcbiAgICB9KTtcbiAgfSxcblxuICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duID9cbiAgICAgIHRoaXMuaGlkZSgpIDogdGhpcy5zaG93KCk7XG4gIH0sXG5cbiAgcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93bikge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zcGFuKG51bGwgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICB0aGlzLnByb3BzLm92ZXJsYXksXG4gICAgICB7XG4gICAgICAgIG9uUmVxdWVzdEhpZGU6IHRoaXMuaGlkZSxcbiAgICAgICAgcGxhY2VtZW50OiB0aGlzLnByb3BzLnBsYWNlbWVudCxcbiAgICAgICAgcG9zaXRpb25MZWZ0OiB0aGlzLnN0YXRlLm92ZXJsYXlMZWZ0LFxuICAgICAgICBwb3NpdGlvblRvcDogdGhpcy5zdGF0ZS5vdmVybGF5VG9wXG4gICAgICB9XG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJvcHMgPSB7fTtcblxuICAgIGlmIChpc09uZU9mKCdjbGljaycsIHRoaXMucHJvcHMudHJpZ2dlcikpIHtcbiAgICAgIHByb3BzLm9uQ2xpY2sgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy50b2dnbGUsIHRoaXMucHJvcHMub25DbGljayk7XG4gICAgfVxuXG4gICAgaWYgKGlzT25lT2YoJ2hvdmVyJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25Nb3VzZU92ZXIgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkU2hvdywgdGhpcy5wcm9wcy5vbk1vdXNlT3Zlcik7XG4gICAgICBwcm9wcy5vbk1vdXNlT3V0ID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZEhpZGUsIHRoaXMucHJvcHMub25Nb3VzZU91dCk7XG4gICAgfVxuXG4gICAgaWYgKGlzT25lT2YoJ2ZvY3VzJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25Gb2N1cyA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRTaG93LCB0aGlzLnByb3BzLm9uRm9jdXMpO1xuICAgICAgcHJvcHMub25CbHVyID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZEhpZGUsIHRoaXMucHJvcHMub25CbHVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBSZWFjdC5DaGlsZHJlbi5vbmx5KHRoaXMucHJvcHMuY2hpbGRyZW4pLFxuICAgICAgcHJvcHNcbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faG92ZXJEZWxheSk7XG4gIH0sXG5cbiAgaGFuZGxlRGVsYXllZFNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faG92ZXJEZWxheSAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5faG92ZXJEZWxheSk7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGVsYXkgPSB0aGlzLnByb3BzLmRlbGF5U2hvdyAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMuZGVsYXlTaG93IDogdGhpcy5wcm9wcy5kZWxheTtcblxuICAgIGlmICghZGVsYXkpIHtcbiAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9LmJpbmQodGhpcyksIGRlbGF5KTtcbiAgfSxcblxuICBoYW5kbGVEZWxheWVkSGlkZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ob3ZlckRlbGF5ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkZWxheSA9IHRoaXMucHJvcHMuZGVsYXlIaWRlICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWxheUhpZGUgOiB0aGlzLnByb3BzLmRlbGF5O1xuXG4gICAgaWYgKCFkZWxheSkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faG92ZXJEZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0uYmluZCh0aGlzKSwgZGVsYXkpO1xuICB9LFxuXG4gIHVwZGF0ZU92ZXJsYXlQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBwb3MgPSB0aGlzLmNhbGNPdmVybGF5UG9zaXRpb24oKTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3ZlcmxheUxlZnQ6IHBvcy5sZWZ0LFxuICAgICAgb3ZlcmxheVRvcDogcG9zLnRvcFxuICAgIH0pO1xuICB9LFxuXG4gIGNhbGNPdmVybGF5UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGRPZmZzZXQgPSB0aGlzLmdldFBvc2l0aW9uKCk7XG5cbiAgICB2YXIgb3ZlcmxheU5vZGUgPSB0aGlzLmdldE92ZXJsYXlET01Ob2RlKCk7XG4gICAgdmFyIG92ZXJsYXlIZWlnaHQgPSBvdmVybGF5Tm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgdmFyIG92ZXJsYXlXaWR0aCA9IG92ZXJsYXlOb2RlLm9mZnNldFdpZHRoO1xuXG4gICAgc3dpdGNoICh0aGlzLnByb3BzLnBsYWNlbWVudCkge1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wICsgY2hpbGRPZmZzZXQuaGVpZ2h0IC8gMiAtIG92ZXJsYXlIZWlnaHQgLyAyLFxuICAgICAgICAgIGxlZnQ6IGNoaWxkT2Zmc2V0LmxlZnQgKyBjaGlsZE9mZnNldC53aWR0aFxuICAgICAgICB9O1xuICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQgLyAyIC0gb3ZlcmxheUhlaWdodCAvIDIsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCAtIG92ZXJsYXlXaWR0aFxuICAgICAgICB9O1xuICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCAtIG92ZXJsYXlIZWlnaHQsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoIC8gMiAtIG92ZXJsYXlXaWR0aCAvIDJcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoIC8gMiAtIG92ZXJsYXlXaWR0aCAvIDJcbiAgICAgICAgfTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsY092ZXJsYXlQb3NpdGlvbigpOiBObyBzdWNoIHBsYWNlbWVudCBvZiBcIicgKyB0aGlzLnByb3BzLnBsYWNlbWVudCArICdcIiBmb3VuZC4nKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKTtcblxuICAgIHZhciBvZmZzZXQgPSBjb250YWluZXIudGFnTmFtZSA9PSAnQk9EWScgP1xuICAgICAgZG9tVXRpbHMuZ2V0T2Zmc2V0KG5vZGUpIDogZG9tVXRpbHMuZ2V0UG9zaXRpb24obm9kZSwgY29udGFpbmVyKTtcblxuICAgIHJldHVybiBtZXJnZShvZmZzZXQsIHtcbiAgICAgIGhlaWdodDogbm9kZS5vZmZzZXRIZWlnaHQsXG4gICAgICB3aWR0aDogbm9kZS5vZmZzZXRXaWR0aFxuICAgIH0pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBPdmVybGF5VHJpZ2dlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbnZhciBQYWdlSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFnZUhlYWRlcicsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmgxKG51bGwsIHRoaXMucHJvcHMuY2hpbGRyZW4pXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZUhlYWRlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBQYWdlSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhZ2VJdGVtJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcHJldmlvdXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5leHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZCxcbiAgICAgICdwcmV2aW91cyc6IHRoaXMucHJvcHMucHJldmlvdXMsXG4gICAgICAnbmV4dCc6IHRoaXMucHJvcHMubmV4dFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVNlbGVjdCxcbiAgICAgICAgICByZWY6XCJhbmNob3JcIn0sIFxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5wcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5LCB0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZUl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG52YXIgUGFnZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYWdlcicsXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnVsKFxuICAgICAgICB7Y2xhc3NOYW1lOlwicGFnZXJcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlclBhZ2VJdGVtKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyUGFnZUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5XG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIENvbGxhcHNhYmxlTWl4aW4gPSByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKTtcblxudmFyIFBhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFuZWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgQ29sbGFwc2FibGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgaGVhZGVyOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBmb290ZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uQ2xpY2s6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwYW5lbCcsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCdcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5KTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGV4cGFuZGVkOiAhdGhpcy5zdGF0ZS5leHBhbmRlZFxuICAgIH0pO1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVmcy5ib2R5LmdldERPTU5vZGUoKS5vZmZzZXRIZWlnaHQ7XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpIHx8ICF0aGlzLnJlZnMgfHwgIXRoaXMucmVmcy5wYW5lbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVmcy5wYW5lbC5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBjbGFzc2VzWydwYW5lbCddID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGlkOnRoaXMucHJvcHMuY29sbGFwc2FibGUgPyBudWxsIDogdGhpcy5wcm9wcy5pZH0sIFxuICAgICAgICB0aGlzLnJlbmRlckhlYWRpbmcoKSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IHRoaXMucmVuZGVyQ29sbGFwc2FibGVCb2R5KCkgOiB0aGlzLnJlbmRlckJvZHkoKSxcbiAgICAgICAgdGhpcy5yZW5kZXJGb290ZXIoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29sbGFwc2FibGVCb2R5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRDb2xsYXBzYWJsZUNsYXNzU2V0KCdwYW5lbC1jb2xsYXBzZScpKSwgaWQ6dGhpcy5wcm9wcy5pZCwgcmVmOlwicGFuZWxcIn0sIFxuICAgICAgICB0aGlzLnJlbmRlckJvZHkoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQm9keTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwiLCByZWY6XCJib2R5XCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVySGVhZGluZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBoZWFkZXIgPSB0aGlzLnByb3BzLmhlYWRlcjtcblxuICAgIGlmICghaGVhZGVyKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIVJlYWN0LmlzVmFsaWRDb21wb25lbnQoaGVhZGVyKSB8fCBBcnJheS5pc0FycmF5KGhlYWRlcikpIHtcbiAgICAgIGhlYWRlciA9IHRoaXMucHJvcHMuY29sbGFwc2FibGUgP1xuICAgICAgICB0aGlzLnJlbmRlckNvbGxhcHNhYmxlVGl0bGUoaGVhZGVyKSA6IGhlYWRlcjtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIGhlYWRlciA9IGNsb25lV2l0aFByb3BzKGhlYWRlciwge1xuICAgICAgICBjbGFzc05hbWU6ICdwYW5lbC10aXRsZScsXG4gICAgICAgIGNoaWxkcmVuOiB0aGlzLnJlbmRlckFuY2hvcihoZWFkZXIucHJvcHMuY2hpbGRyZW4pXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVhZGVyID0gY2xvbmVXaXRoUHJvcHMoaGVhZGVyLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhbmVsLXRpdGxlJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1oZWFkaW5nXCJ9LCBcbiAgICAgICAgaGVhZGVyXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJBbmNob3I6IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgIHtocmVmOicjJyArICh0aGlzLnByb3BzLmlkIHx8ICcnKSxcbiAgICAgICAgY2xhc3NOYW1lOnRoaXMuaXNFeHBhbmRlZCgpID8gbnVsbCA6ICdjb2xsYXBzZWQnLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0fSwgXG4gICAgICAgIGhlYWRlclxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29sbGFwc2FibGVUaXRsZTogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJwYW5lbC10aXRsZVwifSwgXG4gICAgICAgIHRoaXMucmVuZGVyQW5jaG9yKGhlYWRlcilcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckZvb3RlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5wcm9wcy5mb290ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtZm9vdGVyXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5mb290ZXJcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgUGFuZWxHcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhbmVsR3JvdXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgY29sbGFwc2FibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFjdGl2ZUtleTogUmVhY3QuUHJvcFR5cGVzLmFueSxcbiAgICBkZWZhdWx0QWN0aXZlS2V5OiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAncGFuZWwtZ3JvdXAnXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZUtleSA9IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVLZXk6IGRlZmF1bHRBY3RpdmVLZXlcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRCc0NsYXNzU2V0KCkpfSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFuZWwpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQYW5lbDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIGFjdGl2ZUtleSA9XG4gICAgICB0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVLZXkgOiB0aGlzLnN0YXRlLmFjdGl2ZUtleTtcblxuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIGJzU3R5bGU6IGNoaWxkLnByb3BzLmJzU3R5bGUgfHwgdGhpcy5wcm9wcy5ic1N0eWxlLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY2NvcmRpb24pIHtcbiAgICAgIHByb3BzLmNvbGxhcHNhYmxlID0gdHJ1ZTtcbiAgICAgIHByb3BzLmV4cGFuZGVkID0gKGNoaWxkLnByb3BzLmtleSA9PT0gYWN0aXZlS2V5KTtcbiAgICAgIHByb3BzLm9uU2VsZWN0ID0gdGhpcy5oYW5kbGVTZWxlY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICBwcm9wc1xuICAgICk7XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAvLyBEZWZlciBhbnkgdXBkYXRlcyB0byB0aGlzIGNvbXBvbmVudCBkdXJpbmcgdGhlIGBvblNlbGVjdGAgaGFuZGxlci5cbiAgICByZXR1cm4gIXRoaXMuX2lzQ2hhbmdpbmc7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0YXRlLmFjdGl2ZUtleSA9PT0ga2V5KSB7XG4gICAgICBrZXkgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgYWN0aXZlS2V5OiBrZXlcbiAgICB9KTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxHcm91cDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIFBvcG92ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQb3BvdmVyJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgcG9zaXRpb25MZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHBvc2l0aW9uVG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0TGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldFRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuICAgIGNsYXNzZXNbJ3BvcG92ZXInXSA9IHRydWU7XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLnBsYWNlbWVudF0gPSB0cnVlO1xuICAgIGNsYXNzZXNbJ2luJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdCAhPSBudWxsIHx8IHRoaXMucHJvcHMucG9zaXRpb25Ub3AgIT0gbnVsbDtcblxuICAgIHZhciBzdHlsZSA9IHt9O1xuICAgIHN0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdDtcbiAgICBzdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uVG9wO1xuICAgIHN0eWxlWydkaXNwbGF5J10gPSAnYmxvY2snO1xuXG4gICAgdmFyIGFycm93U3R5bGUgPSB7fTtcbiAgICBhcnJvd1N0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0TGVmdDtcbiAgICBhcnJvd1N0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRUb3A7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgc3R5bGU6c3R5bGV9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFycm93XCIsIHN0eWxlOmFycm93U3R5bGV9ICksXG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUgPyB0aGlzLnJlbmRlclRpdGxlKCkgOiBudWxsLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicG9wb3Zlci1jb250ZW50XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVGl0bGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uaDMoIHtjbGFzc05hbWU6XCJwb3BvdmVyLXRpdGxlXCJ9LCB0aGlzLnByb3BzLnRpdGxlKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvcG92ZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEludGVycG9sYXRlID0gcmVxdWlyZSgnLi9JbnRlcnBvbGF0ZScpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxuXG52YXIgUHJvZ3Jlc3NCYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcm9ncmVzc0JhcicsXG4gIHByb3BUeXBlczoge1xuICAgIG1pbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBub3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBzck9ubHk6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHN0cmlwZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwcm9ncmVzcy1iYXInLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiAxMDBcbiAgICB9O1xuICB9LFxuXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uIChub3csIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgobm93IC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgcHJvZ3Jlc3M6IHRydWVcbiAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIGNsYXNzZXNbJ3Byb2dyZXNzLXN0cmlwZWQnXSA9IHRydWU7XG4gICAgICBjbGFzc2VzWydhY3RpdmUnXSA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnN0cmlwZWQpIHtcbiAgICAgIGNsYXNzZXNbJ3Byb2dyZXNzLXN0cmlwZWQnXSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFWYWxpZENvbXBvbmVudENoaWxkcmVuLmhhc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuY2hpbGRyZW4pKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMuaXNDaGlsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJQcm9ncmVzc0JhcigpXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgICAgIHRoaXMucmVuZGVyUHJvZ3Jlc3NCYXIoKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckNoaWxkQmFyKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJDaGlsZEJhcjogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKGNoaWxkLCB7XG4gICAgICBpc0NoaWxkOiB0cnVlLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlclByb2dyZXNzQmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBlcmNlbnRhZ2UgPSB0aGlzLmdldFBlcmNlbnRhZ2UoXG4gICAgICAgIHRoaXMucHJvcHMubm93LFxuICAgICAgICB0aGlzLnByb3BzLm1pbixcbiAgICAgICAgdGhpcy5wcm9wcy5tYXhcbiAgICAgICk7XG5cbiAgICB2YXIgbGFiZWw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMubGFiZWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5yZW5kZXJMYWJlbChwZXJjZW50YWdlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMubGFiZWwpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wcm9wcy5sYWJlbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5zck9ubHkpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5yZW5kZXJTY3JlZW5SZWFkZXJPbmx5TGFiZWwobGFiZWwpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KHRoaXMuZ2V0QnNDbGFzc1NldCgpKSwgcm9sZTpcInByb2dyZXNzYmFyXCIsXG4gICAgICAgIHN0eWxlOnt3aWR0aDogcGVyY2VudGFnZSArICclJ30sXG4gICAgICAgICdhcmlhLXZhbHVlbm93Jzp0aGlzLnByb3BzLm5vdyxcbiAgICAgICAgJ2FyaWEtdmFsdWVtaW4nOnRoaXMucHJvcHMubWluLFxuICAgICAgICAnYXJpYS12YWx1ZW1heCc6dGhpcy5wcm9wcy5tYXh9LCBcbiAgICAgICAgbGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckxhYmVsOiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xuICAgIHZhciBJbnRlcnBvbGF0ZUNsYXNzID0gdGhpcy5wcm9wcy5pbnRlcnBvbGF0ZUNsYXNzIHx8IEludGVycG9sYXRlO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIEludGVycG9sYXRlQ2xhc3MoXG4gICAgICAgIHtub3c6dGhpcy5wcm9wcy5ub3csXG4gICAgICAgIG1pbjp0aGlzLnByb3BzLm1pbixcbiAgICAgICAgbWF4OnRoaXMucHJvcHMubWF4LFxuICAgICAgICBwZXJjZW50OnBlcmNlbnRhZ2UsXG4gICAgICAgIGJzU3R5bGU6dGhpcy5wcm9wcy5ic1N0eWxlfSwgXG4gICAgICAgIHRoaXMucHJvcHMubGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclNjcmVlblJlYWRlck9ubHlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3Itb25seVwifSwgXG4gICAgICAgIGxhYmVsXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvZ3Jlc3NCYXI7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxuXG52YXIgUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUm93JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdzsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0gcmVxdWlyZSgnLi9Ecm9wZG93blN0YXRlTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xudmFyIEJ1dHRvbkdyb3VwID0gcmVxdWlyZSgnLi9CdXR0b25Hcm91cCcpO1xudmFyIERyb3Bkb3duTWVudSA9IHJlcXVpcmUoJy4vRHJvcGRvd25NZW51Jyk7XG5cbnZhciBTcGxpdEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NwbGl0QnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIERyb3Bkb3duU3RhdGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiAgICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgdGl0bGU6ICAgICAgICAgUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaHJlZjogICAgICAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBkcm9wZG93blRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBvbkNsaWNrOiAgICAgICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblNlbGVjdDogICAgICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkaXNhYmxlZDogICAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkcm9wZG93blRpdGxlOiAnVG9nZ2xlIGRyb3Bkb3duJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdyb3VwQ2xhc3NlcyA9IHtcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHZhciBidXR0b24gPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIEJ1dHRvbihcbiAgICAgICAge3JlZjpcImJ1dHRvblwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlQnV0dG9uQ2xpY2ssXG4gICAgICAgIHRpdGxlOm51bGwsXG4gICAgICAgIGlkOm51bGx9LCBcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZVxuICAgICAgKVxuICAgICk7XG5cbiAgICB2YXIgZHJvcGRvd25CdXR0b24gPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIEJ1dHRvbihcbiAgICAgICAge3JlZjpcImRyb3Bkb3duQnV0dG9uXCIsXG4gICAgICAgIGNsYXNzTmFtZTpcImRyb3Bkb3duLXRvZ2dsZVwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlRHJvcGRvd25DbGljayxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgaWQ6bnVsbH0sIFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcInNyLW9ubHlcIn0sIHRoaXMucHJvcHMuZHJvcGRvd25UaXRsZSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiY2FyZXRcIn0gKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgQnV0dG9uR3JvdXAoXG4gICAgICAgIHtic1NpemU6dGhpcy5wcm9wcy5ic1NpemUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChncm91cENsYXNzZXMpLFxuICAgICAgICBpZDp0aGlzLnByb3BzLmlkfSwgXG4gICAgICAgIGJ1dHRvbixcbiAgICAgICAgZHJvcGRvd25CdXR0b24sXG4gICAgICAgIERyb3Bkb3duTWVudShcbiAgICAgICAgICB7cmVmOlwibWVudVwiLFxuICAgICAgICAgIG9uU2VsZWN0OnRoaXMuaGFuZGxlT3B0aW9uU2VsZWN0LFxuICAgICAgICAgICdhcmlhLWxhYmVsbGVkYnknOnRoaXMucHJvcHMuaWQsXG4gICAgICAgICAgcHVsbFJpZ2h0OnRoaXMucHJvcHMucHVsbFJpZ2h0fSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVCdXR0b25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5vcGVuKSB7XG4gICAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgIHRoaXMucHJvcHMub25DbGljayhlKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlRHJvcGRvd25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoIXRoaXMuc3RhdGUub3Blbik7XG4gIH0sXG5cbiAgaGFuZGxlT3B0aW9uU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxpdEJ1dHRvbjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgU3ViTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU3ViTmF2JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBocmVmOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRleHQ6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICduYXYnXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIXRoaXMucHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSwgdGhpcy5wcm9wcy5ocmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaXNBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0NoaWxkQWN0aXZlKHRoaXMpO1xuICB9LFxuXG4gIGlzQ2hpbGRBY3RpdmU6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsICYmIHRoaXMucHJvcHMuYWN0aXZlS2V5ID09PSBjaGlsZC5wcm9wcy5rZXkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUhyZWYgIT0gbnVsbCAmJiB0aGlzLnByb3BzLmFjdGl2ZUhyZWYgPT09IGNoaWxkLnByb3BzLmhyZWYpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjaGlsZC5wcm9wcy5jaGlsZHJlbikge1xuICAgICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uZm9yRWFjaChcbiAgICAgICAgY2hpbGQucHJvcHMuY2hpbGRyZW4sXG4gICAgICAgIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICAgIGlmICh0aGlzLmlzQ2hpbGRBY3RpdmUoY2hpbGQpKSB7XG4gICAgICAgICAgICBpc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aGlzXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gaXNBY3RpdmU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGdldENoaWxkQWN0aXZlUHJvcDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMuaHJlZiA9PT0gdGhpcy5wcm9wcy5hY3RpdmVIcmVmKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjaGlsZC5wcm9wcy5hY3RpdmU7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnYWN0aXZlJzogdGhpcy5pc0FjdGl2ZSgpLFxuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZUNsaWNrLFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy50ZXh0XG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcIm5hdlwifSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJOYXZJdGVtKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgYWN0aXZlOiB0aGlzLmdldENoaWxkQWN0aXZlUHJvcChjaGlsZCksXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdWJOYXY7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgVGFiUGFuZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYlBhbmUnLFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0ZUluOiBmYWxzZSxcbiAgICAgIGFuaW1hdGVPdXQ6IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuYW5pbWF0aW9uKSB7XG4gICAgICBpZiAoIXRoaXMuc3RhdGUuYW5pbWF0ZUluICYmIG5leHRQcm9wcy5hY3RpdmUgJiYgIXRoaXMucHJvcHMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGFuaW1hdGVJbjogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhdGUuYW5pbWF0ZU91dCAmJiAhbmV4dFByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFjdGl2ZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBhbmltYXRlT3V0OiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5hbmltYXRlSW4pIHtcbiAgICAgIHNldFRpbWVvdXQodGhpcy5zdGFydEFuaW1hdGVJbiwgMCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlLmFuaW1hdGVPdXQpIHtcbiAgICAgIFRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5nZXRET01Ob2RlKCksXG4gICAgICAgIHRoaXMuc3RvcEFuaW1hdGVPdXRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHN0YXJ0QW5pbWF0ZUluOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhbmltYXRlSW46IGZhbHNlXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcEFuaW1hdGVPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFuaW1hdGVPdXQ6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICd0YWItcGFuZSc6IHRydWUsXG4gICAgICAnZmFkZSc6IHRydWUsXG4gICAgICAnYWN0aXZlJzogdGhpcy5wcm9wcy5hY3RpdmUgfHwgdGhpcy5zdGF0ZS5hbmltYXRlT3V0LFxuICAgICAgJ2luJzogdGhpcy5wcm9wcy5hY3RpdmUgJiYgIXRoaXMuc3RhdGUuYW5pbWF0ZUluXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYlBhbmU7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBOYXYgPSByZXF1aXJlKCcuL05hdicpO1xudmFyIE5hdkl0ZW0gPSByZXF1aXJlKCcuL05hdkl0ZW0nKTtcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFjdGl2ZUtleUZyb21DaGlsZHJlbihjaGlsZHJlbikge1xuICB2YXIgZGVmYXVsdEFjdGl2ZUtleTtcblxuICBWYWxpZENvbXBvbmVudENoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKGRlZmF1bHRBY3RpdmVLZXkgPT0gbnVsbCkge1xuICAgICAgZGVmYXVsdEFjdGl2ZUtleSA9IGNoaWxkLnByb3BzLmtleTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZhdWx0QWN0aXZlS2V5O1xufVxuXG52YXIgVGFiYmVkQXJlYSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYmJlZEFyZWEnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndGFicycsJ3BpbGxzJ10pLFxuICAgIGFuaW1hdGlvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzU3R5bGU6IFwidGFic1wiLFxuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZUtleSA9IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleSAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleSA6IGdldERlZmF1bHRBY3RpdmVLZXlGcm9tQ2hpbGRyZW4odGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICAvLyBUT0RPOiBJbiBfX0RFVl9fIG1vZGUgd2FybiB2aWEgYGNvbnNvbGUud2FybmAgaWYgbm8gYGRlZmF1bHRBY3RpdmVLZXlgIGhhc1xuICAgIC8vIGJlZW4gc2V0IGJ5IHRoaXMgcG9pbnQsIGludmFsaWQgY2hpbGRyZW4gb3IgbWlzc2luZyBrZXkgcHJvcGVydGllcyBhcmUgbGlrZWx5IHRoZSBjYXVzZS5cblxuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVLZXk6IGRlZmF1bHRBY3RpdmVLZXksXG4gICAgICBwcmV2aW91c0FjdGl2ZUtleTogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIGlmIChuZXh0UHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgJiYgbmV4dFByb3BzLmFjdGl2ZUtleSAhPT0gdGhpcy5wcm9wcy5hY3RpdmVLZXkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwcmV2aW91c0FjdGl2ZUtleTogdGhpcy5wcm9wcy5hY3RpdmVLZXlcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVQYW5lQW5pbWF0ZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IG51bGxcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID1cbiAgICAgIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuXG4gICAgZnVuY3Rpb24gcmVuZGVyVGFiSWZTZXQoY2hpbGQpIHtcbiAgICAgIHJldHVybiBjaGlsZC5wcm9wcy50YWIgIT0gbnVsbCA/IHRoaXMucmVuZGVyVGFiKGNoaWxkKSA6IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG5hdiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgTmF2KCB7YWN0aXZlS2V5OmFjdGl2ZUtleSwgb25TZWxlY3Q6dGhpcy5oYW5kbGVTZWxlY3QsIHJlZjpcInRhYnNcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCByZW5kZXJUYWJJZlNldCwgdGhpcylcbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIG5hdixcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2lkOnRoaXMucHJvcHMuaWQsIGNsYXNzTmFtZTpcInRhYi1jb250ZW50XCIsIHJlZjpcInBhbmVzXCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlclBhbmUpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldEFjdGl2ZUtleTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVLZXkgOiB0aGlzLnN0YXRlLmFjdGl2ZUtleTtcbiAgfSxcblxuICByZW5kZXJQYW5lOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID0gdGhpcy5nZXRBY3RpdmVLZXkoKTtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIHtcbiAgICAgICAgICBhY3RpdmU6IChjaGlsZC5wcm9wcy5rZXkgPT09IGFjdGl2ZUtleSAmJlxuICAgICAgICAgICAgKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkgPT0gbnVsbCB8fCAhdGhpcy5wcm9wcy5hbmltYXRpb24pKSxcbiAgICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgICBhbmltYXRpb246IHRoaXMucHJvcHMuYW5pbWF0aW9uLFxuICAgICAgICAgIG9uQW5pbWF0ZU91dEVuZDogKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkgIT0gbnVsbCAmJlxuICAgICAgICAgICAgY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlS2V5KSA/IHRoaXMuaGFuZGxlUGFuZUFuaW1hdGVPdXRFbmQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgfSxcblxuICByZW5kZXJUYWI6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHZhciBrZXkgPSBjaGlsZC5wcm9wcy5rZXk7XG4gICAgcmV0dXJuIChcbiAgICAgIE5hdkl0ZW0oXG4gICAgICAgIHtyZWY6J3RhYicgKyBrZXksXG4gICAgICAgIGtleTprZXl9LCBcbiAgICAgICAgY2hpbGQucHJvcHMudGFiXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChrZXkgIT09IHRoaXMuZ2V0QWN0aXZlS2V5KCkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhY3RpdmVLZXk6IGtleSxcbiAgICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IHRoaXMuZ2V0QWN0aXZlS2V5KClcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFiYmVkQXJlYTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYmxlJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgc3RyaXBlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYm9yZGVyZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbmRlbnNlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaG92ZXI6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHJlc3BvbnNpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAndGFibGUnOiB0cnVlLFxuICAgICAgJ3RhYmxlLXN0cmlwZWQnOiB0aGlzLnByb3BzLnN0cmlwZWQsXG4gICAgICAndGFibGUtYm9yZGVyZWQnOiB0aGlzLnByb3BzLmJvcmRlcmVkLFxuICAgICAgJ3RhYmxlLWNvbmRlbnNlZCc6IHRoaXMucHJvcHMuY29uZGVuc2VkLFxuICAgICAgJ3RhYmxlLWhvdmVyJzogdGhpcy5wcm9wcy5ob3ZlclxuICAgIH07XG4gICAgdmFyIHRhYmxlID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00udGFibGUoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5yZXNwb25zaXZlID8gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhYmxlLXJlc3BvbnNpdmVcIn0sIFxuICAgICAgICB0YWJsZVxuICAgICAgKVxuICAgICkgOiB0YWJsZTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFibGU7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBUb29sdGlwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVG9vbHRpcCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwbGFjZW1lbnQ6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RvcCcsJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J10pLFxuICAgIHBvc2l0aW9uTGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBwb3NpdGlvblRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldExlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRUb3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuICAgIGNsYXNzZXNbJ3Rvb2x0aXAnXSA9IHRydWU7XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLnBsYWNlbWVudF0gPSB0cnVlO1xuICAgIGNsYXNzZXNbJ2luJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdCAhPSBudWxsIHx8IHRoaXMucHJvcHMucG9zaXRpb25Ub3AgIT0gbnVsbDtcblxuICAgIHZhciBzdHlsZSA9IHt9O1xuICAgIHN0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdDtcbiAgICBzdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uVG9wO1xuXG4gICAgdmFyIGFycm93U3R5bGUgPSB7fTtcbiAgICBhcnJvd1N0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0TGVmdDtcbiAgICBhcnJvd1N0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRUb3A7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBzdHlsZTpzdHlsZX0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0b29sdGlwLWFycm93XCIsIHN0eWxlOmFycm93U3R5bGV9ICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRvb2x0aXAtaW5uZXJcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9vbHRpcDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBXZWxsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnV2VsbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3dlbGwnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gV2VsbDsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ0xBU1NFUzoge1xuICAgICdhbGVydCc6ICdhbGVydCcsXG4gICAgJ2J1dHRvbic6ICdidG4nLFxuICAgICdidXR0b24tZ3JvdXAnOiAnYnRuLWdyb3VwJyxcbiAgICAnYnV0dG9uLXRvb2xiYXInOiAnYnRuLXRvb2xiYXInLFxuICAgICdjb2x1bW4nOiAnY29sJyxcbiAgICAnaW5wdXQtZ3JvdXAnOiAnaW5wdXQtZ3JvdXAnLFxuICAgICdmb3JtJzogJ2Zvcm0nLFxuICAgICdnbHlwaGljb24nOiAnZ2x5cGhpY29uJyxcbiAgICAnbGFiZWwnOiAnbGFiZWwnLFxuICAgICdwYW5lbCc6ICdwYW5lbCcsXG4gICAgJ3BhbmVsLWdyb3VwJzogJ3BhbmVsLWdyb3VwJyxcbiAgICAncHJvZ3Jlc3MtYmFyJzogJ3Byb2dyZXNzLWJhcicsXG4gICAgJ25hdic6ICduYXYnLFxuICAgICduYXZiYXInOiAnbmF2YmFyJyxcbiAgICAnbW9kYWwnOiAnbW9kYWwnLFxuICAgICdyb3cnOiAncm93JyxcbiAgICAnd2VsbCc6ICd3ZWxsJ1xuICB9LFxuICBTVFlMRVM6IHtcbiAgICAnZGVmYXVsdCc6ICdkZWZhdWx0JyxcbiAgICAncHJpbWFyeSc6ICdwcmltYXJ5JyxcbiAgICAnc3VjY2Vzcyc6ICdzdWNjZXNzJyxcbiAgICAnaW5mbyc6ICdpbmZvJyxcbiAgICAnd2FybmluZyc6ICd3YXJuaW5nJyxcbiAgICAnZGFuZ2VyJzogJ2RhbmdlcicsXG4gICAgJ2xpbmsnOiAnbGluaycsXG4gICAgJ2lubGluZSc6ICdpbmxpbmUnLFxuICAgICd0YWJzJzogJ3RhYnMnLFxuICAgICdwaWxscyc6ICdwaWxscydcbiAgfSxcbiAgU0laRVM6IHtcbiAgICAnbGFyZ2UnOiAnbGcnLFxuICAgICdtZWRpdW0nOiAnbWQnLFxuICAgICdzbWFsbCc6ICdzbScsXG4gICAgJ3hzbWFsbCc6ICd4cydcbiAgfSxcbiAgR0xZUEhTOiBbXG4gICAgJ2FzdGVyaXNrJyxcbiAgICAncGx1cycsXG4gICAgJ2V1cm8nLFxuICAgICdtaW51cycsXG4gICAgJ2Nsb3VkJyxcbiAgICAnZW52ZWxvcGUnLFxuICAgICdwZW5jaWwnLFxuICAgICdnbGFzcycsXG4gICAgJ211c2ljJyxcbiAgICAnc2VhcmNoJyxcbiAgICAnaGVhcnQnLFxuICAgICdzdGFyJyxcbiAgICAnc3Rhci1lbXB0eScsXG4gICAgJ3VzZXInLFxuICAgICdmaWxtJyxcbiAgICAndGgtbGFyZ2UnLFxuICAgICd0aCcsXG4gICAgJ3RoLWxpc3QnLFxuICAgICdvaycsXG4gICAgJ3JlbW92ZScsXG4gICAgJ3pvb20taW4nLFxuICAgICd6b29tLW91dCcsXG4gICAgJ29mZicsXG4gICAgJ3NpZ25hbCcsXG4gICAgJ2NvZycsXG4gICAgJ3RyYXNoJyxcbiAgICAnaG9tZScsXG4gICAgJ2ZpbGUnLFxuICAgICd0aW1lJyxcbiAgICAncm9hZCcsXG4gICAgJ2Rvd25sb2FkLWFsdCcsXG4gICAgJ2Rvd25sb2FkJyxcbiAgICAndXBsb2FkJyxcbiAgICAnaW5ib3gnLFxuICAgICdwbGF5LWNpcmNsZScsXG4gICAgJ3JlcGVhdCcsXG4gICAgJ3JlZnJlc2gnLFxuICAgICdsaXN0LWFsdCcsXG4gICAgJ2xvY2snLFxuICAgICdmbGFnJyxcbiAgICAnaGVhZHBob25lcycsXG4gICAgJ3ZvbHVtZS1vZmYnLFxuICAgICd2b2x1bWUtZG93bicsXG4gICAgJ3ZvbHVtZS11cCcsXG4gICAgJ3FyY29kZScsXG4gICAgJ2JhcmNvZGUnLFxuICAgICd0YWcnLFxuICAgICd0YWdzJyxcbiAgICAnYm9vaycsXG4gICAgJ2Jvb2ttYXJrJyxcbiAgICAncHJpbnQnLFxuICAgICdjYW1lcmEnLFxuICAgICdmb250JyxcbiAgICAnYm9sZCcsXG4gICAgJ2l0YWxpYycsXG4gICAgJ3RleHQtaGVpZ2h0JyxcbiAgICAndGV4dC13aWR0aCcsXG4gICAgJ2FsaWduLWxlZnQnLFxuICAgICdhbGlnbi1jZW50ZXInLFxuICAgICdhbGlnbi1yaWdodCcsXG4gICAgJ2FsaWduLWp1c3RpZnknLFxuICAgICdsaXN0JyxcbiAgICAnaW5kZW50LWxlZnQnLFxuICAgICdpbmRlbnQtcmlnaHQnLFxuICAgICdmYWNldGltZS12aWRlbycsXG4gICAgJ3BpY3R1cmUnLFxuICAgICdtYXAtbWFya2VyJyxcbiAgICAnYWRqdXN0JyxcbiAgICAndGludCcsXG4gICAgJ2VkaXQnLFxuICAgICdzaGFyZScsXG4gICAgJ2NoZWNrJyxcbiAgICAnbW92ZScsXG4gICAgJ3N0ZXAtYmFja3dhcmQnLFxuICAgICdmYXN0LWJhY2t3YXJkJyxcbiAgICAnYmFja3dhcmQnLFxuICAgICdwbGF5JyxcbiAgICAncGF1c2UnLFxuICAgICdzdG9wJyxcbiAgICAnZm9yd2FyZCcsXG4gICAgJ2Zhc3QtZm9yd2FyZCcsXG4gICAgJ3N0ZXAtZm9yd2FyZCcsXG4gICAgJ2VqZWN0JyxcbiAgICAnY2hldnJvbi1sZWZ0JyxcbiAgICAnY2hldnJvbi1yaWdodCcsXG4gICAgJ3BsdXMtc2lnbicsXG4gICAgJ21pbnVzLXNpZ24nLFxuICAgICdyZW1vdmUtc2lnbicsXG4gICAgJ29rLXNpZ24nLFxuICAgICdxdWVzdGlvbi1zaWduJyxcbiAgICAnaW5mby1zaWduJyxcbiAgICAnc2NyZWVuc2hvdCcsXG4gICAgJ3JlbW92ZS1jaXJjbGUnLFxuICAgICdvay1jaXJjbGUnLFxuICAgICdiYW4tY2lyY2xlJyxcbiAgICAnYXJyb3ctbGVmdCcsXG4gICAgJ2Fycm93LXJpZ2h0JyxcbiAgICAnYXJyb3ctdXAnLFxuICAgICdhcnJvdy1kb3duJyxcbiAgICAnc2hhcmUtYWx0JyxcbiAgICAncmVzaXplLWZ1bGwnLFxuICAgICdyZXNpemUtc21hbGwnLFxuICAgICdleGNsYW1hdGlvbi1zaWduJyxcbiAgICAnZ2lmdCcsXG4gICAgJ2xlYWYnLFxuICAgICdmaXJlJyxcbiAgICAnZXllLW9wZW4nLFxuICAgICdleWUtY2xvc2UnLFxuICAgICd3YXJuaW5nLXNpZ24nLFxuICAgICdwbGFuZScsXG4gICAgJ2NhbGVuZGFyJyxcbiAgICAncmFuZG9tJyxcbiAgICAnY29tbWVudCcsXG4gICAgJ21hZ25ldCcsXG4gICAgJ2NoZXZyb24tdXAnLFxuICAgICdjaGV2cm9uLWRvd24nLFxuICAgICdyZXR3ZWV0JyxcbiAgICAnc2hvcHBpbmctY2FydCcsXG4gICAgJ2ZvbGRlci1jbG9zZScsXG4gICAgJ2ZvbGRlci1vcGVuJyxcbiAgICAncmVzaXplLXZlcnRpY2FsJyxcbiAgICAncmVzaXplLWhvcml6b250YWwnLFxuICAgICdoZGQnLFxuICAgICdidWxsaG9ybicsXG4gICAgJ2JlbGwnLFxuICAgICdjZXJ0aWZpY2F0ZScsXG4gICAgJ3RodW1icy11cCcsXG4gICAgJ3RodW1icy1kb3duJyxcbiAgICAnaGFuZC1yaWdodCcsXG4gICAgJ2hhbmQtbGVmdCcsXG4gICAgJ2hhbmQtdXAnLFxuICAgICdoYW5kLWRvd24nLFxuICAgICdjaXJjbGUtYXJyb3ctcmlnaHQnLFxuICAgICdjaXJjbGUtYXJyb3ctbGVmdCcsXG4gICAgJ2NpcmNsZS1hcnJvdy11cCcsXG4gICAgJ2NpcmNsZS1hcnJvdy1kb3duJyxcbiAgICAnZ2xvYmUnLFxuICAgICd3cmVuY2gnLFxuICAgICd0YXNrcycsXG4gICAgJ2ZpbHRlcicsXG4gICAgJ2JyaWVmY2FzZScsXG4gICAgJ2Z1bGxzY3JlZW4nLFxuICAgICdkYXNoYm9hcmQnLFxuICAgICdwYXBlcmNsaXAnLFxuICAgICdoZWFydC1lbXB0eScsXG4gICAgJ2xpbmsnLFxuICAgICdwaG9uZScsXG4gICAgJ3B1c2hwaW4nLFxuICAgICd1c2QnLFxuICAgICdnYnAnLFxuICAgICdzb3J0JyxcbiAgICAnc29ydC1ieS1hbHBoYWJldCcsXG4gICAgJ3NvcnQtYnktYWxwaGFiZXQtYWx0JyxcbiAgICAnc29ydC1ieS1vcmRlcicsXG4gICAgJ3NvcnQtYnktb3JkZXItYWx0JyxcbiAgICAnc29ydC1ieS1hdHRyaWJ1dGVzJyxcbiAgICAnc29ydC1ieS1hdHRyaWJ1dGVzLWFsdCcsXG4gICAgJ3VuY2hlY2tlZCcsXG4gICAgJ2V4cGFuZCcsXG4gICAgJ2NvbGxhcHNlLWRvd24nLFxuICAgICdjb2xsYXBzZS11cCcsXG4gICAgJ2xvZy1pbicsXG4gICAgJ2ZsYXNoJyxcbiAgICAnbG9nLW91dCcsXG4gICAgJ25ldy13aW5kb3cnLFxuICAgICdyZWNvcmQnLFxuICAgICdzYXZlJyxcbiAgICAnb3BlbicsXG4gICAgJ3NhdmVkJyxcbiAgICAnaW1wb3J0JyxcbiAgICAnZXhwb3J0JyxcbiAgICAnc2VuZCcsXG4gICAgJ2Zsb3BweS1kaXNrJyxcbiAgICAnZmxvcHB5LXNhdmVkJyxcbiAgICAnZmxvcHB5LXJlbW92ZScsXG4gICAgJ2Zsb3BweS1zYXZlJyxcbiAgICAnZmxvcHB5LW9wZW4nLFxuICAgICdjcmVkaXQtY2FyZCcsXG4gICAgJ3RyYW5zZmVyJyxcbiAgICAnY3V0bGVyeScsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2NvbXByZXNzZWQnLFxuICAgICdlYXJwaG9uZScsXG4gICAgJ3Bob25lLWFsdCcsXG4gICAgJ3Rvd2VyJyxcbiAgICAnc3RhdHMnLFxuICAgICdzZC12aWRlbycsXG4gICAgJ2hkLXZpZGVvJyxcbiAgICAnc3VidGl0bGVzJyxcbiAgICAnc291bmQtc3RlcmVvJyxcbiAgICAnc291bmQtZG9sYnknLFxuICAgICdzb3VuZC01LTEnLFxuICAgICdzb3VuZC02LTEnLFxuICAgICdzb3VuZC03LTEnLFxuICAgICdjb3B5cmlnaHQtbWFyaycsXG4gICAgJ3JlZ2lzdHJhdGlvbi1tYXJrJyxcbiAgICAnY2xvdWQtZG93bmxvYWQnLFxuICAgICdjbG91ZC11cGxvYWQnLFxuICAgICd0cmVlLWNvbmlmZXInLFxuICAgICd0cmVlLWRlY2lkdW91cydcbiAgXVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBBY2NvcmRpb246IHJlcXVpcmUoJy4vQWNjb3JkaW9uJyksXG4gIEFmZml4OiByZXF1aXJlKCcuL0FmZml4JyksXG4gIEFmZml4TWl4aW46IHJlcXVpcmUoJy4vQWZmaXhNaXhpbicpLFxuICBBbGVydDogcmVxdWlyZSgnLi9BbGVydCcpLFxuICBCb290c3RyYXBNaXhpbjogcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpLFxuICBCYWRnZTogcmVxdWlyZSgnLi9CYWRnZScpLFxuICBCdXR0b246IHJlcXVpcmUoJy4vQnV0dG9uJyksXG4gIEJ1dHRvbkdyb3VwOiByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyksXG4gIEJ1dHRvblRvb2xiYXI6IHJlcXVpcmUoJy4vQnV0dG9uVG9vbGJhcicpLFxuICBDYXJvdXNlbDogcmVxdWlyZSgnLi9DYXJvdXNlbCcpLFxuICBDYXJvdXNlbEl0ZW06IHJlcXVpcmUoJy4vQ2Fyb3VzZWxJdGVtJyksXG4gIENvbDogcmVxdWlyZSgnLi9Db2wnKSxcbiAgQ29sbGFwc2FibGVNaXhpbjogcmVxdWlyZSgnLi9Db2xsYXBzYWJsZU1peGluJyksXG4gIERyb3Bkb3duQnV0dG9uOiByZXF1aXJlKCcuL0Ryb3Bkb3duQnV0dG9uJyksXG4gIERyb3Bkb3duTWVudTogcmVxdWlyZSgnLi9Ecm9wZG93bk1lbnUnKSxcbiAgRHJvcGRvd25TdGF0ZU1peGluOiByZXF1aXJlKCcuL0Ryb3Bkb3duU3RhdGVNaXhpbicpLFxuICBGYWRlTWl4aW46IHJlcXVpcmUoJy4vRmFkZU1peGluJyksXG4gIEdseXBoaWNvbjogcmVxdWlyZSgnLi9HbHlwaGljb24nKSxcbiAgR3JpZDogcmVxdWlyZSgnLi9HcmlkJyksXG4gIElucHV0OiByZXF1aXJlKCcuL0lucHV0JyksXG4gIEludGVycG9sYXRlOiByZXF1aXJlKCcuL0ludGVycG9sYXRlJyksXG4gIEp1bWJvdHJvbjogcmVxdWlyZSgnLi9KdW1ib3Ryb24nKSxcbiAgTGFiZWw6IHJlcXVpcmUoJy4vTGFiZWwnKSxcbiAgTWVudUl0ZW06IHJlcXVpcmUoJy4vTWVudUl0ZW0nKSxcbiAgTW9kYWw6IHJlcXVpcmUoJy4vTW9kYWwnKSxcbiAgTmF2OiByZXF1aXJlKCcuL05hdicpLFxuICBOYXZiYXI6IHJlcXVpcmUoJy4vTmF2YmFyJyksXG4gIE5hdkl0ZW06IHJlcXVpcmUoJy4vTmF2SXRlbScpLFxuICBNb2RhbFRyaWdnZXI6IHJlcXVpcmUoJy4vTW9kYWxUcmlnZ2VyJyksXG4gIE92ZXJsYXlUcmlnZ2VyOiByZXF1aXJlKCcuL092ZXJsYXlUcmlnZ2VyJyksXG4gIE92ZXJsYXlNaXhpbjogcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKSxcbiAgUGFnZUhlYWRlcjogcmVxdWlyZSgnLi9QYWdlSGVhZGVyJyksXG4gIFBhbmVsOiByZXF1aXJlKCcuL1BhbmVsJyksXG4gIFBhbmVsR3JvdXA6IHJlcXVpcmUoJy4vUGFuZWxHcm91cCcpLFxuICBQYWdlSXRlbTogcmVxdWlyZSgnLi9QYWdlSXRlbScpLFxuICBQYWdlcjogcmVxdWlyZSgnLi9QYWdlcicpLFxuICBQb3BvdmVyOiByZXF1aXJlKCcuL1BvcG92ZXInKSxcbiAgUHJvZ3Jlc3NCYXI6IHJlcXVpcmUoJy4vUHJvZ3Jlc3NCYXInKSxcbiAgUm93OiByZXF1aXJlKCcuL1JvdycpLFxuICBTcGxpdEJ1dHRvbjogcmVxdWlyZSgnLi9TcGxpdEJ1dHRvbicpLFxuICBTdWJOYXY6IHJlcXVpcmUoJy4vU3ViTmF2JyksXG4gIFRhYmJlZEFyZWE6IHJlcXVpcmUoJy4vVGFiYmVkQXJlYScpLFxuICBUYWJsZTogcmVxdWlyZSgnLi9UYWJsZScpLFxuICBUYWJQYW5lOiByZXF1aXJlKCcuL1RhYlBhbmUnKSxcbiAgVG9vbHRpcDogcmVxdWlyZSgnLi9Ub29sdGlwJyksXG4gIFdlbGw6IHJlcXVpcmUoJy4vV2VsbCcpXG59OyIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG52YXIgQ3VzdG9tUHJvcFR5cGVzID0ge1xuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBwcm9wIGlzIGEgdmFsaWQgUmVhY3QgY2xhc3NcbiAgICpcbiAgICogQHBhcmFtIHByb3BzXG4gICAqIEBwYXJhbSBwcm9wTmFtZVxuICAgKiBAcGFyYW0gY29tcG9uZW50TmFtZVxuICAgKiBAcmV0dXJucyB7RXJyb3J8dW5kZWZpbmVkfVxuICAgKi9cbiAgY29tcG9uZW50Q2xhc3M6IGZ1bmN0aW9uIChwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUpIHtcbiAgICBpZiAoIVJlYWN0LmlzVmFsaWRDbGFzcyhwcm9wc1twcm9wTmFtZV0pKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdJbnZhbGlkIGAnICsgcHJvcE5hbWUgKyAnYCBwcm9wIGluIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBiZSAnICtcbiAgICAgICAgJ2EgdmFsaWQgUmVhY3QgY2xhc3MnKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgcHJvcCBwcm92aWRlcyBhIERPTSBlbGVtZW50XG4gICAqXG4gICAqIFRoZSBlbGVtZW50IGNhbiBiZSBwcm92aWRlZCBpbiB0d28gZm9ybXM6XG4gICAqIC0gRGlyZWN0bHkgcGFzc2VkXG4gICAqIC0gT3IgcGFzc2VkIGFuIG9iamVjdCB3aGljaCBoYXMgYSBgZ2V0RE9NTm9kZWAgbWV0aG9kIHdoaWNoIHdpbGwgcmV0dXJuIHRoZSByZXF1aXJlZCBET00gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHNcbiAgICogQHBhcmFtIHByb3BOYW1lXG4gICAqIEBwYXJhbSBjb21wb25lbnROYW1lXG4gICAqIEByZXR1cm5zIHtFcnJvcnx1bmRlZmluZWR9XG4gICAqL1xuICBtb3VudGFibGU6IGZ1bmN0aW9uIChwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUpIHtcbiAgICBpZiAodHlwZW9mIHByb3BzW3Byb3BOYW1lXSAhPT0gJ29iamVjdCcgfHxcbiAgICAgIHR5cGVvZiBwcm9wc1twcm9wTmFtZV0uZ2V0RE9NTm9kZSAhPT0gJ2Z1bmN0aW9uJyAmJiBwcm9wc1twcm9wTmFtZV0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0ludmFsaWQgYCcgKyBwcm9wTmFtZSArICdgIHByb3AgaW4gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGJlICcgK1xuICAgICAgICAnYSBET00gZWxlbWVudCBvciBhbiBvYmplY3QgdGhhdCBoYXMgYSBgZ2V0RE9NTm9kZWAgbWV0aG9kJyk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1c3RvbVByb3BUeXBlczsiLCIvKipcbiAqIFJlYWN0IEV2ZW50TGlzdGVuZXIubGlzdGVuXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhIG1vZGlmaWVkIHZlcnNpb24gb2Y6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3ZlbmRvci9zdHVicy9FdmVudExpc3RlbmVyLmpzXG4gKlxuICogVE9ETzogcmVtb3ZlIGluIGZhdm91ciBvZiBzb2x1dGlvbiBwcm92aWRlZCBieTpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvaXNzdWVzLzI4NVxuICovXG5cbi8qKlxuICogRG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgc3BlY2lmaWMgbmF0dXJlIG9mIHBsYXRmb3JtLlxuICovXG52YXIgRXZlbnRMaXN0ZW5lciA9IHtcbiAgLyoqXG4gICAqIExpc3RlbiB0byBET00gZXZlbnRzIGR1cmluZyB0aGUgYnViYmxlIHBoYXNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0RPTUV2ZW50VGFyZ2V0fSB0YXJnZXQgRE9NIGVsZW1lbnQgdG8gcmVnaXN0ZXIgbGlzdGVuZXIgb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgRXZlbnQgdHlwZSwgZS5nLiAnY2xpY2snIG9yICdtb3VzZW92ZXInLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICogQHJldHVybiB7b2JqZWN0fSBPYmplY3Qgd2l0aCBhIGByZW1vdmVgIG1ldGhvZC5cbiAgICovXG4gIGxpc3RlbjogZnVuY3Rpb24odGFyZ2V0LCBldmVudFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHRhcmdldC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldC5hdHRhY2hFdmVudCkge1xuICAgICAgdGFyZ2V0LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudFR5cGUsIGNhbGxiYWNrKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGFyZ2V0LmRldGFjaEV2ZW50KCdvbicgKyBldmVudFR5cGUsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRMaXN0ZW5lcjtcbiIsIi8qKlxuICogUmVhY3QgVHJhbnNpdGlvbkV2ZW50c1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy9hZGRvbnMvdHJhbnNpdGlvbnMvUmVhY3RUcmFuc2l0aW9uRXZlbnRzLmpzXG4gKlxuICovXG5cbnZhciBjYW5Vc2VET00gPSAhIShcbiAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB3aW5kb3cuZG9jdW1lbnQgJiZcbiAgICB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudFxuICApO1xuXG4vKipcbiAqIEVWRU5UX05BTUVfTUFQIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIGV2ZW50IGZpcmVkIHdoZW4gYVxuICogdHJhbnNpdGlvbi9hbmltYXRpb24gZW5kcywgYmFzZWQgb24gdGhlIHN0eWxlIHByb3BlcnR5IHVzZWQgdG9cbiAqIGRlZmluZSB0aGF0IGV2ZW50LlxuICovXG52YXIgRVZFTlRfTkFNRV9NQVAgPSB7XG4gIHRyYW5zaXRpb25lbmQ6IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICdtb3pUcmFuc2l0aW9uRW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb1RyYW5zaXRpb25FbmQnLFxuICAgICdtc1RyYW5zaXRpb24nOiAnTVNUcmFuc2l0aW9uRW5kJ1xuICB9LFxuXG4gIGFuaW1hdGlvbmVuZDoge1xuICAgICdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAnV2Via2l0QW5pbWF0aW9uJzogJ3dlYmtpdEFuaW1hdGlvbkVuZCcsXG4gICAgJ01vekFuaW1hdGlvbic6ICdtb3pBbmltYXRpb25FbmQnLFxuICAgICdPQW5pbWF0aW9uJzogJ29BbmltYXRpb25FbmQnLFxuICAgICdtc0FuaW1hdGlvbic6ICdNU0FuaW1hdGlvbkVuZCdcbiAgfVxufTtcblxudmFyIGVuZEV2ZW50cyA9IFtdO1xuXG5mdW5jdGlvbiBkZXRlY3RFdmVudHMoKSB7XG4gIHZhciB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHN0eWxlID0gdGVzdEVsLnN0eWxlO1xuXG4gIC8vIE9uIHNvbWUgcGxhdGZvcm1zLCBpbiBwYXJ0aWN1bGFyIHNvbWUgcmVsZWFzZXMgb2YgQW5kcm9pZCA0LngsXG4gIC8vIHRoZSB1bi1wcmVmaXhlZCBcImFuaW1hdGlvblwiIGFuZCBcInRyYW5zaXRpb25cIiBwcm9wZXJ0aWVzIGFyZSBkZWZpbmVkIG9uIHRoZVxuICAvLyBzdHlsZSBvYmplY3QgYnV0IHRoZSBldmVudHMgdGhhdCBmaXJlIHdpbGwgc3RpbGwgYmUgcHJlZml4ZWQsIHNvIHdlIG5lZWRcbiAgLy8gdG8gY2hlY2sgaWYgdGhlIHVuLXByZWZpeGVkIGV2ZW50cyBhcmUgdXNlYWJsZSwgYW5kIGlmIG5vdCByZW1vdmUgdGhlbVxuICAvLyBmcm9tIHRoZSBtYXBcbiAgaWYgKCEoJ0FuaW1hdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLmFuaW1hdGlvbmVuZC5hbmltYXRpb247XG4gIH1cblxuICBpZiAoISgnVHJhbnNpdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLnRyYW5zaXRpb25lbmQudHJhbnNpdGlvbjtcbiAgfVxuXG4gIGZvciAodmFyIGJhc2VFdmVudE5hbWUgaW4gRVZFTlRfTkFNRV9NQVApIHtcbiAgICB2YXIgYmFzZUV2ZW50cyA9IEVWRU5UX05BTUVfTUFQW2Jhc2VFdmVudE5hbWVdO1xuICAgIGZvciAodmFyIHN0eWxlTmFtZSBpbiBiYXNlRXZlbnRzKSB7XG4gICAgICBpZiAoc3R5bGVOYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVuZEV2ZW50cy5wdXNoKGJhc2VFdmVudHNbc3R5bGVOYW1lXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5pZiAoY2FuVXNlRE9NKSB7XG4gIGRldGVjdEV2ZW50cygpO1xufVxuXG4vLyBXZSB1c2UgdGhlIHJhdyB7YWRkfHJlbW92ZX1FdmVudExpc3RlbmVyKCkgY2FsbCBiZWNhdXNlIEV2ZW50TGlzdGVuZXJcbi8vIGRvZXMgbm90IGtub3cgaG93IHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lcnMgYW5kIHdlIHJlYWxseSBzaG91bGRcbi8vIGNsZWFuIHVwLiBBbHNvLCB0aGVzZSBldmVudHMgYXJlIG5vdCB0cmlnZ2VyZWQgaW4gb2xkZXIgYnJvd3NlcnNcbi8vIHNvIHdlIHNob3VsZCBiZSBBLU9LIGhlcmUuXG5cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnROYW1lLCBldmVudExpc3RlbmVyKSB7XG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG52YXIgUmVhY3RUcmFuc2l0aW9uRXZlbnRzID0ge1xuICBhZGRFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIElmIENTUyB0cmFuc2l0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCwgdHJpZ2dlciBhbiBcImVuZCBhbmltYXRpb25cIlxuICAgICAgLy8gZXZlbnQgaW1tZWRpYXRlbHkuXG4gICAgICB3aW5kb3cuc2V0VGltZW91dChldmVudExpc3RlbmVyLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIHJlbW92ZUVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RUcmFuc2l0aW9uRXZlbnRzO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbi8qKlxuICogTWFwcyBjaGlsZHJlbiB0aGF0IGFyZSB0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmAsXG4gKiBidXQgb25seSBpdGVyYXRlcyBvdmVyIGNoaWxkcmVuIHRoYXQgYXJlIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIFRoZSBtYXBGdW5jdGlvbiBwcm92aWRlZCBpbmRleCB3aWxsIGJlIG5vcm1hbGlzZWQgdG8gdGhlIGNvbXBvbmVudHMgbWFwcGVkLFxuICogc28gYW4gaW52YWxpZCBjb21wb25lbnQgd291bGQgbm90IGluY3JlYXNlIHRoZSBpbmRleC5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgaW50KX0gbWFwRnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IG1hcENvbnRleHQgQ29udGV4dCBmb3IgbWFwRnVuY3Rpb24uXG4gKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCBjb250YWluaW5nIHRoZSBvcmRlcmVkIG1hcCBvZiByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBtYXBWYWxpZENvbXBvbmVudHMoY2hpbGRyZW4sIGZ1bmMsIGNvbnRleHQpIHtcbiAgdmFyIGluZGV4ID0gMDtcblxuICByZXR1cm4gUmVhY3QuQ2hpbGRyZW4ubWFwKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHtcbiAgICAgIHZhciBsYXN0SW5kZXggPSBpbmRleDtcbiAgICAgIGluZGV4Kys7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIGNoaWxkLCBsYXN0SW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBjaGlsZDtcbiAgfSk7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBjaGlsZHJlbiB0aGF0IGFyZSB0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmAsXG4gKiBidXQgb25seSBpdGVyYXRlcyBvdmVyIGNoaWxkcmVuIHRoYXQgYXJlIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIFRoZSBwcm92aWRlZCBmb3JFYWNoRnVuYyhjaGlsZCwgaW5kZXgpIHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoXG4gKiBsZWFmIGNoaWxkIHdpdGggdGhlIGluZGV4IHJlZmxlY3RpbmcgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBpbnQpfSBmb3JFYWNoRnVuYy5cbiAqIEBwYXJhbSB7Kn0gZm9yRWFjaENvbnRleHQgQ29udGV4dCBmb3IgZm9yRWFjaENvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGZvckVhY2hWYWxpZENvbXBvbmVudHMoY2hpbGRyZW4sIGZ1bmMsIGNvbnRleHQpIHtcbiAgdmFyIGluZGV4ID0gMDtcblxuICByZXR1cm4gUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7XG4gICAgICBmdW5jLmNhbGwoY29udGV4dCwgY2hpbGQsIGluZGV4KTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBDb3VudCB0aGUgbnVtYmVyIG9mIFwidmFsaWQgY29tcG9uZW50c1wiIGluIHRoZSBDaGlsZHJlbiBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBudW1iZXJPZlZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbikge1xuICB2YXIgY291bnQgPSAwO1xuXG4gIFJlYWN0LkNoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkgeyBjb3VudCsrOyB9XG4gIH0pO1xuXG4gIHJldHVybiBjb3VudDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgdGhlIENoaWxkIGNvbnRhaW5lciBoYXMgb25lIG9yIG1vcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaGFzVmFsaWRDb21wb25lbnQoY2hpbGRyZW4pIHtcbiAgdmFyIGhhc1ZhbGlkID0gZmFsc2U7XG5cbiAgUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKCFoYXNWYWxpZCAmJiBSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkge1xuICAgICAgaGFzVmFsaWQgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGhhc1ZhbGlkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWFwOiBtYXBWYWxpZENvbXBvbmVudHMsXG4gIGZvckVhY2g6IGZvckVhY2hWYWxpZENvbXBvbmVudHMsXG4gIG51bWJlck9mOiBudW1iZXJPZlZhbGlkQ29tcG9uZW50cyxcbiAgaGFzVmFsaWRDb21wb25lbnQ6IGhhc1ZhbGlkQ29tcG9uZW50XG59OyIsIi8qKlxuICogUmVhY3QgY2xhc3NTZXRcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGlzIHVubW9kaWZpZWQgZnJvbTpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdmVuZG9yL3N0dWJzL2N4LmpzXG4gKlxuICovXG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIG1hcmsgc3RyaW5nIGxpdGVyYWxzIHJlcHJlc2VudGluZyBDU1MgY2xhc3MgbmFtZXNcbiAqIHNvIHRoYXQgdGhleSBjYW4gYmUgdHJhbnNmb3JtZWQgc3RhdGljYWxseS4gVGhpcyBhbGxvd3MgZm9yIG1vZHVsYXJpemF0aW9uXG4gKiBhbmQgbWluaWZpY2F0aW9uIG9mIENTUyBjbGFzcyBuYW1lcy5cbiAqXG4gKiBJbiBzdGF0aWNfdXBzdHJlYW0sIHRoaXMgZnVuY3Rpb24gaXMgYWN0dWFsbHkgaW1wbGVtZW50ZWQsIGJ1dCBpdCBzaG91bGRcbiAqIGV2ZW50dWFsbHkgYmUgcmVwbGFjZWQgd2l0aCBzb21ldGhpbmcgbW9yZSBkZXNjcmlwdGl2ZSwgYW5kIHRoZSB0cmFuc2Zvcm1cbiAqIHRoYXQgaXMgdXNlZCBpbiB0aGUgbWFpbiBzdGFjayBzaG91bGQgYmUgcG9ydGVkIGZvciB1c2UgZWxzZXdoZXJlLlxuICpcbiAqIEBwYXJhbSBzdHJpbmd8b2JqZWN0IGNsYXNzTmFtZSB0byBtb2R1bGFyaXplLCBvciBhbiBvYmplY3Qgb2Yga2V5L3ZhbHVlcy5cbiAqICAgICAgICAgICAgICAgICAgICAgIEluIHRoZSBvYmplY3QgY2FzZSwgdGhlIHZhbHVlcyBhcmUgY29uZGl0aW9ucyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgICAgICBkZXRlcm1pbmUgaWYgdGhlIGNsYXNzTmFtZSBrZXlzIHNob3VsZCBiZSBpbmNsdWRlZC5cbiAqIEBwYXJhbSBbc3RyaW5nIC4uLl0gIFZhcmlhYmxlIGxpc3Qgb2YgY2xhc3NOYW1lcyBpbiB0aGUgc3RyaW5nIGNhc2UuXG4gKiBAcmV0dXJuIHN0cmluZyAgICAgICBSZW5kZXJhYmxlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NOYW1lLlxuICovXG5mdW5jdGlvbiBjeChjbGFzc05hbWVzKSB7XG4gIGlmICh0eXBlb2YgY2xhc3NOYW1lcyA9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhjbGFzc05hbWVzKS5maWx0ZXIoZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gY2xhc3NOYW1lc1tjbGFzc05hbWVdO1xuICAgIH0pLmpvaW4oJyAnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmpvaW4uY2FsbChhcmd1bWVudHMsICcgJyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjeDsiLCIvKipcbiAqIFJlYWN0IGNsb25lV2l0aFByb3BzXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBtb2RpZmllZCB2ZXJzaW9ucyBvZjpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdXRpbHMvY2xvbmVXaXRoUHJvcHMuanNcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvY29yZS9SZWFjdFByb3BUcmFuc2ZlcmVyLmpzXG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3V0aWxzL2pvaW5DbGFzc2VzLmpzXG4gKlxuICogVE9ETzogVGhpcyBzaG91bGQgYmUgcmVwbGFjZWQgYXMgc29vbiBhcyBjbG9uZVdpdGhQcm9wcyBpcyBhdmFpbGFibGUgdmlhXG4gKiAgdGhlIGNvcmUgUmVhY3QgcGFja2FnZSBvciBhIHNlcGFyYXRlIHBhY2thZ2UuXG4gKiAgQHNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvaXNzdWVzLzE5MDZcbiAqXG4gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyk7XG5cbi8qKlxuICogQ29tYmluZXMgbXVsdGlwbGUgY2xhc3NOYW1lIHN0cmluZ3MgaW50byBvbmUuXG4gKiBodHRwOi8vanNwZXJmLmNvbS9qb2luY2xhc3Nlcy1hcmdzLXZzLWFycmF5XG4gKlxuICogQHBhcmFtIHsuLi4/c3RyaW5nfSBjbGFzc2VzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGpvaW5DbGFzc2VzKGNsYXNzTmFtZS8qLCAuLi4gKi8pIHtcbiAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICBjbGFzc05hbWUgPSAnJztcbiAgfVxuICB2YXIgbmV4dENsYXNzO1xuICB2YXIgYXJnTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgaWYgKGFyZ0xlbmd0aCA+IDEpIHtcbiAgICBmb3IgKHZhciBpaSA9IDE7IGlpIDwgYXJnTGVuZ3RoOyBpaSsrKSB7XG4gICAgICBuZXh0Q2xhc3MgPSBhcmd1bWVudHNbaWldO1xuICAgICAgbmV4dENsYXNzICYmIChjbGFzc05hbWUgKz0gJyAnICsgbmV4dENsYXNzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdHJhbnNmZXIgc3RyYXRlZ3kgdGhhdCB3aWxsIG1lcmdlIHByb3AgdmFsdWVzIHVzaW5nIHRoZSBzdXBwbGllZFxuICogYG1lcmdlU3RyYXRlZ3lgLiBJZiBhIHByb3Agd2FzIHByZXZpb3VzbHkgdW5zZXQsIHRoaXMganVzdCBzZXRzIGl0LlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG1lcmdlU3RyYXRlZ3lcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KG1lcmdlU3RyYXRlZ3kpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHByb3BzLCBrZXksIHZhbHVlKSB7XG4gICAgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBwcm9wc1trZXldID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BzW2tleV0gPSBtZXJnZVN0cmF0ZWd5KHByb3BzW2tleV0sIHZhbHVlKTtcbiAgICB9XG4gIH07XG59XG5cbnZhciB0cmFuc2ZlclN0cmF0ZWd5TWVyZ2UgPSBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gYG1lcmdlYCBvdmVycmlkZXMgdGhlIGZpcnN0IG9iamVjdCdzIChgcHJvcHNba2V5XWAgYWJvdmUpIGtleXMgdXNpbmcgdGhlXG4gIC8vIHNlY29uZCBvYmplY3QncyAoYHZhbHVlYCkga2V5cy4gQW4gb2JqZWN0J3Mgc3R5bGUncyBleGlzdGluZyBgcHJvcEFgIHdvdWxkXG4gIC8vIGdldCBvdmVycmlkZGVuLiBGbGlwIHRoZSBvcmRlciBoZXJlLlxuICByZXR1cm4gbWVyZ2UoYiwgYSk7XG59KTtcblxuZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9XG5cbi8qKlxuICogVHJhbnNmZXIgc3RyYXRlZ2llcyBkaWN0YXRlIGhvdyBwcm9wcyBhcmUgdHJhbnNmZXJyZWQgYnkgYHRyYW5zZmVyUHJvcHNUb2AuXG4gKiBOT1RFOiBpZiB5b3UgYWRkIGFueSBtb3JlIGV4Y2VwdGlvbnMgdG8gdGhpcyBsaXN0IHlvdSBzaG91bGQgYmUgc3VyZSB0b1xuICogdXBkYXRlIGBjbG9uZVdpdGhQcm9wcygpYCBhY2NvcmRpbmdseS5cbiAqL1xudmFyIFRyYW5zZmVyU3RyYXRlZ2llcyA9IHtcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIGBjaGlsZHJlbmAuXG4gICAqL1xuICBjaGlsZHJlbjogZW1wdHlGdW5jdGlvbixcbiAgLyoqXG4gICAqIFRyYW5zZmVyIHRoZSBgY2xhc3NOYW1lYCBwcm9wIGJ5IG1lcmdpbmcgdGhlbS5cbiAgICovXG4gIGNsYXNzTmFtZTogY3JlYXRlVHJhbnNmZXJTdHJhdGVneShqb2luQ2xhc3NlcyksXG4gIC8qKlxuICAgKiBOZXZlciB0cmFuc2ZlciB0aGUgYGtleWAgcHJvcC5cbiAgICovXG4gIGtleTogZW1wdHlGdW5jdGlvbixcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIHRoZSBgcmVmYCBwcm9wLlxuICAgKi9cbiAgcmVmOiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogVHJhbnNmZXIgdGhlIGBzdHlsZWAgcHJvcCAod2hpY2ggaXMgYW4gb2JqZWN0KSBieSBtZXJnaW5nIHRoZW0uXG4gICAqL1xuICBzdHlsZTogdHJhbnNmZXJTdHJhdGVneU1lcmdlXG59O1xuXG4vKipcbiAqIE11dGF0ZXMgdGhlIGZpcnN0IGFyZ3VtZW50IGJ5IHRyYW5zZmVycmluZyB0aGUgcHJvcGVydGllcyBmcm9tIHRoZSBzZWNvbmRcbiAqIGFyZ3VtZW50LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wc1xuICogQHBhcmFtIHtvYmplY3R9IG5ld1Byb3BzXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHRyYW5zZmVySW50byhwcm9wcywgbmV3UHJvcHMpIHtcbiAgZm9yICh2YXIgdGhpc0tleSBpbiBuZXdQcm9wcykge1xuICAgIGlmICghbmV3UHJvcHMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHZhciB0cmFuc2ZlclN0cmF0ZWd5ID0gVHJhbnNmZXJTdHJhdGVnaWVzW3RoaXNLZXldO1xuXG4gICAgaWYgKHRyYW5zZmVyU3RyYXRlZ3kgJiYgVHJhbnNmZXJTdHJhdGVnaWVzLmhhc093blByb3BlcnR5KHRoaXNLZXkpKSB7XG4gICAgICB0cmFuc2ZlclN0cmF0ZWd5KHByb3BzLCB0aGlzS2V5LCBuZXdQcm9wc1t0aGlzS2V5XSk7XG4gICAgfSBlbHNlIGlmICghcHJvcHMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIHByb3BzW3RoaXNLZXldID0gbmV3UHJvcHNbdGhpc0tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wcztcbn1cblxuLyoqXG4gKiBNZXJnZSB0d28gcHJvcHMgb2JqZWN0cyB1c2luZyBUcmFuc2ZlclN0cmF0ZWdpZXMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9sZFByb3BzIG9yaWdpbmFsIHByb3BzICh0aGV5IHRha2UgcHJlY2VkZW5jZSlcbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdQcm9wcyBuZXcgcHJvcHMgdG8gbWVyZ2UgaW5cbiAqIEByZXR1cm4ge29iamVjdH0gYSBuZXcgb2JqZWN0IGNvbnRhaW5pbmcgYm90aCBzZXRzIG9mIHByb3BzIG1lcmdlZC5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgcmV0dXJuIHRyYW5zZmVySW50byhtZXJnZShvbGRQcm9wcyksIG5ld1Byb3BzKTtcbn1cblxudmFyIFJlYWN0UHJvcFRyYW5zZmVyZXIgPSB7XG4gIG1lcmdlUHJvcHM6IG1lcmdlUHJvcHNcbn07XG5cbnZhciBDSElMRFJFTl9QUk9QID0gJ2NoaWxkcmVuJztcblxuLyoqXG4gKiBTb21ldGltZXMgeW91IHdhbnQgdG8gY2hhbmdlIHRoZSBwcm9wcyBvZiBhIGNoaWxkIHBhc3NlZCB0byB5b3UuIFVzdWFsbHlcbiAqIHRoaXMgaXMgdG8gYWRkIGEgQ1NTIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBjaGlsZCBjaGlsZCBjb21wb25lbnQgeW91J2QgbGlrZSB0byBjbG9uZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzIHByb3BzIHlvdSdkIGxpa2UgdG8gbW9kaWZ5LiBUaGV5IHdpbGwgYmUgbWVyZ2VkXG4gKiBhcyBpZiB5b3UgdXNlZCBgdHJhbnNmZXJQcm9wc1RvKClgLlxuICogQHJldHVybiB7b2JqZWN0fSBhIGNsb25lIG9mIGNoaWxkIHdpdGggcHJvcHMgbWVyZ2VkIGluLlxuICovXG5mdW5jdGlvbiBjbG9uZVdpdGhQcm9wcyhjaGlsZCwgcHJvcHMpIHtcbiAgdmFyIG5ld1Byb3BzID0gUmVhY3RQcm9wVHJhbnNmZXJlci5tZXJnZVByb3BzKHByb3BzLCBjaGlsZC5wcm9wcyk7XG5cbiAgLy8gVXNlIGBjaGlsZC5wcm9wcy5jaGlsZHJlbmAgaWYgaXQgaXMgcHJvdmlkZWQuXG4gIGlmICghbmV3UHJvcHMuaGFzT3duUHJvcGVydHkoQ0hJTERSRU5fUFJPUCkgJiZcbiAgICBjaGlsZC5wcm9wcy5oYXNPd25Qcm9wZXJ0eShDSElMRFJFTl9QUk9QKSkge1xuICAgIG5ld1Byb3BzLmNoaWxkcmVuID0gY2hpbGQucHJvcHMuY2hpbGRyZW47XG4gIH1cblxuICAvLyBIdWdlIGhhY2sgdG8gc3VwcG9ydCBib3RoIHRoZSAwLjEwIEFQSSBhbmQgdGhlIG5ldyB3YXkgb2YgZG9pbmcgdGhpbmdzXG4gIC8vIFRPRE86IHJlbW92ZSB3aGVuIHN1cHBvcnQgZm9yIDAuMTAgaXMgbm8gbG9uZ2VyIG5lZWRlZFxuICBpZiAoUmVhY3QudmVyc2lvbi5pbmRleE9mKCcwLjEwLicpID09PSAwKSB7XG4gICAgcmV0dXJuIGNoaWxkLmNvbnN0cnVjdG9yLkNvbnZlbmllbmNlQ29uc3RydWN0b3IobmV3UHJvcHMpO1xuICB9XG5cblxuICAvLyBUaGUgY3VycmVudCBBUEkgZG9lc24ndCByZXRhaW4gX293bmVyIGFuZCBfY29udGV4dCwgd2hpY2ggaXMgd2h5IHRoaXNcbiAgLy8gZG9lc24ndCB1c2UgUmVhY3REZXNjcmlwdG9yLmNsb25lQW5kUmVwbGFjZVByb3BzLlxuICByZXR1cm4gY2hpbGQuY29uc3RydWN0b3IobmV3UHJvcHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lV2l0aFByb3BzOyIsIi8qKlxuICogU2FmZSBjaGFpbmVkIGZ1bmN0aW9uXG4gKlxuICogV2lsbCBvbmx5IGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBpZiBuZWVkZWQsXG4gKiBvdGhlcndpc2Ugd2lsbCBwYXNzIGJhY2sgZXhpc3RpbmcgZnVuY3Rpb25zIG9yIG51bGwuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0d29cbiAqIEByZXR1cm5zIHtmdW5jdGlvbnxudWxsfVxuICovXG5mdW5jdGlvbiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24ob25lLCB0d28pIHtcbiAgdmFyIGhhc09uZSA9IHR5cGVvZiBvbmUgPT09ICdmdW5jdGlvbic7XG4gIHZhciBoYXNUd28gPSB0eXBlb2YgdHdvID09PSAnZnVuY3Rpb24nO1xuXG4gIGlmICghaGFzT25lICYmICFoYXNUd28pIHsgcmV0dXJuIG51bGw7IH1cbiAgaWYgKCFoYXNPbmUpIHsgcmV0dXJuIHR3bzsgfVxuICBpZiAoIWhhc1R3bykgeyByZXR1cm4gb25lOyB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNoYWluZWRGdW5jdGlvbigpIHtcbiAgICBvbmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0d28uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb247IiwiXG4vKipcbiAqIFNob3J0Y3V0IHRvIGNvbXB1dGUgZWxlbWVudCBzdHlsZVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtDc3NTdHlsZX1cbiAqL1xuZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkge1xuICByZXR1cm4gZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCk7XG59XG5cbi8qKlxuICogR2V0IGVsZW1lbnRzIG9mZnNldFxuICpcbiAqIFRPRE86IFJFTU9WRSBKUVVFUlkhXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gRE9NTm9kZVxuICogQHJldHVybnMge3t0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gZ2V0T2Zmc2V0KERPTU5vZGUpIHtcbiAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcbiAgICByZXR1cm4gd2luZG93LmpRdWVyeShET01Ob2RlKS5vZmZzZXQoKTtcbiAgfVxuXG4gIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB2YXIgYm94ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuICAvLyBJZiB3ZSBkb24ndCBoYXZlIGdCQ1IsIGp1c3QgdXNlIDAsMCByYXRoZXIgdGhhbiBlcnJvclxuICAvLyBCbGFja0JlcnJ5IDUsIGlPUyAzIChvcmlnaW5hbCBpUGhvbmUpXG4gIGlmICggdHlwZW9mIERPTU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBib3ggPSBET01Ob2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0b3A6IGJveC50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQgLSBkb2NFbGVtLmNsaWVudFRvcCxcbiAgICBsZWZ0OiBib3gubGVmdCArIHdpbmRvdy5wYWdlWE9mZnNldCAtIGRvY0VsZW0uY2xpZW50TGVmdFxuICB9O1xufVxuXG4vKipcbiAqIEdldCBlbGVtZW50cyBwb3NpdGlvblxuICpcbiAqIFRPRE86IFJFTU9WRSBKUVVFUlkhXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtIVE1MRWxlbWVudD99IG9mZnNldFBhcmVudFxuICogQHJldHVybnMge3t0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gZ2V0UG9zaXRpb24oZWxlbSwgb2Zmc2V0UGFyZW50KSB7XG4gIGlmICh3aW5kb3cualF1ZXJ5KSB7XG4gICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkoZWxlbSkucG9zaXRpb24oKTtcbiAgfVxuXG4gIHZhciBvZmZzZXQsXG4gICAgICBwYXJlbnRPZmZzZXQgPSB7dG9wOiAwLCBsZWZ0OiAwfTtcblxuICAvLyBGaXhlZCBlbGVtZW50cyBhcmUgb2Zmc2V0IGZyb20gd2luZG93IChwYXJlbnRPZmZzZXQgPSB7dG9wOjAsIGxlZnQ6IDB9LCBiZWNhdXNlIGl0IGlzIGl0cyBvbmx5IG9mZnNldCBwYXJlbnRcbiAgaWYgKGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLnBvc2l0aW9uID09PSAnZml4ZWQnICkge1xuICAgIC8vIFdlIGFzc3VtZSB0aGF0IGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyBhdmFpbGFibGUgd2hlbiBjb21wdXRlZCBwb3NpdGlvbiBpcyBmaXhlZFxuICAgIG9mZnNldCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgfSBlbHNlIHtcbiAgICBpZiAoIW9mZnNldFBhcmVudCkge1xuICAgICAgLy8gR2V0ICpyZWFsKiBvZmZzZXRQYXJlbnRcbiAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudChlbGVtKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgY29ycmVjdCBvZmZzZXRzXG4gICAgb2Zmc2V0ID0gZ2V0T2Zmc2V0KGVsZW0pO1xuICAgIGlmICggb2Zmc2V0UGFyZW50Lm5vZGVOYW1lICE9PSAnSFRNTCcpIHtcbiAgICAgIHBhcmVudE9mZnNldCA9IGdldE9mZnNldChvZmZzZXRQYXJlbnQpO1xuICAgIH1cblxuICAgIC8vIEFkZCBvZmZzZXRQYXJlbnQgYm9yZGVyc1xuICAgIHBhcmVudE9mZnNldC50b3AgKz0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5ib3JkZXJUb3BXaWR0aCwgMTApO1xuICAgIHBhcmVudE9mZnNldC5sZWZ0ICs9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKG9mZnNldFBhcmVudCkuYm9yZGVyTGVmdFdpZHRoLCAxMCk7XG4gIH1cblxuICAvLyBTdWJ0cmFjdCBwYXJlbnQgb2Zmc2V0cyBhbmQgZWxlbWVudCBtYXJnaW5zXG4gIHJldHVybiB7XG4gICAgdG9wOiBvZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCAtIHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLm1hcmdpblRvcCwgMTApLFxuICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gcGFyZW50T2Zmc2V0LmxlZnQgLSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhlbGVtKS5tYXJnaW5MZWZ0LCAxMClcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgcGFyZW50IGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50P30gZWxlbVxuICogQHJldHVybnMge0hUTUxFbGVtZW50fVxuICovXG5mdW5jdGlvbiBvZmZzZXRQYXJlbnQoZWxlbSkge1xuICB2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IGRvY0VsZW07XG5cbiAgd2hpbGUgKCBvZmZzZXRQYXJlbnQgJiYgKCBvZmZzZXRQYXJlbnQubm9kZU5hbWUgIT09ICdIVE1MJyAmJlxuICAgIGdldENvbXB1dGVkU3R5bGVzKG9mZnNldFBhcmVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnICkgKSB7XG4gICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcbiAgfVxuXG4gIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldENvbXB1dGVkU3R5bGVzOiBnZXRDb21wdXRlZFN0eWxlcyxcbiAgZ2V0T2Zmc2V0OiBnZXRPZmZzZXQsXG4gIGdldFBvc2l0aW9uOiBnZXRQb3NpdGlvbixcbiAgb2Zmc2V0UGFyZW50OiBvZmZzZXRQYXJlbnRcbn07IiwiLyoqXG4gKiBNZXJnZSBoZWxwZXJcbiAqXG4gKiBUT0RPOiB0byBiZSByZXBsYWNlZCB3aXRoIEVTNidzIGBPYmplY3QuYXNzaWduKClgIGZvciBSZWFjdCAwLjEyXG4gKi9cblxuLyoqXG4gKiBTaGFsbG93IG1lcmdlcyB0d28gc3RydWN0dXJlcyBieSBtdXRhdGluZyB0aGUgZmlyc3QgcGFyYW1ldGVyLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvbmUgT2JqZWN0IHRvIGJlIG1lcmdlZCBpbnRvLlxuICogQHBhcmFtIHs/b2JqZWN0fSB0d28gT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICovXG5mdW5jdGlvbiBtZXJnZUludG8ob25lLCB0d28pIHtcbiAgaWYgKHR3byAhPSBudWxsKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHR3bykge1xuICAgICAgaWYgKCF0d28uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG9uZVtrZXldID0gdHdvW2tleV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hhbGxvdyBtZXJnZXMgdHdvIHN0cnVjdHVyZXMgaW50byBhIHJldHVybiB2YWx1ZSwgd2l0aG91dCBtdXRhdGluZyBlaXRoZXIuXG4gKlxuICogQHBhcmFtIHs/b2JqZWN0fSBvbmUgT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICogQHBhcmFtIHs/b2JqZWN0fSB0d28gT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICogQHJldHVybiB7b2JqZWN0fSBUaGUgc2hhbGxvdyBleHRlbnNpb24gb2Ygb25lIGJ5IHR3by5cbiAqL1xuZnVuY3Rpb24gbWVyZ2Uob25lLCB0d28pIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBtZXJnZUludG8ocmVzdWx0LCBvbmUpO1xuICBtZXJnZUludG8ocmVzdWx0LCB0d28pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1lcmdlOyIsImRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwic3FsYWRtaW46cmVhY3Q6bG9naW5cIilcblxuUmVhY3QgPSByZXF1aXJlIFwicmVhY3RcIlxuUmVhY3RCb290c3RyYXAgPSByZXF1aXJlIFwicmVhY3QtYm9vdHN0cmFwXCJcblxuJCA9IHJlcXVpcmUgXCJqcXVlcnlcIlxuXG57ZGl2LCBmb3JtLCBpbnB1dCwgb3B0aW9ufSA9IFJlYWN0LkRPTVxue0lucHV0LCBCdXR0b259ID0gUmVhY3RCb290c3RyYXBcbm1vZHVsZS5leHBvcnRzID0gUmVhY3QuY3JlYXRlQ2xhc3Mge1xuICBnZXRJbml0aWFsU3RhdGU6IC0+XG4gICAge1xuICAgICAgaXNMb2FkaW5nOiBmYWxzZVxuICAgIH1cblxuICBvbkxvZ2luQ2xpY2s6ICgpIC0+XG4gICAgQHNldFN0YXRlIHsgaXNMb2FkaW5nOiB0cnVlIH1cbiAgICBvcHRpb25zID0ge1xuICAgICAgdXJsOiBcIi9sb2dpblwiXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCJcbiAgICAgIHR5cGU6IFwiUE9TVFwiXG4gICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5IHtcbiAgICAgICAgXCJfY3NyZlwiOiBAcHJvcHMuX2NzcmZcbiAgICAgICAgXCJ1c2VybmFtZVwiOiBAcmVmcy50eHRVc2VybmFtZS5nZXRWYWx1ZSgpXG4gICAgICAgIFwicGFzc3dvcmRcIjogQHJlZnMudHh0UGFzc3dvcmQuZ2V0VmFsdWUoKVxuICAgICAgICBcImhvc3RcIjogQHJlZnMudHh0SG9zdC5nZXRWYWx1ZSgpXG4gICAgICAgIFwicG9ydFwiOiBAcmVmcy50eHRQb3J0LmdldFZhbHVlKClcbiAgICAgICAgXCJkYXRhYmFzZXR5cGVcIjogQHJlZnMuZGRsRGF0YWJhc2VUeXBlLmdldFZhbHVlKClcbiAgICAgIH1cbiAgICAgIGNvbnRleHQ6IEBcbiAgICB9XG4gICAgJC5hamF4KG9wdGlvbnMpLmRvbmUgKCkgLT5cbiAgICAgIGRlYnVnIFwicmVzcG9uc2VcIiwgYXJndW1lbnRzXG4gICAgICBAc2V0U3RhdGUgeyBpc0xvYWRpbmc6IGZhbHNlIH1cbiAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIGlzTG9hZGluZyA9IEBzdGF0ZS5pc0xvYWRpbmdcblxuICAgIGxvZ2luQnV0dG9uT3B0aW9ucyA9IHtcbiAgICAgIGJzU3R5bGU6XCJwcmltYXJ5XCJcbiAgICAgIG9uQ2xpY2s6IGlmIGlzTG9hZGluZyB0aGVuIG51bGwgZWxzZSBAb25Mb2dpbkNsaWNrXG4gICAgICBkaXNhYmxlZDogaXNMb2FkaW5nXG4gICAgfVxuICAgIGxvZ2luQnV0dG9uVGV4dCA9IGlmIGlzTG9hZGluZyB0aGVuIFwiUGxlYXNlIFdhaXRcIiBlbHNlIFwiTG9naW5cIlxuXG4gICAgZGl2IHsgY2xhc3NOYW1lOiBcImNvbnRhaW5lclwiIH0sXG4gICAgICBmb3JtIHtjbGFzc05hbWU6IFwiZm9ybS1ob3Jpem9udGFsXCJ9LFxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwidGV4dFwiLCBsYWJlbDogXCJVc2VybmFtZVwiLCBsYWJlbENsYXNzTmFtZTpcImNvbC14cy0yXCIsIHdyYXBwZXJDbGFzc05hbWU6IFwiY29sLXhzLTEwXCIsIHJlZjogXCJ0eHRVc2VybmFtZVwiIH1cbiAgICAgICAgSW5wdXQgeyB0eXBlOiBcInBhc3N3b3JkXCIsIGxhYmVsOiBcIlBhc3N3b3JkXCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgcmVmOiBcInR4dFBhc3N3b3JkXCIgfVxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwidGV4dFwiLCBsYWJlbDogXCJIb3N0XCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwiMTI3LjAuMC4xXCIsIHJlZjogXCJ0eHRIb3N0XCIgfVxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwidGV4dFwiLCBsYWJlbDogXCJQb3J0XCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwiNTQzMlwiLCByZWY6IFwidHh0UG9ydFwiIH1cbiAgICAgICAgSW5wdXQgeyB0eXBlOiBcInNlbGVjdFwiLCBsYWJlbDogXCJEYXRhYmFzZSBUeXBlXCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwicGdcIiwgcmVmOlwiZGRsRGF0YWJhc2VUeXBlXCIgfSxcbiAgICAgICAgICBvcHRpb24geyB2YWx1ZTpcInBnXCIgfSwgXCJQb3N0Z3Jlc3FsXCJcbiAgICAgICAgICBvcHRpb24geyB2YWx1ZTpcIm15c3FsXCIgfSwgXCJNeVNxbFwiXG4gICAgICAgICAgb3B0aW9uIHsgdmFsdWU6XCJtYXJpYXNxbFwiIH0sIFwiTWFyaWFTcWxcIlxuICAgICAgICBCdXR0b24gbG9naW5CdXR0b25PcHRpb25zLCBsb2dpbkJ1dHRvblRleHRcbn1cbiJdfQ==
