
var express=require('express');

var superagent= require('superagent');

var cheerio=require('cheerio');

var mysql=require('mysql');

var app=express();
//创建连接池
var pool=mysql.createPool({
        host: '127.0.0.1', 
        user: 'root',
        password: '123456',
        database:'weathers', // 前面建的user表位于些数据库中
        port: 3306
});

// 向前台返回JSON方法的简单封装
var jsonWrite = function (res, ret) {
    console.log(ret);
    if(typeof ret === 'undefined') {
        res.json({
            code:'1',
            msg: '操作失败'
        });
    } else {
        res.json(ret);
    }
};

app.get('/',function(req,res,next){
	superagent.get('http://www.pm25.in/chengdu')
	.end(function(err,sres){
		    if(err){
			          return next(err);
		           }
		      var $=cheerio.load(sres.text);
		      var newarrayjsonr;
		      var newArrayjsonstring;
		      var arrjson;
		      var array=[];
  
		      var json="[";
         //获取table的标题值
		    $('#detail-data thead tr').each(function(i,n){
                var tr=$(n);//标题行
                var tr_var=tr.text();
                var jsonTr=JSON.stringify(tr_var);
               //正则表达式将所有空格符去掉
                var re=/\s/g;
               //console.log(re.test(jsonTr));
               //去掉换行符
                var rep = /\\n/g;
               jsonTr=jsonTr.replace(re,"");
                var jsonr=jsonTr.replace(rep,"\n");
               var reggp = /\./g;
               jsonr = jsonr.replace(reggp,"");
              var arrayjsonr = jsonr.split("\n");
              newarrayjsonr = arrayjsonr.slice(1,arrayjsonr.length-1);
		  });

		   //获取table的value值
		   $('#detail-data tbody tr').each(function(j,n){
			              var tr=$(n);//行
			              var tr_value=tr.text();
			              var jsonstring=JSON.stringify(tr_value);
			             //正则表达式将所有空格符去掉
                    var re=/\s/g;
                   jsonstring = jsonstring.replace(re,"");
            
                  //匹配两个及以上'\n'字符串
                    var regExpRepeat = /(\\n){2,}/g;
                   jsonstring = jsonstring.replace(regExpRepeat,"\\n");
                   //匹配\n，再replace方法去掉
			             var regExp1 = /\\n/g;
                   var regexpp =/—/g;
                   var regexpp1=/_/g;
			             jsonstring = jsonstring.replace(regExp1,"\n");
                   jsonstring=jsonstring.replace(regexpp,0);
                   jsonstring=jsonstring.replace(regexpp1,0);
                   console.log(jsonstring);
			             newArrayjsonstring = jsonstring.split('\n');
			             newArrayjsonstring = newArrayjsonstring.slice(1,newArrayjsonstring.length-1);
			             array.push(newArrayjsonstring);
		   });
              var arr_link= [];
		    for(var i=0;i<array.length;i++){
            //遍历二维数组	
            	 arr_link =array[i];
            	 json+="{";
            	 for(var k=0;k<newarrayjsonr.length;k++){
            	 	     //将两个数组的数据进行匹配，生成json数据
                     json+="\"";
                     json+=newarrayjsonr[k];
            		     json+="\"";
            		     json+=":";
                     json+="\"";
            		     json+=arr_link[k];
            		     json+="\""; 
            		     json+="\,";
                   }
                   json=json.substring(0,json.length-1); 
                   json+="}";
            	     json+=",";  	          
          }
          json=json.substring(0,json.length-1);
          json+="]";
           //发送请求
           res.send(json);
           // 向前台返回JSON方法的简单封装
           var jsonWrite = function (res, ret) {
                  if(typeof ret === 'undefined') {
                     res.json({
                             code:'1',
                             msg: '操作失败'
                           });
                        } else {
                          res.json(ret);
                       }
              };
	        pool.getConnection(function(err,connection){
                 var jsonData=JSON.stringify(json);
                 var gdata=JSON.parse(json);
                 var myquery;
                      for(var i=0;i<gdata.length;i++){

                     myquery="INSERT INTO cdweather (`monpoint`,`aqi`,`aqiC`,`pripoll`,`pm25fm`,`pm10i`, `co`,`no2`,`1o3`,`8o3`,`so2`)VALUES ( '" + gdata[i].监测点+"', '"+gdata[i].AQI+"', '"+gdata[i].空气质量指数类别+
                     "', '"+gdata[i].首要污染物+ "', '"+gdata[i].PM25细颗粒物+"', '"+gdata[i].PM10可吸入颗粒物+"', '"+gdata[i].CO一氧化碳+
                     "', '"+gdata[i].NO2二氧化氮+"', '"+gdata[i].O3臭氧1小时平均+"', '"+gdata[i].O3臭氧8小时平均+"', '"+
                     gdata[i].SO2二氧化硫+ "' );";
                       
                       connection.query(myquery,function(err,result){
                         if(result) {
                                   result = {
                                       code: 200,
                                       msg:'增加成功'
                                     };    
                                 }else{
                                     result={status:0,msg:err};
                                       //console.log(result);
                                    }
                                // 以json形式，把操作结果返回给前台页面
                                 // jsonWrite(res, result);
                       
                      
                        });
                       
                      }
                        // 释放连接
						connection.release();
               
             });

       });
});
app.listen(3000, function () {
  console.log('app is listening at port 3000');
});