(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  }
  else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(
      require('jquery')
    );
  }
  else {
    // Browser globals
    factory(window.jQuery);
  }
})(function($) {
  var root = Function('return this')();

  /**
   * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#polyfill
   */
  if (typeof Object.assign !== 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
      value : function assign(target, varArgs) { // .length of function is 2
        'use strict';
        if (target === null || target === undefined) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource !== null && nextSource !== undefined) {
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable     : true,
      configurable : true
    });
  }

  var BinarySearch = {
        /*
         * returns smallest index between l and r (inclusive) for which predicate
         * is true assuming that predicate transitions from false to true
         * monotonically
         */
        genericFirstTrue : function(l, r, predicate) {
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
            x = (l + r) >> 1;

            /* optimization of (r-l) <= 1 for positive indexes */
            if (x === l) {
              return r;
            }

            if (predicate(x)) {
              r = x;
            }
            else {
              l = x;
            }
          }
        }
      },

      tzi = {
        // make UTC as default zone and always be findable
        d : {
          UTC : {
            offsets     : [[0, 'UTC']],
            transitions : ''
          }
        },

        Zone : function() {
          return this.initialize.apply(this, arguments);
        },

        Period : function() {
          return this.initialize.apply(this, arguments);
        },

        findZone : function(dataOrName) {
          if (typeof dataOrName === 'string') {
            dataOrName = this.d[dataOrName];
          }

          return dataOrName;
        },

        host : function() {
          return '';
        },

        url : function() {
          // Host has already been included in packages.rb
          return [
            'assets',
            'tzinfo_js',
            'definitions'
          ].join('/');
        },

        /*
     * Override this function to specify your own zone url, e.g.,
     * $i.AL.Assets.tzinfo[zoneName]
     */
        zoneUrl : function(zoneName) {
          return [
            tzi.url(),
            (zoneName + '.js')
          ].join('/');
        },

        zoneScriptTag : function(zoneName) {
          var scriptId = 'user_tzinfo_js_script',
              scriptTag;

          scriptTag = $('<script>').
            attr('id', scriptId).
            attr('type', 'text/javascript').
            attr('src', tzi.zoneUrl(zoneName));

          return scriptTag;
        },

        /* TODO: DRY using $i.AL */
        // load a single zone every time on demand
        loadZone : function(zoneName, callback) {
          var scriptId = 'user_tzinfo_js_script',
              oldScriptTag = $('#' + scriptId),
              scriptTag = tzi.zoneScriptTag(zoneName);

          /* remove the old script tag */
          if (oldScriptTag.length) {
            oldScriptTag.remove();
          }

          if (callback) {
            scriptTag.bind('load readystatechange', function(_e) {
              var rs = this.readyState;
              if (
                rs &&
                rs !== 'loaded' &&
                rs !== 'complete'
              ) {
                return;
              }

              callback(zoneName);
            });
          }

          return $('head').get(0).appendChild(scriptTag.get(0));
        }

      };

  $.extend(
    tzi.Zone,
    {
      componentNames : 'FullYear Month Date Hours Minutes Seconds Milliseconds'.split(' '),

      getLocalTimeComponents : function(date) {
        if (date instanceof Array) {
          return date;
        }

        return [
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
          date.getMilliseconds()
        ];
      },

      // returns number which represents number of seconds since unix epoch for UTC time which components
      // are equal to given time
      utcifyLocalTime : function(date) {
        var components = this.getLocalTimeComponents(date);
        return Date.UTC.apply(Date, components)/1000;
      },

      // reverses #utcifyLocalTime, but returns array of time components
      getUTCComponents : function(unixSecondsOrDate) {
        if (!(unixSecondsOrDate instanceof Date)) {
          unixSecondsOrDate = new Date(unixSecondsOrDate*1000);
        }

        return [
          unixSecondsOrDate.getUTCFullYear(),
          unixSecondsOrDate.getUTCMonth(),
          unixSecondsOrDate.getUTCDate(),
          unixSecondsOrDate.getUTCHours(),
          unixSecondsOrDate.getUTCMinutes(),
          unixSecondsOrDate.getUTCSeconds(),
          unixSecondsOrDate.getUTCMilliseconds()
        ];
      },

      toStringBase : function(components) {
        var arr = components.slice(0,-1);
        arr[1] += 1;
        arr = arr.map(function(c) {return c.toPaddedString(2);});
        return arr.slice(0,3).join('-')+'T'+arr.slice(3).join(':');
      }
    }
  );

  $.extend(
    tzi.Zone.prototype,
    {
      utcPeriod : {
        0              : -10E12,
        totalUTCOffset : 0,
        symbol         : 'UTC',
        utcStart       : -10E12,
        utcEnd         : 10E12,
        localStart     : -10E12,
        localEnd       : 10E12,
        realizePeriod  : function() {
          return this;
        }
      },

      infinityTransition : [10E12],

      initialize : function(data) {
        var self = this,
            shift = 6 * 31 * 24,
            prevTime = -shift,
            transitions,
            pair,
            compressed,
            t;

        data = root.TZInfo.findZone(data) || root.TZInfo.findZone('UTC');
        this.offsets = data.offsets;

        if (!data.transitions.length) {
          this.transitions = [this.utcPeriod];
          return;
        }

        transitions = data.transitions.split(' ');
        this.transitions = [];
        transitions.forEach(function(_unused, i) {
          if (i % 2 === 1) {
            return;
          }

          pair = [transitions[i], transitions[i + 1]];

          compressed = Number(pair[0]);
          compressed += prevTime + shift;
          prevTime = compressed;
          self.transitions.push([compressed * 3600.0, pair[1]]);
        });

        transitions.forEach(function(_unused, i) {
          t = self.transitions[i];
          t.realizePeriod = self.realizePeriodFunction;
        });

      },

      realizePeriodFunction : function(self, index) {
        var utcStart = this[0],
            offsetIndex = this[1],
            nextTransition = self.transitions[index + 1] || self.infinityTransition,
            utcEnd = nextTransition[0],
            realized = new root.TZInfo.Period(self.offsets[offsetIndex], utcStart, utcEnd);

        self.transitions[index] = realized;
        return realized;
      },

      readPeriod : function(index) {
        return this.transitions[index].realizePeriod(this, index);
      },

      periodForUTC : function(unixSeconds) {
        unixSeconds = Number(unixSeconds);

        if (isNaN(unixSeconds)) {
          return this.utcPeriod;
        }

        var index = BinarySearch.genericFirstTrue(
          0,
          this.transitions.length - 1,
          (function(i) {
            return unixSeconds < this.readPeriod(i).utcEnd;
          }).bind(this)
        );

        return this.readPeriod(index);
      },

      periodsForLocal : function(date) {
        var utcifiedLocal = root.TZInfo.Zone.utcifyLocalTime(date),
            index,
            firstPeriod,
            rv,
            secondPeriod;


        if (isNaN(utcifiedLocal)) {
          return [this.utcPeriod];
        }

        index = BinarySearch.genericFirstTrue(
          0,
          this.transitions.length-1,
          (function(i) {
            return utcifiedLocal < this.readPeriod(i).localEnd;
          }).bind(this)
        );

        firstPeriod = this.readPeriod(index);
        // hole. Use previous period
        if (firstPeriod.localStart > utcifiedLocal) {
          if (index > 0) {
            return [this.readPeriod(index - 1)];
          }

          return [firstPeriod];
        }

        rv = [firstPeriod];

        if (index + 1 < this.transitions.length) {
          secondPeriod = this.readPeriod(index + 1);
          if (secondPeriod.localStart <= utcifiedLocal && utcifiedLocal < secondPeriod.localEnd) {
            rv.push(secondPeriod);
          }
        }

        return rv;
      },

      utc2localTimeComponents : function(date) {
        var unixSeconds = date.valueOf() / 1000,
            period = this.periodForUTC(unixSeconds);

        return root.TZInfo.Zone.getUTCComponents(
          unixSeconds + period.totalUTCOffset
        );
      },

      localTime2UTCComponents : function(date) {
        return root.TZInfo.Zone.getUTCComponents(
          new Date(this.localTime2unixMilliseconds(date))
        );
      },

      localTime2unixMilliseconds : function(date) {
        var periods = this.periodsForLocal(date),
            /*
           * may return two periods if given local time is ambiguous due to
           * jumping back mozilla on my system seem to prefer earlier period
           * which is consistent with server behaviour, so are we
           */
            period = periods[0],
            unixSeconds = root.TZInfo.Zone.utcifyLocalTime(date) - period.totalUTCOffset;

        return unixSeconds * 1000;
      }
    }
  );

  $.extend(
    tzi.Period.prototype,
    {
      initialize : function(offsetData, utcStart, utcEnd) {
        this[0] = utcStart;
        this.totalUTCOffset = offsetData[0];
        this.symbol = offsetData[1];
        this.utcStart = utcStart;
        this.utcEnd = utcEnd;

        // those are utcified
        this.localStart = this.utcStart + this.totalUTCOffset;
        this.localEnd = this.utcEnd + this.totalUTCOffset;
      },

      realizePeriod : function() {
        return this;
      }
    }
  );

  var OriginalDate = Date,
      $P = OriginalDate.prototype;

  $P.utcToCustomTimeZone = function(zoneStr) {
    var zone = new root.TZInfo.Zone(zoneStr),
        period = zone.periodForUTC(root.TZInfo.Zone.utcifyLocalTime(this)),
        date = new Date(this.getTime());
    date.setMilliseconds(date.getMilliseconds() + period.totalUTCOffset * 1000);
    return date;
  };

  $P.customTimeZoneToUtc = function(zoneStr) {
    var zone = new root.TZInfo.Zone(zoneStr),
        periods = zone.periodsForLocal(this),
        period;
    periods.forEach(function(p, i) {
      if (!period || period.totalUTCOffset > p.totalUTCOffset) {
        period = p;
      }
    });
    var date = new Date(this.getTime());
    date.setMilliseconds(date.getMilliseconds() - period.totalUTCOffset * 1000);
    return date;
  };

  var prototype = (function() {
    function f() {}
    f.prototype = $P;
    return new f();
  })();

  function localTimeSetter(callback) {
    return function() {
      this.actualizeLocalTime();
      callback.apply(this, arguments);
      this.propagateLocalTimeChange();
      return this.slave.valueOf();
    };
  }

  var methods = {
    initialize : function(zone, utcTime) {
      this.zone = zone;
      var slave = this.slave = new OriginalDate();
      if (utcTime) {
        slave.setTime(utcTime);
      }
    },

    getTimezoneOffset : function() {
      var period = this.zone.periodForUTC(this.slave.valueOf());
      return -period.totalUTCOffset / 60;
    },

    valueOf : function() {
      return this.slave.valueOf();
    },

    getTime : function() {
      return this.slave.valueOf();
    },

    setTime : function(unixMilliseconds) {
      this.slave.setTime(Number(unixMilliseconds));
    },

    actualizeLocalTime : function() {
      if (this.actualValue === this.slave.valueOf()) {
        return;
      }

      this.localTimeComponents = this.zone.utc2localTimeComponents(this.slave);
      this.actualValue = this.slave.valueOf();
    },

    propagateLocalTimeChange : function() {
      this.setTime(
        this.zone.localTime2unixMilliseconds(
          this.localTimeComponents
        )
      );
    },

    toString : function() {
      var tzMinutes = -this.getTimezoneOffset(),
          sign,
          zone;

      sign = (tzMinutes < 0) ? '-' : '+';
      tzMinutes = Math.abs(tzMinutes);
      zone = ~~(tzMinutes / 60) * 100;
      zone += ~~(tzMinutes % 60);
      zone = sign + zone.toPaddedString(4);

      this.actualizeLocalTime();
      return root.TZInfo.Zone.toStringBase(this.localTimeComponents) + zone;
    },

    toDateString : function() {
      return 'date string';
    },

    toTimeString : function() {
      return 'time string';
    },

    toUTCString : function() {
      return root.TZInfo.Zone.toStringBase(
        root.TZInfo.Zone.getUTCComponents(this.slave)
      ) + 'Z';
    },

    toGMTString : function() {
      return this.toUTCString();
    },

    getYear : function() {
      return this.getYear() - 1900;
    },

    setYear : function(_number) {
      throw new Error('setYear is long deprecated. Use setFullYear instead');
    },

    toLocaleString : function() {
      return this.toString();
    },

    toLocaleDateString : function() {
      return this.toDateString();
    },

    toLocaleTimeString : function() {
      return this.toTimeString();
    },

    getDay : function() {
      this.actualizeLocalTime();
      return new Date(
        Date.UTC.apply(Date, this.localTimeComponents)
      ).getUTCDay();
    },

    getUTCDay : function() {
      return this.slave.getUTCDay();
    },

    setFullYear : localTimeSetter(function(year, month, date) {
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

    setMonth : localTimeSetter(function(month, date) {
      this.localTimeComponents[1] = month;
      if (arguments.length > 1)
        this.localTimeComponents[2] = date;
    }),

    setHours : localTimeSetter(function(hour, min, sec, ms) {
      this.localTimeComponents[3] = hour;
      if (arguments.length > 4)
        arguments.length = 4;
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

    setMinutes : localTimeSetter(function(min, sec, ms) {
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

    setSeconds : localTimeSetter(function(sec, ms) {
      this.localTimeComponents[5] = sec;

      if (arguments.length > 1) {
        this.localTimeComponents[6] = ms;
      }
    })

  };

  tzi.Zone.componentNames.forEach(function(name, i) {
    function localGetter() {
      this.actualizeLocalTime();
      return this.localTimeComponents[i];
    }

    function localSetter(value) {
      this.actualizeLocalTime();
      this.localTimeComponents[i] = Number(value);
      this.propagateLocalTimeChange();
      return this.valueOf();
    }

    function utcGetter() {
      return this.slave['getUTC'+name].call(this.slave);

    }

    function utcSetter() {
      return this.slave['setUTC'+name].apply(this.slave, arguments);
    }

    methods['get'+name] = localGetter;

    if (!methods['set'+name]) {
      methods['set'+name] = localSetter;
    }

    methods['getUTC'+name] = utcGetter;
    methods['setUTC'+name] = utcSetter;
  });

  $.extend(prototype, methods);

  var klass = tzi.DateWithZone = prototype.initialize;

  prototype.initialize.klass = klass;
  prototype.initialize.prototype = prototype;

  tzi.parseSimpleDateIntoComponents = function(string) {
    string = String(string);

    var match = /^\s*(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(Z|[-+](?:\d|:)+)?)?/.exec(string),
        rv,
        offset;

    if (!match) {
      return null;
    }

    if (match[7] === 'Z') {
      rv = ['utc'];
    }
    else if ((offset = match[7])) {
      rv = [~~(offset.replace(/:/g,''))];
    }
    else {
      rv = ['local'];
    }

    if (match[4]) {
      rv.push(~~match[1], ~~match[2] - 1, ~~match[3], ~~match[4], ~~match[5], ~~match[6]);
    }
    else {
      rv.push(~~match[1], ~~match[2] - 1, ~~match[3]);
    }

    return rv;
  };

  tzi.recvServerTime = function(unixMs) {
    var now = this.dateValueAtNow(),
        difference = unixMs - now;

    if (Math.abs(difference) <= 60000) {
      difference = 0;
    }

    this.clockDifference = difference;
  };

  tzi.clockDifference = 0;

  tzi.dateValueAtNow = function() {
    return (new OriginalDate()).valueOf() + this.clockDifference;
  };

  if (tzi.serverTime) {
    tzi.recvServerTime(tzi.serverTime);
  }

  tzi.makeDateWrapper = function(zone) {
    if (!(zone instanceof tzi.Zone)) {
      zone = new tzi.Zone(zone);
    }

    function wrappedDate(yearOrValue, _month, _date, _hours, _minutes, _seconds, _ms) {
      var value;

      switch (arguments.length) {
        case 0:
          value = tzi.dateValueAtNow();
          break;
        case 1:
          if (typeof(yearOrValue) == 'string')
            value = parse(yearOrValue);
          else
            value = Number(yearOrValue);
          break;
        default:
          value = zone.localTime2unixMilliseconds(Array.apply(Array, arguments));
      }

      tzi.DateWithZone.call(this, zone, value);
    }

    function parse(string) {
      var components = tzi.parseSimpleDateIntoComponents(string),
          type,
          utc,
          minutes;

      if (!components && root.DateParser) {
        components = root.DateParser.parseIntoComponents(string);
      }

      if (!components) {
        throw new Error('Cannot parse \'' + string + '\' as date');
      }

      type = components.shift();

      if (type === 'local') {
        return zone.localTime2unixMilliseconds(components);
      }

      utc = OriginalDate.UTC.apply(OriginalDate, components);

      if (type === 'utc') {
        return utc;
      }

      minutes = ~~(type / 100) * 60 + ~~(type % 100);

      return utc - minutes * 60000;
    }

    $.extend(wrappedDate, OriginalDate);
    wrappedDate.UTC = OriginalDate.UTC;
    wrappedDate.parse = parse;
    wrappedDate.prototype = tzi.DateWithZone.prototype;

    return wrappedDate;
  };

  tzi.replaceDate = function(zone) {
    root.Date = tzi.makeDateWrapper(zone);
  };

  if (root.TZInfoZoneToSet) {
    tzi.replaceDate(root.TZInfoZoneToSet);
  }


  // export service
  root.TZInfo = tzi;

  return root.TZInfo;
});
