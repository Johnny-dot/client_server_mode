/**数据库管理模块
 *仅保存用户的(uid, account, password, username)
 * 修改数据:直接修改global.g_TempDB
 * 读取数据:直接读取global.g_DB
 * 数据库名:databaselooming
 * 数据表:loominguserinfo
 */
let mysql = require("mysql");

global.g_DB = {};
global.g_TempDB = {};

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    useConnectionPooling: true,
});

console.log("开始连接数据库！");
db.connect((err) => {
    if (err) {
        console.log("数据库连接失败！", err);
        return;
    }
    let sql = "show databases like 'dataBaseLooming';";
    console.log("开始检测数据库是否存在！");
    db.query(sql, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        if (data.length == 0) {
            console.log("数据库不存在,重新创建！");
            createDB();
        } else {
            console.log("数据库存在，使用已有数据库！");
            useDataBase();
        }
    });
});

function createDB() {
    let sql = `CREATE DATABASE dataBaseLooming;`;
    console.log("开始创建数据库！");
    db.query(sql, (err, data) => {
        if (err) {
            console.log("数据库创建失败！", err);
            return;
        }
        console.log("数据库创建成功！")
        useDataBase();
    });
}

function useDataBase() {
    console.log("开始查询数据表是否存在！");
    db.changeUser(
        {
            database: "dataBaseLooming"
        },
        (err, data) => {
            if (err) {
                console.log("数据库连接失败！", err);
                return;
            }
            console.log("连接数据库成功！");
            loadData();
        }
    );
}

function loadData() {
    console.log("开始查询数据表是否存在！");
    let sql = "show tables like 'loomingUserInfo';";
    db.query(sql, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        if (data.length == 0) {
            let subSql = "CREATE TABLE loomingUserInfo(uid INT NOT NULL, roomID INT, username VARCHAR(20) NOT NULL, account INT NOT NULL, password VARCHAR(20) NOT NULL, PRIMARY KEY (uid));";
            console.log("数据表不存在，开始重新创建数据表！");
            db.query(subSql, (err, data) => {
                if (err) {
                    console.log("数据表创建失败", err);
                    return;
                }
                console.log("数据表创建成功")
            });
        } else {
            console.log("数据表存在，开始导入数据库！");
            let subSql = "SELECT * FROM loomingUserInfo;";
            db.query(subSql, (err, data) => {
                if (err) {
                    console.log("数据导入失败");
                    return;
                }
                console.log("数据导入成功！");
                for (let key in data) {
                    let info = data[key];
                    let uid = data[key].uid;
                    global.g_DB[uid] = {
                        uid: info.uid,
                        roomID: info.roomID,
                        username: info.username,
                        account: info.account,
                        password: info.password,
                    };
                }
                console.log("已有数据:", g_DB);
            });
        }
    });
}

function saveData() {
    for (let uid in g_TempDB) {
        let info = g_TempDB[uid];
        if (g_DB[uid]) {
            if (info == null) {
                let delSql = `DELETE FROM loomingUserInfo WHERE uid = ${uid};`;
                delete global.g_DB[uid];
                db.query(delSql, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
            } else {
                let updataSql = `UPDATE loomingUserInfo SET `;
                for (let key in info) {
                    if (global.g_DB[uid][key] != info[key]) {
                        global.g_DB[uid][key] = info[key];
                        updataSql += `${key} = '${info[key]}' `;
                    }
                }
                updataSql += `WHERE uid = '${uid}';`;
                db.query(updataSql, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                })
            }
        } else { //增加
            console.log(info);
            let addSql = `INSERT INTO loomingUserInfo (uid, roomID, username, account, password) VALUES ('${info.uid}','${info.roomID}','${info.username}','${info.account}','${info.password}');`;
            g_DB[uid] = info;
            db.query(addSql, (err) => {
                if (err) {
                    console.log(err);
                    return;
                }
            });
            // console.log(g_DB);
        }
    }
    global.g_TempDB = {};
}

function closeDB() {
    console.log("关闭数据库");
    db.destroy();
}

function run() {
    if (Object.keys(g_TempDB).length > 0) {
        saveData();
    }
    setTimeout(() => {
        run();
    }, 1000);
}

run();

module.exports = {
    closeDB,
}