 
var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    width = w.innerWidth || e.clientWidth || g.clientWidth,
    height = w.innerHeight|| e.clientHeight|| g.clientHeight;
    height -= 24;


var colorPair = ["#5799b7", "#c74744",];
var radius = {min: 6, max: 30};
if (width<768)
	radius = {min: 2, max: 10};	

var states = null;
var projection = d3.geoMercator();

var arc = d3.arc().innerRadius(0).outerRadius(radius.max);
var color = d3.scaleOrdinal(colorPair);
var pie = d3.pie().sort(null);

var svg = d3.select("#chart").append("svg")
  .attr("width", width-5)
  .attr("height", height-5)

/*  .call(d3.zoom().on("zoom", function () {
    svg.attr("transform", d3.event.transform)
  }))
*/
var defs = svg.append("defs");
var filter = defs.append("filter")
  .attr("id", "drop-shadow")
  .attr("height", "130%")
  .attr("width", "130%");
filter.append("feGaussianBlur")
  .attr("in", "SourceAlpha")
  .attr("stdDeviation", 1)
  .attr("result", "blur");
filter.append("feOffset")
  .attr("in", "blur")
  .attr("dx", 2)
  .attr("dy", 2)
  .attr("result", "offsetBlur");
var feMerge = filter.append("feMerge");
feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");

svg = svg.append("g");
var plot = svg.append("g").attr("id", "plot");
	//.attr("transform", "scale(1.2		)");

// Tooltip
var tip = d3.tip().offset([-10,0]).attr('class', 'd3-tip')
  .html(function(d) {
     var text = "<strong>" + d.name + " (" + d.code +")</strong><br>";
     text += "<hr>";
     text += "<strong>IN:</strong> <span style='color:"+ colorPair[0] +";'>" + d3.format(",.2r")(d.in) + "</span><br>";
     text += "<strong>OUT:</strong> <span style='color:"+ colorPair[1] +"'>" + d3.format(",.2r")(d.out) + "</span><br>";
     return text;
  });
plot.call(tip);

var legendLabels = ["Immigration", "Emigration"];
var legendColors = colorPair;

var legend = svg.append("g")
  .attr("transform", "translate(" + (22) + "," + (200) + ")");

legendLabels.forEach(function(continent, i){
  var legendRow = legend.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(0, " + (i * 20) + ")");

  legendRow.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", legendColors[i]);

  legendRow.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .attr("text-anchor", "start")
    .style("text-transform", "capitalize")
    .text(legendLabels[i]);
});

var nodeEl;
var linksEl;
var link_layout;
var nodes_sim;

/*
  var zoom = d3.zoom()
  .on("zoom",function() {
	  console.log(d3.event);
		plot.attr("transform","scale("+d3.event.transform.k+")")
		plot.attr("transform","translate("+d3.event.transform.x + "," + d3.event.transform.y + ")")
  });

  plot.call(zoom)
*/


function drawMap(error, map) {
  // filter out antartica
  map.objects.countries.geometries = map.objects.countries.geometries.filter(function(d) {
    return d.id != 10;
  });

  states = topojson.feature(map, map.objects.countries);
  projection.fitSize([width, height],  {
    "type": "FeatureCollection",
    "features": [
      { "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-85.01, 52.0], [ 159.105420, -31.563994 ],
         ]
      }
     }
    ]
  });		
  projection.center([20, 0]);
  //projection.scale(450).translate([width / 2.3, height / 1.7]);

  var base = plot.append("g").attr("id", "basemap");
  var path = d3.geoPath(projection);

  base.append("path")
      .datum(states)
      .attr("class", "land")
      .attr("d", path);

  var isInterior = function(a, b) { return a !== b; };
  var isExterior = function(a, b) { return a === b; };

  base.append("path")
      .datum(topojson.mesh(map, map.objects.countries, isInterior))
      .attr("class", "border interior")
      .attr("d", path);

  base.append("path")
      .datum(topojson.mesh(map, map.objects.countries, isExterior))
      .attr("class", "border exterior")
      .attr("d", path);
}

function initChart() {
	
	plot.attr("transform","scale(1.1),translate("+ -width/15 + "," + 20 + ")")
			
	linksEl = plot.append("g").attr("id", "links");
	nodesEl = plot.append("g").attr("id", "pie");
}

function drawData(nodes, links) {
  linksEl.remove();
  nodesEl.remove();
  
  if (typeof(nodes_sim) != "undefined")
	nodes_sim.stop();
   if (typeof(link_layout) != "undefined")
	link_layout.stop();
  
  nodesF =JSON.parse(JSON.stringify(nodes));
  
  var bundle = generateSegments(nodes, links);
  
  var line = d3.line()
    .curve(d3.curveBundle)
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

  // draw links

  linksEl = plot.append("g").attr("id", "links")
    .selectAll("path")
    .data(bundle.paths)
    .enter()
    .append("path")
    .attr("d", line)
    .style("fill", "none")
    .attr("id", function(d) {
		return d[0].code + "-" + d[d.length-1].code;
	} )
    .attr("class","link")
    .attr("stroke",function(d) {
		d[1].p.x = Math.round(d[1].p.x);
		d[1].p.y = -Math.round(d[1].p.y);
		id = "v" + (Math.round(d[1].p.x) + 3) + "_" + (Math.round(d[1].p.y) + 3);
		if (defs.select("#grad_"+ id).empty())
			gradient(defs, 'grad_'+ id, d[1].p, d.length>4);
		return "url(#grad_" + id +")";
	})
    .style("stroke-width", function (d) {
		return d[1].count;
	})
    .style("stroke-opacity", 1);


  link_layout = d3.forceSimulation()
    .alphaDecay(0.4)
    .force("charge", d3.forceManyBody()
      .strength(10)
      .distanceMax(radius.max * 2)
    )
    .force("link", d3.forceLink()
      .strength(0.5)
      .distance(10)
    )
    .on("tick", function(d) {
      linksEl.attr("d", line);
    })
    .on("end", function(d) {
      console.log("Layout complete!");
    });

  link_layout.nodes(bundle.nodes).force("link").links(bundle.links);
  


  // draw nodes

  var scale = d3.scaleSqrt()
	  .domain(d3.extent(nodes, function(d) { return d.total; }))
	  .range([radius.min, radius.max]);
  
  nodesEl = plot.append("g").attr("id", "pie")
		.selectAll('arc')
        .data(nodesF)
        .enter()
        .append('g')
        .attr("class", "node")
		.attr("id", function(d) {
			return d.code;
		} )        
        .attr("transform", function(d) {
            return "translate("+d.x+","+d.y+")";
        })
        //.style("filter", "url(#drop-shadow)")
 		.on("mouseover", function(d) {
			id = this.id;
			plot.selectAll("#pie").selectAll("g.node:not(#" + this.id + ")").attr("class","hidden");
			plot.selectAll("#links").selectAll("path").filter( function (d) {
				return this.id.indexOf(id) === -1;
			}).attr("class","linkhidden");
			tip.show(d)
		})
 		.on("mouseout", function(d) {
			plot.selectAll("g.hidden").attr("class","node");
			plot.selectAll("#links path").attr("class","shown");
			tip.hide(d);
		})  
        .selectAll('.pieChart')
        .data(function(d) {
            pie = d3.pie().value(function(d) { return d.value; })
            return pie( [
				{"value":d.in, "total": d.total, "i":1, "x": d.x, "y": d.y  },
				{"value":d.out, "total": d.total, "i":2, "x": d.x ,"y": d.y},
			]);
        })
        .enter()
        .append("g")
		.attr("class", "arc")
		.append("path")		
		.attr("d",  function(d) {
			return arc.outerRadius(scale(d.data.total))(d) }) 
		.attr("fill", function(d) { 
			return color(d.data.i); })

	nodes_sim = null;
    nodes_sim = d3.forceSimulation()
        .force("collide", d3.forceCollide().radius(function(d) {  	
			 return scale(d.total) + 0.2;       
          })
        .iterations(2)
        
        ).alphaDecay(0.9)
        .nodes(nodesF )
        .on("tick", function(d) {           
            plot.selectAll("g.node").attr("transform", function(d) {
                 return "translate("+d.x+","+d.y+")";
            })
        })
        .on("end", function(d) {
          console.log("nodes complete!");
        });
    nodes_sim.restart();
}


/*
 * Turns a single edge into several segments that can
 * be used for simple edge bundling.
 */
function generateSegments(nodes, links) {
  var distance = function(source, target) {
    var dx2 = Math.pow(target.x - source.x, 2);
    var dy2 = Math.pow(target.y - source.y, 2);
    return Math.sqrt(dx2 + dy2);
  };

  // max distance any two nodes can be apart is the hypotenuse!
  var hypotenuse = Math.sqrt(width * width + height * height);

  // number of inner nodes depends on how far nodes are apart
  var inner = d3.scaleLinear()
    .domain([0, hypotenuse])
    .range([1, 15]);

  // generate separate graph for edge bundling
  // nodes: all nodes including control nodes
  // links: all individual segments (source to target)
  // paths: all segments combined into single path for drawing
  var bundle = {nodes: [], links: [], paths: []};

  // make existing nodes fixed
  bundle.nodes = nodes.map(function(d, i) {
    d.fx = d.x;
    d.fy = d.y;
    return d;
  });

    var cscale = d3.scaleSqrt().exponent(0.7)
      .domain([1, d3.max(links, function(d) { return d.count; })])
      .range([0.5,22]);

  links.forEach(function(d, i) {
    // calculate the distance between the source and target
    var length = distance(d.source, d.target);

    // calculate total number of inner nodes for this link
    var total = Math.round(inner(length));

    // create scales from source to target
    var xscale = d3.scaleLinear()
      .domain([0, total + 1]) // source, inner nodes, target
      .range([d.source.x, d.target.x]);

    var yscale = d3.scaleLinear()
      .domain([0, total + 1])
      .range([d.source.y, d.target.y]);

    // initialize source node
    var source = d.source;
    var target = null;

    // add all points to local path
    var local = [source];

    for (var j = 1; j <= total; j++) {
      // calculate target node
      target = {
        x: xscale(j),
        y: yscale(j),
        count: cscale(d.count),
        p:perp(d.source, d.target)
      };

      local.push(target);
      bundle.nodes.push(target);

      bundle.links.push({
        source: source,
        target: target
      });

      source = target;
    }

    local.push(d.target);

    // add last link to target node
    bundle.links.push({
      source: target,
      target: d.target
    });

    bundle.paths.push(local);
  });


  return bundle;
}
