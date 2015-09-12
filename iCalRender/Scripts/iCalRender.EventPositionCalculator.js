/// <reference path="../lib/ical.js" />
/// <reference path="../lib/jquery-2.1.4.js" />
/// <reference path="iCalRender.Header.js" />
/// <reference path="iCalRender.Functions.js" />

ICalRender.EventPositionCalculator = function (allEventsInADay) {
    /// <summary>
    /// Contains functions that help to calculate precise event position in the grid.
    /// Rendering daily view of events requires solving a problem of displaying overlapping events. Algorithm that is used here seems a bit too complex and complicated,
    /// but it was the best I could think of so far.
    ///
    /// There seems to be no pure CSS solution to achieve this effect, and JavaScript is used to calculate events position in the grid.
    /// </summary>

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

    calc.orderedEvents = [];
    ordEvents.forEach(function (evnt) {
        /// <param name="evnt" type="ICAL.Event"></param>
        var extendedEvent = new ICalRender.ExtendedEvent(evnt);
        calc.orderedEvents.push(extendedEvent);
    });

};


ICalRender.EventPositionCalculator.prototype = {
    getFunProcessEventForIteration: function (iterationNumber, orderedEvents) {
        var f = function (unprocessedEvent) {
            /// <summary>Sets event indentation</summary>
            /// <param name="unprocessedEvent" type="ICalRender.ExtendedEvent">Event to find position for</param>

            if (unprocessedEvent.overlapsWithAny(orderedEvents.filter(function (a) { return a.processed == iterationNumber; }))) {
                // leave it for the next round
            } else {
                unprocessedEvent.processed = iterationNumber;
                unprocessedEvent.eventPosition.eventIndent = iterationNumber - 1;
            }

        };
        return f;
    },

    getFunFilterToIterationNumber: function (iterationNumber) {
        var f = function (a) {
            return a.processed == iterationNumber;
        };
        return f;
    },

    getFunSetNumOfNeighbours: function(iterationNumber, orderedEvents) {
        var f = function (ev) {
            /// <param name="ev" type="ICalRender.ExtendedEvent">Event with a given minimum number of neighbours</param>
            var neighbours = ev.findOverlapping(orderedEvents);
            neighbours.forEach(function (overlappingEvent) {
                /// <param name="overlappingEvent" type="ICalRender.ExtendedEvent">Event that overlaps in time with a given one</param>

                overlappingEvent.eventPosition.neighbourEvents = iterationNumber;
            });
        };
        return f;
    },

    getEvents: function () {
        /// <summary>Processes given event list trying to find the best layout to display them and returns calculated metadata to rendering script.</summary>
        /// <returns type="Array" elementtype="ICalRender.ExtendedEvent">Processed ExtendedEvent objects, with calculated position in the view</returns>

        var calc = this;
        var maxNumSimultaneousEvents = 7; // arbitrary, max number of events that could be displayed near each other. too big will impact performance
        var iterationNumber = 1;
        for (iterationNumber = 1; iterationNumber < maxNumSimultaneousEvents; iterationNumber++) {
            var leftForDecision = calc.orderedEvents.filter(function (a) { return a.processed === 0; });

            var processEventForIteration = this.getFunProcessEventForIteration(iterationNumber, calc.orderedEvents);
            leftForDecision.forEach(processEventForIteration);
        }

        // set value for events stating with how many other events width of the container is shared
        for (iterationNumber = 2; iterationNumber < maxNumSimultaneousEvents; iterationNumber++) { // skip 1, neighbourEvents=1 by default
            var funFilterToIteration = this.getFunFilterToIterationNumber(iterationNumber);
            var levelEvents = calc.orderedEvents.filter(funFilterToIteration);

            var funSetNumNeighbours = this.getFunSetNumOfNeighbours(iterationNumber, calc.orderedEvents);
            levelEvents.forEach(funSetNumNeighbours);
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