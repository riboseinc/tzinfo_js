"use strict";

require("core-js/modules/es.object.keys.js");

require("core-js/modules/es.symbol.js");

require("core-js/modules/es.array.filter.js");

require("core-js/modules/es.object.get-own-property-descriptor.js");

require("core-js/modules/es.object.get-own-property-descriptors.js");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/es.regexp.to-string.js");

require("core-js/modules/es.array.join.js");

require("core-js/modules/es.array.fill.js");

require("core-js/modules/es.array.slice.js");

require("core-js/modules/es.array.map.js");

require("core-js/modules/es.array.concat.js");

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.split.js");

require("core-js/modules/web.dom-collections.for-each.js");

require("core-js/modules/es.number.constructor.js");

require("core-js/modules/es.object.assign.js");

require("core-js/modules/es.string.replace.js");

var _jquery = _interopRequireDefault(require("jquery"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function toPaddedString(number, length) {
  var radix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10;
  var string = number.toString(radix !== null && radix !== void 0 ? radix : 10);
  return Array(length - string.length).fill('0').join('') + string;
}

var root = global,
    BinarySearch = {
  /*
   * returns smallest index between l and r (inclusive) for which predicate
   * is true assuming that predicate transitions from false to true
   * monotonically
   */
  genericFirstTrue: function genericFirstTrue(l, r, predicate) {
    var x;
    /* predicate(r) is false, no true element */

    if (r < l || !predicate(r)) {
      return null;
    }
    /* l is first */


    if (predicate(l)) {
      return l;
    }

    while (true) {
      x = l + r >> 1;
      /* optimization of (r-l) <= 1 for positive indexes */

      if (x === l) {
        return r;
      }

      if (predicate(x)) {
        r = x;
      } else {
        l = x;
      }
    }
  }
},
    tzi = {
  // make UTC as default zone and always be findable
  d: {
    UTC: {
      offsets: [[0, 'UTC']],
      transitions: ''
    }
  },
  findZone: function findZone(dataOrName) {
    var result = dataOrName;

    if (typeof dataOrName === 'string') {
      result = this.d[dataOrName];
    }

    return result;
  },
  host: function host() {
    return '';
  },
  url: function url() {
    // Host has already been included in packages.rb
    return ['assets', 'tzinfo_js', 'definitions'].join('/');
  },

  /*
  * Override this function to specify your own zone url, e.g.,
  * $i.AL.Assets.tzinfo[zoneName]
  */
  zoneUrl: function zoneUrl(zoneName) {
    return [tzi.url(), "".concat(zoneName, ".js")].join('/');
  },
  zoneScriptTag: function zoneScriptTag(zoneName) {
    var scriptTag = (0, _jquery.default)('<script>').attr('id', 'user_tzinfo_js_script').attr('type', 'text/javascript').attr('src', tzi.zoneUrl(zoneName));
    return scriptTag;
  },

  /* TODO: DRY using $i.AL */
  // load a single zone every time on demand
  loadZone: function loadZone(zoneName, callback) {
    var oldScriptTag = $('#' + 'user_tzinfo_js_script'),
        scriptTag = tzi.zoneScriptTag(zoneName);
    /* remove the old script tag */

    if (oldScriptTag.length > 0) {
      oldScriptTag.remove();
    }

    if (typeof callback === 'function') {
      scriptTag.bind('load readystatechange', function () {
        var rs = this.readyState;

        if (rs !== undefined && rs !== null && rs !== 'loaded' && rs !== 'complete') {
          return;
        }

        callback(zoneName);
      });
    }

    return $('head').get(0).appendChild(scriptTag.get(0));
  }
},
    toStringBase = function (components) {
  var arr = components.slice(0, -1);
  arr[1] += 1;
  var stringArr = arr.map(function (c) {
    return toPaddedString(c, 2);
  });
  return "".concat(stringArr.slice(0, 3).join('-'), "T").concat(stringArr.slice(3).join(':'));
};

var Zone = /*#__PURE__*/function () {
  function Zone() {
    (0, _classCallCheck2.default)(this, Zone);
    (0, _defineProperty2.default)(this, "utcPeriod", {
      0: -10E12,
      totalUTCOffset: 0,
      symbol: 'UTC',
      utcStart: -10E12,
      utcEnd: 10E12,
      localStart: -10E12,
      localEnd: 10E12,
      realizePeriod: function realizePeriod() {
        return this;
      }
    });
    (0, _defineProperty2.default)(this, "infinityTransition", [10E12]);
    this.initialize.apply(this, arguments);
  }

  (0, _createClass2.default)(Zone, [{
    key: "initialize",
    value: function initialize(data) {
      var _root$TZInfo$findZone,
          _this = this;

      var shift = 6 * 31 * 24;
      var prevTime = -shift,
          pair,
          compressed,
          t;
      data = (_root$TZInfo$findZone = root.TZInfo.findZone(data)) !== null && _root$TZInfo$findZone !== void 0 ? _root$TZInfo$findZone : root.TZInfo.findZone('UTC');
      this.offsets = data.offsets;

      if (data.transitions.length < 1) {
        this.transitions = [this.utcPeriod];
        return;
      }

      var transitions = data.transitions.split(' ');
      this.transitions = [];
      transitions.forEach(function (_unused, i) {
        if (i % 2 === 1) {
          return;
        }

        pair = [transitions[i], transitions[i + 1]];
        compressed = Number(pair[0]);
        compressed += prevTime + shift;
        prevTime = compressed;

        _this.transitions.push([compressed * 3600.0, pair[1]]);
      });
      transitions.forEach(function (_unused, i) {
        t = _this.transitions[i];
        t.realizePeriod = _this.realizePeriodFunction;
      });
    }
  }, {
    key: "realizePeriodFunction",
    value: function realizePeriodFunction(self, index) {
      var _self$transitions;

      var utcStart = this[0],
          offsetIndex = this[1],
          nextTransition = (_self$transitions = self.transitions[index + 1]) !== null && _self$transitions !== void 0 ? _self$transitions : self.infinityTransition,
          utcEnd = nextTransition[0],
          realized = new Period(self.offsets[offsetIndex], utcStart, utcEnd);
      self.transitions[index] = realized;
      return realized;
    }
  }, {
    key: "readPeriod",
    value: function readPeriod(index) {
      return this.transitions[index].realizePeriod(this, index);
    }
  }, {
    key: "periodForUTC",
    value: function periodForUTC(unixSeconds) {
      unixSeconds = Number(unixSeconds);

      if (isNaN(unixSeconds)) {
        return this.utcPeriod;
      }

      var index = BinarySearch.genericFirstTrue(0, this.transitions.length - 1, function (i) {
        return unixSeconds < this.readPeriod(i).utcEnd;
      }.bind(this));
      return this.readPeriod(index);
    }
  }, {
    key: "periodsForLocal",
    value: function periodsForLocal(date) {
      var utcifiedLocal = Zone.utcifyLocalTime(date);
      var secondPeriod;

      if (isNaN(utcifiedLocal)) {
        return [this.utcPeriod];
      }

      var index = BinarySearch.genericFirstTrue(0, this.transitions.length - 1, function (i) {
        return utcifiedLocal < this.readPeriod(i).localEnd;
      }.bind(this)),
          firstPeriod = this.readPeriod(index); // hole. Use previous period

      if (firstPeriod.localStart > utcifiedLocal) {
        if (index !== null && index > 0) {
          return [this.readPeriod(index - 1)];
        }

        return [firstPeriod];
      }

      var rv = [firstPeriod];

      if (index !== null && index + 1 < this.transitions.length) {
        secondPeriod = this.readPeriod(index + 1);

        if (secondPeriod.localStart <= utcifiedLocal && utcifiedLocal < secondPeriod.localEnd) {
          rv.push(secondPeriod);
        }
      }

      return rv;
    }
  }, {
    key: "utc2localTimeComponents",
    value: function utc2localTimeComponents(date) {
      var unixSeconds = date.valueOf() / 1000,
          period = this.periodForUTC(unixSeconds);
      return Zone.getUTCComponents(unixSeconds + parseInt(period.totalUTCOffset, 10));
    }
  }, {
    key: "localTime2UTCComponents",
    value: function localTime2UTCComponents(date) {
      return Zone.getUTCComponents(new Date(this.localTime2unixMilliseconds(date)));
    }
  }, {
    key: "localTime2unixMilliseconds",
    value: function localTime2unixMilliseconds(date) {
      var periods = this.periodsForLocal(date),

      /*
       * may return two periods if given local time is ambiguous due to
       * jumping back mozilla on my system seem to prefer earlier period
       * which is consistent with server behaviour, so are we
       */
      period = periods[0],
          unixSeconds = Zone.utcifyLocalTime(date) - period.totalUTCOffset;
      return unixSeconds * 1000;
    }
  }], [{
    key: "getLocalTimeComponents",
    value: function getLocalTimeComponents(date) {
      if (date instanceof Array) {
        return date;
      }

      return [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()];
    }
    /**
     * returns number which represents number of seconds since unix epoch for UTC
     * time which components are equal to given time
     */

  }, {
    key: "utcifyLocalTime",
    value: function utcifyLocalTime(date) {
      var components = this.getLocalTimeComponents(date);
      return Date.UTC.apply(Date, (0, _toConsumableArray2.default)(components)) / 1000;
    }
    /**
     * reverses #utcifyLocalTime, but returns array of time components
     */

  }, {
    key: "getUTCComponents",
    value: function getUTCComponents(unixSecondsOrDate) {
      if (!(unixSecondsOrDate instanceof Date)) {
        unixSecondsOrDate = new Date(unixSecondsOrDate * 1000);
      }

      return [unixSecondsOrDate.getUTCFullYear(), unixSecondsOrDate.getUTCMonth(), unixSecondsOrDate.getUTCDate(), unixSecondsOrDate.getUTCHours(), unixSecondsOrDate.getUTCMinutes(), unixSecondsOrDate.getUTCSeconds(), unixSecondsOrDate.getUTCMilliseconds()];
    }
  }]);
  return Zone;
}();

(0, _defineProperty2.default)(Zone, "componentNames", 'FullYear Month Date Hours Minutes Seconds Milliseconds'.split(' '));
(0, _defineProperty2.default)(Zone, "toStringBase", void 0);
tzi.Zone = Zone;

var Period = /*#__PURE__*/function () {
  function Period() {
    (0, _classCallCheck2.default)(this, Period);
    this.initialize.apply(this, arguments);
  }

  (0, _createClass2.default)(Period, [{
    key: "initialize",
    value: function initialize(offsetData, utcStart, utcEnd) {
      this[0] = utcStart;
      this.totalUTCOffset = offsetData[0];
      this.symbol = offsetData[1];
      this.utcStart = utcStart;
      this.utcEnd = utcEnd; // those are utcified

      this.localStart = parseInt(this.utcStart, 10) + parseInt(this.totalUTCOffset, 10);
      this.localEnd = parseInt(this.utcEnd, 10) + parseInt(this.totalUTCOffset, 10);
    }
  }, {
    key: "realizePeriod",
    value: function realizePeriod() {
      return this;
    }
  }]);
  return Period;
}();

tzi.Period = Period;
var OriginalDate = Date,
    $P = OriginalDate.prototype;

$P.utcToCustomTimeZone = function (zoneStr) {
  var zone = new Zone(zoneStr),
      period = zone.periodForUTC(Zone.utcifyLocalTime(this)),
      date = new Date(this.getTime());
  date.setMilliseconds(date.getMilliseconds() + period.totalUTCOffset * 1000);
  return date;
};

$P.customTimeZoneToUtc = function (zoneStr) {
  var zone = new Zone(zoneStr),
      periods = zone.periodsForLocal(this);
  var period;
  periods.forEach(function (p) {
    if (period === undefined || period.totalUTCOffset > p.totalUTCOffset) {
      period = p;
    }
  });
  var date = new Date(this.getTime());
  date.setMilliseconds(date.getMilliseconds() - period.totalUTCOffset * 1000);
  return date;
};

var prototype = function () {
  function f() {}

  f.prototype = $P;
  return new f();
}();

function localTimeSetter(callback) {
  return function () {
    this.actualizeLocalTime();
    callback.apply(void 0, arguments);
    this.propagateLocalTimeChange();
    return this.slave.valueOf();
  };
}

var methods = {
  initialize: function initialize(zone, utcTime) {
    this.zone = zone;
    var slave = this.slave = new OriginalDate();

    if (utcTime !== undefined && utcTime !== null) {
      slave.setTime(utcTime);
    }
  },
  getTimezoneOffset: function getTimezoneOffset() {
    var period = this.zone.periodForUTC(this.slave.valueOf());
    return -period.totalUTCOffset / 60;
  },
  valueOf: function valueOf() {
    return this.slave.valueOf();
  },
  getTime: function getTime() {
    return this.slave.valueOf();
  },
  setTime: function setTime(unixMilliseconds) {
    this.slave.setTime(Number(unixMilliseconds));
  },
  actualizeLocalTime: function actualizeLocalTime() {
    if (this.actualValue === this.slave.valueOf()) {
      return;
    }

    this.localTimeComponents = this.zone.utc2localTimeComponents(this.slave);
    this.actualValue = this.slave.valueOf();
  },
  propagateLocalTimeChange: function propagateLocalTimeChange() {
    this.setTime(this.zone.localTime2unixMilliseconds(this.localTimeComponents));
  },
  toString: function toString() {
    var zone;
    var tzMinutes = -this.getTimezoneOffset(),
        sign = tzMinutes < 0 ? '-' : '+',
        absTzMinutes = Math.abs(tzMinutes);
    zone = ~~(absTzMinutes / 60) * 100;
    zone += ~~(absTzMinutes % 60);
    var zoneString = sign + toPaddedString(zone, 4);
    this.actualizeLocalTime();
    return "".concat(toStringBase(this.localTimeComponents)).concat(zoneString);
  },
  toDateString: function toDateString() {
    return 'date string';
  },
  toTimeString: function toTimeString() {
    return 'time string';
  },
  toUTCString: function toUTCString() {
    return "".concat(toStringBase(Zone.getUTCComponents(this.slave)), "Z");
  },
  toGMTString: function toGMTString() {
    return this.toUTCString();
  },
  getYear: function getYear() {
    return this.getYear() - 1900;
  },
  setYear: function setYear() {
    throw new Error('setYear is long deprecated. Use setFullYear instead');
  },
  toLocaleString: function toLocaleString() {
    return this.toString();
  },
  toLocaleDateString: function toLocaleDateString() {
    return this.toDateString();
  },
  toLocaleTimeString: function toLocaleTimeString() {
    return this.toTimeString();
  },
  getDay: function getDay() {
    this.actualizeLocalTime();
    return new Date(Date.UTC.apply(Date, (0, _toConsumableArray2.default)(this.localTimeComponents))).getUTCDay();
  },
  getUTCDay: function getUTCDay() {
    return this.slave.getUTCDay();
  },
  setFullYear: localTimeSetter(function (year, month, date) {
    this.localTimeComponents[0] = year;

    if (arguments.length > 3) {
      arguments.length = 3;
    }
    /* eslint-disable no-fallthrough */


    switch (arguments.length) {
      case 3:
        this.localTimeComponents[2] = date;

      case 2:
        this.localTimeComponents[1] = month;
    }
    /* eslint-enable no-fallthrough */

  }),
  setMonth: localTimeSetter(function (month, date) {
    this.localTimeComponents[1] = month;

    if (arguments.length > 1) {
      this.localTimeComponents[2] = date;
    }
  }),
  setHours: localTimeSetter(function (hour, min, sec, ms) {
    this.localTimeComponents[3] = hour;

    if (arguments.length > 4) {
      arguments.length = 4;
    }
    /* eslint-disable no-fallthrough */


    switch (arguments.length) {
      case 4:
        this.localTimeComponents[6] = ms;

      case 3:
        this.localTimeComponents[5] = sec;

      case 2:
        this.localTimeComponents[4] = min;
    }
    /* eslint-enable no-fallthrough */

  }),
  setMinutes: localTimeSetter(function (min, sec, ms) {
    this.localTimeComponents[4] = min;

    if (arguments.length > 3) {
      arguments.length = 3;
    }
    /* eslint-disable no-fallthrough */


    switch (arguments.length) {
      case 3:
        this.localTimeComponents[6] = ms;

      case 2:
        this.localTimeComponents[5] = sec;
    }
    /* eslint-enable no-fallthrough */

  }),
  setSeconds: localTimeSetter(function (sec, ms) {
    this.localTimeComponents[5] = sec;

    if (arguments.length > 1) {
      this.localTimeComponents[6] = ms;
    }
  })
};
Zone.componentNames.forEach(function (name, i) {
  function localSetter(value) {
    this.actualizeLocalTime();
    this.localTimeComponents[i] = Number(value);
    this.propagateLocalTimeChange();
    return this.valueOf();
  }

  methods['get' + name] = function () {
    this.actualizeLocalTime();
    return this.localTimeComponents[i];
  };

  if (typeof methods["set".concat(name)] !== 'function') {
    methods['set' + name] = localSetter;
  }

  methods['getUTC' + name] = function () {
    return this.slave["getUTC".concat(name)]();
  };

  methods['setUTC' + name] = function () {
    var _this$slave;

    return (_this$slave = this.slave)["setUTC".concat(name)].apply(_this$slave, arguments);
  };
});
Object.assign(prototype, methods);
var klass = tzi.DateWithZone = prototype.initialize;
prototype.initialize.klass = klass;
prototype.initialize.prototype = prototype;

tzi.parseSimpleDateIntoComponents = function (string) {
  string = String(string);
  var match = /^\s*(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(Z|[-+](?:\d|:)+)?)?/.exec(string);
  var rv, offset;

  if (match == null) {
    return null;
  }

  if (match[7] === 'Z') {
    rv = ['utc'];
  } else if ((offset = match[7]) !== null) {
    rv = [~~offset.replace(/:/g, '')];
  } else {
    rv = ['local'];
  }

  if (match[4] !== null) {
    rv.push(~~match[1], ~~match[2] - 1, ~~match[3], ~~match[4], ~~match[5], ~~match[6]);
  } else {
    rv.push(~~match[1], ~~match[2] - 1, ~~match[3]);
  }

  return rv;
};

tzi.recvServerTime = function (unixMs) {
  var now = this.dateValueAtNow();
  var difference = unixMs - now;

  if (Math.abs(difference) <= 60000) {
    difference = 0;
  }

  this.clockDifference = difference;
};

tzi.clockDifference = 0;

tzi.dateValueAtNow = function () {
  return parseInt(new OriginalDate().valueOf(), 10) + parseInt(this.clockDifference, 10);
};

if (typeof tzi.serverTime === 'number') {
  tzi.recvServerTime(tzi.serverTime);
}

tzi.makeDateWrapper = function (zone) {
  if (!(zone instanceof tzi.Zone)) {
    zone = new tzi.Zone(zone);
  }

  function wrappedDate() {
    var value;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    switch (args.length) {
      case 0:
        value = tzi.dateValueAtNow();
        break;

      case 1:
        {
          var yearOrValue = args[0],
              _month = args[1],
              _date = args[2],
              _hours = args[3],
              _minutes = args[4],
              _seconds = args[5],
              _ms = args[6];

          if (typeof yearOrValue == 'string') {
            value = parse(yearOrValue);
          } else {
            value = Number(yearOrValue);
          }

          break;
        }

      default:
        value = zone.localTime2unixMilliseconds(Array.apply(void 0, args));
    }

    tzi.DateWithZone.call(this, zone, value);
  }

  function parse(string) {
    var components = tzi.parseSimpleDateIntoComponents(string);

    if ((components === undefined || components === null) && typeof root.DateParser === 'function') {
      components = root.DateParser.parseIntoComponents(string);
    }

    if (components === undefined || components === null) {
      throw new Error("Cannot parse '".concat(string, "' as date"));
    }

    var type = components.shift();

    if (type === 'local') {
      return zone.localTime2unixMilliseconds(components);
    }

    var utc = OriginalDate.UTC.apply(OriginalDate, (0, _toConsumableArray2.default)(components));

    if (type === 'utc') {
      return utc;
    }

    return utc - (~~(type / 100) * 60 + ~~(type % 100)) * 60000;
  }

  Object.assign(wrappedDate, OriginalDate);
  wrappedDate.UTC = OriginalDate.UTC;
  wrappedDate.parse = parse;
  wrappedDate.prototype = tzi.DateWithZone.prototype;
  return wrappedDate;
};

tzi.replaceDate = function (zone) {
  root.Date = tzi.makeDateWrapper(zone);
};

if (root.TZInfoZoneToSet !== undefined && root.TZInfoZoneToSet !== null) {
  tzi.replaceDate(root.TZInfoZoneToSet);
} // export service


root.TZInfo = tzi;
/* eslint-disable import/no-unused-modules */

var _default = tzi;
exports.default = _default;