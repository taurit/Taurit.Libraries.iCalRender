/// <reference path="ical.js" />
/// <reference path="jquery-2.1.4.js" />

/**
 * iCalRender
 * 
 * Renders iCalendar-compatible file into HTML entirely on a client side (JavaScript).
 * 
 * Author: taurit
 * URL: http://icalrender.taurit.pl
 * Version: 0.1
 * Modified: 2015-08-17
 * 
 */

// Namespace available globally
ICalRender = {};

(function () {
    "use strict";

    /**
     * Initialize renderer with a given calendar
     * 
     * @param {string} [iCalContent] Content of a valid iCalendar or vCalendar file
     */
    ICalRender.Renderer = function (iCalContent) {
        /// <field name="fileContent" type="String">Content of a user-provided iCalendar file</field>

        this.fileContent = iCalContent;
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
            return this.fileContent;
        }
    };
})();

