const uuid = require('uuid');
var fs = require('fs');
let randomColor = require('randomcolor');

var usersfile;

class User
{
    constructor (uuid, nickname)
    {
        this.data = {uuid: uuid, nickname: nickname, color: color};
        this.updateLogging();
        this.login_details;
    }

    state = {
        last_logged: undefined,
        
    }

    updateLogging()
    {
        var date_data = new Date();
        this.login_details = 
        {
            "date" : {
                day: date_data.getDate(),
                month: date_data.getMonth(),
                year: date_data.getFullYear(),
            },
            "time" : {
                hour: date_data.getHours(),
                minutes: date_data.getMinutes(),
                seconds: date_data.getSeconds(),
            },
        }
    }
}

class su extends User
{

}

/**
 * @description This class is the default object of the module. It handles all user's data.
 * @constructor Loads all previous stored data (if any) into a hash map. 
 * @since 0.0.0
 */
class Manager
{
    constructor(location)
    {
        usersfile = location;
        this.onlineUsers = new Map();
        this.allTimeUsers = new Map();

        // Gather all time users
        this.gatherAllTimeUsers();
    };

    /**
     * @summary Gathers stored data from previous sessions and stores it into the allTimeUsers hash-map.
     * @since 0.0.0
     * @access public
     */
    gatherAllTimeUsers()
    {
        let users = {};
        new Promise ((resolve, refuse) => 
        {
            fs.readFile (usersfile, 'utf8', (err, data) =>
            {
                if (err) refuse();
                users = JSON.parse(data);
                resolve();
            });
        })
        .then(() => {
            for (let [key, value] of Object.entries(users))
            {   
                let userdata = {username: value.username, color: value.color}
                this.allTimeUsers.set(key, userdata);
            }
        }, () => {
            console.log(err);
        });
    };

    /**
     * @summary Adds a user into the online hash-map.
     * @param {string} uuid user-exclusive identificator.
     * @since 0.0.0
     * @access public
     */
    connectUser (uuid)
    {
        // Si existe el usuario -> meterlo a online
        if (this.allTimeUsers.get(uuid) != undefined)
        {
            this.onlineUsers.set(uuid, this.allTimeUsers.get(uuid));
        }  
        else
        {
            this.allTimeUsers.set(uuid, {username: "Anonymous", color: "#1906cc"});
            this.#UpdateDatabase(uuid);
        };
    }

    /**
     * @summary Removes a user from online users hash-map.
     * @param {string} uuid user-exclusive identificator.
     * @since 0.0.0
     * @access public
     */
    disconnectUser (uuid)
    {
        this.onlineUsers.delete(uuid);
    }

    /**
     * @summary Edits the data at the all time users hash-map for a certain user.
     * @param {string} field the field to edit in the hash-map.
     * @param {any} change the new key's value in the hash-map.
     * @param {string} uuid user-exclusive identificator.
     * @since 0.0.0
     * @access public
     */
    edit (field, change, uuid)
    {
        // field 
        let value = this.onlineUsers.get(uuid);
        if (field == 'username') value.username = change;

        this.onlineUsers.set(uuid, value);
        this.allTimeUsers.set(uuid, value);

        this.#UpdateDatabase(uuid);
    }

    updateOnlineUsers(data)
    {
        
    };

    /**
     * @summary It updates the user database when called (user-specific).
     * @param {string} uuid user-exclusive identificator.
     * @since 0.0.0
     * @access private
     */
    #UpdateDatabase = (uuid) =>
    {
        fs.readFile (usersfile, 'utf8', (err, json_data) =>
        {
            if (err) throw err;
            else {
                let user_data = {};
                user_data[uuid] = this.allTimeUsers.get(uuid);
                let jsonfile = JSON.parse(json_data);
                Object.assign (jsonfile, user_data);
                fs.writeFile (usersfile, JSON.stringify(jsonfile, null, 4), (err) =>
                {
                    if (err) throw err;
                });
            }
        });
    };

    userExists()
    {
        
    };



}

class Users 
{

}



module.exports = Manager;