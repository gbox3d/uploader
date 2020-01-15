const http = require('http');
const fs = require('fs');

// 태스트 ------
// node upload_client.js ./jangdori.jpg
// -----------

function PostCode() {

    let post_data = Buffer.from("hello world it is post");

    // An object of options to indicate where to post to
    var post_options = {
        host: 'localhost',
        port: '8081',
        path: '/upload',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data),
            'upload-name' : 'test.text'
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        //응답 처리
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });

    post_req.write( post_data);

    post_req.end();
}

function uploadFile({host,path}) {

    // let post_data = Buffer.from("hello world it is post");

    let _path = path;
    let _file =  path.split('/').pop()//'jangdori.jpg'

    let post_data = fs.readFileSync(_path);

    // An object of options to indicate where to post to
    var post_options = {
        host: host,//'localhost',
        port: '8081',
        path: '/upload',
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream', //default for binary data file
            'Content-Length': Buffer.byteLength(post_data),
            'upload-name' : _file
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        //응답 처리
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
        res.on('end',()=> {
            console.log('end of connection')
        })

    });

    post_req.write( post_data);

    post_req.end();
}

// PostCode()
//uploadFile();
// process.argv.forEach(function (val, index, array) {
//     console.log(index + ': ' + val);
//
//
//
// });

// let splitPath = process.argv[2].split('/');
// console.log(splitPath)
uploadFile({
    path : process.argv[2],
    host : 'localhost'
})