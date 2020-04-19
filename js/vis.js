// some consts used for temperature presentation
const KELVIN_TEMP = 273.15;
const K_DOMAIN_MIN = 300;
const K_DOMAIN_MAX = 550;
const C_DOMAIN_MIN = Math.round(K_DOMAIN_MIN - KELVIN_TEMP);
const C_DOMAIN_MAX = Math.round(K_DOMAIN_MAX - KELVIN_TEMP);
const F_DOMAIN_MIN = Math.round(C_DOMAIN_MIN * 9 / 5 + 32);
const F_DOMAIN_MAX = Math.round(C_DOMAIN_MAX * 9 / 5 + 32);

function start(){
    var dataFirePromise = d3.json("http://localhost:8080/json/fire_thisyear.json");
    var mapPromise = d3.json("http://localhost:8080/aus_state.geojson");
    Promise.all([mapPromise, dataFirePromise]).then(values=> {
        mapData = values[0];
        fireData = values[1];

        //create SVG
        var margin = {top:50, right:50, bottom:50, left:50},
        width = (1200 - margin.left - margin.right),
        height = (800 - margin.top - margin.bottom);
        let svg = d3.select("#map").append('svg')
            // .attr("viewBox", [0, 0, 400, 400]);
            .style("width", width + margin.left + margin.right)
            .style("height", height + margin.top + margin.bottom);
        
        //projection function is a convertor which translates the cooridinates in lat and long to the actual
        //cooridinates in d3.
        var projection = d3.geoConicConformal() //projection with fine-tuned parameters exclusively for AU
            .rotate([-132, 0])
            .center([0, -27])
            .parallels([-18, -36])
            .scale(1000)
            .translate([width / 2, height / 2])
            .precision(0.1);

        var geoGenerator = d3.geoPath().projection(projection);
        // draw the map
        svg.append('g').selectAll('path')
        .data(mapData.features)
        .enter()
            .append('path')
            .attr('d', geoGenerator) //the attribute that defines the coordinates of a path
            .attr( "fill", "#BDC0BA" )
            .attr( "stroke", "#999" );
        // some specifications for rendering time slider
        var formatDate = d3.timeFormat("%Y-%m-%d");    

        var startDate = new Date("2019-10-01"),
        endDate = new Date("2020-01-31");
        
        var currentValue = 0;
        var targetValue = height/3*2; //height = 700
        var switchChecked = true; //initial value
        var tempChecked = "K"; // by defalut


        var y = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, targetValue])
        .clamp(true);

        var slider = svg.append("g")
        .attr("class", "slider")
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
                updateSlider(y.invert(currentValue));
                updateGraph(y.invert(currentValue),switchChecked,fireData,projection,svg,tempChecked); 
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

        var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9)
        .style("stroke","#000");
        console.log(handle)

        var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate("+ (-50) + "," + (-15) + ")")

        var playButton = d3.select("#play-button");
        var moving = false;
        var playButton = d3.select("#play-button");
        
        playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
                updateSlider(y.invert(currentValue));
                updateGraph(y.invert(currentValue),switchChecked,fireData,projection,svg, tempChecked);     
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
            console.log("Slider moving: " + moving);
        })
        function step() {
            updateSlider(y.invert(currentValue));
            updateGraph(y.invert(currentValue),switchChecked,fireData,projection,svg, tempChecked); 
            currentValue = currentValue + (targetValue/180); // 153 is the specific days recorded
            if (currentValue > targetValue) {
              moving = false;
              currentValue = 0;
              clearInterval(timer);
              // timer = 0;
              playButton.text("Play");
              console.log("Slider moving: " + moving);
              updateSlider(y.invert(currentValue));
              updateGraph(y.invert(currentValue),switchChecked,fireData,projection,svg, tempChecked); 
            }
        }
        function updateSlider(date) {
            handle.attr("cy", y(date));
            label
              .attr("y", y(date))
              .text(formatDate(date));
        }


        // render the data for the first time
        initData = fireData.filter(item => item["acq_date"] === "2019-10-01" && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
        render(svg, initData, projection, tempChecked);
        renderLegend(svg, tempChecked);
        d3.select("#myonoffswitch").on("change",d=>{
            switchChecked = !switchChecked; //change into oposite
            updateGraph(y.invert(currentValue),switchChecked, fireData, projection, svg, tempChecked);
        });
        d3.select("#K").on("click", d=>{
            tempChecked = "K";
            updateGraph(y.invert(currentValue),switchChecked, fireData, projection, svg, tempChecked);
        });
        d3.select("#C").on("click", d=>{
            tempChecked = "C";
            updateGraph(y.invert(currentValue),switchChecked, fireData, projection, svg, tempChecked);
        });
        d3.select("#F").on("click", d=>{
            tempChecked = "F";
            updateGraph(y.invert(currentValue),switchChecked, fireData, projection, svg, tempChecked);
        })

    })

}

// render the circles based on the data get
function render(svg, data, projection, tempChecked){
    // some specification for different temperature units
    var tooltopText = "K";
    var color_domain_min = K_DOMAIN_MIN;
    var color_domain_max = K_DOMAIN_MAX;
    if(tempChecked === "C"){
        tooltopText = "°C";
        color_domain_min = C_DOMAIN_MIN;
        color_domain_max = C_DOMAIN_MAX;
    } else if(tempChecked === "F"){
        tooltopText = "°F";
        color_domain_min = F_DOMAIN_MIN;
        color_domain_max = F_DOMAIN_MAX;
    }

    // create a tooltip
    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        var Tooltip = d3.select("#map")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 1)
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")
            .style("position", "absolute")
        Tooltip.style("opacity", 1)
    }
    var mousemove = function(d) {
        d3.select(".tooltip")
            .html("temperature: "+ Math.round(tempConversion(tempChecked,d.brightness)) + tooltopText + "<br>" + "area: " + Math.round(d.track*d.scan * 10) / 10 +"km<sup>2</sup>" + "<br>" + "long: " + d.longitude + "<br>" + "lat: " + d.latitude)
            .style("left", (d3.mouse(this)[0]+10) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
    }
    var mouseleave = function(d) {
        d3.select(".tooltip").remove();
    }

    console.log(color_domain_min);
    var colorScale = d3.scaleSequential()
            .domain([
                color_domain_min,color_domain_max
            ])
            .interpolator(d3.interpolateOrRd);

    var sizeScale = d3.scaleLinear()
        .domain([1, 12])
        .range([4,9]);
    console.log(tempChecked)
    var circles = svg.selectAll("circle").filter(".data-point") //only choose those who have class= data-point
    .data(data, d => d)
    .join(
        enter => enter
        .insert('circle')
        .attr("class", "data-point")
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(tempConversion(tempChecked, d.brightness)))
        .attr("fill-opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave),

        update => update
        .attr("class", "data-point")
        // .transition()
        // .duration(100)
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(tempConversion(tempChecked, d.brightness)))
        .attr("fill-opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave),

        exit => {
            return exit.remove();
        }
    )
;

}

// render the legends
function renderLegend(svg, tempChecked){
    // some specification for different temperature units
    var tooltopText = "K";
    var color_domain_min = K_DOMAIN_MIN;
    var color_domain_max = K_DOMAIN_MAX;
    if(tempChecked === "C"){
        tooltopText = "°C";
        color_domain_min = C_DOMAIN_MIN;
        color_domain_max = C_DOMAIN_MAX;
    } else if(tempChecked === "F"){
        tooltopText = "°F";
        color_domain_min = F_DOMAIN_MIN;
        color_domain_max = F_DOMAIN_MAX;
    }
    
    const step = 0.05;

    // An array interpolated over our domain where height is the height of the bar
    const expandedDomain = d3.range(color_domain_min, color_domain_max, step);

    // Linear scale for y-axis
    const yScale = d3
    .scaleLinear()
    .domain([color_domain_min, color_domain_max])
    .range([550, 150]);
    
    var colorScale = d3.scaleSequential()
    .domain([
        color_domain_min,color_domain_max
    ])
    .interpolator(d3.interpolateOrRd);

    var sizeScale = d3.scaleLinear()
    .domain([1, 12])
    .range([4,9]);
    
    // add color legend and remove previous one
    svg.select(".color-legend").remove()
    svg.append('g').attr("class", "color-legend")
    .selectAll("rect")
    .data(expandedDomain)
    .enter()
    .append('rect')
    .attr("x",900)
    .attr("y",d => yScale(d))
    .attr("width", 25)
    .attr("height",step)
    .style("fill", d => colorScale(d))
    .exit()
    .remove()

    // add legend explanation
    svg.selectAll(".color-legend-prom").remove();
    svg.append('text')
    .attr("class","color-legend-prom")
    .attr("x", 900)
    .attr("y", 120)
    .text("Temperature in " + tooltopText)
    .style("fill", "black")
    .style("font-size", "14px")


    // add text
    svg.append('text')
    .attr("class","color-legend-prom")
    .attr("x", 930)
    .attr("y", 555)
    .text(color_domain_min.toString() + tooltopText)
    .style("fill", "black")
    .style("font-size", "14px")

    svg.append('text')
    .attr("class","color-legend-prom")
    .attr("x", 930)
    .attr("y", 155)
    .text(color_domain_max.toString() + tooltopText)
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
    .attr("transform", "translate(100,100)")
    .call(legend)

}

// update the circles in the graph
function updateGraph(date, daynightOp, fireData, projection, svg, tempChecked){
    // var date = new Date(document.getElementById("timeRange").value*1000); //gets the date value whenever update is to be made
    // console.log(date);
    var dateFilter = dateProcessor(date);
    console.log(dateFilter)
    //daynightOp: true if daytime, otherwise nighttime
    if(daynightOp){
        data = fireData.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
    } else{
        data = fireData.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "N" && parseInt(item["confidence"]) > 60 );
    }
    render(svg, data, projection, tempChecked);
    renderLegend(svg, tempChecked)
}


// tool function to change the temperature presentation based on K, C, or F
function tempConversion(metric, brightness){
    if(metric === "C"){
        console.log(brightness - KELVIN_TEMP)
        return brightness - KELVIN_TEMP;
    } else if (metric === "F"){
        return (brightness - KELVIN_TEMP)*9/5+32;
    } else if (metric === "K"){
        return brightness;
    }
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
