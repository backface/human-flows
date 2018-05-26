
var nodesN = [];
var nodes_all = [];
var links_all = [];
var links = [];
var refugees = false;

// adjust links to original data sources
var urls = {
  nodes: "data/countries.csv",
  links: "data/links.csv",
  world: "data/world-topo-110m.json"
};

var hash = window.location.hash;
if(hash) {
  if (hash == "#refugees2015")
	urls = {
	  nodes: "data/refugee_countries.csv",
	  links: "data/refugee_links.csv",
	  world: "data/world-topo-110m.json"
	};
	refugees = true;
	d3.select(".caption").html("Flow of migrants, refugees and asylum applicants in 2015.<br /> see also: <a href='#'>Migration flows for five-year periods, 1990 to 2010</a>")
} 

window.onhashchange = function() { 
	window.location.reload()
}

function initMe() {
  d3.json(urls.world, function (error, data) {
    
    drawMap(error, data);
    
    d3.queue()
      .defer(d3.csv, urls.nodes, function (d) {
		  d.longitude = +d.longitude;
		  d.latitude = +d.latitude;
		  d.in = 0;
		  d.out = 0;
		  d.total = 0;
		  return d;
	   })
      .defer(d3.csv, urls.links, function (d) {
	    d.count = +d.count;
        return d;
	  })
      .await( function (error, n, l) {
		  if(error) throw error;
		  
		  l = d3.nest()
			.key(function(d) { return d.label}).sortKeys(d3.descending)
			.entries(l);

		  var list = d3.select("#select")
			.append("select")
			.on('change', function() {
				updateSelection(d3.select(this).property('value'));
			});

		  list.selectAll("option")
			.data(l)
			.enter()
			.append("option")		
			.attr("value", function(d,i) {return i;})
			.html(function(d) {return d.key;})
   		    
		
		  nodes_all = n;
		  links_all = l;
		  
		  initChart();
		  wrangleData(0);   		  
	  });
  });
}

function updateSelection(i) {
	wrangleData(i);
}

function wrangleData(i=0) {
  nodesN = [];
  links = [];
  
  nodesN = nodes_all.slice(0);
  links = JSON.parse(JSON.stringify( links_all[i].values ));
 
  // (re) set values
  nodesN.forEach( function(d) {
	d.in = 0;
	d.out = 0;
	d.total = 0;
  })
  
  var by_code = d3.map(nodesN, function(d) { return d.code; }); 	
  
  console.log("Loaded " + by_code.size() + " nodes.");

  // filter out links that do not have nodes
  old = links.length;
  links = links.filter(function(d) {
     return by_code.has(d.source) && by_code.has(d.target)
  });
  console.log("Filtered out " + (old - links.length) + " links without matching nodes");

  // filter by country
  filter_by_country = "";
  if (filter_by_country) {
	  links = links.filter(function(d) {
			return (by_code.get(d.source).code == filter_by_country || by_code.get(d.target).code == filter_by_country);
	  });
	  console.log("Filtered out " + (old - links.length) + " links show only " + filter_by_country);
  }

  // convert links into better format and track node degree
  links.forEach(function(d) {
	d.source = by_code.get(d.source);
	d.target = by_code.get(d.target);
	d.source.out += d.count;
	d.target.in += d.count;
	d.source.total += d.count;
	d.target.total += d.count;
  });

/*
  // filter out nodes outside of projection
  var old = nodes.length;
  nodes = nodes.filter(function(d) {
    return d3.geoContains(states, [d.longitude, d.latitude]);
  });
  console.log("Filtered " + (old - nodes.length) + " out of bounds nodes.");
*/

  var byoutgoing = function(a, b) {
    return d3.descending(a.out, b.out);
  };

  var byincoming = function(a, b) {
    return d3.descending(a.in, b.in);
  };

  var bytotal = function(a, b) {
    return d3.descending(a.total, b.total);
  };

  nodesN.sort(bytotal);
  //nodes = nodes.slice(0, 150);

  if (!refugees) {
	min_total = 80000;
  } else {
	min_total = 0;

  }
  // reset map to only contain nodes post filter
  old = nodesN.length;
  nodesN = nodesN.filter(function(d) {
	return (by_code.get(d.code).total) > min_total
  });
  console.log("Removed " + (old - nodesN.length) + " nodes with total flows less than "+ min_total);
	   
  // calculate projected x, y pixel locations
  nodesN.forEach(function(d) {
    var coords = projection([d.longitude, d.latitude]);
    d.x = coords[0];
    d.y = coords[1];
  });

  by_code = d3.map(nodesN, function(d) { return d.code; });
  

  // reset map to only contain nodes post filter
  
  if (refugees) {
	  min_value = 0;
  } else {
	  min_value = 500;
  }
  
  old = links.length
  links = links.filter(function(d) {
	return d.count > min_value
  });
  console.log("Removed " + (old - links.length) + " links with value smaller than "+ min_value);


  // filter out links that do not go between remaining nodes
  old = links.length;
  links = links.filter(function(d) {
	if (typeof d.target === 'undefined') return false;
	if (typeof d.source === 'undefined') return false;
    return by_code.has(d.source.code) && by_code.has(d.target.code);
  });
  console.log("Removed " + (old - links.length) + " links between nodes not shown");
  console.log("Currently " + nodesN.length + " nodes remaining.");
  console.log("Currently " + links.length + " links remaining.");

  drawData(by_code.values(), links);

}


initMe();
