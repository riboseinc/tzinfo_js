DateParser = {
  dateFromComponents: function (components) {
    components = components.concat([0,0,0,0,0,0]).slice(0,7);
    return new Date(components[0], components[1], components[2], components[3], components[4], components[5], components[6]);
  },
  __parseIntoComponents: function (rules){// rules must be Array
    var allDay = false;
    var string = rules.shift()||'';
    var base = (rules.length) ? DateParser.dateFromComponents(arguments.callee(rules).parsedDate) : new Date();
    if (string instanceof Date){
      base = string;
      string = '';
    }

    var basePeriods = {
      y: base.getFullYear(),
      m: base.getMonth(),
      d: base.getDate(),
      h: base.getHours(),
      i: base.getMinutes()
    };

    var result = basePeriods;

    string = string.split(/\s/);
    string.reverse();
    string = ' '+string.join(' ');

    var months = {'jan':0,'feb':1,'mar':2,'apr':3,'may':4,'jun':5,'jul':6,'aug':7,'sep':8,'oct':9,'nov':10,'dec':11};
    var days = {'sun':0, 'mon':1, 'tue':2, 'wed':3, 'thu':4, 'fri':5, 'sat':6};

    var strPeriod = 'y(?:ea)?r?s?|m(?:onth)?s?|w(?:eek)?s?|d(?:ay)?s?';
    var strMonth =  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    var strDay = '(?:sun|mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?)(?:day)?';

    var re = null;

    var setPeriod = function(hash, period, value){
      var date = new Date(hash.m+'/'+hash.d+'/'+hash.y);
      switch (period){
        case 'y':
          date.setMonth(hash.m);
          date.setYear(hash.y + value);
        break;
        case 'm': date.setMonth(hash.m + value); break;
        case 'd':
          date.setMonth(hash.m);
          date.setDate(hash.d + value);
        break;
      }
      return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), h: hash.h, i: hash.i };
    };

    var nLoop = function(n, diff, direction, type){
      direction = n*((direction.toLowerCase() == "next") ? 1 : -1);
      if ( diff/direction < 0 ) {
        diff += direction;
      }
      return diff || direction*(1-type);
    };

    var dayExp = function(str, day, direction){
      var type = 1*(arguments.length == 4);
      if (type) {
        direction = "next";
      }
      var delta = nLoop(7, (days[day.slice(0,3)] - base.getDay()), direction, type);
      result = setPeriod(result, 'd', delta);
      return ' ';
    };

    var monthExp = function(str, month, direction){
      var type = 1*(arguments.length == 4);
      if (type) {
        direction = "next";
      }
      var delta = nLoop(12, (months[month.slice(0,3)] - base.getMonth()), direction, type);
      result = setPeriod(result, 'm', delta);
      return ' ';
    };

    // TODO: move function definitions out of this loop
    var stringBefore;
    do {
      stringBefore = string;

      //  12:00am 10/22/2008 => 00:00am 10/22/2008
      re = new RegExp('(.*) 12(:\\d{1,2}am [\\d/]{6,10}.*)', 'i');
      string = string.replace(re, '$1 00$2');

      // yesterday|today|tomorrow
      re = new RegExp('\\s(yesterday|today|tomorrow)\\s', 'i');
      string = string.replace(re, function(str, day){
        base = new Date();
        result = basePeriods;
        day = day.toLowerCase();
        if (day != 'today') {
          result.d = basePeriods.d + ((day == 'tomorrow') ? 1 : -1);
        }
        return ' ';
      });

      // next|prev year, next|prev month, next|prev week, next|prev day
      re = new RegExp('\\s('+strPeriod+')\\s(next|prev(?:ious)?)\\s', 'gi');
      string = string.replace(re, function(str, period, direction){
        var step = 1;
        period = period.toLowerCase();
        if (period[0] == 'w'){
          period = 'd';
          step = 7;
        }
        result = setPeriod(result, period[0], step*((direction.toLowerCase() == "next") ? 1 : -1));
        return ' ';
      });

      // next|prev thursday
      re = new RegExp('\\s('+strDay+')\\s(next|prev(?:ious)?)\\s', 'i');
      string = string.replace(re, dayExp);

      // thursday
      re = new RegExp('\\s('+strDay+')\\s');
      string = string.replace(re, dayExp);

      // next|prev september
      re = new RegExp('\\s('+strMonth+')\\s(next|prev(?:ious)?)\\s', 'i');
      string = string.replace(re, monthExp);

      // 09/25/2008, 25.09.2008, 2008-09-25
      re = new RegExp('\\s(\\d+)([\\.\\-\\/])(\\d+)[\\.\\-\\/](\\d+)\\s', 'i');
      string = string.replace(re, function(str, part1, splitter, part2, part3){
        var temp = ((splitter == '/') ? part1+'/'+part2+'/'+part3 : part2+'/'+ ((splitter == '.') ? part1+'/'+part3 : part3+'/'+part1)).split('/');
        result.y = temp[2];
        result.m = temp[0] - 1;
        result.d = temp[1];
        return ' ';
      });

      // 09/25, 09.25, 09-25
      re = new RegExp('\\s(\\d+)(?:\\.|\\-|\\/)(\\d+)\\s', 'i');
      string = string.replace(re, function(str, month, date){
        result.m = month - 1;
        result.d = date;
        return ' ';
      });

      // 2008 september 25(th)?,
      re = new RegExp('\\s(\\d{4})\\s('+strMonth+')\\s(\\d\\d?)(?:st|nd|rd|th)?\\s', 'i');
      string = string.replace(re, function(str, year, month, date){
        result.y = year;
        result.m = months[month.slice(0, 3).toLowerCase()];
        result.d = date;
        return ' ';
      });

      //25(th)? september 2008
      re = new RegExp('\\s(\\d\\d?)(?:st|nd|rd|th)?\\s('+strMonth+')\\s(\\d{4})\\s', 'i');
      string = string.replace(re, function(str, date, month, year){
        result.y = year;
        result.m = months[month.slice(0, 3).toLowerCase()];
        result.d = date;
        return ' ';
      });

      //2008 25(th)? september
      re = new RegExp('\\s(\\d{4})\\s(\\d\\d?)(?:st|nd|rd|th)?\\s('+strMonth+')\\s', 'i');
      string = string.replace(re, function(str, year, date, month){
        result.y = year;
        result.m = months[month.slice(0, 3).toLowerCase()];
        result.d = date;
        return ' ';
      });

      //september 25(th)? 2008
      re = new RegExp('\\s('+strMonth+')\\s(\\d\\d?)(?:st|nd|rd|th)?\\s(\\d{4})\\s', 'i');
      string = string.replace(re, function(str, month, date, year){
        result.y = year;
        result.m = months[month.slice(0, 3).toLowerCase()];
        result.d = date;
        return ' ';
      });

      //25th
      re = new RegExp('\\s(\\d\\d?)(?:st|nd|rd|th)\\s', 'i');
      string = string.replace(re, function(str, date){
        if (basePeriods.d >= date) {
          result = setPeriod(result, 'm', 1);
        }
        result.d = date;
        return ' ';
      });

      // september
      re = new RegExp('\\s('+strMonth+')\\s', 'i');
      string = string.replace(re, monthExp);

      // n (years|months|weeks|days) (ago|later)
      re = new RegExp('\\s(ago|later)\\s(?:(\\d+)('+strPeriod+')|('+strPeriod+')\\s(\\d+))\\s', 'i');
      string = string.replace(re, function(str, direction){
        var step = arguments[2]||arguments[5];
        var period = (arguments[3]||arguments[4]).toLowerCase();
        if (period[0] == 'w'){
          period = 'd';
          step *= 7;
        }
        result = setPeriod(result, period[0], step*((direction.toLowerCase() == 'ago') ? -1 : 1));
        return ' ';
      });

      // at 5 am, in 5 hours, 5 oclock, 5:00 pm
      re = new RegExp("\\s(?:(?:(a|p)m|h(?:ou)?r?s?|o['|`]?clock)\\s)?(\\d\\d?(?::\\d\\d?)?)(?:\\s(?:at|in))?\\s", 'i');
      string = string.replace(re, function(){
        allDay = false;
        var time = arguments[2].split(':');
        if (!time[1]) {
          time.push('00');
        }
        if (arguments[1] && arguments[1].toLowerCase() == 'p'){
          var parsedHours = parseInt(time[0], 10);
          time[0] = parsedHours == 12 ? 12 : parsedHours+12;
        }
        result.h = time[0];
        result.i = time[1];
        return ' ';
      });

      // at 5am, in 5hours, 5oclock, 5:00pm
      re = new RegExp("\\s(\\d\\d?(?::\\d\\d?)?)(?:(?:(a|p)m|h(?:ou)?r?s?|o['|`]?clock))?(?:\\s(?:at|in))?\\s", 'i');
      string = string.replace(re, function(){
        allDay = false;
        var time = arguments[1].split(':');
        if (!time[1]) {
          time.push('00');
        }
        if (arguments[2] && arguments[2].toLowerCase() == 'p') {
          var parsedHours = parseInt(time[0], 10);
          time[0] = parsedHours == 12 ? 12 : parsedHours+12;
        }
        result.h = time[0];
        result.i = time[1];
        return ' ';
      });
    } while(string != stringBefore);

    string = string.split(/\s/);
    string.reverse();
    string = ' '+string.join(' ');
    return {caption: string.replace(/^\s+/, ''), parsedDate: [result.y, result.m, result.d, result.h, result.i, 0], allDay: allDay};
  },
  parseForEvent: function () {
    var leftPad = function(chr, length){
      return (length>1) ? leftPad(chr[0]+chr, --length) : chr;
    };

    var fillZeroes = function(value){
      var length = (arguments[1]||2)-value.toString().length;
      return ((length>0) ? leftPad('0', length) : '')+value;
    };

    // don't use prototype $A()
    var result = []; //.concat.call(arguments, []);
    var index = arguments.length;
    while (index--) {
      result[index] = arguments[index];
    }
    result = this.__parseIntoComponents(result);

    var self = DateParser.dateFromComponents(result.parsedDate);

    self.caption = result.caption;
    self.allDay = result.allDay;

    self.addHours = function(value){
      this.setHours(this.getHours()+value);
    };

    self.getFullMonth = function(){
      return this.getMonth()+1;
    };

    self.format = function(pattern){
      return pattern.replace('Y', this.getFullYear())
        .replace('m', fillZeroes(this.getFullMonth()))
        .replace('d', fillZeroes(this.getDate()))
        .replace('h', fillZeroes(this.getHours()))
        .replace('i', fillZeroes(this.getMinutes()));
    };

    return self;
  },
  parseIntoComponents: function (string) {
    string = String(string);
    var rv = TZInfo.parseSimpleDateIntoComponents(string);
    if (rv) {
      return rv;
    }
    rv = this.__parseIntoComponents([string]);
    if (!rv) {
      return rv;
    }
    return ['local'].concat(rv.parsedDate);
  }
};
