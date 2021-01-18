var http = require('http');
var fs = require('fs');
var url = require('url');
const uuid_gen = require('uuid');
let randomColor = require('randomcolor');
let Manager = require('./custom_modules/user_manager.js')


////////////////////////////////////////////////
// INITIALIZIZE SERVER AND ATTEND TO REQUESTS //
////////////////////////////////////////////////

var server = http.createServer((request, response) =>
{   
    var pathname = url.parse(request.url).pathname;

    if(request.headers.accept.split(',')[0] == 'text/css')
    {
        fs.readFile('./public/css/styles.css', (error, data) =>
        {
            response.writeHeader(200, { 'Content-Type': 'text/css' });
            response.write(data);
            response.end();
        });
    } 
    else if (pathname == '/chat.js' || pathname == '/modalScript.js') 
    {
        var file = fs.readFileSync("./public" + pathname);
        response.write(file);
        response.end()
    }
    else 
    {
        fs.readFile('./public/index.html', (error, html) =>
        {
            if (error) throw error;
            
            response.setHeader('Content-Type', 'text/html');
            
            var cookies = parseCookies(request);
            if (cookies['uuid'] == undefined)
            {
                response.setHeader('Set-Cookie', 'uuid='+(uuid_gen.v4()).toString() + ';expires=Fri, 31 Dec 9999 23:59:59 GMT');
            }
            response.writeHeader(200, { 'Content-Type': 'text/html' });
            response.write(html);
            response.end();
        });
    }


});

// Inicialización del servidor
server.listen(4000, '192.168.1.141', () =>
{
    console.log('Servidor iniciado');
});

///////////////////////////
//  CHAT DATABASE LOGIC  //
///////////////////////////

var chat_database_file_extension = '.csv';
var date = ((((new Date()) + '').split(' ').join('_')).split('_GMT', 1)[0]).slice(0,-9);
var chat_database_file = __dirname + '/database/' + date + chat_database_file_extension;

fs.writeFile (chat_database_file, '', { flag: 'wx' }, (err) =>
{
    if (err) console.log(date + chat_database_file_extension + " file exists");
});

let manager = new Manager (__dirname + '/database/users.json');

//////////////////////////////////////////////////////
//  INPUT-OUTPUT EVENTS, CLIENT-SERVER INTERACTION  //
//////////////////////////////////////////////////////

const io = require ("socket.io")(server);

io.on ('connection', (socket) =>
{
    console.log('Nueva conexión: ' + socket.handshake.address);

    /////////////////////////////
    //  USER CONNECTION LOGIC  //
    /////////////////////////////
    socket.on('first-connection', (data) => 
    {
        socket.uuid = data['uuid'];
        manager.connectUser(socket.uuid);
        socket.emit('logged');

        updateUsernames();
    });

    socket.on('change-username', (data) =>
    {
        manager.edit(data.event, data.username, socket.uuid);
        
        updateUsernames();
    });

    socket.on ('disconnect', (data) =>
    {
        manager.disconnectUser(socket.uuid);
        
        updateUsernames();
    });
    

    //////////////////////////////
    //  SERVER EVENTS -> CLIENT //
    //////////////////////////////
    socket.on ('request_data', () => { socket.emit('request_data', manager.onlineUsers.get(socket.uuid)); });
    
    socket.on ('new_message', (data) =>
    {
        // Guardar las conversaciones en un archivo.
        let information = data.uuid + ',' + data.username + ',' + data.color + ',' + data.message;
        fs.appendFile(chat_database_file, information + '\n', (err) =>
        {
            if (err) throw err;
        });
        
        socket.broadcast.emit('server_new_message', data);
        socket.emit('client_new_message', data) 
    });
    
    /* If user types, send it to everyone
    socket.on ('typing', data =>
    {
        socket.broadcast.emit('typing', { username: manager.onlineUsers.get(socket.uuid)['username'] })
    });
    */
    ///////////////////////////////
    //   SEND CHAT-DATA TO USER  //
    ///////////////////////////////
    socket.on ('request_chat_story', () =>
    {
        let database = fs.createReadStream (chat_database_file, 'utf8');
        database.on('data', (chunk) => 
        {
            chunk = chunk.split('\n');
            chunk.pop();
            for (item in chunk)
            {
                item = chunk[item].split(',');

                let message = [];
                for (let i = 3; i <= item.length - 1; ++i) 
                {
                    message.push(item[i]);
                }
                item[3] = message.join(',');
                let data = { uuid: item[0], username: item[1], color: item[2], message: item[3] };
                socket.emit('chat-setup', data);
            }
        });
    });
});

/**
 * @summary Gets the cookie field from a request
 * @param {http.IncomingMessage} request html request.
 * @return {Object} Cookies list.
 */
function parseCookies (request) 
{
    var list = {}, rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) 
    {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

/**
 * @summary Updates connected user usernames to all online users
 * @fires 'get users' 
 * @since 0.0.0
 * @access private
 */
const updateUsernames = () =>
{
    let users = [];
    i = 0;
    manager.onlineUsers.forEach((value, key, map) => 
    {
        users[i] = value.username;
        i += 1;
    });
    
    return new Promise (resolve =>
    {
        setTimeout(() => resolve(io.sockets.emit('get users', users)), 0);
    });
};