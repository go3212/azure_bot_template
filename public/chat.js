////////////////////////////////////
//  GLOBAL VARIABLES DECLARATION  //
////////////////////////////////////
var date = new Date();
var chatroom = $("#chatroom");
var uuid = get_uuid();
var client = undefined;
var previous_message = {"username" : undefined, "message" : undefined};

$(function () 
{
    // CONEXION CON EL SERVIDOR, ENVIA SOCKET (identificador) y uuid
    var socket = io.connect('http://192.168.1.60:4000');
    socket.emit('first-connection', uuid);
    socket.emit('request_data');

    // POSIBLES INPUTS Y OUTPUTS EN EL HTML
    let message = $("#message");
    let send_message = $("#send_message");
    let feedback = $("#feedback");
    let online_users = $("#online-users");
    let nickName = $("#nickname-input");
    let chat = $("#chat");
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
            append_message_server (chat, data);
        }
        else 
        {
            append_message_client (chat, data);
        }
        keepTheChatRoomToTheBottom ();
    });
    
    // Esto esta work-in-progress
    socket.on ('reload-clients', () => { location.reload(); });
    
    ///////////////////////////////////////////////////////
    //  LÓGICA DE INTERACCIÓN CON EL SERVIDOR (EVENTOS)  //
    ///////////////////////////////////////////////////////
    
    // Username update emit
    nickName.keypress ( e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13')
        {
            socket.emit('change-username', { username : nickName.val(), event : 'username' });
            socket.emit('request_data');
        }
    });

    //Logged status grants access to chat functionality
    socket.on('logged', () =>
    {
        // modal.style.display = "none";
        // Emitir mensajes al servidor
        message.keypress( e =>
        {  
            let keycode = (e.keyCode ? e.keyCode : e.which);
            if(keycode == '13')
            {
                let data = client;
                data['message'] = message.val();
                if (date.getHours < 10) data['hours'] = '0' + date.getHours();
                else data['hours'] = date.getHours();
                if (date.getMinutes < 10) data['minutes'] = '0' + date.getMinutes();
                else data['minutes'] = date.getMinutes();
                feedback.html ('');
                message.val ('');
                
                append_message_client (chat, data);
                socket.emit('new_message', data);
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

    // When a message is received
    socket.on ('server_new_message', (data) =>
    {
        // Poner el mensaje en la sala de chat
        append_message_server (chat, data);
        keepTheChatRoomToTheBottom ();
    });
    
    // When another client sends data
    socket.on ('client_new_message', (data) =>
    {
        keepTheChatRoomToTheBottom ();          
    });

    // If someone is typing
    socket.on ('typing', (data) =>
    {
        feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>");
    });
    
    // Update online users list
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
function append_message_client (element, data)
{
    let message = '';

    message += `<div class="client-message-box-no-username">`;
    message += `<p class="chat-text-client" style="color: rgba(0,0,0,0.87)">${data.message}</p>`;
    message += `<div class="chat-hour-client"><p>${data.hours}:${data.minutes}</p></div></div>`;

    element.prepend(message);

    previous_message['username'] = data.username;
    previous_message['message'] = data.message;
};

function append_message_server (element, data)
{
    let message = '';
    if (data.username != previous_message.username) 
    {
        message += `<div class="server-message-box-with-username">`;
        message += `<p style='color:${data.color}' class="chat-text-server-username">${data.username}</p>`;
        message += `<p class="chat-text-server-ubord" style="color: rgba(0,0,0,0.87)">${data.message}</p>`;
        message += `<div class="chat-hour-server-ubord"><p>${data.hours}:${data.minutes}</p></div></div>`;
    } 
    else 
    {
        message += `<div class="server-message-box-no-username">`;
        message += `<p class="chat-text-server-nubord" style="color: rgba(0,0,0,0.87)">${data.message}</p>`;
        message += `<div class="chat-hour-server-bord"><p>${data.hours}:${data.minutes}</p></div></div>`;
    }

    element.prepend(message);

    previous_message['username'] = data.username;
    previous_message['message'] = data.message;
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