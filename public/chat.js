/////////////////////////////////////////
//  DECLARACION DE VARIABLES GLOBALES  //
/////////////////////////////////////////
var chatroom = $("#chatroom");
var client = undefined;

$(function () 
{
    // CONEXION CON EL SERVIDOR, ENVIA SOCKET (identificador)
    var socket = io.connect('http://85.51.217.6:4000');
    socket.emit('request_data');

    // POSIBLES INPUTS Y OUTPUTS EN EL HTML
    let message = $("#message");
    let send_message = $("#send_message");
    let feedback = $("#feedback");
    let usersList = $("#users-list");
    let nickName = $("#nickname-input");
    let client_chat = $("#client_chat");
    let server_chat = $("#server_chat");

    ///////////////////////////////////////////////////////
    //  LÓGICA DE RECEPCIÓN DE DATOS INICIALES           //
    ///////////////////////////////////////////////////////
    
    socket.on ('request_data', (data) => 
    { 
        client = data;
        socket.emit ('request_chat_story');
    });

    socket.on ('chat-setup', (data) =>
    {
        if (data.uuid != client.uuid) append_text (server_chat, data);
        else 
        {
            append_text (client_chat, data);
            server_chat.prepend (`<div></div>`);
        }
        //keepTheChatRoomToTheBottom ();
    });
    
    // Esto esta work-in-progress
    socket.on ('reload-clients', () => { location.reload(); });
    
    ///////////////////////////////////////////////////////
    //  LÓGICA DE INTERACCIÓN CON EL SERVIDOR (EVENTOS)  //
    ///////////////////////////////////////////////////////
    
    // Emitir el cambio de nombre de usuario
    nickName.keypress ( e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13')
        {
            socket.emit('change_username', { nickName : nickName.val() });
            socket.emit('request_data');
        }
    });

    //Cuando un usuario se identifica accede a las funciones de chat.
    socket.on('logged', () =>
    {
        modal.style.display = "none";
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
                server_chat.prepend (`<div></div>`);
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
        feedback.html ('');
        message.val ('');
        // Poner el mensaje en la sala de chat
        append_text (server_chat, data);
        //keepTheChatRoomToTheBottom ();
    });
    
    // Cuando el cliente envia un mensaje.
    socket.on ('client_new_message', (data) =>
    {
        //server_chat.prepend (`<div></div>`);
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
            html += `<li class="list-item" style="color: #00000">${data[i]}</li>`;
        }
        usersList.html(html);
    });
    
});

// Mantener la sala de chat abajo (scroll)
const keepTheChatRoomToTheBottom = () => 
{
    const chatroom = document.getElementById('chatroom');
    $("#chatroom").scrollTop($("#chatroom")[0].scrollHeight); // =  chatroom.scrollHeight - chatroom.clientHeight;
}

// Funcion para implementar elementos en chatbox

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