
const http = require('http');
const util = require('util');
const fs = require('fs');
const os = require('os');
const UrlParser = require('url');

let theApp = {
  version: '1.0.0',
  port: 8081
};

//command line argument parse
process.argv.forEach(function (val, index, array) {

  //아규먼트가 존재하면 처리하고 없으면 기본값으로
  if (val.indexOf('=') > 0) {

    var tokens = val.split('=');

    switch (tokens[0]) {
      case 'port':
        theApp.port = parseInt(tokens[1]);
        break;
      case 'module_path':
        theApp.module_path = tokens[1];
        break;
    }
  }
});


let app = http.createServer(
  function (req, res) {

    if (req.url != '/favicon.ico') {

    }
    console.log(req.url);

    try {
      var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      console.log('remote address:' + ip);

    }
    catch (e) {
      console.log(e);

    }

    var method = req.method;
    if (method == 'OPTIONS') {
      method = req.headers['access-control-request-method'];
    }
    else {

    }

    console.log(method);

    switch (method) {
      case 'GET':
        process_get(req, res);
        break;
      case 'POST':
        process_post(req, res);
        break;
    }
  }
);
app.listen(theApp.port);

console.log('tiny upload server v ' + theApp.version);
console.log('  start port : ' + theApp.port + ', ready ok!');


//get 처리 해주기
function process_get(req, res) {

  var result = UrlParser.parse(req.url, true);

  console.log("GET", result);

  switch (result.pathname) {
    case '/':
      fs.readFile(__dirname + '/index.html',
        function (err, data) {
          if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
          }

          res.writeHead(200);
          res.end(data);
        });
      break;
    case '/download':
      {
        let header = {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Max-Age': '1000',
          "Access-Control-Allow-Headers": "*" //CORS 정책 허용  * 는 모두 허용 
        }

        let path = result.query.path
        let _type = result.query.type

        header['Content-Type'] = _type

        let _data = fs.readFileSync(path)

        res.writeHead(200, header);
        res.end(JSON.stringify({
          r: 'ok',
          data: _data
        }))
      }

      break;
    default:
      res.writeHead(200);
      res.end('file upload system version:' + theApp.version);
      break;
  }


}

function process_post(req, res) {

  let result = UrlParser.parse(req.url, true);
  let body_data = []

  console.log(req.headers)

  console.log('pathname', result.pathname);

  console.log("incomming post data !");

  switch (result.pathname) {
    case '/test':
      {
        //포스트는 데이터가 조각조각 들어 온다.
        req.on('data', function (data) {
          //body_data += data;
          body_data.push(data)
          console.log(`${data.length}  bytes saved `);
        });

        req.on('end', function () {

          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Max-Age': '1000',
            "Access-Control-Allow-Headers": "test-name" //CORS 정책 허용  * 는 모두 허용 

          });
          console.log(body_data)

          let result = { result: 'ok' }
          res.end(JSON.stringify(result));

        })
      }
      break;

    //POST로 들어 오는 데이터를 그때그때 파일에 쓰기 (메모리 절약)
    case '/upload':
      {

        let uploadName = req.headers['upload-name']

        //만약 cORS보안상의 이유로 upload-name같은 커스텀 해더를 목읽어 온다면 Access-Control-Allow-Headers 옵션을 주어 응답하면 해당 옵션에 반응하여 재요청 들어온다.
        if (!uploadName) {
          //CORS 관련 처리 , 
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Max-Age': '1000',
            "Access-Control-Allow-Headers": "upload-name ,content-type ,file-size"
            // "Access-Control-Allow-Headers": "*" //CORS 정책 허용  * 는 모두 허용 
          });

          console.log('try custom header')
          res.end();

        }
        else {
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Max-Age': '1000'
          });
          let filepath = `../uploads/${uploadName}`;

          console.log(`file path : ${filepath}`);

          let file_size = parseInt(req.headers['file-size'])
          console.log(file_size)

          //파일 오픈 
          let fd = fs.openSync(filepath, "w");

          let _index = 0;
          //포스트는 데이터가 조각조각 들어 온다.
          req.on('data', function (data) {
            _index += data.length;
            console.log(`data receive : ${data.length} , ${_index}`);
            fs.writeSync(fd, data);
            // res.write(JSON.stringify({index : _index}));
          });

          req.on('end', function () {
            console.log(`data receive end : ${_index}`);

            fs.closeSync(fd);
            // console.log(body_data)

            let result = { result: 'ok' }
            res.end(JSON.stringify(result));

          })

        }
      }
      break;

    //POST 로 나누어져 들어오는 데이터를 버퍼로 모아 한꺼번에 상태로 처리하기 (데이터 가공 용도)
    case '/upload-buffer':
      {

        if (req.headers['upload-name'] === undefined) {

          console.log('allow cors ')

          //CORS 처리 
          res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Max-Age': '1000',
            "Access-Control-Allow-Headers": "*" //CORS 정책 허용  * 는 모두 허용 

          });

          res.end();
        }

        else {
          // body_data = [];
          //파일 열기
          let filepath = `../uploads/${req.headers['upload-name']}`;
          console.log(`file path : ${filepath}`);



          let file_size = parseInt(req.headers['file-size'])
          console.log(file_size)
          // let fd = fs.openSync(filepath, "w");

          //크기 만큼 할당 
          const _buf = Buffer.allocUnsafe(file_size);

          let _index = 0;

          //포스트는 데이터가 조각조각 들어 온다.
          req.on('data', function (data) {

            //버퍼에 추가 
            data.copy(_buf, _index);
            _index += data.length;
            console.log(`data receive : ${data.length} , ${_index}`);
            //fs.writeSync(fd,data);
          });

          req.on('end', function () {
            console.log(`data receive end : ${_index}`);

            //버퍼내용 파일에 저장
            fs.writeFileSync(filepath, _buf);
            // fs.closeSync(fd);

            res.writeHead(200, {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST',
              'Access-Control-Max-Age': '1000'
            });

            // console.log(body_data)

            let result = { result: 'ok' }
            res.end(JSON.stringify(result));

          })

        }


      }
      break;


    // default: {

    // }
  }

}



