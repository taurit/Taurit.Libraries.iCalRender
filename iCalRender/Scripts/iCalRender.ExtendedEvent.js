/**
 * Defines ExtendedEvent object, representing iCalendar's Event object with additional properties and methods needed in rendering process.
 * 
 */
(function () {
    "use strict";

    ICalRender.EventPosition = function () {
        /// <summary>Stores the position of event in a rendered calendar. If two or more events take place at the same time, this object allows to determine how they should be rendered next to each other.</summary>

        /// <field type='Number' name='eventIndent'>Level of indent of given event in rendered calendar. Start from 0 (for events that should take full width of a container).</field>
        /// <field type='Number' name='neighbourEvents'>Number of events to share width with (1 = this single event can take full width of a container)</field>

        this.eventIndent = 0;
        this.neighbourEvents = 1;
    };

    ICalRender.ExtendedEvent = function (basicEvent) {
        /// <summary>Represents iCalendar's Event object with additional properties and methods needed in rendering process.</summary>
        /// <param name="basicEvent" type="ICAL.Event">Base event object</param>

        /// <field name="basicEvent" type="ICAL.Event">Base event object</field>
        /// <field name="startDate" type="Date">Start date from the event parsed to JS Date object</field>
        /// <field name="endDate" type="Date">End date from the event parsed to JS Date object</field>

        /// <field name="eventPosition" type="ICalRender.EventPosition">Calculated position of an event in a daytime grid</field>
        /// <field name="processed" type="Boolean">Helper flag that states whether event has already been processed and in which iteration</field>

        this.basicEvent = basicEvent;
        this.startDate = new Date(basicEvent.startDate);
        this.endDate = new Date(basicEvent.endDate);

        this.processed = 0;
        this.eventPosition = new ICalRender.EventPosition();
    };

    ICalRender.ExtendedEvent.prototype = {
        overlapsWithTimeRange: function (timeRangeStart, timeRangeEnd) {
            /// <summary>Checks whether this event overlaps in time with specified time range.</summary>
            /// <param name="timeRangeStart" type="Date">Start of a time range to compare event with</param>
            /// <param name="timeRangeEnd" type="Date">End of a time range to compare event with</param>

            return ((this.startDate < timeRangeEnd) && (this.endDate > timeRangeStart));
        },

        overlaps: function (anotherEvent) {
            /// <summary>Checks whether this event overlaps in time with another ExtendedEvent.</summary>
            /// <param name="anotherEvent" type="ICalRender.ExtendedEvent">Extended event object</param>

            return ((this.startDate < anotherEvent.endDate) && (this.endDate > anotherEvent.startDate));
        },

        overlapsWithAny: function (anotherEvents) {
            /// <summary>Checks whether this event overlaps in time with any ExtendedEvent in a given array.</summary>
            /// <param name="anotherEvents" type="Array" elementtype="ICalRender.ExtendedEvent">Extended event array</param>

            var thisEvent = this;
            var result = false;
            anotherEvents.forEach(function (anotherEvent) {
                if ((thisEvent.startDate < anotherEvent.endDate) && (thisEvent.endDate > anotherEvent.startDate)) {
                    result = true;
                }
            });
            return result;
        },

        findOverlapping: function (anotherEvents) {
            /// <summary>Returns all events from a given collection that overlap in time with current event</summary>
            /// <param name="anotherEvents" type="Array" elementtype="ICalRender.ExtendedEvent">Extended event array</param>
            /// <returns type="Array" elementtype="ICalRender.ExtendedEvent">Events that overlap in time with a given one</returns>

            var thisEvent = this;
            var evnts = [];
            anotherEvents.forEach(function (another) {
                if (thisEvent.overlaps(another)) {
                    evnts.push(another);
                }
            });
            return evnts;
        }


    };



})();

