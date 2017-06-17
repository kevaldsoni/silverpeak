var http = require('http');
var async = require('async');
var fs = require("fs");
var _ = require("lodash");
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
                var siteList = [];
                var iterations = siteInfo.iterations;
                testHandleCount++;
                for(i = 0 ; i < siteToTest.length; i++){
                	for(j=1 ; j <= iterations ; j++)
                	siteList.push( siteToTest[i]);
                }
                console.log(siteList.length);
                var testHandle = {
                    "siteToTest": siteToTest,
                    "testHandle": testHandleCount.toString(),
                    "status": "started"
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
                			avgTime = _.add(avgTime,responsetime)
                			if(responsetime < min)
                				min = responsetime;
                			if(responsetime > max)
                				max = responsetime;
                			count++;
                			if(count == iterations){
                				console.log("--------------------Re-----------",avgTime, " ", iterations )
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
                        		console.log(JSON.stringify(testHandle));
                        		startTime = (new Date).getTime();
                        		count = 0;
                        		max = -1;
                        		min = 32767;
                        		avgTime = 0;
                			}
                			callback();
                	    })
                	
              },function(err){
            	 if (err) {
                     return console.error(err);
                 }
            	console.log("All done"); 
            	fs.readFile('alltests.txt', function (err, data) {
                    if (err) {
                       return console.error(err);
                    }
                    var existingData = JSON.parse(data.toString());
                    for(i = 0 ; i < existingData.length; i++){
                    	console.log(existingData[i].testHandle);
                    	if(testHandleCount == existingData[i].testHandle){
                    		existingData[i].status = 'finished'; 
                    		existingData[i].sitesresults = testHandles;
                    	}
                    		
                    }
                    testHandles = []
                    fs.writeFile('alltests.txt', JSON.stringify(existingData),function(err) {
                  	   if (err) {
                  		      return console.error(err);
                  	   }
                     });
                 });
            });
            var respObj = {
                    "testHandle": testHandleCount.toString(),
                    "status": "started"
            }
            
            fs.readFile('alltests.txt', function (err, data) {
                if (err) {
                   return console.error(err);
                }
                var testData
                if(data.toString().length > 0){
                	testData = JSON.parse(data.toString());
	            }else{
                	testData = []
                }
                testData.unshift(respObj);
                fs.writeFile('alltests.txt', JSON.stringify(testData),function(err) {
	             	   if (err) {
	             		      return console.error(err);
	             	   }
	            });
             });
            
            response.write(JSON.stringify(respObj));
                
           }
        }

        if (request.method === "GET") {
            var url = request.url;
            
            if (url.indexOf("/testStatus") !== -1) {
                var testHandleVal = url.replace("/testStatus?testHandle=", "");
                console.log(testHandleVal);
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
                                          		break;
                                          	}                            		
                                         }
                                         respObj = {
                                                  "testHandle": testHandleVal,
                                                  "status": status
                                              }
                                        
                                         callback();
                                         
                                    });
                                      
                                  },
                	              function(callback) {
                                	 /* response.write(JSON.stringify(respObj), function(err){
                                		  callback();
                                  });*/
                                	  callback();
                	              },
                	                 
                	             ], function (err, result) {
                	                console.log("in final two");
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
                                     		sitedata = existingData[i].sitesresults;
                                     		break;
                                     	}                            		
                                    }
                                    
                                   callback();
                               });
                          },
           	              function(callback) {
                           	 /* response.write(JSON.stringify(sitedata), function(err){
                           		  callback();
                             });*/
                           	  callback();
           	              },
           	                 
           	             ], function (err, result) {
           	                console.log("in final two");
           	             });
            }

            if (url.indexOf("/allTests") !== -1) {

            	async.series([
              	               function(callback) {
                              	  fs.readFile('alltests.txt', function (err, data) {
                                        if (err) {
                                           return console.error(err);
                                        }
                                        var existingData = JSON.parse(data.toString());
                                        for(i = 0 ; i < existingData.length; i++){
                                        	if(testHandleVal == existingData[i].testHandle){
                                        		sitedata = existingData[i].sitesresults;
                                        		break;
                                        	}                            		
                                       }
                                       
                                      callback();
                                  });
                             },
              	              function(callback) {
                              	 /* response.write(JSON.stringify(sitedata), function(err){
                              		  callback();
                                });*/
                              	  callback();
              	              },
              	                 
              	             ], function (err, result) {
              	                console.log("in final two");
              	             });
                response.write(JSON.stringify(respObj));
            }
        }
        response.end();
    });
});

server.listen(8080, function () {
    console.log("Server started on port 8080");
});
