require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AppData, Backbone, Database, DatabaseCollection, Table, TableCollection, debug, jQuery,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

jQuery = (window.$ || jQuery);

Backbone = require("backbone");

Backbone.$ = jQuery;

debug = require("debug")("sqladmin:appdata");

Table = (function(_super) {
  __extends(Table, _super);

  function Table() {
    return Table.__super__.constructor.apply(this, arguments);
  }

  Table.prototype.defaults = {
    name: "",
    schema: ""
  };

  Table.prototype.url = "/api/table";

  return Table;

})(Backbone.Model);

TableCollection = (function(_super) {
  __extends(TableCollection, _super);

  function TableCollection() {
    return TableCollection.__super__.constructor.apply(this, arguments);
  }

  TableCollection.prototype.model = Table;

  TableCollection.prototype.url = "/api/tables";

  return TableCollection;

})(Backbone.Collection);

Database = (function(_super) {
  __extends(Database, _super);

  function Database() {
    return Database.__super__.constructor.apply(this, arguments);
  }

  Database.prototype.defaults = {
    name: ""
  };

  Database.prototype.url = "/api/database";

  return Database;

})(Backbone.Model);

DatabaseCollection = (function(_super) {
  __extends(DatabaseCollection, _super);

  function DatabaseCollection() {
    return DatabaseCollection.__super__.constructor.apply(this, arguments);
  }

  DatabaseCollection.prototype.model = Database;

  DatabaseCollection.prototype.url = "/api/databases";

  return DatabaseCollection;

})(Backbone.Collection);

AppData = (function(_super) {
  __extends(AppData, _super);

  AppData.prototype.defaults = {
    selecteddb: "postgres"
  };

  function AppData() {
    var dbc;
    AppData.__super__.constructor.apply(this, arguments);
    dbc = new DatabaseCollection();
    dbc.fetch();
    this.set('databases', dbc);
    this.set('tables', new TableCollection());
    this.on("add change remove", (function(_this) {
      return function() {
        var options;
        options = {
          dbname: _this.get("selecteddb")
        };
        return _this.get('tables').fetch({
          data: $.param(options)
        });
      };
    })(this));
  }

  return AppData;

})(Backbone.Model);

module.exports = new AppData();



},{"backbone":3,"debug":4}],2:[function(require,module,exports){
var debug;

debug = require("debug")("sqladmin:bbmixin");

module.exports = {
  componentDidMount: function() {
    var model, updateFunc, _i, _len, _ref, _results;
    updateFunc = (function(_this) {
      return function() {
        debug("updateFunc");
        return _this.forceUpdate();
      };
    })(this);
    _ref = this.getBackboneModels();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      model = _ref[_i];
      _results.push(model.on("add change remove", updateFunc, this));
    }
    return _results;
  },
  componentWillUnmount: function() {
    var model, _i, _len, _ref, _results;
    _ref = this.getBackboneModels();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      model = _ref[_i];
      _results.push(model.off(null, null, this));
    }
    return _results;
  }
};



},{"debug":4}],3:[function(require,module,exports){
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

},{"underscore":64}],4:[function(require,module,exports){

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

},{"./debug":5}],5:[function(require,module,exports){

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

},{"ms":6}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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
},{"./PanelGroup":42}],8:[function(require,module,exports){
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
},{"./AffixMixin":9,"./utils/domUtils":62}],9:[function(require,module,exports){
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
},{"./utils/EventListener":56,"./utils/domUtils":62}],10:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],11:[function(require,module,exports){
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

},{"./utils/ValidComponentChildren":58,"./utils/classSet":59}],12:[function(require,module,exports){
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
},{"./constants":53}],13:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],14:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./Button":13,"./utils/classSet":59}],15:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./Button":13,"./utils/classSet":59}],16:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60}],17:[function(require,module,exports){
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
},{"./utils/TransitionEvents":57,"./utils/classSet":59}],18:[function(require,module,exports){
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
},{"./constants":53,"./utils/CustomPropTypes":55,"./utils/classSet":59}],19:[function(require,module,exports){
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
},{"./utils/TransitionEvents":57}],20:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./Button":13,"./ButtonGroup":14,"./DropdownMenu":21,"./DropdownStateMixin":22,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],21:[function(require,module,exports){
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
},{"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],22:[function(require,module,exports){
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
},{"./utils/EventListener":56}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./constants":53,"./utils/classSet":59}],25:[function(require,module,exports){
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
},{"./utils/CustomPropTypes":55}],26:[function(require,module,exports){
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

},{"./utils/classSet":59}],27:[function(require,module,exports){
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

},{"./utils/ValidComponentChildren":58,"./utils/merge":63}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],30:[function(require,module,exports){
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
},{"./utils/classSet":59}],31:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./FadeMixin":23,"./utils/EventListener":56,"./utils/classSet":59}],32:[function(require,module,exports){
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
},{"./OverlayMixin":36,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],33:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./CollapsableMixin":19,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61,"./utils/domUtils":62}],34:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],35:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./Nav":33,"./utils/CustomPropTypes":55,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],36:[function(require,module,exports){
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

},{"./utils/CustomPropTypes":55}],37:[function(require,module,exports){
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
},{"./OverlayMixin":36,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61,"./utils/domUtils":62,"./utils/merge":63}],38:[function(require,module,exports){
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
},{}],39:[function(require,module,exports){
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
},{"./utils/classSet":59}],40:[function(require,module,exports){
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
},{"./utils/ValidComponentChildren":58,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],41:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./CollapsableMixin":19,"./utils/classSet":59,"./utils/cloneWithProps":60}],42:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60}],43:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],44:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./Interpolate":27,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60}],45:[function(require,module,exports){
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
},{"./utils/CustomPropTypes":55}],46:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./Button":13,"./ButtonGroup":14,"./DropdownMenu":21,"./DropdownStateMixin":22,"./utils/classSet":59}],47:[function(require,module,exports){
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

},{"./BootstrapMixin":12,"./utils/ValidComponentChildren":58,"./utils/classSet":59,"./utils/cloneWithProps":60,"./utils/createChainedFunction":61}],48:[function(require,module,exports){
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
},{"./utils/TransitionEvents":57,"./utils/classSet":59}],49:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./Nav":33,"./NavItem":34,"./utils/ValidComponentChildren":58,"./utils/cloneWithProps":60}],50:[function(require,module,exports){
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
},{"./utils/classSet":59}],51:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],52:[function(require,module,exports){
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
},{"./BootstrapMixin":12,"./utils/classSet":59}],53:[function(require,module,exports){
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

},{}],54:[function(require,module,exports){
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
},{"./Accordion":7,"./Affix":8,"./AffixMixin":9,"./Alert":10,"./Badge":11,"./BootstrapMixin":12,"./Button":13,"./ButtonGroup":14,"./ButtonToolbar":15,"./Carousel":16,"./CarouselItem":17,"./Col":18,"./CollapsableMixin":19,"./DropdownButton":20,"./DropdownMenu":21,"./DropdownStateMixin":22,"./FadeMixin":23,"./Glyphicon":24,"./Grid":25,"./Input":26,"./Interpolate":27,"./Jumbotron":28,"./Label":29,"./MenuItem":30,"./Modal":31,"./ModalTrigger":32,"./Nav":33,"./NavItem":34,"./Navbar":35,"./OverlayMixin":36,"./OverlayTrigger":37,"./PageHeader":38,"./PageItem":39,"./Pager":40,"./Panel":41,"./PanelGroup":42,"./Popover":43,"./ProgressBar":44,"./Row":45,"./SplitButton":46,"./SubNav":47,"./TabPane":48,"./TabbedArea":49,"./Table":50,"./Tooltip":51,"./Well":52}],55:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
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
},{"./merge":63}],61:[function(require,module,exports){
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
},{}],62:[function(require,module,exports){

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
},{}],63:[function(require,module,exports){
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
},{}],64:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],"app":[function(require,module,exports){
var AppData, BackboneMixin, Col, DatabaseList, DatabaseTabs, React, TabPane, TabbedArea, Table, TablesList, a, debug, div, li, tbody, td, th, thead, tr, ul, _ref, _ref1;

React = (window.React || React);

BackboneMixin = require("../bb.mixin");

_ref = React.DOM, div = _ref.div, ul = _ref.ul, li = _ref.li, a = _ref.a, thead = _ref.thead, tbody = _ref.tbody, tr = _ref.tr, th = _ref.th, td = _ref.td;

_ref1 = require("react-bootstrap"), Col = _ref1.Col, TabbedArea = _ref1.TabbedArea, TabPane = _ref1.TabPane, Table = _ref1.Table;

debug = require("debug")("sqladmin:admin");

AppData = require("../appdata");

DatabaseList = React.createClass({
  mixins: [BackboneMixin],
  getBackboneModels: function() {
    return [AppData, AppData.get("databases")];
  },
  onItemClick: function(dbname) {
    return function() {
      return AppData.set("selecteddb", dbname);
    };
  },
  render: function() {
    var items;
    items = AppData.get("databases").map((function(_this) {
      return function(db) {
        var activeClass, dbname, itemOpts;
        dbname = db.get("name");
        activeClass = dbname === AppData.get("selecteddb") ? "active" : "";
        itemOpts = {
          className: "list-group-item " + activeClass,
          href: "javascript:;",
          onClick: _this.onItemClick(dbname)
        };
        return a(itemOpts, db.get("name"));
      };
    })(this));
    return div({
      className: "list-group"
    }, items);
  }
});

TablesList = React.createClass({
  mixins: [BackboneMixin],
  getBackboneModels: function() {
    return [AppData.get("tables")];
  },
  render: function() {
    return Table({
      striped: true,
      bordered: true,
      hover: true
    }, thead({}, tr({}, th({}, "Schema"), th({}, "Table Name"))), tbody({}, AppData.get("tables").map(function(table) {
      return tr({}, td({}, table.get("schema")), td({}, table.get("name")));
    })));
  }
});

DatabaseTabs = React.createClass({
  render: function() {
    return TabbedArea({
      defaultActiveKey: 1
    }, TabPane({
      key: 1,
      tab: "Tables"
    }, TablesList({})), TabPane({
      key: 1,
      tab: "Other"
    }, div({}, "Other stuff")));
  }
});

module.exports = React.createClass({
  render: function() {
    return div({
      className: "container"
    }, Col({
      xs: 12,
      sm: 3
    }, DatabaseList({})), Col({
      xs: 12,
      sm: 9
    }, DatabaseTabs({})));
  }
});



},{"../appdata":1,"../bb.mixin":2,"debug":4,"react-bootstrap":54}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkQ6XFxHaXRodWJcXHNxbGFkbWluXFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsIkQ6XFxHaXRodWJcXHNxbGFkbWluXFxjbGllbnRcXGFwcGRhdGEuY29mZmVlIiwiRDpcXEdpdGh1Ylxcc3FsYWRtaW5cXGNsaWVudFxcYmIubWl4aW4uY29mZmVlIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9iYWNrYm9uZS9iYWNrYm9uZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvYnJvd3Nlci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL2RlYnVnL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FjY29yZGlvbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FmZml4LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWZmaXhNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0FsZXJ0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQmFkZ2UuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Cb290c3RyYXBNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0J1dHRvbkdyb3VwLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uVG9vbGJhci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Nhcm91c2VsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ2Fyb3VzZWxJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sbGFwc2FibGVNaXhpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Ryb3Bkb3duQnV0dG9uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25NZW51LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25TdGF0ZU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRmFkZU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR2x5cGhpY29uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR3JpZC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0lucHV0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvSW50ZXJwb2xhdGUuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9KdW1ib3Ryb24uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9MYWJlbC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL01lbnVJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTW9kYWwuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Nb2RhbFRyaWdnZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXYuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXZJdGVtLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTmF2YmFyLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheU1peGluLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheVRyaWdnZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlSGVhZGVyLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFnZUl0ZW0uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYWdlci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhbmVsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFuZWxHcm91cC5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BvcG92ZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Qcm9ncmVzc0Jhci5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Jvdy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1NwbGl0QnV0dG9uLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvU3ViTmF2LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvVGFiUGFuZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1RhYmJlZEFyZWEuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9UYWJsZS5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Rvb2x0aXAuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9XZWxsLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvY29uc3RhbnRzLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvbWFpbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0N1c3RvbVByb3BUeXBlcy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL0V2ZW50TGlzdGVuZXIuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9UcmFuc2l0aW9uRXZlbnRzLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbi5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2NsYXNzU2V0LmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvY2xvbmVXaXRoUHJvcHMuanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24uanMiLCJEOi9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9kb21VdGlscy5qcyIsIkQ6L0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL21lcmdlLmpzIiwiRDovR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCJEOlxcR2l0aHViXFxzcWxhZG1pblxcY2xpZW50XFxyZWFjdFxcYWRtaW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBQSxzRkFBQTtFQUFBO2lTQUFBOztBQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUixDQUFULENBQUE7O0FBQUEsUUFDQSxHQUFXLE9BQUEsQ0FBUSxVQUFSLENBRFgsQ0FBQTs7QUFBQSxRQUVRLENBQUMsQ0FBVCxHQUFhLE1BRmIsQ0FBQTs7QUFBQSxLQUtBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBQSxDQUFpQixrQkFBakIsQ0FMUixDQUFBOztBQUFBO0FBUUUsMEJBQUEsQ0FBQTs7OztHQUFBOztBQUFBLGtCQUFBLFFBQUEsR0FDRTtBQUFBLElBQUEsSUFBQSxFQUFNLEVBQU47QUFBQSxJQUNBLE1BQUEsRUFBUSxFQURSO0dBREYsQ0FBQTs7QUFBQSxrQkFHQSxHQUFBLEdBQUssWUFITCxDQUFBOztlQUFBOztHQURrQixRQUFRLENBQUMsTUFQN0IsQ0FBQTs7QUFBQTtBQWNFLG9DQUFBLENBQUE7Ozs7R0FBQTs7QUFBQSw0QkFBQSxLQUFBLEdBQU8sS0FBUCxDQUFBOztBQUFBLDRCQUNBLEdBQUEsR0FBSyxhQURMLENBQUE7O3lCQUFBOztHQUQ0QixRQUFRLENBQUMsV0FidkMsQ0FBQTs7QUFBQTtBQWtCRSw2QkFBQSxDQUFBOzs7O0dBQUE7O0FBQUEscUJBQUEsUUFBQSxHQUNFO0FBQUEsSUFBQSxJQUFBLEVBQU0sRUFBTjtHQURGLENBQUE7O0FBQUEscUJBRUEsR0FBQSxHQUFLLGVBRkwsQ0FBQTs7a0JBQUE7O0dBRHFCLFFBQVEsQ0FBQyxNQWpCaEMsQ0FBQTs7QUFBQTtBQXVCRSx1Q0FBQSxDQUFBOzs7O0dBQUE7O0FBQUEsK0JBQUEsS0FBQSxHQUFPLFFBQVAsQ0FBQTs7QUFBQSwrQkFDQSxHQUFBLEdBQUssZ0JBREwsQ0FBQTs7NEJBQUE7O0dBRCtCLFFBQVEsQ0FBQyxXQXRCMUMsQ0FBQTs7QUFBQTtBQTJCRSw0QkFBQSxDQUFBOztBQUFBLG9CQUFBLFFBQUEsR0FDRTtBQUFBLElBQUEsVUFBQSxFQUFZLFVBQVo7R0FERixDQUFBOztBQUdhLEVBQUEsaUJBQUEsR0FBQTtBQUNYLFFBQUEsR0FBQTtBQUFBLElBQUEsMENBQUEsU0FBQSxDQUFBLENBQUE7QUFBQSxJQUNBLEdBQUEsR0FBVSxJQUFBLGtCQUFBLENBQUEsQ0FEVixDQUFBO0FBQUEsSUFFQSxHQUFHLENBQUMsS0FBSixDQUFBLENBRkEsQ0FBQTtBQUFBLElBR0EsSUFBQyxDQUFBLEdBQUQsQ0FBSyxXQUFMLEVBQWtCLEdBQWxCLENBSEEsQ0FBQTtBQUFBLElBSUEsSUFBQyxDQUFBLEdBQUQsQ0FBSyxRQUFMLEVBQW1CLElBQUEsZUFBQSxDQUFBLENBQW5CLENBSkEsQ0FBQTtBQUFBLElBTUEsSUFBQyxDQUFBLEVBQUQsQ0FBSSxtQkFBSixFQUF5QixDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ3ZCLFlBQUEsT0FBQTtBQUFBLFFBQUEsT0FBQSxHQUFXO0FBQUEsVUFDVCxNQUFBLEVBQVEsS0FBQyxDQUFBLEdBQUQsQ0FBSyxZQUFMLENBREM7U0FBWCxDQUFBO2VBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSyxRQUFMLENBQWMsQ0FBQyxLQUFmLENBQXFCO0FBQUEsVUFBRSxJQUFBLEVBQU0sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxPQUFSLENBQVI7U0FBckIsRUFKdUI7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QixDQU5BLENBRFc7RUFBQSxDQUhiOztpQkFBQTs7R0FEb0IsUUFBUSxDQUFDLE1BMUIvQixDQUFBOztBQUFBLE1BNENNLENBQUMsT0FBUCxHQUFxQixJQUFBLE9BQUEsQ0FBQSxDQTVDckIsQ0FBQTs7Ozs7QUNBQSxJQUFBLEtBQUE7O0FBQUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBQUEsQ0FBaUIsa0JBQWpCLENBQVIsQ0FBQTs7QUFBQSxNQUVNLENBQUMsT0FBUCxHQUFpQjtBQUFBLEVBQ2YsaUJBQUEsRUFBbUIsU0FBQSxHQUFBO0FBRWpCLFFBQUEsMkNBQUE7QUFBQSxJQUFBLFVBQUEsR0FBYSxDQUFBLFNBQUEsS0FBQSxHQUFBO2FBQUEsU0FBQSxHQUFBO0FBQ1gsUUFBQSxLQUFBLENBQU0sWUFBTixDQUFBLENBQUE7ZUFDQSxLQUFDLENBQUEsV0FBRCxDQUFBLEVBRlc7TUFBQSxFQUFBO0lBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFiLENBQUE7QUFHQTtBQUFBO1NBQUEsMkNBQUE7dUJBQUE7QUFDRSxvQkFBQSxLQUFLLENBQUMsRUFBTixDQUFTLG1CQUFULEVBQThCLFVBQTlCLEVBQTBDLElBQTFDLEVBQUEsQ0FERjtBQUFBO29CQUxpQjtFQUFBLENBREo7QUFBQSxFQVNmLG9CQUFBLEVBQXNCLFNBQUEsR0FBQTtBQUNwQixRQUFBLCtCQUFBO0FBQUE7QUFBQTtTQUFBLDJDQUFBO3VCQUFBO0FBQ0Usb0JBQUEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQUEsQ0FERjtBQUFBO29CQURvQjtFQUFBLENBVFA7Q0FGakIsQ0FBQTs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4a0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y0Q0EsSUFBQSxvS0FBQTs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBUixDQUFBOztBQUFBLGFBQ0EsR0FBZ0IsT0FBQSxDQUFRLGFBQVIsQ0FEaEIsQ0FBQTs7QUFBQSxPQUc2QyxLQUFLLENBQUMsR0FBbkQsRUFBQyxXQUFBLEdBQUQsRUFBTSxVQUFBLEVBQU4sRUFBVSxVQUFBLEVBQVYsRUFBYyxTQUFBLENBQWQsRUFBaUIsYUFBQSxLQUFqQixFQUF3QixhQUFBLEtBQXhCLEVBQStCLFVBQUEsRUFBL0IsRUFBbUMsVUFBQSxFQUFuQyxFQUF1QyxVQUFBLEVBSHZDLENBQUE7O0FBQUEsUUFJb0MsT0FBQSxDQUFRLGlCQUFSLENBQXBDLEVBQUMsWUFBQSxHQUFELEVBQU0sbUJBQUEsVUFBTixFQUFrQixnQkFBQSxPQUFsQixFQUEyQixjQUFBLEtBSjNCLENBQUE7O0FBQUEsS0FNQSxHQUFRLE9BQUEsQ0FBUSxPQUFSLENBQUEsQ0FBaUIsZ0JBQWpCLENBTlIsQ0FBQTs7QUFBQSxPQVNBLEdBQVUsT0FBQSxDQUFRLFlBQVIsQ0FUVixDQUFBOztBQUFBLFlBWUEsR0FBZSxLQUFLLENBQUMsV0FBTixDQUFrQjtBQUFBLEVBRS9CLE1BQUEsRUFBUSxDQUFDLGFBQUQsQ0FGdUI7QUFBQSxFQUkvQixpQkFBQSxFQUFtQixTQUFBLEdBQUE7V0FDakIsQ0FBQyxPQUFELEVBQVUsT0FBTyxDQUFDLEdBQVIsQ0FBWSxXQUFaLENBQVYsRUFEaUI7RUFBQSxDQUpZO0FBQUEsRUFPL0IsV0FBQSxFQUFhLFNBQUMsTUFBRCxHQUFBO0FBQ1gsV0FBTyxTQUFBLEdBQUE7YUFDTCxPQUFPLENBQUMsR0FBUixDQUFZLFlBQVosRUFBMEIsTUFBMUIsRUFESztJQUFBLENBQVAsQ0FEVztFQUFBLENBUGtCO0FBQUEsRUFXL0IsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUNOLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLE9BQU8sQ0FBQyxHQUFSLENBQVksV0FBWixDQUF3QixDQUFDLEdBQXpCLENBQTZCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLEVBQUQsR0FBQTtBQUNuQyxZQUFBLDZCQUFBO0FBQUEsUUFBQSxNQUFBLEdBQVMsRUFBRSxDQUFDLEdBQUgsQ0FBTyxNQUFQLENBQVQsQ0FBQTtBQUFBLFFBQ0EsV0FBQSxHQUFpQixNQUFBLEtBQVUsT0FBTyxDQUFDLEdBQVIsQ0FBWSxZQUFaLENBQWIsR0FBNEMsUUFBNUMsR0FBMEQsRUFEeEUsQ0FBQTtBQUFBLFFBRUEsUUFBQSxHQUFXO0FBQUEsVUFDVCxTQUFBLEVBQVksa0JBQUEsR0FBa0IsV0FEckI7QUFBQSxVQUVULElBQUEsRUFBSyxjQUZJO0FBQUEsVUFHVCxPQUFBLEVBQVMsS0FBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBSEE7U0FGWCxDQUFBO2VBT0EsQ0FBQSxDQUFFLFFBQUYsRUFBWSxFQUFFLENBQUMsR0FBSCxDQUFPLE1BQVAsQ0FBWixFQVJtQztNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTdCLENBQVIsQ0FBQTtXQVNBLEdBQUEsQ0FBSTtBQUFBLE1BQUUsU0FBQSxFQUFXLFlBQWI7S0FBSixFQUNFLEtBREYsRUFWTTtFQUFBLENBWHVCO0NBQWxCLENBWmYsQ0FBQTs7QUFBQSxVQXNDQSxHQUFhLEtBQUssQ0FBQyxXQUFOLENBQWtCO0FBQUEsRUFDN0IsTUFBQSxFQUFRLENBQUMsYUFBRCxDQURxQjtBQUFBLEVBRzdCLGlCQUFBLEVBQW1CLFNBQUEsR0FBQTtXQUNqQixDQUFDLE9BQU8sQ0FBQyxHQUFSLENBQVksUUFBWixDQUFELEVBRGlCO0VBQUEsQ0FIVTtBQUFBLEVBSzdCLE1BQUEsRUFBUSxTQUFBLEdBQUE7V0FDTixLQUFBLENBQU07QUFBQSxNQUFFLE9BQUEsRUFBUyxJQUFYO0FBQUEsTUFBaUIsUUFBQSxFQUFVLElBQTNCO0FBQUEsTUFBaUMsS0FBQSxFQUFPLElBQXhDO0tBQU4sRUFDRSxLQUFBLENBQU0sRUFBTixFQUNFLEVBQUEsQ0FBRyxFQUFILEVBQ0UsRUFBQSxDQUFHLEVBQUgsRUFBTyxRQUFQLENBREYsRUFFRSxFQUFBLENBQUcsRUFBSCxFQUFPLFlBQVAsQ0FGRixDQURGLENBREYsRUFLRSxLQUFBLENBQU0sRUFBTixFQUNFLE9BQU8sQ0FBQyxHQUFSLENBQVksUUFBWixDQUFxQixDQUFDLEdBQXRCLENBQTBCLFNBQUMsS0FBRCxHQUFBO2FBQ3hCLEVBQUEsQ0FBRyxFQUFILEVBQ0UsRUFBQSxDQUFHLEVBQUgsRUFBTyxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsQ0FBUCxDQURGLEVBRUUsRUFBQSxDQUFHLEVBQUgsRUFBTyxLQUFLLENBQUMsR0FBTixDQUFVLE1BQVYsQ0FBUCxDQUZGLEVBRHdCO0lBQUEsQ0FBMUIsQ0FERixDQUxGLEVBRE07RUFBQSxDQUxxQjtDQUFsQixDQXRDYixDQUFBOztBQUFBLFlBeURBLEdBQWUsS0FBSyxDQUFDLFdBQU4sQ0FBa0I7QUFBQSxFQUMvQixNQUFBLEVBQVEsU0FBQSxHQUFBO1dBQ04sVUFBQSxDQUFXO0FBQUEsTUFBQyxnQkFBQSxFQUFrQixDQUFuQjtLQUFYLEVBQ0UsT0FBQSxDQUFRO0FBQUEsTUFBQyxHQUFBLEVBQUssQ0FBTjtBQUFBLE1BQVMsR0FBQSxFQUFLLFFBQWQ7S0FBUixFQUNFLFVBQUEsQ0FBVyxFQUFYLENBREYsQ0FERixFQUdFLE9BQUEsQ0FBUTtBQUFBLE1BQUMsR0FBQSxFQUFLLENBQU47QUFBQSxNQUFTLEdBQUEsRUFBSyxPQUFkO0tBQVIsRUFDRSxHQUFBLENBQUksRUFBSixFQUFRLGFBQVIsQ0FERixDQUhGLEVBRE07RUFBQSxDQUR1QjtDQUFsQixDQXpEZixDQUFBOztBQUFBLE1BcUVNLENBQUMsT0FBUCxHQUFpQixLQUFLLENBQUMsV0FBTixDQUFrQjtBQUFBLEVBQ2pDLE1BQUEsRUFBUSxTQUFBLEdBQUE7V0FDTixHQUFBLENBQUk7QUFBQSxNQUFFLFNBQUEsRUFBVyxXQUFiO0tBQUosRUFDRSxHQUFBLENBQUk7QUFBQSxNQUFFLEVBQUEsRUFBSSxFQUFOO0FBQUEsTUFBVSxFQUFBLEVBQUksQ0FBZDtLQUFKLEVBQ0UsWUFBQSxDQUFhLEVBQWIsQ0FERixDQURGLEVBR0UsR0FBQSxDQUFJO0FBQUEsTUFBRSxFQUFBLEVBQUksRUFBTjtBQUFBLE1BQVUsRUFBQSxFQUFJLENBQWQ7S0FBSixFQUNFLFlBQUEsQ0FBYSxFQUFiLENBREYsQ0FIRixFQURNO0VBQUEsQ0FEeUI7Q0FBbEIsQ0FyRWpCLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwialF1ZXJ5ID0gcmVxdWlyZSBcImpxdWVyeVwiXHJcbkJhY2tib25lID0gcmVxdWlyZSBcImJhY2tib25lXCJcclxuQmFja2JvbmUuJCA9IGpRdWVyeVxyXG5cclxuXHJcbmRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwic3FsYWRtaW46YXBwZGF0YVwiKVxyXG5cclxuY2xhc3MgVGFibGUgZXh0ZW5kcyBCYWNrYm9uZS5Nb2RlbFxyXG4gIGRlZmF1bHRzOlxyXG4gICAgbmFtZTogXCJcIlxyXG4gICAgc2NoZW1hOiBcIlwiXHJcbiAgdXJsOiBcIi9hcGkvdGFibGVcIlxyXG5cclxuY2xhc3MgVGFibGVDb2xsZWN0aW9uIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxyXG4gIG1vZGVsOiBUYWJsZVxyXG4gIHVybDogXCIvYXBpL3RhYmxlc1wiXHJcblxyXG5jbGFzcyBEYXRhYmFzZSBleHRlbmRzIEJhY2tib25lLk1vZGVsXHJcbiAgZGVmYXVsdHM6XHJcbiAgICBuYW1lOiBcIlwiXHJcbiAgdXJsOiBcIi9hcGkvZGF0YWJhc2VcIlxyXG5cclxuY2xhc3MgRGF0YWJhc2VDb2xsZWN0aW9uIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxyXG4gIG1vZGVsOiBEYXRhYmFzZVxyXG4gIHVybDogXCIvYXBpL2RhdGFiYXNlc1wiXHJcblxyXG5jbGFzcyBBcHBEYXRhIGV4dGVuZHMgQmFja2JvbmUuTW9kZWxcclxuICBkZWZhdWx0czpcclxuICAgIHNlbGVjdGVkZGI6IFwicG9zdGdyZXNcIlxyXG5cclxuICBjb25zdHJ1Y3RvcjogKCkgLT5cclxuICAgIHN1cGVyXHJcbiAgICBkYmMgPSBuZXcgRGF0YWJhc2VDb2xsZWN0aW9uKClcclxuICAgIGRiYy5mZXRjaCgpXHJcbiAgICBAc2V0ICdkYXRhYmFzZXMnLCBkYmNcclxuICAgIEBzZXQgJ3RhYmxlcycsIG5ldyBUYWJsZUNvbGxlY3Rpb24oKVxyXG5cclxuICAgIEBvbiBcImFkZCBjaGFuZ2UgcmVtb3ZlXCIsICgpID0+XHJcbiAgICAgIG9wdGlvbnMgPSAge1xyXG4gICAgICAgIGRibmFtZTogQGdldCBcInNlbGVjdGVkZGJcIlxyXG4gICAgICB9XHJcbiAgICAgIEBnZXQoJ3RhYmxlcycpLmZldGNoIHsgZGF0YTogJC5wYXJhbShvcHRpb25zKSB9XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQXBwRGF0YSgpXHJcbiIsImRlYnVnID0gcmVxdWlyZShcImRlYnVnXCIpKFwic3FsYWRtaW46YmJtaXhpblwiKVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgY29tcG9uZW50RGlkTW91bnQ6IC0+XHJcblxyXG4gICAgdXBkYXRlRnVuYyA9ICgpID0+XHJcbiAgICAgIGRlYnVnIFwidXBkYXRlRnVuY1wiXHJcbiAgICAgIEBmb3JjZVVwZGF0ZSgpXHJcbiAgICBmb3IgbW9kZWwgaW4gQGdldEJhY2tib25lTW9kZWxzKClcclxuICAgICAgbW9kZWwub24gXCJhZGQgY2hhbmdlIHJlbW92ZVwiLCB1cGRhdGVGdW5jLCBAXHJcblxyXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiAtPlxyXG4gICAgZm9yIG1vZGVsIGluIEBnZXRCYWNrYm9uZU1vZGVscygpXHJcbiAgICAgIG1vZGVsLm9mZiBudWxsLCBudWxsLCBAXHJcbn1cclxuIiwiLy8gICAgIEJhY2tib25lLmpzIDEuMS4yXG5cbi8vICAgICAoYykgMjAxMC0yMDE0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgQmFja2JvbmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4vLyAgICAgRm9yIGFsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuLy8gICAgIGh0dHA6Ly9iYWNrYm9uZWpzLm9yZ1xuXG4oZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuXG4gIC8vIFNldCB1cCBCYWNrYm9uZSBhcHByb3ByaWF0ZWx5IGZvciB0aGUgZW52aXJvbm1lbnQuIFN0YXJ0IHdpdGggQU1ELlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKFsndW5kZXJzY29yZScsICdqcXVlcnknLCAnZXhwb3J0cyddLCBmdW5jdGlvbihfLCAkLCBleHBvcnRzKSB7XG4gICAgICAvLyBFeHBvcnQgZ2xvYmFsIGV2ZW4gaW4gQU1EIGNhc2UgaW4gY2FzZSB0aGlzIHNjcmlwdCBpcyBsb2FkZWQgd2l0aFxuICAgICAgLy8gb3RoZXJzIHRoYXQgbWF5IHN0aWxsIGV4cGVjdCBhIGdsb2JhbCBCYWNrYm9uZS5cbiAgICAgIHJvb3QuQmFja2JvbmUgPSBmYWN0b3J5KHJvb3QsIGV4cG9ydHMsIF8sICQpO1xuICAgIH0pO1xuXG4gIC8vIE5leHQgZm9yIE5vZGUuanMgb3IgQ29tbW9uSlMuIGpRdWVyeSBtYXkgbm90IGJlIG5lZWRlZCBhcyBhIG1vZHVsZS5cbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB2YXIgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcbiAgICBmYWN0b3J5KHJvb3QsIGV4cG9ydHMsIF8pO1xuXG4gIC8vIEZpbmFsbHksIGFzIGEgYnJvd3NlciBnbG9iYWwuXG4gIH0gZWxzZSB7XG4gICAgcm9vdC5CYWNrYm9uZSA9IGZhY3Rvcnkocm9vdCwge30sIHJvb3QuXywgKHJvb3QualF1ZXJ5IHx8IHJvb3QuWmVwdG8gfHwgcm9vdC5lbmRlciB8fCByb290LiQpKTtcbiAgfVxuXG59KHRoaXMsIGZ1bmN0aW9uKHJvb3QsIEJhY2tib25lLCBfLCAkKSB7XG5cbiAgLy8gSW5pdGlhbCBTZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBCYWNrYm9uZWAgdmFyaWFibGUsIHNvIHRoYXQgaXQgY2FuIGJlXG4gIC8vIHJlc3RvcmVkIGxhdGVyIG9uLCBpZiBgbm9Db25mbGljdGAgaXMgdXNlZC5cbiAgdmFyIHByZXZpb3VzQmFja2JvbmUgPSByb290LkJhY2tib25lO1xuXG4gIC8vIENyZWF0ZSBsb2NhbCByZWZlcmVuY2VzIHRvIGFycmF5IG1ldGhvZHMgd2UnbGwgd2FudCB0byB1c2UgbGF0ZXIuXG4gIHZhciBhcnJheSA9IFtdO1xuICB2YXIgcHVzaCA9IGFycmF5LnB1c2g7XG4gIHZhciBzbGljZSA9IGFycmF5LnNsaWNlO1xuICB2YXIgc3BsaWNlID0gYXJyYXkuc3BsaWNlO1xuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbiBvZiB0aGUgbGlicmFyeS4gS2VlcCBpbiBzeW5jIHdpdGggYHBhY2thZ2UuanNvbmAuXG4gIEJhY2tib25lLlZFUlNJT04gPSAnMS4xLjInO1xuXG4gIC8vIEZvciBCYWNrYm9uZSdzIHB1cnBvc2VzLCBqUXVlcnksIFplcHRvLCBFbmRlciwgb3IgTXkgTGlicmFyeSAoa2lkZGluZykgb3duc1xuICAvLyB0aGUgYCRgIHZhcmlhYmxlLlxuICBCYWNrYm9uZS4kID0gJDtcblxuICAvLyBSdW5zIEJhY2tib25lLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBCYWNrYm9uZWAgdmFyaWFibGVcbiAgLy8gdG8gaXRzIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgQmFja2JvbmUgb2JqZWN0LlxuICBCYWNrYm9uZS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5CYWNrYm9uZSA9IHByZXZpb3VzQmFja2JvbmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gVHVybiBvbiBgZW11bGF0ZUhUVFBgIHRvIHN1cHBvcnQgbGVnYWN5IEhUVFAgc2VydmVycy4gU2V0dGluZyB0aGlzIG9wdGlvblxuICAvLyB3aWxsIGZha2UgYFwiUEFUQ0hcImAsIGBcIlBVVFwiYCBhbmQgYFwiREVMRVRFXCJgIHJlcXVlc3RzIHZpYSB0aGUgYF9tZXRob2RgIHBhcmFtZXRlciBhbmRcbiAgLy8gc2V0IGEgYFgtSHR0cC1NZXRob2QtT3ZlcnJpZGVgIGhlYWRlci5cbiAgQmFja2JvbmUuZW11bGF0ZUhUVFAgPSBmYWxzZTtcblxuICAvLyBUdXJuIG9uIGBlbXVsYXRlSlNPTmAgdG8gc3VwcG9ydCBsZWdhY3kgc2VydmVycyB0aGF0IGNhbid0IGRlYWwgd2l0aCBkaXJlY3RcbiAgLy8gYGFwcGxpY2F0aW9uL2pzb25gIHJlcXVlc3RzIC4uLiB3aWxsIGVuY29kZSB0aGUgYm9keSBhc1xuICAvLyBgYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkYCBpbnN0ZWFkIGFuZCB3aWxsIHNlbmQgdGhlIG1vZGVsIGluIGFcbiAgLy8gZm9ybSBwYXJhbSBuYW1lZCBgbW9kZWxgLlxuICBCYWNrYm9uZS5lbXVsYXRlSlNPTiA9IGZhbHNlO1xuXG4gIC8vIEJhY2tib25lLkV2ZW50c1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBBIG1vZHVsZSB0aGF0IGNhbiBiZSBtaXhlZCBpbiB0byAqYW55IG9iamVjdCogaW4gb3JkZXIgdG8gcHJvdmlkZSBpdCB3aXRoXG4gIC8vIGN1c3RvbSBldmVudHMuIFlvdSBtYXkgYmluZCB3aXRoIGBvbmAgb3IgcmVtb3ZlIHdpdGggYG9mZmAgY2FsbGJhY2tcbiAgLy8gZnVuY3Rpb25zIHRvIGFuIGV2ZW50OyBgdHJpZ2dlcmAtaW5nIGFuIGV2ZW50IGZpcmVzIGFsbCBjYWxsYmFja3MgaW5cbiAgLy8gc3VjY2Vzc2lvbi5cbiAgLy9cbiAgLy8gICAgIHZhciBvYmplY3QgPSB7fTtcbiAgLy8gICAgIF8uZXh0ZW5kKG9iamVjdCwgQmFja2JvbmUuRXZlbnRzKTtcbiAgLy8gICAgIG9iamVjdC5vbignZXhwYW5kJywgZnVuY3Rpb24oKXsgYWxlcnQoJ2V4cGFuZGVkJyk7IH0pO1xuICAvLyAgICAgb2JqZWN0LnRyaWdnZXIoJ2V4cGFuZCcpO1xuICAvL1xuICB2YXIgRXZlbnRzID0gQmFja2JvbmUuRXZlbnRzID0ge1xuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBhIGBjYWxsYmFja2AgZnVuY3Rpb24uIFBhc3NpbmcgYFwiYWxsXCJgIHdpbGwgYmluZFxuICAgIC8vIHRoZSBjYWxsYmFjayB0byBhbGwgZXZlbnRzIGZpcmVkLlxuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCAodGhpcy5fZXZlbnRzW25hbWVdID0gW10pO1xuICAgICAgZXZlbnRzLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgY29udGV4dDogY29udGV4dCwgY3R4OiBjb250ZXh0IHx8IHRoaXN9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFuIGV2ZW50IHRvIG9ubHkgYmUgdHJpZ2dlcmVkIGEgc2luZ2xlIHRpbWUuIEFmdGVyIHRoZSBmaXJzdCB0aW1lXG4gICAgLy8gdGhlIGNhbGxiYWNrIGlzIGludm9rZWQsIGl0IHdpbGwgYmUgcmVtb3ZlZC5cbiAgICBvbmNlOiBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgY29udGV4dCkge1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ29uY2UnLCBuYW1lLCBbY2FsbGJhY2ssIGNvbnRleHRdKSB8fCAhY2FsbGJhY2spIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgdmFyIG9uY2UgPSBfLm9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYub2ZmKG5hbWUsIG9uY2UpO1xuICAgICAgICBjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSk7XG4gICAgICBvbmNlLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgcmV0dXJuIHRoaXMub24obmFtZSwgb25jZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSBvbmUgb3IgbWFueSBjYWxsYmFja3MuIElmIGBjb250ZXh0YCBpcyBudWxsLCByZW1vdmVzIGFsbFxuICAgIC8vIGNhbGxiYWNrcyB3aXRoIHRoYXQgZnVuY3Rpb24uIElmIGBjYWxsYmFja2AgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3MgZm9yIHRoZSBldmVudC4gSWYgYG5hbWVgIGlzIG51bGwsIHJlbW92ZXMgYWxsIGJvdW5kXG4gICAgLy8gY2FsbGJhY2tzIGZvciBhbGwgZXZlbnRzLlxuICAgIG9mZjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXRhaW4sIGV2LCBldmVudHMsIG5hbWVzLCBpLCBsLCBqLCBrO1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIWV2ZW50c0FwaSh0aGlzLCAnb2ZmJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFuYW1lICYmICFjYWxsYmFjayAmJiAhY29udGV4dCkge1xuICAgICAgICB0aGlzLl9ldmVudHMgPSB2b2lkIDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgbmFtZXMgPSBuYW1lID8gW25hbWVdIDogXy5rZXlzKHRoaXMuX2V2ZW50cyk7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgaWYgKGV2ZW50cyA9IHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHJldGFpbiA9IFtdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayB8fCBjb250ZXh0KSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gZXZlbnRzLmxlbmd0aDsgaiA8IGs7IGorKykge1xuICAgICAgICAgICAgICBldiA9IGV2ZW50c1tqXTtcbiAgICAgICAgICAgICAgaWYgKChjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gZXYuY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrLl9jYWxsYmFjaykgfHxcbiAgICAgICAgICAgICAgICAgIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGV2LmNvbnRleHQpKSB7XG4gICAgICAgICAgICAgICAgcmV0YWluLnB1c2goZXYpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcmV0YWluLmxlbmd0aCkgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gVHJpZ2dlciBvbmUgb3IgbWFueSBldmVudHMsIGZpcmluZyBhbGwgYm91bmQgY2FsbGJhY2tzLiBDYWxsYmFja3MgYXJlXG4gICAgLy8gcGFzc2VkIHRoZSBzYW1lIGFyZ3VtZW50cyBhcyBgdHJpZ2dlcmAgaXMsIGFwYXJ0IGZyb20gdGhlIGV2ZW50IG5hbWVcbiAgICAvLyAodW5sZXNzIHlvdSdyZSBsaXN0ZW5pbmcgb24gYFwiYWxsXCJgLCB3aGljaCB3aWxsIGNhdXNlIHlvdXIgY2FsbGJhY2sgdG9cbiAgICAvLyByZWNlaXZlIHRoZSB0cnVlIG5hbWUgb2YgdGhlIGV2ZW50IGFzIHRoZSBmaXJzdCBhcmd1bWVudCkuXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICBpZiAoIWV2ZW50c0FwaSh0aGlzLCAndHJpZ2dlcicsIG5hbWUsIGFyZ3MpKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICB2YXIgYWxsRXZlbnRzID0gdGhpcy5fZXZlbnRzLmFsbDtcbiAgICAgIGlmIChldmVudHMpIHRyaWdnZXJFdmVudHMoZXZlbnRzLCBhcmdzKTtcbiAgICAgIGlmIChhbGxFdmVudHMpIHRyaWdnZXJFdmVudHMoYWxsRXZlbnRzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRlbGwgdGhpcyBvYmplY3QgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gZWl0aGVyIHNwZWNpZmljIGV2ZW50cyAuLi4gb3JcbiAgICAvLyB0byBldmVyeSBvYmplY3QgaXQncyBjdXJyZW50bHkgbGlzdGVuaW5nIHRvLlxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5pbmdUbyA9IHRoaXMuX2xpc3RlbmluZ1RvO1xuICAgICAgaWYgKCFsaXN0ZW5pbmdUbykgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgcmVtb3ZlID0gIW5hbWUgJiYgIWNhbGxiYWNrO1xuICAgICAgaWYgKCFjYWxsYmFjayAmJiB0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIGlmIChvYmopIChsaXN0ZW5pbmdUbyA9IHt9KVtvYmouX2xpc3RlbklkXSA9IG9iajtcbiAgICAgIGZvciAodmFyIGlkIGluIGxpc3RlbmluZ1RvKSB7XG4gICAgICAgIG9iaiA9IGxpc3RlbmluZ1RvW2lkXTtcbiAgICAgICAgb2JqLm9mZihuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICAgIGlmIChyZW1vdmUgfHwgXy5pc0VtcHR5KG9iai5fZXZlbnRzKSkgZGVsZXRlIHRoaXMuX2xpc3RlbmluZ1RvW2lkXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICB9O1xuXG4gIC8vIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHNwbGl0IGV2ZW50IHN0cmluZ3MuXG4gIHZhciBldmVudFNwbGl0dGVyID0gL1xccysvO1xuXG4gIC8vIEltcGxlbWVudCBmYW5jeSBmZWF0dXJlcyBvZiB0aGUgRXZlbnRzIEFQSSBzdWNoIGFzIG11bHRpcGxlIGV2ZW50XG4gIC8vIG5hbWVzIGBcImNoYW5nZSBibHVyXCJgIGFuZCBqUXVlcnktc3R5bGUgZXZlbnQgbWFwcyBge2NoYW5nZTogYWN0aW9ufWBcbiAgLy8gaW4gdGVybXMgb2YgdGhlIGV4aXN0aW5nIEFQSS5cbiAgdmFyIGV2ZW50c0FwaSA9IGZ1bmN0aW9uKG9iaiwgYWN0aW9uLCBuYW1lLCByZXN0KSB7XG4gICAgaWYgKCFuYW1lKSByZXR1cm4gdHJ1ZTtcblxuICAgIC8vIEhhbmRsZSBldmVudCBtYXBzLlxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBuYW1lKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW2tleSwgbmFtZVtrZXldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIEhhbmRsZSBzcGFjZSBzZXBhcmF0ZWQgZXZlbnQgbmFtZXMuXG4gICAgaWYgKGV2ZW50U3BsaXR0ZXIudGVzdChuYW1lKSkge1xuICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChldmVudFNwbGl0dGVyKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG9ialthY3Rpb25dLmFwcGx5KG9iaiwgW25hbWVzW2ldXS5jb25jYXQocmVzdCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIEEgZGlmZmljdWx0LXRvLWJlbGlldmUsIGJ1dCBvcHRpbWl6ZWQgaW50ZXJuYWwgZGlzcGF0Y2ggZnVuY3Rpb24gZm9yXG4gIC8vIHRyaWdnZXJpbmcgZXZlbnRzLiBUcmllcyB0byBrZWVwIHRoZSB1c3VhbCBjYXNlcyBzcGVlZHkgKG1vc3QgaW50ZXJuYWxcbiAgLy8gQmFja2JvbmUgZXZlbnRzIGhhdmUgMyBhcmd1bWVudHMpLlxuICB2YXIgdHJpZ2dlckV2ZW50cyA9IGZ1bmN0aW9uKGV2ZW50cywgYXJncykge1xuICAgIHZhciBldiwgaSA9IC0xLCBsID0gZXZlbnRzLmxlbmd0aCwgYTEgPSBhcmdzWzBdLCBhMiA9IGFyZ3NbMV0sIGEzID0gYXJnc1syXTtcbiAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4KTsgcmV0dXJuO1xuICAgICAgY2FzZSAxOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEpOyByZXR1cm47XG4gICAgICBjYXNlIDI6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIpOyByZXR1cm47XG4gICAgICBjYXNlIDM6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmNhbGwoZXYuY3R4LCBhMSwgYTIsIGEzKTsgcmV0dXJuO1xuICAgICAgZGVmYXVsdDogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suYXBwbHkoZXYuY3R4LCBhcmdzKTsgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICB2YXIgbGlzdGVuTWV0aG9kcyA9IHtsaXN0ZW5UbzogJ29uJywgbGlzdGVuVG9PbmNlOiAnb25jZSd9O1xuXG4gIC8vIEludmVyc2lvbi1vZi1jb250cm9sIHZlcnNpb25zIG9mIGBvbmAgYW5kIGBvbmNlYC4gVGVsbCAqdGhpcyogb2JqZWN0IHRvXG4gIC8vIGxpc3RlbiB0byBhbiBldmVudCBpbiBhbm90aGVyIG9iamVjdCAuLi4ga2VlcGluZyB0cmFjayBvZiB3aGF0IGl0J3NcbiAgLy8gbGlzdGVuaW5nIHRvLlxuICBfLmVhY2gobGlzdGVuTWV0aG9kcywgZnVuY3Rpb24oaW1wbGVtZW50YXRpb24sIG1ldGhvZCkge1xuICAgIEV2ZW50c1ttZXRob2RdID0gZnVuY3Rpb24ob2JqLCBuYW1lLCBjYWxsYmFjaykge1xuICAgICAgdmFyIGxpc3RlbmluZ1RvID0gdGhpcy5fbGlzdGVuaW5nVG8gfHwgKHRoaXMuX2xpc3RlbmluZ1RvID0ge30pO1xuICAgICAgdmFyIGlkID0gb2JqLl9saXN0ZW5JZCB8fCAob2JqLl9saXN0ZW5JZCA9IF8udW5pcXVlSWQoJ2wnKSk7XG4gICAgICBsaXN0ZW5pbmdUb1tpZF0gPSBvYmo7XG4gICAgICBpZiAoIWNhbGxiYWNrICYmIHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JykgY2FsbGJhY2sgPSB0aGlzO1xuICAgICAgb2JqW2ltcGxlbWVudGF0aW9uXShuYW1lLCBjYWxsYmFjaywgdGhpcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICB9KTtcblxuICAvLyBBbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgRXZlbnRzLmJpbmQgICA9IEV2ZW50cy5vbjtcbiAgRXZlbnRzLnVuYmluZCA9IEV2ZW50cy5vZmY7XG5cbiAgLy8gQWxsb3cgdGhlIGBCYWNrYm9uZWAgb2JqZWN0IHRvIHNlcnZlIGFzIGEgZ2xvYmFsIGV2ZW50IGJ1cywgZm9yIGZvbGtzIHdob1xuICAvLyB3YW50IGdsb2JhbCBcInB1YnN1YlwiIGluIGEgY29udmVuaWVudCBwbGFjZS5cbiAgXy5leHRlbmQoQmFja2JvbmUsIEV2ZW50cyk7XG5cbiAgLy8gQmFja2JvbmUuTW9kZWxcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBCYWNrYm9uZSAqKk1vZGVscyoqIGFyZSB0aGUgYmFzaWMgZGF0YSBvYmplY3QgaW4gdGhlIGZyYW1ld29yayAtLVxuICAvLyBmcmVxdWVudGx5IHJlcHJlc2VudGluZyBhIHJvdyBpbiBhIHRhYmxlIGluIGEgZGF0YWJhc2Ugb24geW91ciBzZXJ2ZXIuXG4gIC8vIEEgZGlzY3JldGUgY2h1bmsgb2YgZGF0YSBhbmQgYSBidW5jaCBvZiB1c2VmdWwsIHJlbGF0ZWQgbWV0aG9kcyBmb3JcbiAgLy8gcGVyZm9ybWluZyBjb21wdXRhdGlvbnMgYW5kIHRyYW5zZm9ybWF0aW9ucyBvbiB0aGF0IGRhdGEuXG5cbiAgLy8gQ3JlYXRlIGEgbmV3IG1vZGVsIHdpdGggdGhlIHNwZWNpZmllZCBhdHRyaWJ1dGVzLiBBIGNsaWVudCBpZCAoYGNpZGApXG4gIC8vIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkIGFuZCBhc3NpZ25lZCBmb3IgeW91LlxuICB2YXIgTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbCA9IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIG9wdGlvbnMpIHtcbiAgICB2YXIgYXR0cnMgPSBhdHRyaWJ1dGVzIHx8IHt9O1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjJyk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgaWYgKG9wdGlvbnMuY29sbGVjdGlvbikgdGhpcy5jb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgIGlmIChvcHRpb25zLnBhcnNlKSBhdHRycyA9IHRoaXMucGFyc2UoYXR0cnMsIG9wdGlvbnMpIHx8IHt9O1xuICAgIGF0dHJzID0gXy5kZWZhdWx0cyh7fSwgYXR0cnMsIF8ucmVzdWx0KHRoaXMsICdkZWZhdWx0cycpKTtcbiAgICB0aGlzLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgdGhpcy5jaGFuZ2VkID0ge307XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQXR0YWNoIGFsbCBpbmhlcml0YWJsZSBtZXRob2RzIHRvIHRoZSBNb2RlbCBwcm90b3R5cGUuXG4gIF8uZXh0ZW5kKE1vZGVsLnByb3RvdHlwZSwgRXZlbnRzLCB7XG5cbiAgICAvLyBBIGhhc2ggb2YgYXR0cmlidXRlcyB3aG9zZSBjdXJyZW50IGFuZCBwcmV2aW91cyB2YWx1ZSBkaWZmZXIuXG4gICAgY2hhbmdlZDogbnVsbCxcblxuICAgIC8vIFRoZSB2YWx1ZSByZXR1cm5lZCBkdXJpbmcgdGhlIGxhc3QgZmFpbGVkIHZhbGlkYXRpb24uXG4gICAgdmFsaWRhdGlvbkVycm9yOiBudWxsLFxuXG4gICAgLy8gVGhlIGRlZmF1bHQgbmFtZSBmb3IgdGhlIEpTT04gYGlkYCBhdHRyaWJ1dGUgaXMgYFwiaWRcImAuIE1vbmdvREIgYW5kXG4gICAgLy8gQ291Y2hEQiB1c2VycyBtYXkgd2FudCB0byBzZXQgdGhpcyB0byBgXCJfaWRcImAuXG4gICAgaWRBdHRyaWJ1dGU6ICdpZCcsXG5cbiAgICAvLyBJbml0aWFsaXplIGlzIGFuIGVtcHR5IGZ1bmN0aW9uIGJ5IGRlZmF1bHQuIE92ZXJyaWRlIGl0IHdpdGggeW91ciBvd25cbiAgICAvLyBpbml0aWFsaXphdGlvbiBsb2dpYy5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe30sXG5cbiAgICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBtb2RlbCdzIGBhdHRyaWJ1dGVzYCBvYmplY3QuXG4gICAgdG9KU09OOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIH0sXG5cbiAgICAvLyBQcm94eSBgQmFja2JvbmUuc3luY2AgYnkgZGVmYXVsdCAtLSBidXQgb3ZlcnJpZGUgdGhpcyBpZiB5b3UgbmVlZFxuICAgIC8vIGN1c3RvbSBzeW5jaW5nIHNlbWFudGljcyBmb3IgKnRoaXMqIHBhcnRpY3VsYXIgbW9kZWwuXG4gICAgc3luYzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gQmFja2JvbmUuc3luYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIHZhbHVlIG9mIGFuIGF0dHJpYnV0ZS5cbiAgICBnZXQ6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNbYXR0cl07XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgSFRNTC1lc2NhcGVkIHZhbHVlIG9mIGFuIGF0dHJpYnV0ZS5cbiAgICBlc2NhcGU6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiBfLmVzY2FwZSh0aGlzLmdldChhdHRyKSk7XG4gICAgfSxcblxuICAgIC8vIFJldHVybnMgYHRydWVgIGlmIHRoZSBhdHRyaWJ1dGUgY29udGFpbnMgYSB2YWx1ZSB0aGF0IGlzIG5vdCBudWxsXG4gICAgLy8gb3IgdW5kZWZpbmVkLlxuICAgIGhhczogZnVuY3Rpb24oYXR0cikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KGF0dHIpICE9IG51bGw7XG4gICAgfSxcblxuICAgIC8vIFNldCBhIGhhc2ggb2YgbW9kZWwgYXR0cmlidXRlcyBvbiB0aGUgb2JqZWN0LCBmaXJpbmcgYFwiY2hhbmdlXCJgLiBUaGlzIGlzXG4gICAgLy8gdGhlIGNvcmUgcHJpbWl0aXZlIG9wZXJhdGlvbiBvZiBhIG1vZGVsLCB1cGRhdGluZyB0aGUgZGF0YSBhbmQgbm90aWZ5aW5nXG4gICAgLy8gYW55b25lIHdobyBuZWVkcyB0byBrbm93IGFib3V0IHRoZSBjaGFuZ2UgaW4gc3RhdGUuIFRoZSBoZWFydCBvZiB0aGUgYmVhc3QuXG4gICAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucykge1xuICAgICAgdmFyIGF0dHIsIGF0dHJzLCB1bnNldCwgY2hhbmdlcywgc2lsZW50LCBjaGFuZ2luZywgcHJldiwgY3VycmVudDtcbiAgICAgIGlmIChrZXkgPT0gbnVsbCkgcmV0dXJuIHRoaXM7XG5cbiAgICAgIC8vIEhhbmRsZSBib3RoIGBcImtleVwiLCB2YWx1ZWAgYW5kIGB7a2V5OiB2YWx1ZX1gIC1zdHlsZSBhcmd1bWVudHMuXG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgICAgLy8gUnVuIHZhbGlkYXRpb24uXG4gICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlKGF0dHJzLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAvLyBFeHRyYWN0IGF0dHJpYnV0ZXMgYW5kIG9wdGlvbnMuXG4gICAgICB1bnNldCAgICAgICAgICAgPSBvcHRpb25zLnVuc2V0O1xuICAgICAgc2lsZW50ICAgICAgICAgID0gb3B0aW9ucy5zaWxlbnQ7XG4gICAgICBjaGFuZ2VzICAgICAgICAgPSBbXTtcbiAgICAgIGNoYW5naW5nICAgICAgICA9IHRoaXMuX2NoYW5naW5nO1xuICAgICAgdGhpcy5fY2hhbmdpbmcgID0gdHJ1ZTtcblxuICAgICAgaWYgKCFjaGFuZ2luZykge1xuICAgICAgICB0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXMgPSBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgICAgIHRoaXMuY2hhbmdlZCA9IHt9O1xuICAgICAgfVxuICAgICAgY3VycmVudCA9IHRoaXMuYXR0cmlidXRlcywgcHJldiA9IHRoaXMuX3ByZXZpb3VzQXR0cmlidXRlcztcblxuICAgICAgLy8gQ2hlY2sgZm9yIGNoYW5nZXMgb2YgYGlkYC5cbiAgICAgIGlmICh0aGlzLmlkQXR0cmlidXRlIGluIGF0dHJzKSB0aGlzLmlkID0gYXR0cnNbdGhpcy5pZEF0dHJpYnV0ZV07XG5cbiAgICAgIC8vIEZvciBlYWNoIGBzZXRgIGF0dHJpYnV0ZSwgdXBkYXRlIG9yIGRlbGV0ZSB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICAgIGZvciAoYXR0ciBpbiBhdHRycykge1xuICAgICAgICB2YWwgPSBhdHRyc1thdHRyXTtcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwoY3VycmVudFthdHRyXSwgdmFsKSkgY2hhbmdlcy5wdXNoKGF0dHIpO1xuICAgICAgICBpZiAoIV8uaXNFcXVhbChwcmV2W2F0dHJdLCB2YWwpKSB7XG4gICAgICAgICAgdGhpcy5jaGFuZ2VkW2F0dHJdID0gdmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZWRbYXR0cl07XG4gICAgICAgIH1cbiAgICAgICAgdW5zZXQgPyBkZWxldGUgY3VycmVudFthdHRyXSA6IGN1cnJlbnRbYXR0cl0gPSB2YWw7XG4gICAgICB9XG5cbiAgICAgIC8vIFRyaWdnZXIgYWxsIHJlbGV2YW50IGF0dHJpYnV0ZSBjaGFuZ2VzLlxuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgaWYgKGNoYW5nZXMubGVuZ3RoKSB0aGlzLl9wZW5kaW5nID0gb3B0aW9ucztcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGFuZ2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlOicgKyBjaGFuZ2VzW2ldLCB0aGlzLCBjdXJyZW50W2NoYW5nZXNbaV1dLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBZb3UgbWlnaHQgYmUgd29uZGVyaW5nIHdoeSB0aGVyZSdzIGEgYHdoaWxlYCBsb29wIGhlcmUuIENoYW5nZXMgY2FuXG4gICAgICAvLyBiZSByZWN1cnNpdmVseSBuZXN0ZWQgd2l0aGluIGBcImNoYW5nZVwiYCBldmVudHMuXG4gICAgICBpZiAoY2hhbmdpbmcpIHJldHVybiB0aGlzO1xuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX3BlbmRpbmcpIHtcbiAgICAgICAgICBvcHRpb25zID0gdGhpcy5fcGVuZGluZztcbiAgICAgICAgICB0aGlzLl9wZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fcGVuZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5fY2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYW4gYXR0cmlidXRlIGZyb20gdGhlIG1vZGVsLCBmaXJpbmcgYFwiY2hhbmdlXCJgLiBgdW5zZXRgIGlzIGEgbm9vcFxuICAgIC8vIGlmIHRoZSBhdHRyaWJ1dGUgZG9lc24ndCBleGlzdC5cbiAgICB1bnNldDogZnVuY3Rpb24oYXR0ciwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0KGF0dHIsIHZvaWQgMCwgXy5leHRlbmQoe30sIG9wdGlvbnMsIHt1bnNldDogdHJ1ZX0pKTtcbiAgICB9LFxuXG4gICAgLy8gQ2xlYXIgYWxsIGF0dHJpYnV0ZXMgb24gdGhlIG1vZGVsLCBmaXJpbmcgYFwiY2hhbmdlXCJgLlxuICAgIGNsZWFyOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgYXR0cnMgPSB7fTtcbiAgICAgIGZvciAodmFyIGtleSBpbiB0aGlzLmF0dHJpYnV0ZXMpIGF0dHJzW2tleV0gPSB2b2lkIDA7XG4gICAgICByZXR1cm4gdGhpcy5zZXQoYXR0cnMsIF8uZXh0ZW5kKHt9LCBvcHRpb25zLCB7dW5zZXQ6IHRydWV9KSk7XG4gICAgfSxcblxuICAgIC8vIERldGVybWluZSBpZiB0aGUgbW9kZWwgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgYFwiY2hhbmdlXCJgIGV2ZW50LlxuICAgIC8vIElmIHlvdSBzcGVjaWZ5IGFuIGF0dHJpYnV0ZSBuYW1lLCBkZXRlcm1pbmUgaWYgdGhhdCBhdHRyaWJ1dGUgaGFzIGNoYW5nZWQuXG4gICAgaGFzQ2hhbmdlZDogZnVuY3Rpb24oYXR0cikge1xuICAgICAgaWYgKGF0dHIgPT0gbnVsbCkgcmV0dXJuICFfLmlzRW1wdHkodGhpcy5jaGFuZ2VkKTtcbiAgICAgIHJldHVybiBfLmhhcyh0aGlzLmNoYW5nZWQsIGF0dHIpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYWxsIHRoZSBhdHRyaWJ1dGVzIHRoYXQgaGF2ZSBjaGFuZ2VkLCBvclxuICAgIC8vIGZhbHNlIGlmIHRoZXJlIGFyZSBubyBjaGFuZ2VkIGF0dHJpYnV0ZXMuIFVzZWZ1bCBmb3IgZGV0ZXJtaW5pbmcgd2hhdFxuICAgIC8vIHBhcnRzIG9mIGEgdmlldyBuZWVkIHRvIGJlIHVwZGF0ZWQgYW5kL29yIHdoYXQgYXR0cmlidXRlcyBuZWVkIHRvIGJlXG4gICAgLy8gcGVyc2lzdGVkIHRvIHRoZSBzZXJ2ZXIuIFVuc2V0IGF0dHJpYnV0ZXMgd2lsbCBiZSBzZXQgdG8gdW5kZWZpbmVkLlxuICAgIC8vIFlvdSBjYW4gYWxzbyBwYXNzIGFuIGF0dHJpYnV0ZXMgb2JqZWN0IHRvIGRpZmYgYWdhaW5zdCB0aGUgbW9kZWwsXG4gICAgLy8gZGV0ZXJtaW5pbmcgaWYgdGhlcmUgKndvdWxkIGJlKiBhIGNoYW5nZS5cbiAgICBjaGFuZ2VkQXR0cmlidXRlczogZnVuY3Rpb24oZGlmZikge1xuICAgICAgaWYgKCFkaWZmKSByZXR1cm4gdGhpcy5oYXNDaGFuZ2VkKCkgPyBfLmNsb25lKHRoaXMuY2hhbmdlZCkgOiBmYWxzZTtcbiAgICAgIHZhciB2YWwsIGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgIHZhciBvbGQgPSB0aGlzLl9jaGFuZ2luZyA/IHRoaXMuX3ByZXZpb3VzQXR0cmlidXRlcyA6IHRoaXMuYXR0cmlidXRlcztcbiAgICAgIGZvciAodmFyIGF0dHIgaW4gZGlmZikge1xuICAgICAgICBpZiAoXy5pc0VxdWFsKG9sZFthdHRyXSwgKHZhbCA9IGRpZmZbYXR0cl0pKSkgY29udGludWU7XG4gICAgICAgIChjaGFuZ2VkIHx8IChjaGFuZ2VkID0ge30pKVthdHRyXSA9IHZhbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIHByZXZpb3VzIHZhbHVlIG9mIGFuIGF0dHJpYnV0ZSwgcmVjb3JkZWQgYXQgdGhlIHRpbWUgdGhlIGxhc3RcbiAgICAvLyBgXCJjaGFuZ2VcImAgZXZlbnQgd2FzIGZpcmVkLlxuICAgIHByZXZpb3VzOiBmdW5jdGlvbihhdHRyKSB7XG4gICAgICBpZiAoYXR0ciA9PSBudWxsIHx8ICF0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXMpIHJldHVybiBudWxsO1xuICAgICAgcmV0dXJuIHRoaXMuX3ByZXZpb3VzQXR0cmlidXRlc1thdHRyXTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IGFsbCBvZiB0aGUgYXR0cmlidXRlcyBvZiB0aGUgbW9kZWwgYXQgdGhlIHRpbWUgb2YgdGhlIHByZXZpb3VzXG4gICAgLy8gYFwiY2hhbmdlXCJgIGV2ZW50LlxuICAgIHByZXZpb3VzQXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXy5jbG9uZSh0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXMpO1xuICAgIH0sXG5cbiAgICAvLyBGZXRjaCB0aGUgbW9kZWwgZnJvbSB0aGUgc2VydmVyLiBJZiB0aGUgc2VydmVyJ3MgcmVwcmVzZW50YXRpb24gb2YgdGhlXG4gICAgLy8gbW9kZWwgZGlmZmVycyBmcm9tIGl0cyBjdXJyZW50IGF0dHJpYnV0ZXMsIHRoZXkgd2lsbCBiZSBvdmVycmlkZGVuLFxuICAgIC8vIHRyaWdnZXJpbmcgYSBgXCJjaGFuZ2VcImAgZXZlbnQuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgICAgaWYgKG9wdGlvbnMucGFyc2UgPT09IHZvaWQgMCkgb3B0aW9ucy5wYXJzZSA9IHRydWU7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzO1xuICAgICAgdmFyIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XG4gICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgIGlmICghbW9kZWwuc2V0KG1vZGVsLnBhcnNlKHJlc3AsIG9wdGlvbnMpLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIG1vZGVsLnRyaWdnZXIoJ3N5bmMnLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICB9O1xuICAgICAgd3JhcEVycm9yKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRoaXMuc3luYygncmVhZCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvLyBTZXQgYSBoYXNoIG9mIG1vZGVsIGF0dHJpYnV0ZXMsIGFuZCBzeW5jIHRoZSBtb2RlbCB0byB0aGUgc2VydmVyLlxuICAgIC8vIElmIHRoZSBzZXJ2ZXIgcmV0dXJucyBhbiBhdHRyaWJ1dGVzIGhhc2ggdGhhdCBkaWZmZXJzLCB0aGUgbW9kZWwnc1xuICAgIC8vIHN0YXRlIHdpbGwgYmUgYHNldGAgYWdhaW4uXG4gICAgc2F2ZTogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhdHRycywgbWV0aG9kLCB4aHIsIGF0dHJpYnV0ZXMgPSB0aGlzLmF0dHJpYnV0ZXM7XG5cbiAgICAgIC8vIEhhbmRsZSBib3RoIGBcImtleVwiLCB2YWx1ZWAgYW5kIGB7a2V5OiB2YWx1ZX1gIC1zdHlsZSBhcmd1bWVudHMuXG4gICAgICBpZiAoa2V5ID09IG51bGwgfHwgdHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgIH1cblxuICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKHt2YWxpZGF0ZTogdHJ1ZX0sIG9wdGlvbnMpO1xuXG4gICAgICAvLyBJZiB3ZSdyZSBub3Qgd2FpdGluZyBhbmQgYXR0cmlidXRlcyBleGlzdCwgc2F2ZSBhY3RzIGFzXG4gICAgICAvLyBgc2V0KGF0dHIpLnNhdmUobnVsbCwgb3B0cylgIHdpdGggdmFsaWRhdGlvbi4gT3RoZXJ3aXNlLCBjaGVjayBpZlxuICAgICAgLy8gdGhlIG1vZGVsIHdpbGwgYmUgdmFsaWQgd2hlbiB0aGUgYXR0cmlidXRlcywgaWYgYW55LCBhcmUgc2V0LlxuICAgICAgaWYgKGF0dHJzICYmICFvcHRpb25zLndhaXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNldChhdHRycywgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghdGhpcy5fdmFsaWRhdGUoYXR0cnMsIG9wdGlvbnMpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0ZW1wb3JhcnkgYXR0cmlidXRlcyBpZiBge3dhaXQ6IHRydWV9YC5cbiAgICAgIGlmIChhdHRycyAmJiBvcHRpb25zLndhaXQpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gXy5leHRlbmQoe30sIGF0dHJpYnV0ZXMsIGF0dHJzKTtcbiAgICAgIH1cblxuICAgICAgLy8gQWZ0ZXIgYSBzdWNjZXNzZnVsIHNlcnZlci1zaWRlIHNhdmUsIHRoZSBjbGllbnQgaXMgKG9wdGlvbmFsbHkpXG4gICAgICAvLyB1cGRhdGVkIHdpdGggdGhlIHNlcnZlci1zaWRlIHN0YXRlLlxuICAgICAgaWYgKG9wdGlvbnMucGFyc2UgPT09IHZvaWQgMCkgb3B0aW9ucy5wYXJzZSA9IHRydWU7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzO1xuICAgICAgdmFyIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XG4gICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgIC8vIEVuc3VyZSBhdHRyaWJ1dGVzIGFyZSByZXN0b3JlZCBkdXJpbmcgc3luY2hyb25vdXMgc2F2ZXMuXG4gICAgICAgIG1vZGVsLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuICAgICAgICB2YXIgc2VydmVyQXR0cnMgPSBtb2RlbC5wYXJzZShyZXNwLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKG9wdGlvbnMud2FpdCkgc2VydmVyQXR0cnMgPSBfLmV4dGVuZChhdHRycyB8fCB7fSwgc2VydmVyQXR0cnMpO1xuICAgICAgICBpZiAoXy5pc09iamVjdChzZXJ2ZXJBdHRycykgJiYgIW1vZGVsLnNldChzZXJ2ZXJBdHRycywgb3B0aW9ucykpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBtb2RlbC50cmlnZ2VyKCdzeW5jJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcblxuICAgICAgbWV0aG9kID0gdGhpcy5pc05ldygpID8gJ2NyZWF0ZScgOiAob3B0aW9ucy5wYXRjaCA/ICdwYXRjaCcgOiAndXBkYXRlJyk7XG4gICAgICBpZiAobWV0aG9kID09PSAncGF0Y2gnKSBvcHRpb25zLmF0dHJzID0gYXR0cnM7XG4gICAgICB4aHIgPSB0aGlzLnN5bmMobWV0aG9kLCB0aGlzLCBvcHRpb25zKTtcblxuICAgICAgLy8gUmVzdG9yZSBhdHRyaWJ1dGVzLlxuICAgICAgaWYgKGF0dHJzICYmIG9wdGlvbnMud2FpdCkgdGhpcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcblxuICAgICAgcmV0dXJuIHhocjtcbiAgICB9LFxuXG4gICAgLy8gRGVzdHJveSB0aGlzIG1vZGVsIG9uIHRoZSBzZXJ2ZXIgaWYgaXQgd2FzIGFscmVhZHkgcGVyc2lzdGVkLlxuICAgIC8vIE9wdGltaXN0aWNhbGx5IHJlbW92ZXMgdGhlIG1vZGVsIGZyb20gaXRzIGNvbGxlY3Rpb24sIGlmIGl0IGhhcyBvbmUuXG4gICAgLy8gSWYgYHdhaXQ6IHRydWVgIGlzIHBhc3NlZCwgd2FpdHMgZm9yIHRoZSBzZXJ2ZXIgdG8gcmVzcG9uZCBiZWZvcmUgcmVtb3ZhbC5cbiAgICBkZXN0cm95OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICAgIHZhciBtb2RlbCA9IHRoaXM7XG4gICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcblxuICAgICAgdmFyIGRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgbW9kZWwudHJpZ2dlcignZGVzdHJveScsIG1vZGVsLCBtb2RlbC5jb2xsZWN0aW9uLCBvcHRpb25zKTtcbiAgICAgIH07XG5cbiAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgaWYgKG9wdGlvbnMud2FpdCB8fCBtb2RlbC5pc05ldygpKSBkZXN0cm95KCk7XG4gICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKCFtb2RlbC5pc05ldygpKSBtb2RlbC50cmlnZ2VyKCdzeW5jJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xuICAgICAgICBvcHRpb25zLnN1Y2Nlc3MoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgd3JhcEVycm9yKHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgICB2YXIgeGhyID0gdGhpcy5zeW5jKCdkZWxldGUnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgIGlmICghb3B0aW9ucy53YWl0KSBkZXN0cm95KCk7XG4gICAgICByZXR1cm4geGhyO1xuICAgIH0sXG5cbiAgICAvLyBEZWZhdWx0IFVSTCBmb3IgdGhlIG1vZGVsJ3MgcmVwcmVzZW50YXRpb24gb24gdGhlIHNlcnZlciAtLSBpZiB5b3UncmVcbiAgICAvLyB1c2luZyBCYWNrYm9uZSdzIHJlc3RmdWwgbWV0aG9kcywgb3ZlcnJpZGUgdGhpcyB0byBjaGFuZ2UgdGhlIGVuZHBvaW50XG4gICAgLy8gdGhhdCB3aWxsIGJlIGNhbGxlZC5cbiAgICB1cmw6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGJhc2UgPVxuICAgICAgICBfLnJlc3VsdCh0aGlzLCAndXJsUm9vdCcpIHx8XG4gICAgICAgIF8ucmVzdWx0KHRoaXMuY29sbGVjdGlvbiwgJ3VybCcpIHx8XG4gICAgICAgIHVybEVycm9yKCk7XG4gICAgICBpZiAodGhpcy5pc05ldygpKSByZXR1cm4gYmFzZTtcbiAgICAgIHJldHVybiBiYXNlLnJlcGxhY2UoLyhbXlxcL10pJC8sICckMS8nKSArIGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLmlkKTtcbiAgICB9LFxuXG4gICAgLy8gKipwYXJzZSoqIGNvbnZlcnRzIGEgcmVzcG9uc2UgaW50byB0aGUgaGFzaCBvZiBhdHRyaWJ1dGVzIHRvIGJlIGBzZXRgIG9uXG4gICAgLy8gdGhlIG1vZGVsLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBqdXN0IHRvIHBhc3MgdGhlIHJlc3BvbnNlIGFsb25nLlxuICAgIHBhcnNlOiBmdW5jdGlvbihyZXNwLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gcmVzcDtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IG1vZGVsIHdpdGggaWRlbnRpY2FsIGF0dHJpYnV0ZXMgdG8gdGhpcyBvbmUuXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgfSxcblxuICAgIC8vIEEgbW9kZWwgaXMgbmV3IGlmIGl0IGhhcyBuZXZlciBiZWVuIHNhdmVkIHRvIHRoZSBzZXJ2ZXIsIGFuZCBsYWNrcyBhbiBpZC5cbiAgICBpc05ldzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gIXRoaXMuaGFzKHRoaXMuaWRBdHRyaWJ1dGUpO1xuICAgIH0sXG5cbiAgICAvLyBDaGVjayBpZiB0aGUgbW9kZWwgaXMgY3VycmVudGx5IGluIGEgdmFsaWQgc3RhdGUuXG4gICAgaXNWYWxpZDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuX3ZhbGlkYXRlKHt9LCBfLmV4dGVuZChvcHRpb25zIHx8IHt9LCB7IHZhbGlkYXRlOiB0cnVlIH0pKTtcbiAgICB9LFxuXG4gICAgLy8gUnVuIHZhbGlkYXRpb24gYWdhaW5zdCB0aGUgbmV4dCBjb21wbGV0ZSBzZXQgb2YgbW9kZWwgYXR0cmlidXRlcyxcbiAgICAvLyByZXR1cm5pbmcgYHRydWVgIGlmIGFsbCBpcyB3ZWxsLiBPdGhlcndpc2UsIGZpcmUgYW4gYFwiaW52YWxpZFwiYCBldmVudC5cbiAgICBfdmFsaWRhdGU6IGZ1bmN0aW9uKGF0dHJzLCBvcHRpb25zKSB7XG4gICAgICBpZiAoIW9wdGlvbnMudmFsaWRhdGUgfHwgIXRoaXMudmFsaWRhdGUpIHJldHVybiB0cnVlO1xuICAgICAgYXR0cnMgPSBfLmV4dGVuZCh7fSwgdGhpcy5hdHRyaWJ1dGVzLCBhdHRycyk7XG4gICAgICB2YXIgZXJyb3IgPSB0aGlzLnZhbGlkYXRpb25FcnJvciA9IHRoaXMudmFsaWRhdGUoYXR0cnMsIG9wdGlvbnMpIHx8IG51bGw7XG4gICAgICBpZiAoIWVycm9yKSByZXR1cm4gdHJ1ZTtcbiAgICAgIHRoaXMudHJpZ2dlcignaW52YWxpZCcsIHRoaXMsIGVycm9yLCBfLmV4dGVuZChvcHRpb25zLCB7dmFsaWRhdGlvbkVycm9yOiBlcnJvcn0pKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gVW5kZXJzY29yZSBtZXRob2RzIHRoYXQgd2Ugd2FudCB0byBpbXBsZW1lbnQgb24gdGhlIE1vZGVsLlxuICB2YXIgbW9kZWxNZXRob2RzID0gWydrZXlzJywgJ3ZhbHVlcycsICdwYWlycycsICdpbnZlcnQnLCAncGljaycsICdvbWl0J107XG5cbiAgLy8gTWl4IGluIGVhY2ggVW5kZXJzY29yZSBtZXRob2QgYXMgYSBwcm94eSB0byBgTW9kZWwjYXR0cmlidXRlc2AuXG4gIF8uZWFjaChtb2RlbE1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIE1vZGVsLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgICAgcmV0dXJuIF9bbWV0aG9kXS5hcHBseShfLCBhcmdzKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBCYWNrYm9uZS5Db2xsZWN0aW9uXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBJZiBtb2RlbHMgdGVuZCB0byByZXByZXNlbnQgYSBzaW5nbGUgcm93IG9mIGRhdGEsIGEgQmFja2JvbmUgQ29sbGVjdGlvbiBpc1xuICAvLyBtb3JlIGFuYWxhZ291cyB0byBhIHRhYmxlIGZ1bGwgb2YgZGF0YSAuLi4gb3IgYSBzbWFsbCBzbGljZSBvciBwYWdlIG9mIHRoYXRcbiAgLy8gdGFibGUsIG9yIGEgY29sbGVjdGlvbiBvZiByb3dzIHRoYXQgYmVsb25nIHRvZ2V0aGVyIGZvciBhIHBhcnRpY3VsYXIgcmVhc29uXG4gIC8vIC0tIGFsbCBvZiB0aGUgbWVzc2FnZXMgaW4gdGhpcyBwYXJ0aWN1bGFyIGZvbGRlciwgYWxsIG9mIHRoZSBkb2N1bWVudHNcbiAgLy8gYmVsb25naW5nIHRvIHRoaXMgcGFydGljdWxhciBhdXRob3IsIGFuZCBzbyBvbi4gQ29sbGVjdGlvbnMgbWFpbnRhaW5cbiAgLy8gaW5kZXhlcyBvZiB0aGVpciBtb2RlbHMsIGJvdGggaW4gb3JkZXIsIGFuZCBmb3IgbG9va3VwIGJ5IGBpZGAuXG5cbiAgLy8gQ3JlYXRlIGEgbmV3ICoqQ29sbGVjdGlvbioqLCBwZXJoYXBzIHRvIGNvbnRhaW4gYSBzcGVjaWZpYyB0eXBlIG9mIGBtb2RlbGAuXG4gIC8vIElmIGEgYGNvbXBhcmF0b3JgIGlzIHNwZWNpZmllZCwgdGhlIENvbGxlY3Rpb24gd2lsbCBtYWludGFpblxuICAvLyBpdHMgbW9kZWxzIGluIHNvcnQgb3JkZXIsIGFzIHRoZXkncmUgYWRkZWQgYW5kIHJlbW92ZWQuXG4gIHZhciBDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgaWYgKG9wdGlvbnMubW9kZWwpIHRoaXMubW9kZWwgPSBvcHRpb25zLm1vZGVsO1xuICAgIGlmIChvcHRpb25zLmNvbXBhcmF0b3IgIT09IHZvaWQgMCkgdGhpcy5jb21wYXJhdG9yID0gb3B0aW9ucy5jb21wYXJhdG9yO1xuICAgIHRoaXMuX3Jlc2V0KCk7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKG1vZGVscykgdGhpcy5yZXNldChtb2RlbHMsIF8uZXh0ZW5kKHtzaWxlbnQ6IHRydWV9LCBvcHRpb25zKSk7XG4gIH07XG5cbiAgLy8gRGVmYXVsdCBvcHRpb25zIGZvciBgQ29sbGVjdGlvbiNzZXRgLlxuICB2YXIgc2V0T3B0aW9ucyA9IHthZGQ6IHRydWUsIHJlbW92ZTogdHJ1ZSwgbWVyZ2U6IHRydWV9O1xuICB2YXIgYWRkT3B0aW9ucyA9IHthZGQ6IHRydWUsIHJlbW92ZTogZmFsc2V9O1xuXG4gIC8vIERlZmluZSB0aGUgQ29sbGVjdGlvbidzIGluaGVyaXRhYmxlIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKENvbGxlY3Rpb24ucHJvdG90eXBlLCBFdmVudHMsIHtcblxuICAgIC8vIFRoZSBkZWZhdWx0IG1vZGVsIGZvciBhIGNvbGxlY3Rpb24gaXMganVzdCBhICoqQmFja2JvbmUuTW9kZWwqKi5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSBvdmVycmlkZGVuIGluIG1vc3QgY2FzZXMuXG4gICAgbW9kZWw6IE1vZGVsLFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBpcyBhbiBlbXB0eSBmdW5jdGlvbiBieSBkZWZhdWx0LiBPdmVycmlkZSBpdCB3aXRoIHlvdXIgb3duXG4gICAgLy8gaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgLy8gVGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgYSBDb2xsZWN0aW9uIGlzIGFuIGFycmF5IG9mIHRoZVxuICAgIC8vIG1vZGVscycgYXR0cmlidXRlcy5cbiAgICB0b0pTT046IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbihtb2RlbCl7IHJldHVybiBtb2RlbC50b0pTT04ob3B0aW9ucyk7IH0pO1xuICAgIH0sXG5cbiAgICAvLyBQcm94eSBgQmFja2JvbmUuc3luY2AgYnkgZGVmYXVsdC5cbiAgICBzeW5jOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBCYWNrYm9uZS5zeW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIG1vZGVsLCBvciBsaXN0IG9mIG1vZGVscyB0byB0aGUgc2V0LlxuICAgIGFkZDogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXQobW9kZWxzLCBfLmV4dGVuZCh7bWVyZ2U6IGZhbHNlfSwgb3B0aW9ucywgYWRkT3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYSBtb2RlbCwgb3IgYSBsaXN0IG9mIG1vZGVscyBmcm9tIHRoZSBzZXQuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBzaW5ndWxhciA9ICFfLmlzQXJyYXkobW9kZWxzKTtcbiAgICAgIG1vZGVscyA9IHNpbmd1bGFyID8gW21vZGVsc10gOiBfLmNsb25lKG1vZGVscyk7XG4gICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICAgdmFyIGksIGwsIGluZGV4LCBtb2RlbDtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBtb2RlbHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIG1vZGVsID0gbW9kZWxzW2ldID0gdGhpcy5nZXQobW9kZWxzW2ldKTtcbiAgICAgICAgaWYgKCFtb2RlbCkgY29udGludWU7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9ieUlkW21vZGVsLmlkXTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2J5SWRbbW9kZWwuY2lkXTtcbiAgICAgICAgaW5kZXggPSB0aGlzLmluZGV4T2YobW9kZWwpO1xuICAgICAgICB0aGlzLm1vZGVscy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLmxlbmd0aC0tO1xuICAgICAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB7XG4gICAgICAgICAgb3B0aW9ucy5pbmRleCA9IGluZGV4O1xuICAgICAgICAgIG1vZGVsLnRyaWdnZXIoJ3JlbW92ZScsIG1vZGVsLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVSZWZlcmVuY2UobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNpbmd1bGFyID8gbW9kZWxzWzBdIDogbW9kZWxzO1xuICAgIH0sXG5cbiAgICAvLyBVcGRhdGUgYSBjb2xsZWN0aW9uIGJ5IGBzZXRgLWluZyBhIG5ldyBsaXN0IG9mIG1vZGVscywgYWRkaW5nIG5ldyBvbmVzLFxuICAgIC8vIHJlbW92aW5nIG1vZGVscyB0aGF0IGFyZSBubyBsb25nZXIgcHJlc2VudCwgYW5kIG1lcmdpbmcgbW9kZWxzIHRoYXRcbiAgICAvLyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb2xsZWN0aW9uLCBhcyBuZWNlc3NhcnkuIFNpbWlsYXIgdG8gKipNb2RlbCNzZXQqKixcbiAgICAvLyB0aGUgY29yZSBvcGVyYXRpb24gZm9yIHVwZGF0aW5nIHRoZSBkYXRhIGNvbnRhaW5lZCBieSB0aGUgY29sbGVjdGlvbi5cbiAgICBzZXQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IF8uZGVmYXVsdHMoe30sIG9wdGlvbnMsIHNldE9wdGlvbnMpO1xuICAgICAgaWYgKG9wdGlvbnMucGFyc2UpIG1vZGVscyA9IHRoaXMucGFyc2UobW9kZWxzLCBvcHRpb25zKTtcbiAgICAgIHZhciBzaW5ndWxhciA9ICFfLmlzQXJyYXkobW9kZWxzKTtcbiAgICAgIG1vZGVscyA9IHNpbmd1bGFyID8gKG1vZGVscyA/IFttb2RlbHNdIDogW10pIDogXy5jbG9uZShtb2RlbHMpO1xuICAgICAgdmFyIGksIGwsIGlkLCBtb2RlbCwgYXR0cnMsIGV4aXN0aW5nLCBzb3J0O1xuICAgICAgdmFyIGF0ID0gb3B0aW9ucy5hdDtcbiAgICAgIHZhciB0YXJnZXRNb2RlbCA9IHRoaXMubW9kZWw7XG4gICAgICB2YXIgc29ydGFibGUgPSB0aGlzLmNvbXBhcmF0b3IgJiYgKGF0ID09IG51bGwpICYmIG9wdGlvbnMuc29ydCAhPT0gZmFsc2U7XG4gICAgICB2YXIgc29ydEF0dHIgPSBfLmlzU3RyaW5nKHRoaXMuY29tcGFyYXRvcikgPyB0aGlzLmNvbXBhcmF0b3IgOiBudWxsO1xuICAgICAgdmFyIHRvQWRkID0gW10sIHRvUmVtb3ZlID0gW10sIG1vZGVsTWFwID0ge307XG4gICAgICB2YXIgYWRkID0gb3B0aW9ucy5hZGQsIG1lcmdlID0gb3B0aW9ucy5tZXJnZSwgcmVtb3ZlID0gb3B0aW9ucy5yZW1vdmU7XG4gICAgICB2YXIgb3JkZXIgPSAhc29ydGFibGUgJiYgYWRkICYmIHJlbW92ZSA/IFtdIDogZmFsc2U7XG5cbiAgICAgIC8vIFR1cm4gYmFyZSBvYmplY3RzIGludG8gbW9kZWwgcmVmZXJlbmNlcywgYW5kIHByZXZlbnQgaW52YWxpZCBtb2RlbHNcbiAgICAgIC8vIGZyb20gYmVpbmcgYWRkZWQuXG4gICAgICBmb3IgKGkgPSAwLCBsID0gbW9kZWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBhdHRycyA9IG1vZGVsc1tpXSB8fCB7fTtcbiAgICAgICAgaWYgKGF0dHJzIGluc3RhbmNlb2YgTW9kZWwpIHtcbiAgICAgICAgICBpZCA9IG1vZGVsID0gYXR0cnM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWQgPSBhdHRyc1t0YXJnZXRNb2RlbC5wcm90b3R5cGUuaWRBdHRyaWJ1dGUgfHwgJ2lkJ107XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIGR1cGxpY2F0ZSBpcyBmb3VuZCwgcHJldmVudCBpdCBmcm9tIGJlaW5nIGFkZGVkIGFuZFxuICAgICAgICAvLyBvcHRpb25hbGx5IG1lcmdlIGl0IGludG8gdGhlIGV4aXN0aW5nIG1vZGVsLlxuICAgICAgICBpZiAoZXhpc3RpbmcgPSB0aGlzLmdldChpZCkpIHtcbiAgICAgICAgICBpZiAocmVtb3ZlKSBtb2RlbE1hcFtleGlzdGluZy5jaWRdID0gdHJ1ZTtcbiAgICAgICAgICBpZiAobWVyZ2UpIHtcbiAgICAgICAgICAgIGF0dHJzID0gYXR0cnMgPT09IG1vZGVsID8gbW9kZWwuYXR0cmlidXRlcyA6IGF0dHJzO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMucGFyc2UpIGF0dHJzID0gZXhpc3RpbmcucGFyc2UoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgZXhpc3Rpbmcuc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmIChzb3J0YWJsZSAmJiAhc29ydCAmJiBleGlzdGluZy5oYXNDaGFuZ2VkKHNvcnRBdHRyKSkgc29ydCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIG1vZGVsc1tpXSA9IGV4aXN0aW5nO1xuXG4gICAgICAgIC8vIElmIHRoaXMgaXMgYSBuZXcsIHZhbGlkIG1vZGVsLCBwdXNoIGl0IHRvIHRoZSBgdG9BZGRgIGxpc3QuXG4gICAgICAgIH0gZWxzZSBpZiAoYWRkKSB7XG4gICAgICAgICAgbW9kZWwgPSBtb2RlbHNbaV0gPSB0aGlzLl9wcmVwYXJlTW9kZWwoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgICAgIGlmICghbW9kZWwpIGNvbnRpbnVlO1xuICAgICAgICAgIHRvQWRkLnB1c2gobW9kZWwpO1xuICAgICAgICAgIHRoaXMuX2FkZFJlZmVyZW5jZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyBub3QgYWRkIG11bHRpcGxlIG1vZGVscyB3aXRoIHRoZSBzYW1lIGBpZGAuXG4gICAgICAgIG1vZGVsID0gZXhpc3RpbmcgfHwgbW9kZWw7XG4gICAgICAgIGlmIChvcmRlciAmJiAobW9kZWwuaXNOZXcoKSB8fCAhbW9kZWxNYXBbbW9kZWwuaWRdKSkgb3JkZXIucHVzaChtb2RlbCk7XG4gICAgICAgIG1vZGVsTWFwW21vZGVsLmlkXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSBub25leGlzdGVudCBtb2RlbHMgaWYgYXBwcm9wcmlhdGUuXG4gICAgICBpZiAocmVtb3ZlKSB7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgIGlmICghbW9kZWxNYXBbKG1vZGVsID0gdGhpcy5tb2RlbHNbaV0pLmNpZF0pIHRvUmVtb3ZlLnB1c2gobW9kZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0b1JlbW92ZS5sZW5ndGgpIHRoaXMucmVtb3ZlKHRvUmVtb3ZlLCBvcHRpb25zKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VlIGlmIHNvcnRpbmcgaXMgbmVlZGVkLCB1cGRhdGUgYGxlbmd0aGAgYW5kIHNwbGljZSBpbiBuZXcgbW9kZWxzLlxuICAgICAgaWYgKHRvQWRkLmxlbmd0aCB8fCAob3JkZXIgJiYgb3JkZXIubGVuZ3RoKSkge1xuICAgICAgICBpZiAoc29ydGFibGUpIHNvcnQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxlbmd0aCArPSB0b0FkZC5sZW5ndGg7XG4gICAgICAgIGlmIChhdCAhPSBudWxsKSB7XG4gICAgICAgICAgZm9yIChpID0gMCwgbCA9IHRvQWRkLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5tb2RlbHMuc3BsaWNlKGF0ICsgaSwgMCwgdG9BZGRbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob3JkZXIpIHRoaXMubW9kZWxzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgdmFyIG9yZGVyZWRNb2RlbHMgPSBvcmRlciB8fCB0b0FkZDtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBsID0gb3JkZXJlZE1vZGVscy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxzLnB1c2gob3JkZXJlZE1vZGVsc1tpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNpbGVudGx5IHNvcnQgdGhlIGNvbGxlY3Rpb24gaWYgYXBwcm9wcmlhdGUuXG4gICAgICBpZiAoc29ydCkgdGhpcy5zb3J0KHtzaWxlbnQ6IHRydWV9KTtcblxuICAgICAgLy8gVW5sZXNzIHNpbGVuY2VkLCBpdCdzIHRpbWUgdG8gZmlyZSBhbGwgYXBwcm9wcmlhdGUgYWRkL3NvcnQgZXZlbnRzLlxuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gdG9BZGQubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgKG1vZGVsID0gdG9BZGRbaV0pLnRyaWdnZXIoJ2FkZCcsIG1vZGVsLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc29ydCB8fCAob3JkZXIgJiYgb3JkZXIubGVuZ3RoKSkgdGhpcy50cmlnZ2VyKCdzb3J0JywgdGhpcywgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybiB0aGUgYWRkZWQgKG9yIG1lcmdlZCkgbW9kZWwgKG9yIG1vZGVscykuXG4gICAgICByZXR1cm4gc2luZ3VsYXIgPyBtb2RlbHNbMF0gOiBtb2RlbHM7XG4gICAgfSxcblxuICAgIC8vIFdoZW4geW91IGhhdmUgbW9yZSBpdGVtcyB0aGFuIHlvdSB3YW50IHRvIGFkZCBvciByZW1vdmUgaW5kaXZpZHVhbGx5LFxuICAgIC8vIHlvdSBjYW4gcmVzZXQgdGhlIGVudGlyZSBzZXQgd2l0aCBhIG5ldyBsaXN0IG9mIG1vZGVscywgd2l0aG91dCBmaXJpbmdcbiAgICAvLyBhbnkgZ3JhbnVsYXIgYGFkZGAgb3IgYHJlbW92ZWAgZXZlbnRzLiBGaXJlcyBgcmVzZXRgIHdoZW4gZmluaXNoZWQuXG4gICAgLy8gVXNlZnVsIGZvciBidWxrIG9wZXJhdGlvbnMgYW5kIG9wdGltaXphdGlvbnMuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5tb2RlbHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVJlZmVyZW5jZSh0aGlzLm1vZGVsc1tpXSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBvcHRpb25zLnByZXZpb3VzTW9kZWxzID0gdGhpcy5tb2RlbHM7XG4gICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgbW9kZWxzID0gdGhpcy5hZGQobW9kZWxzLCBfLmV4dGVuZCh7c2lsZW50OiB0cnVlfSwgb3B0aW9ucykpO1xuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy50cmlnZ2VyKCdyZXNldCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG1vZGVscztcbiAgICB9LFxuXG4gICAgLy8gQWRkIGEgbW9kZWwgdG8gdGhlIGVuZCBvZiB0aGUgY29sbGVjdGlvbi5cbiAgICBwdXNoOiBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuYWRkKG1vZGVsLCBfLmV4dGVuZCh7YXQ6IHRoaXMubGVuZ3RofSwgb3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYSBtb2RlbCBmcm9tIHRoZSBlbmQgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgcG9wOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzLmF0KHRoaXMubGVuZ3RoIC0gMSk7XG4gICAgICB0aGlzLnJlbW92ZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gbW9kZWw7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIG1vZGVsIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgdW5zaGlmdDogZnVuY3Rpb24obW9kZWwsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLmFkZChtb2RlbCwgXy5leHRlbmQoe2F0OiAwfSwgb3B0aW9ucykpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgYSBtb2RlbCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgc2hpZnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHZhciBtb2RlbCA9IHRoaXMuYXQoMCk7XG4gICAgICB0aGlzLnJlbW92ZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gbW9kZWw7XG4gICAgfSxcblxuICAgIC8vIFNsaWNlIG91dCBhIHN1Yi1hcnJheSBvZiBtb2RlbHMgZnJvbSB0aGUgY29sbGVjdGlvbi5cbiAgICBzbGljZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2xpY2UuYXBwbHkodGhpcy5tb2RlbHMsIGFyZ3VtZW50cyk7XG4gICAgfSxcblxuICAgIC8vIEdldCBhIG1vZGVsIGZyb20gdGhlIHNldCBieSBpZC5cbiAgICBnZXQ6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgICAgcmV0dXJuIHRoaXMuX2J5SWRbb2JqXSB8fCB0aGlzLl9ieUlkW29iai5pZF0gfHwgdGhpcy5fYnlJZFtvYmouY2lkXTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBtb2RlbCBhdCB0aGUgZ2l2ZW4gaW5kZXguXG4gICAgYXQ6IGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbHNbaW5kZXhdO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm4gbW9kZWxzIHdpdGggbWF0Y2hpbmcgYXR0cmlidXRlcy4gVXNlZnVsIGZvciBzaW1wbGUgY2FzZXMgb2ZcbiAgICAvLyBgZmlsdGVyYC5cbiAgICB3aGVyZTogZnVuY3Rpb24oYXR0cnMsIGZpcnN0KSB7XG4gICAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgICByZXR1cm4gdGhpc1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShmdW5jdGlvbihtb2RlbCkge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gbW9kZWwuZ2V0KGtleSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm4gdGhlIGZpcnN0IG1vZGVsIHdpdGggbWF0Y2hpbmcgYXR0cmlidXRlcy4gVXNlZnVsIGZvciBzaW1wbGUgY2FzZXNcbiAgICAvLyBvZiBgZmluZGAuXG4gICAgZmluZFdoZXJlOiBmdW5jdGlvbihhdHRycykge1xuICAgICAgcmV0dXJuIHRoaXMud2hlcmUoYXR0cnMsIHRydWUpO1xuICAgIH0sXG5cbiAgICAvLyBGb3JjZSB0aGUgY29sbGVjdGlvbiB0byByZS1zb3J0IGl0c2VsZi4gWW91IGRvbid0IG5lZWQgdG8gY2FsbCB0aGlzIHVuZGVyXG4gICAgLy8gbm9ybWFsIGNpcmN1bXN0YW5jZXMsIGFzIHRoZSBzZXQgd2lsbCBtYWludGFpbiBzb3J0IG9yZGVyIGFzIGVhY2ggaXRlbVxuICAgIC8vIGlzIGFkZGVkLlxuICAgIHNvcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGlmICghdGhpcy5jb21wYXJhdG9yKSB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzb3J0IGEgc2V0IHdpdGhvdXQgYSBjb21wYXJhdG9yJyk7XG4gICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgICAvLyBSdW4gc29ydCBiYXNlZCBvbiB0eXBlIG9mIGBjb21wYXJhdG9yYC5cbiAgICAgIGlmIChfLmlzU3RyaW5nKHRoaXMuY29tcGFyYXRvcikgfHwgdGhpcy5jb21wYXJhdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLm1vZGVscyA9IHRoaXMuc29ydEJ5KHRoaXMuY29tcGFyYXRvciwgdGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1vZGVscy5zb3J0KF8uYmluZCh0aGlzLmNvbXBhcmF0b3IsIHRoaXMpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy50cmlnZ2VyKCdzb3J0JywgdGhpcywgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gUGx1Y2sgYW4gYXR0cmlidXRlIGZyb20gZWFjaCBtb2RlbCBpbiB0aGUgY29sbGVjdGlvbi5cbiAgICBwbHVjazogZnVuY3Rpb24oYXR0cikge1xuICAgICAgcmV0dXJuIF8uaW52b2tlKHRoaXMubW9kZWxzLCAnZ2V0JywgYXR0cik7XG4gICAgfSxcblxuICAgIC8vIEZldGNoIHRoZSBkZWZhdWx0IHNldCBvZiBtb2RlbHMgZm9yIHRoaXMgY29sbGVjdGlvbiwgcmVzZXR0aW5nIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24gd2hlbiB0aGV5IGFycml2ZS4gSWYgYHJlc2V0OiB0cnVlYCBpcyBwYXNzZWQsIHRoZSByZXNwb25zZVxuICAgIC8vIGRhdGEgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0aGUgYHJlc2V0YCBtZXRob2QgaW5zdGVhZCBvZiBgc2V0YC5cbiAgICBmZXRjaDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICBpZiAob3B0aW9ucy5wYXJzZSA9PT0gdm9pZCAwKSBvcHRpb25zLnBhcnNlID0gdHJ1ZTtcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgdmFyIGNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICB2YXIgbWV0aG9kID0gb3B0aW9ucy5yZXNldCA/ICdyZXNldCcgOiAnc2V0JztcbiAgICAgICAgY29sbGVjdGlvblttZXRob2RdKHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhjb2xsZWN0aW9uLCByZXNwLCBvcHRpb25zKTtcbiAgICAgICAgY29sbGVjdGlvbi50cmlnZ2VyKCdzeW5jJywgY29sbGVjdGlvbiwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICB9O1xuICAgICAgd3JhcEVycm9yKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRoaXMuc3luYygncmVhZCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgaW5zdGFuY2Ugb2YgYSBtb2RlbCBpbiB0aGlzIGNvbGxlY3Rpb24uIEFkZCB0aGUgbW9kZWwgdG8gdGhlXG4gICAgLy8gY29sbGVjdGlvbiBpbW1lZGlhdGVseSwgdW5sZXNzIGB3YWl0OiB0cnVlYCBpcyBwYXNzZWQsIGluIHdoaWNoIGNhc2Ugd2VcbiAgICAvLyB3YWl0IGZvciB0aGUgc2VydmVyIHRvIGFncmVlLlxuICAgIGNyZWF0ZTogZnVuY3Rpb24obW9kZWwsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgICAgaWYgKCEobW9kZWwgPSB0aGlzLl9wcmVwYXJlTW9kZWwobW9kZWwsIG9wdGlvbnMpKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCFvcHRpb25zLndhaXQpIHRoaXMuYWRkKG1vZGVsLCBvcHRpb25zKTtcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gdGhpcztcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24obW9kZWwsIHJlc3ApIHtcbiAgICAgICAgaWYgKG9wdGlvbnMud2FpdCkgY29sbGVjdGlvbi5hZGQobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICB9O1xuICAgICAgbW9kZWwuc2F2ZShudWxsLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiBtb2RlbDtcbiAgICB9LFxuXG4gICAgLy8gKipwYXJzZSoqIGNvbnZlcnRzIGEgcmVzcG9uc2UgaW50byBhIGxpc3Qgb2YgbW9kZWxzIHRvIGJlIGFkZGVkIHRvIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24uIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIGlzIGp1c3QgdG8gcGFzcyBpdCB0aHJvdWdoLlxuICAgIHBhcnNlOiBmdW5jdGlvbihyZXNwLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gcmVzcDtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGNvbGxlY3Rpb24gd2l0aCBhbiBpZGVudGljYWwgbGlzdCBvZiBtb2RlbHMgYXMgdGhpcyBvbmUuXG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMubW9kZWxzKTtcbiAgICB9LFxuXG4gICAgLy8gUHJpdmF0ZSBtZXRob2QgdG8gcmVzZXQgYWxsIGludGVybmFsIHN0YXRlLiBDYWxsZWQgd2hlbiB0aGUgY29sbGVjdGlvblxuICAgIC8vIGlzIGZpcnN0IGluaXRpYWxpemVkIG9yIHJlc2V0LlxuICAgIF9yZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLm1vZGVscyA9IFtdO1xuICAgICAgdGhpcy5fYnlJZCAgPSB7fTtcbiAgICB9LFxuXG4gICAgLy8gUHJlcGFyZSBhIGhhc2ggb2YgYXR0cmlidXRlcyAob3Igb3RoZXIgbW9kZWwpIHRvIGJlIGFkZGVkIHRvIHRoaXNcbiAgICAvLyBjb2xsZWN0aW9uLlxuICAgIF9wcmVwYXJlTW9kZWw6IGZ1bmN0aW9uKGF0dHJzLCBvcHRpb25zKSB7XG4gICAgICBpZiAoYXR0cnMgaW5zdGFuY2VvZiBNb2RlbCkgcmV0dXJuIGF0dHJzO1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICBvcHRpb25zLmNvbGxlY3Rpb24gPSB0aGlzO1xuICAgICAgdmFyIG1vZGVsID0gbmV3IHRoaXMubW9kZWwoYXR0cnMsIG9wdGlvbnMpO1xuICAgICAgaWYgKCFtb2RlbC52YWxpZGF0aW9uRXJyb3IpIHJldHVybiBtb2RlbDtcbiAgICAgIHRoaXMudHJpZ2dlcignaW52YWxpZCcsIHRoaXMsIG1vZGVsLnZhbGlkYXRpb25FcnJvciwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIEludGVybmFsIG1ldGhvZCB0byBjcmVhdGUgYSBtb2RlbCdzIHRpZXMgdG8gYSBjb2xsZWN0aW9uLlxuICAgIF9hZGRSZWZlcmVuY2U6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICB0aGlzLl9ieUlkW21vZGVsLmNpZF0gPSBtb2RlbDtcbiAgICAgIGlmIChtb2RlbC5pZCAhPSBudWxsKSB0aGlzLl9ieUlkW21vZGVsLmlkXSA9IG1vZGVsO1xuICAgICAgaWYgKCFtb2RlbC5jb2xsZWN0aW9uKSBtb2RlbC5jb2xsZWN0aW9uID0gdGhpcztcbiAgICAgIG1vZGVsLm9uKCdhbGwnLCB0aGlzLl9vbk1vZGVsRXZlbnQsIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvLyBJbnRlcm5hbCBtZXRob2QgdG8gc2V2ZXIgYSBtb2RlbCdzIHRpZXMgdG8gYSBjb2xsZWN0aW9uLlxuICAgIF9yZW1vdmVSZWZlcmVuY2U6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICBpZiAodGhpcyA9PT0gbW9kZWwuY29sbGVjdGlvbikgZGVsZXRlIG1vZGVsLmNvbGxlY3Rpb247XG4gICAgICBtb2RlbC5vZmYoJ2FsbCcsIHRoaXMuX29uTW9kZWxFdmVudCwgdGhpcyk7XG4gICAgfSxcblxuICAgIC8vIEludGVybmFsIG1ldGhvZCBjYWxsZWQgZXZlcnkgdGltZSBhIG1vZGVsIGluIHRoZSBzZXQgZmlyZXMgYW4gZXZlbnQuXG4gICAgLy8gU2V0cyBuZWVkIHRvIHVwZGF0ZSB0aGVpciBpbmRleGVzIHdoZW4gbW9kZWxzIGNoYW5nZSBpZHMuIEFsbCBvdGhlclxuICAgIC8vIGV2ZW50cyBzaW1wbHkgcHJveHkgdGhyb3VnaC4gXCJhZGRcIiBhbmQgXCJyZW1vdmVcIiBldmVudHMgdGhhdCBvcmlnaW5hdGVcbiAgICAvLyBpbiBvdGhlciBjb2xsZWN0aW9ucyBhcmUgaWdub3JlZC5cbiAgICBfb25Nb2RlbEV2ZW50OiBmdW5jdGlvbihldmVudCwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpIHtcbiAgICAgIGlmICgoZXZlbnQgPT09ICdhZGQnIHx8IGV2ZW50ID09PSAncmVtb3ZlJykgJiYgY29sbGVjdGlvbiAhPT0gdGhpcykgcmV0dXJuO1xuICAgICAgaWYgKGV2ZW50ID09PSAnZGVzdHJveScpIHRoaXMucmVtb3ZlKG1vZGVsLCBvcHRpb25zKTtcbiAgICAgIGlmIChtb2RlbCAmJiBldmVudCA9PT0gJ2NoYW5nZTonICsgbW9kZWwuaWRBdHRyaWJ1dGUpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX2J5SWRbbW9kZWwucHJldmlvdXMobW9kZWwuaWRBdHRyaWJ1dGUpXTtcbiAgICAgICAgaWYgKG1vZGVsLmlkICE9IG51bGwpIHRoaXMuX2J5SWRbbW9kZWwuaWRdID0gbW9kZWw7XG4gICAgICB9XG4gICAgICB0aGlzLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gVW5kZXJzY29yZSBtZXRob2RzIHRoYXQgd2Ugd2FudCB0byBpbXBsZW1lbnQgb24gdGhlIENvbGxlY3Rpb24uXG4gIC8vIDkwJSBvZiB0aGUgY29yZSB1c2VmdWxuZXNzIG9mIEJhY2tib25lIENvbGxlY3Rpb25zIGlzIGFjdHVhbGx5IGltcGxlbWVudGVkXG4gIC8vIHJpZ2h0IGhlcmU6XG4gIHZhciBtZXRob2RzID0gWydmb3JFYWNoJywgJ2VhY2gnLCAnbWFwJywgJ2NvbGxlY3QnLCAncmVkdWNlJywgJ2ZvbGRsJyxcbiAgICAnaW5qZWN0JywgJ3JlZHVjZVJpZ2h0JywgJ2ZvbGRyJywgJ2ZpbmQnLCAnZGV0ZWN0JywgJ2ZpbHRlcicsICdzZWxlY3QnLFxuICAgICdyZWplY3QnLCAnZXZlcnknLCAnYWxsJywgJ3NvbWUnLCAnYW55JywgJ2luY2x1ZGUnLCAnY29udGFpbnMnLCAnaW52b2tlJyxcbiAgICAnbWF4JywgJ21pbicsICd0b0FycmF5JywgJ3NpemUnLCAnZmlyc3QnLCAnaGVhZCcsICd0YWtlJywgJ2luaXRpYWwnLCAncmVzdCcsXG4gICAgJ3RhaWwnLCAnZHJvcCcsICdsYXN0JywgJ3dpdGhvdXQnLCAnZGlmZmVyZW5jZScsICdpbmRleE9mJywgJ3NodWZmbGUnLFxuICAgICdsYXN0SW5kZXhPZicsICdpc0VtcHR5JywgJ2NoYWluJywgJ3NhbXBsZSddO1xuXG4gIC8vIE1peCBpbiBlYWNoIFVuZGVyc2NvcmUgbWV0aG9kIGFzIGEgcHJveHkgdG8gYENvbGxlY3Rpb24jbW9kZWxzYC5cbiAgXy5lYWNoKG1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIENvbGxlY3Rpb24ucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgYXJncy51bnNoaWZ0KHRoaXMubW9kZWxzKTtcbiAgICAgIHJldHVybiBfW21ldGhvZF0uYXBwbHkoXywgYXJncyk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gVW5kZXJzY29yZSBtZXRob2RzIHRoYXQgdGFrZSBhIHByb3BlcnR5IG5hbWUgYXMgYW4gYXJndW1lbnQuXG4gIHZhciBhdHRyaWJ1dGVNZXRob2RzID0gWydncm91cEJ5JywgJ2NvdW50QnknLCAnc29ydEJ5JywgJ2luZGV4QnknXTtcblxuICAvLyBVc2UgYXR0cmlidXRlcyBpbnN0ZWFkIG9mIHByb3BlcnRpZXMuXG4gIF8uZWFjaChhdHRyaWJ1dGVNZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG1vZGVsKSB7XG4gICAgICAgIHJldHVybiBtb2RlbC5nZXQodmFsdWUpO1xuICAgICAgfTtcbiAgICAgIHJldHVybiBfW21ldGhvZF0odGhpcy5tb2RlbHMsIGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBCYWNrYm9uZS5WaWV3XG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBCYWNrYm9uZSBWaWV3cyBhcmUgYWxtb3N0IG1vcmUgY29udmVudGlvbiB0aGFuIHRoZXkgYXJlIGFjdHVhbCBjb2RlLiBBIFZpZXdcbiAgLy8gaXMgc2ltcGx5IGEgSmF2YVNjcmlwdCBvYmplY3QgdGhhdCByZXByZXNlbnRzIGEgbG9naWNhbCBjaHVuayBvZiBVSSBpbiB0aGVcbiAgLy8gRE9NLiBUaGlzIG1pZ2h0IGJlIGEgc2luZ2xlIGl0ZW0sIGFuIGVudGlyZSBsaXN0LCBhIHNpZGViYXIgb3IgcGFuZWwsIG9yXG4gIC8vIGV2ZW4gdGhlIHN1cnJvdW5kaW5nIGZyYW1lIHdoaWNoIHdyYXBzIHlvdXIgd2hvbGUgYXBwLiBEZWZpbmluZyBhIGNodW5rIG9mXG4gIC8vIFVJIGFzIGEgKipWaWV3KiogYWxsb3dzIHlvdSB0byBkZWZpbmUgeW91ciBET00gZXZlbnRzIGRlY2xhcmF0aXZlbHksIHdpdGhvdXRcbiAgLy8gaGF2aW5nIHRvIHdvcnJ5IGFib3V0IHJlbmRlciBvcmRlciAuLi4gYW5kIG1ha2VzIGl0IGVhc3kgZm9yIHRoZSB2aWV3IHRvXG4gIC8vIHJlYWN0IHRvIHNwZWNpZmljIGNoYW5nZXMgaW4gdGhlIHN0YXRlIG9mIHlvdXIgbW9kZWxzLlxuXG4gIC8vIENyZWF0aW5nIGEgQmFja2JvbmUuVmlldyBjcmVhdGVzIGl0cyBpbml0aWFsIGVsZW1lbnQgb3V0c2lkZSBvZiB0aGUgRE9NLFxuICAvLyBpZiBhbiBleGlzdGluZyBlbGVtZW50IGlzIG5vdCBwcm92aWRlZC4uLlxuICB2YXIgVmlldyA9IEJhY2tib25lLlZpZXcgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCd2aWV3Jyk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBfLmV4dGVuZCh0aGlzLCBfLnBpY2sob3B0aW9ucywgdmlld09wdGlvbnMpKTtcbiAgICB0aGlzLl9lbnN1cmVFbGVtZW50KCk7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgdGhpcy5kZWxlZ2F0ZUV2ZW50cygpO1xuICB9O1xuXG4gIC8vIENhY2hlZCByZWdleCB0byBzcGxpdCBrZXlzIGZvciBgZGVsZWdhdGVgLlxuICB2YXIgZGVsZWdhdGVFdmVudFNwbGl0dGVyID0gL14oXFxTKylcXHMqKC4qKSQvO1xuXG4gIC8vIExpc3Qgb2YgdmlldyBvcHRpb25zIHRvIGJlIG1lcmdlZCBhcyBwcm9wZXJ0aWVzLlxuICB2YXIgdmlld09wdGlvbnMgPSBbJ21vZGVsJywgJ2NvbGxlY3Rpb24nLCAnZWwnLCAnaWQnLCAnYXR0cmlidXRlcycsICdjbGFzc05hbWUnLCAndGFnTmFtZScsICdldmVudHMnXTtcblxuICAvLyBTZXQgdXAgYWxsIGluaGVyaXRhYmxlICoqQmFja2JvbmUuVmlldyoqIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKFZpZXcucHJvdG90eXBlLCBFdmVudHMsIHtcblxuICAgIC8vIFRoZSBkZWZhdWx0IGB0YWdOYW1lYCBvZiBhIFZpZXcncyBlbGVtZW50IGlzIGBcImRpdlwiYC5cbiAgICB0YWdOYW1lOiAnZGl2JyxcblxuICAgIC8vIGpRdWVyeSBkZWxlZ2F0ZSBmb3IgZWxlbWVudCBsb29rdXAsIHNjb3BlZCB0byBET00gZWxlbWVudHMgd2l0aGluIHRoZVxuICAgIC8vIGN1cnJlbnQgdmlldy4gVGhpcyBzaG91bGQgYmUgcHJlZmVycmVkIHRvIGdsb2JhbCBsb29rdXBzIHdoZXJlIHBvc3NpYmxlLlxuICAgICQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICByZXR1cm4gdGhpcy4kZWwuZmluZChzZWxlY3Rvcik7XG4gICAgfSxcblxuICAgIC8vIEluaXRpYWxpemUgaXMgYW4gZW1wdHkgZnVuY3Rpb24gYnkgZGVmYXVsdC4gT3ZlcnJpZGUgaXQgd2l0aCB5b3VyIG93blxuICAgIC8vIGluaXRpYWxpemF0aW9uIGxvZ2ljLlxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCl7fSxcblxuICAgIC8vICoqcmVuZGVyKiogaXMgdGhlIGNvcmUgZnVuY3Rpb24gdGhhdCB5b3VyIHZpZXcgc2hvdWxkIG92ZXJyaWRlLCBpbiBvcmRlclxuICAgIC8vIHRvIHBvcHVsYXRlIGl0cyBlbGVtZW50IChgdGhpcy5lbGApLCB3aXRoIHRoZSBhcHByb3ByaWF0ZSBIVE1MLiBUaGVcbiAgICAvLyBjb252ZW50aW9uIGlzIGZvciAqKnJlbmRlcioqIHRvIGFsd2F5cyByZXR1cm4gYHRoaXNgLlxuICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIHRoaXMgdmlldyBieSB0YWtpbmcgdGhlIGVsZW1lbnQgb3V0IG9mIHRoZSBET00sIGFuZCByZW1vdmluZyBhbnlcbiAgICAvLyBhcHBsaWNhYmxlIEJhY2tib25lLkV2ZW50cyBsaXN0ZW5lcnMuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuJGVsLnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdG9wTGlzdGVuaW5nKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQ2hhbmdlIHRoZSB2aWV3J3MgZWxlbWVudCAoYHRoaXMuZWxgIHByb3BlcnR5KSwgaW5jbHVkaW5nIGV2ZW50XG4gICAgLy8gcmUtZGVsZWdhdGlvbi5cbiAgICBzZXRFbGVtZW50OiBmdW5jdGlvbihlbGVtZW50LCBkZWxlZ2F0ZSkge1xuICAgICAgaWYgKHRoaXMuJGVsKSB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICAgIHRoaXMuJGVsID0gZWxlbWVudCBpbnN0YW5jZW9mIEJhY2tib25lLiQgPyBlbGVtZW50IDogQmFja2JvbmUuJChlbGVtZW50KTtcbiAgICAgIHRoaXMuZWwgPSB0aGlzLiRlbFswXTtcbiAgICAgIGlmIChkZWxlZ2F0ZSAhPT0gZmFsc2UpIHRoaXMuZGVsZWdhdGVFdmVudHMoKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBTZXQgY2FsbGJhY2tzLCB3aGVyZSBgdGhpcy5ldmVudHNgIGlzIGEgaGFzaCBvZlxuICAgIC8vXG4gICAgLy8gKntcImV2ZW50IHNlbGVjdG9yXCI6IFwiY2FsbGJhY2tcIn0qXG4gICAgLy9cbiAgICAvLyAgICAge1xuICAgIC8vICAgICAgICdtb3VzZWRvd24gLnRpdGxlJzogICdlZGl0JyxcbiAgICAvLyAgICAgICAnY2xpY2sgLmJ1dHRvbic6ICAgICAnc2F2ZScsXG4gICAgLy8gICAgICAgJ2NsaWNrIC5vcGVuJzogICAgICAgZnVuY3Rpb24oZSkgeyAuLi4gfVxuICAgIC8vICAgICB9XG4gICAgLy9cbiAgICAvLyBwYWlycy4gQ2FsbGJhY2tzIHdpbGwgYmUgYm91bmQgdG8gdGhlIHZpZXcsIHdpdGggYHRoaXNgIHNldCBwcm9wZXJseS5cbiAgICAvLyBVc2VzIGV2ZW50IGRlbGVnYXRpb24gZm9yIGVmZmljaWVuY3kuXG4gICAgLy8gT21pdHRpbmcgdGhlIHNlbGVjdG9yIGJpbmRzIHRoZSBldmVudCB0byBgdGhpcy5lbGAuXG4gICAgLy8gVGhpcyBvbmx5IHdvcmtzIGZvciBkZWxlZ2F0ZS1hYmxlIGV2ZW50czogbm90IGBmb2N1c2AsIGBibHVyYCwgYW5kXG4gICAgLy8gbm90IGBjaGFuZ2VgLCBgc3VibWl0YCwgYW5kIGByZXNldGAgaW4gSW50ZXJuZXQgRXhwbG9yZXIuXG4gICAgZGVsZWdhdGVFdmVudHM6IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgICAgaWYgKCEoZXZlbnRzIHx8IChldmVudHMgPSBfLnJlc3VsdCh0aGlzLCAnZXZlbnRzJykpKSkgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICAgIGZvciAodmFyIGtleSBpbiBldmVudHMpIHtcbiAgICAgICAgdmFyIG1ldGhvZCA9IGV2ZW50c1trZXldO1xuICAgICAgICBpZiAoIV8uaXNGdW5jdGlvbihtZXRob2QpKSBtZXRob2QgPSB0aGlzW2V2ZW50c1trZXldXTtcbiAgICAgICAgaWYgKCFtZXRob2QpIGNvbnRpbnVlO1xuXG4gICAgICAgIHZhciBtYXRjaCA9IGtleS5tYXRjaChkZWxlZ2F0ZUV2ZW50U3BsaXR0ZXIpO1xuICAgICAgICB2YXIgZXZlbnROYW1lID0gbWF0Y2hbMV0sIHNlbGVjdG9yID0gbWF0Y2hbMl07XG4gICAgICAgIG1ldGhvZCA9IF8uYmluZChtZXRob2QsIHRoaXMpO1xuICAgICAgICBldmVudE5hbWUgKz0gJy5kZWxlZ2F0ZUV2ZW50cycgKyB0aGlzLmNpZDtcbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykge1xuICAgICAgICAgIHRoaXMuJGVsLm9uKGV2ZW50TmFtZSwgbWV0aG9kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiRlbC5vbihldmVudE5hbWUsIHNlbGVjdG9yLCBtZXRob2QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQ2xlYXJzIGFsbCBjYWxsYmFja3MgcHJldmlvdXNseSBib3VuZCB0byB0aGUgdmlldyB3aXRoIGBkZWxlZ2F0ZUV2ZW50c2AuXG4gICAgLy8gWW91IHVzdWFsbHkgZG9uJ3QgbmVlZCB0byB1c2UgdGhpcywgYnV0IG1heSB3aXNoIHRvIGlmIHlvdSBoYXZlIG11bHRpcGxlXG4gICAgLy8gQmFja2JvbmUgdmlld3MgYXR0YWNoZWQgdG8gdGhlIHNhbWUgRE9NIGVsZW1lbnQuXG4gICAgdW5kZWxlZ2F0ZUV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5vZmYoJy5kZWxlZ2F0ZUV2ZW50cycgKyB0aGlzLmNpZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIFZpZXcgaGFzIGEgRE9NIGVsZW1lbnQgdG8gcmVuZGVyIGludG8uXG4gICAgLy8gSWYgYHRoaXMuZWxgIGlzIGEgc3RyaW5nLCBwYXNzIGl0IHRocm91Z2ggYCQoKWAsIHRha2UgdGhlIGZpcnN0XG4gICAgLy8gbWF0Y2hpbmcgZWxlbWVudCwgYW5kIHJlLWFzc2lnbiBpdCB0byBgZWxgLiBPdGhlcndpc2UsIGNyZWF0ZVxuICAgIC8vIGFuIGVsZW1lbnQgZnJvbSB0aGUgYGlkYCwgYGNsYXNzTmFtZWAgYW5kIGB0YWdOYW1lYCBwcm9wZXJ0aWVzLlxuICAgIF9lbnN1cmVFbGVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghdGhpcy5lbCkge1xuICAgICAgICB2YXIgYXR0cnMgPSBfLmV4dGVuZCh7fSwgXy5yZXN1bHQodGhpcywgJ2F0dHJpYnV0ZXMnKSk7XG4gICAgICAgIGlmICh0aGlzLmlkKSBhdHRycy5pZCA9IF8ucmVzdWx0KHRoaXMsICdpZCcpO1xuICAgICAgICBpZiAodGhpcy5jbGFzc05hbWUpIGF0dHJzWydjbGFzcyddID0gXy5yZXN1bHQodGhpcywgJ2NsYXNzTmFtZScpO1xuICAgICAgICB2YXIgJGVsID0gQmFja2JvbmUuJCgnPCcgKyBfLnJlc3VsdCh0aGlzLCAndGFnTmFtZScpICsgJz4nKS5hdHRyKGF0dHJzKTtcbiAgICAgICAgdGhpcy5zZXRFbGVtZW50KCRlbCwgZmFsc2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRFbGVtZW50KF8ucmVzdWx0KHRoaXMsICdlbCcpLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIEJhY2tib25lLnN5bmNcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIE92ZXJyaWRlIHRoaXMgZnVuY3Rpb24gdG8gY2hhbmdlIHRoZSBtYW5uZXIgaW4gd2hpY2ggQmFja2JvbmUgcGVyc2lzdHNcbiAgLy8gbW9kZWxzIHRvIHRoZSBzZXJ2ZXIuIFlvdSB3aWxsIGJlIHBhc3NlZCB0aGUgdHlwZSBvZiByZXF1ZXN0LCBhbmQgdGhlXG4gIC8vIG1vZGVsIGluIHF1ZXN0aW9uLiBCeSBkZWZhdWx0LCBtYWtlcyBhIFJFU1RmdWwgQWpheCByZXF1ZXN0XG4gIC8vIHRvIHRoZSBtb2RlbCdzIGB1cmwoKWAuIFNvbWUgcG9zc2libGUgY3VzdG9taXphdGlvbnMgY291bGQgYmU6XG4gIC8vXG4gIC8vICogVXNlIGBzZXRUaW1lb3V0YCB0byBiYXRjaCByYXBpZC1maXJlIHVwZGF0ZXMgaW50byBhIHNpbmdsZSByZXF1ZXN0LlxuICAvLyAqIFNlbmQgdXAgdGhlIG1vZGVscyBhcyBYTUwgaW5zdGVhZCBvZiBKU09OLlxuICAvLyAqIFBlcnNpc3QgbW9kZWxzIHZpYSBXZWJTb2NrZXRzIGluc3RlYWQgb2YgQWpheC5cbiAgLy9cbiAgLy8gVHVybiBvbiBgQmFja2JvbmUuZW11bGF0ZUhUVFBgIGluIG9yZGVyIHRvIHNlbmQgYFBVVGAgYW5kIGBERUxFVEVgIHJlcXVlc3RzXG4gIC8vIGFzIGBQT1NUYCwgd2l0aCBhIGBfbWV0aG9kYCBwYXJhbWV0ZXIgY29udGFpbmluZyB0aGUgdHJ1ZSBIVFRQIG1ldGhvZCxcbiAgLy8gYXMgd2VsbCBhcyBhbGwgcmVxdWVzdHMgd2l0aCB0aGUgYm9keSBhcyBgYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkYFxuICAvLyBpbnN0ZWFkIG9mIGBhcHBsaWNhdGlvbi9qc29uYCB3aXRoIHRoZSBtb2RlbCBpbiBhIHBhcmFtIG5hbWVkIGBtb2RlbGAuXG4gIC8vIFVzZWZ1bCB3aGVuIGludGVyZmFjaW5nIHdpdGggc2VydmVyLXNpZGUgbGFuZ3VhZ2VzIGxpa2UgKipQSFAqKiB0aGF0IG1ha2VcbiAgLy8gaXQgZGlmZmljdWx0IHRvIHJlYWQgdGhlIGJvZHkgb2YgYFBVVGAgcmVxdWVzdHMuXG4gIEJhY2tib25lLnN5bmMgPSBmdW5jdGlvbihtZXRob2QsIG1vZGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIHR5cGUgPSBtZXRob2RNYXBbbWV0aG9kXTtcblxuICAgIC8vIERlZmF1bHQgb3B0aW9ucywgdW5sZXNzIHNwZWNpZmllZC5cbiAgICBfLmRlZmF1bHRzKG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSksIHtcbiAgICAgIGVtdWxhdGVIVFRQOiBCYWNrYm9uZS5lbXVsYXRlSFRUUCxcbiAgICAgIGVtdWxhdGVKU09OOiBCYWNrYm9uZS5lbXVsYXRlSlNPTlxuICAgIH0pO1xuXG4gICAgLy8gRGVmYXVsdCBKU09OLXJlcXVlc3Qgb3B0aW9ucy5cbiAgICB2YXIgcGFyYW1zID0ge3R5cGU6IHR5cGUsIGRhdGFUeXBlOiAnanNvbid9O1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIFVSTC5cbiAgICBpZiAoIW9wdGlvbnMudXJsKSB7XG4gICAgICBwYXJhbXMudXJsID0gXy5yZXN1bHQobW9kZWwsICd1cmwnKSB8fCB1cmxFcnJvcigpO1xuICAgIH1cblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgdGhlIGFwcHJvcHJpYXRlIHJlcXVlc3QgZGF0YS5cbiAgICBpZiAob3B0aW9ucy5kYXRhID09IG51bGwgJiYgbW9kZWwgJiYgKG1ldGhvZCA9PT0gJ2NyZWF0ZScgfHwgbWV0aG9kID09PSAndXBkYXRlJyB8fCBtZXRob2QgPT09ICdwYXRjaCcpKSB7XG4gICAgICBwYXJhbXMuY29udGVudFR5cGUgPSAnYXBwbGljYXRpb24vanNvbic7XG4gICAgICBwYXJhbXMuZGF0YSA9IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMuYXR0cnMgfHwgbW9kZWwudG9KU09OKG9wdGlvbnMpKTtcbiAgICB9XG5cbiAgICAvLyBGb3Igb2xkZXIgc2VydmVycywgZW11bGF0ZSBKU09OIGJ5IGVuY29kaW5nIHRoZSByZXF1ZXN0IGludG8gYW4gSFRNTC1mb3JtLlxuICAgIGlmIChvcHRpb25zLmVtdWxhdGVKU09OKSB7XG4gICAgICBwYXJhbXMuY29udGVudFR5cGUgPSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJztcbiAgICAgIHBhcmFtcy5kYXRhID0gcGFyYW1zLmRhdGEgPyB7bW9kZWw6IHBhcmFtcy5kYXRhfSA6IHt9O1xuICAgIH1cblxuICAgIC8vIEZvciBvbGRlciBzZXJ2ZXJzLCBlbXVsYXRlIEhUVFAgYnkgbWltaWNraW5nIHRoZSBIVFRQIG1ldGhvZCB3aXRoIGBfbWV0aG9kYFxuICAgIC8vIEFuZCBhbiBgWC1IVFRQLU1ldGhvZC1PdmVycmlkZWAgaGVhZGVyLlxuICAgIGlmIChvcHRpb25zLmVtdWxhdGVIVFRQICYmICh0eXBlID09PSAnUFVUJyB8fCB0eXBlID09PSAnREVMRVRFJyB8fCB0eXBlID09PSAnUEFUQ0gnKSkge1xuICAgICAgcGFyYW1zLnR5cGUgPSAnUE9TVCc7XG4gICAgICBpZiAob3B0aW9ucy5lbXVsYXRlSlNPTikgcGFyYW1zLmRhdGEuX21ldGhvZCA9IHR5cGU7XG4gICAgICB2YXIgYmVmb3JlU2VuZCA9IG9wdGlvbnMuYmVmb3JlU2VuZDtcbiAgICAgIG9wdGlvbnMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uKHhocikge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1IVFRQLU1ldGhvZC1PdmVycmlkZScsIHR5cGUpO1xuICAgICAgICBpZiAoYmVmb3JlU2VuZCkgcmV0dXJuIGJlZm9yZVNlbmQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgcHJvY2VzcyBkYXRhIG9uIGEgbm9uLUdFVCByZXF1ZXN0LlxuICAgIGlmIChwYXJhbXMudHlwZSAhPT0gJ0dFVCcgJiYgIW9wdGlvbnMuZW11bGF0ZUpTT04pIHtcbiAgICAgIHBhcmFtcy5wcm9jZXNzRGF0YSA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIElmIHdlJ3JlIHNlbmRpbmcgYSBgUEFUQ0hgIHJlcXVlc3QsIGFuZCB3ZSdyZSBpbiBhbiBvbGQgSW50ZXJuZXQgRXhwbG9yZXJcbiAgICAvLyB0aGF0IHN0aWxsIGhhcyBBY3RpdmVYIGVuYWJsZWQgYnkgZGVmYXVsdCwgb3ZlcnJpZGUgalF1ZXJ5IHRvIHVzZSB0aGF0XG4gICAgLy8gZm9yIFhIUiBpbnN0ZWFkLiBSZW1vdmUgdGhpcyBsaW5lIHdoZW4galF1ZXJ5IHN1cHBvcnRzIGBQQVRDSGAgb24gSUU4LlxuICAgIGlmIChwYXJhbXMudHlwZSA9PT0gJ1BBVENIJyAmJiBub1hoclBhdGNoKSB7XG4gICAgICBwYXJhbXMueGhyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgQWN0aXZlWE9iamVjdChcIk1pY3Jvc29mdC5YTUxIVFRQXCIpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBNYWtlIHRoZSByZXF1ZXN0LCBhbGxvd2luZyB0aGUgdXNlciB0byBvdmVycmlkZSBhbnkgQWpheCBvcHRpb25zLlxuICAgIHZhciB4aHIgPSBvcHRpb25zLnhociA9IEJhY2tib25lLmFqYXgoXy5leHRlbmQocGFyYW1zLCBvcHRpb25zKSk7XG4gICAgbW9kZWwudHJpZ2dlcigncmVxdWVzdCcsIG1vZGVsLCB4aHIsIG9wdGlvbnMpO1xuICAgIHJldHVybiB4aHI7XG4gIH07XG5cbiAgdmFyIG5vWGhyUGF0Y2ggPVxuICAgIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICEhd2luZG93LkFjdGl2ZVhPYmplY3QgJiZcbiAgICAgICEod2luZG93LlhNTEh0dHBSZXF1ZXN0ICYmIChuZXcgWE1MSHR0cFJlcXVlc3QpLmRpc3BhdGNoRXZlbnQpO1xuXG4gIC8vIE1hcCBmcm9tIENSVUQgdG8gSFRUUCBmb3Igb3VyIGRlZmF1bHQgYEJhY2tib25lLnN5bmNgIGltcGxlbWVudGF0aW9uLlxuICB2YXIgbWV0aG9kTWFwID0ge1xuICAgICdjcmVhdGUnOiAnUE9TVCcsXG4gICAgJ3VwZGF0ZSc6ICdQVVQnLFxuICAgICdwYXRjaCc6ICAnUEFUQ0gnLFxuICAgICdkZWxldGUnOiAnREVMRVRFJyxcbiAgICAncmVhZCc6ICAgJ0dFVCdcbiAgfTtcblxuICAvLyBTZXQgdGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gb2YgYEJhY2tib25lLmFqYXhgIHRvIHByb3h5IHRocm91Z2ggdG8gYCRgLlxuICAvLyBPdmVycmlkZSB0aGlzIGlmIHlvdSdkIGxpa2UgdG8gdXNlIGEgZGlmZmVyZW50IGxpYnJhcnkuXG4gIEJhY2tib25lLmFqYXggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gQmFja2JvbmUuJC5hamF4LmFwcGx5KEJhY2tib25lLiQsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgLy8gQmFja2JvbmUuUm91dGVyXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJvdXRlcnMgbWFwIGZhdXgtVVJMcyB0byBhY3Rpb25zLCBhbmQgZmlyZSBldmVudHMgd2hlbiByb3V0ZXMgYXJlXG4gIC8vIG1hdGNoZWQuIENyZWF0aW5nIGEgbmV3IG9uZSBzZXRzIGl0cyBgcm91dGVzYCBoYXNoLCBpZiBub3Qgc2V0IHN0YXRpY2FsbHkuXG4gIHZhciBSb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBpZiAob3B0aW9ucy5yb3V0ZXMpIHRoaXMucm91dGVzID0gb3B0aW9ucy5yb3V0ZXM7XG4gICAgdGhpcy5fYmluZFJvdXRlcygpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIENhY2hlZCByZWd1bGFyIGV4cHJlc3Npb25zIGZvciBtYXRjaGluZyBuYW1lZCBwYXJhbSBwYXJ0cyBhbmQgc3BsYXR0ZWRcbiAgLy8gcGFydHMgb2Ygcm91dGUgc3RyaW5ncy5cbiAgdmFyIG9wdGlvbmFsUGFyYW0gPSAvXFwoKC4qPylcXCkvZztcbiAgdmFyIG5hbWVkUGFyYW0gICAgPSAvKFxcKFxcPyk/OlxcdysvZztcbiAgdmFyIHNwbGF0UGFyYW0gICAgPSAvXFwqXFx3Ky9nO1xuICB2YXIgZXNjYXBlUmVnRXhwICA9IC9bXFwte31cXFtcXF0rPy4sXFxcXFxcXiR8I1xcc10vZztcblxuICAvLyBTZXQgdXAgYWxsIGluaGVyaXRhYmxlICoqQmFja2JvbmUuUm91dGVyKiogcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAgXy5leHRlbmQoUm91dGVyLnByb3RvdHlwZSwgRXZlbnRzLCB7XG5cbiAgICAvLyBJbml0aWFsaXplIGlzIGFuIGVtcHR5IGZ1bmN0aW9uIGJ5IGRlZmF1bHQuIE92ZXJyaWRlIGl0IHdpdGggeW91ciBvd25cbiAgICAvLyBpbml0aWFsaXphdGlvbiBsb2dpYy5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe30sXG5cbiAgICAvLyBNYW51YWxseSBiaW5kIGEgc2luZ2xlIG5hbWVkIHJvdXRlIHRvIGEgY2FsbGJhY2suIEZvciBleGFtcGxlOlxuICAgIC8vXG4gICAgLy8gICAgIHRoaXMucm91dGUoJ3NlYXJjaC86cXVlcnkvcDpudW0nLCAnc2VhcmNoJywgZnVuY3Rpb24ocXVlcnksIG51bSkge1xuICAgIC8vICAgICAgIC4uLlxuICAgIC8vICAgICB9KTtcbiAgICAvL1xuICAgIHJvdXRlOiBmdW5jdGlvbihyb3V0ZSwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIGlmICghXy5pc1JlZ0V4cChyb3V0ZSkpIHJvdXRlID0gdGhpcy5fcm91dGVUb1JlZ0V4cChyb3V0ZSk7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG5hbWUpKSB7XG4gICAgICAgIGNhbGxiYWNrID0gbmFtZTtcbiAgICAgICAgbmFtZSA9ICcnO1xuICAgICAgfVxuICAgICAgaWYgKCFjYWxsYmFjaykgY2FsbGJhY2sgPSB0aGlzW25hbWVdO1xuICAgICAgdmFyIHJvdXRlciA9IHRoaXM7XG4gICAgICBCYWNrYm9uZS5oaXN0b3J5LnJvdXRlKHJvdXRlLCBmdW5jdGlvbihmcmFnbWVudCkge1xuICAgICAgICB2YXIgYXJncyA9IHJvdXRlci5fZXh0cmFjdFBhcmFtZXRlcnMocm91dGUsIGZyYWdtZW50KTtcbiAgICAgICAgcm91dGVyLmV4ZWN1dGUoY2FsbGJhY2ssIGFyZ3MpO1xuICAgICAgICByb3V0ZXIudHJpZ2dlci5hcHBseShyb3V0ZXIsIFsncm91dGU6JyArIG5hbWVdLmNvbmNhdChhcmdzKSk7XG4gICAgICAgIHJvdXRlci50cmlnZ2VyKCdyb3V0ZScsIG5hbWUsIGFyZ3MpO1xuICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LnRyaWdnZXIoJ3JvdXRlJywgcm91dGVyLCBuYW1lLCBhcmdzKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEV4ZWN1dGUgYSByb3V0ZSBoYW5kbGVyIHdpdGggdGhlIHByb3ZpZGVkIHBhcmFtZXRlcnMuICBUaGlzIGlzIGFuXG4gICAgLy8gZXhjZWxsZW50IHBsYWNlIHRvIGRvIHByZS1yb3V0ZSBzZXR1cCBvciBwb3N0LXJvdXRlIGNsZWFudXAuXG4gICAgZXhlY3V0ZTogZnVuY3Rpb24oY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSxcblxuICAgIC8vIFNpbXBsZSBwcm94eSB0byBgQmFja2JvbmUuaGlzdG9yeWAgdG8gc2F2ZSBhIGZyYWdtZW50IGludG8gdGhlIGhpc3RvcnkuXG4gICAgbmF2aWdhdGU6IGZ1bmN0aW9uKGZyYWdtZW50LCBvcHRpb25zKSB7XG4gICAgICBCYWNrYm9uZS5oaXN0b3J5Lm5hdmlnYXRlKGZyYWdtZW50LCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBCaW5kIGFsbCBkZWZpbmVkIHJvdXRlcyB0byBgQmFja2JvbmUuaGlzdG9yeWAuIFdlIGhhdmUgdG8gcmV2ZXJzZSB0aGVcbiAgICAvLyBvcmRlciBvZiB0aGUgcm91dGVzIGhlcmUgdG8gc3VwcG9ydCBiZWhhdmlvciB3aGVyZSB0aGUgbW9zdCBnZW5lcmFsXG4gICAgLy8gcm91dGVzIGNhbiBiZSBkZWZpbmVkIGF0IHRoZSBib3R0b20gb2YgdGhlIHJvdXRlIG1hcC5cbiAgICBfYmluZFJvdXRlczogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMucm91dGVzKSByZXR1cm47XG4gICAgICB0aGlzLnJvdXRlcyA9IF8ucmVzdWx0KHRoaXMsICdyb3V0ZXMnKTtcbiAgICAgIHZhciByb3V0ZSwgcm91dGVzID0gXy5rZXlzKHRoaXMucm91dGVzKTtcbiAgICAgIHdoaWxlICgocm91dGUgPSByb3V0ZXMucG9wKCkpICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5yb3V0ZShyb3V0ZSwgdGhpcy5yb3V0ZXNbcm91dGVdKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gQ29udmVydCBhIHJvdXRlIHN0cmluZyBpbnRvIGEgcmVndWxhciBleHByZXNzaW9uLCBzdWl0YWJsZSBmb3IgbWF0Y2hpbmdcbiAgICAvLyBhZ2FpbnN0IHRoZSBjdXJyZW50IGxvY2F0aW9uIGhhc2guXG4gICAgX3JvdXRlVG9SZWdFeHA6IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICByb3V0ZSA9IHJvdXRlLnJlcGxhY2UoZXNjYXBlUmVnRXhwLCAnXFxcXCQmJylcbiAgICAgICAgICAgICAgICAgICAucmVwbGFjZShvcHRpb25hbFBhcmFtLCAnKD86JDEpPycpXG4gICAgICAgICAgICAgICAgICAgLnJlcGxhY2UobmFtZWRQYXJhbSwgZnVuY3Rpb24obWF0Y2gsIG9wdGlvbmFsKSB7XG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9uYWwgPyBtYXRjaCA6ICcoW14vP10rKSc7XG4gICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAucmVwbGFjZShzcGxhdFBhcmFtLCAnKFteP10qPyknKTtcbiAgICAgIHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHJvdXRlICsgJyg/OlxcXFw/KFtcXFxcc1xcXFxTXSopKT8kJyk7XG4gICAgfSxcblxuICAgIC8vIEdpdmVuIGEgcm91dGUsIGFuZCBhIFVSTCBmcmFnbWVudCB0aGF0IGl0IG1hdGNoZXMsIHJldHVybiB0aGUgYXJyYXkgb2ZcbiAgICAvLyBleHRyYWN0ZWQgZGVjb2RlZCBwYXJhbWV0ZXJzLiBFbXB0eSBvciB1bm1hdGNoZWQgcGFyYW1ldGVycyB3aWxsIGJlXG4gICAgLy8gdHJlYXRlZCBhcyBgbnVsbGAgdG8gbm9ybWFsaXplIGNyb3NzLWJyb3dzZXIgYmVoYXZpb3IuXG4gICAgX2V4dHJhY3RQYXJhbWV0ZXJzOiBmdW5jdGlvbihyb3V0ZSwgZnJhZ21lbnQpIHtcbiAgICAgIHZhciBwYXJhbXMgPSByb3V0ZS5leGVjKGZyYWdtZW50KS5zbGljZSgxKTtcbiAgICAgIHJldHVybiBfLm1hcChwYXJhbXMsIGZ1bmN0aW9uKHBhcmFtLCBpKSB7XG4gICAgICAgIC8vIERvbid0IGRlY29kZSB0aGUgc2VhcmNoIHBhcmFtcy5cbiAgICAgICAgaWYgKGkgPT09IHBhcmFtcy5sZW5ndGggLSAxKSByZXR1cm4gcGFyYW0gfHwgbnVsbDtcbiAgICAgICAgcmV0dXJuIHBhcmFtID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhcmFtKSA6IG51bGw7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gQmFja2JvbmUuSGlzdG9yeVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSGFuZGxlcyBjcm9zcy1icm93c2VyIGhpc3RvcnkgbWFuYWdlbWVudCwgYmFzZWQgb24gZWl0aGVyXG4gIC8vIFtwdXNoU3RhdGVdKGh0dHA6Ly9kaXZlaW50b2h0bWw1LmluZm8vaGlzdG9yeS5odG1sKSBhbmQgcmVhbCBVUkxzLCBvclxuICAvLyBbb25oYXNoY2hhbmdlXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL0RPTS93aW5kb3cub25oYXNoY2hhbmdlKVxuICAvLyBhbmQgVVJMIGZyYWdtZW50cy4gSWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgbmVpdGhlciAob2xkIElFLCBuYXRjaCksXG4gIC8vIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiAgdmFyIEhpc3RvcnkgPSBCYWNrYm9uZS5IaXN0b3J5ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5oYW5kbGVycyA9IFtdO1xuICAgIF8uYmluZEFsbCh0aGlzLCAnY2hlY2tVcmwnKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IGBIaXN0b3J5YCBjYW4gYmUgdXNlZCBvdXRzaWRlIG9mIHRoZSBicm93c2VyLlxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgIHRoaXMuaGlzdG9yeSA9IHdpbmRvdy5oaXN0b3J5O1xuICAgIH1cbiAgfTtcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIHN0cmlwcGluZyBhIGxlYWRpbmcgaGFzaC9zbGFzaCBhbmQgdHJhaWxpbmcgc3BhY2UuXG4gIHZhciByb3V0ZVN0cmlwcGVyID0gL15bI1xcL118XFxzKyQvZztcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIHN0cmlwcGluZyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzLlxuICB2YXIgcm9vdFN0cmlwcGVyID0gL15cXC8rfFxcLyskL2c7XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IGZvciBkZXRlY3RpbmcgTVNJRS5cbiAgdmFyIGlzRXhwbG9yZXIgPSAvbXNpZSBbXFx3Ll0rLztcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIHJlbW92aW5nIGEgdHJhaWxpbmcgc2xhc2guXG4gIHZhciB0cmFpbGluZ1NsYXNoID0gL1xcLyQvO1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3Igc3RyaXBwaW5nIHVybHMgb2YgaGFzaC5cbiAgdmFyIHBhdGhTdHJpcHBlciA9IC8jLiokLztcblxuICAvLyBIYXMgdGhlIGhpc3RvcnkgaGFuZGxpbmcgYWxyZWFkeSBiZWVuIHN0YXJ0ZWQ/XG4gIEhpc3Rvcnkuc3RhcnRlZCA9IGZhbHNlO1xuXG4gIC8vIFNldCB1cCBhbGwgaW5oZXJpdGFibGUgKipCYWNrYm9uZS5IaXN0b3J5KiogcHJvcGVydGllcyBhbmQgbWV0aG9kcy5cbiAgXy5leHRlbmQoSGlzdG9yeS5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gVGhlIGRlZmF1bHQgaW50ZXJ2YWwgdG8gcG9sbCBmb3IgaGFzaCBjaGFuZ2VzLCBpZiBuZWNlc3NhcnksIGlzXG4gICAgLy8gdHdlbnR5IHRpbWVzIGEgc2Vjb25kLlxuICAgIGludGVydmFsOiA1MCxcblxuICAgIC8vIEFyZSB3ZSBhdCB0aGUgYXBwIHJvb3Q/XG4gICAgYXRSb290OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmxvY2F0aW9uLnBhdGhuYW1lLnJlcGxhY2UoL1teXFwvXSQvLCAnJCYvJykgPT09IHRoaXMucm9vdDtcbiAgICB9LFxuXG4gICAgLy8gR2V0cyB0aGUgdHJ1ZSBoYXNoIHZhbHVlLiBDYW5ub3QgdXNlIGxvY2F0aW9uLmhhc2ggZGlyZWN0bHkgZHVlIHRvIGJ1Z1xuICAgIC8vIGluIEZpcmVmb3ggd2hlcmUgbG9jYXRpb24uaGFzaCB3aWxsIGFsd2F5cyBiZSBkZWNvZGVkLlxuICAgIGdldEhhc2g6IGZ1bmN0aW9uKHdpbmRvdykge1xuICAgICAgdmFyIG1hdGNoID0gKHdpbmRvdyB8fCB0aGlzKS5sb2NhdGlvbi5ocmVmLm1hdGNoKC8jKC4qKSQvKTtcbiAgICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogJyc7XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgY3Jvc3MtYnJvd3NlciBub3JtYWxpemVkIFVSTCBmcmFnbWVudCwgZWl0aGVyIGZyb20gdGhlIFVSTCxcbiAgICAvLyB0aGUgaGFzaCwgb3IgdGhlIG92ZXJyaWRlLlxuICAgIGdldEZyYWdtZW50OiBmdW5jdGlvbihmcmFnbWVudCwgZm9yY2VQdXNoU3RhdGUpIHtcbiAgICAgIGlmIChmcmFnbWVudCA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0aGlzLl9oYXNQdXNoU3RhdGUgfHwgIXRoaXMuX3dhbnRzSGFzaENoYW5nZSB8fCBmb3JjZVB1c2hTdGF0ZSkge1xuICAgICAgICAgIGZyYWdtZW50ID0gZGVjb2RlVVJJKHRoaXMubG9jYXRpb24ucGF0aG5hbWUgKyB0aGlzLmxvY2F0aW9uLnNlYXJjaCk7XG4gICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLnJvb3QucmVwbGFjZSh0cmFpbGluZ1NsYXNoLCAnJyk7XG4gICAgICAgICAgaWYgKCFmcmFnbWVudC5pbmRleE9mKHJvb3QpKSBmcmFnbWVudCA9IGZyYWdtZW50LnNsaWNlKHJvb3QubGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmcmFnbWVudCA9IHRoaXMuZ2V0SGFzaCgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnJhZ21lbnQucmVwbGFjZShyb3V0ZVN0cmlwcGVyLCAnJyk7XG4gICAgfSxcblxuICAgIC8vIFN0YXJ0IHRoZSBoYXNoIGNoYW5nZSBoYW5kbGluZywgcmV0dXJuaW5nIGB0cnVlYCBpZiB0aGUgY3VycmVudCBVUkwgbWF0Y2hlc1xuICAgIC8vIGFuIGV4aXN0aW5nIHJvdXRlLCBhbmQgYGZhbHNlYCBvdGhlcndpc2UuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIGlmIChIaXN0b3J5LnN0YXJ0ZWQpIHRocm93IG5ldyBFcnJvcihcIkJhY2tib25lLmhpc3RvcnkgaGFzIGFscmVhZHkgYmVlbiBzdGFydGVkXCIpO1xuICAgICAgSGlzdG9yeS5zdGFydGVkID0gdHJ1ZTtcblxuICAgICAgLy8gRmlndXJlIG91dCB0aGUgaW5pdGlhbCBjb25maWd1cmF0aW9uLiBEbyB3ZSBuZWVkIGFuIGlmcmFtZT9cbiAgICAgIC8vIElzIHB1c2hTdGF0ZSBkZXNpcmVkIC4uLiBpcyBpdCBhdmFpbGFibGU/XG4gICAgICB0aGlzLm9wdGlvbnMgICAgICAgICAgPSBfLmV4dGVuZCh7cm9vdDogJy8nfSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgIHRoaXMucm9vdCAgICAgICAgICAgICA9IHRoaXMub3B0aW9ucy5yb290O1xuICAgICAgdGhpcy5fd2FudHNIYXNoQ2hhbmdlID0gdGhpcy5vcHRpb25zLmhhc2hDaGFuZ2UgIT09IGZhbHNlO1xuICAgICAgdGhpcy5fd2FudHNQdXNoU3RhdGUgID0gISF0aGlzLm9wdGlvbnMucHVzaFN0YXRlO1xuICAgICAgdGhpcy5faGFzUHVzaFN0YXRlICAgID0gISEodGhpcy5vcHRpb25zLnB1c2hTdGF0ZSAmJiB0aGlzLmhpc3RvcnkgJiYgdGhpcy5oaXN0b3J5LnB1c2hTdGF0ZSk7XG4gICAgICB2YXIgZnJhZ21lbnQgICAgICAgICAgPSB0aGlzLmdldEZyYWdtZW50KCk7XG4gICAgICB2YXIgZG9jTW9kZSAgICAgICAgICAgPSBkb2N1bWVudC5kb2N1bWVudE1vZGU7XG4gICAgICB2YXIgb2xkSUUgICAgICAgICAgICAgPSAoaXNFeHBsb3Jlci5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKSkgJiYgKCFkb2NNb2RlIHx8IGRvY01vZGUgPD0gNykpO1xuXG4gICAgICAvLyBOb3JtYWxpemUgcm9vdCB0byBhbHdheXMgaW5jbHVkZSBhIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoLlxuICAgICAgdGhpcy5yb290ID0gKCcvJyArIHRoaXMucm9vdCArICcvJykucmVwbGFjZShyb290U3RyaXBwZXIsICcvJyk7XG5cbiAgICAgIGlmIChvbGRJRSAmJiB0aGlzLl93YW50c0hhc2hDaGFuZ2UpIHtcbiAgICAgICAgdmFyIGZyYW1lID0gQmFja2JvbmUuJCgnPGlmcmFtZSBzcmM9XCJqYXZhc2NyaXB0OjBcIiB0YWJpbmRleD1cIi0xXCI+Jyk7XG4gICAgICAgIHRoaXMuaWZyYW1lID0gZnJhbWUuaGlkZSgpLmFwcGVuZFRvKCdib2R5JylbMF0uY29udGVudFdpbmRvdztcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZShmcmFnbWVudCk7XG4gICAgICB9XG5cbiAgICAgIC8vIERlcGVuZGluZyBvbiB3aGV0aGVyIHdlJ3JlIHVzaW5nIHB1c2hTdGF0ZSBvciBoYXNoZXMsIGFuZCB3aGV0aGVyXG4gICAgICAvLyAnb25oYXNoY2hhbmdlJyBpcyBzdXBwb3J0ZWQsIGRldGVybWluZSBob3cgd2UgY2hlY2sgdGhlIFVSTCBzdGF0ZS5cbiAgICAgIGlmICh0aGlzLl9oYXNQdXNoU3RhdGUpIHtcbiAgICAgICAgQmFja2JvbmUuJCh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIHRoaXMuY2hlY2tVcmwpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UgJiYgKCdvbmhhc2hjaGFuZ2UnIGluIHdpbmRvdykgJiYgIW9sZElFKSB7XG4gICAgICAgIEJhY2tib25lLiQod2luZG93KS5vbignaGFzaGNoYW5nZScsIHRoaXMuY2hlY2tVcmwpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fY2hlY2tVcmxJbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMuY2hlY2tVcmwsIHRoaXMuaW50ZXJ2YWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXRlcm1pbmUgaWYgd2UgbmVlZCB0byBjaGFuZ2UgdGhlIGJhc2UgdXJsLCBmb3IgYSBwdXNoU3RhdGUgbGlua1xuICAgICAgLy8gb3BlbmVkIGJ5IGEgbm9uLXB1c2hTdGF0ZSBicm93c2VyLlxuICAgICAgdGhpcy5mcmFnbWVudCA9IGZyYWdtZW50O1xuICAgICAgdmFyIGxvYyA9IHRoaXMubG9jYXRpb247XG5cbiAgICAgIC8vIFRyYW5zaXRpb24gZnJvbSBoYXNoQ2hhbmdlIHRvIHB1c2hTdGF0ZSBvciB2aWNlIHZlcnNhIGlmIGJvdGggYXJlXG4gICAgICAvLyByZXF1ZXN0ZWQuXG4gICAgICBpZiAodGhpcy5fd2FudHNIYXNoQ2hhbmdlICYmIHRoaXMuX3dhbnRzUHVzaFN0YXRlKSB7XG5cbiAgICAgICAgLy8gSWYgd2UndmUgc3RhcnRlZCBvZmYgd2l0aCBhIHJvdXRlIGZyb20gYSBgcHVzaFN0YXRlYC1lbmFibGVkXG4gICAgICAgIC8vIGJyb3dzZXIsIGJ1dCB3ZSdyZSBjdXJyZW50bHkgaW4gYSBicm93c2VyIHRoYXQgZG9lc24ndCBzdXBwb3J0IGl0Li4uXG4gICAgICAgIGlmICghdGhpcy5faGFzUHVzaFN0YXRlICYmICF0aGlzLmF0Um9vdCgpKSB7XG4gICAgICAgICAgdGhpcy5mcmFnbWVudCA9IHRoaXMuZ2V0RnJhZ21lbnQobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgdGhpcy5sb2NhdGlvbi5yZXBsYWNlKHRoaXMucm9vdCArICcjJyArIHRoaXMuZnJhZ21lbnQpO1xuICAgICAgICAgIC8vIFJldHVybiBpbW1lZGlhdGVseSBhcyBicm93c2VyIHdpbGwgZG8gcmVkaXJlY3QgdG8gbmV3IHVybFxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIC8vIE9yIGlmIHdlJ3ZlIHN0YXJ0ZWQgb3V0IHdpdGggYSBoYXNoLWJhc2VkIHJvdXRlLCBidXQgd2UncmUgY3VycmVudGx5XG4gICAgICAgIC8vIGluIGEgYnJvd3NlciB3aGVyZSBpdCBjb3VsZCBiZSBgcHVzaFN0YXRlYC1iYXNlZCBpbnN0ZWFkLi4uXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5faGFzUHVzaFN0YXRlICYmIHRoaXMuYXRSb290KCkgJiYgbG9jLmhhc2gpIHtcbiAgICAgICAgICB0aGlzLmZyYWdtZW50ID0gdGhpcy5nZXRIYXNoKCkucmVwbGFjZShyb3V0ZVN0cmlwcGVyLCAnJyk7XG4gICAgICAgICAgdGhpcy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgZG9jdW1lbnQudGl0bGUsIHRoaXMucm9vdCArIHRoaXMuZnJhZ21lbnQpO1xuICAgICAgICB9XG5cbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2lsZW50KSByZXR1cm4gdGhpcy5sb2FkVXJsKCk7XG4gICAgfSxcblxuICAgIC8vIERpc2FibGUgQmFja2JvbmUuaGlzdG9yeSwgcGVyaGFwcyB0ZW1wb3JhcmlseS4gTm90IHVzZWZ1bCBpbiBhIHJlYWwgYXBwLFxuICAgIC8vIGJ1dCBwb3NzaWJseSB1c2VmdWwgZm9yIHVuaXQgdGVzdGluZyBSb3V0ZXJzLlxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgQmFja2JvbmUuJCh3aW5kb3cpLm9mZigncG9wc3RhdGUnLCB0aGlzLmNoZWNrVXJsKS5vZmYoJ2hhc2hjaGFuZ2UnLCB0aGlzLmNoZWNrVXJsKTtcbiAgICAgIGlmICh0aGlzLl9jaGVja1VybEludGVydmFsKSBjbGVhckludGVydmFsKHRoaXMuX2NoZWNrVXJsSW50ZXJ2YWwpO1xuICAgICAgSGlzdG9yeS5zdGFydGVkID0gZmFsc2U7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIHJvdXRlIHRvIGJlIHRlc3RlZCB3aGVuIHRoZSBmcmFnbWVudCBjaGFuZ2VzLiBSb3V0ZXMgYWRkZWQgbGF0ZXJcbiAgICAvLyBtYXkgb3ZlcnJpZGUgcHJldmlvdXMgcm91dGVzLlxuICAgIHJvdXRlOiBmdW5jdGlvbihyb3V0ZSwgY2FsbGJhY2spIHtcbiAgICAgIHRoaXMuaGFuZGxlcnMudW5zaGlmdCh7cm91dGU6IHJvdXRlLCBjYWxsYmFjazogY2FsbGJhY2t9KTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2tzIHRoZSBjdXJyZW50IFVSTCB0byBzZWUgaWYgaXQgaGFzIGNoYW5nZWQsIGFuZCBpZiBpdCBoYXMsXG4gICAgLy8gY2FsbHMgYGxvYWRVcmxgLCBub3JtYWxpemluZyBhY3Jvc3MgdGhlIGhpZGRlbiBpZnJhbWUuXG4gICAgY2hlY2tVcmw6IGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRGcmFnbWVudCgpO1xuICAgICAgaWYgKGN1cnJlbnQgPT09IHRoaXMuZnJhZ21lbnQgJiYgdGhpcy5pZnJhbWUpIHtcbiAgICAgICAgY3VycmVudCA9IHRoaXMuZ2V0RnJhZ21lbnQodGhpcy5nZXRIYXNoKHRoaXMuaWZyYW1lKSk7XG4gICAgICB9XG4gICAgICBpZiAoY3VycmVudCA9PT0gdGhpcy5mcmFnbWVudCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKHRoaXMuaWZyYW1lKSB0aGlzLm5hdmlnYXRlKGN1cnJlbnQpO1xuICAgICAgdGhpcy5sb2FkVXJsKCk7XG4gICAgfSxcblxuICAgIC8vIEF0dGVtcHQgdG8gbG9hZCB0aGUgY3VycmVudCBVUkwgZnJhZ21lbnQuIElmIGEgcm91dGUgc3VjY2VlZHMgd2l0aCBhXG4gICAgLy8gbWF0Y2gsIHJldHVybnMgYHRydWVgLiBJZiBubyBkZWZpbmVkIHJvdXRlcyBtYXRjaGVzIHRoZSBmcmFnbWVudCxcbiAgICAvLyByZXR1cm5zIGBmYWxzZWAuXG4gICAgbG9hZFVybDogZnVuY3Rpb24oZnJhZ21lbnQpIHtcbiAgICAgIGZyYWdtZW50ID0gdGhpcy5mcmFnbWVudCA9IHRoaXMuZ2V0RnJhZ21lbnQoZnJhZ21lbnQpO1xuICAgICAgcmV0dXJuIF8uYW55KHRoaXMuaGFuZGxlcnMsIGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIucm91dGUudGVzdChmcmFnbWVudCkpIHtcbiAgICAgICAgICBoYW5kbGVyLmNhbGxiYWNrKGZyYWdtZW50KTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIFNhdmUgYSBmcmFnbWVudCBpbnRvIHRoZSBoYXNoIGhpc3RvcnksIG9yIHJlcGxhY2UgdGhlIFVSTCBzdGF0ZSBpZiB0aGVcbiAgICAvLyAncmVwbGFjZScgb3B0aW9uIGlzIHBhc3NlZC4gWW91IGFyZSByZXNwb25zaWJsZSBmb3IgcHJvcGVybHkgVVJMLWVuY29kaW5nXG4gICAgLy8gdGhlIGZyYWdtZW50IGluIGFkdmFuY2UuXG4gICAgLy9cbiAgICAvLyBUaGUgb3B0aW9ucyBvYmplY3QgY2FuIGNvbnRhaW4gYHRyaWdnZXI6IHRydWVgIGlmIHlvdSB3aXNoIHRvIGhhdmUgdGhlXG4gICAgLy8gcm91dGUgY2FsbGJhY2sgYmUgZmlyZWQgKG5vdCB1c3VhbGx5IGRlc2lyYWJsZSksIG9yIGByZXBsYWNlOiB0cnVlYCwgaWZcbiAgICAvLyB5b3Ugd2lzaCB0byBtb2RpZnkgdGhlIGN1cnJlbnQgVVJMIHdpdGhvdXQgYWRkaW5nIGFuIGVudHJ5IHRvIHRoZSBoaXN0b3J5LlxuICAgIG5hdmlnYXRlOiBmdW5jdGlvbihmcmFnbWVudCwgb3B0aW9ucykge1xuICAgICAgaWYgKCFIaXN0b3J5LnN0YXJ0ZWQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghb3B0aW9ucyB8fCBvcHRpb25zID09PSB0cnVlKSBvcHRpb25zID0ge3RyaWdnZXI6ICEhb3B0aW9uc307XG5cbiAgICAgIHZhciB1cmwgPSB0aGlzLnJvb3QgKyAoZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KGZyYWdtZW50IHx8ICcnKSk7XG5cbiAgICAgIC8vIFN0cmlwIHRoZSBoYXNoIGZvciBtYXRjaGluZy5cbiAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQucmVwbGFjZShwYXRoU3RyaXBwZXIsICcnKTtcblxuICAgICAgaWYgKHRoaXMuZnJhZ21lbnQgPT09IGZyYWdtZW50KSByZXR1cm47XG4gICAgICB0aGlzLmZyYWdtZW50ID0gZnJhZ21lbnQ7XG5cbiAgICAgIC8vIERvbid0IGluY2x1ZGUgYSB0cmFpbGluZyBzbGFzaCBvbiB0aGUgcm9vdC5cbiAgICAgIGlmIChmcmFnbWVudCA9PT0gJycgJiYgdXJsICE9PSAnLycpIHVybCA9IHVybC5zbGljZSgwLCAtMSk7XG5cbiAgICAgIC8vIElmIHB1c2hTdGF0ZSBpcyBhdmFpbGFibGUsIHdlIHVzZSBpdCB0byBzZXQgdGhlIGZyYWdtZW50IGFzIGEgcmVhbCBVUkwuXG4gICAgICBpZiAodGhpcy5faGFzUHVzaFN0YXRlKSB7XG4gICAgICAgIHRoaXMuaGlzdG9yeVtvcHRpb25zLnJlcGxhY2UgPyAncmVwbGFjZVN0YXRlJyA6ICdwdXNoU3RhdGUnXSh7fSwgZG9jdW1lbnQudGl0bGUsIHVybCk7XG5cbiAgICAgIC8vIElmIGhhc2ggY2hhbmdlcyBoYXZlbid0IGJlZW4gZXhwbGljaXRseSBkaXNhYmxlZCwgdXBkYXRlIHRoZSBoYXNoXG4gICAgICAvLyBmcmFnbWVudCB0byBzdG9yZSBoaXN0b3J5LlxuICAgICAgfSBlbHNlIGlmICh0aGlzLl93YW50c0hhc2hDaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlSGFzaCh0aGlzLmxvY2F0aW9uLCBmcmFnbWVudCwgb3B0aW9ucy5yZXBsYWNlKTtcbiAgICAgICAgaWYgKHRoaXMuaWZyYW1lICYmIChmcmFnbWVudCAhPT0gdGhpcy5nZXRGcmFnbWVudCh0aGlzLmdldEhhc2godGhpcy5pZnJhbWUpKSkpIHtcbiAgICAgICAgICAvLyBPcGVuaW5nIGFuZCBjbG9zaW5nIHRoZSBpZnJhbWUgdHJpY2tzIElFNyBhbmQgZWFybGllciB0byBwdXNoIGFcbiAgICAgICAgICAvLyBoaXN0b3J5IGVudHJ5IG9uIGhhc2gtdGFnIGNoYW5nZS4gIFdoZW4gcmVwbGFjZSBpcyB0cnVlLCB3ZSBkb24ndFxuICAgICAgICAgIC8vIHdhbnQgdGhpcy5cbiAgICAgICAgICBpZighb3B0aW9ucy5yZXBsYWNlKSB0aGlzLmlmcmFtZS5kb2N1bWVudC5vcGVuKCkuY2xvc2UoKTtcbiAgICAgICAgICB0aGlzLl91cGRhdGVIYXNoKHRoaXMuaWZyYW1lLmxvY2F0aW9uLCBmcmFnbWVudCwgb3B0aW9ucy5yZXBsYWNlKTtcbiAgICAgICAgfVxuXG4gICAgICAvLyBJZiB5b3UndmUgdG9sZCB1cyB0aGF0IHlvdSBleHBsaWNpdGx5IGRvbid0IHdhbnQgZmFsbGJhY2sgaGFzaGNoYW5nZS1cbiAgICAgIC8vIGJhc2VkIGhpc3RvcnksIHRoZW4gYG5hdmlnYXRlYCBiZWNvbWVzIGEgcGFnZSByZWZyZXNoLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubG9jYXRpb24uYXNzaWduKHVybCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50cmlnZ2VyKSByZXR1cm4gdGhpcy5sb2FkVXJsKGZyYWdtZW50KTtcbiAgICB9LFxuXG4gICAgLy8gVXBkYXRlIHRoZSBoYXNoIGxvY2F0aW9uLCBlaXRoZXIgcmVwbGFjaW5nIHRoZSBjdXJyZW50IGVudHJ5LCBvciBhZGRpbmdcbiAgICAvLyBhIG5ldyBvbmUgdG8gdGhlIGJyb3dzZXIgaGlzdG9yeS5cbiAgICBfdXBkYXRlSGFzaDogZnVuY3Rpb24obG9jYXRpb24sIGZyYWdtZW50LCByZXBsYWNlKSB7XG4gICAgICBpZiAocmVwbGFjZSkge1xuICAgICAgICB2YXIgaHJlZiA9IGxvY2F0aW9uLmhyZWYucmVwbGFjZSgvKGphdmFzY3JpcHQ6fCMpLiokLywgJycpO1xuICAgICAgICBsb2NhdGlvbi5yZXBsYWNlKGhyZWYgKyAnIycgKyBmcmFnbWVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTb21lIGJyb3dzZXJzIHJlcXVpcmUgdGhhdCBgaGFzaGAgY29udGFpbnMgYSBsZWFkaW5nICMuXG4gICAgICAgIGxvY2F0aW9uLmhhc2ggPSAnIycgKyBmcmFnbWVudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSk7XG5cbiAgLy8gQ3JlYXRlIHRoZSBkZWZhdWx0IEJhY2tib25lLmhpc3RvcnkuXG4gIEJhY2tib25lLmhpc3RvcnkgPSBuZXcgSGlzdG9yeTtcblxuICAvLyBIZWxwZXJzXG4gIC8vIC0tLS0tLS1cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29ycmVjdGx5IHNldCB1cCB0aGUgcHJvdG90eXBlIGNoYWluLCBmb3Igc3ViY2xhc3Nlcy5cbiAgLy8gU2ltaWxhciB0byBgZ29vZy5pbmhlcml0c2AsIGJ1dCB1c2VzIGEgaGFzaCBvZiBwcm90b3R5cGUgcHJvcGVydGllcyBhbmRcbiAgLy8gY2xhc3MgcHJvcGVydGllcyB0byBiZSBleHRlbmRlZC5cbiAgdmFyIGV4dGVuZCA9IGZ1bmN0aW9uKHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgLy8gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgbmV3IHN1YmNsYXNzIGlzIGVpdGhlciBkZWZpbmVkIGJ5IHlvdVxuICAgIC8vICh0aGUgXCJjb25zdHJ1Y3RvclwiIHByb3BlcnR5IGluIHlvdXIgYGV4dGVuZGAgZGVmaW5pdGlvbiksIG9yIGRlZmF1bHRlZFxuICAgIC8vIGJ5IHVzIHRvIHNpbXBseSBjYWxsIHRoZSBwYXJlbnQncyBjb25zdHJ1Y3Rvci5cbiAgICBpZiAocHJvdG9Qcm9wcyAmJiBfLmhhcyhwcm90b1Byb3BzLCAnY29uc3RydWN0b3InKSkge1xuICAgICAgY2hpbGQgPSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZCA9IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcbiAgICB9XG5cbiAgICAvLyBBZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBpZiBzdXBwbGllZC5cbiAgICBfLmV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBTZXQgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBpbmhlcml0IGZyb20gYHBhcmVudGAsIHdpdGhvdXQgY2FsbGluZ1xuICAgIC8vIGBwYXJlbnRgJ3MgY29uc3RydWN0b3IgZnVuY3Rpb24uXG4gICAgdmFyIFN1cnJvZ2F0ZSA9IGZ1bmN0aW9uKCl7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfTtcbiAgICBTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgU3Vycm9nYXRlO1xuXG4gICAgLy8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIChpbnN0YW5jZSBwcm9wZXJ0aWVzKSB0byB0aGUgc3ViY2xhc3MsXG4gICAgLy8gaWYgc3VwcGxpZWQuXG4gICAgaWYgKHByb3RvUHJvcHMpIF8uZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7XG5cbiAgICAvLyBTZXQgYSBjb252ZW5pZW5jZSBwcm9wZXJ0eSBpbiBjYXNlIHRoZSBwYXJlbnQncyBwcm90b3R5cGUgaXMgbmVlZGVkXG4gICAgLy8gbGF0ZXIuXG4gICAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcblxuICAgIHJldHVybiBjaGlsZDtcbiAgfTtcblxuICAvLyBTZXQgdXAgaW5oZXJpdGFuY2UgZm9yIHRoZSBtb2RlbCwgY29sbGVjdGlvbiwgcm91dGVyLCB2aWV3IGFuZCBoaXN0b3J5LlxuICBNb2RlbC5leHRlbmQgPSBDb2xsZWN0aW9uLmV4dGVuZCA9IFJvdXRlci5leHRlbmQgPSBWaWV3LmV4dGVuZCA9IEhpc3RvcnkuZXh0ZW5kID0gZXh0ZW5kO1xuXG4gIC8vIFRocm93IGFuIGVycm9yIHdoZW4gYSBVUkwgaXMgbmVlZGVkLCBhbmQgbm9uZSBpcyBzdXBwbGllZC5cbiAgdmFyIHVybEVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIFwidXJsXCIgcHJvcGVydHkgb3IgZnVuY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQnKTtcbiAgfTtcblxuICAvLyBXcmFwIGFuIG9wdGlvbmFsIGVycm9yIGNhbGxiYWNrIHdpdGggYSBmYWxsYmFjayBlcnJvciBldmVudC5cbiAgdmFyIHdyYXBFcnJvciA9IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIGVycm9yID0gb3B0aW9ucy5lcnJvcjtcbiAgICBvcHRpb25zLmVycm9yID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgaWYgKGVycm9yKSBlcnJvcihtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICBtb2RlbC50cmlnZ2VyKCdlcnJvcicsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICB9O1xuICB9O1xuXG4gIHJldHVybiBCYWNrYm9uZTtcblxufSkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIHdlYiBicm93c2VyIGltcGxlbWVudGF0aW9uIG9mIGBkZWJ1ZygpYC5cbiAqXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXG4gKi9cblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9kZWJ1ZycpO1xuZXhwb3J0cy5sb2cgPSBsb2c7XG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xuZXhwb3J0cy5zYXZlID0gc2F2ZTtcbmV4cG9ydHMubG9hZCA9IGxvYWQ7XG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcblxuLyoqXG4gKiBDb2xvcnMuXG4gKi9cblxuZXhwb3J0cy5jb2xvcnMgPSBbXG4gICdsaWdodHNlYWdyZWVuJyxcbiAgJ2ZvcmVzdGdyZWVuJyxcbiAgJ2dvbGRlbnJvZCcsXG4gICdkb2RnZXJibHVlJyxcbiAgJ2RhcmtvcmNoaWQnLFxuICAnY3JpbXNvbidcbl07XG5cbi8qKlxuICogQ3VycmVudGx5IG9ubHkgV2ViS2l0LWJhc2VkIFdlYiBJbnNwZWN0b3JzLCBGaXJlZm94ID49IHYzMSxcbiAqIGFuZCB0aGUgRmlyZWJ1ZyBleHRlbnNpb24gKGFueSBGaXJlZm94IHZlcnNpb24pIGFyZSBrbm93blxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxuICpcbiAqIFRPRE86IGFkZCBhIGBsb2NhbFN0b3JhZ2VgIHZhcmlhYmxlIHRvIGV4cGxpY2l0bHkgZW5hYmxlL2Rpc2FibGUgY29sb3JzXG4gKi9cblxuZnVuY3Rpb24gdXNlQ29sb3JzKCkge1xuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xuICByZXR1cm4gKCdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUpIHx8XG4gICAgLy8gaXMgZmlyZWJ1Zz8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzk4MTIwLzM3Njc3M1xuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XG4gICAgLy8gaXMgZmlyZWZveCA+PSB2MzE/XG4gICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ub29scy9XZWJfQ29uc29sZSNTdHlsaW5nX21lc3NhZ2VzXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcbn1cblxuLyoqXG4gKiBNYXAgJWogdG8gYEpTT04uc3RyaW5naWZ5KClgLCBzaW5jZSBubyBXZWIgSW5zcGVjdG9ycyBkbyB0aGF0IGJ5IGRlZmF1bHQuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzLmogPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTtcbn07XG5cblxuLyoqXG4gKiBDb2xvcml6ZSBsb2cgYXJndW1lbnRzIGlmIGVuYWJsZWQuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIHVzZUNvbG9ycyA9IHRoaXMudXNlQ29sb3JzO1xuXG4gIGFyZ3NbMF0gPSAodXNlQ29sb3JzID8gJyVjJyA6ICcnKVxuICAgICsgdGhpcy5uYW1lc3BhY2VcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcbiAgICArIGFyZ3NbMF1cbiAgICArICh1c2VDb2xvcnMgPyAnJWMgJyA6ICcgJylcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcblxuICBpZiAoIXVzZUNvbG9ycykgcmV0dXJuIGFyZ3M7XG5cbiAgdmFyIGMgPSAnY29sb3I6ICcgKyB0aGlzLmNvbG9yO1xuICBhcmdzID0gW2FyZ3NbMF0sIGMsICdjb2xvcjogaW5oZXJpdCddLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAxKSk7XG5cbiAgLy8gdGhlIGZpbmFsIFwiJWNcIiBpcyBzb21ld2hhdCB0cmlja3ksIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgb3RoZXJcbiAgLy8gYXJndW1lbnRzIHBhc3NlZCBlaXRoZXIgYmVmb3JlIG9yIGFmdGVyIHRoZSAlYywgc28gd2UgbmVlZCB0b1xuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cbiAgdmFyIGluZGV4ID0gMDtcbiAgdmFyIGxhc3RDID0gMDtcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgaWYgKCclJScgPT09IG1hdGNoKSByZXR1cm47XG4gICAgaW5kZXgrKztcbiAgICBpZiAoJyVjJyA9PT0gbWF0Y2gpIHtcbiAgICAgIC8vIHdlIG9ubHkgYXJlIGludGVyZXN0ZWQgaW4gdGhlICpsYXN0KiAlY1xuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcbiAgICAgIGxhc3RDID0gaW5kZXg7XG4gICAgfVxuICB9KTtcblxuICBhcmdzLnNwbGljZShsYXN0QywgMCwgYyk7XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEludm9rZXMgYGNvbnNvbGUubG9nKClgIHdoZW4gYXZhaWxhYmxlLlxuICogTm8tb3Agd2hlbiBgY29uc29sZS5sb2dgIGlzIG5vdCBhIFwiZnVuY3Rpb25cIi5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGxvZygpIHtcbiAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRTgsXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXG4gIHJldHVybiAnb2JqZWN0JyA9PSB0eXBlb2YgY29uc29sZVxuICAgICYmICdmdW5jdGlvbicgPT0gdHlwZW9mIGNvbnNvbGUubG9nXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XG59XG5cbi8qKlxuICogU2F2ZSBgbmFtZXNwYWNlc2AuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNhdmUobmFtZXNwYWNlcykge1xuICB0cnkge1xuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdkZWJ1ZycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xuICAgIH1cbiAgfSBjYXRjaChlKSB7fVxufVxuXG4vKipcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJucyB0aGUgcHJldmlvdXNseSBwZXJzaXN0ZWQgZGVidWcgbW9kZXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvYWQoKSB7XG4gIHZhciByO1xuICB0cnkge1xuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XG4gIH0gY2F0Y2goZSkge31cbiAgcmV0dXJuIHI7XG59XG5cbi8qKlxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cbiAqL1xuXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xuIiwiXG4vKipcbiAqIFRoaXMgaXMgdGhlIGNvbW1vbiBsb2dpYyBmb3IgYm90aCB0aGUgTm9kZS5qcyBhbmQgd2ViIGJyb3dzZXJcbiAqIGltcGxlbWVudGF0aW9ucyBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IGRlYnVnO1xuZXhwb3J0cy5jb2VyY2UgPSBjb2VyY2U7XG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xuZXhwb3J0cy5lbmFibGUgPSBlbmFibGU7XG5leHBvcnRzLmVuYWJsZWQgPSBlbmFibGVkO1xuZXhwb3J0cy5odW1hbml6ZSA9IHJlcXVpcmUoJ21zJyk7XG5cbi8qKlxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXG4gKi9cblxuZXhwb3J0cy5uYW1lcyA9IFtdO1xuZXhwb3J0cy5za2lwcyA9IFtdO1xuXG4vKipcbiAqIE1hcCBvZiBzcGVjaWFsIFwiJW5cIiBoYW5kbGluZyBmdW5jdGlvbnMsIGZvciB0aGUgZGVidWcgXCJmb3JtYXRcIiBhcmd1bWVudC5cbiAqXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cbiAqL1xuXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcblxuLyoqXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxuICovXG5cbnZhciBwcmV2Q29sb3IgPSAwO1xuXG4vKipcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXG4gKi9cblxudmFyIHByZXZUaW1lO1xuXG4vKipcbiAqIFNlbGVjdCBhIGNvbG9yLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xuICByZXR1cm4gZXhwb3J0cy5jb2xvcnNbcHJldkNvbG9yKysgJSBleHBvcnRzLmNvbG9ycy5sZW5ndGhdO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRlYnVnZ2VyIHdpdGggdGhlIGdpdmVuIGBuYW1lc3BhY2VgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcblxuICAvLyBkZWZpbmUgdGhlIGBkaXNhYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcbiAgfVxuICBkaXNhYmxlZC5lbmFibGVkID0gZmFsc2U7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZW5hYmxlZGAgdmVyc2lvblxuICBmdW5jdGlvbiBlbmFibGVkKCkge1xuXG4gICAgdmFyIHNlbGYgPSBlbmFibGVkO1xuXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcbiAgICB2YXIgY3VyciA9ICtuZXcgRGF0ZSgpO1xuICAgIHZhciBtcyA9IGN1cnIgLSAocHJldlRpbWUgfHwgY3Vycik7XG4gICAgc2VsZi5kaWZmID0gbXM7XG4gICAgc2VsZi5wcmV2ID0gcHJldlRpbWU7XG4gICAgc2VsZi5jdXJyID0gY3VycjtcbiAgICBwcmV2VGltZSA9IGN1cnI7XG5cbiAgICAvLyBhZGQgdGhlIGBjb2xvcmAgaWYgbm90IHNldFxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XG4gICAgaWYgKG51bGwgPT0gc2VsZi5jb2xvciAmJiBzZWxmLnVzZUNvbG9ycykgc2VsZi5jb2xvciA9IHNlbGVjdENvbG9yKCk7XG5cbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICBhcmdzWzBdID0gZXhwb3J0cy5jb2VyY2UoYXJnc1swXSk7XG5cbiAgICBpZiAoJ3N0cmluZycgIT09IHR5cGVvZiBhcmdzWzBdKSB7XG4gICAgICAvLyBhbnl0aGluZyBlbHNlIGxldCdzIGluc3BlY3Qgd2l0aCAlb1xuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XG4gICAgfVxuXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIGFyZ3NbMF0gPSBhcmdzWzBdLnJlcGxhY2UoLyUoW2EteiVdKS9nLCBmdW5jdGlvbihtYXRjaCwgZm9ybWF0KSB7XG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XG4gICAgICBpZiAobWF0Y2ggPT09ICclJScpIHJldHVybiBtYXRjaDtcbiAgICAgIGluZGV4Kys7XG4gICAgICB2YXIgZm9ybWF0dGVyID0gZXhwb3J0cy5mb3JtYXR0ZXJzW2Zvcm1hdF07XG4gICAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZvcm1hdHRlcikge1xuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XG4gICAgICAgIG1hdGNoID0gZm9ybWF0dGVyLmNhbGwoc2VsZiwgdmFsKTtcblxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXG4gICAgICAgIGFyZ3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaW5kZXgtLTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcblxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZXhwb3J0cy5mb3JtYXRBcmdzKSB7XG4gICAgICBhcmdzID0gZXhwb3J0cy5mb3JtYXRBcmdzLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgIH1cbiAgICB2YXIgbG9nRm4gPSBlbmFibGVkLmxvZyB8fCBleHBvcnRzLmxvZyB8fCBjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO1xuICAgIGxvZ0ZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG4gIGVuYWJsZWQuZW5hYmxlZCA9IHRydWU7XG5cbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XG5cbiAgZm4ubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuXG4gIHJldHVybiBmbjtcbn1cblxuLyoqXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lc3BhY2VzLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XG4gIGV4cG9ydHMuc2F2ZShuYW1lc3BhY2VzKTtcblxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcbiAgdmFyIGxlbiA9IHNwbGl0Lmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKCFzcGxpdFtpXSkgY29udGludWU7IC8vIGlnbm9yZSBlbXB0eSBzdHJpbmdzXG4gICAgbmFtZXNwYWNlcyA9IHNwbGl0W2ldLnJlcGxhY2UoL1xcKi9nLCAnLio/Jyk7XG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xuICAgICAgZXhwb3J0cy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcy5zdWJzdHIoMSkgKyAnJCcpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4gbW9kZSBuYW1lIGlzIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZW5hYmxlZChuYW1lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoZXhwb3J0cy5uYW1lc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENvZXJjZSBgdmFsYC5cbiAqXG4gKiBAcGFyYW0ge01peGVkfSB2YWxcbiAqIEByZXR1cm4ge01peGVkfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gY29lcmNlKHZhbCkge1xuICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiB2YWwuc3RhY2sgfHwgdmFsLm1lc3NhZ2U7XG4gIHJldHVybiB2YWw7XG59XG4iLCIvKipcbiAqIEhlbHBlcnMuXG4gKi9cblxudmFyIHMgPSAxMDAwO1xudmFyIG0gPSBzICogNjA7XG52YXIgaCA9IG0gKiA2MDtcbnZhciBkID0gaCAqIDI0O1xudmFyIHkgPSBkICogMzY1LjI1O1xuXG4vKipcbiAqIFBhcnNlIG9yIGZvcm1hdCB0aGUgZ2l2ZW4gYHZhbGAuXG4gKlxuICogT3B0aW9uczpcbiAqXG4gKiAgLSBgbG9uZ2AgdmVyYm9zZSBmb3JtYXR0aW5nIFtmYWxzZV1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmFsLCBvcHRpb25zKXtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gcGFyc2UodmFsKTtcbiAgcmV0dXJuIG9wdGlvbnMubG9uZ1xuICAgID8gbG9uZyh2YWwpXG4gICAgOiBzaG9ydCh2YWwpO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gYHN0cmAgYW5kIHJldHVybiBtaWxsaXNlY29uZHMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TnVtYmVyfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gcGFyc2Uoc3RyKSB7XG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1zfHNlY29uZHM/fHN8bWludXRlcz98bXxob3Vycz98aHxkYXlzP3xkfHllYXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xuICBpZiAoIW1hdGNoKSByZXR1cm47XG4gIHZhciBuID0gcGFyc2VGbG9hdChtYXRjaFsxXSk7XG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ3llYXJzJzpcbiAgICBjYXNlICd5ZWFyJzpcbiAgICBjYXNlICd5JzpcbiAgICAgIHJldHVybiBuICogeTtcbiAgICBjYXNlICdkYXlzJzpcbiAgICBjYXNlICdkYXknOlxuICAgIGNhc2UgJ2QnOlxuICAgICAgcmV0dXJuIG4gKiBkO1xuICAgIGNhc2UgJ2hvdXJzJzpcbiAgICBjYXNlICdob3VyJzpcbiAgICBjYXNlICdoJzpcbiAgICAgIHJldHVybiBuICogaDtcbiAgICBjYXNlICdtaW51dGVzJzpcbiAgICBjYXNlICdtaW51dGUnOlxuICAgIGNhc2UgJ20nOlxuICAgICAgcmV0dXJuIG4gKiBtO1xuICAgIGNhc2UgJ3NlY29uZHMnOlxuICAgIGNhc2UgJ3NlY29uZCc6XG4gICAgY2FzZSAncyc6XG4gICAgICByZXR1cm4gbiAqIHM7XG4gICAgY2FzZSAnbXMnOlxuICAgICAgcmV0dXJuIG47XG4gIH1cbn1cblxuLyoqXG4gKiBTaG9ydCBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzaG9ydChtcykge1xuICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcbiAgaWYgKG1zID49IGgpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gaCkgKyAnaCc7XG4gIGlmIChtcyA+PSBtKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIG0pICsgJ20nO1xuICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcbiAgcmV0dXJuIG1zICsgJ21zJztcbn1cblxuLyoqXG4gKiBMb25nIGZvcm1hdCBmb3IgYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGxvbmcobXMpIHtcbiAgcmV0dXJuIHBsdXJhbChtcywgZCwgJ2RheScpXG4gICAgfHwgcGx1cmFsKG1zLCBoLCAnaG91cicpXG4gICAgfHwgcGx1cmFsKG1zLCBtLCAnbWludXRlJylcbiAgICB8fCBwbHVyYWwobXMsIHMsICdzZWNvbmQnKVxuICAgIHx8IG1zICsgJyBtcyc7XG59XG5cbi8qKlxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXG4gKi9cblxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XG4gIGlmIChtcyA8IG4pIHJldHVybjtcbiAgaWYgKG1zIDwgbiAqIDEuNSkgcmV0dXJuIE1hdGguZmxvb3IobXMgLyBuKSArICcgJyArIG5hbWU7XG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XG59XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgUGFuZWxHcm91cCA9IHJlcXVpcmUoJy4vUGFuZWxHcm91cCcpO1xuXG52YXIgQWNjb3JkaW9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWNjb3JkaW9uJyxcbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUGFuZWxHcm91cCgge2FjY29yZGlvbjp0cnVlfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBY2NvcmRpb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEFmZml4TWl4aW4gPSByZXF1aXJlKCcuL0FmZml4TWl4aW4nKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcblxudmFyIEFmZml4ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWZmaXgnLFxuICBzdGF0aWNzOiB7XG4gICAgZG9tVXRpbHM6IGRvbVV0aWxzXG4gIH0sXG5cbiAgbWl4aW5zOiBbQWZmaXhNaXhpbl0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhvbGRlclN0eWxlID0ge3RvcDogdGhpcy5zdGF0ZS5hZmZpeFBvc2l0aW9uVG9wfTtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOnRoaXMuc3RhdGUuYWZmaXhDbGFzcywgc3R5bGU6aG9sZGVyU3R5bGV9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFmZml4OyIsIi8qIGdsb2JhbCB3aW5kb3csIGRvY3VtZW50ICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xudmFyIEV2ZW50TGlzdGVuZXIgPSByZXF1aXJlKCcuL3V0aWxzL0V2ZW50TGlzdGVuZXInKTtcblxudmFyIEFmZml4TWl4aW4gPSB7XG4gIHByb3BUeXBlczoge1xuICAgIG9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBvZmZzZXRUb3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgb2Zmc2V0Qm90dG9tOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFmZml4Q2xhc3M6ICdhZmZpeC10b3AnXG4gICAgfTtcbiAgfSxcblxuICBnZXRQaW5uZWRPZmZzZXQ6IGZ1bmN0aW9uIChET01Ob2RlKSB7XG4gICAgaWYgKHRoaXMucGlubmVkT2Zmc2V0KSB7XG4gICAgICByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXQ7XG4gICAgfVxuXG4gICAgRE9NTm9kZS5jbGFzc05hbWUgPSBET01Ob2RlLmNsYXNzTmFtZS5yZXBsYWNlKC9hZmZpeC10b3B8YWZmaXgtYm90dG9tfGFmZml4LywgJycpO1xuICAgIERPTU5vZGUuY2xhc3NOYW1lICs9IERPTU5vZGUuY2xhc3NOYW1lLmxlbmd0aCA/ICcgYWZmaXgnIDogJ2FmZml4JztcblxuICAgIHRoaXMucGlubmVkT2Zmc2V0ID0gZG9tVXRpbHMuZ2V0T2Zmc2V0KERPTU5vZGUpLnRvcCAtIHdpbmRvdy5wYWdlWU9mZnNldDtcblxuICAgIHJldHVybiB0aGlzLnBpbm5lZE9mZnNldDtcbiAgfSxcblxuICBjaGVja1Bvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIERPTU5vZGUsIHNjcm9sbEhlaWdodCwgc2Nyb2xsVG9wLCBwb3NpdGlvbiwgb2Zmc2V0VG9wLCBvZmZzZXRCb3R0b20sXG4gICAgICAgIGFmZml4LCBhZmZpeFR5cGUsIGFmZml4UG9zaXRpb25Ub3A7XG5cbiAgICAvLyBUT0RPOiBvciBub3QgdmlzaWJsZVxuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIERPTU5vZGUgPSB0aGlzLmdldERPTU5vZGUoKTtcbiAgICBzY3JvbGxIZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIHNjcm9sbFRvcCA9IHdpbmRvdy5wYWdlWU9mZnNldDtcbiAgICBwb3NpdGlvbiA9IGRvbVV0aWxzLmdldE9mZnNldChET01Ob2RlKTtcbiAgICBvZmZzZXRUb3A7XG4gICAgb2Zmc2V0Qm90dG9tO1xuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PT0gJ3RvcCcpIHtcbiAgICAgIHBvc2l0aW9uLnRvcCArPSBzY3JvbGxUb3A7XG4gICAgfVxuXG4gICAgb2Zmc2V0VG9wID0gdGhpcy5wcm9wcy5vZmZzZXRUb3AgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLm9mZnNldFRvcCA6IHRoaXMucHJvcHMub2Zmc2V0O1xuICAgIG9mZnNldEJvdHRvbSA9IHRoaXMucHJvcHMub2Zmc2V0Qm90dG9tICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5vZmZzZXRCb3R0b20gOiB0aGlzLnByb3BzLm9mZnNldDtcblxuICAgIGlmIChvZmZzZXRUb3AgPT0gbnVsbCAmJiBvZmZzZXRCb3R0b20gPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0VG9wID09IG51bGwpIHtcbiAgICAgIG9mZnNldFRvcCA9IDA7XG4gICAgfVxuICAgIGlmIChvZmZzZXRCb3R0b20gPT0gbnVsbCkge1xuICAgICAgb2Zmc2V0Qm90dG9tID0gMDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsICYmIChzY3JvbGxUb3AgKyB0aGlzLnVucGluIDw9IHBvc2l0aW9uLnRvcCkpIHtcbiAgICAgIGFmZml4ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChvZmZzZXRCb3R0b20gIT0gbnVsbCAmJiAocG9zaXRpb24udG9wICsgRE9NTm9kZS5vZmZzZXRIZWlnaHQgPj0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tKSkge1xuICAgICAgYWZmaXggPSAnYm90dG9tJztcbiAgICB9IGVsc2UgaWYgKG9mZnNldFRvcCAhPSBudWxsICYmIChzY3JvbGxUb3AgPD0gb2Zmc2V0VG9wKSkge1xuICAgICAgYWZmaXggPSAndG9wJztcbiAgICB9IGVsc2Uge1xuICAgICAgYWZmaXggPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hZmZpeGVkID09PSBhZmZpeCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnVucGluICE9IG51bGwpIHtcbiAgICAgIERPTU5vZGUuc3R5bGUudG9wID0gJyc7XG4gICAgfVxuXG4gICAgYWZmaXhUeXBlID0gJ2FmZml4JyArIChhZmZpeCA/ICctJyArIGFmZml4IDogJycpO1xuXG4gICAgdGhpcy5hZmZpeGVkID0gYWZmaXg7XG4gICAgdGhpcy51bnBpbiA9IGFmZml4ID09PSAnYm90dG9tJyA/XG4gICAgICB0aGlzLmdldFBpbm5lZE9mZnNldChET01Ob2RlKSA6IG51bGw7XG5cbiAgICBpZiAoYWZmaXggPT09ICdib3R0b20nKSB7XG4gICAgICBET01Ob2RlLmNsYXNzTmFtZSA9IERPTU5vZGUuY2xhc3NOYW1lLnJlcGxhY2UoL2FmZml4LXRvcHxhZmZpeC1ib3R0b218YWZmaXgvLCAnYWZmaXgtdG9wJyk7XG4gICAgICBhZmZpeFBvc2l0aW9uVG9wID0gc2Nyb2xsSGVpZ2h0IC0gb2Zmc2V0Qm90dG9tIC0gRE9NTm9kZS5vZmZzZXRIZWlnaHQgLSBkb21VdGlscy5nZXRPZmZzZXQoRE9NTm9kZSkudG9wO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgYWZmaXhDbGFzczogYWZmaXhUeXBlLFxuICAgICAgYWZmaXhQb3NpdGlvblRvcDogYWZmaXhQb3NpdGlvblRvcFxuICAgIH0pO1xuICB9LFxuXG4gIGNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wOiBmdW5jdGlvbiAoKSB7XG4gICAgc2V0VGltZW91dCh0aGlzLmNoZWNrUG9zaXRpb24sIDApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbih3aW5kb3csICdzY3JvbGwnLCB0aGlzLmNoZWNrUG9zaXRpb24pO1xuICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAnY2xpY2snLCB0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9vbldpbmRvd1Njcm9sbExpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbldpbmRvd1Njcm9sbExpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgaWYgKHByZXZTdGF0ZS5hZmZpeENsYXNzID09PSB0aGlzLnN0YXRlLmFmZml4Q2xhc3MpIHtcbiAgICAgIHRoaXMuY2hlY2tQb3NpdGlvbldpdGhFdmVudExvb3AoKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQWZmaXhNaXhpbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIEFsZXJ0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQWxlcnQnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25EaXNtaXNzOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkaXNtaXNzQWZ0ZXI6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2FsZXJ0JyxcbiAgICAgIGJzU3R5bGU6ICdpbmZvJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyRGlzbWlzc0J1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYnV0dG9uKFxuICAgICAgICB7dHlwZTpcImJ1dHRvblwiLFxuICAgICAgICBjbGFzc05hbWU6XCJjbG9zZVwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMucHJvcHMub25EaXNtaXNzLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOlwidHJ1ZVwifSwgXG4gICAgICAgIFwiIMOXIFwiXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIHZhciBpc0Rpc21pc3NhYmxlID0gISF0aGlzLnByb3BzLm9uRGlzbWlzcztcblxuICAgIGNsYXNzZXNbJ2FsZXJ0LWRpc21pc3NhYmxlJ10gPSBpc0Rpc21pc3NhYmxlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBpc0Rpc21pc3NhYmxlID8gdGhpcy5yZW5kZXJEaXNtaXNzQnV0dG9uKCkgOiBudWxsLFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuZGlzbWlzc0FmdGVyICYmIHRoaXMucHJvcHMub25EaXNtaXNzKSB7XG4gICAgICB0aGlzLmRpc21pc3NUaW1lciA9IHNldFRpbWVvdXQodGhpcy5wcm9wcy5vbkRpc21pc3MsIHRoaXMucHJvcHMuZGlzbWlzc0FmdGVyKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmRpc21pc3NUaW1lcik7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFsZXJ0OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBCYWRnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0JhZGdlJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdwdWxsLXJpZ2h0JzogdGhpcy5wcm9wcy5wdWxsUmlnaHQsXG4gICAgICAnYmFkZ2UnOiBWYWxpZENvbXBvbmVudENoaWxkcmVuLmhhc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuY2hpbGRyZW4pXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFkZ2U7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG52YXIgQm9vdHN0cmFwTWl4aW4gPSB7XG4gIHByb3BUeXBlczoge1xuICAgIGJzQ2xhc3M6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihPYmplY3Qua2V5cyhjb25zdGFudHMuQ0xBU1NFUykpLFxuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihPYmplY3Qua2V5cyhjb25zdGFudHMuU1RZTEVTKSksXG4gICAgYnNTaXplOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLlNJWkVTKSlcbiAgfSxcblxuICBnZXRCc0NsYXNzU2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIHZhciBic0NsYXNzID0gdGhpcy5wcm9wcy5ic0NsYXNzICYmIGNvbnN0YW50cy5DTEFTU0VTW3RoaXMucHJvcHMuYnNDbGFzc107XG4gICAgaWYgKGJzQ2xhc3MpIHtcbiAgICAgIGNsYXNzZXNbYnNDbGFzc10gPSB0cnVlO1xuXG4gICAgICB2YXIgcHJlZml4ID0gYnNDbGFzcyArICctJztcblxuICAgICAgdmFyIGJzU2l6ZSA9IHRoaXMucHJvcHMuYnNTaXplICYmIGNvbnN0YW50cy5TSVpFU1t0aGlzLnByb3BzLmJzU2l6ZV07XG4gICAgICBpZiAoYnNTaXplKSB7XG4gICAgICAgIGNsYXNzZXNbcHJlZml4ICsgYnNTaXplXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHZhciBic1N0eWxlID0gdGhpcy5wcm9wcy5ic1N0eWxlICYmIGNvbnN0YW50cy5TVFlMRVNbdGhpcy5wcm9wcy5ic1N0eWxlXTtcbiAgICAgIGlmICh0aGlzLnByb3BzLmJzU3R5bGUpIHtcbiAgICAgICAgY2xhc3Nlc1twcmVmaXggKyBic1N0eWxlXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsYXNzZXM7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQm9vdHN0cmFwTWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgQnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGFjdGl2ZTogICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYmxvY2s6ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdkl0ZW06ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdkRyb3Bkb3duOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0JyxcbiAgICAgIHR5cGU6ICdidXR0b24nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMucHJvcHMubmF2RHJvcGRvd24gPyB7fSA6IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIHZhciByZW5kZXJGdW5jTmFtZTtcblxuICAgIGNsYXNzZXNbJ2FjdGl2ZSddID0gdGhpcy5wcm9wcy5hY3RpdmU7XG4gICAgY2xhc3Nlc1snYnRuLWJsb2NrJ10gPSB0aGlzLnByb3BzLmJsb2NrO1xuXG4gICAgaWYgKHRoaXMucHJvcHMubmF2SXRlbSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyTmF2SXRlbShjbGFzc2VzKTtcbiAgICB9XG5cbiAgICByZW5kZXJGdW5jTmFtZSA9IHRoaXMucHJvcHMuaHJlZiB8fCB0aGlzLnByb3BzLm5hdkRyb3Bkb3duID9cbiAgICAgICdyZW5kZXJBbmNob3InIDogJ3JlbmRlckJ1dHRvbic7XG5cbiAgICByZXR1cm4gdGhpc1tyZW5kZXJGdW5jTmFtZV0oY2xhc3Nlcyk7XG4gIH0sXG5cbiAgcmVuZGVyQW5jaG9yOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHZhciBocmVmID0gdGhpcy5wcm9wcy5ocmVmIHx8ICcjJztcbiAgICBjbGFzc2VzWydkaXNhYmxlZCddID0gdGhpcy5wcm9wcy5kaXNhYmxlZDtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICB7aHJlZjpocmVmLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgIHJvbGU6XCJidXR0b25cIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJCdXR0b246IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbihcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHZhciBsaUNsYXNzZXMgPSB7XG4gICAgICBhY3RpdmU6IHRoaXMucHJvcHMuYWN0aXZlXG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQobGlDbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnJlbmRlckFuY2hvcihjbGFzc2VzKVxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcblxudmFyIEJ1dHRvbkdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQnV0dG9uR3JvdXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgdmVydGljYWw6ICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBqdXN0aWZpZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdidXR0b24tZ3JvdXAnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cCddID0gIXRoaXMucHJvcHMudmVydGljYWw7XG4gICAgY2xhc3Nlc1snYnRuLWdyb3VwLXZlcnRpY2FsJ10gPSB0aGlzLnByb3BzLnZlcnRpY2FsO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cC1qdXN0aWZpZWQnXSA9IHRoaXMucHJvcHMuanVzdGlmaWVkO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uR3JvdXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG5cbnZhciBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbkdyb3VwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uLXRvb2xiYXInXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdihcbiAgICAgICAge3JvbGU6XCJ0b29sYmFyXCIsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQnV0dG9uR3JvdXA7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIENhcm91c2VsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ2Fyb3VzZWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgc2xpZGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGluZGljYXRvcnM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbnRyb2xzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBwYXVzZU9uSG92ZXI6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHdyYXA6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblNsaWRlRW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmVJbmRleDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWZhdWx0QWN0aXZlSW5kZXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGlyZWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydwcmV2JywgJ25leHQnXSlcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2xpZGU6IHRydWUsXG4gICAgICBpbnRlcnZhbDogNTAwMCxcbiAgICAgIHBhdXNlT25Ib3ZlcjogdHJ1ZSxcbiAgICAgIHdyYXA6IHRydWUsXG4gICAgICBpbmRpY2F0b3JzOiB0cnVlLFxuICAgICAgY29udHJvbHM6IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVJbmRleDogdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlSW5kZXggPT0gbnVsbCA/XG4gICAgICAgIDAgOiB0aGlzLnByb3BzLmRlZmF1bHRBY3RpdmVJbmRleCxcbiAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IG51bGwsXG4gICAgICBkaXJlY3Rpb246IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIGdldERpcmVjdGlvbjogZnVuY3Rpb24gKHByZXZJbmRleCwgaW5kZXgpIHtcbiAgICBpZiAocHJldkluZGV4ID09PSBpbmRleCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZXZJbmRleCA+IGluZGV4ID9cbiAgICAgICdwcmV2JyA6ICduZXh0JztcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuXG4gICAgaWYgKG5leHRQcm9wcy5hY3RpdmVJbmRleCAhPSBudWxsICYmIG5leHRQcm9wcy5hY3RpdmVJbmRleCAhPT0gYWN0aXZlSW5kZXgpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IGFjdGl2ZUluZGV4LFxuICAgICAgICBkaXJlY3Rpb246IG5leHRQcm9wcy5kaXJlY3Rpb24gIT0gbnVsbCA/XG4gICAgICAgICAgbmV4dFByb3BzLmRpcmVjdGlvbiA6IHRoaXMuZ2V0RGlyZWN0aW9uKGFjdGl2ZUluZGV4LCBuZXh0UHJvcHMuYWN0aXZlSW5kZXgpXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICB9LFxuXG4gIG5leHQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICB2YXIgaW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCkgKyAxO1xuICAgIHZhciBjb3VudCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICBpZiAoaW5kZXggPiBjb3VudCAtIDEpIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gMDtcbiAgICB9XG5cbiAgICB0aGlzLmhhbmRsZVNlbGVjdChpbmRleCwgJ25leHQnKTtcbiAgfSxcblxuICBwcmV2OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpIC0gMTtcblxuICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5udW1iZXJPZih0aGlzLnByb3BzLmNoaWxkcmVuKSAtIDE7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVTZWxlY3QoaW5kZXgsICdwcmV2Jyk7XG4gIH0sXG5cbiAgcGF1c2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgfSxcblxuICBwbGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuICAgIHRoaXMud2FpdEZvck5leHQoKTtcbiAgfSxcblxuICB3YWl0Rm9yTmV4dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc1BhdXNlZCAmJiB0aGlzLnByb3BzLnNsaWRlICYmIHRoaXMucHJvcHMuaW50ZXJ2YWwgJiZcbiAgICAgICAgdGhpcy5wcm9wcy5hY3RpdmVJbmRleCA9PSBudWxsKSB7XG4gICAgICB0aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMubmV4dCwgdGhpcy5wcm9wcy5pbnRlcnZhbCk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZU1vdXNlT3ZlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLnBhdXNlT25Ib3Zlcikge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVNb3VzZU91dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzUGF1c2VkKSB7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICBjYXJvdXNlbDogdHJ1ZSxcbiAgICAgIHNsaWRlOiB0aGlzLnByb3BzLnNsaWRlXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgIG9uTW91c2VPdmVyOnRoaXMuaGFuZGxlTW91c2VPdmVyLFxuICAgICAgICBvbk1vdXNlT3V0OnRoaXMuaGFuZGxlTW91c2VPdXR9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5pbmRpY2F0b3JzID8gdGhpcy5yZW5kZXJJbmRpY2F0b3JzKCkgOiBudWxsLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtaW5uZXJcIiwgcmVmOlwiaW5uZXJcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVySXRlbSlcbiAgICAgICAgKSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb250cm9scyA/IHRoaXMucmVuZGVyQ29udHJvbHMoKSA6IG51bGxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclByZXY6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJsZWZ0IGNhcm91c2VsLWNvbnRyb2xcIiwgaHJlZjpcIiNwcmV2XCIsIGtleTowLCBvbkNsaWNrOnRoaXMucHJldn0sIFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImdseXBoaWNvbiBnbHlwaGljb24tY2hldnJvbi1sZWZ0XCJ9IClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoIHtjbGFzc05hbWU6XCJyaWdodCBjYXJvdXNlbC1jb250cm9sXCIsIGhyZWY6XCIjbmV4dFwiLCBrZXk6MSwgb25DbGljazp0aGlzLm5leHR9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tcmlnaHRcIn0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb250cm9sczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLndyYXApIHtcbiAgICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICAgIHZhciBjb3VudCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICAgIHJldHVybiBbXG4gICAgICAgIChhY3RpdmVJbmRleCAhPT0gMCkgPyB0aGlzLnJlbmRlclByZXYoKSA6IG51bGwsXG4gICAgICAgIChhY3RpdmVJbmRleCAhPT0gY291bnQgLSAxKSA/IHRoaXMucmVuZGVyTmV4dCgpIDogbnVsbFxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgdGhpcy5yZW5kZXJQcmV2KCksXG4gICAgICB0aGlzLnJlbmRlck5leHQoKVxuICAgIF07XG4gIH0sXG5cbiAgcmVuZGVySW5kaWNhdG9yOiBmdW5jdGlvbiAoY2hpbGQsIGluZGV4KSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IChpbmRleCA9PT0gdGhpcy5nZXRBY3RpdmVJbmRleCgpKSA/XG4gICAgICAnYWN0aXZlJyA6IG51bGw7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmxpKFxuICAgICAgICB7a2V5OmluZGV4LFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NOYW1lLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0LmJpbmQodGhpcywgaW5kZXgsIG51bGwpfSApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJJbmRpY2F0b3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGluZGljYXRvcnMgPSBbXTtcbiAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuXG4gICAgICAuZm9yRWFjaCh0aGlzLnByb3BzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCwgaW5kZXgpIHtcbiAgICAgICAgaW5kaWNhdG9ycy5wdXNoKFxuICAgICAgICAgIHRoaXMucmVuZGVySW5kaWNhdG9yKGNoaWxkLCBpbmRleCksXG5cbiAgICAgICAgICAvLyBGb3JjZSB3aGl0ZXNwYWNlIGJldHdlZW4gaW5kaWNhdG9yIGVsZW1lbnRzLCBib290c3RyYXBcbiAgICAgICAgICAvLyByZXF1aXJlcyB0aGlzIGZvciBjb3JyZWN0IHNwYWNpbmcgb2YgZWxlbWVudHMuXG4gICAgICAgICAgJyAnXG4gICAgICAgICk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ub2woIHtjbGFzc05hbWU6XCJjYXJvdXNlbC1pbmRpY2F0b3JzXCJ9LCBcbiAgICAgICAgaW5kaWNhdG9yc1xuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgZ2V0QWN0aXZlSW5kZXg6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5hY3RpdmVJbmRleCAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVJbmRleCA6IHRoaXMuc3RhdGUuYWN0aXZlSW5kZXg7XG4gIH0sXG5cbiAgaGFuZGxlSXRlbUFuaW1hdGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IG51bGwsXG4gICAgICBkaXJlY3Rpb246IG51bGxcbiAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMud2FpdEZvck5leHQoKTtcblxuICAgICAgaWYgKHRoaXMucHJvcHMub25TbGlkZUVuZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2xpZGVFbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJJdGVtOiBmdW5jdGlvbiAoY2hpbGQsIGluZGV4KSB7XG4gICAgdmFyIGFjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuICAgIHZhciBpc0FjdGl2ZSA9IChpbmRleCA9PT0gYWN0aXZlSW5kZXgpO1xuICAgIHZhciBpc1ByZXZpb3VzQWN0aXZlID0gdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwgJiZcbiAgICAgICAgICAgIHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCA9PT0gaW5kZXggJiYgdGhpcy5wcm9wcy5zbGlkZTtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIHtcbiAgICAgICAgICBhY3RpdmU6IGlzQWN0aXZlLFxuICAgICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5ICE9IG51bGwgP1xuICAgICAgICAgICAgY2hpbGQucHJvcHMua2V5IDogaW5kZXgsXG4gICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgIGFuaW1hdGVPdXQ6IGlzUHJldmlvdXNBY3RpdmUsXG4gICAgICAgICAgYW5pbWF0ZUluOiBpc0FjdGl2ZSAmJiB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggIT0gbnVsbCAmJiB0aGlzLnByb3BzLnNsaWRlLFxuICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5zdGF0ZS5kaXJlY3Rpb24sXG4gICAgICAgICAgb25BbmltYXRlT3V0RW5kOiBpc1ByZXZpb3VzQWN0aXZlID8gdGhpcy5oYW5kbGVJdGVtQW5pbWF0ZU91dEVuZDogbnVsbFxuICAgICAgICB9XG4gICAgICApO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGluZGV4LCBkaXJlY3Rpb24pIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcblxuICAgIHZhciBwcmV2aW91c0FjdGl2ZUluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpO1xuICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiB8fCB0aGlzLmdldERpcmVjdGlvbihwcmV2aW91c0FjdGl2ZUluZGV4LCBpbmRleCk7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChpbmRleCwgZGlyZWN0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVJbmRleCA9PSBudWxsICYmIGluZGV4ICE9PSBwcmV2aW91c0FjdGl2ZUluZGV4KSB7XG4gICAgICBpZiAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwpIHtcbiAgICAgICAgLy8gSWYgY3VycmVudGx5IGFuaW1hdGluZyBkb24ndCBhY3RpdmF0ZSB0aGUgbmV3IGluZGV4LlxuICAgICAgICAvLyBUT0RPOiBsb29rIGludG8gcXVldWluZyB0aGlzIGNhbmNlbGVkIGNhbGwgYW5kXG4gICAgICAgIC8vIGFuaW1hdGluZyBhZnRlciB0aGUgY3VycmVudCBhbmltYXRpb24gaGFzIGVuZGVkLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhY3RpdmVJbmRleDogaW5kZXgsXG4gICAgICAgIHByZXZpb3VzQWN0aXZlSW5kZXg6IHByZXZpb3VzQWN0aXZlSW5kZXgsXG4gICAgICAgIGRpcmVjdGlvbjogZGlyZWN0aW9uXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcm91c2VsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBDYXJvdXNlbEl0ZW0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDYXJvdXNlbEl0ZW0nLFxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXJlY3Rpb246IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3ByZXYnLCAnbmV4dCddKSxcbiAgICBvbkFuaW1hdGVPdXRFbmQ6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY2FwdGlvbjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVBbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kICYmIHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kKHRoaXMucHJvcHMuaW5kZXgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlICE9PSBuZXh0UHJvcHMuYWN0aXZlKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmFjdGl2ZSAmJiBwcmV2UHJvcHMuYWN0aXZlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIHRoaXMuZ2V0RE9NTm9kZSgpLFxuICAgICAgICB0aGlzLmhhbmRsZUFuaW1hdGVPdXRFbmRcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlICE9PSBwcmV2UHJvcHMuYWN0aXZlKSB7XG4gICAgICBzZXRUaW1lb3V0KHRoaXMuc3RhcnRBbmltYXRpb24sIDIwKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RhcnRBbmltYXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGRpcmVjdGlvbjogdGhpcy5wcm9wcy5kaXJlY3Rpb24gPT09ICdwcmV2JyA/XG4gICAgICAgICdyaWdodCcgOiAnbGVmdCdcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgIGl0ZW06IHRydWUsXG4gICAgICBhY3RpdmU6ICh0aGlzLnByb3BzLmFjdGl2ZSAmJiAhdGhpcy5wcm9wcy5hbmltYXRlSW4pIHx8IHRoaXMucHJvcHMuYW5pbWF0ZU91dCxcbiAgICAgIG5leHQ6IHRoaXMucHJvcHMuYWN0aXZlICYmIHRoaXMucHJvcHMuYW5pbWF0ZUluICYmIHRoaXMucHJvcHMuZGlyZWN0aW9uID09PSAnbmV4dCcsXG4gICAgICBwcmV2OiB0aGlzLnByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFuaW1hdGVJbiAmJiB0aGlzLnByb3BzLmRpcmVjdGlvbiA9PT0gJ3ByZXYnXG4gICAgfTtcblxuICAgIGlmICh0aGlzLnN0YXRlLmRpcmVjdGlvbiAmJiAodGhpcy5wcm9wcy5hbmltYXRlSW4gfHwgdGhpcy5wcm9wcy5hbmltYXRlT3V0KSkge1xuICAgICAgY2xhc3Nlc1t0aGlzLnN0YXRlLmRpcmVjdGlvbl0gPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlbixcbiAgICAgICAgdGhpcy5wcm9wcy5jYXB0aW9uID8gdGhpcy5yZW5kZXJDYXB0aW9uKCkgOiBudWxsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDYXB0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJjYXJvdXNlbC1jYXB0aW9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jYXB0aW9uXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2Fyb3VzZWxJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5cblxudmFyIENvbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0NvbCcsXG4gIHByb3BUeXBlczoge1xuICAgIHhzOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHhzT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnT2Zmc2V0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHhzUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbVB1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWRQdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxnUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c1B1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc21QdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ1B1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuXG4gICAgT2JqZWN0LmtleXMoY29uc3RhbnRzLlNJWkVTKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHZhciBzaXplID0gY29uc3RhbnRzLlNJWkVTW2tleV07XG4gICAgICB2YXIgcHJvcCA9IHNpemU7XG4gICAgICB2YXIgY2xhc3NQYXJ0ID0gc2l6ZSArICctJztcblxuICAgICAgaWYgKHRoaXMucHJvcHNbcHJvcF0pIHtcbiAgICAgICAgY2xhc3Nlc1snY29sLScgKyBjbGFzc1BhcnQgKyB0aGlzLnByb3BzW3Byb3BdXSA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIHByb3AgPSBzaXplICsgJ09mZnNldCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1vZmZzZXQtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdQdXNoJztcbiAgICAgIGNsYXNzUGFydCA9IHNpemUgKyAnLXB1c2gtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdQdWxsJztcbiAgICAgIGNsYXNzUGFydCA9IHNpemUgKyAnLXB1bGwtJztcbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbDsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBDb2xsYXBzYWJsZU1peGluID0ge1xuXG4gIHByb3BUeXBlczoge1xuICAgIGNvbGxhcHNhYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkZWZhdWx0RXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy5kZWZhdWx0RXhwYW5kZWQgIT0gbnVsbCA/IHRoaXMucHJvcHMuZGVmYXVsdEV4cGFuZGVkIDogbnVsbCxcbiAgICAgIGNvbGxhcHNpbmc6IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVUcmFuc2l0aW9uRW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fY29sbGFwc2VFbmQgPSB0cnVlO1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgY29sbGFwc2luZzogZmFsc2VcbiAgICB9KTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV3UHJvcHMpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5jb2xsYXBzYWJsZSAmJiBuZXdQcm9wcy5leHBhbmRlZCAhPT0gdGhpcy5wcm9wcy5leHBhbmRlZCkge1xuICAgICAgdGhpcy5fY29sbGFwc2VFbmQgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBjb2xsYXBzaW5nOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX2FkZEVuZFRyYW5zaXRpb25MaXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIHRoaXMuaGFuZGxlVHJhbnNpdGlvbkVuZFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBUcmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIG5vZGUsXG4gICAgICAgIHRoaXMuaGFuZGxlVHJhbnNpdGlvbkVuZFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9hZnRlclJlbmRlcigpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVtb3ZlRW5kVHJhbnNpdGlvbkxpc3RlbmVyKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVwZGF0ZTogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIHZhciBkaW1lbnNpb24gPSAodHlwZW9mIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24gPT09ICdmdW5jdGlvbicpID9cbiAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24oKSA6ICdoZWlnaHQnO1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIHRoaXMuX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICAgIGlmIChub2RlICYmIG5leHRQcm9wcy5leHBhbmRlZCAhPT0gdGhpcy5wcm9wcy5leHBhbmRlZCAmJiB0aGlzLnByb3BzLmV4cGFuZGVkKSB7XG4gICAgICBub2RlLnN0eWxlW2RpbWVuc2lvbl0gPSB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWUoKSArICdweCc7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuY29sbGFwc2luZyAhPT0gcHJldlN0YXRlLmNvbGxhcHNpbmcpIHtcbiAgICAgIHRoaXMuX2FmdGVyUmVuZGVyKCk7XG4gICAgfVxuICB9LFxuXG4gIF9hZnRlclJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2FkZEVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICAgIHNldFRpbWVvdXQodGhpcy5fdXBkYXRlRGltZW5zaW9uQWZ0ZXJSZW5kZXIsIDApO1xuICB9LFxuXG4gIF91cGRhdGVEaW1lbnNpb25BZnRlclJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkaW1lbnNpb24gPSAodHlwZW9mIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24gPT09ICdmdW5jdGlvbicpID9cbiAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb24oKSA6ICdoZWlnaHQnO1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRDb2xsYXBzYWJsZURPTU5vZGUoKTtcblxuICAgIGlmIChub2RlKSB7XG4gICAgICBub2RlLnN0eWxlW2RpbWVuc2lvbl0gPSB0aGlzLmlzRXhwYW5kZWQoKSA/XG4gICAgICAgIHRoaXMuZ2V0Q29sbGFwc2FibGVEaW1lbnNpb25WYWx1ZSgpICsgJ3B4JyA6ICcwcHgnO1xuICAgIH1cbiAgfSxcblxuICBpc0V4cGFuZGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLnByb3BzLmV4cGFuZGVkICE9IG51bGwpID9cbiAgICAgIHRoaXMucHJvcHMuZXhwYW5kZWQgOiB0aGlzLnN0YXRlLmV4cGFuZGVkO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlQ2xhc3NTZXQ6IGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuXG4gICAgaWYgKHR5cGVvZiBjbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbGFzc05hbWUpIHtcbiAgICAgICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgICAgIGNsYXNzZXNbY2xhc3NOYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNsYXNzZXMuY29sbGFwc2luZyA9IHRoaXMuc3RhdGUuY29sbGFwc2luZztcbiAgICBjbGFzc2VzLmNvbGxhcHNlID0gIXRoaXMuc3RhdGUuY29sbGFwc2luZztcbiAgICBjbGFzc2VzWydpbiddID0gdGhpcy5pc0V4cGFuZGVkKCkgJiYgIXRoaXMuc3RhdGUuY29sbGFwc2luZztcblxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbGxhcHNhYmxlTWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0gcmVxdWlyZSgnLi9Ecm9wZG93blN0YXRlTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xudmFyIEJ1dHRvbkdyb3VwID0gcmVxdWlyZSgnLi9CdXR0b25Hcm91cCcpO1xudmFyIERyb3Bkb3duTWVudSA9IHJlcXVpcmUoJy4vRHJvcGRvd25NZW51Jyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG5cbnZhciBEcm9wZG93bkJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Ryb3Bkb3duQnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIERyb3Bkb3duU3RhdGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkcm9wdXA6ICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHRpdGxlOiAgICAgUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaHJlZjogICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uQ2xpY2s6ICAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25TZWxlY3Q6ICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBuYXZJdGVtOiAgIFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9ICdkcm9wZG93bi10b2dnbGUnO1xuXG4gICAgdmFyIHJlbmRlck1ldGhvZCA9IHRoaXMucHJvcHMubmF2SXRlbSA/XG4gICAgICAncmVuZGVyTmF2SXRlbScgOiAncmVuZGVyQnV0dG9uR3JvdXAnO1xuXG4gICAgcmV0dXJuIHRoaXNbcmVuZGVyTWV0aG9kXShbXG4gICAgICB0aGlzLnRyYW5zZmVyUHJvcHNUbyhCdXR0b24oXG4gICAgICAgIHtyZWY6XCJkcm9wZG93bkJ1dHRvblwiLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NOYW1lLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlRHJvcGRvd25DbGljayxcbiAgICAgICAga2V5OjAsXG4gICAgICAgIG5hdkRyb3Bkb3duOnRoaXMucHJvcHMubmF2SXRlbSxcbiAgICAgICAgbmF2SXRlbTpudWxsLFxuICAgICAgICB0aXRsZTpudWxsLFxuICAgICAgICBwdWxsUmlnaHQ6bnVsbCxcbiAgICAgICAgZHJvcHVwOm51bGx9LCBcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSwnICcsXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiY2FyZXRcIn0gKVxuICAgICAgKSksXG4gICAgICBEcm9wZG93bk1lbnUoXG4gICAgICAgIHtyZWY6XCJtZW51XCIsXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOnRoaXMucHJvcHMuaWQsXG4gICAgICAgIHB1bGxSaWdodDp0aGlzLnByb3BzLnB1bGxSaWdodCxcbiAgICAgICAga2V5OjF9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJNZW51SXRlbSlcbiAgICAgIClcbiAgICBdKTtcbiAgfSxcblxuICByZW5kZXJCdXR0b25Hcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGdyb3VwQ2xhc3NlcyA9IHtcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBCdXR0b25Hcm91cChcbiAgICAgICAge2JzU2l6ZTp0aGlzLnByb3BzLmJzU2l6ZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGdyb3VwQ2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24nOiB0cnVlLFxuICAgICAgICAnb3Blbic6IHRoaXMuc3RhdGUub3BlbixcbiAgICAgICAgJ2Ryb3B1cCc6IHRoaXMucHJvcHMuZHJvcHVwXG4gICAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTWVudUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIC8vIE9ubHkgaGFuZGxlIHRoZSBvcHRpb24gc2VsZWN0aW9uIGlmIGFuIG9uU2VsZWN0IHByb3AgaGFzIGJlZW4gc2V0IG9uIHRoZVxuICAgIC8vIGNvbXBvbmVudCBvciBpdCdzIGNoaWxkLCB0aGlzIGFsbG93cyBhIHVzZXIgbm90IHRvIHBhc3MgYW4gb25TZWxlY3RcbiAgICAvLyBoYW5kbGVyIGFuZCBoYXZlIHRoZSBicm93c2VyIHByZWZvcm0gdGhlIGRlZmF1bHQgYWN0aW9uLlxuICAgIHZhciBoYW5kbGVPcHRpb25TZWxlY3QgPSB0aGlzLnByb3BzLm9uU2VsZWN0IHx8IGNoaWxkLnByb3BzLm9uU2VsZWN0ID9cbiAgICAgIHRoaXMuaGFuZGxlT3B0aW9uU2VsZWN0IDogbnVsbDtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICAvLyBDYXB0dXJlIG9uU2VsZWN0IGV2ZW50c1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCBoYW5kbGVPcHRpb25TZWxlY3QpLFxuXG4gICAgICAgIC8vIEZvcmNlIHNwZWNpYWwgcHJvcHMgdG8gYmUgdHJhbnNmZXJyZWRcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgICB9XG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVEcm9wZG93bkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZSghdGhpcy5zdGF0ZS5vcGVuKTtcbiAgfSxcblxuICBoYW5kbGVPcHRpb25TZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duQnV0dG9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIERyb3Bkb3duTWVudSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Ryb3Bkb3duTWVudScsXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAgICdkcm9wZG93bi1tZW51JzogdHJ1ZSxcbiAgICAgICAgJ2Ryb3Bkb3duLW1lbnUtcmlnaHQnOiB0aGlzLnByb3BzLnB1bGxSaWdodFxuICAgICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgUmVhY3QuRE9NLnVsKFxuICAgICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksXG4gICAgICAgICAgcm9sZTpcIm1lbnVcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTWVudUl0ZW0pXG4gICAgICAgIClcbiAgICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTWVudUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICAvLyBDYXB0dXJlIG9uU2VsZWN0IGV2ZW50c1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcblxuICAgICAgICAvLyBGb3JjZSBzcGVjaWFsIHByb3BzIHRvIGJlIHRyYW5zZmVycmVkXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duTWVudTsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBFdmVudExpc3RlbmVyID0gcmVxdWlyZSgnLi91dGlscy9FdmVudExpc3RlbmVyJyk7XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBub2RlIGlzIHdpdGhpblxuICogYSByb290IG5vZGVzIHRyZWVcbiAqXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7RE9NRWxlbWVudH0gcm9vdFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzTm9kZUluUm9vdChub2RlLCByb290KSB7XG4gIHdoaWxlIChub2RlKSB7XG4gICAgaWYgKG5vZGUgPT09IHJvb3QpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0ge1xuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3BlbjogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIHNldERyb3Bkb3duU3RhdGU6IGZ1bmN0aW9uIChuZXdTdGF0ZSwgb25TdGF0ZUNoYW5nZUNvbXBsZXRlKSB7XG4gICAgaWYgKG5ld1N0YXRlKSB7XG4gICAgICB0aGlzLmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVuYmluZFJvb3RDbG9zZUhhbmRsZXJzKCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBvcGVuOiBuZXdTdGF0ZVxuICAgIH0sIG9uU3RhdGVDaGFuZ2VDb21wbGV0ZSk7XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRLZXlVcDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS5rZXlDb2RlID09PSAyNykge1xuICAgICAgdGhpcy5zZXREcm9wZG93blN0YXRlKGZhbHNlKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICAvLyBJZiB0aGUgY2xpY2sgb3JpZ2luYXRlZCBmcm9tIHdpdGhpbiB0aGlzIGNvbXBvbmVudFxuICAgIC8vIGRvbid0IGRvIGFueXRoaW5nLlxuICAgIGlmIChpc05vZGVJblJvb3QoZS50YXJnZXQsIHRoaXMuZ2V0RE9NTm9kZSgpKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH0sXG5cbiAgYmluZFJvb3RDbG9zZUhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdjbGljaycsIHRoaXMuaGFuZGxlRG9jdW1lbnRDbGljayk7XG4gICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuaGFuZGxlRG9jdW1lbnRLZXlVcCk7XG4gIH0sXG5cbiAgdW5iaW5kUm9vdENsb3NlSGFuZGxlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIucmVtb3ZlKCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy51bmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERyb3Bkb3duU3RhdGVNaXhpbjsiLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxuLy8gVE9ETzogbGlzdGVuIGZvciBvblRyYW5zaXRpb25FbmQgdG8gcmVtb3ZlIGVsXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgX2ZhZGVJbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHM7XG5cbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgZWxzID0gdGhpcy5nZXRET01Ob2RlKCkucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUnKTtcbiAgICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWxzLCBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICBlbC5jbGFzc05hbWUgKz0gJyBpbic7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBfZmFkZU91dDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHMgPSB0aGlzLl9mYWRlT3V0RWwucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUuaW4nKTtcblxuICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVscywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGVsLmNsYXNzTmFtZS5yZXBsYWNlKC9cXGJpblxcYi8sICcnKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHNldFRpbWVvdXQodGhpcy5faGFuZGxlRmFkZU91dEVuZCwgMzAwKTtcbiAgfSxcblxuICBfaGFuZGxlRmFkZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9mYWRlT3V0RWwgJiYgdGhpcy5fZmFkZU91dEVsLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMuX2ZhZGVPdXRFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2ZhZGVPdXRFbCk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgIC8vIEZpcmVmb3ggbmVlZHMgZGVsYXkgZm9yIHRyYW5zaXRpb24gdG8gYmUgdHJpZ2dlcmVkXG4gICAgICBzZXRUaW1lb3V0KHRoaXMuX2ZhZGVJbiwgMjApO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbHMgPSB0aGlzLmdldERPTU5vZGUoKS5xdWVyeVNlbGVjdG9yQWxsKCcuZmFkZScpO1xuICAgIGlmIChlbHMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5fZmFkZU91dEVsKTtcbiAgICAgIHRoaXMuX2ZhZGVPdXRFbC5hcHBlbmRDaGlsZCh0aGlzLmdldERPTU5vZGUoKS5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgICAgLy8gRmlyZWZveCBuZWVkcyBkZWxheSBmb3IgdHJhbnNpdGlvbiB0byBiZSB0cmlnZ2VyZWRcbiAgICAgIHNldFRpbWVvdXQodGhpcy5fZmFkZU91dCwgMjApO1xuICAgIH1cbiAgfVxufTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG52YXIgR2x5cGhpY29uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnR2x5cGhpY29uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGdseXBoOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoY29uc3RhbnRzLkdMWVBIUykuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnZ2x5cGhpY29uJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIGNsYXNzZXNbJ2dseXBoaWNvbi0nICsgdGhpcy5wcm9wcy5nbHlwaF0gPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdseXBoaWNvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxuXG52YXIgR3JpZCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0dyaWQnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBmbHVpZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOnRoaXMucHJvcHMuZmx1aWQgPyAnY29udGFpbmVyLWZsdWlkJyA6ICdjb250YWluZXInfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcmlkOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIElucHV0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSW5wdXQnLFxuICBwcm9wVHlwZXM6IHtcbiAgICB0eXBlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBoZWxwOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBhZGRvbkJlZm9yZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYWRkb25BZnRlcjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnc3VjY2VzcycsICd3YXJuaW5nJywgJ2Vycm9yJ10pLFxuICAgIGhhc0ZlZWRiYWNrOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBncm91cENsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB3cmFwcGVyQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGxhYmVsQ2xhc3NOYW1lOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0SW5wdXRET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVmcy5pbnB1dC5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgZ2V0VmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy50eXBlID09PSAnc3RhdGljJykge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMudmFsdWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMucHJvcHMudHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRET01Ob2RlKCkudmFsdWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoJ0Nhbm5vdCB1c2UgZ2V0VmFsdWUgd2l0aG91dCBzcGVjaWZ5aW5nIGlucHV0IHR5cGUuJyk7XG4gICAgfVxuICB9LFxuXG4gIGdldENoZWNrZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRJbnB1dERPTU5vZGUoKS5jaGVja2VkO1xuICB9LFxuXG4gIGlzQ2hlY2tib3hPclJhZGlvOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMudHlwZSA9PT0gJ3JhZGlvJyB8fCB0aGlzLnByb3BzLnR5cGUgPT09ICdjaGVja2JveCc7XG4gIH0sXG5cbiAgcmVuZGVySW5wdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuXG4gICAgaWYgKCF0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICAgIGlucHV0ID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5zZWxlY3QoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2xcIiwgcmVmOlwiaW5wdXRcIiwga2V5OlwiaW5wdXRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd0ZXh0YXJlYSc6XG4gICAgICAgIGlucHV0ID0gUmVhY3QuRE9NLnRleHRhcmVhKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9ICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhdGljJzpcbiAgICAgICAgaW5wdXQgPSAoXG4gICAgICAgICAgUmVhY3QuRE9NLnAoIHtjbGFzc05hbWU6XCJmb3JtLWNvbnRyb2wtc3RhdGljXCIsIHJlZjpcImlucHV0XCIsICBrZXk6XCJpbnB1dFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLnZhbHVlXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBjbGFzc05hbWUgPSB0aGlzLmlzQ2hlY2tib3hPclJhZGlvKCkgPyAnJyA6ICdmb3JtLWNvbnRyb2wnO1xuICAgICAgICBpbnB1dCA9IFJlYWN0LkRPTS5pbnB1dCgge2NsYXNzTmFtZTpjbGFzc05hbWUsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9ICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKGlucHV0KTtcbiAgfSxcblxuICByZW5kZXJJbnB1dEdyb3VwOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgYWRkb25CZWZvcmUgPSB0aGlzLnByb3BzLmFkZG9uQmVmb3JlID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwiLCBrZXk6XCJhZGRvbkJlZm9yZVwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuYWRkb25CZWZvcmVcbiAgICAgIClcbiAgICApIDogbnVsbDtcblxuICAgIHZhciBhZGRvbkFmdGVyID0gdGhpcy5wcm9wcy5hZGRvbkFmdGVyID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cC1hZGRvblwiLCBrZXk6XCJhZGRvbkFmdGVyXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5hZGRvbkFmdGVyXG4gICAgICApXG4gICAgKSA6IG51bGw7XG5cbiAgICByZXR1cm4gYWRkb25CZWZvcmUgfHwgYWRkb25BZnRlciA/IChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJpbnB1dC1ncm91cFwiLCBrZXk6XCJpbnB1dC1ncm91cFwifSwgXG4gICAgICAgIGFkZG9uQmVmb3JlLFxuICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgYWRkb25BZnRlclxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJJY29uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZ2x5cGhpY29uJzogdHJ1ZSxcbiAgICAgICdmb3JtLWNvbnRyb2wtZmVlZGJhY2snOiB0cnVlLFxuICAgICAgJ2dseXBoaWNvbi1vayc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3N1Y2Nlc3MnLFxuICAgICAgJ2dseXBoaWNvbi13YXJuaW5nLXNpZ24nOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICd3YXJuaW5nJyxcbiAgICAgICdnbHlwaGljb24tcmVtb3ZlJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnZXJyb3InXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmhhc0ZlZWRiYWNrID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGtleTpcImljb25cIn0gKVxuICAgICkgOiBudWxsO1xuICB9LFxuXG4gIHJlbmRlckhlbHA6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5oZWxwID8gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJoZWxwLWJsb2NrXCIsIGtleTpcImhlbHBcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmhlbHBcbiAgICAgIClcbiAgICApIDogbnVsbDtcbiAgfSxcblxuICByZW5kZXJDaGVja2JveGFuZFJhZGlvV3JhcHBlcjogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnY2hlY2tib3gnOiB0aGlzLnByb3BzLnR5cGUgPT09ICdjaGVja2JveCcsXG4gICAgICAncmFkaW8nOiB0aGlzLnByb3BzLnR5cGUgPT09ICdyYWRpbydcbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGtleTpcImNoZWNrYm94UmFkaW9XcmFwcGVyXCJ9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcldyYXBwZXI6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHJldHVybiB0aGlzLnByb3BzLndyYXBwZXJDbGFzc05hbWUgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOnRoaXMucHJvcHMud3JhcHBlckNsYXNzTmFtZSwga2V5Olwid3JhcHBlclwifSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKSA6IGNoaWxkcmVuO1xuICB9LFxuXG4gIHJlbmRlckxhYmVsOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdjb250cm9sLWxhYmVsJzogIXRoaXMuaXNDaGVja2JveE9yUmFkaW8oKVxuICAgIH07XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLmxhYmVsQ2xhc3NOYW1lXSA9IHRoaXMucHJvcHMubGFiZWxDbGFzc05hbWU7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5sYWJlbCA/IChcbiAgICAgIFJlYWN0LkRPTS5sYWJlbCgge2h0bWxGb3I6dGhpcy5wcm9wcy5pZCwgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJsYWJlbFwifSwgXG4gICAgICAgIGNoaWxkcmVuLFxuICAgICAgICB0aGlzLnByb3BzLmxhYmVsXG4gICAgICApXG4gICAgKSA6IGNoaWxkcmVuO1xuICB9LFxuXG4gIHJlbmRlckZvcm1Hcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZm9ybS1ncm91cCc6IHRydWUsXG4gICAgICAnaGFzLWZlZWRiYWNrJzogdGhpcy5wcm9wcy5oYXNGZWVkYmFjayxcbiAgICAgICdoYXMtc3VjY2Vzcyc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3N1Y2Nlc3MnLFxuICAgICAgJ2hhcy13YXJuaW5nJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnd2FybmluZycsXG4gICAgICAnaGFzLWVycm9yJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnZXJyb3InXG4gICAgfTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMuZ3JvdXBDbGFzc05hbWVdID0gdGhpcy5wcm9wcy5ncm91cENsYXNzTmFtZTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc0NoZWNrYm94T3JSYWRpbygpKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXJGb3JtR3JvdXAoXG4gICAgICAgIHRoaXMucmVuZGVyV3JhcHBlcihbXG4gICAgICAgICAgdGhpcy5yZW5kZXJDaGVja2JveGFuZFJhZGlvV3JhcHBlcihcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTGFiZWwoXG4gICAgICAgICAgICAgIHRoaXMucmVuZGVySW5wdXQoKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJIZWxwKClcbiAgICAgICAgXSlcbiAgICAgICk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRm9ybUdyb3VwKFtcbiAgICAgICAgdGhpcy5yZW5kZXJMYWJlbCgpLFxuICAgICAgICB0aGlzLnJlbmRlcldyYXBwZXIoW1xuICAgICAgICAgIHRoaXMucmVuZGVySW5wdXRHcm91cChcbiAgICAgICAgICAgIHRoaXMucmVuZGVySW5wdXQoKVxuICAgICAgICAgICksXG4gICAgICAgICAgdGhpcy5yZW5kZXJJY29uKCksXG4gICAgICAgICAgdGhpcy5yZW5kZXJIZWxwKClcbiAgICAgICAgXSlcbiAgICAgIF0pO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5wdXQ7XG4iLCIvLyBodHRwczovL3d3dy5ucG1qcy5vcmcvcGFja2FnZS9yZWFjdC1pbnRlcnBvbGF0ZS1jb21wb25lbnRcbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL3V0aWxzL21lcmdlJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgUkVHRVhQID0gL1xcJVxcKCguKz8pXFwpcy87XG5cbnZhciBJbnRlcnBvbGF0ZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdJbnRlcnBvbGF0ZScsXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZm9ybWF0OiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4geyBjb21wb25lbnQ6IFJlYWN0LkRPTS5zcGFuIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgZm9ybWF0ID0gVmFsaWRDb21wb25lbnRDaGlsZHJlbi5oYXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKSA/IHRoaXMucHJvcHMuY2hpbGRyZW4gOiB0aGlzLnByb3BzLmZvcm1hdDtcbiAgICB2YXIgcGFyZW50ID0gdGhpcy5wcm9wcy5jb21wb25lbnQ7XG4gICAgdmFyIHVuc2FmZSA9IHRoaXMucHJvcHMudW5zYWZlID09PSB0cnVlO1xuICAgIHZhciBwcm9wcyA9IG1lcmdlKHRoaXMucHJvcHMpO1xuXG4gICAgZGVsZXRlIHByb3BzLmNoaWxkcmVuO1xuICAgIGRlbGV0ZSBwcm9wcy5mb3JtYXQ7XG4gICAgZGVsZXRlIHByb3BzLmNvbXBvbmVudDtcbiAgICBkZWxldGUgcHJvcHMudW5zYWZlO1xuXG4gICAgaWYgKHVuc2FmZSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBmb3JtYXQuc3BsaXQoUkVHRVhQKS5yZWR1Y2UoZnVuY3Rpb24obWVtbywgbWF0Y2gsIGluZGV4KSB7XG4gICAgICAgIHZhciBodG1sO1xuXG4gICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICBodG1sID0gbWF0Y2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaHRtbCA9IHByb3BzW21hdGNoXTtcbiAgICAgICAgICBkZWxldGUgcHJvcHNbbWF0Y2hdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoaHRtbCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBpbnRlcnBvbGF0ZSBhIFJlYWN0IGNvbXBvbmVudCBpbnRvIHVuc2FmZSB0ZXh0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBtZW1vICs9IGh0bWw7XG5cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICB9LCAnJyk7XG5cbiAgICAgIHByb3BzLmRhbmdlcm91c2x5U2V0SW5uZXJIVE1MID0geyBfX2h0bWw6IGNvbnRlbnQgfTtcblxuICAgICAgcmV0dXJuIHBhcmVudChwcm9wcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBhcmdzID0gZm9ybWF0LnNwbGl0KFJFR0VYUCkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIG1hdGNoLCBpbmRleCkge1xuICAgICAgICB2YXIgY2hpbGQ7XG5cbiAgICAgICAgaWYgKGluZGV4ICUgMiA9PT0gMCkge1xuICAgICAgICAgIGlmIChtYXRjaC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNoaWxkID0gbWF0Y2g7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2hpbGQgPSBwcm9wc1ttYXRjaF07XG4gICAgICAgICAgZGVsZXRlIHByb3BzW21hdGNoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lbW8ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICB9LCBbcHJvcHNdKTtcblxuICAgICAgcmV0dXJuIHBhcmVudC5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVycG9sYXRlO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG52YXIgSnVtYm90cm9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnSnVtYm90cm9uJyxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwianVtYm90cm9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEp1bWJvdHJvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBMYWJlbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xhYmVsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbGFiZWwnLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExhYmVsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIE1lbnVJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTWVudUl0ZW0nLFxuICBwcm9wVHlwZXM6IHtcbiAgICBoZWFkZXI6ICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGl2aWRlcjogIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6ICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRpdGxlOiAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5KTtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyQW5jaG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7b25DbGljazp0aGlzLmhhbmRsZUNsaWNrLCBocmVmOnRoaXMucHJvcHMuaHJlZiwgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSwgdGFiSW5kZXg6XCItMVwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24taGVhZGVyJzogdGhpcy5wcm9wcy5oZWFkZXIsXG4gICAgICAgICdkaXZpZGVyJzogdGhpcy5wcm9wcy5kaXZpZGVyXG4gICAgICB9O1xuXG4gICAgdmFyIGNoaWxkcmVuID0gbnVsbDtcbiAgICBpZiAodGhpcy5wcm9wcy5oZWFkZXIpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5wcm9wcy5jaGlsZHJlbjtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLnByb3BzLmRpdmlkZXIpIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5yZW5kZXJBbmNob3IoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtyb2xlOlwicHJlc2VudGF0aW9uXCIsIHRpdGxlOm51bGwsIGhyZWY6bnVsbCwgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudUl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEZhZGVNaXhpbiA9IHJlcXVpcmUoJy4vRmFkZU1peGluJyk7XG52YXIgRXZlbnRMaXN0ZW5lciA9IHJlcXVpcmUoJy4vdXRpbHMvRXZlbnRMaXN0ZW5lcicpO1xuXG5cbi8vIFRPRE86XG4vLyAtIGFyaWEtbGFiZWxsZWRieVxuLy8gLSBBZGQgYG1vZGFsLWJvZHlgIGRpdiBpZiBvbmx5IG9uZSBjaGlsZCBwYXNzZWQgaW4gdGhhdCBkb2Vzbid0IGFscmVhZHkgaGF2ZSBpdFxuLy8gLSBUZXN0c1xuXG52YXIgTW9kYWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdNb2RhbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBGYWRlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBiYWNrZHJvcDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnc3RhdGljJywgdHJ1ZSwgZmFsc2VdKSxcbiAgICBrZXlib2FyZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY2xvc2VCdXR0b246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFuaW1hdGlvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25SZXF1ZXN0SGlkZTogUmVhY3QuUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbW9kYWwnLFxuICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICBrZXlib2FyZDogdHJ1ZSxcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZSxcbiAgICAgIGNsb3NlQnV0dG9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbW9kYWxTdHlsZSA9IHtkaXNwbGF5OiAnYmxvY2snfTtcbiAgICB2YXIgZGlhbG9nQ2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGRlbGV0ZSBkaWFsb2dDbGFzc2VzLm1vZGFsO1xuICAgIGRpYWxvZ0NsYXNzZXNbJ21vZGFsLWRpYWxvZyddID0gdHJ1ZTtcblxuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgbW9kYWw6IHRydWUsXG4gICAgICBmYWRlOiB0aGlzLnByb3BzLmFuaW1hdGlvbixcbiAgICAgICdpbic6ICF0aGlzLnByb3BzLmFuaW1hdGlvbiB8fCAhZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbFxuICAgIH07XG5cbiAgICB2YXIgbW9kYWwgPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHt0aXRsZTpudWxsLFxuICAgICAgICB0YWJJbmRleDpcIi0xXCIsXG4gICAgICAgIHJvbGU6XCJkaWFsb2dcIixcbiAgICAgICAgc3R5bGU6bW9kYWxTdHlsZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICBvbkNsaWNrOnRoaXMucHJvcHMuYmFja2Ryb3AgPT09IHRydWUgPyB0aGlzLmhhbmRsZUJhY2tkcm9wQ2xpY2sgOiBudWxsLFxuICAgICAgICByZWY6XCJtb2RhbFwifSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoZGlhbG9nQ2xhc3Nlcyl9LCBcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtY29udGVudFwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLnRpdGxlID8gdGhpcy5yZW5kZXJIZWFkZXIoKSA6IG51bGwsXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLmJhY2tkcm9wID9cbiAgICAgIHRoaXMucmVuZGVyQmFja2Ryb3AobW9kYWwpIDogbW9kYWw7XG4gIH0sXG5cbiAgcmVuZGVyQmFja2Ryb3A6IGZ1bmN0aW9uIChtb2RhbCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ21vZGFsLWJhY2tkcm9wJzogdHJ1ZSxcbiAgICAgICdmYWRlJzogdGhpcy5wcm9wcy5hbmltYXRpb25cbiAgICB9O1xuXG4gICAgY2xhc3Nlc1snaW4nXSA9ICF0aGlzLnByb3BzLmFuaW1hdGlvbiB8fCAhZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDtcblxuICAgIHZhciBvbkNsaWNrID0gdGhpcy5wcm9wcy5iYWNrZHJvcCA9PT0gdHJ1ZSA/XG4gICAgICB0aGlzLmhhbmRsZUJhY2tkcm9wQ2xpY2sgOiBudWxsO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHJlZjpcImJhY2tkcm9wXCIsIG9uQ2xpY2s6b25DbGlja30gKSxcbiAgICAgICAgbW9kYWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbG9zZUJ1dHRvbjtcbiAgICBpZiAodGhpcy5wcm9wcy5jbG9zZUJ1dHRvbikge1xuICAgICAgY2xvc2VCdXR0b24gPSAoXG4gICAgICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJidXR0b25cIiwgY2xhc3NOYW1lOlwiY2xvc2VcIiwgJ2FyaWEtaGlkZGVuJzpcInRydWVcIiwgb25DbGljazp0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGV9LCBcIsOXXCIpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJtb2RhbC1oZWFkZXJcIn0sIFxuICAgICAgICBjbG9zZUJ1dHRvbixcbiAgICAgICAgdGhpcy5yZW5kZXJUaXRsZSgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJUaXRsZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMudGl0bGUpID9cbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA6IFJlYWN0LkRPTS5oNCgge2NsYXNzTmFtZTpcIm1vZGFsLXRpdGxlXCJ9LCB0aGlzLnByb3BzLnRpdGxlKVxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2tleXVwJywgdGhpcy5oYW5kbGVEb2N1bWVudEtleVVwKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyLnJlbW92ZSgpO1xuICB9LFxuXG4gIGhhbmRsZUJhY2tkcm9wQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGUoKTtcbiAgfSxcblxuICBoYW5kbGVEb2N1bWVudEtleVVwOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLmtleWJvYXJkICYmIGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIHRoaXMucHJvcHMub25SZXF1ZXN0SGlkZSgpO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kYWw7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgT3ZlcmxheU1peGluID0gcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG52YXIgTW9kYWxUcmlnZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTW9kYWxUcmlnZ2VyJyxcbiAgbWl4aW5zOiBbT3ZlcmxheU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBtb2RhbDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUuaXNSZXF1aXJlZFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBpc092ZXJsYXlTaG93bjogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0cnVlXG4gICAgfSk7XG4gIH0sXG5cbiAgaGlkZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgdG9nZ2xlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogIXRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd25cbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4obnVsbCApO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIHRoaXMucHJvcHMubW9kYWwsXG4gICAgICB7XG4gICAgICAgIG9uUmVxdWVzdEhpZGU6IHRoaXMuaGlkZVxuICAgICAgfVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkID0gUmVhY3QuQ2hpbGRyZW4ub25seSh0aGlzLnByb3BzLmNoaWxkcmVuKTtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgb25DbGljazogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uQ2xpY2ssIHRoaXMudG9nZ2xlKVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsVHJpZ2dlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHJlcXVpcmUoJy4vQ29sbGFwc2FibGVNaXhpbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGRvbVV0aWxzID0gcmVxdWlyZSgnLi91dGlscy9kb21VdGlscycpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG5cbnZhciBOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXYnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgQ29sbGFwc2FibGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndGFicycsJ3BpbGxzJ10pLFxuICAgIHN0YWNrZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGp1c3RpZmllZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGNvbGxhcHNhYmxlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBleHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmF2YmFyOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbmF2J1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMucmVmcy51bC5nZXRET01Ob2RlKCksXG4gICAgICAgIGhlaWdodCA9IG5vZGUub2Zmc2V0SGVpZ2h0LFxuICAgICAgICBjb21wdXRlZFN0eWxlcyA9IGRvbVV0aWxzLmdldENvbXB1dGVkU3R5bGVzKG5vZGUpO1xuXG4gICAgcmV0dXJuIGhlaWdodCArIHBhcnNlSW50KGNvbXB1dGVkU3R5bGVzLm1hcmdpblRvcCwgMTApICsgcGFyc2VJbnQoY29tcHV0ZWRTdHlsZXMubWFyZ2luQm90dG9tLCAxMCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLmNvbGxhcHNhYmxlID8gdGhpcy5nZXRDb2xsYXBzYWJsZUNsYXNzU2V0KCkgOiB7fTtcblxuICAgIGNsYXNzZXNbJ25hdmJhci1jb2xsYXBzZSddID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZTtcblxuICAgIGlmICh0aGlzLnByb3BzLm5hdmJhciAmJiAhdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKHRoaXMucmVuZGVyVWwoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLm5hdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnJlbmRlclVsKClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclVsOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIGNsYXNzZXNbJ25hdi1zdGFja2VkJ10gPSB0aGlzLnByb3BzLnN0YWNrZWQ7XG4gICAgY2xhc3Nlc1snbmF2LWp1c3RpZmllZCddID0gdGhpcy5wcm9wcy5qdXN0aWZpZWQ7XG4gICAgY2xhc3Nlc1snbmF2YmFyLW5hdiddID0gdGhpcy5wcm9wcy5uYXZiYXI7XG4gICAgY2xhc3Nlc1sncHVsbC1yaWdodCddID0gdGhpcy5wcm9wcy5wdWxsUmlnaHQ7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCByZWY6XCJ1bFwifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTmF2SXRlbSlcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldENoaWxkQWN0aXZlUHJvcDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMuaHJlZiA9PT0gdGhpcy5wcm9wcy5hY3RpdmVIcmVmKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjaGlsZC5wcm9wcy5hY3RpdmU7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIGFjdGl2ZTogdGhpcy5nZXRDaGlsZEFjdGl2ZVByb3AoY2hpbGQpLFxuICAgICAgICBhY3RpdmVLZXk6IHRoaXMucHJvcHMuYWN0aXZlS2V5LFxuICAgICAgICBhY3RpdmVIcmVmOiB0aGlzLnByb3BzLmFjdGl2ZUhyZWYsXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICAgIG5hdkl0ZW06IHRydWVcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXY7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBOYXZJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2SXRlbScsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaHJlZjogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2FjdGl2ZSc6IHRoaXMucHJvcHMuYWN0aXZlLFxuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZUNsaWNrLFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIXRoaXMucHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSx0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2SXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBOYXYgPSByZXF1aXJlKCcuL05hdicpO1xuXG5cbnZhciBOYXZiYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdOYXZiYXInLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgZml4ZWRUb3A6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGZpeGVkQm90dG9tOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBzdGF0aWNUb3A6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGludmVyc2U6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGZsdWlkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICByb2xlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3MsXG4gICAgYnJhbmQ6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIHRvZ2dsZUJ1dHRvbjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgb25Ub2dnbGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG5hdkV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBkZWZhdWx0TmF2RXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICduYXZiYXInLFxuICAgICAgYnNTdHlsZTogJ2RlZmF1bHQnLFxuICAgICAgcm9sZTogJ25hdmlnYXRpb24nLFxuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5uYXZcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBuYXZFeHBhbmRlZDogdGhpcy5wcm9wcy5kZWZhdWx0TmF2RXhwYW5kZWRcbiAgICB9O1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gRGVmZXIgYW55IHVwZGF0ZXMgdG8gdGhpcyBjb21wb25lbnQgZHVyaW5nIHRoZSBgb25TZWxlY3RgIGhhbmRsZXIuXG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGhhbmRsZVRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uVG9nZ2xlKSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25Ub2dnbGUoKTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIG5hdk9wZW46ICF0aGlzLnN0YXRlLm5hdk9wZW5cbiAgICB9KTtcbiAgfSxcblxuICBpc05hdk9wZW46IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy5uYXZPcGVuICE9IG51bGwgPyB0aGlzLnByb3BzLm5hdk9wZW4gOiB0aGlzLnN0YXRlLm5hdk9wZW47XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuXG4gICAgY2xhc3Nlc1snbmF2YmFyLWZpeGVkLXRvcCddID0gdGhpcy5wcm9wcy5maXhlZFRvcDtcbiAgICBjbGFzc2VzWyduYXZiYXItZml4ZWQtYm90dG9tJ10gPSB0aGlzLnByb3BzLmZpeGVkQm90dG9tO1xuICAgIGNsYXNzZXNbJ25hdmJhci1zdGF0aWMtdG9wJ10gPSB0aGlzLnByb3BzLnN0YXRpY1RvcDtcbiAgICBjbGFzc2VzWyduYXZiYXItaW52ZXJzZSddID0gdGhpcy5wcm9wcy5pbnZlcnNlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnByb3BzLmZsdWlkID8gJ2NvbnRhaW5lci1mbHVpZCcgOiAnY29udGFpbmVyJ30sIFxuICAgICAgICAgICh0aGlzLnByb3BzLmJyYW5kIHx8IHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIHx8IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5KSA/IHRoaXMucmVuZGVySGVhZGVyKCkgOiBudWxsLFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyQ2hpbGQpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckNoaWxkOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoY2hpbGQsIHtcbiAgICAgIG5hdmJhcjogdHJ1ZSxcbiAgICAgIGNvbGxhcHNhYmxlOiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSAhPSBudWxsICYmIHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ID09PSBjaGlsZC5wcm9wcy5rZXksXG4gICAgICBleHBhbmRlZDogdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCAmJiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSA9PT0gY2hpbGQucHJvcHMua2V5ICYmIHRoaXMuaXNOYXZPcGVuKCksXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVySGVhZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJyYW5kO1xuXG4gICAgaWYgKHRoaXMucHJvcHMuYnJhbmQpIHtcbiAgICAgIGJyYW5kID0gUmVhY3QuaXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmJyYW5kKSA/XG4gICAgICAgIGNsb25lV2l0aFByb3BzKHRoaXMucHJvcHMuYnJhbmQsIHtcbiAgICAgICAgICBjbGFzc05hbWU6ICduYXZiYXItYnJhbmQnXG4gICAgICAgIH0pIDogUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJuYXZiYXItYnJhbmRcIn0sIHRoaXMucHJvcHMuYnJhbmQpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibmF2YmFyLWhlYWRlclwifSwgXG4gICAgICAgIGJyYW5kLFxuICAgICAgICAodGhpcy5wcm9wcy50b2dnbGVCdXR0b24gfHwgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCkgPyB0aGlzLnJlbmRlclRvZ2dsZUJ1dHRvbigpIDogbnVsbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVG9nZ2xlQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNoaWxkcmVuO1xuXG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy50b2dnbGVCdXR0b24pKSB7XG4gICAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHModGhpcy5wcm9wcy50b2dnbGVCdXR0b24sIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnbmF2YmFyLXRvZ2dsZScsXG4gICAgICAgIG9uQ2xpY2s6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZVRvZ2dsZSwgdGhpcy5wcm9wcy50b2dnbGVCdXR0b24ucHJvcHMub25DbGljaylcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNoaWxkcmVuID0gKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uICE9IG51bGwpID9cbiAgICAgIHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIDogW1xuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcInNyLW9ubHlcIiwga2V5OjB9LCBcIlRvZ2dsZSBuYXZpZ2F0aW9uXCIpLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImljb24tYmFyXCIsIGtleToxfSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaWNvbi1iYXJcIiwga2V5OjJ9KSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpY29uLWJhclwiLCBrZXk6M30pXG4gICAgXTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYnV0dG9uKCB7Y2xhc3NOYW1lOlwibmF2YmFyLXRvZ2dsZVwiLCB0eXBlOlwiYnV0dG9uXCIsIG9uQ2xpY2s6dGhpcy5oYW5kbGVUb2dnbGV9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXZiYXI7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgY29udGFpbmVyOiBDdXN0b21Qcm9wVHlwZXMubW91bnRhYmxlXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbnRhaW5lcjogdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyA/IGRvY3VtZW50LmJvZHkgOiB7XG4gICAgICAgIC8vIElmIHdlIGFyZSBpbiBhbiBlbnZpcm9ubWVudCB0aGF0IGRvZXNudCBoYXZlIGBkb2N1bWVudGAgZGVmaW5lZCBpdCBzaG91bGQgYmVcbiAgICAgICAgLy8gc2FmZSB0byBhc3N1bWUgdGhhdCBgY29tcG9uZW50RGlkTW91bnRgIHdpbGwgbm90IHJ1biBhbmQgdGhpcyB3aWxsIGJlIG5lZWRlZCxcbiAgICAgICAgLy8ganVzdCBwcm92aWRlIGVub3VnaCBmYWtlIEFQSSB0byBwYXNzIHRoZSBwcm9wVHlwZSB2YWxpZGF0aW9uLlxuICAgICAgICBnZXRET01Ob2RlOiBmdW5jdGlvbiBub29wKCkge31cbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdW5yZW5kZXJPdmVybGF5KCk7XG4gICAgaWYgKHRoaXMuX292ZXJsYXlUYXJnZXQpIHtcbiAgICAgIHRoaXMuZ2V0Q29udGFpbmVyRE9NTm9kZSgpXG4gICAgICAgIC5yZW1vdmVDaGlsZCh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgICAgIHRoaXMuX292ZXJsYXlUYXJnZXQgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJPdmVybGF5KCk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJPdmVybGF5KCk7XG4gIH0sXG5cbiAgX21vdW50T3ZlcmxheVRhcmdldDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX292ZXJsYXlUYXJnZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKVxuICAgICAgLmFwcGVuZENoaWxkKHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICB9LFxuXG4gIF9yZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLl9vdmVybGF5VGFyZ2V0KSB7XG4gICAgICB0aGlzLl9tb3VudE92ZXJsYXlUYXJnZXQoKTtcbiAgICB9XG5cbiAgICAvLyBTYXZlIHJlZmVyZW5jZSB0byBoZWxwIHRlc3RpbmdcbiAgICB0aGlzLl9vdmVybGF5SW5zdGFuY2UgPSBSZWFjdC5yZW5kZXJDb21wb25lbnQodGhpcy5yZW5kZXJPdmVybGF5KCksIHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICB9LFxuXG4gIF91bnJlbmRlck92ZXJsYXk6IGZ1bmN0aW9uICgpIHtcbiAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuX292ZXJsYXlUYXJnZXQpO1xuICAgIHRoaXMuX292ZXJsYXlJbnN0YW5jZSA9IG51bGw7XG4gIH0sXG5cbiAgZ2V0T3ZlcmxheURPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignZ2V0T3ZlcmxheURPTU5vZGUoKTogQSBjb21wb25lbnQgbXVzdCBiZSBtb3VudGVkIHRvIGhhdmUgYSBET00gbm9kZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fb3ZlcmxheUluc3RhbmNlLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBnZXRDb250YWluZXJET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuY29udGFpbmVyLmdldERPTU5vZGUgP1xuICAgICAgdGhpcy5wcm9wcy5jb250YWluZXIuZ2V0RE9NTm9kZSgpIDogdGhpcy5wcm9wcy5jb250YWluZXI7XG4gIH1cbn07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgT3ZlcmxheU1peGluID0gcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZScpO1xuXG4vKipcbiAqIENoZWNrIGlmIHZhbHVlIG9uZSBpcyBpbnNpZGUgb3IgZXF1YWwgdG8gdGhlIG9mIHZhbHVlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG9uZVxuICogQHBhcmFtIHtzdHJpbmd8YXJyYXl9IG9mXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNPbmVPZihvbmUsIG9mKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG9mKSkge1xuICAgIHJldHVybiBvZi5pbmRleE9mKG9uZSkgPj0gMDtcbiAgfVxuICByZXR1cm4gb25lID09PSBvZjtcbn1cblxudmFyIE92ZXJsYXlUcmlnZ2VyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnT3ZlcmxheVRyaWdnZXInLFxuICBtaXhpbnM6IFtPdmVybGF5TWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHRyaWdnZXI6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnbWFudWFsJywgJ2NsaWNrJywgJ2hvdmVyJywgJ2ZvY3VzJ10pLFxuICAgICAgUmVhY3QuUHJvcFR5cGVzLmFycmF5T2YoUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsnY2xpY2snLCAnaG92ZXInLCAnZm9jdXMnXSkpXG4gICAgXSksXG4gICAgcGxhY2VtZW50OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0b3AnLCdyaWdodCcsICdib3R0b20nLCAnbGVmdCddKSxcbiAgICBkZWxheTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWxheVNob3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVsYXlIaWRlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlZmF1bHRPdmVybGF5U2hvd246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG92ZXJsYXk6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnLFxuICAgICAgdHJpZ2dlcjogWydob3ZlcicsICdmb2N1cyddXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNPdmVybGF5U2hvd246IHRoaXMucHJvcHMuZGVmYXVsdE92ZXJsYXlTaG93biA9PSBudWxsID9cbiAgICAgICAgZmFsc2UgOiB0aGlzLnByb3BzLmRlZmF1bHRPdmVybGF5U2hvd24sXG4gICAgICBvdmVybGF5TGVmdDogbnVsbCxcbiAgICAgIG92ZXJsYXlUb3A6IG51bGxcbiAgICB9O1xuICB9LFxuXG4gIHNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0cnVlXG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnVwZGF0ZU92ZXJsYXlQb3NpdGlvbigpO1xuICAgIH0pO1xuICB9LFxuXG4gIGhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiBmYWxzZVxuICAgIH0pO1xuICB9LFxuXG4gIHRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RhdGUuaXNPdmVybGF5U2hvd24gP1xuICAgICAgdGhpcy5oaWRlKCkgOiB0aGlzLnNob3coKTtcbiAgfSxcblxuICByZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duKSB7XG4gICAgICByZXR1cm4gUmVhY3QuRE9NLnNwYW4obnVsbCApO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIHRoaXMucHJvcHMub3ZlcmxheSxcbiAgICAgIHtcbiAgICAgICAgb25SZXF1ZXN0SGlkZTogdGhpcy5oaWRlLFxuICAgICAgICBwbGFjZW1lbnQ6IHRoaXMucHJvcHMucGxhY2VtZW50LFxuICAgICAgICBwb3NpdGlvbkxlZnQ6IHRoaXMuc3RhdGUub3ZlcmxheUxlZnQsXG4gICAgICAgIHBvc2l0aW9uVG9wOiB0aGlzLnN0YXRlLm92ZXJsYXlUb3BcbiAgICAgIH1cbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBwcm9wcyA9IHt9O1xuXG4gICAgaWYgKGlzT25lT2YoJ2NsaWNrJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25DbGljayA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLnRvZ2dsZSwgdGhpcy5wcm9wcy5vbkNsaWNrKTtcbiAgICB9XG5cbiAgICBpZiAoaXNPbmVPZignaG92ZXInLCB0aGlzLnByb3BzLnRyaWdnZXIpKSB7XG4gICAgICBwcm9wcy5vbk1vdXNlT3ZlciA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRTaG93LCB0aGlzLnByb3BzLm9uTW91c2VPdmVyKTtcbiAgICAgIHByb3BzLm9uTW91c2VPdXQgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkSGlkZSwgdGhpcy5wcm9wcy5vbk1vdXNlT3V0KTtcbiAgICB9XG5cbiAgICBpZiAoaXNPbmVPZignZm9jdXMnLCB0aGlzLnByb3BzLnRyaWdnZXIpKSB7XG4gICAgICBwcm9wcy5vbkZvY3VzID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZFNob3csIHRoaXMucHJvcHMub25Gb2N1cyk7XG4gICAgICBwcm9wcy5vbkJsdXIgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkSGlkZSwgdGhpcy5wcm9wcy5vbkJsdXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbiksXG4gICAgICBwcm9wc1xuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgfSxcblxuICBoYW5kbGVEZWxheWVkU2hvdzogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ob3ZlckRlbGF5ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkZWxheSA9IHRoaXMucHJvcHMuZGVsYXlTaG93ICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWxheVNob3cgOiB0aGlzLnByb3BzLmRlbGF5O1xuXG4gICAgaWYgKCFkZWxheSkge1xuICAgICAgdGhpcy5zaG93KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faG92ZXJEZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHRoaXMuc2hvdygpO1xuICAgIH0uYmluZCh0aGlzKSwgZGVsYXkpO1xuICB9LFxuXG4gIGhhbmRsZURlbGF5ZWRIaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2hvdmVyRGVsYXkgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2hvdmVyRGVsYXkpO1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGRlbGF5ID0gdGhpcy5wcm9wcy5kZWxheUhpZGUgIT0gbnVsbCA/XG4gICAgICB0aGlzLnByb3BzLmRlbGF5SGlkZSA6IHRoaXMucHJvcHMuZGVsYXk7XG5cbiAgICBpZiAoIWRlbGF5KSB7XG4gICAgICB0aGlzLmhpZGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9ob3ZlckRlbGF5ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfS5iaW5kKHRoaXMpLCBkZWxheSk7XG4gIH0sXG5cbiAgdXBkYXRlT3ZlcmxheVBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHBvcyA9IHRoaXMuY2FsY092ZXJsYXlQb3NpdGlvbigpO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBvdmVybGF5TGVmdDogcG9zLmxlZnQsXG4gICAgICBvdmVybGF5VG9wOiBwb3MudG9wXG4gICAgfSk7XG4gIH0sXG5cbiAgY2FsY092ZXJsYXlQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZE9mZnNldCA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcblxuICAgIHZhciBvdmVybGF5Tm9kZSA9IHRoaXMuZ2V0T3ZlcmxheURPTU5vZGUoKTtcbiAgICB2YXIgb3ZlcmxheUhlaWdodCA9IG92ZXJsYXlOb2RlLm9mZnNldEhlaWdodDtcbiAgICB2YXIgb3ZlcmxheVdpZHRoID0gb3ZlcmxheU5vZGUub2Zmc2V0V2lkdGg7XG5cbiAgICBzd2l0Y2ggKHRoaXMucHJvcHMucGxhY2VtZW50KSB7XG4gICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQgLyAyIC0gb3ZlcmxheUhlaWdodCAvIDIsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoXG4gICAgICAgIH07XG4gICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCArIGNoaWxkT2Zmc2V0LmhlaWdodCAvIDIgLSBvdmVybGF5SGVpZ2h0IC8gMixcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0IC0gb3ZlcmxheVdpZHRoXG4gICAgICAgIH07XG4gICAgICBjYXNlICd0b3AnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wIC0gb3ZlcmxheUhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0ICsgY2hpbGRPZmZzZXQud2lkdGggLyAyIC0gb3ZlcmxheVdpZHRoIC8gMlxuICAgICAgICB9O1xuICAgICAgY2FzZSAnYm90dG9tJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCArIGNoaWxkT2Zmc2V0LmhlaWdodCxcbiAgICAgICAgICBsZWZ0OiBjaGlsZE9mZnNldC5sZWZ0ICsgY2hpbGRPZmZzZXQud2lkdGggLyAyIC0gb3ZlcmxheVdpZHRoIC8gMlxuICAgICAgICB9O1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxjT3ZlcmxheVBvc2l0aW9uKCk6IE5vIHN1Y2ggcGxhY2VtZW50IG9mIFwiJyArIHRoaXMucHJvcHMucGxhY2VtZW50ICsgJ1wiIGZvdW5kLicpO1xuICAgIH1cbiAgfSxcblxuICBnZXRQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuZ2V0Q29udGFpbmVyRE9NTm9kZSgpO1xuXG4gICAgdmFyIG9mZnNldCA9IGNvbnRhaW5lci50YWdOYW1lID09ICdCT0RZJyA/XG4gICAgICBkb21VdGlscy5nZXRPZmZzZXQobm9kZSkgOiBkb21VdGlscy5nZXRQb3NpdGlvbihub2RlLCBjb250YWluZXIpO1xuXG4gICAgcmV0dXJuIG1lcmdlKG9mZnNldCwge1xuICAgICAgaGVpZ2h0OiBub2RlLm9mZnNldEhlaWdodCxcbiAgICAgIHdpZHRoOiBub2RlLm9mZnNldFdpZHRoXG4gICAgfSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJsYXlUcmlnZ2VyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxudmFyIFBhZ2VIZWFkZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYWdlSGVhZGVyJyxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFnZS1oZWFkZXJcIn0sIFxuICAgICAgICBSZWFjdC5ET00uaDEobnVsbCwgdGhpcy5wcm9wcy5jaGlsZHJlbilcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlSGVhZGVyOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIFBhZ2VJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFnZUl0ZW0nLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBwcmV2aW91czogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgbmV4dDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhyZWY6ICcjJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkLFxuICAgICAgJ3ByZXZpb3VzJzogdGhpcy5wcm9wcy5wcmV2aW91cyxcbiAgICAgICduZXh0JzogdGhpcy5wcm9wcy5uZXh0XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saShcbiAgICAgICAge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uYShcbiAgICAgICAgICB7aHJlZjp0aGlzLnByb3BzLmhyZWYsXG4gICAgICAgICAgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSxcbiAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0LFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKCF0aGlzLnByb3BzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXksIHRoaXMucHJvcHMuaHJlZik7XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlSXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG5cbnZhciBQYWdlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhZ2VyJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00udWwoXG4gICAgICAgIHtjbGFzc05hbWU6XCJwYWdlclwifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFnZUl0ZW0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQYWdlSXRlbTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYWdlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHJlcXVpcmUoJy4vQ29sbGFwc2FibGVNaXhpbicpO1xuXG52YXIgUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYW5lbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBDb2xsYXBzYWJsZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBoZWFkZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGZvb3RlcjogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgb25DbGljazogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3BhbmVsJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0J1xuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXkpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZXhwYW5kZWQ6ICF0aGlzLnN0YXRlLmV4cGFuZGVkXG4gICAgfSk7XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWZzLmJvZHkuZ2V0RE9NTm9kZSgpLm9mZnNldEhlaWdodDtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURPTU5vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkgfHwgIXRoaXMucmVmcyB8fCAhdGhpcy5yZWZzLnBhbmVsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZWZzLnBhbmVsLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuICAgIGNsYXNzZXNbJ3BhbmVsJ10gPSB0cnVlO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgaWQ6dGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IG51bGwgOiB0aGlzLnByb3BzLmlkfSwgXG4gICAgICAgIHRoaXMucmVuZGVySGVhZGluZygpLFxuICAgICAgICB0aGlzLnByb3BzLmNvbGxhcHNhYmxlID8gdGhpcy5yZW5kZXJDb2xsYXBzYWJsZUJvZHkoKSA6IHRoaXMucmVuZGVyQm9keSgpLFxuICAgICAgICB0aGlzLnJlbmRlckZvb3RlcigpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb2xsYXBzYWJsZUJvZHk6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldCh0aGlzLmdldENvbGxhcHNhYmxlQ2xhc3NTZXQoJ3BhbmVsLWNvbGxhcHNlJykpLCBpZDp0aGlzLnByb3BzLmlkLCByZWY6XCJwYW5lbFwifSwgXG4gICAgICAgIHRoaXMucmVuZGVyQm9keSgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJCb2R5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1ib2R5XCIsIHJlZjpcImJvZHlcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJIZWFkaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGhlYWRlciA9IHRoaXMucHJvcHMuaGVhZGVyO1xuXG4gICAgaWYgKCFoZWFkZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghUmVhY3QuaXNWYWxpZENvbXBvbmVudChoZWFkZXIpIHx8IEFycmF5LmlzQXJyYXkoaGVhZGVyKSkge1xuICAgICAgaGVhZGVyID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/XG4gICAgICAgIHRoaXMucmVuZGVyQ29sbGFwc2FibGVUaXRsZShoZWFkZXIpIDogaGVhZGVyO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5jb2xsYXBzYWJsZSkge1xuICAgICAgaGVhZGVyID0gY2xvbmVXaXRoUHJvcHMoaGVhZGVyLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhbmVsLXRpdGxlJyxcbiAgICAgICAgY2hpbGRyZW46IHRoaXMucmVuZGVyQW5jaG9yKGhlYWRlci5wcm9wcy5jaGlsZHJlbilcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkZXIgPSBjbG9uZVdpdGhQcm9wcyhoZWFkZXIsIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncGFuZWwtdGl0bGUnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhbmVsLWhlYWRpbmdcIn0sIFxuICAgICAgICBoZWFkZXJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYShcbiAgICAgICAge2hyZWY6JyMnICsgKHRoaXMucHJvcHMuaWQgfHwgJycpLFxuICAgICAgICBjbGFzc05hbWU6dGhpcy5pc0V4cGFuZGVkKCkgPyBudWxsIDogJ2NvbGxhcHNlZCcsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVTZWxlY3R9LCBcbiAgICAgICAgaGVhZGVyXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDb2xsYXBzYWJsZVRpdGxlOiBmdW5jdGlvbiAoaGVhZGVyKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5oNCgge2NsYXNzTmFtZTpcInBhbmVsLXRpdGxlXCJ9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJBbmNob3IoaGVhZGVyKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyRm9vdGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLnByb3BzLmZvb3Rlcikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1mb290ZXJcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmZvb3RlclxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBQYW5lbEdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFuZWxHcm91cCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYWN0aXZlS2V5OiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxuICAgIGRlZmF1bHRBY3RpdmVLZXk6IFJlYWN0LlByb3BUeXBlcy5hbnksXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwYW5lbC1ncm91cCdcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWZhdWx0QWN0aXZlS2V5ID0gdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZUtleTogZGVmYXVsdEFjdGl2ZUtleVxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldCh0aGlzLmdldEJzQ2xhc3NTZXQoKSl9LCBcbiAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJQYW5lbClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclBhbmVsOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID1cbiAgICAgIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuXG4gICAgdmFyIHByb3BzID0ge1xuICAgICAgYnNTdHlsZTogY2hpbGQucHJvcHMuYnNTdHlsZSB8fCB0aGlzLnByb3BzLmJzU3R5bGUsXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfTtcblxuICAgIGlmICh0aGlzLnByb3BzLmFjY29yZGlvbikge1xuICAgICAgcHJvcHMuY29sbGFwc2FibGUgPSB0cnVlO1xuICAgICAgcHJvcHMuZXhwYW5kZWQgPSAoY2hpbGQucHJvcHMua2V5ID09PSBhY3RpdmVLZXkpO1xuICAgICAgcHJvcHMub25TZWxlY3QgPSB0aGlzLmhhbmRsZVNlbGVjdDtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHByb3BzXG4gICAgKTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUuYWN0aXZlS2V5ID09PSBrZXkpIHtcbiAgICAgIGtleSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhY3RpdmVLZXk6IGtleVxuICAgIH0pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbEdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgUG9wb3ZlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BvcG92ZXInLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcGxhY2VtZW50OiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0b3AnLCdyaWdodCcsICdib3R0b20nLCAnbGVmdCddKSxcbiAgICBwb3NpdGlvbkxlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgcG9zaXRpb25Ub3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRMZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0VG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG4gICAgY2xhc3Nlc1sncG9wb3ZlciddID0gdHJ1ZTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMucGxhY2VtZW50XSA9IHRydWU7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0ICE9IG51bGwgfHwgdGhpcy5wcm9wcy5wb3NpdGlvblRvcCAhPSBudWxsO1xuXG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgc3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0O1xuICAgIHN0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMucG9zaXRpb25Ub3A7XG4gICAgc3R5bGVbJ2Rpc3BsYXknXSA9ICdibG9jayc7XG5cbiAgICB2YXIgYXJyb3dTdHlsZSA9IHt9O1xuICAgIGFycm93U3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRMZWZ0O1xuICAgIGFycm93U3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldFRvcDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBzdHlsZTpzdHlsZX0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiYXJyb3dcIiwgc3R5bGU6YXJyb3dTdHlsZX0gKSxcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA/IHRoaXMucmVuZGVyVGl0bGUoKSA6IG51bGwsXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwb3BvdmVyLWNvbnRlbnRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJUaXRsZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5oMygge2NsYXNzTmFtZTpcInBvcG92ZXItdGl0bGVcIn0sIHRoaXMucHJvcHMudGl0bGUpXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUG9wb3ZlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgSW50ZXJwb2xhdGUgPSByZXF1aXJlKCcuL0ludGVycG9sYXRlJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG5cbnZhciBQcm9ncmVzc0JhciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Byb2dyZXNzQmFyJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgbWluOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG5vdzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtYXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGFiZWw6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIHNyT25seTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgc3RyaXBlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYWN0aXZlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3Byb2dyZXNzLWJhcicsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDEwMFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0UGVyY2VudGFnZTogZnVuY3Rpb24gKG5vdywgbWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKChub3cgLSBtaW4pIC8gKG1heCAtIG1pbikgKiAxMDApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICBwcm9ncmVzczogdHJ1ZVxuICAgICAgfTtcblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSkge1xuICAgICAgY2xhc3Nlc1sncHJvZ3Jlc3Mtc3RyaXBlZCddID0gdHJ1ZTtcbiAgICAgIGNsYXNzZXNbJ2FjdGl2ZSddID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuc3RyaXBlZCkge1xuICAgICAgY2xhc3Nlc1sncHJvZ3Jlc3Mtc3RyaXBlZCddID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIVZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uaGFzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5jaGlsZHJlbikpIHtcbiAgICAgIGlmICghdGhpcy5wcm9wcy5pc0NoaWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgICAgICB0aGlzLnJlbmRlclByb2dyZXNzQmFyKClcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgICAgdGhpcy5yZW5kZXJQcm9ncmVzc0JhcigpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyQ2hpbGRCYXIpXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlckNoaWxkQmFyOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoY2hpbGQsIHtcbiAgICAgIGlzQ2hpbGQ6IHRydWUsXG4gICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyUHJvZ3Jlc3NCYXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcGVyY2VudGFnZSA9IHRoaXMuZ2V0UGVyY2VudGFnZShcbiAgICAgICAgdGhpcy5wcm9wcy5ub3csXG4gICAgICAgIHRoaXMucHJvcHMubWluLFxuICAgICAgICB0aGlzLnByb3BzLm1heFxuICAgICAgKTtcblxuICAgIHZhciBsYWJlbDtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5wcm9wcy5sYWJlbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgbGFiZWwgPSB0aGlzLnJlbmRlckxhYmVsKHBlcmNlbnRhZ2UpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5wcm9wcy5sYWJlbCkge1xuICAgICAgbGFiZWwgPSB0aGlzLnByb3BzLmxhYmVsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLnNyT25seSkge1xuICAgICAgbGFiZWwgPSB0aGlzLnJlbmRlclNjcmVlblJlYWRlck9ubHlMYWJlbChsYWJlbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRCc0NsYXNzU2V0KCkpLCByb2xlOlwicHJvZ3Jlc3NiYXJcIixcbiAgICAgICAgc3R5bGU6e3dpZHRoOiBwZXJjZW50YWdlICsgJyUnfSxcbiAgICAgICAgJ2FyaWEtdmFsdWVub3cnOnRoaXMucHJvcHMubm93LFxuICAgICAgICAnYXJpYS12YWx1ZW1pbic6dGhpcy5wcm9wcy5taW4sXG4gICAgICAgICdhcmlhLXZhbHVlbWF4Jzp0aGlzLnByb3BzLm1heH0sIFxuICAgICAgICBsYWJlbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTGFiZWw6IGZ1bmN0aW9uIChwZXJjZW50YWdlKSB7XG4gICAgdmFyIEludGVycG9sYXRlQ2xhc3MgPSB0aGlzLnByb3BzLmludGVycG9sYXRlQ2xhc3MgfHwgSW50ZXJwb2xhdGU7XG5cbiAgICByZXR1cm4gKFxuICAgICAgSW50ZXJwb2xhdGVDbGFzcyhcbiAgICAgICAge25vdzp0aGlzLnByb3BzLm5vdyxcbiAgICAgICAgbWluOnRoaXMucHJvcHMubWluLFxuICAgICAgICBtYXg6dGhpcy5wcm9wcy5tYXgsXG4gICAgICAgIHBlcmNlbnQ6cGVyY2VudGFnZSxcbiAgICAgICAgYnNTdHlsZTp0aGlzLnByb3BzLmJzU3R5bGV9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5sYWJlbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyU2NyZWVuUmVhZGVyT25seUxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzci1vbmx5XCJ9LCBcbiAgICAgICAgbGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmVzc0JhcjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBDdXN0b21Qcm9wVHlwZXMgPSByZXF1aXJlKCcuL3V0aWxzL0N1c3RvbVByb3BUeXBlcycpO1xuXG5cbnZhciBSb3cgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdSb3cnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00uZGl2XG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY29tcG9uZW50Q2xhc3MgPSB0aGlzLnByb3BzLmNvbXBvbmVudENsYXNzO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgY29tcG9uZW50Q2xhc3MoIHtjbGFzc05hbWU6XCJyb3dcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm93OyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBEcm9wZG93blN0YXRlTWl4aW4gPSByZXF1aXJlKCcuL0Ryb3Bkb3duU3RhdGVNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG52YXIgQnV0dG9uR3JvdXAgPSByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyk7XG52YXIgRHJvcGRvd25NZW51ID0gcmVxdWlyZSgnLi9Ecm9wZG93bk1lbnUnKTtcblxudmFyIFNwbGl0QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU3BsaXRCdXR0b24nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgRHJvcGRvd25TdGF0ZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6ICAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB0aXRsZTogICAgICAgICBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBocmVmOiAgICAgICAgICBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIGRyb3Bkb3duVGl0bGU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uQ2xpY2s6ICAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG9uU2VsZWN0OiAgICAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGRpc2FibGVkOiAgICAgIFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRyb3Bkb3duVGl0bGU6ICdUb2dnbGUgZHJvcGRvd24nXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZ3JvdXBDbGFzc2VzID0ge1xuICAgICAgICAnb3Blbic6IHRoaXMuc3RhdGUub3BlbixcbiAgICAgICAgJ2Ryb3B1cCc6IHRoaXMucHJvcHMuZHJvcHVwXG4gICAgICB9O1xuXG4gICAgdmFyIGJ1dHRvbiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgQnV0dG9uKFxuICAgICAgICB7cmVmOlwiYnV0dG9uXCIsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVCdXR0b25DbGljayxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgaWQ6bnVsbH0sIFxuICAgICAgICB0aGlzLnByb3BzLnRpdGxlXG4gICAgICApXG4gICAgKTtcblxuICAgIHZhciBkcm9wZG93bkJ1dHRvbiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgQnV0dG9uKFxuICAgICAgICB7cmVmOlwiZHJvcGRvd25CdXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOlwiZHJvcGRvd24tdG9nZ2xlXCIsXG4gICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVEcm9wZG93bkNsaWNrLFxuICAgICAgICB0aXRsZTpudWxsLFxuICAgICAgICBpZDpudWxsfSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3Itb25seVwifSwgdGhpcy5wcm9wcy5kcm9wZG93blRpdGxlKSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJjYXJldFwifSApXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiAoXG4gICAgICBCdXR0b25Hcm91cChcbiAgICAgICAge2JzU2l6ZTp0aGlzLnByb3BzLmJzU2l6ZSxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGdyb3VwQ2xhc3NlcyksXG4gICAgICAgIGlkOnRoaXMucHJvcHMuaWR9LCBcbiAgICAgICAgYnV0dG9uLFxuICAgICAgICBkcm9wZG93bkJ1dHRvbixcbiAgICAgICAgRHJvcGRvd25NZW51KFxuICAgICAgICAgIHtyZWY6XCJtZW51XCIsXG4gICAgICAgICAgb25TZWxlY3Q6dGhpcy5oYW5kbGVPcHRpb25TZWxlY3QsXG4gICAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6dGhpcy5wcm9wcy5pZCxcbiAgICAgICAgICBwdWxsUmlnaHQ6dGhpcy5wcm9wcy5wdWxsUmlnaHR9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGhhbmRsZUJ1dHRvbkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnN0YXRlLm9wZW4pIHtcbiAgICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMub25DbGljaykge1xuICAgICAgdGhpcy5wcm9wcy5vbkNsaWNrKGUpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVEcm9wZG93bkNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZSghdGhpcy5zdGF0ZS5vcGVuKTtcbiAgfSxcblxuICBoYW5kbGVPcHRpb25TZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGl0QnV0dG9uO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBTdWJOYXYgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdTdWJOYXYnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGV4dDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ25hdidcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZUNsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5wcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5LCB0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBpc0FjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmlzQ2hpbGRBY3RpdmUodGhpcyk7XG4gIH0sXG5cbiAgaXNDaGlsZEFjdGl2ZTogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgJiYgdGhpcy5wcm9wcy5hY3RpdmVLZXkgPT09IGNoaWxkLnByb3BzLmtleSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsICYmIHRoaXMucHJvcHMuYWN0aXZlSHJlZiA9PT0gY2hpbGQucHJvcHMuaHJlZikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkLnByb3BzLmNoaWxkcmVuKSB7XG4gICAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5mb3JFYWNoKFxuICAgICAgICBjaGlsZC5wcm9wcy5jaGlsZHJlbixcbiAgICAgICAgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgaWYgKHRoaXMuaXNDaGlsZEFjdGl2ZShjaGlsZCkpIHtcbiAgICAgICAgICAgIGlzQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRoaXNcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiBpc0FjdGl2ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgZ2V0Q2hpbGRBY3RpdmVQcm9wOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoY2hpbGQucHJvcHMuYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5rZXkgPT09IHRoaXMucHJvcHMuYWN0aXZlS2V5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVIcmVmICE9IG51bGwpIHtcbiAgICAgIGlmIChjaGlsZC5wcm9wcy5ocmVmID09PSB0aGlzLnByb3BzLmFjdGl2ZUhyZWYpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkLnByb3BzLmFjdGl2ZTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdhY3RpdmUnOiB0aGlzLmlzQWN0aXZlKCksXG4gICAgICAnZGlzYWJsZWQnOiB0aGlzLnByb3BzLmRpc2FibGVkXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5saSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBSZWFjdC5ET00uYShcbiAgICAgICAgICB7aHJlZjp0aGlzLnByb3BzLmhyZWYsXG4gICAgICAgICAgdGl0bGU6dGhpcy5wcm9wcy50aXRsZSxcbiAgICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlQ2xpY2ssXG4gICAgICAgICAgcmVmOlwiYW5jaG9yXCJ9LCBcbiAgICAgICAgICB0aGlzLnByb3BzLnRleHRcbiAgICAgICAgKSxcbiAgICAgICAgUmVhY3QuRE9NLnVsKCB7Y2xhc3NOYW1lOlwibmF2XCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck5hdkl0ZW0pXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBhY3RpdmU6IHRoaXMuZ2V0Q2hpbGRBY3RpdmVQcm9wKGNoaWxkKSxcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG4gICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleVxuICAgICAgfVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1Yk5hdjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBUcmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnLi91dGlscy9UcmFuc2l0aW9uRXZlbnRzJyk7XG5cbnZhciBUYWJQYW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFiUGFuZScsXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbmltYXRpb246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhbmltYXRlSW46IGZhbHNlLFxuICAgICAgYW5pbWF0ZU91dDogZmFsc2VcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHM6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5hbmltYXRpb24pIHtcbiAgICAgIGlmICghdGhpcy5zdGF0ZS5hbmltYXRlSW4gJiYgbmV4dFByb3BzLmFjdGl2ZSAmJiAhdGhpcy5wcm9wcy5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgYW5pbWF0ZUluOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5zdGF0ZS5hbmltYXRlT3V0ICYmICFuZXh0UHJvcHMuYWN0aXZlICYmIHRoaXMucHJvcHMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGFuaW1hdGVPdXQ6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmFuaW1hdGVJbikge1xuICAgICAgc2V0VGltZW91dCh0aGlzLnN0YXJ0QW5pbWF0ZUluLCAwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc3RhdGUuYW5pbWF0ZU91dCkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdldERPTU5vZGUoKSxcbiAgICAgICAgdGhpcy5zdG9wQW5pbWF0ZU91dFxuICAgICAgKTtcbiAgICB9XG4gIH0sXG5cbiAgc3RhcnRBbmltYXRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFuaW1hdGVJbjogZmFsc2VcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBzdG9wQW5pbWF0ZU91dDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYW5pbWF0ZU91dDogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25BbmltYXRlT3V0RW5kKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ3RhYi1wYW5lJzogdHJ1ZSxcbiAgICAgICdmYWRlJzogdHJ1ZSxcbiAgICAgICdhY3RpdmUnOiB0aGlzLnByb3BzLmFjdGl2ZSB8fCB0aGlzLnN0YXRlLmFuaW1hdGVPdXQsXG4gICAgICAnaW4nOiB0aGlzLnByb3BzLmFjdGl2ZSAmJiAhdGhpcy5zdGF0ZS5hbmltYXRlSW5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFiUGFuZTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIE5hdiA9IHJlcXVpcmUoJy4vTmF2Jyk7XG52YXIgTmF2SXRlbSA9IHJlcXVpcmUoJy4vTmF2SXRlbScpO1xuXG5mdW5jdGlvbiBnZXREZWZhdWx0QWN0aXZlS2V5RnJvbUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gIHZhciBkZWZhdWx0QWN0aXZlS2V5O1xuXG4gIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpIHtcbiAgICBpZiAoZGVmYXVsdEFjdGl2ZUtleSA9PSBudWxsKSB7XG4gICAgICBkZWZhdWx0QWN0aXZlS2V5ID0gY2hpbGQucHJvcHMua2V5O1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGRlZmF1bHRBY3RpdmVLZXk7XG59XG5cbnZhciBUYWJiZWRBcmVhID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFiYmVkQXJlYScsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWyd0YWJzJywncGlsbHMnXSksXG4gICAgYW5pbWF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNTdHlsZTogXCJ0YWJzXCIsXG4gICAgICBhbmltYXRpb246IHRydWVcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBkZWZhdWx0QWN0aXZlS2V5ID0gdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5ICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlS2V5IDogZ2V0RGVmYXVsdEFjdGl2ZUtleUZyb21DaGlsZHJlbih0aGlzLnByb3BzLmNoaWxkcmVuKTtcblxuICAgIC8vIFRPRE86IEluIF9fREVWX18gbW9kZSB3YXJuIHZpYSBgY29uc29sZS53YXJuYCBpZiBubyBgZGVmYXVsdEFjdGl2ZUtleWAgaGFzXG4gICAgLy8gYmVlbiBzZXQgYnkgdGhpcyBwb2ludCwgaW52YWxpZCBjaGlsZHJlbiBvciBtaXNzaW5nIGtleSBwcm9wZXJ0aWVzIGFyZSBsaWtlbHkgdGhlIGNhdXNlLlxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFjdGl2ZUtleTogZGVmYXVsdEFjdGl2ZUtleSxcbiAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKG5leHRQcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCAmJiBuZXh0UHJvcHMuYWN0aXZlS2V5ICE9PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIHByZXZpb3VzQWN0aXZlS2V5OiB0aGlzLnByb3BzLmFjdGl2ZUtleVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZVBhbmVBbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwcmV2aW91c0FjdGl2ZUtleTogbnVsbFxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBhY3RpdmVLZXkgPVxuICAgICAgdGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlS2V5IDogdGhpcy5zdGF0ZS5hY3RpdmVLZXk7XG5cbiAgICBmdW5jdGlvbiByZW5kZXJUYWJJZlNldChjaGlsZCkge1xuICAgICAgcmV0dXJuIGNoaWxkLnByb3BzLnRhYiAhPSBudWxsID8gdGhpcy5yZW5kZXJUYWIoY2hpbGQpIDogbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbmF2ID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBOYXYoIHthY3RpdmVLZXk6YWN0aXZlS2V5LCBvblNlbGVjdDp0aGlzLmhhbmRsZVNlbGVjdCwgcmVmOlwidGFic1wifSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHJlbmRlclRhYklmU2V0LCB0aGlzKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdihudWxsLCBcbiAgICAgICAgbmF2LFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7aWQ6dGhpcy5wcm9wcy5pZCwgY2xhc3NOYW1lOlwidGFiLWNvbnRlbnRcIiwgcmVmOlwicGFuZXNcIn0sIFxuICAgICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFuZSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgZ2V0QWN0aXZlS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuICB9LFxuXG4gIHJlbmRlclBhbmU6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHZhciBhY3RpdmVLZXkgPSB0aGlzLmdldEFjdGl2ZUtleSgpO1xuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgICBjaGlsZCxcbiAgICAgICAge1xuICAgICAgICAgIGFjdGl2ZTogKGNoaWxkLnByb3BzLmtleSA9PT0gYWN0aXZlS2V5ICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUtleSA9PSBudWxsIHx8ICF0aGlzLnByb3BzLmFuaW1hdGlvbikpLFxuICAgICAgICAgIHJlZjogY2hpbGQucHJvcHMucmVmLFxuICAgICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICAgIGFuaW1hdGlvbjogdGhpcy5wcm9wcy5hbmltYXRpb24sXG4gICAgICAgICAgb25BbmltYXRlT3V0RW5kOiAodGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUtleSAhPSBudWxsICYmXG4gICAgICAgICAgICBjaGlsZC5wcm9wcy5rZXkgPT09IHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkpID8gdGhpcy5oYW5kbGVQYW5lQW5pbWF0ZU91dEVuZDogbnVsbFxuICAgICAgICB9XG4gICAgICApO1xuICB9LFxuXG4gIHJlbmRlclRhYjogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIGtleSA9IGNoaWxkLnByb3BzLmtleTtcbiAgICByZXR1cm4gKFxuICAgICAgTmF2SXRlbShcbiAgICAgICAge3JlZjondGFiJyArIGtleSxcbiAgICAgICAga2V5OmtleX0sIFxuICAgICAgICBjaGlsZC5wcm9wcy50YWJcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gRGVmZXIgYW55IHVwZGF0ZXMgdG8gdGhpcyBjb21wb25lbnQgZHVyaW5nIHRoZSBgb25TZWxlY3RgIGhhbmRsZXIuXG4gICAgcmV0dXJuICF0aGlzLl9pc0NoYW5naW5nO1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGtleSAhPT0gdGhpcy5nZXRBY3RpdmVLZXkoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFjdGl2ZUtleToga2V5LFxuICAgICAgICBwcmV2aW91c0FjdGl2ZUtleTogdGhpcy5nZXRBY3RpdmVLZXkoKVxuICAgICAgfSk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRBcmVhOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcblxudmFyIFRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVGFibGUnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBzdHJpcGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBib3JkZXJlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgY29uZGVuc2VkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBob3ZlcjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcmVzcG9uc2l2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICd0YWJsZSc6IHRydWUsXG4gICAgICAndGFibGUtc3RyaXBlZCc6IHRoaXMucHJvcHMuc3RyaXBlZCxcbiAgICAgICd0YWJsZS1ib3JkZXJlZCc6IHRoaXMucHJvcHMuYm9yZGVyZWQsXG4gICAgICAndGFibGUtY29uZGVuc2VkJzogdGhpcy5wcm9wcy5jb25kZW5zZWQsXG4gICAgICAndGFibGUtaG92ZXInOiB0aGlzLnByb3BzLmhvdmVyXG4gICAgfTtcbiAgICB2YXIgdGFibGUgPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS50YWJsZSgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcblxuICAgIHJldHVybiB0aGlzLnByb3BzLnJlc3BvbnNpdmUgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidGFibGUtcmVzcG9uc2l2ZVwifSwgXG4gICAgICAgIHRhYmxlXG4gICAgICApXG4gICAgKSA6IHRhYmxlO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJsZTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIFRvb2x0aXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdUb29sdGlwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgcG9zaXRpb25MZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHBvc2l0aW9uVG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0TGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldFRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBwbGFjZW1lbnQ6ICdyaWdodCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG4gICAgY2xhc3Nlc1sndG9vbHRpcCddID0gdHJ1ZTtcbiAgICBjbGFzc2VzW3RoaXMucHJvcHMucGxhY2VtZW50XSA9IHRydWU7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0ICE9IG51bGwgfHwgdGhpcy5wcm9wcy5wb3NpdGlvblRvcCAhPSBudWxsO1xuXG4gICAgdmFyIHN0eWxlID0ge307XG4gICAgc3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMucG9zaXRpb25MZWZ0O1xuICAgIHN0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMucG9zaXRpb25Ub3A7XG5cbiAgICB2YXIgYXJyb3dTdHlsZSA9IHt9O1xuICAgIGFycm93U3R5bGVbJ2xlZnQnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRMZWZ0O1xuICAgIGFycm93U3R5bGVbJ3RvcCddID0gdGhpcy5wcm9wcy5hcnJvd09mZnNldFRvcDtcblxuICAgIHJldHVybiAoXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIHN0eWxlOnN0eWxlfSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRvb2x0aXAtYXJyb3dcIiwgc3R5bGU6YXJyb3dTdHlsZX0gKSxcbiAgICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwidG9vbHRpcC1pbm5lclwifSwgXG4gICAgICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb29sdGlwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIFdlbGwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdXZWxsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnd2VsbCdcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWxsOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBDTEFTU0VTOiB7XG4gICAgJ2FsZXJ0JzogJ2FsZXJ0JyxcbiAgICAnYnV0dG9uJzogJ2J0bicsXG4gICAgJ2J1dHRvbi1ncm91cCc6ICdidG4tZ3JvdXAnLFxuICAgICdidXR0b24tdG9vbGJhcic6ICdidG4tdG9vbGJhcicsXG4gICAgJ2NvbHVtbic6ICdjb2wnLFxuICAgICdpbnB1dC1ncm91cCc6ICdpbnB1dC1ncm91cCcsXG4gICAgJ2Zvcm0nOiAnZm9ybScsXG4gICAgJ2dseXBoaWNvbic6ICdnbHlwaGljb24nLFxuICAgICdsYWJlbCc6ICdsYWJlbCcsXG4gICAgJ3BhbmVsJzogJ3BhbmVsJyxcbiAgICAncGFuZWwtZ3JvdXAnOiAncGFuZWwtZ3JvdXAnLFxuICAgICdwcm9ncmVzcy1iYXInOiAncHJvZ3Jlc3MtYmFyJyxcbiAgICAnbmF2JzogJ25hdicsXG4gICAgJ25hdmJhcic6ICduYXZiYXInLFxuICAgICdtb2RhbCc6ICdtb2RhbCcsXG4gICAgJ3Jvdyc6ICdyb3cnLFxuICAgICd3ZWxsJzogJ3dlbGwnXG4gIH0sXG4gIFNUWUxFUzoge1xuICAgICdkZWZhdWx0JzogJ2RlZmF1bHQnLFxuICAgICdwcmltYXJ5JzogJ3ByaW1hcnknLFxuICAgICdzdWNjZXNzJzogJ3N1Y2Nlc3MnLFxuICAgICdpbmZvJzogJ2luZm8nLFxuICAgICd3YXJuaW5nJzogJ3dhcm5pbmcnLFxuICAgICdkYW5nZXInOiAnZGFuZ2VyJyxcbiAgICAnbGluayc6ICdsaW5rJyxcbiAgICAnaW5saW5lJzogJ2lubGluZScsXG4gICAgJ3RhYnMnOiAndGFicycsXG4gICAgJ3BpbGxzJzogJ3BpbGxzJ1xuICB9LFxuICBTSVpFUzoge1xuICAgICdsYXJnZSc6ICdsZycsXG4gICAgJ21lZGl1bSc6ICdtZCcsXG4gICAgJ3NtYWxsJzogJ3NtJyxcbiAgICAneHNtYWxsJzogJ3hzJ1xuICB9LFxuICBHTFlQSFM6IFtcbiAgICAnYXN0ZXJpc2snLFxuICAgICdwbHVzJyxcbiAgICAnZXVybycsXG4gICAgJ21pbnVzJyxcbiAgICAnY2xvdWQnLFxuICAgICdlbnZlbG9wZScsXG4gICAgJ3BlbmNpbCcsXG4gICAgJ2dsYXNzJyxcbiAgICAnbXVzaWMnLFxuICAgICdzZWFyY2gnLFxuICAgICdoZWFydCcsXG4gICAgJ3N0YXInLFxuICAgICdzdGFyLWVtcHR5JyxcbiAgICAndXNlcicsXG4gICAgJ2ZpbG0nLFxuICAgICd0aC1sYXJnZScsXG4gICAgJ3RoJyxcbiAgICAndGgtbGlzdCcsXG4gICAgJ29rJyxcbiAgICAncmVtb3ZlJyxcbiAgICAnem9vbS1pbicsXG4gICAgJ3pvb20tb3V0JyxcbiAgICAnb2ZmJyxcbiAgICAnc2lnbmFsJyxcbiAgICAnY29nJyxcbiAgICAndHJhc2gnLFxuICAgICdob21lJyxcbiAgICAnZmlsZScsXG4gICAgJ3RpbWUnLFxuICAgICdyb2FkJyxcbiAgICAnZG93bmxvYWQtYWx0JyxcbiAgICAnZG93bmxvYWQnLFxuICAgICd1cGxvYWQnLFxuICAgICdpbmJveCcsXG4gICAgJ3BsYXktY2lyY2xlJyxcbiAgICAncmVwZWF0JyxcbiAgICAncmVmcmVzaCcsXG4gICAgJ2xpc3QtYWx0JyxcbiAgICAnbG9jaycsXG4gICAgJ2ZsYWcnLFxuICAgICdoZWFkcGhvbmVzJyxcbiAgICAndm9sdW1lLW9mZicsXG4gICAgJ3ZvbHVtZS1kb3duJyxcbiAgICAndm9sdW1lLXVwJyxcbiAgICAncXJjb2RlJyxcbiAgICAnYmFyY29kZScsXG4gICAgJ3RhZycsXG4gICAgJ3RhZ3MnLFxuICAgICdib29rJyxcbiAgICAnYm9va21hcmsnLFxuICAgICdwcmludCcsXG4gICAgJ2NhbWVyYScsXG4gICAgJ2ZvbnQnLFxuICAgICdib2xkJyxcbiAgICAnaXRhbGljJyxcbiAgICAndGV4dC1oZWlnaHQnLFxuICAgICd0ZXh0LXdpZHRoJyxcbiAgICAnYWxpZ24tbGVmdCcsXG4gICAgJ2FsaWduLWNlbnRlcicsXG4gICAgJ2FsaWduLXJpZ2h0JyxcbiAgICAnYWxpZ24tanVzdGlmeScsXG4gICAgJ2xpc3QnLFxuICAgICdpbmRlbnQtbGVmdCcsXG4gICAgJ2luZGVudC1yaWdodCcsXG4gICAgJ2ZhY2V0aW1lLXZpZGVvJyxcbiAgICAncGljdHVyZScsXG4gICAgJ21hcC1tYXJrZXInLFxuICAgICdhZGp1c3QnLFxuICAgICd0aW50JyxcbiAgICAnZWRpdCcsXG4gICAgJ3NoYXJlJyxcbiAgICAnY2hlY2snLFxuICAgICdtb3ZlJyxcbiAgICAnc3RlcC1iYWNrd2FyZCcsXG4gICAgJ2Zhc3QtYmFja3dhcmQnLFxuICAgICdiYWNrd2FyZCcsXG4gICAgJ3BsYXknLFxuICAgICdwYXVzZScsXG4gICAgJ3N0b3AnLFxuICAgICdmb3J3YXJkJyxcbiAgICAnZmFzdC1mb3J3YXJkJyxcbiAgICAnc3RlcC1mb3J3YXJkJyxcbiAgICAnZWplY3QnLFxuICAgICdjaGV2cm9uLWxlZnQnLFxuICAgICdjaGV2cm9uLXJpZ2h0JyxcbiAgICAncGx1cy1zaWduJyxcbiAgICAnbWludXMtc2lnbicsXG4gICAgJ3JlbW92ZS1zaWduJyxcbiAgICAnb2stc2lnbicsXG4gICAgJ3F1ZXN0aW9uLXNpZ24nLFxuICAgICdpbmZvLXNpZ24nLFxuICAgICdzY3JlZW5zaG90JyxcbiAgICAncmVtb3ZlLWNpcmNsZScsXG4gICAgJ29rLWNpcmNsZScsXG4gICAgJ2Jhbi1jaXJjbGUnLFxuICAgICdhcnJvdy1sZWZ0JyxcbiAgICAnYXJyb3ctcmlnaHQnLFxuICAgICdhcnJvdy11cCcsXG4gICAgJ2Fycm93LWRvd24nLFxuICAgICdzaGFyZS1hbHQnLFxuICAgICdyZXNpemUtZnVsbCcsXG4gICAgJ3Jlc2l6ZS1zbWFsbCcsXG4gICAgJ2V4Y2xhbWF0aW9uLXNpZ24nLFxuICAgICdnaWZ0JyxcbiAgICAnbGVhZicsXG4gICAgJ2ZpcmUnLFxuICAgICdleWUtb3BlbicsXG4gICAgJ2V5ZS1jbG9zZScsXG4gICAgJ3dhcm5pbmctc2lnbicsXG4gICAgJ3BsYW5lJyxcbiAgICAnY2FsZW5kYXInLFxuICAgICdyYW5kb20nLFxuICAgICdjb21tZW50JyxcbiAgICAnbWFnbmV0JyxcbiAgICAnY2hldnJvbi11cCcsXG4gICAgJ2NoZXZyb24tZG93bicsXG4gICAgJ3JldHdlZXQnLFxuICAgICdzaG9wcGluZy1jYXJ0JyxcbiAgICAnZm9sZGVyLWNsb3NlJyxcbiAgICAnZm9sZGVyLW9wZW4nLFxuICAgICdyZXNpemUtdmVydGljYWwnLFxuICAgICdyZXNpemUtaG9yaXpvbnRhbCcsXG4gICAgJ2hkZCcsXG4gICAgJ2J1bGxob3JuJyxcbiAgICAnYmVsbCcsXG4gICAgJ2NlcnRpZmljYXRlJyxcbiAgICAndGh1bWJzLXVwJyxcbiAgICAndGh1bWJzLWRvd24nLFxuICAgICdoYW5kLXJpZ2h0JyxcbiAgICAnaGFuZC1sZWZ0JyxcbiAgICAnaGFuZC11cCcsXG4gICAgJ2hhbmQtZG93bicsXG4gICAgJ2NpcmNsZS1hcnJvdy1yaWdodCcsXG4gICAgJ2NpcmNsZS1hcnJvdy1sZWZ0JyxcbiAgICAnY2lyY2xlLWFycm93LXVwJyxcbiAgICAnY2lyY2xlLWFycm93LWRvd24nLFxuICAgICdnbG9iZScsXG4gICAgJ3dyZW5jaCcsXG4gICAgJ3Rhc2tzJyxcbiAgICAnZmlsdGVyJyxcbiAgICAnYnJpZWZjYXNlJyxcbiAgICAnZnVsbHNjcmVlbicsXG4gICAgJ2Rhc2hib2FyZCcsXG4gICAgJ3BhcGVyY2xpcCcsXG4gICAgJ2hlYXJ0LWVtcHR5JyxcbiAgICAnbGluaycsXG4gICAgJ3Bob25lJyxcbiAgICAncHVzaHBpbicsXG4gICAgJ3VzZCcsXG4gICAgJ2dicCcsXG4gICAgJ3NvcnQnLFxuICAgICdzb3J0LWJ5LWFscGhhYmV0JyxcbiAgICAnc29ydC1ieS1hbHBoYWJldC1hbHQnLFxuICAgICdzb3J0LWJ5LW9yZGVyJyxcbiAgICAnc29ydC1ieS1vcmRlci1hbHQnLFxuICAgICdzb3J0LWJ5LWF0dHJpYnV0ZXMnLFxuICAgICdzb3J0LWJ5LWF0dHJpYnV0ZXMtYWx0JyxcbiAgICAndW5jaGVja2VkJyxcbiAgICAnZXhwYW5kJyxcbiAgICAnY29sbGFwc2UtZG93bicsXG4gICAgJ2NvbGxhcHNlLXVwJyxcbiAgICAnbG9nLWluJyxcbiAgICAnZmxhc2gnLFxuICAgICdsb2ctb3V0JyxcbiAgICAnbmV3LXdpbmRvdycsXG4gICAgJ3JlY29yZCcsXG4gICAgJ3NhdmUnLFxuICAgICdvcGVuJyxcbiAgICAnc2F2ZWQnLFxuICAgICdpbXBvcnQnLFxuICAgICdleHBvcnQnLFxuICAgICdzZW5kJyxcbiAgICAnZmxvcHB5LWRpc2snLFxuICAgICdmbG9wcHktc2F2ZWQnLFxuICAgICdmbG9wcHktcmVtb3ZlJyxcbiAgICAnZmxvcHB5LXNhdmUnLFxuICAgICdmbG9wcHktb3BlbicsXG4gICAgJ2NyZWRpdC1jYXJkJyxcbiAgICAndHJhbnNmZXInLFxuICAgICdjdXRsZXJ5JyxcbiAgICAnaGVhZGVyJyxcbiAgICAnY29tcHJlc3NlZCcsXG4gICAgJ2VhcnBob25lJyxcbiAgICAncGhvbmUtYWx0JyxcbiAgICAndG93ZXInLFxuICAgICdzdGF0cycsXG4gICAgJ3NkLXZpZGVvJyxcbiAgICAnaGQtdmlkZW8nLFxuICAgICdzdWJ0aXRsZXMnLFxuICAgICdzb3VuZC1zdGVyZW8nLFxuICAgICdzb3VuZC1kb2xieScsXG4gICAgJ3NvdW5kLTUtMScsXG4gICAgJ3NvdW5kLTYtMScsXG4gICAgJ3NvdW5kLTctMScsXG4gICAgJ2NvcHlyaWdodC1tYXJrJyxcbiAgICAncmVnaXN0cmF0aW9uLW1hcmsnLFxuICAgICdjbG91ZC1kb3dubG9hZCcsXG4gICAgJ2Nsb3VkLXVwbG9hZCcsXG4gICAgJ3RyZWUtY29uaWZlcicsXG4gICAgJ3RyZWUtZGVjaWR1b3VzJ1xuICBdXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIEFjY29yZGlvbjogcmVxdWlyZSgnLi9BY2NvcmRpb24nKSxcbiAgQWZmaXg6IHJlcXVpcmUoJy4vQWZmaXgnKSxcbiAgQWZmaXhNaXhpbjogcmVxdWlyZSgnLi9BZmZpeE1peGluJyksXG4gIEFsZXJ0OiByZXF1aXJlKCcuL0FsZXJ0JyksXG4gIEJvb3RzdHJhcE1peGluOiByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyksXG4gIEJhZGdlOiByZXF1aXJlKCcuL0JhZGdlJyksXG4gIEJ1dHRvbjogcmVxdWlyZSgnLi9CdXR0b24nKSxcbiAgQnV0dG9uR3JvdXA6IHJlcXVpcmUoJy4vQnV0dG9uR3JvdXAnKSxcbiAgQnV0dG9uVG9vbGJhcjogcmVxdWlyZSgnLi9CdXR0b25Ub29sYmFyJyksXG4gIENhcm91c2VsOiByZXF1aXJlKCcuL0Nhcm91c2VsJyksXG4gIENhcm91c2VsSXRlbTogcmVxdWlyZSgnLi9DYXJvdXNlbEl0ZW0nKSxcbiAgQ29sOiByZXF1aXJlKCcuL0NvbCcpLFxuICBDb2xsYXBzYWJsZU1peGluOiByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKSxcbiAgRHJvcGRvd25CdXR0b246IHJlcXVpcmUoJy4vRHJvcGRvd25CdXR0b24nKSxcbiAgRHJvcGRvd25NZW51OiByZXF1aXJlKCcuL0Ryb3Bkb3duTWVudScpLFxuICBEcm9wZG93blN0YXRlTWl4aW46IHJlcXVpcmUoJy4vRHJvcGRvd25TdGF0ZU1peGluJyksXG4gIEZhZGVNaXhpbjogcmVxdWlyZSgnLi9GYWRlTWl4aW4nKSxcbiAgR2x5cGhpY29uOiByZXF1aXJlKCcuL0dseXBoaWNvbicpLFxuICBHcmlkOiByZXF1aXJlKCcuL0dyaWQnKSxcbiAgSW5wdXQ6IHJlcXVpcmUoJy4vSW5wdXQnKSxcbiAgSW50ZXJwb2xhdGU6IHJlcXVpcmUoJy4vSW50ZXJwb2xhdGUnKSxcbiAgSnVtYm90cm9uOiByZXF1aXJlKCcuL0p1bWJvdHJvbicpLFxuICBMYWJlbDogcmVxdWlyZSgnLi9MYWJlbCcpLFxuICBNZW51SXRlbTogcmVxdWlyZSgnLi9NZW51SXRlbScpLFxuICBNb2RhbDogcmVxdWlyZSgnLi9Nb2RhbCcpLFxuICBOYXY6IHJlcXVpcmUoJy4vTmF2JyksXG4gIE5hdmJhcjogcmVxdWlyZSgnLi9OYXZiYXInKSxcbiAgTmF2SXRlbTogcmVxdWlyZSgnLi9OYXZJdGVtJyksXG4gIE1vZGFsVHJpZ2dlcjogcmVxdWlyZSgnLi9Nb2RhbFRyaWdnZXInKSxcbiAgT3ZlcmxheVRyaWdnZXI6IHJlcXVpcmUoJy4vT3ZlcmxheVRyaWdnZXInKSxcbiAgT3ZlcmxheU1peGluOiByZXF1aXJlKCcuL092ZXJsYXlNaXhpbicpLFxuICBQYWdlSGVhZGVyOiByZXF1aXJlKCcuL1BhZ2VIZWFkZXInKSxcbiAgUGFuZWw6IHJlcXVpcmUoJy4vUGFuZWwnKSxcbiAgUGFuZWxHcm91cDogcmVxdWlyZSgnLi9QYW5lbEdyb3VwJyksXG4gIFBhZ2VJdGVtOiByZXF1aXJlKCcuL1BhZ2VJdGVtJyksXG4gIFBhZ2VyOiByZXF1aXJlKCcuL1BhZ2VyJyksXG4gIFBvcG92ZXI6IHJlcXVpcmUoJy4vUG9wb3ZlcicpLFxuICBQcm9ncmVzc0JhcjogcmVxdWlyZSgnLi9Qcm9ncmVzc0JhcicpLFxuICBSb3c6IHJlcXVpcmUoJy4vUm93JyksXG4gIFNwbGl0QnV0dG9uOiByZXF1aXJlKCcuL1NwbGl0QnV0dG9uJyksXG4gIFN1Yk5hdjogcmVxdWlyZSgnLi9TdWJOYXYnKSxcbiAgVGFiYmVkQXJlYTogcmVxdWlyZSgnLi9UYWJiZWRBcmVhJyksXG4gIFRhYmxlOiByZXF1aXJlKCcuL1RhYmxlJyksXG4gIFRhYlBhbmU6IHJlcXVpcmUoJy4vVGFiUGFuZScpLFxuICBUb29sdGlwOiByZXF1aXJlKCcuL1Rvb2x0aXAnKSxcbiAgV2VsbDogcmVxdWlyZSgnLi9XZWxsJylcbn07IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbnZhciBDdXN0b21Qcm9wVHlwZXMgPSB7XG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciBhIHByb3AgaXMgYSB2YWxpZCBSZWFjdCBjbGFzc1xuICAgKlxuICAgKiBAcGFyYW0gcHJvcHNcbiAgICogQHBhcmFtIHByb3BOYW1lXG4gICAqIEBwYXJhbSBjb21wb25lbnROYW1lXG4gICAqIEByZXR1cm5zIHtFcnJvcnx1bmRlZmluZWR9XG4gICAqL1xuICBjb21wb25lbnRDbGFzczogZnVuY3Rpb24gKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSkge1xuICAgIGlmICghUmVhY3QuaXNWYWxpZENsYXNzKHByb3BzW3Byb3BOYW1lXSkpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0ludmFsaWQgYCcgKyBwcm9wTmFtZSArICdgIHByb3AgaW4gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGJlICcgK1xuICAgICAgICAnYSB2YWxpZCBSZWFjdCBjbGFzcycpO1xuICAgIH1cbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBwcm9wIHByb3ZpZGVzIGEgRE9NIGVsZW1lbnRcbiAgICpcbiAgICogVGhlIGVsZW1lbnQgY2FuIGJlIHByb3ZpZGVkIGluIHR3byBmb3JtczpcbiAgICogLSBEaXJlY3RseSBwYXNzZWRcbiAgICogLSBPciBwYXNzZWQgYW4gb2JqZWN0IHdoaWNoIGhhcyBhIGBnZXRET01Ob2RlYCBtZXRob2Qgd2hpY2ggd2lsbCByZXR1cm4gdGhlIHJlcXVpcmVkIERPTSBlbGVtZW50XG4gICAqXG4gICAqIEBwYXJhbSBwcm9wc1xuICAgKiBAcGFyYW0gcHJvcE5hbWVcbiAgICogQHBhcmFtIGNvbXBvbmVudE5hbWVcbiAgICogQHJldHVybnMge0Vycm9yfHVuZGVmaW5lZH1cbiAgICovXG4gIG1vdW50YWJsZTogZnVuY3Rpb24gKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSkge1xuICAgIGlmICh0eXBlb2YgcHJvcHNbcHJvcE5hbWVdICE9PSAnb2JqZWN0JyB8fFxuICAgICAgdHlwZW9mIHByb3BzW3Byb3BOYW1lXS5nZXRET01Ob2RlICE9PSAnZnVuY3Rpb24nICYmIHByb3BzW3Byb3BOYW1lXS5ub2RlVHlwZSAhPT0gMSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignSW52YWxpZCBgJyArIHByb3BOYW1lICsgJ2AgcHJvcCBpbiBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYmUgJyArXG4gICAgICAgICdhIERPTSBlbGVtZW50IG9yIGFuIG9iamVjdCB0aGF0IGhhcyBhIGBnZXRET01Ob2RlYCBtZXRob2QnKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ3VzdG9tUHJvcFR5cGVzOyIsIi8qKlxuICogUmVhY3QgRXZlbnRMaXN0ZW5lci5saXN0ZW5cbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGEgbW9kaWZpZWQgdmVyc2lvbiBvZjpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdmVuZG9yL3N0dWJzL0V2ZW50TGlzdGVuZXIuanNcbiAqXG4gKiBUT0RPOiByZW1vdmUgaW4gZmF2b3VyIG9mIHNvbHV0aW9uIHByb3ZpZGVkIGJ5OlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9pc3N1ZXMvMjg1XG4gKi9cblxuLyoqXG4gKiBEb2VzIG5vdCB0YWtlIGludG8gYWNjb3VudCBzcGVjaWZpYyBuYXR1cmUgb2YgcGxhdGZvcm0uXG4gKi9cbnZhciBFdmVudExpc3RlbmVyID0ge1xuICAvKipcbiAgICogTGlzdGVuIHRvIERPTSBldmVudHMgZHVyaW5nIHRoZSBidWJibGUgcGhhc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RE9NRXZlbnRUYXJnZXR9IHRhcmdldCBET00gZWxlbWVudCB0byByZWdpc3RlciBsaXN0ZW5lciBvbi5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBFdmVudCB0eXBlLCBlLmcuICdjbGljaycgb3IgJ21vdXNlb3ZlcicuXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCB3aXRoIGEgYHJlbW92ZWAgbWV0aG9kLlxuICAgKi9cbiAgbGlzdGVuOiBmdW5jdGlvbih0YXJnZXQsIGV2ZW50VHlwZSwgY2FsbGJhY2spIHtcbiAgICBpZiAodGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBjYWxsYmFjaywgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAodGFyZ2V0LmF0dGFjaEV2ZW50KSB7XG4gICAgICB0YXJnZXQuYXR0YWNoRXZlbnQoJ29uJyArIGV2ZW50VHlwZSwgY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0YXJnZXQuZGV0YWNoRXZlbnQoJ29uJyArIGV2ZW50VHlwZSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudExpc3RlbmVyO1xuIiwiLyoqXG4gKiBSZWFjdCBUcmFuc2l0aW9uRXZlbnRzXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhIG1vZGlmaWVkIHZlcnNpb24gb2Y6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL2FkZG9ucy90cmFuc2l0aW9ucy9SZWFjdFRyYW5zaXRpb25FdmVudHMuanNcbiAqXG4gKi9cblxudmFyIGNhblVzZURPTSA9ICEhKFxuICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHdpbmRvdy5kb2N1bWVudCAmJlxuICAgIHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50XG4gICk7XG5cbi8qKlxuICogRVZFTlRfTkFNRV9NQVAgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hpY2ggZXZlbnQgZmlyZWQgd2hlbiBhXG4gKiB0cmFuc2l0aW9uL2FuaW1hdGlvbiBlbmRzLCBiYXNlZCBvbiB0aGUgc3R5bGUgcHJvcGVydHkgdXNlZCB0b1xuICogZGVmaW5lIHRoYXQgZXZlbnQuXG4gKi9cbnZhciBFVkVOVF9OQU1FX01BUCA9IHtcbiAgdHJhbnNpdGlvbmVuZDoge1xuICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICdNb3pUcmFuc2l0aW9uJzogJ21velRyYW5zaXRpb25FbmQnLFxuICAgICdPVHJhbnNpdGlvbic6ICdvVHJhbnNpdGlvbkVuZCcsXG4gICAgJ21zVHJhbnNpdGlvbic6ICdNU1RyYW5zaXRpb25FbmQnXG4gIH0sXG5cbiAgYW5pbWF0aW9uZW5kOiB7XG4gICAgJ2FuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnLFxuICAgICdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJyxcbiAgICAnTW96QW5pbWF0aW9uJzogJ21vekFuaW1hdGlvbkVuZCcsXG4gICAgJ09BbmltYXRpb24nOiAnb0FuaW1hdGlvbkVuZCcsXG4gICAgJ21zQW5pbWF0aW9uJzogJ01TQW5pbWF0aW9uRW5kJ1xuICB9XG59O1xuXG52YXIgZW5kRXZlbnRzID0gW107XG5cbmZ1bmN0aW9uIGRldGVjdEV2ZW50cygpIHtcbiAgdmFyIHRlc3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgc3R5bGUgPSB0ZXN0RWwuc3R5bGU7XG5cbiAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIGluIHBhcnRpY3VsYXIgc29tZSByZWxlYXNlcyBvZiBBbmRyb2lkIDQueCxcbiAgLy8gdGhlIHVuLXByZWZpeGVkIFwiYW5pbWF0aW9uXCIgYW5kIFwidHJhbnNpdGlvblwiIHByb3BlcnRpZXMgYXJlIGRlZmluZWQgb24gdGhlXG4gIC8vIHN0eWxlIG9iamVjdCBidXQgdGhlIGV2ZW50cyB0aGF0IGZpcmUgd2lsbCBzdGlsbCBiZSBwcmVmaXhlZCwgc28gd2UgbmVlZFxuICAvLyB0byBjaGVjayBpZiB0aGUgdW4tcHJlZml4ZWQgZXZlbnRzIGFyZSB1c2VhYmxlLCBhbmQgaWYgbm90IHJlbW92ZSB0aGVtXG4gIC8vIGZyb20gdGhlIG1hcFxuICBpZiAoISgnQW5pbWF0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAuYW5pbWF0aW9uZW5kLmFuaW1hdGlvbjtcbiAgfVxuXG4gIGlmICghKCdUcmFuc2l0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAudHJhbnNpdGlvbmVuZC50cmFuc2l0aW9uO1xuICB9XG5cbiAgZm9yICh2YXIgYmFzZUV2ZW50TmFtZSBpbiBFVkVOVF9OQU1FX01BUCkge1xuICAgIHZhciBiYXNlRXZlbnRzID0gRVZFTlRfTkFNRV9NQVBbYmFzZUV2ZW50TmFtZV07XG4gICAgZm9yICh2YXIgc3R5bGVOYW1lIGluIGJhc2VFdmVudHMpIHtcbiAgICAgIGlmIChzdHlsZU5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZW5kRXZlbnRzLnB1c2goYmFzZUV2ZW50c1tzdHlsZU5hbWVdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmlmIChjYW5Vc2VET00pIHtcbiAgZGV0ZWN0RXZlbnRzKCk7XG59XG5cbi8vIFdlIHVzZSB0aGUgcmF3IHthZGR8cmVtb3ZlfUV2ZW50TGlzdGVuZXIoKSBjYWxsIGJlY2F1c2UgRXZlbnRMaXN0ZW5lclxuLy8gZG9lcyBub3Qga25vdyBob3cgdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVycyBhbmQgd2UgcmVhbGx5IHNob3VsZFxuLy8gY2xlYW4gdXAuIEFsc28sIHRoZXNlIGV2ZW50cyBhcmUgbm90IHRyaWdnZXJlZCBpbiBvbGRlciBicm93c2Vyc1xuLy8gc28gd2Ugc2hvdWxkIGJlIEEtT0sgaGVyZS5cblxuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lcikge1xuICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCBmYWxzZSk7XG59XG5cbnZhciBSZWFjdFRyYW5zaXRpb25FdmVudHMgPSB7XG4gIGFkZEVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gSWYgQ1NTIHRyYW5zaXRpb25zIGFyZSBub3Qgc3VwcG9ydGVkLCB0cmlnZ2VyIGFuIFwiZW5kIGFuaW1hdGlvblwiXG4gICAgICAvLyBldmVudCBpbW1lZGlhdGVseS5cbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGV2ZW50TGlzdGVuZXIsIDApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH0sXG5cbiAgcmVtb3ZlRW5kRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24obm9kZSwgZXZlbnRMaXN0ZW5lcikge1xuICAgIGlmIChlbmRFdmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVuZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVuZEV2ZW50KSB7XG4gICAgICByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGVuZEV2ZW50LCBldmVudExpc3RlbmVyKTtcbiAgICB9KTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFRyYW5zaXRpb25FdmVudHM7XG4iLCJ2YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxuLyoqXG4gKiBNYXBzIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYCxcbiAqIGJ1dCBvbmx5IGl0ZXJhdGVzIG92ZXIgY2hpbGRyZW4gdGhhdCBhcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogVGhlIG1hcEZ1bmN0aW9uIHByb3ZpZGVkIGluZGV4IHdpbGwgYmUgbm9ybWFsaXNlZCB0byB0aGUgY29tcG9uZW50cyBtYXBwZWQsXG4gKiBzbyBhbiBpbnZhbGlkIGNvbXBvbmVudCB3b3VsZCBub3QgaW5jcmVhc2UgdGhlIGluZGV4LlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBpbnQpfSBtYXBGdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gbWFwQ29udGV4dCBDb250ZXh0IGZvciBtYXBGdW5jdGlvbi5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIG9yZGVyZWQgbWFwIG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIG1hcFZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbiwgZnVuYywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSAwO1xuXG4gIHJldHVybiBSZWFjdC5DaGlsZHJlbi5tYXAoY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkge1xuICAgICAgdmFyIGxhc3RJbmRleCA9IGluZGV4O1xuICAgICAgaW5kZXgrKztcbiAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgY2hpbGQsIGxhc3RJbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xuICB9KTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIGNoaWxkcmVuIHRoYXQgYXJlIHR5cGljYWxseSBzcGVjaWZpZWQgYXMgYHByb3BzLmNoaWxkcmVuYCxcbiAqIGJ1dCBvbmx5IGl0ZXJhdGVzIG92ZXIgY2hpbGRyZW4gdGhhdCBhcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogVGhlIHByb3ZpZGVkIGZvckVhY2hGdW5jKGNoaWxkLCBpbmRleCkgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2hcbiAqIGxlYWYgY2hpbGQgd2l0aCB0aGUgaW5kZXggcmVmbGVjdGluZyB0aGUgcG9zaXRpb24gcmVsYXRpdmUgdG8gXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCosIGludCl9IGZvckVhY2hGdW5jLlxuICogQHBhcmFtIHsqfSBmb3JFYWNoQ29udGV4dCBDb250ZXh0IGZvciBmb3JFYWNoQ29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZm9yRWFjaFZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbiwgZnVuYywgY29udGV4dCkge1xuICB2YXIgaW5kZXggPSAwO1xuXG4gIHJldHVybiBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHtcbiAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBjaGlsZCwgaW5kZXgpO1xuICAgICAgaW5kZXgrKztcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIENvdW50IHRoZSBudW1iZXIgb2YgXCJ2YWxpZCBjb21wb25lbnRzXCIgaW4gdGhlIENoaWxkcmVuIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIG51bWJlck9mVmFsaWRDb21wb25lbnRzKGNoaWxkcmVuKSB7XG4gIHZhciBjb3VudCA9IDA7XG5cbiAgUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7IGNvdW50Kys7IH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvdW50O1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiB0aGUgQ2hpbGQgY29udGFpbmVyIGhhcyBvbmUgb3IgbW9yZSBcInZhbGlkIGNvbXBvbmVudHNcIi5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBoYXNWYWxpZENvbXBvbmVudChjaGlsZHJlbikge1xuICB2YXIgaGFzVmFsaWQgPSBmYWxzZTtcblxuICBSZWFjdC5DaGlsZHJlbi5mb3JFYWNoKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoIWhhc1ZhbGlkICYmIFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7XG4gICAgICBoYXNWYWxpZCA9IHRydWU7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaGFzVmFsaWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYXA6IG1hcFZhbGlkQ29tcG9uZW50cyxcbiAgZm9yRWFjaDogZm9yRWFjaFZhbGlkQ29tcG9uZW50cyxcbiAgbnVtYmVyT2Y6IG51bWJlck9mVmFsaWRDb21wb25lbnRzLFxuICBoYXNWYWxpZENvbXBvbmVudDogaGFzVmFsaWRDb21wb25lbnRcbn07IiwiLyoqXG4gKiBSZWFjdCBjbGFzc1NldFxuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgaXMgdW5tb2RpZmllZCBmcm9tOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy92ZW5kb3Ivc3R1YnMvY3guanNcbiAqXG4gKi9cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gbWFyayBzdHJpbmcgbGl0ZXJhbHMgcmVwcmVzZW50aW5nIENTUyBjbGFzcyBuYW1lc1xuICogc28gdGhhdCB0aGV5IGNhbiBiZSB0cmFuc2Zvcm1lZCBzdGF0aWNhbGx5LiBUaGlzIGFsbG93cyBmb3IgbW9kdWxhcml6YXRpb25cbiAqIGFuZCBtaW5pZmljYXRpb24gb2YgQ1NTIGNsYXNzIG5hbWVzLlxuICpcbiAqIEluIHN0YXRpY191cHN0cmVhbSwgdGhpcyBmdW5jdGlvbiBpcyBhY3R1YWxseSBpbXBsZW1lbnRlZCwgYnV0IGl0IHNob3VsZFxuICogZXZlbnR1YWxseSBiZSByZXBsYWNlZCB3aXRoIHNvbWV0aGluZyBtb3JlIGRlc2NyaXB0aXZlLCBhbmQgdGhlIHRyYW5zZm9ybVxuICogdGhhdCBpcyB1c2VkIGluIHRoZSBtYWluIHN0YWNrIHNob3VsZCBiZSBwb3J0ZWQgZm9yIHVzZSBlbHNld2hlcmUuXG4gKlxuICogQHBhcmFtIHN0cmluZ3xvYmplY3QgY2xhc3NOYW1lIHRvIG1vZHVsYXJpemUsIG9yIGFuIG9iamVjdCBvZiBrZXkvdmFsdWVzLlxuICogICAgICAgICAgICAgICAgICAgICAgSW4gdGhlIG9iamVjdCBjYXNlLCB0aGUgdmFsdWVzIGFyZSBjb25kaXRpb25zIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgICAgIGRldGVybWluZSBpZiB0aGUgY2xhc3NOYW1lIGtleXMgc2hvdWxkIGJlIGluY2x1ZGVkLlxuICogQHBhcmFtIFtzdHJpbmcgLi4uXSAgVmFyaWFibGUgbGlzdCBvZiBjbGFzc05hbWVzIGluIHRoZSBzdHJpbmcgY2FzZS5cbiAqIEByZXR1cm4gc3RyaW5nICAgICAgIFJlbmRlcmFibGUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc05hbWUuXG4gKi9cbmZ1bmN0aW9uIGN4KGNsYXNzTmFtZXMpIHtcbiAgaWYgKHR5cGVvZiBjbGFzc05hbWVzID09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKGNsYXNzTmFtZXMpLmZpbHRlcihmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgIHJldHVybiBjbGFzc05hbWVzW2NsYXNzTmFtZV07XG4gICAgfSkuam9pbignICcpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuam9pbi5jYWxsKGFyZ3VtZW50cywgJyAnKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGN4OyIsIi8qKlxuICogUmVhY3QgY2xvbmVXaXRoUHJvcHNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIG1vZGlmaWVkIHZlcnNpb25zIG9mOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy91dGlscy9jbG9uZVdpdGhQcm9wcy5qc1xuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy9jb3JlL1JlYWN0UHJvcFRyYW5zZmVyZXIuanNcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdXRpbHMvam9pbkNsYXNzZXMuanNcbiAqXG4gKiBUT0RPOiBUaGlzIHNob3VsZCBiZSByZXBsYWNlZCBhcyBzb29uIGFzIGNsb25lV2l0aFByb3BzIGlzIGF2YWlsYWJsZSB2aWFcbiAqICB0aGUgY29yZSBSZWFjdCBwYWNrYWdlIG9yIGEgc2VwYXJhdGUgcGFja2FnZS5cbiAqICBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9pc3N1ZXMvMTkwNlxuICpcbiAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vbWVyZ2UnKTtcblxuLyoqXG4gKiBDb21iaW5lcyBtdWx0aXBsZSBjbGFzc05hbWUgc3RyaW5ncyBpbnRvIG9uZS5cbiAqIGh0dHA6Ly9qc3BlcmYuY29tL2pvaW5jbGFzc2VzLWFyZ3MtdnMtYXJyYXlcbiAqXG4gKiBAcGFyYW0gey4uLj9zdHJpbmd9IGNsYXNzZXNcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gam9pbkNsYXNzZXMoY2xhc3NOYW1lLyosIC4uLiAqLykge1xuICBpZiAoIWNsYXNzTmFtZSkge1xuICAgIGNsYXNzTmFtZSA9ICcnO1xuICB9XG4gIHZhciBuZXh0Q2xhc3M7XG4gIHZhciBhcmdMZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICBpZiAoYXJnTGVuZ3RoID4gMSkge1xuICAgIGZvciAodmFyIGlpID0gMTsgaWkgPCBhcmdMZW5ndGg7IGlpKyspIHtcbiAgICAgIG5leHRDbGFzcyA9IGFyZ3VtZW50c1tpaV07XG4gICAgICBuZXh0Q2xhc3MgJiYgKGNsYXNzTmFtZSArPSAnICcgKyBuZXh0Q2xhc3MpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB0cmFuc2ZlciBzdHJhdGVneSB0aGF0IHdpbGwgbWVyZ2UgcHJvcCB2YWx1ZXMgdXNpbmcgdGhlIHN1cHBsaWVkXG4gKiBgbWVyZ2VTdHJhdGVneWAuIElmIGEgcHJvcCB3YXMgcHJldmlvdXNseSB1bnNldCwgdGhpcyBqdXN0IHNldHMgaXQuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gbWVyZ2VTdHJhdGVneVxuICogQHJldHVybiB7ZnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zZmVyU3RyYXRlZ3kobWVyZ2VTdHJhdGVneSkge1xuICByZXR1cm4gZnVuY3Rpb24ocHJvcHMsIGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIXByb3BzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHByb3BzW2tleV0gPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHNba2V5XSA9IG1lcmdlU3RyYXRlZ3kocHJvcHNba2V5XSwgdmFsdWUpO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIHRyYW5zZmVyU3RyYXRlZ3lNZXJnZSA9IGNyZWF0ZVRyYW5zZmVyU3RyYXRlZ3koZnVuY3Rpb24oYSwgYikge1xuICAvLyBgbWVyZ2VgIG92ZXJyaWRlcyB0aGUgZmlyc3Qgb2JqZWN0J3MgKGBwcm9wc1trZXldYCBhYm92ZSkga2V5cyB1c2luZyB0aGVcbiAgLy8gc2Vjb25kIG9iamVjdCdzIChgdmFsdWVgKSBrZXlzLiBBbiBvYmplY3QncyBzdHlsZSdzIGV4aXN0aW5nIGBwcm9wQWAgd291bGRcbiAgLy8gZ2V0IG92ZXJyaWRkZW4uIEZsaXAgdGhlIG9yZGVyIGhlcmUuXG4gIHJldHVybiBtZXJnZShiLCBhKTtcbn0pO1xuXG5mdW5jdGlvbiBlbXB0eUZ1bmN0aW9uKCkge31cblxuLyoqXG4gKiBUcmFuc2ZlciBzdHJhdGVnaWVzIGRpY3RhdGUgaG93IHByb3BzIGFyZSB0cmFuc2ZlcnJlZCBieSBgdHJhbnNmZXJQcm9wc1RvYC5cbiAqIE5PVEU6IGlmIHlvdSBhZGQgYW55IG1vcmUgZXhjZXB0aW9ucyB0byB0aGlzIGxpc3QgeW91IHNob3VsZCBiZSBzdXJlIHRvXG4gKiB1cGRhdGUgYGNsb25lV2l0aFByb3BzKClgIGFjY29yZGluZ2x5LlxuICovXG52YXIgVHJhbnNmZXJTdHJhdGVnaWVzID0ge1xuICAvKipcbiAgICogTmV2ZXIgdHJhbnNmZXIgYGNoaWxkcmVuYC5cbiAgICovXG4gIGNoaWxkcmVuOiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogVHJhbnNmZXIgdGhlIGBjbGFzc05hbWVgIHByb3AgYnkgbWVyZ2luZyB0aGVtLlxuICAgKi9cbiAgY2xhc3NOYW1lOiBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KGpvaW5DbGFzc2VzKSxcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIHRoZSBga2V5YCBwcm9wLlxuICAgKi9cbiAga2V5OiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogTmV2ZXIgdHJhbnNmZXIgdGhlIGByZWZgIHByb3AuXG4gICAqL1xuICByZWY6IGVtcHR5RnVuY3Rpb24sXG4gIC8qKlxuICAgKiBUcmFuc2ZlciB0aGUgYHN0eWxlYCBwcm9wICh3aGljaCBpcyBhbiBvYmplY3QpIGJ5IG1lcmdpbmcgdGhlbS5cbiAgICovXG4gIHN0eWxlOiB0cmFuc2ZlclN0cmF0ZWd5TWVyZ2Vcbn07XG5cbi8qKlxuICogTXV0YXRlcyB0aGUgZmlyc3QgYXJndW1lbnQgYnkgdHJhbnNmZXJyaW5nIHRoZSBwcm9wZXJ0aWVzIGZyb20gdGhlIHNlY29uZFxuICogYXJndW1lbnQuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzXG4gKiBAcGFyYW0ge29iamVjdH0gbmV3UHJvcHNcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xuZnVuY3Rpb24gdHJhbnNmZXJJbnRvKHByb3BzLCBuZXdQcm9wcykge1xuICBmb3IgKHZhciB0aGlzS2V5IGluIG5ld1Byb3BzKSB7XG4gICAgaWYgKCFuZXdQcm9wcy5oYXNPd25Qcm9wZXJ0eSh0aGlzS2V5KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zZmVyU3RyYXRlZ3kgPSBUcmFuc2ZlclN0cmF0ZWdpZXNbdGhpc0tleV07XG5cbiAgICBpZiAodHJhbnNmZXJTdHJhdGVneSAmJiBUcmFuc2ZlclN0cmF0ZWdpZXMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIHRyYW5zZmVyU3RyYXRlZ3kocHJvcHMsIHRoaXNLZXksIG5ld1Byb3BzW3RoaXNLZXldKTtcbiAgICB9IGVsc2UgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eSh0aGlzS2V5KSkge1xuICAgICAgcHJvcHNbdGhpc0tleV0gPSBuZXdQcm9wc1t0aGlzS2V5XTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BzO1xufVxuXG4vKipcbiAqIE1lcmdlIHR3byBwcm9wcyBvYmplY3RzIHVzaW5nIFRyYW5zZmVyU3RyYXRlZ2llcy5cbiAqXG4gKiBAcGFyYW0ge29iamVjdH0gb2xkUHJvcHMgb3JpZ2luYWwgcHJvcHMgKHRoZXkgdGFrZSBwcmVjZWRlbmNlKVxuICogQHBhcmFtIHtvYmplY3R9IG5ld1Byb3BzIG5ldyBwcm9wcyB0byBtZXJnZSBpblxuICogQHJldHVybiB7b2JqZWN0fSBhIG5ldyBvYmplY3QgY29udGFpbmluZyBib3RoIHNldHMgb2YgcHJvcHMgbWVyZ2VkLlxuICovXG5mdW5jdGlvbiBtZXJnZVByb3BzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICByZXR1cm4gdHJhbnNmZXJJbnRvKG1lcmdlKG9sZFByb3BzKSwgbmV3UHJvcHMpO1xufVxuXG52YXIgUmVhY3RQcm9wVHJhbnNmZXJlciA9IHtcbiAgbWVyZ2VQcm9wczogbWVyZ2VQcm9wc1xufTtcblxudmFyIENISUxEUkVOX1BST1AgPSAnY2hpbGRyZW4nO1xuXG4vKipcbiAqIFNvbWV0aW1lcyB5b3Ugd2FudCB0byBjaGFuZ2UgdGhlIHByb3BzIG9mIGEgY2hpbGQgcGFzc2VkIHRvIHlvdS4gVXN1YWxseVxuICogdGhpcyBpcyB0byBhZGQgYSBDU1MgY2xhc3MuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IGNoaWxkIGNoaWxkIGNvbXBvbmVudCB5b3UnZCBsaWtlIHRvIGNsb25lXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgcHJvcHMgeW91J2QgbGlrZSB0byBtb2RpZnkuIFRoZXkgd2lsbCBiZSBtZXJnZWRcbiAqIGFzIGlmIHlvdSB1c2VkIGB0cmFuc2ZlclByb3BzVG8oKWAuXG4gKiBAcmV0dXJuIHtvYmplY3R9IGEgY2xvbmUgb2YgY2hpbGQgd2l0aCBwcm9wcyBtZXJnZWQgaW4uXG4gKi9cbmZ1bmN0aW9uIGNsb25lV2l0aFByb3BzKGNoaWxkLCBwcm9wcykge1xuICB2YXIgbmV3UHJvcHMgPSBSZWFjdFByb3BUcmFuc2ZlcmVyLm1lcmdlUHJvcHMocHJvcHMsIGNoaWxkLnByb3BzKTtcblxuICAvLyBVc2UgYGNoaWxkLnByb3BzLmNoaWxkcmVuYCBpZiBpdCBpcyBwcm92aWRlZC5cbiAgaWYgKCFuZXdQcm9wcy5oYXNPd25Qcm9wZXJ0eShDSElMRFJFTl9QUk9QKSAmJlxuICAgIGNoaWxkLnByb3BzLmhhc093blByb3BlcnR5KENISUxEUkVOX1BST1ApKSB7XG4gICAgbmV3UHJvcHMuY2hpbGRyZW4gPSBjaGlsZC5wcm9wcy5jaGlsZHJlbjtcbiAgfVxuXG4gIC8vIEh1Z2UgaGFjayB0byBzdXBwb3J0IGJvdGggdGhlIDAuMTAgQVBJIGFuZCB0aGUgbmV3IHdheSBvZiBkb2luZyB0aGluZ3NcbiAgLy8gVE9ETzogcmVtb3ZlIHdoZW4gc3VwcG9ydCBmb3IgMC4xMCBpcyBubyBsb25nZXIgbmVlZGVkXG4gIGlmIChSZWFjdC52ZXJzaW9uLmluZGV4T2YoJzAuMTAuJykgPT09IDApIHtcbiAgICByZXR1cm4gY2hpbGQuY29uc3RydWN0b3IuQ29udmVuaWVuY2VDb25zdHJ1Y3RvcihuZXdQcm9wcyk7XG4gIH1cblxuXG4gIC8vIFRoZSBjdXJyZW50IEFQSSBkb2Vzbid0IHJldGFpbiBfb3duZXIgYW5kIF9jb250ZXh0LCB3aGljaCBpcyB3aHkgdGhpc1xuICAvLyBkb2Vzbid0IHVzZSBSZWFjdERlc2NyaXB0b3IuY2xvbmVBbmRSZXBsYWNlUHJvcHMuXG4gIHJldHVybiBjaGlsZC5jb25zdHJ1Y3RvcihuZXdQcm9wcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xvbmVXaXRoUHJvcHM7IiwiLyoqXG4gKiBTYWZlIGNoYWluZWQgZnVuY3Rpb25cbiAqXG4gKiBXaWxsIG9ubHkgY3JlYXRlIGEgbmV3IGZ1bmN0aW9uIGlmIG5lZWRlZCxcbiAqIG90aGVyd2lzZSB3aWxsIHBhc3MgYmFjayBleGlzdGluZyBmdW5jdGlvbnMgb3IgbnVsbC5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBvbmVcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHR3b1xuICogQHJldHVybnMge2Z1bmN0aW9ufG51bGx9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNoYWluZWRGdW5jdGlvbihvbmUsIHR3bykge1xuICB2YXIgaGFzT25lID0gdHlwZW9mIG9uZSA9PT0gJ2Z1bmN0aW9uJztcbiAgdmFyIGhhc1R3byA9IHR5cGVvZiB0d28gPT09ICdmdW5jdGlvbic7XG5cbiAgaWYgKCFoYXNPbmUgJiYgIWhhc1R3bykgeyByZXR1cm4gbnVsbDsgfVxuICBpZiAoIWhhc09uZSkgeyByZXR1cm4gdHdvOyB9XG4gIGlmICghaGFzVHdvKSB7IHJldHVybiBvbmU7IH1cblxuICByZXR1cm4gZnVuY3Rpb24gY2hhaW5lZEZ1bmN0aW9uKCkge1xuICAgIG9uZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHR3by5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbjsiLCJcbi8qKlxuICogU2hvcnRjdXQgdG8gY29tcHV0ZSBlbGVtZW50IHN0eWxlXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbVxuICogQHJldHVybnMge0Nzc1N0eWxlfVxuICovXG5mdW5jdGlvbiBnZXRDb21wdXRlZFN0eWxlcyhlbGVtKSB7XG4gIHJldHVybiBlbGVtLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtLCBudWxsKTtcbn1cblxuLyoqXG4gKiBHZXQgZWxlbWVudHMgb2Zmc2V0XG4gKlxuICogVE9ETzogUkVNT1ZFIEpRVUVSWSFcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBET01Ob2RlXG4gKiBAcmV0dXJucyB7e3RvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXJ9fVxuICovXG5mdW5jdGlvbiBnZXRPZmZzZXQoRE9NTm9kZSkge1xuICBpZiAod2luZG93LmpRdWVyeSkge1xuICAgIHJldHVybiB3aW5kb3cualF1ZXJ5KERPTU5vZGUpLm9mZnNldCgpO1xuICB9XG5cbiAgdmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIHZhciBib3ggPSB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG4gIC8vIElmIHdlIGRvbid0IGhhdmUgZ0JDUiwganVzdCB1c2UgMCwwIHJhdGhlciB0aGFuIGVycm9yXG4gIC8vIEJsYWNrQmVycnkgNSwgaU9TIDMgKG9yaWdpbmFsIGlQaG9uZSlcbiAgaWYgKCB0eXBlb2YgRE9NTm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QgIT09ICd1bmRlZmluZWQnICkge1xuICAgIGJveCA9IERPTU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRvcDogYm94LnRvcCArIHdpbmRvdy5wYWdlWU9mZnNldCAtIGRvY0VsZW0uY2xpZW50VG9wLFxuICAgIGxlZnQ6IGJveC5sZWZ0ICsgd2luZG93LnBhZ2VYT2Zmc2V0IC0gZG9jRWxlbS5jbGllbnRMZWZ0XG4gIH07XG59XG5cbi8qKlxuICogR2V0IGVsZW1lbnRzIHBvc2l0aW9uXG4gKlxuICogVE9ETzogUkVNT1ZFIEpRVUVSWSFcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50P30gb2Zmc2V0UGFyZW50XG4gKiBAcmV0dXJucyB7e3RvcDogbnVtYmVyLCBsZWZ0OiBudW1iZXJ9fVxuICovXG5mdW5jdGlvbiBnZXRQb3NpdGlvbihlbGVtLCBvZmZzZXRQYXJlbnQpIHtcbiAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcbiAgICByZXR1cm4gd2luZG93LmpRdWVyeShlbGVtKS5wb3NpdGlvbigpO1xuICB9XG5cbiAgdmFyIG9mZnNldCxcbiAgICAgIHBhcmVudE9mZnNldCA9IHt0b3A6IDAsIGxlZnQ6IDB9O1xuXG4gIC8vIEZpeGVkIGVsZW1lbnRzIGFyZSBvZmZzZXQgZnJvbSB3aW5kb3cgKHBhcmVudE9mZnNldCA9IHt0b3A6MCwgbGVmdDogMH0sIGJlY2F1c2UgaXQgaXMgaXRzIG9ubHkgb2Zmc2V0IHBhcmVudFxuICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkucG9zaXRpb24gPT09ICdmaXhlZCcgKSB7XG4gICAgLy8gV2UgYXNzdW1lIHRoYXQgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGF2YWlsYWJsZSB3aGVuIGNvbXB1dGVkIHBvc2l0aW9uIGlzIGZpeGVkXG4gICAgb2Zmc2V0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICB9IGVsc2Uge1xuICAgIGlmICghb2Zmc2V0UGFyZW50KSB7XG4gICAgICAvLyBHZXQgKnJlYWwqIG9mZnNldFBhcmVudFxuICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50KGVsZW0pO1xuICAgIH1cblxuICAgIC8vIEdldCBjb3JyZWN0IG9mZnNldHNcbiAgICBvZmZzZXQgPSBnZXRPZmZzZXQoZWxlbSk7XG4gICAgaWYgKCBvZmZzZXRQYXJlbnQubm9kZU5hbWUgIT09ICdIVE1MJykge1xuICAgICAgcGFyZW50T2Zmc2V0ID0gZ2V0T2Zmc2V0KG9mZnNldFBhcmVudCk7XG4gICAgfVxuXG4gICAgLy8gQWRkIG9mZnNldFBhcmVudCBib3JkZXJzXG4gICAgcGFyZW50T2Zmc2V0LnRvcCArPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhvZmZzZXRQYXJlbnQpLmJvcmRlclRvcFdpZHRoLCAxMCk7XG4gICAgcGFyZW50T2Zmc2V0LmxlZnQgKz0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5ib3JkZXJMZWZ0V2lkdGgsIDEwKTtcbiAgfVxuXG4gIC8vIFN1YnRyYWN0IHBhcmVudCBvZmZzZXRzIGFuZCBlbGVtZW50IG1hcmdpbnNcbiAgcmV0dXJuIHtcbiAgICB0b3A6IG9mZnNldC50b3AgLSBwYXJlbnRPZmZzZXQudG9wIC0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkubWFyZ2luVG9wLCAxMCksXG4gICAgbGVmdDogb2Zmc2V0LmxlZnQgLSBwYXJlbnRPZmZzZXQubGVmdCAtIHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLm1hcmdpbkxlZnQsIDEwKVxuICB9O1xufVxuXG4vKipcbiAqIEdldCBwYXJlbnQgZWxlbWVudFxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnQ/fSBlbGVtXG4gKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gKi9cbmZ1bmN0aW9uIG9mZnNldFBhcmVudChlbGVtKSB7XG4gIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB2YXIgb2Zmc2V0UGFyZW50ID0gZWxlbS5vZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcblxuICB3aGlsZSAoIG9mZnNldFBhcmVudCAmJiAoIG9mZnNldFBhcmVudC5ub2RlTmFtZSAhPT0gJ0hUTUwnICYmXG4gICAgZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5wb3NpdGlvbiA9PT0gJ3N0YXRpYycgKSApIHtcbiAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xuICB9XG5cbiAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBkb2NFbGVtO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q29tcHV0ZWRTdHlsZXM6IGdldENvbXB1dGVkU3R5bGVzLFxuICBnZXRPZmZzZXQ6IGdldE9mZnNldCxcbiAgZ2V0UG9zaXRpb246IGdldFBvc2l0aW9uLFxuICBvZmZzZXRQYXJlbnQ6IG9mZnNldFBhcmVudFxufTsiLCIvKipcbiAqIE1lcmdlIGhlbHBlclxuICpcbiAqIFRPRE86IHRvIGJlIHJlcGxhY2VkIHdpdGggRVM2J3MgYE9iamVjdC5hc3NpZ24oKWAgZm9yIFJlYWN0IDAuMTJcbiAqL1xuXG4vKipcbiAqIFNoYWxsb3cgbWVyZ2VzIHR3byBzdHJ1Y3R1cmVzIGJ5IG11dGF0aW5nIHRoZSBmaXJzdCBwYXJhbWV0ZXIuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9uZSBPYmplY3QgdG8gYmUgbWVyZ2VkIGludG8uXG4gKiBAcGFyYW0gez9vYmplY3R9IHR3byBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKi9cbmZ1bmN0aW9uIG1lcmdlSW50byhvbmUsIHR3bykge1xuICBpZiAodHdvICE9IG51bGwpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gdHdvKSB7XG4gICAgICBpZiAoIXR3by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgb25lW2tleV0gPSB0d29ba2V5XTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTaGFsbG93IG1lcmdlcyB0d28gc3RydWN0dXJlcyBpbnRvIGEgcmV0dXJuIHZhbHVlLCB3aXRob3V0IG11dGF0aW5nIGVpdGhlci5cbiAqXG4gKiBAcGFyYW0gez9vYmplY3R9IG9uZSBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKiBAcGFyYW0gez9vYmplY3R9IHR3byBPcHRpb25hbCBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIHRvIG1lcmdlIGZyb20uXG4gKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBzaGFsbG93IGV4dGVuc2lvbiBvZiBvbmUgYnkgdHdvLlxuICovXG5mdW5jdGlvbiBtZXJnZShvbmUsIHR3bykge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIG1lcmdlSW50byhyZXN1bHQsIG9uZSk7XG4gIG1lcmdlSW50byhyZXN1bHQsIHR3byk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2U7IiwiLy8gICAgIFVuZGVyc2NvcmUuanMgMS43LjBcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0LlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjcuMCc7XG5cbiAgLy8gSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFuIGVmZmljaWVudCAoZm9yIGN1cnJlbnQgZW5naW5lcykgdmVyc2lvblxuICAvLyBvZiB0aGUgcGFzc2VkLWluIGNhbGxiYWNrLCB0byBiZSByZXBlYXRlZGx5IGFwcGxpZWQgaW4gb3RoZXIgVW5kZXJzY29yZVxuICAvLyBmdW5jdGlvbnMuXG4gIHZhciBjcmVhdGVDYWxsYmFjayA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKGNvbnRleHQgPT09IHZvaWQgMCkgcmV0dXJuIGZ1bmM7XG4gICAgc3dpdGNoIChhcmdDb3VudCA9PSBudWxsID8gMyA6IGFyZ0NvdW50KSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgb3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgb3RoZXIpO1xuICAgICAgfTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbik7XG4gICAgICB9O1xuICAgICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYWNjdW11bGF0b3IsIHZhbHVlLCBpbmRleCwgY29sbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEEgbW9zdGx5LWludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGNhbGxiYWNrcyB0aGF0IGNhbiBiZSBhcHBsaWVkXG4gIC8vIHRvIGVhY2ggZWxlbWVudCBpbiBhIGNvbGxlY3Rpb24sIHJldHVybmluZyB0aGUgZGVzaXJlZCByZXN1bHQg4oCUIGVpdGhlclxuICAvLyBpZGVudGl0eSwgYW4gYXJiaXRyYXJ5IGNhbGxiYWNrLCBhIHByb3BlcnR5IG1hdGNoZXIsIG9yIGEgcHJvcGVydHkgYWNjZXNzb3IuXG4gIF8uaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuIF8uaWRlbnRpdHk7XG4gICAgaWYgKF8uaXNGdW5jdGlvbih2YWx1ZSkpIHJldHVybiBjcmVhdGVDYWxsYmFjayh2YWx1ZSwgY29udGV4dCwgYXJnQ291bnQpO1xuICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkgcmV0dXJuIF8ubWF0Y2hlcyh2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucHJvcGVydHkodmFsdWUpO1xuICB9O1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgcmF3IG9iamVjdHMgaW4gYWRkaXRpb24gdG8gYXJyYXktbGlrZXMuIFRyZWF0cyBhbGxcbiAgLy8gc3BhcnNlIGFycmF5LWxpa2VzIGFzIGlmIHRoZXkgd2VyZSBkZW5zZS5cbiAgXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIG9iajtcbiAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgaSwgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoID09PSArbGVuZ3RoKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2ldLCBpLCBvYmopO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yIChpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpdGVyYXRlZShvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRlZSB0byBlYWNoIGVsZW1lbnQuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIFtdO1xuICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSBvYmoubGVuZ3RoICE9PSArb2JqLmxlbmd0aCAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIHJlc3VsdHMgPSBBcnJheShsZW5ndGgpLFxuICAgICAgICBjdXJyZW50S2V5O1xuICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIHJlc3VsdHNbaW5kZXhdID0gaXRlcmF0ZWUob2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGl0ZXJhdGVlID0gY3JlYXRlQ2FsbGJhY2soaXRlcmF0ZWUsIGNvbnRleHQsIDQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICBpbmRleCA9IDAsIGN1cnJlbnRLZXk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICBpZiAoIWxlbmd0aCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgICBtZW1vID0gb2JqW2tleXMgPyBrZXlzW2luZGV4KytdIDogaW5kZXgrK107XG4gICAgfVxuICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgbWVtbyA9IGl0ZXJhdGVlKG1lbW8sIG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgbWVtbywgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaXRlcmF0ZWUgPSBjcmVhdGVDYWxsYmFjayhpdGVyYXRlZSwgY29udGV4dCwgNCk7XG4gICAgdmFyIGtleXMgPSBvYmoubGVuZ3RoICE9PSArIG9iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGluZGV4ID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIGN1cnJlbnRLZXk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICBpZiAoIWluZGV4KSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICAgIG1lbW8gPSBvYmpba2V5cyA/IGtleXNbLS1pbmRleF0gOiAtLWluZGV4XTtcbiAgICB9XG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIG1lbW8gPSBpdGVyYXRlZShtZW1vLCBvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIF8uc29tZShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBwcmVkaWNhdGUgPSBfLml0ZXJhdGVlKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubmVnYXRlKF8uaXRlcmF0ZWUocHJlZGljYXRlKSksIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICBpbmRleCwgY3VycmVudEtleTtcbiAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIGlmICghcHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIHByZWRpY2F0ZSA9IF8uaXRlcmF0ZWUocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9IG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgaW5kZXgsIGN1cnJlbnRLZXk7XG4gICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAocHJlZGljYXRlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGgpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgcmV0dXJuIF8uaW5kZXhPZihvYmosIHRhcmdldCkgPj0gMDtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgXy5wcm9wZXJ0eShrZXkpKTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy5maW5kKG9iaiwgXy5tYXRjaGVzKGF0dHJzKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gLUluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSAtSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gb2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGggPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlID4gcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBfLml0ZXJhdGVlKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA+IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gLUluZmluaXR5ICYmIHJlc3VsdCA9PT0gLUluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IEluZmluaXR5LCBsYXN0Q29tcHV0ZWQgPSBJbmZpbml0eSxcbiAgICAgICAgdmFsdWUsIGNvbXB1dGVkO1xuICAgIGlmIChpdGVyYXRlZSA9PSBudWxsICYmIG9iaiAhPSBudWxsKSB7XG4gICAgICBvYmogPSBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICBpZiAodmFsdWUgPCByZXN1bHQpIHtcbiAgICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICAgIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgICAgaWYgKGNvbXB1dGVkIDwgbGFzdENvbXB1dGVkIHx8IGNvbXB1dGVkID09PSBJbmZpbml0eSAmJiByZXN1bHQgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgICAgbGFzdENvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYSBjb2xsZWN0aW9uLCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHNldCA9IG9iaiAmJiBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iaiA6IF8udmFsdWVzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IHNldC5sZW5ndGg7XG4gICAgdmFyIHNodWZmbGVkID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDAsIHJhbmQ7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oMCwgaW5kZXgpO1xuICAgICAgaWYgKHJhbmQgIT09IGluZGV4KSBzaHVmZmxlZFtpbmRleF0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gc2V0W2luZGV4XTtcbiAgICB9XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYSBjb2xsZWN0aW9uLlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSB7XG4gICAgICBpZiAob2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGgpIG9iaiA9IF8udmFsdWVzKG9iaik7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdGVlLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCB2YWx1ZSwga2V5KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIGlmIChfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldLnB1c2godmFsdWUpOyBlbHNlIHJlc3VsdFtrZXldID0gW3ZhbHVlXTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSsrOyBlbHNlIHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0ZWUob2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IGxvdyArIGhpZ2ggPj4+IDE7XG4gICAgICBpZiAoaXRlcmF0ZWUoYXJyYXlbbWlkXSkgPCB2YWx1ZSkgbG93ID0gbWlkICsgMTsgZWxzZSBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiBvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gU3BsaXQgYSBjb2xsZWN0aW9uIGludG8gdHdvIGFycmF5czogb25lIHdob3NlIGVsZW1lbnRzIGFsbCBzYXRpc2Z5IHRoZSBnaXZlblxuICAvLyBwcmVkaWNhdGUsIGFuZCBvbmUgd2hvc2UgZWxlbWVudHMgYWxsIGRvIG5vdCBzYXRpc2Z5IHRoZSBwcmVkaWNhdGUuXG4gIF8ucGFydGl0aW9uID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBwcmVkaWNhdGUgPSBfLml0ZXJhdGVlKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIHBhc3MgPSBbXSwgZmFpbCA9IFtdO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikge1xuICAgICAgKHByZWRpY2F0ZSh2YWx1ZSwga2V5LCBvYmopID8gcGFzcyA6IGZhaWwpLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBbcGFzcywgZmFpbF07XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVswXTtcbiAgICBpZiAobiA8IDApIHJldHVybiBbXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgTWF0aC5tYXgoMCwgYXJyYXkubGVuZ3RoIC0gKG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKSkpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChuID09IG51bGwgfHwgZ3VhcmQpIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIG4gPT0gbnVsbCB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIHN0cmljdCwgb3V0cHV0KSB7XG4gICAgaWYgKHNoYWxsb3cgJiYgXy5ldmVyeShpbnB1dCwgXy5pc0FycmF5KSkge1xuICAgICAgcmV0dXJuIGNvbmNhdC5hcHBseShvdXRwdXQsIGlucHV0KTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGlucHV0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdmFsdWUgPSBpbnB1dFtpXTtcbiAgICAgIGlmICghXy5pc0FycmF5KHZhbHVlKSAmJiAhXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCFzdHJpY3QpIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hhbGxvdykge1xuICAgICAgICBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgc3RyaWN0LCBvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgZmFsc2UsIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiBbXTtcbiAgICBpZiAoIV8uaXNCb29sZWFuKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdGVlO1xuICAgICAgaXRlcmF0ZWUgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpdGVyYXRlZSAhPSBudWxsKSBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaV07XG4gICAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgICAgaWYgKCFpIHx8IHNlZW4gIT09IHZhbHVlKSByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIHNlZW4gPSB2YWx1ZTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlcmF0ZWUpIHtcbiAgICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0ZWUodmFsdWUsIGksIGFycmF5KTtcbiAgICAgICAgaWYgKF8uaW5kZXhPZihzZWVuLCBjb21wdXRlZCkgPCAwKSB7XG4gICAgICAgICAgc2Vlbi5wdXNoKGNvbXB1dGVkKTtcbiAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoXy5pbmRleE9mKHJlc3VsdCwgdmFsdWUpIDwgMCkge1xuICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShmbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSwgdHJ1ZSwgW10pKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIFtdO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICB2YXIgYXJnc0xlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgaWYgKF8uY29udGFpbnMocmVzdWx0LCBpdGVtKSkgY29udGludWU7XG4gICAgICBmb3IgKHZhciBqID0gMTsgaiA8IGFyZ3NMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIV8uY29udGFpbnMoYXJndW1lbnRzW2pdLCBpdGVtKSkgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoaiA9PT0gYXJnc0xlbmd0aCkgcmVzdWx0LnB1c2goaXRlbSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gZmxhdHRlbihzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIHRydWUsIHRydWUsIFtdKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgIHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gW107XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KGFyZ3VtZW50cywgJ2xlbmd0aCcpLmxlbmd0aDtcbiAgICB2YXIgcmVzdWx0cyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJndW1lbnRzLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuIGl0ZW0gaW4gYW4gYXJyYXksXG4gIC8vIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaWR4ID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmICh0eXBlb2YgZnJvbSA9PSAnbnVtYmVyJykge1xuICAgICAgaWR4ID0gZnJvbSA8IDAgPyBpZHggKyBmcm9tICsgMSA6IE1hdGgubWluKGlkeCwgZnJvbSArIDEpO1xuICAgIH1cbiAgICB3aGlsZSAoLS1pZHggPj0gMCkgaWYgKGFycmF5W2lkeF0gPT09IGl0ZW0pIHJldHVybiBpZHg7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBzdGVwIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciByYW5nZSA9IEFycmF5KGxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBsZW5ndGg7IGlkeCsrLCBzdGFydCArPSBzdGVwKSB7XG4gICAgICByYW5nZVtpZHhdID0gc3RhcnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgQ3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdCaW5kIG11c3QgYmUgY2FsbGVkIG9uIGEgZnVuY3Rpb24nKTtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIEN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBDdG9yO1xuICAgICAgQ3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoXy5pc09iamVjdChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgICByZXR1cm4gYm91bmQ7XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC4gXyBhY3RzXG4gIC8vIGFzIGEgcGxhY2Vob2xkZXIsIGFsbG93aW5nIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMgdG8gYmUgcHJlLWZpbGxlZC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBib3VuZEFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHBvc2l0aW9uID0gMDtcbiAgICAgIHZhciBhcmdzID0gYm91bmRBcmdzLnNsaWNlKCk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gYXJncy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYXJnc1tpXSA9PT0gXykgYXJnc1tpXSA9IGFyZ3VtZW50c1twb3NpdGlvbisrXTtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChwb3NpdGlvbiA8IGFyZ3VtZW50cy5sZW5ndGgpIGFyZ3MucHVzaChhcmd1bWVudHNbcG9zaXRpb24rK10pO1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGEgbnVtYmVyIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFJlbWFpbmluZyBhcmd1bWVudHNcbiAgLy8gYXJlIHRoZSBtZXRob2QgbmFtZXMgdG8gYmUgYm91bmQuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdCBhbGwgY2FsbGJhY2tzXG4gIC8vIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGksIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsIGtleTtcbiAgICBpZiAobGVuZ3RoIDw9IDEpIHRocm93IG5ldyBFcnJvcignYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lcycpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAga2V5ID0gYXJndW1lbnRzW2ldO1xuICAgICAgb2JqW2tleV0gPSBfLmJpbmQob2JqW2tleV0sIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW9pemUgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIHZhciBjYWNoZSA9IG1lbW9pemUuY2FjaGU7XG4gICAgICB2YXIgYWRkcmVzcyA9IGhhc2hlciA/IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDoga2V5O1xuICAgICAgaWYgKCFfLmhhcyhjYWNoZSwgYWRkcmVzcykpIGNhY2hlW2FkZHJlc3NdID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIGNhY2hlW2FkZHJlc3NdO1xuICAgIH07XG4gICAgbWVtb2l6ZS5jYWNoZSA9IHt9O1xuICAgIHJldHVybiBtZW1vaXplO1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IF8ubm93KCk7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBfLm5vdygpO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuXG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IF8ubm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICAgIGlmIChsYXN0IDwgd2FpdCAmJiBsYXN0ID4gMCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBfLm5vdygpO1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gXy5wYXJ0aWFsKHdyYXBwZXIsIGZ1bmMpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBuZWdhdGVkIHZlcnNpb24gb2YgdGhlIHBhc3NlZC1pbiBwcmVkaWNhdGUuXG4gIF8ubmVnYXRlID0gZnVuY3Rpb24ocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICFwcmVkaWNhdGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgIHZhciBzdGFydCA9IGFyZ3MubGVuZ3RoIC0gMTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSA9IHN0YXJ0O1xuICAgICAgdmFyIHJlc3VsdCA9IGFyZ3Nbc3RhcnRdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB3aGlsZSAoaS0tKSByZXN1bHQgPSBhcmdzW2ldLmNhbGwodGhpcywgcmVzdWx0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGJlZm9yZSBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5iZWZvcmUgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHZhciBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzID4gMCkge1xuICAgICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnVuYyA9IG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBfLnBhcnRpYWwoXy5iZWZvcmUsIDIpO1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gW107XG4gICAgaWYgKG5hdGl2ZUtleXMpIHJldHVybiBuYXRpdmVLZXlzKG9iaik7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgdmFyIHNvdXJjZSwgcHJvcDtcbiAgICBmb3IgKHZhciBpID0gMSwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwgcHJvcCkpIHtcbiAgICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge30sIGtleTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpdGVyYXRlZSkpIHtcbiAgICAgIGl0ZXJhdGVlID0gY3JlYXRlQ2FsbGJhY2soaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IG9ialtrZXldO1xuICAgICAgICBpZiAoaXRlcmF0ZWUodmFsdWUsIGtleSwgb2JqKSkgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoW10sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgICBvYmogPSBuZXcgT2JqZWN0KG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBpZiAoa2V5IGluIG9iaikgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGl0ZXJhdGVlKSkge1xuICAgICAgaXRlcmF0ZWUgPSBfLm5lZ2F0ZShpdGVyYXRlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5tYXAoY29uY2F0LmFwcGx5KFtdLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpLCBTdHJpbmcpO1xuICAgICAgaXRlcmF0ZWUgPSBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhrZXlzLCBrZXkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIF8ucGljayhvYmosIGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHZvaWQgMCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCByZWd1bGFyIGV4cHJlc3Npb25zLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb2VyY2VkIHRvIHN0cmluZ3MgZm9yIGNvbXBhcmlzb24gKE5vdGU6ICcnICsgL2EvaSA9PT0gJy9hL2knKVxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gJycgKyBhID09PSAnJyArIGI7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLlxuICAgICAgICAvLyBPYmplY3QoTmFOKSBpcyBlcXVpdmFsZW50IHRvIE5hTlxuICAgICAgICBpZiAoK2EgIT09ICthKSByZXR1cm4gK2IgIT09ICtiO1xuICAgICAgICAvLyBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gK2EgPT09IDAgPyAxIC8gK2EgPT09IDEgLyBiIDogK2EgPT09ICtiO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09PSArYjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKFxuICAgICAgYUN0b3IgIT09IGJDdG9yICYmXG4gICAgICAvLyBIYW5kbGUgT2JqZWN0LmNyZWF0ZSh4KSBjYXNlc1xuICAgICAgJ2NvbnN0cnVjdG9yJyBpbiBhICYmICdjb25zdHJ1Y3RvcicgaW4gYiAmJlxuICAgICAgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIGFDdG9yIGluc3RhbmNlb2YgYUN0b3IgJiZcbiAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiBiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUsIHJlc3VsdDtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhhKSwga2V5O1xuICAgICAgc2l6ZSA9IGtleXMubGVuZ3RoO1xuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMgYmVmb3JlIGNvbXBhcmluZyBkZWVwIGVxdWFsaXR5LlxuICAgICAgcmVzdWx0ID0gXy5rZXlzKGIpLmxlbmd0aCA9PT0gc2l6ZTtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlclxuICAgICAgICAgIGtleSA9IGtleXNbc2l6ZV07XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzQXJndW1lbnRzKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdHlwZSA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgXy5lYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gXy5oYXMob2JqLCAnY2FsbGVlJyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS4gV29yayBhcm91bmQgYW4gSUUgMTEgYnVnLlxuICBpZiAodHlwZW9mIC8uLyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT0gJ2Z1bmN0aW9uJyB8fCBmYWxzZTtcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT09ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdGVlcy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIF8uY29uc3RhbnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuICB9O1xuXG4gIF8ubm9vcCA9IGZ1bmN0aW9uKCl7fTtcblxuICBfLnByb3BlcnR5ID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIHByZWRpY2F0ZSBmb3IgY2hlY2tpbmcgd2hldGhlciBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gc2V0IG9mIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLm1hdGNoZXMgPSBmdW5jdGlvbihhdHRycykge1xuICAgIHZhciBwYWlycyA9IF8ucGFpcnMoYXR0cnMpLCBsZW5ndGggPSBwYWlycy5sZW5ndGg7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaikge1xuICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gIWxlbmd0aDtcbiAgICAgIG9iaiA9IG5ldyBPYmplY3Qob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBhaXIgPSBwYWlyc1tpXSwga2V5ID0gcGFpclswXTtcbiAgICAgICAgaWYgKHBhaXJbMV0gIT09IG9ialtrZXldIHx8ICEoa2V5IGluIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0LCAxKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRlZShpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gQSAocG9zc2libHkgZmFzdGVyKSB3YXkgdG8gZ2V0IHRoZSBjdXJyZW50IHRpbWVzdGFtcCBhcyBhbiBpbnRlZ2VyLlxuICBfLm5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgfTtcblxuICAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0OycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICdgJzogJyYjeDYwOydcbiAgfTtcbiAgdmFyIHVuZXNjYXBlTWFwID0gXy5pbnZlcnQoZXNjYXBlTWFwKTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIHZhciBjcmVhdGVFc2NhcGVyID0gZnVuY3Rpb24obWFwKSB7XG4gICAgdmFyIGVzY2FwZXIgPSBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgcmV0dXJuIG1hcFttYXRjaF07XG4gICAgfTtcbiAgICAvLyBSZWdleGVzIGZvciBpZGVudGlmeWluZyBhIGtleSB0aGF0IG5lZWRzIHRvIGJlIGVzY2FwZWRcbiAgICB2YXIgc291cmNlID0gJyg/OicgKyBfLmtleXMobWFwKS5qb2luKCd8JykgKyAnKSc7XG4gICAgdmFyIHRlc3RSZWdleHAgPSBSZWdFeHAoc291cmNlKTtcbiAgICB2YXIgcmVwbGFjZVJlZ2V4cCA9IFJlZ0V4cChzb3VyY2UsICdnJyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgc3RyaW5nID0gc3RyaW5nID09IG51bGwgPyAnJyA6ICcnICsgc3RyaW5nO1xuICAgICAgcmV0dXJuIHRlc3RSZWdleHAudGVzdChzdHJpbmcpID8gc3RyaW5nLnJlcGxhY2UocmVwbGFjZVJlZ2V4cCwgZXNjYXBlcikgOiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbiAgXy5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKGVzY2FwZU1hcCk7XG4gIF8udW5lc2NhcGUgPSBjcmVhdGVFc2NhcGVyKHVuZXNjYXBlTWFwKTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyBvYmplY3RbcHJvcGVydHldKCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIHZhciBlc2NhcGVDaGFyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07XG4gIH07XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgLy8gTkI6IGBvbGRTZXR0aW5nc2Agb25seSBleGlzdHMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgc2V0dGluZ3MsIG9sZFNldHRpbmdzKSB7XG4gICAgaWYgKCFzZXR0aW5ncyAmJiBvbGRTZXR0aW5ncykgc2V0dGluZ3MgPSBvbGRTZXR0aW5ncztcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpLnJlcGxhY2UoZXNjYXBlciwgZXNjYXBlQ2hhcik7XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfSBlbHNlIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cblxuICAgICAgLy8gQWRvYmUgVk1zIG5lZWQgdGhlIG1hdGNoIHJldHVybmVkIHRvIHByb2R1Y2UgdGhlIGNvcnJlY3Qgb2ZmZXN0LlxuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgJ3JldHVybiBfX3A7XFxuJztcblxuICAgIHRyeSB7XG4gICAgICB2YXIgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHZhciBhcmd1bWVudCA9IHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonO1xuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgYXJndW1lbnQgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbi4gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGluc3RhbmNlID0gXyhvYmopO1xuICAgIGluc3RhbmNlLl9jaGFpbiA9IHRydWU7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBfLmVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgXy5lYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09PSAnc2hpZnQnIHx8IG5hbWUgPT09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgXy5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgfTtcblxuICAvLyBBTUQgcmVnaXN0cmF0aW9uIGhhcHBlbnMgYXQgdGhlIGVuZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIEFNRCBsb2FkZXJzXG4gIC8vIHRoYXQgbWF5IG5vdCBlbmZvcmNlIG5leHQtdHVybiBzZW1hbnRpY3Mgb24gbW9kdWxlcy4gRXZlbiB0aG91Z2ggZ2VuZXJhbFxuICAvLyBwcmFjdGljZSBmb3IgQU1EIHJlZ2lzdHJhdGlvbiBpcyB0byBiZSBhbm9ueW1vdXMsIHVuZGVyc2NvcmUgcmVnaXN0ZXJzXG4gIC8vIGFzIGEgbmFtZWQgbW9kdWxlIGJlY2F1c2UsIGxpa2UgalF1ZXJ5LCBpdCBpcyBhIGJhc2UgbGlicmFyeSB0aGF0IGlzXG4gIC8vIHBvcHVsYXIgZW5vdWdoIHRvIGJlIGJ1bmRsZWQgaW4gYSB0aGlyZCBwYXJ0eSBsaWIsIGJ1dCBub3QgYmUgcGFydCBvZlxuICAvLyBhbiBBTUQgbG9hZCByZXF1ZXN0LiBUaG9zZSBjYXNlcyBjb3VsZCBnZW5lcmF0ZSBhbiBlcnJvciB3aGVuIGFuXG4gIC8vIGFub255bW91cyBkZWZpbmUoKSBpcyBjYWxsZWQgb3V0c2lkZSBvZiBhIGxvYWRlciByZXF1ZXN0LlxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKCd1bmRlcnNjb3JlJywgW10sIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF87XG4gICAgfSk7XG4gIH1cbn0uY2FsbCh0aGlzKSk7XG4iLCJSZWFjdCA9IHJlcXVpcmUgXCJyZWFjdFwiXHJcbkJhY2tib25lTWl4aW4gPSByZXF1aXJlIFwiLi4vYmIubWl4aW5cIlxyXG5cclxue2RpdiwgdWwsIGxpLCBhLCB0aGVhZCwgdGJvZHksIHRyLCB0aCwgdGR9ID0gUmVhY3QuRE9NXHJcbntDb2wsIFRhYmJlZEFyZWEsIFRhYlBhbmUsIFRhYmxlfSA9IHJlcXVpcmUgXCJyZWFjdC1ib290c3RyYXBcIlxyXG5cclxuZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJzcWxhZG1pbjphZG1pblwiKVxyXG5cclxuXHJcbkFwcERhdGEgPSByZXF1aXJlKFwiLi4vYXBwZGF0YVwiKVxyXG5cclxuXHJcbkRhdGFiYXNlTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzIHtcclxuXHJcbiAgbWl4aW5zOiBbQmFja2JvbmVNaXhpbl1cclxuXHJcbiAgZ2V0QmFja2JvbmVNb2RlbHM6ICgpIC0+XHJcbiAgICBbQXBwRGF0YSwgQXBwRGF0YS5nZXQoXCJkYXRhYmFzZXNcIildXHJcblxyXG4gIG9uSXRlbUNsaWNrOiAoZGJuYW1lKSAtPlxyXG4gICAgcmV0dXJuICgpIC0+XHJcbiAgICAgIEFwcERhdGEuc2V0IFwic2VsZWN0ZWRkYlwiLCBkYm5hbWVcclxuXHJcbiAgcmVuZGVyOiAoKSAtPlxyXG4gICAgaXRlbXMgPSBBcHBEYXRhLmdldChcImRhdGFiYXNlc1wiKS5tYXAgKGRiKSA9PlxyXG4gICAgICBkYm5hbWUgPSBkYi5nZXQgXCJuYW1lXCJcclxuICAgICAgYWN0aXZlQ2xhc3MgPSBpZiBkYm5hbWUgaXMgQXBwRGF0YS5nZXQoXCJzZWxlY3RlZGRiXCIpIHRoZW4gXCJhY3RpdmVcIiBlbHNlIFwiXCJcclxuICAgICAgaXRlbU9wdHMgPSB7XHJcbiAgICAgICAgY2xhc3NOYW1lOiBcImxpc3QtZ3JvdXAtaXRlbSAje2FjdGl2ZUNsYXNzfVwiXHJcbiAgICAgICAgaHJlZjpcImphdmFzY3JpcHQ6O1wiXHJcbiAgICAgICAgb25DbGljazogQG9uSXRlbUNsaWNrKGRibmFtZSlcclxuICAgICAgfVxyXG4gICAgICBhIGl0ZW1PcHRzLCBkYi5nZXQgXCJuYW1lXCJcclxuICAgIGRpdiB7IGNsYXNzTmFtZTogXCJsaXN0LWdyb3VwXCIgfSxcclxuICAgICAgaXRlbXNcclxuXHJcbn1cclxuXHJcblRhYmxlc0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyB7XHJcbiAgbWl4aW5zOiBbQmFja2JvbmVNaXhpbl1cclxuXHJcbiAgZ2V0QmFja2JvbmVNb2RlbHM6ICgpIC0+XHJcbiAgICBbQXBwRGF0YS5nZXQoXCJ0YWJsZXNcIildXHJcbiAgcmVuZGVyOiAtPlxyXG4gICAgVGFibGUgeyBzdHJpcGVkOiB0cnVlLCBib3JkZXJlZDogdHJ1ZSwgaG92ZXI6IHRydWUgfSxcclxuICAgICAgdGhlYWQge30sXHJcbiAgICAgICAgdHIge30sXHJcbiAgICAgICAgICB0aCB7fSwgXCJTY2hlbWFcIlxyXG4gICAgICAgICAgdGgge30sIFwiVGFibGUgTmFtZVwiXHJcbiAgICAgIHRib2R5IHt9LFxyXG4gICAgICAgIEFwcERhdGEuZ2V0KFwidGFibGVzXCIpLm1hcCAodGFibGUpIC0+XHJcbiAgICAgICAgICB0ciB7fSxcclxuICAgICAgICAgICAgdGQge30sIHRhYmxlLmdldCBcInNjaGVtYVwiXHJcbiAgICAgICAgICAgIHRkIHt9LCB0YWJsZS5nZXQgXCJuYW1lXCJcclxufVxyXG5cclxuXHJcbkRhdGFiYXNlVGFicyA9IFJlYWN0LmNyZWF0ZUNsYXNzIHtcclxuICByZW5kZXI6IC0+XHJcbiAgICBUYWJiZWRBcmVhIHtkZWZhdWx0QWN0aXZlS2V5OiAxfSxcclxuICAgICAgVGFiUGFuZSB7a2V5OiAxLCB0YWI6IFwiVGFibGVzXCJ9LFxyXG4gICAgICAgIFRhYmxlc0xpc3Qge31cclxuICAgICAgVGFiUGFuZSB7a2V5OiAxLCB0YWI6IFwiT3RoZXJcIn0sXHJcbiAgICAgICAgZGl2IHt9LCBcIk90aGVyIHN0dWZmXCJcclxuXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdC5jcmVhdGVDbGFzcyB7XHJcbiAgcmVuZGVyOiAoKSAtPlxyXG4gICAgZGl2IHsgY2xhc3NOYW1lOiBcImNvbnRhaW5lclwifSxcclxuICAgICAgQ29sIHsgeHM6IDEyLCBzbTogMyB9LFxyXG4gICAgICAgIERhdGFiYXNlTGlzdCB7IH1cclxuICAgICAgQ29sIHsgeHM6IDEyLCBzbTogOSB9LFxyXG4gICAgICAgIERhdGFiYXNlVGFicyB7IH1cclxufVxyXG4iXX0=
