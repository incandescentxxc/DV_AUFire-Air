function start(){
    var dataFirePromise = d3.csv("http://localhost:8080/csv/fire_nrt_M6.csv");
    var mapPromise = d3.json("http://localhost:8080/aus_state.geojson");
    Promise.all([mapPromise, dataFirePromise]).then(values=> {
        mapData = values[0];
        fireData = values[1];

        //create SVG
        var width = 1000;
        var height = 700;
        let svg = d3.select("#map").append('svg')
            // .attr("viewBox", [0, 0, 400, 400]);
            .style("width", width)
            .style("height", height);
        
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
        
        // render the data for the first time
        initData = fireData.filter(item => item["acq_date"] === "2019-10-01" && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
        render(svg, initData, projection);
        renderLegend(svg);
        var switchChecked = true; //initial value
        d3.select("#myonoffswitch").on("change",d=>{
            switchChecked = !switchChecked; //change into oposite
            updateGraph(switchChecked, fireData, projection, svg);
        });
        d3.select("#timeRange").on("change", d=> {
            updateGraph(switchChecked, fireData, projection, svg);
            });

    })
}

function render(svg, data, projection){
    console.log(data)
    // draw data
    // min = d3.min(data.map(item => item.brightness)) - 20;
    // max = d3.max(data.map(item => item.brightness))
    // minSize = d3.min(data.map(item => item.track * item.scan));
    // maxSize = d3.max(data.map(item => item.track * item.scan));

    // create a tooltip
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
  
      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function(d) {
        Tooltip.style("opacity", 1)
      }
      var mousemove = function(d) {
        Tooltip
          .html("temperature: "+ Math.round(d.brightness) + "<br>" + "area: " + Math.round(d.track*d.scan * 10) / 10 +"km<sup>2</sup>" + "<br>" + "long: " + d.longitude + "<br>" + "lat: " + d.latitude)
          .style("left", (d3.mouse(this)[0]+10) + "px")
          .style("top", (d3.mouse(this)[1]) + "px")
      }
      var mouseleave = function(d) {
        Tooltip.style("opacity", 0)
      }


    var colorScale = d3.scaleSequential()
            .domain([
                300,510
            ])
            .interpolator(d3.interpolateReds);

    var sizeScale = d3.scaleLinear()
        .domain([1, 12])
        .range([4,9]);

    var circles = svg.selectAll("circle")
    .data(data, d => d)
    .join(
        enter => enter
        .append('circle')
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", .8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave),

        update => update
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", .8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave),

        exit => {
            return exit.remove();
        }
    )
;

}


function renderLegend(svg){
    const step = 0.05;

    // An array interpolated over our domain where height is the height of the bar
    const expandedDomain = d3.range(300, 510, step);

    // Linear scale for y-axis
    const yScale = d3
    .scaleLinear()
    .domain([300, 510])
    .range([550, 150]);
    
    var colorScale = d3.scaleSequential()
    .domain([
        300,510
    ])
    .interpolator(d3.interpolateReds);

    var sizeScale = d3.scaleLinear()
    .domain([1, 12])
    .range([4,9]);
    
    // add color legend
    svg.append('g').selectAll("rect")
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
    svg.append('text')
    .attr("x", 900)
    .attr("y", 120)
    .text("Temperature in K")
    .style("fill", "black")
    .style("font-size", "14px")
    .exit()
    .remove()

    // add text
    svg.append('text')
    .attr("x", 930)
    .attr("y", 555)
    .text(300)
    .style("fill", "black")
    .style("font-size", "14px")

    svg.append('text')
    .attr("x", 930)
    .attr("y", 155)
    .text(510)
    .style("fill", "black")
    .style("font-size", "14px")

    // add size legend
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

function updateGraph(daynightOp, fireData, projection, svg){
    var date = new Date(document.getElementById("timeRange").value*1000); //gets the date value whenever update is to be made
    console.log(document.getElementById("timeRange").value*1000);
    console.log(date);
    var dateFilter = dateProcessor(date);
    console.log(dateFilter)
    //daynightOp: true if daytime, otherwise nighttime
    if(daynightOp){
        data = fireData.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
    } else{
        data = fireData.filter(item => item["acq_date"] === dateFilter && item["daynight"] === "N" && parseInt(item["confidence"]) > 60 );
    }
    render(svg, data, projection);
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

