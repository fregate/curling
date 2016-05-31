module GameCurling {

    class SETTINGS {
        SCREEN_WIDTH: number = 600;
        SCREEN_HEIGHT: number = 800;
    };

    interface FieldCoord {
        x: number;
        y: number;
    };

    interface FieldValue {
        color: number;
        key: number;
    };

    interface SpriteKey {
        key: number;
        sprt: Phaser.Sprite;
    };

    export class TitleScreenState extends Phaser.State {
        game: Phaser.Game;

        constructor() {
            super();
        }

        preload() {
            this.game.load.image("title", "res/title.png");
        }

        create() {
            this.game.add.sprite(0, 0, "title");
            this.input.onTap.addOnce(this.titleClicked, this);
        }

        titleClicked() {
            this.game.state.start("GameRunningState");
        }
    };

    export class EndGameScreenState extends Phaser.State {
        game: Phaser.Game;
        textGameOver: Phaser.Text;
        textRecord: Phaser.Text;
        textOverall: Phaser.Text;
        points: number;

        constructor() {
            super();
        }

        init(pts) {
            this.points = pts;
        }

        preload() {
            this.game.load.image("bg", "res/empty.png");
        }

        create() {
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
        }

        titleClicked() {
            this.game.state.start("TitleScreenState");
        }
    };

    class SimpleGame extends Phaser.State {
        private SCREEN_WIDTH: number = 600;
        private SCREEN_HEIGHT: number = 800;

        private TILE_ROWS: number = 11;
        private TILE_COLUMNS: number = 6;

        private TILE_SIZE: number = 64;
        private TILE_SPACE: number = 5;

        private OFFSET_FIELD: number = 91;

        private maxRow: number = 0;
        private field: FieldValue[][];
        private fieldSprites: SpriteKey[];
        private sprtId: number;

        constructor() {
/*            this.game = new Phaser.Game(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, Phaser.AUTO, 'gamefield',
                {
                    preload: this.preload,
                    create: this.create,
                    update: this.update
                }); */
            super();
        }

        //game: Phaser.Game;
        row: Phaser.Sprite[];
        spawned: boolean;
        cursors: Phaser.CursorKeys;
        topLeftRect: Phaser.Rectangle;
        topRighRect: Phaser.Rectangle;
        bottomRect: Phaser.Rectangle;
        textValue: Phaser.Text;

        points: number;


        // handle input function
        HandleTouchMouse(pointer) {
            if (this.bottomRect.contains(pointer.x, pointer.y)) {
                this.DropRowDown();
            }

            if (this.topLeftRect.contains(pointer.x, pointer.y)) {
                this.ShiftRowLeft();
            }

            if (this.topRighRect.contains(pointer.x, pointer.y)) {
                this.ShiftRowRight();
            }
        }

        ShiftRowLeft() {
            var shifted = this.row.shift();
            this.row.push(shifted);
            this.row.forEach((spr, idx) => {
                spr.position.set(
                    this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
                    this.TILE_SPACE);
            }, this);
        }

        ShiftRowRight() {
            var popped = this.row.pop();
            this.row.unshift(popped);
            this.row.forEach((spr, idx) => {
                spr.position.set(
                    this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
                    this.TILE_SPACE);
            }, this);
        }

        DropRowDown() {
            // drop stones into field
            this.row.forEach((spr, idx) => {
                this.field[idx] ? this.field[idx] : this.field[idx] = [];
                var fcy = this.field[idx].filter((num) => { return num.color >= 0; }).length;
                this.field[idx][fcy] = { color: parseInt(spr.key.toString()[1]), key: this.sprtId };

                spr.anchor.set(0, 1);
                spr.position.y = this.SCREEN_HEIGHT - this.TILE_SPACE - (fcy * (this.TILE_SPACE + this.TILE_SIZE));
                this.fieldSprites.push({ key: this.sprtId, sprt: spr });
                this.sprtId += 1;
            }, this);
            this.row = [];

            // check field
            while (1) {
                var bFieldChecked = true;
                for (var x = 0; x < this.TILE_COLUMNS; x++) {
                    for (var y = 0; y < this.TILE_ROWS; y++) {
                        if (!this.field[x] || !this.field[x][y] || this.field[x][y].color < 0)
                            continue;

                        var stack = [];
                        var fc: FieldCoord = { x: x, y: y };
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
                                var nc: FieldCoord = { x: ccc.x, y: ccc.y + 1 };
                                // check for not in colorspace
                                if (colorspace.filter((csc, idx) => { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }

                            // check south
                            if (ccc.y > 0 && (this.field[ccc.x][ccc.y - 1] && this.field[ccc.x][ccc.y - 1].color == fval)) {
                                var nc: FieldCoord = { x: ccc.x, y: ccc.y - 1 };
                                if (colorspace.filter((csc, idx) => { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }

                            // check west
                            if (ccc.x > 0 && (this.field[ccc.x - 1][ccc.y] && this.field[ccc.x - 1][ccc.y].color == fval)) {
                                var nc: FieldCoord = { x: ccc.x - 1, y: ccc.y };
                                if (colorspace.filter((csc, idx) => { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }

                            // check east
                            if ((ccc.x < this.TILE_COLUMNS - 1) && (this.field[ccc.x + 1][ccc.y] && this.field[ccc.x + 1][ccc.y].color == fval)) {
                                var nc: FieldCoord = { x: ccc.x + 1, y: ccc.y };
                                if (colorspace.filter((csc, idx) => { return csc.x == nc.x && csc.y == nc.y; }, this).length == 0)
                                    stack.push(nc);
                            }
                        }

                        if (colorspace.length < 3)
                            continue;

                        bFieldChecked = false;
                        colorspace.forEach((ccc) => {
                            var fval = this.field[ccc.x][ccc.y];
                            fval.color = -1;
                            var idx = -1;
                            this.fieldSprites.filter((val, i) => {
                                if (fval.key == val.key) {
                                    idx = i;
                                    return true;
                                }
                                return false;
                            }, this)[0].sprt.destroy();
                            this.fieldSprites.splice(idx, 1);
                        }, this);

                        this.points += colorspace.length;
                    }
                }

                if (bFieldChecked) {
                    console.log(this.field);
                    break;
                }
                else {
                    // this.ShiftFieldBlocks();
                    this.field.forEach((line, fldidx) => {
                        line = line.filter((val) => { return val.color >= 0; });
                        line.forEach((val, idx) => {
                            var spr = this.fieldSprites.filter((s) => { return s.key == val.key; }, this)[0].sprt;
                            spr.position.y = this.SCREEN_HEIGHT - this.TILE_SPACE - (idx * (this.TILE_SPACE + this.TILE_SIZE));
                        }, this);
                        this.field[fldidx] = line;
                    }, this);
                }
            }

            // update maxRow
            for (var c = 0; c < this.TILE_COLUMNS; c++) {
                this.maxRow = Math.max(this.field[c].filter((num) => { return num.color >= 0; }).length, this.maxRow);
            }

            // spawn new row
            this.spawned = false;

            // update score
            this.textValue.text = this.points.toString();
        }

        preload() {
            this.game.load.image('b0', 'res/square_green.png');
            this.game.load.image('b1', 'res/square_blue.png');
            this.game.load.image('b2', 'res/square_red.png');
            this.game.load.image('b3', 'res/square_stone.png');
            this.game.load.image('b4', 'res/square_wood.png');
            this.game.load.image('b5', 'res/square_yellow.png');

            this.game.load.image('field', 'res/cfield.png');
        }

        create() {
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
        }

        update() {
            if (this.maxRow >= this.TILE_ROWS) {
                // game over
                this.game.state.start("EndGameState", true, false, this.points);
                return;
            }

            // spawn
            if (!this.spawned) {
                this.row = [];
                for (var s = 0; s < this.TILE_COLUMNS; s++) {
                    var spr = this.game.add.sprite(
                        this.OFFSET_FIELD + this.TILE_SPACE + s * (this.TILE_SPACE + this.TILE_SIZE),
                        this.TILE_SPACE,
                        "b" + this.game.rnd.between(0, 5));

                    this.row.push(spr);
                    //                this.game.add.tween(spr.position.x).to(1, 2000, Phaser.Easing.Bounce.In, true);
                }

                this.spawned = true;
            }

            if (this.game.input.activePointer.isDown) {
                this.game.input.mousePointer.x, this.game.input.mousePointer.y;
            }

            this.game.input.reset();
        }
    }

    export class CurlingGame {
        game: Phaser.Game;
        private SCREEN_WIDTH: number = 600;
        private SCREEN_HEIGHT: number = 800;

        constructor() {
            this.game = new Phaser.Game(this.SCREEN_WIDTH, this.SCREEN_HEIGHT, Phaser.AUTO, 'gamefield', { create: this.create });

            this.game.state.add("GameRunningState", SimpleGame, false);
            this.game.state.add("TitleScreenState", TitleScreenState, false);
            this.game.state.add("EndGameState", EndGameScreenState, false);

            this.game.state.start("TitleScreenState", true, true);
        }

        // This function is called when a full screen request comes in
        onGoFullScreen() {
            // tell Phaser how you want it to handle scaling when you go full screen
            this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
            // and this causes it to actually do it
            this.game.scale.refresh();
        }

        goFullScreen() {

        }

        create() {
            // Set background to white to make effect clearer
            this.game.stage.backgroundColor = 0xffffff;

            // Add a function that will get called when the game goes fullscreen
            this.game.scale.onFullScreenInit.add(CurlingGame.prototype.onGoFullScreen, this);

            // Now add a function that will get called when user taps screen.
            // Function declared inline using arrow (=>) function expression
            // Simply calls startFullScreen().  True specifies you want anti aliasing.
            // Unfortunately you can only make full screen requests in desktop browsers in event handlers
            this.game.input.onTap.add(
                () => { this.game.scale.startFullScreen(true); },
                this);
        }
    }
}

window.onload = () => {

    var game = new GameCurling.CurlingGame();

};
