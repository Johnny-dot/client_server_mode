const MAX_PLAYER = 2;//匹配人数

let g_Room = new class CRoom {
    constructor() {
        // this.m_Room = {};
        this.matchList = [];
        this.doMatch();
    }

    joinMatch(uid) {//加入匹配
        this.matchList.push(uid);
    }

    cancelMatch(uid, info) {//退出匹配
        let idx = this.matchList.indexOf(uid);
        if (idx != -1) {
            this.matchList.splice(idx, 1);
        } else {
            console.log(`用户:${uid}不存在`);
        }
    }

    createRoom(list) { //创建房间
        let sUid = list[0];
        let oUid = list[1];
        let roomID = g_SE.getNewRoomID();
        // console.log(roomID, "room,28");
        let roomInfo = {
            player: {},
            selectInfo: {},
            selectTime: GAME_WAIT.ready,
            //游戏初始通知时间8s
            operationTime: 8,
            //顺序数，0-9
            orderNum: 0,
            roomID,
            /**房间状态
             * 初始状态为1
             * 一位玩家准备好为1.5
             * 全部准备完毕为2
             * 游戏状态为3
             */
            state: 1,//房间状态
        }
        roomInfo.player[sUid] = {};
        roomInfo.player[oUid] = {};
        roomInfo.selectInfo[sUid] = [];
        roomInfo.selectInfo[oUid] = [];
        g_SE.createRoom(roomInfo);
        //匹配成功
        let info = {
            key: "room",
            sub: 0,
            data: {}
        }
        for (let uid of list) {
            g_DB[uid].roomID = roomID;
            info.data.sUid = g_DB[uid].username;
            let tUid = uid ^ sUid ^ oUid;
            info.data.oUid = g_DB[tUid].username;
            g_SE.send(uid, info)
        }
    }

    doMatch() {//开启匹配
        if (this.matchList.length >= MAX_PLAYER) {
            this.createRoom(this.matchList.splice(0, 2));
        }
        setTimeout(() => {
            this.doMatch();
        }, 5000);
    }

    //用户断开连接
    doClose(uid) {
        let index = this.matchList.indexOf(uid);
        if (index != -1) {
            this.matchList.splice(index, 1);
        }
        let room = g_SE.getRoomByUid(uid);
        if (!room) {
            return;
        }
        let roomID = room.roomID;
        g_SE.deleteRoom(roomID);
    }


    onMessage(uid, tData) {
        let data = tData.data;
        let sub = tData.sub;
        if (sub == 1) {//加入匹配
            this.joinMatch(uid, data);
        } else if (sub == 2) {//取消匹配
            this.cancelMatch(uid, data);
        }
    }
}

module.exports = {
    onMessage: (uid, data) => {
        g_Room.onMessage(uid, data);
    },
    doClose: (uid) => {
        g_Room.doClose(uid);
    }
}