var http = require('http');
var async = require('async');
var fs = require("fs");

var server = http.createServer();

//This List saves all testHandles objects.
var testHandles = {};

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
            	console.log("In startTest--",data,"--");
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
                testHandles[testHandleCount.toString()] = testHandle;
                async.eachSeries(siteList,function(item,callback){
                	var startTime = (new Date).getTime();
                	
            		console.log("Calling : ",item," time : ",startTime);
            		http.get(item , function(response){
            			var endTime = (new Date).getTime();
            			var responsetime = endTime - startTime;
            			console.log(item,' time :', responsetime, " : ", response.statusCode);
            			callback();
            	    })
            },function(err){ 
            	console.log("All done"); 
            });
            var respObj = {
                    "testHandle": testHandleCount.toString(),
                    "status": "started"
            }
                
           response.write(JSON.stringify(respObj));
                
           }
        }

        if (request.method === "GET") {
            var url = request.url;
            
            if (url.indexOf("/testStatus") !== -1) {
                var testHandleVal = url.replace("/testStatus?testHandle=", "");
                console.log(testHandleVal);
                //Check the testHandles list for given input testHandle
                if (testHandles.hasOwnProperty(testHandleVal)) {
                    //Fetch the object from List
                    var status = testHandles[testHandleVal].status;
                    var path = 'alltests.txt'
                    var respObj = {
                        "testHandle": testHandleVal,
                        "status": status
                    }
                
                    response.write(JSON.stringify(respObj));

                } else {
                    response.write("No Test Handle found");
                }
            }

            if (url.indexOf("/testResults") !== -1) {
                var testHandleVal = url.replace("/testResults?testHandle=", "");
                if (testHandles.hasOwnProperty(testHandleVal)) {
                    var status = testHandles[testHandleVal].status;
                    if (status === "completed") {
                        var siteToTest = testHandles[testHandleVal];
                        //Form the json for each test by iterating on testHandles
                        var respObj = {};

                        //Finally send json data
                        response.write(JSON.stringify(respObj));

                    } else {
                        //Set the status as 400.
                        response.statusCode = 400;
                    }
                } else {
                    response.write("No Test Handle found");
                }
            }

            if (url.indexOf("/allTests") !== -1) {

                var handlesArr = Object.keys(testHandles);
                var respObj = {
                    "handles": handlesArr
                }
                response.write(JSON.stringify(respObj));
            }
        }
        response.end();
    });
});

server.listen(8080, function () {
    console.log("Server started on port 8080");
});
