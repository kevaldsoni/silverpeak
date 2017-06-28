var http = require('http');
var async = require('async');
var fs = require("fs");
var lodash = require("lodash");
var server = http.createServer();

//This List saves all testHandles objects.
var testHandles = [];

//Added couter for uniqueness. This will act as a testHandle
var testHandleCount = 0;

server.on('request', function (request, response) {

    var data = '';
    request.on('data', function (chunk) {
    	data += chunk;
    });

    request.on('end', function () {
        if (request.method === 'POST') {
            if (request.url === "/startTest") {
            	
                var siteInfo = JSON.parse(data);
                var siteToTest = siteInfo.sitesToTest;
                var iterations = siteInfo.iterations;
                testHandleCount++;
                var siteList = [];
                for(i = 0 ; i < siteToTest.length; i++){
                	for(j=1 ; j <= iterations ; j++)
                	siteList.push( siteToTest[i]);
                }
                var count = 0;
                var min = 32767;
                var max = 0;
                var avgTime = 0;
                
                async.eachSeries(siteList,function(item,callback){
                	var startTime = (new Date).getTime();
                	http.get(item , function(response){
                		var endTime = (new Date).getTime();
                		var responsetime = endTime - startTime;
                		avgTime = lodash.add(avgTime,responsetime)
                		if(responsetime < min)
                			min = responsetime;
                		if(responsetime > max)
                			max = responsetime;
                		count++;
                		if(count == iterations){
                			var testHandle = {
                                 "site": item,
                                 "iterations": iterations,
                                 "min": min,
                                 "max" : max,
                                 "avg" : ( avgTime ) / iterations,
                                 "startTestTime" : startTime,
                                 "endTestTime" : (new Date).getTime()
                       		}
                       		testHandles.push(testHandle);
                			startTime = (new Date).getTime();
                        	count = 0;
                        	max = -1;
                        	min = 32767;
                        	avgTime = 0;
                		}
                		callback();
                	})
                	
              },function(err){
            	  if (err) return console.error(err);
                fs.readFile('alltests.txt', function (err, data) {
                    if (err) {
                       return console.error(err);
                    }
                    var existingData = JSON.parse(data.toString());
                    for(i = 0 ; i < existingData.length; i++){
                    	if(testHandleCount == existingData[i].testHandle){
                    		existingData[i].status = 'finished'; 
                    		existingData[i].sitesresults = testHandles;
                    	}
                    }
                    testHandles = []
                    fs.writeFile('alltests.txt', JSON.stringify(existingData),function(err) {
                    	if (err) return console.error(err);
                     });
                 });
            });
            var respObj = {
                    "testHandle": testHandleCount.toString(),
                    "status": "started"
            }
            fs.readFile('alltests.txt', function (err, data) {
            	if (err) return console.error(err);
                var testData;
                if(data.toString().length > 0){
                	testData = JSON.parse(data.toString());
	            }else{
                	testData = []
                }
                testData.unshift(respObj);
                fs.writeFile('alltests.txt', JSON.stringify(testData),function(err) {
                	if (err) return console.error(err);
	            });
             });
            console.log(JSON.stringify(respObj));
            response.write(JSON.stringify(respObj), function(){
            	response.end();
            });
           }
        }

        if (request.method === "GET") {
            var url = request.url;
            if (url.indexOf("/testStatus") !== -1) {
                var testHandleVal = url.replace("/testStatus?testHandle=", "");
                var status ='';
                var respObj;
                async.series([
                	    function(callback) {
                             fs.readFile('alltests.txt', function (err, data) {
                             if (err) {
                                 return console.error(err);
                             }
                             var existingData = JSON.parse(data.toString());
                             for(i = 0 ; i < existingData.length; i++){
                                  if(testHandleVal == existingData[i].testHandle){
                                     status = existingData[i].status;
                                     respObj = {
                                             "testHandle": testHandleVal,
                                             "status": status
                                     }
                                     callback();
                                     break;
                                  }                            		
                             }
                            });
                         }], function (err, result) {
                	                response.write(JSON.stringify(respObj), function(){
                	                	response.end();
                	                });
                	     });
              }
              if (url.indexOf("/testResults") !== -1) {
                var testHandleVal = url.replace("/testResults?testHandle=", "");
                var sitedata;
                async.series([
           	               function(callback) {
                           	  fs.readFile('alltests.txt', function (err, data) {
                                     if (err) {
                                        return console.error(err);
                                     }
                                     var existingData = JSON.parse(data.toString());
                                     for(i = 0 ; i < existingData.length; i++){
                                    	
                                     	if(testHandleVal == existingData[i].testHandle){
                                     		if(existingData[i].status != "started"){
	                                     		sitedata = existingData[i].sitesresults;
	                                     		console.log(sitedata);
	                                     		callback();
	                                     		break;
                                     		}else{
                                     			response.write("400");
                                                response.end();
            				 	            }
                                     	}
                                     }
                                     
                               });
                          }], function (err, result) {
				                	response.write(JSON.stringify(sitedata), function(){
				 	                	response.end();
				 	                });
           	             });
            }

            if (url.indexOf("/allTests") !== -1) {
            	var respObj = {}
            	var tests =[]
            	async.series([
              	              function(callback) {
                              	  fs.readFile('alltests.txt', function (err, data) {
                                        if (err) {
                                           return console.error(err);
                                        }
                                        var existingData = JSON.parse(data.toString());
                                        for(i = 0 ; i < existingData.length; i++){
                                        	if("started" == existingData[i].status){
                                        		tests.push(existingData[i].testHandle);
                                        	}                            		
                                        }
                                        callback();
                                  });
                              }], function (err, result) {
            							respObj = {"handles" : tests};
	            						response.write(JSON.stringify(respObj), function(){
	            							response.end();
            						});
              	             });
            	}
        }

    });
});

server.listen(8080, function () {
    console.log("Server started on port 8080");
});
