/// <reference path="iCalRender.Header.js" />

/**
 * Simple functions and extension methods for standard types
 */
(function () {
    "use strict";

    Date.prototype.addDays = function (days) {
        /// <summary>Returns date that differs from a given date by a specified number of days</summary>
        /// <param name="days" type="Number">Number of days to add</param>

        var dat = new Date(this.valueOf());
        dat.setDate(dat.getDate() + days);

        return dat;
    };

    Date.prototype.sameDayAs = function (anotherDate) {
        /// <summary>Checks whether two Date objects have matching values for year, month and day. Time is ignored.</summary>
        /// <param name="anotherDate" type="Date">Date to compare current object to.</param>

        return (this.getFullYear() === anotherDate.getFullYear() &&
                this.getMonth() === anotherDate.getMonth() &&
                this.getDate() === anotherDate.getDate());
    };

    ICalRender.Filters = {
        filterEventsToParticularDayEvents: function (iteratedDay) {
            /// <summary>Returns function filtering array of events. Events that are preserved:
            /// * occur on a particular day, and
            /// * are not all-day events</summary>
            /// <param name="iteratedDay" type="Date">Date specifying to which day should events in array be limited. Points to a single day (hour 0:00)</param>
            /// <returns>Filter function for use with standard Array.filter() method</returns>

            var f = function (singleEvent) {
                /// <param name="singleEvent" type="ICAL.Event">Single event</param>

                var startDate = new Date(singleEvent.startDate);
                var endDate = new Date(singleEvent.endDate);

                var matchesFilter = startDate.sameDayAs(iteratedDay) &&
                    !(startDate.getUTCHours() === 0 && !endDate.sameDayAs(iteratedDay)); // make sure that event is not a full day event (which has endDate = startDate + 1 day)
                return matchesFilter;
            };

            return f;
        },
        filterEventsToTimeWindow: function (iteratedDay, startHour, endHour) {
            /// <summary>Returns function filtering array of events to events that:
            /// * overlap time-window specified by user
            /// </summary>
            /// <returns>Filter function for use with standard Array.filter() method</returns>

            var f = function (el) {
                /// <param name="el" type="ICAL.Event">Single event</param>

                var extEv = new ICalRender.ExtendedEvent(el);
                var startHourFullDate = new Date(iteratedDay.getFullYear(), iteratedDay.getMonth(), iteratedDay.getDate(), startHour, 0, 0, 0);
                var endHourFullDate = new Date(iteratedDay.getFullYear(), iteratedDay.getMonth(), iteratedDay.getDate(), endHour, 0, 0, 0);

                return extEv.overlapsWithTimeRange(startHourFullDate, endHourFullDate);
            };
            return f;
        },

        filterEventsToAllDayEvents: function (iteratedDay) {
            /// <summary>Returns function filtering array of events, perserving events that:
            /// * occur on a given date
            /// * are all-day events (have no time specified)
            /// * last at least 1 full day
            /// </summary>
            /// <returns>Filter function for use with standard Array.filter() method</returns>

            var f = function (el) {
                /// <param name="el" type="ICAL.Event">Single event</param>

                var startDate = new Date(el.startDate);
                var endDate = new Date(el.endDate);

                var matchesFilter = startDate.sameDayAs(iteratedDay) &&
                    startDate.getUTCHours() === 0 &&
                    endDate.getDate() !== iteratedDay.getDate();
                return matchesFilter;
            };
            return f;
        }
    };


})();

