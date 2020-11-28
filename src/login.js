let g_Login = new class CLogin {
    constructor() { }

    getUidByAccount(account) { //有弊端
        for (let uid in g_DB) {
            if (g_DB[uid].account == account) {
                return uid;
            }
        }
        return null;
    }

    doRegister(res, data, info) {
        let uid = this.getUidByAccount(data.account);
        if (uid) {
            info.data.code = 1;//账号已存在
        } else {
            info.data.code = 0;
            this.doSave(data);
        }
        res.send(JSON.stringify(info));
    }

    doSave(data) {
        let { username, account, password } = data;
        if (!g_Global.uid) {
            g_Global.uid = 1;
        }
        let uid = g_Global.uid;
        g_Global.uid++;
        g_TempDB[uid] = {};
        g_TempDB[uid].uid = uid;
        g_TempDB[uid].roomID = -1;
        g_TempDB[uid].username = username;
        g_TempDB[uid].account = account;
        g_TempDB[uid].password = password;
    }

    doLogin(res, data, info) {
        let uid = this.getUidByAccount(data.account);
        if (!g_DB[uid]) {
            info.data.code = 2;//此用户不存在
        } else if (g_DB[uid].password != data.password) {
            info.data.code = 1;//密码错误
        } else {
            info.data.code = 0;//登录成功
            info.data.uid = uid;
            info.data.url = "ws://localhost:4592/looming";
        }
        res.send(JSON.stringify(info));
    }

    doRewritePsd(res, data, info) {
        let uid = this.getUidByAccount(data.account);
        if (!g_DB[uid]) {
            info.data.code = 1;//不存在此用户
        } else if (g_DB[uid].password != data.password) {
            info.data.code = 2;//原密码有误
        } else {
            info.data.code = 0;//密码修改成功
            g_TempDB[uid] = {};
            g_TempDB[uid].password = data.password1;
        }
        res.send(JSON.stringify(info));
    }

    onMessage(res, tData) {
        let info = {
            key: tData.key,
            sub: tData.sub,
            data: {},
        }
        let data = tData.data;
        let sub = tData.sub;
        if (sub == 1) {
            this.doRegister(res, data, info);
        } else if (sub == 2) {
            this.doLogin(res, data, info);
        } else if (sub == 3) {
            this.doRewritePsd(res, data, info);
        }
    }
}

module.exports = {
    onMessage: (res, data) => {
        g_Login.onMessage(res, data);
    }
}