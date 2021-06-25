import $ from 'jquery';

interface TZData {
  offsets: Array<[number, string]>;
  transitions: string;
}

function toPaddedString(number: number, length: number, radix = 10): string {
  const string = number.toString(radix ?? 10);
  return Array(length - string.length).fill('0').join('') + string;
}

const root = global,

      BinarySearch = {
      /*
       * returns smallest index between l and r (inclusive) for which predicate
       * is true assuming that predicate transitions from false to true
       * monotonically
       */
        genericFirstTrue : function(l: number, r: number, predicate: (x: number) => boolean): null | number {
          let x;

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
        },
      },

      tzi = {
      // make UTC as default zone and always be findable
        d : {
          UTC : {
            offsets     : [[0, 'UTC']],
            transitions : '',
          },
        },

        findZone : function(dataOrName: TZData | string): TZData {
          let result = dataOrName;
          if (typeof dataOrName === 'string') {
            result = this.d[dataOrName];
          }

          return result;
        },

        host : function(): string {
          return '';
        },

        url : function(): string {
        // Host has already been included in packages.rb
          return [
            'assets',
            'tzinfo_js',
            'definitions',
          ].join('/');
        },

        /*
         * Override this function to specify your own zone url, e.g.,
         * $i.AL.Assets.tzinfo[zoneName]
         */
        zoneUrl : function(zoneName: string): string {
          return [
            tzi.url(),
            `${zoneName}.js`,
          ].join('/');
        },

        zoneScriptTag : function(zoneName: string): JQuery<HTMLElement> {
          const scriptId = 'user_tzinfo_js_script',
                scriptTag = $('<script>').
                  attr('id', scriptId).
                  attr('type', 'text/javascript').
                  attr('src', tzi.zoneUrl(zoneName));

          return scriptTag;
        },

        // load a single zone every time on demand
        loadZone : function(zoneName: string, callback: (x: string) => void): void {
          // import(`@/assets/javascripts/tzinfo_js/definitions/${zoneName}`).
          import('@/assets/javascripts/tzinfo_js/definitions/Etc/UTC').
            then(
              (data) => {
                tzi.d = { ...tzi.d, ...data };
                callback(zoneName);
              },
              (...err) => console.error(...err),
            );
        },

      },

      toStringBase = function(components): string {
        const arr: Array<number> = components.slice(0, -1);
        arr[1] += 1;
        const stringArr = arr.map(function(c) { return toPaddedString(c, 2); });
        return `${stringArr.slice(0, 3).join('-')}T${stringArr.slice(3).join(':')}`;
      };

class Zone {
  constructor(...args: Array<TZData | string>) {
    this.initialize(...args);
  }

  static componentNames = 'FullYear Month Date Hours Minutes Seconds Milliseconds'.split(' ');

  static getLocalTimeComponents(date: Array<number> | Date): Array<number> {
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
      date.getMilliseconds(),
    ];
  }

  /**
   * returns number which represents number of seconds since unix epoch for UTC
   * time which components are equal to given time
   */
  static utcifyLocalTime(date): number {
    const components = this.getLocalTimeComponents(date);
    return Date.UTC(...components) / 1000;
  }

  /**
   * reverses #utcifyLocalTime, but returns array of time components
   */
  static getUTCComponents(unixSecondsOrDate): Array<number> {
    if (!(unixSecondsOrDate instanceof Date)) {
      unixSecondsOrDate = new Date(unixSecondsOrDate * 1000);
    }

    return [
      unixSecondsOrDate.getUTCFullYear(),
      unixSecondsOrDate.getUTCMonth(),
      unixSecondsOrDate.getUTCDate(),
      unixSecondsOrDate.getUTCHours(),
      unixSecondsOrDate.getUTCMinutes(),
      unixSecondsOrDate.getUTCSeconds(),
      unixSecondsOrDate.getUTCMilliseconds(),
    ];
  }

  static toStringBase;

  utcPeriod = {
    0              : -10E12,
    totalUTCOffset : 0,
    symbol         : 'UTC',
    utcStart       : -10E12,
    utcEnd         : 10E12,
    localStart     : -10E12,
    localEnd       : 10E12,
    realizePeriod  : function() {
      return this;
    },
  };

  infinityTransition = [10E12];

  initialize(data): void {
    const shift: number = 6 * 31 * 24;
    let prevTime: number = -shift,
        pair,
        compressed: number,
        t;

    data = root.TZInfo.findZone(data) ?? root.TZInfo.findZone('UTC');
    this.offsets = data.offsets;

    if (data.transitions.length < 1) {
      this.transitions = [this.utcPeriod];
      return;
    }

    const transitions = data.transitions.split(' ');
    this.transitions = [];
    transitions.forEach((_unused, i: number) => {
      if (i % 2 === 1) {
        return;
      }

      pair = [transitions[i], transitions[i + 1]];

      compressed = Number(pair[0]);
      compressed += prevTime + shift;
      prevTime = compressed;
      this.transitions.push([compressed * 3600.0, pair[1]]);
    });

    transitions.forEach((_unused, i) => {
      t = this.transitions[i];
      t.realizePeriod = this.realizePeriodFunction;
    });
  }

  realizePeriodFunction(self, index: number): Period {
    const utcStart = this[0],
          offsetIndex = this[1],
          nextTransition = self.transitions[index + 1] ?? self.infinityTransition,
          utcEnd = nextTransition[0],
          realized = new Period(self.offsets[offsetIndex], utcStart, utcEnd);

    self.transitions[index] = realized;
    return realized;
  }

  readPeriod(index): Period {
    return this.transitions[index].realizePeriod(this, index);
  }

  periodForUTC(unixSeconds): Period {
    unixSeconds = Number(unixSeconds);

    if (isNaN(unixSeconds)) {
      return this.utcPeriod;
    }

    const index: null | number = BinarySearch.genericFirstTrue(
      0,
      this.transitions.length - 1,
      function(i) {
        return unixSeconds < this.readPeriod(i).utcEnd;
      }.bind(this),
    );

    return this.readPeriod(index);
  }

  periodsForLocal(date): Array<Period> {
    const utcifiedLocal = Zone.utcifyLocalTime(date);
    let secondPeriod;

    if (isNaN(utcifiedLocal)) {
      return [this.utcPeriod];
    }

    const index: null | number  = BinarySearch.genericFirstTrue(
            0,
            this.transitions.length - 1,
            function(i) {
              return utcifiedLocal < this.readPeriod(i).localEnd;
            }.bind(this),
          ),

          firstPeriod = this.readPeriod(index);
    // hole. Use previous period
    if (firstPeriod.localStart > utcifiedLocal) {
      if (index !== null && index > 0) {
        return [this.readPeriod(index - 1)];
      }

      return [firstPeriod];
    }

    const rv = [firstPeriod];

    if (index !== null && index + 1 < this.transitions.length) {
      secondPeriod = this.readPeriod(index + 1);
      if (secondPeriod.localStart <= utcifiedLocal && utcifiedLocal < secondPeriod.localEnd) {
        rv.push(secondPeriod);
      }
    }

    return rv;
  }

  utc2localTimeComponents(date): Array<number> {
    const unixSeconds = date.valueOf() / 1000,
          period = this.periodForUTC(unixSeconds);

    return Zone.getUTCComponents(
      unixSeconds + parseInt(period.totalUTCOffset, 10),
    );
  }

  localTime2UTCComponents(date): Array<number> {
    return Zone.getUTCComponents(
      new Date(this.localTime2unixMilliseconds(date)),
    );
  }

  localTime2unixMilliseconds(date): number {
    const periods = this.periodsForLocal(date),
          /*
           * may return two periods if given local time is ambiguous due to
           * jumping back mozilla on my system seem to prefer earlier period
           * which is consistent with server behaviour, so are we
           */
          period = periods[0],
          unixSeconds = Zone.utcifyLocalTime(date) - period.totalUTCOffset;

    return unixSeconds * 1000;
  }
}

tzi.Zone = Zone;

class Period {
  constructor(...args: Array<TZData | string>) {
    this.initialize(...args);
  }

  initialize(offsetData, utcStart, utcEnd): void {
    this[0] = utcStart;
    this.totalUTCOffset = offsetData[0];
    this.symbol = offsetData[1];
    this.utcStart = utcStart;
    this.utcEnd = utcEnd;

    // those are utcified
    this.localStart = parseInt(this.utcStart, 10) + parseInt(this.totalUTCOffset, 10);
    this.localEnd = parseInt(this.utcEnd, 10) + parseInt(this.totalUTCOffset, 10);
  }

  realizePeriod(): Period {
    return this;
  }
}

tzi.Period = Period;

const OriginalDate = Date,
      $P = OriginalDate.prototype;

$P.utcToCustomTimeZone = function(zoneStr) {
  const zone = new Zone(zoneStr),
        period = zone.periodForUTC(Zone.utcifyLocalTime(this)),
        date = new Date(this.getTime());
  date.setMilliseconds(date.getMilliseconds() + period.totalUTCOffset * 1000);
  return date;
};

$P.customTimeZoneToUtc = function(zoneStr) {
  const zone = new Zone(zoneStr),
        periods: Array<Period> = zone.periodsForLocal(this);
  let period: Period | undefined;
  periods.forEach(function(p, i) {
    if (period === undefined || period.totalUTCOffset > p.totalUTCOffset) {
      period = p;
    }
  });
  const date = new Date(this.getTime());
  date.setMilliseconds(date.getMilliseconds() - period.totalUTCOffset * 1000);
  return date;
};

const prototype = (function() {
  function f(): void {}
  f.prototype = $P;
  return new f();
})();

function localTimeSetter(callback) {
  return function(...args) {
    this.actualizeLocalTime();
    callback(...args);
    this.propagateLocalTimeChange();
    return this.slave.valueOf();
  };
}

const methods = {
  initialize : function(zone, utcTime: string | number) {
    this.zone = zone;
    const slave = this.slave = new OriginalDate();
    if (utcTime !== undefined && utcTime !== null) {
      slave.setTime(utcTime);
    }
  },

  getTimezoneOffset : function() {
    const period = this.zone.periodForUTC(this.slave.valueOf());
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
        this.localTimeComponents,
      ),
    );
  },

  toString : function(): string {
    let zone: number;
    const tzMinutes = -this.getTimezoneOffset(),
          sign: string = (tzMinutes < 0) ? '-' : '+',
          absTzMinutes = Math.abs(tzMinutes);

    zone = ~~(absTzMinutes / 60) * 100;
    zone += ~~(absTzMinutes % 60);
    const zoneString = sign + toPaddedString(zone, 4);

    this.actualizeLocalTime();
    return `${toStringBase(this.localTimeComponents)}${zoneString}`;
  },

  toDateString : function() {
    return 'date string';
  },

  toTimeString : function() {
    return 'time string';
  },

  toUTCString : function() {
    return `${toStringBase(Zone.getUTCComponents(this.slave))}Z`;
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
      Date.UTC(...this.localTimeComponents),
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
    if (arguments.length > 1) { this.localTimeComponents[2] = date; }
  }),

  setHours : localTimeSetter(function(hour, min, sec, ms) {
    this.localTimeComponents[3] = hour;
    if (arguments.length > 4) { arguments.length = 4; }
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
  }),

};

Zone.componentNames.forEach(function(name: string, i: number) {
  function localGetter(): number {
    this.actualizeLocalTime();
    return this.localTimeComponents[i];
  }

  function localSetter(value): string {
    this.actualizeLocalTime();
    this.localTimeComponents[i] = Number(value);
    this.propagateLocalTimeChange();
    return this.valueOf();
  }

  function utcGetter(): string {
    return this.slave[`getUTC${name}`]();
  }

  function utcSetter(...args): void {
    return this.slave[`setUTC${name}`](...args);
  }

  methods['get' + name] = localGetter;

  if (typeof methods[`set${name}`] !== 'function') {
    methods['set' + name] = localSetter;
  }

  methods['getUTC' + name] = utcGetter;
  methods['setUTC' + name] = utcSetter;
});

Object.assign(prototype, methods);

const klass = tzi.DateWithZone = prototype.initialize;

prototype.initialize.klass = klass;
prototype.initialize.prototype = prototype;

tzi.parseSimpleDateIntoComponents = function(string: string) {
  string = String(string);

  const match = /^\s*(\d+)-(\d+)-(\d+)(?:T(\d+):(\d+):(\d+)(Z|[-+](?:\d|:)+)?)?/.exec(string);
  let rv,
      offset;

  if (match == null) {
    return null;
  }

  if (match[7] === 'Z') {
    rv = ['utc'];
  }
  else if ((offset = match[7]) !== null) {
    rv = [~~(offset.replace(/:/g, ''))];
  }
  else {
    rv = ['local'];
  }

  if (match[4] !== null) {
    rv.push(~~match[1], ~~match[2] - 1, ~~match[3], ~~match[4], ~~match[5], ~~match[6]);
  }
  else {
    rv.push(~~match[1], ~~match[2] - 1, ~~match[3]);
  }

  return rv;
};

tzi.recvServerTime = function(unixMs: number): void {
  const now = this.dateValueAtNow();
  let difference = unixMs - now;

  if (Math.abs(difference) <= 60000) {
    difference = 0;
  }

  this.clockDifference = difference;
};

tzi.clockDifference = 0;

tzi.dateValueAtNow = function() {
  return parseInt((new OriginalDate()).valueOf(), 10) + parseInt(this.clockDifference, 10);
};

if (typeof tzi.serverTime === 'number') {
  tzi.recvServerTime(tzi.serverTime);
}

tzi.makeDateWrapper = function(zone: tzi.Zone) {
  if (!(zone instanceof tzi.Zone)) {
    zone = new tzi.Zone(zone);
  }

  function wrappedDate(...args): void {
    let value;

    switch (args.length) {
      case 0:
        value = tzi.dateValueAtNow();
        break;
      case 1: {
        const [yearOrValue, _month, _date, _hours, _minutes, _seconds, _ms] = args;
        if (typeof yearOrValue == 'string') { value = parse(yearOrValue); }
        else { value = Number(yearOrValue); }
        break;
      }
      default:
        value = zone.localTime2unixMilliseconds(Array(...args));
    }

    tzi.DateWithZone.call(this, zone, value);
  }

  function parse(string: string): number {
    let components = tzi.parseSimpleDateIntoComponents(string);

    if (
      (components === undefined || components === null) &&
      typeof root.DateParser === 'function'
    ) {
      components = root.DateParser.parseIntoComponents(string);
    }

    if (components === undefined || components === null) {
      throw new Error(`Cannot parse '${string}' as date`);
    }

    const type = components.shift();

    if (type === 'local') {
      return zone.localTime2unixMilliseconds(components);
    }

    const utc = OriginalDate.UTC(...components);

    if (type === 'utc') {
      return utc;
    }

    const minutes = ~~(type / 100) * 60 + ~~(type % 100);

    return utc - minutes * 60000;
  }

  Object.assign(wrappedDate, OriginalDate);
  wrappedDate.UTC = OriginalDate.UTC;
  wrappedDate.parse = parse;
  wrappedDate.prototype = tzi.DateWithZone.prototype;

  return wrappedDate;
};

tzi.replaceDate = function(zone) {
  root.Date = tzi.makeDateWrapper(zone);
};

if (root.TZInfoZoneToSet !== undefined && root.TZInfoZoneToSet !== null) {
  tzi.replaceDate(root.TZInfoZoneToSet);
}

// export service
root.TZInfo = tzi;

/* eslint-disable import/no-unused-modules */
export default tzi;
