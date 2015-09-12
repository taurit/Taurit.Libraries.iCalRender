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
 * URL (1): http://icalrender.taurit.pl
 * URL (2): https://github.com/taurit/iCalRender
 * Version: 0.1
 * 
 */

(function () {
    "use strict";

    function filterEventsToParticularDay(iteratedDay) {
        /// <param name="el" type="ICAL.Event">Single event</param>

        return function (el) {
            var startDate = new Date(el.startDate);
            var endDate = new Date(el.endDate);

            var matchesFilter = startDate.getFullYear() === iteratedDay.getFullYear() &&
                startDate.getMonth() === iteratedDay.getMonth() &&
                startDate.getDate() === iteratedDay.getDate() &&
                !(startDate.getUTCHours() === 0 && endDate.getDate() !== iteratedDay.getDate()); // make sure that event starts and ends in the same day
            return matchesFilter; // todo: insert date condition here
        };
    }
    function filterEventsToTimeWindow(iteratedDay, startHour, endHour) {
        return function (el) {
            // limit events to those that happen in a time-window specified by user
            /// <param name="el" type="ICAL.Event">Single event</param>

            var extEv = new ICalRender.ExtendedEvent(el);
            var startHourFullDate = new Date(iteratedDay.getFullYear(), iteratedDay.getMonth(), iteratedDay.getDate(), startHour, 0, 0, 0);
            var endHourFullDate = new Date(iteratedDay.getFullYear(), iteratedDay.getMonth(), iteratedDay.getDate(), endHour, 0, 0, 0);

            return extEv.overlapsWithTimeRange(startHourFullDate, endHourFullDate);
        };
    }
    function filterEventsToAllDayEvents(iteratedDay) {

        return function (el) {
            /// <param name="el" type="ICAL.Event">Single event</param>

            var startDate = new Date(el.startDate);
            var endDate = new Date(el.endDate);

            var matchesFilter = startDate.getFullYear() === iteratedDay.getFullYear() &&
                startDate.getMonth() === iteratedDay.getMonth() && // js starts month from 0 
                startDate.getDate() === iteratedDay.getDate() &&
                startDate.getUTCHours() === 0 &&
                endDate.getDate() !== iteratedDay.getDate();
            return matchesFilter;
        };
    }

    function funAddEventToContainer(allDayEventsContainer, dayNum) {
        return function (singleEvent) {
            /// <param name="singleEvent" type="ICAL.Event">Single event</param>
            $("<div/>", {
                "class": "event all-day-event",
                "data-day": dayNum,
                "text": singleEvent.summary,
                "title": singleEvent.summary
            }).appendTo(allDayEventsContainer);
        };
    }

    function funAddScheduledEventToContainer(scheduledEventsContainer, dayNum) {
        return function (singleEvent) {
            /// <param name="singleEvent" type="ICalRender.ExtendedEvent">Single event with calculated position parameters</param>

            var startDate = new Date(singleEvent.basicEvent.startDate);
            var endDate = new Date(singleEvent.basicEvent.endDate);
            var startTotalMinutes = startDate.getHours() * 60 + startDate.getMinutes();
            var durationMin = (endDate - startDate) / (60 * 1000);

            var renderedEvent = $("<div />", {
                "class": "event scheduled-event",
                "data-starttotalminutes": startTotalMinutes,
                "data-duration": durationMin,
                "data-numevents": singleEvent.eventPosition.neighbourEvents,
                "data-eventord": singleEvent.eventPosition.eventIndent,
                "data-day": dayNum,
                "title": singleEvent.basicEvent.summary,
                "text": singleEvent.basicEvent.summary
            }).appendTo(scheduledEventsContainer);

        };
    }
    /**
     * Initialize renderer with a given calendar
     * 
     * @param {string} [iCalContent] Content of a valid iCalendar or vCalendar file
     */
    ICalRender.Renderer = function (iCalContent, startHourParam, endHourParam, allDayEventsSectionHeightPx) {
        /// <field name="fileContent" type="String">Content of a user-provided iCalendar file</field>
        /// <field name="parsedCalendarEvents" type="Array" elementType="ICAL.Event">Event list in a given calendar</field>

        /// <field name="startHour" type="Number">Start to display calendar on this full hour (range 0-23)</field>
        /// <field name="endHour" type="Number">Start to display calendar on this full hour (range 0-23)</field>

        /// <field name="allDayEventsSectionHeightPx" type="Number">Height (in pixels) of "all day events" section</field>

        this.fileContent = iCalContent;
        this.parsedCalendarEvents = [];
        this.startHour = startHourParam ? startHourParam : 0;
        this.endHour = (endHourParam ? endHourParam : 24);
        if (isNaN(this.startHour) || this.startHour < 0 || this.startHour > 23) {
            throw "startHourParam value is out of range of valid values";
        }

        if (isNaN(this.endHour) || this.endHour < 1 || this.endHour > 24) {
            throw "endHourParam value is out of range of valid values";
        }

        if (isNaN(allDayEventsSectionHeightPx)) {
            allDayEventsSectionHeightPx = 50; // default = 50px
        }
        this.allDayEventsSectionHeightPx = allDayEventsSectionHeightPx;


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
         * Renders a specified number of days in a multi-day view and returns HTML code that can be put in a container like <div></div>.
         * Inserts the generated code to a given container.
         * Resulting HTML code might require some repositioning of elements with RealignDays() function, which is automatically
         * executed and attached to window resize event.
         *
         * @param {number} [year] Year
         * @param {number} [month] Month, January = 1, February = 2, ...
         * @param {number} [day] Day to render, indexing start with 1
         * @param {number} [numDays] Number of days to render, if ommited 1 is used as default value
         * 
         * @returns {string} Rendered HTML code
         */
        RenderMultidayView: function (jQuerySelectorPlaceholder, year, month, day, numDays) {
            // sanitize parameters
            if (!numDays) {
                numDays = 1;
            }

            var renderer = this;

            // generate markup for requested view 
            var result = this.RenderDaysInternal(year, month, day, numDays, jQuerySelectorPlaceholder);

            // put the markup containing calendar data into container specified by user
            jQuery(jQuerySelectorPlaceholder).addClass('days');

            // calculate elements positions and size
            renderer.RealignDays(jQuerySelectorPlaceholder);

            // do this also on window resize, so it's responsive in case container is also responsive
            window.addEventListener('resize', function () {
                renderer.RealignDays(jQuerySelectorPlaceholder);
            });

        },

        /**
         * @param {number} [daysInWeek] Number of days if the day is to be rendered in a week-like view. Default is 1.
         * @param {number} [dayInWeek] Ordinal number of day if the day is to be rendered in a week-like view. Default is 0.
         * 
         * @returns HTML content of a container for a day
         */
        RenderDaysInternal: function (year, month, day, numDays, jQuerySelectorPlaceholder) {

            // find events that take place this day
            var renderer = this;
            month = month - 1; // js starts month from 0

            var container = $(jQuerySelectorPlaceholder);

            // render second-level containers
            container.empty();
            container.data("numdays", numDays);

            var headersContainer = $("<div />", {
                class: "headers",
            }).appendTo(container);

            var allDayEventsContainer = $("<div />", {
                class: "all-day-events",
            }).height(renderer.allDayEventsSectionHeightPx).appendTo(container);

            $("<div />", {
                class: "all-day-events-divider"
            }).appendTo(container);

            var scheduledEventsContainer = $("<div />", {
                class: "scheduled-events",
            }).appendTo(container);

            var timeGridContainer = $("<div/>", {
                class: 'time-grid',
            }).appendTo(scheduledEventsContainer);

            // fill containers with event data
            for (var hour = this.startHour; hour < this.endHour + 1; hour++) {
                $("<span />", {
                    "class": "time-grid-hour time-grid-hour-" + hour,
                    "data-hournumber": hour,
                    "text": hour
                }).appendTo(timeGridContainer);

                $("<div />", {
                    "class": "time-grid-line",
                    "data-hournumber": hour,
                }).appendTo(timeGridContainer);

            }

            var iteratedDay = new Date(year, month, day);
            var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            for (var dayNum = 0; dayNum < numDays; dayNum++) {

                $("<div />", {
                    "class": "day-label",
                    "data-day": dayNum,
                    "text": days[iteratedDay.getDay()] + ", " + iteratedDay.toLocaleDateString()
                }).appendTo(headersContainer);

                var filterDay = filterEventsToParticularDay(iteratedDay);
                var filterTimeWindow = filterEventsToTimeWindow(iteratedDay, renderer.startHour, renderer.endHour);
                var thisDayEvents = this.parsedCalendarEvents.filter(filterDay).filter(filterTimeWindow);

                var filterAllDayEvents = filterEventsToAllDayEvents(iteratedDay);
                var thisDayAllDayEvents = this.parsedCalendarEvents.filter(filterAllDayEvents);

                var addEventToContainer = funAddEventToContainer(allDayEventsContainer, dayNum);
                thisDayAllDayEvents.forEach(addEventToContainer);


                var eventPosCalc = new ICalRender.EventPositionCalculator(thisDayEvents);
                thisDayEvents = eventPosCalc.getEvents();

                var addScheduledEventToContainer = funAddScheduledEventToContainer(scheduledEventsContainer, dayNum);
                thisDayEvents.forEach(addScheduledEventToContainer);

                iteratedDay = iteratedDay.addDays(1);
            }
        },

        /**
         * Calculates new position for events (that have to be positioned absolutely) and apply them. Includes calculation of:
         * - width
         * - height
         * - top position
         * - left position
         * 
         * @param {string} [containerSelector] jQuery selector targeting container where re-aligning should take place
         */
        RealignDays: function (containerSelector) {
            var renderer = this;

            // read container size
            var container = $(containerSelector);
            var containerWidth = container.width();
            var containerHeight = container.height();
            var containerNumDays = container.data("numdays");

            // decide on some variables based on options passed by user or defaults
            var hourHeightPx = 40; // todo: make customizable
            var hourBorderThicknessPx = 1; // todo: make customizable
            var daySpacingPx = containerNumDays == 1 ? 0 : 5; // for single day view spacing in unnecessary and not desired
            var topShiftPx = 5; // same as in LESS
            var marginForHourLabelPx = 20; // space on the left side of the container dedicated for hour labels only
            var allDayEventHeight = 22;

            // compute values specific to all calendar
            var gridHourFontShiftPx = -6 + topShiftPx; // to make hour labels at the same level as hour grid lines
            var scrollbarWidthPx = 20;
            var containerWidthPx = container.width() - scrollbarWidthPx - marginForHourLabelPx;

            // compute values specific to 'all day events' part of calendar
            var allDayEventWidth = (containerWidth - marginForHourLabelPx - scrollbarWidthPx) / containerNumDays - daySpacingPx;

            // compute values specific to 'specific time events' part of calendar
            var spaceOccupiedHeaders = container.find(".headers").outerHeight(true);
            var spaceOccupiedAllDayEvents = container.find(".all-day-events").outerHeight(true);
            var spaceOccupiedAllDayEventsDivider = container.find(".all-day-events-divider").outerHeight(true);
            var spaceLeft = container.height() - spaceOccupiedHeaders - spaceOccupiedAllDayEvents - spaceOccupiedAllDayEventsDivider - topShiftPx;

            // position headers
            container.find(".day-label").each(function () {
                var dayShift = $(this).data("day");
                var topPosition = 0;
                var leftPosition = marginForHourLabelPx + dayShift * (allDayEventWidth + daySpacingPx);

                $(this).css('position', 'absolute')
                   .css('top', topPosition + 'px')
                   .css('left', leftPosition + 'px')
                   .css('width', allDayEventWidth + 'px');
                //.css('height', allDayEventHeight + 'px');
            });
            // position all day events
            var topPositions = [];
            container.find(".event.all-day-event").each(function () {
                var dayShift = $(this).data("day");

                if (topPositions[dayShift] !== undefined) {
                    topPositions[dayShift] = topPositions[dayShift] + allDayEventHeight + hourBorderThicknessPx;
                } else {
                    topPositions[dayShift] = 0;
                }
                var topPosition = topPositions[dayShift];
                var leftPosition = marginForHourLabelPx + dayShift * (allDayEventWidth + daySpacingPx);

                $(this).css('position', 'absolute')
                   .css('top', topPosition + 'px')
                   .css('left', leftPosition + 'px')
                   .css('width', allDayEventWidth + 'px')
                   .css('height', allDayEventHeight + 'px');
            });

            container.find(".event.scheduled-event").each(function () {
                // read and parse the data present in the event
                var dayShift = $(this).data("day");
                var startMinutes = $(this).data("starttotalminutes");
                var duration = $(this).data("duration");
                var numEvents = $(this).data("numevents");
                var eventOrd = $(this).data("eventord");
                var viewHeight = (renderer.endHour - renderer.startHour) * (hourHeightPx + 1);

                var topPosition = topShiftPx + (startMinutes / 60 - renderer.startHour) * (hourHeightPx + 1); // +1 for divider line
                var singleDayWidth = containerWidthPx / containerNumDays - daySpacingPx;
                var eventWidthPx = (singleDayWidth / numEvents);

                var leftPosition = (dayShift * (singleDayWidth + daySpacingPx)) + marginForHourLabelPx + (eventOrd * (eventWidthPx + 1));
                var eventHeightPx = hourHeightPx * duration / 60;
                eventHeightPx = Math.min(eventHeightPx, viewHeight - topPosition + topShiftPx);

                // if event starts before the begin hour defined for the viewport, display it as if it started later, so event's label is visible
                if (topPosition < 0) {
                    eventHeightPx += topPosition + topShiftPx;
                    topPosition = topShiftPx;
                }

                $(this).css('position', 'absolute')
                    .css('top', topPosition + 'px')
                    .css('left', leftPosition + 'px')
                    .css('width', eventWidthPx + 'px')
                    .css('height', eventHeightPx + 'px');
            });

            container.find(".time-grid-hour").each(function () {
                var hour = $(this).data('hournumber');
                var topPositionPx = (hourHeightPx + hourBorderThicknessPx) * (hour - renderer.startHour) + gridHourFontShiftPx;
                $(this).css('top', topPositionPx + 'px');

            });
            container.find(".time-grid-line").each(function () {
                var hour = $(this).data('hournumber');
                var topMargin = (hourHeightPx);
                $(this).css('margin-bottom', topMargin + 'px');

            });


            container.find(".scheduled-events").each(function () {
                $(this).height(spaceLeft);
            });


        },
    };
})();

