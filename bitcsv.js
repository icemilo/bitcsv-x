#!/usr/bin/env node

var csv = require('ya-csv'),
wget = require('wget'),
optimist = require('optimist'),
colors = require('colors'),
util = require('util'),
fs = require('fs'),
path = require('path'),
moment = require('moment'),
zlib = require('zlib'),
mkdirp = require('mkdirp'),
async = require('async'),
bar = require('progress-bar').create(process.stdout, 50);

var headers =[],
downloadDir = './csv_data',
data = [],
reader,
inputFilePath,
outputFilePath,
streamer;

var argv = optimist.usage(  
  "\nExtracts large csv file to smaller csv by dates\n".bold + 
  "Usage:\n".magenta+ 
  "bitcsv-x [-n] -i /path/to/file.csv -o /path/to/output.csv-s 02-05-2015 -e 04-05-2015" 
  ).demand(['o','s','e'])
  .options('n',{
    alias:"new",
    describe:"get new data from server"
  }).options('i', { 
    alias:"input",
    describe:"input file path" 
  }).options('o', {
    alias:"output",
    describe:"output file path"
  }).options('s', {
    alias:"start",
    describe:"start date of record(dd/mm/yyyy)"
  }).options('e', {
    alias:"end",
    describe:"end date of record(dd/mm/yyyy)"
  }
).argv;

if(argv.help){
  util.puts(optimist.help() );
  process.exit(0); 
}

async.waterfall([
  function(callback){
    if(argv.new){
      fs.exists(downloadDir, function(exists){
        if(!exists)
          mkdirp(downloadDir);   
      });
      callback(null);
    } else if(argv.input && argv.output){
      fs.exists(path.resolve(argv.input), function(exists){
        if(!exists)
          callback("INPUTFILENOTFOUND", null);
      });
      fs.exists(path.resolve(argv.output), function(exists){
        if(exists)
          fs.unlink(path.resolve(argv.output), function(err){
            if(err)
              callback("CANNOTDELETEOUTPUT", null);
          });
      });
      callback(null);
    } else {
      callback(null);
    }
  },
  function(callback){
    if(argv.new){
      var url = "http://api.bitcoincharts.com/v1/csv/bitstampUSD.csv.gz";
      console.log("Downloading csv file from " + url);
      var tokenLength = url.split("/").length;
      var fileName = url.split("/")[tokenLength-1];
      var download = wget.download(url, "./csv_data/" + fileName, {});

      download.on('error', function(err){
        console.log(err);
      });

      download.on('progress', function(progress){
        bar.update(progress);
      });

      download.on('end', function(output){
        console.log('\nDecompressing download file...');
        var outputFile = output.replace(".gz","");
        var decompress = zlib.createGunzip();
        var input = fs.createReadStream(output);
        var output = fs.createWriteStream(outputFile);
        input.pipe(decompress).pipe(output);

        output.on('finish', function(){
          inputFilePath = outputFile;
          console.log('Decompressing completed!');
          callback(null, inputFilePath);
        });
      });
    } else {
      callback(null, null);
    }
  },
  function(newInputFilePath, callback){
    if(!newInputFilePath)
      inputFilePath = path.resolve(argv.input);
    else
      inputFilePath = newInputFilePath;
    outputFilePath = path.resolve(argv.output);
    reader = csv.createCsvFileReader(inputFilePath,{  
      separator:',', 
      quote:'"', 
    });

    streamer = fs.createWriteStream(outputFilePath, {  
      flags:'w', 
      encoding:"utf-8" 
    });

    var startDate = moment(argv.start, "DD-MM-YYYY").unix();
    var endDate = moment(argv.end,"DD-MM-YYYY").unix();
     
    reader.once('data', function( str ){
      console.log('Extracting csv data From:' + argv.start + '(' + startDate + ') To:' + argv.end + '(' + endDate + ')');
      headers = ['Timestamp', 'USD', 'BTC'];
      reader.addListener('data', function( record ){
        var dataObj = hasher(compress(headers, record));
        if(dataObj["Timestamp"] > startDate && dataObj["Timestamp"] < endDate){
          streamer.write(record + "\n");
        }
      })
    });

    reader.addListener('end', function( ){  
      streamer.on('drain', function(){ 
        streamer.end();
        callback(null);
      }); 
    });
  }
], function(err, result){
  if(err){
    if(err == "INPUTFILENOTFOUND"){
      return console.log("Error : Input file is not found".red);
    } else if(err == "CANNOTDELETEOUTPUT"){
      return console.log("Error : Couldn't delete output file, please re-enter output file name".red);
    };
  }
  console.log("Extracting Done!".green);
  console.log("Checkout file at -> " + outputFilePath);
  return;
});

function hasher(arr){  
  ret = {};    
  arr.forEach(function(item){ 
    ret[item[0]] = item[1]; 
  }); 
  return ret; 
}
function compress(arr1, arr2){  
  var ret = [],
  len = arr1.length; 
  for(x = 0; x<len; x++){ 
    ret.push([arr1[x], arr2[x]]); 
  } 
  return ret; 
}

process.on('uncaughtException', function(err) {
  return;
});