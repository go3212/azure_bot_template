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

class Manager
{
    constructor(location)
    {
        usersfile = location;
        this.onlineUsers = {};
        this.allTimeUsers = new Map();

        // Gather all time users
        this.gatherAllTimeUsers();

        // Gather online users
        
        
    };

    // Mirar de mejorar.
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
                let userdata = {nickname: value.username, color: value.color}
                this.allTimeUsers.set(key, userdata);
            }
        }, () => {
            console.log(err);
        });
    };

    handleUser (uuid)
    {
        // Si existe el usuario -> meterlo a online
        if (this.allTimeUsers.get(uuid) != undefined)
        {
            this.onlineUsers[uuid] = true;
        }  
        else
        {
            this.allTimeUsers.set(uuid, {username: "Anonymous", color: "#1906cc"});
            this.#insertUserToDatabase(uuid);
        };
    }

    updateOnlineUsers(data)
    {
        
    };

    #insertUserToDatabase = (uuid) =>
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