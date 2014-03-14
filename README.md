flot-compareseries
=============

Simple [Flot](http://www.flotcharts.org) plugin for comparing one series to another and modifying the series colors based on the comparison of values being greater/less than the compared series.  This likely makes no sense when using line charts, but this would work well with the [flot-topbar](https://github.com/jasonroman/flot-topbar) plugin.

The plugin does support comparing all other series to a specific series (which skips comparing to itself), however you would still need to modify the colors for each series individually.

View the <a href="http://jasonroman.github.io/flot-compareseries/example.html">example page</a> to see the plugin in action.

---

Specifying for all series:

    series: {
        compare: {
            enabled:      boolean
            seriesIndex:  int - index of which series to compare to
            colorAbove:   colorspec - color with values greater than/equal to the corresponding comparison series
            colorBelow:   colorspec - color with values less than the corresponding comparison series
        }
    }

Specifying for a single series (recommended):

    $.plot($("#placeholder"), [{
        data: [ ... ],
        compare: { ... }
    }])

The following is a break-down of the options:

* **enabled:** boolean - to enable or disable the comparison for the series (default false)
* **seriesIndex:** integer - the numerical index of which series to compare this series to (index starts at 0, also the default)
* **colorAbove:** colorspec - the color of values that are greater than or equal to the corresponding value in the compared series (default #FF0000)
* **colorBelow:** colorspec - the color of values that are less than the corresponding value in the compared series (default #00FF00)
