describe("TZInfoJS Specs", function() {

  it("should load timezones", function () {
    expect(typeof TZInfo.findZone('Etc/UTC')).toBe('object');
    expect(typeof TZInfo.findZone('Asia/Hong_Kong')).toBe('object');
    expect(typeof TZInfo.findZone('America/New_York')).toBe('object');
  });

  it("should not be able to find non-exist timezone", function () {
    expect(typeof TZInfo.findZone('abcde')).toBe('undefined');
  });

  describe("timezone conversion", function () {

    describe("no daylight saving", function () {

      describe("Asia/Hong_Kong", function () {

        var custom_time_zone = "Asia/Hong_Kong";

        it("should convert from utc", function () {
          var utc_date = new Date(2014, 2, 9, 1, 15, 12);
          // +8 for Asia/Hong_Kong
          var hk_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(hk_date).toEqual(new Date(2014, 2, 9, 9, 15, 12));
        });

        it("should convert from custom timezone", function () {
          var hk_date = new Date(2014, 0, 1, 1, 0, 0);
          // +8 for Asia/Hong_Kong
          var utc_date = hk_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2013, 11, 31, 17, 0, 0));
        });

      });

      describe("Etc/Utc", function () {

        var custom_time_zone = "Etc/UTC";

        it("should convert from utc", function () {
          var utc_date = new Date(2014, 2, 9, 1, 15, 12);
          var custom_utc_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(custom_utc_date).toEqual(new Date(2014, 2, 9, 1, 15, 12));
        });

        it("should convert from custom timezone", function () {
          var custom_utc_date = new Date(2014, 0, 1, 1, 0, 0);
          var utc_date = custom_utc_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 0, 1, 1, 0, 0));
        });

      });

    });

    describe("with daylight saving", function () {

      var custom_time_zone = "America/New_York";

      describe("from utc", function () {

        it("should convert 1", function () {
          var utc_date = new Date(2014, 0, 1, 6, 0, 0);
          // -5 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 0, 1, 1, 0, 0));
        });

        it("should convert 2", function () {
          var utc_date = new Date(2014, 2, 9, 6, 0, 0);
          // -5 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 2, 9, 1, 0, 0));
        });

        it("should convert 3", function () {
          var utc_date = new Date(2014, 2, 9, 7, 0, 0);
          // -4 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 2, 9, 3, 0, 0));
        });

        it("should convert 4", function () {
          var utc_date = new Date(2014, 5, 1, 7, 0, 0);
          // -4 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 5, 1, 3, 0, 0));
        });

        it("should convert 5", function () {
          var utc_date = new Date(2014, 10, 2, 4, 0, 0);
          // -4 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 10, 2, 0, 0, 0));
        });

        it("should convert 6", function () {
          var utc_date = new Date(2014, 10, 2, 6, 0, 0);
          // -5 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 10, 2, 1, 0, 0));
        });

        it("should convert 7", function () {
          var utc_date = new Date(2014, 11, 1, 6, 0, 0);
          // -5 for America/New_York for the given time
          var ny_date = utc_date.utcToCustomTimeZone(custom_time_zone);
          expect(ny_date).toEqual(new Date(2014, 11, 1, 1, 0, 0));
        });

      });

      describe("from custom timezone", function () {

        it("should convert 1", function () {
          var ny_date = new Date(2014, 0, 1, 1, 0, 0);
          // -5 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 0, 1, 6, 0, 0));
        });

        it("should convert 2", function () {
          var ny_date = new Date(2014, 2, 9, 1, 0, 0);
          // -5 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 2, 9, 6, 0, 0));
        });

        it("should convert 3", function () {
          var ny_date = new Date(2014, 2, 9, 3, 0, 0);
          // -4 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 2, 9, 7, 0, 0));
        });

        it("should convert 4", function () {
          var ny_date = new Date(2014, 5, 1, 3, 0, 0);
          // -4 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 5, 1, 7, 0, 0));
        });

        it("should convert 5", function () {
          var ny_date = new Date(2014, 10, 2, 0, 0, 0);
          // -4 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 10, 2, 4, 0, 0));
        });

        it("should convert 6", function () {
          var ny_date = new Date(2014, 10, 2, 1, 0, 0);
          // -5 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 10, 2, 6, 0, 0));
        });

        it("should convert 7", function () {
          var ny_date = new Date(2014, 11, 1, 1, 0, 0);
          // -5 for America/New_York for the given time
          var utc_date = ny_date.customTimeZoneToUtc(custom_time_zone);
          expect(utc_date).toEqual(new Date(2014, 11, 1, 6, 0, 0));
        });

      });

    });

  });

});
