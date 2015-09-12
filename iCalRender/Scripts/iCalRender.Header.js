/**
 * iCalRender
 * 
 * Renders iCalendar-compatible file into HTML entirely on a client side (JavaScript).
 * Use ical.js for parsing: https://github.com/mozilla-comm/ical.js/
 * ical.js usage example: https://jsfiddle.net/kewisch/227efboL/
 * 
 * Visual Studio 2015 or newer with Web Essentials plugin is recommended to develop this solution.
 * Node.js installation and Gulp are used to streamline build process.
 * 
 * Author: taurit
 * URL (1): http://icalrender.taurit.pl
 * URL (2): https://github.com/taurit/iCalRender
 * 
 */


// Namespace available globally
ICalRender = {};

// Order in which other files should be included:
// 1) iCalRender.Functions
// 2) iCalRender.ExtendedEvent
// 2) iCalRender.EventPositionCalculator
// 3) iCalRender.Renderer

