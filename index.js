var http = require('http');
var fs = require('fs');
var url = require('url');
const uuid = require('uuid');
let randomColor = require('randomcolor');

////////////////////////////////////////////////////////
// INICIALIZAR SERVIDOR Y ENVIAR DATOS A LOS CLIENTES //
////////////////////////////////////////////////////////

var server = http.createServer((request, response) =>
{   
    // Se separan las peticiones en distintos tipos:

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
    // EL HTML
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

    // Aquí se envian los scripts necesarios para el funcionamiento correcto del HTML
    var pathname = url.parse(request.url).pathname;

    if (pathname == '/chat.js' || pathname == '/modalScript.js') 
    {
        var file = fs.readFileSync("./public" + pathname);
        response.write(file);
        response.end()
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
var file_extension = '.csv';
var date = ((((new Date()) + '').split(' ').join('_')).split('_GMT', 1)[0]).slice(0,-9);
var file_directory = __dirname + '/database/' + date + file_extension;

fs.writeFile (file_directory, '', { flag: 'wx' }, (err) =>
{
    if (err) console.log(date + file_extension + " file exists");
});


/////////////////////////////////////////////////////////
//  EVENTOS INPUT-OUTPUT, INTERACCÓN CLIENTE-SERVIDOR  //
/////////////////////////////////////////////////////////

const io = require ("socket.io")(server);

var users = [];
var connections = [];
var user_addresses = {};

io.on ('connection', (socket) =>
{
    console.log('Nueva conexión: ' + socket.handshake.address);
    connections.push(socket);
    
    // Esta función actualiza los nombres de usuraio en los clientes (WIP)
    const updateUsernames = () =>
    {
        return new Promise (resolve =>
        {
            setTimeout(() => resolve(io.sockets.emit('get users', users)), 0);
        });
    };
    
    
    /////////////////////////////////////
    //  LÓGICA DE GESTIÓN DE USUARIOS  //
    /////////////////////////////////////
    
    // Aquí se "logean" los usuarios, se almacenan sus datos para que no se vuelva a pedir un username si se refresca la página
    let user_ip = socket.handshake.address;
    let user = user_addresses[user_ip];
    
    if (!(user_ip in user_addresses) || !user.logged)
    {
        socket.username = "Anonymous";
        socket.color = randomColor();
        socket.uuid = uuid.v4();
        
        user_addresses[user_ip] = { uuid: socket.uuid, username: "Anonymous", color: socket.color, logged: false };
        
        socket.on ('change_username', data =>
        {
            socket.username = data.nickName;
            socket.color = user_addresses[user_ip].color;
            user_addresses[user_ip].username = data.nickName;
            user_addresses[user_ip].logged = true;
            users.push(user_addresses[user_ip].username);
            updateUsernames();
            socket.emit('logged');
        });   
    }
    else if (user.logged)
    {
        socket.username = user.username;
        socket.uuid = user.uuid;
        socket.color = user.color;
        users.push(user_addresses[user_ip].username);
        socket.emit('logged');
    }
    
    updateUsernames();
    
    // Se detecta la desconexión de algun usuario
    socket.on ('disconnect', data =>
    {
        if (users.includes(socket.username)) 
        {
            users.splice(users.indexOf(socket.username), 1);
        }
        connections.splice(connections.indexOf(socket, 1));
        updateUsernames();
    });
    
    /////////////////////////////////////
    //   ENVIAR CHAT PREVIO A USUARIO  //
    /////////////////////////////////////
    let database = fs.createReadStream(file_directory, 'utf8');
    database.on('data', (chunk) => 
    {
        // Básicamente, el archivo separa las lineas con saltos de linea, los cortamos. Además, siempre hay una linea entera sin elementos. La eliminamos.
        chunk = chunk.split('\n');
        chunk.pop();
        for (item in chunk)
        {
            item = chunk[item].split(',');
            let data = { uuid: item[0], username: item[1], color: item[2], message: item[3] };
            socket.emit('chat-setup', data);
        }
    });
    
    ////////////////////////////////////////////
    //  LÓGICA DE EVENTOS SERVIDOR -> CLIENTE //
    ////////////////////////////////////////////
    socket.on ('request_data', () => { socket.emit ('request_data', user_addresses[socket.handshake.address]); });
    
    // Se remite a todos los clientes la información de los mensajes entrantes.
    socket.on ('new_message', (data) =>
    {
        // Guardar las conversaciones en un archivo.
        let information = data.uuid + ',' + data.username + ',' + data.color + ',' + data.message;
        fs.appendFile(file_directory, information + '\n', (err) =>
        {
            if (err) throw err;
        });
        
        socket.broadcast.emit ('server_new_message', data);
        //socket.emit ('client_new_message', data) 
    });
    
    // Se remite si algún usuario escribe.
    socket.on ('typing', data =>
    {
        socket.broadcast.emit('typing', { username: socket.username })
    });
    
});

