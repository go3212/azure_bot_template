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

/* Lógica de la base de datos
var database = fs.createReadStream(__dirname + '/database/users.json', 'utf8');

database.on('data', (chunk) => 
{
    console.log(chunk);
});
*/

/////////////////////////////////////////////////////////
//  EVENTOS INPUT-OUTPUT, INTERACCÓN CLIENTE-SERVIDOR  //
/////////////////////////////////////////////////////////

const io = require("socket.io")(server);

let users = [];
let connections = [];
let user_addresses = {};

io.on('connection', (socket) =>
{
    console.log('Nueva conexión');
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
        
        user_addresses[user_ip] = { uuid: uuid.v4(), username: "Anonymous", color: socket.color, logged: false };
        
        socket.on('change_username', data =>
        {
            socket.username = data.nickName;
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
        socket.id = user.uuid;
        socket.color = user.color;
        users.push(user_addresses[user_ip].username);
        console.log(users);
        socket.emit('logged');
    }
    
    updateUsernames();
    
    // Se detecta la desconexión de algun usuario
    socket.on('disconnect', data =>
    {

        if (users.includes(socket.username)) 
        {
            users.splice(users.indexOf(socket.username), 1);
        }
        connections.splice(connections.indexOf(socket, 1));
        updateUsernames();
    });

    ////////////////////////////////////////////
    //  LÓGICA DE EVENTOS SERVIDOR -> CLIENTE //
    ////////////////////////////////////////////

    // Se remite a todos los clientes la información de los mensajes entrantes.
    socket.on('new_message', (data) =>
    {
        io.sockets.emit('new_message', { message: data.message, username: socket.username, color: socket.color });
    });

    // Se remite se algún usuario escribe.
    socket.on('typing', data =>
    {
        socket.broadcast.emit('typing', { username: socket.username })
    });

});

