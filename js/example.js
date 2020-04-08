function renderGeo(){
    var dataFirePromise = d3.csv("http://localhost:8080/csv/fire_nrt_M6.csv");
    var mapPromise = d3.json("http://localhost:8080/aus_state.geojson");
    Promise.all([mapPromise,dataFirePromise]).then(values => {
        mapData = values[0];
        fireData = values[1];
        // Fire Data processing
        daytimeData = fireData.filter(item => item["daynight"] === "D" && parseInt(item["confidence"]) > 60 );
        nighttimeData = fireData.filter(item => item["daynight"] === "N" && parseInt(item["confidence"]) > 60 );
        onedayData = daytimeData.filter(item => item["acq_date"] === "2019-10-01");
        console.log(onedayData)
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
            .attr( "stroke", "#999" )
        
        // draw data
        min = d3.min(onedayData.map(item => item.brightness)) - 20;
        max = d3.max(onedayData.map(item => item.brightness))
        minSize = d3.min(onedayData.map(item => item.track * item.scan));
        maxSize = d3.max(onedayData.map(item => item.track * item.scan));

        var colorScale = d3.scaleSequential()
            .domain([
                min,max
            ])
            .interpolator(d3.interpolateReds);

        var sizeScale = d3.scaleLinear()
            .domain([minSize, maxSize])
            .range([4,9]);

        svg.append('g').selectAll("circle")
        .data(onedayData)
        .enter()
        .append('circle')
        .attr("cx", function(d){ return projection([d.longitude, d.latitude])[0] })
        .attr("cy", function(d){ return projection([d.longitude, d.latitude])[1] })
        .attr("r", d => sizeScale(parseInt(d.scan)*parseInt(d.track)))
        .style("fill", d => colorScale(d.brightness))
        .attr("fill-opacity", .8);

    
        const step = (max - min)/400

        // An array interpolated over our domain where height is the height of the bar
        const expandedDomain = d3.range(min, max, step);

        // Linear scale for y-axis
        const yScale = d3
        .scaleLinear()
        .domain([min, max])
        .range([550, 150]);
        
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

        // add legend explanation
        svg.append('text')
        .attr("x", 900)
        .attr("y", 120)
        .text("Temperature in K")
        .style("fill", "black")
        .style("font-size", "14px")

        // add text
        svg.append('text')
        .attr("x", 930)
        .attr("y", 555)
        .text(Math.round(min))
        .style("fill", "black")
        .style("font-size", "14px")

        svg.append('text')
        .attr("x", 930)
        .attr("y", 155)
        .text(Math.round(max))
        .style("fill", "black")
        .style("font-size", "14px")

        // add size legend
        var legend = d3.legendSize()
        .shape("circle")
        .orient("vertical")
        .scale(sizeScale)
        .title("Fire area in k(m^2)")
        // .color("grey")
        

        svg.append("g")
        .attr("transform", "translate(100,100)")
        .call(legend)


        });

        
}
function renderLegend(svg, colorScale, min, max){

}


