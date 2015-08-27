/// <reference path="ical.js" />
/// <reference path="jquery-2.1.4.js" />

/**
 * Contains functions that help to calculate precise event position in the grid.
 * 
 * Rendering daily view of events requires solving a problem of displaying overlapping events.
 * There seems to be no pure CSS solution to achieve this effect, and JavaScript is used to calculate events position in the grid.
 * 
 */


// Namespace available globally
ICalRender = {};

ICalRender.EventPosition = function () {
    /// <field type='Number' name='eventIndent'>Level of indent of given event in rendered calendar. Start from 0 (for events that should take full width of a container).</field>
    /// <field type='Number' name='neighbourEvents'>Number of events to share width with (1 = this single event can take full width of a container)</field>

    this.eventIndent = 0;
    this.neighbourEvents = 1;

};

ICalRender.ExtendedEvent = function (basicEvent) {
    /// <param name="basicEvent" type="ICAL.Event">Base event object</param>

    /// <field name="basicEvent" type="ICAL.Event">Base event object</field>
    /// <field name="startDate" type="Date">Start date from the event parsed to JS Date object</field>
    /// <field name="endDate" type="Date">End date from the event parsed to JS Date object</field>

    /// <field name="eventPosition" type="ICalRender.EventPosition">Calculated position of an event in a daytime grid</field>
    /// <field name="processed" type="Boolean">Helper flag that states whether event has already been processed</field>

    this.basicEvent = basicEvent;
    this.startDate = new Date(basicEvent.startDate);
    this.endDate = new Date(basicEvent.endDate);

    this.processed = 0;
    this.eventPosition = new ICalRender.EventPosition();
}

ICalRender.ExtendedEvent.prototype = {
    overlaps: function (anotherEvent) {
        /// <param name="anotherEvent" type="ICalRender.ExtendedEvent">Extended event object</param>

        return (this.startDate < anotherEvent.endDate) && (this.endDate > anotherEvent.startDate);
    },

    overlapsWithAny: function (anotherEvents) {
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
        /// <param name="anotherEvents" type="Array" elementtype="ICalRender.ExtendedEvent">Extended event array</param>
        /// <returns type="Array" elementtype="ICalRender.ExtendedEvent">Events that overlap in time with a given one</returns>

        var thisEvent = this;
        var evnts = new Array();
        anotherEvents.forEach(function (another) {
            if (thisEvent.overlaps(another)) {
                evnts.push(another);
            }
        });
        return evnts;
    }


};

ICalRender.EventPositionCalculator = function (allEventsInADay) {
    /// <param name="allEventsInADay" type="Array" elementtype="ICAL.Event">List of all events that share the same container and may potentially overlap</param>
    /// <field name="orderedEvents" type="Array" elementtype="ICalRender.ExtendedEvent">List of all events in a day ordered by their startDate</param>
    var calc = this;

    var ordEvents = allEventsInADay.sort(function (a, b) {
        /// <param name="a" type="ICAL.Event"></param>
        /// <param name="b" type="ICAL.Event"></param>
        var dateA = new Date(a.startDate);
        var dateB = new Date(b.startDate);
        return dateA - dateB;
    });

    calc.orderedEvents = new Array();
    ordEvents.forEach(function (evnt) {
        var extendedEvent = new ICalRender.ExtendedEvent(evnt);
        calc.orderedEvents.push(extendedEvent);
    });


};

ICalRender.EventPositionCalculator.prototype = {

    /**
      * Processes given event list trying to find the best layout to display them and returns calculated metadata to rendering script.
      * 
      * @returns {ICalRender.ExtendedEvent} Event with specified indent
      */
    getEvents: function () {
        var calc = this;
        var maxNumSimultaneousEvents = 7; // arbitrary, max number of events that could be displayed near each other. too big will impact performance
        for (var iterationNumber = 1; iterationNumber < maxNumSimultaneousEvents; iterationNumber++) {
            var leftForDecision = calc.orderedEvents.filter(function (a) { return a.processed == 0; });
            leftForDecision.forEach(function (unprocessedEvent) {
                /// <param name="unprocessedEvent" type="ICalRender.ExtendedEvent">Event to find position for</param>

                if (unprocessedEvent.overlapsWithAny(calc.orderedEvents.filter(function (a) { return a.processed == iterationNumber; }))) {
                    // leave it for the next round
                } else {
                    unprocessedEvent.processed = iterationNumber;
                    unprocessedEvent.eventPosition.eventIndent = iterationNumber - 1;
                }

            });
        }

        // set value for events stating with how many other events width of the container is shared
        for (var iterationNumber = 2; iterationNumber < maxNumSimultaneousEvents; iterationNumber++) { // skip 1, neighbourEvents=1 by default
            var levelEvents = calc.orderedEvents.filter(function (a) { return a.processed == iterationNumber; });
            levelEvents.forEach(function (ev) {
                /// <param name="ev" type="ICalRender.ExtendedEvent">Event with a given minimum number of neighbours</param>
                var neighbours = ev.findOverlapping(calc.orderedEvents);
                neighbours.forEach(function (overlappingEvent) {
                    /// <param name="overlappingEvent" type="ICalRender.ExtendedEvent">Event that overlaps in time with a given one</param>

                    overlappingEvent.eventPosition.neighbourEvents = iterationNumber;
                });
            });
        }

        // final round
        for (var i = 0; i < calc.orderedEvents.length; i++) {
            for (var j = i + 1; j < calc.orderedEvents.length; j++) {
                if (calc.orderedEvents[i].overlaps(calc.orderedEvents[j])) {
                    var max = Math.max(calc.orderedEvents[i].eventPosition.neighbourEvents, calc.orderedEvents[j].eventPosition.neighbourEvents);
                    calc.orderedEvents[i].eventPosition.neighbourEvents = max;
                    calc.orderedEvents[j].eventPosition.neighbourEvents = max;
                }
            }
        }

        return this.orderedEvents;
    }
};