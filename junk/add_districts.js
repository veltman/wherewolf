var fs = require("fs"),
    d3 = require("d3"),
    queue = require("queue-async"),
    topojson = require("topojson");

queue()
  .defer(cleanFile,"NY-state-assembly")
  .defer(cleanFile,"NY-state-senate")
  .defer(cleanFile,"NY-house")
  .defer(cleanFile,"school-districts")
  .defer(fs.readFile, "districts.topojson","utf8")
  .await(function(err,assembly,senate,house,schools,topology){

    var layers = {"Senate": senate,
                  "Assembly": assembly,
                  "House": house,
                  "School District": schools
                };
    //console.log(topology);
    topology = JSON.parse(topology);
    for (key in topology.objects){
      layers[key] = topojson.feature(topology,topology.objects[key]);
      layers[key].features = clean(layers[key],key);
    }

    var topo = topojson.topology(layers,{
      "quantization": 1000000,
      "property-transform": function(feature) {
        return feature.properties;
      }
    });

    fs.writeFile("districts2.topojson",JSON.stringify(topo),function(e){
      console.log(e);
    });

  });

//for fixing current topojson layers
function clean(layer, key){
  return layer.features.map(function(d){
    if (key == "City Council District"){
        d.properties = {
          "name": "City Council District "+d.properties.name
        }
    }else if (key == "Police Precinct"){
      d.properties = {
        "name": "Police Precinct "+d.properties.name
      }
    }else if (key == "Community District"){
      d.properties = {
        "name": "Community District "+d.properties.name
      }
    }
    return d;
  });
}


function cleanFile(fn,cb) {

  console.log(fn);

  fs.readFile(fn+".geojson","utf8",function(err,data){
    //console.log(err, fn, data);
    data = JSON.parse(data);
   // console.log(data);
    data.features = data.features.map(function(d){
      
      if (d.properties.NAMELSAD) {
        //d.properties.name = d.properties.NAMELSAD.replace("Congressional District ","").trim();
      }

      if (fn == "NY-state-senate"){
        d.properties = {
          "name": "State Senate District "+d.properties.di
        }
      }else if (fn == "NY-state-assembly"){
        d.properties = {
          "name": "State Assembly District "+d.properties.di
        }
      }else if (fn == "NY-house"){
        d.properties = {
          "name": "Congressional District "+d.properties.di
        }
      }else if (fn == "school-districts"){
        d.properties = {
          "name": "School District "+d.properties.SchoolDist
        }
      }


      return d;

    });

    cb(null,data);

  });

}