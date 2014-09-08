require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Backbone, Database, DatabaseCollection, jQuery,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

jQuery = (window.$ || jQuery);

Backbone = require("backbone");

Backbone.$ = jQuery;

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

module.exports = {
  model: Database,
  collection: DatabaseCollection
};



},{"backbone":2}],2:[function(require,module,exports){
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

},{"underscore":63}],3:[function(require,module,exports){

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

},{"./debug":4}],4:[function(require,module,exports){

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

},{"ms":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
},{"./PanelGroup":41}],7:[function(require,module,exports){
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
},{"./AffixMixin":8,"./utils/domUtils":61}],8:[function(require,module,exports){
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
},{"./utils/EventListener":55,"./utils/domUtils":61}],9:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],10:[function(require,module,exports){
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

},{"./utils/ValidComponentChildren":57,"./utils/classSet":58}],11:[function(require,module,exports){
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
},{"./constants":52}],12:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],13:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./Button":12,"./utils/classSet":58}],14:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./Button":12,"./utils/classSet":58}],15:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59}],16:[function(require,module,exports){
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
},{"./utils/TransitionEvents":56,"./utils/classSet":58}],17:[function(require,module,exports){
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
},{"./constants":52,"./utils/CustomPropTypes":54,"./utils/classSet":58}],18:[function(require,module,exports){
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
},{"./utils/TransitionEvents":56}],19:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./Button":12,"./ButtonGroup":13,"./DropdownMenu":20,"./DropdownStateMixin":21,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],20:[function(require,module,exports){
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
},{"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],21:[function(require,module,exports){
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
},{"./utils/EventListener":55}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./constants":52,"./utils/classSet":58}],24:[function(require,module,exports){
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
},{"./utils/CustomPropTypes":54}],25:[function(require,module,exports){
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

},{"./utils/classSet":58}],26:[function(require,module,exports){
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

},{"./utils/ValidComponentChildren":57,"./utils/merge":62}],27:[function(require,module,exports){
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
},{}],28:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],29:[function(require,module,exports){
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
},{"./utils/classSet":58}],30:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./FadeMixin":22,"./utils/EventListener":55,"./utils/classSet":58}],31:[function(require,module,exports){
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
},{"./OverlayMixin":35,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],32:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./CollapsableMixin":18,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60,"./utils/domUtils":61}],33:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],34:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./Nav":32,"./utils/CustomPropTypes":54,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],35:[function(require,module,exports){
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

},{"./utils/CustomPropTypes":54}],36:[function(require,module,exports){
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
},{"./OverlayMixin":35,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60,"./utils/domUtils":61,"./utils/merge":62}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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
},{"./utils/classSet":58}],39:[function(require,module,exports){
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
},{"./utils/ValidComponentChildren":57,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],40:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./CollapsableMixin":18,"./utils/classSet":58,"./utils/cloneWithProps":59}],41:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59}],42:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],43:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./Interpolate":26,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59}],44:[function(require,module,exports){
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
},{"./utils/CustomPropTypes":54}],45:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./Button":12,"./ButtonGroup":13,"./DropdownMenu":20,"./DropdownStateMixin":21,"./utils/classSet":58}],46:[function(require,module,exports){
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

},{"./BootstrapMixin":11,"./utils/ValidComponentChildren":57,"./utils/classSet":58,"./utils/cloneWithProps":59,"./utils/createChainedFunction":60}],47:[function(require,module,exports){
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
},{"./utils/TransitionEvents":56,"./utils/classSet":58}],48:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./Nav":32,"./NavItem":33,"./utils/ValidComponentChildren":57,"./utils/cloneWithProps":59}],49:[function(require,module,exports){
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
},{"./utils/classSet":58}],50:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],51:[function(require,module,exports){
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
},{"./BootstrapMixin":11,"./utils/classSet":58}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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
},{"./Accordion":6,"./Affix":7,"./AffixMixin":8,"./Alert":9,"./Badge":10,"./BootstrapMixin":11,"./Button":12,"./ButtonGroup":13,"./ButtonToolbar":14,"./Carousel":15,"./CarouselItem":16,"./Col":17,"./CollapsableMixin":18,"./DropdownButton":19,"./DropdownMenu":20,"./DropdownStateMixin":21,"./FadeMixin":22,"./Glyphicon":23,"./Grid":24,"./Input":25,"./Interpolate":26,"./Jumbotron":27,"./Label":28,"./MenuItem":29,"./Modal":30,"./ModalTrigger":31,"./Nav":32,"./NavItem":33,"./Navbar":34,"./OverlayMixin":35,"./OverlayTrigger":36,"./PageHeader":37,"./PageItem":38,"./Pager":39,"./Panel":40,"./PanelGroup":41,"./Popover":42,"./ProgressBar":43,"./Row":44,"./SplitButton":45,"./SubNav":46,"./TabPane":47,"./TabbedArea":48,"./Table":49,"./Tooltip":50,"./Well":51}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
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
},{"./merge":62}],60:[function(require,module,exports){
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
},{}],61:[function(require,module,exports){

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
},{}],62:[function(require,module,exports){
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
},{}],63:[function(require,module,exports){
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
var BackboneMixin, Col, DatabaseList, React, a, backbone, database, debug, div, li, ul, _, _ref;

React = (window.React || React);

_ = require("underscore");

backbone = require("backbone");

database = require("../models/database");

debug = require("debug")("sqladmin:admin");

_ref = React.DOM, div = _ref.div, ul = _ref.ul, li = _ref.li, a = _ref.a;

Col = require("react-bootstrap").Col;

BackboneMixin = {
  componentDidMount: function() {
    var func;
    func = function(model) {
      return model.on("add change remove", this.forceUpdate.bind(this, null), this);
    };
    return this.getBackboneModels().forEach(func, this);
  },
  componentWillUnmount: function() {
    var func;
    func = function(model) {
      return model.off(null, null, this);
    };
    return this.getBackboneModels().forEach(func, this);
  }
};

DatabaseList = React.createClass({
  mixins: [BackboneMixin],
  getInitialState: function() {
    return {
      selected: "postgres"
    };
  },
  getBackboneModels: function() {
    return [this.props.databases];
  },
  componentDidMount: function() {
    return this.props.databases.fetch();
  },
  render: function() {
    var items;
    items = this.props.databases.map((function(_this) {
      return function(db) {
        var activeClass, dbname, itemOpts;
        dbname = db.get("name");
        activeClass = dbname === _this.state.selected ? "active" : "";
        itemOpts = {
          className: "list-group-item " + activeClass,
          href: "javscript:;"
        };
        return a({}, db.get("name"));
      };
    })(this));
    return div({
      className: "list-group"
    }, items);
  }
});

module.exports = React.createClass({
  render: function() {
    return div({
      className: "container"
    }, DatabaseList({
      databases: new database.collection()
    }));
  }
});



},{"../models/database":1,"backbone":2,"debug":3,"react-bootstrap":53,"underscore":63}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9jbGllbnQvbW9kZWxzL2RhdGFiYXNlLmNvZmZlZSIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9iYWNrYm9uZS9iYWNrYm9uZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9kZWJ1Zy9icm93c2VyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL2RlYnVnL2RlYnVnLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL2RlYnVnL25vZGVfbW9kdWxlcy9tcy9pbmRleC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWNjb3JkaW9uLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9BZmZpeC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWZmaXhNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQWxlcnQuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0JhZGdlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Cb290c3RyYXBNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9CdXR0b25Hcm91cC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQnV0dG9uVG9vbGJhci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ2Fyb3VzZWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0Nhcm91c2VsSXRlbS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvQ29sLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Db2xsYXBzYWJsZU1peGluLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Ecm9wZG93bkJ1dHRvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvRHJvcGRvd25NZW51LmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Ecm9wZG93blN0YXRlTWl4aW4uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0ZhZGVNaXhpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvR2x5cGhpY29uLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9HcmlkLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9JbnB1dC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvSW50ZXJwb2xhdGUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL0p1bWJvdHJvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTGFiZWwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL01lbnVJdGVtLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9Nb2RhbC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvTW9kYWxUcmlnZ2VyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9OYXYuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL05hdkl0ZW0uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL05hdmJhci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvT3ZlcmxheU1peGluLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9PdmVybGF5VHJpZ2dlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFnZUhlYWRlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFnZUl0ZW0uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1BhZ2VyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC9QYW5lbC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUGFuZWxHcm91cC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUG9wb3Zlci5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvUHJvZ3Jlc3NCYXIuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Jvdy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvU3BsaXRCdXR0b24uanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1N1Yk5hdi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvVGFiUGFuZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvVGFiYmVkQXJlYS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvVGFibGUuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1Rvb2x0aXAuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL1dlbGwuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL2NvbnN0YW50cy5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvbWFpbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvQ3VzdG9tUHJvcFR5cGVzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9FdmVudExpc3RlbmVyLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9UcmFuc2l0aW9uRXZlbnRzLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3JlYWN0LWJvb3RzdHJhcC91dGlscy9jbGFzc1NldC5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvY2xvbmVXaXRoUHJvcHMuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbi5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL25vZGVfbW9kdWxlcy9yZWFjdC1ib290c3RyYXAvdXRpbHMvZG9tVXRpbHMuanMiLCIvVXNlcnMvbW1ja2VuemllL0dpdGh1Yi9zcWxhZG1pbi9ub2RlX21vZHVsZXMvcmVhY3QtYm9vdHN0cmFwL3V0aWxzL21lcmdlLmpzIiwiL1VzZXJzL21tY2tlbnppZS9HaXRodWIvc3FsYWRtaW4vbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy9tbWNrZW56aWUvR2l0aHViL3NxbGFkbWluL2NsaWVudC9yZWFjdC9hZG1pbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFBLDhDQUFBO0VBQUE7aVNBQUE7O0FBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSLENBQVQsQ0FBQTs7QUFBQSxRQUNBLEdBQVcsT0FBQSxDQUFRLFVBQVIsQ0FEWCxDQUFBOztBQUFBLFFBRVEsQ0FBQyxDQUFULEdBQWEsTUFGYixDQUFBOztBQUFBO0FBS0UsNkJBQUEsQ0FBQTs7OztHQUFBOztBQUFBLHFCQUFBLFFBQUEsR0FDRTtBQUFBLElBQUEsSUFBQSxFQUFNLEVBQU47R0FERixDQUFBOztBQUFBLHFCQUVBLEdBQUEsR0FBSyxlQUZMLENBQUE7O2tCQUFBOztHQURxQixRQUFRLENBQUMsTUFKaEMsQ0FBQTs7QUFBQTtBQVVFLHVDQUFBLENBQUE7Ozs7R0FBQTs7QUFBQSwrQkFBQSxLQUFBLEdBQU8sUUFBUCxDQUFBOztBQUFBLCtCQUNBLEdBQUEsR0FBSyxnQkFETCxDQUFBOzs0QkFBQTs7R0FEK0IsUUFBUSxDQUFDLFdBVDFDLENBQUE7O0FBQUEsTUFhTSxDQUFDLE9BQVAsR0FBaUI7QUFBQSxFQUNmLEtBQUEsRUFBTyxRQURRO0FBQUEsRUFFZixVQUFBLEVBQVksa0JBRkc7Q0FiakIsQ0FBQTs7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4a0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y0Q0EsSUFBQSwyRkFBQTs7QUFBQSxLQUFBLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBUixDQUFBOztBQUFBLENBRUEsR0FBSSxPQUFBLENBQVEsWUFBUixDQUZKLENBQUE7O0FBQUEsUUFHQSxHQUFXLE9BQUEsQ0FBUSxVQUFSLENBSFgsQ0FBQTs7QUFBQSxRQUtBLEdBQVcsT0FBQSxDQUFRLG9CQUFSLENBTFgsQ0FBQTs7QUFBQSxLQU1BLEdBQVEsT0FBQSxDQUFRLE9BQVIsQ0FBQSxDQUFpQixnQkFBakIsQ0FOUixDQUFBOztBQUFBLE9BUW1CLEtBQUssQ0FBQyxHQUF6QixFQUFDLFdBQUEsR0FBRCxFQUFNLFVBQUEsRUFBTixFQUFVLFVBQUEsRUFBVixFQUFjLFNBQUEsQ0FSZCxDQUFBOztBQUFBLE1BVVEsT0FBQSxDQUFRLGlCQUFSLEVBQVAsR0FWRCxDQUFBOztBQUFBLGFBWUEsR0FBZ0I7QUFBQSxFQUNkLGlCQUFBLEVBQW1CLFNBQUEsR0FBQTtBQUNqQixRQUFBLElBQUE7QUFBQSxJQUFBLElBQUEsR0FBTyxTQUFDLEtBQUQsR0FBQTthQUNMLEtBQUssQ0FBQyxFQUFOLENBQVMsbUJBQVQsRUFBOEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxJQUFiLENBQWtCLElBQWxCLEVBQXFCLElBQXJCLENBQTlCLEVBQTBELElBQTFELEVBREs7SUFBQSxDQUFQLENBQUE7V0FFQSxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFvQixDQUFDLE9BQXJCLENBQTZCLElBQTdCLEVBQW1DLElBQW5DLEVBSGlCO0VBQUEsQ0FETDtBQUFBLEVBTWQsb0JBQUEsRUFBc0IsU0FBQSxHQUFBO0FBRXBCLFFBQUEsSUFBQTtBQUFBLElBQUEsSUFBQSxHQUFPLFNBQUMsS0FBRCxHQUFBO2FBQ0wsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLEVBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBREs7SUFBQSxDQUFQLENBQUE7V0FFQSxJQUFDLENBQUEsaUJBQUQsQ0FBQSxDQUFvQixDQUFDLE9BQXJCLENBQTZCLElBQTdCLEVBQW1DLElBQW5DLEVBSm9CO0VBQUEsQ0FOUjtDQVpoQixDQUFBOztBQUFBLFlBMEJBLEdBQWUsS0FBSyxDQUFDLFdBQU4sQ0FBa0I7QUFBQSxFQUMvQixNQUFBLEVBQVEsQ0FBQyxhQUFELENBRHVCO0FBQUEsRUFFL0IsZUFBQSxFQUFpQixTQUFBLEdBQUE7V0FDZjtBQUFBLE1BQ0UsUUFBQSxFQUFVLFVBRFo7TUFEZTtFQUFBLENBRmM7QUFBQSxFQU8vQixpQkFBQSxFQUFtQixTQUFBLEdBQUE7V0FDakIsQ0FBQyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVIsRUFEaUI7RUFBQSxDQVBZO0FBQUEsRUFVL0IsaUJBQUEsRUFBbUIsU0FBQSxHQUFBO1dBQ2pCLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQWpCLENBQUEsRUFEaUI7RUFBQSxDQVZZO0FBQUEsRUFjL0IsTUFBQSxFQUFRLFNBQUEsR0FBQTtBQUVOLFFBQUEsS0FBQTtBQUFBLElBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQWpCLENBQXFCLENBQUEsU0FBQSxLQUFBLEdBQUE7YUFBQSxTQUFDLEVBQUQsR0FBQTtBQUMzQixZQUFBLDZCQUFBO0FBQUEsUUFBQSxNQUFBLEdBQVMsRUFBRSxDQUFDLEdBQUgsQ0FBTyxNQUFQLENBQVQsQ0FBQTtBQUFBLFFBQ0EsV0FBQSxHQUFpQixNQUFBLEtBQVUsS0FBQyxDQUFBLEtBQUssQ0FBQyxRQUFwQixHQUFrQyxRQUFsQyxHQUFnRCxFQUQ5RCxDQUFBO0FBQUEsUUFFQSxRQUFBLEdBQVc7QUFBQSxVQUNULFNBQUEsRUFBWSxrQkFBQSxHQUFrQixXQURyQjtBQUFBLFVBRVQsSUFBQSxFQUFLLGFBRkk7U0FGWCxDQUFBO2VBTUEsQ0FBQSxDQUFFLEVBQUYsRUFBUSxFQUFFLENBQUMsR0FBSCxDQUFPLE1BQVAsQ0FBUixFQVAyQjtNQUFBLEVBQUE7SUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCLENBQVIsQ0FBQTtXQVFBLEdBQUEsQ0FBSTtBQUFBLE1BQUUsU0FBQSxFQUFXLFlBQWI7S0FBSixFQUNFLEtBREYsRUFWTTtFQUFBLENBZHVCO0NBQWxCLENBMUJmLENBQUE7O0FBQUEsTUEyRE0sQ0FBQyxPQUFQLEdBQWlCLEtBQUssQ0FBQyxXQUFOLENBQWtCO0FBQUEsRUFDakMsTUFBQSxFQUFRLFNBQUEsR0FBQTtXQUNOLEdBQUEsQ0FBSTtBQUFBLE1BQUUsU0FBQSxFQUFXLFdBQWI7S0FBSixFQUNFLFlBQUEsQ0FBYTtBQUFBLE1BQUUsU0FBQSxFQUFlLElBQUEsUUFBUSxDQUFDLFVBQVQsQ0FBQSxDQUFqQjtLQUFiLENBREYsRUFETTtFQUFBLENBRHlCO0NBQWxCLENBM0RqQixDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImpRdWVyeSA9IHJlcXVpcmUgXCJqcXVlcnlcIlxuQmFja2JvbmUgPSByZXF1aXJlIFwiYmFja2JvbmVcIlxuQmFja2JvbmUuJCA9IGpRdWVyeVxuXG5jbGFzcyBEYXRhYmFzZSBleHRlbmRzIEJhY2tib25lLk1vZGVsXG4gIGRlZmF1bHRzOlxuICAgIG5hbWU6IFwiXCJcbiAgdXJsOiBcIi9hcGkvZGF0YWJhc2VcIlxuXG5jbGFzcyBEYXRhYmFzZUNvbGxlY3Rpb24gZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG4gIG1vZGVsOiBEYXRhYmFzZVxuICB1cmw6IFwiL2FwaS9kYXRhYmFzZXNcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbW9kZWw6IERhdGFiYXNlLFxuICBjb2xsZWN0aW9uOiBEYXRhYmFzZUNvbGxlY3Rpb25cbn1cbiIsIi8vICAgICBCYWNrYm9uZS5qcyAxLjEuMlxuXG4vLyAgICAgKGMpIDIwMTAtMjAxNCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIEJhY2tib25lIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuLy8gICAgIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbjpcbi8vICAgICBodHRwOi8vYmFja2JvbmVqcy5vcmdcblxuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblxuICAvLyBTZXQgdXAgQmFja2JvbmUgYXBwcm9wcmlhdGVseSBmb3IgdGhlIGVudmlyb25tZW50LiBTdGFydCB3aXRoIEFNRC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ3VuZGVyc2NvcmUnLCAnanF1ZXJ5JywgJ2V4cG9ydHMnXSwgZnVuY3Rpb24oXywgJCwgZXhwb3J0cykge1xuICAgICAgLy8gRXhwb3J0IGdsb2JhbCBldmVuIGluIEFNRCBjYXNlIGluIGNhc2UgdGhpcyBzY3JpcHQgaXMgbG9hZGVkIHdpdGhcbiAgICAgIC8vIG90aGVycyB0aGF0IG1heSBzdGlsbCBleHBlY3QgYSBnbG9iYWwgQmFja2JvbmUuXG4gICAgICByb290LkJhY2tib25lID0gZmFjdG9yeShyb290LCBleHBvcnRzLCBfLCAkKTtcbiAgICB9KTtcblxuICAvLyBOZXh0IGZvciBOb2RlLmpzIG9yIENvbW1vbkpTLiBqUXVlcnkgbWF5IG5vdCBiZSBuZWVkZWQgYXMgYSBtb2R1bGUuXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdmFyIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG4gICAgZmFjdG9yeShyb290LCBleHBvcnRzLCBfKTtcblxuICAvLyBGaW5hbGx5LCBhcyBhIGJyb3dzZXIgZ2xvYmFsLlxuICB9IGVsc2Uge1xuICAgIHJvb3QuQmFja2JvbmUgPSBmYWN0b3J5KHJvb3QsIHt9LCByb290Ll8sIChyb290LmpRdWVyeSB8fCByb290LlplcHRvIHx8IHJvb3QuZW5kZXIgfHwgcm9vdC4kKSk7XG4gIH1cblxufSh0aGlzLCBmdW5jdGlvbihyb290LCBCYWNrYm9uZSwgXywgJCkge1xuXG4gIC8vIEluaXRpYWwgU2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgQmFja2JvbmVgIHZhcmlhYmxlLCBzbyB0aGF0IGl0IGNhbiBiZVxuICAvLyByZXN0b3JlZCBsYXRlciBvbiwgaWYgYG5vQ29uZmxpY3RgIGlzIHVzZWQuXG4gIHZhciBwcmV2aW91c0JhY2tib25lID0gcm9vdC5CYWNrYm9uZTtcblxuICAvLyBDcmVhdGUgbG9jYWwgcmVmZXJlbmNlcyB0byBhcnJheSBtZXRob2RzIHdlJ2xsIHdhbnQgdG8gdXNlIGxhdGVyLlxuICB2YXIgYXJyYXkgPSBbXTtcbiAgdmFyIHB1c2ggPSBhcnJheS5wdXNoO1xuICB2YXIgc2xpY2UgPSBhcnJheS5zbGljZTtcbiAgdmFyIHNwbGljZSA9IGFycmF5LnNwbGljZTtcblxuICAvLyBDdXJyZW50IHZlcnNpb24gb2YgdGhlIGxpYnJhcnkuIEtlZXAgaW4gc3luYyB3aXRoIGBwYWNrYWdlLmpzb25gLlxuICBCYWNrYm9uZS5WRVJTSU9OID0gJzEuMS4yJztcblxuICAvLyBGb3IgQmFja2JvbmUncyBwdXJwb3NlcywgalF1ZXJ5LCBaZXB0bywgRW5kZXIsIG9yIE15IExpYnJhcnkgKGtpZGRpbmcpIG93bnNcbiAgLy8gdGhlIGAkYCB2YXJpYWJsZS5cbiAgQmFja2JvbmUuJCA9ICQ7XG5cbiAgLy8gUnVucyBCYWNrYm9uZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgQmFja2JvbmVgIHZhcmlhYmxlXG4gIC8vIHRvIGl0cyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIEJhY2tib25lIG9iamVjdC5cbiAgQmFja2JvbmUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuQmFja2JvbmUgPSBwcmV2aW91c0JhY2tib25lO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIFR1cm4gb24gYGVtdWxhdGVIVFRQYCB0byBzdXBwb3J0IGxlZ2FjeSBIVFRQIHNlcnZlcnMuIFNldHRpbmcgdGhpcyBvcHRpb25cbiAgLy8gd2lsbCBmYWtlIGBcIlBBVENIXCJgLCBgXCJQVVRcImAgYW5kIGBcIkRFTEVURVwiYCByZXF1ZXN0cyB2aWEgdGhlIGBfbWV0aG9kYCBwYXJhbWV0ZXIgYW5kXG4gIC8vIHNldCBhIGBYLUh0dHAtTWV0aG9kLU92ZXJyaWRlYCBoZWFkZXIuXG4gIEJhY2tib25lLmVtdWxhdGVIVFRQID0gZmFsc2U7XG5cbiAgLy8gVHVybiBvbiBgZW11bGF0ZUpTT05gIHRvIHN1cHBvcnQgbGVnYWN5IHNlcnZlcnMgdGhhdCBjYW4ndCBkZWFsIHdpdGggZGlyZWN0XG4gIC8vIGBhcHBsaWNhdGlvbi9qc29uYCByZXF1ZXN0cyAuLi4gd2lsbCBlbmNvZGUgdGhlIGJvZHkgYXNcbiAgLy8gYGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZGAgaW5zdGVhZCBhbmQgd2lsbCBzZW5kIHRoZSBtb2RlbCBpbiBhXG4gIC8vIGZvcm0gcGFyYW0gbmFtZWQgYG1vZGVsYC5cbiAgQmFja2JvbmUuZW11bGF0ZUpTT04gPSBmYWxzZTtcblxuICAvLyBCYWNrYm9uZS5FdmVudHNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQSBtb2R1bGUgdGhhdCBjYW4gYmUgbWl4ZWQgaW4gdG8gKmFueSBvYmplY3QqIGluIG9yZGVyIHRvIHByb3ZpZGUgaXQgd2l0aFxuICAvLyBjdXN0b20gZXZlbnRzLiBZb3UgbWF5IGJpbmQgd2l0aCBgb25gIG9yIHJlbW92ZSB3aXRoIGBvZmZgIGNhbGxiYWNrXG4gIC8vIGZ1bmN0aW9ucyB0byBhbiBldmVudDsgYHRyaWdnZXJgLWluZyBhbiBldmVudCBmaXJlcyBhbGwgY2FsbGJhY2tzIGluXG4gIC8vIHN1Y2Nlc3Npb24uXG4gIC8vXG4gIC8vICAgICB2YXIgb2JqZWN0ID0ge307XG4gIC8vICAgICBfLmV4dGVuZChvYmplY3QsIEJhY2tib25lLkV2ZW50cyk7XG4gIC8vICAgICBvYmplY3Qub24oJ2V4cGFuZCcsIGZ1bmN0aW9uKCl7IGFsZXJ0KCdleHBhbmRlZCcpOyB9KTtcbiAgLy8gICAgIG9iamVjdC50cmlnZ2VyKCdleHBhbmQnKTtcbiAgLy9cbiAgdmFyIEV2ZW50cyA9IEJhY2tib25lLkV2ZW50cyA9IHtcblxuICAgIC8vIEJpbmQgYW4gZXZlbnQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLiBQYXNzaW5nIGBcImFsbFwiYCB3aWxsIGJpbmRcbiAgICAvLyB0aGUgY2FsbGJhY2sgdG8gYWxsIGV2ZW50cyBmaXJlZC5cbiAgICBvbjogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pIHx8ICFjYWxsYmFjaykgcmV0dXJuIHRoaXM7XG4gICAgICB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgKHRoaXMuX2V2ZW50c1tuYW1lXSA9IFtdKTtcbiAgICAgIGV2ZW50cy5wdXNoKHtjYWxsYmFjazogY2FsbGJhY2ssIGNvbnRleHQ6IGNvbnRleHQsIGN0eDogY29udGV4dCB8fCB0aGlzfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbiBldmVudCB0byBvbmx5IGJlIHRyaWdnZXJlZCBhIHNpbmdsZSB0aW1lLiBBZnRlciB0aGUgZmlyc3QgdGltZVxuICAgIC8vIHRoZSBjYWxsYmFjayBpcyBpbnZva2VkLCBpdCB3aWxsIGJlIHJlbW92ZWQuXG4gICAgb25jZTogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICAgIGlmICghZXZlbnRzQXBpKHRoaXMsICdvbmNlJywgbmFtZSwgW2NhbGxiYWNrLCBjb250ZXh0XSkgfHwgIWNhbGxiYWNrKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHZhciBvbmNlID0gXy5vbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLm9mZihuYW1lLCBvbmNlKTtcbiAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0pO1xuICAgICAgb25jZS5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgIHJldHVybiB0aGlzLm9uKG5hbWUsIG9uY2UsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICAvLyBSZW1vdmUgb25lIG9yIG1hbnkgY2FsbGJhY2tzLiBJZiBgY29udGV4dGAgaXMgbnVsbCwgcmVtb3ZlcyBhbGxcbiAgICAvLyBjYWxsYmFja3Mgd2l0aCB0aGF0IGZ1bmN0aW9uLiBJZiBgY2FsbGJhY2tgIGlzIG51bGwsIHJlbW92ZXMgYWxsXG4gICAgLy8gY2FsbGJhY2tzIGZvciB0aGUgZXZlbnQuIElmIGBuYW1lYCBpcyBudWxsLCByZW1vdmVzIGFsbCBib3VuZFxuICAgIC8vIGNhbGxiYWNrcyBmb3IgYWxsIGV2ZW50cy5cbiAgICBvZmY6IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV0YWluLCBldiwgZXZlbnRzLCBuYW1lcywgaSwgbCwgaiwgaztcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICFldmVudHNBcGkodGhpcywgJ29mZicsIG5hbWUsIFtjYWxsYmFjaywgY29udGV4dF0pKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghbmFtZSAmJiAhY2FsbGJhY2sgJiYgIWNvbnRleHQpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRzID0gdm9pZCAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIG5hbWVzID0gbmFtZSA/IFtuYW1lXSA6IF8ua2V5cyh0aGlzLl9ldmVudHMpO1xuICAgICAgZm9yIChpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgIGlmIChldmVudHMgPSB0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSByZXRhaW4gPSBbXTtcbiAgICAgICAgICBpZiAoY2FsbGJhY2sgfHwgY29udGV4dCkge1xuICAgICAgICAgICAgZm9yIChqID0gMCwgayA9IGV2ZW50cy5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgZXYgPSBldmVudHNbal07XG4gICAgICAgICAgICAgIGlmICgoY2FsbGJhY2sgJiYgY2FsbGJhY2sgIT09IGV2LmNhbGxiYWNrICYmIGNhbGxiYWNrICE9PSBldi5jYWxsYmFjay5fY2FsbGJhY2spIHx8XG4gICAgICAgICAgICAgICAgICAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBldi5jb250ZXh0KSkge1xuICAgICAgICAgICAgICAgIHJldGFpbi5wdXNoKGV2KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIXJldGFpbi5sZW5ndGgpIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFRyaWdnZXIgb25lIG9yIG1hbnkgZXZlbnRzLCBmaXJpbmcgYWxsIGJvdW5kIGNhbGxiYWNrcy4gQ2FsbGJhY2tzIGFyZVxuICAgIC8vIHBhc3NlZCB0aGUgc2FtZSBhcmd1bWVudHMgYXMgYHRyaWdnZXJgIGlzLCBhcGFydCBmcm9tIHRoZSBldmVudCBuYW1lXG4gICAgLy8gKHVubGVzcyB5b3UncmUgbGlzdGVuaW5nIG9uIGBcImFsbFwiYCwgd2hpY2ggd2lsbCBjYXVzZSB5b3VyIGNhbGxiYWNrIHRvXG4gICAgLy8gcmVjZWl2ZSB0aGUgdHJ1ZSBuYW1lIG9mIHRoZSBldmVudCBhcyB0aGUgZmlyc3QgYXJndW1lbnQpLlxuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgaWYgKCFldmVudHNBcGkodGhpcywgJ3RyaWdnZXInLCBuYW1lLCBhcmdzKSkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW25hbWVdO1xuICAgICAgdmFyIGFsbEV2ZW50cyA9IHRoaXMuX2V2ZW50cy5hbGw7XG4gICAgICBpZiAoZXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGV2ZW50cywgYXJncyk7XG4gICAgICBpZiAoYWxsRXZlbnRzKSB0cmlnZ2VyRXZlbnRzKGFsbEV2ZW50cywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBUZWxsIHRoaXMgb2JqZWN0IHRvIHN0b3AgbGlzdGVuaW5nIHRvIGVpdGhlciBzcGVjaWZpYyBldmVudHMgLi4uIG9yXG4gICAgLy8gdG8gZXZlcnkgb2JqZWN0IGl0J3MgY3VycmVudGx5IGxpc3RlbmluZyB0by5cbiAgICBzdG9wTGlzdGVuaW5nOiBmdW5jdGlvbihvYmosIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgbGlzdGVuaW5nVG8gPSB0aGlzLl9saXN0ZW5pbmdUbztcbiAgICAgIGlmICghbGlzdGVuaW5nVG8pIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHJlbW92ZSA9ICFuYW1lICYmICFjYWxsYmFjaztcbiAgICAgIGlmICghY2FsbGJhY2sgJiYgdHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSBjYWxsYmFjayA9IHRoaXM7XG4gICAgICBpZiAob2JqKSAobGlzdGVuaW5nVG8gPSB7fSlbb2JqLl9saXN0ZW5JZF0gPSBvYmo7XG4gICAgICBmb3IgKHZhciBpZCBpbiBsaXN0ZW5pbmdUbykge1xuICAgICAgICBvYmogPSBsaXN0ZW5pbmdUb1tpZF07XG4gICAgICAgIG9iai5vZmYobmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgICBpZiAocmVtb3ZlIHx8IF8uaXNFbXB0eShvYmouX2V2ZW50cykpIGRlbGV0ZSB0aGlzLl9saXN0ZW5pbmdUb1tpZF07XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgfTtcblxuICAvLyBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBzcGxpdCBldmVudCBzdHJpbmdzLlxuICB2YXIgZXZlbnRTcGxpdHRlciA9IC9cXHMrLztcblxuICAvLyBJbXBsZW1lbnQgZmFuY3kgZmVhdHVyZXMgb2YgdGhlIEV2ZW50cyBBUEkgc3VjaCBhcyBtdWx0aXBsZSBldmVudFxuICAvLyBuYW1lcyBgXCJjaGFuZ2UgYmx1clwiYCBhbmQgalF1ZXJ5LXN0eWxlIGV2ZW50IG1hcHMgYHtjaGFuZ2U6IGFjdGlvbn1gXG4gIC8vIGluIHRlcm1zIG9mIHRoZSBleGlzdGluZyBBUEkuXG4gIHZhciBldmVudHNBcGkgPSBmdW5jdGlvbihvYmosIGFjdGlvbiwgbmFtZSwgcmVzdCkge1xuICAgIGlmICghbmFtZSkgcmV0dXJuIHRydWU7XG5cbiAgICAvLyBIYW5kbGUgZXZlbnQgbWFwcy5cbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gbmFtZSkge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtrZXksIG5hbWVba2V5XV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgc3BhY2Ugc2VwYXJhdGVkIGV2ZW50IG5hbWVzLlxuICAgIGlmIChldmVudFNwbGl0dGVyLnRlc3QobmFtZSkpIHtcbiAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoZXZlbnRTcGxpdHRlcik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBvYmpbYWN0aW9uXS5hcHBseShvYmosIFtuYW1lc1tpXV0uY29uY2F0KHJlc3QpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBBIGRpZmZpY3VsdC10by1iZWxpZXZlLCBidXQgb3B0aW1pemVkIGludGVybmFsIGRpc3BhdGNoIGZ1bmN0aW9uIGZvclxuICAvLyB0cmlnZ2VyaW5nIGV2ZW50cy4gVHJpZXMgdG8ga2VlcCB0aGUgdXN1YWwgY2FzZXMgc3BlZWR5IChtb3N0IGludGVybmFsXG4gIC8vIEJhY2tib25lIGV2ZW50cyBoYXZlIDMgYXJndW1lbnRzKS5cbiAgdmFyIHRyaWdnZXJFdmVudHMgPSBmdW5jdGlvbihldmVudHMsIGFyZ3MpIHtcbiAgICB2YXIgZXYsIGkgPSAtMSwgbCA9IGV2ZW50cy5sZW5ndGgsIGExID0gYXJnc1swXSwgYTIgPSBhcmdzWzFdLCBhMyA9IGFyZ3NbMl07XG4gICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCk7IHJldHVybjtcbiAgICAgIGNhc2UgMTogd2hpbGUgKCsraSA8IGwpIChldiA9IGV2ZW50c1tpXSkuY2FsbGJhY2suY2FsbChldi5jdHgsIGExKTsgcmV0dXJuO1xuICAgICAgY2FzZSAyOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyKTsgcmV0dXJuO1xuICAgICAgY2FzZSAzOiB3aGlsZSAoKytpIDwgbCkgKGV2ID0gZXZlbnRzW2ldKS5jYWxsYmFjay5jYWxsKGV2LmN0eCwgYTEsIGEyLCBhMyk7IHJldHVybjtcbiAgICAgIGRlZmF1bHQ6IHdoaWxlICgrK2kgPCBsKSAoZXYgPSBldmVudHNbaV0pLmNhbGxiYWNrLmFwcGx5KGV2LmN0eCwgYXJncyk7IHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgdmFyIGxpc3Rlbk1ldGhvZHMgPSB7bGlzdGVuVG86ICdvbicsIGxpc3RlblRvT25jZTogJ29uY2UnfTtcblxuICAvLyBJbnZlcnNpb24tb2YtY29udHJvbCB2ZXJzaW9ucyBvZiBgb25gIGFuZCBgb25jZWAuIFRlbGwgKnRoaXMqIG9iamVjdCB0b1xuICAvLyBsaXN0ZW4gdG8gYW4gZXZlbnQgaW4gYW5vdGhlciBvYmplY3QgLi4uIGtlZXBpbmcgdHJhY2sgb2Ygd2hhdCBpdCdzXG4gIC8vIGxpc3RlbmluZyB0by5cbiAgXy5lYWNoKGxpc3Rlbk1ldGhvZHMsIGZ1bmN0aW9uKGltcGxlbWVudGF0aW9uLCBtZXRob2QpIHtcbiAgICBFdmVudHNbbWV0aG9kXSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSwgY2FsbGJhY2spIHtcbiAgICAgIHZhciBsaXN0ZW5pbmdUbyA9IHRoaXMuX2xpc3RlbmluZ1RvIHx8ICh0aGlzLl9saXN0ZW5pbmdUbyA9IHt9KTtcbiAgICAgIHZhciBpZCA9IG9iai5fbGlzdGVuSWQgfHwgKG9iai5fbGlzdGVuSWQgPSBfLnVuaXF1ZUlkKCdsJykpO1xuICAgICAgbGlzdGVuaW5nVG9baWRdID0gb2JqO1xuICAgICAgaWYgKCFjYWxsYmFjayAmJiB0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIGNhbGxiYWNrID0gdGhpcztcbiAgICAgIG9ialtpbXBsZW1lbnRhdGlvbl0obmFtZSwgY2FsbGJhY2ssIHRoaXMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG4gIEV2ZW50cy5iaW5kICAgPSBFdmVudHMub247XG4gIEV2ZW50cy51bmJpbmQgPSBFdmVudHMub2ZmO1xuXG4gIC8vIEFsbG93IHRoZSBgQmFja2JvbmVgIG9iamVjdCB0byBzZXJ2ZSBhcyBhIGdsb2JhbCBldmVudCBidXMsIGZvciBmb2xrcyB3aG9cbiAgLy8gd2FudCBnbG9iYWwgXCJwdWJzdWJcIiBpbiBhIGNvbnZlbmllbnQgcGxhY2UuXG4gIF8uZXh0ZW5kKEJhY2tib25lLCBFdmVudHMpO1xuXG4gIC8vIEJhY2tib25lLk1vZGVsXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQmFja2JvbmUgKipNb2RlbHMqKiBhcmUgdGhlIGJhc2ljIGRhdGEgb2JqZWN0IGluIHRoZSBmcmFtZXdvcmsgLS1cbiAgLy8gZnJlcXVlbnRseSByZXByZXNlbnRpbmcgYSByb3cgaW4gYSB0YWJsZSBpbiBhIGRhdGFiYXNlIG9uIHlvdXIgc2VydmVyLlxuICAvLyBBIGRpc2NyZXRlIGNodW5rIG9mIGRhdGEgYW5kIGEgYnVuY2ggb2YgdXNlZnVsLCByZWxhdGVkIG1ldGhvZHMgZm9yXG4gIC8vIHBlcmZvcm1pbmcgY29tcHV0YXRpb25zIGFuZCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhhdCBkYXRhLlxuXG4gIC8vIENyZWF0ZSBhIG5ldyBtb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlcy4gQSBjbGllbnQgaWQgKGBjaWRgKVxuICAvLyBpcyBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCBhbmQgYXNzaWduZWQgZm9yIHlvdS5cbiAgdmFyIE1vZGVsID0gQmFja2JvbmUuTW9kZWwgPSBmdW5jdGlvbihhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgdmFyIGF0dHJzID0gYXR0cmlidXRlcyB8fCB7fTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnYycpO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIGlmIChvcHRpb25zLmNvbGxlY3Rpb24pIHRoaXMuY29sbGVjdGlvbiA9IG9wdGlvbnMuY29sbGVjdGlvbjtcbiAgICBpZiAob3B0aW9ucy5wYXJzZSkgYXR0cnMgPSB0aGlzLnBhcnNlKGF0dHJzLCBvcHRpb25zKSB8fCB7fTtcbiAgICBhdHRycyA9IF8uZGVmYXVsdHMoe30sIGF0dHJzLCBfLnJlc3VsdCh0aGlzLCAnZGVmYXVsdHMnKSk7XG4gICAgdGhpcy5zZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIHRoaXMuY2hhbmdlZCA9IHt9O1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIEF0dGFjaCBhbGwgaW5oZXJpdGFibGUgbWV0aG9kcyB0byB0aGUgTW9kZWwgcHJvdG90eXBlLlxuICBfLmV4dGVuZChNb2RlbC5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gQSBoYXNoIG9mIGF0dHJpYnV0ZXMgd2hvc2UgY3VycmVudCBhbmQgcHJldmlvdXMgdmFsdWUgZGlmZmVyLlxuICAgIGNoYW5nZWQ6IG51bGwsXG5cbiAgICAvLyBUaGUgdmFsdWUgcmV0dXJuZWQgZHVyaW5nIHRoZSBsYXN0IGZhaWxlZCB2YWxpZGF0aW9uLlxuICAgIHZhbGlkYXRpb25FcnJvcjogbnVsbCxcblxuICAgIC8vIFRoZSBkZWZhdWx0IG5hbWUgZm9yIHRoZSBKU09OIGBpZGAgYXR0cmlidXRlIGlzIGBcImlkXCJgLiBNb25nb0RCIGFuZFxuICAgIC8vIENvdWNoREIgdXNlcnMgbWF5IHdhbnQgdG8gc2V0IHRoaXMgdG8gYFwiX2lkXCJgLlxuICAgIGlkQXR0cmlidXRlOiAnaWQnLFxuXG4gICAgLy8gSW5pdGlhbGl6ZSBpcyBhbiBlbXB0eSBmdW5jdGlvbiBieSBkZWZhdWx0LiBPdmVycmlkZSBpdCB3aXRoIHlvdXIgb3duXG4gICAgLy8gaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgbW9kZWwncyBgYXR0cmlidXRlc2Agb2JqZWN0LlxuICAgIHRvSlNPTjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgcmV0dXJuIF8uY2xvbmUodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICB9LFxuXG4gICAgLy8gUHJveHkgYEJhY2tib25lLnN5bmNgIGJ5IGRlZmF1bHQgLS0gYnV0IG92ZXJyaWRlIHRoaXMgaWYgeW91IG5lZWRcbiAgICAvLyBjdXN0b20gc3luY2luZyBzZW1hbnRpY3MgZm9yICp0aGlzKiBwYXJ0aWN1bGFyIG1vZGVsLlxuICAgIHN5bmM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEJhY2tib25lLnN5bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSB2YWx1ZSBvZiBhbiBhdHRyaWJ1dGUuXG4gICAgZ2V0OiBmdW5jdGlvbihhdHRyKSB7XG4gICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2F0dHJdO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIEhUTUwtZXNjYXBlZCB2YWx1ZSBvZiBhbiBhdHRyaWJ1dGUuXG4gICAgZXNjYXBlOiBmdW5jdGlvbihhdHRyKSB7XG4gICAgICByZXR1cm4gXy5lc2NhcGUodGhpcy5nZXQoYXR0cikpO1xuICAgIH0sXG5cbiAgICAvLyBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgYXR0cmlidXRlIGNvbnRhaW5zIGEgdmFsdWUgdGhhdCBpcyBub3QgbnVsbFxuICAgIC8vIG9yIHVuZGVmaW5lZC5cbiAgICBoYXM6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldChhdHRyKSAhPSBudWxsO1xuICAgIH0sXG5cbiAgICAvLyBTZXQgYSBoYXNoIG9mIG1vZGVsIGF0dHJpYnV0ZXMgb24gdGhlIG9iamVjdCwgZmlyaW5nIGBcImNoYW5nZVwiYC4gVGhpcyBpc1xuICAgIC8vIHRoZSBjb3JlIHByaW1pdGl2ZSBvcGVyYXRpb24gb2YgYSBtb2RlbCwgdXBkYXRpbmcgdGhlIGRhdGEgYW5kIG5vdGlmeWluZ1xuICAgIC8vIGFueW9uZSB3aG8gbmVlZHMgdG8ga25vdyBhYm91dCB0aGUgY2hhbmdlIGluIHN0YXRlLiBUaGUgaGVhcnQgb2YgdGhlIGJlYXN0LlxuICAgIHNldDogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgIHZhciBhdHRyLCBhdHRycywgdW5zZXQsIGNoYW5nZXMsIHNpbGVudCwgY2hhbmdpbmcsIHByZXYsIGN1cnJlbnQ7XG4gICAgICBpZiAoa2V5ID09IG51bGwpIHJldHVybiB0aGlzO1xuXG4gICAgICAvLyBIYW5kbGUgYm90aCBgXCJrZXlcIiwgdmFsdWVgIGFuZCBge2tleTogdmFsdWV9YCAtc3R5bGUgYXJndW1lbnRzLlxuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICAgIC8vIFJ1biB2YWxpZGF0aW9uLlxuICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZShhdHRycywgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcblxuICAgICAgLy8gRXh0cmFjdCBhdHRyaWJ1dGVzIGFuZCBvcHRpb25zLlxuICAgICAgdW5zZXQgICAgICAgICAgID0gb3B0aW9ucy51bnNldDtcbiAgICAgIHNpbGVudCAgICAgICAgICA9IG9wdGlvbnMuc2lsZW50O1xuICAgICAgY2hhbmdlcyAgICAgICAgID0gW107XG4gICAgICBjaGFuZ2luZyAgICAgICAgPSB0aGlzLl9jaGFuZ2luZztcbiAgICAgIHRoaXMuX2NoYW5naW5nICA9IHRydWU7XG5cbiAgICAgIGlmICghY2hhbmdpbmcpIHtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgICAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnQgPSB0aGlzLmF0dHJpYnV0ZXMsIHByZXYgPSB0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXM7XG5cbiAgICAgIC8vIENoZWNrIGZvciBjaGFuZ2VzIG9mIGBpZGAuXG4gICAgICBpZiAodGhpcy5pZEF0dHJpYnV0ZSBpbiBhdHRycykgdGhpcy5pZCA9IGF0dHJzW3RoaXMuaWRBdHRyaWJ1dGVdO1xuXG4gICAgICAvLyBGb3IgZWFjaCBgc2V0YCBhdHRyaWJ1dGUsIHVwZGF0ZSBvciBkZWxldGUgdGhlIGN1cnJlbnQgdmFsdWUuXG4gICAgICBmb3IgKGF0dHIgaW4gYXR0cnMpIHtcbiAgICAgICAgdmFsID0gYXR0cnNbYXR0cl07XG4gICAgICAgIGlmICghXy5pc0VxdWFsKGN1cnJlbnRbYXR0cl0sIHZhbCkpIGNoYW5nZXMucHVzaChhdHRyKTtcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwocHJldlthdHRyXSwgdmFsKSkge1xuICAgICAgICAgIHRoaXMuY2hhbmdlZFthdHRyXSA9IHZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VkW2F0dHJdO1xuICAgICAgICB9XG4gICAgICAgIHVuc2V0ID8gZGVsZXRlIGN1cnJlbnRbYXR0cl0gOiBjdXJyZW50W2F0dHJdID0gdmFsO1xuICAgICAgfVxuXG4gICAgICAvLyBUcmlnZ2VyIGFsbCByZWxldmFudCBhdHRyaWJ1dGUgY2hhbmdlcy5cbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCkgdGhpcy5fcGVuZGluZyA9IG9wdGlvbnM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hhbmdlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZTonICsgY2hhbmdlc1tpXSwgdGhpcywgY3VycmVudFtjaGFuZ2VzW2ldXSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gWW91IG1pZ2h0IGJlIHdvbmRlcmluZyB3aHkgdGhlcmUncyBhIGB3aGlsZWAgbG9vcCBoZXJlLiBDaGFuZ2VzIGNhblxuICAgICAgLy8gYmUgcmVjdXJzaXZlbHkgbmVzdGVkIHdpdGhpbiBgXCJjaGFuZ2VcImAgZXZlbnRzLlxuICAgICAgaWYgKGNoYW5naW5nKSByZXR1cm4gdGhpcztcbiAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9wZW5kaW5nKSB7XG4gICAgICAgICAgb3B0aW9ucyA9IHRoaXMuX3BlbmRpbmc7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX3BlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2NoYW5naW5nID0gZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIGFuIGF0dHJpYnV0ZSBmcm9tIHRoZSBtb2RlbCwgZmlyaW5nIGBcImNoYW5nZVwiYC4gYHVuc2V0YCBpcyBhIG5vb3BcbiAgICAvLyBpZiB0aGUgYXR0cmlidXRlIGRvZXNuJ3QgZXhpc3QuXG4gICAgdW5zZXQ6IGZ1bmN0aW9uKGF0dHIsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldChhdHRyLCB2b2lkIDAsIF8uZXh0ZW5kKHt9LCBvcHRpb25zLCB7dW5zZXQ6IHRydWV9KSk7XG4gICAgfSxcblxuICAgIC8vIENsZWFyIGFsbCBhdHRyaWJ1dGVzIG9uIHRoZSBtb2RlbCwgZmlyaW5nIGBcImNoYW5nZVwiYC5cbiAgICBjbGVhcjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5hdHRyaWJ1dGVzKSBhdHRyc1trZXldID0gdm9pZCAwO1xuICAgICAgcmV0dXJuIHRoaXMuc2V0KGF0dHJzLCBfLmV4dGVuZCh7fSwgb3B0aW9ucywge3Vuc2V0OiB0cnVlfSkpO1xuICAgIH0sXG5cbiAgICAvLyBEZXRlcm1pbmUgaWYgdGhlIG1vZGVsIGhhcyBjaGFuZ2VkIHNpbmNlIHRoZSBsYXN0IGBcImNoYW5nZVwiYCBldmVudC5cbiAgICAvLyBJZiB5b3Ugc3BlY2lmeSBhbiBhdHRyaWJ1dGUgbmFtZSwgZGV0ZXJtaW5lIGlmIHRoYXQgYXR0cmlidXRlIGhhcyBjaGFuZ2VkLlxuICAgIGhhc0NoYW5nZWQ6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIGlmIChhdHRyID09IG51bGwpIHJldHVybiAhXy5pc0VtcHR5KHRoaXMuY2hhbmdlZCk7XG4gICAgICByZXR1cm4gXy5oYXModGhpcy5jaGFuZ2VkLCBhdHRyKTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGFsbCB0aGUgYXR0cmlidXRlcyB0aGF0IGhhdmUgY2hhbmdlZCwgb3JcbiAgICAvLyBmYWxzZSBpZiB0aGVyZSBhcmUgbm8gY2hhbmdlZCBhdHRyaWJ1dGVzLiBVc2VmdWwgZm9yIGRldGVybWluaW5nIHdoYXRcbiAgICAvLyBwYXJ0cyBvZiBhIHZpZXcgbmVlZCB0byBiZSB1cGRhdGVkIGFuZC9vciB3aGF0IGF0dHJpYnV0ZXMgbmVlZCB0byBiZVxuICAgIC8vIHBlcnNpc3RlZCB0byB0aGUgc2VydmVyLiBVbnNldCBhdHRyaWJ1dGVzIHdpbGwgYmUgc2V0IHRvIHVuZGVmaW5lZC5cbiAgICAvLyBZb3UgY2FuIGFsc28gcGFzcyBhbiBhdHRyaWJ1dGVzIG9iamVjdCB0byBkaWZmIGFnYWluc3QgdGhlIG1vZGVsLFxuICAgIC8vIGRldGVybWluaW5nIGlmIHRoZXJlICp3b3VsZCBiZSogYSBjaGFuZ2UuXG4gICAgY2hhbmdlZEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKGRpZmYpIHtcbiAgICAgIGlmICghZGlmZikgcmV0dXJuIHRoaXMuaGFzQ2hhbmdlZCgpID8gXy5jbG9uZSh0aGlzLmNoYW5nZWQpIDogZmFsc2U7XG4gICAgICB2YXIgdmFsLCBjaGFuZ2VkID0gZmFsc2U7XG4gICAgICB2YXIgb2xkID0gdGhpcy5fY2hhbmdpbmcgPyB0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXMgOiB0aGlzLmF0dHJpYnV0ZXM7XG4gICAgICBmb3IgKHZhciBhdHRyIGluIGRpZmYpIHtcbiAgICAgICAgaWYgKF8uaXNFcXVhbChvbGRbYXR0cl0sICh2YWwgPSBkaWZmW2F0dHJdKSkpIGNvbnRpbnVlO1xuICAgICAgICAoY2hhbmdlZCB8fCAoY2hhbmdlZCA9IHt9KSlbYXR0cl0gPSB2YWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gY2hhbmdlZDtcbiAgICB9LFxuXG4gICAgLy8gR2V0IHRoZSBwcmV2aW91cyB2YWx1ZSBvZiBhbiBhdHRyaWJ1dGUsIHJlY29yZGVkIGF0IHRoZSB0aW1lIHRoZSBsYXN0XG4gICAgLy8gYFwiY2hhbmdlXCJgIGV2ZW50IHdhcyBmaXJlZC5cbiAgICBwcmV2aW91czogZnVuY3Rpb24oYXR0cikge1xuICAgICAgaWYgKGF0dHIgPT0gbnVsbCB8fCAhdGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiB0aGlzLl9wcmV2aW91c0F0dHJpYnV0ZXNbYXR0cl07XG4gICAgfSxcblxuICAgIC8vIEdldCBhbGwgb2YgdGhlIGF0dHJpYnV0ZXMgb2YgdGhlIG1vZGVsIGF0IHRoZSB0aW1lIG9mIHRoZSBwcmV2aW91c1xuICAgIC8vIGBcImNoYW5nZVwiYCBldmVudC5cbiAgICBwcmV2aW91c0F0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIF8uY2xvbmUodGhpcy5fcHJldmlvdXNBdHRyaWJ1dGVzKTtcbiAgICB9LFxuXG4gICAgLy8gRmV0Y2ggdGhlIG1vZGVsIGZyb20gdGhlIHNlcnZlci4gSWYgdGhlIHNlcnZlcidzIHJlcHJlc2VudGF0aW9uIG9mIHRoZVxuICAgIC8vIG1vZGVsIGRpZmZlcnMgZnJvbSBpdHMgY3VycmVudCBhdHRyaWJ1dGVzLCB0aGV5IHdpbGwgYmUgb3ZlcnJpZGRlbixcbiAgICAvLyB0cmlnZ2VyaW5nIGEgYFwiY2hhbmdlXCJgIGV2ZW50LlxuICAgIGZldGNoOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICAgIGlmIChvcHRpb25zLnBhcnNlID09PSB2b2lkIDApIG9wdGlvbnMucGFyc2UgPSB0cnVlO1xuICAgICAgdmFyIG1vZGVsID0gdGhpcztcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICBpZiAoIW1vZGVsLnNldChtb2RlbC5wYXJzZShyZXNwLCBvcHRpb25zKSwgb3B0aW9ucykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgICBtb2RlbC50cmlnZ2VyKCdzeW5jJywgbW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLnN5bmMoJ3JlYWQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLy8gU2V0IGEgaGFzaCBvZiBtb2RlbCBhdHRyaWJ1dGVzLCBhbmQgc3luYyB0aGUgbW9kZWwgdG8gdGhlIHNlcnZlci5cbiAgICAvLyBJZiB0aGUgc2VydmVyIHJldHVybnMgYW4gYXR0cmlidXRlcyBoYXNoIHRoYXQgZGlmZmVycywgdGhlIG1vZGVsJ3NcbiAgICAvLyBzdGF0ZSB3aWxsIGJlIGBzZXRgIGFnYWluLlxuICAgIHNhdmU6IGZ1bmN0aW9uKGtleSwgdmFsLCBvcHRpb25zKSB7XG4gICAgICB2YXIgYXR0cnMsIG1ldGhvZCwgeGhyLCBhdHRyaWJ1dGVzID0gdGhpcy5hdHRyaWJ1dGVzO1xuXG4gICAgICAvLyBIYW5kbGUgYm90aCBgXCJrZXlcIiwgdmFsdWVgIGFuZCBge2tleTogdmFsdWV9YCAtc3R5bGUgYXJndW1lbnRzLlxuICAgICAgaWYgKGtleSA9PSBudWxsIHx8IHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICB9XG5cbiAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7dmFsaWRhdGU6IHRydWV9LCBvcHRpb25zKTtcblxuICAgICAgLy8gSWYgd2UncmUgbm90IHdhaXRpbmcgYW5kIGF0dHJpYnV0ZXMgZXhpc3QsIHNhdmUgYWN0cyBhc1xuICAgICAgLy8gYHNldChhdHRyKS5zYXZlKG51bGwsIG9wdHMpYCB3aXRoIHZhbGlkYXRpb24uIE90aGVyd2lzZSwgY2hlY2sgaWZcbiAgICAgIC8vIHRoZSBtb2RlbCB3aWxsIGJlIHZhbGlkIHdoZW4gdGhlIGF0dHJpYnV0ZXMsIGlmIGFueSwgYXJlIHNldC5cbiAgICAgIGlmIChhdHRycyAmJiAhb3B0aW9ucy53YWl0KSB7XG4gICAgICAgIGlmICghdGhpcy5zZXQoYXR0cnMsIG9wdGlvbnMpKSByZXR1cm4gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlKGF0dHJzLCBvcHRpb25zKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXQgdGVtcG9yYXJ5IGF0dHJpYnV0ZXMgaWYgYHt3YWl0OiB0cnVlfWAuXG4gICAgICBpZiAoYXR0cnMgJiYgb3B0aW9ucy53YWl0KSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IF8uZXh0ZW5kKHt9LCBhdHRyaWJ1dGVzLCBhdHRycyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFmdGVyIGEgc3VjY2Vzc2Z1bCBzZXJ2ZXItc2lkZSBzYXZlLCB0aGUgY2xpZW50IGlzIChvcHRpb25hbGx5KVxuICAgICAgLy8gdXBkYXRlZCB3aXRoIHRoZSBzZXJ2ZXItc2lkZSBzdGF0ZS5cbiAgICAgIGlmIChvcHRpb25zLnBhcnNlID09PSB2b2lkIDApIG9wdGlvbnMucGFyc2UgPSB0cnVlO1xuICAgICAgdmFyIG1vZGVsID0gdGhpcztcbiAgICAgIHZhciBzdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzO1xuICAgICAgb3B0aW9ucy5zdWNjZXNzID0gZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAvLyBFbnN1cmUgYXR0cmlidXRlcyBhcmUgcmVzdG9yZWQgZHVyaW5nIHN5bmNocm9ub3VzIHNhdmVzLlxuICAgICAgICBtb2RlbC5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcbiAgICAgICAgdmFyIHNlcnZlckF0dHJzID0gbW9kZWwucGFyc2UocmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIGlmIChvcHRpb25zLndhaXQpIHNlcnZlckF0dHJzID0gXy5leHRlbmQoYXR0cnMgfHwge30sIHNlcnZlckF0dHJzKTtcbiAgICAgICAgaWYgKF8uaXNPYmplY3Qoc2VydmVyQXR0cnMpICYmICFtb2RlbC5zZXQoc2VydmVyQXR0cnMsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdWNjZXNzKSBzdWNjZXNzKG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgICAgbW9kZWwudHJpZ2dlcignc3luYycsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgIH07XG4gICAgICB3cmFwRXJyb3IodGhpcywgb3B0aW9ucyk7XG5cbiAgICAgIG1ldGhvZCA9IHRoaXMuaXNOZXcoKSA/ICdjcmVhdGUnIDogKG9wdGlvbnMucGF0Y2ggPyAncGF0Y2gnIDogJ3VwZGF0ZScpO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gJ3BhdGNoJykgb3B0aW9ucy5hdHRycyA9IGF0dHJzO1xuICAgICAgeGhyID0gdGhpcy5zeW5jKG1ldGhvZCwgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAgIC8vIFJlc3RvcmUgYXR0cmlidXRlcy5cbiAgICAgIGlmIChhdHRycyAmJiBvcHRpb25zLndhaXQpIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5cbiAgICAgIHJldHVybiB4aHI7XG4gICAgfSxcblxuICAgIC8vIERlc3Ryb3kgdGhpcyBtb2RlbCBvbiB0aGUgc2VydmVyIGlmIGl0IHdhcyBhbHJlYWR5IHBlcnNpc3RlZC5cbiAgICAvLyBPcHRpbWlzdGljYWxseSByZW1vdmVzIHRoZSBtb2RlbCBmcm9tIGl0cyBjb2xsZWN0aW9uLCBpZiBpdCBoYXMgb25lLlxuICAgIC8vIElmIGB3YWl0OiB0cnVlYCBpcyBwYXNzZWQsIHdhaXRzIGZvciB0aGUgc2VydmVyIHRvIHJlc3BvbmQgYmVmb3JlIHJlbW92YWwuXG4gICAgZGVzdHJveTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzO1xuICAgICAgdmFyIHN1Y2Nlc3MgPSBvcHRpb25zLnN1Y2Nlc3M7XG5cbiAgICAgIHZhciBkZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIG1vZGVsLnRyaWdnZXIoJ2Rlc3Ryb3knLCBtb2RlbCwgbW9kZWwuY29sbGVjdGlvbiwgb3B0aW9ucyk7XG4gICAgICB9O1xuXG4gICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgIGlmIChvcHRpb25zLndhaXQgfHwgbW9kZWwuaXNOZXcoKSkgZGVzdHJveSgpO1xuICAgICAgICBpZiAoc3VjY2Vzcykgc3VjY2Vzcyhtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIGlmICghbW9kZWwuaXNOZXcoKSkgbW9kZWwudHJpZ2dlcignc3luYycsIG1vZGVsLCByZXNwLCBvcHRpb25zKTtcbiAgICAgIH07XG5cbiAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcblxuICAgICAgdmFyIHhociA9IHRoaXMuc3luYygnZGVsZXRlJywgdGhpcywgb3B0aW9ucyk7XG4gICAgICBpZiAoIW9wdGlvbnMud2FpdCkgZGVzdHJveSgpO1xuICAgICAgcmV0dXJuIHhocjtcbiAgICB9LFxuXG4gICAgLy8gRGVmYXVsdCBVUkwgZm9yIHRoZSBtb2RlbCdzIHJlcHJlc2VudGF0aW9uIG9uIHRoZSBzZXJ2ZXIgLS0gaWYgeW91J3JlXG4gICAgLy8gdXNpbmcgQmFja2JvbmUncyByZXN0ZnVsIG1ldGhvZHMsIG92ZXJyaWRlIHRoaXMgdG8gY2hhbmdlIHRoZSBlbmRwb2ludFxuICAgIC8vIHRoYXQgd2lsbCBiZSBjYWxsZWQuXG4gICAgdXJsOiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBiYXNlID1cbiAgICAgICAgXy5yZXN1bHQodGhpcywgJ3VybFJvb3QnKSB8fFxuICAgICAgICBfLnJlc3VsdCh0aGlzLmNvbGxlY3Rpb24sICd1cmwnKSB8fFxuICAgICAgICB1cmxFcnJvcigpO1xuICAgICAgaWYgKHRoaXMuaXNOZXcoKSkgcmV0dXJuIGJhc2U7XG4gICAgICByZXR1cm4gYmFzZS5yZXBsYWNlKC8oW15cXC9dKSQvLCAnJDEvJykgKyBlbmNvZGVVUklDb21wb25lbnQodGhpcy5pZCk7XG4gICAgfSxcblxuICAgIC8vICoqcGFyc2UqKiBjb252ZXJ0cyBhIHJlc3BvbnNlIGludG8gdGhlIGhhc2ggb2YgYXR0cmlidXRlcyB0byBiZSBgc2V0YCBvblxuICAgIC8vIHRoZSBtb2RlbC4gVGhlIGRlZmF1bHQgaW1wbGVtZW50YXRpb24gaXMganVzdCB0byBwYXNzIHRoZSByZXNwb25zZSBhbG9uZy5cbiAgICBwYXJzZTogZnVuY3Rpb24ocmVzcCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSxcblxuICAgIC8vIENyZWF0ZSBhIG5ldyBtb2RlbCB3aXRoIGlkZW50aWNhbCBhdHRyaWJ1dGVzIHRvIHRoaXMgb25lLlxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIH0sXG5cbiAgICAvLyBBIG1vZGVsIGlzIG5ldyBpZiBpdCBoYXMgbmV2ZXIgYmVlbiBzYXZlZCB0byB0aGUgc2VydmVyLCBhbmQgbGFja3MgYW4gaWQuXG4gICAgaXNOZXc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICF0aGlzLmhhcyh0aGlzLmlkQXR0cmlidXRlKTtcbiAgICB9LFxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIG1vZGVsIGlzIGN1cnJlbnRseSBpbiBhIHZhbGlkIHN0YXRlLlxuICAgIGlzVmFsaWQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLl92YWxpZGF0ZSh7fSwgXy5leHRlbmQob3B0aW9ucyB8fCB7fSwgeyB2YWxpZGF0ZTogdHJ1ZSB9KSk7XG4gICAgfSxcblxuICAgIC8vIFJ1biB2YWxpZGF0aW9uIGFnYWluc3QgdGhlIG5leHQgY29tcGxldGUgc2V0IG9mIG1vZGVsIGF0dHJpYnV0ZXMsXG4gICAgLy8gcmV0dXJuaW5nIGB0cnVlYCBpZiBhbGwgaXMgd2VsbC4gT3RoZXJ3aXNlLCBmaXJlIGFuIGBcImludmFsaWRcImAgZXZlbnQuXG4gICAgX3ZhbGlkYXRlOiBmdW5jdGlvbihhdHRycywgb3B0aW9ucykge1xuICAgICAgaWYgKCFvcHRpb25zLnZhbGlkYXRlIHx8ICF0aGlzLnZhbGlkYXRlKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGF0dHJzID0gXy5leHRlbmQoe30sIHRoaXMuYXR0cmlidXRlcywgYXR0cnMpO1xuICAgICAgdmFyIGVycm9yID0gdGhpcy52YWxpZGF0aW9uRXJyb3IgPSB0aGlzLnZhbGlkYXRlKGF0dHJzLCBvcHRpb25zKSB8fCBudWxsO1xuICAgICAgaWYgKCFlcnJvcikgcmV0dXJuIHRydWU7XG4gICAgICB0aGlzLnRyaWdnZXIoJ2ludmFsaWQnLCB0aGlzLCBlcnJvciwgXy5leHRlbmQob3B0aW9ucywge3ZhbGlkYXRpb25FcnJvcjogZXJyb3J9KSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIFVuZGVyc2NvcmUgbWV0aG9kcyB0aGF0IHdlIHdhbnQgdG8gaW1wbGVtZW50IG9uIHRoZSBNb2RlbC5cbiAgdmFyIG1vZGVsTWV0aG9kcyA9IFsna2V5cycsICd2YWx1ZXMnLCAncGFpcnMnLCAnaW52ZXJ0JywgJ3BpY2snLCAnb21pdCddO1xuXG4gIC8vIE1peCBpbiBlYWNoIFVuZGVyc2NvcmUgbWV0aG9kIGFzIGEgcHJveHkgdG8gYE1vZGVsI2F0dHJpYnV0ZXNgLlxuICBfLmVhY2gobW9kZWxNZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBNb2RlbC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICBhcmdzLnVuc2hpZnQodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICAgIHJldHVybiBfW21ldGhvZF0uYXBwbHkoXywgYXJncyk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQmFja2JvbmUuQ29sbGVjdGlvblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gSWYgbW9kZWxzIHRlbmQgdG8gcmVwcmVzZW50IGEgc2luZ2xlIHJvdyBvZiBkYXRhLCBhIEJhY2tib25lIENvbGxlY3Rpb24gaXNcbiAgLy8gbW9yZSBhbmFsYWdvdXMgdG8gYSB0YWJsZSBmdWxsIG9mIGRhdGEgLi4uIG9yIGEgc21hbGwgc2xpY2Ugb3IgcGFnZSBvZiB0aGF0XG4gIC8vIHRhYmxlLCBvciBhIGNvbGxlY3Rpb24gb2Ygcm93cyB0aGF0IGJlbG9uZyB0b2dldGhlciBmb3IgYSBwYXJ0aWN1bGFyIHJlYXNvblxuICAvLyAtLSBhbGwgb2YgdGhlIG1lc3NhZ2VzIGluIHRoaXMgcGFydGljdWxhciBmb2xkZXIsIGFsbCBvZiB0aGUgZG9jdW1lbnRzXG4gIC8vIGJlbG9uZ2luZyB0byB0aGlzIHBhcnRpY3VsYXIgYXV0aG9yLCBhbmQgc28gb24uIENvbGxlY3Rpb25zIG1haW50YWluXG4gIC8vIGluZGV4ZXMgb2YgdGhlaXIgbW9kZWxzLCBib3RoIGluIG9yZGVyLCBhbmQgZm9yIGxvb2t1cCBieSBgaWRgLlxuXG4gIC8vIENyZWF0ZSBhIG5ldyAqKkNvbGxlY3Rpb24qKiwgcGVyaGFwcyB0byBjb250YWluIGEgc3BlY2lmaWMgdHlwZSBvZiBgbW9kZWxgLlxuICAvLyBJZiBhIGBjb21wYXJhdG9yYCBpcyBzcGVjaWZpZWQsIHRoZSBDb2xsZWN0aW9uIHdpbGwgbWFpbnRhaW5cbiAgLy8gaXRzIG1vZGVscyBpbiBzb3J0IG9yZGVyLCBhcyB0aGV5J3JlIGFkZGVkIGFuZCByZW1vdmVkLlxuICB2YXIgQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24gPSBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIGlmIChvcHRpb25zLm1vZGVsKSB0aGlzLm1vZGVsID0gb3B0aW9ucy5tb2RlbDtcbiAgICBpZiAob3B0aW9ucy5jb21wYXJhdG9yICE9PSB2b2lkIDApIHRoaXMuY29tcGFyYXRvciA9IG9wdGlvbnMuY29tcGFyYXRvcjtcbiAgICB0aGlzLl9yZXNldCgpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmIChtb2RlbHMpIHRoaXMucmVzZXQobW9kZWxzLCBfLmV4dGVuZCh7c2lsZW50OiB0cnVlfSwgb3B0aW9ucykpO1xuICB9O1xuXG4gIC8vIERlZmF1bHQgb3B0aW9ucyBmb3IgYENvbGxlY3Rpb24jc2V0YC5cbiAgdmFyIHNldE9wdGlvbnMgPSB7YWRkOiB0cnVlLCByZW1vdmU6IHRydWUsIG1lcmdlOiB0cnVlfTtcbiAgdmFyIGFkZE9wdGlvbnMgPSB7YWRkOiB0cnVlLCByZW1vdmU6IGZhbHNlfTtcblxuICAvLyBEZWZpbmUgdGhlIENvbGxlY3Rpb24ncyBpbmhlcml0YWJsZSBtZXRob2RzLlxuICBfLmV4dGVuZChDb2xsZWN0aW9uLnByb3RvdHlwZSwgRXZlbnRzLCB7XG5cbiAgICAvLyBUaGUgZGVmYXVsdCBtb2RlbCBmb3IgYSBjb2xsZWN0aW9uIGlzIGp1c3QgYSAqKkJhY2tib25lLk1vZGVsKiouXG4gICAgLy8gVGhpcyBzaG91bGQgYmUgb3ZlcnJpZGRlbiBpbiBtb3N0IGNhc2VzLlxuICAgIG1vZGVsOiBNb2RlbCxcblxuICAgIC8vIEluaXRpYWxpemUgaXMgYW4gZW1wdHkgZnVuY3Rpb24gYnkgZGVmYXVsdC4gT3ZlcnJpZGUgaXQgd2l0aCB5b3VyIG93blxuICAgIC8vIGluaXRpYWxpemF0aW9uIGxvZ2ljLlxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCl7fSxcblxuICAgIC8vIFRoZSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIGEgQ29sbGVjdGlvbiBpcyBhbiBhcnJheSBvZiB0aGVcbiAgICAvLyBtb2RlbHMnIGF0dHJpYnV0ZXMuXG4gICAgdG9KU09OOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24obW9kZWwpeyByZXR1cm4gbW9kZWwudG9KU09OKG9wdGlvbnMpOyB9KTtcbiAgICB9LFxuXG4gICAgLy8gUHJveHkgYEJhY2tib25lLnN5bmNgIGJ5IGRlZmF1bHQuXG4gICAgc3luYzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gQmFja2JvbmUuc3luYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvLyBBZGQgYSBtb2RlbCwgb3IgbGlzdCBvZiBtb2RlbHMgdG8gdGhlIHNldC5cbiAgICBhZGQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0KG1vZGVscywgXy5leHRlbmQoe21lcmdlOiBmYWxzZX0sIG9wdGlvbnMsIGFkZE9wdGlvbnMpKTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIGEgbW9kZWwsIG9yIGEgbGlzdCBvZiBtb2RlbHMgZnJvbSB0aGUgc2V0LlxuICAgIHJlbW92ZTogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICB2YXIgc2luZ3VsYXIgPSAhXy5pc0FycmF5KG1vZGVscyk7XG4gICAgICBtb2RlbHMgPSBzaW5ndWxhciA/IFttb2RlbHNdIDogXy5jbG9uZShtb2RlbHMpO1xuICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAgIHZhciBpLCBsLCBpbmRleCwgbW9kZWw7XG4gICAgICBmb3IgKGkgPSAwLCBsID0gbW9kZWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBtb2RlbCA9IG1vZGVsc1tpXSA9IHRoaXMuZ2V0KG1vZGVsc1tpXSk7XG4gICAgICAgIGlmICghbW9kZWwpIGNvbnRpbnVlO1xuICAgICAgICBkZWxldGUgdGhpcy5fYnlJZFttb2RlbC5pZF07XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9ieUlkW21vZGVsLmNpZF07XG4gICAgICAgIGluZGV4ID0gdGhpcy5pbmRleE9mKG1vZGVsKTtcbiAgICAgICAgdGhpcy5tb2RlbHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgdGhpcy5sZW5ndGgtLTtcbiAgICAgICAgaWYgKCFvcHRpb25zLnNpbGVudCkge1xuICAgICAgICAgIG9wdGlvbnMuaW5kZXggPSBpbmRleDtcbiAgICAgICAgICBtb2RlbC50cmlnZ2VyKCdyZW1vdmUnLCBtb2RlbCwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVtb3ZlUmVmZXJlbmNlKG1vZGVsLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzaW5ndWxhciA/IG1vZGVsc1swXSA6IG1vZGVscztcbiAgICB9LFxuXG4gICAgLy8gVXBkYXRlIGEgY29sbGVjdGlvbiBieSBgc2V0YC1pbmcgYSBuZXcgbGlzdCBvZiBtb2RlbHMsIGFkZGluZyBuZXcgb25lcyxcbiAgICAvLyByZW1vdmluZyBtb2RlbHMgdGhhdCBhcmUgbm8gbG9uZ2VyIHByZXNlbnQsIGFuZCBtZXJnaW5nIG1vZGVscyB0aGF0XG4gICAgLy8gYWxyZWFkeSBleGlzdCBpbiB0aGUgY29sbGVjdGlvbiwgYXMgbmVjZXNzYXJ5LiBTaW1pbGFyIHRvICoqTW9kZWwjc2V0KiosXG4gICAgLy8gdGhlIGNvcmUgb3BlcmF0aW9uIGZvciB1cGRhdGluZyB0aGUgZGF0YSBjb250YWluZWQgYnkgdGhlIGNvbGxlY3Rpb24uXG4gICAgc2V0OiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBfLmRlZmF1bHRzKHt9LCBvcHRpb25zLCBzZXRPcHRpb25zKTtcbiAgICAgIGlmIChvcHRpb25zLnBhcnNlKSBtb2RlbHMgPSB0aGlzLnBhcnNlKG1vZGVscywgb3B0aW9ucyk7XG4gICAgICB2YXIgc2luZ3VsYXIgPSAhXy5pc0FycmF5KG1vZGVscyk7XG4gICAgICBtb2RlbHMgPSBzaW5ndWxhciA/IChtb2RlbHMgPyBbbW9kZWxzXSA6IFtdKSA6IF8uY2xvbmUobW9kZWxzKTtcbiAgICAgIHZhciBpLCBsLCBpZCwgbW9kZWwsIGF0dHJzLCBleGlzdGluZywgc29ydDtcbiAgICAgIHZhciBhdCA9IG9wdGlvbnMuYXQ7XG4gICAgICB2YXIgdGFyZ2V0TW9kZWwgPSB0aGlzLm1vZGVsO1xuICAgICAgdmFyIHNvcnRhYmxlID0gdGhpcy5jb21wYXJhdG9yICYmIChhdCA9PSBudWxsKSAmJiBvcHRpb25zLnNvcnQgIT09IGZhbHNlO1xuICAgICAgdmFyIHNvcnRBdHRyID0gXy5pc1N0cmluZyh0aGlzLmNvbXBhcmF0b3IpID8gdGhpcy5jb21wYXJhdG9yIDogbnVsbDtcbiAgICAgIHZhciB0b0FkZCA9IFtdLCB0b1JlbW92ZSA9IFtdLCBtb2RlbE1hcCA9IHt9O1xuICAgICAgdmFyIGFkZCA9IG9wdGlvbnMuYWRkLCBtZXJnZSA9IG9wdGlvbnMubWVyZ2UsIHJlbW92ZSA9IG9wdGlvbnMucmVtb3ZlO1xuICAgICAgdmFyIG9yZGVyID0gIXNvcnRhYmxlICYmIGFkZCAmJiByZW1vdmUgPyBbXSA6IGZhbHNlO1xuXG4gICAgICAvLyBUdXJuIGJhcmUgb2JqZWN0cyBpbnRvIG1vZGVsIHJlZmVyZW5jZXMsIGFuZCBwcmV2ZW50IGludmFsaWQgbW9kZWxzXG4gICAgICAvLyBmcm9tIGJlaW5nIGFkZGVkLlxuICAgICAgZm9yIChpID0gMCwgbCA9IG1vZGVscy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgYXR0cnMgPSBtb2RlbHNbaV0gfHwge307XG4gICAgICAgIGlmIChhdHRycyBpbnN0YW5jZW9mIE1vZGVsKSB7XG4gICAgICAgICAgaWQgPSBtb2RlbCA9IGF0dHJzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlkID0gYXR0cnNbdGFyZ2V0TW9kZWwucHJvdG90eXBlLmlkQXR0cmlidXRlIHx8ICdpZCddO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgYSBkdXBsaWNhdGUgaXMgZm91bmQsIHByZXZlbnQgaXQgZnJvbSBiZWluZyBhZGRlZCBhbmRcbiAgICAgICAgLy8gb3B0aW9uYWxseSBtZXJnZSBpdCBpbnRvIHRoZSBleGlzdGluZyBtb2RlbC5cbiAgICAgICAgaWYgKGV4aXN0aW5nID0gdGhpcy5nZXQoaWQpKSB7XG4gICAgICAgICAgaWYgKHJlbW92ZSkgbW9kZWxNYXBbZXhpc3RpbmcuY2lkXSA9IHRydWU7XG4gICAgICAgICAgaWYgKG1lcmdlKSB7XG4gICAgICAgICAgICBhdHRycyA9IGF0dHJzID09PSBtb2RlbCA/IG1vZGVsLmF0dHJpYnV0ZXMgOiBhdHRycztcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnBhcnNlKSBhdHRycyA9IGV4aXN0aW5nLnBhcnNlKGF0dHJzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGV4aXN0aW5nLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAoc29ydGFibGUgJiYgIXNvcnQgJiYgZXhpc3RpbmcuaGFzQ2hhbmdlZChzb3J0QXR0cikpIHNvcnQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBtb2RlbHNbaV0gPSBleGlzdGluZztcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIGEgbmV3LCB2YWxpZCBtb2RlbCwgcHVzaCBpdCB0byB0aGUgYHRvQWRkYCBsaXN0LlxuICAgICAgICB9IGVsc2UgaWYgKGFkZCkge1xuICAgICAgICAgIG1vZGVsID0gbW9kZWxzW2ldID0gdGhpcy5fcHJlcGFyZU1vZGVsKGF0dHJzLCBvcHRpb25zKTtcbiAgICAgICAgICBpZiAoIW1vZGVsKSBjb250aW51ZTtcbiAgICAgICAgICB0b0FkZC5wdXNoKG1vZGVsKTtcbiAgICAgICAgICB0aGlzLl9hZGRSZWZlcmVuY2UobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG8gbm90IGFkZCBtdWx0aXBsZSBtb2RlbHMgd2l0aCB0aGUgc2FtZSBgaWRgLlxuICAgICAgICBtb2RlbCA9IGV4aXN0aW5nIHx8IG1vZGVsO1xuICAgICAgICBpZiAob3JkZXIgJiYgKG1vZGVsLmlzTmV3KCkgfHwgIW1vZGVsTWFwW21vZGVsLmlkXSkpIG9yZGVyLnB1c2gobW9kZWwpO1xuICAgICAgICBtb2RlbE1hcFttb2RlbC5pZF0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgbm9uZXhpc3RlbnQgbW9kZWxzIGlmIGFwcHJvcHJpYXRlLlxuICAgICAgaWYgKHJlbW92ZSkge1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICBpZiAoIW1vZGVsTWFwWyhtb2RlbCA9IHRoaXMubW9kZWxzW2ldKS5jaWRdKSB0b1JlbW92ZS5wdXNoKG1vZGVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9SZW1vdmUubGVuZ3RoKSB0aGlzLnJlbW92ZSh0b1JlbW92ZSwgb3B0aW9ucyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlZSBpZiBzb3J0aW5nIGlzIG5lZWRlZCwgdXBkYXRlIGBsZW5ndGhgIGFuZCBzcGxpY2UgaW4gbmV3IG1vZGVscy5cbiAgICAgIGlmICh0b0FkZC5sZW5ndGggfHwgKG9yZGVyICYmIG9yZGVyLmxlbmd0aCkpIHtcbiAgICAgICAgaWYgKHNvcnRhYmxlKSBzb3J0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sZW5ndGggKz0gdG9BZGQubGVuZ3RoO1xuICAgICAgICBpZiAoYXQgIT0gbnVsbCkge1xuICAgICAgICAgIGZvciAoaSA9IDAsIGwgPSB0b0FkZC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxzLnNwbGljZShhdCArIGksIDAsIHRvQWRkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG9yZGVyKSB0aGlzLm1vZGVscy5sZW5ndGggPSAwO1xuICAgICAgICAgIHZhciBvcmRlcmVkTW9kZWxzID0gb3JkZXIgfHwgdG9BZGQ7XG4gICAgICAgICAgZm9yIChpID0gMCwgbCA9IG9yZGVyZWRNb2RlbHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVscy5wdXNoKG9yZGVyZWRNb2RlbHNbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTaWxlbnRseSBzb3J0IHRoZSBjb2xsZWN0aW9uIGlmIGFwcHJvcHJpYXRlLlxuICAgICAgaWYgKHNvcnQpIHRoaXMuc29ydCh7c2lsZW50OiB0cnVlfSk7XG5cbiAgICAgIC8vIFVubGVzcyBzaWxlbmNlZCwgaXQncyB0aW1lIHRvIGZpcmUgYWxsIGFwcHJvcHJpYXRlIGFkZC9zb3J0IGV2ZW50cy5cbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IHRvQWRkLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIChtb2RlbCA9IHRvQWRkW2ldKS50cmlnZ2VyKCdhZGQnLCBtb2RlbCwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNvcnQgfHwgKG9yZGVyICYmIG9yZGVyLmxlbmd0aCkpIHRoaXMudHJpZ2dlcignc29ydCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm4gdGhlIGFkZGVkIChvciBtZXJnZWQpIG1vZGVsIChvciBtb2RlbHMpLlxuICAgICAgcmV0dXJuIHNpbmd1bGFyID8gbW9kZWxzWzBdIDogbW9kZWxzO1xuICAgIH0sXG5cbiAgICAvLyBXaGVuIHlvdSBoYXZlIG1vcmUgaXRlbXMgdGhhbiB5b3Ugd2FudCB0byBhZGQgb3IgcmVtb3ZlIGluZGl2aWR1YWxseSxcbiAgICAvLyB5b3UgY2FuIHJlc2V0IHRoZSBlbnRpcmUgc2V0IHdpdGggYSBuZXcgbGlzdCBvZiBtb2RlbHMsIHdpdGhvdXQgZmlyaW5nXG4gICAgLy8gYW55IGdyYW51bGFyIGBhZGRgIG9yIGByZW1vdmVgIGV2ZW50cy4gRmlyZXMgYHJlc2V0YCB3aGVuIGZpbmlzaGVkLlxuICAgIC8vIFVzZWZ1bCBmb3IgYnVsayBvcGVyYXRpb25zIGFuZCBvcHRpbWl6YXRpb25zLlxuICAgIHJlc2V0OiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubW9kZWxzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0aGlzLl9yZW1vdmVSZWZlcmVuY2UodGhpcy5tb2RlbHNbaV0sIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgb3B0aW9ucy5wcmV2aW91c01vZGVscyA9IHRoaXMubW9kZWxzO1xuICAgICAgdGhpcy5fcmVzZXQoKTtcbiAgICAgIG1vZGVscyA9IHRoaXMuYWRkKG1vZGVscywgXy5leHRlbmQoe3NpbGVudDogdHJ1ZX0sIG9wdGlvbnMpKTtcbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMudHJpZ2dlcigncmVzZXQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiBtb2RlbHM7XG4gICAgfSxcblxuICAgIC8vIEFkZCBhIG1vZGVsIHRvIHRoZSBlbmQgb2YgdGhlIGNvbGxlY3Rpb24uXG4gICAgcHVzaDogZnVuY3Rpb24obW9kZWwsIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiB0aGlzLmFkZChtb2RlbCwgXy5leHRlbmQoe2F0OiB0aGlzLmxlbmd0aH0sIG9wdGlvbnMpKTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIGEgbW9kZWwgZnJvbSB0aGUgZW5kIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgIHBvcDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgdmFyIG1vZGVsID0gdGhpcy5hdCh0aGlzLmxlbmd0aCAtIDEpO1xuICAgICAgdGhpcy5yZW1vdmUobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0sXG5cbiAgICAvLyBBZGQgYSBtb2RlbCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgIHVuc2hpZnQ6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5hZGQobW9kZWwsIF8uZXh0ZW5kKHthdDogMH0sIG9wdGlvbnMpKTtcbiAgICB9LFxuXG4gICAgLy8gUmVtb3ZlIGEgbW9kZWwgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBjb2xsZWN0aW9uLlxuICAgIHNoaWZ0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICB2YXIgbW9kZWwgPSB0aGlzLmF0KDApO1xuICAgICAgdGhpcy5yZW1vdmUobW9kZWwsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0sXG5cbiAgICAvLyBTbGljZSBvdXQgYSBzdWItYXJyYXkgb2YgbW9kZWxzIGZyb20gdGhlIGNvbGxlY3Rpb24uXG4gICAgc2xpY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNsaWNlLmFwcGx5KHRoaXMubW9kZWxzLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgYSBtb2RlbCBmcm9tIHRoZSBzZXQgYnkgaWQuXG4gICAgZ2V0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICAgIHJldHVybiB0aGlzLl9ieUlkW29ial0gfHwgdGhpcy5fYnlJZFtvYmouaWRdIHx8IHRoaXMuX2J5SWRbb2JqLmNpZF07XG4gICAgfSxcblxuICAgIC8vIEdldCB0aGUgbW9kZWwgYXQgdGhlIGdpdmVuIGluZGV4LlxuICAgIGF0OiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWxzW2luZGV4XTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJuIG1vZGVscyB3aXRoIG1hdGNoaW5nIGF0dHJpYnV0ZXMuIFVzZWZ1bCBmb3Igc2ltcGxlIGNhc2VzIG9mXG4gICAgLy8gYGZpbHRlcmAuXG4gICAgd2hlcmU6IGZ1bmN0aW9uKGF0dHJzLCBmaXJzdCkge1xuICAgICAgaWYgKF8uaXNFbXB0eShhdHRycykpIHJldHVybiBmaXJzdCA/IHZvaWQgMCA6IFtdO1xuICAgICAgcmV0dXJuIHRoaXNbZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10oZnVuY3Rpb24obW9kZWwpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IG1vZGVsLmdldChrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8gUmV0dXJuIHRoZSBmaXJzdCBtb2RlbCB3aXRoIG1hdGNoaW5nIGF0dHJpYnV0ZXMuIFVzZWZ1bCBmb3Igc2ltcGxlIGNhc2VzXG4gICAgLy8gb2YgYGZpbmRgLlxuICAgIGZpbmRXaGVyZTogZnVuY3Rpb24oYXR0cnMpIHtcbiAgICAgIHJldHVybiB0aGlzLndoZXJlKGF0dHJzLCB0cnVlKTtcbiAgICB9LFxuXG4gICAgLy8gRm9yY2UgdGhlIGNvbGxlY3Rpb24gdG8gcmUtc29ydCBpdHNlbGYuIFlvdSBkb24ndCBuZWVkIHRvIGNhbGwgdGhpcyB1bmRlclxuICAgIC8vIG5vcm1hbCBjaXJjdW1zdGFuY2VzLCBhcyB0aGUgc2V0IHdpbGwgbWFpbnRhaW4gc29ydCBvcmRlciBhcyBlYWNoIGl0ZW1cbiAgICAvLyBpcyBhZGRlZC5cbiAgICBzb3J0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBpZiAoIXRoaXMuY29tcGFyYXRvcikgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc29ydCBhIHNldCB3aXRob3V0IGEgY29tcGFyYXRvcicpO1xuICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgICAgLy8gUnVuIHNvcnQgYmFzZWQgb24gdHlwZSBvZiBgY29tcGFyYXRvcmAuXG4gICAgICBpZiAoXy5pc1N0cmluZyh0aGlzLmNvbXBhcmF0b3IpIHx8IHRoaXMuY29tcGFyYXRvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhpcy5tb2RlbHMgPSB0aGlzLnNvcnRCeSh0aGlzLmNvbXBhcmF0b3IsIHRoaXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tb2RlbHMuc29ydChfLmJpbmQodGhpcy5jb21wYXJhdG9yLCB0aGlzKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMudHJpZ2dlcignc29ydCcsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFBsdWNrIGFuIGF0dHJpYnV0ZSBmcm9tIGVhY2ggbW9kZWwgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgcGx1Y2s6IGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHJldHVybiBfLmludm9rZSh0aGlzLm1vZGVscywgJ2dldCcsIGF0dHIpO1xuICAgIH0sXG5cbiAgICAvLyBGZXRjaCB0aGUgZGVmYXVsdCBzZXQgb2YgbW9kZWxzIGZvciB0aGlzIGNvbGxlY3Rpb24sIHJlc2V0dGluZyB0aGVcbiAgICAvLyBjb2xsZWN0aW9uIHdoZW4gdGhleSBhcnJpdmUuIElmIGByZXNldDogdHJ1ZWAgaXMgcGFzc2VkLCB0aGUgcmVzcG9uc2VcbiAgICAvLyBkYXRhIHdpbGwgYmUgcGFzc2VkIHRocm91Z2ggdGhlIGByZXNldGAgbWV0aG9kIGluc3RlYWQgb2YgYHNldGAuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgICAgaWYgKG9wdGlvbnMucGFyc2UgPT09IHZvaWQgMCkgb3B0aW9ucy5wYXJzZSA9IHRydWU7XG4gICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcbiAgICAgIHZhciBjb2xsZWN0aW9uID0gdGhpcztcbiAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgdmFyIG1ldGhvZCA9IG9wdGlvbnMucmVzZXQgPyAncmVzZXQnIDogJ3NldCc7XG4gICAgICAgIGNvbGxlY3Rpb25bbWV0aG9kXShyZXNwLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MoY29sbGVjdGlvbiwgcmVzcCwgb3B0aW9ucyk7XG4gICAgICAgIGNvbGxlY3Rpb24udHJpZ2dlcignc3luYycsIGNvbGxlY3Rpb24sIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIHdyYXBFcnJvcih0aGlzLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiB0aGlzLnN5bmMoJ3JlYWQnLCB0aGlzLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIGEgbW9kZWwgaW4gdGhpcyBjb2xsZWN0aW9uLiBBZGQgdGhlIG1vZGVsIHRvIHRoZVxuICAgIC8vIGNvbGxlY3Rpb24gaW1tZWRpYXRlbHksIHVubGVzcyBgd2FpdDogdHJ1ZWAgaXMgcGFzc2VkLCBpbiB3aGljaCBjYXNlIHdlXG4gICAgLy8gd2FpdCBmb3IgdGhlIHNlcnZlciB0byBhZ3JlZS5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uKG1vZGVsLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyA/IF8uY2xvbmUob3B0aW9ucykgOiB7fTtcbiAgICAgIGlmICghKG1vZGVsID0gdGhpcy5fcHJlcGFyZU1vZGVsKG1vZGVsLCBvcHRpb25zKSkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghb3B0aW9ucy53YWl0KSB0aGlzLmFkZChtb2RlbCwgb3B0aW9ucyk7XG4gICAgICB2YXIgY29sbGVjdGlvbiA9IHRoaXM7XG4gICAgICB2YXIgc3VjY2VzcyA9IG9wdGlvbnMuc3VjY2VzcztcbiAgICAgIG9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uKG1vZGVsLCByZXNwKSB7XG4gICAgICAgIGlmIChvcHRpb25zLndhaXQpIGNvbGxlY3Rpb24uYWRkKG1vZGVsLCBvcHRpb25zKTtcbiAgICAgICAgaWYgKHN1Y2Nlc3MpIHN1Y2Nlc3MobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgfTtcbiAgICAgIG1vZGVsLnNhdmUobnVsbCwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gbW9kZWw7XG4gICAgfSxcblxuICAgIC8vICoqcGFyc2UqKiBjb252ZXJ0cyBhIHJlc3BvbnNlIGludG8gYSBsaXN0IG9mIG1vZGVscyB0byBiZSBhZGRlZCB0byB0aGVcbiAgICAvLyBjb2xsZWN0aW9uLiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiBpcyBqdXN0IHRvIHBhc3MgaXQgdGhyb3VnaC5cbiAgICBwYXJzZTogZnVuY3Rpb24ocmVzcCwgb3B0aW9ucykge1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSxcblxuICAgIC8vIENyZWF0ZSBhIG5ldyBjb2xsZWN0aW9uIHdpdGggYW4gaWRlbnRpY2FsIGxpc3Qgb2YgbW9kZWxzIGFzIHRoaXMgb25lLlxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLm1vZGVscyk7XG4gICAgfSxcblxuICAgIC8vIFByaXZhdGUgbWV0aG9kIHRvIHJlc2V0IGFsbCBpbnRlcm5hbCBzdGF0ZS4gQ2FsbGVkIHdoZW4gdGhlIGNvbGxlY3Rpb25cbiAgICAvLyBpcyBmaXJzdCBpbml0aWFsaXplZCBvciByZXNldC5cbiAgICBfcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5sZW5ndGggPSAwO1xuICAgICAgdGhpcy5tb2RlbHMgPSBbXTtcbiAgICAgIHRoaXMuX2J5SWQgID0ge307XG4gICAgfSxcblxuICAgIC8vIFByZXBhcmUgYSBoYXNoIG9mIGF0dHJpYnV0ZXMgKG9yIG90aGVyIG1vZGVsKSB0byBiZSBhZGRlZCB0byB0aGlzXG4gICAgLy8gY29sbGVjdGlvbi5cbiAgICBfcHJlcGFyZU1vZGVsOiBmdW5jdGlvbihhdHRycywgb3B0aW9ucykge1xuICAgICAgaWYgKGF0dHJzIGluc3RhbmNlb2YgTW9kZWwpIHJldHVybiBhdHRycztcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgICAgb3B0aW9ucy5jb2xsZWN0aW9uID0gdGhpcztcbiAgICAgIHZhciBtb2RlbCA9IG5ldyB0aGlzLm1vZGVsKGF0dHJzLCBvcHRpb25zKTtcbiAgICAgIGlmICghbW9kZWwudmFsaWRhdGlvbkVycm9yKSByZXR1cm4gbW9kZWw7XG4gICAgICB0aGlzLnRyaWdnZXIoJ2ludmFsaWQnLCB0aGlzLCBtb2RlbC52YWxpZGF0aW9uRXJyb3IsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBJbnRlcm5hbCBtZXRob2QgdG8gY3JlYXRlIGEgbW9kZWwncyB0aWVzIHRvIGEgY29sbGVjdGlvbi5cbiAgICBfYWRkUmVmZXJlbmNlOiBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgICAgdGhpcy5fYnlJZFttb2RlbC5jaWRdID0gbW9kZWw7XG4gICAgICBpZiAobW9kZWwuaWQgIT0gbnVsbCkgdGhpcy5fYnlJZFttb2RlbC5pZF0gPSBtb2RlbDtcbiAgICAgIGlmICghbW9kZWwuY29sbGVjdGlvbikgbW9kZWwuY29sbGVjdGlvbiA9IHRoaXM7XG4gICAgICBtb2RlbC5vbignYWxsJywgdGhpcy5fb25Nb2RlbEV2ZW50LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgLy8gSW50ZXJuYWwgbWV0aG9kIHRvIHNldmVyIGEgbW9kZWwncyB0aWVzIHRvIGEgY29sbGVjdGlvbi5cbiAgICBfcmVtb3ZlUmVmZXJlbmNlOiBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgICAgaWYgKHRoaXMgPT09IG1vZGVsLmNvbGxlY3Rpb24pIGRlbGV0ZSBtb2RlbC5jb2xsZWN0aW9uO1xuICAgICAgbW9kZWwub2ZmKCdhbGwnLCB0aGlzLl9vbk1vZGVsRXZlbnQsIHRoaXMpO1xuICAgIH0sXG5cbiAgICAvLyBJbnRlcm5hbCBtZXRob2QgY2FsbGVkIGV2ZXJ5IHRpbWUgYSBtb2RlbCBpbiB0aGUgc2V0IGZpcmVzIGFuIGV2ZW50LlxuICAgIC8vIFNldHMgbmVlZCB0byB1cGRhdGUgdGhlaXIgaW5kZXhlcyB3aGVuIG1vZGVscyBjaGFuZ2UgaWRzLiBBbGwgb3RoZXJcbiAgICAvLyBldmVudHMgc2ltcGx5IHByb3h5IHRocm91Z2guIFwiYWRkXCIgYW5kIFwicmVtb3ZlXCIgZXZlbnRzIHRoYXQgb3JpZ2luYXRlXG4gICAgLy8gaW4gb3RoZXIgY29sbGVjdGlvbnMgYXJlIGlnbm9yZWQuXG4gICAgX29uTW9kZWxFdmVudDogZnVuY3Rpb24oZXZlbnQsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKSB7XG4gICAgICBpZiAoKGV2ZW50ID09PSAnYWRkJyB8fCBldmVudCA9PT0gJ3JlbW92ZScpICYmIGNvbGxlY3Rpb24gIT09IHRoaXMpIHJldHVybjtcbiAgICAgIGlmIChldmVudCA9PT0gJ2Rlc3Ryb3knKSB0aGlzLnJlbW92ZShtb2RlbCwgb3B0aW9ucyk7XG4gICAgICBpZiAobW9kZWwgJiYgZXZlbnQgPT09ICdjaGFuZ2U6JyArIG1vZGVsLmlkQXR0cmlidXRlKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9ieUlkW21vZGVsLnByZXZpb3VzKG1vZGVsLmlkQXR0cmlidXRlKV07XG4gICAgICAgIGlmIChtb2RlbC5pZCAhPSBudWxsKSB0aGlzLl9ieUlkW21vZGVsLmlkXSA9IG1vZGVsO1xuICAgICAgfVxuICAgICAgdGhpcy50cmlnZ2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIFVuZGVyc2NvcmUgbWV0aG9kcyB0aGF0IHdlIHdhbnQgdG8gaW1wbGVtZW50IG9uIHRoZSBDb2xsZWN0aW9uLlxuICAvLyA5MCUgb2YgdGhlIGNvcmUgdXNlZnVsbmVzcyBvZiBCYWNrYm9uZSBDb2xsZWN0aW9ucyBpcyBhY3R1YWxseSBpbXBsZW1lbnRlZFxuICAvLyByaWdodCBoZXJlOlxuICB2YXIgbWV0aG9kcyA9IFsnZm9yRWFjaCcsICdlYWNoJywgJ21hcCcsICdjb2xsZWN0JywgJ3JlZHVjZScsICdmb2xkbCcsXG4gICAgJ2luamVjdCcsICdyZWR1Y2VSaWdodCcsICdmb2xkcicsICdmaW5kJywgJ2RldGVjdCcsICdmaWx0ZXInLCAnc2VsZWN0JyxcbiAgICAncmVqZWN0JywgJ2V2ZXJ5JywgJ2FsbCcsICdzb21lJywgJ2FueScsICdpbmNsdWRlJywgJ2NvbnRhaW5zJywgJ2ludm9rZScsXG4gICAgJ21heCcsICdtaW4nLCAndG9BcnJheScsICdzaXplJywgJ2ZpcnN0JywgJ2hlYWQnLCAndGFrZScsICdpbml0aWFsJywgJ3Jlc3QnLFxuICAgICd0YWlsJywgJ2Ryb3AnLCAnbGFzdCcsICd3aXRob3V0JywgJ2RpZmZlcmVuY2UnLCAnaW5kZXhPZicsICdzaHVmZmxlJyxcbiAgICAnbGFzdEluZGV4T2YnLCAnaXNFbXB0eScsICdjaGFpbicsICdzYW1wbGUnXTtcblxuICAvLyBNaXggaW4gZWFjaCBVbmRlcnNjb3JlIG1ldGhvZCBhcyBhIHByb3h5IHRvIGBDb2xsZWN0aW9uI21vZGVsc2AuXG4gIF8uZWFjaChtZXRob2RzLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBDb2xsZWN0aW9uLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgIGFyZ3MudW5zaGlmdCh0aGlzLm1vZGVscyk7XG4gICAgICByZXR1cm4gX1ttZXRob2RdLmFwcGx5KF8sIGFyZ3MpO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIFVuZGVyc2NvcmUgbWV0aG9kcyB0aGF0IHRha2UgYSBwcm9wZXJ0eSBuYW1lIGFzIGFuIGFyZ3VtZW50LlxuICB2YXIgYXR0cmlidXRlTWV0aG9kcyA9IFsnZ3JvdXBCeScsICdjb3VudEJ5JywgJ3NvcnRCeScsICdpbmRleEJ5J107XG5cbiAgLy8gVXNlIGF0dHJpYnV0ZXMgaW5zdGVhZCBvZiBwcm9wZXJ0aWVzLlxuICBfLmVhY2goYXR0cmlidXRlTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgQ29sbGVjdGlvbi5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUgOiBmdW5jdGlvbihtb2RlbCkge1xuICAgICAgICByZXR1cm4gbW9kZWwuZ2V0KHZhbHVlKTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gX1ttZXRob2RdKHRoaXMubW9kZWxzLCBpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQmFja2JvbmUuVmlld1xuICAvLyAtLS0tLS0tLS0tLS0tXG5cbiAgLy8gQmFja2JvbmUgVmlld3MgYXJlIGFsbW9zdCBtb3JlIGNvbnZlbnRpb24gdGhhbiB0aGV5IGFyZSBhY3R1YWwgY29kZS4gQSBWaWV3XG4gIC8vIGlzIHNpbXBseSBhIEphdmFTY3JpcHQgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyBhIGxvZ2ljYWwgY2h1bmsgb2YgVUkgaW4gdGhlXG4gIC8vIERPTS4gVGhpcyBtaWdodCBiZSBhIHNpbmdsZSBpdGVtLCBhbiBlbnRpcmUgbGlzdCwgYSBzaWRlYmFyIG9yIHBhbmVsLCBvclxuICAvLyBldmVuIHRoZSBzdXJyb3VuZGluZyBmcmFtZSB3aGljaCB3cmFwcyB5b3VyIHdob2xlIGFwcC4gRGVmaW5pbmcgYSBjaHVuayBvZlxuICAvLyBVSSBhcyBhICoqVmlldyoqIGFsbG93cyB5b3UgdG8gZGVmaW5lIHlvdXIgRE9NIGV2ZW50cyBkZWNsYXJhdGl2ZWx5LCB3aXRob3V0XG4gIC8vIGhhdmluZyB0byB3b3JyeSBhYm91dCByZW5kZXIgb3JkZXIgLi4uIGFuZCBtYWtlcyBpdCBlYXN5IGZvciB0aGUgdmlldyB0b1xuICAvLyByZWFjdCB0byBzcGVjaWZpYyBjaGFuZ2VzIGluIHRoZSBzdGF0ZSBvZiB5b3VyIG1vZGVscy5cblxuICAvLyBDcmVhdGluZyBhIEJhY2tib25lLlZpZXcgY3JlYXRlcyBpdHMgaW5pdGlhbCBlbGVtZW50IG91dHNpZGUgb2YgdGhlIERPTSxcbiAgLy8gaWYgYW4gZXhpc3RpbmcgZWxlbWVudCBpcyBub3QgcHJvdmlkZWQuLi5cbiAgdmFyIFZpZXcgPSBCYWNrYm9uZS5WaWV3ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgndmlldycpO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgXy5leHRlbmQodGhpcywgXy5waWNrKG9wdGlvbnMsIHZpZXdPcHRpb25zKSk7XG4gICAgdGhpcy5fZW5zdXJlRWxlbWVudCgpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHRoaXMuZGVsZWdhdGVFdmVudHMoKTtcbiAgfTtcblxuICAvLyBDYWNoZWQgcmVnZXggdG8gc3BsaXQga2V5cyBmb3IgYGRlbGVnYXRlYC5cbiAgdmFyIGRlbGVnYXRlRXZlbnRTcGxpdHRlciA9IC9eKFxcUyspXFxzKiguKikkLztcblxuICAvLyBMaXN0IG9mIHZpZXcgb3B0aW9ucyB0byBiZSBtZXJnZWQgYXMgcHJvcGVydGllcy5cbiAgdmFyIHZpZXdPcHRpb25zID0gWydtb2RlbCcsICdjb2xsZWN0aW9uJywgJ2VsJywgJ2lkJywgJ2F0dHJpYnV0ZXMnLCAnY2xhc3NOYW1lJywgJ3RhZ05hbWUnLCAnZXZlbnRzJ107XG5cbiAgLy8gU2V0IHVwIGFsbCBpbmhlcml0YWJsZSAqKkJhY2tib25lLlZpZXcqKiBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzLlxuICBfLmV4dGVuZChWaWV3LnByb3RvdHlwZSwgRXZlbnRzLCB7XG5cbiAgICAvLyBUaGUgZGVmYXVsdCBgdGFnTmFtZWAgb2YgYSBWaWV3J3MgZWxlbWVudCBpcyBgXCJkaXZcImAuXG4gICAgdGFnTmFtZTogJ2RpdicsXG5cbiAgICAvLyBqUXVlcnkgZGVsZWdhdGUgZm9yIGVsZW1lbnQgbG9va3VwLCBzY29wZWQgdG8gRE9NIGVsZW1lbnRzIHdpdGhpbiB0aGVcbiAgICAvLyBjdXJyZW50IHZpZXcuIFRoaXMgc2hvdWxkIGJlIHByZWZlcnJlZCB0byBnbG9iYWwgbG9va3VwcyB3aGVyZSBwb3NzaWJsZS5cbiAgICAkOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgcmV0dXJuIHRoaXMuJGVsLmZpbmQoc2VsZWN0b3IpO1xuICAgIH0sXG5cbiAgICAvLyBJbml0aWFsaXplIGlzIGFuIGVtcHR5IGZ1bmN0aW9uIGJ5IGRlZmF1bHQuIE92ZXJyaWRlIGl0IHdpdGggeW91ciBvd25cbiAgICAvLyBpbml0aWFsaXphdGlvbiBsb2dpYy5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpe30sXG5cbiAgICAvLyAqKnJlbmRlcioqIGlzIHRoZSBjb3JlIGZ1bmN0aW9uIHRoYXQgeW91ciB2aWV3IHNob3VsZCBvdmVycmlkZSwgaW4gb3JkZXJcbiAgICAvLyB0byBwb3B1bGF0ZSBpdHMgZWxlbWVudCAoYHRoaXMuZWxgKSwgd2l0aCB0aGUgYXBwcm9wcmlhdGUgSFRNTC4gVGhlXG4gICAgLy8gY29udmVudGlvbiBpcyBmb3IgKipyZW5kZXIqKiB0byBhbHdheXMgcmV0dXJuIGB0aGlzYC5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIFJlbW92ZSB0aGlzIHZpZXcgYnkgdGFraW5nIHRoZSBlbGVtZW50IG91dCBvZiB0aGUgRE9NLCBhbmQgcmVtb3ZpbmcgYW55XG4gICAgLy8gYXBwbGljYWJsZSBCYWNrYm9uZS5FdmVudHMgbGlzdGVuZXJzLlxuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLiRlbC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3RvcExpc3RlbmluZygpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIENoYW5nZSB0aGUgdmlldydzIGVsZW1lbnQgKGB0aGlzLmVsYCBwcm9wZXJ0eSksIGluY2x1ZGluZyBldmVudFxuICAgIC8vIHJlLWRlbGVnYXRpb24uXG4gICAgc2V0RWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCwgZGVsZWdhdGUpIHtcbiAgICAgIGlmICh0aGlzLiRlbCkgdGhpcy51bmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICB0aGlzLiRlbCA9IGVsZW1lbnQgaW5zdGFuY2VvZiBCYWNrYm9uZS4kID8gZWxlbWVudCA6IEJhY2tib25lLiQoZWxlbWVudCk7XG4gICAgICB0aGlzLmVsID0gdGhpcy4kZWxbMF07XG4gICAgICBpZiAoZGVsZWdhdGUgIT09IGZhbHNlKSB0aGlzLmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gU2V0IGNhbGxiYWNrcywgd2hlcmUgYHRoaXMuZXZlbnRzYCBpcyBhIGhhc2ggb2ZcbiAgICAvL1xuICAgIC8vICp7XCJldmVudCBzZWxlY3RvclwiOiBcImNhbGxiYWNrXCJ9KlxuICAgIC8vXG4gICAgLy8gICAgIHtcbiAgICAvLyAgICAgICAnbW91c2Vkb3duIC50aXRsZSc6ICAnZWRpdCcsXG4gICAgLy8gICAgICAgJ2NsaWNrIC5idXR0b24nOiAgICAgJ3NhdmUnLFxuICAgIC8vICAgICAgICdjbGljayAub3Blbic6ICAgICAgIGZ1bmN0aW9uKGUpIHsgLi4uIH1cbiAgICAvLyAgICAgfVxuICAgIC8vXG4gICAgLy8gcGFpcnMuIENhbGxiYWNrcyB3aWxsIGJlIGJvdW5kIHRvIHRoZSB2aWV3LCB3aXRoIGB0aGlzYCBzZXQgcHJvcGVybHkuXG4gICAgLy8gVXNlcyBldmVudCBkZWxlZ2F0aW9uIGZvciBlZmZpY2llbmN5LlxuICAgIC8vIE9taXR0aW5nIHRoZSBzZWxlY3RvciBiaW5kcyB0aGUgZXZlbnQgdG8gYHRoaXMuZWxgLlxuICAgIC8vIFRoaXMgb25seSB3b3JrcyBmb3IgZGVsZWdhdGUtYWJsZSBldmVudHM6IG5vdCBgZm9jdXNgLCBgYmx1cmAsIGFuZFxuICAgIC8vIG5vdCBgY2hhbmdlYCwgYHN1Ym1pdGAsIGFuZCBgcmVzZXRgIGluIEludGVybmV0IEV4cGxvcmVyLlxuICAgIGRlbGVnYXRlRXZlbnRzOiBmdW5jdGlvbihldmVudHMpIHtcbiAgICAgIGlmICghKGV2ZW50cyB8fCAoZXZlbnRzID0gXy5yZXN1bHQodGhpcywgJ2V2ZW50cycpKSkpIHJldHVybiB0aGlzO1xuICAgICAgdGhpcy51bmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gZXZlbnRzKSB7XG4gICAgICAgIHZhciBtZXRob2QgPSBldmVudHNba2V5XTtcbiAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24obWV0aG9kKSkgbWV0aG9kID0gdGhpc1tldmVudHNba2V5XV07XG4gICAgICAgIGlmICghbWV0aG9kKSBjb250aW51ZTtcblxuICAgICAgICB2YXIgbWF0Y2ggPSBrZXkubWF0Y2goZGVsZWdhdGVFdmVudFNwbGl0dGVyKTtcbiAgICAgICAgdmFyIGV2ZW50TmFtZSA9IG1hdGNoWzFdLCBzZWxlY3RvciA9IG1hdGNoWzJdO1xuICAgICAgICBtZXRob2QgPSBfLmJpbmQobWV0aG9kLCB0aGlzKTtcbiAgICAgICAgZXZlbnROYW1lICs9ICcuZGVsZWdhdGVFdmVudHMnICsgdGhpcy5jaWQ7XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHtcbiAgICAgICAgICB0aGlzLiRlbC5vbihldmVudE5hbWUsIG1ldGhvZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4kZWwub24oZXZlbnROYW1lLCBzZWxlY3RvciwgbWV0aG9kKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIENsZWFycyBhbGwgY2FsbGJhY2tzIHByZXZpb3VzbHkgYm91bmQgdG8gdGhlIHZpZXcgd2l0aCBgZGVsZWdhdGVFdmVudHNgLlxuICAgIC8vIFlvdSB1c3VhbGx5IGRvbid0IG5lZWQgdG8gdXNlIHRoaXMsIGJ1dCBtYXkgd2lzaCB0byBpZiB5b3UgaGF2ZSBtdWx0aXBsZVxuICAgIC8vIEJhY2tib25lIHZpZXdzIGF0dGFjaGVkIHRvIHRoZSBzYW1lIERPTSBlbGVtZW50LlxuICAgIHVuZGVsZWdhdGVFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kZWwub2ZmKCcuZGVsZWdhdGVFdmVudHMnICsgdGhpcy5jaWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBWaWV3IGhhcyBhIERPTSBlbGVtZW50IHRvIHJlbmRlciBpbnRvLlxuICAgIC8vIElmIGB0aGlzLmVsYCBpcyBhIHN0cmluZywgcGFzcyBpdCB0aHJvdWdoIGAkKClgLCB0YWtlIHRoZSBmaXJzdFxuICAgIC8vIG1hdGNoaW5nIGVsZW1lbnQsIGFuZCByZS1hc3NpZ24gaXQgdG8gYGVsYC4gT3RoZXJ3aXNlLCBjcmVhdGVcbiAgICAvLyBhbiBlbGVtZW50IGZyb20gdGhlIGBpZGAsIGBjbGFzc05hbWVgIGFuZCBgdGFnTmFtZWAgcHJvcGVydGllcy5cbiAgICBfZW5zdXJlRWxlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuZWwpIHtcbiAgICAgICAgdmFyIGF0dHJzID0gXy5leHRlbmQoe30sIF8ucmVzdWx0KHRoaXMsICdhdHRyaWJ1dGVzJykpO1xuICAgICAgICBpZiAodGhpcy5pZCkgYXR0cnMuaWQgPSBfLnJlc3VsdCh0aGlzLCAnaWQnKTtcbiAgICAgICAgaWYgKHRoaXMuY2xhc3NOYW1lKSBhdHRyc1snY2xhc3MnXSA9IF8ucmVzdWx0KHRoaXMsICdjbGFzc05hbWUnKTtcbiAgICAgICAgdmFyICRlbCA9IEJhY2tib25lLiQoJzwnICsgXy5yZXN1bHQodGhpcywgJ3RhZ05hbWUnKSArICc+JykuYXR0cihhdHRycyk7XG4gICAgICAgIHRoaXMuc2V0RWxlbWVudCgkZWwsIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0RWxlbWVudChfLnJlc3VsdCh0aGlzLCAnZWwnKSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICB9KTtcblxuICAvLyBCYWNrYm9uZS5zeW5jXG4gIC8vIC0tLS0tLS0tLS0tLS1cblxuICAvLyBPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIHRvIGNoYW5nZSB0aGUgbWFubmVyIGluIHdoaWNoIEJhY2tib25lIHBlcnNpc3RzXG4gIC8vIG1vZGVscyB0byB0aGUgc2VydmVyLiBZb3Ugd2lsbCBiZSBwYXNzZWQgdGhlIHR5cGUgb2YgcmVxdWVzdCwgYW5kIHRoZVxuICAvLyBtb2RlbCBpbiBxdWVzdGlvbi4gQnkgZGVmYXVsdCwgbWFrZXMgYSBSRVNUZnVsIEFqYXggcmVxdWVzdFxuICAvLyB0byB0aGUgbW9kZWwncyBgdXJsKClgLiBTb21lIHBvc3NpYmxlIGN1c3RvbWl6YXRpb25zIGNvdWxkIGJlOlxuICAvL1xuICAvLyAqIFVzZSBgc2V0VGltZW91dGAgdG8gYmF0Y2ggcmFwaWQtZmlyZSB1cGRhdGVzIGludG8gYSBzaW5nbGUgcmVxdWVzdC5cbiAgLy8gKiBTZW5kIHVwIHRoZSBtb2RlbHMgYXMgWE1MIGluc3RlYWQgb2YgSlNPTi5cbiAgLy8gKiBQZXJzaXN0IG1vZGVscyB2aWEgV2ViU29ja2V0cyBpbnN0ZWFkIG9mIEFqYXguXG4gIC8vXG4gIC8vIFR1cm4gb24gYEJhY2tib25lLmVtdWxhdGVIVFRQYCBpbiBvcmRlciB0byBzZW5kIGBQVVRgIGFuZCBgREVMRVRFYCByZXF1ZXN0c1xuICAvLyBhcyBgUE9TVGAsIHdpdGggYSBgX21ldGhvZGAgcGFyYW1ldGVyIGNvbnRhaW5pbmcgdGhlIHRydWUgSFRUUCBtZXRob2QsXG4gIC8vIGFzIHdlbGwgYXMgYWxsIHJlcXVlc3RzIHdpdGggdGhlIGJvZHkgYXMgYGFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZGBcbiAgLy8gaW5zdGVhZCBvZiBgYXBwbGljYXRpb24vanNvbmAgd2l0aCB0aGUgbW9kZWwgaW4gYSBwYXJhbSBuYW1lZCBgbW9kZWxgLlxuICAvLyBVc2VmdWwgd2hlbiBpbnRlcmZhY2luZyB3aXRoIHNlcnZlci1zaWRlIGxhbmd1YWdlcyBsaWtlICoqUEhQKiogdGhhdCBtYWtlXG4gIC8vIGl0IGRpZmZpY3VsdCB0byByZWFkIHRoZSBib2R5IG9mIGBQVVRgIHJlcXVlc3RzLlxuICBCYWNrYm9uZS5zeW5jID0gZnVuY3Rpb24obWV0aG9kLCBtb2RlbCwgb3B0aW9ucykge1xuICAgIHZhciB0eXBlID0gbWV0aG9kTWFwW21ldGhvZF07XG5cbiAgICAvLyBEZWZhdWx0IG9wdGlvbnMsIHVubGVzcyBzcGVjaWZpZWQuXG4gICAgXy5kZWZhdWx0cyhvcHRpb25zIHx8IChvcHRpb25zID0ge30pLCB7XG4gICAgICBlbXVsYXRlSFRUUDogQmFja2JvbmUuZW11bGF0ZUhUVFAsXG4gICAgICBlbXVsYXRlSlNPTjogQmFja2JvbmUuZW11bGF0ZUpTT05cbiAgICB9KTtcblxuICAgIC8vIERlZmF1bHQgSlNPTi1yZXF1ZXN0IG9wdGlvbnMuXG4gICAgdmFyIHBhcmFtcyA9IHt0eXBlOiB0eXBlLCBkYXRhVHlwZTogJ2pzb24nfTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYSBVUkwuXG4gICAgaWYgKCFvcHRpb25zLnVybCkge1xuICAgICAgcGFyYW1zLnVybCA9IF8ucmVzdWx0KG1vZGVsLCAndXJsJykgfHwgdXJsRXJyb3IoKTtcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIHRoZSBhcHByb3ByaWF0ZSByZXF1ZXN0IGRhdGEuXG4gICAgaWYgKG9wdGlvbnMuZGF0YSA9PSBudWxsICYmIG1vZGVsICYmIChtZXRob2QgPT09ICdjcmVhdGUnIHx8IG1ldGhvZCA9PT0gJ3VwZGF0ZScgfHwgbWV0aG9kID09PSAncGF0Y2gnKSkge1xuICAgICAgcGFyYW1zLmNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgcGFyYW1zLmRhdGEgPSBKU09OLnN0cmluZ2lmeShvcHRpb25zLmF0dHJzIHx8IG1vZGVsLnRvSlNPTihvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgLy8gRm9yIG9sZGVyIHNlcnZlcnMsIGVtdWxhdGUgSlNPTiBieSBlbmNvZGluZyB0aGUgcmVxdWVzdCBpbnRvIGFuIEhUTUwtZm9ybS5cbiAgICBpZiAob3B0aW9ucy5lbXVsYXRlSlNPTikge1xuICAgICAgcGFyYW1zLmNvbnRlbnRUeXBlID0gJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCc7XG4gICAgICBwYXJhbXMuZGF0YSA9IHBhcmFtcy5kYXRhID8ge21vZGVsOiBwYXJhbXMuZGF0YX0gOiB7fTtcbiAgICB9XG5cbiAgICAvLyBGb3Igb2xkZXIgc2VydmVycywgZW11bGF0ZSBIVFRQIGJ5IG1pbWlja2luZyB0aGUgSFRUUCBtZXRob2Qgd2l0aCBgX21ldGhvZGBcbiAgICAvLyBBbmQgYW4gYFgtSFRUUC1NZXRob2QtT3ZlcnJpZGVgIGhlYWRlci5cbiAgICBpZiAob3B0aW9ucy5lbXVsYXRlSFRUUCAmJiAodHlwZSA9PT0gJ1BVVCcgfHwgdHlwZSA9PT0gJ0RFTEVURScgfHwgdHlwZSA9PT0gJ1BBVENIJykpIHtcbiAgICAgIHBhcmFtcy50eXBlID0gJ1BPU1QnO1xuICAgICAgaWYgKG9wdGlvbnMuZW11bGF0ZUpTT04pIHBhcmFtcy5kYXRhLl9tZXRob2QgPSB0eXBlO1xuICAgICAgdmFyIGJlZm9yZVNlbmQgPSBvcHRpb25zLmJlZm9yZVNlbmQ7XG4gICAgICBvcHRpb25zLmJlZm9yZVNlbmQgPSBmdW5jdGlvbih4aHIpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtSFRUUC1NZXRob2QtT3ZlcnJpZGUnLCB0eXBlKTtcbiAgICAgICAgaWYgKGJlZm9yZVNlbmQpIHJldHVybiBiZWZvcmVTZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIERvbid0IHByb2Nlc3MgZGF0YSBvbiBhIG5vbi1HRVQgcmVxdWVzdC5cbiAgICBpZiAocGFyYW1zLnR5cGUgIT09ICdHRVQnICYmICFvcHRpb25zLmVtdWxhdGVKU09OKSB7XG4gICAgICBwYXJhbXMucHJvY2Vzc0RhdGEgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSdyZSBzZW5kaW5nIGEgYFBBVENIYCByZXF1ZXN0LCBhbmQgd2UncmUgaW4gYW4gb2xkIEludGVybmV0IEV4cGxvcmVyXG4gICAgLy8gdGhhdCBzdGlsbCBoYXMgQWN0aXZlWCBlbmFibGVkIGJ5IGRlZmF1bHQsIG92ZXJyaWRlIGpRdWVyeSB0byB1c2UgdGhhdFxuICAgIC8vIGZvciBYSFIgaW5zdGVhZC4gUmVtb3ZlIHRoaXMgbGluZSB3aGVuIGpRdWVyeSBzdXBwb3J0cyBgUEFUQ0hgIG9uIElFOC5cbiAgICBpZiAocGFyYW1zLnR5cGUgPT09ICdQQVRDSCcgJiYgbm9YaHJQYXRjaCkge1xuICAgICAgcGFyYW1zLnhociA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoXCJNaWNyb3NvZnQuWE1MSFRUUFwiKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gTWFrZSB0aGUgcmVxdWVzdCwgYWxsb3dpbmcgdGhlIHVzZXIgdG8gb3ZlcnJpZGUgYW55IEFqYXggb3B0aW9ucy5cbiAgICB2YXIgeGhyID0gb3B0aW9ucy54aHIgPSBCYWNrYm9uZS5hamF4KF8uZXh0ZW5kKHBhcmFtcywgb3B0aW9ucykpO1xuICAgIG1vZGVsLnRyaWdnZXIoJ3JlcXVlc3QnLCBtb2RlbCwgeGhyLCBvcHRpb25zKTtcbiAgICByZXR1cm4geGhyO1xuICB9O1xuXG4gIHZhciBub1hoclBhdGNoID1cbiAgICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiAhIXdpbmRvdy5BY3RpdmVYT2JqZWN0ICYmXG4gICAgICAhKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCAmJiAobmV3IFhNTEh0dHBSZXF1ZXN0KS5kaXNwYXRjaEV2ZW50KTtcblxuICAvLyBNYXAgZnJvbSBDUlVEIHRvIEhUVFAgZm9yIG91ciBkZWZhdWx0IGBCYWNrYm9uZS5zeW5jYCBpbXBsZW1lbnRhdGlvbi5cbiAgdmFyIG1ldGhvZE1hcCA9IHtcbiAgICAnY3JlYXRlJzogJ1BPU1QnLFxuICAgICd1cGRhdGUnOiAnUFVUJyxcbiAgICAncGF0Y2gnOiAgJ1BBVENIJyxcbiAgICAnZGVsZXRlJzogJ0RFTEVURScsXG4gICAgJ3JlYWQnOiAgICdHRVQnXG4gIH07XG5cbiAgLy8gU2V0IHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGBCYWNrYm9uZS5hamF4YCB0byBwcm94eSB0aHJvdWdoIHRvIGAkYC5cbiAgLy8gT3ZlcnJpZGUgdGhpcyBpZiB5b3UnZCBsaWtlIHRvIHVzZSBhIGRpZmZlcmVudCBsaWJyYXJ5LlxuICBCYWNrYm9uZS5hamF4ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEJhY2tib25lLiQuYWpheC5hcHBseShCYWNrYm9uZS4kLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIEJhY2tib25lLlJvdXRlclxuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSb3V0ZXJzIG1hcCBmYXV4LVVSTHMgdG8gYWN0aW9ucywgYW5kIGZpcmUgZXZlbnRzIHdoZW4gcm91dGVzIGFyZVxuICAvLyBtYXRjaGVkLiBDcmVhdGluZyBhIG5ldyBvbmUgc2V0cyBpdHMgYHJvdXRlc2AgaGFzaCwgaWYgbm90IHNldCBzdGF0aWNhbGx5LlxuICB2YXIgUm91dGVyID0gQmFja2JvbmUuUm91dGVyID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgaWYgKG9wdGlvbnMucm91dGVzKSB0aGlzLnJvdXRlcyA9IG9wdGlvbnMucm91dGVzO1xuICAgIHRoaXMuX2JpbmRSb3V0ZXMoKTtcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICAvLyBDYWNoZWQgcmVndWxhciBleHByZXNzaW9ucyBmb3IgbWF0Y2hpbmcgbmFtZWQgcGFyYW0gcGFydHMgYW5kIHNwbGF0dGVkXG4gIC8vIHBhcnRzIG9mIHJvdXRlIHN0cmluZ3MuXG4gIHZhciBvcHRpb25hbFBhcmFtID0gL1xcKCguKj8pXFwpL2c7XG4gIHZhciBuYW1lZFBhcmFtICAgID0gLyhcXChcXD8pPzpcXHcrL2c7XG4gIHZhciBzcGxhdFBhcmFtICAgID0gL1xcKlxcdysvZztcbiAgdmFyIGVzY2FwZVJlZ0V4cCAgPSAvW1xcLXt9XFxbXFxdKz8uLFxcXFxcXF4kfCNcXHNdL2c7XG5cbiAgLy8gU2V0IHVwIGFsbCBpbmhlcml0YWJsZSAqKkJhY2tib25lLlJvdXRlcioqIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKFJvdXRlci5wcm90b3R5cGUsIEV2ZW50cywge1xuXG4gICAgLy8gSW5pdGlhbGl6ZSBpcyBhbiBlbXB0eSBmdW5jdGlvbiBieSBkZWZhdWx0LiBPdmVycmlkZSBpdCB3aXRoIHlvdXIgb3duXG4gICAgLy8gaW5pdGlhbGl6YXRpb24gbG9naWMuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXt9LFxuXG4gICAgLy8gTWFudWFsbHkgYmluZCBhIHNpbmdsZSBuYW1lZCByb3V0ZSB0byBhIGNhbGxiYWNrLiBGb3IgZXhhbXBsZTpcbiAgICAvL1xuICAgIC8vICAgICB0aGlzLnJvdXRlKCdzZWFyY2gvOnF1ZXJ5L3A6bnVtJywgJ3NlYXJjaCcsIGZ1bmN0aW9uKHF1ZXJ5LCBudW0pIHtcbiAgICAvLyAgICAgICAuLi5cbiAgICAvLyAgICAgfSk7XG4gICAgLy9cbiAgICByb3V0ZTogZnVuY3Rpb24ocm91dGUsIG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICBpZiAoIV8uaXNSZWdFeHAocm91dGUpKSByb3V0ZSA9IHRoaXMuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihuYW1lKSkge1xuICAgICAgICBjYWxsYmFjayA9IG5hbWU7XG4gICAgICAgIG5hbWUgPSAnJztcbiAgICAgIH1cbiAgICAgIGlmICghY2FsbGJhY2spIGNhbGxiYWNrID0gdGhpc1tuYW1lXTtcbiAgICAgIHZhciByb3V0ZXIgPSB0aGlzO1xuICAgICAgQmFja2JvbmUuaGlzdG9yeS5yb3V0ZShyb3V0ZSwgZnVuY3Rpb24oZnJhZ21lbnQpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSByb3V0ZXIuX2V4dHJhY3RQYXJhbWV0ZXJzKHJvdXRlLCBmcmFnbWVudCk7XG4gICAgICAgIHJvdXRlci5leGVjdXRlKGNhbGxiYWNrLCBhcmdzKTtcbiAgICAgICAgcm91dGVyLnRyaWdnZXIuYXBwbHkocm91dGVyLCBbJ3JvdXRlOicgKyBuYW1lXS5jb25jYXQoYXJncykpO1xuICAgICAgICByb3V0ZXIudHJpZ2dlcigncm91dGUnLCBuYW1lLCBhcmdzKTtcbiAgICAgICAgQmFja2JvbmUuaGlzdG9yeS50cmlnZ2VyKCdyb3V0ZScsIHJvdXRlciwgbmFtZSwgYXJncyk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeGVjdXRlIGEgcm91dGUgaGFuZGxlciB3aXRoIHRoZSBwcm92aWRlZCBwYXJhbWV0ZXJzLiAgVGhpcyBpcyBhblxuICAgIC8vIGV4Y2VsbGVudCBwbGFjZSB0byBkbyBwcmUtcm91dGUgc2V0dXAgb3IgcG9zdC1yb3V0ZSBjbGVhbnVwLlxuICAgIGV4ZWN1dGU6IGZ1bmN0aW9uKGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0sXG5cbiAgICAvLyBTaW1wbGUgcHJveHkgdG8gYEJhY2tib25lLmhpc3RvcnlgIHRvIHNhdmUgYSBmcmFnbWVudCBpbnRvIHRoZSBoaXN0b3J5LlxuICAgIG5hdmlnYXRlOiBmdW5jdGlvbihmcmFnbWVudCwgb3B0aW9ucykge1xuICAgICAgQmFja2JvbmUuaGlzdG9yeS5uYXZpZ2F0ZShmcmFnbWVudCwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gQmluZCBhbGwgZGVmaW5lZCByb3V0ZXMgdG8gYEJhY2tib25lLmhpc3RvcnlgLiBXZSBoYXZlIHRvIHJldmVyc2UgdGhlXG4gICAgLy8gb3JkZXIgb2YgdGhlIHJvdXRlcyBoZXJlIHRvIHN1cHBvcnQgYmVoYXZpb3Igd2hlcmUgdGhlIG1vc3QgZ2VuZXJhbFxuICAgIC8vIHJvdXRlcyBjYW4gYmUgZGVmaW5lZCBhdCB0aGUgYm90dG9tIG9mIHRoZSByb3V0ZSBtYXAuXG4gICAgX2JpbmRSb3V0ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGlzLnJvdXRlcykgcmV0dXJuO1xuICAgICAgdGhpcy5yb3V0ZXMgPSBfLnJlc3VsdCh0aGlzLCAncm91dGVzJyk7XG4gICAgICB2YXIgcm91dGUsIHJvdXRlcyA9IF8ua2V5cyh0aGlzLnJvdXRlcyk7XG4gICAgICB3aGlsZSAoKHJvdXRlID0gcm91dGVzLnBvcCgpKSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMucm91dGUocm91dGUsIHRoaXMucm91dGVzW3JvdXRlXSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8vIENvbnZlcnQgYSByb3V0ZSBzdHJpbmcgaW50byBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgc3VpdGFibGUgZm9yIG1hdGNoaW5nXG4gICAgLy8gYWdhaW5zdCB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXNoLlxuICAgIF9yb3V0ZVRvUmVnRXhwOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgcm91dGUgPSByb3V0ZS5yZXBsYWNlKGVzY2FwZVJlZ0V4cCwgJ1xcXFwkJicpXG4gICAgICAgICAgICAgICAgICAgLnJlcGxhY2Uob3B0aW9uYWxQYXJhbSwgJyg/OiQxKT8nKVxuICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKG5hbWVkUGFyYW0sIGZ1bmN0aW9uKG1hdGNoLCBvcHRpb25hbCkge1xuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbmFsID8gbWF0Y2ggOiAnKFteLz9dKyknO1xuICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgLnJlcGxhY2Uoc3BsYXRQYXJhbSwgJyhbXj9dKj8pJyk7XG4gICAgICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSArICcoPzpcXFxcPyhbXFxcXHNcXFxcU10qKSk/JCcpO1xuICAgIH0sXG5cbiAgICAvLyBHaXZlbiBhIHJvdXRlLCBhbmQgYSBVUkwgZnJhZ21lbnQgdGhhdCBpdCBtYXRjaGVzLCByZXR1cm4gdGhlIGFycmF5IG9mXG4gICAgLy8gZXh0cmFjdGVkIGRlY29kZWQgcGFyYW1ldGVycy4gRW1wdHkgb3IgdW5tYXRjaGVkIHBhcmFtZXRlcnMgd2lsbCBiZVxuICAgIC8vIHRyZWF0ZWQgYXMgYG51bGxgIHRvIG5vcm1hbGl6ZSBjcm9zcy1icm93c2VyIGJlaGF2aW9yLlxuICAgIF9leHRyYWN0UGFyYW1ldGVyczogZnVuY3Rpb24ocm91dGUsIGZyYWdtZW50KSB7XG4gICAgICB2YXIgcGFyYW1zID0gcm91dGUuZXhlYyhmcmFnbWVudCkuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gXy5tYXAocGFyYW1zLCBmdW5jdGlvbihwYXJhbSwgaSkge1xuICAgICAgICAvLyBEb24ndCBkZWNvZGUgdGhlIHNlYXJjaCBwYXJhbXMuXG4gICAgICAgIGlmIChpID09PSBwYXJhbXMubGVuZ3RoIC0gMSkgcmV0dXJuIHBhcmFtIHx8IG51bGw7XG4gICAgICAgIHJldHVybiBwYXJhbSA/IGRlY29kZVVSSUNvbXBvbmVudChwYXJhbSkgOiBudWxsO1xuICAgICAgfSk7XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIEJhY2tib25lLkhpc3RvcnlcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEhhbmRsZXMgY3Jvc3MtYnJvd3NlciBoaXN0b3J5IG1hbmFnZW1lbnQsIGJhc2VkIG9uIGVpdGhlclxuICAvLyBbcHVzaFN0YXRlXShodHRwOi8vZGl2ZWludG9odG1sNS5pbmZvL2hpc3RvcnkuaHRtbCkgYW5kIHJlYWwgVVJMcywgb3JcbiAgLy8gW29uaGFzaGNoYW5nZV0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vd2luZG93Lm9uaGFzaGNoYW5nZSlcbiAgLy8gYW5kIFVSTCBmcmFnbWVudHMuIElmIHRoZSBicm93c2VyIHN1cHBvcnRzIG5laXRoZXIgKG9sZCBJRSwgbmF0Y2gpLFxuICAvLyBmYWxscyBiYWNrIHRvIHBvbGxpbmcuXG4gIHZhciBIaXN0b3J5ID0gQmFja2JvbmUuSGlzdG9yeSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaGFuZGxlcnMgPSBbXTtcbiAgICBfLmJpbmRBbGwodGhpcywgJ2NoZWNrVXJsJyk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCBgSGlzdG9yeWAgY2FuIGJlIHVzZWQgb3V0c2lkZSBvZiB0aGUgYnJvd3Nlci5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMubG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICB0aGlzLmhpc3RvcnkgPSB3aW5kb3cuaGlzdG9yeTtcbiAgICB9XG4gIH07XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IGZvciBzdHJpcHBpbmcgYSBsZWFkaW5nIGhhc2gvc2xhc2ggYW5kIHRyYWlsaW5nIHNwYWNlLlxuICB2YXIgcm91dGVTdHJpcHBlciA9IC9eWyNcXC9dfFxccyskL2c7XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IGZvciBzdHJpcHBpbmcgbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcy5cbiAgdmFyIHJvb3RTdHJpcHBlciA9IC9eXFwvK3xcXC8rJC9nO1xuXG4gIC8vIENhY2hlZCByZWdleCBmb3IgZGV0ZWN0aW5nIE1TSUUuXG4gIHZhciBpc0V4cGxvcmVyID0gL21zaWUgW1xcdy5dKy87XG5cbiAgLy8gQ2FjaGVkIHJlZ2V4IGZvciByZW1vdmluZyBhIHRyYWlsaW5nIHNsYXNoLlxuICB2YXIgdHJhaWxpbmdTbGFzaCA9IC9cXC8kLztcblxuICAvLyBDYWNoZWQgcmVnZXggZm9yIHN0cmlwcGluZyB1cmxzIG9mIGhhc2guXG4gIHZhciBwYXRoU3RyaXBwZXIgPSAvIy4qJC87XG5cbiAgLy8gSGFzIHRoZSBoaXN0b3J5IGhhbmRsaW5nIGFscmVhZHkgYmVlbiBzdGFydGVkP1xuICBIaXN0b3J5LnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAvLyBTZXQgdXAgYWxsIGluaGVyaXRhYmxlICoqQmFja2JvbmUuSGlzdG9yeSoqIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMuXG4gIF8uZXh0ZW5kKEhpc3RvcnkucHJvdG90eXBlLCBFdmVudHMsIHtcblxuICAgIC8vIFRoZSBkZWZhdWx0IGludGVydmFsIHRvIHBvbGwgZm9yIGhhc2ggY2hhbmdlcywgaWYgbmVjZXNzYXJ5LCBpc1xuICAgIC8vIHR3ZW50eSB0aW1lcyBhIHNlY29uZC5cbiAgICBpbnRlcnZhbDogNTAsXG5cbiAgICAvLyBBcmUgd2UgYXQgdGhlIGFwcCByb290P1xuICAgIGF0Um9vdDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9bXlxcL10kLywgJyQmLycpID09PSB0aGlzLnJvb3Q7XG4gICAgfSxcblxuICAgIC8vIEdldHMgdGhlIHRydWUgaGFzaCB2YWx1ZS4gQ2Fubm90IHVzZSBsb2NhdGlvbi5oYXNoIGRpcmVjdGx5IGR1ZSB0byBidWdcbiAgICAvLyBpbiBGaXJlZm94IHdoZXJlIGxvY2F0aW9uLmhhc2ggd2lsbCBhbHdheXMgYmUgZGVjb2RlZC5cbiAgICBnZXRIYXNoOiBmdW5jdGlvbih3aW5kb3cpIHtcbiAgICAgIHZhciBtYXRjaCA9ICh3aW5kb3cgfHwgdGhpcykubG9jYXRpb24uaHJlZi5tYXRjaCgvIyguKikkLyk7XG4gICAgICByZXR1cm4gbWF0Y2ggPyBtYXRjaFsxXSA6ICcnO1xuICAgIH0sXG5cbiAgICAvLyBHZXQgdGhlIGNyb3NzLWJyb3dzZXIgbm9ybWFsaXplZCBVUkwgZnJhZ21lbnQsIGVpdGhlciBmcm9tIHRoZSBVUkwsXG4gICAgLy8gdGhlIGhhc2gsIG9yIHRoZSBvdmVycmlkZS5cbiAgICBnZXRGcmFnbWVudDogZnVuY3Rpb24oZnJhZ21lbnQsIGZvcmNlUHVzaFN0YXRlKSB7XG4gICAgICBpZiAoZnJhZ21lbnQgPT0gbnVsbCkge1xuICAgICAgICBpZiAodGhpcy5faGFzUHVzaFN0YXRlIHx8ICF0aGlzLl93YW50c0hhc2hDaGFuZ2UgfHwgZm9yY2VQdXNoU3RhdGUpIHtcbiAgICAgICAgICBmcmFnbWVudCA9IGRlY29kZVVSSSh0aGlzLmxvY2F0aW9uLnBhdGhuYW1lICsgdGhpcy5sb2NhdGlvbi5zZWFyY2gpO1xuICAgICAgICAgIHZhciByb290ID0gdGhpcy5yb290LnJlcGxhY2UodHJhaWxpbmdTbGFzaCwgJycpO1xuICAgICAgICAgIGlmICghZnJhZ21lbnQuaW5kZXhPZihyb290KSkgZnJhZ21lbnQgPSBmcmFnbWVudC5zbGljZShyb290Lmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnJhZ21lbnQgPSB0aGlzLmdldEhhc2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZyYWdtZW50LnJlcGxhY2Uocm91dGVTdHJpcHBlciwgJycpO1xuICAgIH0sXG5cbiAgICAvLyBTdGFydCB0aGUgaGFzaCBjaGFuZ2UgaGFuZGxpbmcsIHJldHVybmluZyBgdHJ1ZWAgaWYgdGhlIGN1cnJlbnQgVVJMIG1hdGNoZXNcbiAgICAvLyBhbiBleGlzdGluZyByb3V0ZSwgYW5kIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICAgIHN0YXJ0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBpZiAoSGlzdG9yeS5zdGFydGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJCYWNrYm9uZS5oaXN0b3J5IGhhcyBhbHJlYWR5IGJlZW4gc3RhcnRlZFwiKTtcbiAgICAgIEhpc3Rvcnkuc3RhcnRlZCA9IHRydWU7XG5cbiAgICAgIC8vIEZpZ3VyZSBvdXQgdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbi4gRG8gd2UgbmVlZCBhbiBpZnJhbWU/XG4gICAgICAvLyBJcyBwdXNoU3RhdGUgZGVzaXJlZCAuLi4gaXMgaXQgYXZhaWxhYmxlP1xuICAgICAgdGhpcy5vcHRpb25zICAgICAgICAgID0gXy5leHRlbmQoe3Jvb3Q6ICcvJ30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICB0aGlzLnJvb3QgICAgICAgICAgICAgPSB0aGlzLm9wdGlvbnMucm9vdDtcbiAgICAgIHRoaXMuX3dhbnRzSGFzaENoYW5nZSA9IHRoaXMub3B0aW9ucy5oYXNoQ2hhbmdlICE9PSBmYWxzZTtcbiAgICAgIHRoaXMuX3dhbnRzUHVzaFN0YXRlICA9ICEhdGhpcy5vcHRpb25zLnB1c2hTdGF0ZTtcbiAgICAgIHRoaXMuX2hhc1B1c2hTdGF0ZSAgICA9ICEhKHRoaXMub3B0aW9ucy5wdXNoU3RhdGUgJiYgdGhpcy5oaXN0b3J5ICYmIHRoaXMuaGlzdG9yeS5wdXNoU3RhdGUpO1xuICAgICAgdmFyIGZyYWdtZW50ICAgICAgICAgID0gdGhpcy5nZXRGcmFnbWVudCgpO1xuICAgICAgdmFyIGRvY01vZGUgICAgICAgICAgID0gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuICAgICAgdmFyIG9sZElFICAgICAgICAgICAgID0gKGlzRXhwbG9yZXIuZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkpICYmICghZG9jTW9kZSB8fCBkb2NNb2RlIDw9IDcpKTtcblxuICAgICAgLy8gTm9ybWFsaXplIHJvb3QgdG8gYWx3YXlzIGluY2x1ZGUgYSBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaC5cbiAgICAgIHRoaXMucm9vdCA9ICgnLycgKyB0aGlzLnJvb3QgKyAnLycpLnJlcGxhY2Uocm9vdFN0cmlwcGVyLCAnLycpO1xuXG4gICAgICBpZiAob2xkSUUgJiYgdGhpcy5fd2FudHNIYXNoQ2hhbmdlKSB7XG4gICAgICAgIHZhciBmcmFtZSA9IEJhY2tib25lLiQoJzxpZnJhbWUgc3JjPVwiamF2YXNjcmlwdDowXCIgdGFiaW5kZXg9XCItMVwiPicpO1xuICAgICAgICB0aGlzLmlmcmFtZSA9IGZyYW1lLmhpZGUoKS5hcHBlbmRUbygnYm9keScpWzBdLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIHRoaXMubmF2aWdhdGUoZnJhZ21lbnQpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXBlbmRpbmcgb24gd2hldGhlciB3ZSdyZSB1c2luZyBwdXNoU3RhdGUgb3IgaGFzaGVzLCBhbmQgd2hldGhlclxuICAgICAgLy8gJ29uaGFzaGNoYW5nZScgaXMgc3VwcG9ydGVkLCBkZXRlcm1pbmUgaG93IHdlIGNoZWNrIHRoZSBVUkwgc3RhdGUuXG4gICAgICBpZiAodGhpcy5faGFzUHVzaFN0YXRlKSB7XG4gICAgICAgIEJhY2tib25lLiQod2luZG93KS5vbigncG9wc3RhdGUnLCB0aGlzLmNoZWNrVXJsKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FudHNIYXNoQ2hhbmdlICYmICgnb25oYXNoY2hhbmdlJyBpbiB3aW5kb3cpICYmICFvbGRJRSkge1xuICAgICAgICBCYWNrYm9uZS4kKHdpbmRvdykub24oJ2hhc2hjaGFuZ2UnLCB0aGlzLmNoZWNrVXJsKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FudHNIYXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX2NoZWNrVXJsSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh0aGlzLmNoZWNrVXJsLCB0aGlzLmludGVydmFsKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gY2hhbmdlIHRoZSBiYXNlIHVybCwgZm9yIGEgcHVzaFN0YXRlIGxpbmtcbiAgICAgIC8vIG9wZW5lZCBieSBhIG5vbi1wdXNoU3RhdGUgYnJvd3Nlci5cbiAgICAgIHRoaXMuZnJhZ21lbnQgPSBmcmFnbWVudDtcbiAgICAgIHZhciBsb2MgPSB0aGlzLmxvY2F0aW9uO1xuXG4gICAgICAvLyBUcmFuc2l0aW9uIGZyb20gaGFzaENoYW5nZSB0byBwdXNoU3RhdGUgb3IgdmljZSB2ZXJzYSBpZiBib3RoIGFyZVxuICAgICAgLy8gcmVxdWVzdGVkLlxuICAgICAgaWYgKHRoaXMuX3dhbnRzSGFzaENoYW5nZSAmJiB0aGlzLl93YW50c1B1c2hTdGF0ZSkge1xuXG4gICAgICAgIC8vIElmIHdlJ3ZlIHN0YXJ0ZWQgb2ZmIHdpdGggYSByb3V0ZSBmcm9tIGEgYHB1c2hTdGF0ZWAtZW5hYmxlZFxuICAgICAgICAvLyBicm93c2VyLCBidXQgd2UncmUgY3VycmVudGx5IGluIGEgYnJvd3NlciB0aGF0IGRvZXNuJ3Qgc3VwcG9ydCBpdC4uLlxuICAgICAgICBpZiAoIXRoaXMuX2hhc1B1c2hTdGF0ZSAmJiAhdGhpcy5hdFJvb3QoKSkge1xuICAgICAgICAgIHRoaXMuZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KG51bGwsIHRydWUpO1xuICAgICAgICAgIHRoaXMubG9jYXRpb24ucmVwbGFjZSh0aGlzLnJvb3QgKyAnIycgKyB0aGlzLmZyYWdtZW50KTtcbiAgICAgICAgICAvLyBSZXR1cm4gaW1tZWRpYXRlbHkgYXMgYnJvd3NlciB3aWxsIGRvIHJlZGlyZWN0IHRvIG5ldyB1cmxcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAvLyBPciBpZiB3ZSd2ZSBzdGFydGVkIG91dCB3aXRoIGEgaGFzaC1iYXNlZCByb3V0ZSwgYnV0IHdlJ3JlIGN1cnJlbnRseVxuICAgICAgICAvLyBpbiBhIGJyb3dzZXIgd2hlcmUgaXQgY291bGQgYmUgYHB1c2hTdGF0ZWAtYmFzZWQgaW5zdGVhZC4uLlxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2hhc1B1c2hTdGF0ZSAmJiB0aGlzLmF0Um9vdCgpICYmIGxvYy5oYXNoKSB7XG4gICAgICAgICAgdGhpcy5mcmFnbWVudCA9IHRoaXMuZ2V0SGFzaCgpLnJlcGxhY2Uocm91dGVTdHJpcHBlciwgJycpO1xuICAgICAgICAgIHRoaXMuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIGRvY3VtZW50LnRpdGxlLCB0aGlzLnJvb3QgKyB0aGlzLmZyYWdtZW50KTtcbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5vcHRpb25zLnNpbGVudCkgcmV0dXJuIHRoaXMubG9hZFVybCgpO1xuICAgIH0sXG5cbiAgICAvLyBEaXNhYmxlIEJhY2tib25lLmhpc3RvcnksIHBlcmhhcHMgdGVtcG9yYXJpbHkuIE5vdCB1c2VmdWwgaW4gYSByZWFsIGFwcCxcbiAgICAvLyBidXQgcG9zc2libHkgdXNlZnVsIGZvciB1bml0IHRlc3RpbmcgUm91dGVycy5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgIEJhY2tib25lLiQod2luZG93KS5vZmYoJ3BvcHN0YXRlJywgdGhpcy5jaGVja1VybCkub2ZmKCdoYXNoY2hhbmdlJywgdGhpcy5jaGVja1VybCk7XG4gICAgICBpZiAodGhpcy5fY2hlY2tVcmxJbnRlcnZhbCkgY2xlYXJJbnRlcnZhbCh0aGlzLl9jaGVja1VybEludGVydmFsKTtcbiAgICAgIEhpc3Rvcnkuc3RhcnRlZCA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICAvLyBBZGQgYSByb3V0ZSB0byBiZSB0ZXN0ZWQgd2hlbiB0aGUgZnJhZ21lbnQgY2hhbmdlcy4gUm91dGVzIGFkZGVkIGxhdGVyXG4gICAgLy8gbWF5IG92ZXJyaWRlIHByZXZpb3VzIHJvdXRlcy5cbiAgICByb3V0ZTogZnVuY3Rpb24ocm91dGUsIGNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmhhbmRsZXJzLnVuc2hpZnQoe3JvdXRlOiByb3V0ZSwgY2FsbGJhY2s6IGNhbGxiYWNrfSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrcyB0aGUgY3VycmVudCBVUkwgdG8gc2VlIGlmIGl0IGhhcyBjaGFuZ2VkLCBhbmQgaWYgaXQgaGFzLFxuICAgIC8vIGNhbGxzIGBsb2FkVXJsYCwgbm9ybWFsaXppbmcgYWNyb3NzIHRoZSBoaWRkZW4gaWZyYW1lLlxuICAgIGNoZWNrVXJsOiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgY3VycmVudCA9IHRoaXMuZ2V0RnJhZ21lbnQoKTtcbiAgICAgIGlmIChjdXJyZW50ID09PSB0aGlzLmZyYWdtZW50ICYmIHRoaXMuaWZyYW1lKSB7XG4gICAgICAgIGN1cnJlbnQgPSB0aGlzLmdldEZyYWdtZW50KHRoaXMuZ2V0SGFzaCh0aGlzLmlmcmFtZSkpO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnQgPT09IHRoaXMuZnJhZ21lbnQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICh0aGlzLmlmcmFtZSkgdGhpcy5uYXZpZ2F0ZShjdXJyZW50KTtcbiAgICAgIHRoaXMubG9hZFVybCgpO1xuICAgIH0sXG5cbiAgICAvLyBBdHRlbXB0IHRvIGxvYWQgdGhlIGN1cnJlbnQgVVJMIGZyYWdtZW50LiBJZiBhIHJvdXRlIHN1Y2NlZWRzIHdpdGggYVxuICAgIC8vIG1hdGNoLCByZXR1cm5zIGB0cnVlYC4gSWYgbm8gZGVmaW5lZCByb3V0ZXMgbWF0Y2hlcyB0aGUgZnJhZ21lbnQsXG4gICAgLy8gcmV0dXJucyBgZmFsc2VgLlxuICAgIGxvYWRVcmw6IGZ1bmN0aW9uKGZyYWdtZW50KSB7XG4gICAgICBmcmFnbWVudCA9IHRoaXMuZnJhZ21lbnQgPSB0aGlzLmdldEZyYWdtZW50KGZyYWdtZW50KTtcbiAgICAgIHJldHVybiBfLmFueSh0aGlzLmhhbmRsZXJzLCBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICAgIGlmIChoYW5kbGVyLnJvdXRlLnRlc3QoZnJhZ21lbnQpKSB7XG4gICAgICAgICAgaGFuZGxlci5jYWxsYmFjayhmcmFnbWVudCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyBTYXZlIGEgZnJhZ21lbnQgaW50byB0aGUgaGFzaCBoaXN0b3J5LCBvciByZXBsYWNlIHRoZSBVUkwgc3RhdGUgaWYgdGhlXG4gICAgLy8gJ3JlcGxhY2UnIG9wdGlvbiBpcyBwYXNzZWQuIFlvdSBhcmUgcmVzcG9uc2libGUgZm9yIHByb3Blcmx5IFVSTC1lbmNvZGluZ1xuICAgIC8vIHRoZSBmcmFnbWVudCBpbiBhZHZhbmNlLlxuICAgIC8vXG4gICAgLy8gVGhlIG9wdGlvbnMgb2JqZWN0IGNhbiBjb250YWluIGB0cmlnZ2VyOiB0cnVlYCBpZiB5b3Ugd2lzaCB0byBoYXZlIHRoZVxuICAgIC8vIHJvdXRlIGNhbGxiYWNrIGJlIGZpcmVkIChub3QgdXN1YWxseSBkZXNpcmFibGUpLCBvciBgcmVwbGFjZTogdHJ1ZWAsIGlmXG4gICAgLy8geW91IHdpc2ggdG8gbW9kaWZ5IHRoZSBjdXJyZW50IFVSTCB3aXRob3V0IGFkZGluZyBhbiBlbnRyeSB0byB0aGUgaGlzdG9yeS5cbiAgICBuYXZpZ2F0ZTogZnVuY3Rpb24oZnJhZ21lbnQsIG9wdGlvbnMpIHtcbiAgICAgIGlmICghSGlzdG9yeS5zdGFydGVkKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIW9wdGlvbnMgfHwgb3B0aW9ucyA9PT0gdHJ1ZSkgb3B0aW9ucyA9IHt0cmlnZ2VyOiAhIW9wdGlvbnN9O1xuXG4gICAgICB2YXIgdXJsID0gdGhpcy5yb290ICsgKGZyYWdtZW50ID0gdGhpcy5nZXRGcmFnbWVudChmcmFnbWVudCB8fCAnJykpO1xuXG4gICAgICAvLyBTdHJpcCB0aGUgaGFzaCBmb3IgbWF0Y2hpbmcuXG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UocGF0aFN0cmlwcGVyLCAnJyk7XG5cbiAgICAgIGlmICh0aGlzLmZyYWdtZW50ID09PSBmcmFnbWVudCkgcmV0dXJuO1xuICAgICAgdGhpcy5mcmFnbWVudCA9IGZyYWdtZW50O1xuXG4gICAgICAvLyBEb24ndCBpbmNsdWRlIGEgdHJhaWxpbmcgc2xhc2ggb24gdGhlIHJvb3QuXG4gICAgICBpZiAoZnJhZ21lbnQgPT09ICcnICYmIHVybCAhPT0gJy8nKSB1cmwgPSB1cmwuc2xpY2UoMCwgLTEpO1xuXG4gICAgICAvLyBJZiBwdXNoU3RhdGUgaXMgYXZhaWxhYmxlLCB3ZSB1c2UgaXQgdG8gc2V0IHRoZSBmcmFnbWVudCBhcyBhIHJlYWwgVVJMLlxuICAgICAgaWYgKHRoaXMuX2hhc1B1c2hTdGF0ZSkge1xuICAgICAgICB0aGlzLmhpc3Rvcnlbb3B0aW9ucy5yZXBsYWNlID8gJ3JlcGxhY2VTdGF0ZScgOiAncHVzaFN0YXRlJ10oe30sIGRvY3VtZW50LnRpdGxlLCB1cmwpO1xuXG4gICAgICAvLyBJZiBoYXNoIGNoYW5nZXMgaGF2ZW4ndCBiZWVuIGV4cGxpY2l0bHkgZGlzYWJsZWQsIHVwZGF0ZSB0aGUgaGFzaFxuICAgICAgLy8gZnJhZ21lbnQgdG8gc3RvcmUgaGlzdG9yeS5cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fd2FudHNIYXNoQ2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUhhc2godGhpcy5sb2NhdGlvbiwgZnJhZ21lbnQsIG9wdGlvbnMucmVwbGFjZSk7XG4gICAgICAgIGlmICh0aGlzLmlmcmFtZSAmJiAoZnJhZ21lbnQgIT09IHRoaXMuZ2V0RnJhZ21lbnQodGhpcy5nZXRIYXNoKHRoaXMuaWZyYW1lKSkpKSB7XG4gICAgICAgICAgLy8gT3BlbmluZyBhbmQgY2xvc2luZyB0aGUgaWZyYW1lIHRyaWNrcyBJRTcgYW5kIGVhcmxpZXIgdG8gcHVzaCBhXG4gICAgICAgICAgLy8gaGlzdG9yeSBlbnRyeSBvbiBoYXNoLXRhZyBjaGFuZ2UuICBXaGVuIHJlcGxhY2UgaXMgdHJ1ZSwgd2UgZG9uJ3RcbiAgICAgICAgICAvLyB3YW50IHRoaXMuXG4gICAgICAgICAgaWYoIW9wdGlvbnMucmVwbGFjZSkgdGhpcy5pZnJhbWUuZG9jdW1lbnQub3BlbigpLmNsb3NlKCk7XG4gICAgICAgICAgdGhpcy5fdXBkYXRlSGFzaCh0aGlzLmlmcmFtZS5sb2NhdGlvbiwgZnJhZ21lbnQsIG9wdGlvbnMucmVwbGFjZSk7XG4gICAgICAgIH1cblxuICAgICAgLy8gSWYgeW91J3ZlIHRvbGQgdXMgdGhhdCB5b3UgZXhwbGljaXRseSBkb24ndCB3YW50IGZhbGxiYWNrIGhhc2hjaGFuZ2UtXG4gICAgICAvLyBiYXNlZCBoaXN0b3J5LCB0aGVuIGBuYXZpZ2F0ZWAgYmVjb21lcyBhIHBhZ2UgcmVmcmVzaC5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxvY2F0aW9uLmFzc2lnbih1cmwpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMudHJpZ2dlcikgcmV0dXJuIHRoaXMubG9hZFVybChmcmFnbWVudCk7XG4gICAgfSxcblxuICAgIC8vIFVwZGF0ZSB0aGUgaGFzaCBsb2NhdGlvbiwgZWl0aGVyIHJlcGxhY2luZyB0aGUgY3VycmVudCBlbnRyeSwgb3IgYWRkaW5nXG4gICAgLy8gYSBuZXcgb25lIHRvIHRoZSBicm93c2VyIGhpc3RvcnkuXG4gICAgX3VwZGF0ZUhhc2g6IGZ1bmN0aW9uKGxvY2F0aW9uLCBmcmFnbWVudCwgcmVwbGFjZSkge1xuICAgICAgaWYgKHJlcGxhY2UpIHtcbiAgICAgICAgdmFyIGhyZWYgPSBsb2NhdGlvbi5ocmVmLnJlcGxhY2UoLyhqYXZhc2NyaXB0OnwjKS4qJC8sICcnKTtcbiAgICAgICAgbG9jYXRpb24ucmVwbGFjZShocmVmICsgJyMnICsgZnJhZ21lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU29tZSBicm93c2VycyByZXF1aXJlIHRoYXQgYGhhc2hgIGNvbnRhaW5zIGEgbGVhZGluZyAjLlxuICAgICAgICBsb2NhdGlvbi5oYXNoID0gJyMnICsgZnJhZ21lbnQ7XG4gICAgICB9XG4gICAgfVxuXG4gIH0pO1xuXG4gIC8vIENyZWF0ZSB0aGUgZGVmYXVsdCBCYWNrYm9uZS5oaXN0b3J5LlxuICBCYWNrYm9uZS5oaXN0b3J5ID0gbmV3IEhpc3Rvcnk7XG5cbiAgLy8gSGVscGVyc1xuICAvLyAtLS0tLS0tXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvcnJlY3RseSBzZXQgdXAgdGhlIHByb3RvdHlwZSBjaGFpbiwgZm9yIHN1YmNsYXNzZXMuXG4gIC8vIFNpbWlsYXIgdG8gYGdvb2cuaW5oZXJpdHNgLCBidXQgdXNlcyBhIGhhc2ggb2YgcHJvdG90eXBlIHByb3BlcnRpZXMgYW5kXG4gIC8vIGNsYXNzIHByb3BlcnRpZXMgdG8gYmUgZXh0ZW5kZWQuXG4gIHZhciBleHRlbmQgPSBmdW5jdGlvbihwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSB0aGlzO1xuICAgIHZhciBjaGlsZDtcblxuICAgIC8vIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIG5ldyBzdWJjbGFzcyBpcyBlaXRoZXIgZGVmaW5lZCBieSB5b3VcbiAgICAvLyAodGhlIFwiY29uc3RydWN0b3JcIiBwcm9wZXJ0eSBpbiB5b3VyIGBleHRlbmRgIGRlZmluaXRpb24pLCBvciBkZWZhdWx0ZWRcbiAgICAvLyBieSB1cyB0byBzaW1wbHkgY2FsbCB0aGUgcGFyZW50J3MgY29uc3RydWN0b3IuXG4gICAgaWYgKHByb3RvUHJvcHMgJiYgXy5oYXMocHJvdG9Qcm9wcywgJ2NvbnN0cnVjdG9yJykpIHtcbiAgICAgIGNoaWxkID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGQgPSBmdW5jdGlvbigpeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgfVxuXG4gICAgLy8gQWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiwgaWYgc3VwcGxpZWQuXG4gICAgXy5leHRlbmQoY2hpbGQsIHBhcmVudCwgc3RhdGljUHJvcHMpO1xuXG4gICAgLy8gU2V0IHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gaW5oZXJpdCBmcm9tIGBwYXJlbnRgLCB3aXRob3V0IGNhbGxpbmdcbiAgICAvLyBgcGFyZW50YCdzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuICAgIHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG4gICAgU3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gICAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZTtcblxuICAgIC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyAoaW5zdGFuY2UgcHJvcGVydGllcykgdG8gdGhlIHN1YmNsYXNzLFxuICAgIC8vIGlmIHN1cHBsaWVkLlxuICAgIGlmIChwcm90b1Byb3BzKSBfLmV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3RvUHJvcHMpO1xuXG4gICAgLy8gU2V0IGEgY29udmVuaWVuY2UgcHJvcGVydHkgaW4gY2FzZSB0aGUgcGFyZW50J3MgcHJvdG90eXBlIGlzIG5lZWRlZFxuICAgIC8vIGxhdGVyLlxuICAgIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG5cbiAgICByZXR1cm4gY2hpbGQ7XG4gIH07XG5cbiAgLy8gU2V0IHVwIGluaGVyaXRhbmNlIGZvciB0aGUgbW9kZWwsIGNvbGxlY3Rpb24sIHJvdXRlciwgdmlldyBhbmQgaGlzdG9yeS5cbiAgTW9kZWwuZXh0ZW5kID0gQ29sbGVjdGlvbi5leHRlbmQgPSBSb3V0ZXIuZXh0ZW5kID0gVmlldy5leHRlbmQgPSBIaXN0b3J5LmV4dGVuZCA9IGV4dGVuZDtcblxuICAvLyBUaHJvdyBhbiBlcnJvciB3aGVuIGEgVVJMIGlzIG5lZWRlZCwgYW5kIG5vbmUgaXMgc3VwcGxpZWQuXG4gIHZhciB1cmxFcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQSBcInVybFwiIHByb3BlcnR5IG9yIGZ1bmN0aW9uIG11c3QgYmUgc3BlY2lmaWVkJyk7XG4gIH07XG5cbiAgLy8gV3JhcCBhbiBvcHRpb25hbCBlcnJvciBjYWxsYmFjayB3aXRoIGEgZmFsbGJhY2sgZXJyb3IgZXZlbnQuXG4gIHZhciB3cmFwRXJyb3IgPSBmdW5jdGlvbihtb2RlbCwgb3B0aW9ucykge1xuICAgIHZhciBlcnJvciA9IG9wdGlvbnMuZXJyb3I7XG4gICAgb3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgIGlmIChlcnJvcikgZXJyb3IobW9kZWwsIHJlc3AsIG9wdGlvbnMpO1xuICAgICAgbW9kZWwudHJpZ2dlcignZXJyb3InLCBtb2RlbCwgcmVzcCwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfTtcblxuICByZXR1cm4gQmFja2JvbmU7XG5cbn0pKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIFBhbmVsR3JvdXAgPSByZXF1aXJlKCcuL1BhbmVsR3JvdXAnKTtcblxudmFyIEFjY29yZGlvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FjY29yZGlvbicsXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFBhbmVsR3JvdXAoIHthY2NvcmRpb246dHJ1ZX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQWNjb3JkaW9uOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBBZmZpeE1peGluID0gcmVxdWlyZSgnLi9BZmZpeE1peGluJyk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG5cbnZhciBBZmZpeCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FmZml4JyxcbiAgc3RhdGljczoge1xuICAgIGRvbVV0aWxzOiBkb21VdGlsc1xuICB9LFxuXG4gIG1peGluczogW0FmZml4TWl4aW5dLFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBob2xkZXJTdHlsZSA9IHt0b3A6IHRoaXMuc3RhdGUuYWZmaXhQb3NpdGlvblRvcH07XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnN0YXRlLmFmZml4Q2xhc3MsIHN0eWxlOmhvbGRlclN0eWxlfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBZmZpeDsiLCIvKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBFdmVudExpc3RlbmVyID0gcmVxdWlyZSgnLi91dGlscy9FdmVudExpc3RlbmVyJyk7XG5cbnZhciBBZmZpeE1peGluID0ge1xuICBwcm9wVHlwZXM6IHtcbiAgICBvZmZzZXQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgb2Zmc2V0VG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG9mZnNldEJvdHRvbTogUmVhY3QuUHJvcFR5cGVzLm51bWJlclxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBhZmZpeENsYXNzOiAnYWZmaXgtdG9wJ1xuICAgIH07XG4gIH0sXG5cbiAgZ2V0UGlubmVkT2Zmc2V0OiBmdW5jdGlvbiAoRE9NTm9kZSkge1xuICAgIGlmICh0aGlzLnBpbm5lZE9mZnNldCkge1xuICAgICAgcmV0dXJuIHRoaXMucGlubmVkT2Zmc2V0O1xuICAgIH1cblxuICAgIERPTU5vZGUuY2xhc3NOYW1lID0gRE9NTm9kZS5jbGFzc05hbWUucmVwbGFjZSgvYWZmaXgtdG9wfGFmZml4LWJvdHRvbXxhZmZpeC8sICcnKTtcbiAgICBET01Ob2RlLmNsYXNzTmFtZSArPSBET01Ob2RlLmNsYXNzTmFtZS5sZW5ndGggPyAnIGFmZml4JyA6ICdhZmZpeCc7XG5cbiAgICB0aGlzLnBpbm5lZE9mZnNldCA9IGRvbVV0aWxzLmdldE9mZnNldChET01Ob2RlKS50b3AgLSB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cbiAgICByZXR1cm4gdGhpcy5waW5uZWRPZmZzZXQ7XG4gIH0sXG5cbiAgY2hlY2tQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBET01Ob2RlLCBzY3JvbGxIZWlnaHQsIHNjcm9sbFRvcCwgcG9zaXRpb24sIG9mZnNldFRvcCwgb2Zmc2V0Qm90dG9tLFxuICAgICAgICBhZmZpeCwgYWZmaXhUeXBlLCBhZmZpeFBvc2l0aW9uVG9wO1xuXG4gICAgLy8gVE9ETzogb3Igbm90IHZpc2libGVcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBET01Ob2RlID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgc2Nyb2xsSGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICBzY3JvbGxUb3AgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgcG9zaXRpb24gPSBkb21VdGlscy5nZXRPZmZzZXQoRE9NTm9kZSk7XG4gICAgb2Zmc2V0VG9wO1xuICAgIG9mZnNldEJvdHRvbTtcblxuICAgIGlmICh0aGlzLmFmZml4ZWQgPT09ICd0b3AnKSB7XG4gICAgICBwb3NpdGlvbi50b3AgKz0gc2Nyb2xsVG9wO1xuICAgIH1cblxuICAgIG9mZnNldFRvcCA9IHRoaXMucHJvcHMub2Zmc2V0VG9wICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5vZmZzZXRUb3AgOiB0aGlzLnByb3BzLm9mZnNldDtcbiAgICBvZmZzZXRCb3R0b20gPSB0aGlzLnByb3BzLm9mZnNldEJvdHRvbSAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMub2Zmc2V0Qm90dG9tIDogdGhpcy5wcm9wcy5vZmZzZXQ7XG5cbiAgICBpZiAob2Zmc2V0VG9wID09IG51bGwgJiYgb2Zmc2V0Qm90dG9tID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG9mZnNldFRvcCA9PSBudWxsKSB7XG4gICAgICBvZmZzZXRUb3AgPSAwO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0Qm90dG9tID09IG51bGwpIHtcbiAgICAgIG9mZnNldEJvdHRvbSA9IDA7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudW5waW4gIT0gbnVsbCAmJiAoc2Nyb2xsVG9wICsgdGhpcy51bnBpbiA8PSBwb3NpdGlvbi50b3ApKSB7XG4gICAgICBhZmZpeCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAob2Zmc2V0Qm90dG9tICE9IG51bGwgJiYgKHBvc2l0aW9uLnRvcCArIERPTU5vZGUub2Zmc2V0SGVpZ2h0ID49IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSkpIHtcbiAgICAgIGFmZml4ID0gJ2JvdHRvbSc7XG4gICAgfSBlbHNlIGlmIChvZmZzZXRUb3AgIT0gbnVsbCAmJiAoc2Nyb2xsVG9wIDw9IG9mZnNldFRvcCkpIHtcbiAgICAgIGFmZml4ID0gJ3RvcCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFmZml4ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYWZmaXhlZCA9PT0gYWZmaXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy51bnBpbiAhPSBudWxsKSB7XG4gICAgICBET01Ob2RlLnN0eWxlLnRvcCA9ICcnO1xuICAgIH1cblxuICAgIGFmZml4VHlwZSA9ICdhZmZpeCcgKyAoYWZmaXggPyAnLScgKyBhZmZpeCA6ICcnKTtcblxuICAgIHRoaXMuYWZmaXhlZCA9IGFmZml4O1xuICAgIHRoaXMudW5waW4gPSBhZmZpeCA9PT0gJ2JvdHRvbScgP1xuICAgICAgdGhpcy5nZXRQaW5uZWRPZmZzZXQoRE9NTm9kZSkgOiBudWxsO1xuXG4gICAgaWYgKGFmZml4ID09PSAnYm90dG9tJykge1xuICAgICAgRE9NTm9kZS5jbGFzc05hbWUgPSBET01Ob2RlLmNsYXNzTmFtZS5yZXBsYWNlKC9hZmZpeC10b3B8YWZmaXgtYm90dG9tfGFmZml4LywgJ2FmZml4LXRvcCcpO1xuICAgICAgYWZmaXhQb3NpdGlvblRvcCA9IHNjcm9sbEhlaWdodCAtIG9mZnNldEJvdHRvbSAtIERPTU5vZGUub2Zmc2V0SGVpZ2h0IC0gZG9tVXRpbHMuZ2V0T2Zmc2V0KERPTU5vZGUpLnRvcDtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGFmZml4Q2xhc3M6IGFmZml4VHlwZSxcbiAgICAgIGFmZml4UG9zaXRpb25Ub3A6IGFmZml4UG9zaXRpb25Ub3BcbiAgICB9KTtcbiAgfSxcblxuICBjaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcDogZnVuY3Rpb24gKCkge1xuICAgIHNldFRpbWVvdXQodGhpcy5jaGVja1Bvc2l0aW9uLCAwKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uV2luZG93U2Nyb2xsTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4od2luZG93LCAnc2Nyb2xsJywgdGhpcy5jaGVja1Bvc2l0aW9uKTtcbiAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lciA9XG4gICAgICBFdmVudExpc3RlbmVyLmxpc3Rlbihkb2N1bWVudCwgJ2NsaWNrJywgdGhpcy5jaGVja1Bvc2l0aW9uV2l0aEV2ZW50TG9vcCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lcikge1xuICAgICAgdGhpcy5fb25XaW5kb3dTY3JvbGxMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudENsaWNrTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIGlmIChwcmV2U3RhdGUuYWZmaXhDbGFzcyA9PT0gdGhpcy5zdGF0ZS5hZmZpeENsYXNzKSB7XG4gICAgICB0aGlzLmNoZWNrUG9zaXRpb25XaXRoRXZlbnRMb29wKCk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFmZml4TWl4aW47IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBBbGVydCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0FsZXJ0JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uRGlzbWlzczogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgZGlzbWlzc0FmdGVyOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdhbGVydCcsXG4gICAgICBic1N0eWxlOiAnaW5mbydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlckRpc21pc3NCdXR0b246IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbihcbiAgICAgICAge3R5cGU6XCJidXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOlwiY2xvc2VcIixcbiAgICAgICAgb25DbGljazp0aGlzLnByb3BzLm9uRGlzbWlzcyxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzpcInRydWVcIn0sIFxuICAgICAgICBcIiDDlyBcIlxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgaXNEaXNtaXNzYWJsZSA9ICEhdGhpcy5wcm9wcy5vbkRpc21pc3M7XG5cbiAgICBjbGFzc2VzWydhbGVydC1kaXNtaXNzYWJsZSddID0gaXNEaXNtaXNzYWJsZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgaXNEaXNtaXNzYWJsZSA/IHRoaXMucmVuZGVyRGlzbWlzc0J1dHRvbigpIDogbnVsbCxcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnByb3BzLmRpc21pc3NBZnRlciAmJiB0aGlzLnByb3BzLm9uRGlzbWlzcykge1xuICAgICAgdGhpcy5kaXNtaXNzVGltZXIgPSBzZXRUaW1lb3V0KHRoaXMucHJvcHMub25EaXNtaXNzLCB0aGlzLnByb3BzLmRpc21pc3NBZnRlcik7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kaXNtaXNzVGltZXIpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBbGVydDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xuXG52YXIgQmFkZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCYWRnZScsXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAncHVsbC1yaWdodCc6IHRoaXMucHJvcHMucHVsbFJpZ2h0LFxuICAgICAgJ2JhZGdlJzogVmFsaWRDb21wb25lbnRDaGlsZHJlbi5oYXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLmNoaWxkcmVuKVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhZGdlO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKTtcblxudmFyIEJvb3RzdHJhcE1peGluID0ge1xuICBwcm9wVHlwZXM6IHtcbiAgICBic0NsYXNzOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLkNMQVNTRVMpKSxcbiAgICBic1N0eWxlOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoT2JqZWN0LmtleXMoY29uc3RhbnRzLlNUWUxFUykpLFxuICAgIGJzU2l6ZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKE9iamVjdC5rZXlzKGNvbnN0YW50cy5TSVpFUykpXG4gIH0sXG5cbiAgZ2V0QnNDbGFzc1NldDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge307XG5cbiAgICB2YXIgYnNDbGFzcyA9IHRoaXMucHJvcHMuYnNDbGFzcyAmJiBjb25zdGFudHMuQ0xBU1NFU1t0aGlzLnByb3BzLmJzQ2xhc3NdO1xuICAgIGlmIChic0NsYXNzKSB7XG4gICAgICBjbGFzc2VzW2JzQ2xhc3NdID0gdHJ1ZTtcblxuICAgICAgdmFyIHByZWZpeCA9IGJzQ2xhc3MgKyAnLSc7XG5cbiAgICAgIHZhciBic1NpemUgPSB0aGlzLnByb3BzLmJzU2l6ZSAmJiBjb25zdGFudHMuU0laRVNbdGhpcy5wcm9wcy5ic1NpemVdO1xuICAgICAgaWYgKGJzU2l6ZSkge1xuICAgICAgICBjbGFzc2VzW3ByZWZpeCArIGJzU2l6ZV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgYnNTdHlsZSA9IHRoaXMucHJvcHMuYnNTdHlsZSAmJiBjb25zdGFudHMuU1RZTEVTW3RoaXMucHJvcHMuYnNTdHlsZV07XG4gICAgICBpZiAodGhpcy5wcm9wcy5ic1N0eWxlKSB7XG4gICAgICAgIGNsYXNzZXNbcHJlZml4ICsgYnNTdHlsZV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjbGFzc2VzO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3RzdHJhcE1peGluOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxudmFyIEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBhY3RpdmU6ICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGJsb2NrOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuYXZJdGVtOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBuYXZEcm9wZG93bjogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2J1dHRvbicsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCcsXG4gICAgICB0eXBlOiAnYnV0dG9uJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLnByb3BzLm5hdkRyb3Bkb3duID8ge30gOiB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICB2YXIgcmVuZGVyRnVuY05hbWU7XG5cbiAgICBjbGFzc2VzWydhY3RpdmUnXSA9IHRoaXMucHJvcHMuYWN0aXZlO1xuICAgIGNsYXNzZXNbJ2J0bi1ibG9jayddID0gdGhpcy5wcm9wcy5ibG9jaztcblxuICAgIGlmICh0aGlzLnByb3BzLm5hdkl0ZW0pIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlck5hdkl0ZW0oY2xhc3Nlcyk7XG4gICAgfVxuXG4gICAgcmVuZGVyRnVuY05hbWUgPSB0aGlzLnByb3BzLmhyZWYgfHwgdGhpcy5wcm9wcy5uYXZEcm9wZG93biA/XG4gICAgICAncmVuZGVyQW5jaG9yJyA6ICdyZW5kZXJCdXR0b24nO1xuXG4gICAgcmV0dXJuIHRoaXNbcmVuZGVyRnVuY05hbWVdKGNsYXNzZXMpO1xuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICB2YXIgaHJlZiA9IHRoaXMucHJvcHMuaHJlZiB8fCAnIyc7XG4gICAgY2xhc3Nlc1snZGlzYWJsZWQnXSA9IHRoaXMucHJvcHMuZGlzYWJsZWQ7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uYShcbiAgICAgICAge2hyZWY6aHJlZixcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICByb2xlOlwiYnV0dG9uXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQnV0dG9uOiBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5idXR0b24oXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyTmF2SXRlbTogZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICB2YXIgbGlDbGFzc2VzID0ge1xuICAgICAgYWN0aXZlOiB0aGlzLnByb3BzLmFjdGl2ZVxuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGxpQ2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJBbmNob3IoY2xhc3NlcylcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEJ1dHRvbiA9IHJlcXVpcmUoJy4vQnV0dG9uJyk7XG5cbnZhciBCdXR0b25Hcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0J1dHRvbkdyb3VwJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHZlcnRpY2FsOiAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAganVzdGlmaWVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnYnV0dG9uLWdyb3VwJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBjbGFzc2VzWydidG4tZ3JvdXAnXSA9ICF0aGlzLnByb3BzLnZlcnRpY2FsO1xuICAgIGNsYXNzZXNbJ2J0bi1ncm91cC12ZXJ0aWNhbCddID0gdGhpcy5wcm9wcy52ZXJ0aWNhbDtcbiAgICBjbGFzc2VzWydidG4tZ3JvdXAtanVzdGlmaWVkJ10gPSB0aGlzLnByb3BzLmp1c3RpZmllZDtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbkdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xuXG52YXIgQnV0dG9uR3JvdXAgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdCdXR0b25Hcm91cCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2J1dHRvbi10b29sYmFyJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoXG4gICAgICAgIHtyb2xlOlwidG9vbGJhclwiLFxuICAgICAgICBjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbkdyb3VwOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBDYXJvdXNlbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0Nhcm91c2VsJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHNsaWRlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBpbmRpY2F0b3JzOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBjb250cm9sczogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcGF1c2VPbkhvdmVyOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB3cmFwOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgb25TbGlkZUVuZDogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgYWN0aXZlSW5kZXg6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVmYXVsdEFjdGl2ZUluZGV4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRpcmVjdGlvbjogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsncHJldicsICduZXh0J10pXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNsaWRlOiB0cnVlLFxuICAgICAgaW50ZXJ2YWw6IDUwMDAsXG4gICAgICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gICAgICB3cmFwOiB0cnVlLFxuICAgICAgaW5kaWNhdG9yczogdHJ1ZSxcbiAgICAgIGNvbnRyb2xzOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlSW5kZXg6IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUluZGV4ID09IG51bGwgP1xuICAgICAgICAwIDogdGhpcy5wcm9wcy5kZWZhdWx0QWN0aXZlSW5kZXgsXG4gICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBudWxsLFxuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBnZXREaXJlY3Rpb246IGZ1bmN0aW9uIChwcmV2SW5kZXgsIGluZGV4KSB7XG4gICAgaWYgKHByZXZJbmRleCA9PT0gaW5kZXgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBwcmV2SW5kZXggPiBpbmRleCA/XG4gICAgICAncHJldicgOiAnbmV4dCc7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcblxuICAgIGlmIChuZXh0UHJvcHMuYWN0aXZlSW5kZXggIT0gbnVsbCAmJiBuZXh0UHJvcHMuYWN0aXZlSW5kZXggIT09IGFjdGl2ZUluZGV4KSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBhY3RpdmVJbmRleCxcbiAgICAgICAgZGlyZWN0aW9uOiBuZXh0UHJvcHMuZGlyZWN0aW9uICE9IG51bGwgP1xuICAgICAgICAgIG5leHRQcm9wcy5kaXJlY3Rpb24gOiB0aGlzLmdldERpcmVjdGlvbihhY3RpdmVJbmRleCwgbmV4dFByb3BzLmFjdGl2ZUluZGV4KVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy53YWl0Rm9yTmV4dCgpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgfSxcblxuICBuZXh0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gdGhpcy5nZXRBY3RpdmVJbmRleCgpICsgMTtcbiAgICB2YXIgY291bnQgPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLm51bWJlck9mKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXG4gICAgaWYgKGluZGV4ID4gY291bnQgLSAxKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMud3JhcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbmRleCA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVTZWxlY3QoaW5kZXgsICduZXh0Jyk7XG4gIH0sXG5cbiAgcHJldjogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHZhciBpbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKSAtIDE7XG5cbiAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMud3JhcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbmRleCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubnVtYmVyT2YodGhpcy5wcm9wcy5jaGlsZHJlbikgLSAxO1xuICAgIH1cblxuICAgIHRoaXMuaGFuZGxlU2VsZWN0KGluZGV4LCAncHJldicpO1xuICB9LFxuXG4gIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5pc1BhdXNlZCA9IHRydWU7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gIH0sXG5cbiAgcGxheTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG4gIH0sXG5cbiAgd2FpdEZvck5leHQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMuaXNQYXVzZWQgJiYgdGhpcy5wcm9wcy5zbGlkZSAmJiB0aGlzLnByb3BzLmludGVydmFsICYmXG4gICAgICAgIHRoaXMucHJvcHMuYWN0aXZlSW5kZXggPT0gbnVsbCkge1xuICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLm5leHQsIHRoaXMucHJvcHMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVNb3VzZU92ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgIHRoaXMucGF1c2UoKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlTW91c2VPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc1BhdXNlZCkge1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgY2Fyb3VzZWw6IHRydWUsXG4gICAgICBzbGlkZTogdGhpcy5wcm9wcy5zbGlkZVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICBvbk1vdXNlT3Zlcjp0aGlzLmhhbmRsZU1vdXNlT3ZlcixcbiAgICAgICAgb25Nb3VzZU91dDp0aGlzLmhhbmRsZU1vdXNlT3V0fSwgXG4gICAgICAgIHRoaXMucHJvcHMuaW5kaWNhdG9ycyA/IHRoaXMucmVuZGVySW5kaWNhdG9ycygpIDogbnVsbCxcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImNhcm91c2VsLWlubmVyXCIsIHJlZjpcImlubmVyXCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckl0ZW0pXG4gICAgICAgICksXG4gICAgICAgIHRoaXMucHJvcHMuY29udHJvbHMgPyB0aGlzLnJlbmRlckNvbnRyb2xzKCkgOiBudWxsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQcmV2OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwibGVmdCBjYXJvdXNlbC1jb250cm9sXCIsIGhyZWY6XCIjcHJldlwiLCBrZXk6MCwgb25DbGljazp0aGlzLnByZXZ9LCBcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJnbHlwaGljb24gZ2x5cGhpY29uLWNoZXZyb24tbGVmdFwifSApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOZXh0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5hKCB7Y2xhc3NOYW1lOlwicmlnaHQgY2Fyb3VzZWwtY29udHJvbFwiLCBocmVmOlwiI25leHRcIiwga2V5OjEsIG9uQ2xpY2s6dGhpcy5uZXh0fSwgXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiZ2x5cGhpY29uIGdseXBoaWNvbi1jaGV2cm9uLXJpZ2h0XCJ9KVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29udHJvbHM6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy53cmFwKSB7XG4gICAgICB2YXIgYWN0aXZlSW5kZXggPSB0aGlzLmdldEFjdGl2ZUluZGV4KCk7XG4gICAgICB2YXIgY291bnQgPSBWYWxpZENvbXBvbmVudENoaWxkcmVuLm51bWJlck9mKHRoaXMucHJvcHMuY2hpbGRyZW4pO1xuXG4gICAgICByZXR1cm4gW1xuICAgICAgICAoYWN0aXZlSW5kZXggIT09IDApID8gdGhpcy5yZW5kZXJQcmV2KCkgOiBudWxsLFxuICAgICAgICAoYWN0aXZlSW5kZXggIT09IGNvdW50IC0gMSkgPyB0aGlzLnJlbmRlck5leHQoKSA6IG51bGxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIFtcbiAgICAgIHRoaXMucmVuZGVyUHJldigpLFxuICAgICAgdGhpcy5yZW5kZXJOZXh0KClcbiAgICBdO1xuICB9LFxuXG4gIHJlbmRlckluZGljYXRvcjogZnVuY3Rpb24gKGNoaWxkLCBpbmRleCkge1xuICAgIHZhciBjbGFzc05hbWUgPSAoaW5kZXggPT09IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKSkgP1xuICAgICAgJ2FjdGl2ZScgOiBudWxsO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5saShcbiAgICAgICAge2tleTppbmRleCxcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzTmFtZSxcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVNlbGVjdC5iaW5kKHRoaXMsIGluZGV4LCBudWxsKX0gKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVySW5kaWNhdG9yczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBpbmRpY2F0b3JzID0gW107XG4gICAgVmFsaWRDb21wb25lbnRDaGlsZHJlblxuICAgICAgLmZvckVhY2godGhpcy5wcm9wcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQsIGluZGV4KSB7XG4gICAgICAgIGluZGljYXRvcnMucHVzaChcbiAgICAgICAgICB0aGlzLnJlbmRlckluZGljYXRvcihjaGlsZCwgaW5kZXgpLFxuXG4gICAgICAgICAgLy8gRm9yY2Ugd2hpdGVzcGFjZSBiZXR3ZWVuIGluZGljYXRvciBlbGVtZW50cywgYm9vdHN0cmFwXG4gICAgICAgICAgLy8gcmVxdWlyZXMgdGhpcyBmb3IgY29ycmVjdCBzcGFjaW5nIG9mIGVsZW1lbnRzLlxuICAgICAgICAgICcgJ1xuICAgICAgICApO1xuICAgICAgfSwgdGhpcyk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLm9sKCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtaW5kaWNhdG9yc1wifSwgXG4gICAgICAgIGluZGljYXRvcnNcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldEFjdGl2ZUluZGV4OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuYWN0aXZlSW5kZXggIT0gbnVsbCA/IHRoaXMucHJvcHMuYWN0aXZlSW5kZXggOiB0aGlzLnN0YXRlLmFjdGl2ZUluZGV4O1xuICB9LFxuXG4gIGhhbmRsZUl0ZW1BbmltYXRlT3V0RW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBudWxsLFxuICAgICAgZGlyZWN0aW9uOiBudWxsXG4gICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLndhaXRGb3JOZXh0KCk7XG5cbiAgICAgIGlmICh0aGlzLnByb3BzLm9uU2xpZGVFbmQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNsaWRlRW5kKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVySXRlbTogZnVuY3Rpb24gKGNoaWxkLCBpbmRleCkge1xuICAgIHZhciBhY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICB2YXIgaXNBY3RpdmUgPSAoaW5kZXggPT09IGFjdGl2ZUluZGV4KTtcbiAgICB2YXIgaXNQcmV2aW91c0FjdGl2ZSA9IHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCAhPSBudWxsICYmXG4gICAgICAgICAgICB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlSW5kZXggPT09IGluZGV4ICYmIHRoaXMucHJvcHMuc2xpZGU7XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICAgIGNoaWxkLFxuICAgICAgICB7XG4gICAgICAgICAgYWN0aXZlOiBpc0FjdGl2ZSxcbiAgICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSAhPSBudWxsID9cbiAgICAgICAgICAgIGNoaWxkLnByb3BzLmtleSA6IGluZGV4LFxuICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICBhbmltYXRlT3V0OiBpc1ByZXZpb3VzQWN0aXZlLFxuICAgICAgICAgIGFuaW1hdGVJbjogaXNBY3RpdmUgJiYgdGhpcy5zdGF0ZS5wcmV2aW91c0FjdGl2ZUluZGV4ICE9IG51bGwgJiYgdGhpcy5wcm9wcy5zbGlkZSxcbiAgICAgICAgICBkaXJlY3Rpb246IHRoaXMuc3RhdGUuZGlyZWN0aW9uLFxuICAgICAgICAgIG9uQW5pbWF0ZU91dEVuZDogaXNQcmV2aW91c0FjdGl2ZSA/IHRoaXMuaGFuZGxlSXRlbUFuaW1hdGVPdXRFbmQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChpbmRleCwgZGlyZWN0aW9uKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG5cbiAgICB2YXIgcHJldmlvdXNBY3RpdmVJbmRleCA9IHRoaXMuZ2V0QWN0aXZlSW5kZXgoKTtcbiAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24gfHwgdGhpcy5nZXREaXJlY3Rpb24ocHJldmlvdXNBY3RpdmVJbmRleCwgaW5kZXgpO1xuXG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3QoaW5kZXgsIGRpcmVjdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSW5kZXggPT0gbnVsbCAmJiBpbmRleCAhPT0gcHJldmlvdXNBY3RpdmVJbmRleCkge1xuICAgICAgaWYgKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVJbmRleCAhPSBudWxsKSB7XG4gICAgICAgIC8vIElmIGN1cnJlbnRseSBhbmltYXRpbmcgZG9uJ3QgYWN0aXZhdGUgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgLy8gVE9ETzogbG9vayBpbnRvIHF1ZXVpbmcgdGhpcyBjYW5jZWxlZCBjYWxsIGFuZFxuICAgICAgICAvLyBhbmltYXRpbmcgYWZ0ZXIgdGhlIGN1cnJlbnQgYW5pbWF0aW9uIGhhcyBlbmRlZC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgYWN0aXZlSW5kZXg6IGluZGV4LFxuICAgICAgICBwcmV2aW91c0FjdGl2ZUluZGV4OiBwcmV2aW91c0FjdGl2ZUluZGV4LFxuICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvblxuICAgICAgfSk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJvdXNlbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgQ2Fyb3VzZWxJdGVtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnQ2Fyb3VzZWxJdGVtJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZGlyZWN0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub25lT2YoWydwcmV2JywgJ25leHQnXSksXG4gICAgb25BbmltYXRlT3V0RW5kOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNhcHRpb246IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlXG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFuaW1hdGlvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlQW5pbWF0ZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCAmJiB0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCh0aGlzLnByb3BzLmluZGV4KTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSAhPT0gbmV4dFByb3BzLmFjdGl2ZSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGRpcmVjdGlvbjogbnVsbFxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcykge1xuICAgIGlmICghdGhpcy5wcm9wcy5hY3RpdmUgJiYgcHJldlByb3BzLmFjdGl2ZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICB0aGlzLmdldERPTU5vZGUoKSxcbiAgICAgICAgdGhpcy5oYW5kbGVBbmltYXRlT3V0RW5kXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZSAhPT0gcHJldlByb3BzLmFjdGl2ZSkge1xuICAgICAgc2V0VGltZW91dCh0aGlzLnN0YXJ0QW5pbWF0aW9uLCAyMCk7XG4gICAgfVxuICB9LFxuXG4gIHN0YXJ0QW5pbWF0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBkaXJlY3Rpb246IHRoaXMucHJvcHMuZGlyZWN0aW9uID09PSAncHJldicgP1xuICAgICAgICAncmlnaHQnIDogJ2xlZnQnXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICBpdGVtOiB0cnVlLFxuICAgICAgYWN0aXZlOiAodGhpcy5wcm9wcy5hY3RpdmUgJiYgIXRoaXMucHJvcHMuYW5pbWF0ZUluKSB8fCB0aGlzLnByb3BzLmFuaW1hdGVPdXQsXG4gICAgICBuZXh0OiB0aGlzLnByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFuaW1hdGVJbiAmJiB0aGlzLnByb3BzLmRpcmVjdGlvbiA9PT0gJ25leHQnLFxuICAgICAgcHJldjogdGhpcy5wcm9wcy5hY3RpdmUgJiYgdGhpcy5wcm9wcy5hbmltYXRlSW4gJiYgdGhpcy5wcm9wcy5kaXJlY3Rpb24gPT09ICdwcmV2J1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5kaXJlY3Rpb24gJiYgKHRoaXMucHJvcHMuYW5pbWF0ZUluIHx8IHRoaXMucHJvcHMuYW5pbWF0ZU91dCkpIHtcbiAgICAgIGNsYXNzZXNbdGhpcy5zdGF0ZS5kaXJlY3Rpb25dID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW4sXG4gICAgICAgIHRoaXMucHJvcHMuY2FwdGlvbiA/IHRoaXMucmVuZGVyQ2FwdGlvbigpIDogbnVsbFxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ2FwdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiY2Fyb3VzZWwtY2FwdGlvblwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2FwdGlvblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcm91c2VsSXRlbTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKCcuL2NvbnN0YW50cycpO1xuXG5cbnZhciBDb2wgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdDb2wnLFxuICBwcm9wVHlwZXM6IHtcbiAgICB4czogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZzogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c09mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBzbU9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZE9mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ09mZnNldDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB4c1B1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgc21QdXNoOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIG1kUHVzaDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBsZ1B1c2g6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgeHNQdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHNtUHVsbDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBtZFB1bGw6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbGdQdWxsOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3NcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5kaXZcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIE9iamVjdC5rZXlzKGNvbnN0YW50cy5TSVpFUykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICB2YXIgc2l6ZSA9IGNvbnN0YW50cy5TSVpFU1trZXldO1xuICAgICAgdmFyIHByb3AgPSBzaXplO1xuICAgICAgdmFyIGNsYXNzUGFydCA9IHNpemUgKyAnLSc7XG5cbiAgICAgIGlmICh0aGlzLnByb3BzW3Byb3BdKSB7XG4gICAgICAgIGNsYXNzZXNbJ2NvbC0nICsgY2xhc3NQYXJ0ICsgdGhpcy5wcm9wc1twcm9wXV0gPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBwcm9wID0gc2l6ZSArICdPZmZzZXQnO1xuICAgICAgY2xhc3NQYXJ0ID0gc2l6ZSArICctb2Zmc2V0LSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHNpemUgKyAnUHVzaCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1wdXNoLSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcHJvcCA9IHNpemUgKyAnUHVsbCc7XG4gICAgICBjbGFzc1BhcnQgPSBzaXplICsgJy1wdWxsLSc7XG4gICAgICBpZiAodGhpcy5wcm9wc1twcm9wXSkge1xuICAgICAgICBjbGFzc2VzWydjb2wtJyArIGNsYXNzUGFydCArIHRoaXMucHJvcHNbcHJvcF1dID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2w7IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgQ29sbGFwc2FibGVNaXhpbiA9IHtcblxuICBwcm9wVHlwZXM6IHtcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGVmYXVsdEV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBleHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMuZGVmYXVsdEV4cGFuZGVkICE9IG51bGwgPyB0aGlzLnByb3BzLmRlZmF1bHRFeHBhbmRlZCA6IG51bGwsXG4gICAgICBjb2xsYXBzaW5nOiBmYWxzZVxuICAgIH07XG4gIH0sXG5cbiAgaGFuZGxlVHJhbnNpdGlvbkVuZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2NvbGxhcHNlRW5kID0gdHJ1ZTtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGNvbGxhcHNpbmc6IGZhbHNlXG4gICAgfSk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5ld1Byb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuY29sbGFwc2FibGUgJiYgbmV3UHJvcHMuZXhwYW5kZWQgIT09IHRoaXMucHJvcHMuZXhwYW5kZWQpIHtcbiAgICAgIHRoaXMuX2NvbGxhcHNlRW5kID0gZmFsc2U7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgY29sbGFwc2luZzogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIF9hZGRFbmRUcmFuc2l0aW9uTGlzdGVuZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICBub2RlLFxuICAgICAgICB0aGlzLmhhbmRsZVRyYW5zaXRpb25FbmRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIF9yZW1vdmVFbmRUcmFuc2l0aW9uTGlzdGVuZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgVHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKFxuICAgICAgICBub2RlLFxuICAgICAgICB0aGlzLmhhbmRsZVRyYW5zaXRpb25FbmRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fYWZ0ZXJSZW5kZXIoKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3JlbW92ZUVuZFRyYW5zaXRpb25MaXN0ZW5lcigpO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVcGRhdGU6IGZ1bmN0aW9uIChuZXh0UHJvcHMpIHtcbiAgICB2YXIgZGltZW5zaW9uID0gKHR5cGVvZiB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uKCkgOiAnaGVpZ2h0JztcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICB0aGlzLl9yZW1vdmVFbmRUcmFuc2l0aW9uTGlzdGVuZXIoKTtcbiAgICBpZiAobm9kZSAmJiBuZXh0UHJvcHMuZXhwYW5kZWQgIT09IHRoaXMucHJvcHMuZXhwYW5kZWQgJiYgdGhpcy5wcm9wcy5leHBhbmRlZCkge1xuICAgICAgbm9kZS5zdHlsZVtkaW1lbnNpb25dID0gdGhpcy5nZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlKCkgKyAncHgnO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xuICAgIGlmICh0aGlzLnN0YXRlLmNvbGxhcHNpbmcgIT09IHByZXZTdGF0ZS5jb2xsYXBzaW5nKSB7XG4gICAgICB0aGlzLl9hZnRlclJlbmRlcigpO1xuICAgIH1cbiAgfSxcblxuICBfYWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9hZGRFbmRUcmFuc2l0aW9uTGlzdGVuZXIoKTtcbiAgICBzZXRUaW1lb3V0KHRoaXMuX3VwZGF0ZURpbWVuc2lvbkFmdGVyUmVuZGVyLCAwKTtcbiAgfSxcblxuICBfdXBkYXRlRGltZW5zaW9uQWZ0ZXJSZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGltZW5zaW9uID0gKHR5cGVvZiB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uID09PSAnZnVuY3Rpb24nKSA/XG4gICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uKCkgOiAnaGVpZ2h0JztcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Q29sbGFwc2FibGVET01Ob2RlKCk7XG5cbiAgICBpZiAobm9kZSkge1xuICAgICAgbm9kZS5zdHlsZVtkaW1lbnNpb25dID0gdGhpcy5pc0V4cGFuZGVkKCkgP1xuICAgICAgICB0aGlzLmdldENvbGxhcHNhYmxlRGltZW5zaW9uVmFsdWUoKSArICdweCcgOiAnMHB4JztcbiAgICB9XG4gIH0sXG5cbiAgaXNFeHBhbmRlZDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5wcm9wcy5leHBhbmRlZCAhPSBudWxsKSA/XG4gICAgICB0aGlzLnByb3BzLmV4cGFuZGVkIDogdGhpcy5zdGF0ZS5leHBhbmRlZDtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZUNsYXNzU2V0OiBmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7fTtcblxuICAgIGlmICh0eXBlb2YgY2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgY2xhc3NOYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xhc3NOYW1lKSB7XG4gICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICBjbGFzc2VzW2NsYXNzTmFtZV0gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjbGFzc2VzLmNvbGxhcHNpbmcgPSB0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG4gICAgY2xhc3Nlcy5jb2xsYXBzZSA9ICF0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG4gICAgY2xhc3Nlc1snaW4nXSA9IHRoaXMuaXNFeHBhbmRlZCgpICYmICF0aGlzLnN0YXRlLmNvbGxhcHNpbmc7XG5cbiAgICByZXR1cm4gY2xhc3NlcztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsYXBzYWJsZU1peGluOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIERyb3Bkb3duU3RhdGVNaXhpbiA9IHJlcXVpcmUoJy4vRHJvcGRvd25TdGF0ZU1peGluJyk7XG52YXIgQnV0dG9uID0gcmVxdWlyZSgnLi9CdXR0b24nKTtcbnZhciBCdXR0b25Hcm91cCA9IHJlcXVpcmUoJy4vQnV0dG9uR3JvdXAnKTtcbnZhciBEcm9wZG93bk1lbnUgPSByZXF1aXJlKCcuL0Ryb3Bkb3duTWVudScpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxuXG52YXIgRHJvcGRvd25CdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdEcm9wZG93bkJ1dHRvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluLCBEcm9wZG93blN0YXRlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHB1bGxSaWdodDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZHJvcHVwOiAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICB0aXRsZTogICAgIFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGhyZWY6ICAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBvbkNsaWNrOiAgIFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIG9uU2VsZWN0OiAgUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgbmF2SXRlbTogICBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc05hbWUgPSAnZHJvcGRvd24tdG9nZ2xlJztcblxuICAgIHZhciByZW5kZXJNZXRob2QgPSB0aGlzLnByb3BzLm5hdkl0ZW0gP1xuICAgICAgJ3JlbmRlck5hdkl0ZW0nIDogJ3JlbmRlckJ1dHRvbkdyb3VwJztcblxuICAgIHJldHVybiB0aGlzW3JlbmRlck1ldGhvZF0oW1xuICAgICAgdGhpcy50cmFuc2ZlclByb3BzVG8oQnV0dG9uKFxuICAgICAgICB7cmVmOlwiZHJvcGRvd25CdXR0b25cIixcbiAgICAgICAgY2xhc3NOYW1lOmNsYXNzTmFtZSxcbiAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZURyb3Bkb3duQ2xpY2ssXG4gICAgICAgIGtleTowLFxuICAgICAgICBuYXZEcm9wZG93bjp0aGlzLnByb3BzLm5hdkl0ZW0sXG4gICAgICAgIG5hdkl0ZW06bnVsbCxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgcHVsbFJpZ2h0Om51bGwsXG4gICAgICAgIGRyb3B1cDpudWxsfSwgXG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUsJyAnLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImNhcmV0XCJ9IClcbiAgICAgICkpLFxuICAgICAgRHJvcGRvd25NZW51KFxuICAgICAgICB7cmVmOlwibWVudVwiLFxuICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5Jzp0aGlzLnByb3BzLmlkLFxuICAgICAgICBwdWxsUmlnaHQ6dGhpcy5wcm9wcy5wdWxsUmlnaHQsXG4gICAgICAgIGtleToxfSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyTWVudUl0ZW0pXG4gICAgICApXG4gICAgXSk7XG4gIH0sXG5cbiAgcmVuZGVyQnV0dG9uR3JvdXA6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBncm91cENsYXNzZXMgPSB7XG4gICAgICAgICdvcGVuJzogdGhpcy5zdGF0ZS5vcGVuLFxuICAgICAgICAnZHJvcHVwJzogdGhpcy5wcm9wcy5kcm9wdXBcbiAgICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgQnV0dG9uR3JvdXAoXG4gICAgICAgIHtic1NpemU6dGhpcy5wcm9wcy5ic1NpemUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChncm91cENsYXNzZXMpfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgJ2Ryb3Bkb3duJzogdHJ1ZSxcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlck1lbnVJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAvLyBPbmx5IGhhbmRsZSB0aGUgb3B0aW9uIHNlbGVjdGlvbiBpZiBhbiBvblNlbGVjdCBwcm9wIGhhcyBiZWVuIHNldCBvbiB0aGVcbiAgICAvLyBjb21wb25lbnQgb3IgaXQncyBjaGlsZCwgdGhpcyBhbGxvd3MgYSB1c2VyIG5vdCB0byBwYXNzIGFuIG9uU2VsZWN0XG4gICAgLy8gaGFuZGxlciBhbmQgaGF2ZSB0aGUgYnJvd3NlciBwcmVmb3JtIHRoZSBkZWZhdWx0IGFjdGlvbi5cbiAgICB2YXIgaGFuZGxlT3B0aW9uU2VsZWN0ID0gdGhpcy5wcm9wcy5vblNlbGVjdCB8fCBjaGlsZC5wcm9wcy5vblNlbGVjdCA/XG4gICAgICB0aGlzLmhhbmRsZU9wdGlvblNlbGVjdCA6IG51bGw7XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgLy8gQ2FwdHVyZSBvblNlbGVjdCBldmVudHNcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgaGFuZGxlT3B0aW9uU2VsZWN0KSxcblxuICAgICAgICAvLyBGb3JjZSBzcGVjaWFsIHByb3BzIHRvIGJlIHRyYW5zZmVycmVkXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgICAgfVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlRHJvcGRvd25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoIXRoaXMuc3RhdGUub3Blbik7XG4gIH0sXG5cbiAgaGFuZGxlT3B0aW9uU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bkJ1dHRvbjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG5cbnZhciBEcm9wZG93bk1lbnUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdEcm9wZG93bk1lbnUnLFxuICBwcm9wVHlwZXM6IHtcbiAgICBwdWxsUmlnaHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgICAnZHJvcGRvd24tbWVudSc6IHRydWUsXG4gICAgICAgICdkcm9wZG93bi1tZW51LXJpZ2h0JzogdGhpcy5wcm9wcy5wdWxsUmlnaHRcbiAgICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgIFJlYWN0LkRPTS51bChcbiAgICAgICAgICB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLFxuICAgICAgICAgIHJvbGU6XCJtZW51XCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck1lbnVJdGVtKVxuICAgICAgICApXG4gICAgICApO1xuICB9LFxuXG4gIHJlbmRlck1lbnVJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgLy8gQ2FwdHVyZSBvblNlbGVjdCBldmVudHNcbiAgICAgICAgb25TZWxlY3Q6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vblNlbGVjdCwgdGhpcy5wcm9wcy5vblNlbGVjdCksXG5cbiAgICAgICAgLy8gRm9yY2Ugc3BlY2lhbCBwcm9wcyB0byBiZSB0cmFuc2ZlcnJlZFxuICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWZcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93bk1lbnU7IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgRXZlbnRMaXN0ZW5lciA9IHJlcXVpcmUoJy4vdXRpbHMvRXZlbnRMaXN0ZW5lcicpO1xuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyB3aXRoaW5cbiAqIGEgcm9vdCBub2RlcyB0cmVlXG4gKlxuICogQHBhcmFtIHtET01FbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0RPTUVsZW1lbnR9IHJvb3RcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc05vZGVJblJvb3Qobm9kZSwgcm9vdCkge1xuICB3aGlsZSAobm9kZSkge1xuICAgIGlmIChub2RlID09PSByb290KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxudmFyIERyb3Bkb3duU3RhdGVNaXhpbiA9IHtcbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9wZW46IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBzZXREcm9wZG93blN0YXRlOiBmdW5jdGlvbiAobmV3U3RhdGUsIG9uU3RhdGVDaGFuZ2VDb21wbGV0ZSkge1xuICAgIGlmIChuZXdTdGF0ZSkge1xuICAgICAgdGhpcy5iaW5kUm9vdENsb3NlSGFuZGxlcnMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51bmJpbmRSb290Q2xvc2VIYW5kbGVycygpO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3BlbjogbmV3U3RhdGVcbiAgICB9LCBvblN0YXRlQ2hhbmdlQ29tcGxldGUpO1xuICB9LFxuXG4gIGhhbmRsZURvY3VtZW50S2V5VXA6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGUua2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIHRoaXMuc2V0RHJvcGRvd25TdGF0ZShmYWxzZSk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZURvY3VtZW50Q2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgLy8gSWYgdGhlIGNsaWNrIG9yaWdpbmF0ZWQgZnJvbSB3aXRoaW4gdGhpcyBjb21wb25lbnRcbiAgICAvLyBkb24ndCBkbyBhbnl0aGluZy5cbiAgICBpZiAoaXNOb2RlSW5Sb290KGUudGFyZ2V0LCB0aGlzLmdldERPTU5vZGUoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9LFxuXG4gIGJpbmRSb290Q2xvc2VIYW5kbGVyczogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAnY2xpY2snLCB0aGlzLmhhbmRsZURvY3VtZW50Q2xpY2spO1xuICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyID1cbiAgICAgIEV2ZW50TGlzdGVuZXIubGlzdGVuKGRvY3VtZW50LCAna2V5dXAnLCB0aGlzLmhhbmRsZURvY3VtZW50S2V5VXApO1xuICB9LFxuXG4gIHVuYmluZFJvb3RDbG9zZUhhbmRsZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX29uRG9jdW1lbnRDbGlja0xpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9vbkRvY3VtZW50Q2xpY2tMaXN0ZW5lci5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX29uRG9jdW1lbnRLZXl1cExpc3RlbmVyLnJlbW92ZSgpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudW5iaW5kUm9vdENsb3NlSGFuZGxlcnMoKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEcm9wZG93blN0YXRlTWl4aW47IiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbi8vIFRPRE86IGxpc3RlbiBmb3Igb25UcmFuc2l0aW9uRW5kIHRvIHJlbW92ZSBlbFxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIF9mYWRlSW46IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzO1xuXG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIGVscyA9IHRoaXMuZ2V0RE9NTm9kZSgpLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mYWRlJyk7XG4gICAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgICBBcnJheS5wcm90b3R5cGUuZm9yRWFjaC5jYWxsKGVscywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgZWwuY2xhc3NOYW1lICs9ICcgaW4nO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgX2ZhZGVPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzID0gdGhpcy5fZmFkZU91dEVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mYWRlLmluJyk7XG5cbiAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgQXJyYXkucHJvdG90eXBlLmZvckVhY2guY2FsbChlbHMsIGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZSgvXFxiaW5cXGIvLCAnJyk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KHRoaXMuX2hhbmRsZUZhZGVPdXRFbmQsIDMwMCk7XG4gIH0sXG5cbiAgX2hhbmRsZUZhZGVPdXRFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fZmFkZU91dEVsICYmIHRoaXMuX2ZhZGVPdXRFbC5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9mYWRlT3V0RWwpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xuICAgIGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKSB7XG4gICAgICAvLyBGaXJlZm94IG5lZWRzIGRlbGF5IGZvciB0cmFuc2l0aW9uIHRvIGJlIHRyaWdnZXJlZFxuICAgICAgc2V0VGltZW91dCh0aGlzLl9mYWRlSW4sIDIwKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZWxzID0gdGhpcy5nZXRET01Ob2RlKCkucXVlcnlTZWxlY3RvckFsbCgnLmZhZGUnKTtcbiAgICBpZiAoZWxzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fZmFkZU91dEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuX2ZhZGVPdXRFbCk7XG4gICAgICB0aGlzLl9mYWRlT3V0RWwuYXBwZW5kQ2hpbGQodGhpcy5nZXRET01Ob2RlKCkuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgIC8vIEZpcmVmb3ggbmVlZHMgZGVsYXkgZm9yIHRyYW5zaXRpb24gdG8gYmUgdHJpZ2dlcmVkXG4gICAgICBzZXRUaW1lb3V0KHRoaXMuX2ZhZGVPdXQsIDIwKTtcbiAgICB9XG4gIH1cbn07XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgY29uc3RhbnRzID0gcmVxdWlyZSgnLi9jb25zdGFudHMnKTtcblxudmFyIEdseXBoaWNvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0dseXBoaWNvbicsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBnbHlwaDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKGNvbnN0YW50cy5HTFlQSFMpLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2dseXBoaWNvbidcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICBjbGFzc2VzWydnbHlwaGljb24tJyArIHRoaXMucHJvcHMuZ2x5cGhdID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBHbHlwaGljb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG5cblxudmFyIEdyaWQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdHcmlkJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgZmx1aWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbXBvbmVudENsYXNzOiBDdXN0b21Qcm9wVHlwZXMuY29tcG9uZW50Q2xhc3NcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29tcG9uZW50Q2xhc3M6IFJlYWN0LkRPTS5kaXZcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjb21wb25lbnRDbGFzcyA9IHRoaXMucHJvcHMuY29tcG9uZW50Q2xhc3M7XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBjb21wb25lbnRDbGFzcygge2NsYXNzTmFtZTp0aGlzLnByb3BzLmZsdWlkID8gJ2NvbnRhaW5lci1mbHVpZCcgOiAnY29udGFpbmVyJ30sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gR3JpZDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBJbnB1dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0lucHV0JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgdHlwZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBsYWJlbDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaGVscDogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYWRkb25CZWZvcmU6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGFkZG9uQWZ0ZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3N1Y2Nlc3MnLCAnd2FybmluZycsICdlcnJvciddKSxcbiAgICBoYXNGZWVkYmFjazogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZ3JvdXBDbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgd3JhcHBlckNsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBsYWJlbENsYXNzTmFtZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldElucHV0RE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnJlZnMuaW5wdXQuZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIGdldFZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMudHlwZSA9PT0gJ3N0YXRpYycpIHtcbiAgICAgIHJldHVybiB0aGlzLnByb3BzLnZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLnByb3BzLnR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldElucHV0RE9NTm9kZSgpLnZhbHVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRocm93IEVycm9yKCdDYW5ub3QgdXNlIGdldFZhbHVlIHdpdGhvdXQgc3BlY2lmeWluZyBpbnB1dCB0eXBlLicpO1xuICAgIH1cbiAgfSxcblxuICBnZXRDaGVja2VkOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SW5wdXRET01Ob2RlKCkuY2hlY2tlZDtcbiAgfSxcblxuICBpc0NoZWNrYm94T3JSYWRpbzogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLnR5cGUgPT09ICdyYWRpbycgfHwgdGhpcy5wcm9wcy50eXBlID09PSAnY2hlY2tib3gnO1xuICB9LFxuXG4gIHJlbmRlcklucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlucHV0ID0gbnVsbDtcblxuICAgIGlmICghdGhpcy5wcm9wcy50eXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5wcm9wcy50eXBlKSB7XG4gICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICBpbnB1dCA9IChcbiAgICAgICAgICBSZWFjdC5ET00uc2VsZWN0KCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sXCIsIHJlZjpcImlucHV0XCIsIGtleTpcImlucHV0XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgICBpbnB1dCA9IFJlYWN0LkRPTS50ZXh0YXJlYSgge2NsYXNzTmFtZTpcImZvcm0tY29udHJvbFwiLCByZWY6XCJpbnB1dFwiLCBrZXk6XCJpbnB1dFwifSApO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0YXRpYyc6XG4gICAgICAgIGlucHV0ID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5wKCB7Y2xhc3NOYW1lOlwiZm9ybS1jb250cm9sLXN0YXRpY1wiLCByZWY6XCJpbnB1dFwiLCAga2V5OlwiaW5wdXRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy52YWx1ZVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5pc0NoZWNrYm94T3JSYWRpbygpID8gJycgOiAnZm9ybS1jb250cm9sJztcbiAgICAgICAgaW5wdXQgPSBSZWFjdC5ET00uaW5wdXQoIHtjbGFzc05hbWU6Y2xhc3NOYW1lLCByZWY6XCJpbnB1dFwiLCBrZXk6XCJpbnB1dFwifSApO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhpbnB1dCk7XG4gIH0sXG5cbiAgcmVuZGVySW5wdXRHcm91cDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGFkZG9uQmVmb3JlID0gdGhpcy5wcm9wcy5hZGRvbkJlZm9yZSA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIiwga2V5OlwiYWRkb25CZWZvcmVcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmFkZG9uQmVmb3JlXG4gICAgICApXG4gICAgKSA6IG51bGw7XG5cbiAgICB2YXIgYWRkb25BZnRlciA9IHRoaXMucHJvcHMuYWRkb25BZnRlciA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXAtYWRkb25cIiwga2V5OlwiYWRkb25BZnRlclwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuYWRkb25BZnRlclxuICAgICAgKVxuICAgICkgOiBudWxsO1xuXG4gICAgcmV0dXJuIGFkZG9uQmVmb3JlIHx8IGFkZG9uQWZ0ZXIgPyAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiaW5wdXQtZ3JvdXBcIiwga2V5OlwiaW5wdXQtZ3JvdXBcIn0sIFxuICAgICAgICBhZGRvbkJlZm9yZSxcbiAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgIGFkZG9uQWZ0ZXJcbiAgICAgIClcbiAgICApIDogY2hpbGRyZW47XG4gIH0sXG5cbiAgcmVuZGVySWNvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2dseXBoaWNvbic6IHRydWUsXG4gICAgICAnZm9ybS1jb250cm9sLWZlZWRiYWNrJzogdHJ1ZSxcbiAgICAgICdnbHlwaGljb24tb2snOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdzdWNjZXNzJyxcbiAgICAgICdnbHlwaGljb24td2FybmluZy1zaWduJzogdGhpcy5wcm9wcy5ic1N0eWxlID09PSAnd2FybmluZycsXG4gICAgICAnZ2x5cGhpY29uLXJlbW92ZSc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ2Vycm9yJ1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5oYXNGZWVkYmFjayA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJpY29uXCJ9IClcbiAgICApIDogbnVsbDtcbiAgfSxcblxuICByZW5kZXJIZWxwOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMuaGVscCA/IChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaGVscC1ibG9ja1wiLCBrZXk6XCJoZWxwXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5oZWxwXG4gICAgICApXG4gICAgKSA6IG51bGw7XG4gIH0sXG5cbiAgcmVuZGVyQ2hlY2tib3hhbmRSYWRpb1dyYXBwZXI6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2NoZWNrYm94JzogdGhpcy5wcm9wcy50eXBlID09PSAnY2hlY2tib3gnLFxuICAgICAgJ3JhZGlvJzogdGhpcy5wcm9wcy50eXBlID09PSAncmFkaW8nXG4gICAgfTtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBrZXk6XCJjaGVja2JveFJhZGlvV3JhcHBlclwifSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJXcmFwcGVyOiBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gdGhpcy5wcm9wcy53cmFwcGVyQ2xhc3NOYW1lID8gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTp0aGlzLnByb3BzLndyYXBwZXJDbGFzc05hbWUsIGtleTpcIndyYXBwZXJcIn0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJMYWJlbDogZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnY29udHJvbC1sYWJlbCc6ICF0aGlzLmlzQ2hlY2tib3hPclJhZGlvKClcbiAgICB9O1xuICAgIGNsYXNzZXNbdGhpcy5wcm9wcy5sYWJlbENsYXNzTmFtZV0gPSB0aGlzLnByb3BzLmxhYmVsQ2xhc3NOYW1lO1xuXG4gICAgcmV0dXJuIHRoaXMucHJvcHMubGFiZWwgPyAoXG4gICAgICBSZWFjdC5ET00ubGFiZWwoIHtodG1sRm9yOnRoaXMucHJvcHMuaWQsIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwga2V5OlwibGFiZWxcIn0sIFxuICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgdGhpcy5wcm9wcy5sYWJlbFxuICAgICAgKVxuICAgICkgOiBjaGlsZHJlbjtcbiAgfSxcblxuICByZW5kZXJGb3JtR3JvdXA6IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2Zvcm0tZ3JvdXAnOiB0cnVlLFxuICAgICAgJ2hhcy1mZWVkYmFjayc6IHRoaXMucHJvcHMuaGFzRmVlZGJhY2ssXG4gICAgICAnaGFzLXN1Y2Nlc3MnOiB0aGlzLnByb3BzLmJzU3R5bGUgPT09ICdzdWNjZXNzJyxcbiAgICAgICdoYXMtd2FybmluZyc6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ3dhcm5pbmcnLFxuICAgICAgJ2hhcy1lcnJvcic6IHRoaXMucHJvcHMuYnNTdHlsZSA9PT0gJ2Vycm9yJ1xuICAgIH07XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLmdyb3VwQ2xhc3NOYW1lXSA9IHRoaXMucHJvcHMuZ3JvdXBDbGFzc05hbWU7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNDaGVja2JveE9yUmFkaW8oKSkge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyRm9ybUdyb3VwKFxuICAgICAgICB0aGlzLnJlbmRlcldyYXBwZXIoW1xuICAgICAgICAgIHRoaXMucmVuZGVyQ2hlY2tib3hhbmRSYWRpb1dyYXBwZXIoXG4gICAgICAgICAgICB0aGlzLnJlbmRlckxhYmVsKFxuICAgICAgICAgICAgICB0aGlzLnJlbmRlcklucHV0KClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVySGVscCgpXG4gICAgICAgIF0pXG4gICAgICApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlckZvcm1Hcm91cChbXG4gICAgICAgIHRoaXMucmVuZGVyTGFiZWwoKSxcbiAgICAgICAgdGhpcy5yZW5kZXJXcmFwcGVyKFtcbiAgICAgICAgICB0aGlzLnJlbmRlcklucHV0R3JvdXAoXG4gICAgICAgICAgICB0aGlzLnJlbmRlcklucHV0KClcbiAgICAgICAgICApLFxuICAgICAgICAgIHRoaXMucmVuZGVySWNvbigpLFxuICAgICAgICAgIHRoaXMucmVuZGVySGVscCgpXG4gICAgICAgIF0pXG4gICAgICBdKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElucHV0O1xuIiwiLy8gaHR0cHM6Ly93d3cubnBtanMub3JnL3BhY2thZ2UvcmVhY3QtaW50ZXJwb2xhdGUtY29tcG9uZW50XG4ndXNlIHN0cmljdCc7XG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIG1lcmdlID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZScpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxudmFyIFJFR0VYUCA9IC9cXCVcXCgoLis/KVxcKXMvO1xuXG52YXIgSW50ZXJwb2xhdGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIGRpc3BsYXlOYW1lOiAnSW50ZXJwb2xhdGUnLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGZvcm1hdDogUmVhY3QuUHJvcFR5cGVzLnN0cmluZ1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHsgY29tcG9uZW50OiBSZWFjdC5ET00uc3BhbiB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZvcm1hdCA9IFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uaGFzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5jaGlsZHJlbikgPyB0aGlzLnByb3BzLmNoaWxkcmVuIDogdGhpcy5wcm9wcy5mb3JtYXQ7XG4gICAgdmFyIHBhcmVudCA9IHRoaXMucHJvcHMuY29tcG9uZW50O1xuICAgIHZhciB1bnNhZmUgPSB0aGlzLnByb3BzLnVuc2FmZSA9PT0gdHJ1ZTtcbiAgICB2YXIgcHJvcHMgPSBtZXJnZSh0aGlzLnByb3BzKTtcblxuICAgIGRlbGV0ZSBwcm9wcy5jaGlsZHJlbjtcbiAgICBkZWxldGUgcHJvcHMuZm9ybWF0O1xuICAgIGRlbGV0ZSBwcm9wcy5jb21wb25lbnQ7XG4gICAgZGVsZXRlIHByb3BzLnVuc2FmZTtcblxuICAgIGlmICh1bnNhZmUpIHtcbiAgICAgIHZhciBjb250ZW50ID0gZm9ybWF0LnNwbGl0KFJFR0VYUCkucmVkdWNlKGZ1bmN0aW9uKG1lbW8sIG1hdGNoLCBpbmRleCkge1xuICAgICAgICB2YXIgaHRtbDtcblxuICAgICAgICBpZiAoaW5kZXggJSAyID09PSAwKSB7XG4gICAgICAgICAgaHRtbCA9IG1hdGNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGh0bWwgPSBwcm9wc1ttYXRjaF07XG4gICAgICAgICAgZGVsZXRlIHByb3BzW21hdGNoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGh0bWwpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgaW50ZXJwb2xhdGUgYSBSZWFjdCBjb21wb25lbnQgaW50byB1bnNhZmUgdGV4dCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVtbyArPSBodG1sO1xuXG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgfSwgJycpO1xuXG4gICAgICBwcm9wcy5kYW5nZXJvdXNseVNldElubmVySFRNTCA9IHsgX19odG1sOiBjb250ZW50IH07XG5cbiAgICAgIHJldHVybiBwYXJlbnQocHJvcHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IGZvcm1hdC5zcGxpdChSRUdFWFApLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtYXRjaCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGNoaWxkO1xuXG4gICAgICAgIGlmIChpbmRleCAlIDIgPT09IDApIHtcbiAgICAgICAgICBpZiAobWF0Y2gubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjaGlsZCA9IG1hdGNoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoaWxkID0gcHJvcHNbbWF0Y2hdO1xuICAgICAgICAgIGRlbGV0ZSBwcm9wc1ttYXRjaF07XG4gICAgICAgIH1cblxuICAgICAgICBtZW1vLnB1c2goY2hpbGQpO1xuXG4gICAgICAgIHJldHVybiBtZW1vO1xuICAgICAgfSwgW3Byb3BzXSk7XG5cbiAgICAgIHJldHVybiBwYXJlbnQuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcnBvbGF0ZTtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcblxudmFyIEp1bWJvdHJvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0p1bWJvdHJvbicsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImp1bWJvdHJvblwifSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBKdW1ib3Ryb247IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgTGFiZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdMYWJlbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ2xhYmVsJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0J1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBMYWJlbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBNZW51SXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01lbnVJdGVtJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgaGVhZGVyOiAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpdmlkZXI6ICBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBocmVmOiAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICB0aXRsZTogICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBvblNlbGVjdDogUmVhY3QuUHJvcFR5cGVzLmZ1bmNcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaHJlZjogJyMnXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSk7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlckFuY2hvcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uYSgge29uQ2xpY2s6dGhpcy5oYW5kbGVDbGljaywgaHJlZjp0aGlzLnByb3BzLmhyZWYsIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsIHRhYkluZGV4OlwiLTFcIn0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgJ2Ryb3Bkb3duLWhlYWRlcic6IHRoaXMucHJvcHMuaGVhZGVyLFxuICAgICAgICAnZGl2aWRlcic6IHRoaXMucHJvcHMuZGl2aWRlclxuICAgICAgfTtcblxuICAgIHZhciBjaGlsZHJlbiA9IG51bGw7XG4gICAgaWYgKHRoaXMucHJvcHMuaGVhZGVyKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMucHJvcHMuY2hpbGRyZW47XG4gICAgfSBlbHNlIGlmICghdGhpcy5wcm9wcy5kaXZpZGVyKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMucmVuZGVyQW5jaG9yKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7cm9sZTpcInByZXNlbnRhdGlvblwiLCB0aXRsZTpudWxsLCBocmVmOm51bGwsIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICBjaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnVJdGVtOyIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcbnZhciBGYWRlTWl4aW4gPSByZXF1aXJlKCcuL0ZhZGVNaXhpbicpO1xudmFyIEV2ZW50TGlzdGVuZXIgPSByZXF1aXJlKCcuL3V0aWxzL0V2ZW50TGlzdGVuZXInKTtcblxuXG4vLyBUT0RPOlxuLy8gLSBhcmlhLWxhYmVsbGVkYnlcbi8vIC0gQWRkIGBtb2RhbC1ib2R5YCBkaXYgaWYgb25seSBvbmUgY2hpbGQgcGFzc2VkIGluIHRoYXQgZG9lc24ndCBhbHJlYWR5IGhhdmUgaXRcbi8vIC0gVGVzdHNcblxudmFyIE1vZGFsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTW9kYWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgRmFkZU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgYmFja2Ryb3A6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3N0YXRpYycsIHRydWUsIGZhbHNlXSksXG4gICAga2V5Ym9hcmQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNsb3NlQnV0dG9uOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBhbmltYXRpb246IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uUmVxdWVzdEhpZGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ21vZGFsJyxcbiAgICAgIGJhY2tkcm9wOiB0cnVlLFxuICAgICAga2V5Ym9hcmQ6IHRydWUsXG4gICAgICBhbmltYXRpb246IHRydWUsXG4gICAgICBjbG9zZUJ1dHRvbjogdHJ1ZVxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1vZGFsU3R5bGUgPSB7ZGlzcGxheTogJ2Jsb2NrJ307XG4gICAgdmFyIGRpYWxvZ0NsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBkZWxldGUgZGlhbG9nQ2xhc3Nlcy5tb2RhbDtcbiAgICBkaWFsb2dDbGFzc2VzWydtb2RhbC1kaWFsb2cnXSA9IHRydWU7XG5cbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgIG1vZGFsOiB0cnVlLFxuICAgICAgZmFkZTogdGhpcy5wcm9wcy5hbmltYXRpb24sXG4gICAgICAnaW4nOiAhdGhpcy5wcm9wcy5hbmltYXRpb24gfHwgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGxcbiAgICB9O1xuXG4gICAgdmFyIG1vZGFsID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00uZGl2KFxuICAgICAgICB7dGl0bGU6bnVsbCxcbiAgICAgICAgdGFiSW5kZXg6XCItMVwiLFxuICAgICAgICByb2xlOlwiZGlhbG9nXCIsXG4gICAgICAgIHN0eWxlOm1vZGFsU3R5bGUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSxcbiAgICAgICAgb25DbGljazp0aGlzLnByb3BzLmJhY2tkcm9wID09PSB0cnVlID8gdGhpcy5oYW5kbGVCYWNrZHJvcENsaWNrIDogbnVsbCxcbiAgICAgICAgcmVmOlwibW9kYWxcIn0sIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGRpYWxvZ0NsYXNzZXMpfSwgXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm1vZGFsLWNvbnRlbnRcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy50aXRsZSA/IHRoaXMucmVuZGVySGVhZGVyKCkgOiBudWxsLFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5iYWNrZHJvcCA/XG4gICAgICB0aGlzLnJlbmRlckJhY2tkcm9wKG1vZGFsKSA6IG1vZGFsO1xuICB9LFxuXG4gIHJlbmRlckJhY2tkcm9wOiBmdW5jdGlvbiAobW9kYWwpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdtb2RhbC1iYWNrZHJvcCc6IHRydWUsXG4gICAgICAnZmFkZSc6IHRoaXMucHJvcHMuYW5pbWF0aW9uXG4gICAgfTtcblxuICAgIGNsYXNzZXNbJ2luJ10gPSAhdGhpcy5wcm9wcy5hbmltYXRpb24gfHwgIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw7XG5cbiAgICB2YXIgb25DbGljayA9IHRoaXMucHJvcHMuYmFja2Ryb3AgPT09IHRydWUgP1xuICAgICAgdGhpcy5oYW5kbGVCYWNrZHJvcENsaWNrIDogbnVsbDtcblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KG51bGwsIFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCByZWY6XCJiYWNrZHJvcFwiLCBvbkNsaWNrOm9uQ2xpY2t9ICksXG4gICAgICAgIG1vZGFsXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJIZWFkZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xvc2VCdXR0b247XG4gICAgaWYgKHRoaXMucHJvcHMuY2xvc2VCdXR0b24pIHtcbiAgICAgIGNsb3NlQnV0dG9uID0gKFxuICAgICAgICAgIFJlYWN0LkRPTS5idXR0b24oIHt0eXBlOlwiYnV0dG9uXCIsIGNsYXNzTmFtZTpcImNsb3NlXCIsICdhcmlhLWhpZGRlbic6XCJ0cnVlXCIsIG9uQ2xpY2s6dGhpcy5wcm9wcy5vblJlcXVlc3RIaWRlfSwgXCLDl1wiKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwibW9kYWwtaGVhZGVyXCJ9LCBcbiAgICAgICAgY2xvc2VCdXR0b24sXG4gICAgICAgIHRoaXMucmVuZGVyVGl0bGUoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVGl0bGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuaXNWYWxpZENvbXBvbmVudCh0aGlzLnByb3BzLnRpdGxlKSA/XG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUgOiBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJtb2RhbC10aXRsZVwifSwgdGhpcy5wcm9wcy50aXRsZSlcbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fb25Eb2N1bWVudEtleXVwTGlzdGVuZXIgPVxuICAgICAgRXZlbnRMaXN0ZW5lci5saXN0ZW4oZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuaGFuZGxlRG9jdW1lbnRLZXlVcCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vbkRvY3VtZW50S2V5dXBMaXN0ZW5lci5yZW1vdmUoKTtcbiAgfSxcblxuICBoYW5kbGVCYWNrZHJvcENsaWNrOiBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5wcm9wcy5vblJlcXVlc3RIaWRlKCk7XG4gIH0sXG5cbiAgaGFuZGxlRG9jdW1lbnRLZXlVcDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5rZXlib2FyZCAmJiBlLmtleUNvZGUgPT09IDI3KSB7XG4gICAgICB0aGlzLnByb3BzLm9uUmVxdWVzdEhpZGUoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGFsO1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIE92ZXJsYXlNaXhpbiA9IHJlcXVpcmUoJy4vT3ZlcmxheU1peGluJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcblxudmFyIE1vZGFsVHJpZ2dlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ01vZGFsVHJpZ2dlcicsXG4gIG1peGluczogW092ZXJsYXlNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgbW9kYWw6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLmlzUmVxdWlyZWRcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNPdmVybGF5U2hvd246IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogdHJ1ZVxuICAgIH0pO1xuICB9LFxuXG4gIGhpZGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiBmYWxzZVxuICAgIH0pO1xuICB9LFxuXG4gIHRvZ2dsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXNPdmVybGF5U2hvd246ICF0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duXG4gICAgfSk7XG4gIH0sXG5cbiAgcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93bikge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zcGFuKG51bGwgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICB0aGlzLnByb3BzLm1vZGFsLFxuICAgICAge1xuICAgICAgICBvblJlcXVlc3RIaWRlOiB0aGlzLmhpZGVcbiAgICAgIH1cbiAgICApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZCA9IFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbik7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICB7XG4gICAgICAgIG9uQ2xpY2s6IGNyZWF0ZUNoYWluZWRGdW5jdGlvbihjaGlsZC5wcm9wcy5vbkNsaWNrLCB0aGlzLnRvZ2dsZSlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RhbFRyaWdnZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIENvbGxhcHNhYmxlTWl4aW4gPSByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBkb21VdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMvZG9tVXRpbHMnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcblxuXG52YXIgTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIENvbGxhcHNhYmxlTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGJzU3R5bGU6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RhYnMnLCdwaWxscyddKSxcbiAgICBzdGFja2VkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBqdXN0aWZpZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBjb2xsYXBzYWJsZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZXhwYW5kZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5hdmJhcjogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ25hdidcbiAgICB9O1xuICB9LFxuXG4gIGdldENvbGxhcHNhYmxlRE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmdldERPTU5vZGUoKTtcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLnJlZnMudWwuZ2V0RE9NTm9kZSgpLFxuICAgICAgICBoZWlnaHQgPSBub2RlLm9mZnNldEhlaWdodCxcbiAgICAgICAgY29tcHV0ZWRTdHlsZXMgPSBkb21VdGlscy5nZXRDb21wdXRlZFN0eWxlcyhub2RlKTtcblxuICAgIHJldHVybiBoZWlnaHQgKyBwYXJzZUludChjb21wdXRlZFN0eWxlcy5tYXJnaW5Ub3AsIDEwKSArIHBhcnNlSW50KGNvbXB1dGVkU3R5bGVzLm1hcmdpbkJvdHRvbSwgMTApO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IHRoaXMuZ2V0Q29sbGFwc2FibGVDbGFzc1NldCgpIDoge307XG5cbiAgICBjbGFzc2VzWyduYXZiYXItY29sbGFwc2UnXSA9IHRoaXMucHJvcHMuY29sbGFwc2FibGU7XG5cbiAgICBpZiAodGhpcy5wcm9wcy5uYXZiYXIgJiYgIXRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyh0aGlzLnJlbmRlclVsKCkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5uYXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5yZW5kZXJVbCgpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJVbDogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG5cbiAgICBjbGFzc2VzWyduYXYtc3RhY2tlZCddID0gdGhpcy5wcm9wcy5zdGFja2VkO1xuICAgIGNsYXNzZXNbJ25hdi1qdXN0aWZpZWQnXSA9IHRoaXMucHJvcHMuanVzdGlmaWVkO1xuICAgIGNsYXNzZXNbJ25hdmJhci1uYXYnXSA9IHRoaXMucHJvcHMubmF2YmFyO1xuICAgIGNsYXNzZXNbJ3B1bGwtcmlnaHQnXSA9IHRoaXMucHJvcHMucHVsbFJpZ2h0O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgcmVmOlwidWxcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlck5hdkl0ZW0pXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBnZXRDaGlsZEFjdGl2ZVByb3A6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmVLZXkgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmtleSA9PT0gdGhpcy5wcm9wcy5hY3RpdmVLZXkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUhyZWYgIT0gbnVsbCkge1xuICAgICAgaWYgKGNoaWxkLnByb3BzLmhyZWYgPT09IHRoaXMucHJvcHMuYWN0aXZlSHJlZikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQucHJvcHMuYWN0aXZlO1xuICB9LFxuXG4gIHJlbmRlck5hdkl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBhY3RpdmU6IHRoaXMuZ2V0Q2hpbGRBY3RpdmVQcm9wKGNoaWxkKSxcbiAgICAgICAgYWN0aXZlS2V5OiB0aGlzLnByb3BzLmFjdGl2ZUtleSxcbiAgICAgICAgYWN0aXZlSHJlZjogdGhpcy5wcm9wcy5hY3RpdmVIcmVmLFxuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5LFxuICAgICAgICBuYXZJdGVtOiB0cnVlXG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG52YXIgTmF2SXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ05hdkl0ZW0nLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGlzYWJsZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGhyZWY6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgdGl0bGU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaHJlZjogJyMnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICdhY3RpdmUnOiB0aGlzLnByb3BzLmFjdGl2ZSxcbiAgICAgICdkaXNhYmxlZCc6IHRoaXMucHJvcHMuZGlzYWJsZWRcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmxpKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5hKFxuICAgICAgICAgIHtocmVmOnRoaXMucHJvcHMuaHJlZixcbiAgICAgICAgICB0aXRsZTp0aGlzLnByb3BzLnRpdGxlLFxuICAgICAgICAgIG9uQ2xpY2s6dGhpcy5oYW5kbGVDbGljayxcbiAgICAgICAgICByZWY6XCJhbmNob3JcIn0sIFxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlQ2xpY2s6IGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgaWYgKCF0aGlzLnByb3BzLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy5rZXksdGhpcy5wcm9wcy5ocmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdkl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIEN1c3RvbVByb3BUeXBlcyA9IHJlcXVpcmUoJy4vdXRpbHMvQ3VzdG9tUHJvcFR5cGVzJyk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xudmFyIGNyZWF0ZUNoYWluZWRGdW5jdGlvbiA9IHJlcXVpcmUoJy4vdXRpbHMvY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uJyk7XG52YXIgTmF2ID0gcmVxdWlyZSgnLi9OYXYnKTtcblxuXG52YXIgTmF2YmFyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnTmF2YmFyJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIGZpeGVkVG9wOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBmaXhlZEJvdHRvbTogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgc3RhdGljVG9wOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBpbnZlcnNlOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBmbHVpZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcm9sZTogUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBjb21wb25lbnRDbGFzczogQ3VzdG9tUHJvcFR5cGVzLmNvbXBvbmVudENsYXNzLFxuICAgIGJyYW5kOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICB0b2dnbGVCdXR0b246IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uVG9nZ2xlOiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBuYXZFeHBhbmRlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgZGVmYXVsdE5hdkV4cGFuZGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAnbmF2YmFyJyxcbiAgICAgIGJzU3R5bGU6ICdkZWZhdWx0JyxcbiAgICAgIHJvbGU6ICduYXZpZ2F0aW9uJyxcbiAgICAgIGNvbXBvbmVudENsYXNzOiBSZWFjdC5ET00ubmF2XG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmF2RXhwYW5kZWQ6IHRoaXMucHJvcHMuZGVmYXVsdE5hdkV4cGFuZGVkXG4gICAgfTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVUb2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblRvZ2dsZSkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uVG9nZ2xlKCk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBuYXZPcGVuOiAhdGhpcy5zdGF0ZS5uYXZPcGVuXG4gICAgfSk7XG4gIH0sXG5cbiAgaXNOYXZPcGVuOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMubmF2T3BlbiAhPSBudWxsID8gdGhpcy5wcm9wcy5uYXZPcGVuIDogdGhpcy5zdGF0ZS5uYXZPcGVuO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0gdGhpcy5nZXRCc0NsYXNzU2V0KCk7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIGNsYXNzZXNbJ25hdmJhci1maXhlZC10b3AnXSA9IHRoaXMucHJvcHMuZml4ZWRUb3A7XG4gICAgY2xhc3Nlc1snbmF2YmFyLWZpeGVkLWJvdHRvbSddID0gdGhpcy5wcm9wcy5maXhlZEJvdHRvbTtcbiAgICBjbGFzc2VzWyduYXZiYXItc3RhdGljLXRvcCddID0gdGhpcy5wcm9wcy5zdGF0aWNUb3A7XG4gICAgY2xhc3Nlc1snbmF2YmFyLWludmVyc2UnXSA9IHRoaXMucHJvcHMuaW52ZXJzZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpfSwgXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6dGhpcy5wcm9wcy5mbHVpZCA/ICdjb250YWluZXItZmx1aWQnIDogJ2NvbnRhaW5lcid9LCBcbiAgICAgICAgICAodGhpcy5wcm9wcy5icmFuZCB8fCB0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiB8fCB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSkgPyB0aGlzLnJlbmRlckhlYWRlcigpIDogbnVsbCxcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckNoaWxkKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJDaGlsZDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKGNoaWxkLCB7XG4gICAgICBuYXZiYXI6IHRydWUsXG4gICAgICBjb2xsYXBzYWJsZTogdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgIT0gbnVsbCAmJiB0aGlzLnByb3BzLnRvZ2dsZU5hdktleSA9PT0gY2hpbGQucHJvcHMua2V5LFxuICAgICAgZXhwYW5kZWQ6IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ICE9IG51bGwgJiYgdGhpcy5wcm9wcy50b2dnbGVOYXZLZXkgPT09IGNoaWxkLnByb3BzLmtleSAmJiB0aGlzLmlzTmF2T3BlbigpLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlckhlYWRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBicmFuZDtcblxuICAgIGlmICh0aGlzLnByb3BzLmJyYW5kKSB7XG4gICAgICBicmFuZCA9IFJlYWN0LmlzVmFsaWRDb21wb25lbnQodGhpcy5wcm9wcy5icmFuZCkgP1xuICAgICAgICBjbG9uZVdpdGhQcm9wcyh0aGlzLnByb3BzLmJyYW5kLCB7XG4gICAgICAgICAgY2xhc3NOYW1lOiAnbmF2YmFyLWJyYW5kJ1xuICAgICAgICB9KSA6IFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwibmF2YmFyLWJyYW5kXCJ9LCB0aGlzLnByb3BzLmJyYW5kKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcIm5hdmJhci1oZWFkZXJcIn0sIFxuICAgICAgICBicmFuZCxcbiAgICAgICAgKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uIHx8IHRoaXMucHJvcHMudG9nZ2xlTmF2S2V5ICE9IG51bGwpID8gdGhpcy5yZW5kZXJUb2dnbGVCdXR0b24oKSA6IG51bGxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclRvZ2dsZUJ1dHRvbjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjaGlsZHJlbjtcblxuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uKSkge1xuICAgICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ25hdmJhci10b2dnbGUnLFxuICAgICAgICBvbkNsaWNrOiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVUb2dnbGUsIHRoaXMucHJvcHMudG9nZ2xlQnV0dG9uLnByb3BzLm9uQ2xpY2spXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjaGlsZHJlbiA9ICh0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiAhPSBudWxsKSA/XG4gICAgICB0aGlzLnByb3BzLnRvZ2dsZUJ1dHRvbiA6IFtcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJzci1vbmx5XCIsIGtleTowfSwgXCJUb2dnbGUgbmF2aWdhdGlvblwiKSxcbiAgICAgICAgUmVhY3QuRE9NLnNwYW4oIHtjbGFzc05hbWU6XCJpY29uLWJhclwiLCBrZXk6MX0pLFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcImljb24tYmFyXCIsIGtleToyfSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiaWNvbi1iYXJcIiwga2V5OjN9KVxuICAgIF07XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmJ1dHRvbigge2NsYXNzTmFtZTpcIm5hdmJhci10b2dnbGVcIiwgdHlwZTpcImJ1dHRvblwiLCBvbkNsaWNrOnRoaXMuaGFuZGxlVG9nZ2xlfSwgXG4gICAgICAgIGNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF2YmFyO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb3BUeXBlczoge1xuICAgIGNvbnRhaW5lcjogQ3VzdG9tUHJvcFR5cGVzLm1vdW50YWJsZVxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb250YWluZXI6IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgPyBkb2N1bWVudC5ib2R5IDoge1xuICAgICAgICAvLyBJZiB3ZSBhcmUgaW4gYW4gZW52aXJvbm1lbnQgdGhhdCBkb2VzbnQgaGF2ZSBgZG9jdW1lbnRgIGRlZmluZWQgaXQgc2hvdWxkIGJlXG4gICAgICAgIC8vIHNhZmUgdG8gYXNzdW1lIHRoYXQgYGNvbXBvbmVudERpZE1vdW50YCB3aWxsIG5vdCBydW4gYW5kIHRoaXMgd2lsbCBiZSBuZWVkZWQsXG4gICAgICAgIC8vIGp1c3QgcHJvdmlkZSBlbm91Z2ggZmFrZSBBUEkgdG8gcGFzcyB0aGUgcHJvcFR5cGUgdmFsaWRhdGlvbi5cbiAgICAgICAgZ2V0RE9NTm9kZTogZnVuY3Rpb24gbm9vcCgpIHt9XG4gICAgICB9XG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3VucmVuZGVyT3ZlcmxheSgpO1xuICAgIGlmICh0aGlzLl9vdmVybGF5VGFyZ2V0KSB7XG4gICAgICB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKVxuICAgICAgICAucmVtb3ZlQ2hpbGQodGhpcy5fb3ZlcmxheVRhcmdldCk7XG4gICAgICB0aGlzLl9vdmVybGF5VGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVuZGVyT3ZlcmxheSgpO1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVuZGVyT3ZlcmxheSgpO1xuICB9LFxuXG4gIF9tb3VudE92ZXJsYXlUYXJnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9vdmVybGF5VGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5nZXRDb250YWluZXJET01Ob2RlKClcbiAgICAgIC5hcHBlbmRDaGlsZCh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgfSxcblxuICBfcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5fb3ZlcmxheVRhcmdldCkge1xuICAgICAgdGhpcy5fbW91bnRPdmVybGF5VGFyZ2V0KCk7XG4gICAgfVxuXG4gICAgLy8gU2F2ZSByZWZlcmVuY2UgdG8gaGVscCB0ZXN0aW5nXG4gICAgdGhpcy5fb3ZlcmxheUluc3RhbmNlID0gUmVhY3QucmVuZGVyQ29tcG9uZW50KHRoaXMucmVuZGVyT3ZlcmxheSgpLCB0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgfSxcblxuICBfdW5yZW5kZXJPdmVybGF5OiBmdW5jdGlvbiAoKSB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9vdmVybGF5VGFyZ2V0KTtcbiAgICB0aGlzLl9vdmVybGF5SW5zdGFuY2UgPSBudWxsO1xuICB9LFxuXG4gIGdldE92ZXJsYXlET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldE92ZXJsYXlET01Ob2RlKCk6IEEgY29tcG9uZW50IG11c3QgYmUgbW91bnRlZCB0byBoYXZlIGEgRE9NIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX292ZXJsYXlJbnN0YW5jZS5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgZ2V0Q29udGFpbmVyRE9NTm9kZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmNvbnRhaW5lci5nZXRET01Ob2RlID9cbiAgICAgIHRoaXMucHJvcHMuY29udGFpbmVyLmdldERPTU5vZGUoKSA6IHRoaXMucHJvcHMuY29udGFpbmVyO1xuICB9XG59O1xuIiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIE92ZXJsYXlNaXhpbiA9IHJlcXVpcmUoJy4vT3ZlcmxheU1peGluJyk7XG52YXIgZG9tVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzL2RvbVV0aWxzJyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBtZXJnZSA9IHJlcXVpcmUoJy4vdXRpbHMvbWVyZ2UnKTtcblxuLyoqXG4gKiBDaGVjayBpZiB2YWx1ZSBvbmUgaXMgaW5zaWRlIG9yIGVxdWFsIHRvIHRoZSBvZiB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBvbmVcbiAqIEBwYXJhbSB7c3RyaW5nfGFycmF5fSBvZlxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzT25lT2Yob25lLCBvZikge1xuICBpZiAoQXJyYXkuaXNBcnJheShvZikpIHtcbiAgICByZXR1cm4gb2YuaW5kZXhPZihvbmUpID49IDA7XG4gIH1cbiAgcmV0dXJuIG9uZSA9PT0gb2Y7XG59XG5cbnZhciBPdmVybGF5VHJpZ2dlciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ092ZXJsYXlUcmlnZ2VyJyxcbiAgbWl4aW5zOiBbT3ZlcmxheU1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICB0cmlnZ2VyOiBSZWFjdC5Qcm9wVHlwZXMub25lT2ZUeXBlKFtcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ21hbnVhbCcsICdjbGljaycsICdob3ZlcicsICdmb2N1cyddKSxcbiAgICAgIFJlYWN0LlByb3BUeXBlcy5hcnJheU9mKFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ2NsaWNrJywgJ2hvdmVyJywgJ2ZvY3VzJ10pKVxuICAgIF0pLFxuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgZGVsYXk6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgZGVsYXlTaG93OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGRlbGF5SGlkZTogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBkZWZhdWx0T3ZlcmxheVNob3duOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBvdmVybGF5OiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZS5pc1JlcXVpcmVkXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsYWNlbWVudDogJ3JpZ2h0JyxcbiAgICAgIHRyaWdnZXI6IFsnaG92ZXInLCAnZm9jdXMnXVxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlzT3ZlcmxheVNob3duOiB0aGlzLnByb3BzLmRlZmF1bHRPdmVybGF5U2hvd24gPT0gbnVsbCA/XG4gICAgICAgIGZhbHNlIDogdGhpcy5wcm9wcy5kZWZhdWx0T3ZlcmxheVNob3duLFxuICAgICAgb3ZlcmxheUxlZnQ6IG51bGwsXG4gICAgICBvdmVybGF5VG9wOiBudWxsXG4gICAgfTtcbiAgfSxcblxuICBzaG93OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogdHJ1ZVxuICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy51cGRhdGVPdmVybGF5UG9zaXRpb24oKTtcbiAgICB9KTtcbiAgfSxcblxuICBoaWRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpc092ZXJsYXlTaG93bjogZmFsc2VcbiAgICB9KTtcbiAgfSxcblxuICB0b2dnbGU6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnN0YXRlLmlzT3ZlcmxheVNob3duID9cbiAgICAgIHRoaXMuaGlkZSgpIDogdGhpcy5zaG93KCk7XG4gIH0sXG5cbiAgcmVuZGVyT3ZlcmxheTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5zdGF0ZS5pc092ZXJsYXlTaG93bikge1xuICAgICAgcmV0dXJuIFJlYWN0LkRPTS5zcGFuKG51bGwgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICB0aGlzLnByb3BzLm92ZXJsYXksXG4gICAgICB7XG4gICAgICAgIG9uUmVxdWVzdEhpZGU6IHRoaXMuaGlkZSxcbiAgICAgICAgcGxhY2VtZW50OiB0aGlzLnByb3BzLnBsYWNlbWVudCxcbiAgICAgICAgcG9zaXRpb25MZWZ0OiB0aGlzLnN0YXRlLm92ZXJsYXlMZWZ0LFxuICAgICAgICBwb3NpdGlvblRvcDogdGhpcy5zdGF0ZS5vdmVybGF5VG9wXG4gICAgICB9XG4gICAgKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJvcHMgPSB7fTtcblxuICAgIGlmIChpc09uZU9mKCdjbGljaycsIHRoaXMucHJvcHMudHJpZ2dlcikpIHtcbiAgICAgIHByb3BzLm9uQ2xpY2sgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy50b2dnbGUsIHRoaXMucHJvcHMub25DbGljayk7XG4gICAgfVxuXG4gICAgaWYgKGlzT25lT2YoJ2hvdmVyJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25Nb3VzZU92ZXIgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb24odGhpcy5oYW5kbGVEZWxheWVkU2hvdywgdGhpcy5wcm9wcy5vbk1vdXNlT3Zlcik7XG4gICAgICBwcm9wcy5vbk1vdXNlT3V0ID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZEhpZGUsIHRoaXMucHJvcHMub25Nb3VzZU91dCk7XG4gICAgfVxuXG4gICAgaWYgKGlzT25lT2YoJ2ZvY3VzJywgdGhpcy5wcm9wcy50cmlnZ2VyKSkge1xuICAgICAgcHJvcHMub25Gb2N1cyA9IGNyZWF0ZUNoYWluZWRGdW5jdGlvbih0aGlzLmhhbmRsZURlbGF5ZWRTaG93LCB0aGlzLnByb3BzLm9uRm9jdXMpO1xuICAgICAgcHJvcHMub25CbHVyID0gY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKHRoaXMuaGFuZGxlRGVsYXllZEhpZGUsIHRoaXMucHJvcHMub25CbHVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBSZWFjdC5DaGlsZHJlbi5vbmx5KHRoaXMucHJvcHMuY2hpbGRyZW4pLFxuICAgICAgcHJvcHNcbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5faG92ZXJEZWxheSk7XG4gIH0sXG5cbiAgaGFuZGxlRGVsYXllZFNob3c6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faG92ZXJEZWxheSAhPSBudWxsKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5faG92ZXJEZWxheSk7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGVsYXkgPSB0aGlzLnByb3BzLmRlbGF5U2hvdyAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMuZGVsYXlTaG93IDogdGhpcy5wcm9wcy5kZWxheTtcblxuICAgIGlmICghZGVsYXkpIHtcbiAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5faG92ZXJEZWxheSA9IG51bGw7XG4gICAgICB0aGlzLnNob3coKTtcbiAgICB9LmJpbmQodGhpcyksIGRlbGF5KTtcbiAgfSxcblxuICBoYW5kbGVEZWxheWVkSGlkZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9ob3ZlckRlbGF5ICE9IG51bGwpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ob3ZlckRlbGF5KTtcbiAgICAgIHRoaXMuX2hvdmVyRGVsYXkgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkZWxheSA9IHRoaXMucHJvcHMuZGVsYXlIaWRlICE9IG51bGwgP1xuICAgICAgdGhpcy5wcm9wcy5kZWxheUhpZGUgOiB0aGlzLnByb3BzLmRlbGF5O1xuXG4gICAgaWYgKCFkZWxheSkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5faG92ZXJEZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9ob3ZlckRlbGF5ID0gbnVsbDtcbiAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0uYmluZCh0aGlzKSwgZGVsYXkpO1xuICB9LFxuXG4gIHVwZGF0ZU92ZXJsYXlQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBwb3MgPSB0aGlzLmNhbGNPdmVybGF5UG9zaXRpb24oKTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgb3ZlcmxheUxlZnQ6IHBvcy5sZWZ0LFxuICAgICAgb3ZlcmxheVRvcDogcG9zLnRvcFxuICAgIH0pO1xuICB9LFxuXG4gIGNhbGNPdmVybGF5UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2hpbGRPZmZzZXQgPSB0aGlzLmdldFBvc2l0aW9uKCk7XG5cbiAgICB2YXIgb3ZlcmxheU5vZGUgPSB0aGlzLmdldE92ZXJsYXlET01Ob2RlKCk7XG4gICAgdmFyIG92ZXJsYXlIZWlnaHQgPSBvdmVybGF5Tm9kZS5vZmZzZXRIZWlnaHQ7XG4gICAgdmFyIG92ZXJsYXlXaWR0aCA9IG92ZXJsYXlOb2RlLm9mZnNldFdpZHRoO1xuXG4gICAgc3dpdGNoICh0aGlzLnByb3BzLnBsYWNlbWVudCkge1xuICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogY2hpbGRPZmZzZXQudG9wICsgY2hpbGRPZmZzZXQuaGVpZ2h0IC8gMiAtIG92ZXJsYXlIZWlnaHQgLyAyLFxuICAgICAgICAgIGxlZnQ6IGNoaWxkT2Zmc2V0LmxlZnQgKyBjaGlsZE9mZnNldC53aWR0aFxuICAgICAgICB9O1xuICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQgLyAyIC0gb3ZlcmxheUhlaWdodCAvIDIsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCAtIG92ZXJsYXlXaWR0aFxuICAgICAgICB9O1xuICAgICAgY2FzZSAndG9wJzpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IGNoaWxkT2Zmc2V0LnRvcCAtIG92ZXJsYXlIZWlnaHQsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoIC8gMiAtIG92ZXJsYXlXaWR0aCAvIDJcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdG9wOiBjaGlsZE9mZnNldC50b3AgKyBjaGlsZE9mZnNldC5oZWlnaHQsXG4gICAgICAgICAgbGVmdDogY2hpbGRPZmZzZXQubGVmdCArIGNoaWxkT2Zmc2V0LndpZHRoIC8gMiAtIG92ZXJsYXlXaWR0aCAvIDJcbiAgICAgICAgfTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsY092ZXJsYXlQb3NpdGlvbigpOiBObyBzdWNoIHBsYWNlbWVudCBvZiBcIicgKyB0aGlzLnByb3BzLnBsYWNlbWVudCArICdcIiBmb3VuZC4nKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0RE9NTm9kZSgpO1xuICAgIHZhciBjb250YWluZXIgPSB0aGlzLmdldENvbnRhaW5lckRPTU5vZGUoKTtcblxuICAgIHZhciBvZmZzZXQgPSBjb250YWluZXIudGFnTmFtZSA9PSAnQk9EWScgP1xuICAgICAgZG9tVXRpbHMuZ2V0T2Zmc2V0KG5vZGUpIDogZG9tVXRpbHMuZ2V0UG9zaXRpb24obm9kZSwgY29udGFpbmVyKTtcblxuICAgIHJldHVybiBtZXJnZShvZmZzZXQsIHtcbiAgICAgIGhlaWdodDogbm9kZS5vZmZzZXRIZWlnaHQsXG4gICAgICB3aWR0aDogbm9kZS5vZmZzZXRXaWR0aFxuICAgIH0pO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBPdmVybGF5VHJpZ2dlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbnZhciBQYWdlSGVhZGVyID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFnZUhlYWRlcicsXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInBhZ2UtaGVhZGVyXCJ9LCBcbiAgICAgICAgUmVhY3QuRE9NLmgxKG51bGwsIHRoaXMucHJvcHMuY2hpbGRyZW4pXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZUhlYWRlcjsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBQYWdlSXRlbSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhZ2VJdGVtJyxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBkaXNhYmxlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgcHJldmlvdXM6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG5leHQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBocmVmOiAnIydcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBjbGFzc2VzID0ge1xuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZCxcbiAgICAgICdwcmV2aW91cyc6IHRoaXMucHJvcHMucHJldmlvdXMsXG4gICAgICAnbmV4dCc6IHRoaXMucHJvcHMubmV4dFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoXG4gICAgICAgIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZVNlbGVjdCxcbiAgICAgICAgICByZWY6XCJhbmNob3JcIn0sIFxuICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoZSkge1xuICAgIGlmICh0aGlzLnByb3BzLm9uU2VsZWN0KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGlmICghdGhpcy5wcm9wcy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5LCB0aGlzLnByb3BzLmhyZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZUl0ZW07IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBjcmVhdGVDaGFpbmVkRnVuY3Rpb24gPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZUNoYWluZWRGdW5jdGlvbicpO1xuXG52YXIgUGFnZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQYWdlcicsXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLnVsKFxuICAgICAgICB7Y2xhc3NOYW1lOlwicGFnZXJcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlclBhZ2VJdGVtKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyUGFnZUl0ZW06IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgIGNoaWxkLFxuICAgICAge1xuICAgICAgICBvblNlbGVjdDogY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uKGNoaWxkLnByb3BzLm9uU2VsZWN0LCB0aGlzLnByb3BzLm9uU2VsZWN0KSxcbiAgICAgICAgcmVmOiBjaGlsZC5wcm9wcy5yZWYsXG4gICAgICAgIGtleTogY2hpbGQucHJvcHMua2V5XG4gICAgICB9XG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFnZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIENvbGxhcHNhYmxlTWl4aW4gPSByZXF1aXJlKCcuL0NvbGxhcHNhYmxlTWl4aW4nKTtcblxudmFyIFBhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUGFuZWwnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbiwgQ29sbGFwc2FibGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgaGVhZGVyOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBmb290ZXI6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlLFxuICAgIG9uQ2xpY2s6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwYW5lbCcsXG4gICAgICBic1N0eWxlOiAnZGVmYXVsdCdcbiAgICB9O1xuICB9LFxuXG4gIGhhbmRsZVNlbGVjdDogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMua2V5KTtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGV4cGFuZGVkOiAhdGhpcy5zdGF0ZS5leHBhbmRlZFxuICAgIH0pO1xuICB9LFxuXG4gIHNob3VsZENvbXBvbmVudFVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBnZXRDb2xsYXBzYWJsZURpbWVuc2lvblZhbHVlOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVmcy5ib2R5LmdldERPTU5vZGUoKS5vZmZzZXRIZWlnaHQ7XG4gIH0sXG5cbiAgZ2V0Q29sbGFwc2FibGVET01Ob2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCF0aGlzLmlzTW91bnRlZCgpIHx8ICF0aGlzLnJlZnMgfHwgIXRoaXMucmVmcy5wYW5lbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVmcy5wYW5lbC5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB0aGlzLmdldEJzQ2xhc3NTZXQoKTtcbiAgICBjbGFzc2VzWydwYW5lbCddID0gdHJ1ZTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3NlcyksIGlkOnRoaXMucHJvcHMuY29sbGFwc2FibGUgPyBudWxsIDogdGhpcy5wcm9wcy5pZH0sIFxuICAgICAgICB0aGlzLnJlbmRlckhlYWRpbmcoKSxcbiAgICAgICAgdGhpcy5wcm9wcy5jb2xsYXBzYWJsZSA/IHRoaXMucmVuZGVyQ29sbGFwc2FibGVCb2R5KCkgOiB0aGlzLnJlbmRlckJvZHkoKSxcbiAgICAgICAgdGhpcy5yZW5kZXJGb290ZXIoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29sbGFwc2FibGVCb2R5OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRDb2xsYXBzYWJsZUNsYXNzU2V0KCdwYW5lbC1jb2xsYXBzZScpKSwgaWQ6dGhpcy5wcm9wcy5pZCwgcmVmOlwicGFuZWxcIn0sIFxuICAgICAgICB0aGlzLnJlbmRlckJvZHkoKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQm9keTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtYm9keVwiLCByZWY6XCJib2R5XCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVySGVhZGluZzogZnVuY3Rpb24gKCkge1xuICAgIHZhciBoZWFkZXIgPSB0aGlzLnByb3BzLmhlYWRlcjtcblxuICAgIGlmICghaGVhZGVyKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIVJlYWN0LmlzVmFsaWRDb21wb25lbnQoaGVhZGVyKSB8fCBBcnJheS5pc0FycmF5KGhlYWRlcikpIHtcbiAgICAgIGhlYWRlciA9IHRoaXMucHJvcHMuY29sbGFwc2FibGUgP1xuICAgICAgICB0aGlzLnJlbmRlckNvbGxhcHNhYmxlVGl0bGUoaGVhZGVyKSA6IGhlYWRlcjtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuY29sbGFwc2FibGUpIHtcbiAgICAgIGhlYWRlciA9IGNsb25lV2l0aFByb3BzKGhlYWRlciwge1xuICAgICAgICBjbGFzc05hbWU6ICdwYW5lbC10aXRsZScsXG4gICAgICAgIGNoaWxkcmVuOiB0aGlzLnJlbmRlckFuY2hvcihoZWFkZXIucHJvcHMuY2hpbGRyZW4pXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVhZGVyID0gY2xvbmVXaXRoUHJvcHMoaGVhZGVyLCB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhbmVsLXRpdGxlJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJwYW5lbC1oZWFkaW5nXCJ9LCBcbiAgICAgICAgaGVhZGVyXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJBbmNob3I6IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgIHtocmVmOicjJyArICh0aGlzLnByb3BzLmlkIHx8ICcnKSxcbiAgICAgICAgY2xhc3NOYW1lOnRoaXMuaXNFeHBhbmRlZCgpID8gbnVsbCA6ICdjb2xsYXBzZWQnLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlU2VsZWN0fSwgXG4gICAgICAgIGhlYWRlclxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyQ29sbGFwc2FibGVUaXRsZTogZnVuY3Rpb24gKGhlYWRlcikge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uaDQoIHtjbGFzc05hbWU6XCJwYW5lbC10aXRsZVwifSwgXG4gICAgICAgIHRoaXMucmVuZGVyQW5jaG9yKGhlYWRlcilcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckZvb3RlcjogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5wcm9wcy5mb290ZXIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicGFuZWwtZm9vdGVyXCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5mb290ZXJcbiAgICAgIClcbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYW5lbDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgY2xvbmVXaXRoUHJvcHMgPSByZXF1aXJlKCcuL3V0aWxzL2Nsb25lV2l0aFByb3BzJyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgVmFsaWRDb21wb25lbnRDaGlsZHJlbiA9IHJlcXVpcmUoJy4vdXRpbHMvVmFsaWRDb21wb25lbnRDaGlsZHJlbicpO1xuXG52YXIgUGFuZWxHcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1BhbmVsR3JvdXAnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgY29sbGFwc2FibGU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFjdGl2ZUtleTogUmVhY3QuUHJvcFR5cGVzLmFueSxcbiAgICBkZWZhdWx0QWN0aXZlS2V5OiBSZWFjdC5Qcm9wVHlwZXMuYW55LFxuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuY1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBic0NsYXNzOiAncGFuZWwtZ3JvdXAnXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZUtleSA9IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleTtcblxuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVLZXk6IGRlZmF1bHRBY3RpdmVLZXlcbiAgICB9O1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQodGhpcy5nZXRCc0NsYXNzU2V0KCkpfSwgXG4gICAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4ubWFwKHRoaXMucHJvcHMuY2hpbGRyZW4sIHRoaXMucmVuZGVyUGFuZWwpXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJQYW5lbDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgdmFyIGFjdGl2ZUtleSA9XG4gICAgICB0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVLZXkgOiB0aGlzLnN0YXRlLmFjdGl2ZUtleTtcblxuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIGJzU3R5bGU6IGNoaWxkLnByb3BzLmJzU3R5bGUgfHwgdGhpcy5wcm9wcy5ic1N0eWxlLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY2NvcmRpb24pIHtcbiAgICAgIHByb3BzLmNvbGxhcHNhYmxlID0gdHJ1ZTtcbiAgICAgIHByb3BzLmV4cGFuZGVkID0gKGNoaWxkLnByb3BzLmtleSA9PT0gYWN0aXZlS2V5KTtcbiAgICAgIHByb3BzLm9uU2VsZWN0ID0gdGhpcy5oYW5kbGVTZWxlY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKFxuICAgICAgY2hpbGQsXG4gICAgICBwcm9wc1xuICAgICk7XG4gIH0sXG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAvLyBEZWZlciBhbnkgdXBkYXRlcyB0byB0aGlzIGNvbXBvbmVudCBkdXJpbmcgdGhlIGBvblNlbGVjdGAgaGFuZGxlci5cbiAgICByZXR1cm4gIXRoaXMuX2lzQ2hhbmdpbmc7XG4gIH0sXG5cbiAgaGFuZGxlU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMuX2lzQ2hhbmdpbmcgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdChrZXkpO1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0YXRlLmFjdGl2ZUtleSA9PT0ga2V5KSB7XG4gICAgICBrZXkgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgYWN0aXZlS2V5OiBrZXlcbiAgICB9KTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFuZWxHcm91cDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cblxudmFyIFBvcG92ZXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQb3BvdmVyJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHBsYWNlbWVudDogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndG9wJywncmlnaHQnLCAnYm90dG9tJywgJ2xlZnQnXSksXG4gICAgcG9zaXRpb25MZWZ0OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIHBvc2l0aW9uVG9wOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGFycm93T2Zmc2V0TGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldFRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICB0aXRsZTogUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGVcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuICAgIGNsYXNzZXNbJ3BvcG92ZXInXSA9IHRydWU7XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLnBsYWNlbWVudF0gPSB0cnVlO1xuICAgIGNsYXNzZXNbJ2luJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdCAhPSBudWxsIHx8IHRoaXMucHJvcHMucG9zaXRpb25Ub3AgIT0gbnVsbDtcblxuICAgIHZhciBzdHlsZSA9IHt9O1xuICAgIHN0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdDtcbiAgICBzdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uVG9wO1xuICAgIHN0eWxlWydkaXNwbGF5J10gPSAnYmxvY2snO1xuXG4gICAgdmFyIGFycm93U3R5bGUgPSB7fTtcbiAgICBhcnJvd1N0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0TGVmdDtcbiAgICBhcnJvd1N0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRUb3A7XG5cbiAgICByZXR1cm4gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKSwgc3R5bGU6c3R5bGV9LCBcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcImFycm93XCIsIHN0eWxlOmFycm93U3R5bGV9ICksXG4gICAgICAgIHRoaXMucHJvcHMudGl0bGUgPyB0aGlzLnJlbmRlclRpdGxlKCkgOiBudWxsLFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwicG9wb3Zlci1jb250ZW50XCJ9LCBcbiAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH0sXG5cbiAgcmVuZGVyVGl0bGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uaDMoIHtjbGFzc05hbWU6XCJwb3BvdmVyLXRpdGxlXCJ9LCB0aGlzLnByb3BzLnRpdGxlKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvcG92ZXI7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEludGVycG9sYXRlID0gcmVxdWlyZSgnLi9JbnRlcnBvbGF0ZScpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcblxuXG52YXIgUHJvZ3Jlc3NCYXIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdQcm9ncmVzc0JhcicsXG4gIHByb3BUeXBlczoge1xuICAgIG1pbjogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBub3c6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgbWF4OiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxuICAgIGxhYmVsOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBzck9ubHk6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHN0cmlwZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGFjdGl2ZTogUmVhY3QuUHJvcFR5cGVzLmJvb2xcbiAgfSxcblxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICdwcm9ncmVzcy1iYXInLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiAxMDBcbiAgICB9O1xuICB9LFxuXG4gIGdldFBlcmNlbnRhZ2U6IGZ1bmN0aW9uIChub3csIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgobm93IC0gbWluKSAvIChtYXggLSBtaW4pICogMTAwKTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICAgcHJvZ3Jlc3M6IHRydWVcbiAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIGNsYXNzZXNbJ3Byb2dyZXNzLXN0cmlwZWQnXSA9IHRydWU7XG4gICAgICBjbGFzc2VzWydhY3RpdmUnXSA9IHRydWU7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLnN0cmlwZWQpIHtcbiAgICAgIGNsYXNzZXNbJ3Byb2dyZXNzLXN0cmlwZWQnXSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFWYWxpZENvbXBvbmVudENoaWxkcmVuLmhhc1ZhbGlkQ29tcG9uZW50KHRoaXMucHJvcHMuY2hpbGRyZW4pKSB7XG4gICAgICBpZiAoIXRoaXMucHJvcHMuaXNDaGlsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICAgICAgdGhpcy5yZW5kZXJQcm9ncmVzc0JhcigpXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgICAgIHRoaXMucmVuZGVyUHJvZ3Jlc3NCYXIoKVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlckNoaWxkQmFyKVxuICAgICAgICApXG4gICAgICApO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXJDaGlsZEJhcjogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIGNsb25lV2l0aFByb3BzKGNoaWxkLCB7XG4gICAgICBpc0NoaWxkOiB0cnVlLFxuICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXksXG4gICAgICByZWY6IGNoaWxkLnByb3BzLnJlZlxuICAgIH0pO1xuICB9LFxuXG4gIHJlbmRlclByb2dyZXNzQmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBlcmNlbnRhZ2UgPSB0aGlzLmdldFBlcmNlbnRhZ2UoXG4gICAgICAgIHRoaXMucHJvcHMubm93LFxuICAgICAgICB0aGlzLnByb3BzLm1pbixcbiAgICAgICAgdGhpcy5wcm9wcy5tYXhcbiAgICAgICk7XG5cbiAgICB2YXIgbGFiZWw7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMucHJvcHMubGFiZWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5yZW5kZXJMYWJlbChwZXJjZW50YWdlKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMubGFiZWwpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wcm9wcy5sYWJlbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wcm9wcy5zck9ubHkpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5yZW5kZXJTY3JlZW5SZWFkZXJPbmx5TGFiZWwobGFiZWwpO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KHRoaXMuZ2V0QnNDbGFzc1NldCgpKSwgcm9sZTpcInByb2dyZXNzYmFyXCIsXG4gICAgICAgIHN0eWxlOnt3aWR0aDogcGVyY2VudGFnZSArICclJ30sXG4gICAgICAgICdhcmlhLXZhbHVlbm93Jzp0aGlzLnByb3BzLm5vdyxcbiAgICAgICAgJ2FyaWEtdmFsdWVtaW4nOnRoaXMucHJvcHMubWluLFxuICAgICAgICAnYXJpYS12YWx1ZW1heCc6dGhpcy5wcm9wcy5tYXh9LCBcbiAgICAgICAgbGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlckxhYmVsOiBmdW5jdGlvbiAocGVyY2VudGFnZSkge1xuICAgIHZhciBJbnRlcnBvbGF0ZUNsYXNzID0gdGhpcy5wcm9wcy5pbnRlcnBvbGF0ZUNsYXNzIHx8IEludGVycG9sYXRlO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIEludGVycG9sYXRlQ2xhc3MoXG4gICAgICAgIHtub3c6dGhpcy5wcm9wcy5ub3csXG4gICAgICAgIG1pbjp0aGlzLnByb3BzLm1pbixcbiAgICAgICAgbWF4OnRoaXMucHJvcHMubWF4LFxuICAgICAgICBwZXJjZW50OnBlcmNlbnRhZ2UsXG4gICAgICAgIGJzU3R5bGU6dGhpcy5wcm9wcy5ic1N0eWxlfSwgXG4gICAgICAgIHRoaXMucHJvcHMubGFiZWxcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIHJlbmRlclNjcmVlblJlYWRlck9ubHlMYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwic3Itb25seVwifSwgXG4gICAgICAgIGxhYmVsXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvZ3Jlc3NCYXI7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgQ3VzdG9tUHJvcFR5cGVzID0gcmVxdWlyZSgnLi91dGlscy9DdXN0b21Qcm9wVHlwZXMnKTtcblxuXG52YXIgUm93ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnUm93JyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgY29tcG9uZW50Q2xhc3M6IEN1c3RvbVByb3BUeXBlcy5jb21wb25lbnRDbGFzc1xuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb21wb25lbnRDbGFzczogUmVhY3QuRE9NLmRpdlxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNvbXBvbmVudENsYXNzID0gdGhpcy5wcm9wcy5jb21wb25lbnRDbGFzcztcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIGNvbXBvbmVudENsYXNzKCB7Y2xhc3NOYW1lOlwicm93XCJ9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdzsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG52YXIgRHJvcGRvd25TdGF0ZU1peGluID0gcmVxdWlyZSgnLi9Ecm9wZG93blN0YXRlTWl4aW4nKTtcbnZhciBCdXR0b24gPSByZXF1aXJlKCcuL0J1dHRvbicpO1xudmFyIEJ1dHRvbkdyb3VwID0gcmVxdWlyZSgnLi9CdXR0b25Hcm91cCcpO1xudmFyIERyb3Bkb3duTWVudSA9IHJlcXVpcmUoJy4vRHJvcGRvd25NZW51Jyk7XG5cbnZhciBTcGxpdEJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1NwbGl0QnV0dG9uJyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW4sIERyb3Bkb3duU3RhdGVNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgcHVsbFJpZ2h0OiAgICAgUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgdGl0bGU6ICAgICAgICAgUmVhY3QuUHJvcFR5cGVzLnJlbmRlcmFibGUsXG4gICAgaHJlZjogICAgICAgICAgUmVhY3QuUHJvcFR5cGVzLnN0cmluZyxcbiAgICBkcm9wZG93blRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMucmVuZGVyYWJsZSxcbiAgICBvbkNsaWNrOiAgICAgICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBvblNlbGVjdDogICAgICBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBkaXNhYmxlZDogICAgICBSZWFjdC5Qcm9wVHlwZXMuYm9vbFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBkcm9wZG93blRpdGxlOiAnVG9nZ2xlIGRyb3Bkb3duJ1xuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGdyb3VwQ2xhc3NlcyA9IHtcbiAgICAgICAgJ29wZW4nOiB0aGlzLnN0YXRlLm9wZW4sXG4gICAgICAgICdkcm9wdXAnOiB0aGlzLnByb3BzLmRyb3B1cFxuICAgICAgfTtcblxuICAgIHZhciBidXR0b24gPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIEJ1dHRvbihcbiAgICAgICAge3JlZjpcImJ1dHRvblwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlQnV0dG9uQ2xpY2ssXG4gICAgICAgIHRpdGxlOm51bGwsXG4gICAgICAgIGlkOm51bGx9LCBcbiAgICAgICAgdGhpcy5wcm9wcy50aXRsZVxuICAgICAgKVxuICAgICk7XG5cbiAgICB2YXIgZHJvcGRvd25CdXR0b24gPSB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIEJ1dHRvbihcbiAgICAgICAge3JlZjpcImRyb3Bkb3duQnV0dG9uXCIsXG4gICAgICAgIGNsYXNzTmFtZTpcImRyb3Bkb3duLXRvZ2dsZVwiLFxuICAgICAgICBvbkNsaWNrOnRoaXMuaGFuZGxlRHJvcGRvd25DbGljayxcbiAgICAgICAgdGl0bGU6bnVsbCxcbiAgICAgICAgaWQ6bnVsbH0sIFxuICAgICAgICBSZWFjdC5ET00uc3Bhbigge2NsYXNzTmFtZTpcInNyLW9ubHlcIn0sIHRoaXMucHJvcHMuZHJvcGRvd25UaXRsZSksXG4gICAgICAgIFJlYWN0LkRPTS5zcGFuKCB7Y2xhc3NOYW1lOlwiY2FyZXRcIn0gKVxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgQnV0dG9uR3JvdXAoXG4gICAgICAgIHtic1NpemU6dGhpcy5wcm9wcy5ic1NpemUsXG4gICAgICAgIGNsYXNzTmFtZTpjbGFzc1NldChncm91cENsYXNzZXMpLFxuICAgICAgICBpZDp0aGlzLnByb3BzLmlkfSwgXG4gICAgICAgIGJ1dHRvbixcbiAgICAgICAgZHJvcGRvd25CdXR0b24sXG4gICAgICAgIERyb3Bkb3duTWVudShcbiAgICAgICAgICB7cmVmOlwibWVudVwiLFxuICAgICAgICAgIG9uU2VsZWN0OnRoaXMuaGFuZGxlT3B0aW9uU2VsZWN0LFxuICAgICAgICAgICdhcmlhLWxhYmVsbGVkYnknOnRoaXMucHJvcHMuaWQsXG4gICAgICAgICAgcHVsbFJpZ2h0OnRoaXMucHJvcHMucHVsbFJpZ2h0fSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBoYW5kbGVCdXR0b25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5vcGVuKSB7XG4gICAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLm9uQ2xpY2spIHtcbiAgICAgIHRoaXMucHJvcHMub25DbGljayhlKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlRHJvcGRvd25DbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoIXRoaXMuc3RhdGUub3Blbik7XG4gIH0sXG5cbiAgaGFuZGxlT3B0aW9uU2VsZWN0OiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgaWYgKHRoaXMucHJvcHMub25TZWxlY3QpIHtcbiAgICAgIHRoaXMucHJvcHMub25TZWxlY3Qoa2V5KTtcbiAgICB9XG5cbiAgICB0aGlzLnNldERyb3Bkb3duU3RhdGUoZmFsc2UpO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcGxpdEJ1dHRvbjtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xuXG52YXIgUmVhY3QgPSAod2luZG93LlJlYWN0IHx8IFJlYWN0KTtcbnZhciBjbGFzc1NldCA9IHJlcXVpcmUoJy4vdXRpbHMvY2xhc3NTZXQnKTtcbnZhciBjbG9uZVdpdGhQcm9wcyA9IHJlcXVpcmUoJy4vdXRpbHMvY2xvbmVXaXRoUHJvcHMnKTtcbnZhciBWYWxpZENvbXBvbmVudENoaWxkcmVuID0gcmVxdWlyZSgnLi91dGlscy9WYWxpZENvbXBvbmVudENoaWxkcmVuJyk7XG52YXIgY3JlYXRlQ2hhaW5lZEZ1bmN0aW9uID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGVDaGFpbmVkRnVuY3Rpb24nKTtcbnZhciBCb290c3RyYXBNaXhpbiA9IHJlcXVpcmUoJy4vQm9vdHN0cmFwTWl4aW4nKTtcblxuXG52YXIgU3ViTmF2ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnU3ViTmF2JyxcbiAgbWl4aW5zOiBbQm9vdHN0cmFwTWl4aW5dLFxuXG4gIHByb3BUeXBlczoge1xuICAgIG9uU2VsZWN0OiBSZWFjdC5Qcm9wVHlwZXMuZnVuYyxcbiAgICBhY3RpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGRpc2FibGVkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICBocmVmOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRpdGxlOiBSZWFjdC5Qcm9wVHlwZXMuc3RyaW5nLFxuICAgIHRleHQ6IFJlYWN0LlByb3BUeXBlcy5yZW5kZXJhYmxlXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzQ2xhc3M6ICduYXYnXG4gICAgfTtcbiAgfSxcblxuICBoYW5kbGVDbGljazogZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBpZiAoIXRoaXMucHJvcHMuZGlzYWJsZWQpIHtcbiAgICAgICAgdGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLmtleSwgdGhpcy5wcm9wcy5ocmVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgaXNBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0NoaWxkQWN0aXZlKHRoaXMpO1xuICB9LFxuXG4gIGlzQ2hpbGRBY3RpdmU6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChjaGlsZC5wcm9wcy5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsICYmIHRoaXMucHJvcHMuYWN0aXZlS2V5ID09PSBjaGlsZC5wcm9wcy5rZXkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUhyZWYgIT0gbnVsbCAmJiB0aGlzLnByb3BzLmFjdGl2ZUhyZWYgPT09IGNoaWxkLnByb3BzLmhyZWYpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjaGlsZC5wcm9wcy5jaGlsZHJlbikge1xuICAgICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICAgIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4uZm9yRWFjaChcbiAgICAgICAgY2hpbGQucHJvcHMuY2hpbGRyZW4sXG4gICAgICAgIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICAgIGlmICh0aGlzLmlzQ2hpbGRBY3RpdmUoY2hpbGQpKSB7XG4gICAgICAgICAgICBpc0FjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0aGlzXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gaXNBY3RpdmU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuXG4gIGdldENoaWxkQWN0aXZlUHJvcDogZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKGNoaWxkLnByb3BzLmFjdGl2ZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnByb3BzLmFjdGl2ZUtleSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMucHJvcHMuYWN0aXZlSHJlZiAhPSBudWxsKSB7XG4gICAgICBpZiAoY2hpbGQucHJvcHMuaHJlZiA9PT0gdGhpcy5wcm9wcy5hY3RpdmVIcmVmKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjaGlsZC5wcm9wcy5hY3RpdmU7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAnYWN0aXZlJzogdGhpcy5pc0FjdGl2ZSgpLFxuICAgICAgJ2Rpc2FibGVkJzogdGhpcy5wcm9wcy5kaXNhYmxlZFxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00ubGkoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgUmVhY3QuRE9NLmEoXG4gICAgICAgICAge2hyZWY6dGhpcy5wcm9wcy5ocmVmLFxuICAgICAgICAgIHRpdGxlOnRoaXMucHJvcHMudGl0bGUsXG4gICAgICAgICAgb25DbGljazp0aGlzLmhhbmRsZUNsaWNrLFxuICAgICAgICAgIHJlZjpcImFuY2hvclwifSwgXG4gICAgICAgICAgdGhpcy5wcm9wcy50ZXh0XG4gICAgICAgICksXG4gICAgICAgIFJlYWN0LkRPTS51bCgge2NsYXNzTmFtZTpcIm5hdlwifSwgXG4gICAgICAgICAgVmFsaWRDb21wb25lbnRDaGlsZHJlbi5tYXAodGhpcy5wcm9wcy5jaGlsZHJlbiwgdGhpcy5yZW5kZXJOYXZJdGVtKVxuICAgICAgICApXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICByZW5kZXJOYXZJdGVtOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gY2xvbmVXaXRoUHJvcHMoXG4gICAgICBjaGlsZCxcbiAgICAgIHtcbiAgICAgICAgYWN0aXZlOiB0aGlzLmdldENoaWxkQWN0aXZlUHJvcChjaGlsZCksXG4gICAgICAgIG9uU2VsZWN0OiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24oY2hpbGQucHJvcHMub25TZWxlY3QsIHRoaXMucHJvcHMub25TZWxlY3QpLFxuICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAga2V5OiBjaGlsZC5wcm9wcy5rZXlcbiAgICAgIH1cbiAgICApO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdWJOYXY7XG4iLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgVHJhbnNpdGlvbkV2ZW50cyA9IHJlcXVpcmUoJy4vdXRpbHMvVHJhbnNpdGlvbkV2ZW50cycpO1xuXG52YXIgVGFiUGFuZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYlBhbmUnLFxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYW5pbWF0ZUluOiBmYWxzZSxcbiAgICAgIGFuaW1hdGVPdXQ6IGZhbHNlXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV4dFByb3BzKSB7XG4gICAgaWYgKHRoaXMucHJvcHMuYW5pbWF0aW9uKSB7XG4gICAgICBpZiAoIXRoaXMuc3RhdGUuYW5pbWF0ZUluICYmIG5leHRQcm9wcy5hY3RpdmUgJiYgIXRoaXMucHJvcHMuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgIGFuaW1hdGVJbjogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuc3RhdGUuYW5pbWF0ZU91dCAmJiAhbmV4dFByb3BzLmFjdGl2ZSAmJiB0aGlzLnByb3BzLmFjdGl2ZSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICBhbmltYXRlT3V0OiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5hbmltYXRlSW4pIHtcbiAgICAgIHNldFRpbWVvdXQodGhpcy5zdGFydEFuaW1hdGVJbiwgMCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlLmFuaW1hdGVPdXQpIHtcbiAgICAgIFRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgdGhpcy5nZXRET01Ob2RlKCksXG4gICAgICAgIHRoaXMuc3RvcEFuaW1hdGVPdXRcbiAgICAgICk7XG4gICAgfVxuICB9LFxuXG4gIHN0YXJ0QW5pbWF0ZUluOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhbmltYXRlSW46IGZhbHNlXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgc3RvcEFuaW1hdGVPdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFuaW1hdGVPdXQ6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLnByb3BzLm9uQW5pbWF0ZU91dEVuZCgpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHtcbiAgICAgICd0YWItcGFuZSc6IHRydWUsXG4gICAgICAnZmFkZSc6IHRydWUsXG4gICAgICAnYWN0aXZlJzogdGhpcy5wcm9wcy5hY3RpdmUgfHwgdGhpcy5zdGF0ZS5hbmltYXRlT3V0LFxuICAgICAgJ2luJzogdGhpcy5wcm9wcy5hY3RpdmUgJiYgIXRoaXMuc3RhdGUuYW5pbWF0ZUluXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyUHJvcHNUbyhcbiAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYlBhbmU7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xudmFyIGNsb25lV2l0aFByb3BzID0gcmVxdWlyZSgnLi91dGlscy9jbG9uZVdpdGhQcm9wcycpO1xudmFyIFZhbGlkQ29tcG9uZW50Q2hpbGRyZW4gPSByZXF1aXJlKCcuL3V0aWxzL1ZhbGlkQ29tcG9uZW50Q2hpbGRyZW4nKTtcbnZhciBOYXYgPSByZXF1aXJlKCcuL05hdicpO1xudmFyIE5hdkl0ZW0gPSByZXF1aXJlKCcuL05hdkl0ZW0nKTtcblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEFjdGl2ZUtleUZyb21DaGlsZHJlbihjaGlsZHJlbikge1xuICB2YXIgZGVmYXVsdEFjdGl2ZUtleTtcblxuICBWYWxpZENvbXBvbmVudENoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKGRlZmF1bHRBY3RpdmVLZXkgPT0gbnVsbCkge1xuICAgICAgZGVmYXVsdEFjdGl2ZUtleSA9IGNoaWxkLnByb3BzLmtleTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBkZWZhdWx0QWN0aXZlS2V5O1xufVxuXG52YXIgVGFiYmVkQXJlYSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYmJlZEFyZWEnLFxuICBtaXhpbnM6IFtCb290c3RyYXBNaXhpbl0sXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgYnNTdHlsZTogUmVhY3QuUHJvcFR5cGVzLm9uZU9mKFsndGFicycsJ3BpbGxzJ10pLFxuICAgIGFuaW1hdGlvbjogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgb25TZWxlY3Q6IFJlYWN0LlByb3BUeXBlcy5mdW5jXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJzU3R5bGU6IFwidGFic1wiLFxuICAgICAgYW5pbWF0aW9uOiB0cnVlXG4gICAgfTtcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZGVmYXVsdEFjdGl2ZUtleSA9IHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleSAhPSBudWxsID9cbiAgICAgIHRoaXMucHJvcHMuZGVmYXVsdEFjdGl2ZUtleSA6IGdldERlZmF1bHRBY3RpdmVLZXlGcm9tQ2hpbGRyZW4odGhpcy5wcm9wcy5jaGlsZHJlbik7XG5cbiAgICAvLyBUT0RPOiBJbiBfX0RFVl9fIG1vZGUgd2FybiB2aWEgYGNvbnNvbGUud2FybmAgaWYgbm8gYGRlZmF1bHRBY3RpdmVLZXlgIGhhc1xuICAgIC8vIGJlZW4gc2V0IGJ5IHRoaXMgcG9pbnQsIGludmFsaWQgY2hpbGRyZW4gb3IgbWlzc2luZyBrZXkgcHJvcGVydGllcyBhcmUgbGlrZWx5IHRoZSBjYXVzZS5cblxuICAgIHJldHVybiB7XG4gICAgICBhY3RpdmVLZXk6IGRlZmF1bHRBY3RpdmVLZXksXG4gICAgICBwcmV2aW91c0FjdGl2ZUtleTogbnVsbFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wczogZnVuY3Rpb24gKG5leHRQcm9wcykge1xuICAgIGlmIChuZXh0UHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgJiYgbmV4dFByb3BzLmFjdGl2ZUtleSAhPT0gdGhpcy5wcm9wcy5hY3RpdmVLZXkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBwcmV2aW91c0FjdGl2ZUtleTogdGhpcy5wcm9wcy5hY3RpdmVLZXlcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBoYW5kbGVQYW5lQW5pbWF0ZU91dEVuZDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IG51bGxcbiAgICB9KTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID1cbiAgICAgIHRoaXMucHJvcHMuYWN0aXZlS2V5ICE9IG51bGwgPyB0aGlzLnByb3BzLmFjdGl2ZUtleSA6IHRoaXMuc3RhdGUuYWN0aXZlS2V5O1xuXG4gICAgZnVuY3Rpb24gcmVuZGVyVGFiSWZTZXQoY2hpbGQpIHtcbiAgICAgIHJldHVybiBjaGlsZC5wcm9wcy50YWIgIT0gbnVsbCA/IHRoaXMucmVuZGVyVGFiKGNoaWxkKSA6IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG5hdiA9IHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgTmF2KCB7YWN0aXZlS2V5OmFjdGl2ZUtleSwgb25TZWxlY3Q6dGhpcy5oYW5kbGVTZWxlY3QsIHJlZjpcInRhYnNcIn0sIFxuICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCByZW5kZXJUYWJJZlNldCwgdGhpcylcbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIFJlYWN0LkRPTS5kaXYobnVsbCwgXG4gICAgICAgIG5hdixcbiAgICAgICAgUmVhY3QuRE9NLmRpdigge2lkOnRoaXMucHJvcHMuaWQsIGNsYXNzTmFtZTpcInRhYi1jb250ZW50XCIsIHJlZjpcInBhbmVzXCJ9LCBcbiAgICAgICAgICBWYWxpZENvbXBvbmVudENoaWxkcmVuLm1hcCh0aGlzLnByb3BzLmNoaWxkcmVuLCB0aGlzLnJlbmRlclBhbmUpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9LFxuXG4gIGdldEFjdGl2ZUtleTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnByb3BzLmFjdGl2ZUtleSAhPSBudWxsID8gdGhpcy5wcm9wcy5hY3RpdmVLZXkgOiB0aGlzLnN0YXRlLmFjdGl2ZUtleTtcbiAgfSxcblxuICByZW5kZXJQYW5lOiBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICB2YXIgYWN0aXZlS2V5ID0gdGhpcy5nZXRBY3RpdmVLZXkoKTtcblxuICAgIHJldHVybiBjbG9uZVdpdGhQcm9wcyhcbiAgICAgICAgY2hpbGQsXG4gICAgICAgIHtcbiAgICAgICAgICBhY3RpdmU6IChjaGlsZC5wcm9wcy5rZXkgPT09IGFjdGl2ZUtleSAmJlxuICAgICAgICAgICAgKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkgPT0gbnVsbCB8fCAhdGhpcy5wcm9wcy5hbmltYXRpb24pKSxcbiAgICAgICAgICByZWY6IGNoaWxkLnByb3BzLnJlZixcbiAgICAgICAgICBrZXk6IGNoaWxkLnByb3BzLmtleSxcbiAgICAgICAgICBhbmltYXRpb246IHRoaXMucHJvcHMuYW5pbWF0aW9uLFxuICAgICAgICAgIG9uQW5pbWF0ZU91dEVuZDogKHRoaXMuc3RhdGUucHJldmlvdXNBY3RpdmVLZXkgIT0gbnVsbCAmJlxuICAgICAgICAgICAgY2hpbGQucHJvcHMua2V5ID09PSB0aGlzLnN0YXRlLnByZXZpb3VzQWN0aXZlS2V5KSA/IHRoaXMuaGFuZGxlUGFuZUFuaW1hdGVPdXRFbmQ6IG51bGxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgfSxcblxuICByZW5kZXJUYWI6IGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIHZhciBrZXkgPSBjaGlsZC5wcm9wcy5rZXk7XG4gICAgcmV0dXJuIChcbiAgICAgIE5hdkl0ZW0oXG4gICAgICAgIHtyZWY6J3RhYicgKyBrZXksXG4gICAgICAgIGtleTprZXl9LCBcbiAgICAgICAgY2hpbGQucHJvcHMudGFiXG4gICAgICApXG4gICAgKTtcbiAgfSxcblxuICBzaG91bGRDb21wb25lbnRVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIC8vIERlZmVyIGFueSB1cGRhdGVzIHRvIHRoaXMgY29tcG9uZW50IGR1cmluZyB0aGUgYG9uU2VsZWN0YCBoYW5kbGVyLlxuICAgIHJldHVybiAhdGhpcy5faXNDaGFuZ2luZztcbiAgfSxcblxuICBoYW5kbGVTZWxlY3Q6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5vblNlbGVjdCkge1xuICAgICAgdGhpcy5faXNDaGFuZ2luZyA9IHRydWU7XG4gICAgICB0aGlzLnByb3BzLm9uU2VsZWN0KGtleSk7XG4gICAgICB0aGlzLl9pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChrZXkgIT09IHRoaXMuZ2V0QWN0aXZlS2V5KCkpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhY3RpdmVLZXk6IGtleSxcbiAgICAgICAgcHJldmlvdXNBY3RpdmVLZXk6IHRoaXMuZ2V0QWN0aXZlS2V5KClcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFiYmVkQXJlYTsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG5cbnZhciBUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1RhYmxlJyxcbiAgcHJvcFR5cGVzOiB7XG4gICAgc3RyaXBlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgYm9yZGVyZWQ6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIGNvbmRlbnNlZDogUmVhY3QuUHJvcFR5cGVzLmJvb2wsXG4gICAgaG92ZXI6IFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgIHJlc3BvbnNpdmU6IFJlYWN0LlByb3BUeXBlcy5ib29sXG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSB7XG4gICAgICAndGFibGUnOiB0cnVlLFxuICAgICAgJ3RhYmxlLXN0cmlwZWQnOiB0aGlzLnByb3BzLnN0cmlwZWQsXG4gICAgICAndGFibGUtYm9yZGVyZWQnOiB0aGlzLnByb3BzLmJvcmRlcmVkLFxuICAgICAgJ3RhYmxlLWNvbmRlbnNlZCc6IHRoaXMucHJvcHMuY29uZGVuc2VkLFxuICAgICAgJ3RhYmxlLWhvdmVyJzogdGhpcy5wcm9wcy5ob3ZlclxuICAgIH07XG4gICAgdmFyIHRhYmxlID0gdGhpcy50cmFuc2ZlclByb3BzVG8oXG4gICAgICBSZWFjdC5ET00udGFibGUoIHtjbGFzc05hbWU6Y2xhc3NTZXQoY2xhc3Nlcyl9LCBcbiAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgKVxuICAgICk7XG5cbiAgICByZXR1cm4gdGhpcy5wcm9wcy5yZXNwb25zaXZlID8gKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRhYmxlLXJlc3BvbnNpdmVcIn0sIFxuICAgICAgICB0YWJsZVxuICAgICAgKVxuICAgICkgOiB0YWJsZTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGFibGU7IiwiLyoqIEBqc3ggUmVhY3QuRE9NICovXG5cbnZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xudmFyIGNsYXNzU2V0ID0gcmVxdWlyZSgnLi91dGlscy9jbGFzc1NldCcpO1xudmFyIEJvb3RzdHJhcE1peGluID0gcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpO1xuXG5cbnZhciBUb29sdGlwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnVG9vbHRpcCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBwbGFjZW1lbnQ6IFJlYWN0LlByb3BUeXBlcy5vbmVPZihbJ3RvcCcsJ3JpZ2h0JywgJ2JvdHRvbScsICdsZWZ0J10pLFxuICAgIHBvc2l0aW9uTGVmdDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBwb3NpdGlvblRvcDogUmVhY3QuUHJvcFR5cGVzLm51bWJlcixcbiAgICBhcnJvd09mZnNldExlZnQ6IFJlYWN0LlByb3BUeXBlcy5udW1iZXIsXG4gICAgYXJyb3dPZmZzZXRUb3A6IFJlYWN0LlByb3BUeXBlcy5udW1iZXJcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGxhY2VtZW50OiAncmlnaHQnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHt9O1xuICAgIGNsYXNzZXNbJ3Rvb2x0aXAnXSA9IHRydWU7XG4gICAgY2xhc3Nlc1t0aGlzLnByb3BzLnBsYWNlbWVudF0gPSB0cnVlO1xuICAgIGNsYXNzZXNbJ2luJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdCAhPSBudWxsIHx8IHRoaXMucHJvcHMucG9zaXRpb25Ub3AgIT0gbnVsbDtcblxuICAgIHZhciBzdHlsZSA9IHt9O1xuICAgIHN0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLnBvc2l0aW9uTGVmdDtcbiAgICBzdHlsZVsndG9wJ10gPSB0aGlzLnByb3BzLnBvc2l0aW9uVG9wO1xuXG4gICAgdmFyIGFycm93U3R5bGUgPSB7fTtcbiAgICBhcnJvd1N0eWxlWydsZWZ0J10gPSB0aGlzLnByb3BzLmFycm93T2Zmc2V0TGVmdDtcbiAgICBhcnJvd1N0eWxlWyd0b3AnXSA9IHRoaXMucHJvcHMuYXJyb3dPZmZzZXRUb3A7XG5cbiAgICByZXR1cm4gKFxuICAgICAgICBSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOmNsYXNzU2V0KGNsYXNzZXMpLCBzdHlsZTpzdHlsZX0sIFxuICAgICAgICAgIFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJ0b29sdGlwLWFycm93XCIsIHN0eWxlOmFycm93U3R5bGV9ICksXG4gICAgICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpcInRvb2x0aXAtaW5uZXJcIn0sIFxuICAgICAgICAgICAgdGhpcy5wcm9wcy5jaGlsZHJlblxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVG9vbHRpcDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgY2xhc3NTZXQgPSByZXF1aXJlKCcuL3V0aWxzL2NsYXNzU2V0Jyk7XG52YXIgQm9vdHN0cmFwTWl4aW4gPSByZXF1aXJlKCcuL0Jvb3RzdHJhcE1peGluJyk7XG5cbnZhciBXZWxsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe2Rpc3BsYXlOYW1lOiAnV2VsbCcsXG4gIG1peGluczogW0Jvb3RzdHJhcE1peGluXSxcblxuICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnNDbGFzczogJ3dlbGwnXG4gICAgfTtcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2xhc3NlcyA9IHRoaXMuZ2V0QnNDbGFzc1NldCgpO1xuXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmZXJQcm9wc1RvKFxuICAgICAgUmVhY3QuRE9NLmRpdigge2NsYXNzTmFtZTpjbGFzc1NldChjbGFzc2VzKX0sIFxuICAgICAgICB0aGlzLnByb3BzLmNoaWxkcmVuXG4gICAgICApXG4gICAgKTtcbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gV2VsbDsiLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgQ0xBU1NFUzoge1xuICAgICdhbGVydCc6ICdhbGVydCcsXG4gICAgJ2J1dHRvbic6ICdidG4nLFxuICAgICdidXR0b24tZ3JvdXAnOiAnYnRuLWdyb3VwJyxcbiAgICAnYnV0dG9uLXRvb2xiYXInOiAnYnRuLXRvb2xiYXInLFxuICAgICdjb2x1bW4nOiAnY29sJyxcbiAgICAnaW5wdXQtZ3JvdXAnOiAnaW5wdXQtZ3JvdXAnLFxuICAgICdmb3JtJzogJ2Zvcm0nLFxuICAgICdnbHlwaGljb24nOiAnZ2x5cGhpY29uJyxcbiAgICAnbGFiZWwnOiAnbGFiZWwnLFxuICAgICdwYW5lbCc6ICdwYW5lbCcsXG4gICAgJ3BhbmVsLWdyb3VwJzogJ3BhbmVsLWdyb3VwJyxcbiAgICAncHJvZ3Jlc3MtYmFyJzogJ3Byb2dyZXNzLWJhcicsXG4gICAgJ25hdic6ICduYXYnLFxuICAgICduYXZiYXInOiAnbmF2YmFyJyxcbiAgICAnbW9kYWwnOiAnbW9kYWwnLFxuICAgICdyb3cnOiAncm93JyxcbiAgICAnd2VsbCc6ICd3ZWxsJ1xuICB9LFxuICBTVFlMRVM6IHtcbiAgICAnZGVmYXVsdCc6ICdkZWZhdWx0JyxcbiAgICAncHJpbWFyeSc6ICdwcmltYXJ5JyxcbiAgICAnc3VjY2Vzcyc6ICdzdWNjZXNzJyxcbiAgICAnaW5mbyc6ICdpbmZvJyxcbiAgICAnd2FybmluZyc6ICd3YXJuaW5nJyxcbiAgICAnZGFuZ2VyJzogJ2RhbmdlcicsXG4gICAgJ2xpbmsnOiAnbGluaycsXG4gICAgJ2lubGluZSc6ICdpbmxpbmUnLFxuICAgICd0YWJzJzogJ3RhYnMnLFxuICAgICdwaWxscyc6ICdwaWxscydcbiAgfSxcbiAgU0laRVM6IHtcbiAgICAnbGFyZ2UnOiAnbGcnLFxuICAgICdtZWRpdW0nOiAnbWQnLFxuICAgICdzbWFsbCc6ICdzbScsXG4gICAgJ3hzbWFsbCc6ICd4cydcbiAgfSxcbiAgR0xZUEhTOiBbXG4gICAgJ2FzdGVyaXNrJyxcbiAgICAncGx1cycsXG4gICAgJ2V1cm8nLFxuICAgICdtaW51cycsXG4gICAgJ2Nsb3VkJyxcbiAgICAnZW52ZWxvcGUnLFxuICAgICdwZW5jaWwnLFxuICAgICdnbGFzcycsXG4gICAgJ211c2ljJyxcbiAgICAnc2VhcmNoJyxcbiAgICAnaGVhcnQnLFxuICAgICdzdGFyJyxcbiAgICAnc3Rhci1lbXB0eScsXG4gICAgJ3VzZXInLFxuICAgICdmaWxtJyxcbiAgICAndGgtbGFyZ2UnLFxuICAgICd0aCcsXG4gICAgJ3RoLWxpc3QnLFxuICAgICdvaycsXG4gICAgJ3JlbW92ZScsXG4gICAgJ3pvb20taW4nLFxuICAgICd6b29tLW91dCcsXG4gICAgJ29mZicsXG4gICAgJ3NpZ25hbCcsXG4gICAgJ2NvZycsXG4gICAgJ3RyYXNoJyxcbiAgICAnaG9tZScsXG4gICAgJ2ZpbGUnLFxuICAgICd0aW1lJyxcbiAgICAncm9hZCcsXG4gICAgJ2Rvd25sb2FkLWFsdCcsXG4gICAgJ2Rvd25sb2FkJyxcbiAgICAndXBsb2FkJyxcbiAgICAnaW5ib3gnLFxuICAgICdwbGF5LWNpcmNsZScsXG4gICAgJ3JlcGVhdCcsXG4gICAgJ3JlZnJlc2gnLFxuICAgICdsaXN0LWFsdCcsXG4gICAgJ2xvY2snLFxuICAgICdmbGFnJyxcbiAgICAnaGVhZHBob25lcycsXG4gICAgJ3ZvbHVtZS1vZmYnLFxuICAgICd2b2x1bWUtZG93bicsXG4gICAgJ3ZvbHVtZS11cCcsXG4gICAgJ3FyY29kZScsXG4gICAgJ2JhcmNvZGUnLFxuICAgICd0YWcnLFxuICAgICd0YWdzJyxcbiAgICAnYm9vaycsXG4gICAgJ2Jvb2ttYXJrJyxcbiAgICAncHJpbnQnLFxuICAgICdjYW1lcmEnLFxuICAgICdmb250JyxcbiAgICAnYm9sZCcsXG4gICAgJ2l0YWxpYycsXG4gICAgJ3RleHQtaGVpZ2h0JyxcbiAgICAndGV4dC13aWR0aCcsXG4gICAgJ2FsaWduLWxlZnQnLFxuICAgICdhbGlnbi1jZW50ZXInLFxuICAgICdhbGlnbi1yaWdodCcsXG4gICAgJ2FsaWduLWp1c3RpZnknLFxuICAgICdsaXN0JyxcbiAgICAnaW5kZW50LWxlZnQnLFxuICAgICdpbmRlbnQtcmlnaHQnLFxuICAgICdmYWNldGltZS12aWRlbycsXG4gICAgJ3BpY3R1cmUnLFxuICAgICdtYXAtbWFya2VyJyxcbiAgICAnYWRqdXN0JyxcbiAgICAndGludCcsXG4gICAgJ2VkaXQnLFxuICAgICdzaGFyZScsXG4gICAgJ2NoZWNrJyxcbiAgICAnbW92ZScsXG4gICAgJ3N0ZXAtYmFja3dhcmQnLFxuICAgICdmYXN0LWJhY2t3YXJkJyxcbiAgICAnYmFja3dhcmQnLFxuICAgICdwbGF5JyxcbiAgICAncGF1c2UnLFxuICAgICdzdG9wJyxcbiAgICAnZm9yd2FyZCcsXG4gICAgJ2Zhc3QtZm9yd2FyZCcsXG4gICAgJ3N0ZXAtZm9yd2FyZCcsXG4gICAgJ2VqZWN0JyxcbiAgICAnY2hldnJvbi1sZWZ0JyxcbiAgICAnY2hldnJvbi1yaWdodCcsXG4gICAgJ3BsdXMtc2lnbicsXG4gICAgJ21pbnVzLXNpZ24nLFxuICAgICdyZW1vdmUtc2lnbicsXG4gICAgJ29rLXNpZ24nLFxuICAgICdxdWVzdGlvbi1zaWduJyxcbiAgICAnaW5mby1zaWduJyxcbiAgICAnc2NyZWVuc2hvdCcsXG4gICAgJ3JlbW92ZS1jaXJjbGUnLFxuICAgICdvay1jaXJjbGUnLFxuICAgICdiYW4tY2lyY2xlJyxcbiAgICAnYXJyb3ctbGVmdCcsXG4gICAgJ2Fycm93LXJpZ2h0JyxcbiAgICAnYXJyb3ctdXAnLFxuICAgICdhcnJvdy1kb3duJyxcbiAgICAnc2hhcmUtYWx0JyxcbiAgICAncmVzaXplLWZ1bGwnLFxuICAgICdyZXNpemUtc21hbGwnLFxuICAgICdleGNsYW1hdGlvbi1zaWduJyxcbiAgICAnZ2lmdCcsXG4gICAgJ2xlYWYnLFxuICAgICdmaXJlJyxcbiAgICAnZXllLW9wZW4nLFxuICAgICdleWUtY2xvc2UnLFxuICAgICd3YXJuaW5nLXNpZ24nLFxuICAgICdwbGFuZScsXG4gICAgJ2NhbGVuZGFyJyxcbiAgICAncmFuZG9tJyxcbiAgICAnY29tbWVudCcsXG4gICAgJ21hZ25ldCcsXG4gICAgJ2NoZXZyb24tdXAnLFxuICAgICdjaGV2cm9uLWRvd24nLFxuICAgICdyZXR3ZWV0JyxcbiAgICAnc2hvcHBpbmctY2FydCcsXG4gICAgJ2ZvbGRlci1jbG9zZScsXG4gICAgJ2ZvbGRlci1vcGVuJyxcbiAgICAncmVzaXplLXZlcnRpY2FsJyxcbiAgICAncmVzaXplLWhvcml6b250YWwnLFxuICAgICdoZGQnLFxuICAgICdidWxsaG9ybicsXG4gICAgJ2JlbGwnLFxuICAgICdjZXJ0aWZpY2F0ZScsXG4gICAgJ3RodW1icy11cCcsXG4gICAgJ3RodW1icy1kb3duJyxcbiAgICAnaGFuZC1yaWdodCcsXG4gICAgJ2hhbmQtbGVmdCcsXG4gICAgJ2hhbmQtdXAnLFxuICAgICdoYW5kLWRvd24nLFxuICAgICdjaXJjbGUtYXJyb3ctcmlnaHQnLFxuICAgICdjaXJjbGUtYXJyb3ctbGVmdCcsXG4gICAgJ2NpcmNsZS1hcnJvdy11cCcsXG4gICAgJ2NpcmNsZS1hcnJvdy1kb3duJyxcbiAgICAnZ2xvYmUnLFxuICAgICd3cmVuY2gnLFxuICAgICd0YXNrcycsXG4gICAgJ2ZpbHRlcicsXG4gICAgJ2JyaWVmY2FzZScsXG4gICAgJ2Z1bGxzY3JlZW4nLFxuICAgICdkYXNoYm9hcmQnLFxuICAgICdwYXBlcmNsaXAnLFxuICAgICdoZWFydC1lbXB0eScsXG4gICAgJ2xpbmsnLFxuICAgICdwaG9uZScsXG4gICAgJ3B1c2hwaW4nLFxuICAgICd1c2QnLFxuICAgICdnYnAnLFxuICAgICdzb3J0JyxcbiAgICAnc29ydC1ieS1hbHBoYWJldCcsXG4gICAgJ3NvcnQtYnktYWxwaGFiZXQtYWx0JyxcbiAgICAnc29ydC1ieS1vcmRlcicsXG4gICAgJ3NvcnQtYnktb3JkZXItYWx0JyxcbiAgICAnc29ydC1ieS1hdHRyaWJ1dGVzJyxcbiAgICAnc29ydC1ieS1hdHRyaWJ1dGVzLWFsdCcsXG4gICAgJ3VuY2hlY2tlZCcsXG4gICAgJ2V4cGFuZCcsXG4gICAgJ2NvbGxhcHNlLWRvd24nLFxuICAgICdjb2xsYXBzZS11cCcsXG4gICAgJ2xvZy1pbicsXG4gICAgJ2ZsYXNoJyxcbiAgICAnbG9nLW91dCcsXG4gICAgJ25ldy13aW5kb3cnLFxuICAgICdyZWNvcmQnLFxuICAgICdzYXZlJyxcbiAgICAnb3BlbicsXG4gICAgJ3NhdmVkJyxcbiAgICAnaW1wb3J0JyxcbiAgICAnZXhwb3J0JyxcbiAgICAnc2VuZCcsXG4gICAgJ2Zsb3BweS1kaXNrJyxcbiAgICAnZmxvcHB5LXNhdmVkJyxcbiAgICAnZmxvcHB5LXJlbW92ZScsXG4gICAgJ2Zsb3BweS1zYXZlJyxcbiAgICAnZmxvcHB5LW9wZW4nLFxuICAgICdjcmVkaXQtY2FyZCcsXG4gICAgJ3RyYW5zZmVyJyxcbiAgICAnY3V0bGVyeScsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2NvbXByZXNzZWQnLFxuICAgICdlYXJwaG9uZScsXG4gICAgJ3Bob25lLWFsdCcsXG4gICAgJ3Rvd2VyJyxcbiAgICAnc3RhdHMnLFxuICAgICdzZC12aWRlbycsXG4gICAgJ2hkLXZpZGVvJyxcbiAgICAnc3VidGl0bGVzJyxcbiAgICAnc291bmQtc3RlcmVvJyxcbiAgICAnc291bmQtZG9sYnknLFxuICAgICdzb3VuZC01LTEnLFxuICAgICdzb3VuZC02LTEnLFxuICAgICdzb3VuZC03LTEnLFxuICAgICdjb3B5cmlnaHQtbWFyaycsXG4gICAgJ3JlZ2lzdHJhdGlvbi1tYXJrJyxcbiAgICAnY2xvdWQtZG93bmxvYWQnLFxuICAgICdjbG91ZC11cGxvYWQnLFxuICAgICd0cmVlLWNvbmlmZXInLFxuICAgICd0cmVlLWRlY2lkdW91cydcbiAgXVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBBY2NvcmRpb246IHJlcXVpcmUoJy4vQWNjb3JkaW9uJyksXG4gIEFmZml4OiByZXF1aXJlKCcuL0FmZml4JyksXG4gIEFmZml4TWl4aW46IHJlcXVpcmUoJy4vQWZmaXhNaXhpbicpLFxuICBBbGVydDogcmVxdWlyZSgnLi9BbGVydCcpLFxuICBCb290c3RyYXBNaXhpbjogcmVxdWlyZSgnLi9Cb290c3RyYXBNaXhpbicpLFxuICBCYWRnZTogcmVxdWlyZSgnLi9CYWRnZScpLFxuICBCdXR0b246IHJlcXVpcmUoJy4vQnV0dG9uJyksXG4gIEJ1dHRvbkdyb3VwOiByZXF1aXJlKCcuL0J1dHRvbkdyb3VwJyksXG4gIEJ1dHRvblRvb2xiYXI6IHJlcXVpcmUoJy4vQnV0dG9uVG9vbGJhcicpLFxuICBDYXJvdXNlbDogcmVxdWlyZSgnLi9DYXJvdXNlbCcpLFxuICBDYXJvdXNlbEl0ZW06IHJlcXVpcmUoJy4vQ2Fyb3VzZWxJdGVtJyksXG4gIENvbDogcmVxdWlyZSgnLi9Db2wnKSxcbiAgQ29sbGFwc2FibGVNaXhpbjogcmVxdWlyZSgnLi9Db2xsYXBzYWJsZU1peGluJyksXG4gIERyb3Bkb3duQnV0dG9uOiByZXF1aXJlKCcuL0Ryb3Bkb3duQnV0dG9uJyksXG4gIERyb3Bkb3duTWVudTogcmVxdWlyZSgnLi9Ecm9wZG93bk1lbnUnKSxcbiAgRHJvcGRvd25TdGF0ZU1peGluOiByZXF1aXJlKCcuL0Ryb3Bkb3duU3RhdGVNaXhpbicpLFxuICBGYWRlTWl4aW46IHJlcXVpcmUoJy4vRmFkZU1peGluJyksXG4gIEdseXBoaWNvbjogcmVxdWlyZSgnLi9HbHlwaGljb24nKSxcbiAgR3JpZDogcmVxdWlyZSgnLi9HcmlkJyksXG4gIElucHV0OiByZXF1aXJlKCcuL0lucHV0JyksXG4gIEludGVycG9sYXRlOiByZXF1aXJlKCcuL0ludGVycG9sYXRlJyksXG4gIEp1bWJvdHJvbjogcmVxdWlyZSgnLi9KdW1ib3Ryb24nKSxcbiAgTGFiZWw6IHJlcXVpcmUoJy4vTGFiZWwnKSxcbiAgTWVudUl0ZW06IHJlcXVpcmUoJy4vTWVudUl0ZW0nKSxcbiAgTW9kYWw6IHJlcXVpcmUoJy4vTW9kYWwnKSxcbiAgTmF2OiByZXF1aXJlKCcuL05hdicpLFxuICBOYXZiYXI6IHJlcXVpcmUoJy4vTmF2YmFyJyksXG4gIE5hdkl0ZW06IHJlcXVpcmUoJy4vTmF2SXRlbScpLFxuICBNb2RhbFRyaWdnZXI6IHJlcXVpcmUoJy4vTW9kYWxUcmlnZ2VyJyksXG4gIE92ZXJsYXlUcmlnZ2VyOiByZXF1aXJlKCcuL092ZXJsYXlUcmlnZ2VyJyksXG4gIE92ZXJsYXlNaXhpbjogcmVxdWlyZSgnLi9PdmVybGF5TWl4aW4nKSxcbiAgUGFnZUhlYWRlcjogcmVxdWlyZSgnLi9QYWdlSGVhZGVyJyksXG4gIFBhbmVsOiByZXF1aXJlKCcuL1BhbmVsJyksXG4gIFBhbmVsR3JvdXA6IHJlcXVpcmUoJy4vUGFuZWxHcm91cCcpLFxuICBQYWdlSXRlbTogcmVxdWlyZSgnLi9QYWdlSXRlbScpLFxuICBQYWdlcjogcmVxdWlyZSgnLi9QYWdlcicpLFxuICBQb3BvdmVyOiByZXF1aXJlKCcuL1BvcG92ZXInKSxcbiAgUHJvZ3Jlc3NCYXI6IHJlcXVpcmUoJy4vUHJvZ3Jlc3NCYXInKSxcbiAgUm93OiByZXF1aXJlKCcuL1JvdycpLFxuICBTcGxpdEJ1dHRvbjogcmVxdWlyZSgnLi9TcGxpdEJ1dHRvbicpLFxuICBTdWJOYXY6IHJlcXVpcmUoJy4vU3ViTmF2JyksXG4gIFRhYmJlZEFyZWE6IHJlcXVpcmUoJy4vVGFiYmVkQXJlYScpLFxuICBUYWJsZTogcmVxdWlyZSgnLi9UYWJsZScpLFxuICBUYWJQYW5lOiByZXF1aXJlKCcuL1RhYlBhbmUnKSxcbiAgVG9vbHRpcDogcmVxdWlyZSgnLi9Ub29sdGlwJyksXG4gIFdlbGw6IHJlcXVpcmUoJy4vV2VsbCcpXG59OyIsInZhciBSZWFjdCA9ICh3aW5kb3cuUmVhY3QgfHwgUmVhY3QpO1xuXG52YXIgQ3VzdG9tUHJvcFR5cGVzID0ge1xuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgYSBwcm9wIGlzIGEgdmFsaWQgUmVhY3QgY2xhc3NcbiAgICpcbiAgICogQHBhcmFtIHByb3BzXG4gICAqIEBwYXJhbSBwcm9wTmFtZVxuICAgKiBAcGFyYW0gY29tcG9uZW50TmFtZVxuICAgKiBAcmV0dXJucyB7RXJyb3J8dW5kZWZpbmVkfVxuICAgKi9cbiAgY29tcG9uZW50Q2xhc3M6IGZ1bmN0aW9uIChwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUpIHtcbiAgICBpZiAoIVJlYWN0LmlzVmFsaWRDbGFzcyhwcm9wc1twcm9wTmFtZV0pKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdJbnZhbGlkIGAnICsgcHJvcE5hbWUgKyAnYCBwcm9wIGluIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBiZSAnICtcbiAgICAgICAgJ2EgdmFsaWQgUmVhY3QgY2xhc3MnKTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIGEgcHJvcCBwcm92aWRlcyBhIERPTSBlbGVtZW50XG4gICAqXG4gICAqIFRoZSBlbGVtZW50IGNhbiBiZSBwcm92aWRlZCBpbiB0d28gZm9ybXM6XG4gICAqIC0gRGlyZWN0bHkgcGFzc2VkXG4gICAqIC0gT3IgcGFzc2VkIGFuIG9iamVjdCB3aGljaCBoYXMgYSBgZ2V0RE9NTm9kZWAgbWV0aG9kIHdoaWNoIHdpbGwgcmV0dXJuIHRoZSByZXF1aXJlZCBET00gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0gcHJvcHNcbiAgICogQHBhcmFtIHByb3BOYW1lXG4gICAqIEBwYXJhbSBjb21wb25lbnROYW1lXG4gICAqIEByZXR1cm5zIHtFcnJvcnx1bmRlZmluZWR9XG4gICAqL1xuICBtb3VudGFibGU6IGZ1bmN0aW9uIChwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUpIHtcbiAgICBpZiAodHlwZW9mIHByb3BzW3Byb3BOYW1lXSAhPT0gJ29iamVjdCcgfHxcbiAgICAgIHR5cGVvZiBwcm9wc1twcm9wTmFtZV0uZ2V0RE9NTm9kZSAhPT0gJ2Z1bmN0aW9uJyAmJiBwcm9wc1twcm9wTmFtZV0ubm9kZVR5cGUgIT09IDEpIHtcbiAgICAgIHJldHVybiBuZXcgRXJyb3IoJ0ludmFsaWQgYCcgKyBwcm9wTmFtZSArICdgIHByb3AgaW4gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGJlICcgK1xuICAgICAgICAnYSBET00gZWxlbWVudCBvciBhbiBvYmplY3QgdGhhdCBoYXMgYSBgZ2V0RE9NTm9kZWAgbWV0aG9kJyk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEN1c3RvbVByb3BUeXBlczsiLCIvKipcbiAqIFJlYWN0IEV2ZW50TGlzdGVuZXIubGlzdGVuXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBhIG1vZGlmaWVkIHZlcnNpb24gb2Y6XG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3ZlbmRvci9zdHVicy9FdmVudExpc3RlbmVyLmpzXG4gKlxuICogVE9ETzogcmVtb3ZlIGluIGZhdm91ciBvZiBzb2x1dGlvbiBwcm92aWRlZCBieTpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvaXNzdWVzLzI4NVxuICovXG5cbi8qKlxuICogRG9lcyBub3QgdGFrZSBpbnRvIGFjY291bnQgc3BlY2lmaWMgbmF0dXJlIG9mIHBsYXRmb3JtLlxuICovXG52YXIgRXZlbnRMaXN0ZW5lciA9IHtcbiAgLyoqXG4gICAqIExpc3RlbiB0byBET00gZXZlbnRzIGR1cmluZyB0aGUgYnViYmxlIHBoYXNlLlxuICAgKlxuICAgKiBAcGFyYW0ge0RPTUV2ZW50VGFyZ2V0fSB0YXJnZXQgRE9NIGVsZW1lbnQgdG8gcmVnaXN0ZXIgbGlzdGVuZXIgb24uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgRXZlbnQgdHlwZSwgZS5nLiAnY2xpY2snIG9yICdtb3VzZW92ZXInLlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbi5cbiAgICogQHJldHVybiB7b2JqZWN0fSBPYmplY3Qgd2l0aCBhIGByZW1vdmVgIG1ldGhvZC5cbiAgICovXG4gIGxpc3RlbjogZnVuY3Rpb24odGFyZ2V0LCBldmVudFR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHRhcmdldC5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGNhbGxiYWNrLCBmYWxzZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgY2FsbGJhY2ssIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldC5hdHRhY2hFdmVudCkge1xuICAgICAgdGFyZ2V0LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudFR5cGUsIGNhbGxiYWNrKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGFyZ2V0LmRldGFjaEV2ZW50KCdvbicgKyBldmVudFR5cGUsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRMaXN0ZW5lcjtcbiIsIi8qKlxuICogUmVhY3QgVHJhbnNpdGlvbkV2ZW50c1xuICpcbiAqIENvcHlyaWdodCAyMDEzLTIwMTQgRmFjZWJvb2ssIEluYy5cbiAqIEBsaWNlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL0xJQ0VOU0VcbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mOlxuICogIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9yZWFjdC9ibG9iLzAuMTEtc3RhYmxlL3NyYy9hZGRvbnMvdHJhbnNpdGlvbnMvUmVhY3RUcmFuc2l0aW9uRXZlbnRzLmpzXG4gKlxuICovXG5cbnZhciBjYW5Vc2VET00gPSAhIShcbiAgdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB3aW5kb3cuZG9jdW1lbnQgJiZcbiAgICB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudFxuICApO1xuXG4vKipcbiAqIEVWRU5UX05BTUVfTUFQIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIGV2ZW50IGZpcmVkIHdoZW4gYVxuICogdHJhbnNpdGlvbi9hbmltYXRpb24gZW5kcywgYmFzZWQgb24gdGhlIHN0eWxlIHByb3BlcnR5IHVzZWQgdG9cbiAqIGRlZmluZSB0aGF0IGV2ZW50LlxuICovXG52YXIgRVZFTlRfTkFNRV9NQVAgPSB7XG4gIHRyYW5zaXRpb25lbmQ6IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICdtb3pUcmFuc2l0aW9uRW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb1RyYW5zaXRpb25FbmQnLFxuICAgICdtc1RyYW5zaXRpb24nOiAnTVNUcmFuc2l0aW9uRW5kJ1xuICB9LFxuXG4gIGFuaW1hdGlvbmVuZDoge1xuICAgICdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAnV2Via2l0QW5pbWF0aW9uJzogJ3dlYmtpdEFuaW1hdGlvbkVuZCcsXG4gICAgJ01vekFuaW1hdGlvbic6ICdtb3pBbmltYXRpb25FbmQnLFxuICAgICdPQW5pbWF0aW9uJzogJ29BbmltYXRpb25FbmQnLFxuICAgICdtc0FuaW1hdGlvbic6ICdNU0FuaW1hdGlvbkVuZCdcbiAgfVxufTtcblxudmFyIGVuZEV2ZW50cyA9IFtdO1xuXG5mdW5jdGlvbiBkZXRlY3RFdmVudHMoKSB7XG4gIHZhciB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHN0eWxlID0gdGVzdEVsLnN0eWxlO1xuXG4gIC8vIE9uIHNvbWUgcGxhdGZvcm1zLCBpbiBwYXJ0aWN1bGFyIHNvbWUgcmVsZWFzZXMgb2YgQW5kcm9pZCA0LngsXG4gIC8vIHRoZSB1bi1wcmVmaXhlZCBcImFuaW1hdGlvblwiIGFuZCBcInRyYW5zaXRpb25cIiBwcm9wZXJ0aWVzIGFyZSBkZWZpbmVkIG9uIHRoZVxuICAvLyBzdHlsZSBvYmplY3QgYnV0IHRoZSBldmVudHMgdGhhdCBmaXJlIHdpbGwgc3RpbGwgYmUgcHJlZml4ZWQsIHNvIHdlIG5lZWRcbiAgLy8gdG8gY2hlY2sgaWYgdGhlIHVuLXByZWZpeGVkIGV2ZW50cyBhcmUgdXNlYWJsZSwgYW5kIGlmIG5vdCByZW1vdmUgdGhlbVxuICAvLyBmcm9tIHRoZSBtYXBcbiAgaWYgKCEoJ0FuaW1hdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLmFuaW1hdGlvbmVuZC5hbmltYXRpb247XG4gIH1cblxuICBpZiAoISgnVHJhbnNpdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLnRyYW5zaXRpb25lbmQudHJhbnNpdGlvbjtcbiAgfVxuXG4gIGZvciAodmFyIGJhc2VFdmVudE5hbWUgaW4gRVZFTlRfTkFNRV9NQVApIHtcbiAgICB2YXIgYmFzZUV2ZW50cyA9IEVWRU5UX05BTUVfTUFQW2Jhc2VFdmVudE5hbWVdO1xuICAgIGZvciAodmFyIHN0eWxlTmFtZSBpbiBiYXNlRXZlbnRzKSB7XG4gICAgICBpZiAoc3R5bGVOYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVuZEV2ZW50cy5wdXNoKGJhc2VFdmVudHNbc3R5bGVOYW1lXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5pZiAoY2FuVXNlRE9NKSB7XG4gIGRldGVjdEV2ZW50cygpO1xufVxuXG4vLyBXZSB1c2UgdGhlIHJhdyB7YWRkfHJlbW92ZX1FdmVudExpc3RlbmVyKCkgY2FsbCBiZWNhdXNlIEV2ZW50TGlzdGVuZXJcbi8vIGRvZXMgbm90IGtub3cgaG93IHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lcnMgYW5kIHdlIHJlYWxseSBzaG91bGRcbi8vIGNsZWFuIHVwLiBBbHNvLCB0aGVzZSBldmVudHMgYXJlIG5vdCB0cmlnZ2VyZWQgaW4gb2xkZXIgYnJvd3NlcnNcbi8vIHNvIHdlIHNob3VsZCBiZSBBLU9LIGhlcmUuXG5cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnROYW1lLCBldmVudExpc3RlbmVyKSB7XG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG52YXIgUmVhY3RUcmFuc2l0aW9uRXZlbnRzID0ge1xuICBhZGRFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIElmIENTUyB0cmFuc2l0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCwgdHJpZ2dlciBhbiBcImVuZCBhbmltYXRpb25cIlxuICAgICAgLy8gZXZlbnQgaW1tZWRpYXRlbHkuXG4gICAgICB3aW5kb3cuc2V0VGltZW91dChldmVudExpc3RlbmVyLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIHJlbW92ZUVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUmVhY3RUcmFuc2l0aW9uRXZlbnRzO1xuIiwidmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG5cbi8qKlxuICogTWFwcyBjaGlsZHJlbiB0aGF0IGFyZSB0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmAsXG4gKiBidXQgb25seSBpdGVyYXRlcyBvdmVyIGNoaWxkcmVuIHRoYXQgYXJlIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIFRoZSBtYXBGdW5jdGlvbiBwcm92aWRlZCBpbmRleCB3aWxsIGJlIG5vcm1hbGlzZWQgdG8gdGhlIGNvbXBvbmVudHMgbWFwcGVkLFxuICogc28gYW4gaW52YWxpZCBjb21wb25lbnQgd291bGQgbm90IGluY3JlYXNlIHRoZSBpbmRleC5cbiAqXG4gKiBAcGFyYW0gez8qfSBjaGlsZHJlbiBDaGlsZHJlbiB0cmVlIGNvbnRhaW5lci5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKiwgaW50KX0gbWFwRnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IG1hcENvbnRleHQgQ29udGV4dCBmb3IgbWFwRnVuY3Rpb24uXG4gKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCBjb250YWluaW5nIHRoZSBvcmRlcmVkIG1hcCBvZiByZXN1bHRzLlxuICovXG5mdW5jdGlvbiBtYXBWYWxpZENvbXBvbmVudHMoY2hpbGRyZW4sIGZ1bmMsIGNvbnRleHQpIHtcbiAgdmFyIGluZGV4ID0gMDtcblxuICByZXR1cm4gUmVhY3QuQ2hpbGRyZW4ubWFwKGNoaWxkcmVuLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICBpZiAoUmVhY3QuaXNWYWxpZENvbXBvbmVudChjaGlsZCkpIHtcbiAgICAgIHZhciBsYXN0SW5kZXggPSBpbmRleDtcbiAgICAgIGluZGV4Kys7XG4gICAgICByZXR1cm4gZnVuYy5jYWxsKGNvbnRleHQsIGNoaWxkLCBsYXN0SW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBjaGlsZDtcbiAgfSk7XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBjaGlsZHJlbiB0aGF0IGFyZSB0eXBpY2FsbHkgc3BlY2lmaWVkIGFzIGBwcm9wcy5jaGlsZHJlbmAsXG4gKiBidXQgb25seSBpdGVyYXRlcyBvdmVyIGNoaWxkcmVuIHRoYXQgYXJlIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIFRoZSBwcm92aWRlZCBmb3JFYWNoRnVuYyhjaGlsZCwgaW5kZXgpIHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoXG4gKiBsZWFmIGNoaWxkIHdpdGggdGhlIGluZGV4IHJlZmxlY3RpbmcgdGhlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIFwidmFsaWQgY29tcG9uZW50c1wiLlxuICpcbiAqIEBwYXJhbSB7Pyp9IGNoaWxkcmVuIENoaWxkcmVuIHRyZWUgY29udGFpbmVyLlxuICogQHBhcmFtIHtmdW5jdGlvbigqLCBpbnQpfSBmb3JFYWNoRnVuYy5cbiAqIEBwYXJhbSB7Kn0gZm9yRWFjaENvbnRleHQgQ29udGV4dCBmb3IgZm9yRWFjaENvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGZvckVhY2hWYWxpZENvbXBvbmVudHMoY2hpbGRyZW4sIGZ1bmMsIGNvbnRleHQpIHtcbiAgdmFyIGluZGV4ID0gMDtcblxuICByZXR1cm4gUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKFJlYWN0LmlzVmFsaWRDb21wb25lbnQoY2hpbGQpKSB7XG4gICAgICBmdW5jLmNhbGwoY29udGV4dCwgY2hpbGQsIGluZGV4KTtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBDb3VudCB0aGUgbnVtYmVyIG9mIFwidmFsaWQgY29tcG9uZW50c1wiIGluIHRoZSBDaGlsZHJlbiBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBudW1iZXJPZlZhbGlkQ29tcG9uZW50cyhjaGlsZHJlbikge1xuICB2YXIgY291bnQgPSAwO1xuXG4gIFJlYWN0LkNoaWxkcmVuLmZvckVhY2goY2hpbGRyZW4sIGZ1bmN0aW9uIChjaGlsZCkge1xuICAgIGlmIChSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkgeyBjb3VudCsrOyB9XG4gIH0pO1xuXG4gIHJldHVybiBjb3VudDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgdGhlIENoaWxkIGNvbnRhaW5lciBoYXMgb25lIG9yIG1vcmUgXCJ2YWxpZCBjb21wb25lbnRzXCIuXG4gKlxuICogQHBhcmFtIHs/Kn0gY2hpbGRyZW4gQ2hpbGRyZW4gdHJlZSBjb250YWluZXIuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaGFzVmFsaWRDb21wb25lbnQoY2hpbGRyZW4pIHtcbiAgdmFyIGhhc1ZhbGlkID0gZmFsc2U7XG5cbiAgUmVhY3QuQ2hpbGRyZW4uZm9yRWFjaChjaGlsZHJlbiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgaWYgKCFoYXNWYWxpZCAmJiBSZWFjdC5pc1ZhbGlkQ29tcG9uZW50KGNoaWxkKSkge1xuICAgICAgaGFzVmFsaWQgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGhhc1ZhbGlkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWFwOiBtYXBWYWxpZENvbXBvbmVudHMsXG4gIGZvckVhY2g6IGZvckVhY2hWYWxpZENvbXBvbmVudHMsXG4gIG51bWJlck9mOiBudW1iZXJPZlZhbGlkQ29tcG9uZW50cyxcbiAgaGFzVmFsaWRDb21wb25lbnQ6IGhhc1ZhbGlkQ29tcG9uZW50XG59OyIsIi8qKlxuICogUmVhY3QgY2xhc3NTZXRcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKiBAbGljZW5jZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9MSUNFTlNFXG4gKlxuICogVGhpcyBmaWxlIGlzIHVubW9kaWZpZWQgZnJvbTpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdmVuZG9yL3N0dWJzL2N4LmpzXG4gKlxuICovXG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIG1hcmsgc3RyaW5nIGxpdGVyYWxzIHJlcHJlc2VudGluZyBDU1MgY2xhc3MgbmFtZXNcbiAqIHNvIHRoYXQgdGhleSBjYW4gYmUgdHJhbnNmb3JtZWQgc3RhdGljYWxseS4gVGhpcyBhbGxvd3MgZm9yIG1vZHVsYXJpemF0aW9uXG4gKiBhbmQgbWluaWZpY2F0aW9uIG9mIENTUyBjbGFzcyBuYW1lcy5cbiAqXG4gKiBJbiBzdGF0aWNfdXBzdHJlYW0sIHRoaXMgZnVuY3Rpb24gaXMgYWN0dWFsbHkgaW1wbGVtZW50ZWQsIGJ1dCBpdCBzaG91bGRcbiAqIGV2ZW50dWFsbHkgYmUgcmVwbGFjZWQgd2l0aCBzb21ldGhpbmcgbW9yZSBkZXNjcmlwdGl2ZSwgYW5kIHRoZSB0cmFuc2Zvcm1cbiAqIHRoYXQgaXMgdXNlZCBpbiB0aGUgbWFpbiBzdGFjayBzaG91bGQgYmUgcG9ydGVkIGZvciB1c2UgZWxzZXdoZXJlLlxuICpcbiAqIEBwYXJhbSBzdHJpbmd8b2JqZWN0IGNsYXNzTmFtZSB0byBtb2R1bGFyaXplLCBvciBhbiBvYmplY3Qgb2Yga2V5L3ZhbHVlcy5cbiAqICAgICAgICAgICAgICAgICAgICAgIEluIHRoZSBvYmplY3QgY2FzZSwgdGhlIHZhbHVlcyBhcmUgY29uZGl0aW9ucyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgICAgICBkZXRlcm1pbmUgaWYgdGhlIGNsYXNzTmFtZSBrZXlzIHNob3VsZCBiZSBpbmNsdWRlZC5cbiAqIEBwYXJhbSBbc3RyaW5nIC4uLl0gIFZhcmlhYmxlIGxpc3Qgb2YgY2xhc3NOYW1lcyBpbiB0aGUgc3RyaW5nIGNhc2UuXG4gKiBAcmV0dXJuIHN0cmluZyAgICAgICBSZW5kZXJhYmxlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NOYW1lLlxuICovXG5mdW5jdGlvbiBjeChjbGFzc05hbWVzKSB7XG4gIGlmICh0eXBlb2YgY2xhc3NOYW1lcyA9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhjbGFzc05hbWVzKS5maWx0ZXIoZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gY2xhc3NOYW1lc1tjbGFzc05hbWVdO1xuICAgIH0pLmpvaW4oJyAnKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmpvaW4uY2FsbChhcmd1bWVudHMsICcgJyk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjeDsiLCIvKipcbiAqIFJlYWN0IGNsb25lV2l0aFByb3BzXG4gKlxuICogQ29weXJpZ2h0IDIwMTMtMjAxNCBGYWNlYm9vaywgSW5jLlxuICogQGxpY2VuY2UgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvTElDRU5TRVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBtb2RpZmllZCB2ZXJzaW9ucyBvZjpcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvdXRpbHMvY2xvbmVXaXRoUHJvcHMuanNcbiAqICBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvYmxvYi8wLjExLXN0YWJsZS9zcmMvY29yZS9SZWFjdFByb3BUcmFuc2ZlcmVyLmpzXG4gKiAgaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL3JlYWN0L2Jsb2IvMC4xMS1zdGFibGUvc3JjL3V0aWxzL2pvaW5DbGFzc2VzLmpzXG4gKlxuICogVE9ETzogVGhpcyBzaG91bGQgYmUgcmVwbGFjZWQgYXMgc29vbiBhcyBjbG9uZVdpdGhQcm9wcyBpcyBhdmFpbGFibGUgdmlhXG4gKiAgdGhlIGNvcmUgUmVhY3QgcGFja2FnZSBvciBhIHNlcGFyYXRlIHBhY2thZ2UuXG4gKiAgQHNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVhY3QvaXNzdWVzLzE5MDZcbiAqXG4gKi9cblxudmFyIFJlYWN0ID0gKHdpbmRvdy5SZWFjdCB8fCBSZWFjdCk7XG52YXIgbWVyZ2UgPSByZXF1aXJlKCcuL21lcmdlJyk7XG5cbi8qKlxuICogQ29tYmluZXMgbXVsdGlwbGUgY2xhc3NOYW1lIHN0cmluZ3MgaW50byBvbmUuXG4gKiBodHRwOi8vanNwZXJmLmNvbS9qb2luY2xhc3Nlcy1hcmdzLXZzLWFycmF5XG4gKlxuICogQHBhcmFtIHsuLi4/c3RyaW5nfSBjbGFzc2VzXG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGpvaW5DbGFzc2VzKGNsYXNzTmFtZS8qLCAuLi4gKi8pIHtcbiAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICBjbGFzc05hbWUgPSAnJztcbiAgfVxuICB2YXIgbmV4dENsYXNzO1xuICB2YXIgYXJnTGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgaWYgKGFyZ0xlbmd0aCA+IDEpIHtcbiAgICBmb3IgKHZhciBpaSA9IDE7IGlpIDwgYXJnTGVuZ3RoOyBpaSsrKSB7XG4gICAgICBuZXh0Q2xhc3MgPSBhcmd1bWVudHNbaWldO1xuICAgICAgbmV4dENsYXNzICYmIChjbGFzc05hbWUgKz0gJyAnICsgbmV4dENsYXNzKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdHJhbnNmZXIgc3RyYXRlZ3kgdGhhdCB3aWxsIG1lcmdlIHByb3AgdmFsdWVzIHVzaW5nIHRoZSBzdXBwbGllZFxuICogYG1lcmdlU3RyYXRlZ3lgLiBJZiBhIHByb3Agd2FzIHByZXZpb3VzbHkgdW5zZXQsIHRoaXMganVzdCBzZXRzIGl0LlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IG1lcmdlU3RyYXRlZ3lcbiAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KG1lcmdlU3RyYXRlZ3kpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHByb3BzLCBrZXksIHZhbHVlKSB7XG4gICAgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBwcm9wc1trZXldID0gdmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb3BzW2tleV0gPSBtZXJnZVN0cmF0ZWd5KHByb3BzW2tleV0sIHZhbHVlKTtcbiAgICB9XG4gIH07XG59XG5cbnZhciB0cmFuc2ZlclN0cmF0ZWd5TWVyZ2UgPSBjcmVhdGVUcmFuc2ZlclN0cmF0ZWd5KGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gYG1lcmdlYCBvdmVycmlkZXMgdGhlIGZpcnN0IG9iamVjdCdzIChgcHJvcHNba2V5XWAgYWJvdmUpIGtleXMgdXNpbmcgdGhlXG4gIC8vIHNlY29uZCBvYmplY3QncyAoYHZhbHVlYCkga2V5cy4gQW4gb2JqZWN0J3Mgc3R5bGUncyBleGlzdGluZyBgcHJvcEFgIHdvdWxkXG4gIC8vIGdldCBvdmVycmlkZGVuLiBGbGlwIHRoZSBvcmRlciBoZXJlLlxuICByZXR1cm4gbWVyZ2UoYiwgYSk7XG59KTtcblxuZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9XG5cbi8qKlxuICogVHJhbnNmZXIgc3RyYXRlZ2llcyBkaWN0YXRlIGhvdyBwcm9wcyBhcmUgdHJhbnNmZXJyZWQgYnkgYHRyYW5zZmVyUHJvcHNUb2AuXG4gKiBOT1RFOiBpZiB5b3UgYWRkIGFueSBtb3JlIGV4Y2VwdGlvbnMgdG8gdGhpcyBsaXN0IHlvdSBzaG91bGQgYmUgc3VyZSB0b1xuICogdXBkYXRlIGBjbG9uZVdpdGhQcm9wcygpYCBhY2NvcmRpbmdseS5cbiAqL1xudmFyIFRyYW5zZmVyU3RyYXRlZ2llcyA9IHtcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIGBjaGlsZHJlbmAuXG4gICAqL1xuICBjaGlsZHJlbjogZW1wdHlGdW5jdGlvbixcbiAgLyoqXG4gICAqIFRyYW5zZmVyIHRoZSBgY2xhc3NOYW1lYCBwcm9wIGJ5IG1lcmdpbmcgdGhlbS5cbiAgICovXG4gIGNsYXNzTmFtZTogY3JlYXRlVHJhbnNmZXJTdHJhdGVneShqb2luQ2xhc3NlcyksXG4gIC8qKlxuICAgKiBOZXZlciB0cmFuc2ZlciB0aGUgYGtleWAgcHJvcC5cbiAgICovXG4gIGtleTogZW1wdHlGdW5jdGlvbixcbiAgLyoqXG4gICAqIE5ldmVyIHRyYW5zZmVyIHRoZSBgcmVmYCBwcm9wLlxuICAgKi9cbiAgcmVmOiBlbXB0eUZ1bmN0aW9uLFxuICAvKipcbiAgICogVHJhbnNmZXIgdGhlIGBzdHlsZWAgcHJvcCAod2hpY2ggaXMgYW4gb2JqZWN0KSBieSBtZXJnaW5nIHRoZW0uXG4gICAqL1xuICBzdHlsZTogdHJhbnNmZXJTdHJhdGVneU1lcmdlXG59O1xuXG4vKipcbiAqIE11dGF0ZXMgdGhlIGZpcnN0IGFyZ3VtZW50IGJ5IHRyYW5zZmVycmluZyB0aGUgcHJvcGVydGllcyBmcm9tIHRoZSBzZWNvbmRcbiAqIGFyZ3VtZW50LlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm9wc1xuICogQHBhcmFtIHtvYmplY3R9IG5ld1Byb3BzXG4gKiBAcmV0dXJuIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHRyYW5zZmVySW50byhwcm9wcywgbmV3UHJvcHMpIHtcbiAgZm9yICh2YXIgdGhpc0tleSBpbiBuZXdQcm9wcykge1xuICAgIGlmICghbmV3UHJvcHMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHZhciB0cmFuc2ZlclN0cmF0ZWd5ID0gVHJhbnNmZXJTdHJhdGVnaWVzW3RoaXNLZXldO1xuXG4gICAgaWYgKHRyYW5zZmVyU3RyYXRlZ3kgJiYgVHJhbnNmZXJTdHJhdGVnaWVzLmhhc093blByb3BlcnR5KHRoaXNLZXkpKSB7XG4gICAgICB0cmFuc2ZlclN0cmF0ZWd5KHByb3BzLCB0aGlzS2V5LCBuZXdQcm9wc1t0aGlzS2V5XSk7XG4gICAgfSBlbHNlIGlmICghcHJvcHMuaGFzT3duUHJvcGVydHkodGhpc0tleSkpIHtcbiAgICAgIHByb3BzW3RoaXNLZXldID0gbmV3UHJvcHNbdGhpc0tleV07XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wcztcbn1cblxuLyoqXG4gKiBNZXJnZSB0d28gcHJvcHMgb2JqZWN0cyB1c2luZyBUcmFuc2ZlclN0cmF0ZWdpZXMuXG4gKlxuICogQHBhcmFtIHtvYmplY3R9IG9sZFByb3BzIG9yaWdpbmFsIHByb3BzICh0aGV5IHRha2UgcHJlY2VkZW5jZSlcbiAqIEBwYXJhbSB7b2JqZWN0fSBuZXdQcm9wcyBuZXcgcHJvcHMgdG8gbWVyZ2UgaW5cbiAqIEByZXR1cm4ge29iamVjdH0gYSBuZXcgb2JqZWN0IGNvbnRhaW5pbmcgYm90aCBzZXRzIG9mIHByb3BzIG1lcmdlZC5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgcmV0dXJuIHRyYW5zZmVySW50byhtZXJnZShvbGRQcm9wcyksIG5ld1Byb3BzKTtcbn1cblxudmFyIFJlYWN0UHJvcFRyYW5zZmVyZXIgPSB7XG4gIG1lcmdlUHJvcHM6IG1lcmdlUHJvcHNcbn07XG5cbnZhciBDSElMRFJFTl9QUk9QID0gJ2NoaWxkcmVuJztcblxuLyoqXG4gKiBTb21ldGltZXMgeW91IHdhbnQgdG8gY2hhbmdlIHRoZSBwcm9wcyBvZiBhIGNoaWxkIHBhc3NlZCB0byB5b3UuIFVzdWFsbHlcbiAqIHRoaXMgaXMgdG8gYWRkIGEgQ1NTIGNsYXNzLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBjaGlsZCBjaGlsZCBjb21wb25lbnQgeW91J2QgbGlrZSB0byBjbG9uZVxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzIHByb3BzIHlvdSdkIGxpa2UgdG8gbW9kaWZ5LiBUaGV5IHdpbGwgYmUgbWVyZ2VkXG4gKiBhcyBpZiB5b3UgdXNlZCBgdHJhbnNmZXJQcm9wc1RvKClgLlxuICogQHJldHVybiB7b2JqZWN0fSBhIGNsb25lIG9mIGNoaWxkIHdpdGggcHJvcHMgbWVyZ2VkIGluLlxuICovXG5mdW5jdGlvbiBjbG9uZVdpdGhQcm9wcyhjaGlsZCwgcHJvcHMpIHtcbiAgdmFyIG5ld1Byb3BzID0gUmVhY3RQcm9wVHJhbnNmZXJlci5tZXJnZVByb3BzKHByb3BzLCBjaGlsZC5wcm9wcyk7XG5cbiAgLy8gVXNlIGBjaGlsZC5wcm9wcy5jaGlsZHJlbmAgaWYgaXQgaXMgcHJvdmlkZWQuXG4gIGlmICghbmV3UHJvcHMuaGFzT3duUHJvcGVydHkoQ0hJTERSRU5fUFJPUCkgJiZcbiAgICBjaGlsZC5wcm9wcy5oYXNPd25Qcm9wZXJ0eShDSElMRFJFTl9QUk9QKSkge1xuICAgIG5ld1Byb3BzLmNoaWxkcmVuID0gY2hpbGQucHJvcHMuY2hpbGRyZW47XG4gIH1cblxuICAvLyBIdWdlIGhhY2sgdG8gc3VwcG9ydCBib3RoIHRoZSAwLjEwIEFQSSBhbmQgdGhlIG5ldyB3YXkgb2YgZG9pbmcgdGhpbmdzXG4gIC8vIFRPRE86IHJlbW92ZSB3aGVuIHN1cHBvcnQgZm9yIDAuMTAgaXMgbm8gbG9uZ2VyIG5lZWRlZFxuICBpZiAoUmVhY3QudmVyc2lvbi5pbmRleE9mKCcwLjEwLicpID09PSAwKSB7XG4gICAgcmV0dXJuIGNoaWxkLmNvbnN0cnVjdG9yLkNvbnZlbmllbmNlQ29uc3RydWN0b3IobmV3UHJvcHMpO1xuICB9XG5cblxuICAvLyBUaGUgY3VycmVudCBBUEkgZG9lc24ndCByZXRhaW4gX293bmVyIGFuZCBfY29udGV4dCwgd2hpY2ggaXMgd2h5IHRoaXNcbiAgLy8gZG9lc24ndCB1c2UgUmVhY3REZXNjcmlwdG9yLmNsb25lQW5kUmVwbGFjZVByb3BzLlxuICByZXR1cm4gY2hpbGQuY29uc3RydWN0b3IobmV3UHJvcHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lV2l0aFByb3BzOyIsIi8qKlxuICogU2FmZSBjaGFpbmVkIGZ1bmN0aW9uXG4gKlxuICogV2lsbCBvbmx5IGNyZWF0ZSBhIG5ldyBmdW5jdGlvbiBpZiBuZWVkZWQsXG4gKiBvdGhlcndpc2Ugd2lsbCBwYXNzIGJhY2sgZXhpc3RpbmcgZnVuY3Rpb25zIG9yIG51bGwuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gb25lXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0d29cbiAqIEByZXR1cm5zIHtmdW5jdGlvbnxudWxsfVxuICovXG5mdW5jdGlvbiBjcmVhdGVDaGFpbmVkRnVuY3Rpb24ob25lLCB0d28pIHtcbiAgdmFyIGhhc09uZSA9IHR5cGVvZiBvbmUgPT09ICdmdW5jdGlvbic7XG4gIHZhciBoYXNUd28gPSB0eXBlb2YgdHdvID09PSAnZnVuY3Rpb24nO1xuXG4gIGlmICghaGFzT25lICYmICFoYXNUd28pIHsgcmV0dXJuIG51bGw7IH1cbiAgaWYgKCFoYXNPbmUpIHsgcmV0dXJuIHR3bzsgfVxuICBpZiAoIWhhc1R3bykgeyByZXR1cm4gb25lOyB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNoYWluZWRGdW5jdGlvbigpIHtcbiAgICBvbmUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0d28uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVDaGFpbmVkRnVuY3Rpb247IiwiXG4vKipcbiAqIFNob3J0Y3V0IHRvIGNvbXB1dGUgZWxlbWVudCBzdHlsZVxuICpcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1cbiAqIEByZXR1cm5zIHtDc3NTdHlsZX1cbiAqL1xuZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTdHlsZXMoZWxlbSkge1xuICByZXR1cm4gZWxlbS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWxlbSwgbnVsbCk7XG59XG5cbi8qKlxuICogR2V0IGVsZW1lbnRzIG9mZnNldFxuICpcbiAqIFRPRE86IFJFTU9WRSBKUVVFUlkhXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gRE9NTm9kZVxuICogQHJldHVybnMge3t0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gZ2V0T2Zmc2V0KERPTU5vZGUpIHtcbiAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcbiAgICByZXR1cm4gd2luZG93LmpRdWVyeShET01Ob2RlKS5vZmZzZXQoKTtcbiAgfVxuXG4gIHZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB2YXIgYm94ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuICAvLyBJZiB3ZSBkb24ndCBoYXZlIGdCQ1IsIGp1c3QgdXNlIDAsMCByYXRoZXIgdGhhbiBlcnJvclxuICAvLyBCbGFja0JlcnJ5IDUsIGlPUyAzIChvcmlnaW5hbCBpUGhvbmUpXG4gIGlmICggdHlwZW9mIERPTU5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICBib3ggPSBET01Ob2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0b3A6IGJveC50b3AgKyB3aW5kb3cucGFnZVlPZmZzZXQgLSBkb2NFbGVtLmNsaWVudFRvcCxcbiAgICBsZWZ0OiBib3gubGVmdCArIHdpbmRvdy5wYWdlWE9mZnNldCAtIGRvY0VsZW0uY2xpZW50TGVmdFxuICB9O1xufVxuXG4vKipcbiAqIEdldCBlbGVtZW50cyBwb3NpdGlvblxuICpcbiAqIFRPRE86IFJFTU9WRSBKUVVFUlkhXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbVxuICogQHBhcmFtIHtIVE1MRWxlbWVudD99IG9mZnNldFBhcmVudFxuICogQHJldHVybnMge3t0b3A6IG51bWJlciwgbGVmdDogbnVtYmVyfX1cbiAqL1xuZnVuY3Rpb24gZ2V0UG9zaXRpb24oZWxlbSwgb2Zmc2V0UGFyZW50KSB7XG4gIGlmICh3aW5kb3cualF1ZXJ5KSB7XG4gICAgcmV0dXJuIHdpbmRvdy5qUXVlcnkoZWxlbSkucG9zaXRpb24oKTtcbiAgfVxuXG4gIHZhciBvZmZzZXQsXG4gICAgICBwYXJlbnRPZmZzZXQgPSB7dG9wOiAwLCBsZWZ0OiAwfTtcblxuICAvLyBGaXhlZCBlbGVtZW50cyBhcmUgb2Zmc2V0IGZyb20gd2luZG93IChwYXJlbnRPZmZzZXQgPSB7dG9wOjAsIGxlZnQ6IDB9LCBiZWNhdXNlIGl0IGlzIGl0cyBvbmx5IG9mZnNldCBwYXJlbnRcbiAgaWYgKGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLnBvc2l0aW9uID09PSAnZml4ZWQnICkge1xuICAgIC8vIFdlIGFzc3VtZSB0aGF0IGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyBhdmFpbGFibGUgd2hlbiBjb21wdXRlZCBwb3NpdGlvbiBpcyBmaXhlZFxuICAgIG9mZnNldCA9IGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgfSBlbHNlIHtcbiAgICBpZiAoIW9mZnNldFBhcmVudCkge1xuICAgICAgLy8gR2V0ICpyZWFsKiBvZmZzZXRQYXJlbnRcbiAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudChlbGVtKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgY29ycmVjdCBvZmZzZXRzXG4gICAgb2Zmc2V0ID0gZ2V0T2Zmc2V0KGVsZW0pO1xuICAgIGlmICggb2Zmc2V0UGFyZW50Lm5vZGVOYW1lICE9PSAnSFRNTCcpIHtcbiAgICAgIHBhcmVudE9mZnNldCA9IGdldE9mZnNldChvZmZzZXRQYXJlbnQpO1xuICAgIH1cblxuICAgIC8vIEFkZCBvZmZzZXRQYXJlbnQgYm9yZGVyc1xuICAgIHBhcmVudE9mZnNldC50b3AgKz0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZXMob2Zmc2V0UGFyZW50KS5ib3JkZXJUb3BXaWR0aCwgMTApO1xuICAgIHBhcmVudE9mZnNldC5sZWZ0ICs9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKG9mZnNldFBhcmVudCkuYm9yZGVyTGVmdFdpZHRoLCAxMCk7XG4gIH1cblxuICAvLyBTdWJ0cmFjdCBwYXJlbnQgb2Zmc2V0cyBhbmQgZWxlbWVudCBtYXJnaW5zXG4gIHJldHVybiB7XG4gICAgdG9wOiBvZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCAtIHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGVzKGVsZW0pLm1hcmdpblRvcCwgMTApLFxuICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gcGFyZW50T2Zmc2V0LmxlZnQgLSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlcyhlbGVtKS5tYXJnaW5MZWZ0LCAxMClcbiAgfTtcbn1cblxuLyoqXG4gKiBHZXQgcGFyZW50IGVsZW1lbnRcbiAqXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50P30gZWxlbVxuICogQHJldHVybnMge0hUTUxFbGVtZW50fVxuICovXG5mdW5jdGlvbiBvZmZzZXRQYXJlbnQoZWxlbSkge1xuICB2YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgdmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IGRvY0VsZW07XG5cbiAgd2hpbGUgKCBvZmZzZXRQYXJlbnQgJiYgKCBvZmZzZXRQYXJlbnQubm9kZU5hbWUgIT09ICdIVE1MJyAmJlxuICAgIGdldENvbXB1dGVkU3R5bGVzKG9mZnNldFBhcmVudCkucG9zaXRpb24gPT09ICdzdGF0aWMnICkgKSB7XG4gICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcbiAgfVxuXG4gIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jRWxlbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldENvbXB1dGVkU3R5bGVzOiBnZXRDb21wdXRlZFN0eWxlcyxcbiAgZ2V0T2Zmc2V0OiBnZXRPZmZzZXQsXG4gIGdldFBvc2l0aW9uOiBnZXRQb3NpdGlvbixcbiAgb2Zmc2V0UGFyZW50OiBvZmZzZXRQYXJlbnRcbn07IiwiLyoqXG4gKiBNZXJnZSBoZWxwZXJcbiAqXG4gKiBUT0RPOiB0byBiZSByZXBsYWNlZCB3aXRoIEVTNidzIGBPYmplY3QuYXNzaWduKClgIGZvciBSZWFjdCAwLjEyXG4gKi9cblxuLyoqXG4gKiBTaGFsbG93IG1lcmdlcyB0d28gc3RydWN0dXJlcyBieSBtdXRhdGluZyB0aGUgZmlyc3QgcGFyYW1ldGVyLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvbmUgT2JqZWN0IHRvIGJlIG1lcmdlZCBpbnRvLlxuICogQHBhcmFtIHs/b2JqZWN0fSB0d28gT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICovXG5mdW5jdGlvbiBtZXJnZUludG8ob25lLCB0d28pIHtcbiAgaWYgKHR3byAhPSBudWxsKSB7XG4gICAgZm9yICh2YXIga2V5IGluIHR3bykge1xuICAgICAgaWYgKCF0d28uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIG9uZVtrZXldID0gdHdvW2tleV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2hhbGxvdyBtZXJnZXMgdHdvIHN0cnVjdHVyZXMgaW50byBhIHJldHVybiB2YWx1ZSwgd2l0aG91dCBtdXRhdGluZyBlaXRoZXIuXG4gKlxuICogQHBhcmFtIHs/b2JqZWN0fSBvbmUgT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICogQHBhcmFtIHs/b2JqZWN0fSB0d28gT3B0aW9uYWwgb2JqZWN0IHdpdGggcHJvcGVydGllcyB0byBtZXJnZSBmcm9tLlxuICogQHJldHVybiB7b2JqZWN0fSBUaGUgc2hhbGxvdyBleHRlbnNpb24gb2Ygb25lIGJ5IHR3by5cbiAqL1xuZnVuY3Rpb24gbWVyZ2Uob25lLCB0d28pIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBtZXJnZUludG8ocmVzdWx0LCBvbmUpO1xuICBtZXJnZUludG8ocmVzdWx0LCB0d28pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1lcmdlOyIsIi8vICAgICBVbmRlcnNjb3JlLmpzIDEuNy4wXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDE0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhclxuICAgIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kO1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdC5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS43LjAnO1xuXG4gIC8vIEludGVybmFsIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhbiBlZmZpY2llbnQgKGZvciBjdXJyZW50IGVuZ2luZXMpIHZlcnNpb25cbiAgLy8gb2YgdGhlIHBhc3NlZC1pbiBjYWxsYmFjaywgdG8gYmUgcmVwZWF0ZWRseSBhcHBsaWVkIGluIG90aGVyIFVuZGVyc2NvcmVcbiAgLy8gZnVuY3Rpb25zLlxuICB2YXIgY3JlYXRlQ2FsbGJhY2sgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0LCBhcmdDb3VudCkge1xuICAgIGlmIChjb250ZXh0ID09PSB2b2lkIDApIHJldHVybiBmdW5jO1xuICAgIHN3aXRjaCAoYXJnQ291bnQgPT0gbnVsbCA/IDMgOiBhcmdDb3VudCkge1xuICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSk7XG4gICAgICB9O1xuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG90aGVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmNhbGwoY29udGV4dCwgdmFsdWUsIG90aGVyKTtcbiAgICAgIH07XG4gICAgICBjYXNlIDM6IHJldHVybiBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pO1xuICAgICAgfTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGFjY3VtdWxhdG9yLCB2YWx1ZSwgaW5kZXgsIGNvbGxlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuY2FsbChjb250ZXh0LCBhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBjb2xsZWN0aW9uKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBBIG1vc3RseS1pbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBjYWxsYmFja3MgdGhhdCBjYW4gYmUgYXBwbGllZFxuICAvLyB0byBlYWNoIGVsZW1lbnQgaW4gYSBjb2xsZWN0aW9uLCByZXR1cm5pbmcgdGhlIGRlc2lyZWQgcmVzdWx0IOKAlCBlaXRoZXJcbiAgLy8gaWRlbnRpdHksIGFuIGFyYml0cmFyeSBjYWxsYmFjaywgYSBwcm9wZXJ0eSBtYXRjaGVyLCBvciBhIHByb3BlcnR5IGFjY2Vzc29yLlxuICBfLml0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGNvbnRleHQsIGFyZ0NvdW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBfLmlkZW50aXR5O1xuICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWUpKSByZXR1cm4gY3JlYXRlQ2FsbGJhY2sodmFsdWUsIGNvbnRleHQsIGFyZ0NvdW50KTtcbiAgICBpZiAoXy5pc09iamVjdCh2YWx1ZSkpIHJldHVybiBfLm1hdGNoZXModmFsdWUpO1xuICAgIHJldHVybiBfLnByb3BlcnR5KHZhbHVlKTtcbiAgfTtcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIHJhdyBvYmplY3RzIGluIGFkZGl0aW9uIHRvIGFycmF5LWxpa2VzLiBUcmVhdHMgYWxsXG4gIC8vIHNwYXJzZSBhcnJheS1saWtlcyBhcyBpZiB0aGV5IHdlcmUgZGVuc2UuXG4gIF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBvYmo7XG4gICAgaXRlcmF0ZWUgPSBjcmVhdGVDYWxsYmFjayhpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgdmFyIGksIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA9PT0gK2xlbmd0aCkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGl0ZXJhdGVlKG9ialtpXSwgaSwgb2JqKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAoaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaXRlcmF0ZWUob2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0ZWUgdG8gZWFjaCBlbGVtZW50LlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBbXTtcbiAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gK29iai5sZW5ndGggJiYgXy5rZXlzKG9iaiksXG4gICAgICAgIGxlbmd0aCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICByZXN1bHRzID0gQXJyYXkobGVuZ3RoKSxcbiAgICAgICAgY3VycmVudEtleTtcbiAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICByZXN1bHRzW2luZGV4XSA9IGl0ZXJhdGVlKG9ialtjdXJyZW50S2V5XSwgY3VycmVudEtleSwgb2JqKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0LCA0KTtcbiAgICB2YXIga2V5cyA9IG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgaW5kZXggPSAwLCBjdXJyZW50S2V5O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgaWYgKCFsZW5ndGgpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgICAgbWVtbyA9IG9ialtrZXlzID8ga2V5c1tpbmRleCsrXSA6IGluZGV4KytdO1xuICAgIH1cbiAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGN1cnJlbnRLZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcbiAgICAgIG1lbW8gPSBpdGVyYXRlZShtZW1vLCBvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaik7XG4gICAgfVxuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0ZWUsIG1lbW8sIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGl0ZXJhdGVlID0gY3JlYXRlQ2FsbGJhY2soaXRlcmF0ZWUsIGNvbnRleHQsIDQpO1xuICAgIHZhciBrZXlzID0gb2JqLmxlbmd0aCAhPT0gKyBvYmoubGVuZ3RoICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBpbmRleCA9IChrZXlzIHx8IG9iaikubGVuZ3RoLFxuICAgICAgICBjdXJyZW50S2V5O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgaWYgKCFpbmRleCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgICBtZW1vID0gb2JqW2tleXMgPyBrZXlzWy0taW5kZXhdIDogLS1pbmRleF07XG4gICAgfVxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBtZW1vID0gaXRlcmF0ZWUobWVtbywgb2JqW2N1cnJlbnRLZXldLCBjdXJyZW50S2V5LCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIHByZWRpY2F0ZSA9IF8uaXRlcmF0ZWUocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICBfLnNvbWUob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChwcmVkaWNhdGUodmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHByZWRpY2F0ZSh2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBfLm5lZ2F0ZShfLml0ZXJhdGVlKHByZWRpY2F0ZSkpLCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIHByZWRpY2F0ZSA9IF8uaXRlcmF0ZWUocHJlZGljYXRlLCBjb250ZXh0KTtcbiAgICB2YXIga2V5cyA9IG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoICYmIF8ua2V5cyhvYmopLFxuICAgICAgICBsZW5ndGggPSAoa2V5cyB8fCBvYmopLmxlbmd0aCxcbiAgICAgICAgaW5kZXgsIGN1cnJlbnRLZXk7XG4gICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjdXJyZW50S2V5ID0ga2V5cyA/IGtleXNbaW5kZXhdIDogaW5kZXg7XG4gICAgICBpZiAoIXByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBwcmVkaWNhdGUgPSBfLml0ZXJhdGVlKHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgdmFyIGtleXMgPSBvYmoubGVuZ3RoICE9PSArb2JqLmxlbmd0aCAmJiBfLmtleXMob2JqKSxcbiAgICAgICAgbGVuZ3RoID0gKGtleXMgfHwgb2JqKS5sZW5ndGgsXG4gICAgICAgIGluZGV4LCBjdXJyZW50S2V5O1xuICAgIGZvciAoaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY3VycmVudEtleSA9IGtleXMgPyBrZXlzW2luZGV4XSA6IGluZGV4O1xuICAgICAgaWYgKHByZWRpY2F0ZShvYmpbY3VycmVudEtleV0sIGN1cnJlbnRLZXksIG9iaikpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgIHJldHVybiBfLmluZGV4T2Yob2JqLCB0YXJnZXQpID49IDA7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIF8ucHJvcGVydHkoa2V5KSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIF8ubWF0Y2hlcyhhdHRycykpO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8uZmluZChvYmosIF8ubWF0Y2hlcyhhdHRycykpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IC1JbmZpbml0eSwgbGFzdENvbXB1dGVkID0gLUluZmluaXR5LFxuICAgICAgICB2YWx1ZSwgY29tcHV0ZWQ7XG4gICAgaWYgKGl0ZXJhdGVlID09IG51bGwgJiYgb2JqICE9IG51bGwpIHtcbiAgICAgIG9iaiA9IG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoID8gb2JqIDogXy52YWx1ZXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsdWUgPSBvYmpbaV07XG4gICAgICAgIGlmICh2YWx1ZSA+IHJlc3VsdCkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGl0ZXJhdGVlID0gXy5pdGVyYXRlZShpdGVyYXRlZSwgY29udGV4dCk7XG4gICAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgICAgY29tcHV0ZWQgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgICBpZiAoY29tcHV0ZWQgPiBsYXN0Q29tcHV0ZWQgfHwgY29tcHV0ZWQgPT09IC1JbmZpbml0eSAmJiByZXN1bHQgPT09IC1JbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQgPSBJbmZpbml0eSwgbGFzdENvbXB1dGVkID0gSW5maW5pdHksXG4gICAgICAgIHZhbHVlLCBjb21wdXRlZDtcbiAgICBpZiAoaXRlcmF0ZWUgPT0gbnVsbCAmJiBvYmogIT0gbnVsbCkge1xuICAgICAgb2JqID0gb2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGggPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgaWYgKHZhbHVlIDwgcmVzdWx0KSB7XG4gICAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaXRlcmF0ZWUgPSBfLml0ZXJhdGVlKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgICBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICAgIGlmIChjb21wdXRlZCA8IGxhc3RDb21wdXRlZCB8fCBjb21wdXRlZCA9PT0gSW5maW5pdHkgJiYgcmVzdWx0ID09PSBJbmZpbml0eSkge1xuICAgICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICAgIGxhc3RDb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGEgY29sbGVjdGlvbiwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZVxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBzZXQgPSBvYmogJiYgb2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGggPyBvYmogOiBfLnZhbHVlcyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBzZXQubGVuZ3RoO1xuICAgIHZhciBzaHVmZmxlZCA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaW5kZXggPSAwLCByYW5kOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKDAsIGluZGV4KTtcbiAgICAgIGlmIChyYW5kICE9PSBpbmRleCkgc2h1ZmZsZWRbaW5kZXhdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHNldFtpbmRleF07XG4gICAgfVxuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGEgY29sbGVjdGlvbi5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudC5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKG4gPT0gbnVsbCB8fCBndWFyZCkge1xuICAgICAgaWYgKG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoKSBvYmogPSBfLnZhbHVlcyhvYmopO1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRlZS5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0ZWUgPSBfLml0ZXJhdGVlKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhOiBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQpO1xuICAgICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRlZSh2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwgdmFsdWUsIGtleSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XS5wdXNoKHZhbHVlKTsgZWxzZSByZXN1bHRba2V5XSA9IFt2YWx1ZV07XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XG4gICAgaWYgKF8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0rKzsgZWxzZSByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRlZSA9IF8uaXRlcmF0ZWUoaXRlcmF0ZWUsIGNvbnRleHQsIDEpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdGVlKG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSBsb3cgKyBoaWdoID4+PiAxO1xuICAgICAgaWYgKGl0ZXJhdGVlKGFycmF5W21pZF0pIDwgdmFsdWUpIGxvdyA9IG1pZCArIDE7IGVsc2UgaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gb2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGggPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIFNwbGl0IGEgY29sbGVjdGlvbiBpbnRvIHR3byBhcnJheXM6IG9uZSB3aG9zZSBlbGVtZW50cyBhbGwgc2F0aXNmeSB0aGUgZ2l2ZW5cbiAgLy8gcHJlZGljYXRlLCBhbmQgb25lIHdob3NlIGVsZW1lbnRzIGFsbCBkbyBub3Qgc2F0aXNmeSB0aGUgcHJlZGljYXRlLlxuICBfLnBhcnRpdGlvbiA9IGZ1bmN0aW9uKG9iaiwgcHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgcHJlZGljYXRlID0gXy5pdGVyYXRlZShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgIHZhciBwYXNzID0gW10sIGZhaWwgPSBbXTtcbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHtcbiAgICAgIChwcmVkaWNhdGUodmFsdWUsIGtleSwgb2JqKSA/IHBhc3MgOiBmYWlsKS5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW3Bhc3MsIGZhaWxdO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbMF07XG4gICAgaWYgKG4gPCAwKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIE1hdGgubWF4KDAsIGFycmF5Lmxlbmd0aCAtIChuID09IG51bGwgfHwgZ3VhcmQgPyAxIDogbikpKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAobiA9PSBudWxsIHx8IGd1YXJkKSByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBuID09IG51bGwgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBzdHJpY3QsIG91dHB1dCkge1xuICAgIGlmIChzaGFsbG93ICYmIF8uZXZlcnkoaW5wdXQsIF8uaXNBcnJheSkpIHtcbiAgICAgIHJldHVybiBjb25jYXQuYXBwbHkob3V0cHV0LCBpbnB1dCk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBpbnB1dC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaW5wdXRbaV07XG4gICAgICBpZiAoIV8uaXNBcnJheSh2YWx1ZSkgJiYgIV8uaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICAgIGlmICghc3RyaWN0KSBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKHNoYWxsb3cpIHtcbiAgICAgICAgcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIHN0cmljdCwgb3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIGZhbHNlLCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRlZSwgY29udGV4dCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gW107XG4gICAgaWYgKCFfLmlzQm9vbGVhbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRlZTtcbiAgICAgIGl0ZXJhdGVlID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXRlcmF0ZWUgIT0gbnVsbCkgaXRlcmF0ZWUgPSBfLml0ZXJhdGVlKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2ldO1xuICAgICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICAgIGlmICghaSB8fCBzZWVuICE9PSB2YWx1ZSkgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICBzZWVuID0gdmFsdWU7XG4gICAgICB9IGVsc2UgaWYgKGl0ZXJhdGVlKSB7XG4gICAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdGVlKHZhbHVlLCBpLCBhcnJheSk7XG4gICAgICAgIGlmIChfLmluZGV4T2Yoc2VlbiwgY29tcHV0ZWQpIDwgMCkge1xuICAgICAgICAgIHNlZW4ucHVzaChjb21wdXRlZCk7XG4gICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF8uaW5kZXhPZihyZXN1bHQsIHZhbHVlKSA8IDApIHtcbiAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoZmxhdHRlbihhcmd1bWVudHMsIHRydWUsIHRydWUsIFtdKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiBbXTtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIGFyZ3NMZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGl0ZW0gPSBhcnJheVtpXTtcbiAgICAgIGlmIChfLmNvbnRhaW5zKHJlc3VsdCwgaXRlbSkpIGNvbnRpbnVlO1xuICAgICAgZm9yICh2YXIgaiA9IDE7IGogPCBhcmdzTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCFfLmNvbnRhaW5zKGFyZ3VtZW50c1tqXSwgaXRlbSkpIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGogPT09IGFyZ3NMZW5ndGgpIHJlc3VsdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGZsYXR0ZW4oc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCB0cnVlLCB0cnVlLCBbXSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIFtdO1xuICAgIHZhciBsZW5ndGggPSBfLm1heChhcmd1bWVudHMsICdsZW5ndGgnKS5sZW5ndGg7XG4gICAgdmFyIHJlc3VsdHMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3VtZW50cywgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhbiBpdGVtIGluIGFuIGFycmF5LFxuICAvLyBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGlkeCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAodHlwZW9mIGZyb20gPT0gJ251bWJlcicpIHtcbiAgICAgIGlkeCA9IGZyb20gPCAwID8gaWR4ICsgZnJvbSArIDEgOiBNYXRoLm1pbihpZHgsIGZyb20gKyAxKTtcbiAgICB9XG4gICAgd2hpbGUgKC0taWR4ID49IDApIGlmIChhcnJheVtpZHhdID09PSBpdGVtKSByZXR1cm4gaWR4O1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gc3RlcCB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgcmFuZ2UgPSBBcnJheShsZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgbGVuZ3RoOyBpZHgrKywgc3RhcnQgKz0gc3RlcCkge1xuICAgICAgcmFuZ2VbaWR4XSA9IHN0YXJ0O1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIEN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQmluZCBtdXN0IGJlIGNhbGxlZCBvbiBhIGZ1bmN0aW9uJyk7XG4gICAgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBDdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgQ3RvcjtcbiAgICAgIEN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKF8uaXNPYmplY3QocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gICAgcmV0dXJuIGJvdW5kO1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuIF8gYWN0c1xuICAvLyBhcyBhIHBsYWNlaG9sZGVyLCBhbGxvd2luZyBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzIHRvIGJlIHByZS1maWxsZWQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYm91bmRBcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBwb3NpdGlvbiA9IDA7XG4gICAgICB2YXIgYXJncyA9IGJvdW5kQXJncy5zbGljZSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGFyZ3MubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFyZ3NbaV0gPT09IF8pIGFyZ3NbaV0gPSBhcmd1bWVudHNbcG9zaXRpb24rK107XG4gICAgICB9XG4gICAgICB3aGlsZSAocG9zaXRpb24gPCBhcmd1bWVudHMubGVuZ3RoKSBhcmdzLnB1c2goYXJndW1lbnRzW3Bvc2l0aW9uKytdKTtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhIG51bWJlciBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBSZW1haW5pbmcgYXJndW1lbnRzXG4gIC8vIGFyZSB0aGUgbWV0aG9kIG5hbWVzIHRvIGJlIGJvdW5kLiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXQgYWxsIGNhbGxiYWNrc1xuICAvLyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLCBrZXk7XG4gICAgaWYgKGxlbmd0aCA8PSAxKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXMnKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIG9ialtrZXldID0gXy5iaW5kKG9ialtrZXldLCBvYmopO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vaXplID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgY2FjaGUgPSBtZW1vaXplLmNhY2hlO1xuICAgICAgdmFyIGFkZHJlc3MgPSBoYXNoZXIgPyBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IGtleTtcbiAgICAgIGlmICghXy5oYXMoY2FjaGUsIGFkZHJlc3MpKSBjYWNoZVthZGRyZXNzXSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBjYWNoZVthZGRyZXNzXTtcbiAgICB9O1xuICAgIG1lbW9pemUuY2FjaGUgPSB7fTtcbiAgICByZXR1cm4gbWVtb2l6ZTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBfLm5vdygpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gXy5ub3coKTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcblxuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGxhc3QgPSBfLm5vdygpIC0gdGltZXN0YW1wO1xuXG4gICAgICBpZiAobGFzdCA8IHdhaXQgJiYgbGFzdCA+IDApIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkge1xuICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gXy5ub3coKTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykge1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIF8ucGFydGlhbCh3cmFwcGVyLCBmdW5jKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgbmVnYXRlZCB2ZXJzaW9uIG9mIHRoZSBwYXNzZWQtaW4gcHJlZGljYXRlLlxuICBfLm5lZ2F0ZSA9IGZ1bmN0aW9uKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhcHJlZGljYXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICB2YXIgc3RhcnQgPSBhcmdzLmxlbmd0aCAtIDE7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGkgPSBzdGFydDtcbiAgICAgIHZhciByZXN1bHQgPSBhcmdzW3N0YXJ0XS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgd2hpbGUgKGktLSkgcmVzdWx0ID0gYXJnc1tpXS5jYWxsKHRoaXMsIHJlc3VsdCk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBiZWZvcmUgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYmVmb3JlID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICB2YXIgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA+IDApIHtcbiAgICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gXy5wYXJ0aWFsKF8uYmVmb3JlLCAyKTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIFtdO1xuICAgIGlmIChuYXRpdmVLZXlzKSByZXR1cm4gbmF0aXZlS2V5cyhvYmopO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHZhciBzb3VyY2UsIHByb3A7XG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc291cmNlID0gYXJndW1lbnRzW2ldO1xuICAgICAgZm9yIChwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIHByb3ApKSB7XG4gICAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9LCBrZXk7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXRlcmF0ZWUpKSB7XG4gICAgICBpdGVyYXRlZSA9IGNyZWF0ZUNhbGxiYWNrKGl0ZXJhdGVlLCBjb250ZXh0KTtcbiAgICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgICB2YXIgdmFsdWUgPSBvYmpba2V5XTtcbiAgICAgICAgaWYgKGl0ZXJhdGVlKHZhbHVlLCBrZXksIG9iaikpIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KFtdLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgb2JqID0gbmV3IE9iamVjdChvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKGtleSBpbiBvYmopIHJlc3VsdFtrZXldID0gb2JqW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmosIGl0ZXJhdGVlLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpdGVyYXRlZSkpIHtcbiAgICAgIGl0ZXJhdGVlID0gXy5uZWdhdGUoaXRlcmF0ZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ubWFwKGNvbmNhdC5hcHBseShbXSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSwgU3RyaW5nKTtcbiAgICAgIGl0ZXJhdGVlID0gZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoa2V5cywga2V5KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBfLnBpY2sob2JqLCBpdGVyYXRlZSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIGZvciAodmFyIGkgPSAxLCBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAob2JqW3Byb3BdID09PSB2b2lkIDApIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT09IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgcmVndWxhciBleHByZXNzaW9ucywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgLy8gUmVnRXhwcyBhcmUgY29lcmNlZCB0byBzdHJpbmdzIGZvciBjb21wYXJpc29uIChOb3RlOiAnJyArIC9hL2kgPT09ICcvYS9pJylcbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuICcnICsgYSA9PT0gJycgKyBiO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS5cbiAgICAgICAgLy8gT2JqZWN0KE5hTikgaXMgZXF1aXZhbGVudCB0byBOYU5cbiAgICAgICAgaWYgKCthICE9PSArYSkgcmV0dXJuICtiICE9PSArYjtcbiAgICAgICAgLy8gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvciBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuICthID09PSAwID8gMSAvICthID09PSAxIC8gYiA6ICthID09PSArYjtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PT0gK2I7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT09IGI7XG4gICAgfVxuICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3Rgc1xuICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgIGlmIChcbiAgICAgIGFDdG9yICE9PSBiQ3RvciAmJlxuICAgICAgLy8gSGFuZGxlIE9iamVjdC5jcmVhdGUoeCkgY2FzZXNcbiAgICAgICdjb25zdHJ1Y3RvcicgaW4gYSAmJiAnY29uc3RydWN0b3InIGluIGIgJiZcbiAgICAgICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiBhQ3RvciBpbnN0YW5jZW9mIGFDdG9yICYmXG4gICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcilcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuICAgIHZhciBzaXplLCByZXN1bHQ7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09PSBiLmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGVxKGFbc2l6ZV0sIGJbc2l6ZV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgdmFyIGtleXMgPSBfLmtleXMoYSksIGtleTtcbiAgICAgIHNpemUgPSBrZXlzLmxlbmd0aDtcbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzIGJlZm9yZSBjb21wYXJpbmcgZGVlcCBlcXVhbGl0eS5cbiAgICAgIHJlc3VsdCA9IF8ua2V5cyhiKS5sZW5ndGggPT09IHNpemU7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXJcbiAgICAgICAgICBrZXkgPSBrZXlzW3NpemVdO1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikgfHwgXy5pc0FyZ3VtZW50cyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiBvYmo7XG4gICAgcmV0dXJuIHR5cGUgPT09ICdmdW5jdGlvbicgfHwgdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIF8uZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIF8uaGFzKG9iaiwgJ2NhbGxlZScpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuIFdvcmsgYXJvdW5kIGFuIElFIDExIGJ1Zy5cbiAgaWYgKHR5cGVvZiAvLi8gIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09ICdmdW5jdGlvbicgfHwgZmFsc2U7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9PSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRlZXMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICBfLmNvbnN0YW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcbiAgfTtcblxuICBfLm5vb3AgPSBmdW5jdGlvbigpe307XG5cbiAgXy5wcm9wZXJ0eSA9IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBwcmVkaWNhdGUgZm9yIGNoZWNraW5nIHdoZXRoZXIgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHNldCBvZiBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5tYXRjaGVzID0gZnVuY3Rpb24oYXR0cnMpIHtcbiAgICB2YXIgcGFpcnMgPSBfLnBhaXJzKGF0dHJzKSwgbGVuZ3RoID0gcGFpcnMubGVuZ3RoO1xuICAgIHJldHVybiBmdW5jdGlvbihvYmopIHtcbiAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuICFsZW5ndGg7XG4gICAgICBvYmogPSBuZXcgT2JqZWN0KG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWlyID0gcGFpcnNbaV0sIGtleSA9IHBhaXJbMF07XG4gICAgICAgIGlmIChwYWlyWzFdICE9PSBvYmpba2V5XSB8fCAhKGtleSBpbiBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0ZWUsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgaXRlcmF0ZWUgPSBjcmVhdGVDYWxsYmFjayhpdGVyYXRlZSwgY29udGV4dCwgMSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0ZWUoaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIEEgKHBvc3NpYmx5IGZhc3Rlcikgd2F5IHRvIGdldCB0aGUgY3VycmVudCB0aW1lc3RhbXAgYXMgYW4gaW50ZWdlci5cbiAgXy5ub3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH07XG5cbiAgIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiN4Mjc7JyxcbiAgICAnYCc6ICcmI3g2MDsnXG4gIH07XG4gIHZhciB1bmVzY2FwZU1hcCA9IF8uaW52ZXJ0KGVzY2FwZU1hcCk7XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICB2YXIgY3JlYXRlRXNjYXBlciA9IGZ1bmN0aW9uKG1hcCkge1xuICAgIHZhciBlc2NhcGVyID0gZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgIHJldHVybiBtYXBbbWF0Y2hdO1xuICAgIH07XG4gICAgLy8gUmVnZXhlcyBmb3IgaWRlbnRpZnlpbmcgYSBrZXkgdGhhdCBuZWVkcyB0byBiZSBlc2NhcGVkXG4gICAgdmFyIHNvdXJjZSA9ICcoPzonICsgXy5rZXlzKG1hcCkuam9pbignfCcpICsgJyknO1xuICAgIHZhciB0ZXN0UmVnZXhwID0gUmVnRXhwKHNvdXJjZSk7XG4gICAgdmFyIHJlcGxhY2VSZWdleHAgPSBSZWdFeHAoc291cmNlLCAnZycpO1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZyA9PSBudWxsID8gJycgOiAnJyArIHN0cmluZztcbiAgICAgIHJldHVybiB0ZXN0UmVnZXhwLnRlc3Qoc3RyaW5nKSA/IHN0cmluZy5yZXBsYWNlKHJlcGxhY2VSZWdleHAsIGVzY2FwZXIpIDogc3RyaW5nO1xuICAgIH07XG4gIH07XG4gIF8uZXNjYXBlID0gY3JlYXRlRXNjYXBlcihlc2NhcGVNYXApO1xuICBfLnVuZXNjYXBlID0gY3JlYXRlRXNjYXBlcih1bmVzY2FwZU1hcCk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBgcHJvcGVydHlgIGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQgd2l0aCB0aGVcbiAgLy8gYG9iamVjdGAgYXMgY29udGV4dDsgb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gb2JqZWN0W3Byb3BlcnR5XSgpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHUyMDI4fFxcdTIwMjkvZztcblxuICB2YXIgZXNjYXBlQ2hhciA9IGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdO1xuICB9O1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIC8vIE5COiBgb2xkU2V0dGluZ3NgIG9ubHkgZXhpc3RzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIHNldHRpbmdzLCBvbGRTZXR0aW5ncykge1xuICAgIGlmICghc2V0dGluZ3MgJiYgb2xkU2V0dGluZ3MpIHNldHRpbmdzID0gb2xkU2V0dGluZ3M7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KS5yZXBsYWNlKGVzY2FwZXIsIGVzY2FwZUNoYXIpO1xuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH0gZWxzZSBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9IGVsc2UgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG5cbiAgICAgIC8vIEFkb2JlIFZNcyBuZWVkIHRoZSBtYXRjaCByZXR1cm5lZCB0byBwcm9kdWNlIHRoZSBjb3JyZWN0IG9mZmVzdC5cbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArICdyZXR1cm4gX19wO1xcbic7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB2YXIgYXJndW1lbnQgPSBzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJztcbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIGFyZ3VtZW50ICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24uIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBpbnN0YW5jZSA9IF8ob2JqKTtcbiAgICBpbnN0YW5jZS5fY2hhaW4gPSB0cnVlO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgXy5lYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIF8uZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PT0gJ3NoaWZ0JyB8fCBuYW1lID09PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBfLmVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gIF8ucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gIH07XG5cbiAgLy8gQU1EIHJlZ2lzdHJhdGlvbiBoYXBwZW5zIGF0IHRoZSBlbmQgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBBTUQgbG9hZGVyc1xuICAvLyB0aGF0IG1heSBub3QgZW5mb3JjZSBuZXh0LXR1cm4gc2VtYW50aWNzIG9uIG1vZHVsZXMuIEV2ZW4gdGhvdWdoIGdlbmVyYWxcbiAgLy8gcHJhY3RpY2UgZm9yIEFNRCByZWdpc3RyYXRpb24gaXMgdG8gYmUgYW5vbnltb3VzLCB1bmRlcnNjb3JlIHJlZ2lzdGVyc1xuICAvLyBhcyBhIG5hbWVkIG1vZHVsZSBiZWNhdXNlLCBsaWtlIGpRdWVyeSwgaXQgaXMgYSBiYXNlIGxpYnJhcnkgdGhhdCBpc1xuICAvLyBwb3B1bGFyIGVub3VnaCB0byBiZSBidW5kbGVkIGluIGEgdGhpcmQgcGFydHkgbGliLCBidXQgbm90IGJlIHBhcnQgb2ZcbiAgLy8gYW4gQU1EIGxvYWQgcmVxdWVzdC4gVGhvc2UgY2FzZXMgY291bGQgZ2VuZXJhdGUgYW4gZXJyb3Igd2hlbiBhblxuICAvLyBhbm9ueW1vdXMgZGVmaW5lKCkgaXMgY2FsbGVkIG91dHNpZGUgb2YgYSBsb2FkZXIgcmVxdWVzdC5cbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZSgndW5kZXJzY29yZScsIFtdLCBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBfO1xuICAgIH0pO1xuICB9XG59LmNhbGwodGhpcykpO1xuIiwiUmVhY3QgPSByZXF1aXJlIFwicmVhY3RcIlxuXG5fID0gcmVxdWlyZSBcInVuZGVyc2NvcmVcIlxuYmFja2JvbmUgPSByZXF1aXJlIFwiYmFja2JvbmVcIlxuXG5kYXRhYmFzZSA9IHJlcXVpcmUgXCIuLi9tb2RlbHMvZGF0YWJhc2VcIlxuZGVidWcgPSByZXF1aXJlKFwiZGVidWdcIikoXCJzcWxhZG1pbjphZG1pblwiKVxuXG57ZGl2LCB1bCwgbGksIGF9ID0gUmVhY3QuRE9NXG5cbntDb2x9ID0gcmVxdWlyZSBcInJlYWN0LWJvb3RzdHJhcFwiXG5cbkJhY2tib25lTWl4aW4gPSB7XG4gIGNvbXBvbmVudERpZE1vdW50OiAtPlxuICAgIGZ1bmMgPSAobW9kZWwpIC0+XG4gICAgICBtb2RlbC5vbiBcImFkZCBjaGFuZ2UgcmVtb3ZlXCIsIEBmb3JjZVVwZGF0ZS5iaW5kKEAsIG51bGwpLCBAXG4gICAgQGdldEJhY2tib25lTW9kZWxzKCkuZm9yRWFjaCBmdW5jLCBAXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQ6IC0+XG5cbiAgICBmdW5jID0gKG1vZGVsKSAtPlxuICAgICAgbW9kZWwub2ZmIG51bGwsIG51bGwsIEBcbiAgICBAZ2V0QmFja2JvbmVNb2RlbHMoKS5mb3JFYWNoIGZ1bmMsIEBcbn1cblxuXG5EYXRhYmFzZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyB7XG4gIG1peGluczogW0JhY2tib25lTWl4aW5dXG4gIGdldEluaXRpYWxTdGF0ZTogKCkgLT5cbiAgICB7XG4gICAgICBzZWxlY3RlZDogXCJwb3N0Z3Jlc1wiXG4gICAgfVxuXG4gIGdldEJhY2tib25lTW9kZWxzOiAoKSAtPlxuICAgIFtAcHJvcHMuZGF0YWJhc2VzXVxuXG4gIGNvbXBvbmVudERpZE1vdW50OiAoKSAtPlxuICAgIEBwcm9wcy5kYXRhYmFzZXMuZmV0Y2goKVxuXG5cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgaXRlbXMgPSBAcHJvcHMuZGF0YWJhc2VzLm1hcCAoZGIpID0+XG4gICAgICBkYm5hbWUgPSBkYi5nZXQgXCJuYW1lXCJcbiAgICAgIGFjdGl2ZUNsYXNzID0gaWYgZGJuYW1lIGlzIEBzdGF0ZS5zZWxlY3RlZCB0aGVuIFwiYWN0aXZlXCIgZWxzZSBcIlwiXG4gICAgICBpdGVtT3B0cyA9IHtcbiAgICAgICAgY2xhc3NOYW1lOiBcImxpc3QtZ3JvdXAtaXRlbSAje2FjdGl2ZUNsYXNzfVwiXG4gICAgICAgIGhyZWY6XCJqYXZzY3JpcHQ6O1wiXG4gICAgICB9XG4gICAgICBhIHsgIH0sIGRiLmdldCBcIm5hbWVcIlxuICAgIGRpdiB7IGNsYXNzTmFtZTogXCJsaXN0LWdyb3VwXCIgfSxcbiAgICAgIGl0ZW1zXG5cbn1cblxuXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlYWN0LmNyZWF0ZUNsYXNzIHtcbiAgcmVuZGVyOiAoKSAtPlxuICAgIGRpdiB7IGNsYXNzTmFtZTogXCJjb250YWluZXJcIn0sXG4gICAgICBEYXRhYmFzZUxpc3QgeyBkYXRhYmFzZXM6IG5ldyBkYXRhYmFzZS5jb2xsZWN0aW9uKCkgfVxufVxuIl19
