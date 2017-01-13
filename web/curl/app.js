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
            this.game.load.image("title", "res/title.png");
        };
        TitleScreenState.prototype.create = function () {
            this.game.add.sprite(0, 0, "title");
            this.input.onTap.addOnce(this.titleClicked, this);
            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);
        };
        TitleScreenState.prototype.titleClicked = function () {
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
            this.game.load.image("bg", "res/empty.png");
        };
        EndGameScreenState.prototype.create = function () {
            this.game.add.sprite(0, 0, "bg");
            var style = { font: "bold 65px Courier", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
            this.textGameOver = this.game.add.text(0, 0, "ВОТ И ВСЕ", style);
            this.textGameOver.setTextBounds(0, 150, this.game.width, 100);
            style.font = "bold 30px Courier";
            this.textRecord = this.game.add.text(0, 0, "Камней сломалось: " + this.points, style);
            this.textRecord.setTextBounds(0, 250, this.game.width, 50);
            var styleoverall = { font: "20px Courier", fill: "#fff", align: "left", wordWrap: true, wordWrapWidth: this.game.width - 30 };
            this.textRecord = this.game.add.text(30, 350, "Не стоит отчаиваться! Если что, то приезжай в керлинг-клуб \
'Пингвин' и там сможешь по- настоящему покатать камни и потереть щеткой!\n\n\
Жду тебя в субботу к 13:30 прямо там (это что бы время было переодеться).\n\
Адрес: Станционная, 102 (это практически Экспоцентр)\n\n\
Возьми удобную одежду - это же спорт!", styleoverall);
            this.input.onTap.addOnce(this.titleClicked, this);
            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);
        };
        EndGameScreenState.prototype.titleClicked = function () {
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
        // handle input function
        SimpleGame.prototype.HandleTouchMouse = function (pointer) {
            if (this.lockInput) {
                return;
            }
            if (this.bottomRect.contains(pointer.x, pointer.y)) {
                //                this.DropRowDown();
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
            var shifted = this.row.shift();
            this.row.push(shifted);
            this.row.forEach(function (spr, idx) {
                _this.TweenSpritePosition(spr, _this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.ShiftRowRight = function () {
            var _this = this;
            var popped = this.row.pop();
            this.row.unshift(popped);
            this.row.forEach(function (spr, idx) {
                _this.TweenSpritePosition(spr, _this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.DropBlocks = function () {
            var _this = this;
            this.row.forEach(function (spr, idx) {
                _this.field[idx] ? _this.field[idx] : _this.field[idx] = []; // allocate new line
                var fcy = _this.field[idx].filter(function (num) { return num.color >= 0; }).length;
                _this.field[idx][fcy] = { color: parseInt(spr.key.toString()[1]), key: _this.sprtId };
                spr.anchor.set(0, 1);
                _this.TweenSpritePosition(spr, spr.position.x, _this.SCREEN_HEIGHT - _this.TILE_SPACE - (fcy * (_this.TILE_SPACE + _this.TILE_SIZE)), null, _this.RemoveEmptySpaces);
                _this.fieldSprites.push({ key: _this.sprtId++, sprt: spr });
            }, this);
            this.row = []; // clear input blocks
        };
        SimpleGame.prototype.RemoveEmptySpaces = function () {
            var _this = this;
            this.field.forEach(function (line, fldidx) {
                line = line.filter(function (val) { return val.color >= 0; });
                _this.field[fldidx] = line;
                line.forEach(function (val, idx) {
                    var spr = _this.fieldSprites.filter(function (s) { return s.key == val.key; }, _this)[0].sprt;
                    _this.TweenSpritePosition(spr, spr.position.x, _this.SCREEN_HEIGHT - _this.TILE_SPACE - (idx * (_this.TILE_SPACE + _this.TILE_SIZE)), null, _this.CheckField);
                }, _this);
            }, this);
        };
        SimpleGame.prototype.CheckField = function () {
            var _this = this;
            var localPoints = 0;
            for (var x = 0; x < this.TILE_COLUMNS; x++) {
                for (var y = 0; y < this.TILE_ROWS; y++) {
                    if (!this.field[x] || !this.field[x][y] || this.field[x][y].color < 0)
                        continue;
                    var stack = [];
                    var fc = { x: x, y: y };
                    stack.push(fc);
                    var colorspace = [];
                    while (stack.length) {
                        var ccc = stack.pop();
                        if (!ccc)
                            continue;
                        var fval = this.field[ccc.x][ccc.y].color;
                        colorspace.push(ccc);
                        // check north
                        if ((ccc.y < this.TILE_ROWS - 1) && (this.field[ccc.x][ccc.y + 1] && this.field[ccc.x][ccc.y + 1].color == fval)) {
                            var nc = { x: ccc.x, y: ccc.y + 1 };
                            // check for not in colorspace
                            if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                stack.push(nc);
                        }
                        // check south
                        if (ccc.y > 0 && (this.field[ccc.x][ccc.y - 1] && this.field[ccc.x][ccc.y - 1].color == fval)) {
                            var nc = { x: ccc.x, y: ccc.y - 1 };
                            if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                stack.push(nc);
                        }
                        // check west
                        if (ccc.x > 0 && (this.field[ccc.x - 1][ccc.y] && this.field[ccc.x - 1][ccc.y].color == fval)) {
                            var nc = { x: ccc.x - 1, y: ccc.y };
                            if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                stack.push(nc);
                        }
                        // check east
                        if ((ccc.x < this.TILE_COLUMNS - 1) && (this.field[ccc.x + 1][ccc.y] && this.field[ccc.x + 1][ccc.y].color == fval)) {
                            var nc = { x: ccc.x + 1, y: ccc.y };
                            if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                stack.push(nc);
                        }
                    }
                    if (colorspace.length < 3)
                        continue;
                    colorspace.forEach(function (ccc) {
                        var fval = _this.field[ccc.x][ccc.y];
                        fval.color = -1;
                        var spr = _this.GetSprite(fval.key);
                        _this.TweenSpriteAlpha(spr, null, _this.RemoveEmptySpaces);
                        spr.destroy();
                    }, this);
                    localPoints += colorspace.length;
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
        SimpleGame.prototype.TweenSpritePosition = function (spr, newX, newY, onStartCB, onCompleteCB) {
            var emptyAnimation = spr.position.x == newX && spr.position.y == newY;
            var tw = this.game.add.tween(spr).to({ x: newX, y: newY }, 100, Phaser.Easing.Linear.None);
            this.TweenSprite(tw, onStartCB, onCompleteCB);
        };
        SimpleGame.prototype.TweenSpriteAlpha = function (spr, onStartCB, onCompleteCB) {
            console.log("TweenAlpha");
            var tw = this.game.add.tween(spr).to({ scale: .01 }, 100, Phaser.Easing.Linear.None);
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
            // update max height
            for (var c = 0; c < this.TILE_COLUMNS; c++) {
                this.maxRow = Math.max(this.field[c].length, this.maxRow);
            }
            this.lockInput = false;
            this.spawned = false;
        };
        SimpleGame.prototype.preload = function () {
            this.game.load.image('b0', 'res/square_green.png');
            this.game.load.image('b1', 'res/square_blue.png');
            this.game.load.image('b2', 'res/square_red.png');
            this.game.load.image('b3', 'res/square_stone.png');
            this.game.load.image('b4', 'res/square_wood.png');
            this.game.load.image('b5', 'res/square_yellow.png');
            this.game.load.image('field', 'res/cfield.png');
        };
        SimpleGame.prototype.create = function () {
            // constants
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
            this.TILE_ROWS = 11;
            this.TILE_COLUMNS = 6;
            this.TILE_SIZE = 64;
            this.TILE_SPACE = 5;
            this.OFFSET_FIELD = 91;
            // game variables
            this.game.add.sprite(0, 0, 'field');
            this.spawned = false; // initial state
            this.sprtId = 1;
            this.points = 0;
            this.field = [];
            this.fieldSprites = [];
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
        };
        SimpleGame.prototype.update = function () {
            if (this.maxRow >= this.TILE_ROWS) {
                // game over
                // play animation (remove all blocks in some way)
                this.game.state.start("EndGameState", true, false, this.points);
                return;
            }
            // spawn
            if (!this.spawned) {
                this.row = [];
                for (var s = 0; s < this.TILE_COLUMNS; s++) {
                    var spr = this.game.add.sprite(this.OFFSET_FIELD + this.TILE_SPACE + s * (this.TILE_SPACE + this.TILE_SIZE), -(this.TILE_SPACE + this.TILE_SIZE), "b" + this.game.rnd.between(0, 5));
                    this.row.push(spr);
                    this.TweenSpritePosition(spr, spr.position.x, this.TILE_SPACE);
                }
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
        // This function is called when a full screen request comes in
        CurlingGame.prototype.onGoFullScreen = function () {
            // tell Phaser how you want it to handle scaling when you go full screen
            this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
            // and this causes it to actually do it
            this.game.scale.refresh();
        };
        CurlingGame.prototype.goFullScreen = function () {
        };
        CurlingGame.prototype.create = function () {
            var _this = this;
            // Set background to white to make effect clearer
            this.game.stage.backgroundColor = 0xffffff;
            // Add a function that will get called when the game goes fullscreen
            this.game.scale.onFullScreenInit.add(CurlingGame.prototype.onGoFullScreen, this);
            // Now add a function that will get called when user taps screen.
            // Function declared inline using arrow (=>) function expression
            // Simply calls startFullScreen().  True specifies you want anti aliasing.
            // Unfortunately you can only make full screen requests in desktop browsers in event handlers
            this.game.input.onTap.add(function () { _this.game.scale.startFullScreen(true); }, this);
        };
        return CurlingGame;
    }());
    GameCurling.CurlingGame = CurlingGame;
})(GameCurling || (GameCurling = {}));
window.onload = function () {
    var game = new GameCurling.CurlingGame();
};
//# sourceMappingURL=app.js.map
