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
		// TODO Auto-generated method stub
		TestSites test = new TestSites();
		
		BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
		Scanner sc = new Scanner(System.in);
		try{
			while(true){
				System.out.print("> ");
				String inp = br.readLine();
				test.input(inp);
				System.out.println("Do you want to continue : Type yes or no");
				if("no".equalsIgnoreCase(sc.next())) break;
					
			}
		}catch(Exception e){
			e.printStackTrace();
		}
	}
	
	
}

class TestSites{
	public void input(String command){
		System.out.println(command);
		String splitinp[] =  command.split(" ");
		String primaryCommand = splitinp[0];
		switch(primaryCommand){
				
			case "testSites" : List<String> urlList = new ArrayList<String>();
							   for(int i = 1 ; i < splitinp.length-1 ; i++)
								   urlList.add(splitinp[i].substring(0, splitinp[i].length()-1));
							    int iteration = Integer.parseInt(splitinp[splitinp.length-1]);
							    postConnect("startTest",urlList,iteration);break;
			
			case "getStatus" : getConnect("testStatus?testHandle="+splitinp[1]);break;
				
			case "getResults" : getConnect("testResults?testHandle="+splitinp[1]);break;
			
			case "getAll" : getConnect("allTests"); break;
			
			case "help" : System.out.println("Below commands can be used :");
						  System.out.println("testSites getStatus getResults getAll"); break;
			
			default: System.out.println("Invalid Command");
			
		}
		
		 
	}
	
	private static void getConnect(String handle){
		String lRespMesg = "";
		try{
		   HttpURLConnection urlconn = null;
		   handle = "http://localhost:8080/"+handle;
		   URL url = new URL(handle);	    	   
		   System.out.println(handle);
		   urlconn = (HttpURLConnection) url.openConnection();
		   urlconn.setInstanceFollowRedirects(true);
		   urlconn.setRequestMethod("GET");
		   urlconn.setDoOutput(true);
		   urlconn.setConnectTimeout(5000);
		   urlconn.setReadTimeout(5000);
		   urlconn.connect();
		   
		   int respCode = urlconn.getResponseCode();
		   
		   if(respCode!=HttpURLConnection.HTTP_CLIENT_TIMEOUT && respCode==HttpURLConnection.HTTP_OK){
		   
			   String lStream = "";
			   BufferedReader inp = new BufferedReader(new InputStreamReader(urlconn.getInputStream()));
			   while ((lStream = inp.readLine()) != null) {
				   lRespMesg = lRespMesg + lStream;
			   }
			   inp.close();
			   urlconn.disconnect();
		   
		 		System.out.println("Response :: "+lRespMesg);
		 		
		 		JSONParser parser = new JSONParser();
		 		Object obj = parser.parse(lRespMesg);
		 		JSONObject jObj = (JSONObject) obj;
		 		 
		 	}else{
			    System.out.println("Error in connection");
			}
		}catch(Exception e){
			System.out.println("Failure in connection :"+e.getMessage());
		}
	}
	
	private static void postConnect(String handle, List<String> urlList , int iteration){
		String lRespMesg = "";
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
		   
			   String lStream = "";
			   BufferedReader inp = new BufferedReader(new InputStreamReader(urlconn.getInputStream()));
			   while ((lStream = inp.readLine()) != null) {
				   lRespMesg = lRespMesg + lStream;
			   }
			   inp.close();
			   urlconn.disconnect();
			   JSONParser parser = new JSONParser();
		 	   JSONObject jObj = (JSONObject) parser.parse(lRespMesg);
		 	   System.out.println("Testhandle : "+jObj.get("testHandle"));
		 	}else{
			    System.out.println("Error in connection");
			}
		}catch(Exception e){
			System.out.println("Failure in connection :"+e.getMessage());
		}
	}
}