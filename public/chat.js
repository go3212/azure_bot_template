/////////////////////////////////////////
//  DECLARACION DE VARIABLES GLOBALES  //
/////////////////////////////////////////
var chatroom = $("#chatroom");
var uuid = get_uuid();
var client = undefined;

$(function () 
{
    // CONEXION CON EL SERVIDOR, ENVIA SOCKET (identificador) y uuid
    var socket = io.connect('http://85.51.217.6:4000');
    socket.emit('first-connection', uuid);
    socket.emit('request_data');

    // POSIBLES INPUTS Y OUTPUTS EN EL HTML
    let message = $("#message");
    let send_message = $("#send_message");
    let feedback = $("#feedback");
    let online_users = $("#online-users");
    let nickName = $("#nickname-input");
    let client_chat = $("#client_chat");
    let server_chat = $("#server_chat");
    let data_requested = false;

    ///////////////////////////////////////////////////////
    //  LÓGICA DE RECEPCIÓN DE DATOS INICIALES           //
    ///////////////////////////////////////////////////////
    
    socket.on ('request_data', (data) => 
    { 
        client = data;
        client.uuid = uuid['uuid'];
        if (!data_requested) socket.emit ('request_chat_story');
        data_requested = true;
    });

    socket.on ('chat-setup', (data) =>
    {
        if (data.uuid != client.uuid) 
        {
            append_text (server_chat, data);
            empty_line (client_chat, 2);
        }
        else 
        {
            append_text (client_chat, data);
            empty_line (server_chat, 2);
        }
        keepTheChatRoomToTheBottom ();
    });
    
    // Esto esta work-in-progress
    socket.on ('reload-clients', () => { location.reload(); });
    
    ///////////////////////////////////////////////////////
    //  LÓGICA DE INTERACCIÓN CON EL SERVIDOR (EVENTOS)  //
    ///////////////////////////////////////////////////////
    
    // Cambio de nombre de usuario
    

    // Emitir el cambio de nombre de usuario
    nickName.keypress ( e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13')
        {
            socket.emit('change-username', { username : nickName.val(), event : 'username' });
            socket.emit('request_data');
        }
    });

    //Cuando un usuario se identifica accede a las funciones de chat.
    socket.on('logged', () =>
    {
        // modal.style.display = "none";
        // Emitir mensajes al servidor
        message.keypress( e =>
        {  
            let keycode = (e.keyCode ? e.keyCode : e.which);
            if(keycode == '13')
            {
                let data = message.val();
                feedback.html ('');
                message.val ('');
                
                append_text (client_chat, Object.assign(client, {message: data}));
                socket.emit('new_message', Object.assign(client, {message: data}));
            }
        });

        // Emitir si el usuario está escribiendo
        message.bind ("keypress", e =>
        {
            let keycode = (e.keyCode ? e.keyCode : e.which);
            if(keycode != '13')
            {
                socket.emit('typing');
            }
        });
    });

    ///////////////////////////////////////////////////////
    //    LÓGICA DE RECEPCIÓN DE EVENTOS DEL SERVIDOR    //
    ///////////////////////////////////////////////////////

    // Cuando se recibe un mensaje de otro usuario 
    socket.on ('server_new_message', (data) =>
    {
        // Poner el mensaje en la sala de chat
        append_text (server_chat, data);
        empty_line (client_chat, 2);
        keepTheChatRoomToTheBottom ();
    });
    
    // Cuando el cliente envia un mensaje.
    socket.on ('client_new_message', (data) =>
    {
        empty_line (server_chat, 2);
        keepTheChatRoomToTheBottom ();          
    });

    // Si un usuario escribe mostrarlo
    socket.on ('typing', (data) =>
    {
        feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>");
    });
    
    // Actualizar la lista de usuarios online
    socket.on ('get users', data =>
    {
        let html = '';
        for(let i = 0; i < data.length; i++)
        {
            html += `<div class="connected-user" style="color: #00000"><p>${data[i]}</p></div>`;
        }
        online_users.html(html);
    });

});

// Mantener la sala de chat abajo (scroll)
const keepTheChatRoomToTheBottom = () => 
{
    const chatroom = document.getElementById('chatroom');
    $("#chatroom").scrollTop($("#chatroom")[0].scrollHeight); // =  chatroom.scrollHeight - chatroom.clientHeight;
}

// Funciones para implementar elementos en chatbox
function append_text (element, data)
{
    element.prepend (`
                    <div>
                        <div class="box3 sb14">
                        <p style='color:${data.color}' class="chat-text user-nickname">${data.username}</p>
                        <p class="chat-text" style="color: rgba(0,0,0,0.87)">${data.message}</p>
                        </div>
                    </div>
                    `);
};


// Function to get uuid.
function get_uuid ()
{
    let uuid = document.cookie;
    uuid = uuid.split('=');
    uuid[0] = '"' + uuid[0] + '"';
    uuid[1] = '"' + uuid[1] + '"';
    uuid = uuid.join(':');
    uuid = JSON.parse("{" + uuid + "}");
    return uuid;
}


function empty_line (element, n)
{
    for (let i = 1; i <= n; ++i)
    {
        element.prepend (`<div class="empty_div"> space </div>`);
    }
}

//////////////////
//  CHEATSHEET  //
//////////////////

/*

// sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');

// list socketid
for (var socketid in io.sockets.sockets) {}
 OR
Object.keys(io.sockets.sockets).forEach((socketid) => {});

*/