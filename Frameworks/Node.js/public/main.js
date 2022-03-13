anychart.onDocumentReady(function () {

    let data_points = [];
    let tables = [];

    /*
    An interval ticker and random number generators simulate incoming data.
		For the demonstration purposes the time is “accelerated”.
    */

    //create new point every 1 minute
    var period = 60000;
    //new price ticks come every 15 seconds
    var tickPeriod = 15000;

    var stage = anychart.graphics.create("container");

    // create and tune the chart
    var chart = anychart.stock();
    var plot = chart.plot();

    //create OHLC series
    // var ohlcSeries = plot.ohlc().name('OHLC');

    //create volume series
    // var volumeSeries = plot.column().name('Volume');
    // volumeSeries.zIndex(100)
    //     .maxHeight('25%')
    //     .bottom(0);

    // create dataset
    var dataset = anychart.data.table();
    dataset.addData(getData());

    // sets y-scale for volume series
    // var customScale = anychart.scales.log();
    // volumeSeries.yScale(customScale);

    //map data
    var mapping = dataset.mapAs({
        x: 0,
        open: 1,
        high: 2,
        low: 3,
        close: 4,
        value: {
            column: 5
        }
    });

    $(document.body).on('click', '.stock-label', function () {
        "use strict";
        var symbol = $(this).text();
        $.ajax({
            url: 'http://localhost:5000/' + symbol,
            type: 'DELETE'
        });

        $(this).remove();
        var i = getSymbolIndex(symbol, data_points);
        data_points.splice(i, 1);
        // console.log(data_points);
    });

    $("#add-stock-button").click(function () {
        "use strict";
        var symbol = $("#stock-symbol").val();

        $.ajax({
            url: 'http://localhost:5000/' + symbol,
            type: 'POST'
        });

        $("#stock-symbol").val("");
        data_points.push({
            key: symbol,
            first : false,
        });

        let temp = anychart.data.table();
        temp.addData(getData());
        tables.push(temp);
        plot
          .stepLine()
          .data(tables[tables.length-1].mapAs({ value: 4 }))
          .name(symbol)
         .tooltip(false);

        $("#stock-list").append(
            "<a class='stock-label list-group-item small'>" + symbol + "</a>"
        );

    });
    console.log(data_points);
    function getSymbolIndex(symbol, array) {
        "use strict";
        for (var i = 0; i < array.length; i++) {
            if (array[i].key == symbol) {
                return i;
            }
        }
        return -1;
    }    

    //set mapping to both series
    // ohlcSeries.data(mapping);
    // volumeSeries.data(mapping);

    //render chart

    chart.container(stage).draw();

    /* --- simulation code --- */

    //create empty array for point data update

    //select the last point from existing datatable
    var selectable = mapping.createSelectable();
    selectable.selectAll();
    var iterator = selectable.getIterator();

    var newDataRow = [];
    newDataRow[0] = new Array(5);

    while(iterator.advance()) {
        //put data from the last exsiting point
        newDataRow[0][0] = iterator.get('x');
        newDataRow[0][1] = iterator.get('open');
        newDataRow[0][2] = iterator.get('high');
        newDataRow[0][3] = iterator.get('low');
        newDataRow[0][5] = iterator.get('value');
    }
    //timestamp variable for incoming ticks
    var newTimestamp = newDataRow[0][0];

    //simulate price ticker

    //updating chart handler
    function stream(message) {
        const obj1 = JSON.parse(message); // this is how you parse a string into JSON
        const obj = JSON.parse(obj1);
        const symbol = obj['symbol'];
        var i = getSymbolIndex(symbol, data_points);

        var newData = [];
        newData[0] = new Array(6);

        newTimestamp += tickPeriod;
    
        newData[0][0] = obj['timestamp'];
        newData[0][1] = obj["open"];
        newData[0][2] = obj['close'];
        newData[0][3] = obj['high'];
        newData[0][4] = obj['low'];
        newData[0][5] = obj['volume'];

        //get new price
        price = randomPrice();
        //get timestamp of incoming price tick

        console.log(typeof tables[i]);
        tables[i].addData(newData);
    }

    var socket = io();
    // - Whenever the server emits 'data', update the flow graph
    socket.on('data', function (data) {          
    	stream(data);
    });
});

function getData() {
    return [[0, 0, 0, 0, 0, 0]];
}