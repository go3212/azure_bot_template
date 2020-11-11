const uuid = require('uuid');
var http = require('http');
var fs = require('fs');
var url = require('url');
let randomColor = require('randomcolor');

//app.use(express.static("public"));

var server = http.createServer((request, response) =>
{   

    //if (request.headers.accept.split(',')[0] == '')
    //console.log(request.headers);
    //console.log(pathname);

    var pathname = url.parse(request.url).pathname;

    if (pathname == '/chat.js' || pathname == '/modalScript.js') 
    {
        var file = fs.readFileSync("./public" + pathname);
        response.write(file);
        response.end()
    }

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
        fs.readFile('./public/index.html', (error, html) =>
        {
            if (error) throw error;
            
            response.writeHeader(200, { 'Content-Type': 'text/html' });
            response.write(html);
            response.end();
        });
    }
});

server.listen(3000, 'localhost', () =>
{
    console.log('Server started');
});

const io = require("socket.io")(server);

let users = [];
let connections = [];

io.on('connection', (socket) =>
{
    console.log('New user connected');
    connections.push(socket);
    
    let color = randomColor();
    
    socket.username = 'Anonymous';
    socket.color = color;
    
    socket.on('change_username', data =>
    {
        let id = uuid.v4();
        socket.id = id;
        socket.username = data.nickName;
        users.push({ id, username: socket.username, color: socket.color });
        updateUsernames();
    });
    
    const updateUsernames = () =>
    {
        io.sockets.emit('get users', users);
    };
    
    
    socket.on('new_message', (data) =>
    {
        io.sockets.emit('new_message', { message: data.message, username: socket.username, color: socket.color });
    });

    socket.on('disconnect', data =>
    {
        if (!socket.username) return;

        let user = undefined;
        for (let i = 0; i < users.length; ++i)
        {
            if (users[i].id == socket.id)
            {
                user = users[i];
                break;
            }
        }

        users.splice(user, 1);

        updateUsernames();
        connections.splice(connections.indexOf(socket, 1));
    });
});

