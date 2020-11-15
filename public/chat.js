$(function () 
{
    // CONEXION CON EL SERVIDOR, ENVIA SOCKET (identificador)
    var socket = io.connect('http://localhost:4000');
    
    // POSIBLES INPUTS Y OUTPUTS EN EL HTML
    let message = $("#message");
    let send_message = $("#send_message");
    let chatroom = $("#chatroom");
    let feedback = $("#feedback");
    let usersList = $("#users-list");
    let nickName = $("#nickname-input");
    
    
    ///////////////////////////////////////////////////////
    //  LÓGICA DE INTERACCIÓN CON EL SERVIDOR (EVENTOS)  //
    ///////////////////////////////////////////////////////
    
    // Emitir el cambio de nombre de usuario
    nickName.keypress( e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13')
        {
            socket.emit('change_username', { nickName : nickName.val() });
        }
    });

    // Emitir mensajes al servidor
    message.keypress( e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode == '13')
        {
            socket.emit('new_message', { message : message.val() });
        }
    });

    // Emitir si el usuario está escribiendo
    message.bind("keypress", e =>
    {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if(keycode != '13')
        {
            socket.emit('typing');
        }
    });
    

    ///////////////////////////////////////////////////////
    //    LÓGICA DE RECEPCIÓN DE EVENTOS DEL SERVIDOR    //
    ///////////////////////////////////////////////////////

    // Cuando un usuario se identifica
    socket.on('logged', () =>
    {
       
    });

    // Cuando se recibe un mensaje (aunque sea un mensaje propio) 
    socket.on('new_message', (data) =>
    {
        feedback.html('');
        message.val('');
        // Poner el mensaje en la sala de chat
        chatroom.append(`
                        <div>
                            <div class="box3 sb14">
                              <p style='color:${data.color}' class="chat-text user-nickname">${data.username}</p>
                              <p class="chat-text" style="color: rgba(0,0,0,0.87)">${data.message}</p>
                            </div>
                        </div>
                        `);
        keepTheChatRoomToTheBottom();
    });

    // Si un usuario escribe mostrarlo
    socket.on('typing', (data) =>
    {
        feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>");
    });

    // Actualizar la lista de usuarios online
    socket.on('get users', data =>
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
    chatroom.scrollTop = chatroom.scrollHeight - chatroom.clientHeight;
}

