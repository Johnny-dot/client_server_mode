global.g_Global = {};

let fs = require("fs");

fs.readFile("./data/global.json", (err, res) => {
    if (err) {
        console.log(err);
        return;
    }
    if (res.toString()) {
        global.g_Global = JSON.parse(res.toString());
    } else {
        console.log("JSON文件g_Global数据为空！");
    }
});

fs.readFile("./data/table/tbHero.json", (err, res) => {
    if (err) {
        console.log(err);
        return;
    }
    if (res.toString()) {
        global.tbHero = JSON.parse(res.toString());
    } else {
        console.log("JSON文件tbHero数据为空！");
    }
})

function run() {
    setTimeout(() => {
        fs.writeFile("./data/global.json", JSON.stringify(g_Global), "utf8", () => { });
        // fs.writeFile("./data/table/tbHero.json", JSON.stringify(tbHero), "utf8", () => { });
        run();
    }, 5000);
}

run();