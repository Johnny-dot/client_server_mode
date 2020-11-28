let g_Select = new class CSelect {
    constructor() {
        this.m_data = {};
        this.deleteList = [];
        this.run();
    }

    doSelect(uid, data) {
        let room = g_SE.getRoomByUid(uid);
        let uidList = Object.keys(room.player);
        let eUid = uid ^ uidList[0] ^ uidList[1];
        let shape = data.shape;
        let info = {
            key: "select",
            sub: 1,
            data: {
                uid,
                shape,
            }
        }
        let list = room.selectInfo[uid];
        let eList = room.selectInfo[eUid];
        if (list.length < 5) {
            if (list.indexOf(shape) == -1 && eList.indexOf(shape) == -1) {
                list.push(shape);
            } else {
                info.data.code = -1;
            }
        }
        for (let tUid in room.player) {
            g_SE.send(tUid, info);
        }
        if (list.length == 5) {
            let tData = {
                key: "select",
                sub: 2,
                data: {
                    code: 1,
                }
            }
            room.state += 0.5;
            //准备就绪
            g_SE.send(uid, tData);
        }
    }

    initSelect(uid, data) {
        let room = g_SE.getRoomByUid(uid);
        // console.log(data.code, room, this.m_data, "select,43");
        let roomID = room.roomID;
        if (this.m_data[roomID] == undefined) {
            //可能会有异步添加，导致循环出错的隐患
            this.m_data[roomID] = room;
        }
    }

    sortList(room) {
        let sortData = {};
        let sortHeroList = [];
        let pid = 0;
        for (let uid in room.selectInfo) {
            //深拷贝
            let list = room.selectInfo[uid];
            for (let index in list) {
                let shape = list[index];
                pid++;
                let priority = global.tbHero[shape].priority;
                //要注意同一局游戏不能有相同shape
                sortData[priority] = pid;
            }
        }
        //javascript会自动对对象的数字key进行排序
        for (let key in sortData) {
            sortHeroList.push(sortData[key]);
        }
        room.sortData = sortData;
        room.sortHeroList = sortHeroList;
    }

    doClose(uid) {
        let room = g_SE.getRoomByUid(uid);
        let roomID = room.roomID;
        this.deleteList.push(roomID);
    }

    doRun() {
        if (this.deleteList.length != 0) {
            for (let roomID of this.deleteList) {
                if (this.m_data[roomID]) {
                    delete this.m_data[roomID];
                }
            }
        }
        for (let roomID in this.m_data) {
            let room = this.m_data[roomID];
            if (room.state == 3) {
                delete this.m_data[roomID];
                continue;
            };
            if (room.selectTime > 0) {
                room.selectTime--;
            } else if (room.state != 2) {
                for (let uid in room.selectInfo) {
                    let list = room.selectInfo[uid];
                    if (list.length != 5) {
                        let num = 5 - list.length;
                        while (num--) {
                            room.selectInfo[uid].push(1001);
                        }
                    }
                }

            }
            if (room.state == 2) {
                // console.log("select,99");
                room.state = 3;
                this.sortList(room);
                //双方都准备就绪
                let tData = {
                    key: "select",
                    sub: 2,
                    data: {
                        code: 2,
                    }
                }
                for (let tUid in room.player) {
                    g_SE.send(tUid, tData);
                }
            }
        }
    }

    run() {
        setTimeout(() => {
            this.doRun();
            this.run();
        }, 1000);
    }

    onMessage(uid, tData) {
        let data = tData.data;
        let sub = tData.sub;
        if (sub == 1) {
            this.doSelect(uid, data);
        } else if (sub == 2) {
            this.initSelect(uid, data);
        }
    }
}

module.exports = {
    onMessage: (uid, data) => {
        g_Select.onMessage(uid, data);
    }
}