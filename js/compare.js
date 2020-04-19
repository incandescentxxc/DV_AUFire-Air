function start(){
    var dataFirePromise = d3.json("http://localhost:8080/json/fire_thisyear.json");
    var dataLastPromise = d3.json("http://localhost:8080/json/fire_lastyear.json");
    var mapPromise = d3.json("http://localhost:8080/aus_state.geojson");
    Promise.all([mapPromise, dataFirePromise, dataLastPromise]).then(values=> {
        mapData = values[0];
        fireData = values[1];
        fireLast = values[2];

        //create SVG
        var margin = {top:50, right:50, bottom:50, left:50},
        width = (1200 - margin.left - margin.right)/2,
        height = (700 - margin.top - margin.bottom)/4*3;
        let svg_last = d3.select("#map").append('svg')
            .attr("class","svg-last")
            .style("width", width + margin.left + margin.right)
            .style("height", height + margin.top + margin.bottom)
            .style("padding-top", 50);
        let svg = d3.select("#map").append('svg')
            .attr("class","svg-cur")
            // .attr("viewBox", [0, 0, 400, 400]);
            .style("width", width + margin.left + margin.right + 50)
            .style("height", height + margin.top + margin.bottom)
            .style("padding-top", 50);
        
        //projection function is a convertor which translates the cooridinates in lat and long to the actual
        //cooridinates in d3.
        var projection = d3.geoConicConformal() //projection with fine-tuned parameters exclusively for AU
            .rotate([-132, 0])
            .center([0, -27])
            .parallels([-18, -36])
            .scale(750)
            .translate([width / 2, height / 2])
            .precision(0.1);

        var geoGenerator = d3.geoPath().projection(projection);
        // draw the map last year
        svg_last.append('g').selectAll('path')
        .data(mapData.features)
        .enter()
            .append('path')
            .attr('d', geoGenerator) //the attribute that defines the coordinates of a path
            .attr( "fill", "#BDC0BA" )
            .attr( "stroke", "#999" );
        // draw the map this year
        svg.append('g').selectAll('path')
        .data(mapData.features)
        .enter()
            .append('path')
            .attr('d', geoGenerator) //the attribute that defines the coordinates of a path
            .attr( "fill", "#BDC0BA" )
            .attr( "stroke", "#999" );
        
        // some specifications for rendering time slider
        var formatDate = d3.timeFormat("%Y-%m-%d");    

        var startDateCur = new Date("2019-09-01"),
        endDateCur = new Date("2020-02-28");

        var startDateLast = new Date("2018-09-01"),
        endDateLast = new Date("2019-02-28");
        
        var currentValue = 0;
        var targetValue = height/3*2; //height = 700
        var switchChecked = true; //initial value


        var y = d3.scaleTime()
        .domain([startDateCur, endDateCur])
        .range([0, targetValue])
        .clamp(true);

        var yLast = d3.scaleTime()
        .domain([startDateLast, endDateLast])
        .range([0, targetValue])
        .clamp(true);


        var width_translate = width + 40;
        var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + width_translate + "," + height/5 + ")");

        var sliderLast = svg_last.append("g")
        .attr("class", "sliderlast")
        .attr("transform", "translate(" + width + "," + height/5 + ")");

        slider.append("line")
        .attr("class", "track")
        .attr("y1", y.range()[1])
        .attr("y2", y.range()[0])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() {
                currentValue = d3.event.y;
                updateSlider(currentValue, y, yLast);
                updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
            })
        );


        sliderLast.append("line")
        .attr("class", "track")
        .attr("y1", yLast.range()[1])
        .attr("y2", yLast.range()[0])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() {  sliderLast.interrupt(); })
            .on("start drag", function() {
                currentValue = d3.event.y;
                updateSlider(currentValue, y, yLast);
                updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
            })
        );

        slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(" + 30 + ",0)")
        .selectAll("text")
        .data(y.ticks(10))
        .enter()
        .append("text")
        .attr("x", 10)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDate(d); });

        sliderLast.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(" + 30 + ",0)")
        .selectAll("text")
        .data(yLast.ticks(10))
        .enter()
        .append("text")
        .attr("x", 10)
        .attr("y", yLast)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDate(d); });

        var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9)
        .style("stroke","#000");
        console.log(handle)

        var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDateCur))
        .attr("transform", "translate("+ (-50) + "," + (-15) + ")")

        var handleLast = sliderLast.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9)
        .style("stroke","#000");

        var labelLast = sliderLast.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDateLast))
        .attr("transform", "translate("+ (-50) + "," + (-15) + ")")

        var playButton = d3.select("#play-button");
        var moving = false;
        
        playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
                updateSlider(currentValue,y,yLast);
                updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
            console.log("Slider moving: " + moving);
        })
        function step() {
            updateSlider(currentValue,y,yLast);
            updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
            currentValue = currentValue + (targetValue/180); // 153 is the specific days recorded
            if (currentValue > targetValue) {
              moving = false;
              currentValue = 0;
              clearInterval(timer);
              // timer = 0;
              playButton.text("Play");
              console.log("Slider moving: " + moving);
              updateSlider(currentValue,y,yLast);
              updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
            }
        }

        // update the handle and label of the timeslider 
        function updateSlider(curValue, y, yLast) {
            console.log(curValue)
            if(curValue <= targetValue + 5 && curValue >= 0){
                handle.attr("cy", curValue);
                label
                  .attr("y", curValue)
                  .text(formatDate(y.invert(curValue)));
                handleLast.attr("cy",curValue);
                labelLast
                    .attr("y",curValue)
                    .text(formatDate(yLast.invert(curValue)));
            }
        }


        // render the data for the first time
        initData = fireData.filter(item => item["acq_date"] === "2019-09-01" && item["daynight"] === "D" && parseInt(item["confidence"]) > 90 );
        initLast = fireLast.filter(item => item["acq_date"] === "2018-09-01" && item["daynight"] === "D" && parseInt(item["confidence"]) > 90 );
        render(svg, svg_last, initData, initLast, projection);
        renderLegend();
        d3.select("#myonoffswitch").on("change",d=>{
            switchChecked = !switchChecked; //change into oposite
            updateGraph(y.invert(currentValue),yLast.invert(currentValue), switchChecked, fireData, fireLast, projection, svg, svg_last);
        });
    })
}
function render(svg, svg_last, data, dataLast, projection){

    var colorScale = d3.scaleSequential()
            .domain([
                300,550
            ])
            .interpolator(d3.interpolateOrRd);

    var sizeScale = d3.scaleLinear()
        .domain([1, 12])
        .range([4,9]);

    svg.selectAll("circle").filter(".data-point") //only choose those who have class= data-point
    .data(data, d => d)
    .join(
        enter => enter
        .insert('circle')
        .attr("class", "data-point")
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", 1),

        update => update
        .attr("class", "data-point")
        // .transition()
        // .duration(100)
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", 1),

        exit => {
            return exit.remove();
        });

        svg.select("#text-info").remove();
        svg.append('text')
        .attr("id","text-info")
        .attr("x", 100)
        .attr("y", 520)
        .text("Number of Temperature Anomaly is " + data.length)
        .style("fill", "black")
        .style("font-size", "14px")

    svg_last.selectAll("circle").filter(".datalast-point") //only choose those who have class= data-point
    .data(dataLast, d => d)
    .join(
        enter => enter
        .insert('circle')
        .attr("class", "datalast-point")
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", 1),

        update => update
        .attr("class", "datalast-point")
        // .transition()
        // .duration(100)
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", 1),


        exit => {
            return exit.remove();
        });

        svg_last.select("#text-info").remove()
        svg_last.append('text')
        .attr("id","text-info")
        .attr("x", 100)
        .attr("y", 520)
        .text("Number of Temperature Anomaly is " + dataLast.length)
        .style("fill", "black")
        .style("font-size", "14px")

            // add size legend and remove previous ones
        svg.select(".legendCells").remove();
        svg.select(".legendTitle").remove();
        var legend = d3.legendSize()
        .shape("circle")
        .orient("vertical")
        .scale(sizeScale)
        .title("Fire area in km²")
        // .color("grey")
        
        svg.append("g")
        .attr("transform", "translate(10,30)")
        .call(legend)


        // add size legend and remove previous ones
        svg_last.select(".legendCells").remove();
        svg_last.select(".legendTitle").remove();
        var legend = d3.legendSize()
        .shape("circle")
        .orient("vertical")
        .scale(sizeScale)
        .title("Fire area in km²")
        // .color("grey")
        
        svg_last.append("g")
        .attr("transform", "translate(10,30)")
        .call(legend)
}

// render the legends
function renderLegend(){
    const step = 0.05;

    // An array interpolated over our domain where height is the height of the bar
    const expandedDomain = d3.range(300, 550, step);

    // Linear scale for y-axis
    const xScale = d3
    .scaleLinear()
    .domain([300, 550])
    .range([50, 450]);
    
    var colorScale = d3.scaleSequential()
    .domain([
        300,550
    ])
    .interpolator(d3.interpolateOrRd);

    let svg = d3.select("#dashboard").append('svg')
    .attr("class","svg-dashboard")
    // .attr("viewBox", [0, 0, 400, 400]);
    .style("width", 600)
    .style("height", 300)

    
    // add color legend
    svg.append('g').attr("class", "color-legend")
    .selectAll("rect")
    .data(expandedDomain)
    .enter()
    .append('rect')
    .attr("x",d => xScale(d))
    .attr("y",0)
    .attr("width", step)
    .attr("height",25)
    .style("fill", d => colorScale(d))
    .exit()
    .remove()

    // add text
    svg.append('text')
    .attr("class","color-legend-prom")
    .attr("x", 10)
    .attr("y", 20)
    .text("300K")
    .style("fill", "black")
    .style("font-size", "14px")

    svg.append('text')
    .attr("class","color-legend-prom")
    .attr("x", 460)
    .attr("y", 20)
    .text("550K")
    .style("fill", "black")
    .style("font-size", "14px")

}

// update the circles in the graph
function updateGraph(date, dateLast, daynightOp, dataCur, dataLast, projection, svg, svg_last){
    // var date = new Date(document.getElementById("timeRange").value*1000); //gets the date value whenever update is to be made
    // console.log(date);
    var dateFilter = dateProcessor(date);
    var dateFilterLast = dateProcessor(dateLast)
    console.log(dateFilter)
    //daynightOp: true if daytime, otherwise nighttime
    if(daynightOp){
        dataCur = dataCur.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
        dataLast = dataLast.filter(item => item["acq_date"] === dateFilterLast && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
    } else{
        dataCur = dataCur.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "N" && parseInt(item["confidence"]) > 60 );
        dataLast = dataLast.filter(item => item["acq_date"] === dateFilterLast && item["daynight"] === "N" && parseInt(item["confidence"]) > 60 );
    }
    render(svg, svg_last, dataCur,dataLast, projection);
}

// tool function to return date as the format of "yyyy-mm-dd"
function dateProcessor(date){
    month = '' + (date.getMonth() + 1);
    day = '' + date.getDate();
    year = date.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');

}
