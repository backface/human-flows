



// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
  var u01x = p0.x - p1.x, u01y = p1.y - p0.y,
      u01d = Math.sqrt(u01x * u01x + u01y * u01y);
  return { "x": (u01x / u01d* 1), "y": (u01y / u01d* 1) };
}


function gradient(defs, id, p, hasmid=true){
//gradient function.
  //defines the 
  
  x1 = (p.x > 0) ? 0 : p.x*-1;
  x2 = (p.x > 0) ? p.x : 0;
  y1 = (p.y > 0) ? 0 : p.y*-1;
  y2 = (p.y > 0) ? p.y : 0;
  
  defs
  .append("linearGradient")
  .attr("id",id)
  .attr("x1", x1)
  .attr("y1", y1)
  .attr("x2", x2)
  .attr("y2", y2);
  idtag = '#'+id
  //defines the start
  d3.select(idtag)
  .append("stop")
  .attr("stop-color", colorPair[0])
  .attr("class","begin")
  .attr("offset", "0%")
  .attr("stop-opacity", 1);
  
  d3.select(idtag)
	  .append("stop")
	  .attr("class","end")
	  .attr("stop-color", "#999") //#46272f")
	  //.attr("stop-color", "orange")
	  .attr("offset", "50%")
	  .attr("stop-opacity", hasmid ? 0.02 : 0.4);

  d3.select(idtag)
  .append("stop")
  .attr("class","end")
  .attr("stop-color", colorPair[1])
  .attr("offset", "100%")
  .attr("stop-opacity", 1)
}
