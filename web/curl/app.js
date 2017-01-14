var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GameCurling;
(function (GameCurling) {
    var SETTINGS = (function () {
        function SETTINGS() {
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
        }
        return SETTINGS;
    }());
    ;
    var ANIMATION_WAITER = (function () {
        function ANIMATION_WAITER() {
            this.refs = 0;
        }
        ANIMATION_WAITER.prototype.addRef = function (cb, ctx) {
            this.refs++;
            if (cb !== null && typeof cb == 'function')
                cb.apply(ctx);
        };
        ANIMATION_WAITER.prototype.releaseRef = function (cb, ctx) {
            this.refs--;
            if (this.refs == 0 && cb !== null && typeof cb == 'function')
                cb.apply(ctx);
        };
        return ANIMATION_WAITER;
    }());
    ;
    ;
    ;
    ;
    var TitleScreenState = (function (_super) {
        __extends(TitleScreenState, _super);
        function TitleScreenState() {
            _super.call(this);
        }
        TitleScreenState.prototype.preload = function () {
            this.game.load.image("title", "curl/res/title.png");
            this.game.load.audio("click", "curl/res/sfx/battery.mp3");
        };
        TitleScreenState.prototype.create = function () {
            this.game.add.sprite(0, 0, "title");
            this.input.onTap.addOnce(this.titleClicked, this);
            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);
            this.sfx = this.game.add.audio("click");
        };
        TitleScreenState.prototype.titleClicked = function () {
            this.sfx.play();
            this.game.state.start("GameRunningState");
        };
        return TitleScreenState;
    }(Phaser.State));
    GameCurling.TitleScreenState = TitleScreenState;
    ;
    var EndGameScreenState = (function (_super) {
        __extends(EndGameScreenState, _super);
        function EndGameScreenState() {
            _super.call(this);
        }
        EndGameScreenState.prototype.init = function (pts) {
            this.points = pts;
        };
        EndGameScreenState.prototype.preload = function () {
            this.game.load.image("bg", "curl/res/empty.png");
            this.game.load.audio("click", "curl/res/sfx/battery.mp3");
            this.game.load.text("invite", "curl/res/invite.txt");
        };
        EndGameScreenState.prototype.create = function () {
            this.game.add.sprite(0, 0, "bg");
            this.sfx = this.game.add.audio("click");
            var style = { font: "bold 65px Courier", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
            this.textGameOver = this.game.add.text(0, 0, "ВОТ И ВСЕ", style);
            this.textGameOver.setTextBounds(0, 150, this.game.width, 100);
            style.font = "bold 30px Courier";
            this.textRecord = this.game.add.text(0, 0, "Камней сломалось: " + this.points, style);
            this.textRecord.setTextBounds(0, 250, this.game.width, 50);
            var styleoverall = { font: "20px Courier", fill: "#fff", align: "left", wordWrap: true, wordWrapWidth: this.game.width - 30 };
            var txt = this.game.cache.getText('invite');
            this.textRecord = this.game.add.text(30, 350, txt, styleoverall);
            this.input.onTap.addOnce(this.titleClicked, this);
            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);
        };
        EndGameScreenState.prototype.titleClicked = function () {
            this.sfx.play();
            this.game.state.start("TitleScreenState");
        };
        return EndGameScreenState;
    }(Phaser.State));
    GameCurling.EndGameScreenState = EndGameScreenState;
    ;
    var SimpleGame = (function (_super) {
        __extends(SimpleGame, _super);
        function SimpleGame() {
            _super.call(this);
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
            this.TILE_ROWS = 11;
            this.TILE_COLUMNS = 6;
            this.TILE_SIZE = 64;
            this.TILE_SPACE = 5;
            this.OFFSET_FIELD = 91;
            this.maxRow = 0;
            this.lockInput = false;
            this.aw = new ANIMATION_WAITER;
        }
        SimpleGame.prototype.HandleTouchMouse = function (pointer) {
            if (this.lockInput) {
                return;
            }
            if (this.bottomRect.contains(pointer.x, pointer.y)) {
                this.DropBlocks();
            }
            if (this.topLeftRect.contains(pointer.x, pointer.y)) {
                this.ShiftRowLeft();
            }
            if (this.topRighRect.contains(pointer.x, pointer.y)) {
                this.ShiftRowRight();
            }
        };
        SimpleGame.prototype.ShiftRowLeft = function () {
            var _this = this;
            this.sfxWall.play();
            var shifted = this.row.shift();
            this.row.push(shifted);
            this.row.forEach(function (spr, idx) {
                _this.TweenSpritePosition(spr, _this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.ShiftRowRight = function () {
            var _this = this;
            this.sfxWall.play();
            var popped = this.row.pop();
            this.row.unshift(popped);
            this.row.forEach(function (spr, idx) {
                _this.TweenSpritePosition(spr, _this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.DropBlocks = function () {
            var _this = this;
            this.sfxBattery.play();
            this.row.forEach(function (spr, idx) {
                _this.field[idx] ? _this.field[idx] : _this.field[idx] = [];
                var fcy = _this.field[idx].filter(function (num) { return num.color >= 0; }).length;
                _this.field[idx][fcy] = { color: _this.ParseColorFromSprite(spr), key: _this.sprtId };
                spr.anchor.set(0, 1);
                _this.TweenSpritePosition(spr, spr.position.x, _this.SCREEN_HEIGHT - _this.TILE_SPACE - (fcy * (_this.TILE_SPACE + _this.TILE_SIZE)), null, _this.RemoveEmptySpaces);
                _this.fieldSprites.push({ key: _this.sprtId++, sprt: spr });
            }, this);
            this.row = [];
        };
        SimpleGame.prototype.RemoveEmptySpaces = function () {
            var _this = this;
            this.field.forEach(function (line, fldidx) {
                line = line.filter(function (val) { return val.color >= 0; });
                _this.field[fldidx] = line;
                line.forEach(function (val, idx) {
                    var spr = _this.fieldSprites.filter(function (s) { return s.key == val.key; }, _this)[0].sprt;
                    if (spr.position.y != _this.SCREEN_HEIGHT - _this.TILE_SPACE - (idx * (_this.TILE_SPACE + _this.TILE_SIZE))) {
                        _this.TweenSpritePosition(spr, spr.position.x, _this.SCREEN_HEIGHT - _this.TILE_SPACE - (idx * (_this.TILE_SPACE + _this.TILE_SIZE)), null, _this.CheckField);
                    }
                }, _this);
            }, this);
            this.TweenSpritePosition(this.dummySprite, this.dummySprite.position.x, this.dummySprite.position.y, null, this.CheckField);
        };
        SimpleGame.prototype.CheckField = function () {
            var localPoints = 0;
            for (var x = 0; x < this.TILE_COLUMNS; x++) {
                for (var y = 0; y < this.TILE_ROWS; y++) {
                    if (!this.field[x] || !this.field[x][y] || this.field[x][y].color < 0)
                        continue;
                    var stack = [];
                    var stackColor = -1;
                    var fc = { x: x, y: y };
                    stack.push(fc);
                    var colorspace = [];
                    while (stack.length) {
                        var ccc = stack.pop();
                        if (!ccc)
                            continue;
                        if (stackColor < 0)
                            stackColor = this.field[ccc.x][ccc.y].color;
                        colorspace.push(ccc);
                        if ((ccc.y < this.TILE_ROWS - 1) && this.CheckColor(ccc.x, ccc.y + 1, stackColor)) {
                            var nc = { x: ccc.x, y: ccc.y + 1 };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }
                        if (ccc.y > 0 && this.CheckColor(ccc.x, ccc.y - 1, stackColor)) {
                            var nc = { x: ccc.x, y: ccc.y - 1 };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }
                        if (ccc.x > 0 && this.CheckColor(ccc.x - 1, ccc.y, stackColor)) {
                            var nc = { x: ccc.x - 1, y: ccc.y };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }
                        if ((ccc.x < this.TILE_COLUMNS - 1) && this.CheckColor(ccc.x + 1, ccc.y, stackColor)) {
                            var nc = { x: ccc.x + 1, y: ccc.y };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }
                    }
                    if (colorspace.length < 3)
                        continue;
                    if (colorspace.length >= 6) {
                        var arr = this.CreateArray(colorspace.length - 5, 2);
                        this.bonuses = this.bonuses.concat(arr);
                    }
                    else if (colorspace.length > 3) {
                        this.bonuses.push(colorspace.length - 4);
                    }
                    var pt = this.RemoveBlocks(colorspace);
                    this.sfxPistol.play();
                    localPoints += pt;
                }
            }
            if (localPoints == 0) {
                this.FinishUpdate();
            }
            else {
                this.points += localPoints;
                this.textValue.text = this.points.toString();
            }
        };
        SimpleGame.prototype.RemoveBlocks = function (cs) {
            var _this = this;
            var _loop_1 = function() {
                var actionBlocks = [];
                cs.forEach(function (ccc, idx) {
                    var fval = _this.field[ccc.x][ccc.y];
                    if (fval && fval.color >= 0) {
                        _this.GetActionBlocks(ccc, cs, actionBlocks);
                        fval.color = -1;
                        var spr = _this.GetSprite(fval.key);
                        _this.TweenSpriteAlpha(spr, null, _this.RemoveEmptySpaces);
                        spr.destroy();
                    }
                }, this_1);
                if (actionBlocks.length == 0)
                    return "break";
                cs = cs.concat(actionBlocks);
            };
            var this_1 = this;
            while (1) {
                var state_1 = _loop_1();
                if (state_1 === "break") break;
            }
            return cs.length;
        };
        SimpleGame.prototype.TweenSpritePosition = function (spr, newX, newY, onStartCB, onCompleteCB) {
            var emptyAnimation = spr.position.x == newX && spr.position.y == newY;
            var tw = this.game.add.tween(spr).to({ x: newX, y: newY }, 100, Phaser.Easing.Linear.None);
            this.TweenSprite(tw, onStartCB, onCompleteCB);
        };
        SimpleGame.prototype.TweenSpriteAlpha = function (spr, onStartCB, onCompleteCB) {
            var tw = this.game.add.tween(spr).to({ alpha: 0 }, 100, Phaser.Easing.Linear.None);
            this.TweenSprite(tw, onStartCB, onCompleteCB);
        };
        SimpleGame.prototype.TweenSprite = function (tw, onStartCB, onCompleteCB) {
            var _this = this;
            if (onStartCB === null || typeof onStartCB != 'function')
                onStartCB = function () { _this.lockInput = true; };
            tw.onStart.addOnce(function () { _this.aw.addRef(onStartCB, _this); }, this);
            if (onCompleteCB === null || typeof onCompleteCB != 'function')
                onCompleteCB = function () { _this.lockInput = false; };
            tw.onComplete.addOnce(function () { _this.aw.releaseRef(onCompleteCB, _this); }, this);
            tw.start();
        };
        SimpleGame.prototype.GetSprite = function (key, splice) {
            if (splice === void 0) { splice = false; }
            var idx = -1;
            var spr = this.fieldSprites.filter(function (val, i) {
                if (key == val.key) {
                    idx = i;
                    return true;
                }
                return false;
            }, this)[0].sprt;
            if (splice)
                this.fieldSprites.splice(idx, 1);
            return spr;
        };
        SimpleGame.prototype.FinishUpdate = function () {
            for (var c = 0; c < this.TILE_COLUMNS; c++) {
                this.maxRow = Math.max(this.field[c].length, this.maxRow);
            }
            this.lockInput = false;
            this.spawned = false;
        };
        SimpleGame.prototype.ShuffleArray = function (a) {
            for (var i = a.length; i; i--) {
                var j = Math.floor(Math.random() * i);
                _a = [a[j], a[i - 1]], a[i - 1] = _a[0], a[j] = _a[1];
            }
            var _a;
        };
        SimpleGame.prototype.GenerateTopBlocks = function () {
            var _this = this;
            this.row = [];
            for (var i = 0; i < this.bonuses.length && i < this.TILE_COLUMNS; i++) {
                this.row.push(this.game.add.sprite(0, 0, "s" + this.bonuses[i]));
            }
            for (var s = this.bonuses.length; s < this.TILE_COLUMNS; s++) {
                this.row.push(this.game.add.sprite(0, 0, "b" + this.game.rnd.between(0, this.TILE_COLORS - 1)));
            }
            this.ShuffleArray(this.row);
            this.row.forEach(function (spr, idx) {
                spr.position.set(_this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), -(_this.TILE_SPACE + _this.TILE_SIZE));
                _this.TweenSpritePosition(spr, spr.position.x, _this.TILE_SPACE);
            }, this);
            this.bonuses = [];
        };
        SimpleGame.prototype.ParseColorFromSprite = function (spr) {
            var offset = 0;
            if (spr.key[0] == 's') {
                offset = this.TILE_COLORS;
            }
            return parseInt(spr.key[1]) + offset;
        };
        SimpleGame.prototype.CheckColor = function (x, y, c) {
            if (!this.field[x][y])
                return false;
            return (this.field[x][y].color == c || this.field[x][y].color >= this.TILE_COLORS);
        };
        SimpleGame.prototype.CreateArray = function (len, val) {
            var arr = [];
            while (len--)
                arr.push(val);
            return arr;
        };
        SimpleGame.prototype.GetActionBlocks = function (c, cs, ab) {
            var fval = this.field[c.x][c.y];
            if (fval.color < this.TILE_COLORS)
                return;
            switch (fval.color) {
                case 6: {
                    return;
                }
                case 7: {
                    {
                        var nc = { x: c.x, y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nc, cs) && this.FilterFieldCoord(nc, ab))
                            ab.push(nc);
                    }
                    {
                        var nec = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nec, cs) && this.FilterFieldCoord(nec, ab))
                            ab.push(nec);
                    }
                    {
                        var ec = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: c.y };
                        if (this.FilterFieldCoord(ec, cs) && this.FilterFieldCoord(ec, ab))
                            ab.push(ec);
                    }
                    {
                        var sec = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(sec, cs) && this.FilterFieldCoord(sec, ab))
                            ab.push(sec);
                    }
                    {
                        var sc = { x: c.x, y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(sc, cs) && this.FilterFieldCoord(sc, ab))
                            ab.push(sc);
                    }
                    {
                        var swc = { x: Math.max(0, c.x - 1), y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(swc, cs) && this.FilterFieldCoord(swc, ab))
                            ab.push(swc);
                    }
                    {
                        var wc = { x: Math.max(0, c.x - 1), y: c.y };
                        if (this.FilterFieldCoord(wc, cs) && this.FilterFieldCoord(wc, ab))
                            ab.push(wc);
                    }
                    {
                        var nwc = { x: Math.max(0, c.x - 1), y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nwc, cs) && this.FilterFieldCoord(nwc, ab))
                            ab.push(nwc);
                    }
                    break;
                }
                case 8: {
                    for (var i = 0; i < this.TILE_COLUMNS; i++) {
                        var newc = { x: i, y: c.y };
                        if (this.FilterFieldCoord(newc, cs) && this.FilterFieldCoord(newc, ab))
                            ab.push(newc);
                    }
                    break;
                }
            }
        };
        SimpleGame.prototype.FilterFieldCoord = function (c, arr) {
            return (arr.filter(function (csc, idx) { return csc.x == c.x && csc.y == c.y; }, this).length == 0);
        };
        SimpleGame.prototype.preload = function () {
            this.game.load.image('b0', 'curl/res/square_green.png');
            this.game.load.image('b1', 'curl/res/square_blue.png');
            this.game.load.image('b2', 'curl/res/square_red.png');
            this.game.load.image('b3', 'curl/res/square_stone.png');
            this.game.load.image('b4', 'curl/res/square_wood.png');
            this.game.load.image('b5', 'curl/res/square_yellow.png');
            this.TILE_COLORS = 6;
            this.game.load.image('s0', 'curl/res/square_any.png');
            this.game.load.image('s1', 'curl/res/bomb.png');
            this.game.load.image('s2', 'curl/res/line.png');
            this.game.load.image('field', 'curl/res/cfield.png');
            this.game.load.audio("sfx_battery", "curl/res/sfx/battery.mp3");
            this.game.load.audio("sfx_numkey", "curl/res/sfx/numkey.mp3");
            this.game.load.audio("sfx_wall", "curl/res/sfx/wall.mp3");
            this.game.load.audio("sfx_cells", "curl/res/sfx/need_cells.mp3");
            this.game.load.audio("sfx_pistol", "curl/res/sfx/pistol.mp3");
        };
        SimpleGame.prototype.create = function () {
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
            this.TILE_ROWS = 11;
            this.TILE_COLUMNS = 6;
            this.TILE_SIZE = 64;
            this.TILE_SPACE = 5;
            this.OFFSET_FIELD = 91;
            this.game.add.sprite(0, 0, 'field');
            this.spawned = false;
            this.sprtId = 1;
            this.points = 0;
            this.field = [];
            this.fieldSprites = [];
            this.bonuses = [];
            this.cursors = this.game.input.keyboard.createCursorKeys();
            this.cursors.down.onDown.add(SimpleGame.prototype.DropBlocks, this);
            this.cursors.left.onDown.add(SimpleGame.prototype.ShiftRowLeft, this);
            this.cursors.right.onDown.add(SimpleGame.prototype.ShiftRowRight, this);
            this.topLeftRect = new Phaser.Rectangle(0, 0, this.game.width / 2, this.game.height / 2);
            this.topRighRect = new Phaser.Rectangle(this.game.width / 2 + 1, 0, this.game.width, this.game.height / 2);
            this.bottomRect = new Phaser.Rectangle(0, this.game.height / 2 + 1, this.game.width, this.game.height);
            this.game.input.onDown.add(SimpleGame.prototype.HandleTouchMouse, this);
            this.maxRow = 0;
            var style = { font: "bold 65px Courier", fill: "#ff0000", align: "right" };
            this.textValue = this.game.add.text(0, 0, "0", style);
            this.dummySprite = this.game.add.sprite(-1000, -1000, "b" + this.game.rnd.between(0, 5));
            this.sfxBattery = this.game.add.audio("sfx_battery");
            this.sfxNumKey = this.game.add.audio("sfx_numkey");
            this.sfxWall = this.game.add.audio("sfx_wall");
            this.sfxCells = this.game.add.audio("sfx_cells");
            this.sfxPistol = this.game.add.audio("sfx_pistol");
        };
        SimpleGame.prototype.update = function () {
            if (this.maxRow >= this.TILE_ROWS) {
                this.sfxCells.play();
                this.game.state.start("EndGameState", true, false, this.points);
                return;
            }
            if (!this.spawned) {
                this.GenerateTopBlocks();
                this.spawned = true;
            }
            this.game.input.reset();
        };
        return SimpleGame;
    }(Phaser.State));
    var CurlingGame = (function () {
        function CurlingGame() {
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
            this.game = new Phaser.Game(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, Phaser.AUTO, 'gamefield', { create: this.create });
            this.game.state.add("GameRunningState", SimpleGame, false);
            this.game.state.add("TitleScreenState", TitleScreenState, false);
            this.game.state.add("EndGameState", EndGameScreenState, false);
            this.game.state.start("TitleScreenState", true, true);
        }
        CurlingGame.prototype.onGoFullScreen = function () {
            this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
            this.game.scale.refresh();
        };
        CurlingGame.prototype.goFullScreen = function () {
        };
        CurlingGame.prototype.create = function () {
            var _this = this;
            this.game.stage.backgroundColor = 0xffffff;
            this.game.scale.onFullScreenInit.add(CurlingGame.prototype.onGoFullScreen, this);
            this.game.input.onTap.add(function () { _this.game.scale.startFullScreen(true); }, this);
        };
        return CurlingGame;
    }());
    GameCurling.CurlingGame = CurlingGame;
})(GameCurling || (GameCurling = {}));
window.onload = function () {
    var game = new GameCurling.CurlingGame();
};
