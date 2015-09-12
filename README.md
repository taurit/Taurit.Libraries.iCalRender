# iCalRender

## What is iCalRender?

iCalRender is a small (7kb + dependencies) javascript library for client-side rendering of calendar data in iCalendar or vCalendar format.

The library Requires [jQuery](https://github.com/jquery/jquery) and [ical.js](https://github.com/mozilla-comm/ical.js/) files as dependencies.

It was created for some simple use cases in my projects, so don't expect anything beyond basic functionality. However, in some cases it might be used to display calendar views on a webpage and avoid external services like Google Calendar. It might also be easier to integrate into a website, as it doesn't use iframes and can have its styles or some settings overriden.

## Example #1: render calendar view for a single day

Rendering calendar view might be as simple as writing:

```javascript
$.get("http://localhost:49762/Examples/Cal-2015-08-22.ics", function (response) {
    var vCalendarFileContent = response;
   
    // example: view for hours 10:00-16:00. Height of "All day events" section is set to 52px
    var renderer = new ICalRender.Renderer(vCalendarFileContent, 10, 16, 52);
    renderer.RenderMultidayView("#one-day", 2015, 8, 22, 1);
});
```

This will render a calendar view like the one below, assuming that default CSS styles are used.

![](https://github.com/taurit/iCalRender/blob/master/iCalRender/Examples/Screenshots/iCalRender-example-single-day.png)

## Example #2: render calendar view for a single day

By changing one parameter in ```RenderMultidayView``` from first example you might render more than one day:

```javascript
renderer.RenderMultidayView("#three-days", 2015, 8, 22, 3);
```

![](https://github.com/taurit/iCalRender/blob/master/iCalRender/Examples/Screenshots/iCalRender-example-3-days.png)

## How to start using it

If you want to try it for yourself, download the project and see HTML files in **Examples** directory. They show simple use cases like the ones above.

If you want to modify some internals, the easiest way is to install Visual Studio 2015 IDE (which is now free) and open the solution file. You should be able to compile and start a project. A complete list of dev tools and extensions used to build this project is listed in **iCalRender.Header.js** file.


