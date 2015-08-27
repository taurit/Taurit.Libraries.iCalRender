/// <reference path="ical.js" />
/// <reference path="jquery-2.1.4.js" />
/// <reference path="EventPositionCalculator.js" />

/**
 * iCalRender
 * 
 * Renders iCalendar-compatible file into HTML entirely on a client side (JavaScript).
 * Use ical.js for parsing: https://github.com/mozilla-comm/ical.js/
 * ical.js usage example: https://jsfiddle.net/kewisch/227efboL/
 * 
 * Visual Studio 2015 or newer with Web Essentials plugin is recommended to develop this solution.
 * 
 * Author: taurit
 * URL: http://icalrender.taurit.pl
 * Version: 0.1
 * Modified: 2015-08-17
 * 
 */

(function () {
    "use strict";

    //ICalRender.SimpleEvent = function (eventDate, eventEndDate, summary, description) {



    /**
     * Initialize renderer with a given calendar
     * 
     * @param {string} [iCalContent] Content of a valid iCalendar or vCalendar file
     */
    ICalRender.Renderer = function (iCalContent) {
        /// <field name="fileContent" type="String">Content of a user-provided iCalendar file</field>
        /// <field name="parsedCalendarEvents" type="Array" elementType="ICAL.Event">Event list in a given calendar</field>

        this.fileContent = iCalContent;
        this.parsedCalendarEvents = new Array();

        var parsedCalendar = ICAL.parse(this.fileContent);

        if (parsedCalendar) {
            var renderer = this;

            var vCalendar = new ICAL.Component(parsedCalendar);
            var vEvents = vCalendar.getAllSubcomponents('vevent');

            vEvents.forEach(function (vEvent) {
                var evnt = new ICAL.Event(vEvent, {});
                renderer.parsedCalendarEvents.push(evnt);
            });
        }


    };

    ICalRender.Renderer.prototype = {
        /**
         * Renders a specified single day and returns HTML code that can be put in a container like <div></div>.
         *
         * @param {number} [year] Year
         * @param {number} [month] Month
         * @param {number} [day] Day to render
         * 
         * @returns {string} Rendered HTML code
         */
        RenderDay: function (year, month, day) {
            // find events that take place this day

            var thisDayEvents = this.parsedCalendarEvents.filter(function (el) {
                /// <param name="el" type="ICAL.Event">Single event</param>

                var startDate = new Date(el.startDate);
                var endDate = new Date(el.endDate);

                var matchesFilter = startDate.getFullYear() === year
                    && startDate.getMonth() + 1 === month // js starts month from 0
                    && startDate.getDate() === day
                    && !(startDate.getUTCHours() === 0
                    && endDate.getDate() !== day);
                return matchesFilter; // todo: insert date condition here
            });

            var thisDayAllDayEvents = this.parsedCalendarEvents.filter(function (el) {
                /// <param name="el" type="ICAL.Event">Single event</param>

                var startDate = new Date(el.startDate);
                var endDate = new Date(el.endDate);

                var matchesFilter = startDate.getFullYear() === year
                    && startDate.getMonth() + 1 === month // js starts month from 0
                    && startDate.getDate() === day
                    && startDate.getUTCHours() === 0
                    && endDate.getDate() !== day;
                return matchesFilter; // todo: insert date condition here
            });

            // render
            if (thisDayEvents.length + thisDayAllDayEvents.length > 0) {
                var result = "";
                result += '<div class="all-day-events">';
                thisDayAllDayEvents.forEach(function (singleEvent) {
                    /// <param name="singleEvent" type="ICAL.Event">Single event</param>
                    var renderedEvent = "<div class='event'>" + singleEvent.summary + "</div>\n";
                    result += renderedEvent;
                });
                result += '</div> <!-- / all-day-events -->';

                result += '<div class="all-day-events-divider"></div>';

                result += '<div class="scheduled-events">';
                result += '<div class="time-grid">';
                for (var hour = 0; hour < 24; hour++) {
                    result += '<div class="time-grid-line"></div>';
                }
                result += '</div>';

                var eventPosCalc = new ICalRender.EventPositionCalculator(thisDayEvents);
                thisDayEvents = eventPosCalc.getEvents();

                thisDayEvents.forEach(function (singleEvent) {
                    /// <param name="singleEvent" type="ICalRender.ExtendedEvent">Single event with calculated position parameters</param>

                    var startDate = new Date(singleEvent.basicEvent.startDate);
                    var endDate = new Date(singleEvent.basicEvent.endDate);
                    var startTotalMinutes = startDate.getHours() * 60 + startDate.getMinutes();
                    var durationMin = (endDate - startDate) / (60 * 1000);

                    var renderedEvent = "<div class='event scheduled-event' data-starttotalminutes='" + startTotalMinutes + "' data-duration='" + durationMin + "' data-numevents='" + singleEvent.eventPosition.neighbourEvents + "' data-eventord='" + singleEvent.eventPosition.eventIndent + "' title='" + singleEvent.basicEvent.summary + "'>" + singleEvent.basicEvent.summary + "</div>\n"; // todo: this is vulnerable to script injection, replace with use of templating engine or similar

                    result += renderedEvent;
                });

                result += '</div> <!-- / scheduled-events -->';

                return result;

            } else {
                return "<p data-i18n='ical.messages.noevents'>There are no events in this view.</p>";
            }
        },

        /**
         * Calculates new position for events (that have to be positioned absolutely) and apply them
         * 
         * @param {string} [containerSelector] jQuery selector targeting container where re-aligning should take place
         */
        RealignDays: function (containerSelector) {
            $(containerSelector + " .day").each(function () {

                var hourHeightPx = 40; // todo: deduce from css property, so there's no configuration needed after changing styles
                var containerWidthPx = $(this).width() - 20; // -scrollbar width

                $(this).find(".event.scheduled-event").each(function () {
                    // rad and parse the data present in the event
                    var startMinutes = $(this).data("starttotalminutes");
                    var duration = $(this).data("duration");
                    var numEvents = $(this).data("numevents");
                    var eventOrd = $(this).data("eventord");


                    var topPosition = (startMinutes / 60) * (hourHeightPx + 1); // +1 for divider line
                    var eventWidthPx = containerWidthPx / numEvents;
                    var leftPosition = (eventOrd * (eventWidthPx + 1));
                    var eventHeightPx = hourHeightPx * duration / 60;

                    $(this).css('position', 'absolute')
                        .css('top', topPosition + 'px')
                        .css('left', leftPosition + 'px')
                        .css('width', eventWidthPx + 'px')
                        .css('height', eventHeightPx + 'px');
                });
            });
        },
    };
})();

