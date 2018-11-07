// 构建数据服务器

// 加载模块
var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var url = require('url');
var querystring=require('querystring');

// 创建服务
http.createServer(function(req,res){
    // 为 res 对象添加一个 render() 函数，方便后续使用
    res.render = function(filename) {
        fs.readFile(filename, function(err, data) {
            if (err) {
                res.writeHead(404, 'Not Found', { 'Content-Type': 'text/html;charset=utf-8' });
                res.end('404,not found.');
                return;
            }
            res.setHeader('Content-Type', mime.getType(filename));
            res.end(data);
        });
    };

    //将用户请求的rul和method转换为小写字母
    req.url = req.url.toLowerCase();
    req.method = req.method.toLowerCase();

    // 通过 url 模块，调用url.parse() 解析用户请求的url（req.url）;
    var urlObj=url.parse(req.url,true);
    // console.log(urlObj);
    
    // 设置全局允许跨域的请求头
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
    res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
 

    // 返回新闻列表
    if(req.url==='/data/newslist'&&req.method==='get'){

        res.render(path.join(__dirname,'data/news.json'));
    }
    // 返回新闻详情
    else if(urlObj.pathname==='/data/news'&&req.method==='get'){
        fs.readFile(path.join(__dirname,'data/news.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var news=null;
            var list=JSON.parse(data).results;
            for(var i=0;i<list.length;i++){
                if(list[i]._id===urlObj.query.id){
                    news=list[i];
                    break;
                }
            }
            news=JSON.stringify(news);
            res.setHeader('Content-Type','application/json');
            res.end(news);
        })
    }
    // 评论加载
    else if(urlObj.pathname==='/data/comment'&&req.method==='get'){
        // 所有新闻公用一套评论，此处省去对id的处理
        fs.readFile(path.join(__dirname,'data/comment/comment.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var commet=null;
            var list=JSON.parse(data).results;
            for(var i=0;i<list.length;i++){
                if(i+1==urlObj.query.pageindex){
                    commet=list[i];
                    break;
                }
            }
            // console.log(commet);
            commet=JSON.stringify(commet);
            res.setHeader('Content-Type','application/json');
            res.end(commet);
        })
    }
    // 提交新闻评论
    else if(urlObj.pathname==='/data/postcomment'&&req.method==='post'){
        // 所有新闻公用一套评论，此处省去对id的处理

        // 1.读取data.json文件中的数据
        fs.readFile(path.join(__dirname,'data/comment/comment.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            // 2.获取用户post 提交的数据
            var array = [];
            req.on('data', function(chunk){
                array.push(chunk);
            });
            req.on('end', function() {
                var postBody = Buffer.concat(array);
                // 把获取到的 buffer 对象转化为一个字符串
                postBody = postBody.toString('utf8');
                // // 把 post 请求的查询字符串，转化为一个 json 对象
                postBody = querystring.parse(postBody);
                var msg={
                    "user_name": "匿名用户",
                    "add_time": Date.now(),
                     "content":postBody.content
                }
                // 判断comment中的评论满不满十条，满的话另起一组
                var list=JSON.parse(data);
                if(list.results[0].message.length<10){
                    list.results[0].message.unshift(msg);
                }else{
                    var newMsg={
                        "message":[
                            msg
                        ]
                    };
                    list.results.unshift(newMsg);
                }

                // 将新的 list 数组，写入到 data.json 文件中
                fs.writeFile(path.join(__dirname, 'data/comment/comment.json'),JSON.stringify(list), function(err) {
                    if (err) {
                        throw err;
                    }
                    // 设置响应报文头
                    res.statusCode = '201';
                    statusMessage = 'Found';
                    res.end('ok');
                });
            })
        });
    }
    // 返回图片总列表
    else if(req.url==='/data/getimgcategory'&&req.method==='get'){
        
        res.render(path.join(__dirname,'data/photos/photolist.json'));
    }
    // 返回图片展示列表（客户端传参?id=xxx）
    else if(urlObj.pathname==='/getimages'&&req.method==='get'){
        // 只有1 和 2 有数据
        res.render(path.join(__dirname,'data/photos','images-'+urlObj.query.id+'.json'));
        
    }
    // 返回图片详情信息(?id=xxx)
    else if(urlObj.pathname==='/data/getimageinfo'&&req.method==='get'){
        
        fs.readFile(path.join(__dirname,'data/photos/imagesinfo.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var info={"status":0};
            data=JSON.parse(data).message;
            for(var i=0;i<data.length;i++){
                if(i+1==urlObj.query.id){
                    // console.log(data[i]);
                    info.message=data[i]; 
                    break;
                }
            }
            info=JSON.stringify(info);
            res.setHeader('Content-Type','application/json');
            res.end(info);
        })
    }
    // 返回图片缩略图
    else if(urlObj.pathname==='/data/getthumbs'&&req.method==='get'){
        
        fs.readFile(path.join(__dirname,'data/photos/getthumbs.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var imgs={"status":0};
            data=JSON.parse(data).thumbs;
            for(var i=0;i<data.length;i++){
                if(i+1==urlObj.query.id){
                    imgs.message=data[i].message; 
                    break;
                }
            }
            imgs=JSON.stringify(imgs);
            res.setHeader('Content-Type','application/json');
            res.end(imgs);
        })
    }
    // 返回商品列表数据
    else if(urlObj.pathname==='/data/getgoods'&&req.method==='get'){

        res.render(path.join(__dirname,'data/goods/page-'+urlObj.query.pageindex+'.json'));
    }
    // 返回商品图片链接数据
    else if(urlObj.pathname==='/data/goodsimages'&&req.method==='get'){
        
        fs.readFile(path.join(__dirname,'data/goods/images.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var list=null;
            data=JSON.parse(data).all;
            for(var i=0;i<data.length;i++){
                if(data[i].id==urlObj.query.id){
                    list=data[i]; 
                    break;
                }
            }
            list=JSON.stringify(list);
            res.setHeader('Content-Type','application/json');
            res.end(list);
        })
    }
    // 返回商品详情数据
    else if(urlObj.pathname==='/data/goodsinfo'&&req.method==='get'){
        
        fs.readFile(path.join(__dirname,'data/goods/goodsinfo.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var info={"status":0};
            data=JSON.parse(data).message;
            for(var i=0;i<data.length;i++){
                if(data[i].id.toString()===urlObj.query.id.toString()){
                    info.message=data[i]; 
                    break;
                }
            }
            info=JSON.stringify(info);
            res.setHeader('Content-Type','application/json');
            res.end(info);
        })
    }
    // 返回购物车数据(传过来的，例："http://localhost:9000/data/shopcar/1,2,5")
    else if(req.url.startsWith('/data/shopcar')&&req.method==='get'){
        // 解析urlObj.pathname，获取传递的带","的数字字符串
        var str=urlObj.pathname.split("/");
        var numStr=str[str.length-1];
        var num=numStr.split(",");

        // 读取文件并找到对应id的数据拼接处一个字符串
        fs.readFile(path.join(__dirname,'/data/goods/shopcar.json'),'utf8',function(err,data){
            if(err){
                throw err;
            }
            var info={"status":0,"message":[]};
            data=JSON.parse(data).message;
            for(var i=0;i<data.length;i++){
                if(info.message.length==num.length){
                    break;
                }
                if(num.indexOf(data[i].id.toString())>-1){
                    info.message.push(data[i]);
                }
            }
            info=JSON.stringify(info);
            res.setHeader('Content-Type','application/json');
            res.end(info);
        })
    }
    // 静态资源
    else if(req.url.startsWith('/upload') && req.method === 'get'){
        // 如果用户请求是以 /upload 开头，并且是 get 请求，就认为用户是请求静态资源
        res.render(path.join(__dirname, req.url));
    }
    else{
        res.end('404,not found.');
    }



}).listen(9000,function(){
    console.log('http://localhost:9000');
});

