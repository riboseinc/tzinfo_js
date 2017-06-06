(function ($) {

  var tzi,
  BinarySearch = {
    /*
     * returns smallest index between l and r (inclusive) for which predicate
     * is true assuming that predicate transitions from false to true
     * monotonically
     */
    genericFirstTrue: function (l, r, predicate) {
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
        if (x == l) {
          return r;
        }

        if (predicate(x)) {
          r = x;
        } else {
          l = x;
        }
      }
    }
  };

  TZInfo = tzi = {
    // make UTC as default zone and always be findable
    d : {
      "UTC": {
        "offsets"     :[[0, "UTC"]],
        "transitions" : ""
      }
    },

    Zone : function () {
      return this.initialize.apply(this, arguments);
    },

    Period : function () {
      return this.initialize.apply(this, arguments);
    },

    findZone : function (dataOrName) {
      if (typeof dataOrName === 'string') {
        dataOrName = this.d[dataOrName];
      }

      return dataOrName;
    },

    host : function () {
      return "";
    },

    url : function () {
      // Host has already been included in packages.rb
      return [
        "assets",
        "tzinfo_js",
        "definitions"
      ].join("/");
    },

    /*
     * Override this function to specify your own zone url, e.g.,
     * $i.AL.Assets.tzinfo[zoneName]
     */
    zoneUrl : function (zoneName) {
      return [
        TZInfo.url(),
        (zoneName + ".js")
      ].join("/");
    },

    zoneScriptTag : function (zoneName) {
      var script_id = "user_tzinfo_js_script",
        script_tag;

      script_tag = $("<script>").
        attr("id", script_id).
        attr("type", "text/javascript").
        attr("src", tzi.zoneUrl(zoneName));

      return script_tag;
    },

    /* TODO: DRY using $i.AL */
    // load a single zone every time on demand
    loadZone : function (zoneName, callback) {
      var script_id = "user_tzinfo_js_script",
        old_script_tag = $("#" + script_id),
        script_tag = tzi.zoneScriptTag(zoneName);

      /* remove the old script tag */
      if (old_script_tag.length) {
        old_script_tag.remove();
      }

      if (callback) {
        script_tag.bind("load readystatechange", function(e) {
          var rs = this.readyState;
          if (
            rs &&
            rs != "loaded" &&
            rs != "complete"
          ) {
            return;
          }

          callback(zoneName);
        });
      }

      return $('head').get(0).appendChild(script_tag.get(0));
    }

  };

  $.extend(
    TZInfo.Zone,
    {
      componentNames: 'FullYear Month Date Hours Minutes Seconds Milliseconds'.split(' '),

      getLocalTimeComponents: function (date) {
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
      utcifyLocalTime: function (date) {
        var components = this.getLocalTimeComponents(date);
        return Date.UTC.apply(Date, components)/1000;
      },

      // reverses #utcifyLocalTime, but returns array of time components
      getUTCComponents: function (unixSecondsOrDate) {
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

      toStringBase: function (components) {
        var arr = components.slice(0,-1);
        arr[1] += 1;
        arr = arr.map(function (c) {return c.toPaddedString(2);});
        return arr.slice(0,3).join('-')+'T'+arr.slice(3).join(':');
      }
    }
  );

  $.extend(
    TZInfo.Zone.prototype,
    {
      utcPeriod: {
        0: -10E12,
        totalUTCOffset: 0,
        symbol: 'UTC',
        utcStart: -10E12,
        utcEnd: 10E12,
        localStart: -10E12,
        localEnd: 10E12,
        realizePeriod: function () {
          return this;
        }
      },

      infinityTransition: [10E12],

      initialize: function (data) {
        var self = this,
          shift = 6 * 31 * 24,
          prevTime = -shift,
          transitions,
          pair,
          compressed,
          t;

        data = TZInfo.findZone(data) || TZInfo.findZone('UTC');
        this.offsets = data.offsets;

        if (!data.transitions.length) {
          this.transitions = [this.utcPeriod];
          return;
        }

        transitions = data.transitions.split(' ');
        this.transitions = [];
        $.each(transitions, function (i) {
          if (i % 2 === 1) {
            return;
          }

          pair = [transitions[i], transitions[i + 1]];

          compressed = Number(pair[0]);
          compressed += prevTime + shift;
          prevTime = compressed;
          self.transitions.push([compressed * 3600.0, pair[1]]);
        });

        $.each(this.transitions, function (i) {
          t = self.transitions[i];
          t.realizePeriod = self.realizePeriodFunction;
        });

      },

      realizePeriodFunction: function (self, index) {
        var utcStart = this[0],
          offsetIndex = this[1],
          nextTransition = self.transitions[index + 1] || self.infinityTransition,
          utcEnd = nextTransition[0],
          realized = new TZInfo.Period(self.offsets[offsetIndex], utcStart, utcEnd);

        self.transitions[index] = realized;
        return realized;
      },

      readPeriod: function (index) {
        return this.transitions[index].realizePeriod(this, index);
      },

      periodForUTC: function (unixSeconds) {
        unixSeconds = Number(unixSeconds);

        if (isNaN(unixSeconds)) {
          return this.utcPeriod;
        }

        var index = BinarySearch.genericFirstTrue(
          0,
          this.transitions.length - 1,
          (function (i) {
            return unixSeconds < this.readPeriod(i).utcEnd;
          }).bind(this)
        );

        return this.readPeriod(index);
      },

      periodsForLocal: function (date) {
        var utcifiedLocal = TZInfo.Zone.utcifyLocalTime(date),
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
          (function (i) {
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

      utc2localTimeComponents: function (date) {
        var unixSeconds = date.valueOf() / 1000,
          period = this.periodForUTC(unixSeconds);

        return TZInfo.Zone.getUTCComponents(
          unixSeconds + period.totalUTCOffset
        );
      },

      localTime2UTCComponents: function (date) {
        return TZInfo.Zone.getUTCComponents(
          new Date(this.localTime2unixMilliseconds(date))
        );
      },

      localTime2unixMilliseconds: function (date) {
        var periods = this.periodsForLocal(date),
        /*
         * may return two periods if given local time is ambiguous due to
         * jumping back mozilla on my system seem to prefer earlier period
         * which is consistent with server behaviour, so are we
         */
          period = periods[0],
          unixSeconds = TZInfo.Zone.utcifyLocalTime(date) - period.totalUTCOffset;

        return unixSeconds * 1000;
      }
    }
  );

  $.extend(
    TZInfo.Period.prototype,
    {
      initialize: function (offsetData, utcStart, utcEnd) {
        this[0] = utcStart;
        this.totalUTCOffset = offsetData[0];
        this.symbol = offsetData[1];
        this.utcStart = utcStart;
        this.utcEnd = utcEnd;

        // those are utcified
        this.localStart = this.utcStart + this.totalUTCOffset;
        this.localEnd = this.utcEnd + this.totalUTCOffset;
      },

      realizePeriod: function () {
        return this;
      }
    }
  );

  var OriginalDate = Date;
  var $P = OriginalDate.prototype

  $P.utcToCustomTimeZone = function (zone_str) {
    var zone = new TZInfo.Zone(zone_str);
    var period = zone.periodForUTC(TZInfo.Zone.utcifyLocalTime(this));
    var date = new Date(this.getTime());
    date.setMilliseconds(date.getMilliseconds() + period.totalUTCOffset * 1000);
    return date;
  };

  $P.customTimeZoneToUtc = function (zone_str) {
    var zone = new TZInfo.Zone(zone_str);
    var periods = zone.periodsForLocal(this);
    var period;
    $.each(periods, function (i, p) {
      if (!period || period.totalUTCOffset > p.totalUTCOffset) {
        period = p;
      }
    });
    var date = new Date(this.getTime());
    date.setMilliseconds(date.getMilliseconds() - period.totalUTCOffset * 1000);
    return date;
  };

  var prototype = (function () {
    function f() {}
    f.prototype = $P;
    return new f();
  })();

  function localTimeSetter(callback) {
    return function () {
      this.actualizeLocalTime();
      callback.apply(this, arguments);
      this.propagateLocalTimeChange();
      return this.slave.valueOf();
    };
  }

  methods = {
    initialize: function (zone, utcTime) {
      this.zone = zone;
      var slave = this.slave = new OriginalDate();
      if (utcTime) {
        slave.setTime(utcTime);
      }
    },

    getTimezoneOffset: function () {
      var period = this.zone.periodForUTC(this.slave.valueOf());
      return -period.totalUTCOffset / 60;
    },

    valueOf: function () {
      return this.slave.valueOf();
    },

    getTime: function () {
      return this.slave.valueOf();
    },

    setTime: function (unixMilliseconds) {
      this.slave.setTime(Number(unixMilliseconds));
    },

    actualizeLocalTime: function () {
      if (this.actualValue == this.slave.valueOf()) {
        return;
      }

      this.localTimeComponents = this.zone.utc2localTimeComponents(this.slave);
      this.actualValue = this.slave.valueOf();
    },

    propagateLocalTimeChange: function () {
      this.setTime(
        this.zone.localTime2unixMilliseconds(
          this.localTimeComponents
        )
      );
    },

    toString: function () {
      var tzMinutes = -this.getTimezoneOffset(),
        sign,
        zone;

      sign = (tzMinutes < 0) ? '-' : '+';
      tzMinutes = Math.abs(tzMinutes);
      zone = ~~(tzMinutes / 60) * 100;
      zone += ~~(tzMinutes % 60);
      zone = sign + zone.toPaddedString(4);

      this.actualizeLocalTime();
      return TZInfo.Zone.toStringBase(this.localTimeComponents) + zone;
    },

    toDateString: function () {
      return "date string";
    },

    toTimeString: function () {
      return "time string";
    },

    toUTCString: function () {
      return TZInfo.Zone.toStringBase(
        TZInfo.Zone.getUTCComponents(this.slave)
      ) + 'Z';
    },

    toGMTString: function () {
      return this.toUTCString();
    },

    getYear: function () {
      return this.getYear() - 1900;
    },

    setYear: function (number) {
      throw new Error("setYear is long deprecated. Use setFullYear instead");
    },

    toLocaleString: function () {
      return this.toString();
    },

    toLocaleDateString: function () {
      return this.toDateString();
    },

    toLocaleTimeString: function () {
      return this.toTimeString();
    },

    getDay: function () {
      this.actualizeLocalTime();
      return new Date(
        Date.UTC.apply(Date, this.localTimeComponents)
      ).getUTCDay();
    },

    getUTCDay: function () {
      return this.slave.getUTCDay();
    },

    setFullYear: localTimeSetter(function (year, month, date) {
      this.localTimeComponents[0] = year;

      if (arguments.length > 3) {
        arguments.length = 3;
      }

      switch (arguments.length) {
      case 3:
        this.localTimeComponents[2] = date;
      case 2:
        this.localTimeComponents[1] = month;
      }
    }),

    setMonth: localTimeSetter(function (month, date) {
      this.localTimeComponents[1] = month;
      if (arguments.length > 1)
        this.localTimeComponents[2] = date;
    }),

    setHours: localTimeSetter(function (hour, min, sec, ms) {
      this.localTimeComponents[3] = hour;
      if (arguments.length > 4)
        arguments.length = 4;
      switch (arguments.length) {
      case 4:
        this.localTimeComponents[6] = ms;
      case 3:
        this.localTimeComponents[5] = sec;
      case 2:
        this.localTimeComponents[4] = min;
      }
    }),

    setMinutes: localTimeSetter(function (min, sec, ms) {
      this.localTimeComponents[4] = min;

      if (arguments.length > 3) {
        arguments.length = 3;
      }

      switch (arguments.length) {
      case 3:
        this.localTimeComponents[6] = ms;
      case 2:
        this.localTimeComponents[5] = sec;
      }
    }),

    setSeconds: localTimeSetter(function (sec, ms) {
      this.localTimeComponents[5] = sec;

      if (arguments.length > 1) {
        this.localTimeComponents[6] = ms;
      }
    })

  };

  $.each(TZInfo.Zone.componentNames, function (i, name) {
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

  var klass = TZInfo.DateWithZone = prototype.initialize;

  prototype.initialize.klass = klass;
  prototype.initialize.prototype = prototype;

  TZInfo.parseSimpleDateIntoComponents = function (string) {
    string = String(string);

    var match = /^\s*(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(Z|[-+](?:\d|:)+)?)?/.exec(string),
      rv,
      offset;

    if (!match) {
      return null;
    }

    if (match[7] == 'Z') {
      rv = ['utc'];
    } else if ((offset = match[7])) {
      rv = [~~(offset.replace(/:/g,''))];
    } else {
      rv = ['local'];
    }

    if (match[4]) {
      rv.push(~~match[1], ~~match[2] - 1, ~~match[3], ~~match[4], ~~match[5], ~~match[6]);
    } else {
      rv.push(~~match[1], ~~match[2] - 1, ~~match[3]);
    }

    return rv;
  };

  TZInfo.recvServerTime = function (unixMs) {
    var now = this.dateValueAtNow(),
      difference = unixMs - now;

    if (Math.abs(difference) <= 60000) {
      difference = 0;
    }

    this.clockDifference = difference;
  };

  TZInfo.clockDifference = 0;

  TZInfo.dateValueAtNow = function () {
    return (new OriginalDate()).valueOf() + this.clockDifference;
  };

  if (TZInfo.serverTime) {
    TZInfo.recvServerTime(TZInfo.serverTime);
  }

  TZInfo.makeDateWrapper = function (zone) {
    if (!(zone instanceof TZInfo.Zone)) {
      zone = new TZInfo.Zone(zone);
    }

    function wrappedDate(yearOrValue, month, date, hours, minutes, seconds, ms) {
      var value;

      switch (arguments.length) {
      case 0:
        value = TZInfo.dateValueAtNow();
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

      TZInfo.DateWithZone.call(this, zone, value);
    }

    function parse(string) {
      var components = TZInfo.parseSimpleDateIntoComponents(string),
        type,
        utc,
        minutes;

      if (!components && window.DateParser) {
        components = DateParser.parseIntoComponents(string);
      }

      if (!components) {
        throw new Errors("Cannot parse '" + string + "' as date");
      }

      type = components.shift();

      if (type == 'local') {
        return zone.localTime2unixMilliseconds(components);
      }

      utc = OriginalDate.UTC.apply(OriginalDate, components);

      if (type == 'utc') {
        return utc;
      }

      minutes = ~~(type / 100) * 60 + ~~(type % 100);

      return utc - minutes * 60000;
    }

    $.extend(wrappedDate, OriginalDate);
    wrappedDate.UTC = OriginalDate.UTC;
    wrappedDate.parse = parse;
    wrappedDate.prototype = TZInfo.DateWithZone.prototype;

    return wrappedDate;
  };

  TZInfo.replaceDate = function (zone) {
    Date = TZInfo.makeDateWrapper(zone);
  };

  if (window.TZInfoZoneToSet) {
    TZInfo.replaceDate(TZInfoZoneToSet);
  }

})(jQuery);
