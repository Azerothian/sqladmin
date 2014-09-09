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
      return window.location = "/";
    });
  },
  render: function() {
    var isLoading, labelClassName, loginButtonOptions, loginButtonText, wrapperClassName;
    isLoading = this.state.isLoading;
    loginButtonOptions = {
      bsStyle: "primary",
      onClick: isLoading ? null : this.onLoginClick,
      disabled: isLoading,
      className: "pull-right"
    };
    loginButtonText = isLoading ? "Please Wait" : "Login";
    labelClassName = "col-xs-12 col-sm-4";
    wrapperClassName = "col-xs-12 col-sm-8";
    return div({
      className: "container"
    }, form({
      className: "form-horizontal"
    }, Input({
      type: "text",
      label: "Username",
      labelClassName: labelClassName,
      wrapperClassName: wrapperClassName,
      ref: "txtUsername",
      defaultValue: "postgres"
    }), Input({
      type: "password",
      label: "Password",
      labelClassName: labelClassName,
      wrapperClassName: wrapperClassName,
      ref: "txtPassword",
      defaultValue: "12qwaszx"
    }), Input({
      type: "text",
      label: "Host",
      labelClassName: labelClassName,
      wrapperClassName: wrapperClassName,
      defaultValue: "127.0.0.1",
      ref: "txtHost"
    }), Input({
      type: "text",
      label: "Port",
      labelClassName: labelClassName,
      wrapperClassName: wrapperClassName,
      defaultValue: "5432",
      ref: "txtPort"
    }), Input({
      type: "select",
      label: "Database Type",
      labelClassName: labelClassName,
      wrapperClassName: wrapperClassName,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FjY29yZGlvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWZmaXguanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FmZml4TWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FsZXJ0LmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9CYWRnZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQm9vdHN0cmFwTWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uR3JvdXAuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvblRvb2xiYXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Nhcm91c2VsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9DYXJvdXNlbEl0ZW0uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0NvbC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sbGFwc2FibGVNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25CdXR0b24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Ryb3Bkb3duTWVudS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25TdGF0ZU1peGluLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9GYWRlTWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0dseXBoaWNvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR3JpZC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvSW5wdXQuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0ludGVycG9sYXRlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9KdW1ib3Ryb24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0xhYmVsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9NZW51SXRlbS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTW9kYWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL01vZGFsVHJpZ2dlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTmF2LmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZJdGVtLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZiYXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL092ZXJsYXlNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheVRyaWdnZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhZ2VIZWFkZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhZ2VJdGVtLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFuZWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhbmVsR3JvdXAuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BvcG92ZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Byb2dyZXNzQmFyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Sb3cuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1NwbGl0QnV0dG9uLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9TdWJOYXYuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYlBhbmUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmJlZEFyZWEuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmxlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Ub29sdGlwLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9XZWxsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9jb25zdGFudHMuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL21haW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0N1c3RvbVByb3BUeXBlcy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvRXZlbnRMaXN0ZW5lci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVHJhbnNpdGlvbkV2ZW50cy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvY2xhc3NTZXQuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2Nsb25lV2l0aFByb3BzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2RvbVV0aWxzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9tZXJnZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL2NsaWVudC9yZWFjdC9sb2dpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBLElBQUEsOEVBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBQUEsQ0FBaUIsc0JBQWpCLENBQVIsQ0FBQTs7QUFBQSxLQUVBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FGUixDQUFBOztBQUFBLGNBR0EsR0FBaUIsT0FBQSxDQUFRLGlCQUFSLENBSGpCLENBQUE7O0FBQUEsQ0FLQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBTEosQ0FBQTs7QUFBQSxPQU82QixLQUFLLENBQUMsR0FBbkMsRUFBQyxXQUFBLEdBQUQsRUFBTSxZQUFBLElBQU4sRUFBWSxhQUFBLEtBQVosRUFBbUIsY0FBQSxNQVBuQixDQUFBOztBQUFBLHVCQVFDLEtBQUQsRUFBUSx3QkFBQSxNQVJSLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBaUIsS0FBSyxDQUFDLFdBQU4sQ0FBa0I7QUFBQSxFQUNqQyxlQUFBLEVBQWlCLFNBQUEsR0FBQTtXQUNmO0FBQUEsTUFDRSxTQUFBLEVBQVcsS0FEYjtNQURlO0VBQUEsQ0FEZ0I7QUFBQSxFQU1qQyxZQUFBLEVBQWMsU0FBQSxHQUFBO0FBQ1osUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsUUFBRCxDQUFVO0FBQUEsTUFBRSxTQUFBLEVBQVcsSUFBYjtLQUFWLENBQUEsQ0FBQTtBQUFBLElBQ0EsT0FBQSxHQUFVO0FBQUEsTUFDUixHQUFBLEVBQUssUUFERztBQUFBLE1BRVIsUUFBQSxFQUFVLE1BRkY7QUFBQSxNQUdSLElBQUEsRUFBTSxNQUhFO0FBQUEsTUFJUixXQUFBLEVBQWEsa0JBSkw7QUFBQSxNQUtSLElBQUEsRUFBTSxJQUFJLENBQUMsU0FBTCxDQUFlO0FBQUEsUUFDbkIsT0FBQSxFQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FERztBQUFBLFFBRW5CLFVBQUEsRUFBWSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFsQixDQUFBLENBRk87QUFBQSxRQUduQixVQUFBLEVBQVksSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBbEIsQ0FBQSxDQUhPO0FBQUEsUUFJbkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWQsQ0FBQSxDQUpXO0FBQUEsUUFLbkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWQsQ0FBQSxDQUxXO0FBQUEsUUFNbkIsY0FBQSxFQUFnQixJQUFDLENBQUEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUF0QixDQUFBLENBTkc7T0FBZixDQUxFO0FBQUEsTUFhUixPQUFBLEVBQVMsSUFiRDtLQURWLENBQUE7V0FnQkEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxPQUFQLENBQWUsQ0FBQyxJQUFoQixDQUFxQixTQUFBLEdBQUE7YUFDbkIsTUFBTSxDQUFDLFFBQVAsR0FBa0IsSUFEQztJQUFBLENBQXJCLEVBakJZO0VBQUEsQ0FObUI7QUFBQSxFQTBCakMsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsZ0ZBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQW5CLENBQUE7QUFBQSxJQUVBLGtCQUFBLEdBQXFCO0FBQUEsTUFDbkIsT0FBQSxFQUFRLFNBRFc7QUFBQSxNQUVuQixPQUFBLEVBQVksU0FBSCxHQUFrQixJQUFsQixHQUE0QixJQUFDLENBQUEsWUFGbkI7QUFBQSxNQUduQixRQUFBLEVBQVUsU0FIUztBQUFBLE1BSW5CLFNBQUEsRUFBVyxZQUpRO0tBRnJCLENBQUE7QUFBQSxJQVFBLGVBQUEsR0FBcUIsU0FBSCxHQUFrQixhQUFsQixHQUFxQyxPQVJ2RCxDQUFBO0FBQUEsSUFVQSxjQUFBLEdBQWlCLG9CQVZqQixDQUFBO0FBQUEsSUFXQSxnQkFBQSxHQUFtQixvQkFYbkIsQ0FBQTtXQWFBLEdBQUEsQ0FBSTtBQUFBLE1BQUUsU0FBQSxFQUFXLFdBQWI7S0FBSixFQUNFLElBQUEsQ0FBSztBQUFBLE1BQUMsU0FBQSxFQUFXLGlCQUFaO0tBQUwsRUFDRSxLQUFBLENBQU07QUFBQSxNQUNKLElBQUEsRUFBTSxNQURGO0FBQUEsTUFFSixLQUFBLEVBQU8sVUFGSDtBQUFBLE1BR0osY0FBQSxFQUFnQixjQUhaO0FBQUEsTUFJSixnQkFBQSxFQUFrQixnQkFKZDtBQUFBLE1BS0osR0FBQSxFQUFLLGFBTEQ7QUFBQSxNQU1KLFlBQUEsRUFBYyxVQU5WO0tBQU4sQ0FERixFQVNFLEtBQUEsQ0FBTTtBQUFBLE1BQ0osSUFBQSxFQUFNLFVBREY7QUFBQSxNQUVKLEtBQUEsRUFBTyxVQUZIO0FBQUEsTUFHSixjQUFBLEVBQWdCLGNBSFo7QUFBQSxNQUlKLGdCQUFBLEVBQWtCLGdCQUpkO0FBQUEsTUFLSixHQUFBLEVBQUssYUFMRDtBQUFBLE1BTUosWUFBQSxFQUFjLFVBTlY7S0FBTixDQVRGLEVBaUJFLEtBQUEsQ0FBTTtBQUFBLE1BQ0osSUFBQSxFQUFNLE1BREY7QUFBQSxNQUVKLEtBQUEsRUFBTyxNQUZIO0FBQUEsTUFHSixjQUFBLEVBQWdCLGNBSFo7QUFBQSxNQUlKLGdCQUFBLEVBQWtCLGdCQUpkO0FBQUEsTUFLSixZQUFBLEVBQWEsV0FMVDtBQUFBLE1BTUosR0FBQSxFQUFLLFNBTkQ7S0FBTixDQWpCRixFQXlCRSxLQUFBLENBQU07QUFBQSxNQUNKLElBQUEsRUFBTSxNQURGO0FBQUEsTUFFSixLQUFBLEVBQU8sTUFGSDtBQUFBLE1BR0osY0FBQSxFQUFnQixjQUhaO0FBQUEsTUFJSixnQkFBQSxFQUFrQixnQkFKZDtBQUFBLE1BS0osWUFBQSxFQUFhLE1BTFQ7QUFBQSxNQU1KLEdBQUEsRUFBSyxTQU5EO0tBQU4sQ0F6QkYsRUFpQ0UsS0FBQSxDQUFNO0FBQUEsTUFDSixJQUFBLEVBQU0sUUFERjtBQUFBLE1BRUosS0FBQSxFQUFPLGVBRkg7QUFBQSxNQUdKLGNBQUEsRUFBZ0IsY0FIWjtBQUFBLE1BSUosZ0JBQUEsRUFBa0IsZ0JBSmQ7QUFBQSxNQUtKLFlBQUEsRUFBYSxJQUxUO0FBQUEsTUFNSixHQUFBLEVBQUksaUJBTkE7S0FBTixFQVFFLE1BQUEsQ0FBTztBQUFBLE1BQUUsS0FBQSxFQUFNLElBQVI7S0FBUCxFQUF1QixZQUF2QixDQVJGLEVBU0UsTUFBQSxDQUFPO0FBQUEsTUFBRSxLQUFBLEVBQU0sT0FBUjtLQUFQLEVBQTBCLE9BQTFCLENBVEYsRUFVRSxNQUFBLENBQU87QUFBQSxNQUFFLEtBQUEsRUFBTSxVQUFSO0tBQVAsRUFBNkIsVUFBN0IsQ0FWRixDQWpDRixFQTRDRSxNQUFBLENBQU8sa0JBQVAsRUFBMkIsZUFBM0IsQ0E1Q0YsQ0FERixFQWRNO0VBQUEsQ0ExQnlCO0NBQWxCLENBVGpCLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKXtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gcGFyc2UodmFsKTtcbiAgcmV0dXJuIG9wdGlvbnMubG9uZ1xuICAgID8gbG9uZyh2YWwpXG4gICAgOiBzaG9ydCh2YWwpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1zfHNlY29uZHM/fHN8bWludXRlcz98bXxob3Vycz98aHxkYXlzP3xkfHllYXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoKSByZXR1cm47XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIGlmIChtcyA+PSBtKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpXG4gICAgfHwgcGx1cmFsKG1zLCBoLCAnaG91cicpXG4gICAgfHwgcGx1cmFsKG1zLCBtLCAnbWludXRlJylcbiAgICB8fCBwbHVyYWwobXMsIHMsICdzZWNvbmQnKVxuICAgIHx8IG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHJldHVybjtcbiAgaWYgKG1zIDwgbiAqIDEuNSkgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgUGFuZWxHcm91cCA9IHJlcXVpcmUoJy4vUGFuZWxHcm91cCcpO1xuXG52YXIgQWNjb3JkaW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWNjb3JkaW9uJyxcbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUGFuZWxHcm91cCgge2FjY29yZGlvbjp0cnVlfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBY2NvcmRpb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEFmZml4TWl4aW4gPSByZXF1aXJlKCcuL0FmZml4TWl4aW4nKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcblxudmFyIEFmZml4ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWZmaXgnLFxuICBzdGF0aWNzOiB7XG4gICAgZG9tVXRpbHM6IGRvbVV0aWxzXG4gIH0sXG5cbiAgbWl4aW5zOiBbQWZmaXhNaXhpbl0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhvbGRlclN0eWxlID0ge3RvcDogdGhpcy5zdGF0ZS5hZmZpeFBvc2l0aW9uVG9wfTtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOnRoaXMuc3RhdGUuYWZmaXhDbGFzcywgc3R5bGU6aG9sZGVyU3R5bGV9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFmZml4OyIsIi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xudmFyIEV2ZW50TGlzdGVuZXIgPSByZXF1aXJlKCcuL3V0aWxzL0V2ZW50TGlzdGVuZXInKTtcblxudmFyIEFmZml4TWl4aW4gPSB7XG4gIHByb3BUeXBlczoge1xuICAgIG9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBvZmZzZXRUb3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgb2Zmc2V0Qm90dG9tOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFmZml4Q2xhc3M6ICdhZmZpeC10b3AnXG4gICAgfTtcbiAgfSxcblxuICBnZXRQaW5uZWRPZmZzZXQ6IGZ1bmN0aW9uIChET01Ob2RlKSB7XG4gICAgaWYgKHRoaXMucGlubmVkT2Zmc2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXQ7XG4gICAgfVxuXG4gICAgRE9NTm9kZS5jbGFzc05hbWUgPSBET01Ob2RlLmNsYXNzTmFtZS5yZXBsYWNlKC9hZmZpeC10b3B8YWZmaXgtYm90dG9tfGFmZml4LywgJycpO1xuICAgIERPTU5vZGUuY2xhc3NOYW1lICs9IERPTU5vZGUuY2xhc3NOYW1lLmxlbmd0aCA/ICcgYWZmaXgnIDogJ2FmZml4JztcblxuICAgIHRoaXMucGlubmVkT2Zmc2V0ID0gZG9tVXRpbHMuZ2V0T2Zmc2V0KERPTU5vZGUpLnRvcCAtIHdpbmRvdy5wYWdlWU9mZnNldDtcblxuICAgIHJldHVybiB0aGlzLnBpbm5lZE9mZnNldDtcbiAgfSxcblxuICBjaGVja1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIERPTU5vZGUsIHNjcm9sbEhlaWdodCwgc2Nyb2xsVG9wLCBwb3NpdGlvbiwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20sXG4gICAgICAgIGFmZml4LCBhZmZpeFR5cGUsIGFmZml4UG9zaXRpb25Ub3A7XG5cbiAgICAvLyBUT0RPOiBvciBub3QgdmlzaWJsZVxuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIERPTU5vZGUgPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICBzY3JvbGxIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIHNjcm9sbFRvcCA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICBwb3NpdGlvbiA9IGRvbVV0aWxzLmdldE9mZnNldChET01Ob2RlKTtcbiAgICBvZmZzZXRUb3A7XG4gICAgb2Zmc2V0Qm90dG9tO1xuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PT0gJ3RvcCcpIHtcbiAgICAgIHBvc2l0aW9uLnRvcCArPSBzY3JvbGxUb3A7XG4gICAgfVxuXG4gICAgb2Zmc2V0VG9wID0gdGhpcy5wcm9wcy5vZmZzZXRUb3AgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLm9mZnNldFRvcCA6IHRoaXMucHJvcHMub2Zmc2V0O1xuICAgIG9mZnNldEJvdHRvbSA9IHRoaXMucHJvcHMub2Zmc2V0Qm90dG9tICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5vZmZzZXRCb3R0b20gOiB0aGlzLnByb3BzLm9mZnNldDtcblxuICAgIGlmIChvZmZzZXRUb3AgPT0gbnVsbCAmJiBvZmZzZXRCb3R0b20gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0VG9wID09IG51bGwpIHtcbiAgICAgIG9mZnNldFRvcCA9IDA7XG4gICAgfVxuICAgIGlmIChvZmZzZXRCb3R0b20gPT0gbnVsbCkge1xuICAgICAgb2Zmc2V0Qm90dG9tID0gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsICYmIChzY3JvbGxUb3AgKyB0aGlzLnVucGluIDw9IHBvc2l0aW9uLnRvcCkpIHtcbiAgICAgIGFmZml4ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChvZmZzZXRCb3R0b20gIT0gbnVsbCAmJiAocG9zaXRpb24udG9wICsgRE9NTm9kZS5vZmZzZXRIZWlnaHQgPj0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSkge1xuICAgICAgYWZmaXggPSAnYm90dG9tJztcbiAgICB9IGVsc2UgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIChzY3JvbGxUb3AgPD0gb2Zmc2V0VG9wKSkge1xuICAgICAgYWZmaXggPSAndG9wJztcbiAgICB9IGVsc2Uge1xuICAgICAgYWZmaXggPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hZmZpeGVkID09PSBhZmZpeCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnVucGluICE9IG51bGwpIHtcbiAgICAgIERPTU5vZGUuc3R5bGUudG9wID0gJyc7XG4gICAgfVxuXG4gICAgYWZmaXhUeXBlID0gJ2FmZml4JyArIChhZmZpeCA/ICctJyArIGFmZml4IDogJycpO1xuXG4gICAgdGhpcy5hZmZpeGVkID0gYWZmaXg7XG4gICAgdGhpcy51bnBpbiA9IGFmZml4ID09PSAnYm90dG9tJyA/XG4gICAgICB0aGlzLmdldFBpbm5lZE9mZnNldChET01Ob2RlKSA6IG51bGw7XG5cbiAgICBpZiAoYWZmaXggPT09ICdib3R0b20nKSB7XG4gICAgICBET01Ob2RlLmNsYXNzTmFtZSA9IERPTU5vZGUuY2xhc3NOYW1lLnJlcGxhY2UoL2FmZml4LXRvcHxhZmZpeC1ib3R0b218YWZmaXgvLCAnYWZmaXgtdG9wJyk7XG4gICAgICBhZmZpeFBvc2l0aW9uVG9wID0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tIC0gRE9NTm9kZS5vZmZzZXRIZWlnaHQgLSBkb21VdGlscy5nZXRPZmZzZXQoRE9NTm9kZSkudG9wO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgYWZmaXhDbGFzczogYWZmaXhUeXBlLFxuICAgICAgYWZmaXhQb3NpdGlvblRvcDogYWZmaXhQb3NpdGlvblRvcFxuICAgIH0pO1xuICB9LFxuXG4gIGNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wOiBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dCh0aGlzLmNoZWNrUG9zaXRpb24sIDApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbih3aW5kb3csICdzY3JvbGwnLCB0aGlzLmNoZWNrUG9zaXRpb24pO1xuICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAnY2xpY2snLCB0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9vbldpbmRvd1Njcm9sbExpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbldpbmRvd1Njcm9sbExpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgaWYgKHByZXZTdGF0ZS5hZmZpeENsYXNzID09PSB0aGlzLnN0YXRlLmFmZml4Q2xhc3MpIHtcbiAgICAgIHRoaXMuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWZmaXhNaXhpbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIEFsZXJ0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWxlcnQnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25EaXNtaXNzOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkaXNtaXNzQWZ0ZXI6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2FsZXJ0JyxcbiAgICAgIGJzU3R5bGU6ICdpbmZvJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyRGlzbWlzc0J1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYnV0dG9uKFxuICAgICAgICB7dHlwZTpcImJ1dHRvblwiLFxuICAgICAgICBjbGFzc05hbWU6XCJjbG9zZVwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMucHJvcHMub25EaXNtaXNzLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOlwidHJ1ZVwifSwgXG4gICAgICAgIFwiIMOXIFwiXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIHZhciBpc0Rpc21pc3NhYmxlID0gISF0aGlzLnByb3BzLm9uRGlzbWlzcztcblxuICAgIGNsYXNzZXNbJ2FsZXJ0LWRpc21pc3NhYmxlJ10gPSBpc0Rpc21pc3NhYmxlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBpc0Rpc21pc3NhYmxlID8gdGhpcy5yZW5kZXJEaXNtaXNzQnV0dG9uKCkgOiBudWxsLFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuZGlzbWlzc0FmdGVyICYmIHRoaXMucHJvcHMub25EaXNtaXNzKSB7XG4gICAgICB0aGlzLmRpc21pc3NUaW1lciA9IHNldFRpbWVvdXQodGhpcy5wcm9wcy5vbkRpc21pc3MsIHRoaXMucHJvcHMuZGlzbWlzc0FmdGVyKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmRpc21pc3NUaW1lcik7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFsZXJ0OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBCYWRnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0JhZGdlJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdwdWxsLXJpZ2h0JzogdGhpcy5wcm9wcy5wdWxsUmlnaHQsXG4gICAgICAnYmFkZ2UnOiBWYWxpZENvbXBvbmVudENoaWxkcmVuLmhhc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuY2hpbGRyZW4pXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFkZ2U7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG52YXIgQm9vdHN0cmFwTWl4aW4gPSB7XG4gIHByb3BUeXBlczoge1xuICAgIGJzQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihPYmplY3Qua2V5cyhjb25zdGFudHMuQ0xBU1NFUykpLFxuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihPYmplY3Qua2V5cyhjb25zdGFudHMuU1RZTEVTKSksXG4gICAgYnNTaXplOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLlNJWkVTKSlcbiAgfSxcblxuICBnZXRCc0NsYXNzU2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIHZhciBic0NsYXNzID0gdGhpcy5wcm9wcy5ic0NsYXNzICYmIGNvbnN0YW50cy5DTEFTU0VTW3RoaXMucHJvcHMuYnNDbGFzc107XG4gICAgaWYgKGJzQ2xhc3MpIHtcbiAgICAgIGNsYXNzZXNbYnNDbGFzc10gPSB0cnVlO1xuXG4gICAgICB2YXIgcHJlZml4ID0gYnNDbGFzcyArICctJztcblxuICAgICAgdmFyIGJzU2l6ZSA9IHRoaXMucHJvcHMuYnNTaXplICYmIGNvbnN0YW50cy5TSVpFU1t0aGlzLnByb3BzLmJzU2l6ZV07XG4gICAgICBpZiAoYnNTaXplKSB7XG4gICAgICAgIGNsYXNzZXNbcHJlZml4ICsgYnNTaXplXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBic1N0eWxlID0gdGhpcy5wcm9wcy5ic1N0eWxlICYmIGNvbnN0YW50cy5TVFlMRVNbdGhpcy5wcm9wcy5ic1N0eWxlXTtcbiAgICAgIGlmICh0aGlzLnByb3BzLmJzU3R5bGUpIHtcbiAgICAgICAgY2xhc3Nlc1twcmVmaXggKyBic1N0eWxlXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsYXNzZXM7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQm9vdHN0cmFwTWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGFjdGl2ZTogICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYmxvY2s6ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdkl0ZW06ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdkRyb3Bkb3duOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0JyxcbiAgICAgIHR5cGU6ICdidXR0b24nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMucHJvcHMubmF2RHJvcGRvd24gPyB7fSA6IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIHZhciByZW5kZXJGdW5jTmFtZTtcblxuICAgIGNsYXNzZXNbJ2FjdGl2ZSddID0gdGhpcy5wcm9wcy5hY3RpdmU7XG4gICAgY2xhc3Nlc1snYnRuLWJsb2NrJ10gPSB0aGlzLnByb3BzLmJsb2NrO1xuXG4gICAgaWYgKHRoaXMucHJvcHMubmF2SXRlbSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyTmF2SXRlbShjbGFzc2VzKTtcbiAgICB9XG5cbiAgICByZW5kZXJGdW5jTmFtZSA9IHRoaXMucHJvcHMuaHJlZiB8fCB0aGlzLnByb3BzLm5hdkRyb3Bkb3duID9cbiAgICAgICdyZW5kZXJBbmNob3InIDogJ3JlbmRlckJ1dHRvbic7XG5cbiAgICByZXR1cm4gdGhpc1tyZW5kZXJGdW5jTmFtZV0oY2xhc3Nlcyk7XG4gIH0sXG5cbiAgcmVuZGVyQW5jaG9yOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHZhciBocmVmID0gdGhpcy5wcm9wcy5ocmVmIHx8ICcjJztcbiAgICBjbGFzc2VzWydkaXNhYmxlZCddID0gdGhpcy5wcm9wcy5kaXNhYmxlZDtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICB7aHJlZjpocmVmLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgIHJvbGU6XCJidXR0b25cIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJCdXR0b246IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbihcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHZhciBsaUNsYXNzZXMgPSB7XG4gICAgICBhY3RpdmU6IHRoaXMucHJvcHMuYWN0aXZlXG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQobGlDbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnJlbmRlckFuY2hvcihjbGFzc2VzKVxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcblxudmFyIEJ1dHRvbkdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQnV0dG9uR3JvdXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgdmVydGljYWw6ICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBqdXN0aWZpZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdidXR0b24tZ3JvdXAnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cCddID0gIXRoaXMucHJvcHMudmVydGljYWw7XG4gICAgY2xhc3Nlc1snYnRuLWdyb3VwLXZlcnRpY2FsJ10gPSB0aGlzLnByb3BzLnZlcnRpY2FsO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cC1qdXN0aWZpZWQnXSA9IHRoaXMucHJvcHMuanVzdGlmaWVkO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uR3JvdXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG5cbnZhciBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbkdyb3VwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uLXRvb2xiYXInXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge3JvbGU6XCJ0b29sYmFyXCIsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uR3JvdXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIENhcm91c2VsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ2Fyb3VzZWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgc2xpZGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGluZGljYXRvcnM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbnRyb2xzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBwYXVzZU9uSG92ZXI6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHdyYXA6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblNsaWRlRW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmVJbmRleDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWZhdWx0QWN0aXZlSW5kZXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGlyZWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydwcmV2JywgJ25leHQnXSlcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2xpZGU6IHRydWUsXG4gICAgICBpbnRlcnZhbDogNTAwMCxcbiAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgIHdyYXA6IHRydWUsXG4gICAgICBpbmRpY2F0b3JzOiB0cnVlLFxuICAgICAgY29udHJvbHM6IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVJbmRleDogdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlSW5kZXggPT0gbnVsbCA/XG4gICAgICAgIDAgOiB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVJbmRleCxcbiAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IG51bGwsXG4gICAgICBkaXJlY3Rpb246IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIGdldERpcmVjdGlvbjogZnVuY3Rpb24gKHByZXZJbmRleCwgaW5kZXgpIHtcbiAgICBpZiAocHJldkluZGV4ID09PSBpbmRleCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZJbmRleCA+IGluZGV4ID9cbiAgICAgICdwcmV2JyA6ICduZXh0JztcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuXG4gICAgaWYgKG5leHRQcm9wcy5hY3RpdmVJbmRleCAhPSBudWxsICYmIG5leHRQcm9wcy5hY3RpdmVJbmRleCAhPT0gYWN0aXZlSW5kZXgpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IGFjdGl2ZUluZGV4LFxuICAgICAgICBkaXJlY3Rpb246IG5leHRQcm9wcy5kaXJlY3Rpb24gIT0gbnVsbCA/XG4gICAgICAgICAgbmV4dFByb3BzLmRpcmVjdGlvbiA6IHRoaXMuZ2V0RGlyZWN0aW9uKGFjdGl2ZUluZGV4LCBuZXh0UHJvcHMuYWN0aXZlSW5kZXgpXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICB9LFxuXG4gIG5leHQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCkgKyAxO1xuICAgIHZhciBjb3VudCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICBpZiAoaW5kZXggPiBjb3VudCAtIDEpIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVNlbGVjdChpbmRleCwgJ25leHQnKTtcbiAgfSxcblxuICBwcmV2OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpIC0gMTtcblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5udW1iZXJPZih0aGlzLnByb3BzLmNoaWxkcmVuKSAtIDE7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVTZWxlY3QoaW5kZXgsICdwcmV2Jyk7XG4gIH0sXG5cbiAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgfSxcblxuICBwbGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIHRoaXMud2FpdEZvck5leHQoKTtcbiAgfSxcblxuICB3YWl0Rm9yTmV4dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc1BhdXNlZCAmJiB0aGlzLnByb3BzLnNsaWRlICYmIHRoaXMucHJvcHMuaW50ZXJ2YWwgJiZcbiAgICAgICAgdGhpcy5wcm9wcy5hY3RpdmVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMubmV4dCwgdGhpcy5wcm9wcy5pbnRlcnZhbCk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZU1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLnBhdXNlT25Ib3Zlcikge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVNb3VzZU91dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzUGF1c2VkKSB7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICBjYXJvdXNlbDogdHJ1ZSxcbiAgICAgIHNsaWRlOiB0aGlzLnByb3BzLnNsaWRlXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgIG9uTW91c2VPdmVyOnRoaXMuaGFuZGxlTW91c2VPdmVyLFxuICAgICAgICBvbk1vdXNlT3V0OnRoaXMuaGFuZGxlTW91c2VPdXR9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5pbmRpY2F0b3JzID8gdGhpcy5yZW5kZXJJbmRpY2F0b3JzKCkgOiBudWxsLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtaW5uZXJcIiwgcmVmOlwiaW5uZXJcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVySXRlbSlcbiAgICAgICAgKSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb250cm9scyA/IHRoaXMucmVuZGVyQ29udHJvbHMoKSA6IG51bGxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclByZXY6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJsZWZ0IGNhcm91c2VsLWNvbnRyb2xcIiwgaHJlZjpcIiNwcmV2XCIsIGtleTowLCBvbkNsaWNrOnRoaXMucHJldn0sIFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9IClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJyaWdodCBjYXJvdXNlbC1jb250cm9sXCIsIGhyZWY6XCIjbmV4dFwiLCBrZXk6MSwgb25DbGljazp0aGlzLm5leHR9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIn0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb250cm9sczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLndyYXApIHtcbiAgICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICAgIHZhciBjb3VudCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICAgIHJldHVybiBbXG4gICAgICAgIChhY3RpdmVJbmRleCAhPT0gMCkgPyB0aGlzLnJlbmRlclByZXYoKSA6IG51bGwsXG4gICAgICAgIChhY3RpdmVJbmRleCAhPT0gY291bnQgLSAxKSA/IHRoaXMucmVuZGVyTmV4dCgpIDogbnVsbFxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5yZW5kZXJQcmV2KCksXG4gICAgICB0aGlzLnJlbmRlck5leHQoKVxuICAgIF07XG4gIH0sXG5cbiAgcmVuZGVySW5kaWNhdG9yOiBmdW5jdGlvbiAoY2hpbGQsIGluZGV4KSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IChpbmRleCA9PT0gdGhpcy5nZXRBY3RpdmVJbmRleCgpKSA/XG4gICAgICAnYWN0aXZlJyA6IG51bGw7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmxpKFxuICAgICAgICB7a2V5OmluZGV4LFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NOYW1lLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0LmJpbmQodGhpcywgaW5kZXgsIG51bGwpfSApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJJbmRpY2F0b3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGluZGljYXRvcnMgPSBbXTtcbiAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuXG4gICAgICAuZm9yRWFjaCh0aGlzLnByb3BzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCwgaW5kZXgpIHtcbiAgICAgICAgaW5kaWNhdG9ycy5wdXNoKFxuICAgICAgICAgIHRoaXMucmVuZGVySW5kaWNhdG9yKGNoaWxkLCBpbmRleCksXG5cbiAgICAgICAgICAvLyBGb3JjZSB3aGl0ZXNwYWNlIGJldHdlZW4gaW5kaWNhdG9yIGVsZW1lbnRzLCBib290c3RyYXBcbiAgICAgICAgICAvLyByZXF1aXJlcyB0aGlzIGZvciBjb3JyZWN0IHNwYWNpbmcgb2YgZWxlbWVudHMuXG4gICAgICAgICAgJyAnXG4gICAgICAgICk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ub2woIHtjbGFzc05hbWU6XCJjYXJvdXNlbC1pbmRpY2F0b3JzXCJ9LCBcbiAgICAgICAgaW5kaWNhdG9yc1xuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgZ2V0QWN0aXZlSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5hY3RpdmVJbmRleCAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVJbmRleCA6IHRoaXMuc3RhdGUuYWN0aXZlSW5kZXg7XG4gIH0sXG5cbiAgaGFuZGxlSXRlbUFuaW1hdGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IG51bGwsXG4gICAgICBkaXJlY3Rpb246IG51bGxcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMud2FpdEZvck5leHQoKTtcblxuICAgICAgaWYgKHRoaXMucHJvcHMub25TbGlkZUVuZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2xpZGVFbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJJdGVtOiBmdW5jdGlvbiAoY2hpbGQsIGluZGV4KSB7XG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuICAgIHZhciBpc0FjdGl2ZSA9IChpbmRleCA9PT0gYWN0aXZlSW5kZXgpO1xuICAgIHZhciBpc1ByZXZpb3VzQWN0aXZlID0gdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCA9PT0gaW5kZXggJiYgdGhpcy5wcm9wcy5zbGlkZTtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIHtcbiAgICAgICAgICBhY3RpdmU6IGlzQWN0aXZlLFxuICAgICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5ICE9IG51bGwgP1xuICAgICAgICAgICAgY2hpbGQucHJvcHMua2V5IDogaW5kZXgsXG4gICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgIGFuaW1hdGVPdXQ6IGlzUHJldmlvdXNBY3RpdmUsXG4gICAgICAgICAgYW5pbWF0ZUluOiBpc0FjdGl2ZSAmJiB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggIT0gbnVsbCAmJiB0aGlzLnByb3BzLnNsaWRlLFxuICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5zdGF0ZS5kaXJlY3Rpb24sXG4gICAgICAgICAgb25BbmltYXRlT3V0RW5kOiBpc1ByZXZpb3VzQWN0aXZlID8gdGhpcy5oYW5kbGVJdGVtQW5pbWF0ZU91dEVuZDogbnVsbFxuICAgICAgICB9XG4gICAgICApO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGluZGV4LCBkaXJlY3Rpb24pIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcblxuICAgIHZhciBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiB8fCB0aGlzLmdldERpcmVjdGlvbihwcmV2aW91c0FjdGl2ZUluZGV4LCBpbmRleCk7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChpbmRleCwgZGlyZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVJbmRleCA9PSBudWxsICYmIGluZGV4ICE9PSBwcmV2aW91c0FjdGl2ZUluZGV4KSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgLy8gSWYgY3VycmVudGx5IGFuaW1hdGluZyBkb24ndCBhY3RpdmF0ZSB0aGUgbmV3IGluZGV4LlxuICAgICAgICAvLyBUT0RPOiBsb29rIGludG8gcXVldWluZyB0aGlzIGNhbmNlbGVkIGNhbGwgYW5kXG4gICAgICAgIC8vIGFuaW1hdGluZyBhZnRlciB0aGUgY3VycmVudCBhbmltYXRpb24gaGFzIGVuZGVkLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhY3RpdmVJbmRleDogaW5kZXgsXG4gICAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IHByZXZpb3VzQWN0aXZlSW5kZXgsXG4gICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcm91c2VsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBDYXJvdXNlbEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDYXJvdXNlbEl0ZW0nLFxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXJlY3Rpb246IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3ByZXYnLCAnbmV4dCddKSxcbiAgICBvbkFuaW1hdGVPdXRFbmQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY2FwdGlvbjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVBbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kICYmIHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kKHRoaXMucHJvcHMuaW5kZXgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlICE9PSBuZXh0UHJvcHMuYWN0aXZlKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmFjdGl2ZSAmJiBwcmV2UHJvcHMuYWN0aXZlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZ2V0RE9NTm9kZSgpLFxuICAgICAgICB0aGlzLmhhbmRsZUFuaW1hdGVPdXRFbmRcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlICE9PSBwcmV2UHJvcHMuYWN0aXZlKSB7XG4gICAgICBzZXRUaW1lb3V0KHRoaXMuc3RhcnRBbmltYXRpb24sIDIwKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RhcnRBbmltYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5wcm9wcy5kaXJlY3Rpb24gPT09ICdwcmV2JyA/XG4gICAgICAgICdyaWdodCcgOiAnbGVmdCdcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgIGl0ZW06IHRydWUsXG4gICAgICBhY3RpdmU6ICh0aGlzLnByb3BzLmFjdGl2ZSAmJiAhdGhpcy5wcm9wcy5hbmltYXRlSW4pIHx8IHRoaXMucHJvcHMuYW5pbWF0ZU91dCxcbiAgICAgIG5leHQ6IHRoaXMucHJvcHMuYWN0aXZlICYmIHRoaXMucHJvcHMuYW5pbWF0ZUluICYmIHRoaXMucHJvcHMuZGlyZWN0aW9uID09PSAnbmV4dCcsXG4gICAgICBwcmV2OiB0aGlzLnByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFuaW1hdGVJbiAmJiB0aGlzLnByb3BzLmRpcmVjdGlvbiA9PT0gJ3ByZXYnXG4gICAgfTtcblxuICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbiAmJiAodGhpcy5wcm9wcy5hbmltYXRlSW4gfHwgdGhpcy5wcm9wcy5hbmltYXRlT3V0KSkge1xuICAgICAgY2xhc3Nlc1t0aGlzLnN0YXRlLmRpcmVjdGlvbl0gPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlbixcbiAgICAgICAgdGhpcy5wcm9wcy5jYXB0aW9uID8gdGhpcy5yZW5kZXJDYXB0aW9uKCkgOiBudWxsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDYXB0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjYXJvdXNlbC1jYXB0aW9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jYXB0aW9uXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2Fyb3VzZWxJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5cblxudmFyIENvbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0NvbCcsXG4gIHByb3BUeXBlczoge1xuICAgIHhzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHhzT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHhzUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbVB1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWRQdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c1B1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc21QdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ1B1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMoY29uc3RhbnRzLlNJWkVTKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciBzaXplID0gY29uc3RhbnRzLlNJWkVTW2tleV07XG4gICAgICB2YXIgcHJvcCA9IHNpemU7XG4gICAgICB2YXIgY2xhc3NQYXJ0ID0gc2l6ZSArICctJztcblxuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgY2xhc3Nlc1snY29sLScgKyBjbGFzc1BhcnQgKyB0aGlzLnByb3BzW3Byb3BdXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHByb3AgPSBzaXplICsgJ09mZnNldCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1vZmZzZXQtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdQdXNoJztcbiAgICAgIGNsYXNzUGFydCA9IHNpemUgKyAnLXB1c2gtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdQdWxsJztcbiAgICAgIGNsYXNzUGFydCA9IHNpemUgKyAnLXB1bGwtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbDsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBDb2xsYXBzYWJsZU1peGluID0ge1xuXG4gIHByb3BUeXBlczoge1xuICAgIGNvbGxhcHNhYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkZWZhdWx0RXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy5kZWZhdWx0RXhwYW5kZWQgIT0gbnVsbCA/IHRoaXMucHJvcHMuZGVmYXVsdEV4cGFuZGVkIDogbnVsbCxcbiAgICAgIGNvbGxhcHNpbmc6IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVUcmFuc2l0aW9uRW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY29sbGFwc2VFbmQgPSB0cnVlO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgY29sbGFwc2luZzogZmFsc2VcbiAgICB9KTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV3UHJvcHMpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5jb2xsYXBzYWJsZSAmJiBuZXdQcm9wcy5leHBhbmRlZCAhPT0gdGhpcy5wcm9wcy5leHBhbmRlZCkge1xuICAgICAgdGhpcy5fY29sbGFwc2VFbmQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBjb2xsYXBzaW5nOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2FkZEVuZFRyYW5zaXRpb25MaXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIHRoaXMuaGFuZGxlVHJhbnNpdGlvbkVuZFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIHRoaXMuaGFuZGxlVHJhbnNpdGlvbkVuZFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9hZnRlclJlbmRlcigpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVtb3ZlRW5kVHJhbnNpdGlvbkxpc3RlbmVyKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIHZhciBkaW1lbnNpb24gPSAodHlwZW9mIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24gPT09ICdmdW5jdGlvbicpID9cbiAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24oKSA6ICdoZWlnaHQnO1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIHRoaXMuX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICAgIGlmIChub2RlICYmIG5leHRQcm9wcy5leHBhbmRlZCAhPT0gdGhpcy5wcm9wcy5leHBhbmRlZCAmJiB0aGlzLnByb3BzLmV4cGFuZGVkKSB7XG4gICAgICBub2RlLnN0eWxlW2RpbWVuc2lvbl0gPSB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWUoKSArICdweCc7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuY29sbGFwc2luZyAhPT0gcHJldlN0YXRlLmNvbGxhcHNpbmcpIHtcbiAgICAgIHRoaXMuX2FmdGVyUmVuZGVyKCk7XG4gICAgfVxuICB9LFxuXG4gIF9hZnRlclJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2FkZEVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICAgIHNldFRpbWVvdXQodGhpcy5fdXBkYXRlRGltZW5zaW9uQWZ0ZXJSZW5kZXIsIDApO1xuICB9LFxuXG4gIF91cGRhdGVEaW1lbnNpb25BZnRlclJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkaW1lbnNpb24gPSAodHlwZW9mIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24gPT09ICdmdW5jdGlvbicpID9cbiAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24oKSA6ICdoZWlnaHQnO1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBub2RlLnN0eWxlW2RpbWVuc2lvbl0gPSB0aGlzLmlzRXhwYW5kZWQoKSA/XG4gICAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb25WYWx1ZSgpICsgJ3B4JyA6ICcwcHgnO1xuICAgIH1cbiAgfSxcblxuICBpc0V4cGFuZGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLnByb3BzLmV4cGFuZGVkICE9IG51bGwpID9cbiAgICAgIHRoaXMucHJvcHMuZXhwYW5kZWQgOiB0aGlzLnN0YXRlLmV4cGFuZGVkO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlQ2xhc3NTZXQ6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBjbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgIGNsYXNzZXNbY2xhc3NOYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNsYXNzZXMuY29sbGFwc2luZyA9IHRoaXMuc3RhdGUuY29sbGFwc2luZztcbiAgICBjbGFzc2VzLmNvbGxhcHNlID0gIXRoaXMuc3RhdGUuY29sbGFwc2luZztcbiAgICBjbGFzc2VzWydpbiddID0gdGhpcy5pc0V4cGFuZGVkKCkgJiYgIXRoaXMuc3RhdGUuY29sbGFwc2luZztcblxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhcHNhYmxlTWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0gcmVxdWlyZSgnLi9Ecm9wZG93blN0YXRlTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xudmFyIEJ1dHRvbkdyb3VwID0gcmVxdWlyZSgnLi9CdXR0b25Hcm91cCcpO1xudmFyIERyb3Bkb3duTWVudSA9IHJlcXVpcmUoJy4vRHJvcGRvd25NZW51Jyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG5cbnZhciBEcm9wZG93bkJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Ryb3Bkb3duQnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIERyb3Bkb3duU3RhdGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkcm9wdXA6ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHRpdGxlOiAgICAgUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaHJlZjogICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25TZWxlY3Q6ICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBuYXZJdGVtOiAgIFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9ICdkcm9wZG93bi10b2dnbGUnO1xuXG4gICAgdmFyIHJlbmRlck1ldGhvZCA9IHRoaXMucHJvcHMubmF2SXRlbSA/XG4gICAgICAncmVuZGVyTmF2SXRlbScgOiAncmVuZGVyQnV0dG9uR3JvdXAnO1xuXG4gICAgcmV0dXJuIHRoaXNbcmVuZGVyTWV0aG9kXShbXG4gICAgICB0aGlzLnRyYW5zZmVyUHJvcHNUbyhCdXR0b24oXG4gICAgICAgIHtyZWY6XCJkcm9wZG93bkJ1dHRvblwiLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NOYW1lLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlRHJvcGRvd25DbGljayxcbiAgICAgICAga2V5OjAsXG4gICAgICAgIG5hdkRyb3Bkb3duOnRoaXMucHJvcHMubmF2SXRlbSxcbiAgICAgICAgbmF2SXRlbTpudWxsLFxuICAgICAgICB0aXRsZTpudWxsLFxuICAgICAgICBwdWxsUmlnaHQ6bnVsbCxcbiAgICAgICAgZHJvcHVwOm51bGx9LCBcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSwnICcsXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiY2FyZXRcIn0gKVxuICAgICAgKSksXG4gICAgICBEcm9wZG93bk1lbnUoXG4gICAgICAgIHtyZWY6XCJtZW51XCIsXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOnRoaXMucHJvcHMuaWQsXG4gICAgICAgIHB1bGxSaWdodDp0aGlzLnByb3BzLnB1bGxSaWdodCxcbiAgICAgICAga2V5OjF9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJNZW51SXRlbSlcbiAgICAgIClcbiAgICBdKTtcbiAgfSxcblxuICByZW5kZXJCdXR0b25Hcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGdyb3VwQ2xhc3NlcyA9IHtcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBCdXR0b25Hcm91cChcbiAgICAgICAge2JzU2l6ZTp0aGlzLnByb3BzLmJzU2l6ZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGdyb3VwQ2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24nOiB0cnVlLFxuICAgICAgICAnb3Blbic6IHRoaXMuc3RhdGUub3BlbixcbiAgICAgICAgJ2Ryb3B1cCc6IHRoaXMucHJvcHMuZHJvcHVwXG4gICAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTWVudUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIC8vIE9ubHkgaGFuZGxlIHRoZSBvcHRpb24gc2VsZWN0aW9uIGlmIGFuIG9uU2VsZWN0IHByb3AgaGFzIGJlZW4gc2V0IG9uIHRoZVxuICAgIC8vIGNvbXBvbmVudCBvciBpdCdzIGNoaWxkLCB0aGlzIGFsbG93cyBhIHVzZXIgbm90IHRvIHBhc3MgYW4gb25TZWxlY3RcbiAgICAvLyBoYW5kbGVyIGFuZCBoYXZlIHRoZSBicm93c2VyIHByZWZvcm0gdGhlIGRlZmF1bHQgYWN0aW9uLlxuICAgIHZhciBoYW5kbGVPcHRpb25TZWxlY3QgPSB0aGlzLnByb3BzLm9uU2VsZWN0IHx8IGNoaWxkLnByb3BzLm9uU2VsZWN0ID9cbiAgICAgIHRoaXMuaGFuZGxlT3B0aW9uU2VsZWN0IDogbnVsbDtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICAvLyBDYXB0dXJlIG9uU2VsZWN0IGV2ZW50c1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCBoYW5kbGVPcHRpb25TZWxlY3QpLFxuXG4gICAgICAgIC8vIEZvcmNlIHNwZWNpYWwgcHJvcHMgdG8gYmUgdHJhbnNmZXJyZWRcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgICB9XG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVEcm9wZG93bkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZSghdGhpcy5zdGF0ZS5vcGVuKTtcbiAgfSxcblxuICBoYW5kbGVPcHRpb25TZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQnV0dG9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIERyb3Bkb3duTWVudSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Ryb3Bkb3duTWVudScsXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAgICdkcm9wZG93bi1tZW51JzogdHJ1ZSxcbiAgICAgICAgJ2Ryb3Bkb3duLW1lbnUtcmlnaHQnOiB0aGlzLnByb3BzLnB1bGxSaWdodFxuICAgICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgUmVhY3QuRE9NLnVsKFxuICAgICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgICAgcm9sZTpcIm1lbnVcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTWVudUl0ZW0pXG4gICAgICAgIClcbiAgICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTWVudUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICAvLyBDYXB0dXJlIG9uU2VsZWN0IGV2ZW50c1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcblxuICAgICAgICAvLyBGb3JjZSBzcGVjaWFsIHByb3BzIHRvIGJlIHRyYW5zZmVycmVkXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duTWVudTsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBFdmVudExpc3RlbmVyID0gcmVxdWlyZSgnLi91dGlscy9FdmVudExpc3RlbmVyJyk7XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBub2RlIGlzIHdpdGhpblxuICogYSByb290IG5vZGVzIHRyZWVcbiAqXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gcm9vdFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzTm9kZUluUm9vdChub2RlLCByb290KSB7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKG5vZGUgPT09IHJvb3QpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0ge1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3BlbjogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIHNldERyb3Bkb3duU3RhdGU6IGZ1bmN0aW9uIChuZXdTdGF0ZSwgb25TdGF0ZUNoYW5nZUNvbXBsZXRlKSB7XG4gICAgaWYgKG5ld1N0YXRlKSB7XG4gICAgICB0aGlzLmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVuYmluZFJvb3RDbG9zZUhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBvcGVuOiBuZXdTdGF0ZVxuICAgIH0sIG9uU3RhdGVDaGFuZ2VDb21wbGV0ZSk7XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRLZXlVcDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAyNykge1xuICAgICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAvLyBJZiB0aGUgY2xpY2sgb3JpZ2luYXRlZCBmcm9tIHdpdGhpbiB0aGlzIGNvbXBvbmVudFxuICAgIC8vIGRvbid0IGRvIGFueXRoaW5nLlxuICAgIGlmIChpc05vZGVJblJvb3QoZS50YXJnZXQsIHRoaXMuZ2V0RE9NTm9kZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH0sXG5cbiAgYmluZFJvb3RDbG9zZUhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdjbGljaycsIHRoaXMuaGFuZGxlRG9jdW1lbnRDbGljayk7XG4gICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuaGFuZGxlRG9jdW1lbnRLZXlVcCk7XG4gIH0sXG5cbiAgdW5iaW5kUm9vdENsb3NlSGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy51bmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duU3RhdGVNaXhpbjsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxuLy8gVE9ETzogbGlzdGVuIGZvciBvblRyYW5zaXRpb25FbmQgdG8gcmVtb3ZlIGVsXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgX2ZhZGVJbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHM7XG5cbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgZWxzID0gdGhpcy5nZXRET01Ob2RlKCkucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUnKTtcbiAgICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxzLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICBlbC5jbGFzc05hbWUgKz0gJyBpbic7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBfZmFkZU91dDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHMgPSB0aGlzLl9mYWRlT3V0RWwucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUuaW4nKTtcblxuICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVscywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKC9cXGJpblxcYi8sICcnKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQodGhpcy5faGFuZGxlRmFkZU91dEVuZCwgMzAwKTtcbiAgfSxcblxuICBfaGFuZGxlRmFkZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9mYWRlT3V0RWwgJiYgdGhpcy5fZmFkZU91dEVsLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMuX2ZhZGVPdXRFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2ZhZGVPdXRFbCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgIC8vIEZpcmVmb3ggbmVlZHMgZGVsYXkgZm9yIHRyYW5zaXRpb24gdG8gYmUgdHJpZ2dlcmVkXG4gICAgICBzZXRUaW1lb3V0KHRoaXMuX2ZhZGVJbiwgMjApO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHMgPSB0aGlzLmdldERPTU5vZGUoKS5xdWVyeVNlbGVjdG9yQWxsKCcuZmFkZScpO1xuICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5fZmFkZU91dEVsKTtcbiAgICAgIHRoaXMuX2ZhZGVPdXRFbC5hcHBlbmRDaGlsZCh0aGlzLmdldERPTU5vZGUoKS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgLy8gRmlyZWZveCBuZWVkcyBkZWxheSBmb3IgdHJhbnNpdGlvbiB0byBiZSB0cmlnZ2VyZWRcbiAgICAgIHNldFRpbWVvdXQodGhpcy5fZmFkZU91dCwgMjApO1xuICAgIH1cbiAgfVxufTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG52YXIgR2x5cGhpY29uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR2x5cGhpY29uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGdseXBoOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoY29uc3RhbnRzLkdMWVBIUykuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnZ2x5cGhpY29uJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIGNsYXNzZXNbJ2dseXBoaWNvbi0nICsgdGhpcy5wcm9wcy5nbHlwaF0gPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdseXBoaWNvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxuXG52YXIgR3JpZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0dyaWQnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBmbHVpZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOnRoaXMucHJvcHMuZmx1aWQgPyAnY29udGFpbmVyLWZsdWlkJyA6ICdjb250YWluZXInfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmlkOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIElucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW5wdXQnLFxuICBwcm9wVHlwZXM6IHtcbiAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBoZWxwOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBhZGRvbkJlZm9yZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYWRkb25BZnRlcjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnc3VjY2VzcycsICd3YXJuaW5nJywgJ2Vycm9yJ10pLFxuICAgIGhhc0ZlZWRiYWNrOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBncm91cENsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB3cmFwcGVyQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGxhYmVsQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0SW5wdXRET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgZ2V0VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy50eXBlID09PSAnc3RhdGljJykge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMudmFsdWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMucHJvcHMudHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRET01Ob2RlKCkudmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCB1c2UgZ2V0VmFsdWUgd2l0aG91dCBzcGVjaWZ5aW5nIGlucHV0IHR5cGUuJyk7XG4gICAgfVxuICB9LFxuXG4gIGdldENoZWNrZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRJbnB1dERPTU5vZGUoKS5jaGVja2VkO1xuICB9LFxuXG4gIGlzQ2hlY2tib3hPclJhZGlvOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMudHlwZSA9PT0gJ3JhZGlvJyB8fCB0aGlzLnByb3BzLnR5cGUgPT09ICdjaGVja2JveCc7XG4gIH0sXG5cbiAgcmVuZGVySW5wdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuXG4gICAgaWYgKCF0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICAgIGlucHV0ID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5zZWxlY3QoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOlwiaW5wdXRcIiwga2V5OlwiaW5wdXRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZXh0YXJlYSc6XG4gICAgICAgIGlucHV0ID0gUmVhY3QuRE9NLnRleHRhcmVhKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9ICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhdGljJzpcbiAgICAgICAgaW5wdXQgPSAoXG4gICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wtc3RhdGljXCIsIHJlZjpcImlucHV0XCIsICBrZXk6XCJpbnB1dFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLnZhbHVlXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBjbGFzc05hbWUgPSB0aGlzLmlzQ2hlY2tib3hPclJhZGlvKCkgPyAnJyA6ICdmb3JtLWNvbnRyb2wnO1xuICAgICAgICBpbnB1dCA9IFJlYWN0LkRPTS5pbnB1dCgge2NsYXNzTmFtZTpjbGFzc05hbWUsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9ICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKGlucHV0KTtcbiAgfSxcblxuICByZW5kZXJJbnB1dEdyb3VwOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgYWRkb25CZWZvcmUgPSB0aGlzLnByb3BzLmFkZG9uQmVmb3JlID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwiLCBrZXk6XCJhZGRvbkJlZm9yZVwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuYWRkb25CZWZvcmVcbiAgICAgIClcbiAgICApIDogbnVsbDtcblxuICAgIHZhciBhZGRvbkFmdGVyID0gdGhpcy5wcm9wcy5hZGRvbkFmdGVyID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwiLCBrZXk6XCJhZGRvbkFmdGVyXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5hZGRvbkFmdGVyXG4gICAgICApXG4gICAgKSA6IG51bGw7XG5cbiAgICByZXR1cm4gYWRkb25CZWZvcmUgfHwgYWRkb25BZnRlciA/IChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwiLCBrZXk6XCJpbnB1dC1ncm91cFwifSwgXG4gICAgICAgIGFkZG9uQmVmb3JlLFxuICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgYWRkb25BZnRlclxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJJY29uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZ2x5cGhpY29uJzogdHJ1ZSxcbiAgICAgICdmb3JtLWNvbnRyb2wtZmVlZGJhY2snOiB0cnVlLFxuICAgICAgJ2dseXBoaWNvbi1vayc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3N1Y2Nlc3MnLFxuICAgICAgJ2dseXBoaWNvbi13YXJuaW5nLXNpZ24nOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICd3YXJuaW5nJyxcbiAgICAgICdnbHlwaGljb24tcmVtb3ZlJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnZXJyb3InXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmhhc0ZlZWRiYWNrID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGtleTpcImljb25cIn0gKVxuICAgICkgOiBudWxsO1xuICB9LFxuXG4gIHJlbmRlckhlbHA6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5oZWxwID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJoZWxwLWJsb2NrXCIsIGtleTpcImhlbHBcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmhlbHBcbiAgICAgIClcbiAgICApIDogbnVsbDtcbiAgfSxcblxuICByZW5kZXJDaGVja2JveGFuZFJhZGlvV3JhcHBlcjogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnY2hlY2tib3gnOiB0aGlzLnByb3BzLnR5cGUgPT09ICdjaGVja2JveCcsXG4gICAgICAncmFkaW8nOiB0aGlzLnByb3BzLnR5cGUgPT09ICdyYWRpbydcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGtleTpcImNoZWNrYm94UmFkaW9XcmFwcGVyXCJ9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcldyYXBwZXI6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHJldHVybiB0aGlzLnByb3BzLndyYXBwZXJDbGFzc05hbWUgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOnRoaXMucHJvcHMud3JhcHBlckNsYXNzTmFtZSwga2V5Olwid3JhcHBlclwifSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKSA6IGNoaWxkcmVuO1xuICB9LFxuXG4gIHJlbmRlckxhYmVsOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdjb250cm9sLWxhYmVsJzogIXRoaXMuaXNDaGVja2JveE9yUmFkaW8oKVxuICAgIH07XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLmxhYmVsQ2xhc3NOYW1lXSA9IHRoaXMucHJvcHMubGFiZWxDbGFzc05hbWU7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5sYWJlbCA/IChcbiAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2h0bWxGb3I6dGhpcy5wcm9wcy5pZCwgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJsYWJlbFwifSwgXG4gICAgICAgIGNoaWxkcmVuLFxuICAgICAgICB0aGlzLnByb3BzLmxhYmVsXG4gICAgICApXG4gICAgKSA6IGNoaWxkcmVuO1xuICB9LFxuXG4gIHJlbmRlckZvcm1Hcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZm9ybS1ncm91cCc6IHRydWUsXG4gICAgICAnaGFzLWZlZWRiYWNrJzogdGhpcy5wcm9wcy5oYXNGZWVkYmFjayxcbiAgICAgICdoYXMtc3VjY2Vzcyc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3N1Y2Nlc3MnLFxuICAgICAgJ2hhcy13YXJuaW5nJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnd2FybmluZycsXG4gICAgICAnaGFzLWVycm9yJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnZXJyb3InXG4gICAgfTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMuZ3JvdXBDbGFzc05hbWVdID0gdGhpcy5wcm9wcy5ncm91cENsYXNzTmFtZTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0NoZWNrYm94T3JSYWRpbygpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJGb3JtR3JvdXAoXG4gICAgICAgIHRoaXMucmVuZGVyV3JhcHBlcihbXG4gICAgICAgICAgdGhpcy5yZW5kZXJDaGVja2JveGFuZFJhZGlvV3JhcHBlcihcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTGFiZWwoXG4gICAgICAgICAgICAgIHRoaXMucmVuZGVySW5wdXQoKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJIZWxwKClcbiAgICAgICAgXSlcbiAgICAgICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRm9ybUdyb3VwKFtcbiAgICAgICAgdGhpcy5yZW5kZXJMYWJlbCgpLFxuICAgICAgICB0aGlzLnJlbmRlcldyYXBwZXIoW1xuICAgICAgICAgIHRoaXMucmVuZGVySW5wdXRHcm91cChcbiAgICAgICAgICAgIHRoaXMucmVuZGVySW5wdXQoKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJJY29uKCksXG4gICAgICAgICAgdGhpcy5yZW5kZXJIZWxwKClcbiAgICAgICAgXSlcbiAgICAgIF0pO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXQ7XG4iLCIvLyBodHRwczovL3d3dy5ucG1qcy5vcmcvcGFja2FnZS9yZWFjdC1pbnRlcnBvbGF0ZS1jb21wb25lbnRcbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL3V0aWxzL21lcmdlJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgUkVHRVhQID0gL1xcJVxcKCguKz8pXFwpcy87XG5cbnZhciBJbnRlcnBvbGF0ZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdJbnRlcnBvbGF0ZScsXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZm9ybWF0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4geyBjb21wb25lbnQ6IFJlYWN0LkRPTS5zcGFuIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9ybWF0ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5oYXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKSA/IHRoaXMucHJvcHMuY2hpbGRyZW4gOiB0aGlzLnByb3BzLmZvcm1hdDtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5wcm9wcy5jb21wb25lbnQ7XG4gICAgdmFyIHVuc2FmZSA9IHRoaXMucHJvcHMudW5zYWZlID09PSB0cnVlO1xuICAgIHZhciBwcm9wcyA9IG1lcmdlKHRoaXMucHJvcHMpO1xuXG4gICAgZGVsZXRlIHByb3BzLmNoaWxkcmVuO1xuICAgIGRlbGV0ZSBwcm9wcy5mb3JtYXQ7XG4gICAgZGVsZXRlIHByb3BzLmNvbXBvbmVudDtcbiAgICBkZWxldGUgcHJvcHMudW5zYWZlO1xuXG4gICAgaWYgKHVuc2FmZSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBmb3JtYXQuc3BsaXQoUkVHRVhQKS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgbWF0Y2gsIGluZGV4KSB7XG4gICAgICAgIHZhciBodG1sO1xuXG4gICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICBodG1sID0gbWF0Y2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaHRtbCA9IHByb3BzW21hdGNoXTtcbiAgICAgICAgICBkZWxldGUgcHJvcHNbbWF0Y2hdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoaHRtbCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBpbnRlcnBvbGF0ZSBhIFJlYWN0IGNvbXBvbmVudCBpbnRvIHVuc2FmZSB0ZXh0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBtZW1vICs9IGh0bWw7XG5cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICB9LCAnJyk7XG5cbiAgICAgIHByb3BzLmRhbmdlcm91c2x5U2V0SW5uZXJIVE1MID0geyBfX2h0bWw6IGNvbnRlbnQgfTtcblxuICAgICAgcmV0dXJuIHBhcmVudChwcm9wcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gZm9ybWF0LnNwbGl0KFJFR0VYUCkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIG1hdGNoLCBpbmRleCkge1xuICAgICAgICB2YXIgY2hpbGQ7XG5cbiAgICAgICAgaWYgKGluZGV4ICUgMiA9PT0gMCkge1xuICAgICAgICAgIGlmIChtYXRjaC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNoaWxkID0gbWF0Y2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2hpbGQgPSBwcm9wc1ttYXRjaF07XG4gICAgICAgICAgZGVsZXRlIHByb3BzW21hdGNoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lbW8ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICB9LCBbcHJvcHNdKTtcblxuICAgICAgcmV0dXJuIHBhcmVudC5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVycG9sYXRlO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG52YXIgSnVtYm90cm9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSnVtYm90cm9uJyxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwianVtYm90cm9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEp1bWJvdHJvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBMYWJlbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xhYmVsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbGFiZWwnLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExhYmVsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIE1lbnVJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTWVudUl0ZW0nLFxuICBwcm9wVHlwZXM6IHtcbiAgICBoZWFkZXI6ICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGl2aWRlcjogIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6ICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRpdGxlOiAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5KTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyQW5jaG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7b25DbGljazp0aGlzLmhhbmRsZUNsaWNrLCBocmVmOnRoaXMucHJvcHMuaHJlZiwgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSwgdGFiSW5kZXg6XCItMVwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24taGVhZGVyJzogdGhpcy5wcm9wcy5oZWFkZXIsXG4gICAgICAgICdkaXZpZGVyJzogdGhpcy5wcm9wcy5kaXZpZGVyXG4gICAgICB9O1xuXG4gICAgdmFyIGNoaWxkcmVuID0gbnVsbDtcbiAgICBpZiAodGhpcy5wcm9wcy5oZWFkZXIpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5wcm9wcy5jaGlsZHJlbjtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnByb3BzLmRpdmlkZXIpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5yZW5kZXJBbmNob3IoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtyb2xlOlwicHJlc2VudGF0aW9uXCIsIHRpdGxlOm51bGwsIGhyZWY6bnVsbCwgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudUl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEZhZGVNaXhpbiA9IHJlcXVpcmUoJy4vRmFkZU1peGluJyk7XG52YXIgRXZlbnRMaXN0ZW5lciA9IHJlcXVpcmUoJy4vdXRpbHMvRXZlbnRMaXN0ZW5lcicpO1xuXG5cbi8vIFRPRE86XG4vLyAtIGFyaWEtbGFiZWxsZWRieVxuLy8gLSBBZGQgYG1vZGFsLWJvZHlgIGRpdiBpZiBvbmx5IG9uZSBjaGlsZCBwYXNzZWQgaW4gdGhhdCBkb2Vzbid0IGFscmVhZHkgaGF2ZSBpdFxuLy8gLSBUZXN0c1xuXG52YXIgTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb2RhbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBGYWRlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBiYWNrZHJvcDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnc3RhdGljJywgdHJ1ZSwgZmFsc2VdKSxcbiAgICBrZXlib2FyZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY2xvc2VCdXR0b246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFuaW1hdGlvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25SZXF1ZXN0SGlkZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbW9kYWwnLFxuICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICBrZXlib2FyZDogdHJ1ZSxcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICAgIGNsb3NlQnV0dG9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbW9kYWxTdHlsZSA9IHtkaXNwbGF5OiAnYmxvY2snfTtcbiAgICB2YXIgZGlhbG9nQ2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGRlbGV0ZSBkaWFsb2dDbGFzc2VzLm1vZGFsO1xuICAgIGRpYWxvZ0NsYXNzZXNbJ21vZGFsLWRpYWxvZyddID0gdHJ1ZTtcblxuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgbW9kYWw6IHRydWUsXG4gICAgICBmYWRlOiB0aGlzLnByb3BzLmFuaW1hdGlvbixcbiAgICAgICdpbic6ICF0aGlzLnByb3BzLmFuaW1hdGlvbiB8fCAhZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbFxuICAgIH07XG5cbiAgICB2YXIgbW9kYWwgPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHt0aXRsZTpudWxsLFxuICAgICAgICB0YWJJbmRleDpcIi0xXCIsXG4gICAgICAgIHJvbGU6XCJkaWFsb2dcIixcbiAgICAgICAgc3R5bGU6bW9kYWxTdHlsZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICBvbkNsaWNrOnRoaXMucHJvcHMuYmFja2Ryb3AgPT09IHRydWUgPyB0aGlzLmhhbmRsZUJhY2tkcm9wQ2xpY2sgOiBudWxsLFxuICAgICAgICByZWY6XCJtb2RhbFwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoZGlhbG9nQ2xhc3Nlcyl9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtY29udGVudFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLnRpdGxlID8gdGhpcy5yZW5kZXJIZWFkZXIoKSA6IG51bGwsXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmJhY2tkcm9wID9cbiAgICAgIHRoaXMucmVuZGVyQmFja2Ryb3AobW9kYWwpIDogbW9kYWw7XG4gIH0sXG5cbiAgcmVuZGVyQmFja2Ryb3A6IGZ1bmN0aW9uIChtb2RhbCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ21vZGFsLWJhY2tkcm9wJzogdHJ1ZSxcbiAgICAgICdmYWRlJzogdGhpcy5wcm9wcy5hbmltYXRpb25cbiAgICB9O1xuXG4gICAgY2xhc3Nlc1snaW4nXSA9ICF0aGlzLnByb3BzLmFuaW1hdGlvbiB8fCAhZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDtcblxuICAgIHZhciBvbkNsaWNrID0gdGhpcy5wcm9wcy5iYWNrZHJvcCA9PT0gdHJ1ZSA/XG4gICAgICB0aGlzLmhhbmRsZUJhY2tkcm9wQ2xpY2sgOiBudWxsO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHJlZjpcImJhY2tkcm9wXCIsIG9uQ2xpY2s6b25DbGlja30gKSxcbiAgICAgICAgbW9kYWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbG9zZUJ1dHRvbjtcbiAgICBpZiAodGhpcy5wcm9wcy5jbG9zZUJ1dHRvbikge1xuICAgICAgY2xvc2VCdXR0b24gPSAoXG4gICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiY2xvc2VcIiwgJ2FyaWEtaGlkZGVuJzpcInRydWVcIiwgb25DbGljazp0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGV9LCBcIsOXXCIpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1oZWFkZXJcIn0sIFxuICAgICAgICBjbG9zZUJ1dHRvbixcbiAgICAgICAgdGhpcy5yZW5kZXJUaXRsZSgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMudGl0bGUpID9cbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA6IFJlYWN0LkRPTS5oNCgge2NsYXNzTmFtZTpcIm1vZGFsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLnRpdGxlKVxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2tleXVwJywgdGhpcy5oYW5kbGVEb2N1bWVudEtleVVwKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyLnJlbW92ZSgpO1xuICB9LFxuXG4gIGhhbmRsZUJhY2tkcm9wQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGUoKTtcbiAgfSxcblxuICBoYW5kbGVEb2N1bWVudEtleVVwOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLmtleWJvYXJkICYmIGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIHRoaXMucHJvcHMub25SZXF1ZXN0SGlkZSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWw7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgT3ZlcmxheU1peGluID0gcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG52YXIgTW9kYWxUcmlnZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTW9kYWxUcmlnZ2VyJyxcbiAgbWl4aW5zOiBbT3ZlcmxheU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBtb2RhbDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpc092ZXJsYXlTaG93bjogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0cnVlXG4gICAgfSk7XG4gIH0sXG5cbiAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogIXRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd25cbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4obnVsbCApO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIHRoaXMucHJvcHMubW9kYWwsXG4gICAgICB7XG4gICAgICAgIG9uUmVxdWVzdEhpZGU6IHRoaXMuaGlkZVxuICAgICAgfVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkID0gUmVhY3QuQ2hpbGRyZW4ub25seSh0aGlzLnByb3BzLmNoaWxkcmVuKTtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgb25DbGljazogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uQ2xpY2ssIHRoaXMudG9nZ2xlKVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsVHJpZ2dlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHJlcXVpcmUoJy4vQ29sbGFwc2FibGVNaXhpbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXYnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgQ29sbGFwc2FibGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndGFicycsJ3BpbGxzJ10pLFxuICAgIHN0YWNrZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGp1c3RpZmllZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGNvbGxhcHNhYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBleHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmF2YmFyOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbmF2J1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMucmVmcy51bC5nZXRET01Ob2RlKCksXG4gICAgICAgIGhlaWdodCA9IG5vZGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgICBjb21wdXRlZFN0eWxlcyA9IGRvbVV0aWxzLmdldENvbXB1dGVkU3R5bGVzKG5vZGUpO1xuXG4gICAgcmV0dXJuIGhlaWdodCArIHBhcnNlSW50KGNvbXB1dGVkU3R5bGVzLm1hcmdpblRvcCwgMTApICsgcGFyc2VJbnQoY29tcHV0ZWRTdHlsZXMubWFyZ2luQm90dG9tLCAxMCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLmNvbGxhcHNhYmxlID8gdGhpcy5nZXRDb2xsYXBzYWJsZUNsYXNzU2V0KCkgOiB7fTtcblxuICAgIGNsYXNzZXNbJ25hdmJhci1jb2xsYXBzZSddID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZTtcblxuICAgIGlmICh0aGlzLnByb3BzLm5hdmJhciAmJiAhdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKHRoaXMucmVuZGVyVWwoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLm5hdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnJlbmRlclVsKClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclVsOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIGNsYXNzZXNbJ25hdi1zdGFja2VkJ10gPSB0aGlzLnByb3BzLnN0YWNrZWQ7XG4gICAgY2xhc3Nlc1snbmF2LWp1c3RpZmllZCddID0gdGhpcy5wcm9wcy5qdXN0aWZpZWQ7XG4gICAgY2xhc3Nlc1snbmF2YmFyLW5hdiddID0gdGhpcy5wcm9wcy5uYXZiYXI7XG4gICAgY2xhc3Nlc1sncHVsbC1yaWdodCddID0gdGhpcy5wcm9wcy5wdWxsUmlnaHQ7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCByZWY6XCJ1bFwifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTmF2SXRlbSlcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldENoaWxkQWN0aXZlUHJvcDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMuaHJlZiA9PT0gdGhpcy5wcm9wcy5hY3RpdmVIcmVmKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjaGlsZC5wcm9wcy5hY3RpdmU7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIGFjdGl2ZTogdGhpcy5nZXRDaGlsZEFjdGl2ZVByb3AoY2hpbGQpLFxuICAgICAgICBhY3RpdmVLZXk6IHRoaXMucHJvcHMuYWN0aXZlS2V5LFxuICAgICAgICBhY3RpdmVIcmVmOiB0aGlzLnByb3BzLmFjdGl2ZUhyZWYsXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgIG5hdkl0ZW06IHRydWVcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXY7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBOYXZJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2SXRlbScsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaHJlZjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2FjdGl2ZSc6IHRoaXMucHJvcHMuYWN0aXZlLFxuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZUNsaWNrLFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIXRoaXMucHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSx0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2SXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBOYXYgPSByZXF1aXJlKCcuL05hdicpO1xuXG5cbnZhciBOYXZiYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXZiYXInLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZml4ZWRUb3A6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGZpeGVkQm90dG9tOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBzdGF0aWNUb3A6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGludmVyc2U6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGZsdWlkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICByb2xlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3MsXG4gICAgYnJhbmQ6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIHRvZ2dsZUJ1dHRvbjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgb25Ub2dnbGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG5hdkV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkZWZhdWx0TmF2RXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICduYXZiYXInLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnLFxuICAgICAgcm9sZTogJ25hdmlnYXRpb24nLFxuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5uYXZcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYXZFeHBhbmRlZDogdGhpcy5wcm9wcy5kZWZhdWx0TmF2RXhwYW5kZWRcbiAgICB9O1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gRGVmZXIgYW55IHVwZGF0ZXMgdG8gdGhpcyBjb21wb25lbnQgZHVyaW5nIHRoZSBgb25TZWxlY3RgIGhhbmRsZXIuXG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGhhbmRsZVRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uVG9nZ2xlKSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25Ub2dnbGUoKTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG5hdk9wZW46ICF0aGlzLnN0YXRlLm5hdk9wZW5cbiAgICB9KTtcbiAgfSxcblxuICBpc05hdk9wZW46IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5uYXZPcGVuICE9IG51bGwgPyB0aGlzLnByb3BzLm5hdk9wZW4gOiB0aGlzLnN0YXRlLm5hdk9wZW47XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuXG4gICAgY2xhc3Nlc1snbmF2YmFyLWZpeGVkLXRvcCddID0gdGhpcy5wcm9wcy5maXhlZFRvcDtcbiAgICBjbGFzc2VzWyduYXZiYXItZml4ZWQtYm90dG9tJ10gPSB0aGlzLnByb3BzLmZpeGVkQm90dG9tO1xuICAgIGNsYXNzZXNbJ25hdmJhci1zdGF0aWMtdG9wJ10gPSB0aGlzLnByb3BzLnN0YXRpY1RvcDtcbiAgICBjbGFzc2VzWyduYXZiYXItaW52ZXJzZSddID0gdGhpcy5wcm9wcy5pbnZlcnNlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnByb3BzLmZsdWlkID8gJ2NvbnRhaW5lci1mbHVpZCcgOiAnY29udGFpbmVyJ30sIFxuICAgICAgICAgICh0aGlzLnByb3BzLmJyYW5kIHx8IHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIHx8IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5KSA/IHRoaXMucmVuZGVySGVhZGVyKCkgOiBudWxsLFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyQ2hpbGQpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNoaWxkOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoY2hpbGQsIHtcbiAgICAgIG5hdmJhcjogdHJ1ZSxcbiAgICAgIGNvbGxhcHNhYmxlOiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSAhPSBudWxsICYmIHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ID09PSBjaGlsZC5wcm9wcy5rZXksXG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCAmJiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSA9PT0gY2hpbGQucHJvcHMua2V5ICYmIHRoaXMuaXNOYXZPcGVuKCksXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJyYW5kO1xuXG4gICAgaWYgKHRoaXMucHJvcHMuYnJhbmQpIHtcbiAgICAgIGJyYW5kID0gUmVhY3QuaXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmJyYW5kKSA/XG4gICAgICAgIGNsb25lV2l0aFByb3BzKHRoaXMucHJvcHMuYnJhbmQsIHtcbiAgICAgICAgICBjbGFzc05hbWU6ICduYXZiYXItYnJhbmQnXG4gICAgICAgIH0pIDogUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJuYXZiYXItYnJhbmRcIn0sIHRoaXMucHJvcHMuYnJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibmF2YmFyLWhlYWRlclwifSwgXG4gICAgICAgIGJyYW5kLFxuICAgICAgICAodGhpcy5wcm9wcy50b2dnbGVCdXR0b24gfHwgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCkgPyB0aGlzLnJlbmRlclRvZ2dsZUJ1dHRvbigpIDogbnVsbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVG9nZ2xlQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkcmVuO1xuXG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy50b2dnbGVCdXR0b24pKSB7XG4gICAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHModGhpcy5wcm9wcy50b2dnbGVCdXR0b24sIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbmF2YmFyLXRvZ2dsZScsXG4gICAgICAgIG9uQ2xpY2s6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZVRvZ2dsZSwgdGhpcy5wcm9wcy50b2dnbGVCdXR0b24ucHJvcHMub25DbGljaylcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNoaWxkcmVuID0gKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uICE9IG51bGwpID9cbiAgICAgIHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIDogW1xuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcInNyLW9ubHlcIiwga2V5OjB9LCBcIlRvZ2dsZSBuYXZpZ2F0aW9uXCIpLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImljb24tYmFyXCIsIGtleToxfSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaWNvbi1iYXJcIiwga2V5OjJ9KSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpY29uLWJhclwiLCBrZXk6M30pXG4gICAgXTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwibmF2YmFyLXRvZ2dsZVwiLCB0eXBlOlwiYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVUb2dnbGV9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZiYXI7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgY29udGFpbmVyOiBDdXN0b21Qcm9wVHlwZXMubW91bnRhYmxlXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRhaW5lcjogdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmJvZHkgOiB7XG4gICAgICAgIC8vIElmIHdlIGFyZSBpbiBhbiBlbnZpcm9ubWVudCB0aGF0IGRvZXNudCBoYXZlIGBkb2N1bWVudGAgZGVmaW5lZCBpdCBzaG91bGQgYmVcbiAgICAgICAgLy8gc2FmZSB0byBhc3N1bWUgdGhhdCBgY29tcG9uZW50RGlkTW91bnRgIHdpbGwgbm90IHJ1biBhbmQgdGhpcyB3aWxsIGJlIG5lZWRlZCxcbiAgICAgICAgLy8ganVzdCBwcm92aWRlIGVub3VnaCBmYWtlIEFQSSB0byBwYXNzIHRoZSBwcm9wVHlwZSB2YWxpZGF0aW9uLlxuICAgICAgICBnZXRET01Ob2RlOiBmdW5jdGlvbiBub29wKCkge31cbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdW5yZW5kZXJPdmVybGF5KCk7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlUYXJnZXQpIHtcbiAgICAgIHRoaXMuZ2V0Q29udGFpbmVyRE9NTm9kZSgpXG4gICAgICAgIC5yZW1vdmVDaGlsZCh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgICAgIHRoaXMuX292ZXJsYXlUYXJnZXQgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJPdmVybGF5KCk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJPdmVybGF5KCk7XG4gIH0sXG5cbiAgX21vdW50T3ZlcmxheVRhcmdldDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX292ZXJsYXlUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKVxuICAgICAgLmFwcGVuZENoaWxkKHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICB9LFxuXG4gIF9yZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9vdmVybGF5VGFyZ2V0KSB7XG4gICAgICB0aGlzLl9tb3VudE92ZXJsYXlUYXJnZXQoKTtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHJlZmVyZW5jZSB0byBoZWxwIHRlc3RpbmdcbiAgICB0aGlzLl9vdmVybGF5SW5zdGFuY2UgPSBSZWFjdC5yZW5kZXJDb21wb25lbnQodGhpcy5yZW5kZXJPdmVybGF5KCksIHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICB9LFxuXG4gIF91bnJlbmRlck92ZXJsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICAgIHRoaXMuX292ZXJsYXlJbnN0YW5jZSA9IG51bGw7XG4gIH0sXG5cbiAgZ2V0T3ZlcmxheURPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZ2V0T3ZlcmxheURPTU5vZGUoKTogQSBjb21wb25lbnQgbXVzdCBiZSBtb3VudGVkIHRvIGhhdmUgYSBET00gbm9kZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheUluc3RhbmNlLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBnZXRDb250YWluZXJET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY29udGFpbmVyLmdldERPTU5vZGUgP1xuICAgICAgdGhpcy5wcm9wcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpIDogdGhpcy5wcm9wcy5jb250YWluZXI7XG4gIH1cbn07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgT3ZlcmxheU1peGluID0gcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZScpO1xuXG4vKipcbiAqIENoZWNrIGlmIHZhbHVlIG9uZSBpcyBpbnNpZGUgb3IgZXF1YWwgdG8gdGhlIG9mIHZhbHVlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG9uZVxuICogQHBhcmFtIHtzdHJpbmd8YXJyYXl9IG9mXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNPbmVPZihvbmUsIG9mKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9mKSkge1xuICAgIHJldHVybiBvZi5pbmRleE9mKG9uZSkgPj0gMDtcbiAgfVxuICByZXR1cm4gb25lID09PSBvZjtcbn1cblxudmFyIE92ZXJsYXlUcmlnZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnT3ZlcmxheVRyaWdnZXInLFxuICBtaXhpbnM6IFtPdmVybGF5TWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHRyaWdnZXI6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnbWFudWFsJywgJ2NsaWNrJywgJ2hvdmVyJywgJ2ZvY3VzJ10pLFxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmFycmF5T2YoUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnY2xpY2snLCAnaG92ZXInLCAnZm9jdXMnXSkpXG4gICAgXSksXG4gICAgcGxhY2VtZW50OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0b3AnLCdyaWdodCcsICdib3R0b20nLCAnbGVmdCddKSxcbiAgICBkZWxheTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWxheVNob3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVsYXlIaWRlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlZmF1bHRPdmVybGF5U2hvd246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG92ZXJsYXk6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgdHJpZ2dlcjogWydob3ZlcicsICdmb2N1cyddXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNPdmVybGF5U2hvd246IHRoaXMucHJvcHMuZGVmYXVsdE92ZXJsYXlTaG93biA9PSBudWxsID9cbiAgICAgICAgZmFsc2UgOiB0aGlzLnByb3BzLmRlZmF1bHRPdmVybGF5U2hvd24sXG4gICAgICBvdmVybGF5TGVmdDogbnVsbCxcbiAgICAgIG92ZXJsYXlUb3A6IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0cnVlXG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZU92ZXJsYXlQb3NpdGlvbigpO1xuICAgIH0pO1xuICB9LFxuXG4gIGhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiBmYWxzZVxuICAgIH0pO1xuICB9LFxuXG4gIHRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd24gP1xuICAgICAgdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coKTtcbiAgfSxcblxuICByZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4obnVsbCApO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIHRoaXMucHJvcHMub3ZlcmxheSxcbiAgICAgIHtcbiAgICAgICAgb25SZXF1ZXN0SGlkZTogdGhpcy5oaWRlLFxuICAgICAgICBwbGFjZW1lbnQ6IHRoaXMucHJvcHMucGxhY2VtZW50LFxuICAgICAgICBwb3NpdGlvbkxlZnQ6IHRoaXMuc3RhdGUub3ZlcmxheUxlZnQsXG4gICAgICAgIHBvc2l0aW9uVG9wOiB0aGlzLnN0YXRlLm92ZXJsYXlUb3BcbiAgICAgIH1cbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwcm9wcyA9IHt9O1xuXG4gICAgaWYgKGlzT25lT2YoJ2NsaWNrJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25DbGljayA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLnRvZ2dsZSwgdGhpcy5wcm9wcy5vbkNsaWNrKTtcbiAgICB9XG5cbiAgICBpZiAoaXNPbmVPZignaG92ZXInLCB0aGlzLnByb3BzLnRyaWdnZXIpKSB7XG4gICAgICBwcm9wcy5vbk1vdXNlT3ZlciA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRTaG93LCB0aGlzLnByb3BzLm9uTW91c2VPdmVyKTtcbiAgICAgIHByb3BzLm9uTW91c2VPdXQgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkSGlkZSwgdGhpcy5wcm9wcy5vbk1vdXNlT3V0KTtcbiAgICB9XG5cbiAgICBpZiAoaXNPbmVPZignZm9jdXMnLCB0aGlzLnByb3BzLnRyaWdnZXIpKSB7XG4gICAgICBwcm9wcy5vbkZvY3VzID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZFNob3csIHRoaXMucHJvcHMub25Gb2N1cyk7XG4gICAgICBwcm9wcy5vbkJsdXIgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkSGlkZSwgdGhpcy5wcm9wcy5vbkJsdXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbiksXG4gICAgICBwcm9wc1xuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgfSxcblxuICBoYW5kbGVEZWxheWVkU2hvdzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ob3ZlckRlbGF5ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkZWxheSA9IHRoaXMucHJvcHMuZGVsYXlTaG93ICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWxheVNob3cgOiB0aGlzLnByb3BzLmRlbGF5O1xuXG4gICAgaWYgKCFkZWxheSkge1xuICAgICAgdGhpcy5zaG93KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faG92ZXJEZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHRoaXMuc2hvdygpO1xuICAgIH0uYmluZCh0aGlzKSwgZGVsYXkpO1xuICB9LFxuXG4gIGhhbmRsZURlbGF5ZWRIaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2hvdmVyRGVsYXkgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hvdmVyRGVsYXkpO1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlbGF5ID0gdGhpcy5wcm9wcy5kZWxheUhpZGUgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLmRlbGF5SGlkZSA6IHRoaXMucHJvcHMuZGVsYXk7XG5cbiAgICBpZiAoIWRlbGF5KSB7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9ob3ZlckRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfS5iaW5kKHRoaXMpLCBkZWxheSk7XG4gIH0sXG5cbiAgdXBkYXRlT3ZlcmxheVBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBvcyA9IHRoaXMuY2FsY092ZXJsYXlQb3NpdGlvbigpO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBvdmVybGF5TGVmdDogcG9zLmxlZnQsXG4gICAgICBvdmVybGF5VG9wOiBwb3MudG9wXG4gICAgfSk7XG4gIH0sXG5cbiAgY2FsY092ZXJsYXlQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZE9mZnNldCA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcblxuICAgIHZhciBvdmVybGF5Tm9kZSA9IHRoaXMuZ2V0T3ZlcmxheURPTU5vZGUoKTtcbiAgICB2YXIgb3ZlcmxheUhlaWdodCA9IG92ZXJsYXlOb2RlLm9mZnNldEhlaWdodDtcbiAgICB2YXIgb3ZlcmxheVdpZHRoID0gb3ZlcmxheU5vZGUub2Zmc2V0V2lkdGg7XG5cbiAgICBzd2l0Y2ggKHRoaXMucHJvcHMucGxhY2VtZW50KSB7XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQgLyAyIC0gb3ZlcmxheUhlaWdodCAvIDIsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoXG4gICAgICAgIH07XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCArIGNoaWxkT2Zmc2V0LmhlaWdodCAvIDIgLSBvdmVybGF5SGVpZ2h0IC8gMixcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0IC0gb3ZlcmxheVdpZHRoXG4gICAgICAgIH07XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wIC0gb3ZlcmxheUhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0ICsgY2hpbGRPZmZzZXQud2lkdGggLyAyIC0gb3ZlcmxheVdpZHRoIC8gMlxuICAgICAgICB9O1xuICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCArIGNoaWxkT2Zmc2V0LmhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0ICsgY2hpbGRPZmZzZXQud2lkdGggLyAyIC0gb3ZlcmxheVdpZHRoIC8gMlxuICAgICAgICB9O1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxjT3ZlcmxheVBvc2l0aW9uKCk6IE5vIHN1Y2ggcGxhY2VtZW50IG9mIFwiJyArIHRoaXMucHJvcHMucGxhY2VtZW50ICsgJ1wiIGZvdW5kLicpO1xuICAgIH1cbiAgfSxcblxuICBnZXRQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuZ2V0Q29udGFpbmVyRE9NTm9kZSgpO1xuXG4gICAgdmFyIG9mZnNldCA9IGNvbnRhaW5lci50YWdOYW1lID09ICdCT0RZJyA/XG4gICAgICBkb21VdGlscy5nZXRPZmZzZXQobm9kZSkgOiBkb21VdGlscy5nZXRQb3NpdGlvbihub2RlLCBjb250YWluZXIpO1xuXG4gICAgcmV0dXJuIG1lcmdlKG9mZnNldCwge1xuICAgICAgaGVpZ2h0OiBub2RlLm9mZnNldEhlaWdodCxcbiAgICAgIHdpZHRoOiBub2RlLm9mZnNldFdpZHRoXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJsYXlUcmlnZ2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxudmFyIFBhZ2VIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYWdlSGVhZGVyJyxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXJcIn0sIFxuICAgICAgICBSZWFjdC5ET00uaDEobnVsbCwgdGhpcy5wcm9wcy5jaGlsZHJlbilcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlSGVhZGVyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIFBhZ2VJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFnZUl0ZW0nLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBwcmV2aW91czogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmV4dDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhyZWY6ICcjJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkLFxuICAgICAgJ3ByZXZpb3VzJzogdGhpcy5wcm9wcy5wcmV2aW91cyxcbiAgICAgICduZXh0JzogdGhpcy5wcm9wcy5uZXh0XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saShcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uYShcbiAgICAgICAgICB7aHJlZjp0aGlzLnByb3BzLmhyZWYsXG4gICAgICAgICAgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSxcbiAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0LFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKCF0aGlzLnByb3BzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXksIHRoaXMucHJvcHMuaHJlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlSXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG5cbnZhciBQYWdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhZ2VyJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00udWwoXG4gICAgICAgIHtjbGFzc05hbWU6XCJwYWdlclwifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFnZUl0ZW0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQYWdlSXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHJlcXVpcmUoJy4vQ29sbGFwc2FibGVNaXhpbicpO1xuXG52YXIgUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYW5lbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBDb2xsYXBzYWJsZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBoZWFkZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGZvb3RlcjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgb25DbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3BhbmVsJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0J1xuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXkpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZXhwYW5kZWQ6ICF0aGlzLnN0YXRlLmV4cGFuZGVkXG4gICAgfSk7XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWZzLmJvZHkuZ2V0RE9NTm9kZSgpLm9mZnNldEhlaWdodDtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkgfHwgIXRoaXMucmVmcyB8fCAhdGhpcy5yZWZzLnBhbmVsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZWZzLnBhbmVsLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGNsYXNzZXNbJ3BhbmVsJ10gPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgaWQ6dGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IG51bGwgOiB0aGlzLnByb3BzLmlkfSwgXG4gICAgICAgIHRoaXMucmVuZGVySGVhZGluZygpLFxuICAgICAgICB0aGlzLnByb3BzLmNvbGxhcHNhYmxlID8gdGhpcy5yZW5kZXJDb2xsYXBzYWJsZUJvZHkoKSA6IHRoaXMucmVuZGVyQm9keSgpLFxuICAgICAgICB0aGlzLnJlbmRlckZvb3RlcigpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb2xsYXBzYWJsZUJvZHk6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldCh0aGlzLmdldENvbGxhcHNhYmxlQ2xhc3NTZXQoJ3BhbmVsLWNvbGxhcHNlJykpLCBpZDp0aGlzLnByb3BzLmlkLCByZWY6XCJwYW5lbFwifSwgXG4gICAgICAgIHRoaXMucmVuZGVyQm9keSgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJCb2R5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1ib2R5XCIsIHJlZjpcImJvZHlcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJIZWFkaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhlYWRlciA9IHRoaXMucHJvcHMuaGVhZGVyO1xuXG4gICAgaWYgKCFoZWFkZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghUmVhY3QuaXNWYWxpZENvbXBvbmVudChoZWFkZXIpIHx8IEFycmF5LmlzQXJyYXkoaGVhZGVyKSkge1xuICAgICAgaGVhZGVyID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/XG4gICAgICAgIHRoaXMucmVuZGVyQ29sbGFwc2FibGVUaXRsZShoZWFkZXIpIDogaGVhZGVyO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgaGVhZGVyID0gY2xvbmVXaXRoUHJvcHMoaGVhZGVyLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhbmVsLXRpdGxlJyxcbiAgICAgICAgY2hpbGRyZW46IHRoaXMucmVuZGVyQW5jaG9yKGhlYWRlci5wcm9wcy5jaGlsZHJlbilcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkZXIgPSBjbG9uZVdpdGhQcm9wcyhoZWFkZXIsIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncGFuZWwtdGl0bGUnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxuICAgICAgICBoZWFkZXJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYShcbiAgICAgICAge2hyZWY6JyMnICsgKHRoaXMucHJvcHMuaWQgfHwgJycpLFxuICAgICAgICBjbGFzc05hbWU6dGhpcy5pc0V4cGFuZGVkKCkgPyBudWxsIDogJ2NvbGxhcHNlZCcsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVTZWxlY3R9LCBcbiAgICAgICAgaGVhZGVyXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb2xsYXBzYWJsZVRpdGxlOiBmdW5jdGlvbiAoaGVhZGVyKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5oNCgge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJBbmNob3IoaGVhZGVyKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyRm9vdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmZvb3Rlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1mb290ZXJcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmZvb3RlclxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBQYW5lbEdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFuZWxHcm91cCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYWN0aXZlS2V5OiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxuICAgIGRlZmF1bHRBY3RpdmVLZXk6IFJlYWN0LlByb3BUeXBlcy5hbnksXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwYW5lbC1ncm91cCdcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWZhdWx0QWN0aXZlS2V5ID0gdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZUtleTogZGVmYXVsdEFjdGl2ZUtleVxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldCh0aGlzLmdldEJzQ2xhc3NTZXQoKSl9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJQYW5lbClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclBhbmVsOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID1cbiAgICAgIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuXG4gICAgdmFyIHByb3BzID0ge1xuICAgICAgYnNTdHlsZTogY2hpbGQucHJvcHMuYnNTdHlsZSB8fCB0aGlzLnByb3BzLmJzU3R5bGUsXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfTtcblxuICAgIGlmICh0aGlzLnByb3BzLmFjY29yZGlvbikge1xuICAgICAgcHJvcHMuY29sbGFwc2FibGUgPSB0cnVlO1xuICAgICAgcHJvcHMuZXhwYW5kZWQgPSAoY2hpbGQucHJvcHMua2V5ID09PSBhY3RpdmVLZXkpO1xuICAgICAgcHJvcHMub25TZWxlY3QgPSB0aGlzLmhhbmRsZVNlbGVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHByb3BzXG4gICAgKTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUuYWN0aXZlS2V5ID09PSBrZXkpIHtcbiAgICAgIGtleSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhY3RpdmVLZXk6IGtleVxuICAgIH0pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgUG9wb3ZlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BvcG92ZXInLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcGxhY2VtZW50OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0b3AnLCdyaWdodCcsICdib3R0b20nLCAnbGVmdCddKSxcbiAgICBwb3NpdGlvbkxlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgcG9zaXRpb25Ub3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRMZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0VG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG4gICAgY2xhc3Nlc1sncG9wb3ZlciddID0gdHJ1ZTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMucGxhY2VtZW50XSA9IHRydWU7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0ICE9IG51bGwgfHwgdGhpcy5wcm9wcy5wb3NpdGlvblRvcCAhPSBudWxsO1xuXG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgc3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0O1xuICAgIHN0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMucG9zaXRpb25Ub3A7XG4gICAgc3R5bGVbJ2Rpc3BsYXknXSA9ICdibG9jayc7XG5cbiAgICB2YXIgYXJyb3dTdHlsZSA9IHt9O1xuICAgIGFycm93U3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRMZWZ0O1xuICAgIGFycm93U3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldFRvcDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBzdHlsZTpzdHlsZX0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYXJyb3dcIiwgc3R5bGU6YXJyb3dTdHlsZX0gKSxcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA/IHRoaXMucmVuZGVyVGl0bGUoKSA6IG51bGwsXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwb3BvdmVyLWNvbnRlbnRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJUaXRsZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBvcG92ZXItdGl0bGVcIn0sIHRoaXMucHJvcHMudGl0bGUpXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9wb3ZlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgSW50ZXJwb2xhdGUgPSByZXF1aXJlKCcuL0ludGVycG9sYXRlJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG5cbnZhciBQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Byb2dyZXNzQmFyJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgbWluOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGFiZWw6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIHNyT25seTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgc3RyaXBlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3Byb2dyZXNzLWJhcicsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDEwMFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0UGVyY2VudGFnZTogZnVuY3Rpb24gKG5vdywgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKChub3cgLSBtaW4pIC8gKG1heCAtIG1pbikgKiAxMDApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICBwcm9ncmVzczogdHJ1ZVxuICAgICAgfTtcblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSkge1xuICAgICAgY2xhc3Nlc1sncHJvZ3Jlc3Mtc3RyaXBlZCddID0gdHJ1ZTtcbiAgICAgIGNsYXNzZXNbJ2FjdGl2ZSddID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuc3RyaXBlZCkge1xuICAgICAgY2xhc3Nlc1sncHJvZ3Jlc3Mtc3RyaXBlZCddID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIVZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uaGFzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5jaGlsZHJlbikpIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy5pc0NoaWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgICAgICB0aGlzLnJlbmRlclByb2dyZXNzQmFyKClcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgICAgdGhpcy5yZW5kZXJQcm9ncmVzc0JhcigpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyQ2hpbGRCYXIpXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlckNoaWxkQmFyOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoY2hpbGQsIHtcbiAgICAgIGlzQ2hpbGQ6IHRydWUsXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyUHJvZ3Jlc3NCYXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGVyY2VudGFnZSA9IHRoaXMuZ2V0UGVyY2VudGFnZShcbiAgICAgICAgdGhpcy5wcm9wcy5ub3csXG4gICAgICAgIHRoaXMucHJvcHMubWluLFxuICAgICAgICB0aGlzLnByb3BzLm1heFxuICAgICAgKTtcblxuICAgIHZhciBsYWJlbDtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5sYWJlbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbGFiZWwgPSB0aGlzLnJlbmRlckxhYmVsKHBlcmNlbnRhZ2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5sYWJlbCkge1xuICAgICAgbGFiZWwgPSB0aGlzLnByb3BzLmxhYmVsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLnNyT25seSkge1xuICAgICAgbGFiZWwgPSB0aGlzLnJlbmRlclNjcmVlblJlYWRlck9ubHlMYWJlbChsYWJlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRCc0NsYXNzU2V0KCkpLCByb2xlOlwicHJvZ3Jlc3NiYXJcIixcbiAgICAgICAgc3R5bGU6e3dpZHRoOiBwZXJjZW50YWdlICsgJyUnfSxcbiAgICAgICAgJ2FyaWEtdmFsdWVub3cnOnRoaXMucHJvcHMubm93LFxuICAgICAgICAnYXJpYS12YWx1ZW1pbic6dGhpcy5wcm9wcy5taW4sXG4gICAgICAgICdhcmlhLXZhbHVlbWF4Jzp0aGlzLnByb3BzLm1heH0sIFxuICAgICAgICBsYWJlbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTGFiZWw6IGZ1bmN0aW9uIChwZXJjZW50YWdlKSB7XG4gICAgdmFyIEludGVycG9sYXRlQ2xhc3MgPSB0aGlzLnByb3BzLmludGVycG9sYXRlQ2xhc3MgfHwgSW50ZXJwb2xhdGU7XG5cbiAgICByZXR1cm4gKFxuICAgICAgSW50ZXJwb2xhdGVDbGFzcyhcbiAgICAgICAge25vdzp0aGlzLnByb3BzLm5vdyxcbiAgICAgICAgbWluOnRoaXMucHJvcHMubWluLFxuICAgICAgICBtYXg6dGhpcy5wcm9wcy5tYXgsXG4gICAgICAgIHBlcmNlbnQ6cGVyY2VudGFnZSxcbiAgICAgICAgYnNTdHlsZTp0aGlzLnByb3BzLmJzU3R5bGV9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5sYWJlbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyU2NyZWVuUmVhZGVyT25seUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzci1vbmx5XCJ9LCBcbiAgICAgICAgbGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmVzc0JhcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xuXG5cbnZhciBSb3cgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSb3cnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00uZGl2XG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm93OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBEcm9wZG93blN0YXRlTWl4aW4gPSByZXF1aXJlKCcuL0Ryb3Bkb3duU3RhdGVNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG52YXIgQnV0dG9uR3JvdXAgPSByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyk7XG52YXIgRHJvcGRvd25NZW51ID0gcmVxdWlyZSgnLi9Ecm9wZG93bk1lbnUnKTtcblxudmFyIFNwbGl0QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU3BsaXRCdXR0b24nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgRHJvcGRvd25TdGF0ZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6ICAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB0aXRsZTogICAgICAgICBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBocmVmOiAgICAgICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGRyb3Bkb3duVGl0bGU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uQ2xpY2s6ICAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG9uU2VsZWN0OiAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGRpc2FibGVkOiAgICAgIFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRyb3Bkb3duVGl0bGU6ICdUb2dnbGUgZHJvcGRvd24nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZ3JvdXBDbGFzc2VzID0ge1xuICAgICAgICAnb3Blbic6IHRoaXMuc3RhdGUub3BlbixcbiAgICAgICAgJ2Ryb3B1cCc6IHRoaXMucHJvcHMuZHJvcHVwXG4gICAgICB9O1xuXG4gICAgdmFyIGJ1dHRvbiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgQnV0dG9uKFxuICAgICAgICB7cmVmOlwiYnV0dG9uXCIsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVCdXR0b25DbGljayxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgaWQ6bnVsbH0sIFxuICAgICAgICB0aGlzLnByb3BzLnRpdGxlXG4gICAgICApXG4gICAgKTtcblxuICAgIHZhciBkcm9wZG93bkJ1dHRvbiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgQnV0dG9uKFxuICAgICAgICB7cmVmOlwiZHJvcGRvd25CdXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOlwiZHJvcGRvd24tdG9nZ2xlXCIsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVEcm9wZG93bkNsaWNrLFxuICAgICAgICB0aXRsZTpudWxsLFxuICAgICAgICBpZDpudWxsfSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3Itb25seVwifSwgdGhpcy5wcm9wcy5kcm9wZG93blRpdGxlKSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJjYXJldFwifSApXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiAoXG4gICAgICBCdXR0b25Hcm91cChcbiAgICAgICAge2JzU2l6ZTp0aGlzLnByb3BzLmJzU2l6ZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGdyb3VwQ2xhc3NlcyksXG4gICAgICAgIGlkOnRoaXMucHJvcHMuaWR9LCBcbiAgICAgICAgYnV0dG9uLFxuICAgICAgICBkcm9wZG93bkJ1dHRvbixcbiAgICAgICAgRHJvcGRvd25NZW51KFxuICAgICAgICAgIHtyZWY6XCJtZW51XCIsXG4gICAgICAgICAgb25TZWxlY3Q6dGhpcy5oYW5kbGVPcHRpb25TZWxlY3QsXG4gICAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6dGhpcy5wcm9wcy5pZCxcbiAgICAgICAgICBwdWxsUmlnaHQ6dGhpcy5wcm9wcy5wdWxsUmlnaHR9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGhhbmRsZUJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnN0YXRlLm9wZW4pIHtcbiAgICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMub25DbGljaykge1xuICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKGUpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVEcm9wZG93bkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZSghdGhpcy5zdGF0ZS5vcGVuKTtcbiAgfSxcblxuICBoYW5kbGVPcHRpb25TZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGl0QnV0dG9uO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBTdWJOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTdWJOYXYnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGV4dDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ25hdidcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5wcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5LCB0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBpc0FjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlzQ2hpbGRBY3RpdmUodGhpcyk7XG4gIH0sXG5cbiAgaXNDaGlsZEFjdGl2ZTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgJiYgdGhpcy5wcm9wcy5hY3RpdmVLZXkgPT09IGNoaWxkLnByb3BzLmtleSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsICYmIHRoaXMucHJvcHMuYWN0aXZlSHJlZiA9PT0gY2hpbGQucHJvcHMuaHJlZikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkLnByb3BzLmNoaWxkcmVuKSB7XG4gICAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5mb3JFYWNoKFxuICAgICAgICBjaGlsZC5wcm9wcy5jaGlsZHJlbixcbiAgICAgICAgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNDaGlsZEFjdGl2ZShjaGlsZCkpIHtcbiAgICAgICAgICAgIGlzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBpc0FjdGl2ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgZ2V0Q2hpbGRBY3RpdmVQcm9wOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQucHJvcHMuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5rZXkgPT09IHRoaXMucHJvcHMuYWN0aXZlS2V5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVIcmVmICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5ocmVmID09PSB0aGlzLnByb3BzLmFjdGl2ZUhyZWYpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkLnByb3BzLmFjdGl2ZTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdhY3RpdmUnOiB0aGlzLmlzQWN0aXZlKCksXG4gICAgICAnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uYShcbiAgICAgICAgICB7aHJlZjp0aGlzLnByb3BzLmhyZWYsXG4gICAgICAgICAgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSxcbiAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlQ2xpY2ssXG4gICAgICAgICAgcmVmOlwiYW5jaG9yXCJ9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLnRleHRcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2XCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck5hdkl0ZW0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBhY3RpdmU6IHRoaXMuZ2V0Q2hpbGRBY3RpdmVQcm9wKGNoaWxkKSxcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1Yk5hdjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBUYWJQYW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFiUGFuZScsXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbmltYXRpb246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbmltYXRlSW46IGZhbHNlLFxuICAgICAgYW5pbWF0ZU91dDogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5hbmltYXRpb24pIHtcbiAgICAgIGlmICghdGhpcy5zdGF0ZS5hbmltYXRlSW4gJiYgbmV4dFByb3BzLmFjdGl2ZSAmJiAhdGhpcy5wcm9wcy5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgYW5pbWF0ZUluOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5hbmltYXRlT3V0ICYmICFuZXh0UHJvcHMuYWN0aXZlICYmIHRoaXMucHJvcHMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGFuaW1hdGVPdXQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmFuaW1hdGVJbikge1xuICAgICAgc2V0VGltZW91dCh0aGlzLnN0YXJ0QW5pbWF0ZUluLCAwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUuYW5pbWF0ZU91dCkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdldERPTU5vZGUoKSxcbiAgICAgICAgdGhpcy5zdG9wQW5pbWF0ZU91dFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RhcnRBbmltYXRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFuaW1hdGVJbjogZmFsc2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBzdG9wQW5pbWF0ZU91dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYW5pbWF0ZU91dDogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ3RhYi1wYW5lJzogdHJ1ZSxcbiAgICAgICdmYWRlJzogdHJ1ZSxcbiAgICAgICdhY3RpdmUnOiB0aGlzLnByb3BzLmFjdGl2ZSB8fCB0aGlzLnN0YXRlLmFuaW1hdGVPdXQsXG4gICAgICAnaW4nOiB0aGlzLnByb3BzLmFjdGl2ZSAmJiAhdGhpcy5zdGF0ZS5hbmltYXRlSW5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFiUGFuZTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIE5hdiA9IHJlcXVpcmUoJy4vTmF2Jyk7XG52YXIgTmF2SXRlbSA9IHJlcXVpcmUoJy4vTmF2SXRlbScpO1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0QWN0aXZlS2V5RnJvbUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gIHZhciBkZWZhdWx0QWN0aXZlS2V5O1xuXG4gIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAoZGVmYXVsdEFjdGl2ZUtleSA9PSBudWxsKSB7XG4gICAgICBkZWZhdWx0QWN0aXZlS2V5ID0gY2hpbGQucHJvcHMua2V5O1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlZmF1bHRBY3RpdmVLZXk7XG59XG5cbnZhciBUYWJiZWRBcmVhID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFiYmVkQXJlYScsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0YWJzJywncGlsbHMnXSksXG4gICAgYW5pbWF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNTdHlsZTogXCJ0YWJzXCIsXG4gICAgICBhbmltYXRpb246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWZhdWx0QWN0aXZlS2V5ID0gdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5ICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5IDogZ2V0RGVmYXVsdEFjdGl2ZUtleUZyb21DaGlsZHJlbih0aGlzLnByb3BzLmNoaWxkcmVuKTtcblxuICAgIC8vIFRPRE86IEluIF9fREVWX18gbW9kZSB3YXJuIHZpYSBgY29uc29sZS53YXJuYCBpZiBubyBgZGVmYXVsdEFjdGl2ZUtleWAgaGFzXG4gICAgLy8gYmVlbiBzZXQgYnkgdGhpcyBwb2ludCwgaW52YWxpZCBjaGlsZHJlbiBvciBtaXNzaW5nIGtleSBwcm9wZXJ0aWVzIGFyZSBsaWtlbHkgdGhlIGNhdXNlLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZUtleTogZGVmYXVsdEFjdGl2ZUtleSxcbiAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKG5leHRQcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCAmJiBuZXh0UHJvcHMuYWN0aXZlS2V5ICE9PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiB0aGlzLnByb3BzLmFjdGl2ZUtleVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZVBhbmVBbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwcmV2aW91c0FjdGl2ZUtleTogbnVsbFxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY3RpdmVLZXkgPVxuICAgICAgdGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlS2V5IDogdGhpcy5zdGF0ZS5hY3RpdmVLZXk7XG5cbiAgICBmdW5jdGlvbiByZW5kZXJUYWJJZlNldChjaGlsZCkge1xuICAgICAgcmV0dXJuIGNoaWxkLnByb3BzLnRhYiAhPSBudWxsID8gdGhpcy5yZW5kZXJUYWIoY2hpbGQpIDogbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbmF2ID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBOYXYoIHthY3RpdmVLZXk6YWN0aXZlS2V5LCBvblNlbGVjdDp0aGlzLmhhbmRsZVNlbGVjdCwgcmVmOlwidGFic1wifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHJlbmRlclRhYklmU2V0LCB0aGlzKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgbmF2LFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7aWQ6dGhpcy5wcm9wcy5pZCwgY2xhc3NOYW1lOlwidGFiLWNvbnRlbnRcIiwgcmVmOlwicGFuZXNcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFuZSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgZ2V0QWN0aXZlS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuICB9LFxuXG4gIHJlbmRlclBhbmU6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHZhciBhY3RpdmVLZXkgPSB0aGlzLmdldEFjdGl2ZUtleSgpO1xuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgICBjaGlsZCxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZTogKGNoaWxkLnByb3BzLmtleSA9PT0gYWN0aXZlS2V5ICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUtleSA9PSBudWxsIHx8ICF0aGlzLnByb3BzLmFuaW1hdGlvbikpLFxuICAgICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICAgIGFuaW1hdGlvbjogdGhpcy5wcm9wcy5hbmltYXRpb24sXG4gICAgICAgICAgb25BbmltYXRlT3V0RW5kOiAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUtleSAhPSBudWxsICYmXG4gICAgICAgICAgICBjaGlsZC5wcm9wcy5rZXkgPT09IHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkpID8gdGhpcy5oYW5kbGVQYW5lQW5pbWF0ZU91dEVuZDogbnVsbFxuICAgICAgICB9XG4gICAgICApO1xuICB9LFxuXG4gIHJlbmRlclRhYjogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIGtleSA9IGNoaWxkLnByb3BzLmtleTtcbiAgICByZXR1cm4gKFxuICAgICAgTmF2SXRlbShcbiAgICAgICAge3JlZjondGFiJyArIGtleSxcbiAgICAgICAga2V5OmtleX0sIFxuICAgICAgICBjaGlsZC5wcm9wcy50YWJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gRGVmZXIgYW55IHVwZGF0ZXMgdG8gdGhpcyBjb21wb25lbnQgZHVyaW5nIHRoZSBgb25TZWxlY3RgIGhhbmRsZXIuXG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGtleSAhPT0gdGhpcy5nZXRBY3RpdmVLZXkoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFjdGl2ZUtleToga2V5LFxuICAgICAgICBwcmV2aW91c0FjdGl2ZUtleTogdGhpcy5nZXRBY3RpdmVLZXkoKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRBcmVhOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIFRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFibGUnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBzdHJpcGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBib3JkZXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY29uZGVuc2VkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBob3ZlcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcmVzcG9uc2l2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICd0YWJsZSc6IHRydWUsXG4gICAgICAndGFibGUtc3RyaXBlZCc6IHRoaXMucHJvcHMuc3RyaXBlZCxcbiAgICAgICd0YWJsZS1ib3JkZXJlZCc6IHRoaXMucHJvcHMuYm9yZGVyZWQsXG4gICAgICAndGFibGUtY29uZGVuc2VkJzogdGhpcy5wcm9wcy5jb25kZW5zZWQsXG4gICAgICAndGFibGUtaG92ZXInOiB0aGlzLnByb3BzLmhvdmVyXG4gICAgfTtcbiAgICB2YXIgdGFibGUgPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS50YWJsZSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLnJlc3BvbnNpdmUgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFibGUtcmVzcG9uc2l2ZVwifSwgXG4gICAgICAgIHRhYmxlXG4gICAgICApXG4gICAgKSA6IHRhYmxlO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJsZTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIFRvb2x0aXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUb29sdGlwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgcG9zaXRpb25MZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHBvc2l0aW9uVG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0TGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldFRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG4gICAgY2xhc3Nlc1sndG9vbHRpcCddID0gdHJ1ZTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMucGxhY2VtZW50XSA9IHRydWU7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0ICE9IG51bGwgfHwgdGhpcy5wcm9wcy5wb3NpdGlvblRvcCAhPSBudWxsO1xuXG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgc3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0O1xuICAgIHN0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMucG9zaXRpb25Ub3A7XG5cbiAgICB2YXIgYXJyb3dTdHlsZSA9IHt9O1xuICAgIGFycm93U3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRMZWZ0O1xuICAgIGFycm93U3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldFRvcDtcblxuICAgIHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHN0eWxlOnN0eWxlfSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRvb2x0aXAtYXJyb3dcIiwgc3R5bGU6YXJyb3dTdHlsZX0gKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidG9vbHRpcC1pbm5lclwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb29sdGlwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIFdlbGwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdXZWxsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnd2VsbCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWxsOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBDTEFTU0VTOiB7XG4gICAgJ2FsZXJ0JzogJ2FsZXJ0JyxcbiAgICAnYnV0dG9uJzogJ2J0bicsXG4gICAgJ2J1dHRvbi1ncm91cCc6ICdidG4tZ3JvdXAnLFxuICAgICdidXR0b24tdG9vbGJhcic6ICdidG4tdG9vbGJhcicsXG4gICAgJ2NvbHVtbic6ICdjb2wnLFxuICAgICdpbnB1dC1ncm91cCc6ICdpbnB1dC1ncm91cCcsXG4gICAgJ2Zvcm0nOiAnZm9ybScsXG4gICAgJ2dseXBoaWNvbic6ICdnbHlwaGljb24nLFxuICAgICdsYWJlbCc6ICdsYWJlbCcsXG4gICAgJ3BhbmVsJzogJ3BhbmVsJyxcbiAgICAncGFuZWwtZ3JvdXAnOiAncGFuZWwtZ3JvdXAnLFxuICAgICdwcm9ncmVzcy1iYXInOiAncHJvZ3Jlc3MtYmFyJyxcbiAgICAnbmF2JzogJ25hdicsXG4gICAgJ25hdmJhcic6ICduYXZiYXInLFxuICAgICdtb2RhbCc6ICdtb2RhbCcsXG4gICAgJ3Jvdyc6ICdyb3cnLFxuICAgICd3ZWxsJzogJ3dlbGwnXG4gIH0sXG4gIFNUWUxFUzoge1xuICAgICdkZWZhdWx0JzogJ2RlZmF1bHQnLFxuICAgICdwcmltYXJ5JzogJ3ByaW1hcnknLFxuICAgICdzdWNjZXNzJzogJ3N1Y2Nlc3MnLFxuICAgICdpbmZvJzogJ2luZm8nLFxuICAgICd3YXJuaW5nJzogJ3dhcm5pbmcnLFxuICAgICdkYW5nZXInOiAnZGFuZ2VyJyxcbiAgICAnbGluayc6ICdsaW5rJyxcbiAgICAnaW5saW5lJzogJ2lubGluZScsXG4gICAgJ3RhYnMnOiAndGFicycsXG4gICAgJ3BpbGxzJzogJ3BpbGxzJ1xuICB9LFxuICBTSVpFUzoge1xuICAgICdsYXJnZSc6ICdsZycsXG4gICAgJ21lZGl1bSc6ICdtZCcsXG4gICAgJ3NtYWxsJzogJ3NtJyxcbiAgICAneHNtYWxsJzogJ3hzJ1xuICB9LFxuICBHTFlQSFM6IFtcbiAgICAnYXN0ZXJpc2snLFxuICAgICdwbHVzJyxcbiAgICAnZXVybycsXG4gICAgJ21pbnVzJyxcbiAgICAnY2xvdWQnLFxuICAgICdlbnZlbG9wZScsXG4gICAgJ3BlbmNpbCcsXG4gICAgJ2dsYXNzJyxcbiAgICAnbXVzaWMnLFxuICAgICdzZWFyY2gnLFxuICAgICdoZWFydCcsXG4gICAgJ3N0YXInLFxuICAgICdzdGFyLWVtcHR5JyxcbiAgICAndXNlcicsXG4gICAgJ2ZpbG0nLFxuICAgICd0aC1sYXJnZScsXG4gICAgJ3RoJyxcbiAgICAndGgtbGlzdCcsXG4gICAgJ29rJyxcbiAgICAncmVtb3ZlJyxcbiAgICAnem9vbS1pbicsXG4gICAgJ3pvb20tb3V0JyxcbiAgICAnb2ZmJyxcbiAgICAnc2lnbmFsJyxcbiAgICAnY29nJyxcbiAgICAndHJhc2gnLFxuICAgICdob21lJyxcbiAgICAnZmlsZScsXG4gICAgJ3RpbWUnLFxuICAgICdyb2FkJyxcbiAgICAnZG93bmxvYWQtYWx0JyxcbiAgICAnZG93bmxvYWQnLFxuICAgICd1cGxvYWQnLFxuICAgICdpbmJveCcsXG4gICAgJ3BsYXktY2lyY2xlJyxcbiAgICAncmVwZWF0JyxcbiAgICAncmVmcmVzaCcsXG4gICAgJ2xpc3QtYWx0JyxcbiAgICAnbG9jaycsXG4gICAgJ2ZsYWcnLFxuICAgICdoZWFkcGhvbmVzJyxcbiAgICAndm9sdW1lLW9mZicsXG4gICAgJ3ZvbHVtZS1kb3duJyxcbiAgICAndm9sdW1lLXVwJyxcbiAgICAncXJjb2RlJyxcbiAgICAnYmFyY29kZScsXG4gICAgJ3RhZycsXG4gICAgJ3RhZ3MnLFxuICAgICdib29rJyxcbiAgICAnYm9va21hcmsnLFxuICAgICdwcmludCcsXG4gICAgJ2NhbWVyYScsXG4gICAgJ2ZvbnQnLFxuICAgICdib2xkJyxcbiAgICAnaXRhbGljJyxcbiAgICAndGV4dC1oZWlnaHQnLFxuICAgICd0ZXh0LXdpZHRoJyxcbiAgICAnYWxpZ24tbGVmdCcsXG4gICAgJ2FsaWduLWNlbnRlcicsXG4gICAgJ2FsaWduLXJpZ2h0JyxcbiAgICAnYWxpZ24tanVzdGlmeScsXG4gICAgJ2xpc3QnLFxuICAgICdpbmRlbnQtbGVmdCcsXG4gICAgJ2luZGVudC1yaWdodCcsXG4gICAgJ2ZhY2V0aW1lLXZpZGVvJyxcbiAgICAncGljdHVyZScsXG4gICAgJ21hcC1tYXJrZXInLFxuICAgICdhZGp1c3QnLFxuICAgICd0aW50JyxcbiAgICAnZWRpdCcsXG4gICAgJ3NoYXJlJyxcbiAgICAnY2hlY2snLFxuICAgICdtb3ZlJyxcbiAgICAnc3RlcC1iYWNrd2FyZCcsXG4gICAgJ2Zhc3QtYmFja3dhcmQnLFxuICAgICdiYWNrd2FyZCcsXG4gICAgJ3BsYXknLFxuICAgICdwYXVzZScsXG4gICAgJ3N0b3AnLFxuICAgICdmb3J3YXJkJyxcbiAgICAnZmFzdC1mb3J3YXJkJyxcbiAgICAnc3RlcC1mb3J3YXJkJyxcbiAgICAnZWplY3QnLFxuICAgICdjaGV2cm9uLWxlZnQnLFxuICAgICdjaGV2cm9uLXJpZ2h0JyxcbiAgICAncGx1cy1zaWduJyxcbiAgICAnbWludXMtc2lnbicsXG4gICAgJ3JlbW92ZS1zaWduJyxcbiAgICAnb2stc2lnbicsXG4gICAgJ3F1ZXN0aW9uLXNpZ24nLFxuICAgICdpbmZvLXNpZ24nLFxuICAgICdzY3JlZW5zaG90JyxcbiAgICAncmVtb3ZlLWNpcmNsZScsXG4gICAgJ29rLWNpcmNsZScsXG4gICAgJ2Jhbi1jaXJjbGUnLFxuICAgICdhcnJvdy1sZWZ0JyxcbiAgICAnYXJyb3ctcmlnaHQnLFxuICAgICdhcnJvdy11cCcsXG4gICAgJ2Fycm93LWRvd24nLFxuICAgICdzaGFyZS1hbHQnLFxuICAgICdyZXNpemUtZnVsbCcsXG4gICAgJ3Jlc2l6ZS1zbWFsbCcsXG4gICAgJ2V4Y2xhbWF0aW9uLXNpZ24nLFxuICAgICdnaWZ0JyxcbiAgICAnbGVhZicsXG4gICAgJ2ZpcmUnLFxuICAgICdleWUtb3BlbicsXG4gICAgJ2V5ZS1jbG9zZScsXG4gICAgJ3dhcm5pbmctc2lnbicsXG4gICAgJ3BsYW5lJyxcbiAgICAnY2FsZW5kYXInLFxuICAgICdyYW5kb20nLFxuICAgICdjb21tZW50JyxcbiAgICAnbWFnbmV0JyxcbiAgICAnY2hldnJvbi11cCcsXG4gICAgJ2NoZXZyb24tZG93bicsXG4gICAgJ3JldHdlZXQnLFxuICAgICdzaG9wcGluZy1jYXJ0JyxcbiAgICAnZm9sZGVyLWNsb3NlJyxcbiAgICAnZm9sZGVyLW9wZW4nLFxuICAgICdyZXNpemUtdmVydGljYWwnLFxuICAgICdyZXNpemUtaG9yaXpvbnRhbCcsXG4gICAgJ2hkZCcsXG4gICAgJ2J1bGxob3JuJyxcbiAgICAnYmVsbCcsXG4gICAgJ2NlcnRpZmljYXRlJyxcbiAgICAndGh1bWJzLXVwJyxcbiAgICAndGh1bWJzLWRvd24nLFxuICAgICdoYW5kLXJpZ2h0JyxcbiAgICAnaGFuZC1sZWZ0JyxcbiAgICAnaGFuZC11cCcsXG4gICAgJ2hhbmQtZG93bicsXG4gICAgJ2NpcmNsZS1hcnJvdy1yaWdodCcsXG4gICAgJ2NpcmNsZS1hcnJvdy1sZWZ0JyxcbiAgICAnY2lyY2xlLWFycm93LXVwJyxcbiAgICAnY2lyY2xlLWFycm93LWRvd24nLFxuICAgICdnbG9iZScsXG4gICAgJ3dyZW5jaCcsXG4gICAgJ3Rhc2tzJyxcbiAgICAnZmlsdGVyJyxcbiAgICAnYnJpZWZjYXNlJyxcbiAgICAnZnVsbHNjcmVlbicsXG4gICAgJ2Rhc2hib2FyZCcsXG4gICAgJ3BhcGVyY2xpcCcsXG4gICAgJ2hlYXJ0LWVtcHR5JyxcbiAgICAnbGluaycsXG4gICAgJ3Bob25lJyxcbiAgICAncHVzaHBpbicsXG4gICAgJ3VzZCcsXG4gICAgJ2dicCcsXG4gICAgJ3NvcnQnLFxuICAgICdzb3J0LWJ5LWFscGhhYmV0JyxcbiAgICAnc29ydC1ieS1hbHBoYWJldC1hbHQnLFxuICAgICdzb3J0LWJ5LW9yZGVyJyxcbiAgICAnc29ydC1ieS1vcmRlci1hbHQnLFxuICAgICdzb3J0LWJ5LWF0dHJpYnV0ZXMnLFxuICAgICdzb3J0LWJ5LWF0dHJpYnV0ZXMtYWx0JyxcbiAgICAndW5jaGVja2VkJyxcbiAgICAnZXhwYW5kJyxcbiAgICAnY29sbGFwc2UtZG93bicsXG4gICAgJ2NvbGxhcHNlLXVwJyxcbiAgICAnbG9nLWluJyxcbiAgICAnZmxhc2gnLFxuICAgICdsb2ctb3V0JyxcbiAgICAnbmV3LXdpbmRvdycsXG4gICAgJ3JlY29yZCcsXG4gICAgJ3NhdmUnLFxuICAgICdvcGVuJyxcbiAgICAnc2F2ZWQnLFxuICAgICdpbXBvcnQnLFxuICAgICdleHBvcnQnLFxuICAgICdzZW5kJyxcbiAgICAnZmxvcHB5LWRpc2snLFxuICAgICdmbG9wcHktc2F2ZWQnLFxuICAgICdmbG9wcHktcmVtb3ZlJyxcbiAgICAnZmxvcHB5LXNhdmUnLFxuICAgICdmbG9wcHktb3BlbicsXG4gICAgJ2NyZWRpdC1jYXJkJyxcbiAgICAndHJhbnNmZXInLFxuICAgICdjdXRsZXJ5JyxcbiAgICAnaGVhZGVyJyxcbiAgICAnY29tcHJlc3NlZCcsXG4gICAgJ2VhcnBob25lJyxcbiAgICAncGhvbmUtYWx0JyxcbiAgICAndG93ZXInLFxuICAgICdzdGF0cycsXG4gICAgJ3NkLXZpZGVvJyxcbiAgICAnaGQtdmlkZW8nLFxuICAgICdzdWJ0aXRsZXMnLFxuICAgICdzb3VuZC1zdGVyZW8nLFxuICAgICdzb3VuZC1kb2xieScsXG4gICAgJ3NvdW5kLTUtMScsXG4gICAgJ3NvdW5kLTYtMScsXG4gICAgJ3NvdW5kLTctMScsXG4gICAgJ2NvcHlyaWdodC1tYXJrJyxcbiAgICAncmVnaXN0cmF0aW9uLW1hcmsnLFxuICAgICdjbG91ZC1kb3dubG9hZCcsXG4gICAgJ2Nsb3VkLXVwbG9hZCcsXG4gICAgJ3RyZWUtY29uaWZlcicsXG4gICAgJ3RyZWUtZGVjaWR1b3VzJ1xuICBdXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFjY29yZGlvbjogcmVxdWlyZSgnLi9BY2NvcmRpb24nKSxcbiAgQWZmaXg6IHJlcXVpcmUoJy4vQWZmaXgnKSxcbiAgQWZmaXhNaXhpbjogcmVxdWlyZSgnLi9BZmZpeE1peGluJyksXG4gIEFsZXJ0OiByZXF1aXJlKCcuL0FsZXJ0JyksXG4gIEJvb3RzdHJhcE1peGluOiByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyksXG4gIEJhZGdlOiByZXF1aXJlKCcuL0JhZGdlJyksXG4gIEJ1dHRvbjogcmVxdWlyZSgnLi9CdXR0b24nKSxcbiAgQnV0dG9uR3JvdXA6IHJlcXVpcmUoJy4vQnV0dG9uR3JvdXAnKSxcbiAgQnV0dG9uVG9vbGJhcjogcmVxdWlyZSgnLi9CdXR0b25Ub29sYmFyJyksXG4gIENhcm91c2VsOiByZXF1aXJlKCcuL0Nhcm91c2VsJyksXG4gIENhcm91c2VsSXRlbTogcmVxdWlyZSgnLi9DYXJvdXNlbEl0ZW0nKSxcbiAgQ29sOiByZXF1aXJlKCcuL0NvbCcpLFxuICBDb2xsYXBzYWJsZU1peGluOiByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKSxcbiAgRHJvcGRvd25CdXR0b246IHJlcXVpcmUoJy4vRHJvcGRvd25CdXR0b24nKSxcbiAgRHJvcGRvd25NZW51OiByZXF1aXJlKCcuL0Ryb3Bkb3duTWVudScpLFxuICBEcm9wZG93blN0YXRlTWl4aW46IHJlcXVpcmUoJy4vRHJvcGRvd25TdGF0ZU1peGluJyksXG4gIEZhZGVNaXhpbjogcmVxdWlyZSgnLi9GYWRlTWl4aW4nKSxcbiAgR2x5cGhpY29uOiByZXF1aXJlKCcuL0dseXBoaWNvbicpLFxuICBHcmlkOiByZXF1aXJlKCcuL0dyaWQnKSxcbiAgSW5wdXQ6IHJlcXVpcmUoJy4vSW5wdXQnKSxcbiAgSW50ZXJwb2xhdGU6IHJlcXVpcmUoJy4vSW50ZXJwb2xhdGUnKSxcbiAgSnVtYm90cm9uOiByZXF1aXJlKCcuL0p1bWJvdHJvbicpLFxuICBMYWJlbDogcmVxdWlyZSgnLi9MYWJlbCcpLFxuICBNZW51SXRlbTogcmVxdWlyZSgnLi9NZW51SXRlbScpLFxuICBNb2RhbDogcmVxdWlyZSgnLi9Nb2RhbCcpLFxuICBOYXY6IHJlcXVpcmUoJy4vTmF2JyksXG4gIE5hdmJhcjogcmVxdWlyZSgnLi9OYXZiYXInKSxcbiAgTmF2SXRlbTogcmVxdWlyZSgnLi9OYXZJdGVtJyksXG4gIE1vZGFsVHJpZ2dlcjogcmVxdWlyZSgnLi9Nb2RhbFRyaWdnZXInKSxcbiAgT3ZlcmxheVRyaWdnZXI6IHJlcXVpcmUoJy4vT3ZlcmxheVRyaWdnZXInKSxcbiAgT3ZlcmxheU1peGluOiByZXF1aXJlKCcuL092ZXJsYXlNaXhpbicpLFxuICBQYWdlSGVhZGVyOiByZXF1aXJlKCcuL1BhZ2VIZWFkZXInKSxcbiAgUGFuZWw6IHJlcXVpcmUoJy4vUGFuZWwnKSxcbiAgUGFuZWxHcm91cDogcmVxdWlyZSgnLi9QYW5lbEdyb3VwJyksXG4gIFBhZ2VJdGVtOiByZXF1aXJlKCcuL1BhZ2VJdGVtJyksXG4gIFBhZ2VyOiByZXF1aXJlKCcuL1BhZ2VyJyksXG4gIFBvcG92ZXI6IHJlcXVpcmUoJy4vUG9wb3ZlcicpLFxuICBQcm9ncmVzc0JhcjogcmVxdWlyZSgnLi9Qcm9ncmVzc0JhcicpLFxuICBSb3c6IHJlcXVpcmUoJy4vUm93JyksXG4gIFNwbGl0QnV0dG9uOiByZXF1aXJlKCcuL1NwbGl0QnV0dG9uJyksXG4gIFN1Yk5hdjogcmVxdWlyZSgnLi9TdWJOYXYnKSxcbiAgVGFiYmVkQXJlYTogcmVxdWlyZSgnLi9UYWJiZWRBcmVhJyksXG4gIFRhYmxlOiByZXF1aXJlKCcuL1RhYmxlJyksXG4gIFRhYlBhbmU6IHJlcXVpcmUoJy4vVGFiUGFuZScpLFxuICBUb29sdGlwOiByZXF1aXJlKCcuL1Rvb2x0aXAnKSxcbiAgV2VsbDogcmVxdWlyZSgnLi9XZWxsJylcbn07IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbnZhciBDdXN0b21Qcm9wVHlwZXMgPSB7XG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBhIHByb3AgaXMgYSB2YWxpZCBSZWFjdCBjbGFzc1xuICAgKlxuICAgKiBAcGFyYW0gcHJvcHNcbiAgICogQHBhcmFtIHByb3BOYW1lXG4gICAqIEBwYXJhbSBjb21wb25lbnROYW1lXG4gICAqIEByZXR1cm5zIHtFcnJvcnx1bmRlZmluZWR9XG4gICAqL1xuICBjb21wb25lbnRDbGFzczogZnVuY3Rpb24gKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSkge1xuICAgIGlmICghUmVhY3QuaXNWYWxpZENsYXNzKHByb3BzW3Byb3BOYW1lXSkpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0ludmFsaWQgYCcgKyBwcm9wTmFtZSArICdgIHByb3AgaW4gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGJlICcgK1xuICAgICAgICAnYSB2YWxpZCBSZWFjdCBjbGFzcycpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBwcm9wIHByb3ZpZGVzIGEgRE9NIGVsZW1lbnRcbiAgICpcbiAgICogVGhlIGVsZW1lbnQgY2FuIGJlIHByb3ZpZGVkIGluIHR3byBmb3JtczpcbiAgICogLSBEaXJlY3RseSBwYXNzZWRcbiAgICogLSBPciBwYXNzZWQgYW4gb2JqZWN0IHdoaWNoIGhhcyBhIGBnZXRET01Ob2RlYCBtZXRob2Qgd2hpY2ggd2lsbCByZXR1cm4gdGhlIHJlcXVpcmVkIERPTSBlbGVtZW50XG4gICAqXG4gICAqIEBwYXJhbSBwcm9wc1xuICAgKiBAcGFyYW0gcHJvcE5hbWVcbiAgICogQHBhcmFtIGNvbXBvbmVudE5hbWVcbiAgICogQHJldHVybnMge0Vycm9yfHVuZGVmaW5lZH1cbiAgICovXG4gIG1vdW50YWJsZTogZnVuY3Rpb24gKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSkge1xuICAgIGlmICh0eXBlb2YgcHJvcHNbcHJvcE5hbWVdICE9PSAnb2JqZWN0JyB8fFxuICAgICAgdHlwZW9mIHByb3BzW3Byb3BOYW1lXS5nZXRET01Ob2RlICE9PSAnZnVuY3Rpb24nICYmIHByb3BzW3Byb3BOYW1lXS5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignSW52YWxpZCBgJyArIHByb3BOYW1lICsgJ2AgcHJvcCBpbiBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYmUgJyArXG4gICAgICAgICdhIERPTSBlbGVtZW50IG9yIGFuIG9iamVjdCB0aGF0IGhhcyBhIGBnZXRET01Ob2RlYCBtZXRob2QnKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VzdG9tUHJvcFR5cGVzOyIsIi8qKlxuICogUmVhY3QgRXZlbnRMaXN0ZW5lci5saXN0ZW5cbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGEgbW9kaWZpZWQgdmVyc2lvbiBvZjpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdmVuZG9yL3N0dWJzL0V2ZW50TGlzdGVuZXIuanNcbiAqXG4gKiBUT0RPOiByZW1vdmUgaW4gZmF2b3VyIG9mIHNvbHV0aW9uIHByb3ZpZGVkIGJ5OlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9pc3N1ZXMvMjg1XG4gKi9cblxuLyoqXG4gKiBEb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCBzcGVjaWZpYyBuYXR1cmUgb2YgcGxhdGZvcm0uXG4gKi9cbnZhciBFdmVudExpc3RlbmVyID0ge1xuICAvKipcbiAgICogTGlzdGVuIHRvIERPTSBldmVudHMgZHVyaW5nIHRoZSBidWJibGUgcGhhc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RE9NRXZlbnRUYXJnZXR9IHRhcmdldCBET00gZWxlbWVudCB0byByZWdpc3RlciBsaXN0ZW5lciBvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBFdmVudCB0eXBlLCBlLmcuICdjbGljaycgb3IgJ21vdXNlb3ZlcicuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCB3aXRoIGEgYHJlbW92ZWAgbWV0aG9kLlxuICAgKi9cbiAgbGlzdGVuOiBmdW5jdGlvbih0YXJnZXQsIGV2ZW50VHlwZSwgY2FsbGJhY2spIHtcbiAgICBpZiAodGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAodGFyZ2V0LmF0dGFjaEV2ZW50KSB7XG4gICAgICB0YXJnZXQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50VHlwZSwgY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0YXJnZXQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50VHlwZSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudExpc3RlbmVyO1xuIiwiLyoqXG4gKiBSZWFjdCBUcmFuc2l0aW9uRXZlbnRzXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhIG1vZGlmaWVkIHZlcnNpb24gb2Y6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL2FkZG9ucy90cmFuc2l0aW9ucy9SZWFjdFRyYW5zaXRpb25FdmVudHMuanNcbiAqXG4gKi9cblxudmFyIGNhblVzZURPTSA9ICEhKFxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHdpbmRvdy5kb2N1bWVudCAmJlxuICAgIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50XG4gICk7XG5cbi8qKlxuICogRVZFTlRfTkFNRV9NQVAgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hpY2ggZXZlbnQgZmlyZWQgd2hlbiBhXG4gKiB0cmFuc2l0aW9uL2FuaW1hdGlvbiBlbmRzLCBiYXNlZCBvbiB0aGUgc3R5bGUgcHJvcGVydHkgdXNlZCB0b1xuICogZGVmaW5lIHRoYXQgZXZlbnQuXG4gKi9cbnZhciBFVkVOVF9OQU1FX01BUCA9IHtcbiAgdHJhbnNpdGlvbmVuZDoge1xuICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICdNb3pUcmFuc2l0aW9uJzogJ21velRyYW5zaXRpb25FbmQnLFxuICAgICdPVHJhbnNpdGlvbic6ICdvVHJhbnNpdGlvbkVuZCcsXG4gICAgJ21zVHJhbnNpdGlvbic6ICdNU1RyYW5zaXRpb25FbmQnXG4gIH0sXG5cbiAgYW5pbWF0aW9uZW5kOiB7XG4gICAgJ2FuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnLFxuICAgICdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJyxcbiAgICAnTW96QW5pbWF0aW9uJzogJ21vekFuaW1hdGlvbkVuZCcsXG4gICAgJ09BbmltYXRpb24nOiAnb0FuaW1hdGlvbkVuZCcsXG4gICAgJ21zQW5pbWF0aW9uJzogJ01TQW5pbWF0aW9uRW5kJ1xuICB9XG59O1xuXG52YXIgZW5kRXZlbnRzID0gW107XG5cbmZ1bmN0aW9uIGRldGVjdEV2ZW50cygpIHtcbiAgdmFyIHRlc3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgc3R5bGUgPSB0ZXN0RWwuc3R5bGU7XG5cbiAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIGluIHBhcnRpY3VsYXIgc29tZSByZWxlYXNlcyBvZiBBbmRyb2lkIDQueCxcbiAgLy8gdGhlIHVuLXByZWZpeGVkIFwiYW5pbWF0aW9uXCIgYW5kIFwidHJhbnNpdGlvblwiIHByb3BlcnRpZXMgYXJlIGRlZmluZWQgb24gdGhlXG4gIC8vIHN0eWxlIG9iamVjdCBidXQgdGhlIGV2ZW50cyB0aGF0IGZpcmUgd2lsbCBzdGlsbCBiZSBwcmVmaXhlZCwgc28gd2UgbmVlZFxuICAvLyB0byBjaGVjayBpZiB0aGUgdW4tcHJlZml4ZWQgZXZlbnRzIGFyZSB1c2VhYmxlLCBhbmQgaWYgbm90IHJlbW92ZSB0aGVtXG4gIC8vIGZyb20gdGhlIG1hcFxuICBpZiAoISgnQW5pbWF0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAuYW5pbWF0aW9uZW5kLmFuaW1hdGlvbjtcbiAgfVxuXG4gIGlmICghKCdUcmFuc2l0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAudHJhbnNpdGlvbmVuZC50cmFuc2l0aW9uO1xuICB9XG5cbiAgZm9yICh2YXIgYmFzZUV2ZW50TmFtZSBpbiBFVkVOVF9OQU1FX01BUCkge1xuICAgIHZhciBiYXNlRXZlbnRzID0gRVZFTlRfTkFNRV9NQVBbYmFzZUV2ZW50TmFtZV07XG4gICAgZm9yICh2YXIgc3R5bGVOYW1lIGluIGJhc2VFdmVudHMpIHtcbiAgICAgIGlmIChzdHlsZU5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZW5kRXZlbnRzLnB1c2goYmFzZUV2ZW50c1tzdHlsZU5hbWVdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmlmIChjYW5Vc2VET00pIHtcbiAgZGV0ZWN0RXZlbnRzKCk7XG59XG5cbi8vIFdlIHVzZSB0aGUgcmF3IHthZGR8cmVtb3ZlfUV2ZW50TGlzdGVuZXIoKSBjYWxsIGJlY2F1c2UgRXZlbnRMaXN0ZW5lclxuLy8gZG9lcyBub3Qga25vdyBob3cgdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVycyBhbmQgd2UgcmVhbGx5IHNob3VsZFxuLy8gY2xlYW4gdXAuIEFsc28sIHRoZXNlIGV2ZW50cyBhcmUgbm90IHRyaWdnZXJlZCBpbiBvbGRlciBicm93c2Vyc1xuLy8gc28gd2Ugc2hvdWxkIGJlIEEtT0sgaGVyZS5cblxuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lcikge1xuICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCBmYWxzZSk7XG59XG5cbnZhciBSZWFjdFRyYW5zaXRpb25FdmVudHMgPSB7XG4gIGFkZEVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gSWYgQ1NTIHRyYW5zaXRpb25zIGFyZSBub3Qgc3VwcG9ydGVkLCB0cmlnZ2VyIGFuIFwiZW5kIGFuaW1hdGlvblwiXG4gICAgICAvLyBldmVudCBpbW1lZGlhdGVseS5cbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGV2ZW50TGlzdGVuZXIsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH0sXG5cbiAgcmVtb3ZlRW5kRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24obm9kZSwgZXZlbnRMaXN0ZW5lcikge1xuICAgIGlmIChlbmRFdmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVuZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVuZEV2ZW50KSB7XG4gICAgICByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGVuZEV2ZW50LCBldmVudExpc3RlbmVyKTtcbiAgICB9KTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFRyYW5zaXRpb25FdmVudHM7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxuLyoqXG4gKiBNYXBzIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYCxcbiAqIGJ1dCBvbmx5IGl0ZXJhdGVzIG92ZXIgY2hpbGRyZW4gdGhhdCBhcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogVGhlIG1hcEZ1bmN0aW9uIHByb3ZpZGVkIGluZGV4IHdpbGwgYmUgbm9ybWFsaXNlZCB0byB0aGUgY29tcG9uZW50cyBtYXBwZWQsXG4gKiBzbyBhbiBpbnZhbGlkIGNvbXBvbmVudCB3b3VsZCBub3QgaW5jcmVhc2UgdGhlIGluZGV4LlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBpbnQpfSBtYXBGdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gbWFwQ29udGV4dCBDb250ZXh0IGZvciBtYXBGdW5jdGlvbi5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9yZGVyZWQgbWFwIG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIG1hcFZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbiwgZnVuYywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSAwO1xuXG4gIHJldHVybiBSZWFjdC5DaGlsZHJlbi5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkge1xuICAgICAgdmFyIGxhc3RJbmRleCA9IGluZGV4O1xuICAgICAgaW5kZXgrKztcbiAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgY2hpbGQsIGxhc3RJbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xuICB9KTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYCxcbiAqIGJ1dCBvbmx5IGl0ZXJhdGVzIG92ZXIgY2hpbGRyZW4gdGhhdCBhcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogVGhlIHByb3ZpZGVkIGZvckVhY2hGdW5jKGNoaWxkLCBpbmRleCkgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2hcbiAqIGxlYWYgY2hpbGQgd2l0aCB0aGUgaW5kZXggcmVmbGVjdGluZyB0aGUgcG9zaXRpb24gcmVsYXRpdmUgdG8gXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIGludCl9IGZvckVhY2hGdW5jLlxuICogQHBhcmFtIHsqfSBmb3JFYWNoQ29udGV4dCBDb250ZXh0IGZvciBmb3JFYWNoQ29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaFZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbiwgZnVuYywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSAwO1xuXG4gIHJldHVybiBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHtcbiAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBjaGlsZCwgaW5kZXgpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCJ2YWxpZCBjb21wb25lbnRzXCIgaW4gdGhlIENoaWxkcmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG51bWJlck9mVmFsaWRDb21wb25lbnRzKGNoaWxkcmVuKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7IGNvdW50Kys7IH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgQ2hpbGQgY29udGFpbmVyIGhhcyBvbmUgb3IgbW9yZSBcInZhbGlkIGNvbXBvbmVudHNcIi5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBoYXNWYWxpZENvbXBvbmVudChjaGlsZHJlbikge1xuICB2YXIgaGFzVmFsaWQgPSBmYWxzZTtcblxuICBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoIWhhc1ZhbGlkICYmIFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7XG4gICAgICBoYXNWYWxpZCA9IHRydWU7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaGFzVmFsaWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYXA6IG1hcFZhbGlkQ29tcG9uZW50cyxcbiAgZm9yRWFjaDogZm9yRWFjaFZhbGlkQ29tcG9uZW50cyxcbiAgbnVtYmVyT2Y6IG51bWJlck9mVmFsaWRDb21wb25lbnRzLFxuICBoYXNWYWxpZENvbXBvbmVudDogaGFzVmFsaWRDb21wb25lbnRcbn07IiwiLyoqXG4gKiBSZWFjdCBjbGFzc1NldFxuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgaXMgdW5tb2RpZmllZCBmcm9tOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy92ZW5kb3Ivc3R1YnMvY3guanNcbiAqXG4gKi9cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gbWFyayBzdHJpbmcgbGl0ZXJhbHMgcmVwcmVzZW50aW5nIENTUyBjbGFzcyBuYW1lc1xuICogc28gdGhhdCB0aGV5IGNhbiBiZSB0cmFuc2Zvcm1lZCBzdGF0aWNhbGx5LiBUaGlzIGFsbG93cyBmb3IgbW9kdWxhcml6YXRpb25cbiAqIGFuZCBtaW5pZmljYXRpb24gb2YgQ1NTIGNsYXNzIG5hbWVzLlxuICpcbiAqIEluIHN0YXRpY191cHN0cmVhbSwgdGhpcyBmdW5jdGlvbiBpcyBhY3R1YWxseSBpbXBsZW1lbnRlZCwgYnV0IGl0IHNob3VsZFxuICogZXZlbnR1YWxseSBiZSByZXBsYWNlZCB3aXRoIHNvbWV0aGluZyBtb3JlIGRlc2NyaXB0aXZlLCBhbmQgdGhlIHRyYW5zZm9ybVxuICogdGhhdCBpcyB1c2VkIGluIHRoZSBtYWluIHN0YWNrIHNob3VsZCBiZSBwb3J0ZWQgZm9yIHVzZSBlbHNld2hlcmUuXG4gKlxuICogQHBhcmFtIHN0cmluZ3xvYmplY3QgY2xhc3NOYW1lIHRvIG1vZHVsYXJpemUsIG9yIGFuIG9iamVjdCBvZiBrZXkvdmFsdWVzLlxuICogICAgICAgICAgICAgICAgICAgICAgSW4gdGhlIG9iamVjdCBjYXNlLCB0aGUgdmFsdWVzIGFyZSBjb25kaXRpb25zIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgICAgIGRldGVybWluZSBpZiB0aGUgY2xhc3NOYW1lIGtleXMgc2hvdWxkIGJlIGluY2x1ZGVkLlxuICogQHBhcmFtIFtzdHJpbmcgLi4uXSAgVmFyaWFibGUgbGlzdCBvZiBjbGFzc05hbWVzIGluIHRoZSBzdHJpbmcgY2FzZS5cbiAqIEByZXR1cm4gc3RyaW5nICAgICAgIFJlbmRlcmFibGUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc05hbWUuXG4gKi9cbmZ1bmN0aW9uIGN4KGNsYXNzTmFtZXMpIHtcbiAgaWYgKHR5cGVvZiBjbGFzc05hbWVzID09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGNsYXNzTmFtZXMpLmZpbHRlcihmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgIHJldHVybiBjbGFzc05hbWVzW2NsYXNzTmFtZV07XG4gICAgfSkuam9pbignICcpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cywgJyAnKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGN4OyIsIi8qKlxuICogUmVhY3QgY2xvbmVXaXRoUHJvcHNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIG1vZGlmaWVkIHZlcnNpb25zIG9mOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy91dGlscy9jbG9uZVdpdGhQcm9wcy5qc1xuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy9jb3JlL1JlYWN0UHJvcFRyYW5zZmVyZXIuanNcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdXRpbHMvam9pbkNsYXNzZXMuanNcbiAqXG4gKiBUT0RPOiBUaGlzIHNob3VsZCBiZSByZXBsYWNlZCBhcyBzb29uIGFzIGNsb25lV2l0aFByb3BzIGlzIGF2YWlsYWJsZSB2aWFcbiAqICB0aGUgY29yZSBSZWFjdCBwYWNrYWdlIG9yIGEgc2VwYXJhdGUgcGFja2FnZS5cbiAqICBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9pc3N1ZXMvMTkwNlxuICpcbiAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKTtcblxuLyoqXG4gKiBDb21iaW5lcyBtdWx0aXBsZSBjbGFzc05hbWUgc3RyaW5ncyBpbnRvIG9uZS5cbiAqIGh0dHA6Ly9qc3BlcmYuY29tL2pvaW5jbGFzc2VzLWFyZ3MtdnMtYXJyYXlcbiAqXG4gKiBAcGFyYW0gey4uLj9zdHJpbmd9IGNsYXNzZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gam9pbkNsYXNzZXMoY2xhc3NOYW1lLyosIC4uLiAqLykge1xuICBpZiAoIWNsYXNzTmFtZSkge1xuICAgIGNsYXNzTmFtZSA9ICcnO1xuICB9XG4gIHZhciBuZXh0Q2xhc3M7XG4gIHZhciBhcmdMZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICBpZiAoYXJnTGVuZ3RoID4gMSkge1xuICAgIGZvciAodmFyIGlpID0gMTsgaWkgPCBhcmdMZW5ndGg7IGlpKyspIHtcbiAgICAgIG5leHRDbGFzcyA9IGFyZ3VtZW50c1tpaV07XG4gICAgICBuZXh0Q2xhc3MgJiYgKGNsYXNzTmFtZSArPSAnICcgKyBuZXh0Q2xhc3MpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB0cmFuc2ZlciBzdHJhdGVneSB0aGF0IHdpbGwgbWVyZ2UgcHJvcCB2YWx1ZXMgdXNpbmcgdGhlIHN1cHBsaWVkXG4gKiBgbWVyZ2VTdHJhdGVneWAuIElmIGEgcHJvcCB3YXMgcHJldmlvdXNseSB1bnNldCwgdGhpcyBqdXN0IHNldHMgaXQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gbWVyZ2VTdHJhdGVneVxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zZmVyU3RyYXRlZ3kobWVyZ2VTdHJhdGVneSkge1xuICByZXR1cm4gZnVuY3Rpb24ocHJvcHMsIGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIXByb3BzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHByb3BzW2tleV0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHNba2V5XSA9IG1lcmdlU3RyYXRlZ3kocHJvcHNba2V5XSwgdmFsdWUpO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIHRyYW5zZmVyU3RyYXRlZ3lNZXJnZSA9IGNyZWF0ZVRyYW5zZmVyU3RyYXRlZ3koZnVuY3Rpb24oYSwgYikge1xuICAvLyBgbWVyZ2VgIG92ZXJyaWRlcyB0aGUgZmlyc3Qgb2JqZWN0J3MgKGBwcm9wc1trZXldYCBhYm92ZSkga2V5cyB1c2luZyB0aGVcbiAgLy8gc2Vjb25kIG9iamVjdCdzIChgdmFsdWVgKSBrZXlzLiBBbiBvYmplY3QncyBzdHlsZSdzIGV4aXN0aW5nIGBwcm9wQWAgd291bGRcbiAgLy8gZ2V0IG92ZXJyaWRkZW4uIEZsaXAgdGhlIG9yZGVyIGhlcmUuXG4gIHJldHVybiBtZXJnZShiLCBhKTtcbn0pO1xuXG5mdW5jdGlvbiBlbXB0eUZ1bmN0aW9uKCkge31cblxuLyoqXG4gKiBUcmFuc2ZlciBzdHJhdGVnaWVzIGRpY3RhdGUgaG93IHByb3BzIGFyZSB0cmFuc2ZlcnJlZCBieSBgdHJhbnNmZXJQcm9wc1RvYC5cbiAqIE5PVEU6IGlmIHlvdSBhZGQgYW55IG1vcmUgZXhjZXB0aW9ucyB0byB0aGlzIGxpc3QgeW91IHNob3VsZCBiZSBzdXJlIHRvXG4gKiB1cGRhdGUgYGNsb25lV2l0aFByb3BzKClgIGFjY29yZGluZ2x5LlxuICovXG52YXIgVHJhbnNmZXJTdHJhdGVnaWVzID0ge1xuICAvKipcbiAgICogTmV2ZXIgdHJhbnNmZXIgYGNoaWxkcmVuYC5cbiAgICovXG4gIGNoaWxkcmVuOiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogVHJhbnNmZXIgdGhlIGBjbGFzc05hbWVgIHByb3AgYnkgbWVyZ2luZyB0aGVtLlxuICAgKi9cbiAgY2xhc3NOYW1lOiBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KGpvaW5DbGFzc2VzKSxcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIHRoZSBga2V5YCBwcm9wLlxuICAgKi9cbiAga2V5OiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogTmV2ZXIgdHJhbnNmZXIgdGhlIGByZWZgIHByb3AuXG4gICAqL1xuICByZWY6IGVtcHR5RnVuY3Rpb24sXG4gIC8qKlxuICAgKiBUcmFuc2ZlciB0aGUgYHN0eWxlYCBwcm9wICh3aGljaCBpcyBhbiBvYmplY3QpIGJ5IG1lcmdpbmcgdGhlbS5cbiAgICovXG4gIHN0eWxlOiB0cmFuc2ZlclN0cmF0ZWd5TWVyZ2Vcbn07XG5cbi8qKlxuICogTXV0YXRlcyB0aGUgZmlyc3QgYXJndW1lbnQgYnkgdHJhbnNmZXJyaW5nIHRoZSBwcm9wZXJ0aWVzIGZyb20gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzXG4gKiBAcGFyYW0ge29iamVjdH0gbmV3UHJvcHNcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gdHJhbnNmZXJJbnRvKHByb3BzLCBuZXdQcm9wcykge1xuICBmb3IgKHZhciB0aGlzS2V5IGluIG5ld1Byb3BzKSB7XG4gICAgaWYgKCFuZXdQcm9wcy5oYXNPd25Qcm9wZXJ0eSh0aGlzS2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zZmVyU3RyYXRlZ3kgPSBUcmFuc2ZlclN0cmF0ZWdpZXNbdGhpc0tleV07XG5cbiAgICBpZiAodHJhbnNmZXJTdHJhdGVneSAmJiBUcmFuc2ZlclN0cmF0ZWdpZXMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIHRyYW5zZmVyU3RyYXRlZ3kocHJvcHMsIHRoaXNLZXksIG5ld1Byb3BzW3RoaXNLZXldKTtcbiAgICB9IGVsc2UgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eSh0aGlzS2V5KSkge1xuICAgICAgcHJvcHNbdGhpc0tleV0gPSBuZXdQcm9wc1t0aGlzS2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BzO1xufVxuXG4vKipcbiAqIE1lcmdlIHR3byBwcm9wcyBvYmplY3RzIHVzaW5nIFRyYW5zZmVyU3RyYXRlZ2llcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2xkUHJvcHMgb3JpZ2luYWwgcHJvcHMgKHRoZXkgdGFrZSBwcmVjZWRlbmNlKVxuICogQHBhcmFtIHtvYmplY3R9IG5ld1Byb3BzIG5ldyBwcm9wcyB0byBtZXJnZSBpblxuICogQHJldHVybiB7b2JqZWN0fSBhIG5ldyBvYmplY3QgY29udGFpbmluZyBib3RoIHNldHMgb2YgcHJvcHMgbWVyZ2VkLlxuICovXG5mdW5jdGlvbiBtZXJnZVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICByZXR1cm4gdHJhbnNmZXJJbnRvKG1lcmdlKG9sZFByb3BzKSwgbmV3UHJvcHMpO1xufVxuXG52YXIgUmVhY3RQcm9wVHJhbnNmZXJlciA9IHtcbiAgbWVyZ2VQcm9wczogbWVyZ2VQcm9wc1xufTtcblxudmFyIENISUxEUkVOX1BST1AgPSAnY2hpbGRyZW4nO1xuXG4vKipcbiAqIFNvbWV0aW1lcyB5b3Ugd2FudCB0byBjaGFuZ2UgdGhlIHByb3BzIG9mIGEgY2hpbGQgcGFzc2VkIHRvIHlvdS4gVXN1YWxseVxuICogdGhpcyBpcyB0byBhZGQgYSBDU1MgY2xhc3MuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGNoaWxkIGNoaWxkIGNvbXBvbmVudCB5b3UnZCBsaWtlIHRvIGNsb25lXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgcHJvcHMgeW91J2QgbGlrZSB0byBtb2RpZnkuIFRoZXkgd2lsbCBiZSBtZXJnZWRcbiAqIGFzIGlmIHlvdSB1c2VkIGB0cmFuc2ZlclByb3BzVG8oKWAuXG4gKiBAcmV0dXJuIHtvYmplY3R9IGEgY2xvbmUgb2YgY2hpbGQgd2l0aCBwcm9wcyBtZXJnZWQgaW4uXG4gKi9cbmZ1bmN0aW9uIGNsb25lV2l0aFByb3BzKGNoaWxkLCBwcm9wcykge1xuICB2YXIgbmV3UHJvcHMgPSBSZWFjdFByb3BUcmFuc2ZlcmVyLm1lcmdlUHJvcHMocHJvcHMsIGNoaWxkLnByb3BzKTtcblxuICAvLyBVc2UgYGNoaWxkLnByb3BzLmNoaWxkcmVuYCBpZiBpdCBpcyBwcm92aWRlZC5cbiAgaWYgKCFuZXdQcm9wcy5oYXNPd25Qcm9wZXJ0eShDSElMRFJFTl9QUk9QKSAmJlxuICAgIGNoaWxkLnByb3BzLmhhc093blByb3BlcnR5KENISUxEUkVOX1BST1ApKSB7XG4gICAgbmV3UHJvcHMuY2hpbGRyZW4gPSBjaGlsZC5wcm9wcy5jaGlsZHJlbjtcbiAgfVxuXG4gIC8vIEh1Z2UgaGFjayB0byBzdXBwb3J0IGJvdGggdGhlIDAuMTAgQVBJIGFuZCB0aGUgbmV3IHdheSBvZiBkb2luZyB0aGluZ3NcbiAgLy8gVE9ETzogcmVtb3ZlIHdoZW4gc3VwcG9ydCBmb3IgMC4xMCBpcyBubyBsb25nZXIgbmVlZGVkXG4gIGlmIChSZWFjdC52ZXJzaW9uLmluZGV4T2YoJzAuMTAuJykgPT09IDApIHtcbiAgICByZXR1cm4gY2hpbGQuY29uc3RydWN0b3IuQ29udmVuaWVuY2VDb25zdHJ1Y3RvcihuZXdQcm9wcyk7XG4gIH1cblxuXG4gIC8vIFRoZSBjdXJyZW50IEFQSSBkb2Vzbid0IHJldGFpbiBfb3duZXIgYW5kIF9jb250ZXh0LCB3aGljaCBpcyB3aHkgdGhpc1xuICAvLyBkb2Vzbid0IHVzZSBSZWFjdERlc2NyaXB0b3IuY2xvbmVBbmRSZXBsYWNlUHJvcHMuXG4gIHJldHVybiBjaGlsZC5jb25zdHJ1Y3RvcihuZXdQcm9wcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvbmVXaXRoUHJvcHM7IiwiLyoqXG4gKiBTYWZlIGNoYWluZWQgZnVuY3Rpb25cbiAqXG4gKiBXaWxsIG9ubHkgY3JlYXRlIGEgbmV3IGZ1bmN0aW9uIGlmIG5lZWRlZCxcbiAqIG90aGVyd2lzZSB3aWxsIHBhc3MgYmFjayBleGlzdGluZyBmdW5jdGlvbnMgb3IgbnVsbC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbmVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHR3b1xuICogQHJldHVybnMge2Z1bmN0aW9ufG51bGx9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNoYWluZWRGdW5jdGlvbihvbmUsIHR3bykge1xuICB2YXIgaGFzT25lID0gdHlwZW9mIG9uZSA9PT0gJ2Z1bmN0aW9uJztcbiAgdmFyIGhhc1R3byA9IHR5cGVvZiB0d28gPT09ICdmdW5jdGlvbic7XG5cbiAgaWYgKCFoYXNPbmUgJiYgIWhhc1R3bykgeyByZXR1cm4gbnVsbDsgfVxuICBpZiAoIWhhc09uZSkgeyByZXR1cm4gdHdvOyB9XG4gIGlmICghaGFzVHdvKSB7IHJldHVybiBvbmU7IH1cblxuICByZXR1cm4gZnVuY3Rpb24gY2hhaW5lZEZ1bmN0aW9uKCkge1xuICAgIG9uZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHR3by5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbjsiLCJcbi8qKlxuICogU2hvcnRjdXQgdG8gY29tcHV0ZSBlbGVtZW50IHN0eWxlXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbVxuICogQHJldHVybnMge0Nzc1N0eWxlfVxuICovXG5mdW5jdGlvbiBnZXRDb21wdXRlZFN0eWxlcyhlbGVtKSB7XG4gIHJldHVybiBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKTtcbn1cblxuLyoqXG4gKiBHZXQgZWxlbWVudHMgb2Zmc2V0XG4gKlxuICogVE9ETzogUkVNT1ZFIEpRVUVSWSFcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBET01Ob2RlXG4gKiBAcmV0dXJucyB7e3RvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXJ9fVxuICovXG5mdW5jdGlvbiBnZXRPZmZzZXQoRE9NTm9kZSkge1xuICBpZiAod2luZG93LmpRdWVyeSkge1xuICAgIHJldHVybiB3aW5kb3cualF1ZXJ5KERPTU5vZGUpLm9mZnNldCgpO1xuICB9XG5cbiAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHZhciBib3ggPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gIC8vIElmIHdlIGRvbid0IGhhdmUgZ0JDUiwganVzdCB1c2UgMCwwIHJhdGhlciB0aGFuIGVycm9yXG4gIC8vIEJsYWNrQmVycnkgNSwgaU9TIDMgKG9yaWdpbmFsIGlQaG9uZSlcbiAgaWYgKCB0eXBlb2YgRE9NTm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QgIT09ICd1bmRlZmluZWQnICkge1xuICAgIGJveCA9IERPTU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRvcDogYm94LnRvcCArIHdpbmRvdy5wYWdlWU9mZnNldCAtIGRvY0VsZW0uY2xpZW50VG9wLFxuICAgIGxlZnQ6IGJveC5sZWZ0ICsgd2luZG93LnBhZ2VYT2Zmc2V0IC0gZG9jRWxlbS5jbGllbnRMZWZ0XG4gIH07XG59XG5cbi8qKlxuICogR2V0IGVsZW1lbnRzIHBvc2l0aW9uXG4gKlxuICogVE9ETzogUkVNT1ZFIEpRVUVSWSFcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50P30gb2Zmc2V0UGFyZW50XG4gKiBAcmV0dXJucyB7e3RvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXJ9fVxuICovXG5mdW5jdGlvbiBnZXRQb3NpdGlvbihlbGVtLCBvZmZzZXRQYXJlbnQpIHtcbiAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcbiAgICByZXR1cm4gd2luZG93LmpRdWVyeShlbGVtKS5wb3NpdGlvbigpO1xuICB9XG5cbiAgdmFyIG9mZnNldCxcbiAgICAgIHBhcmVudE9mZnNldCA9IHt0b3A6IDAsIGxlZnQ6IDB9O1xuXG4gIC8vIEZpeGVkIGVsZW1lbnRzIGFyZSBvZmZzZXQgZnJvbSB3aW5kb3cgKHBhcmVudE9mZnNldCA9IHt0b3A6MCwgbGVmdDogMH0sIGJlY2F1c2UgaXQgaXMgaXRzIG9ubHkgb2Zmc2V0IHBhcmVudFxuICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkucG9zaXRpb24gPT09ICdmaXhlZCcgKSB7XG4gICAgLy8gV2UgYXNzdW1lIHRoYXQgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGF2YWlsYWJsZSB3aGVuIGNvbXB1dGVkIHBvc2l0aW9uIGlzIGZpeGVkXG4gICAgb2Zmc2V0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICB9IGVsc2Uge1xuICAgIGlmICghb2Zmc2V0UGFyZW50KSB7XG4gICAgICAvLyBHZXQgKnJlYWwqIG9mZnNldFBhcmVudFxuICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50KGVsZW0pO1xuICAgIH1cblxuICAgIC8vIEdldCBjb3JyZWN0IG9mZnNldHNcbiAgICBvZmZzZXQgPSBnZXRPZmZzZXQoZWxlbSk7XG4gICAgaWYgKCBvZmZzZXRQYXJlbnQubm9kZU5hbWUgIT09ICdIVE1MJykge1xuICAgICAgcGFyZW50T2Zmc2V0ID0gZ2V0T2Zmc2V0KG9mZnNldFBhcmVudCk7XG4gICAgfVxuXG4gICAgLy8gQWRkIG9mZnNldFBhcmVudCBib3JkZXJzXG4gICAgcGFyZW50T2Zmc2V0LnRvcCArPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhvZmZzZXRQYXJlbnQpLmJvcmRlclRvcFdpZHRoLCAxMCk7XG4gICAgcGFyZW50T2Zmc2V0LmxlZnQgKz0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5ib3JkZXJMZWZ0V2lkdGgsIDEwKTtcbiAgfVxuXG4gIC8vIFN1YnRyYWN0IHBhcmVudCBvZmZzZXRzIGFuZCBlbGVtZW50IG1hcmdpbnNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IG9mZnNldC50b3AgLSBwYXJlbnRPZmZzZXQudG9wIC0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkubWFyZ2luVG9wLCAxMCksXG4gICAgbGVmdDogb2Zmc2V0LmxlZnQgLSBwYXJlbnRPZmZzZXQubGVmdCAtIHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLm1hcmdpbkxlZnQsIDEwKVxuICB9O1xufVxuXG4vKipcbiAqIEdldCBwYXJlbnQgZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnQ/fSBlbGVtXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gKi9cbmZ1bmN0aW9uIG9mZnNldFBhcmVudChlbGVtKSB7XG4gIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcblxuICB3aGlsZSAoIG9mZnNldFBhcmVudCAmJiAoIG9mZnNldFBhcmVudC5ub2RlTmFtZSAhPT0gJ0hUTUwnICYmXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycgKSApIHtcbiAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xuICB9XG5cbiAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBkb2NFbGVtO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q29tcHV0ZWRTdHlsZXM6IGdldENvbXB1dGVkU3R5bGVzLFxuICBnZXRPZmZzZXQ6IGdldE9mZnNldCxcbiAgZ2V0UG9zaXRpb246IGdldFBvc2l0aW9uLFxuICBvZmZzZXRQYXJlbnQ6IG9mZnNldFBhcmVudFxufTsiLCIvKipcbiAqIE1lcmdlIGhlbHBlclxuICpcbiAqIFRPRE86IHRvIGJlIHJlcGxhY2VkIHdpdGggRVM2J3MgYE9iamVjdC5hc3NpZ24oKWAgZm9yIFJlYWN0IDAuMTJcbiAqL1xuXG4vKipcbiAqIFNoYWxsb3cgbWVyZ2VzIHR3byBzdHJ1Y3R1cmVzIGJ5IG11dGF0aW5nIHRoZSBmaXJzdCBwYXJhbWV0ZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9uZSBPYmplY3QgdG8gYmUgbWVyZ2VkIGludG8uXG4gKiBAcGFyYW0gez9vYmplY3R9IHR3byBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKi9cbmZ1bmN0aW9uIG1lcmdlSW50byhvbmUsIHR3bykge1xuICBpZiAodHdvICE9IG51bGwpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdHdvKSB7XG4gICAgICBpZiAoIXR3by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgb25lW2tleV0gPSB0d29ba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFsbG93IG1lcmdlcyB0d28gc3RydWN0dXJlcyBpbnRvIGEgcmV0dXJuIHZhbHVlLCB3aXRob3V0IG11dGF0aW5nIGVpdGhlci5cbiAqXG4gKiBAcGFyYW0gez9vYmplY3R9IG9uZSBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKiBAcGFyYW0gez9vYmplY3R9IHR3byBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBzaGFsbG93IGV4dGVuc2lvbiBvZiBvbmUgYnkgdHdvLlxuICovXG5mdW5jdGlvbiBtZXJnZShvbmUsIHR3bykge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIG1lcmdlSW50byhyZXN1bHQsIG9uZSk7XG4gIG1lcmdlSW50byhyZXN1bHQsIHR3byk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2U7IiwiZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJzcWxhZG1pbjpyZWFjdDpsb2dpblwiKVxuXG5SZWFjdCA9IHJlcXVpcmUgXCJyZWFjdFwiXG5SZWFjdEJvb3RzdHJhcCA9IHJlcXVpcmUgXCJyZWFjdC1ib290c3RyYXBcIlxuXG4kID0gcmVxdWlyZSBcImpxdWVyeVwiXG5cbntkaXYsIGZvcm0sIGlucHV0LCBvcHRpb259ID0gUmVhY3QuRE9NXG57SW5wdXQsIEJ1dHRvbn0gPSBSZWFjdEJvb3RzdHJhcFxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyB7XG4gIGdldEluaXRpYWxTdGF0ZTogLT5cbiAgICB7XG4gICAgICBpc0xvYWRpbmc6IGZhbHNlXG4gICAgfVxuXG4gIG9uTG9naW5DbGljazogKCkgLT5cbiAgICBAc2V0U3RhdGUgeyBpc0xvYWRpbmc6IHRydWUgfVxuICAgIG9wdGlvbnMgPSB7XG4gICAgICB1cmw6IFwiL2xvZ2luXCJcbiAgICAgIGRhdGFUeXBlOiBcImpzb25cIlxuICAgICAgdHlwZTogXCJQT1NUXCJcbiAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkge1xuICAgICAgICBcIl9jc3JmXCI6IEBwcm9wcy5fY3NyZlxuICAgICAgICBcInVzZXJuYW1lXCI6IEByZWZzLnR4dFVzZXJuYW1lLmdldFZhbHVlKClcbiAgICAgICAgXCJwYXNzd29yZFwiOiBAcmVmcy50eHRQYXNzd29yZC5nZXRWYWx1ZSgpXG4gICAgICAgIFwiaG9zdFwiOiBAcmVmcy50eHRIb3N0LmdldFZhbHVlKClcbiAgICAgICAgXCJwb3J0XCI6IEByZWZzLnR4dFBvcnQuZ2V0VmFsdWUoKVxuICAgICAgICBcImRhdGFiYXNldHlwZVwiOiBAcmVmcy5kZGxEYXRhYmFzZVR5cGUuZ2V0VmFsdWUoKVxuICAgICAgfVxuICAgICAgY29udGV4dDogQFxuICAgIH1cbiAgICAkLmFqYXgob3B0aW9ucykuZG9uZSAoKSAtPlxuICAgICAgd2luZG93LmxvY2F0aW9uID0gXCIvXCJcblxuICByZW5kZXI6ICgpIC0+XG4gICAgaXNMb2FkaW5nID0gQHN0YXRlLmlzTG9hZGluZ1xuXG4gICAgbG9naW5CdXR0b25PcHRpb25zID0ge1xuICAgICAgYnNTdHlsZTpcInByaW1hcnlcIlxuICAgICAgb25DbGljazogaWYgaXNMb2FkaW5nIHRoZW4gbnVsbCBlbHNlIEBvbkxvZ2luQ2xpY2tcbiAgICAgIGRpc2FibGVkOiBpc0xvYWRpbmdcbiAgICAgIGNsYXNzTmFtZTogXCJwdWxsLXJpZ2h0XCJcbiAgICB9XG4gICAgbG9naW5CdXR0b25UZXh0ID0gaWYgaXNMb2FkaW5nIHRoZW4gXCJQbGVhc2UgV2FpdFwiIGVsc2UgXCJMb2dpblwiXG5cbiAgICBsYWJlbENsYXNzTmFtZSA9IFwiY29sLXhzLTEyIGNvbC1zbS00XCJcbiAgICB3cmFwcGVyQ2xhc3NOYW1lID0gXCJjb2wteHMtMTIgY29sLXNtLThcIlxuXG4gICAgZGl2IHsgY2xhc3NOYW1lOiBcImNvbnRhaW5lclwiIH0sXG4gICAgICBmb3JtIHtjbGFzc05hbWU6IFwiZm9ybS1ob3Jpem9udGFsXCJ9LFxuICAgICAgICBJbnB1dCB7XG4gICAgICAgICAgdHlwZTogXCJ0ZXh0XCJcbiAgICAgICAgICBsYWJlbDogXCJVc2VybmFtZVwiXG4gICAgICAgICAgbGFiZWxDbGFzc05hbWU6IGxhYmVsQ2xhc3NOYW1lXG4gICAgICAgICAgd3JhcHBlckNsYXNzTmFtZTogd3JhcHBlckNsYXNzTmFtZVxuICAgICAgICAgIHJlZjogXCJ0eHRVc2VybmFtZVwiXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiBcInBvc3RncmVzXCJcbiAgICAgICAgfVxuICAgICAgICBJbnB1dCB7XG4gICAgICAgICAgdHlwZTogXCJwYXNzd29yZFwiXG4gICAgICAgICAgbGFiZWw6IFwiUGFzc3dvcmRcIlxuICAgICAgICAgIGxhYmVsQ2xhc3NOYW1lOiBsYWJlbENsYXNzTmFtZVxuICAgICAgICAgIHdyYXBwZXJDbGFzc05hbWU6IHdyYXBwZXJDbGFzc05hbWVcbiAgICAgICAgICByZWY6IFwidHh0UGFzc3dvcmRcIlxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogXCIxMnF3YXN6eFwiXG4gICAgICAgIH1cbiAgICAgICAgSW5wdXQge1xuICAgICAgICAgIHR5cGU6IFwidGV4dFwiXG4gICAgICAgICAgbGFiZWw6IFwiSG9zdFwiXG4gICAgICAgICAgbGFiZWxDbGFzc05hbWU6IGxhYmVsQ2xhc3NOYW1lXG4gICAgICAgICAgd3JhcHBlckNsYXNzTmFtZTogd3JhcHBlckNsYXNzTmFtZVxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTpcIjEyNy4wLjAuMVwiXG4gICAgICAgICAgcmVmOiBcInR4dEhvc3RcIlxuICAgICAgICB9XG4gICAgICAgIElucHV0IHtcbiAgICAgICAgICB0eXBlOiBcInRleHRcIlxuICAgICAgICAgIGxhYmVsOiBcIlBvcnRcIlxuICAgICAgICAgIGxhYmVsQ2xhc3NOYW1lOiBsYWJlbENsYXNzTmFtZVxuICAgICAgICAgIHdyYXBwZXJDbGFzc05hbWU6IHdyYXBwZXJDbGFzc05hbWVcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6XCI1NDMyXCJcbiAgICAgICAgICByZWY6IFwidHh0UG9ydFwiXG4gICAgICAgIH1cbiAgICAgICAgSW5wdXQge1xuICAgICAgICAgIHR5cGU6IFwic2VsZWN0XCJcbiAgICAgICAgICBsYWJlbDogXCJEYXRhYmFzZSBUeXBlXCJcbiAgICAgICAgICBsYWJlbENsYXNzTmFtZTogbGFiZWxDbGFzc05hbWVcbiAgICAgICAgICB3cmFwcGVyQ2xhc3NOYW1lOiB3cmFwcGVyQ2xhc3NOYW1lXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOlwicGdcIlxuICAgICAgICAgIHJlZjpcImRkbERhdGFiYXNlVHlwZVwiXG4gICAgICAgIH0sXG4gICAgICAgICAgb3B0aW9uIHsgdmFsdWU6XCJwZ1wiIH0sIFwiUG9zdGdyZXNxbFwiXG4gICAgICAgICAgb3B0aW9uIHsgdmFsdWU6XCJteXNxbFwiIH0sIFwiTXlTcWxcIlxuICAgICAgICAgIG9wdGlvbiB7IHZhbHVlOlwibWFyaWFzcWxcIiB9LCBcIk1hcmlhU3FsXCJcbiAgICAgICAgQnV0dG9uIGxvZ2luQnV0dG9uT3B0aW9ucywgbG9naW5CdXR0b25UZXh0XG59XG4iXX0=
