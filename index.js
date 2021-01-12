var http = require('http');
var fs = require('fs');
var url = require('url');
const uuid_gen = require('uuid');
let randomColor = require('randomcolor');
let Manager = require('./custom_modules/user_manager.js')


////////////////////////////////////////////////////////
// INICIALIZAR SERVIDOR Y ENVIAR DATOS A LOS CLIENTES //
////////////////////////////////////////////////////////

var server = http.createServer((request, response) =>
{   
    // Se separan las peticiones en distintos tipos:
    var pathname = url.parse(request.url).pathname;

    // El CSS
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
    // Aquí se envian los scripts necesarios para el funcionamiento correcto del HTML
    else if (pathname == '/chat.js' || pathname == '/modalScript.js') 
    {
        var file = fs.readFileSync("./public" + pathname);
        response.write(file);
        response.end()
    }
    // EL HTML
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
server.listen(4000, '192.168.1.60', () =>
{
    console.log('Servidor iniciado');
});

//////////////////////////////////
//  LÓGICA DE LA BASE DE DATOS  //
//////////////////////////////////

// Lógica de la base de datos, se crea un fichero de conversaciones diario.
var chat_database_file_extension = '.csv';
var date = ((((new Date()) + '').split(' ').join('_')).split('_GMT', 1)[0]).slice(0,-9);
var chat_database_file = __dirname + '/database/' + date + chat_database_file_extension;

fs.writeFile (chat_database_file, '', { flag: 'wx' }, (err) =>
{
    if (err) console.log(date + chat_database_file_extension + " file exists");
});

//////////////////////////////////
//  CARGA DE DATOS DE USUARIOS  //
/////////////////////////////////
var users_database_file_name = 'users';
var users_database_file_extension = '.json';
var users_database_file = __dirname + '/database/' + users_database_file_name + users_database_file_extension;

let manager = new Manager (users_database_file);

/////////////////////////////////////////////////////////
//  EVENTOS INPUT-OUTPUT, INTERACCÓN CLIENTE-SERVIDOR  //
/////////////////////////////////////////////////////////

const io = require ("socket.io")(server);

io.on ('connection', (socket) =>
{
    console.log('Nueva conexión: ' + socket.handshake.address);

    /////////////////////////////////////
    //  LÓGICA DE GESTIÓN DE USUARIOS  //
    /////////////////////////////////////
    socket.on('first-connection', (data) => 
    {
        //console.log(uuid);
        socket.uuid = data['uuid'];
        manager.connectUser(socket.uuid);
        console.log(manager.onlineUsers);
        socket.emit('logged');

        updateUsernames();
    });

    // Cambio de usuario
    socket.on('change-username', (data) =>
    {
        manager.edit(data.event, data.username, socket.uuid);
        
        updateUsernames();
    });

    // Se detecta la desconexión de algun usuario
    socket.on ('disconnect', (data) =>
    {
        manager.disconnectUser(socket.uuid);
        
        updateUsernames();
    });
    

    ////////////////////////////////////////////
    //  LÓGICA DE EVENTOS SERVIDOR -> CLIENTE //
    ////////////////////////////////////////////
    socket.on ('request_data', () => { socket.emit('request_data', manager.onlineUsers.get(socket.uuid)); });
    
    // Se remite a todos los clientes la información de los mensajes entrantes.
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
    
    /* Se remite si algún usuario escribe.
    socket.on ('typing', data =>
    {
        socket.broadcast.emit('typing', { username: manager.onlineUsers.get(socket.uuid)['username'] })
    });
    */
    /////////////////////////////////////
    //   ENVIAR CHAT PREVIO A USUARIO  //
    /////////////////////////////////////
    socket.on ('request_chat_story', () =>
    {
        let database = fs.createReadStream (chat_database_file, 'utf8');
        database.on('data', (chunk) => 
        {
            // Básicamente, el archivo separa las lineas con saltos de linea, los cortamos. Además, siempre hay una linea entera sin elementos. La eliminamos.
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

function parseCookies (request) {
    var list = {}, rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

// Esta función actualiza los nombres de usuraio en los clientes (WIP)
const updateUsernames = () =>
{
    let users = [];
    i = 0;
    manager.onlineUsers.forEach((value, key, map) => 
    {
        users[i] = value.username;
        i += 1;
    });
    console.log(users);
    
    return new Promise (resolve =>
    {
        setTimeout(() => resolve(io.sockets.emit('get users', users)), 0);
    });
};