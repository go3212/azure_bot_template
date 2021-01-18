/**
 * @summary This class is intended to handle all client-server interactions
 * @constructor Notifies the server that the user has connected and asks for its data.
 * @param {string} server_ip The ip of the node + socket.io server.
 */
class chatevent
{
    constructor (server_ip)
    {
        socket = io.connect(server_ip);

        // Notifies the server that a user has connected (update database)
        socket.emit('first-connection', uuid);
        // Requests the user-data that's stored on the server
        socket.emit('request_data');
    };
}