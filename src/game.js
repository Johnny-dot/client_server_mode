let g_Game = new class CGame {
    constructor() {
        this.m_Data = {};
        this.signInfo = {};
        this.deleteList = [];
        this.run();
    }

    doAttack(uid, data) {
        // console.log("攻击一次");
        let room = g_SE.getRoomByUid(uid);
        let uidList = Object.keys(room.player);
        let eUid = uidList[0] ^ uidList[1] ^ uid;
        // console.log(room.player[uid].myHeros, room.player[eUid].myHeros, "game,14");
        room.operationTime = 3;
        let { targetPid, enemyPid, attackType } = data;
        //计算消耗
        let attProp = room.player[uid].myHeros[targetPid];
        if (!attProp) {
            console.log("攻击失败！");
            return;
        }
        // console.log(attProp, "111");
        attProp.mp -= attProp.consumption;
        // console.log(attProp, "222");
        let defProp = room.player[eUid].myHeros[enemyPid];
        // console.log(defProp, "333");
        defProp.hp -= attProp.attack - defProp.defence;
        // console.log(defProp, "444");
        // console.log(targetPid, enemyPid, room.player[uid], room.player[eUid], "game,27");
        let info = {
            key: "game",
            sub: 3,
            data: {
                targetPid,
                enemyPid,
                attackType,
            }
        }
        g_SE.send(eUid, info);
    }

    syncProp(uid, data) {
        let pid = data.pid;
        let room = g_SE.getRoomByUid(uid);
        let info;
        for (let tUid in room.player) {
            let prop = room.player[tUid].myHeros[pid];
            if (!prop) {
                continue;
            }
            info = {
                key: "game",
                sub: 5,
                data: {
                    pid,
                    prop,
                }
            }
        }
        g_SE.send(uid, info);
    }

    checkHp() {
        for (let roomID in this.m_Data) {
            let room = this.m_Data[roomID];
            let sortHeroList = room.sortHeroList;
            let uidList = Object.keys(room.player);
            for (let uid in room.player) {
                let eUid = uidList[0] ^ uidList[1] ^ uid;
                if (!room.player[uid].myHeros) {
                    console.log(`玩家${uid}的英雄列表为空！`);
                    return;
                }
                let livingList = Object.keys(room.player[uid].myHeros);
                // console.log(livingList, "game,69");
                if (livingList.length == 0) {
                    let data = {
                        key: "game",
                        sub: 6,
                        data: {}
                    }
                    data.data.code = 1;
                    g_SE.send(uid, data);
                    data.data.code = 2;
                    g_SE.send(eUid, data);
                    room.state = 1;
                    this.doClose(uid);
                    this.doClose(eUid);
                }
                let myHeros = room.player[uid].myHeros;
                // console.log(uid, myHeros, "game,82");
                for (let pid in myHeros) {
                    let prop = myHeros[pid];
                    // console.log(pid, prop.hp, "game,88");
                    if (prop.hp <= 10) {
                        let index = sortHeroList.indexOf(pid);
                        room.sortHeroList.splice(index, 1);
                        if (room.player[uid].myHeros[pid]) {
                            delete room.player[uid].myHeros[pid];
                        }
                        let info = {
                            key: "game",
                            sub: 4,
                            data: {
                                pid,
                            },
                        }
                        //发送pid死亡信息
                        for (let uid in room.player) {
                            g_SE.send(uid, info);
                        }
                    }
                }
            }
        }
    }

    onSign(uid, data) {
        let roomID = g_SE.getRoomByUid(uid).roomID;
        this.signInfo[roomID] = this.signInfo[roomID] || {};
        this.signInfo[roomID].signList = this.signInfo[roomID].signList || [];
        this.signInfo[roomID].signList.push(uid);
        // console.log(this.signInfo, "game,33");
        if (this.signInfo[roomID].signList.length == MAX_PLAYER) {
            let room = g_SE.getRoom(roomID);
            this.m_Data[roomID] = room;
            let pid = 0;
            for (let tUid in room.selectInfo) {
                let list = [].concat(room.selectInfo[uid]);
                for (let shape of list) {
                    pid++;
                    room.player[tUid].myHeros = room.player[tUid].myHeros || {};
                    let prop = JSON.parse(JSON.stringify(global.tbHero[shape].prop));
                    room.player[tUid].myHeros[pid] = prop;
                }
            }
            let info = {
                key: "game",
                sub: 1,
                data: {
                    code: 1,
                    selectInfo: room.selectInfo,
                }
            }
            for (let uid of this.signInfo[roomID].signList) {
                // console.log(info, "game,50");
                g_SE.send(uid, info);
            }
        }
    }

    nextRound(room) {
        room.operationTime = GAME_WAIT.operation;
        // console.log(room.operationTime, "game,59");
        // let orderNum = room.orderNum;
        let sortHeroList = room.sortHeroList;
        if (room.orderNum > sortHeroList.length - 1) {
            // console.log(orderNum, "game,159");
            room.orderNum = 0;
        }
        let targetPid = sortHeroList[room.orderNum];
        // console.log(sortHeroList, orderNum, this.targetPid, "game,147");
        let tData = {
            key: "game",
            sub: 2,
            data: {
                pid: targetPid,
            }
        }
        for (let uid in room.player) {
            g_SE.send(uid, tData);
        }
        room.orderNum += 1;
    }

    // doRandAttack(room) {}

    doClose(uid) {
        let room = g_SE.getRoomByUid(uid);
        let roomID = room.roomID;
        this.deleteList.push(roomID);
    }

    doRun() {
        if (this.deleteList.length != 0) {
            for (let roomID of this.deleteList) {
                for (let tRoomID of this.m_data) {
                    if (roomID == tRoomID) {
                        delete this.m_data[roomID];
                    }
                }

                if (this.signInfo[roomID]) {
                    delete this.signInfo[roomID];
                }
            }
        }
        this.checkHp();
        for (let roomID in this.m_Data) {
            let room = this.m_Data[roomID];
            if (room.state != 3) continue;
            if (room.operationTime > 0) {
                room.operationTime--;
                // console.log(room.operationTime, "game,85");
            } else {
                this.nextRound(room);
                // this.doRandAttack(room);
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
        let sub = tData.sub;
        let data = tData.data;
        if (sub == 1) {
            this.onSign(uid, data);
        } else if (sub == 2) {
            this.doAttack(uid, data);
        } else if (sub == 3) {
            this.syncProp(uid, data);
        }
    };
}

module.exports = {
    onMessage: (uid, data) => {
        g_Game.onMessage(uid, data);
    }
}