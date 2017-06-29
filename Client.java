package silverpeak;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;

public class Client {

	public static void main(String[] args) {

		TestSites test = new TestSites();
		BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
		try{
			while(true){
				System.out.print("> ");
				String inp = br.readLine();
				if("exit".equalsIgnoreCase(inp))
					break;
				test.input(inp);
			}
		}catch(Exception e){
			System.out.println("Exception"+e.getMessage());
		}
	}
	
	
}

class TestSites{
	
	/**
	 * This method accepts command and calls the http method based on command
	 * @param command
	 */
	public void input(String command){
		String splitinp[] =  command.split(" ");
		String primaryCommand = splitinp[0];
		switch(primaryCommand){
				
			case "testSites" : List<String> urlList = new ArrayList<String>();
							   for(int i = 1 ; i < splitinp.length-1 ; i++)
								   urlList.add(splitinp[i].substring(0, splitinp[i].length()-1));
							    int iteration = Integer.parseInt(splitinp[splitinp.length-1]);
							    postConnect("startTest",urlList,iteration);
							    break;
			
			case "getStatus" : JSONObject jObj =(JSONObject) getConnect("testStatus?testHandle="+splitinp[1]);
							   System.out.println("Test "+jObj.get("testHandle")+" is "+jObj.get("status"));
							   break;
				
			case "getResults" : JSONArray jArr = (JSONArray)getConnect("testResults?testHandle="+splitinp[1]);
								if(jArr != null && jArr.size() >0){
									System.out.println("Site Name \t \t Iterations \t Min Resp Time \t Max Resp Time \t Avg Resp Time \t Test start time \t Test end time");
									for(int i = 0 ; i < jArr.size() ; i++){
										JSONObject obj = (JSONObject)jArr.get(i);
										System.out.print(obj.get("site")+"\t \t");
										System.out.print(obj.get("iterations")+"\t");
										System.out.print(obj.get("min")+"\t");
										System.out.print(obj.get("max")+"\t");
										System.out.print(obj.get("avg")+"\t");
										System.out.print(obj.get("startTestTime")+"\t");
										System.out.print(obj.get("endTestTime")+"\t");
										System.out.println();
									}
								}
								break;
			
			case "getAll" : JSONObject obj = (JSONObject) getConnect("allTests");
							JSONArray jArrhandles = (JSONArray)obj.get("handles");
							if(jArrhandles != null && jArrhandles.size() >0){
								System.out.print("Test handles running on server :\t");
								for(int i = 0 ; i < jArrhandles.size() ; i++){
									System.out.print(jArrhandles.get(i)+"\t");
								}
								System.out.println();
							}else{
								System.out.println("Test still running");
							}
							break;
			
			case "help" : System.out.println("Below commands can be used :");
						  System.out.println("1. testSites <site1>, <site2>, iterationCount");
						  System.out.println("2. getStatus <handle>");
						  System.out.println("3. getResults <handle>");
						  System.out.println("4. getAll");
						  System.out.println("5. exit");
						  break;
			
			default: System.out.println("Invalid Command. Type help to get list of valid commands.");
			
		}
	}
	
	/**
	 * This method establishes GET connection with server
	 * @param handle
	 * @return Object
	 */
	private static Object getConnect(String handle){
		Object obj = null;
		try{
			
		   HttpURLConnection urlconn = null;
		   handle = "http://localhost:8080/"+handle;
		   URL url = new URL(handle);
		   urlconn = (HttpURLConnection) url.openConnection();
		   urlconn.setInstanceFollowRedirects(true);
		   urlconn.setRequestMethod("GET");
		   urlconn.setDoOutput(true);
		   urlconn.setConnectTimeout(5000);
		   urlconn.setReadTimeout(5000);
		   urlconn.connect();
		   int respCode = urlconn.getResponseCode();
		   if(respCode!=HttpURLConnection.HTTP_CLIENT_TIMEOUT && respCode==HttpURLConnection.HTTP_OK){
			   String lRespMesg = "";
			   String lStream = "";
			   BufferedReader inp = new BufferedReader(new InputStreamReader(urlconn.getInputStream()));
			   while ((lStream = inp.readLine()) != null) {
				   lRespMesg = lRespMesg + lStream;
			   }
			   inp.close();
			   urlconn.disconnect();
			   if(!"400".equalsIgnoreCase(lRespMesg)){
			   // Parse JSON response from server
				   JSONParser parser = new JSONParser();
			 	   obj = parser.parse(lRespMesg);
			   }
		 	}else{
			    System.out.println("Error in connection");
			}
		}catch(Exception e){
			System.out.println("Failure in connection :"+e.getMessage());
		}
		return obj;
	}
	
	/**
	 * This method establishes POST connect with server
	 * @param handle
	 * @param urlList
	 * @param iteration
	 */
	private static void postConnect(String handle, List<String> urlList , int iteration){
		
		try{
		   HttpURLConnection urlconn = null;
		   handle = "http://localhost:8080/"+handle;
		   URL url = new URL(handle);	    	   
		   JSONObject obj = new JSONObject();
		   JSONArray arr = new JSONArray();
	       for(String link : urlList){
	    	   arr.add(link);
	       }
	       obj.put("sitesToTest", arr);
	       obj.put("iterations", iteration);
		   
		   urlconn = (HttpURLConnection) url.openConnection();
		   urlconn.setInstanceFollowRedirects(true);
		   urlconn.setRequestMethod("POST");
		   urlconn.setRequestProperty("Content-Type", "application/json");
		   urlconn.setDoOutput(true);
		   urlconn.setConnectTimeout(5000);
		   urlconn.setReadTimeout(5000);
		   OutputStream os = urlconn.getOutputStream();
		   OutputStreamWriter wr= new OutputStreamWriter(os,"UTF-8");
		   wr.write(obj.toJSONString());
		   wr.flush();
		   int respCode = urlconn.getResponseCode();
		   if(respCode!=HttpURLConnection.HTTP_CLIENT_TIMEOUT && respCode==HttpURLConnection.HTTP_OK){
			   String lRespMesg = "";
			   String lStream = "";
			   BufferedReader inp = new BufferedReader(new InputStreamReader(urlconn.getInputStream()));
			   while ((lStream = inp.readLine()) != null) {
				   lRespMesg = lRespMesg + lStream;
			   }
			   inp.close();
			   urlconn.disconnect();
			   
			   // Parse JSON response from server
			   JSONParser parser = new JSONParser();
		 	   JSONObject jObj = (JSONObject) parser.parse(lRespMesg);
		 	   System.out.println("Test started. Testhandle : "+jObj.get("testHandle"));
		 	}else{
			    System.out.println("Error in connection");
			}
		}catch(Exception e){
			System.out.println("Failure in connection :"+e.getMessage());
		}
	}
}