/**
 * 宏定义常亮模块
 */
global.MAX_PLAYER = 2;//匹配人数
global.GAME_STATE = {
    ready: 1,    // 准备阶段
    playing: 2,  // 游戏中
}
global.GAME_WAIT = {
    ready: 80,  // 准备阶段
    operation: 25,  // 操作等待时间
}

global.HERO_NUM = 5;    // 对战英雄数量
global.HERO_LIST = [    // 所有英雄列表
    1001, 1002, 1003, 1004, 1005,
    1006, 1007, 1008, 1009, 1010,
    1011, 1012,
];