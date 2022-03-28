anychart.onDocumentReady(function () {

    let data_points = [];
    let tables = [];
    let candles = [];

    let plots = [];
    let count = 0;

    /*
    An interval ticker and random number generators simulate incoming data.
		For the demonstration purposes the time is “accelerated”.
    */

    const stage = anychart.graphics.create("container");

    // create and tune the chart
    const chart = anychart.stock();

    var dataset = anychart.data.table();
    dataset.addData(getData());


    //create OHLC series
    // var ohlcSeries = plot.ohlc().name('OHLC');

    // //create volume series
    // var volumeSeries = plot.column().name('Volume');
    // volumeSeries.zIndex(100)
    //     .maxHeight('25%')
    //     .bottom(0);

    // sets y-scale for volume series
    // var customScale = anychart.scales.log();
    // volumeSeries.yScale(customScale);

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
            time : 0,
        });

        const plot = chart.plot(count);
        let temp = anychart.data.table();
        let temp1 = anychart.data.table();

        temp.addData(getData());
        temp1.addData(getData());

        tables.push(temp);
        candles.push(temp1);
        // var ohlcSeries = plot.ohlc().name(symbol+'_OHLC');

        // //create volume series
        // var volumeSeries = plot.column().name(symbol+'_Volume');
        // volumeSeries.zIndex(100)
        //     .maxHeight('25%')
        //     .bottom(0);
        
        // var customScale = anychart.scales.log();
        // volumeSeries.yScale(customScale);

        plot
            .xGrid(true)
            .yGrid(true)
            .xMinorGrid(true)
            .yMinorGrid(true)
            .line()
            .data(temp.mapAs({ value: 6}))
            .name(symbol)
            .tooltip(true);
    
        let candleseries = plot.candlestick().name(symbol + "_Candle Stick");

        candleseries.risingStroke("#336666");
        candleseries.risingFill("#339999");
        candleseries.fallingStroke("#660000");
        candleseries.fallingFill("#990033");

        let mapping = temp1.mapAs();

        mapping.addField('open', 1);
        mapping.addField('close', 2);
        mapping.addField('high', 3);
        mapping.addField('low', 4);
        mapping.addField('volume', 5);


        var mapping1 = temp1.mapAs({
            open: 1,
            high: 2,
            low: 3,
            close: 4,
            value: {
              column: 5,
              type: 'sum'
            }
          });
  
    
        // let mapping1 = temp1.mapAs();
        // mapping1.addField('volume' , 5);


        candleseries.data(mapping);
        
        plot
            .ema(temp.mapAs({value : 6}));
        
        // let volumeSeries = plot.column().name(symbol+'_Volume');
        // volumeSeries.zIndex(100)
        //     .maxHeight('25%')
        //     .bottom(0);
        
        // var customScale = anychart.scales.log();
        // volumeSeries.yScale(customScale);

        // volumeSeries.data(mapping1);

        var volumeSeries = plot.column(mapping1);
        // set series settings
        volumeSeries.name(symbol+'_Volume').zIndex(100).maxHeight('20%').bottom(0);
        volumeSeries.legendItem({
          iconEnabled: false,
          textOverflow: ''
        });

        // create a logarithmic scale
        var customScale = anychart.scales.log();
        // sets y-scale
        volumeSeries.yScale(customScale);

        // set volume rising and falling stroke settings
        volumeSeries.risingStroke('red');
        volumeSeries.fallingStroke('green');

        // set volume rising and falling fill settings
        volumeSeries.risingFill('red .5');
        volumeSeries.fallingFill('green .5');


        $("#stock-list").append(
            "<a class='stock-label list-group-item small'>" + symbol + "</a>"
        );

        count = count + 1;
    });
    // sconsole.log(data_points);
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

    var rangePicker = anychart.ui.rangePicker();
    // init range picker
    rangePicker.render(chart);

    // create range selector
    var rangeSelector = anychart.ui.rangeSelector();
    // init range selector
    rangeSelector.render(chart);

    /* --- simulation code --- */

    //simulate price ticker

    // chart.scroller().area(temp.mapAs({ value: 4 }));
    chart.container(stage).draw();

    //updating chart handler
    function stream(message) {
        const obj1 = JSON.parse(message); // this is how you parse a string into JSON
        const obj = JSON.parse(obj1);
        const symbol = obj['symbol'];
        var i = getSymbolIndex(symbol, data_points);

        var newData = [];
        newData[0] = new Array(7);

        newData[0][0] = obj['timestamp'];
        newData[0][1] = obj["open"];
        newData[0][2] = obj['close'];
        newData[0][3] = obj['high'];
        newData[0][4] = obj['low'];
        newData[0][5] = obj['volume'];
        newData[0][6] = obj['price'];

        let name = obj['name'];
        //get timestamp of incoming price tick
        // console.log(obj['price']);
        tables[i].addData(newData);

        if (obj['timestamp'] - data_points[i].time > 60){
            candles[i].addData(newData);
            data_points[i].time = obj['timestamp'];
        }
    }

    var socket = io();
    // - Whenever the server emits 'data', update the flow graph
    socket.on('data', function (data) {          
    	stream(data);
    });
});

function getData() {
    return [];
}    