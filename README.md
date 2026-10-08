# AI Survivor

原生 Canvas 写的俯视角生存射击，没有游戏引擎，也没有第三方库。

活过普通怪和精英，45 秒时 Boss 出现。击倒 Boss 获胜，血量归零失败。

## 运行

不要直接双击 `index.html`，浏览器会拦截本地 ES Module。

```bash
npm start
```

或：

```bash
node server.mjs
```

然后打开 http://127.0.0.1:8080

已安装 Python 时也可以：

```bash
python -m http.server 8080
```

测试：

```bash
npm test
```

## 操作

- WASD / 方向键：移动
- 鼠标：瞄准
- 按住左键：连续射击，点一下也会打出一发
- 升级时三选一：弹道、射速、伤害
- ESC：暂停或继续
- 暂停、结算时按 R：重新开始

## 难度

左下角的威胁会跟着局面变化。杀得快、等级高，怪更密，精英更多。血量低或刚被打到，刷怪会慢下来。Boss 固定在 45 秒出现，不提前。

## 代码

- `js/core`：主循环和输入
- `js/entities`：玩家、敌人、子弹、经验
- `js/director`：动态难度
- `js/effects`：粒子和震屏
- `js/ui`：界面
