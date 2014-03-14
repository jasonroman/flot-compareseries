/**
 * Flot plugin for comparing one series to another and modifying the series
 * colors based on the values being greater/less than the compared series
 * 
 * Note: The series being altered likely does not make sense to display as a line
 * chart since the single line would already be doing that visual comparison
 * 
 * The plugin does support comparing all series to a single series (which will
 * skip comparing to itself); however, the colors would be the same for all
 * series and would need to be modified individually
 *
 * Specifying for all series:
 * 
 *  series: {
 *      compare: {
 *          enabled:      boolean
 *          seriesIndex:  int - index of which series to compare to
 *          colorAbove:   colorspec - color with values greater than/equal to the corresponding comparison series
 *          colorBelow:   colorspec - color with values less than the corresponding comparison series
 *      }
 *  }
 * 
 *  Specifying for a single series (recommended):
 * 
 *  $.plot($("#placeholder"), [{
 *      data: [ ... ],
 *      compare: { ... }
 *  }])
 * 
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * (c) Jason Roman <j@jayroman.com>
 */
(function($)
{
    "use strict";

    // default each series to have the comparison feature turned off
    var options = {
        series: {
            compare: {
                enabled: false,
                seriesIndex: 0,
                colorAbove: '#FF0000',
                colorBelow: '#00FF00'
            }
        }
    };

    /**
     * Search and return a series of a plot with the given index
     * 
     * @param {function} plot - the Flot plot function
     * @param {int} i - numerical index of which series to return
     * @returns {false|series} - series at the given index if found, false otherwise
     */
    function getSeries(plot, i)
    {
        var series = plot.getData();

        if (series[i] !== undefined) {
            return series[i];
        }

        return false;
    }

    /**
     * Flatten a 2-dimensional array of Flot data points into an object of (key: value) pairs
     * 
     *  ex: [[1, 2], [3, 4]] is converted to {1: 2, 3: 4}
     * 
     * @param {Object} data - flattened object
     * @param {bool} isVertical - if the series orientation is vertical
     */
    function flattenData(data, isVertical)
    {
        var i;
        var flat = {};

        // loop through all points and add as a key/value pair to the object, adjusted for orientation
        for (i = 0; i < data.length; i++)
        {
            if (isVertical) {
                flat[data[i][0]] = data[i][1];
            } else {
                flat[data[i][1]] = data[i][0];
            }
        }

        return flat;
    }

    /**
     * Copy a series to a new series with empty data
     * 
     * @param {Object} series - series to copy
     * @param {Object} datapoints - datapoints of the series
     * @param {colorspec} color - color of the series
     * @returns {Object} copy - copy of the series with empty data
     */
    function copySeries(series, datapoints, color)
    {
        var copy = $.extend({}, series);

        // empty the data which will be overwritten and the label - make sure the pointsize and format are the same
        copy.data       = [];
        copy.datapoints = { points: [], pointsize: datapoints.pointsize, format: datapoints.format };
        copy.label      = null;

        // copy the bars/lines/points options separately since a deep copy of the entire series cannot be
        // performed, as that would be missing functions that Flot looks for while drawing the series
        copy.bars   = $.extend({}, series.bars);
        copy.lines  = $.extend({}, series.lines);
        copy.points = $.extend({}, series.points);

        // set the color, and set the origin series in case another plugin needs it
        copy.color          = color;
        copy.originSeries   = series;

        // disallow further comparisons on this series since this is a split of an existing series
        copy.compare = { enabled: false };

        return copy;
    }

    /**
     * Initialize values and add a hook on processing the raw data
     * 
     * @param {Plot} plot
     */
    function init(plot)
    {
        var currentSeries = -1;

        /**
         * Compare one series to another and create two new series that separate
         * the values above and below the compared series, then display the new
         * series while hiding the original
         * 
         * @param {function} plot - the Flot plot function
         * @param {Object} series - current series
         * @param {array} data - current series data
         * @param {Object} datapoints - current series pre-normalized data points
         */
        function compareSeries(plot, series, data, datapoints)
        {
            var key, value, comparedSeries;

            // default vertical orientation
            var isVertical = true;

            // update the current series index
            currentSeries++;

            // make sure comparing is enabled and the series is not comparing itself
            if (!series.compare.enabled || series.compare.seriesIndex === currentSeries) {
                return;
            }

            // make sure the series to compare to exists and set it
            if (!(comparedSeries = getSeries(plot, series.compare.seriesIndex))) {
                return;
            }

            // if the series is a horizontal bar chart, set the flag so key/value comparisons can be swapped
            if (series.bars.show && series.bars.horizontal) {
                isVertical = false;
            }

            // convert the comparison data to an object indexed by the keys for easy lookup in the comparisons
            var compareData = flattenData(comparedSeries.data, isVertical);

            // copy the current series into 2 new empty series, one for points equal/above and one for below
            var above = copySeries(series, datapoints, series.compare.colorAbove);
            var below = copySeries(series, datapoints, series.compare.colorBelow);

            // hide the current series from displaying
            series.bars.show    = false;
            series.lines.show   = false;
            series.points.show  = false;

            // loop through the series data and determine which of the new series to push to
            $.each(series.data, function (i, data)
            {
                // get the key/value from the data point, adjusted for orientation
                if (isVertical)
                {
                    key     = data[0];
                    value   = data[1];
                }
                else
                {
                    key     = data[1];
                    value   = data[0];
                }

                // add the data to the appropriate series; adds to 'above' if there is no corresponding comparison point
                if (value >= compareData[key] || !compareData.hasOwnProperty(key)) {
                    above.data.push(data);
                } else {
                    below.data.push(data);
                }
            });

            // add the new series-es (serii?) to the plot
            plot.getData().push(above);
            plot.getData().push(below);
        }

        // hook the compare series function when processing raw data
        plot.hooks.processRawData.push(compareSeries);
    }

    // push as an available plugin to Flot
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'compareseries',
        version: '1.0'
    });

})(jQuery);
