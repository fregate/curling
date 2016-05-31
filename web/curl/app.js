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
    })();
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
        };
        TitleScreenState.prototype.create = function () {
            this.game.add.sprite(0, 0, "title");
            this.input.onTap.addOnce(this.titleClicked, this);
        };
        TitleScreenState.prototype.titleClicked = function () {
            this.game.state.start("GameRunningState");
        };
        return TitleScreenState;
    })(Phaser.State);
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
Жду тебя в субботу к 13:30 прямо там (это что бы время было переодеться). Хотя можно начинать с пятницы :)\n\
Адрес: Станционная, 102 (это практически Экспоцентр)\n\n\
Возьми удобную одежду - это же спорт!", styleoverall);
            this.input.onTap.addOnce(this.titleClicked, this);
        };
        EndGameScreenState.prototype.titleClicked = function () {
            this.game.state.start("TitleScreenState");
        };
        return EndGameScreenState;
    })(Phaser.State);
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
        }
        SimpleGame.prototype.HandleTouchMouse = function (pointer) {
            if (this.bottomRect.contains(pointer.x, pointer.y)) {
                this.DropRowDown();
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
                spr.position.set(_this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.ShiftRowRight = function () {
            var _this = this;
            var popped = this.row.pop();
            this.row.unshift(popped);
            this.row.forEach(function (spr, idx) {
                spr.position.set(_this.OFFSET_FIELD + _this.TILE_SPACE + idx * (_this.TILE_SPACE + _this.TILE_SIZE), _this.TILE_SPACE);
            }, this);
        };
        SimpleGame.prototype.DropRowDown = function () {
            var _this = this;
            this.row.forEach(function (spr, idx) {
                _this.field[idx] ? _this.field[idx] : _this.field[idx] = [];
                var fcy = _this.field[idx].filter(function (num) { return num.color >= 0; }).length;
                _this.field[idx][fcy] = { color: parseInt(spr.key.toString()[1]), key: _this.sprtId };
                spr.anchor.set(0, 1);
                spr.position.y = _this.SCREEN_HEIGHT - _this.TILE_SPACE - (fcy * (_this.TILE_SPACE + _this.TILE_SIZE));
                _this.fieldSprites.push({ key: _this.sprtId, sprt: spr });
                _this.sprtId += 1;
            }, this);
            this.row = [];
            while (1) {
                var bFieldChecked = true;
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
                            if ((ccc.y < this.TILE_ROWS - 1) && (this.field[ccc.x][ccc.y + 1] && this.field[ccc.x][ccc.y + 1].color == fval)) {
                                var nc = { x: ccc.x, y: ccc.y + 1 };
                                if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }
                            if (ccc.y > 0 && (this.field[ccc.x][ccc.y - 1] && this.field[ccc.x][ccc.y - 1].color == fval)) {
                                var nc = { x: ccc.x, y: ccc.y - 1 };
                                if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }
                            if (ccc.x > 0 && (this.field[ccc.x - 1][ccc.y] && this.field[ccc.x - 1][ccc.y].color == fval)) {
                                var nc = { x: ccc.x - 1, y: ccc.y };
                                if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }
                            if ((ccc.x < this.TILE_COLUMNS - 1) && (this.field[ccc.x + 1][ccc.y] && this.field[ccc.x + 1][ccc.y].color == fval)) {
                                var nc = { x: ccc.x + 1, y: ccc.y };
                                if (colorspace.filter(function (csc, idx) { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }
                        }
                        if (colorspace.length < 3)
                            continue;
                        bFieldChecked = false;
                        colorspace.forEach(function (ccc) {
                            var fval = _this.field[ccc.x][ccc.y];
                            fval.color = -1;
                            var idx = -1;
                            _this.fieldSprites.filter(function (val, i) {
                                if (fval.key == val.key) {
                                    idx = i;
                                    return true;
                                }
                                return false;
                            }, _this)[0].sprt.destroy();
                            _this.fieldSprites.splice(idx, 1);
                        }, this);
                        this.points += colorspace.length;
                    }
                }
                if (bFieldChecked) {
                    console.log(this.field);
                    break;
                }
                else {
                    this.field.forEach(function (line, fldidx) {
                        line = line.filter(function (val) { return val.color >= 0; });
                        line.forEach(function (val, idx) {
                            var spr = _this.fieldSprites.filter(function (s) { return s.key == val.key; }, _this)[0].sprt;
                            spr.position.y = _this.SCREEN_HEIGHT - _this.TILE_SPACE - (idx * (_this.TILE_SPACE + _this.TILE_SIZE));
                        }, _this);
                        _this.field[fldidx] = line;
                    }, this);
                }
            }
            for (var c = 0; c < this.TILE_COLUMNS; c++) {
                this.maxRow = Math.max(this.field[c].filter(function (num) { return num.color >= 0; }).length, this.maxRow);
            }
            this.spawned = false;
            this.textValue.text = this.points.toString();
        };
        SimpleGame.prototype.preload = function () {
            this.game.load.image('b0', 'curl/res/square_green.png');
            this.game.load.image('b1', 'curl/res/square_blue.png');
            this.game.load.image('b2', 'curl/res/square_red.png');
            this.game.load.image('b3', 'curl/res/square_stone.png');
            this.game.load.image('b4', 'curl/res/square_wood.png');
            this.game.load.image('b5', 'curl/res/square_yellow.png');
            this.game.load.image('field', 'curl/res/cfield.png');
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
            this.cursors = this.game.input.keyboard.createCursorKeys();
            this.cursors.down.onDown.add(SimpleGame.prototype.DropRowDown, this);
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
                this.game.state.start("EndGameState", true, false, this.points);
                return;
            }
            if (!this.spawned) {
                this.row = [];
                for (var s = 0; s < this.TILE_COLUMNS; s++) {
                    var spr = this.game.add.sprite(this.OFFSET_FIELD + this.TILE_SPACE + s * (this.TILE_SPACE + this.TILE_SIZE), this.TILE_SPACE, "b" + this.game.rnd.between(0, 5));
                    this.row.push(spr);
                }
                this.spawned = true;
            }
            if (this.game.input.activePointer.isDown) {
                this.game.input.mousePointer.x, this.game.input.mousePointer.y;
            }
            this.game.input.reset();
        };
        return SimpleGame;
    })(Phaser.State);
    var CurlingGame = (function () {
        function CurlingGame() {
            this.SCREEN_WIDTH = 600;
            this.SCREEN_HEIGHT = 800;
            this.game = new Phaser.Game(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, Phaser.AUTO, 'gamefield');
            this.game.state.add("GameRunningState", SimpleGame, false);
            this.game.state.add("TitleScreenState", TitleScreenState, false);
            this.game.state.add("EndGameState", EndGameScreenState, false);
            this.game.state.start("TitleScreenState", true, true);
        }
        return CurlingGame;
    })();
    GameCurling.CurlingGame = CurlingGame;
})(GameCurling || (GameCurling = {}));
window.onload = function () {
    var game = new GameCurling.CurlingGame();
};
