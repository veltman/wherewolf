var topojson = require("topojson"),
    fs = require("fs");

fs.readFile("us-states.geojson","utf8",function(err,data){

  data = JSON.parse(data);

  var topo = topojson.topology({"states": data},{
    "quantization": 10000,
    "property-transform": function(feature) {
      return feature.properties;
    }
  });

  fs.writeFile("us-states.topojson",JSON.stringify(topo),function(e){
    console.log(e);
  });

});