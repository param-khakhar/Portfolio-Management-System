var the_sum = 50000;
var groupsColors = ['#fb8c00', '#1976d2'];

let totalValue = 0;
// function drawDonutChart(container_id) {
//   var chart = anychart.pie();
//   chart.interactivity('single');
//   chart.legend(false);
//   chart.radius('40%');
//   chart.innerRadius('60%');
//   chart.padding(0);
//   chart.margin(0);
//   chart.explode(0);
//   chart.labels(false);
//   var dataset = anychart.data.set();
//   chart.data(dataset);
//   var stage = anychart.graphics.create(container_id);
//   chart.container(stage);
//   var path = stage.path().stroke(null).zIndex(10);
//   chart.draw();
//   return {'chart': chart, 'path': path, 'dataset': dataset};
// }

// function updateDonutListeners(donutData, instrumentsTable){
//   var groupIndexes = [];
//   donutData['chart'].listen('pointshover', function (e) {
//         drawHoverArc(e.point, donutData['chart'], donutData['data'], donutData['path']);
//         groupIndexes = [];
//         var colorFill = '#ffa760';
//         if (donutData['data'][e.point.index]['group'] == 'bonds') colorFill = '#6fc0fe';
//         if ($('#table-container').is(':visible')) {
//           groupIndexes = [e.point.index];
//           highLightRowInTable(groupIndexes, instrumentsTable, colorFill + ' 0.3')
//         }
//       });
//   donutData['chart'].listen('mouseout', function (e) {
//         if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, null);
//       });

//   function createChartLabel(index, anchor, groupName, groupColor) {
//     var label = donutData['chart'].label(index).useHtml(true);
//     label.position('center');
//     label.fontColor(groupColor);
//     label.anchor(anchor);
//     label.offsetY(-10);
//     label.offsetX(10);
//     label.hAlign('center');
//     label.listen('mouseOver', function () {
//       document.body.style.cursor = 'pointer';
//       groupIndexes = [];
//       for (i = 0; i < donutData['data'].length; i++){
//         if (donutData['data'][i]["group"] == groupName) groupIndexes.push(i)
//       }
//       if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, groupColor + ' 0.3');

//       donutData['chart'].unhover();
//       donutData['chart'].hover(groupIndexes);
//       donutData['path'].clear();
//       for (var i = 0; i < groupIndexes.length; i++){
//         drawHoverArc(donutData['chart'].getPoint(groupIndexes[i]), donutData['chart'], donutData['data'], donutData['path'], true);
//       }
//     });
//     label.listen('mouseOut', function () {
//       document.body.style.cursor = '';
//       donutData['chart'].unhover();
//       donutData['path'].clear();
//       if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, null);
//     });
//   }
//   createChartLabel(0, 'left-center', 'stocks', '#ffa760');
//   createChartLabel(1, 'right-center', 'bonds', '#6fc0fe');
// }

function drawTable(container_id){
    var table = anychart.standalones.table();
    table.hAlign('center');
    table.container(container_id);
    table.cellBorder(null);
    table.cellBorder().bottom('1px #dedede');
    table.fontSize(15).vAlign('middle').hAlign('left').fontColor('#212121');
    // table.contents([['Name', 'Ticker', 'Open', 'Close', 'High', 'Low', 'Price', 'Amount', 'Total Sum']]);
    table.contents([['Name', 'Ticker', 'Average Price', 'Price', 'Amount', 'Total Sum']]);
    table.getCol(0).width(200);
    table.getCol(0).fontSize(15);
    table.getRow(0).cellBorder().bottom('2px #dedede').fontColor('#7c868e').height(50).fontSize(15);
    table.getCol(1).width(200);
    table.getCol(2).width(200);
    table.getCol(3).width(200);
    table.getCol(4).width(200);
    table.getCol(5).width(200 );
    // table.getCol(6).width(60);
    // table.getCol(7).width(80);
    // table.getCol(8).width(80);
    table.draw();
    return table;
}

function updateTableData(table, data){
  var contents = [
    // ['Name', 'Ticker', 'Open', 'Close', 'High', 'Low', 'Price', 'Amount', 'Total Sum']
    ['Name', 'Ticker', 'Average Price', 'Price', 'Amount', 'Total Sum']
  ];
  for (var i = 0; i < data.length; i++){
    contents.push([

        // data[i][0],
        // data[i][1],
        // data[i][2] + '$',
        // data[i][3] + '$',
        // data[i][4] + '$',
        // data[i][5] + '$',
        // data[i][6] + '$',
        // data[i][7],
        // data[i][8] + '$'

        data[i][0],
        data[i][1],
        data[i][2],
        data[i][3] + '$',
        data[i][4],
        data[i][5] + '$',
    ]);
  }
  table.contents(contents);
  table.draw();
}

function highLightRowInTable(indexes, table, color){
  if (!indexes) return;
  for (var i = 0; i < indexes.length; i++){
    table.getRow(indexes[i] + 1).cellFill(color);
  }
}

// function drawHoverArc(point, chart, data, path, needClear){
//   var colorFill = '#ffa760';
//   if (data[point.index]['group'] == 'bonds') colorFill = '#6fc0fe';
//   drawArc(point, chart, colorFill, path, !needClear)
// }

// function getDataInProportion(data, proportion){
//   var sumProp = (proportion[0][0] + proportion[1][0]);
//   proportion[0][2] = the_sum * proportion[0][0] / sumProp;
//   proportion[1][2] = the_sum * proportion[1][0] / sumProp;

//   var consts = [[0, 1, 1, 2, 3, 3, 4, 6, 7, 8, 10], [0, 1, 2, 2, 3, 5, 6, 6, 7, 8, 10]];

//   var result = {"data": [], "proportion": proportion};
//   for (var group = 0; group < proportion.length; group++) {
//     var group_palette = anychart.palettes.distinctColors(anychart.color.singleHueProgression(groupsColors[group], proportion[group][0] + 1));
//     var groupName = proportion[group][1];
//     var dataForGroup = data[groupName];
//     var groupItemsCount = consts[group][proportion[group][0]];
//     var totalRisk = 0;
//     var tickerIndex;
//     for (tickerIndex = 0; tickerIndex < groupItemsCount; tickerIndex++) {
//       totalRisk += 1 / dataForGroup[tickerIndex]['risks'];
//     }
//     for (tickerIndex = 0; tickerIndex < groupItemsCount; tickerIndex++) {
//       var dataPoint = dataForGroup[tickerIndex];
//       var point = {};
//       point['group'] = groupName;
//       point['price'] = dataPoint['value'];
//       point['coefficient'] = dataPoint['coefficient'];
//       point['ticker'] = dataPoint['ticker'];
//       point['name'] = dataPoint['name'];
//       point['fill'] = group_palette.itemAt(proportion[group][0] - tickerIndex);
//       point['stroke'] = null;
//       point['hovered'] = {
//         'fill': anychart.color.lighten(anychart.color.lighten(group_palette.itemAt(proportion[group][0] - tickerIndex))),
//         'stroke': null
//       };
//       point['value'] = (proportion[group][2] / dataPoint['risks'] / totalRisk).toFixed(2);
//       point['amount'] = Math.floor(point['value'] / point['price']);
//       point['percent'] = (point['value'] * 100 / the_sum).toFixed(2);
//       result["data"].push(point);
//     }
//   }

//   return result
// }

anychart.onDocumentReady(function () {

    let data_points = [];
    let candles = [];
    let count = 0;
    var total;

    // $(document.body).on('click', '.stock-label', function () {
    //     "use strict";
    //     var symbol = $(this).text();
    //     $.ajax({
    //         url: 'http://localhost:5000/' + symbol,
    //         type: 'DELETE'
    //     });

    //     $(this).remove();
    //     var i = getSymbolIndex(symbol, data_points);
    //     data_points.splice(i, 1);
    //     // console.log(data_points);
    // });

    $("#add-stock-button").click(function () {

        "use strict";
        var symbol = $("#stock-symbol").val();
        var qty = $("#stock-qty").val();

        $.ajax({
            // url: 'http://localhost:5000/query/' + symbol,
            url: 'http://localhost:5000/' + symbol,
            type: 'POST'
        });

        $("#Symbol").val("");
        data_points.push({
            key: symbol,
            amount: qty,
            first : false,
            time : 0,
        });

        let temp1 = anychart.data.table();
        candles.push(temp1);

        $("#stock-list").append(
            "<a class='stock-label list-group-item small'>" + symbol + "</a>"
        );
        console.log(data_points);
        count = count + 1;
    });


    function getSymbolIndex(symbol, array) {
        "use strict";
        for (var i = 0; i < array.length; i++) {
            if (array[i].key == symbol) {
                return i;
            }
        }
        return -1;
    }

  var donutData, forecastData, instrumentsTable, stockData;

  // donutData = drawDonutChart('donut-chart-container');
  instrumentsTable = drawTable('table-container');

  let newData = [];


  $('.stock_quotes input[type=checkbox]').on('click', function(){
    if ($(this).attr('id') == 'log'){
      var plot = stockData['stock'].plot();
      if ($(this).prop('checked')) {
        plot.yScale('log');
      }
      else {
        plot.yScale('linear');
      }
      var seriesCount = plot.getSeriesCount();
      for (var i = 0; i < seriesCount; i++) {
        plot.getSeriesAt(i).yScale(plot.yScale());
      }
      plot.yAxis(0).scale(plot.yScale());
      plot.yAxis(1).scale(plot.yScale());
    } else {
      var series = stockData[$(this).attr('id')];
      series.enabled($(this).prop('checked'));
    }
  });

  function stream(message) {
    const obj1 = JSON.parse(message); // this is how you parse a string into JSON
    const obj = JSON.parse(obj1);
    const symbol = obj['symbol'];
    var i = getSymbolIndex(symbol, data_points);

    // newData[0] = new Array(9);

    // newData[0][0] = obj['name'];
    // newData[0][1] = symbol;
    // newData[0][2] = obj["open"];
    // newData[0][3] = obj['close'];
    // newData[0][4] = obj['high'];
    // newData[0][5] = obj['low'];
    // newData[0][6] = obj['price'];
    // // newData[0][7] = obj['volume'];
    // newData[0][7] = data_points[i].amount;
    // newData[0][8] = newData[0][6] * newData[0][7];

    total = 0;
    
    newData[i] = new Array(6);
    newData[i][0] = obj['name'];
    newData[i][1] = symbol;
    newData[i][2] = Number(obj['average'].toFixed(2));
    total -= Number((newData[i][3] * newData[i][4]).toFixed(2)); 
    newData[i][3] = obj['price'];
    newData[i][4] = data_points[i].amount;
    newData[i][5] = Number((newData[i][3] * newData[i][4]).toFixed(2));
    totalValue = 0;
    for(var i = 0; i < data_points.length; i++){
        console.log(newData[i][5], total);
        totalValue = totalValue + Number(newData[i][5]);

    }
    console.log("Total:",totalValue);
    document.getElementById("TotalValue").innerHTML=Number(totalValue.toFixed(2));

    // newData[i][2] = obj['average'];

    updateTableData(instrumentsTable, newData);
}

    var socket = io();
    // - Whenever the server emits 'data', update the flow graph
    socket.on('data', function (data) {          
        stream(data);
    });
});

// // helper function to draw a beauty arc
// function drawArc(point, chart, fillColor, path, needClear) {
//     if (needClear) path.clear();
//     if (!point.hovered()) return true;
//     path.fill(fillColor);
//     var start = point.getStartAngle();
//     var sweep = point.getEndAngle() - start;
//     var radius = chart.getPixelRadius();
//     var explodeValue = chart.getPixelExplode();
//     var exploded = point.exploded();
//     var cx = chart.getCenterPoint().x;
//     var cy = chart.getCenterPoint().y;
//     var innerR = radius + 3;
//     var outerR = innerR + 5;
//     var ex = 0;
//     var ey = 0;
//     if (exploded) {
//         var angle = start + sweep / 2;
//         var cos = Math.cos(toRadians(angle));
//         var sin = Math.sin(toRadians(angle));
//         ex = explodeValue * cos;
//         ey = explodeValue * sin;
//     }
//     acgraph.vector.primitives.donut(path, cx + ex, cy + ey, outerR, innerR, start, sweep);
// }

// // helper function to convert degrees to radians
// function toRadians(angleDegrees) {
//     return angleDegrees * Math.PI / 180;
// }

// helper function to calculate price of our portfolio based on historical prices for each instrument
function calculateDataForStock(proportion_data, historical_data){
  var result = [];
  var hist = historical_data[proportion_data[0]['ticker']];

  for (var i = 0; i < hist.length; i++){
      var sum = 0;
      for (var j = 0; j < proportion_data.length; j++){
          sum = sum + (parseFloat(proportion_data[j]['amount']) * parseFloat(historical_data[proportion_data[j]['ticker']][i]['value']))
      }
      result.push({'date': hist[i].date, 'value': sum});
  }
  return result;
}