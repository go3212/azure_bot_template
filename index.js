
var app = require('express');
var http = require('http');
var fs = require('fs');

//app.use(express.static("public"));

var server = http.createServer((request, response) =>
{   
    
    if(request.headers.accept.split(',')[0] == 'text/css')
    {
        //console.log(request.headers);
        fs.readFile('./public/css/styles.css', (error, data) =>
        {
            response.writeHeader(200, { 'Content-Type': 'text/css' });
            response.write(data);
            response.end();
        });
    } 
    else 
    {
        fs.readFile('./public/index.htm', (error, html) =>
        {
            if (error) throw error;

            response.writeHeader(200, { 'Content-Type': 'text/html' });
            response.write(html);
            response.end();
        });
    }
});

server.listen(8080, 'localhost', 200, () =>
{
    console.log('Server started');
});
