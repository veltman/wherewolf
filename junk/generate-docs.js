var markdown = require("markdown").markdown,
    fs = require("fs");

fs.readFile("../README.md","utf8",function(err,data){
  fs.readFile("docs-template.html","utf8",function(err,docs){

    docs = docs.replace("{{BODY}}",markdown.toHTML(data));

    console.log(docs);

    fs.writeFile("../index.html",docs);

  });
});