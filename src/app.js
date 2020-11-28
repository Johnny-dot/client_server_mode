let express = require("express");
let expressWs = require("express-ws");

require("./db");
require("./global");
require("./define");

let g_Net = {
    room: require("./room"),
    login: require("./login"),
    select: require("./select"),
    game: require("./game"),
}

class CSE {
    constructor() {
        this.m_Room = {};
        this.m_Client = {};
        this.run();
    }

    saveWs(ws, tData) {
        let info = {
            key: tData.key,
            sub: tData.sub,
            data: {}
        }
        //短连接登录成功后，服务器向客户端分配uid。客户端保存uid，在第一次进行长连接时将uid以main协议发送到服务端，
        //服务端将此长连接ws用对象保存this.m_Client = {uid:ws},方便往后通过uid给某客户端发信息

        if (tData.key == "main") {
            ws.uid = tData.data.uid;
            if (this.m_Client[ws.uid]) {
                info.data.code = 1;//该用户已登录
                info.data.uid = ws.uid;
                ws.send(JSON.stringify(info));
            } else {//如果m_Client中没有，第一次登录
                info.data.code = 0;
                this.m_Client[ws.uid] = ws;
                ws.send(JSON.stringify(info));
            }
        }
    }

    send(uid, info) {
        let ws = this.m_Client[uid];
        if (ws) {
            ws.send(JSON.stringify(info));
        } else {
            console.log("用户:" + uid + "不存在或者已断开连接！");
        }
    }

    doClose(ws) {
        let uid = ws.uid;
        //ws断开连接后，删除原来对象中的ws，防止客户端再次使用main协议时，返回该用户已登录
        if (this.m_Client[uid]) {
            console.log(`用户:${uid}断开连接！`);
            delete this.m_Client[uid];
        } else {
            console.log("此客户端不存在");
        }
        for (let key in g_Net) {
            let mod = g_Net[key];
            mod && mod.doClose && mod.doClose(uid);
        }
    }

    run() {
        this.app = express();
        expressWs(this.app);
        this.app.all('*', function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            next();
        });

        //短连接
        this.app.get("/login", (req, res) => {
            let data = JSON.parse(req.query.data);
            let mod = g_Net[data.key];
            if (mod && mod.onMessage) {
                mod.onMessage(res, data);
            }
        });

        //长连接
        this.app.ws("/looming", (ws, req) => {
            ws.on("message", (data) => {
                this.onMessage(ws, JSON.parse(data));
            })
            ws.on("close", (data) => {
                this.doClose(ws);
            })
        })
        this.app.listen(4592);
    }


    onMessage(ws, data) {
        this.saveWs(ws, data);
        let mod = g_Net[data.key];
        if (mod && mod.onMessage) {
            mod.onMessage(ws.uid, data);
        }
    }

    getNewRoomID() {
        if (!g_Global.roomID) {
            g_Global.roomID = 1;
        }
        let roomID = g_Global.roomID;
        g_Global.roomID++;
        return roomID;
    }

    createRoom(roomInfo) {
        this.m_Room[roomInfo.roomID] = roomInfo;
    }

    getRoom(roomID) {
        return this.m_Room[roomID];
    }

    deleteRoom(roomID) {
        if (this.m_Room[roomID]) {
            delete this.m_Room[roomID];
        }
    }

    getRoomByUid(uid) {
        let roomID = g_DB[uid].roomID;
        // console.log(this.m_Room, g_DB, "app,116");
        if (roomID == -1) {
            console.log(uid + "玩家还未加入房间");
        } else {
            return this.m_Room[roomID];
        }
    }
}

module.exports = () => {
    global.g_SE = new CSE();
    console.log("server start!");
}