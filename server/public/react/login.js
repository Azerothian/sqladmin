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
      ref: "txtUsername",
      defaultValue: "postgres"
    }), Input({
      type: "password",
      label: "Password",
      labelClassName: "col-xs-2",
      wrapperClassName: "col-xs-10",
      ref: "txtPassword",
      defaultValue: "12qwaszx"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9kZWJ1Zy9kZWJ1Zy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FjY29yZGlvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWZmaXguanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FmZml4TWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FsZXJ0LmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9CYWRnZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQm9vdHN0cmFwTWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uR3JvdXAuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvblRvb2xiYXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Nhcm91c2VsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9DYXJvdXNlbEl0ZW0uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0NvbC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sbGFwc2FibGVNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25CdXR0b24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Ryb3Bkb3duTWVudS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25TdGF0ZU1peGluLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9GYWRlTWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0dseXBoaWNvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR3JpZC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvSW5wdXQuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0ludGVycG9sYXRlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9KdW1ib3Ryb24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0xhYmVsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9NZW51SXRlbS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTW9kYWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL01vZGFsVHJpZ2dlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTmF2LmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZJdGVtLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZiYXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL092ZXJsYXlNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheVRyaWdnZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhZ2VIZWFkZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhZ2VJdGVtLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFuZWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhbmVsR3JvdXAuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BvcG92ZXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Byb2dyZXNzQmFyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Sb3cuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1NwbGl0QnV0dG9uLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9TdWJOYXYuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYlBhbmUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmJlZEFyZWEuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmxlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Ub29sdGlwLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9XZWxsLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9jb25zdGFudHMuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL21haW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0N1c3RvbVByb3BUeXBlcy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvRXZlbnRMaXN0ZW5lci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVHJhbnNpdGlvbkV2ZW50cy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvY2xhc3NTZXQuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2Nsb25lV2l0aFByb3BzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2RvbVV0aWxzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9tZXJnZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL2NsaWVudC9yZWFjdC9sb2dpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBLElBQUEsOEVBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBQUEsQ0FBaUIsc0JBQWpCLENBQVIsQ0FBQTs7QUFBQSxLQUVBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FGUixDQUFBOztBQUFBLGNBR0EsR0FBaUIsT0FBQSxDQUFRLGlCQUFSLENBSGpCLENBQUE7O0FBQUEsQ0FLQSxHQUFJLE9BQUEsQ0FBUSxRQUFSLENBTEosQ0FBQTs7QUFBQSxPQU82QixLQUFLLENBQUMsR0FBbkMsRUFBQyxXQUFBLEdBQUQsRUFBTSxZQUFBLElBQU4sRUFBWSxhQUFBLEtBQVosRUFBbUIsY0FBQSxNQVBuQixDQUFBOztBQUFBLHVCQVFDLEtBQUQsRUFBUSx3QkFBQSxNQVJSLENBQUE7O0FBQUEsTUFTTSxDQUFDLE9BQVAsR0FBaUIsS0FBSyxDQUFDLFdBQU4sQ0FBa0I7QUFBQSxFQUNqQyxlQUFBLEVBQWlCLFNBQUEsR0FBQTtXQUNmO0FBQUEsTUFDRSxTQUFBLEVBQVcsS0FEYjtNQURlO0VBQUEsQ0FEZ0I7QUFBQSxFQU1qQyxZQUFBLEVBQWMsU0FBQSxHQUFBO0FBQ1osUUFBQSxPQUFBO0FBQUEsSUFBQSxJQUFDLENBQUEsUUFBRCxDQUFVO0FBQUEsTUFBRSxTQUFBLEVBQVcsSUFBYjtLQUFWLENBQUEsQ0FBQTtBQUFBLElBQ0EsT0FBQSxHQUFVO0FBQUEsTUFDUixHQUFBLEVBQUssUUFERztBQUFBLE1BRVIsUUFBQSxFQUFVLE1BRkY7QUFBQSxNQUdSLElBQUEsRUFBTSxNQUhFO0FBQUEsTUFJUixXQUFBLEVBQWEsa0JBSkw7QUFBQSxNQUtSLElBQUEsRUFBTSxJQUFJLENBQUMsU0FBTCxDQUFlO0FBQUEsUUFDbkIsT0FBQSxFQUFTLElBQUMsQ0FBQSxLQUFLLENBQUMsS0FERztBQUFBLFFBRW5CLFVBQUEsRUFBWSxJQUFDLENBQUEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFsQixDQUFBLENBRk87QUFBQSxRQUduQixVQUFBLEVBQVksSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBbEIsQ0FBQSxDQUhPO0FBQUEsUUFJbkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWQsQ0FBQSxDQUpXO0FBQUEsUUFLbkIsTUFBQSxFQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQWQsQ0FBQSxDQUxXO0FBQUEsUUFNbkIsY0FBQSxFQUFnQixJQUFDLENBQUEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUF0QixDQUFBLENBTkc7T0FBZixDQUxFO0FBQUEsTUFhUixPQUFBLEVBQVMsSUFiRDtLQURWLENBQUE7V0FnQkEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxPQUFQLENBQWUsQ0FBQyxJQUFoQixDQUFxQixTQUFBLEdBQUE7QUFDbkIsTUFBQSxLQUFBLENBQU0sVUFBTixFQUFrQixTQUFsQixDQUFBLENBQUE7QUFBQSxNQUNBLElBQUMsQ0FBQSxRQUFELENBQVU7QUFBQSxRQUFFLFNBQUEsRUFBVyxLQUFiO09BQVYsQ0FEQSxDQUFBO2FBRUEsTUFBTSxDQUFDLFFBQVAsR0FBa0IsSUFIQztJQUFBLENBQXJCLEVBakJZO0VBQUEsQ0FObUI7QUFBQSxFQTRCakMsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsOENBQUE7QUFBQSxJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQW5CLENBQUE7QUFBQSxJQUVBLGtCQUFBLEdBQXFCO0FBQUEsTUFDbkIsT0FBQSxFQUFRLFNBRFc7QUFBQSxNQUVuQixPQUFBLEVBQVksU0FBSCxHQUFrQixJQUFsQixHQUE0QixJQUFDLENBQUEsWUFGbkI7QUFBQSxNQUduQixRQUFBLEVBQVUsU0FIUztLQUZyQixDQUFBO0FBQUEsSUFPQSxlQUFBLEdBQXFCLFNBQUgsR0FBa0IsYUFBbEIsR0FBcUMsT0FQdkQsQ0FBQTtXQVNBLEdBQUEsQ0FBSTtBQUFBLE1BQUUsU0FBQSxFQUFXLFdBQWI7S0FBSixFQUNFLElBQUEsQ0FBSztBQUFBLE1BQUMsU0FBQSxFQUFXLGlCQUFaO0tBQUwsRUFDRSxLQUFBLENBQU07QUFBQSxNQUFFLElBQUEsRUFBTSxNQUFSO0FBQUEsTUFBZ0IsS0FBQSxFQUFPLFVBQXZCO0FBQUEsTUFBbUMsY0FBQSxFQUFlLFVBQWxEO0FBQUEsTUFBOEQsZ0JBQUEsRUFBa0IsV0FBaEY7QUFBQSxNQUE2RixHQUFBLEVBQUssYUFBbEc7QUFBQSxNQUFpSCxZQUFBLEVBQWMsVUFBL0g7S0FBTixDQURGLEVBRUUsS0FBQSxDQUFNO0FBQUEsTUFBRSxJQUFBLEVBQU0sVUFBUjtBQUFBLE1BQW9CLEtBQUEsRUFBTyxVQUEzQjtBQUFBLE1BQXVDLGNBQUEsRUFBZSxVQUF0RDtBQUFBLE1BQWtFLGdCQUFBLEVBQWtCLFdBQXBGO0FBQUEsTUFBaUcsR0FBQSxFQUFLLGFBQXRHO0FBQUEsTUFBcUgsWUFBQSxFQUFjLFVBQW5JO0tBQU4sQ0FGRixFQUdFLEtBQUEsQ0FBTTtBQUFBLE1BQUUsSUFBQSxFQUFNLE1BQVI7QUFBQSxNQUFnQixLQUFBLEVBQU8sTUFBdkI7QUFBQSxNQUErQixjQUFBLEVBQWUsVUFBOUM7QUFBQSxNQUEwRCxnQkFBQSxFQUFrQixXQUE1RTtBQUFBLE1BQXlGLFlBQUEsRUFBYSxXQUF0RztBQUFBLE1BQW1ILEdBQUEsRUFBSyxTQUF4SDtLQUFOLENBSEYsRUFJRSxLQUFBLENBQU07QUFBQSxNQUFFLElBQUEsRUFBTSxNQUFSO0FBQUEsTUFBZ0IsS0FBQSxFQUFPLE1BQXZCO0FBQUEsTUFBK0IsY0FBQSxFQUFlLFVBQTlDO0FBQUEsTUFBMEQsZ0JBQUEsRUFBa0IsV0FBNUU7QUFBQSxNQUF5RixZQUFBLEVBQWEsTUFBdEc7QUFBQSxNQUE4RyxHQUFBLEVBQUssU0FBbkg7S0FBTixDQUpGLEVBS0UsS0FBQSxDQUFNO0FBQUEsTUFBRSxJQUFBLEVBQU0sUUFBUjtBQUFBLE1BQWtCLEtBQUEsRUFBTyxlQUF6QjtBQUFBLE1BQTBDLGNBQUEsRUFBZSxVQUF6RDtBQUFBLE1BQXFFLGdCQUFBLEVBQWtCLFdBQXZGO0FBQUEsTUFBb0csWUFBQSxFQUFhLElBQWpIO0FBQUEsTUFBdUgsR0FBQSxFQUFJLGlCQUEzSDtLQUFOLEVBQ0UsTUFBQSxDQUFPO0FBQUEsTUFBRSxLQUFBLEVBQU0sSUFBUjtLQUFQLEVBQXVCLFlBQXZCLENBREYsRUFFRSxNQUFBLENBQU87QUFBQSxNQUFFLEtBQUEsRUFBTSxPQUFSO0tBQVAsRUFBMEIsT0FBMUIsQ0FGRixFQUdFLE1BQUEsQ0FBTztBQUFBLE1BQUUsS0FBQSxFQUFNLFVBQVI7S0FBUCxFQUE2QixVQUE3QixDQUhGLENBTEYsRUFTRSxNQUFBLENBQU8sa0JBQVAsRUFBMkIsZUFBM0IsQ0FURixDQURGLEVBVk07RUFBQSxDQTVCeUI7Q0FBbEIsQ0FUakIsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgd2ViIGJyb3dzZXIgaW1wbGVtZW50YXRpb24gb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2RlYnVnJyk7XG5leHBvcnRzLmxvZyA9IGxvZztcbmV4cG9ydHMuZm9ybWF0QXJncyA9IGZvcm1hdEFyZ3M7XG5leHBvcnRzLnNhdmUgPSBzYXZlO1xuZXhwb3J0cy5sb2FkID0gbG9hZDtcbmV4cG9ydHMudXNlQ29sb3JzID0gdXNlQ29sb3JzO1xuXG4vKipcbiAqIENvbG9ycy5cbiAqL1xuXG5leHBvcnRzLmNvbG9ycyA9IFtcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxuICAnZm9yZXN0Z3JlZW4nLFxuICAnZ29sZGVucm9kJyxcbiAgJ2RvZGdlcmJsdWUnLFxuICAnZGFya29yY2hpZCcsXG4gICdjcmltc29uJ1xuXTtcblxuLyoqXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxuICogYW5kIHRoZSBGaXJlYnVnIGV4dGVuc2lvbiAoYW55IEZpcmVmb3ggdmVyc2lvbikgYXJlIGtub3duXG4gKiB0byBzdXBwb3J0IFwiJWNcIiBDU1MgY3VzdG9taXphdGlvbnMuXG4gKlxuICogVE9ETzogYWRkIGEgYGxvY2FsU3RvcmFnZWAgdmFyaWFibGUgdG8gZXhwbGljaXRseSBlbmFibGUvZGlzYWJsZSBjb2xvcnNcbiAqL1xuXG5mdW5jdGlvbiB1c2VDb2xvcnMoKSB7XG4gIC8vIGlzIHdlYmtpdD8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTY0NTk2MDYvMzc2NzczXG4gIHJldHVybiAoJ1dlYmtpdEFwcGVhcmFuY2UnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSkgfHxcbiAgICAvLyBpcyBmaXJlYnVnPyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zOTgxMjAvMzc2NzczXG4gICAgKHdpbmRvdy5jb25zb2xlICYmIChjb25zb2xlLmZpcmVidWcgfHwgKGNvbnNvbGUuZXhjZXB0aW9uICYmIGNvbnNvbGUudGFibGUpKSkgfHxcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1Rvb2xzL1dlYl9Db25zb2xlI1N0eWxpbmdfbWVzc2FnZXNcbiAgICAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9maXJlZm94XFwvKFxcZCspLykgJiYgcGFyc2VJbnQoUmVnRXhwLiQxLCAxMCkgPj0gMzEpO1xufVxuXG4vKipcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHYpO1xufTtcblxuXG4vKipcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGZvcm1hdEFyZ3MoKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgdXNlQ29sb3JzID0gdGhpcy51c2VDb2xvcnM7XG5cbiAgYXJnc1swXSA9ICh1c2VDb2xvcnMgPyAnJWMnIDogJycpXG4gICAgKyB0aGlzLm5hbWVzcGFjZVxuICAgICsgKHVzZUNvbG9ycyA/ICcgJWMnIDogJyAnKVxuICAgICsgYXJnc1swXVxuICAgICsgKHVzZUNvbG9ycyA/ICclYyAnIDogJyAnKVxuICAgICsgJysnICsgZXhwb3J0cy5odW1hbml6ZSh0aGlzLmRpZmYpO1xuXG4gIGlmICghdXNlQ29sb3JzKSByZXR1cm4gYXJncztcblxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XG4gIGFyZ3MgPSBbYXJnc1swXSwgYywgJ2NvbG9yOiBpbmhlcml0J10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDEpKTtcblxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxuICAvLyBhcmd1bWVudHMgcGFzc2VkIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhlICVjLCBzbyB3ZSBuZWVkIHRvXG4gIC8vIGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgaW5kZXggdG8gaW5zZXJ0IHRoZSBDU1MgaW50b1xuICB2YXIgaW5kZXggPSAwO1xuICB2YXIgbGFzdEMgPSAwO1xuICBhcmdzWzBdLnJlcGxhY2UoLyVbYS16JV0vZywgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICBpZiAoJyUlJyA9PT0gbWF0Y2gpIHJldHVybjtcbiAgICBpbmRleCsrO1xuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xuICAgICAgLy8gd2Ugb25seSBhcmUgaW50ZXJlc3RlZCBpbiB0aGUgKmxhc3QqICVjXG4gICAgICAvLyAodGhlIHVzZXIgbWF5IGhhdmUgcHJvdmlkZWQgdGhlaXIgb3duKVxuICAgICAgbGFzdEMgPSBpbmRleDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyZ3Muc3BsaWNlKGxhc3RDLCAwLCBjKTtcbiAgcmV0dXJuIGFyZ3M7XG59XG5cbi8qKlxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXG4gKiBOby1vcCB3aGVuIGBjb25zb2xlLmxvZ2AgaXMgbm90IGEgXCJmdW5jdGlvblwiLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gbG9nKCkge1xuICAvLyBUaGlzIGhhY2tlcnkgaXMgcmVxdWlyZWQgZm9yIElFOCxcbiAgLy8gd2hlcmUgdGhlIGBjb25zb2xlLmxvZ2AgZnVuY3Rpb24gZG9lc24ndCBoYXZlICdhcHBseSdcbiAgcmV0dXJuICdvYmplY3QnID09IHR5cGVvZiBjb25zb2xlXG4gICAgJiYgJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgY29uc29sZS5sb2dcbiAgICAmJiBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHkuY2FsbChjb25zb2xlLmxvZywgY29uc29sZSwgYXJndW1lbnRzKTtcbn1cblxuLyoqXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XG4gIHRyeSB7XG4gICAgaWYgKG51bGwgPT0gbmFtZXNwYWNlcykge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5kZWJ1ZyA9IG5hbWVzcGFjZXM7XG4gICAgfVxuICB9IGNhdGNoKGUpIHt9XG59XG5cbi8qKlxuICogTG9hZCBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSByZXR1cm5zIHRoZSBwcmV2aW91c2x5IHBlcnNpc3RlZCBkZWJ1ZyBtb2Rlc1xuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9hZCgpIHtcbiAgdmFyIHI7XG4gIHRyeSB7XG4gICAgciA9IGxvY2FsU3RvcmFnZS5kZWJ1ZztcbiAgfSBjYXRjaChlKSB7fVxuICByZXR1cm4gcjtcbn1cblxuLyoqXG4gKiBFbmFibGUgbmFtZXNwYWNlcyBsaXN0ZWQgaW4gYGxvY2FsU3RvcmFnZS5kZWJ1Z2AgaW5pdGlhbGx5LlxuICovXG5cbmV4cG9ydHMuZW5hYmxlKGxvYWQoKSk7XG4iLCJcbi8qKlxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxuICogaW1wbGVtZW50YXRpb25zIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZGVidWc7XG5leHBvcnRzLmNvZXJjZSA9IGNvZXJjZTtcbmV4cG9ydHMuZGlzYWJsZSA9IGRpc2FibGU7XG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcbmV4cG9ydHMuZW5hYmxlZCA9IGVuYWJsZWQ7XG5leHBvcnRzLmh1bWFuaXplID0gcmVxdWlyZSgnbXMnKTtcblxuLyoqXG4gKiBUaGUgY3VycmVudGx5IGFjdGl2ZSBkZWJ1ZyBtb2RlIG5hbWVzLCBhbmQgbmFtZXMgdG8gc2tpcC5cbiAqL1xuXG5leHBvcnRzLm5hbWVzID0gW107XG5leHBvcnRzLnNraXBzID0gW107XG5cbi8qKlxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxuICpcbiAqIFZhbGlkIGtleSBuYW1lcyBhcmUgYSBzaW5nbGUsIGxvd2VyY2FzZWQgbGV0dGVyLCBpLmUuIFwiblwiLlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycyA9IHt9O1xuXG4vKipcbiAqIFByZXZpb3VzbHkgYXNzaWduZWQgY29sb3IuXG4gKi9cblxudmFyIHByZXZDb2xvciA9IDA7XG5cbi8qKlxuICogUHJldmlvdXMgbG9nIHRpbWVzdGFtcC5cbiAqL1xuXG52YXIgcHJldlRpbWU7XG5cbi8qKlxuICogU2VsZWN0IGEgY29sb3IuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VsZWN0Q29sb3IoKSB7XG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1twcmV2Q29sb3IrKyAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVzcGFjZWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRlYnVnKG5hbWVzcGFjZSkge1xuXG4gIC8vIGRlZmluZSB0aGUgYGRpc2FibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGRpc2FibGVkKCkge1xuICB9XG4gIGRpc2FibGVkLmVuYWJsZWQgPSBmYWxzZTtcblxuICAvLyBkZWZpbmUgdGhlIGBlbmFibGVkYCB2ZXJzaW9uXG4gIGZ1bmN0aW9uIGVuYWJsZWQoKSB7XG5cbiAgICB2YXIgc2VsZiA9IGVuYWJsZWQ7XG5cbiAgICAvLyBzZXQgYGRpZmZgIHRpbWVzdGFtcFxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XG4gICAgdmFyIG1zID0gY3VyciAtIChwcmV2VGltZSB8fCBjdXJyKTtcbiAgICBzZWxmLmRpZmYgPSBtcztcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcbiAgICBzZWxmLmN1cnIgPSBjdXJyO1xuICAgIHByZXZUaW1lID0gY3VycjtcblxuICAgIC8vIGFkZCB0aGUgYGNvbG9yYCBpZiBub3Qgc2V0XG4gICAgaWYgKG51bGwgPT0gc2VsZi51c2VDb2xvcnMpIHNlbGYudXNlQ29sb3JzID0gZXhwb3J0cy51c2VDb2xvcnMoKTtcbiAgICBpZiAobnVsbCA9PSBzZWxmLmNvbG9yICYmIHNlbGYudXNlQ29sb3JzKSBzZWxmLmNvbG9yID0gc2VsZWN0Q29sb3IoKTtcblxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcblxuICAgIGFyZ3NbMF0gPSBleHBvcnRzLmNvZXJjZShhcmdzWzBdKTtcblxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcbiAgICAgIC8vIGFueXRoaW5nIGVsc2UgbGV0J3MgaW5zcGVjdCB3aXRoICVvXG4gICAgICBhcmdzID0gWyclbyddLmNvbmNhdChhcmdzKTtcbiAgICB9XG5cbiAgICAvLyBhcHBseSBhbnkgYGZvcm1hdHRlcnNgIHRyYW5zZm9ybWF0aW9uc1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgYXJnc1swXSA9IGFyZ3NbMF0ucmVwbGFjZSgvJShbYS16JV0pL2csIGZ1bmN0aW9uKG1hdGNoLCBmb3JtYXQpIHtcbiAgICAgIC8vIGlmIHdlIGVuY291bnRlciBhbiBlc2NhcGVkICUgdGhlbiBkb24ndCBpbmNyZWFzZSB0aGUgYXJyYXkgaW5kZXhcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUlJykgcmV0dXJuIG1hdGNoO1xuICAgICAgaW5kZXgrKztcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcbiAgICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm9ybWF0dGVyKSB7XG4gICAgICAgIHZhciB2YWwgPSBhcmdzW2luZGV4XTtcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xuXG4gICAgICAgIC8vIG5vdyB3ZSBuZWVkIHRvIHJlbW92ZSBgYXJnc1tpbmRleF1gIHNpbmNlIGl0J3MgaW5saW5lZCBpbiB0aGUgYGZvcm1hdGBcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpbmRleC0tO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuXG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBleHBvcnRzLmZvcm1hdEFyZ3MpIHtcbiAgICAgIGFyZ3MgPSBleHBvcnRzLmZvcm1hdEFyZ3MuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgfVxuICAgIHZhciBsb2dGbiA9IGVuYWJsZWQubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XG4gICAgbG9nRm4uYXBwbHkoc2VsZiwgYXJncyk7XG4gIH1cbiAgZW5hYmxlZC5lbmFibGVkID0gdHJ1ZTtcblxuICB2YXIgZm4gPSBleHBvcnRzLmVuYWJsZWQobmFtZXNwYWNlKSA/IGVuYWJsZWQgOiBkaXNhYmxlZDtcblxuICBmbi5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG5cbiAgcmV0dXJuIGZuO1xufVxuXG4vKipcbiAqIEVuYWJsZXMgYSBkZWJ1ZyBtb2RlIGJ5IG5hbWVzcGFjZXMuIFRoaXMgY2FuIGluY2x1ZGUgbW9kZXNcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlKG5hbWVzcGFjZXMpIHtcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xuXG4gIHZhciBzcGxpdCA9IChuYW1lc3BhY2VzIHx8ICcnKS5zcGxpdCgvW1xccyxdKy8pO1xuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcbiAgICBuYW1lc3BhY2VzID0gc3BsaXRbaV0ucmVwbGFjZSgvXFwqL2csICcuKj8nKTtcbiAgICBpZiAobmFtZXNwYWNlc1swXSA9PT0gJy0nKSB7XG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBvcnRzLm5hbWVzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzICsgJyQnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGlzYWJsZSBkZWJ1ZyBvdXRwdXQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkaXNhYmxlKCkge1xuICBleHBvcnRzLmVuYWJsZSgnJyk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGVkKG5hbWUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLnNraXBzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ29lcmNlIGB2YWxgLlxuICpcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbFxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XG4gIGlmICh2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIHZhbC5zdGFjayB8fCB2YWwubWVzc2FnZTtcbiAgcmV0dXJuIHZhbDtcbn1cbiIsIi8qKlxuICogSGVscGVycy5cbiAqL1xuXG52YXIgcyA9IDEwMDA7XG52YXIgbSA9IHMgKiA2MDtcbnZhciBoID0gbSAqIDYwO1xudmFyIGQgPSBoICogMjQ7XG52YXIgeSA9IGQgKiAzNjUuMjU7XG5cbi8qKlxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cbiAqXG4gKiBPcHRpb25zOlxuICpcbiAqICAtIGBsb25nYCB2ZXJib3NlIGZvcm1hdHRpbmcgW2ZhbHNlXVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7U3RyaW5nfE51bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpe1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB2YWwpIHJldHVybiBwYXJzZSh2YWwpO1xuICByZXR1cm4gb3B0aW9ucy5sb25nXG4gICAgPyBsb25nKHZhbClcbiAgICA6IHNob3J0KHZhbCk7XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgdmFyIG1hdGNoID0gL14oKD86XFxkKyk/XFwuP1xcZCspICoobXN8c2Vjb25kcz98c3xtaW51dGVzP3xtfGhvdXJzP3xofGRheXM/fGR8eWVhcnM/fHkpPyQvaS5leGVjKHN0cik7XG4gIGlmICghbWF0Y2gpIHJldHVybjtcbiAgdmFyIG4gPSBwYXJzZUZsb2F0KG1hdGNoWzFdKTtcbiAgdmFyIHR5cGUgPSAobWF0Y2hbMl0gfHwgJ21zJykudG9Mb3dlckNhc2UoKTtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSAneWVhcnMnOlxuICAgIGNhc2UgJ3llYXInOlxuICAgIGNhc2UgJ3knOlxuICAgICAgcmV0dXJuIG4gKiB5O1xuICAgIGNhc2UgJ2RheXMnOlxuICAgIGNhc2UgJ2RheSc6XG4gICAgY2FzZSAnZCc6XG4gICAgICByZXR1cm4gbiAqIGQ7XG4gICAgY2FzZSAnaG91cnMnOlxuICAgIGNhc2UgJ2hvdXInOlxuICAgIGNhc2UgJ2gnOlxuICAgICAgcmV0dXJuIG4gKiBoO1xuICAgIGNhc2UgJ21pbnV0ZXMnOlxuICAgIGNhc2UgJ21pbnV0ZSc6XG4gICAgY2FzZSAnbSc6XG4gICAgICByZXR1cm4gbiAqIG07XG4gICAgY2FzZSAnc2Vjb25kcyc6XG4gICAgY2FzZSAnc2Vjb25kJzpcbiAgICBjYXNlICdzJzpcbiAgICAgIHJldHVybiBuICogcztcbiAgICBjYXNlICdtcyc6XG4gICAgICByZXR1cm4gbjtcbiAgfVxufVxuXG4vKipcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNob3J0KG1zKSB7XG4gIGlmIChtcyA+PSBkKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGQpICsgJ2QnO1xuICBpZiAobXMgPj0gaCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcbiAgaWYgKG1zID49IG0pIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gbSkgKyAnbSc7XG4gIGlmIChtcyA+PSBzKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIHMpICsgJ3MnO1xuICByZXR1cm4gbXMgKyAnbXMnO1xufVxuXG4vKipcbiAqIExvbmcgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbG9uZyhtcykge1xuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JylcbiAgICB8fCBwbHVyYWwobXMsIGgsICdob3VyJylcbiAgICB8fCBwbHVyYWwobXMsIG0sICdtaW51dGUnKVxuICAgIHx8IHBsdXJhbChtcywgcywgJ3NlY29uZCcpXG4gICAgfHwgbXMgKyAnIG1zJztcbn1cblxuLyoqXG4gKiBQbHVyYWxpemF0aW9uIGhlbHBlci5cbiAqL1xuXG5mdW5jdGlvbiBwbHVyYWwobXMsIG4sIG5hbWUpIHtcbiAgaWYgKG1zIDwgbikgcmV0dXJuO1xuICBpZiAobXMgPCBuICogMS41KSByZXR1cm4gTWF0aC5mbG9vcihtcyAvIG4pICsgJyAnICsgbmFtZTtcbiAgcmV0dXJuIE1hdGguY2VpbChtcyAvIG4pICsgJyAnICsgbmFtZSArICdzJztcbn1cbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBQYW5lbEdyb3VwID0gcmVxdWlyZSgnLi9QYW5lbEdyb3VwJyk7XG5cbnZhciBBY2NvcmRpb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBY2NvcmRpb24nLFxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBQYW5lbEdyb3VwKCB7YWNjb3JkaW9uOnRydWV9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFjY29yZGlvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQWZmaXhNaXhpbiA9IHJlcXVpcmUoJy4vQWZmaXhNaXhpbicpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xuXG52YXIgQWZmaXggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBZmZpeCcsXG4gIHN0YXRpY3M6IHtcbiAgICBkb21VdGlsczogZG9tVXRpbHNcbiAgfSxcblxuICBtaXhpbnM6IFtBZmZpeE1peGluXSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaG9sZGVyU3R5bGUgPSB7dG9wOiB0aGlzLnN0YXRlLmFmZml4UG9zaXRpb25Ub3B9O1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6dGhpcy5zdGF0ZS5hZmZpeENsYXNzLCBzdHlsZTpob2xkZXJTdHlsZX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWZmaXg7IiwiLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQgKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG52YXIgRXZlbnRMaXN0ZW5lciA9IHJlcXVpcmUoJy4vdXRpbHMvRXZlbnRMaXN0ZW5lcicpO1xuXG52YXIgQWZmaXhNaXhpbiA9IHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgb2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG9mZnNldFRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBvZmZzZXRCb3R0b206IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWZmaXhDbGFzczogJ2FmZml4LXRvcCdcbiAgICB9O1xuICB9LFxuXG4gIGdldFBpbm5lZE9mZnNldDogZnVuY3Rpb24gKERPTU5vZGUpIHtcbiAgICBpZiAodGhpcy5waW5uZWRPZmZzZXQpIHtcbiAgICAgIHJldHVybiB0aGlzLnBpbm5lZE9mZnNldDtcbiAgICB9XG5cbiAgICBET01Ob2RlLmNsYXNzTmFtZSA9IERPTU5vZGUuY2xhc3NOYW1lLnJlcGxhY2UoL2FmZml4LXRvcHxhZmZpeC1ib3R0b218YWZmaXgvLCAnJyk7XG4gICAgRE9NTm9kZS5jbGFzc05hbWUgKz0gRE9NTm9kZS5jbGFzc05hbWUubGVuZ3RoID8gJyBhZmZpeCcgOiAnYWZmaXgnO1xuXG4gICAgdGhpcy5waW5uZWRPZmZzZXQgPSBkb21VdGlscy5nZXRPZmZzZXQoRE9NTm9kZSkudG9wIC0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuXG4gICAgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0O1xuICB9LFxuXG4gIGNoZWNrUG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgRE9NTm9kZSwgc2Nyb2xsSGVpZ2h0LCBzY3JvbGxUb3AsIHBvc2l0aW9uLCBvZmZzZXRUb3AsIG9mZnNldEJvdHRvbSxcbiAgICAgICAgYWZmaXgsIGFmZml4VHlwZSwgYWZmaXhQb3NpdGlvblRvcDtcblxuICAgIC8vIFRPRE86IG9yIG5vdCB2aXNpYmxlXG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgRE9NTm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpO1xuICAgIHNjcm9sbEhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgc2Nyb2xsVG9wID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgIHBvc2l0aW9uID0gZG9tVXRpbHMuZ2V0T2Zmc2V0KERPTU5vZGUpO1xuICAgIG9mZnNldFRvcDtcbiAgICBvZmZzZXRCb3R0b207XG5cbiAgICBpZiAodGhpcy5hZmZpeGVkID09PSAndG9wJykge1xuICAgICAgcG9zaXRpb24udG9wICs9IHNjcm9sbFRvcDtcbiAgICB9XG5cbiAgICBvZmZzZXRUb3AgPSB0aGlzLnByb3BzLm9mZnNldFRvcCAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMub2Zmc2V0VG9wIDogdGhpcy5wcm9wcy5vZmZzZXQ7XG4gICAgb2Zmc2V0Qm90dG9tID0gdGhpcy5wcm9wcy5vZmZzZXRCb3R0b20gIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLm9mZnNldEJvdHRvbSA6IHRoaXMucHJvcHMub2Zmc2V0O1xuXG4gICAgaWYgKG9mZnNldFRvcCA9PSBudWxsICYmIG9mZnNldEJvdHRvbSA9PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChvZmZzZXRUb3AgPT0gbnVsbCkge1xuICAgICAgb2Zmc2V0VG9wID0gMDtcbiAgICB9XG4gICAgaWYgKG9mZnNldEJvdHRvbSA9PSBudWxsKSB7XG4gICAgICBvZmZzZXRCb3R0b20gPSAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnVucGluICE9IG51bGwgJiYgKHNjcm9sbFRvcCArIHRoaXMudW5waW4gPD0gcG9zaXRpb24udG9wKSkge1xuICAgICAgYWZmaXggPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKG9mZnNldEJvdHRvbSAhPSBudWxsICYmIChwb3NpdGlvbi50b3AgKyBET01Ob2RlLm9mZnNldEhlaWdodCA+PSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20pKSB7XG4gICAgICBhZmZpeCA9ICdib3R0b20nO1xuICAgIH0gZWxzZSBpZiAob2Zmc2V0VG9wICE9IG51bGwgJiYgKHNjcm9sbFRvcCA8PSBvZmZzZXRUb3ApKSB7XG4gICAgICBhZmZpeCA9ICd0b3AnO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZmZpeCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT09IGFmZml4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCkge1xuICAgICAgRE9NTm9kZS5zdHlsZS50b3AgPSAnJztcbiAgICB9XG5cbiAgICBhZmZpeFR5cGUgPSAnYWZmaXgnICsgKGFmZml4ID8gJy0nICsgYWZmaXggOiAnJyk7XG5cbiAgICB0aGlzLmFmZml4ZWQgPSBhZmZpeDtcbiAgICB0aGlzLnVucGluID0gYWZmaXggPT09ICdib3R0b20nID9cbiAgICAgIHRoaXMuZ2V0UGlubmVkT2Zmc2V0KERPTU5vZGUpIDogbnVsbDtcblxuICAgIGlmIChhZmZpeCA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIERPTU5vZGUuY2xhc3NOYW1lID0gRE9NTm9kZS5jbGFzc05hbWUucmVwbGFjZSgvYWZmaXgtdG9wfGFmZml4LWJvdHRvbXxhZmZpeC8sICdhZmZpeC10b3AnKTtcbiAgICAgIGFmZml4UG9zaXRpb25Ub3AgPSBzY3JvbGxIZWlnaHQgLSBvZmZzZXRCb3R0b20gLSBET01Ob2RlLm9mZnNldEhlaWdodCAtIGRvbVV0aWxzLmdldE9mZnNldChET01Ob2RlKS50b3A7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhZmZpeENsYXNzOiBhZmZpeFR5cGUsXG4gICAgICBhZmZpeFBvc2l0aW9uVG9wOiBhZmZpeFBvc2l0aW9uVG9wXG4gICAgfSk7XG4gIH0sXG5cbiAgY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3A6IGZ1bmN0aW9uICgpIHtcbiAgICBzZXRUaW1lb3V0KHRoaXMuY2hlY2tQb3NpdGlvbiwgMCk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbldpbmRvd1Njcm9sbExpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKHdpbmRvdywgJ3Njcm9sbCcsIHRoaXMuY2hlY2tQb3NpdGlvbik7XG4gICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdjbGljaycsIHRoaXMuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3ApO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX29uV2luZG93U2Nyb2xsTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uV2luZG93U2Nyb2xsTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICBpZiAocHJldlN0YXRlLmFmZml4Q2xhc3MgPT09IHRoaXMuc3RhdGUuYWZmaXhDbGFzcykge1xuICAgICAgdGhpcy5jaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCgpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZmZpeE1peGluOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgQWxlcnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdBbGVydCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvbkRpc21pc3M6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGRpc21pc3NBZnRlcjogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYWxlcnQnLFxuICAgICAgYnNTdHlsZTogJ2luZm8nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXJEaXNtaXNzQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5idXR0b24oXG4gICAgICAgIHt0eXBlOlwiYnV0dG9uXCIsXG4gICAgICAgIGNsYXNzTmFtZTpcImNsb3NlXCIsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5wcm9wcy5vbkRpc21pc3MsXG4gICAgICAgICdhcmlhLWhpZGRlbic6XCJ0cnVlXCJ9LCBcbiAgICAgICAgXCIgw5cgXCJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgdmFyIGlzRGlzbWlzc2FibGUgPSAhIXRoaXMucHJvcHMub25EaXNtaXNzO1xuXG4gICAgY2xhc3Nlc1snYWxlcnQtZGlzbWlzc2FibGUnXSA9IGlzRGlzbWlzc2FibGU7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGlzRGlzbWlzc2FibGUgPyB0aGlzLnJlbmRlckRpc21pc3NCdXR0b24oKSA6IG51bGwsXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5kaXNtaXNzQWZ0ZXIgJiYgdGhpcy5wcm9wcy5vbkRpc21pc3MpIHtcbiAgICAgIHRoaXMuZGlzbWlzc1RpbWVyID0gc2V0VGltZW91dCh0aGlzLnByb3BzLm9uRGlzbWlzcywgdGhpcy5wcm9wcy5kaXNtaXNzQWZ0ZXIpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGlzbWlzc1RpbWVyKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWxlcnQ7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIEJhZGdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQmFkZ2UnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ3B1bGwtcmlnaHQnOiB0aGlzLnByb3BzLnB1bGxSaWdodCxcbiAgICAgICdiYWRnZSc6IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uaGFzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5jaGlsZHJlbilcbiAgICB9O1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWRnZTtcbiIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5cbnZhciBCb290c3RyYXBNaXhpbiA9IHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgYnNDbGFzczogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKE9iamVjdC5rZXlzKGNvbnN0YW50cy5DTEFTU0VTKSksXG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKE9iamVjdC5rZXlzKGNvbnN0YW50cy5TVFlMRVMpKSxcbiAgICBic1NpemU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihPYmplY3Qua2V5cyhjb25zdGFudHMuU0laRVMpKVxuICB9LFxuXG4gIGdldEJzQ2xhc3NTZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuXG4gICAgdmFyIGJzQ2xhc3MgPSB0aGlzLnByb3BzLmJzQ2xhc3MgJiYgY29uc3RhbnRzLkNMQVNTRVNbdGhpcy5wcm9wcy5ic0NsYXNzXTtcbiAgICBpZiAoYnNDbGFzcykge1xuICAgICAgY2xhc3Nlc1tic0NsYXNzXSA9IHRydWU7XG5cbiAgICAgIHZhciBwcmVmaXggPSBic0NsYXNzICsgJy0nO1xuXG4gICAgICB2YXIgYnNTaXplID0gdGhpcy5wcm9wcy5ic1NpemUgJiYgY29uc3RhbnRzLlNJWkVTW3RoaXMucHJvcHMuYnNTaXplXTtcbiAgICAgIGlmIChic1NpemUpIHtcbiAgICAgICAgY2xhc3Nlc1twcmVmaXggKyBic1NpemVdID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGJzU3R5bGUgPSB0aGlzLnByb3BzLmJzU3R5bGUgJiYgY29uc3RhbnRzLlNUWUxFU1t0aGlzLnByb3BzLmJzU3R5bGVdO1xuICAgICAgaWYgKHRoaXMucHJvcHMuYnNTdHlsZSkge1xuICAgICAgICBjbGFzc2VzW3ByZWZpeCArIGJzU3R5bGVdID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCb290c3RyYXBNaXhpbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCdXR0b24nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgYWN0aXZlOiAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBibG9jazogICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmF2SXRlbTogICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmF2RHJvcGRvd246IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdidXR0b24nLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnLFxuICAgICAgdHlwZTogJ2J1dHRvbidcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5uYXZEcm9wZG93biA/IHt9IDogdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgdmFyIHJlbmRlckZ1bmNOYW1lO1xuXG4gICAgY2xhc3Nlc1snYWN0aXZlJ10gPSB0aGlzLnByb3BzLmFjdGl2ZTtcbiAgICBjbGFzc2VzWydidG4tYmxvY2snXSA9IHRoaXMucHJvcHMuYmxvY2s7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5uYXZJdGVtKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJOYXZJdGVtKGNsYXNzZXMpO1xuICAgIH1cblxuICAgIHJlbmRlckZ1bmNOYW1lID0gdGhpcy5wcm9wcy5ocmVmIHx8IHRoaXMucHJvcHMubmF2RHJvcGRvd24gP1xuICAgICAgJ3JlbmRlckFuY2hvcicgOiAncmVuZGVyQnV0dG9uJztcblxuICAgIHJldHVybiB0aGlzW3JlbmRlckZ1bmNOYW1lXShjbGFzc2VzKTtcbiAgfSxcblxuICByZW5kZXJBbmNob3I6IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG4gICAgdmFyIGhyZWYgPSB0aGlzLnByb3BzLmhyZWYgfHwgJyMnO1xuICAgIGNsYXNzZXNbJ2Rpc2FibGVkJ10gPSB0aGlzLnByb3BzLmRpc2FibGVkO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgIHtocmVmOmhyZWYsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSxcbiAgICAgICAgcm9sZTpcImJ1dHRvblwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckJ1dHRvbjogZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uYnV0dG9uKFxuICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG4gICAgdmFyIGxpQ2xhc3NlcyA9IHtcbiAgICAgIGFjdGl2ZTogdGhpcy5wcm9wcy5hY3RpdmVcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChsaUNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucmVuZGVyQW5jaG9yKGNsYXNzZXMpXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xuXG52YXIgQnV0dG9uR3JvdXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCdXR0b25Hcm91cCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICB2ZXJ0aWNhbDogIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGp1c3RpZmllZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2J1dHRvbi1ncm91cCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgY2xhc3Nlc1snYnRuLWdyb3VwJ10gPSAhdGhpcy5wcm9wcy52ZXJ0aWNhbDtcbiAgICBjbGFzc2VzWydidG4tZ3JvdXAtdmVydGljYWwnXSA9IHRoaXMucHJvcHMudmVydGljYWw7XG4gICAgY2xhc3Nlc1snYnRuLWdyb3VwLWp1c3RpZmllZCddID0gdGhpcy5wcm9wcy5qdXN0aWZpZWQ7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25Hcm91cDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcblxudmFyIEJ1dHRvbkdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQnV0dG9uR3JvdXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdidXR0b24tdG9vbGJhcidcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7cm9sZTpcInRvb2xiYXJcIixcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b25Hcm91cDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgQ2Fyb3VzZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDYXJvdXNlbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBzbGlkZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaW5kaWNhdG9yczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY29udHJvbHM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHBhdXNlT25Ib3ZlcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgd3JhcDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG9uU2xpZGVFbmQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZUluZGV4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlZmF1bHRBY3RpdmVJbmRleDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkaXJlY3Rpb246IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3ByZXYnLCAnbmV4dCddKVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzbGlkZTogdHJ1ZSxcbiAgICAgIGludGVydmFsOiA1MDAwLFxuICAgICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxuICAgICAgd3JhcDogdHJ1ZSxcbiAgICAgIGluZGljYXRvcnM6IHRydWUsXG4gICAgICBjb250cm9sczogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZUluZGV4OiB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVJbmRleCA9PSBudWxsID9cbiAgICAgICAgMCA6IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUluZGV4LFxuICAgICAgcHJldmlvdXNBY3RpdmVJbmRleDogbnVsbCxcbiAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0RGlyZWN0aW9uOiBmdW5jdGlvbiAocHJldkluZGV4LCBpbmRleCkge1xuICAgIGlmIChwcmV2SW5kZXggPT09IGluZGV4KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJldkluZGV4ID4gaW5kZXggP1xuICAgICAgJ3ByZXYnIDogJ25leHQnO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCk7XG5cbiAgICBpZiAobmV4dFByb3BzLmFjdGl2ZUluZGV4ICE9IG51bGwgJiYgbmV4dFByb3BzLmFjdGl2ZUluZGV4ICE9PSBhY3RpdmVJbmRleCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgcHJldmlvdXNBY3RpdmVJbmRleDogYWN0aXZlSW5kZXgsXG4gICAgICAgIGRpcmVjdGlvbjogbmV4dFByb3BzLmRpcmVjdGlvbiAhPSBudWxsID9cbiAgICAgICAgICBuZXh0UHJvcHMuZGlyZWN0aW9uIDogdGhpcy5nZXREaXJlY3Rpb24oYWN0aXZlSW5kZXgsIG5leHRQcm9wcy5hY3RpdmVJbmRleClcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMud2FpdEZvck5leHQoKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gIH0sXG5cbiAgbmV4dDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKSArIDE7XG4gICAgdmFyIGNvdW50ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5udW1iZXJPZih0aGlzLnByb3BzLmNoaWxkcmVuKTtcblxuICAgIGlmIChpbmRleCA+IGNvdW50IC0gMSkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLndyYXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaW5kZXggPSAwO1xuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlU2VsZWN0KGluZGV4LCAnbmV4dCcpO1xuICB9LFxuXG4gIHByZXY6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCkgLSAxO1xuXG4gICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLndyYXApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLm51bWJlck9mKHRoaXMucHJvcHMuY2hpbGRyZW4pIC0gMTtcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVNlbGVjdChpbmRleCwgJ3ByZXYnKTtcbiAgfSxcblxuICBwYXVzZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICB9LFxuXG4gIHBsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy53YWl0Rm9yTmV4dCgpO1xuICB9LFxuXG4gIHdhaXRGb3JOZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzUGF1c2VkICYmIHRoaXMucHJvcHMuc2xpZGUgJiYgdGhpcy5wcm9wcy5pbnRlcnZhbCAmJlxuICAgICAgICB0aGlzLnByb3BzLmFjdGl2ZUluZGV4ID09IG51bGwpIHtcbiAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5uZXh0LCB0aGlzLnByb3BzLmludGVydmFsKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlTW91c2VPdmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMucGF1c2VPbkhvdmVyKSB7XG4gICAgICB0aGlzLnBhdXNlKCk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZU1vdXNlT3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNQYXVzZWQpIHtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgIGNhcm91c2VsOiB0cnVlLFxuICAgICAgc2xpZGU6IHRoaXMucHJvcHMuc2xpZGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSxcbiAgICAgICAgb25Nb3VzZU92ZXI6dGhpcy5oYW5kbGVNb3VzZU92ZXIsXG4gICAgICAgIG9uTW91c2VPdXQ6dGhpcy5oYW5kbGVNb3VzZU91dH0sIFxuICAgICAgICB0aGlzLnByb3BzLmluZGljYXRvcnMgPyB0aGlzLnJlbmRlckluZGljYXRvcnMoKSA6IG51bGwsXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjYXJvdXNlbC1pbm5lclwiLCByZWY6XCJpbm5lclwifSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJJdGVtKVxuICAgICAgICApLFxuICAgICAgICB0aGlzLnByb3BzLmNvbnRyb2xzID8gdGhpcy5yZW5kZXJDb250cm9scygpIDogbnVsbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyUHJldjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcImxlZnQgY2Fyb3VzZWwtY29udHJvbFwiLCBocmVmOlwiI3ByZXZcIiwga2V5OjAsIG9uQ2xpY2s6dGhpcy5wcmV2fSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLWxlZnRcIn0gKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTmV4dDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYSgge2NsYXNzTmFtZTpcInJpZ2h0IGNhcm91c2VsLWNvbnRyb2xcIiwgaHJlZjpcIiNuZXh0XCIsIGtleToxLCBvbkNsaWNrOnRoaXMubmV4dH0sIFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1yaWdodFwifSlcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNvbnRyb2xzOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMud3JhcCkge1xuICAgICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuICAgICAgdmFyIGNvdW50ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5udW1iZXJPZih0aGlzLnByb3BzLmNoaWxkcmVuKTtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgKGFjdGl2ZUluZGV4ICE9PSAwKSA/IHRoaXMucmVuZGVyUHJldigpIDogbnVsbCxcbiAgICAgICAgKGFjdGl2ZUluZGV4ICE9PSBjb3VudCAtIDEpID8gdGhpcy5yZW5kZXJOZXh0KCkgOiBudWxsXG4gICAgICBdO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICB0aGlzLnJlbmRlclByZXYoKSxcbiAgICAgIHRoaXMucmVuZGVyTmV4dCgpXG4gICAgXTtcbiAgfSxcblxuICByZW5kZXJJbmRpY2F0b3I6IGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gKGluZGV4ID09PSB0aGlzLmdldEFjdGl2ZUluZGV4KCkpID9cbiAgICAgICdhY3RpdmUnIDogbnVsbDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGkoXG4gICAgICAgIHtrZXk6aW5kZXgsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc05hbWUsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVTZWxlY3QuYmluZCh0aGlzLCBpbmRleCwgbnVsbCl9IClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckluZGljYXRvcnM6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5kaWNhdG9ycyA9IFtdO1xuICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW5cbiAgICAgIC5mb3JFYWNoKHRoaXMucHJvcHMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkLCBpbmRleCkge1xuICAgICAgICBpbmRpY2F0b3JzLnB1c2goXG4gICAgICAgICAgdGhpcy5yZW5kZXJJbmRpY2F0b3IoY2hpbGQsIGluZGV4KSxcblxuICAgICAgICAgIC8vIEZvcmNlIHdoaXRlc3BhY2UgYmV0d2VlbiBpbmRpY2F0b3IgZWxlbWVudHMsIGJvb3RzdHJhcFxuICAgICAgICAgIC8vIHJlcXVpcmVzIHRoaXMgZm9yIGNvcnJlY3Qgc3BhY2luZyBvZiBlbGVtZW50cy5cbiAgICAgICAgICAnICdcbiAgICAgICAgKTtcbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5vbCgge2NsYXNzTmFtZTpcImNhcm91c2VsLWluZGljYXRvcnNcIn0sIFxuICAgICAgICBpbmRpY2F0b3JzXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBnZXRBY3RpdmVJbmRleDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmFjdGl2ZUluZGV4ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUluZGV4IDogdGhpcy5zdGF0ZS5hY3RpdmVJbmRleDtcbiAgfSxcblxuICBoYW5kbGVJdGVtQW5pbWF0ZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgcHJldmlvdXNBY3RpdmVJbmRleDogbnVsbCxcbiAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy53YWl0Rm9yTmV4dCgpO1xuXG4gICAgICBpZiAodGhpcy5wcm9wcy5vblNsaWRlRW5kKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TbGlkZUVuZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlckl0ZW06IGZ1bmN0aW9uIChjaGlsZCwgaW5kZXgpIHtcbiAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCk7XG4gICAgdmFyIGlzQWN0aXZlID0gKGluZGV4ID09PSBhY3RpdmVJbmRleCk7XG4gICAgdmFyIGlzUHJldmlvdXNBY3RpdmUgPSB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggIT0gbnVsbCAmJlxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ID09PSBpbmRleCAmJiB0aGlzLnByb3BzLnNsaWRlO1xuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgICBjaGlsZCxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZTogaXNBY3RpdmUsXG4gICAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXkgIT0gbnVsbCA/XG4gICAgICAgICAgICBjaGlsZC5wcm9wcy5rZXkgOiBpbmRleCxcbiAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgYW5pbWF0ZU91dDogaXNQcmV2aW91c0FjdGl2ZSxcbiAgICAgICAgICBhbmltYXRlSW46IGlzQWN0aXZlICYmIHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCAhPSBudWxsICYmIHRoaXMucHJvcHMuc2xpZGUsXG4gICAgICAgICAgZGlyZWN0aW9uOiB0aGlzLnN0YXRlLmRpcmVjdGlvbixcbiAgICAgICAgICBvbkFuaW1hdGVPdXRFbmQ6IGlzUHJldmlvdXNBY3RpdmUgPyB0aGlzLmhhbmRsZUl0ZW1BbmltYXRlT3V0RW5kOiBudWxsXG4gICAgICAgIH1cbiAgICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoaW5kZXgsIGRpcmVjdGlvbikge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXG4gICAgdmFyIHByZXZpb3VzQWN0aXZlSW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCk7XG4gICAgZGlyZWN0aW9uID0gZGlyZWN0aW9uIHx8IHRoaXMuZ2V0RGlyZWN0aW9uKHByZXZpb3VzQWN0aXZlSW5kZXgsIGluZGV4KTtcblxuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGluZGV4LCBkaXJlY3Rpb24pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUluZGV4ID09IG51bGwgJiYgaW5kZXggIT09IHByZXZpb3VzQWN0aXZlSW5kZXgpIHtcbiAgICAgIGlmICh0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggIT0gbnVsbCkge1xuICAgICAgICAvLyBJZiBjdXJyZW50bHkgYW5pbWF0aW5nIGRvbid0IGFjdGl2YXRlIHRoZSBuZXcgaW5kZXguXG4gICAgICAgIC8vIFRPRE86IGxvb2sgaW50byBxdWV1aW5nIHRoaXMgY2FuY2VsZWQgY2FsbCBhbmRcbiAgICAgICAgLy8gYW5pbWF0aW5nIGFmdGVyIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBoYXMgZW5kZWQuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFjdGl2ZUluZGV4OiBpbmRleCxcbiAgICAgICAgcHJldmlvdXNBY3RpdmVJbmRleDogcHJldmlvdXNBY3RpdmVJbmRleCxcbiAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb25cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2Fyb3VzZWw7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIFRyYW5zaXRpb25FdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL1RyYW5zaXRpb25FdmVudHMnKTtcblxudmFyIENhcm91c2VsSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nhcm91c2VsSXRlbScsXG4gIHByb3BUeXBlczoge1xuICAgIGRpcmVjdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsncHJldicsICduZXh0J10pLFxuICAgIG9uQW5pbWF0ZU91dEVuZDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjYXB0aW9uOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZVxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkaXJlY3Rpb246IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbmltYXRpb246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZUFuaW1hdGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vbkFuaW1hdGVPdXRFbmQgJiYgdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhpcy5wcm9wcy5vbkFuaW1hdGVPdXRFbmQodGhpcy5wcm9wcy5pbmRleCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmUgIT09IG5leHRQcm9wcy5hY3RpdmUpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBkaXJlY3Rpb246IG51bGxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuYWN0aXZlICYmIHByZXZQcm9wcy5hY3RpdmUpIHtcbiAgICAgIFRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5nZXRET01Ob2RlKCksXG4gICAgICAgIHRoaXMuaGFuZGxlQW5pbWF0ZU91dEVuZFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmUgIT09IHByZXZQcm9wcy5hY3RpdmUpIHtcbiAgICAgIHNldFRpbWVvdXQodGhpcy5zdGFydEFuaW1hdGlvbiwgMjApO1xuICAgIH1cbiAgfSxcblxuICBzdGFydEFuaW1hdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZGlyZWN0aW9uOiB0aGlzLnByb3BzLmRpcmVjdGlvbiA9PT0gJ3ByZXYnID9cbiAgICAgICAgJ3JpZ2h0JyA6ICdsZWZ0J1xuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgaXRlbTogdHJ1ZSxcbiAgICAgIGFjdGl2ZTogKHRoaXMucHJvcHMuYWN0aXZlICYmICF0aGlzLnByb3BzLmFuaW1hdGVJbikgfHwgdGhpcy5wcm9wcy5hbmltYXRlT3V0LFxuICAgICAgbmV4dDogdGhpcy5wcm9wcy5hY3RpdmUgJiYgdGhpcy5wcm9wcy5hbmltYXRlSW4gJiYgdGhpcy5wcm9wcy5kaXJlY3Rpb24gPT09ICduZXh0JyxcbiAgICAgIHByZXY6IHRoaXMucHJvcHMuYWN0aXZlICYmIHRoaXMucHJvcHMuYW5pbWF0ZUluICYmIHRoaXMucHJvcHMuZGlyZWN0aW9uID09PSAncHJldidcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuc3RhdGUuZGlyZWN0aW9uICYmICh0aGlzLnByb3BzLmFuaW1hdGVJbiB8fCB0aGlzLnByb3BzLmFuaW1hdGVPdXQpKSB7XG4gICAgICBjbGFzc2VzW3RoaXMuc3RhdGUuZGlyZWN0aW9uXSA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuLFxuICAgICAgICB0aGlzLnByb3BzLmNhcHRpb24gPyB0aGlzLnJlbmRlckNhcHRpb24oKSA6IG51bGxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNhcHRpb246IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNhcm91c2VsLWNhcHRpb25cIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNhcHRpb25cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJvdXNlbEl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKTtcblxuXG52YXIgQ29sID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ29sJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgeHM6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc206IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGc6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgeHNPZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc21PZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWRPZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGdPZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgeHNQdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZFB1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGdQdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHhzUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbVB1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWRQdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00uZGl2XG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuICAgIHZhciBjbGFzc2VzID0ge307XG5cbiAgICBPYmplY3Qua2V5cyhjb25zdGFudHMuU0laRVMpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgICAgdmFyIHNpemUgPSBjb25zdGFudHMuU0laRVNba2V5XTtcbiAgICAgIHZhciBwcm9wID0gc2l6ZTtcbiAgICAgIHZhciBjbGFzc1BhcnQgPSBzaXplICsgJy0nO1xuXG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHNpemUgKyAnT2Zmc2V0JztcbiAgICAgIGNsYXNzUGFydCA9IHNpemUgKyAnLW9mZnNldC0nO1xuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgY2xhc3Nlc1snY29sLScgKyBjbGFzc1BhcnQgKyB0aGlzLnByb3BzW3Byb3BdXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHByb3AgPSBzaXplICsgJ1B1c2gnO1xuICAgICAgY2xhc3NQYXJ0ID0gc2l6ZSArICctcHVzaC0nO1xuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgY2xhc3Nlc1snY29sLScgKyBjbGFzc1BhcnQgKyB0aGlzLnByb3BzW3Byb3BdXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHByb3AgPSBzaXplICsgJ1B1bGwnO1xuICAgICAgY2xhc3NQYXJ0ID0gc2l6ZSArICctcHVsbC0nO1xuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgY2xhc3Nlc1snY29sLScgKyBjbGFzc1BhcnQgKyB0aGlzLnByb3BzW3Byb3BdXSA9IHRydWU7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBjb21wb25lbnRDbGFzcygge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sOyIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIFRyYW5zaXRpb25FdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL1RyYW5zaXRpb25FdmVudHMnKTtcblxudmFyIENvbGxhcHNhYmxlTWl4aW4gPSB7XG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgY29sbGFwc2FibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRlZmF1bHRFeHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cGFuZGVkOiB0aGlzLnByb3BzLmRlZmF1bHRFeHBhbmRlZCAhPSBudWxsID8gdGhpcy5wcm9wcy5kZWZhdWx0RXhwYW5kZWQgOiBudWxsLFxuICAgICAgY29sbGFwc2luZzogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZVRyYW5zaXRpb25FbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9jb2xsYXBzZUVuZCA9IHRydWU7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBjb2xsYXBzaW5nOiBmYWxzZVxuICAgIH0pO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXdQcm9wcykge1xuICAgIGlmICh0aGlzLnByb3BzLmNvbGxhcHNhYmxlICYmIG5ld1Byb3BzLmV4cGFuZGVkICE9PSB0aGlzLnByb3BzLmV4cGFuZGVkKSB7XG4gICAgICB0aGlzLl9jb2xsYXBzZUVuZCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGNvbGxhcHNpbmc6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBfYWRkRW5kVHJhbnNpdGlvbkxpc3RlbmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldENvbGxhcHNhYmxlRE9NTm9kZSgpO1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIFRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgbm9kZSxcbiAgICAgICAgdGhpcy5oYW5kbGVUcmFuc2l0aW9uRW5kXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBfcmVtb3ZlRW5kVHJhbnNpdGlvbkxpc3RlbmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldENvbGxhcHNhYmxlRE9NTm9kZSgpO1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIFRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgbm9kZSxcbiAgICAgICAgdGhpcy5oYW5kbGVUcmFuc2l0aW9uRW5kXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2FmdGVyUmVuZGVyKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW1vdmVFbmRUcmFuc2l0aW9uTGlzdGVuZXIoKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVXBkYXRlOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgdmFyIGRpbWVuc2lvbiA9ICh0eXBlb2YgdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvbiA9PT0gJ2Z1bmN0aW9uJykgP1xuICAgICAgdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvbigpIDogJ2hlaWdodCc7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldENvbGxhcHNhYmxlRE9NTm9kZSgpO1xuXG4gICAgdGhpcy5fcmVtb3ZlRW5kVHJhbnNpdGlvbkxpc3RlbmVyKCk7XG4gICAgaWYgKG5vZGUgJiYgbmV4dFByb3BzLmV4cGFuZGVkICE9PSB0aGlzLnByb3BzLmV4cGFuZGVkICYmIHRoaXMucHJvcHMuZXhwYW5kZWQpIHtcbiAgICAgIG5vZGUuc3R5bGVbZGltZW5zaW9uXSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb25WYWx1ZSgpICsgJ3B4JztcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5jb2xsYXBzaW5nICE9PSBwcmV2U3RhdGUuY29sbGFwc2luZykge1xuICAgICAgdGhpcy5fYWZ0ZXJSZW5kZXIoKTtcbiAgICB9XG4gIH0sXG5cbiAgX2FmdGVyUmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmNvbGxhcHNhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fYWRkRW5kVHJhbnNpdGlvbkxpc3RlbmVyKCk7XG4gICAgc2V0VGltZW91dCh0aGlzLl91cGRhdGVEaW1lbnNpb25BZnRlclJlbmRlciwgMCk7XG4gIH0sXG5cbiAgX3VwZGF0ZURpbWVuc2lvbkFmdGVyUmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpbWVuc2lvbiA9ICh0eXBlb2YgdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvbiA9PT0gJ2Z1bmN0aW9uJykgP1xuICAgICAgdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvbigpIDogJ2hlaWdodCc7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldENvbGxhcHNhYmxlRE9NTm9kZSgpO1xuXG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIG5vZGUuc3R5bGVbZGltZW5zaW9uXSA9IHRoaXMuaXNFeHBhbmRlZCgpID9cbiAgICAgICAgdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlKCkgKyAncHgnIDogJzBweCc7XG4gICAgfVxuICB9LFxuXG4gIGlzRXhwYW5kZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMucHJvcHMuZXhwYW5kZWQgIT0gbnVsbCkgP1xuICAgICAgdGhpcy5wcm9wcy5leHBhbmRlZCA6IHRoaXMuc3RhdGUuZXhwYW5kZWQ7XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVDbGFzc1NldDogZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG5cbiAgICBpZiAodHlwZW9mIGNsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNsYXNzTmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNsYXNzTmFtZSkge1xuICAgICAgICBpZiAoY2xhc3NOYW1lKSB7XG4gICAgICAgICAgY2xhc3Nlc1tjbGFzc05hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2xhc3Nlcy5jb2xsYXBzaW5nID0gdGhpcy5zdGF0ZS5jb2xsYXBzaW5nO1xuICAgIGNsYXNzZXMuY29sbGFwc2UgPSAhdGhpcy5zdGF0ZS5jb2xsYXBzaW5nO1xuICAgIGNsYXNzZXNbJ2luJ10gPSB0aGlzLmlzRXhwYW5kZWQoKSAmJiAhdGhpcy5zdGF0ZS5jb2xsYXBzaW5nO1xuXG4gICAgcmV0dXJuIGNsYXNzZXM7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sbGFwc2FibGVNaXhpbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBEcm9wZG93blN0YXRlTWl4aW4gPSByZXF1aXJlKCcuL0Ryb3Bkb3duU3RhdGVNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG52YXIgQnV0dG9uR3JvdXAgPSByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyk7XG52YXIgRHJvcGRvd25NZW51ID0gcmVxdWlyZSgnLi9Ecm9wZG93bk1lbnUnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cblxudmFyIERyb3Bkb3duQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRHJvcGRvd25CdXR0b24nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgRHJvcGRvd25TdGF0ZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRyb3B1cDogICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgdGl0bGU6ICAgICBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBocmVmOiAgICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgb25DbGljazogICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblNlbGVjdDogIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG5hdkl0ZW06ICAgUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gJ2Ryb3Bkb3duLXRvZ2dsZSc7XG5cbiAgICB2YXIgcmVuZGVyTWV0aG9kID0gdGhpcy5wcm9wcy5uYXZJdGVtID9cbiAgICAgICdyZW5kZXJOYXZJdGVtJyA6ICdyZW5kZXJCdXR0b25Hcm91cCc7XG5cbiAgICByZXR1cm4gdGhpc1tyZW5kZXJNZXRob2RdKFtcbiAgICAgIHRoaXMudHJhbnNmZXJQcm9wc1RvKEJ1dHRvbihcbiAgICAgICAge3JlZjpcImRyb3Bkb3duQnV0dG9uXCIsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc05hbWUsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVEcm9wZG93bkNsaWNrLFxuICAgICAgICBrZXk6MCxcbiAgICAgICAgbmF2RHJvcGRvd246dGhpcy5wcm9wcy5uYXZJdGVtLFxuICAgICAgICBuYXZJdGVtOm51bGwsXG4gICAgICAgIHRpdGxlOm51bGwsXG4gICAgICAgIHB1bGxSaWdodDpudWxsLFxuICAgICAgICBkcm9wdXA6bnVsbH0sIFxuICAgICAgICB0aGlzLnByb3BzLnRpdGxlLCcgJyxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJjYXJldFwifSApXG4gICAgICApKSxcbiAgICAgIERyb3Bkb3duTWVudShcbiAgICAgICAge3JlZjpcIm1lbnVcIixcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6dGhpcy5wcm9wcy5pZCxcbiAgICAgICAgcHVsbFJpZ2h0OnRoaXMucHJvcHMucHVsbFJpZ2h0LFxuICAgICAgICBrZXk6MX0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck1lbnVJdGVtKVxuICAgICAgKVxuICAgIF0pO1xuICB9LFxuXG4gIHJlbmRlckJ1dHRvbkdyb3VwOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgZ3JvdXBDbGFzc2VzID0ge1xuICAgICAgICAnb3Blbic6IHRoaXMuc3RhdGUub3BlbixcbiAgICAgICAgJ2Ryb3B1cCc6IHRoaXMucHJvcHMuZHJvcHVwXG4gICAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIEJ1dHRvbkdyb3VwKFxuICAgICAgICB7YnNTaXplOnRoaXMucHJvcHMuYnNTaXplLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoZ3JvdXBDbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAgICdkcm9wZG93bic6IHRydWUsXG4gICAgICAgICdvcGVuJzogdGhpcy5zdGF0ZS5vcGVuLFxuICAgICAgICAnZHJvcHVwJzogdGhpcy5wcm9wcy5kcm9wdXBcbiAgICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJNZW51SXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgLy8gT25seSBoYW5kbGUgdGhlIG9wdGlvbiBzZWxlY3Rpb24gaWYgYW4gb25TZWxlY3QgcHJvcCBoYXMgYmVlbiBzZXQgb24gdGhlXG4gICAgLy8gY29tcG9uZW50IG9yIGl0J3MgY2hpbGQsIHRoaXMgYWxsb3dzIGEgdXNlciBub3QgdG8gcGFzcyBhbiBvblNlbGVjdFxuICAgIC8vIGhhbmRsZXIgYW5kIGhhdmUgdGhlIGJyb3dzZXIgcHJlZm9ybSB0aGUgZGVmYXVsdCBhY3Rpb24uXG4gICAgdmFyIGhhbmRsZU9wdGlvblNlbGVjdCA9IHRoaXMucHJvcHMub25TZWxlY3QgfHwgY2hpbGQucHJvcHMub25TZWxlY3QgP1xuICAgICAgdGhpcy5oYW5kbGVPcHRpb25TZWxlY3QgOiBudWxsO1xuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIC8vIENhcHR1cmUgb25TZWxlY3QgZXZlbnRzXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIGhhbmRsZU9wdGlvblNlbGVjdCksXG5cbiAgICAgICAgLy8gRm9yY2Ugc3BlY2lhbCBwcm9wcyB0byBiZSB0cmFuc2ZlcnJlZFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICAgIH1cbiAgICApO1xuICB9LFxuXG4gIGhhbmRsZURyb3Bkb3duQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5zZXREcm9wZG93blN0YXRlKCF0aGlzLnN0YXRlLm9wZW4pO1xuICB9LFxuXG4gIGhhbmRsZU9wdGlvblNlbGVjdDogZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25CdXR0b247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgRHJvcGRvd25NZW51ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnRHJvcGRvd25NZW51JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgJ2Ryb3Bkb3duLW1lbnUnOiB0cnVlLFxuICAgICAgICAnZHJvcGRvd24tbWVudS1yaWdodCc6IHRoaXMucHJvcHMucHVsbFJpZ2h0XG4gICAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgICBSZWFjdC5ET00udWwoXG4gICAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSxcbiAgICAgICAgICByb2xlOlwibWVudVwifSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJNZW51SXRlbSlcbiAgICAgICAgKVxuICAgICAgKTtcbiAgfSxcblxuICByZW5kZXJNZW51SXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIC8vIENhcHR1cmUgb25TZWxlY3QgZXZlbnRzXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuXG4gICAgICAgIC8vIEZvcmNlIHNwZWNpYWwgcHJvcHMgdG8gYmUgdHJhbnNmZXJyZWRcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25NZW51OyIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEV2ZW50TGlzdGVuZXIgPSByZXF1aXJlKCcuL3V0aWxzL0V2ZW50TGlzdGVuZXInKTtcblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgd2l0aGluXG4gKiBhIHJvb3Qgbm9kZXMgdHJlZVxuICpcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gbm9kZVxuICogQHBhcmFtIHtET01FbGVtZW50fSByb290XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNOb2RlSW5Sb290KG5vZGUsIHJvb3QpIHtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PT0gcm9vdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbnZhciBEcm9wZG93blN0YXRlTWl4aW4gPSB7XG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBvcGVuOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgc2V0RHJvcGRvd25TdGF0ZTogZnVuY3Rpb24gKG5ld1N0YXRlLCBvblN0YXRlQ2hhbmdlQ29tcGxldGUpIHtcbiAgICBpZiAobmV3U3RhdGUpIHtcbiAgICAgIHRoaXMuYmluZFJvb3RDbG9zZUhhbmRsZXJzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudW5iaW5kUm9vdENsb3NlSGFuZGxlcnMoKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG9wZW46IG5ld1N0YXRlXG4gICAgfSwgb25TdGF0ZUNoYW5nZUNvbXBsZXRlKTtcbiAgfSxcblxuICBoYW5kbGVEb2N1bWVudEtleVVwOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLmtleUNvZGUgPT09IDI3KSB7XG4gICAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVEb2N1bWVudENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIC8vIElmIHRoZSBjbGljayBvcmlnaW5hdGVkIGZyb20gd2l0aGluIHRoaXMgY29tcG9uZW50XG4gICAgLy8gZG9uJ3QgZG8gYW55dGhpbmcuXG4gICAgaWYgKGlzTm9kZUluUm9vdChlLnRhcmdldCwgdGhpcy5nZXRET01Ob2RlKCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgfSxcblxuICBiaW5kUm9vdENsb3NlSGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2NsaWNrJywgdGhpcy5oYW5kbGVEb2N1bWVudENsaWNrKTtcbiAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2tleXVwJywgdGhpcy5oYW5kbGVEb2N1bWVudEtleVVwKTtcbiAgfSxcblxuICB1bmJpbmRSb290Q2xvc2VIYW5kbGVyczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnVuYmluZFJvb3RDbG9zZUhhbmRsZXJzKCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcGRvd25TdGF0ZU1peGluOyIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG4vLyBUT0RPOiBsaXN0ZW4gZm9yIG9uVHJhbnNpdGlvbkVuZCB0byByZW1vdmUgZWxcbm1vZHVsZS5leHBvcnRzID0ge1xuICBfZmFkZUluOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVscztcblxuICAgIGlmICh0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICBlbHMgPSB0aGlzLmdldERPTU5vZGUoKS5xdWVyeVNlbGVjdG9yQWxsKCcuZmFkZScpO1xuICAgICAgaWYgKGVscy5sZW5ndGgpIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbHMsIGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgIGVsLmNsYXNzTmFtZSArPSAnIGluJztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIF9mYWRlT3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVscyA9IHRoaXMuX2ZhZGVPdXRFbC5xdWVyeVNlbGVjdG9yQWxsKCcuZmFkZS5pbicpO1xuXG4gICAgaWYgKGVscy5sZW5ndGgpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxzLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gZWwuY2xhc3NOYW1lLnJlcGxhY2UoL1xcYmluXFxiLywgJycpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCh0aGlzLl9oYW5kbGVGYWRlT3V0RW5kLCAzMDApO1xuICB9LFxuXG4gIF9oYW5kbGVGYWRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2ZhZGVPdXRFbCAmJiB0aGlzLl9mYWRlT3V0RWwucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5fZmFkZU91dEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fZmFkZU91dEVsKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgLy8gRmlyZWZveCBuZWVkcyBkZWxheSBmb3IgdHJhbnNpdGlvbiB0byBiZSB0cmlnZ2VyZWRcbiAgICAgIHNldFRpbWVvdXQodGhpcy5fZmFkZUluLCAyMCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVscyA9IHRoaXMuZ2V0RE9NTm9kZSgpLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mYWRlJyk7XG4gICAgaWYgKGVscy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2ZhZGVPdXRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLl9mYWRlT3V0RWwpO1xuICAgICAgdGhpcy5fZmFkZU91dEVsLmFwcGVuZENoaWxkKHRoaXMuZ2V0RE9NTm9kZSgpLmNsb25lTm9kZSh0cnVlKSk7XG4gICAgICAvLyBGaXJlZm94IG5lZWRzIGRlbGF5IGZvciB0cmFuc2l0aW9uIHRvIGJlIHRyaWdnZXJlZFxuICAgICAgc2V0VGltZW91dCh0aGlzLl9mYWRlT3V0LCAyMCk7XG4gICAgfVxuICB9XG59O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5cbnZhciBHbHlwaGljb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHbHlwaGljb24nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZ2x5cGg6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihjb25zdGFudHMuR0xZUEhTKS5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdnbHlwaGljb24nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgY2xhc3Nlc1snZ2x5cGhpY29uLScgKyB0aGlzLnByb3BzLmdseXBoXSA9IHRydWU7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gR2x5cGhpY29uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xuXG5cbnZhciBHcmlkID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR3JpZCcsXG4gIHByb3BUeXBlczoge1xuICAgIGZsdWlkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00uZGl2XG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6dGhpcy5wcm9wcy5mbHVpZCA/ICdjb250YWluZXItZmx1aWQnIDogJ2NvbnRhaW5lcid9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyaWQ7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgSW5wdXQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdJbnB1dCcsXG4gIHByb3BUeXBlczoge1xuICAgIHR5cGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgbGFiZWw6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGhlbHA6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGFkZG9uQmVmb3JlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBhZGRvbkFmdGVyOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydzdWNjZXNzJywgJ3dhcm5pbmcnLCAnZXJyb3InXSksXG4gICAgaGFzRmVlZGJhY2s6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGdyb3VwQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHdyYXBwZXJDbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgbGFiZWxDbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgfSxcblxuICBnZXRJbnB1dERPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWZzLmlucHV0LmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBnZXRWYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLnR5cGUgPT09ICdzdGF0aWMnKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9wcy52YWx1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5wcm9wcy50eXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRJbnB1dERPTU5vZGUoKS52YWx1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBFcnJvcignQ2Fubm90IHVzZSBnZXRWYWx1ZSB3aXRob3V0IHNwZWNpZnlpbmcgaW5wdXQgdHlwZS4nKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0Q2hlY2tlZDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldElucHV0RE9NTm9kZSgpLmNoZWNrZWQ7XG4gIH0sXG5cbiAgaXNDaGVja2JveE9yUmFkaW86IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy50eXBlID09PSAncmFkaW8nIHx8IHRoaXMucHJvcHMudHlwZSA9PT0gJ2NoZWNrYm94JztcbiAgfSxcblxuICByZW5kZXJJbnB1dDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbnB1dCA9IG51bGw7XG5cbiAgICBpZiAoIXRoaXMucHJvcHMudHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMucHJvcHMudHlwZSkge1xuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgICAgaW5wdXQgPSAoXG4gICAgICAgICAgUmVhY3QuRE9NLnNlbGVjdCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJpbnB1dFwiLCBrZXk6XCJpbnB1dFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RleHRhcmVhJzpcbiAgICAgICAgaW5wdXQgPSBSZWFjdC5ET00udGV4dGFyZWEoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOlwiaW5wdXRcIiwga2V5OlwiaW5wdXRcIn0gKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdGF0aWMnOlxuICAgICAgICBpbnB1dCA9IChcbiAgICAgICAgICBSZWFjdC5ET00ucCgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbC1zdGF0aWNcIiwgcmVmOlwiaW5wdXRcIiwgIGtleTpcImlucHV0XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMudmFsdWVcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFyIGNsYXNzTmFtZSA9IHRoaXMuaXNDaGVja2JveE9yUmFkaW8oKSA/ICcnIDogJ2Zvcm0tY29udHJvbCc7XG4gICAgICAgIGlucHV0ID0gUmVhY3QuRE9NLmlucHV0KCB7Y2xhc3NOYW1lOmNsYXNzTmFtZSwgcmVmOlwiaW5wdXRcIiwga2V5OlwiaW5wdXRcIn0gKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oaW5wdXQpO1xuICB9LFxuXG4gIHJlbmRlcklucHV0R3JvdXA6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBhZGRvbkJlZm9yZSA9IHRoaXMucHJvcHMuYWRkb25CZWZvcmUgPyAoXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCIsIGtleTpcImFkZG9uQmVmb3JlXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5hZGRvbkJlZm9yZVxuICAgICAgKVxuICAgICkgOiBudWxsO1xuXG4gICAgdmFyIGFkZG9uQWZ0ZXIgPSB0aGlzLnByb3BzLmFkZG9uQWZ0ZXIgPyAoXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwLWFkZG9uXCIsIGtleTpcImFkZG9uQWZ0ZXJcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmFkZG9uQWZ0ZXJcbiAgICAgIClcbiAgICApIDogbnVsbDtcblxuICAgIHJldHVybiBhZGRvbkJlZm9yZSB8fCBhZGRvbkFmdGVyID8gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImlucHV0LWdyb3VwXCIsIGtleTpcImlucHV0LWdyb3VwXCJ9LCBcbiAgICAgICAgYWRkb25CZWZvcmUsXG4gICAgICAgIGNoaWxkcmVuLFxuICAgICAgICBhZGRvbkFmdGVyXG4gICAgICApXG4gICAgKSA6IGNoaWxkcmVuO1xuICB9LFxuXG4gIHJlbmRlckljb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdnbHlwaGljb24nOiB0cnVlLFxuICAgICAgJ2Zvcm0tY29udHJvbC1mZWVkYmFjayc6IHRydWUsXG4gICAgICAnZ2x5cGhpY29uLW9rJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnc3VjY2VzcycsXG4gICAgICAnZ2x5cGhpY29uLXdhcm5pbmctc2lnbic6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3dhcm5pbmcnLFxuICAgICAgJ2dseXBoaWNvbi1yZW1vdmUnOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdlcnJvcidcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMuaGFzRmVlZGJhY2sgPyAoXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwga2V5OlwiaWNvblwifSApXG4gICAgKSA6IG51bGw7XG4gIH0sXG5cbiAgcmVuZGVySGVscDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmhlbHAgPyAoXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImhlbHAtYmxvY2tcIiwga2V5OlwiaGVscFwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuaGVscFxuICAgICAgKVxuICAgICkgOiBudWxsO1xuICB9LFxuXG4gIHJlbmRlckNoZWNrYm94YW5kUmFkaW9XcmFwcGVyOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdjaGVja2JveCc6IHRoaXMucHJvcHMudHlwZSA9PT0gJ2NoZWNrYm94JyxcbiAgICAgICdyYWRpbyc6IHRoaXMucHJvcHMudHlwZSA9PT0gJ3JhZGlvJ1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwga2V5OlwiY2hlY2tib3hSYWRpb1dyYXBwZXJcIn0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyV3JhcHBlcjogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMud3JhcHBlckNsYXNzTmFtZSA/IChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6dGhpcy5wcm9wcy53cmFwcGVyQ2xhc3NOYW1lLCBrZXk6XCJ3cmFwcGVyXCJ9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApIDogY2hpbGRyZW47XG4gIH0sXG5cbiAgcmVuZGVyTGFiZWw6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2NvbnRyb2wtbGFiZWwnOiAhdGhpcy5pc0NoZWNrYm94T3JSYWRpbygpXG4gICAgfTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMubGFiZWxDbGFzc05hbWVdID0gdGhpcy5wcm9wcy5sYWJlbENsYXNzTmFtZTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmxhYmVsID8gKFxuICAgICAgUmVhY3QuRE9NLmxhYmVsKCB7aHRtbEZvcjp0aGlzLnByb3BzLmlkLCBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGtleTpcImxhYmVsXCJ9LCBcbiAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgIHRoaXMucHJvcHMubGFiZWxcbiAgICAgIClcbiAgICApIDogY2hpbGRyZW47XG4gIH0sXG5cbiAgcmVuZGVyRm9ybUdyb3VwOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdmb3JtLWdyb3VwJzogdHJ1ZSxcbiAgICAgICdoYXMtZmVlZGJhY2snOiB0aGlzLnByb3BzLmhhc0ZlZWRiYWNrLFxuICAgICAgJ2hhcy1zdWNjZXNzJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnc3VjY2VzcycsXG4gICAgICAnaGFzLXdhcm5pbmcnOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICd3YXJuaW5nJyxcbiAgICAgICdoYXMtZXJyb3InOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdlcnJvcidcbiAgICB9O1xuICAgIGNsYXNzZXNbdGhpcy5wcm9wcy5ncm91cENsYXNzTmFtZV0gPSB0aGlzLnByb3BzLmdyb3VwQ2xhc3NOYW1lO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzQ2hlY2tib3hPclJhZGlvKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlckZvcm1Hcm91cChcbiAgICAgICAgdGhpcy5yZW5kZXJXcmFwcGVyKFtcbiAgICAgICAgICB0aGlzLnJlbmRlckNoZWNrYm94YW5kUmFkaW9XcmFwcGVyKFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJMYWJlbChcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnB1dCgpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckhlbHAoKVxuICAgICAgICBdKVxuICAgICAgKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJGb3JtR3JvdXAoW1xuICAgICAgICB0aGlzLnJlbmRlckxhYmVsKCksXG4gICAgICAgIHRoaXMucmVuZGVyV3JhcHBlcihbXG4gICAgICAgICAgdGhpcy5yZW5kZXJJbnB1dEdyb3VwKFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJJbnB1dCgpXG4gICAgICAgICAgKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckljb24oKSxcbiAgICAgICAgICB0aGlzLnJlbmRlckhlbHAoKVxuICAgICAgICBdKVxuICAgICAgXSk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dDtcbiIsIi8vIGh0dHBzOi8vd3d3Lm5wbWpzLm9yZy9wYWNrYWdlL3JlYWN0LWludGVycG9sYXRlLWNvbXBvbmVudFxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vdXRpbHMvbWVyZ2UnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBSRUdFWFAgPSAvXFwlXFwoKC4rPylcXClzLztcblxudmFyIEludGVycG9sYXRlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBkaXNwbGF5TmFtZTogJ0ludGVycG9sYXRlJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBmb3JtYXQ6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7IGNvbXBvbmVudDogUmVhY3QuRE9NLnNwYW4gfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmb3JtYXQgPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLmhhc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuY2hpbGRyZW4pID8gdGhpcy5wcm9wcy5jaGlsZHJlbiA6IHRoaXMucHJvcHMuZm9ybWF0O1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLnByb3BzLmNvbXBvbmVudDtcbiAgICB2YXIgdW5zYWZlID0gdGhpcy5wcm9wcy51bnNhZmUgPT09IHRydWU7XG4gICAgdmFyIHByb3BzID0gbWVyZ2UodGhpcy5wcm9wcyk7XG5cbiAgICBkZWxldGUgcHJvcHMuY2hpbGRyZW47XG4gICAgZGVsZXRlIHByb3BzLmZvcm1hdDtcbiAgICBkZWxldGUgcHJvcHMuY29tcG9uZW50O1xuICAgIGRlbGV0ZSBwcm9wcy51bnNhZmU7XG5cbiAgICBpZiAodW5zYWZlKSB7XG4gICAgICB2YXIgY29udGVudCA9IGZvcm1hdC5zcGxpdChSRUdFWFApLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGh0bWw7XG5cbiAgICAgICAgaWYgKGluZGV4ICUgMiA9PT0gMCkge1xuICAgICAgICAgIGh0bWwgPSBtYXRjaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBodG1sID0gcHJvcHNbbWF0Y2hdO1xuICAgICAgICAgIGRlbGV0ZSBwcm9wc1ttYXRjaF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChodG1sKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY2Fubm90IGludGVycG9sYXRlIGEgUmVhY3QgY29tcG9uZW50IGludG8gdW5zYWZlIHRleHQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lbW8gKz0gaHRtbDtcblxuICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgIH0sICcnKTtcblxuICAgICAgcHJvcHMuZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwgPSB7IF9faHRtbDogY29udGVudCB9O1xuXG4gICAgICByZXR1cm4gcGFyZW50KHByb3BzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGFyZ3MgPSBmb3JtYXQuc3BsaXQoUkVHRVhQKS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgbWF0Y2gsIGluZGV4KSB7XG4gICAgICAgIHZhciBjaGlsZDtcblxuICAgICAgICBpZiAoaW5kZXggJSAyID09PSAwKSB7XG4gICAgICAgICAgaWYgKG1hdGNoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2hpbGQgPSBtYXRjaDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjaGlsZCA9IHByb3BzW21hdGNoXTtcbiAgICAgICAgICBkZWxldGUgcHJvcHNbbWF0Y2hdO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVtby5wdXNoKGNoaWxkKTtcblxuICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgIH0sIFtwcm9wc10pO1xuXG4gICAgICByZXR1cm4gcGFyZW50LmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW50ZXJwb2xhdGU7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbnZhciBKdW1ib3Ryb24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdKdW1ib3Ryb24nLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJqdW1ib3Ryb25cIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSnVtYm90cm9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIExhYmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTGFiZWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdsYWJlbCcsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTGFiZWw7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgTWVudUl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNZW51SXRlbScsXG4gIHByb3BUeXBlczoge1xuICAgIGhlYWRlcjogICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXZpZGVyOiAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaHJlZjogICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGl0bGU6ICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhyZWY6ICcjJ1xuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXkpO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJBbmNob3I6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoIHtvbkNsaWNrOnRoaXMuaGFuZGxlQ2xpY2ssIGhyZWY6dGhpcy5wcm9wcy5ocmVmLCB0aXRsZTp0aGlzLnByb3BzLnRpdGxlLCB0YWJJbmRleDpcIi0xXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAgICdkcm9wZG93bi1oZWFkZXInOiB0aGlzLnByb3BzLmhlYWRlcixcbiAgICAgICAgJ2RpdmlkZXInOiB0aGlzLnByb3BzLmRpdmlkZXJcbiAgICAgIH07XG5cbiAgICB2YXIgY2hpbGRyZW4gPSBudWxsO1xuICAgIGlmICh0aGlzLnByb3BzLmhlYWRlcikge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLnByb3BzLmNoaWxkcmVuO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMucHJvcHMuZGl2aWRlcikge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLnJlbmRlckFuY2hvcigpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saSgge3JvbGU6XCJwcmVzZW50YXRpb25cIiwgdGl0bGU6bnVsbCwgaHJlZjpudWxsLCBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNZW51SXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgRmFkZU1peGluID0gcmVxdWlyZSgnLi9GYWRlTWl4aW4nKTtcbnZhciBFdmVudExpc3RlbmVyID0gcmVxdWlyZSgnLi91dGlscy9FdmVudExpc3RlbmVyJyk7XG5cblxuLy8gVE9ETzpcbi8vIC0gYXJpYS1sYWJlbGxlZGJ5XG4vLyAtIEFkZCBgbW9kYWwtYm9keWAgZGl2IGlmIG9ubHkgb25lIGNoaWxkIHBhc3NlZCBpbiB0aGF0IGRvZXNuJ3QgYWxyZWFkeSBoYXZlIGl0XG4vLyAtIFRlc3RzXG5cbnZhciBNb2RhbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vZGFsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIEZhZGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGJhY2tkcm9wOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydzdGF0aWMnLCB0cnVlLCBmYWxzZV0pLFxuICAgIGtleWJvYXJkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjbG9zZUJ1dHRvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYW5pbWF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblJlcXVlc3RIaWRlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdtb2RhbCcsXG4gICAgICBiYWNrZHJvcDogdHJ1ZSxcbiAgICAgIGtleWJvYXJkOiB0cnVlLFxuICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgY2xvc2VCdXR0b246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBtb2RhbFN0eWxlID0ge2Rpc3BsYXk6ICdibG9jayd9O1xuICAgIHZhciBkaWFsb2dDbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgZGVsZXRlIGRpYWxvZ0NsYXNzZXMubW9kYWw7XG4gICAgZGlhbG9nQ2xhc3Nlc1snbW9kYWwtZGlhbG9nJ10gPSB0cnVlO1xuXG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICBtb2RhbDogdHJ1ZSxcbiAgICAgIGZhZGU6IHRoaXMucHJvcHMuYW5pbWF0aW9uLFxuICAgICAgJ2luJzogIXRoaXMucHJvcHMuYW5pbWF0aW9uIHx8ICFkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsXG4gICAgfTtcblxuICAgIHZhciBtb2RhbCA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge3RpdGxlOm51bGwsXG4gICAgICAgIHRhYkluZGV4OlwiLTFcIixcbiAgICAgICAgcm9sZTpcImRpYWxvZ1wiLFxuICAgICAgICBzdHlsZTptb2RhbFN0eWxlLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5wcm9wcy5iYWNrZHJvcCA9PT0gdHJ1ZSA/IHRoaXMuaGFuZGxlQmFja2Ryb3BDbGljayA6IG51bGwsXG4gICAgICAgIHJlZjpcIm1vZGFsXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChkaWFsb2dDbGFzc2VzKX0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1jb250ZW50XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMudGl0bGUgPyB0aGlzLnJlbmRlckhlYWRlcigpIDogbnVsbCxcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMuYmFja2Ryb3AgP1xuICAgICAgdGhpcy5yZW5kZXJCYWNrZHJvcChtb2RhbCkgOiBtb2RhbDtcbiAgfSxcblxuICByZW5kZXJCYWNrZHJvcDogZnVuY3Rpb24gKG1vZGFsKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnbW9kYWwtYmFja2Ryb3AnOiB0cnVlLFxuICAgICAgJ2ZhZGUnOiB0aGlzLnByb3BzLmFuaW1hdGlvblxuICAgIH07XG5cbiAgICBjbGFzc2VzWydpbiddID0gIXRoaXMucHJvcHMuYW5pbWF0aW9uIHx8ICFkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsO1xuXG4gICAgdmFyIG9uQ2xpY2sgPSB0aGlzLnByb3BzLmJhY2tkcm9wID09PSB0cnVlID9cbiAgICAgIHRoaXMuaGFuZGxlQmFja2Ryb3BDbGljayA6IG51bGw7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgcmVmOlwiYmFja2Ryb3BcIiwgb25DbGljazpvbkNsaWNrfSApLFxuICAgICAgICBtb2RhbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsb3NlQnV0dG9uO1xuICAgIGlmICh0aGlzLnByb3BzLmNsb3NlQnV0dG9uKSB7XG4gICAgICBjbG9zZUJ1dHRvbiA9IChcbiAgICAgICAgICBSZWFjdC5ET00uYnV0dG9uKCB7dHlwZTpcImJ1dHRvblwiLCBjbGFzc05hbWU6XCJjbG9zZVwiLCAnYXJpYS1oaWRkZW4nOlwidHJ1ZVwiLCBvbkNsaWNrOnRoaXMucHJvcHMub25SZXF1ZXN0SGlkZX0sIFwiw5dcIilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWhlYWRlclwifSwgXG4gICAgICAgIGNsb3NlQnV0dG9uLFxuICAgICAgICB0aGlzLnJlbmRlclRpdGxlKClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclRpdGxlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LmlzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy50aXRsZSkgP1xuICAgICAgICB0aGlzLnByb3BzLnRpdGxlIDogUmVhY3QuRE9NLmg0KCB7Y2xhc3NOYW1lOlwibW9kYWwtdGl0bGVcIn0sIHRoaXMucHJvcHMudGl0bGUpXG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAna2V5dXAnLCB0aGlzLmhhbmRsZURvY3VtZW50S2V5VXApO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIucmVtb3ZlKCk7XG4gIH0sXG5cbiAgaGFuZGxlQmFja2Ryb3BDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS50YXJnZXQgIT09IGUuY3VycmVudFRhcmdldCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucHJvcHMub25SZXF1ZXN0SGlkZSgpO1xuICB9LFxuXG4gIGhhbmRsZURvY3VtZW50S2V5VXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMua2V5Ym9hcmQgJiYgZS5rZXlDb2RlID09PSAyNykge1xuICAgICAgdGhpcy5wcm9wcy5vblJlcXVlc3RIaWRlKCk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBPdmVybGF5TWl4aW4gPSByZXF1aXJlKCcuL092ZXJsYXlNaXhpbicpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG5cbnZhciBNb2RhbFRyaWdnZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb2RhbFRyaWdnZXInLFxuICBtaXhpbnM6IFtPdmVybGF5TWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG1vZGFsOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZS5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgc2hvdzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246IHRydWVcbiAgICB9KTtcbiAgfSxcblxuICBoaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogZmFsc2VcbiAgICB9KTtcbiAgfSxcblxuICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiAhdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93blxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlck92ZXJsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd24pIHtcbiAgICAgIHJldHVybiBSZWFjdC5ET00uc3BhbihudWxsICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgdGhpcy5wcm9wcy5tb2RhbCxcbiAgICAgIHtcbiAgICAgICAgb25SZXF1ZXN0SGlkZTogdGhpcy5oaWRlXG4gICAgICB9XG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGQgPSBSZWFjdC5DaGlsZHJlbi5vbmx5KHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBvbkNsaWNrOiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25DbGljaywgdGhpcy50b2dnbGUpXG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWxUcmlnZ2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBDb2xsYXBzYWJsZU1peGluID0gcmVxdWlyZSgnLi9Db2xsYXBzYWJsZU1peGluJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG5cblxudmFyIE5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBDb2xsYXBzYWJsZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0YWJzJywncGlsbHMnXSksXG4gICAgc3RhY2tlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAganVzdGlmaWVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgY29sbGFwc2FibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuYXZiYXI6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICduYXYnXG4gICAgfTtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVEaW1lbnNpb25WYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5yZWZzLnVsLmdldERPTU5vZGUoKSxcbiAgICAgICAgaGVpZ2h0ID0gbm9kZS5vZmZzZXRIZWlnaHQsXG4gICAgICAgIGNvbXB1dGVkU3R5bGVzID0gZG9tVXRpbHMuZ2V0Q29tcHV0ZWRTdHlsZXMobm9kZSk7XG5cbiAgICByZXR1cm4gaGVpZ2h0ICsgcGFyc2VJbnQoY29tcHV0ZWRTdHlsZXMubWFyZ2luVG9wLCAxMCkgKyBwYXJzZUludChjb21wdXRlZFN0eWxlcy5tYXJnaW5Cb3R0b20sIDEwKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMucHJvcHMuY29sbGFwc2FibGUgPyB0aGlzLmdldENvbGxhcHNhYmxlQ2xhc3NTZXQoKSA6IHt9O1xuXG4gICAgY2xhc3Nlc1snbmF2YmFyLWNvbGxhcHNlJ10gPSB0aGlzLnByb3BzLmNvbGxhcHNhYmxlO1xuXG4gICAgaWYgKHRoaXMucHJvcHMubmF2YmFyICYmICF0aGlzLnByb3BzLmNvbGxhcHNhYmxlKSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8odGhpcy5yZW5kZXJVbCgpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubmF2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucmVuZGVyVWwoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVWw6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgY2xhc3Nlc1snbmF2LXN0YWNrZWQnXSA9IHRoaXMucHJvcHMuc3RhY2tlZDtcbiAgICBjbGFzc2VzWyduYXYtanVzdGlmaWVkJ10gPSB0aGlzLnByb3BzLmp1c3RpZmllZDtcbiAgICBjbGFzc2VzWyduYXZiYXItbmF2J10gPSB0aGlzLnByb3BzLm5hdmJhcjtcbiAgICBjbGFzc2VzWydwdWxsLXJpZ2h0J10gPSB0aGlzLnByb3BzLnB1bGxSaWdodDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHJlZjpcInVsXCJ9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJOYXZJdGVtKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgZ2V0Q2hpbGRBY3RpdmVQcm9wOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQucHJvcHMuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5rZXkgPT09IHRoaXMucHJvcHMuYWN0aXZlS2V5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVIcmVmICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5ocmVmID09PSB0aGlzLnByb3BzLmFjdGl2ZUhyZWYpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkLnByb3BzLmFjdGl2ZTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgYWN0aXZlOiB0aGlzLmdldENoaWxkQWN0aXZlUHJvcChjaGlsZCksXG4gICAgICAgIGFjdGl2ZUtleTogdGhpcy5wcm9wcy5hY3RpdmVLZXksXG4gICAgICAgIGFjdGl2ZUhyZWY6IHRoaXMucHJvcHMuYWN0aXZlSHJlZixcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgbmF2SXRlbTogdHJ1ZVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIE5hdkl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXZJdGVtJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBocmVmOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhyZWY6ICcjJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnYWN0aXZlJzogdGhpcy5wcm9wcy5hY3RpdmUsXG4gICAgICAnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uYShcbiAgICAgICAgICB7aHJlZjp0aGlzLnByb3BzLmhyZWYsXG4gICAgICAgICAgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSxcbiAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlQ2xpY2ssXG4gICAgICAgICAgcmVmOlwiYW5jaG9yXCJ9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5wcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5LHRoaXMucHJvcHMuaHJlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIE5hdiA9IHJlcXVpcmUoJy4vTmF2Jyk7XG5cblxudmFyIE5hdmJhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdmJhcicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBmaXhlZFRvcDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZml4ZWRCb3R0b206IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHN0YXRpY1RvcDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaW52ZXJzZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZmx1aWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHJvbGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzcyxcbiAgICBicmFuZDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgdG9nZ2xlQnV0dG9uOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBvblRvZ2dsZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgbmF2RXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRlZmF1bHROYXZFeHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ25hdmJhcicsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCcsXG4gICAgICByb2xlOiAnbmF2aWdhdGlvbicsXG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLm5hdlxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hdkV4cGFuZGVkOiB0aGlzLnByb3BzLmRlZmF1bHROYXZFeHBhbmRlZFxuICAgIH07XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAvLyBEZWZlciBhbnkgdXBkYXRlcyB0byB0aGlzIGNvbXBvbmVudCBkdXJpbmcgdGhlIGBvblNlbGVjdGAgaGFuZGxlci5cbiAgICByZXR1cm4gIXRoaXMuX2lzQ2hhbmdpbmc7XG4gIH0sXG5cbiAgaGFuZGxlVG9nZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25Ub2dnbGUpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vblRvZ2dsZSgpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbmF2T3BlbjogIXRoaXMuc3RhdGUubmF2T3BlblxuICAgIH0pO1xuICB9LFxuXG4gIGlzTmF2T3BlbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLm5hdk9wZW4gIT0gbnVsbCA/IHRoaXMucHJvcHMubmF2T3BlbiA6IHRoaXMuc3RhdGUubmF2T3BlbjtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG5cbiAgICBjbGFzc2VzWyduYXZiYXItZml4ZWQtdG9wJ10gPSB0aGlzLnByb3BzLmZpeGVkVG9wO1xuICAgIGNsYXNzZXNbJ25hdmJhci1maXhlZC1ib3R0b20nXSA9IHRoaXMucHJvcHMuZml4ZWRCb3R0b207XG4gICAgY2xhc3Nlc1snbmF2YmFyLXN0YXRpYy10b3AnXSA9IHRoaXMucHJvcHMuc3RhdGljVG9wO1xuICAgIGNsYXNzZXNbJ25hdmJhci1pbnZlcnNlJ10gPSB0aGlzLnByb3BzLmludmVyc2U7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBjb21wb25lbnRDbGFzcygge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOnRoaXMucHJvcHMuZmx1aWQgPyAnY29udGFpbmVyLWZsdWlkJyA6ICdjb250YWluZXInfSwgXG4gICAgICAgICAgKHRoaXMucHJvcHMuYnJhbmQgfHwgdGhpcy5wcm9wcy50b2dnbGVCdXR0b24gfHwgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkpID8gdGhpcy5yZW5kZXJIZWFkZXIoKSA6IG51bGwsXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJDaGlsZClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ2hpbGQ6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhjaGlsZCwge1xuICAgICAgbmF2YmFyOiB0cnVlLFxuICAgICAgY29sbGFwc2FibGU6IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ICE9IG51bGwgJiYgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgPT09IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIGV4cGFuZGVkOiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSAhPSBudWxsICYmIHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ID09PSBjaGlsZC5wcm9wcy5rZXkgJiYgdGhpcy5pc05hdk9wZW4oKSxcbiAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJIZWFkZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYnJhbmQ7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5icmFuZCkge1xuICAgICAgYnJhbmQgPSBSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuYnJhbmQpID9cbiAgICAgICAgY2xvbmVXaXRoUHJvcHModGhpcy5wcm9wcy5icmFuZCwge1xuICAgICAgICAgIGNsYXNzTmFtZTogJ25hdmJhci1icmFuZCdcbiAgICAgICAgfSkgOiBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcIm5hdmJhci1icmFuZFwifSwgdGhpcy5wcm9wcy5icmFuZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJuYXZiYXItaGVhZGVyXCJ9LCBcbiAgICAgICAgYnJhbmQsXG4gICAgICAgICh0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiB8fCB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSAhPSBudWxsKSA/IHRoaXMucmVuZGVyVG9nZ2xlQnV0dG9uKCkgOiBudWxsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJUb2dnbGVCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGRyZW47XG5cbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbikpIHtcbiAgICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyh0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiwge1xuICAgICAgICBjbGFzc05hbWU6ICduYXZiYXItdG9nZ2xlJyxcbiAgICAgICAgb25DbGljazogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlVG9nZ2xlLCB0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbi5wcm9wcy5vbkNsaWNrKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2hpbGRyZW4gPSAodGhpcy5wcm9wcy50b2dnbGVCdXR0b24gIT0gbnVsbCkgP1xuICAgICAgdGhpcy5wcm9wcy50b2dnbGVCdXR0b24gOiBbXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3Itb25seVwiLCBrZXk6MH0sIFwiVG9nZ2xlIG5hdmlnYXRpb25cIiksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaWNvbi1iYXJcIiwga2V5OjF9KSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpY29uLWJhclwiLCBrZXk6Mn0pLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImljb24tYmFyXCIsIGtleTozfSlcbiAgICBdO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5idXR0b24oIHtjbGFzc05hbWU6XCJuYXZiYXItdG9nZ2xlXCIsIHR5cGU6XCJidXR0b25cIiwgb25DbGljazp0aGlzLmhhbmRsZVRvZ2dsZX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdmJhcjtcbiIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwcm9wVHlwZXM6IHtcbiAgICBjb250YWluZXI6IEN1c3RvbVByb3BUeXBlcy5tb3VudGFibGVcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29udGFpbmVyOiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnID8gZG9jdW1lbnQuYm9keSA6IHtcbiAgICAgICAgLy8gSWYgd2UgYXJlIGluIGFuIGVudmlyb25tZW50IHRoYXQgZG9lc250IGhhdmUgYGRvY3VtZW50YCBkZWZpbmVkIGl0IHNob3VsZCBiZVxuICAgICAgICAvLyBzYWZlIHRvIGFzc3VtZSB0aGF0IGBjb21wb25lbnREaWRNb3VudGAgd2lsbCBub3QgcnVuIGFuZCB0aGlzIHdpbGwgYmUgbmVlZGVkLFxuICAgICAgICAvLyBqdXN0IHByb3ZpZGUgZW5vdWdoIGZha2UgQVBJIHRvIHBhc3MgdGhlIHByb3BUeXBlIHZhbGlkYXRpb24uXG4gICAgICAgIGdldERPTU5vZGU6IGZ1bmN0aW9uIG5vb3AoKSB7fVxuICAgICAgfVxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl91bnJlbmRlck92ZXJsYXkoKTtcbiAgICBpZiAodGhpcy5fb3ZlcmxheVRhcmdldCkge1xuICAgICAgdGhpcy5nZXRDb250YWluZXJET01Ob2RlKClcbiAgICAgICAgLnJlbW92ZUNoaWxkKHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICAgICAgdGhpcy5fb3ZlcmxheVRhcmdldCA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbmRlck92ZXJsYXkoKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbmRlck92ZXJsYXkoKTtcbiAgfSxcblxuICBfbW91bnRPdmVybGF5VGFyZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb3ZlcmxheVRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuZ2V0Q29udGFpbmVyRE9NTm9kZSgpXG4gICAgICAuYXBwZW5kQ2hpbGQodGhpcy5fb3ZlcmxheVRhcmdldCk7XG4gIH0sXG5cbiAgX3JlbmRlck92ZXJsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuX292ZXJsYXlUYXJnZXQpIHtcbiAgICAgIHRoaXMuX21vdW50T3ZlcmxheVRhcmdldCgpO1xuICAgIH1cblxuICAgIC8vIFNhdmUgcmVmZXJlbmNlIHRvIGhlbHAgdGVzdGluZ1xuICAgIHRoaXMuX292ZXJsYXlJbnN0YW5jZSA9IFJlYWN0LnJlbmRlckNvbXBvbmVudCh0aGlzLnJlbmRlck92ZXJsYXkoKSwgdGhpcy5fb3ZlcmxheVRhcmdldCk7XG4gIH0sXG5cbiAgX3VucmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIFJlYWN0LnVubW91bnRDb21wb25lbnRBdE5vZGUodGhpcy5fb3ZlcmxheVRhcmdldCk7XG4gICAgdGhpcy5fb3ZlcmxheUluc3RhbmNlID0gbnVsbDtcbiAgfSxcblxuICBnZXRPdmVybGF5RE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXRPdmVybGF5RE9NTm9kZSgpOiBBIGNvbXBvbmVudCBtdXN0IGJlIG1vdW50ZWQgdG8gaGF2ZSBhIERPTSBub2RlLicpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9vdmVybGF5SW5zdGFuY2UuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIGdldENvbnRhaW5lckRPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5jb250YWluZXIuZ2V0RE9NTm9kZSA/XG4gICAgICB0aGlzLnByb3BzLmNvbnRhaW5lci5nZXRET01Ob2RlKCkgOiB0aGlzLnByb3BzLmNvbnRhaW5lcjtcbiAgfVxufTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBPdmVybGF5TWl4aW4gPSByZXF1aXJlKCcuL092ZXJsYXlNaXhpbicpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL3V0aWxzL21lcmdlJyk7XG5cbi8qKlxuICogQ2hlY2sgaWYgdmFsdWUgb25lIGlzIGluc2lkZSBvciBlcXVhbCB0byB0aGUgb2YgdmFsdWVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gb25lXG4gKiBAcGFyYW0ge3N0cmluZ3xhcnJheX0gb2ZcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc09uZU9mKG9uZSwgb2YpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2YpKSB7XG4gICAgcmV0dXJuIG9mLmluZGV4T2Yob25lKSA+PSAwO1xuICB9XG4gIHJldHVybiBvbmUgPT09IG9mO1xufVxuXG52YXIgT3ZlcmxheVRyaWdnZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdPdmVybGF5VHJpZ2dlcicsXG4gIG1peGluczogW092ZXJsYXlNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgdHJpZ2dlcjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mVHlwZShbXG4gICAgICBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydtYW51YWwnLCAnY2xpY2snLCAnaG92ZXInLCAnZm9jdXMnXSksXG4gICAgICBSZWFjdC5Qcm9wVHlwZXMuYXJyYXlPZihSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydjbGljaycsICdob3ZlcicsICdmb2N1cyddKSlcbiAgICBdKSxcbiAgICBwbGFjZW1lbnQ6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RvcCcsJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J10pLFxuICAgIGRlbGF5OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlbGF5U2hvdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWxheUhpZGU6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVmYXVsdE92ZXJsYXlTaG93bjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb3ZlcmxheTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCcsXG4gICAgICB0cmlnZ2VyOiBbJ2hvdmVyJywgJ2ZvY3VzJ11cbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpc092ZXJsYXlTaG93bjogdGhpcy5wcm9wcy5kZWZhdWx0T3ZlcmxheVNob3duID09IG51bGwgP1xuICAgICAgICBmYWxzZSA6IHRoaXMucHJvcHMuZGVmYXVsdE92ZXJsYXlTaG93bixcbiAgICAgIG92ZXJsYXlMZWZ0OiBudWxsLFxuICAgICAgb3ZlcmxheVRvcDogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgc2hvdzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246IHRydWVcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMudXBkYXRlT3ZlcmxheVBvc2l0aW9uKCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93biA/XG4gICAgICB0aGlzLmhpZGUoKSA6IHRoaXMuc2hvdygpO1xuICB9LFxuXG4gIHJlbmRlck92ZXJsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd24pIHtcbiAgICAgIHJldHVybiBSZWFjdC5ET00uc3BhbihudWxsICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgdGhpcy5wcm9wcy5vdmVybGF5LFxuICAgICAge1xuICAgICAgICBvblJlcXVlc3RIaWRlOiB0aGlzLmhpZGUsXG4gICAgICAgIHBsYWNlbWVudDogdGhpcy5wcm9wcy5wbGFjZW1lbnQsXG4gICAgICAgIHBvc2l0aW9uTGVmdDogdGhpcy5zdGF0ZS5vdmVybGF5TGVmdCxcbiAgICAgICAgcG9zaXRpb25Ub3A6IHRoaXMuc3RhdGUub3ZlcmxheVRvcFxuICAgICAgfVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHByb3BzID0ge307XG5cbiAgICBpZiAoaXNPbmVPZignY2xpY2snLCB0aGlzLnByb3BzLnRyaWdnZXIpKSB7XG4gICAgICBwcm9wcy5vbkNsaWNrID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMudG9nZ2xlLCB0aGlzLnByb3BzLm9uQ2xpY2spO1xuICAgIH1cblxuICAgIGlmIChpc09uZU9mKCdob3ZlcicsIHRoaXMucHJvcHMudHJpZ2dlcikpIHtcbiAgICAgIHByb3BzLm9uTW91c2VPdmVyID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZFNob3csIHRoaXMucHJvcHMub25Nb3VzZU92ZXIpO1xuICAgICAgcHJvcHMub25Nb3VzZU91dCA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRIaWRlLCB0aGlzLnByb3BzLm9uTW91c2VPdXQpO1xuICAgIH1cblxuICAgIGlmIChpc09uZU9mKCdmb2N1cycsIHRoaXMucHJvcHMudHJpZ2dlcikpIHtcbiAgICAgIHByb3BzLm9uRm9jdXMgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkU2hvdywgdGhpcy5wcm9wcy5vbkZvY3VzKTtcbiAgICAgIHByb3BzLm9uQmx1ciA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRIaWRlLCB0aGlzLnByb3BzLm9uQmx1cik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgUmVhY3QuQ2hpbGRyZW4ub25seSh0aGlzLnByb3BzLmNoaWxkcmVuKSxcbiAgICAgIHByb3BzXG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hvdmVyRGVsYXkpO1xuICB9LFxuXG4gIGhhbmRsZURlbGF5ZWRTaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2hvdmVyRGVsYXkgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hvdmVyRGVsYXkpO1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlbGF5ID0gdGhpcy5wcm9wcy5kZWxheVNob3cgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLmRlbGF5U2hvdyA6IHRoaXMucHJvcHMuZGVsYXk7XG5cbiAgICBpZiAoIWRlbGF5KSB7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9ob3ZlckRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgdGhpcy5zaG93KCk7XG4gICAgfS5iaW5kKHRoaXMpLCBkZWxheSk7XG4gIH0sXG5cbiAgaGFuZGxlRGVsYXllZEhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faG92ZXJEZWxheSAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5faG92ZXJEZWxheSk7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGVsYXkgPSB0aGlzLnByb3BzLmRlbGF5SGlkZSAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMuZGVsYXlIaWRlIDogdGhpcy5wcm9wcy5kZWxheTtcblxuICAgIGlmICghZGVsYXkpIHtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICB9LmJpbmQodGhpcyksIGRlbGF5KTtcbiAgfSxcblxuICB1cGRhdGVPdmVybGF5UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgcG9zID0gdGhpcy5jYWxjT3ZlcmxheVBvc2l0aW9uKCk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG92ZXJsYXlMZWZ0OiBwb3MubGVmdCxcbiAgICAgIG92ZXJsYXlUb3A6IHBvcy50b3BcbiAgICB9KTtcbiAgfSxcblxuICBjYWxjT3ZlcmxheVBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkT2Zmc2V0ID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuXG4gICAgdmFyIG92ZXJsYXlOb2RlID0gdGhpcy5nZXRPdmVybGF5RE9NTm9kZSgpO1xuICAgIHZhciBvdmVybGF5SGVpZ2h0ID0gb3ZlcmxheU5vZGUub2Zmc2V0SGVpZ2h0O1xuICAgIHZhciBvdmVybGF5V2lkdGggPSBvdmVybGF5Tm9kZS5vZmZzZXRXaWR0aDtcblxuICAgIHN3aXRjaCAodGhpcy5wcm9wcy5wbGFjZW1lbnQpIHtcbiAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCArIGNoaWxkT2Zmc2V0LmhlaWdodCAvIDIgLSBvdmVybGF5SGVpZ2h0IC8gMixcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0ICsgY2hpbGRPZmZzZXQud2lkdGhcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wICsgY2hpbGRPZmZzZXQuaGVpZ2h0IC8gMiAtIG92ZXJsYXlIZWlnaHQgLyAyLFxuICAgICAgICAgIGxlZnQ6IGNoaWxkT2Zmc2V0LmxlZnQgLSBvdmVybGF5V2lkdGhcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgLSBvdmVybGF5SGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IGNoaWxkT2Zmc2V0LmxlZnQgKyBjaGlsZE9mZnNldC53aWR0aCAvIDIgLSBvdmVybGF5V2lkdGggLyAyXG4gICAgICAgIH07XG4gICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wICsgY2hpbGRPZmZzZXQuaGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IGNoaWxkT2Zmc2V0LmxlZnQgKyBjaGlsZE9mZnNldC53aWR0aCAvIDIgLSBvdmVybGF5V2lkdGggLyAyXG4gICAgICAgIH07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbGNPdmVybGF5UG9zaXRpb24oKTogTm8gc3VjaCBwbGFjZW1lbnQgb2YgXCInICsgdGhpcy5wcm9wcy5wbGFjZW1lbnQgKyAnXCIgZm91bmQuJyk7XG4gICAgfVxuICB9LFxuXG4gIGdldFBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICB2YXIgY29udGFpbmVyID0gdGhpcy5nZXRDb250YWluZXJET01Ob2RlKCk7XG5cbiAgICB2YXIgb2Zmc2V0ID0gY29udGFpbmVyLnRhZ05hbWUgPT0gJ0JPRFknID9cbiAgICAgIGRvbVV0aWxzLmdldE9mZnNldChub2RlKSA6IGRvbVV0aWxzLmdldFBvc2l0aW9uKG5vZGUsIGNvbnRhaW5lcik7XG5cbiAgICByZXR1cm4gbWVyZ2Uob2Zmc2V0LCB7XG4gICAgICBoZWlnaHQ6IG5vZGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgd2lkdGg6IG5vZGUub2Zmc2V0V2lkdGhcbiAgICB9KTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcmxheVRyaWdnZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG52YXIgUGFnZUhlYWRlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhZ2VIZWFkZXInLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYWdlLWhlYWRlclwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5oMShudWxsLCB0aGlzLnByb3BzLmNoaWxkcmVuKVxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VIZWFkZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgUGFnZUl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYWdlSXRlbScsXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHByZXZpb3VzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuZXh0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaHJlZjogJyMnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdkaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWQsXG4gICAgICAncHJldmlvdXMnOiB0aGlzLnByb3BzLnByZXZpb3VzLFxuICAgICAgJ25leHQnOiB0aGlzLnByb3BzLm5leHRcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKFxuICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICAgIHtocmVmOnRoaXMucHJvcHMuaHJlZixcbiAgICAgICAgICB0aXRsZTp0aGlzLnByb3BzLnRpdGxlLFxuICAgICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVTZWxlY3QsXG4gICAgICAgICAgcmVmOlwiYW5jaG9yXCJ9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIXRoaXMucHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSwgdGhpcy5wcm9wcy5ocmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcblxudmFyIFBhZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFnZXInLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS51bChcbiAgICAgICAge2NsYXNzTmFtZTpcInBhZ2VyXCJ9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJQYWdlSXRlbSlcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclBhZ2VJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhZ2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBDb2xsYXBzYWJsZU1peGluID0gcmVxdWlyZSgnLi9Db2xsYXBzYWJsZU1peGluJyk7XG5cbnZhciBQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhbmVsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIENvbGxhcHNhYmxlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGhlYWRlcjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgZm9vdGVyOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBvbkNsaWNrOiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAncGFuZWwnLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBleHBhbmRlZDogIXRoaXMuc3RhdGUuZXhwYW5kZWRcbiAgICB9KTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gIXRoaXMuX2lzQ2hhbmdpbmc7XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVEaW1lbnNpb25WYWx1ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnMuYm9keS5nZXRET01Ob2RlKCkub2Zmc2V0SGVpZ2h0O1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSB8fCAhdGhpcy5yZWZzIHx8ICF0aGlzLnJlZnMucGFuZWwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlZnMucGFuZWwuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgY2xhc3Nlc1sncGFuZWwnXSA9IHRydWU7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBpZDp0aGlzLnByb3BzLmNvbGxhcHNhYmxlID8gbnVsbCA6IHRoaXMucHJvcHMuaWR9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJIZWFkaW5nKCksXG4gICAgICAgIHRoaXMucHJvcHMuY29sbGFwc2FibGUgPyB0aGlzLnJlbmRlckNvbGxhcHNhYmxlQm9keSgpIDogdGhpcy5yZW5kZXJCb2R5KCksXG4gICAgICAgIHRoaXMucmVuZGVyRm9vdGVyKClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNvbGxhcHNhYmxlQm9keTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KHRoaXMuZ2V0Q29sbGFwc2FibGVDbGFzc1NldCgncGFuZWwtY29sbGFwc2UnKSksIGlkOnRoaXMucHJvcHMuaWQsIHJlZjpcInBhbmVsXCJ9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJCb2R5KClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckJvZHk6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWJvZHlcIiwgcmVmOlwiYm9keVwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckhlYWRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaGVhZGVyID0gdGhpcy5wcm9wcy5oZWFkZXI7XG5cbiAgICBpZiAoIWhlYWRlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGhlYWRlcikgfHwgQXJyYXkuaXNBcnJheShoZWFkZXIpKSB7XG4gICAgICBoZWFkZXIgPSB0aGlzLnByb3BzLmNvbGxhcHNhYmxlID9cbiAgICAgICAgdGhpcy5yZW5kZXJDb2xsYXBzYWJsZVRpdGxlKGhlYWRlcikgOiBoZWFkZXI7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmNvbGxhcHNhYmxlKSB7XG4gICAgICBoZWFkZXIgPSBjbG9uZVdpdGhQcm9wcyhoZWFkZXIsIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncGFuZWwtdGl0bGUnLFxuICAgICAgICBjaGlsZHJlbjogdGhpcy5yZW5kZXJBbmNob3IoaGVhZGVyLnByb3BzLmNoaWxkcmVuKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlciA9IGNsb25lV2l0aFByb3BzKGhlYWRlciwge1xuICAgICAgICBjbGFzc05hbWU6ICdwYW5lbC10aXRsZSdcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtaGVhZGluZ1wifSwgXG4gICAgICAgIGhlYWRlclxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQW5jaG9yOiBmdW5jdGlvbiAoaGVhZGVyKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICB7aHJlZjonIycgKyAodGhpcy5wcm9wcy5pZCB8fCAnJyksXG4gICAgICAgIGNsYXNzTmFtZTp0aGlzLmlzRXhwYW5kZWQoKSA/IG51bGwgOiAnY29sbGFwc2VkJyxcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVNlbGVjdH0sIFxuICAgICAgICBoZWFkZXJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNvbGxhcHNhYmxlVGl0bGU6IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmg0KCB7Y2xhc3NOYW1lOlwicGFuZWwtdGl0bGVcIn0sIFxuICAgICAgICB0aGlzLnJlbmRlckFuY2hvcihoZWFkZXIpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJGb290ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuZm9vdGVyKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWZvb3RlclwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuZm9vdGVyXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWw7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIFBhbmVsR3JvdXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYW5lbEdyb3VwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGNvbGxhcHNhYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBhY3RpdmVLZXk6IFJlYWN0LlByb3BUeXBlcy5hbnksXG4gICAgZGVmYXVsdEFjdGl2ZUtleTogUmVhY3QuUHJvcFR5cGVzLmFueSxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3BhbmVsLWdyb3VwJ1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlZmF1bHRBY3RpdmVLZXkgPSB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVLZXk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlS2V5OiBkZWZhdWx0QWN0aXZlS2V5XG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KHRoaXMuZ2V0QnNDbGFzc1NldCgpKX0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlclBhbmVsKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyUGFuZWw6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHZhciBhY3RpdmVLZXkgPVxuICAgICAgdGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlS2V5IDogdGhpcy5zdGF0ZS5hY3RpdmVLZXk7XG5cbiAgICB2YXIgcHJvcHMgPSB7XG4gICAgICBic1N0eWxlOiBjaGlsZC5wcm9wcy5ic1N0eWxlIHx8IHRoaXMucHJvcHMuYnNTdHlsZSxcbiAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvcHMuYWNjb3JkaW9uKSB7XG4gICAgICBwcm9wcy5jb2xsYXBzYWJsZSA9IHRydWU7XG4gICAgICBwcm9wcy5leHBhbmRlZCA9IChjaGlsZC5wcm9wcy5rZXkgPT09IGFjdGl2ZUtleSk7XG4gICAgICBwcm9wcy5vblNlbGVjdCA9IHRoaXMuaGFuZGxlU2VsZWN0O1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAgcHJvcHNcbiAgICApO1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gRGVmZXIgYW55IHVwZGF0ZXMgdG8gdGhpcyBjb21wb25lbnQgZHVyaW5nIHRoZSBgb25TZWxlY3RgIGhhbmRsZXIuXG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5hY3RpdmVLZXkgPT09IGtleSkge1xuICAgICAga2V5ID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGFjdGl2ZUtleToga2V5XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsR3JvdXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBQb3BvdmVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUG9wb3ZlcicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwbGFjZW1lbnQ6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RvcCcsJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J10pLFxuICAgIHBvc2l0aW9uTGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBwb3NpdGlvblRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldExlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRUb3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0J1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcbiAgICBjbGFzc2VzWydwb3BvdmVyJ10gPSB0cnVlO1xuICAgIGNsYXNzZXNbdGhpcy5wcm9wcy5wbGFjZW1lbnRdID0gdHJ1ZTtcbiAgICBjbGFzc2VzWydpbiddID0gdGhpcy5wcm9wcy5wb3NpdGlvbkxlZnQgIT0gbnVsbCB8fCB0aGlzLnByb3BzLnBvc2l0aW9uVG9wICE9IG51bGw7XG5cbiAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICBzdHlsZVsnbGVmdCddID0gdGhpcy5wcm9wcy5wb3NpdGlvbkxlZnQ7XG4gICAgc3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5wb3NpdGlvblRvcDtcbiAgICBzdHlsZVsnZGlzcGxheSddID0gJ2Jsb2NrJztcblxuICAgIHZhciBhcnJvd1N0eWxlID0ge307XG4gICAgYXJyb3dTdHlsZVsnbGVmdCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldExlZnQ7XG4gICAgYXJyb3dTdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0VG9wO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHN0eWxlOnN0eWxlfSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJhcnJvd1wiLCBzdHlsZTphcnJvd1N0eWxlfSApLFxuICAgICAgICB0aGlzLnByb3BzLnRpdGxlID8gdGhpcy5yZW5kZXJUaXRsZSgpIDogbnVsbCxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBvcG92ZXItY29udGVudFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclRpdGxlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmgzKCB7Y2xhc3NOYW1lOlwicG9wb3Zlci10aXRsZVwifSwgdGhpcy5wcm9wcy50aXRsZSlcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3BvdmVyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBJbnRlcnBvbGF0ZSA9IHJlcXVpcmUoJy4vSW50ZXJwb2xhdGUnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cblxudmFyIFByb2dyZXNzQmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUHJvZ3Jlc3NCYXInLFxuICBwcm9wVHlwZXM6IHtcbiAgICBtaW46IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbm93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1heDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgc3JPbmx5OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBzdHJpcGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAncHJvZ3Jlc3MtYmFyJyxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogMTAwXG4gICAgfTtcbiAgfSxcblxuICBnZXRQZXJjZW50YWdlOiBmdW5jdGlvbiAobm93LCBtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmNlaWwoKG5vdyAtIG1pbikgLyAobWF4IC0gbWluKSAqIDEwMCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAgIHByb2dyZXNzOiB0cnVlXG4gICAgICB9O1xuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlKSB7XG4gICAgICBjbGFzc2VzWydwcm9ncmVzcy1zdHJpcGVkJ10gPSB0cnVlO1xuICAgICAgY2xhc3Nlc1snYWN0aXZlJ10gPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5zdHJpcGVkKSB7XG4gICAgICBjbGFzc2VzWydwcm9ncmVzcy1zdHJpcGVkJ10gPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghVmFsaWRDb21wb25lbnRDaGlsZHJlbi5oYXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKSkge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLmlzQ2hpbGQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgICAgIHRoaXMucmVuZGVyUHJvZ3Jlc3NCYXIoKVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgICB0aGlzLnJlbmRlclByb2dyZXNzQmFyKClcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJDaGlsZEJhcilcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyQ2hpbGRCYXI6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhjaGlsZCwge1xuICAgICAgaXNDaGlsZDogdHJ1ZSxcbiAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJQcm9ncmVzc0JhcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwZXJjZW50YWdlID0gdGhpcy5nZXRQZXJjZW50YWdlKFxuICAgICAgICB0aGlzLnByb3BzLm5vdyxcbiAgICAgICAgdGhpcy5wcm9wcy5taW4sXG4gICAgICAgIHRoaXMucHJvcHMubWF4XG4gICAgICApO1xuXG4gICAgdmFyIGxhYmVsO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLmxhYmVsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucmVuZGVyTGFiZWwocGVyY2VudGFnZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmxhYmVsKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucHJvcHMubGFiZWw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuc3JPbmx5KSB7XG4gICAgICBsYWJlbCA9IHRoaXMucmVuZGVyU2NyZWVuUmVhZGVyT25seUxhYmVsKGxhYmVsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldCh0aGlzLmdldEJzQ2xhc3NTZXQoKSksIHJvbGU6XCJwcm9ncmVzc2JhclwiLFxuICAgICAgICBzdHlsZTp7d2lkdGg6IHBlcmNlbnRhZ2UgKyAnJSd9LFxuICAgICAgICAnYXJpYS12YWx1ZW5vdyc6dGhpcy5wcm9wcy5ub3csXG4gICAgICAgICdhcmlhLXZhbHVlbWluJzp0aGlzLnByb3BzLm1pbixcbiAgICAgICAgJ2FyaWEtdmFsdWVtYXgnOnRoaXMucHJvcHMubWF4fSwgXG4gICAgICAgIGxhYmVsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJMYWJlbDogZnVuY3Rpb24gKHBlcmNlbnRhZ2UpIHtcbiAgICB2YXIgSW50ZXJwb2xhdGVDbGFzcyA9IHRoaXMucHJvcHMuaW50ZXJwb2xhdGVDbGFzcyB8fCBJbnRlcnBvbGF0ZTtcblxuICAgIHJldHVybiAoXG4gICAgICBJbnRlcnBvbGF0ZUNsYXNzKFxuICAgICAgICB7bm93OnRoaXMucHJvcHMubm93LFxuICAgICAgICBtaW46dGhpcy5wcm9wcy5taW4sXG4gICAgICAgIG1heDp0aGlzLnByb3BzLm1heCxcbiAgICAgICAgcGVyY2VudDpwZXJjZW50YWdlLFxuICAgICAgICBic1N0eWxlOnRoaXMucHJvcHMuYnNTdHlsZX0sIFxuICAgICAgICB0aGlzLnByb3BzLmxhYmVsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJTY3JlZW5SZWFkZXJPbmx5TGFiZWw6IGZ1bmN0aW9uIChsYWJlbCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcInNyLW9ubHlcIn0sIFxuICAgICAgICBsYWJlbFxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2dyZXNzQmFyO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG5cblxudmFyIFJvdyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1JvdycsXG4gIHByb3BUeXBlczoge1xuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3NcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5kaXZcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBjb21wb25lbnRDbGFzcygge2NsYXNzTmFtZTpcInJvd1wifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBSb3c7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIERyb3Bkb3duU3RhdGVNaXhpbiA9IHJlcXVpcmUoJy4vRHJvcGRvd25TdGF0ZU1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcbnZhciBCdXR0b25Hcm91cCA9IHJlcXVpcmUoJy4vQnV0dG9uR3JvdXAnKTtcbnZhciBEcm9wZG93bk1lbnUgPSByZXF1aXJlKCcuL0Ryb3Bkb3duTWVudScpO1xuXG52YXIgU3BsaXRCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTcGxpdEJ1dHRvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBEcm9wZG93blN0YXRlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHRpdGxlOiAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGhyZWY6ICAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgZHJvcGRvd25UaXRsZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgb25DbGljazogICAgICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25TZWxlY3Q6ICAgICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgZGlzYWJsZWQ6ICAgICAgUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZHJvcGRvd25UaXRsZTogJ1RvZ2dsZSBkcm9wZG93bidcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBncm91cENsYXNzZXMgPSB7XG4gICAgICAgICdvcGVuJzogdGhpcy5zdGF0ZS5vcGVuLFxuICAgICAgICAnZHJvcHVwJzogdGhpcy5wcm9wcy5kcm9wdXBcbiAgICAgIH07XG5cbiAgICB2YXIgYnV0dG9uID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBCdXR0b24oXG4gICAgICAgIHtyZWY6XCJidXR0b25cIixcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZUJ1dHRvbkNsaWNrLFxuICAgICAgICB0aXRsZTpudWxsLFxuICAgICAgICBpZDpudWxsfSwgXG4gICAgICAgIHRoaXMucHJvcHMudGl0bGVcbiAgICAgIClcbiAgICApO1xuXG4gICAgdmFyIGRyb3Bkb3duQnV0dG9uID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBCdXR0b24oXG4gICAgICAgIHtyZWY6XCJkcm9wZG93bkJ1dHRvblwiLFxuICAgICAgICBjbGFzc05hbWU6XCJkcm9wZG93bi10b2dnbGVcIixcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZURyb3Bkb3duQ2xpY2ssXG4gICAgICAgIHRpdGxlOm51bGwsXG4gICAgICAgIGlkOm51bGx9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzci1vbmx5XCJ9LCB0aGlzLnByb3BzLmRyb3Bkb3duVGl0bGUpLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImNhcmV0XCJ9IClcbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIEJ1dHRvbkdyb3VwKFxuICAgICAgICB7YnNTaXplOnRoaXMucHJvcHMuYnNTaXplLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoZ3JvdXBDbGFzc2VzKSxcbiAgICAgICAgaWQ6dGhpcy5wcm9wcy5pZH0sIFxuICAgICAgICBidXR0b24sXG4gICAgICAgIGRyb3Bkb3duQnV0dG9uLFxuICAgICAgICBEcm9wZG93bk1lbnUoXG4gICAgICAgICAge3JlZjpcIm1lbnVcIixcbiAgICAgICAgICBvblNlbGVjdDp0aGlzLmhhbmRsZU9wdGlvblNlbGVjdCxcbiAgICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5Jzp0aGlzLnByb3BzLmlkLFxuICAgICAgICAgIHB1bGxSaWdodDp0aGlzLnByb3BzLnB1bGxSaWdodH0sIFxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlQnV0dG9uQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUub3Blbikge1xuICAgICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5vbkNsaWNrKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQ2xpY2soZSk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZURyb3Bkb3duQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgdGhpcy5zZXREcm9wZG93blN0YXRlKCF0aGlzLnN0YXRlLm9wZW4pO1xuICB9LFxuXG4gIGhhbmRsZU9wdGlvblNlbGVjdDogZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsaXRCdXR0b247XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIFN1Yk5hdiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1N1Yk5hdicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaHJlZjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0ZXh0OiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbmF2J1xuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKCF0aGlzLnByb3BzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXksIHRoaXMucHJvcHMuaHJlZik7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGlzQWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNDaGlsZEFjdGl2ZSh0aGlzKTtcbiAgfSxcblxuICBpc0NoaWxkQWN0aXZlOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQucHJvcHMuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCAmJiB0aGlzLnByb3BzLmFjdGl2ZUtleSA9PT0gY2hpbGQucHJvcHMua2V5KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVIcmVmICE9IG51bGwgJiYgdGhpcy5wcm9wcy5hY3RpdmVIcmVmID09PSBjaGlsZC5wcm9wcy5ocmVmKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY2hpbGQucHJvcHMuY2hpbGRyZW4pIHtcbiAgICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLmZvckVhY2goXG4gICAgICAgIGNoaWxkLnByb3BzLmNoaWxkcmVuLFxuICAgICAgICBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICBpZiAodGhpcy5pc0NoaWxkQWN0aXZlKGNoaWxkKSkge1xuICAgICAgICAgICAgaXNBY3RpdmUgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGhpc1xuICAgICAgKTtcblxuICAgICAgcmV0dXJuIGlzQWN0aXZlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICBnZXRDaGlsZEFjdGl2ZVByb3A6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmtleSA9PT0gdGhpcy5wcm9wcy5hY3RpdmVLZXkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUhyZWYgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmhyZWYgPT09IHRoaXMucHJvcHMuYWN0aXZlSHJlZikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQucHJvcHMuYWN0aXZlO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2FjdGl2ZSc6IHRoaXMuaXNBY3RpdmUoKSxcbiAgICAgICdkaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWRcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICAgIHtocmVmOnRoaXMucHJvcHMuaHJlZixcbiAgICAgICAgICB0aXRsZTp0aGlzLnByb3BzLnRpdGxlLFxuICAgICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVDbGljayxcbiAgICAgICAgICByZWY6XCJhbmNob3JcIn0sIFxuICAgICAgICAgIHRoaXMucHJvcHMudGV4dFxuICAgICAgICApLFxuICAgICAgICBSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJuYXZcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTmF2SXRlbSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIGFjdGl2ZTogdGhpcy5nZXRDaGlsZEFjdGl2ZVByb3AoY2hpbGQpLFxuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5XG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ViTmF2O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIFRyYW5zaXRpb25FdmVudHMgPSByZXF1aXJlKCcuL3V0aWxzL1RyYW5zaXRpb25FdmVudHMnKTtcblxudmFyIFRhYlBhbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYWJQYW5lJyxcbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuaW1hdGVJbjogZmFsc2UsXG4gICAgICBhbmltYXRlT3V0OiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIGlmICh0aGlzLnByb3BzLmFuaW1hdGlvbikge1xuICAgICAgaWYgKCF0aGlzLnN0YXRlLmFuaW1hdGVJbiAmJiBuZXh0UHJvcHMuYWN0aXZlICYmICF0aGlzLnByb3BzLmFjdGl2ZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBhbmltYXRlSW46IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKCF0aGlzLnN0YXRlLmFuaW1hdGVPdXQgJiYgIW5leHRQcm9wcy5hY3RpdmUgJiYgdGhpcy5wcm9wcy5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgYW5pbWF0ZU91dDogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuYW5pbWF0ZUluKSB7XG4gICAgICBzZXRUaW1lb3V0KHRoaXMuc3RhcnRBbmltYXRlSW4sIDApO1xuICAgIH1cbiAgICBpZiAodGhpcy5zdGF0ZS5hbmltYXRlT3V0KSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZ2V0RE9NTm9kZSgpLFxuICAgICAgICB0aGlzLnN0b3BBbmltYXRlT3V0XG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICBzdGFydEFuaW1hdGVJbjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYW5pbWF0ZUluOiBmYWxzZVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHN0b3BBbmltYXRlT3V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhbmltYXRlT3V0OiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5vbkFuaW1hdGVPdXRFbmQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vbkFuaW1hdGVPdXRFbmQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAndGFiLXBhbmUnOiB0cnVlLFxuICAgICAgJ2ZhZGUnOiB0cnVlLFxuICAgICAgJ2FjdGl2ZSc6IHRoaXMucHJvcHMuYWN0aXZlIHx8IHRoaXMuc3RhdGUuYW5pbWF0ZU91dCxcbiAgICAgICdpbic6IHRoaXMucHJvcHMuYWN0aXZlICYmICF0aGlzLnN0YXRlLmFuaW1hdGVJblxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJQYW5lOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgTmF2ID0gcmVxdWlyZSgnLi9OYXYnKTtcbnZhciBOYXZJdGVtID0gcmVxdWlyZSgnLi9OYXZJdGVtJyk7XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRBY3RpdmVLZXlGcm9tQ2hpbGRyZW4oY2hpbGRyZW4pIHtcbiAgdmFyIGRlZmF1bHRBY3RpdmVLZXk7XG5cbiAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCkge1xuICAgIGlmIChkZWZhdWx0QWN0aXZlS2V5ID09IG51bGwpIHtcbiAgICAgIGRlZmF1bHRBY3RpdmVLZXkgPSBjaGlsZC5wcm9wcy5rZXk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gZGVmYXVsdEFjdGl2ZUtleTtcbn1cblxudmFyIFRhYmJlZEFyZWEgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYWJiZWRBcmVhJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RhYnMnLCdwaWxscyddKSxcbiAgICBhbmltYXRpb246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic1N0eWxlOiBcInRhYnNcIixcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRlZmF1bHRBY3RpdmVLZXkgPSB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVLZXkgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVLZXkgOiBnZXREZWZhdWx0QWN0aXZlS2V5RnJvbUNoaWxkcmVuKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXG4gICAgLy8gVE9ETzogSW4gX19ERVZfXyBtb2RlIHdhcm4gdmlhIGBjb25zb2xlLndhcm5gIGlmIG5vIGBkZWZhdWx0QWN0aXZlS2V5YCBoYXNcbiAgICAvLyBiZWVuIHNldCBieSB0aGlzIHBvaW50LCBpbnZhbGlkIGNoaWxkcmVuIG9yIG1pc3Npbmcga2V5IHByb3BlcnRpZXMgYXJlIGxpa2VseSB0aGUgY2F1c2UuXG5cbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlS2V5OiBkZWZhdWx0QWN0aXZlS2V5LFxuICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICBpZiAobmV4dFByb3BzLmFjdGl2ZUtleSAhPSBudWxsICYmIG5leHRQcm9wcy5hY3RpdmVLZXkgIT09IHRoaXMucHJvcHMuYWN0aXZlS2V5KSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IHRoaXMucHJvcHMuYWN0aXZlS2V5XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlUGFuZUFuaW1hdGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiBudWxsXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFjdGl2ZUtleSA9XG4gICAgICB0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVLZXkgOiB0aGlzLnN0YXRlLmFjdGl2ZUtleTtcblxuICAgIGZ1bmN0aW9uIHJlbmRlclRhYklmU2V0KGNoaWxkKSB7XG4gICAgICByZXR1cm4gY2hpbGQucHJvcHMudGFiICE9IG51bGwgPyB0aGlzLnJlbmRlclRhYihjaGlsZCkgOiBudWxsO1xuICAgIH1cblxuICAgIHZhciBuYXYgPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIE5hdigge2FjdGl2ZUtleTphY3RpdmVLZXksIG9uU2VsZWN0OnRoaXMuaGFuZGxlU2VsZWN0LCByZWY6XCJ0YWJzXCJ9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgcmVuZGVyVGFiSWZTZXQsIHRoaXMpXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICBuYXYsXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtpZDp0aGlzLnByb3BzLmlkLCBjbGFzc05hbWU6XCJ0YWItY29udGVudFwiLCByZWY6XCJwYW5lc1wifSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJQYW5lKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBnZXRBY3RpdmVLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlS2V5IDogdGhpcy5zdGF0ZS5hY3RpdmVLZXk7XG4gIH0sXG5cbiAgcmVuZGVyUGFuZTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIGFjdGl2ZUtleSA9IHRoaXMuZ2V0QWN0aXZlS2V5KCk7XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICAgIGNoaWxkLFxuICAgICAgICB7XG4gICAgICAgICAgYWN0aXZlOiAoY2hpbGQucHJvcHMua2V5ID09PSBhY3RpdmVLZXkgJiZcbiAgICAgICAgICAgICh0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlS2V5ID09IG51bGwgfHwgIXRoaXMucHJvcHMuYW5pbWF0aW9uKSksXG4gICAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgICAgYW5pbWF0aW9uOiB0aGlzLnByb3BzLmFuaW1hdGlvbixcbiAgICAgICAgICBvbkFuaW1hdGVPdXRFbmQ6ICh0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlS2V5ICE9IG51bGwgJiZcbiAgICAgICAgICAgIGNoaWxkLnByb3BzLmtleSA9PT0gdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUtleSkgPyB0aGlzLmhhbmRsZVBhbmVBbmltYXRlT3V0RW5kOiBudWxsXG4gICAgICAgIH1cbiAgICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVGFiOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIga2V5ID0gY2hpbGQucHJvcHMua2V5O1xuICAgIHJldHVybiAoXG4gICAgICBOYXZJdGVtKFxuICAgICAgICB7cmVmOid0YWInICsga2V5LFxuICAgICAgICBrZXk6a2V5fSwgXG4gICAgICAgIGNoaWxkLnByb3BzLnRhYlxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAvLyBEZWZlciBhbnkgdXBkYXRlcyB0byB0aGlzIGNvbXBvbmVudCBkdXJpbmcgdGhlIGBvblNlbGVjdGAgaGFuZGxlci5cbiAgICByZXR1cm4gIXRoaXMuX2lzQ2hhbmdpbmc7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoa2V5ICE9PSB0aGlzLmdldEFjdGl2ZUtleSgpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYWN0aXZlS2V5OiBrZXksXG4gICAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiB0aGlzLmdldEFjdGl2ZUtleSgpXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYmJlZEFyZWE7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgVGFibGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUYWJsZScsXG4gIHByb3BUeXBlczoge1xuICAgIHN0cmlwZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGJvcmRlcmVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjb25kZW5zZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhvdmVyOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICByZXNwb25zaXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ3RhYmxlJzogdHJ1ZSxcbiAgICAgICd0YWJsZS1zdHJpcGVkJzogdGhpcy5wcm9wcy5zdHJpcGVkLFxuICAgICAgJ3RhYmxlLWJvcmRlcmVkJzogdGhpcy5wcm9wcy5ib3JkZXJlZCxcbiAgICAgICd0YWJsZS1jb25kZW5zZWQnOiB0aGlzLnByb3BzLmNvbmRlbnNlZCxcbiAgICAgICd0YWJsZS1ob3Zlcic6IHRoaXMucHJvcHMuaG92ZXJcbiAgICB9O1xuICAgIHZhciB0YWJsZSA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnRhYmxlKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMucmVzcG9uc2l2ZSA/IChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0YWJsZS1yZXNwb25zaXZlXCJ9LCBcbiAgICAgICAgdGFibGVcbiAgICAgIClcbiAgICApIDogdGFibGU7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYmxlOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgVG9vbHRpcCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Rvb2x0aXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcGxhY2VtZW50OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0b3AnLCdyaWdodCcsICdib3R0b20nLCAnbGVmdCddKSxcbiAgICBwb3NpdGlvbkxlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgcG9zaXRpb25Ub3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRMZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0VG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0J1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcbiAgICBjbGFzc2VzWyd0b29sdGlwJ10gPSB0cnVlO1xuICAgIGNsYXNzZXNbdGhpcy5wcm9wcy5wbGFjZW1lbnRdID0gdHJ1ZTtcbiAgICBjbGFzc2VzWydpbiddID0gdGhpcy5wcm9wcy5wb3NpdGlvbkxlZnQgIT0gbnVsbCB8fCB0aGlzLnByb3BzLnBvc2l0aW9uVG9wICE9IG51bGw7XG5cbiAgICB2YXIgc3R5bGUgPSB7fTtcbiAgICBzdHlsZVsnbGVmdCddID0gdGhpcy5wcm9wcy5wb3NpdGlvbkxlZnQ7XG4gICAgc3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5wb3NpdGlvblRvcDtcblxuICAgIHZhciBhcnJvd1N0eWxlID0ge307XG4gICAgYXJyb3dTdHlsZVsnbGVmdCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldExlZnQ7XG4gICAgYXJyb3dTdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0VG9wO1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgc3R5bGU6c3R5bGV9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidG9vbHRpcC1hcnJvd1wiLCBzdHlsZTphcnJvd1N0eWxlfSApLFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0b29sdGlwLWlubmVyXCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvb2x0aXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgV2VsbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1dlbGwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICd3ZWxsJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlbGw7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIENMQVNTRVM6IHtcbiAgICAnYWxlcnQnOiAnYWxlcnQnLFxuICAgICdidXR0b24nOiAnYnRuJyxcbiAgICAnYnV0dG9uLWdyb3VwJzogJ2J0bi1ncm91cCcsXG4gICAgJ2J1dHRvbi10b29sYmFyJzogJ2J0bi10b29sYmFyJyxcbiAgICAnY29sdW1uJzogJ2NvbCcsXG4gICAgJ2lucHV0LWdyb3VwJzogJ2lucHV0LWdyb3VwJyxcbiAgICAnZm9ybSc6ICdmb3JtJyxcbiAgICAnZ2x5cGhpY29uJzogJ2dseXBoaWNvbicsXG4gICAgJ2xhYmVsJzogJ2xhYmVsJyxcbiAgICAncGFuZWwnOiAncGFuZWwnLFxuICAgICdwYW5lbC1ncm91cCc6ICdwYW5lbC1ncm91cCcsXG4gICAgJ3Byb2dyZXNzLWJhcic6ICdwcm9ncmVzcy1iYXInLFxuICAgICduYXYnOiAnbmF2JyxcbiAgICAnbmF2YmFyJzogJ25hdmJhcicsXG4gICAgJ21vZGFsJzogJ21vZGFsJyxcbiAgICAncm93JzogJ3JvdycsXG4gICAgJ3dlbGwnOiAnd2VsbCdcbiAgfSxcbiAgU1RZTEVTOiB7XG4gICAgJ2RlZmF1bHQnOiAnZGVmYXVsdCcsXG4gICAgJ3ByaW1hcnknOiAncHJpbWFyeScsXG4gICAgJ3N1Y2Nlc3MnOiAnc3VjY2VzcycsXG4gICAgJ2luZm8nOiAnaW5mbycsXG4gICAgJ3dhcm5pbmcnOiAnd2FybmluZycsXG4gICAgJ2Rhbmdlcic6ICdkYW5nZXInLFxuICAgICdsaW5rJzogJ2xpbmsnLFxuICAgICdpbmxpbmUnOiAnaW5saW5lJyxcbiAgICAndGFicyc6ICd0YWJzJyxcbiAgICAncGlsbHMnOiAncGlsbHMnXG4gIH0sXG4gIFNJWkVTOiB7XG4gICAgJ2xhcmdlJzogJ2xnJyxcbiAgICAnbWVkaXVtJzogJ21kJyxcbiAgICAnc21hbGwnOiAnc20nLFxuICAgICd4c21hbGwnOiAneHMnXG4gIH0sXG4gIEdMWVBIUzogW1xuICAgICdhc3RlcmlzaycsXG4gICAgJ3BsdXMnLFxuICAgICdldXJvJyxcbiAgICAnbWludXMnLFxuICAgICdjbG91ZCcsXG4gICAgJ2VudmVsb3BlJyxcbiAgICAncGVuY2lsJyxcbiAgICAnZ2xhc3MnLFxuICAgICdtdXNpYycsXG4gICAgJ3NlYXJjaCcsXG4gICAgJ2hlYXJ0JyxcbiAgICAnc3RhcicsXG4gICAgJ3N0YXItZW1wdHknLFxuICAgICd1c2VyJyxcbiAgICAnZmlsbScsXG4gICAgJ3RoLWxhcmdlJyxcbiAgICAndGgnLFxuICAgICd0aC1saXN0JyxcbiAgICAnb2snLFxuICAgICdyZW1vdmUnLFxuICAgICd6b29tLWluJyxcbiAgICAnem9vbS1vdXQnLFxuICAgICdvZmYnLFxuICAgICdzaWduYWwnLFxuICAgICdjb2cnLFxuICAgICd0cmFzaCcsXG4gICAgJ2hvbWUnLFxuICAgICdmaWxlJyxcbiAgICAndGltZScsXG4gICAgJ3JvYWQnLFxuICAgICdkb3dubG9hZC1hbHQnLFxuICAgICdkb3dubG9hZCcsXG4gICAgJ3VwbG9hZCcsXG4gICAgJ2luYm94JyxcbiAgICAncGxheS1jaXJjbGUnLFxuICAgICdyZXBlYXQnLFxuICAgICdyZWZyZXNoJyxcbiAgICAnbGlzdC1hbHQnLFxuICAgICdsb2NrJyxcbiAgICAnZmxhZycsXG4gICAgJ2hlYWRwaG9uZXMnLFxuICAgICd2b2x1bWUtb2ZmJyxcbiAgICAndm9sdW1lLWRvd24nLFxuICAgICd2b2x1bWUtdXAnLFxuICAgICdxcmNvZGUnLFxuICAgICdiYXJjb2RlJyxcbiAgICAndGFnJyxcbiAgICAndGFncycsXG4gICAgJ2Jvb2snLFxuICAgICdib29rbWFyaycsXG4gICAgJ3ByaW50JyxcbiAgICAnY2FtZXJhJyxcbiAgICAnZm9udCcsXG4gICAgJ2JvbGQnLFxuICAgICdpdGFsaWMnLFxuICAgICd0ZXh0LWhlaWdodCcsXG4gICAgJ3RleHQtd2lkdGgnLFxuICAgICdhbGlnbi1sZWZ0JyxcbiAgICAnYWxpZ24tY2VudGVyJyxcbiAgICAnYWxpZ24tcmlnaHQnLFxuICAgICdhbGlnbi1qdXN0aWZ5JyxcbiAgICAnbGlzdCcsXG4gICAgJ2luZGVudC1sZWZ0JyxcbiAgICAnaW5kZW50LXJpZ2h0JyxcbiAgICAnZmFjZXRpbWUtdmlkZW8nLFxuICAgICdwaWN0dXJlJyxcbiAgICAnbWFwLW1hcmtlcicsXG4gICAgJ2FkanVzdCcsXG4gICAgJ3RpbnQnLFxuICAgICdlZGl0JyxcbiAgICAnc2hhcmUnLFxuICAgICdjaGVjaycsXG4gICAgJ21vdmUnLFxuICAgICdzdGVwLWJhY2t3YXJkJyxcbiAgICAnZmFzdC1iYWNrd2FyZCcsXG4gICAgJ2JhY2t3YXJkJyxcbiAgICAncGxheScsXG4gICAgJ3BhdXNlJyxcbiAgICAnc3RvcCcsXG4gICAgJ2ZvcndhcmQnLFxuICAgICdmYXN0LWZvcndhcmQnLFxuICAgICdzdGVwLWZvcndhcmQnLFxuICAgICdlamVjdCcsXG4gICAgJ2NoZXZyb24tbGVmdCcsXG4gICAgJ2NoZXZyb24tcmlnaHQnLFxuICAgICdwbHVzLXNpZ24nLFxuICAgICdtaW51cy1zaWduJyxcbiAgICAncmVtb3ZlLXNpZ24nLFxuICAgICdvay1zaWduJyxcbiAgICAncXVlc3Rpb24tc2lnbicsXG4gICAgJ2luZm8tc2lnbicsXG4gICAgJ3NjcmVlbnNob3QnLFxuICAgICdyZW1vdmUtY2lyY2xlJyxcbiAgICAnb2stY2lyY2xlJyxcbiAgICAnYmFuLWNpcmNsZScsXG4gICAgJ2Fycm93LWxlZnQnLFxuICAgICdhcnJvdy1yaWdodCcsXG4gICAgJ2Fycm93LXVwJyxcbiAgICAnYXJyb3ctZG93bicsXG4gICAgJ3NoYXJlLWFsdCcsXG4gICAgJ3Jlc2l6ZS1mdWxsJyxcbiAgICAncmVzaXplLXNtYWxsJyxcbiAgICAnZXhjbGFtYXRpb24tc2lnbicsXG4gICAgJ2dpZnQnLFxuICAgICdsZWFmJyxcbiAgICAnZmlyZScsXG4gICAgJ2V5ZS1vcGVuJyxcbiAgICAnZXllLWNsb3NlJyxcbiAgICAnd2FybmluZy1zaWduJyxcbiAgICAncGxhbmUnLFxuICAgICdjYWxlbmRhcicsXG4gICAgJ3JhbmRvbScsXG4gICAgJ2NvbW1lbnQnLFxuICAgICdtYWduZXQnLFxuICAgICdjaGV2cm9uLXVwJyxcbiAgICAnY2hldnJvbi1kb3duJyxcbiAgICAncmV0d2VldCcsXG4gICAgJ3Nob3BwaW5nLWNhcnQnLFxuICAgICdmb2xkZXItY2xvc2UnLFxuICAgICdmb2xkZXItb3BlbicsXG4gICAgJ3Jlc2l6ZS12ZXJ0aWNhbCcsXG4gICAgJ3Jlc2l6ZS1ob3Jpem9udGFsJyxcbiAgICAnaGRkJyxcbiAgICAnYnVsbGhvcm4nLFxuICAgICdiZWxsJyxcbiAgICAnY2VydGlmaWNhdGUnLFxuICAgICd0aHVtYnMtdXAnLFxuICAgICd0aHVtYnMtZG93bicsXG4gICAgJ2hhbmQtcmlnaHQnLFxuICAgICdoYW5kLWxlZnQnLFxuICAgICdoYW5kLXVwJyxcbiAgICAnaGFuZC1kb3duJyxcbiAgICAnY2lyY2xlLWFycm93LXJpZ2h0JyxcbiAgICAnY2lyY2xlLWFycm93LWxlZnQnLFxuICAgICdjaXJjbGUtYXJyb3ctdXAnLFxuICAgICdjaXJjbGUtYXJyb3ctZG93bicsXG4gICAgJ2dsb2JlJyxcbiAgICAnd3JlbmNoJyxcbiAgICAndGFza3MnLFxuICAgICdmaWx0ZXInLFxuICAgICdicmllZmNhc2UnLFxuICAgICdmdWxsc2NyZWVuJyxcbiAgICAnZGFzaGJvYXJkJyxcbiAgICAncGFwZXJjbGlwJyxcbiAgICAnaGVhcnQtZW1wdHknLFxuICAgICdsaW5rJyxcbiAgICAncGhvbmUnLFxuICAgICdwdXNocGluJyxcbiAgICAndXNkJyxcbiAgICAnZ2JwJyxcbiAgICAnc29ydCcsXG4gICAgJ3NvcnQtYnktYWxwaGFiZXQnLFxuICAgICdzb3J0LWJ5LWFscGhhYmV0LWFsdCcsXG4gICAgJ3NvcnQtYnktb3JkZXInLFxuICAgICdzb3J0LWJ5LW9yZGVyLWFsdCcsXG4gICAgJ3NvcnQtYnktYXR0cmlidXRlcycsXG4gICAgJ3NvcnQtYnktYXR0cmlidXRlcy1hbHQnLFxuICAgICd1bmNoZWNrZWQnLFxuICAgICdleHBhbmQnLFxuICAgICdjb2xsYXBzZS1kb3duJyxcbiAgICAnY29sbGFwc2UtdXAnLFxuICAgICdsb2ctaW4nLFxuICAgICdmbGFzaCcsXG4gICAgJ2xvZy1vdXQnLFxuICAgICduZXctd2luZG93JyxcbiAgICAncmVjb3JkJyxcbiAgICAnc2F2ZScsXG4gICAgJ29wZW4nLFxuICAgICdzYXZlZCcsXG4gICAgJ2ltcG9ydCcsXG4gICAgJ2V4cG9ydCcsXG4gICAgJ3NlbmQnLFxuICAgICdmbG9wcHktZGlzaycsXG4gICAgJ2Zsb3BweS1zYXZlZCcsXG4gICAgJ2Zsb3BweS1yZW1vdmUnLFxuICAgICdmbG9wcHktc2F2ZScsXG4gICAgJ2Zsb3BweS1vcGVuJyxcbiAgICAnY3JlZGl0LWNhcmQnLFxuICAgICd0cmFuc2ZlcicsXG4gICAgJ2N1dGxlcnknLFxuICAgICdoZWFkZXInLFxuICAgICdjb21wcmVzc2VkJyxcbiAgICAnZWFycGhvbmUnLFxuICAgICdwaG9uZS1hbHQnLFxuICAgICd0b3dlcicsXG4gICAgJ3N0YXRzJyxcbiAgICAnc2QtdmlkZW8nLFxuICAgICdoZC12aWRlbycsXG4gICAgJ3N1YnRpdGxlcycsXG4gICAgJ3NvdW5kLXN0ZXJlbycsXG4gICAgJ3NvdW5kLWRvbGJ5JyxcbiAgICAnc291bmQtNS0xJyxcbiAgICAnc291bmQtNi0xJyxcbiAgICAnc291bmQtNy0xJyxcbiAgICAnY29weXJpZ2h0LW1hcmsnLFxuICAgICdyZWdpc3RyYXRpb24tbWFyaycsXG4gICAgJ2Nsb3VkLWRvd25sb2FkJyxcbiAgICAnY2xvdWQtdXBsb2FkJyxcbiAgICAndHJlZS1jb25pZmVyJyxcbiAgICAndHJlZS1kZWNpZHVvdXMnXG4gIF1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgQWNjb3JkaW9uOiByZXF1aXJlKCcuL0FjY29yZGlvbicpLFxuICBBZmZpeDogcmVxdWlyZSgnLi9BZmZpeCcpLFxuICBBZmZpeE1peGluOiByZXF1aXJlKCcuL0FmZml4TWl4aW4nKSxcbiAgQWxlcnQ6IHJlcXVpcmUoJy4vQWxlcnQnKSxcbiAgQm9vdHN0cmFwTWl4aW46IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKSxcbiAgQmFkZ2U6IHJlcXVpcmUoJy4vQmFkZ2UnKSxcbiAgQnV0dG9uOiByZXF1aXJlKCcuL0J1dHRvbicpLFxuICBCdXR0b25Hcm91cDogcmVxdWlyZSgnLi9CdXR0b25Hcm91cCcpLFxuICBCdXR0b25Ub29sYmFyOiByZXF1aXJlKCcuL0J1dHRvblRvb2xiYXInKSxcbiAgQ2Fyb3VzZWw6IHJlcXVpcmUoJy4vQ2Fyb3VzZWwnKSxcbiAgQ2Fyb3VzZWxJdGVtOiByZXF1aXJlKCcuL0Nhcm91c2VsSXRlbScpLFxuICBDb2w6IHJlcXVpcmUoJy4vQ29sJyksXG4gIENvbGxhcHNhYmxlTWl4aW46IHJlcXVpcmUoJy4vQ29sbGFwc2FibGVNaXhpbicpLFxuICBEcm9wZG93bkJ1dHRvbjogcmVxdWlyZSgnLi9Ecm9wZG93bkJ1dHRvbicpLFxuICBEcm9wZG93bk1lbnU6IHJlcXVpcmUoJy4vRHJvcGRvd25NZW51JyksXG4gIERyb3Bkb3duU3RhdGVNaXhpbjogcmVxdWlyZSgnLi9Ecm9wZG93blN0YXRlTWl4aW4nKSxcbiAgRmFkZU1peGluOiByZXF1aXJlKCcuL0ZhZGVNaXhpbicpLFxuICBHbHlwaGljb246IHJlcXVpcmUoJy4vR2x5cGhpY29uJyksXG4gIEdyaWQ6IHJlcXVpcmUoJy4vR3JpZCcpLFxuICBJbnB1dDogcmVxdWlyZSgnLi9JbnB1dCcpLFxuICBJbnRlcnBvbGF0ZTogcmVxdWlyZSgnLi9JbnRlcnBvbGF0ZScpLFxuICBKdW1ib3Ryb246IHJlcXVpcmUoJy4vSnVtYm90cm9uJyksXG4gIExhYmVsOiByZXF1aXJlKCcuL0xhYmVsJyksXG4gIE1lbnVJdGVtOiByZXF1aXJlKCcuL01lbnVJdGVtJyksXG4gIE1vZGFsOiByZXF1aXJlKCcuL01vZGFsJyksXG4gIE5hdjogcmVxdWlyZSgnLi9OYXYnKSxcbiAgTmF2YmFyOiByZXF1aXJlKCcuL05hdmJhcicpLFxuICBOYXZJdGVtOiByZXF1aXJlKCcuL05hdkl0ZW0nKSxcbiAgTW9kYWxUcmlnZ2VyOiByZXF1aXJlKCcuL01vZGFsVHJpZ2dlcicpLFxuICBPdmVybGF5VHJpZ2dlcjogcmVxdWlyZSgnLi9PdmVybGF5VHJpZ2dlcicpLFxuICBPdmVybGF5TWl4aW46IHJlcXVpcmUoJy4vT3ZlcmxheU1peGluJyksXG4gIFBhZ2VIZWFkZXI6IHJlcXVpcmUoJy4vUGFnZUhlYWRlcicpLFxuICBQYW5lbDogcmVxdWlyZSgnLi9QYW5lbCcpLFxuICBQYW5lbEdyb3VwOiByZXF1aXJlKCcuL1BhbmVsR3JvdXAnKSxcbiAgUGFnZUl0ZW06IHJlcXVpcmUoJy4vUGFnZUl0ZW0nKSxcbiAgUGFnZXI6IHJlcXVpcmUoJy4vUGFnZXInKSxcbiAgUG9wb3ZlcjogcmVxdWlyZSgnLi9Qb3BvdmVyJyksXG4gIFByb2dyZXNzQmFyOiByZXF1aXJlKCcuL1Byb2dyZXNzQmFyJyksXG4gIFJvdzogcmVxdWlyZSgnLi9Sb3cnKSxcbiAgU3BsaXRCdXR0b246IHJlcXVpcmUoJy4vU3BsaXRCdXR0b24nKSxcbiAgU3ViTmF2OiByZXF1aXJlKCcuL1N1Yk5hdicpLFxuICBUYWJiZWRBcmVhOiByZXF1aXJlKCcuL1RhYmJlZEFyZWEnKSxcbiAgVGFibGU6IHJlcXVpcmUoJy4vVGFibGUnKSxcbiAgVGFiUGFuZTogcmVxdWlyZSgnLi9UYWJQYW5lJyksXG4gIFRvb2x0aXA6IHJlcXVpcmUoJy4vVG9vbHRpcCcpLFxuICBXZWxsOiByZXF1aXJlKCcuL1dlbGwnKVxufTsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxudmFyIEN1c3RvbVByb3BUeXBlcyA9IHtcbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgcHJvcCBpcyBhIHZhbGlkIFJlYWN0IGNsYXNzXG4gICAqXG4gICAqIEBwYXJhbSBwcm9wc1xuICAgKiBAcGFyYW0gcHJvcE5hbWVcbiAgICogQHBhcmFtIGNvbXBvbmVudE5hbWVcbiAgICogQHJldHVybnMge0Vycm9yfHVuZGVmaW5lZH1cbiAgICovXG4gIGNvbXBvbmVudENsYXNzOiBmdW5jdGlvbiAocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lKSB7XG4gICAgaWYgKCFSZWFjdC5pc1ZhbGlkQ2xhc3MocHJvcHNbcHJvcE5hbWVdKSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignSW52YWxpZCBgJyArIHByb3BOYW1lICsgJ2AgcHJvcCBpbiBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYmUgJyArXG4gICAgICAgICdhIHZhbGlkIFJlYWN0IGNsYXNzJyk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBhIHByb3AgcHJvdmlkZXMgYSBET00gZWxlbWVudFxuICAgKlxuICAgKiBUaGUgZWxlbWVudCBjYW4gYmUgcHJvdmlkZWQgaW4gdHdvIGZvcm1zOlxuICAgKiAtIERpcmVjdGx5IHBhc3NlZFxuICAgKiAtIE9yIHBhc3NlZCBhbiBvYmplY3Qgd2hpY2ggaGFzIGEgYGdldERPTU5vZGVgIG1ldGhvZCB3aGljaCB3aWxsIHJldHVybiB0aGUgcmVxdWlyZWQgRE9NIGVsZW1lbnRcbiAgICpcbiAgICogQHBhcmFtIHByb3BzXG4gICAqIEBwYXJhbSBwcm9wTmFtZVxuICAgKiBAcGFyYW0gY29tcG9uZW50TmFtZVxuICAgKiBAcmV0dXJucyB7RXJyb3J8dW5kZWZpbmVkfVxuICAgKi9cbiAgbW91bnRhYmxlOiBmdW5jdGlvbiAocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBwcm9wc1twcm9wTmFtZV0gIT09ICdvYmplY3QnIHx8XG4gICAgICB0eXBlb2YgcHJvcHNbcHJvcE5hbWVdLmdldERPTU5vZGUgIT09ICdmdW5jdGlvbicgJiYgcHJvcHNbcHJvcE5hbWVdLm5vZGVUeXBlICE9PSAxKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdJbnZhbGlkIGAnICsgcHJvcE5hbWUgKyAnYCBwcm9wIGluIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBiZSAnICtcbiAgICAgICAgJ2EgRE9NIGVsZW1lbnQgb3IgYW4gb2JqZWN0IHRoYXQgaGFzIGEgYGdldERPTU5vZGVgIG1ldGhvZCcpO1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDdXN0b21Qcm9wVHlwZXM7IiwiLyoqXG4gKiBSZWFjdCBFdmVudExpc3RlbmVyLmxpc3RlblxuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy92ZW5kb3Ivc3R1YnMvRXZlbnRMaXN0ZW5lci5qc1xuICpcbiAqIFRPRE86IHJlbW92ZSBpbiBmYXZvdXIgb2Ygc29sdXRpb24gcHJvdmlkZWQgYnk6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy8yODVcbiAqL1xuXG4vKipcbiAqIERvZXMgbm90IHRha2UgaW50byBhY2NvdW50IHNwZWNpZmljIG5hdHVyZSBvZiBwbGF0Zm9ybS5cbiAqL1xudmFyIEV2ZW50TGlzdGVuZXIgPSB7XG4gIC8qKlxuICAgKiBMaXN0ZW4gdG8gRE9NIGV2ZW50cyBkdXJpbmcgdGhlIGJ1YmJsZSBwaGFzZS5cbiAgICpcbiAgICogQHBhcmFtIHtET01FdmVudFRhcmdldH0gdGFyZ2V0IERPTSBlbGVtZW50IHRvIHJlZ2lzdGVyIGxpc3RlbmVyIG9uLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIEV2ZW50IHR5cGUsIGUuZy4gJ2NsaWNrJyBvciAnbW91c2VvdmVyJy5cbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24uXG4gICAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IHdpdGggYSBgcmVtb3ZlYCBtZXRob2QuXG4gICAqL1xuICBsaXN0ZW46IGZ1bmN0aW9uKHRhcmdldCwgZXZlbnRUeXBlLCBjYWxsYmFjaykge1xuICAgIGlmICh0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0YXJnZXQuYXR0YWNoRXZlbnQpIHtcbiAgICAgIHRhcmdldC5hdHRhY2hFdmVudCgnb24nICsgZXZlbnRUeXBlLCBjYWxsYmFjayk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRhcmdldC5kZXRhY2hFdmVudCgnb24nICsgZXZlbnRUeXBlLCBjYWxsYmFjayk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50TGlzdGVuZXI7XG4iLCIvKipcbiAqIFJlYWN0IFRyYW5zaXRpb25FdmVudHNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGEgbW9kaWZpZWQgdmVyc2lvbiBvZjpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvYWRkb25zL3RyYW5zaXRpb25zL1JlYWN0VHJhbnNpdGlvbkV2ZW50cy5qc1xuICpcbiAqL1xuXG52YXIgY2FuVXNlRE9NID0gISEoXG4gIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgd2luZG93LmRvY3VtZW50ICYmXG4gICAgd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnRcbiAgKTtcblxuLyoqXG4gKiBFVkVOVF9OQU1FX01BUCBpcyB1c2VkIHRvIGRldGVybWluZSB3aGljaCBldmVudCBmaXJlZCB3aGVuIGFcbiAqIHRyYW5zaXRpb24vYW5pbWF0aW9uIGVuZHMsIGJhc2VkIG9uIHRoZSBzdHlsZSBwcm9wZXJ0eSB1c2VkIHRvXG4gKiBkZWZpbmUgdGhhdCBldmVudC5cbiAqL1xudmFyIEVWRU5UX05BTUVfTUFQID0ge1xuICB0cmFuc2l0aW9uZW5kOiB7XG4gICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXG4gICAgJ01velRyYW5zaXRpb24nOiAnbW96VHJhbnNpdGlvbkVuZCcsXG4gICAgJ09UcmFuc2l0aW9uJzogJ29UcmFuc2l0aW9uRW5kJyxcbiAgICAnbXNUcmFuc2l0aW9uJzogJ01TVHJhbnNpdGlvbkVuZCdcbiAgfSxcblxuICBhbmltYXRpb25lbmQ6IHtcbiAgICAnYW5pbWF0aW9uJzogJ2FuaW1hdGlvbmVuZCcsXG4gICAgJ1dlYmtpdEFuaW1hdGlvbic6ICd3ZWJraXRBbmltYXRpb25FbmQnLFxuICAgICdNb3pBbmltYXRpb24nOiAnbW96QW5pbWF0aW9uRW5kJyxcbiAgICAnT0FuaW1hdGlvbic6ICdvQW5pbWF0aW9uRW5kJyxcbiAgICAnbXNBbmltYXRpb24nOiAnTVNBbmltYXRpb25FbmQnXG4gIH1cbn07XG5cbnZhciBlbmRFdmVudHMgPSBbXTtcblxuZnVuY3Rpb24gZGV0ZWN0RXZlbnRzKCkge1xuICB2YXIgdGVzdEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzdHlsZSA9IHRlc3RFbC5zdHlsZTtcblxuICAvLyBPbiBzb21lIHBsYXRmb3JtcywgaW4gcGFydGljdWxhciBzb21lIHJlbGVhc2VzIG9mIEFuZHJvaWQgNC54LFxuICAvLyB0aGUgdW4tcHJlZml4ZWQgXCJhbmltYXRpb25cIiBhbmQgXCJ0cmFuc2l0aW9uXCIgcHJvcGVydGllcyBhcmUgZGVmaW5lZCBvbiB0aGVcbiAgLy8gc3R5bGUgb2JqZWN0IGJ1dCB0aGUgZXZlbnRzIHRoYXQgZmlyZSB3aWxsIHN0aWxsIGJlIHByZWZpeGVkLCBzbyB3ZSBuZWVkXG4gIC8vIHRvIGNoZWNrIGlmIHRoZSB1bi1wcmVmaXhlZCBldmVudHMgYXJlIHVzZWFibGUsIGFuZCBpZiBub3QgcmVtb3ZlIHRoZW1cbiAgLy8gZnJvbSB0aGUgbWFwXG4gIGlmICghKCdBbmltYXRpb25FdmVudCcgaW4gd2luZG93KSkge1xuICAgIGRlbGV0ZSBFVkVOVF9OQU1FX01BUC5hbmltYXRpb25lbmQuYW5pbWF0aW9uO1xuICB9XG5cbiAgaWYgKCEoJ1RyYW5zaXRpb25FdmVudCcgaW4gd2luZG93KSkge1xuICAgIGRlbGV0ZSBFVkVOVF9OQU1FX01BUC50cmFuc2l0aW9uZW5kLnRyYW5zaXRpb247XG4gIH1cblxuICBmb3IgKHZhciBiYXNlRXZlbnROYW1lIGluIEVWRU5UX05BTUVfTUFQKSB7XG4gICAgdmFyIGJhc2VFdmVudHMgPSBFVkVOVF9OQU1FX01BUFtiYXNlRXZlbnROYW1lXTtcbiAgICBmb3IgKHZhciBzdHlsZU5hbWUgaW4gYmFzZUV2ZW50cykge1xuICAgICAgaWYgKHN0eWxlTmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBlbmRFdmVudHMucHVzaChiYXNlRXZlbnRzW3N0eWxlTmFtZV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuaWYgKGNhblVzZURPTSkge1xuICBkZXRlY3RFdmVudHMoKTtcbn1cblxuLy8gV2UgdXNlIHRoZSByYXcge2FkZHxyZW1vdmV9RXZlbnRMaXN0ZW5lcigpIGNhbGwgYmVjYXVzZSBFdmVudExpc3RlbmVyXG4vLyBkb2VzIG5vdCBrbm93IGhvdyB0byByZW1vdmUgZXZlbnQgbGlzdGVuZXJzIGFuZCB3ZSByZWFsbHkgc2hvdWxkXG4vLyBjbGVhbiB1cC4gQWxzbywgdGhlc2UgZXZlbnRzIGFyZSBub3QgdHJpZ2dlcmVkIGluIG9sZGVyIGJyb3dzZXJzXG4vLyBzbyB3ZSBzaG91bGQgYmUgQS1PSyBoZXJlLlxuXG5mdW5jdGlvbiBhZGRFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lcikge1xuICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnROYW1lLCBldmVudExpc3RlbmVyKSB7XG4gIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbn1cblxudmFyIFJlYWN0VHJhbnNpdGlvbkV2ZW50cyA9IHtcbiAgYWRkRW5kRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24obm9kZSwgZXZlbnRMaXN0ZW5lcikge1xuICAgIGlmIChlbmRFdmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBJZiBDU1MgdHJhbnNpdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQsIHRyaWdnZXIgYW4gXCJlbmQgYW5pbWF0aW9uXCJcbiAgICAgIC8vIGV2ZW50IGltbWVkaWF0ZWx5LlxuICAgICAgd2luZG93LnNldFRpbWVvdXQoZXZlbnRMaXN0ZW5lciwgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVuZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVuZEV2ZW50KSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKG5vZGUsIGVuZEV2ZW50LCBldmVudExpc3RlbmVyKTtcbiAgICB9KTtcbiAgfSxcblxuICByZW1vdmVFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0VHJhbnNpdGlvbkV2ZW50cztcbiIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG4vKipcbiAqIE1hcHMgY2hpbGRyZW4gdGhhdCBhcmUgdHlwaWNhbGx5IHNwZWNpZmllZCBhcyBgcHJvcHMuY2hpbGRyZW5gLFxuICogYnV0IG9ubHkgaXRlcmF0ZXMgb3ZlciBjaGlsZHJlbiB0aGF0IGFyZSBcInZhbGlkIGNvbXBvbmVudHNcIi5cbiAqXG4gKiBUaGUgbWFwRnVuY3Rpb24gcHJvdmlkZWQgaW5kZXggd2lsbCBiZSBub3JtYWxpc2VkIHRvIHRoZSBjb21wb25lbnRzIG1hcHBlZCxcbiAqIHNvIGFuIGludmFsaWQgY29tcG9uZW50IHdvdWxkIG5vdCBpbmNyZWFzZSB0aGUgaW5kZXguXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIGludCl9IG1hcEZ1bmN0aW9uLlxuICogQHBhcmFtIHsqfSBtYXBDb250ZXh0IENvbnRleHQgZm9yIG1hcEZ1bmN0aW9uLlxuICogQHJldHVybiB7b2JqZWN0fSBPYmplY3QgY29udGFpbmluZyB0aGUgb3JkZXJlZCBtYXAgb2YgcmVzdWx0cy5cbiAqL1xuZnVuY3Rpb24gbWFwVmFsaWRDb21wb25lbnRzKGNoaWxkcmVuLCBmdW5jLCBjb250ZXh0KSB7XG4gIHZhciBpbmRleCA9IDA7XG5cbiAgcmV0dXJuIFJlYWN0LkNoaWxkcmVuLm1hcChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7XG4gICAgICB2YXIgbGFzdEluZGV4ID0gaW5kZXg7XG4gICAgICBpbmRleCsrO1xuICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCBjaGlsZCwgbGFzdEluZGV4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQ7XG4gIH0pO1xufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggY2hpbGRyZW4gdGhhdCBhcmUgdHlwaWNhbGx5IHNwZWNpZmllZCBhcyBgcHJvcHMuY2hpbGRyZW5gLFxuICogYnV0IG9ubHkgaXRlcmF0ZXMgb3ZlciBjaGlsZHJlbiB0aGF0IGFyZSBcInZhbGlkIGNvbXBvbmVudHNcIi5cbiAqXG4gKiBUaGUgcHJvdmlkZWQgZm9yRWFjaEZ1bmMoY2hpbGQsIGluZGV4KSB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaFxuICogbGVhZiBjaGlsZCB3aXRoIHRoZSBpbmRleCByZWZsZWN0aW5nIHRoZSBwb3NpdGlvbiByZWxhdGl2ZSB0byBcInZhbGlkIGNvbXBvbmVudHNcIi5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgaW50KX0gZm9yRWFjaEZ1bmMuXG4gKiBAcGFyYW0geyp9IGZvckVhY2hDb250ZXh0IENvbnRleHQgZm9yIGZvckVhY2hDb250ZXh0LlxuICovXG5mdW5jdGlvbiBmb3JFYWNoVmFsaWRDb21wb25lbnRzKGNoaWxkcmVuLCBmdW5jLCBjb250ZXh0KSB7XG4gIHZhciBpbmRleCA9IDA7XG5cbiAgcmV0dXJuIFJlYWN0LkNoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkge1xuICAgICAgZnVuYy5jYWxsKGNvbnRleHQsIGNoaWxkLCBpbmRleCk7XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogQ291bnQgdGhlIG51bWJlciBvZiBcInZhbGlkIGNvbXBvbmVudHNcIiBpbiB0aGUgQ2hpbGRyZW4gY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gbnVtYmVyT2ZWYWxpZENvbXBvbmVudHMoY2hpbGRyZW4pIHtcbiAgdmFyIGNvdW50ID0gMDtcblxuICBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHsgY291bnQrKzsgfVxuICB9KTtcblxuICByZXR1cm4gY291bnQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIHRoZSBDaGlsZCBjb250YWluZXIgaGFzIG9uZSBvciBtb3JlIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGhhc1ZhbGlkQ29tcG9uZW50KGNoaWxkcmVuKSB7XG4gIHZhciBoYXNWYWxpZCA9IGZhbHNlO1xuXG4gIFJlYWN0LkNoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmICghaGFzVmFsaWQgJiYgUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHtcbiAgICAgIGhhc1ZhbGlkID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBoYXNWYWxpZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1hcDogbWFwVmFsaWRDb21wb25lbnRzLFxuICBmb3JFYWNoOiBmb3JFYWNoVmFsaWRDb21wb25lbnRzLFxuICBudW1iZXJPZjogbnVtYmVyT2ZWYWxpZENvbXBvbmVudHMsXG4gIGhhc1ZhbGlkQ29tcG9uZW50OiBoYXNWYWxpZENvbXBvbmVudFxufTsiLCIvKipcbiAqIFJlYWN0IGNsYXNzU2V0XG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBpcyB1bm1vZGlmaWVkIGZyb206XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3ZlbmRvci9zdHVicy9jeC5qc1xuICpcbiAqL1xuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byBtYXJrIHN0cmluZyBsaXRlcmFscyByZXByZXNlbnRpbmcgQ1NTIGNsYXNzIG5hbWVzXG4gKiBzbyB0aGF0IHRoZXkgY2FuIGJlIHRyYW5zZm9ybWVkIHN0YXRpY2FsbHkuIFRoaXMgYWxsb3dzIGZvciBtb2R1bGFyaXphdGlvblxuICogYW5kIG1pbmlmaWNhdGlvbiBvZiBDU1MgY2xhc3MgbmFtZXMuXG4gKlxuICogSW4gc3RhdGljX3Vwc3RyZWFtLCB0aGlzIGZ1bmN0aW9uIGlzIGFjdHVhbGx5IGltcGxlbWVudGVkLCBidXQgaXQgc2hvdWxkXG4gKiBldmVudHVhbGx5IGJlIHJlcGxhY2VkIHdpdGggc29tZXRoaW5nIG1vcmUgZGVzY3JpcHRpdmUsIGFuZCB0aGUgdHJhbnNmb3JtXG4gKiB0aGF0IGlzIHVzZWQgaW4gdGhlIG1haW4gc3RhY2sgc2hvdWxkIGJlIHBvcnRlZCBmb3IgdXNlIGVsc2V3aGVyZS5cbiAqXG4gKiBAcGFyYW0gc3RyaW5nfG9iamVjdCBjbGFzc05hbWUgdG8gbW9kdWxhcml6ZSwgb3IgYW4gb2JqZWN0IG9mIGtleS92YWx1ZXMuXG4gKiAgICAgICAgICAgICAgICAgICAgICBJbiB0aGUgb2JqZWN0IGNhc2UsIHRoZSB2YWx1ZXMgYXJlIGNvbmRpdGlvbnMgdGhhdFxuICogICAgICAgICAgICAgICAgICAgICAgZGV0ZXJtaW5lIGlmIHRoZSBjbGFzc05hbWUga2V5cyBzaG91bGQgYmUgaW5jbHVkZWQuXG4gKiBAcGFyYW0gW3N0cmluZyAuLi5dICBWYXJpYWJsZSBsaXN0IG9mIGNsYXNzTmFtZXMgaW4gdGhlIHN0cmluZyBjYXNlLlxuICogQHJldHVybiBzdHJpbmcgICAgICAgUmVuZGVyYWJsZSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzTmFtZS5cbiAqL1xuZnVuY3Rpb24gY3goY2xhc3NOYW1lcykge1xuICBpZiAodHlwZW9mIGNsYXNzTmFtZXMgPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoY2xhc3NOYW1lcykuZmlsdGVyKGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgcmV0dXJuIGNsYXNzTmFtZXNbY2xhc3NOYW1lXTtcbiAgICB9KS5qb2luKCcgJyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzLCAnICcpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3g7IiwiLyoqXG4gKiBSZWFjdCBjbG9uZVdpdGhQcm9wc1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgbW9kaWZpZWQgdmVyc2lvbnMgb2Y6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3V0aWxzL2Nsb25lV2l0aFByb3BzLmpzXG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL2NvcmUvUmVhY3RQcm9wVHJhbnNmZXJlci5qc1xuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy91dGlscy9qb2luQ2xhc3Nlcy5qc1xuICpcbiAqIFRPRE86IFRoaXMgc2hvdWxkIGJlIHJlcGxhY2VkIGFzIHNvb24gYXMgY2xvbmVXaXRoUHJvcHMgaXMgYXZhaWxhYmxlIHZpYVxuICogIHRoZSBjb3JlIFJlYWN0IHBhY2thZ2Ugb3IgYSBzZXBhcmF0ZSBwYWNrYWdlLlxuICogIEBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2lzc3Vlcy8xOTA2XG4gKlxuICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnLi9tZXJnZScpO1xuXG4vKipcbiAqIENvbWJpbmVzIG11bHRpcGxlIGNsYXNzTmFtZSBzdHJpbmdzIGludG8gb25lLlxuICogaHR0cDovL2pzcGVyZi5jb20vam9pbmNsYXNzZXMtYXJncy12cy1hcnJheVxuICpcbiAqIEBwYXJhbSB7Li4uP3N0cmluZ30gY2xhc3Nlc1xuICogQHJldHVybiB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBqb2luQ2xhc3NlcyhjbGFzc05hbWUvKiwgLi4uICovKSB7XG4gIGlmICghY2xhc3NOYW1lKSB7XG4gICAgY2xhc3NOYW1lID0gJyc7XG4gIH1cbiAgdmFyIG5leHRDbGFzcztcbiAgdmFyIGFyZ0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIGlmIChhcmdMZW5ndGggPiAxKSB7XG4gICAgZm9yICh2YXIgaWkgPSAxOyBpaSA8IGFyZ0xlbmd0aDsgaWkrKykge1xuICAgICAgbmV4dENsYXNzID0gYXJndW1lbnRzW2lpXTtcbiAgICAgIG5leHRDbGFzcyAmJiAoY2xhc3NOYW1lICs9ICcgJyArIG5leHRDbGFzcyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHRyYW5zZmVyIHN0cmF0ZWd5IHRoYXQgd2lsbCBtZXJnZSBwcm9wIHZhbHVlcyB1c2luZyB0aGUgc3VwcGxpZWRcbiAqIGBtZXJnZVN0cmF0ZWd5YC4gSWYgYSBwcm9wIHdhcyBwcmV2aW91c2x5IHVuc2V0LCB0aGlzIGp1c3Qgc2V0cyBpdC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBtZXJnZVN0cmF0ZWd5XG4gKiBAcmV0dXJuIHtmdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlVHJhbnNmZXJTdHJhdGVneShtZXJnZVN0cmF0ZWd5KSB7XG4gIHJldHVybiBmdW5jdGlvbihwcm9wcywga2V5LCB2YWx1ZSkge1xuICAgIGlmICghcHJvcHMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcHJvcHNba2V5XSA9IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9wc1trZXldID0gbWVyZ2VTdHJhdGVneShwcm9wc1trZXldLCB2YWx1ZSk7XG4gICAgfVxuICB9O1xufVxuXG52YXIgdHJhbnNmZXJTdHJhdGVneU1lcmdlID0gY3JlYXRlVHJhbnNmZXJTdHJhdGVneShmdW5jdGlvbihhLCBiKSB7XG4gIC8vIGBtZXJnZWAgb3ZlcnJpZGVzIHRoZSBmaXJzdCBvYmplY3QncyAoYHByb3BzW2tleV1gIGFib3ZlKSBrZXlzIHVzaW5nIHRoZVxuICAvLyBzZWNvbmQgb2JqZWN0J3MgKGB2YWx1ZWApIGtleXMuIEFuIG9iamVjdCdzIHN0eWxlJ3MgZXhpc3RpbmcgYHByb3BBYCB3b3VsZFxuICAvLyBnZXQgb3ZlcnJpZGRlbi4gRmxpcCB0aGUgb3JkZXIgaGVyZS5cbiAgcmV0dXJuIG1lcmdlKGIsIGEpO1xufSk7XG5cbmZ1bmN0aW9uIGVtcHR5RnVuY3Rpb24oKSB7fVxuXG4vKipcbiAqIFRyYW5zZmVyIHN0cmF0ZWdpZXMgZGljdGF0ZSBob3cgcHJvcHMgYXJlIHRyYW5zZmVycmVkIGJ5IGB0cmFuc2ZlclByb3BzVG9gLlxuICogTk9URTogaWYgeW91IGFkZCBhbnkgbW9yZSBleGNlcHRpb25zIHRvIHRoaXMgbGlzdCB5b3Ugc2hvdWxkIGJlIHN1cmUgdG9cbiAqIHVwZGF0ZSBgY2xvbmVXaXRoUHJvcHMoKWAgYWNjb3JkaW5nbHkuXG4gKi9cbnZhciBUcmFuc2ZlclN0cmF0ZWdpZXMgPSB7XG4gIC8qKlxuICAgKiBOZXZlciB0cmFuc2ZlciBgY2hpbGRyZW5gLlxuICAgKi9cbiAgY2hpbGRyZW46IGVtcHR5RnVuY3Rpb24sXG4gIC8qKlxuICAgKiBUcmFuc2ZlciB0aGUgYGNsYXNzTmFtZWAgcHJvcCBieSBtZXJnaW5nIHRoZW0uXG4gICAqL1xuICBjbGFzc05hbWU6IGNyZWF0ZVRyYW5zZmVyU3RyYXRlZ3koam9pbkNsYXNzZXMpLFxuICAvKipcbiAgICogTmV2ZXIgdHJhbnNmZXIgdGhlIGBrZXlgIHByb3AuXG4gICAqL1xuICBrZXk6IGVtcHR5RnVuY3Rpb24sXG4gIC8qKlxuICAgKiBOZXZlciB0cmFuc2ZlciB0aGUgYHJlZmAgcHJvcC5cbiAgICovXG4gIHJlZjogZW1wdHlGdW5jdGlvbixcbiAgLyoqXG4gICAqIFRyYW5zZmVyIHRoZSBgc3R5bGVgIHByb3AgKHdoaWNoIGlzIGFuIG9iamVjdCkgYnkgbWVyZ2luZyB0aGVtLlxuICAgKi9cbiAgc3R5bGU6IHRyYW5zZmVyU3RyYXRlZ3lNZXJnZVxufTtcblxuLyoqXG4gKiBNdXRhdGVzIHRoZSBmaXJzdCBhcmd1bWVudCBieSB0cmFuc2ZlcnJpbmcgdGhlIHByb3BlcnRpZXMgZnJvbSB0aGUgc2Vjb25kXG4gKiBhcmd1bWVudC5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHNcbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdQcm9wc1xuICogQHJldHVybiB7b2JqZWN0fVxuICovXG5mdW5jdGlvbiB0cmFuc2ZlckludG8ocHJvcHMsIG5ld1Byb3BzKSB7XG4gIGZvciAodmFyIHRoaXNLZXkgaW4gbmV3UHJvcHMpIHtcbiAgICBpZiAoIW5ld1Byb3BzLmhhc093blByb3BlcnR5KHRoaXNLZXkpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNmZXJTdHJhdGVneSA9IFRyYW5zZmVyU3RyYXRlZ2llc1t0aGlzS2V5XTtcblxuICAgIGlmICh0cmFuc2ZlclN0cmF0ZWd5ICYmIFRyYW5zZmVyU3RyYXRlZ2llcy5oYXNPd25Qcm9wZXJ0eSh0aGlzS2V5KSkge1xuICAgICAgdHJhbnNmZXJTdHJhdGVneShwcm9wcywgdGhpc0tleSwgbmV3UHJvcHNbdGhpc0tleV0pO1xuICAgIH0gZWxzZSBpZiAoIXByb3BzLmhhc093blByb3BlcnR5KHRoaXNLZXkpKSB7XG4gICAgICBwcm9wc1t0aGlzS2V5XSA9IG5ld1Byb3BzW3RoaXNLZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcHM7XG59XG5cbi8qKlxuICogTWVyZ2UgdHdvIHByb3BzIG9iamVjdHMgdXNpbmcgVHJhbnNmZXJTdHJhdGVnaWVzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvbGRQcm9wcyBvcmlnaW5hbCBwcm9wcyAodGhleSB0YWtlIHByZWNlZGVuY2UpXG4gKiBAcGFyYW0ge29iamVjdH0gbmV3UHJvcHMgbmV3IHByb3BzIHRvIG1lcmdlIGluXG4gKiBAcmV0dXJuIHtvYmplY3R9IGEgbmV3IG9iamVjdCBjb250YWluaW5nIGJvdGggc2V0cyBvZiBwcm9wcyBtZXJnZWQuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlUHJvcHMob2xkUHJvcHMsIG5ld1Byb3BzKSB7XG4gIHJldHVybiB0cmFuc2ZlckludG8obWVyZ2Uob2xkUHJvcHMpLCBuZXdQcm9wcyk7XG59XG5cbnZhciBSZWFjdFByb3BUcmFuc2ZlcmVyID0ge1xuICBtZXJnZVByb3BzOiBtZXJnZVByb3BzXG59O1xuXG52YXIgQ0hJTERSRU5fUFJPUCA9ICdjaGlsZHJlbic7XG5cbi8qKlxuICogU29tZXRpbWVzIHlvdSB3YW50IHRvIGNoYW5nZSB0aGUgcHJvcHMgb2YgYSBjaGlsZCBwYXNzZWQgdG8geW91LiBVc3VhbGx5XG4gKiB0aGlzIGlzIHRvIGFkZCBhIENTUyBjbGFzcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gY2hpbGQgY2hpbGQgY29tcG9uZW50IHlvdSdkIGxpa2UgdG8gY2xvbmVcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wcyBwcm9wcyB5b3UnZCBsaWtlIHRvIG1vZGlmeS4gVGhleSB3aWxsIGJlIG1lcmdlZFxuICogYXMgaWYgeW91IHVzZWQgYHRyYW5zZmVyUHJvcHNUbygpYC5cbiAqIEByZXR1cm4ge29iamVjdH0gYSBjbG9uZSBvZiBjaGlsZCB3aXRoIHByb3BzIG1lcmdlZCBpbi5cbiAqL1xuZnVuY3Rpb24gY2xvbmVXaXRoUHJvcHMoY2hpbGQsIHByb3BzKSB7XG4gIHZhciBuZXdQcm9wcyA9IFJlYWN0UHJvcFRyYW5zZmVyZXIubWVyZ2VQcm9wcyhwcm9wcywgY2hpbGQucHJvcHMpO1xuXG4gIC8vIFVzZSBgY2hpbGQucHJvcHMuY2hpbGRyZW5gIGlmIGl0IGlzIHByb3ZpZGVkLlxuICBpZiAoIW5ld1Byb3BzLmhhc093blByb3BlcnR5KENISUxEUkVOX1BST1ApICYmXG4gICAgY2hpbGQucHJvcHMuaGFzT3duUHJvcGVydHkoQ0hJTERSRU5fUFJPUCkpIHtcbiAgICBuZXdQcm9wcy5jaGlsZHJlbiA9IGNoaWxkLnByb3BzLmNoaWxkcmVuO1xuICB9XG5cbiAgLy8gSHVnZSBoYWNrIHRvIHN1cHBvcnQgYm90aCB0aGUgMC4xMCBBUEkgYW5kIHRoZSBuZXcgd2F5IG9mIGRvaW5nIHRoaW5nc1xuICAvLyBUT0RPOiByZW1vdmUgd2hlbiBzdXBwb3J0IGZvciAwLjEwIGlzIG5vIGxvbmdlciBuZWVkZWRcbiAgaWYgKFJlYWN0LnZlcnNpb24uaW5kZXhPZignMC4xMC4nKSA9PT0gMCkge1xuICAgIHJldHVybiBjaGlsZC5jb25zdHJ1Y3Rvci5Db252ZW5pZW5jZUNvbnN0cnVjdG9yKG5ld1Byb3BzKTtcbiAgfVxuXG5cbiAgLy8gVGhlIGN1cnJlbnQgQVBJIGRvZXNuJ3QgcmV0YWluIF9vd25lciBhbmQgX2NvbnRleHQsIHdoaWNoIGlzIHdoeSB0aGlzXG4gIC8vIGRvZXNuJ3QgdXNlIFJlYWN0RGVzY3JpcHRvci5jbG9uZUFuZFJlcGxhY2VQcm9wcy5cbiAgcmV0dXJuIGNoaWxkLmNvbnN0cnVjdG9yKG5ld1Byb3BzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjbG9uZVdpdGhQcm9wczsiLCIvKipcbiAqIFNhZmUgY2hhaW5lZCBmdW5jdGlvblxuICpcbiAqIFdpbGwgb25seSBjcmVhdGUgYSBuZXcgZnVuY3Rpb24gaWYgbmVlZGVkLFxuICogb3RoZXJ3aXNlIHdpbGwgcGFzcyBiYWNrIGV4aXN0aW5nIGZ1bmN0aW9ucyBvciBudWxsLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG9uZVxuICogQHBhcmFtIHtmdW5jdGlvbn0gdHdvXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb258bnVsbH1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKG9uZSwgdHdvKSB7XG4gIHZhciBoYXNPbmUgPSB0eXBlb2Ygb25lID09PSAnZnVuY3Rpb24nO1xuICB2YXIgaGFzVHdvID0gdHlwZW9mIHR3byA9PT0gJ2Z1bmN0aW9uJztcblxuICBpZiAoIWhhc09uZSAmJiAhaGFzVHdvKSB7IHJldHVybiBudWxsOyB9XG4gIGlmICghaGFzT25lKSB7IHJldHVybiB0d287IH1cbiAgaWYgKCFoYXNUd28pIHsgcmV0dXJuIG9uZTsgfVxuXG4gIHJldHVybiBmdW5jdGlvbiBjaGFpbmVkRnVuY3Rpb24oKSB7XG4gICAgb25lLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdHdvLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uOyIsIlxuLyoqXG4gKiBTaG9ydGN1dCB0byBjb21wdXRlIGVsZW1lbnQgc3R5bGVcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtXG4gKiBAcmV0dXJucyB7Q3NzU3R5bGV9XG4gKi9cbmZ1bmN0aW9uIGdldENvbXB1dGVkU3R5bGVzKGVsZW0pIHtcbiAgcmV0dXJuIGVsZW0ub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsZW0sIG51bGwpO1xufVxuXG4vKipcbiAqIEdldCBlbGVtZW50cyBvZmZzZXRcbiAqXG4gKiBUT0RPOiBSRU1PVkUgSlFVRVJZIVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IERPTU5vZGVcbiAqIEByZXR1cm5zIHt7dG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcn19XG4gKi9cbmZ1bmN0aW9uIGdldE9mZnNldChET01Ob2RlKSB7XG4gIGlmICh3aW5kb3cualF1ZXJ5KSB7XG4gICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkoRE9NTm9kZSkub2Zmc2V0KCk7XG4gIH1cblxuICB2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgdmFyIGJveCA9IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cbiAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBnQkNSLCBqdXN0IHVzZSAwLDAgcmF0aGVyIHRoYW4gZXJyb3JcbiAgLy8gQmxhY2tCZXJyeSA1LCBpT1MgMyAob3JpZ2luYWwgaVBob25lKVxuICBpZiAoIHR5cGVvZiBET01Ob2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG4gICAgYm94ID0gRE9NTm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdG9wOiBib3gudG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0IC0gZG9jRWxlbS5jbGllbnRUb3AsXG4gICAgbGVmdDogYm94LmxlZnQgKyB3aW5kb3cucGFnZVhPZmZzZXQgLSBkb2NFbGVtLmNsaWVudExlZnRcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgZWxlbWVudHMgcG9zaXRpb25cbiAqXG4gKiBUT0RPOiBSRU1PVkUgSlFVRVJZIVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnQ/fSBvZmZzZXRQYXJlbnRcbiAqIEByZXR1cm5zIHt7dG9wOiBudW1iZXIsIGxlZnQ6IG51bWJlcn19XG4gKi9cbmZ1bmN0aW9uIGdldFBvc2l0aW9uKGVsZW0sIG9mZnNldFBhcmVudCkge1xuICBpZiAod2luZG93LmpRdWVyeSkge1xuICAgIHJldHVybiB3aW5kb3cualF1ZXJ5KGVsZW0pLnBvc2l0aW9uKCk7XG4gIH1cblxuICB2YXIgb2Zmc2V0LFxuICAgICAgcGFyZW50T2Zmc2V0ID0ge3RvcDogMCwgbGVmdDogMH07XG5cbiAgLy8gRml4ZWQgZWxlbWVudHMgYXJlIG9mZnNldCBmcm9tIHdpbmRvdyAocGFyZW50T2Zmc2V0ID0ge3RvcDowLCBsZWZ0OiAwfSwgYmVjYXVzZSBpdCBpcyBpdHMgb25seSBvZmZzZXQgcGFyZW50XG4gIGlmIChnZXRDb21wdXRlZFN0eWxlcyhlbGVtKS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJyApIHtcbiAgICAvLyBXZSBhc3N1bWUgdGhhdCBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgYXZhaWxhYmxlIHdoZW4gY29tcHV0ZWQgcG9zaXRpb24gaXMgZml4ZWRcbiAgICBvZmZzZXQgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIH0gZWxzZSB7XG4gICAgaWYgKCFvZmZzZXRQYXJlbnQpIHtcbiAgICAgIC8vIEdldCAqcmVhbCogb2Zmc2V0UGFyZW50XG4gICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQoZWxlbSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IGNvcnJlY3Qgb2Zmc2V0c1xuICAgIG9mZnNldCA9IGdldE9mZnNldChlbGVtKTtcbiAgICBpZiAoIG9mZnNldFBhcmVudC5ub2RlTmFtZSAhPT0gJ0hUTUwnKSB7XG4gICAgICBwYXJlbnRPZmZzZXQgPSBnZXRPZmZzZXQob2Zmc2V0UGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgb2Zmc2V0UGFyZW50IGJvcmRlcnNcbiAgICBwYXJlbnRPZmZzZXQudG9wICs9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKG9mZnNldFBhcmVudCkuYm9yZGVyVG9wV2lkdGgsIDEwKTtcbiAgICBwYXJlbnRPZmZzZXQubGVmdCArPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhvZmZzZXRQYXJlbnQpLmJvcmRlckxlZnRXaWR0aCwgMTApO1xuICB9XG5cbiAgLy8gU3VidHJhY3QgcGFyZW50IG9mZnNldHMgYW5kIGVsZW1lbnQgbWFyZ2luc1xuICByZXR1cm4ge1xuICAgIHRvcDogb2Zmc2V0LnRvcCAtIHBhcmVudE9mZnNldC50b3AgLSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhlbGVtKS5tYXJnaW5Ub3AsIDEwKSxcbiAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0IC0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkubWFyZ2luTGVmdCwgMTApXG4gIH07XG59XG5cbi8qKlxuICogR2V0IHBhcmVudCBlbGVtZW50XG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudD99IGVsZW1cbiAqIEByZXR1cm5zIHtIVE1MRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gb2Zmc2V0UGFyZW50KGVsZW0pIHtcbiAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHZhciBvZmZzZXRQYXJlbnQgPSBlbGVtLm9mZnNldFBhcmVudCB8fCBkb2NFbGVtO1xuXG4gIHdoaWxlICggb2Zmc2V0UGFyZW50ICYmICggb2Zmc2V0UGFyZW50Lm5vZGVOYW1lICE9PSAnSFRNTCcgJiZcbiAgICBnZXRDb21wdXRlZFN0eWxlcyhvZmZzZXRQYXJlbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJyApICkge1xuICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XG4gIH1cblxuICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGRvY0VsZW07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRDb21wdXRlZFN0eWxlczogZ2V0Q29tcHV0ZWRTdHlsZXMsXG4gIGdldE9mZnNldDogZ2V0T2Zmc2V0LFxuICBnZXRQb3NpdGlvbjogZ2V0UG9zaXRpb24sXG4gIG9mZnNldFBhcmVudDogb2Zmc2V0UGFyZW50XG59OyIsIi8qKlxuICogTWVyZ2UgaGVscGVyXG4gKlxuICogVE9ETzogdG8gYmUgcmVwbGFjZWQgd2l0aCBFUzYncyBgT2JqZWN0LmFzc2lnbigpYCBmb3IgUmVhY3QgMC4xMlxuICovXG5cbi8qKlxuICogU2hhbGxvdyBtZXJnZXMgdHdvIHN0cnVjdHVyZXMgYnkgbXV0YXRpbmcgdGhlIGZpcnN0IHBhcmFtZXRlci5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb25lIE9iamVjdCB0byBiZSBtZXJnZWQgaW50by5cbiAqIEBwYXJhbSB7P29iamVjdH0gdHdvIE9wdGlvbmFsIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgdG8gbWVyZ2UgZnJvbS5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VJbnRvKG9uZSwgdHdvKSB7XG4gIGlmICh0d28gIT0gbnVsbCkge1xuICAgIGZvciAodmFyIGtleSBpbiB0d28pIHtcbiAgICAgIGlmICghdHdvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBvbmVba2V5XSA9IHR3b1trZXldO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNoYWxsb3cgbWVyZ2VzIHR3byBzdHJ1Y3R1cmVzIGludG8gYSByZXR1cm4gdmFsdWUsIHdpdGhvdXQgbXV0YXRpbmcgZWl0aGVyLlxuICpcbiAqIEBwYXJhbSB7P29iamVjdH0gb25lIE9wdGlvbmFsIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgdG8gbWVyZ2UgZnJvbS5cbiAqIEBwYXJhbSB7P29iamVjdH0gdHdvIE9wdGlvbmFsIG9iamVjdCB3aXRoIHByb3BlcnRpZXMgdG8gbWVyZ2UgZnJvbS5cbiAqIEByZXR1cm4ge29iamVjdH0gVGhlIHNoYWxsb3cgZXh0ZW5zaW9uIG9mIG9uZSBieSB0d28uXG4gKi9cbmZ1bmN0aW9uIG1lcmdlKG9uZSwgdHdvKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgbWVyZ2VJbnRvKHJlc3VsdCwgb25lKTtcbiAgbWVyZ2VJbnRvKHJlc3VsdCwgdHdvKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZTsiLCJkZWJ1ZyA9IHJlcXVpcmUoXCJkZWJ1Z1wiKShcInNxbGFkbWluOnJlYWN0OmxvZ2luXCIpXG5cblJlYWN0ID0gcmVxdWlyZSBcInJlYWN0XCJcblJlYWN0Qm9vdHN0cmFwID0gcmVxdWlyZSBcInJlYWN0LWJvb3RzdHJhcFwiXG5cbiQgPSByZXF1aXJlIFwianF1ZXJ5XCJcblxue2RpdiwgZm9ybSwgaW5wdXQsIG9wdGlvbn0gPSBSZWFjdC5ET01cbntJbnB1dCwgQnV0dG9ufSA9IFJlYWN0Qm9vdHN0cmFwXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzIHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiAtPlxuICAgIHtcbiAgICAgIGlzTG9hZGluZzogZmFsc2VcbiAgICB9XG5cbiAgb25Mb2dpbkNsaWNrOiAoKSAtPlxuICAgIEBzZXRTdGF0ZSB7IGlzTG9hZGluZzogdHJ1ZSB9XG4gICAgb3B0aW9ucyA9IHtcbiAgICAgIHVybDogXCIvbG9naW5cIlxuICAgICAgZGF0YVR5cGU6IFwianNvblwiXG4gICAgICB0eXBlOiBcIlBPU1RcIlxuICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSB7XG4gICAgICAgIFwiX2NzcmZcIjogQHByb3BzLl9jc3JmXG4gICAgICAgIFwidXNlcm5hbWVcIjogQHJlZnMudHh0VXNlcm5hbWUuZ2V0VmFsdWUoKVxuICAgICAgICBcInBhc3N3b3JkXCI6IEByZWZzLnR4dFBhc3N3b3JkLmdldFZhbHVlKClcbiAgICAgICAgXCJob3N0XCI6IEByZWZzLnR4dEhvc3QuZ2V0VmFsdWUoKVxuICAgICAgICBcInBvcnRcIjogQHJlZnMudHh0UG9ydC5nZXRWYWx1ZSgpXG4gICAgICAgIFwiZGF0YWJhc2V0eXBlXCI6IEByZWZzLmRkbERhdGFiYXNlVHlwZS5nZXRWYWx1ZSgpXG4gICAgICB9XG4gICAgICBjb250ZXh0OiBAXG4gICAgfVxuICAgICQuYWpheChvcHRpb25zKS5kb25lICgpIC0+XG4gICAgICBkZWJ1ZyBcInJlc3BvbnNlXCIsIGFyZ3VtZW50c1xuICAgICAgQHNldFN0YXRlIHsgaXNMb2FkaW5nOiBmYWxzZSB9XG4gICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9cIlxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBpc0xvYWRpbmcgPSBAc3RhdGUuaXNMb2FkaW5nXG5cbiAgICBsb2dpbkJ1dHRvbk9wdGlvbnMgPSB7XG4gICAgICBic1N0eWxlOlwicHJpbWFyeVwiXG4gICAgICBvbkNsaWNrOiBpZiBpc0xvYWRpbmcgdGhlbiBudWxsIGVsc2UgQG9uTG9naW5DbGlja1xuICAgICAgZGlzYWJsZWQ6IGlzTG9hZGluZ1xuICAgIH1cbiAgICBsb2dpbkJ1dHRvblRleHQgPSBpZiBpc0xvYWRpbmcgdGhlbiBcIlBsZWFzZSBXYWl0XCIgZWxzZSBcIkxvZ2luXCJcblxuICAgIGRpdiB7IGNsYXNzTmFtZTogXCJjb250YWluZXJcIiB9LFxuICAgICAgZm9ybSB7Y2xhc3NOYW1lOiBcImZvcm0taG9yaXpvbnRhbFwifSxcbiAgICAgICAgSW5wdXQgeyB0eXBlOiBcInRleHRcIiwgbGFiZWw6IFwiVXNlcm5hbWVcIiwgbGFiZWxDbGFzc05hbWU6XCJjb2wteHMtMlwiLCB3cmFwcGVyQ2xhc3NOYW1lOiBcImNvbC14cy0xMFwiLCByZWY6IFwidHh0VXNlcm5hbWVcIiwgZGVmYXVsdFZhbHVlOiBcInBvc3RncmVzXCIgfVxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwicGFzc3dvcmRcIiwgbGFiZWw6IFwiUGFzc3dvcmRcIiwgbGFiZWxDbGFzc05hbWU6XCJjb2wteHMtMlwiLCB3cmFwcGVyQ2xhc3NOYW1lOiBcImNvbC14cy0xMFwiLCByZWY6IFwidHh0UGFzc3dvcmRcIiwgZGVmYXVsdFZhbHVlOiBcIjEycXdhc3p4XCIgfVxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwidGV4dFwiLCBsYWJlbDogXCJIb3N0XCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwiMTI3LjAuMC4xXCIsIHJlZjogXCJ0eHRIb3N0XCIgfVxuICAgICAgICBJbnB1dCB7IHR5cGU6IFwidGV4dFwiLCBsYWJlbDogXCJQb3J0XCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwiNTQzMlwiLCByZWY6IFwidHh0UG9ydFwiIH1cbiAgICAgICAgSW5wdXQgeyB0eXBlOiBcInNlbGVjdFwiLCBsYWJlbDogXCJEYXRhYmFzZSBUeXBlXCIsIGxhYmVsQ2xhc3NOYW1lOlwiY29sLXhzLTJcIiwgd3JhcHBlckNsYXNzTmFtZTogXCJjb2wteHMtMTBcIiwgZGVmYXVsdFZhbHVlOlwicGdcIiwgcmVmOlwiZGRsRGF0YWJhc2VUeXBlXCIgfSxcbiAgICAgICAgICBvcHRpb24geyB2YWx1ZTpcInBnXCIgfSwgXCJQb3N0Z3Jlc3FsXCJcbiAgICAgICAgICBvcHRpb24geyB2YWx1ZTpcIm15c3FsXCIgfSwgXCJNeVNxbFwiXG4gICAgICAgICAgb3B0aW9uIHsgdmFsdWU6XCJtYXJpYXNxbFwiIH0sIFwiTWFyaWFTcWxcIlxuICAgICAgICBCdXR0b24gbG9naW5CdXR0b25PcHRpb25zLCBsb2dpbkJ1dHRvblRleHRcbn1cbiJdfQ==
