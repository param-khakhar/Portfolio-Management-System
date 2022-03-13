// anychart.onDocumentReady(function (){

//     var data_points = [];

//     $("#chart").height($(window).height() - $("#header").height() * 2);

//     $(document.body).on('click', '.stock-label', function () {
//         "use strict";
//         var symbol = $(this).text();
//         $.ajax({
//             url: 'http://localhost:5000/' + symbol,
//             type: 'DELETE'
//         });

//         $(this).remove();
//         var i = getSymbolIndex(symbol, data_points);
//         data_points.splice(i, 1);
//         // console.log(data_points);
//     });

//     $("#add-stock-button").click(function () {
//         "use strict";
//         var symbol = $("#stock-symbol").val();

//         $.ajax({
//             url: 'http://localhost:5000/' + symbol,
//             type: 'POST'
//         });

//         $("#stock-symbol").val("");
//         data_points.push({
//             key: symbol,
//             values: [],
//             table: anychart.data.table()
//         });
//         console.log(data_points);
//         $("#stock-list").append(
//             "<a class='stock-label list-group-item small'>" + symbol + "</a>"
//         );

//     });

//     function getSymbolIndex(symbol, array) {
//         "use strict";
//         for (var i = 0; i < array.length; i++) {
//             if (array[i].key == symbol) {
//                 return i;
//             }
//         }
//         return -1;
//     }

// // var temperatureIndexJSON = [
// //  {
// //    key: "AMZN",
// //    values: [{ "x": 1998, "y": 0.45 }, { "x": 1999, "y": 0.48 }, { "x": 2000, "y": 0.5 }, { "x": 2001, "y": 0.52 }, { "x": 2002, "y": 0.55 }, { "x": 2003, "y": 0.58 }, { "x": 2004, "y": 0.6 }, { "x": 2005, "y": 0.61 }, { "x": 2006, "y": 0.61 }, { "x": 2007, "y": 0.61 }, { "x": 2008, "y": 0.62 }, { "x": 2009, "y": 0.62 }, { "x": 2010, "y": 0.62 }, { "x": 2011, "y": 0.63 }, { "x": 2012, "y": 0.67 }, { "x": 2013, "y": 0.71 }, { "x": 2014, "y": 0.77 }, { "x": 2015, "y": 0.83 }, { "x": 2016, "y": 0.89 }, { "x": 2017, "y": 0.95 }]
// //  },
// //  {
// //    key: "APPL",
// //    values: [{ "x": 1998, "y": 0.85 }, { "x": 1999, "y": 0.78 }, { "x": 2000, "y": 0.65 }, { "x": 2001, "y": 0.52 }, { "x": 2002, "y": 0.55 }]
// //  }
// // ];


//     // var chart = nv.models.lineChart()
//     //     .interpolate('monotone')
//     //     .margin({
//     //         bottom: 100
//     //     })
//     //     .useInteractiveGuideline(true)
//     //     .showLegend(true)
//     //     .color(d3.scale.category10().range());

//     // chart.xAxis
//     //     .axisLabel('Time')
//     //     .tickFormat(formatDateTick);

//     // chart.yAxis
//     //     .axisLabel('Price');

//     // nv.addGraph(loadGraph);

//     // create stock chart
//     var chart = anychart.stock();
//     // create first plot on the chart
//     var plot = chart.plot(0);

//     // map loaded data for the ohlc series
//     // var mapping = dataTable.mapAs({
//     //     open: 1,
//     //     high: 2,
//     //     low: 3,
//     //     close: 4
//     // });

//     // plot
//     //     .ohlc()
//     //     .data(mapping)
//     //     .name('AMZ');

//     // // set grid settings
//     // plot
//     //     .yGrid(true)
//     //     .xGrid(true)
//     //     .yMinorGrid(true)
//     //     .xMinorGrid(true);

//     // // create scroller series with mapped data
//     // chart.scroller().area(data.mapAs({ value: 4 }));

//     // // sets the title of the chart
//     // chart.title('Amazon Inc. Stock Prices');

//     // // set container id for the chart
//     // chart.container('container');

//     // // initiate chart drawing
//     // chart.draw();

//     function loadGraph(i) {
//         plot.line()
//         .data(data_points[i].table.mapAs({value : 4}))
//         .name(data_points[i].key)
//         .tooltip(false);
//         console.log(data_points[i].table.length);
//       }



//     // function loadGraph() {
//     //     // "use strict";
//     //     // d3.select('#chart svg')
//     //     //     .datum(temperatureIndexJSON)
//     //     //     .transition()
//     //     //     .duration(5)
//     //     //     .call(chart);

//     //     // nv.utils.windowResize(chart.update);
//     //     // return chart;
//     // }

//     function newDataCallback(message) {
//     //    "use strict";
//         const parsed = JSON.parse(message);
        
//         try {
//             var obj = JSON.parse(parsed); // this is how you parse a string into JSON 
//             document.body.innerHTML += obj.hello;
//         } catch (ex) {
//             console.error(ex);
//         }

//         var timestamp = obj["timestamp"];
//         var symbol = obj["symbol"];
//         var open = obj["open"];
//         var close = obj['close'];
//         var high = obj['high'];
//         var low = obj['low'];

//         var i = getSymbolIndex(symbol, data_points);

//         data_points[i].table.addData([open, close, high, low])  
//         // console.log(data_points[i].key);

//         // console.log(typeof data_points);
//         // console.log(typeof data_points[0].values);
//         // console.log(typeof data_points[0].key);
//         if (data_points[i].values.length > 100) {
//             data_points[i].values.shift();
//         }
//         loadGraph(i);
//     }

//     function formatDateTick(time) {
//         "use strict";
//         var date = new Date(time * 1000);
//         return d3.time.format('%H:%M:%S')(date);
//     }

//     var socket = io();
//     // - Whenever the server emits 'data', update the flow graph
//     socket.on('data', function (data) {
//         // console.log(temperatureIndexJSON);
//         // console.log(data_points);
//         //  console.log(data);     
//     	newDataCallback(data);
//     });
// });



// // anychart.onDocumentReady(function () {
// //     anychart.data.loadCsvFile( 'https://gist.githubusercontent.com/shacheeswadia/e2fd68f19e5331f87d38473a45a11dbe/raw/396b3e14f2d7e05aa188e0a420a7b622ed4111bd/amzohlcweekly.csv',
// //       function (data) {
// //         // All code here
// //         console.log("Oh My God!");
// //       }
// //     )
// //   });

anychart.onDocumentReady(function () {
    // The data used in this sample can be obtained from the CDN
    // https://cdn.anychart.com/csv-data/msft-daily-short.js
    // https://cdn.anychart.com/csv-data/orcl-daily-short.js
    // https://cdn.anychart.com/csv-data/csco-daily-short.js
    // https://cdn.anychart.com/csv-data/ibm-daily-short.js
  
    // create data tables on loaded data
    var msftDataTable = anychart.data.table();
    var m = get_msft_daily_short_data();
    console.log(m);
    msftDataTable.addData(get_msft_daily_short_data()); // eslint-disable-line no-undef
  
    var orclDataTable = anychart.data.table();
    orclDataTable.addData(get_orcl_daily_short_data()); // eslint-disable-line no-undef
  
    var cscoDataTable = anychart.data.table();
    cscoDataTable.addData(get_csco_daily_short_data()); // eslint-disable-line no-undef
  
    var ibmDataTable = anychart.data.table();
    ibmDataTable.addData(get_ibm_daily_short_data()); // eslint-disable-line no-undef
  
    // create stock chart
    var chart = anychart.stock();
  
    // create first plot on the chart with column series
    var firstPlot = chart.plot(0);
    // create line series on the first plot
    firstPlot
      .line()
      .data(msftDataTable.mapAs({ value: 4 }))
      .name('MSFT');
  
    // create second plot on the chart
    var secondPlot = chart.plot(1);
    // create spline line series on the second plot
    secondPlot
      .spline()
      .data(orclDataTable.mapAs({ value: 4 }))
      .name('ORCL')
      .fill('#1976d2 0.65')
      .stroke('1.5 #1976d2');
  
    // create third plot
    var thirdPlot = chart.plot(2);
    // create step line series on the third plot
    thirdPlot
      .stepLine()
      .data(cscoDataTable.mapAs({ value: 4 }))
      .name('CSCO')
      .fill('#ef6c00 0.65')
      .stroke('1.5 #ef6c00');
  
    // create forth plot
    var forthPlot = chart.plot(3);
    // create step line series on the forth plot
    forthPlot
      .line()
      .data(msftDataTable.mapAs({ value: 4 }))
      .name('MSFT')
      .tooltip(false);
    forthPlot
      .spline()
      .data(orclDataTable.mapAs({ value: 4 }))
      .name('ORCL')
      .tooltip(false);
    forthPlot
      .stepLine()
      .data(cscoDataTable.mapAs({ value: 4 }))
      .name('CSCO')
      .tooltip(false);
  
    // create scroller series with mapped data
    chart.scroller().line(msftDataTable.mapAs({ value: 4 }));
  
    // set chart selected date/time range
    chart.selectRange('2005-01-03', '2005-11-20');
  
    // set container id for the chart
    chart.container('container');
    // initiate chart drawing
    chart.draw();
  
    // create range picker
    var rangePicker = anychart.ui.rangePicker();
    // init range picker
    rangePicker.render(chart);
  
    // create range selector
    var rangeSelector = anychart.ui.rangeSelector();
    // init range selector
    rangeSelector.render(chart);
  });