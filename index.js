/* eslint-disable brace-style */
var http = require('http');
var fs = require('fs');

var server = http.createServer((request, response) =>
{
    fs.readFile('./index.htm', (error, html) =>
    {
        if (error) throw error;

        response.writeHeader(200, { 'Content-Type': 'text/html' });
        response.write(html);
        response.end();
    });
});

server.listen(1322, 'localhost', 200, () =>
{
    console.log('Server started');
});
