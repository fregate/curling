﻿module GameCurling {

    class SETTINGS {
        SCREEN_WIDTH: number = 600;
        SCREEN_HEIGHT: number = 800;
    };

    class ANIMATION_WAITER {
        private refs: number = 0;

        addRef(cb: Function, ctx: any) {
            this.refs++;
//            console.log("AW add " + this.refs);
            if (cb !== null && typeof cb == 'function')
                cb.apply(ctx);
        }

        releaseRef(cb: Function, ctx: any) {
//            console.log("AW release " + this.refs);
            this.refs--;
            if (this.refs == 0 && cb !== null && typeof cb == 'function')
                cb.apply(ctx);
        }
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
        private spaceKey: Phaser.Key;

        private sfx: Phaser.Sound;

        game: Phaser.Game;

        constructor() {
            super();
        }

        preload() {
            this.game.load.image("title", "res/title.png");
            this.game.load.audio("click", "res/sfx/battery.mp3");
        }

        create() {
            this.game.add.sprite(0, 0, "title");
            this.input.onTap.addOnce(this.titleClicked, this);

            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);

            this.sfx = this.game.add.audio("click");
        }

        titleClicked() {
            this.sfx.play();
            this.game.state.start("GameRunningState");
        }
    };

    export class EndGameScreenState extends Phaser.State {
        private spaceKey: Phaser.Key;

        private sfx: Phaser.Sound;

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
            this.game.load.audio("click", "res/sfx/battery.mp3");

            this.game.load.text("invite", "res/invite.txt");
        }

        create() {
            this.game.add.sprite(0, 0, "bg");
            this.sfx = this.game.add.audio("click");

            let style = { font: "bold 65px Courier", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
            this.textGameOver = this.game.add.text(0, 0, "ВОТ И ВСЕ", style);
            this.textGameOver.setTextBounds(0, 150, this.game.width, 100);

            style.font = "bold 30px Courier";
            this.textRecord = this.game.add.text(0, 0, "Камней сломалось: " + this.points, style);
            this.textRecord.setTextBounds(0, 250, this.game.width, 50);

            let styleoverall = { font: "20px Courier", fill: "#fff", align: "left", wordWrap: true, wordWrapWidth: this.game.width - 30 };
            let txt = this.game.cache.getText('invite');
            this.textRecord = this.game.add.text(30, 350, txt, styleoverall);

            this.input.onTap.addOnce(this.titleClicked, this);

            this.spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            this.spaceKey.onDown.add(this.titleClicked, this);
        }

        titleClicked() {
            this.sfx.play();
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

        private TILE_COLORS: number;

        private maxRow: number = 0;
        private field: FieldValue[][];
        private fieldSprites: SpriteKey[];
        private sprtId: number;

        private lockInput: boolean = false;
        private aw: ANIMATION_WAITER = new ANIMATION_WAITER;
        private dummySprite: Phaser.Sprite;

        private sfxBattery: Phaser.Sound;
        private sfxNumKey: Phaser.Sound;
        private sfxWall: Phaser.Sound;
        private sfxCells: Phaser.Sound;
        private sfxPistol: Phaser.Sound;

        private bonuses: number[];

        constructor() {
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
        }

        ShiftRowLeft() {
            this.sfxWall.play();
            let shifted = this.row.shift();
            this.row.push(shifted);
            this.row.forEach((spr, idx) => {
                this.TweenSpritePosition(spr,
                    this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
                    this.TILE_SPACE);
            }, this);
        }

        ShiftRowRight() {
            this.sfxWall.play();

            let popped = this.row.pop();
            this.row.unshift(popped);
            this.row.forEach((spr, idx) => {
                this.TweenSpritePosition(spr,
                    this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
                    this.TILE_SPACE);
            }, this);
        }

        DropBlocks() {
            this.sfxBattery.play();

            this.row.forEach((spr, idx) => {
                this.field[idx] ? this.field[idx] : this.field[idx] = []; // allocate new line
                let fcy = this.field[idx].filter((num) => { return num.color >= 0; }).length;
                this.field[idx][fcy] = { color: this.ParseColorFromSprite(spr), key: this.sprtId };

                spr.anchor.set(0, 1);
                this.TweenSpritePosition(
                    spr,
                    spr.position.x,
                    this.SCREEN_HEIGHT - this.TILE_SPACE - (fcy * (this.TILE_SPACE + this.TILE_SIZE)),
                    null,
                    this.RemoveEmptySpaces
                );
                this.fieldSprites.push({ key: this.sprtId++, sprt: spr });
            }, this);
            this.row = []; // clear input blocks
        }

        RemoveEmptySpaces() {
            this.field.forEach((line, fldidx) => {
                line = line.filter((val) => { return val.color >= 0; });
                this.field[fldidx] = line;
                line.forEach((val, idx) => {
                    var spr = this.fieldSprites.filter((s) => { return s.key == val.key; }, this)[0].sprt;
                    if (spr.position.y != this.SCREEN_HEIGHT - this.TILE_SPACE - (idx * (this.TILE_SPACE + this.TILE_SIZE))) {
                        this.TweenSpritePosition(
                            spr,
                            spr.position.x,
                            this.SCREEN_HEIGHT - this.TILE_SPACE - (idx * (this.TILE_SPACE + this.TILE_SIZE)),
                            null,
                            this.CheckField
                        );
                    }
                }, this);
            }, this);

            this.TweenSpritePosition(
                this.dummySprite,
                this.dummySprite.position.x,
                this.dummySprite.position.y,
                null,
                this.CheckField
            );
        }

        CheckField() {
            let localPoints: number = 0;
            for (let x = 0; x < this.TILE_COLUMNS; x++) {
                for (let y = 0; y < this.TILE_ROWS; y++) {
                    if (!this.field[x] || !this.field[x][y] || this.field[x][y].color < 0)
                        continue;

                    let stack = [];
                    let stackColor = -1;
                    let fc: FieldCoord = { x: x, y: y };
                    stack.push(fc);
                    let colorspace = [];
                    while (stack.length) {
                        let ccc = stack.pop();
                        if (!ccc)
                            continue;

                        if (stackColor < 0)
                            stackColor = this.field[ccc.x][ccc.y].color;

                        colorspace.push(ccc);

                        // check north
                        if ((ccc.y < this.TILE_ROWS - 1) && this.CheckColor(ccc.x, ccc.y + 1, stackColor)) {
                            var nc: FieldCoord = { x: ccc.x, y: ccc.y + 1 };
                            // check for not in colorspace
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }

                        // check south
                        if (ccc.y > 0 && this.CheckColor(ccc.x, ccc.y - 1, stackColor)) {
                            var nc: FieldCoord = { x: ccc.x, y: ccc.y - 1 };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }

                        // check west
                        if (ccc.x > 0 && this.CheckColor(ccc.x - 1, ccc.y, stackColor)) {
                            var nc: FieldCoord = { x: ccc.x - 1, y: ccc.y };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }

                        // check east
                        if ((ccc.x < this.TILE_COLUMNS - 1) && this.CheckColor(ccc.x + 1, ccc.y, stackColor)) {
                            var nc: FieldCoord = { x: ccc.x + 1, y: ccc.y };
                            if (this.FilterFieldCoord(nc, colorspace))
                                stack.push(nc);
                        }
                    }

                    if (colorspace.length < 3)
                        continue;

                    if (colorspace.length >= 6) {
                        let arr = this.CreateArray(colorspace.length - 5, 2);
                        this.bonuses = this.bonuses.concat(arr);
                    } else if (colorspace.length > 3) {
                        this.bonuses.push(colorspace.length - 4);
                    }

                    let pt = this.RemoveBlocks(colorspace);

                    this.sfxPistol.play();
                    localPoints += pt;
                }
            }

            if (localPoints == 0) { // field not contain something to remove
                this.FinishUpdate();
            } else {
                this.points += localPoints;
                this.textValue.text = this.points.toString();
            }
        }

        RemoveBlocks(cs: Array<FieldCoord>): number {
            while(1) {
                let actionBlocks = [];
                cs.forEach((ccc, idx) => {
                    let fval = this.field[ccc.x][ccc.y];
                    if (fval && fval.color >= 0) {
                        this.GetActionBlocks(ccc, cs, actionBlocks);
                        fval.color = -1;
                        let spr = this.GetSprite(fval.key);
                        this.TweenSpriteAlpha(spr, null, this.RemoveEmptySpaces);
                        spr.destroy();
                    }
                }, this);
                if (actionBlocks.length == 0)
                    break;
                cs = cs.concat(actionBlocks);
            }

            return cs.length;
        }

        TweenSpritePosition(spr: Phaser.Sprite, newX: number, newY: number, onStartCB?: Function, onCompleteCB?: Function) {
            let emptyAnimation = spr.position.x == newX && spr.position.y == newY;
            let tw = this.game.add.tween(spr).to(
                { x: newX, y: newY },
                100,
                Phaser.Easing.Linear.None);

            this.TweenSprite(tw, onStartCB, onCompleteCB);
        }

        TweenSpriteAlpha(spr: Phaser.Sprite, onStartCB?: Function, onCompleteCB?: Function) {
            let tw = this.game.add.tween(spr).to(
                { alpha: 0 },
                100, Phaser.Easing.Linear.None);

            this.TweenSprite(tw, onStartCB, onCompleteCB);
        }

        TweenSprite(tw: Phaser.Tween, onStartCB?: Function, onCompleteCB?: Function) {
            if (onStartCB === null || typeof onStartCB != 'function')
                onStartCB = () => { this.lockInput = true; };
            tw.onStart.addOnce(() => { this.aw.addRef(onStartCB, this); }, this);

            if (onCompleteCB === null || typeof onCompleteCB != 'function')
                onCompleteCB = () => { this.lockInput = false; };
            tw.onComplete.addOnce(() => { this.aw.releaseRef(onCompleteCB, this); }, this);

            tw.start();
        }

        GetSprite(key: number, splice = false): Phaser.Sprite {
            let idx = -1;
            let spr = this.fieldSprites.filter((val, i) => {
                if (key == val.key) {
                    idx = i;
                    return true;
                }
                return false;
            }, this)[0].sprt;
            if (splice)
                this.fieldSprites.splice(idx, 1);
            return spr;
        }

        FinishUpdate() {
            // update max height
            for (let c = 0; c < this.TILE_COLUMNS; c++) {
                this.maxRow = Math.max(this.field[c].length, this.maxRow);
            }
            this.lockInput = false;
            this.spawned = false;
        }

        ShuffleArray(a: Array<Phaser.Sprite>) {
            for (let i = a.length; i; i--) {
                let j = Math.floor(Math.random() * i);
                [a[i - 1], a[j]] = [a[j], a[i - 1]];
            }
        }

        GenerateTopBlocks() {
            this.row = [];
            for (let i = 0; i < this.bonuses.length && i < this.TILE_COLUMNS; i++) {
                this.row.push(this.game.add.sprite(0, 0, "s" + this.bonuses[i]));
            }

            for (let s = this.bonuses.length; s < this.TILE_COLUMNS; s++) {
                this.row.push(this.game.add.sprite(0, 0, "b" + this.game.rnd.between(0, this.TILE_COLORS - 1)));
            }

            this.ShuffleArray(this.row);
            this.row.forEach((spr, idx) => {
                spr.position.set(
                    this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
                    -(this.TILE_SPACE + this.TILE_SIZE)
                );
                this.TweenSpritePosition(spr, spr.position.x, this.TILE_SPACE);
            }, this);

            this.bonuses = [];
        }

        ParseColorFromSprite(spr: Phaser.Sprite): number {
            let offset = 0;
            if(spr.key[0] == 's') {
                offset = this.TILE_COLORS;
            }

            return parseInt(spr.key[1]) + offset;
        }

        CheckColor(x: number, y: number, c: number): boolean {
            if (!this.field[x][y])
                return false;
            return (this.field[x][y].color == c || this.field[x][y].color >= this.TILE_COLORS);
        }

        // create array and initilize it. don't know how to do it right - use brutefroce slow method
        CreateArray(len: number, val?: number): Array<number> {
            let arr = [];
            while (len--)
                arr.push(val);

            return arr;
        }

        GetActionBlocks(c: FieldCoord, cs: Array<FieldCoord>, ab: Array<FieldCoord>) {
            let fval = this.field[c.x][c.y];
            if (fval.color < this.TILE_COLORS)
                return;

            switch (fval.color) {
                case 6: { // any color - handled automatically
                    return;
                }
                case 7: { // bomb 3x3 c.x,c.y - center
                    { // north
                        let nc: FieldCoord = { x: c.x, y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nc, cs) && this.FilterFieldCoord(nc, ab))
                            ab.push(nc);
                    }

                    { // north east
                        let nec: FieldCoord = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nec, cs) && this.FilterFieldCoord(nec, ab))
                            ab.push(nec);
                    }

                    { // east
                        let ec: FieldCoord = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: c.y };
                        if (this.FilterFieldCoord(ec, cs) && this.FilterFieldCoord(ec, ab))
                            ab.push(ec);
                    }

                    { // south east
                        let sec: FieldCoord = { x: Math.min(this.TILE_COLUMNS - 1, c.x + 1), y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(sec, cs) && this.FilterFieldCoord(sec, ab))
                            ab.push(sec);
                    }

                    { // south 
                        let sc: FieldCoord = { x: c.x, y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(sc, cs) && this.FilterFieldCoord(sc, ab))
                            ab.push(sc);
                    }

                    { // south west
                        let swc: FieldCoord = { x: Math.max(0, c.x - 1), y: Math.max(0, c.y - 1) };
                        if (this.FilterFieldCoord(swc, cs) && this.FilterFieldCoord(swc, ab))
                            ab.push(swc);
                    }

                    { // west
                        let wc: FieldCoord = { x: Math.max(0, c.x - 1), y: c.y };
                        if (this.FilterFieldCoord(wc, cs) && this.FilterFieldCoord(wc, ab))
                            ab.push(wc);
                    }

                    { // north west
                        let nwc: FieldCoord = { x: Math.max(0, c.x - 1), y: Math.min(this.TILE_ROWS - 1, c.y + 1) };
                        if (this.FilterFieldCoord(nwc, cs) && this.FilterFieldCoord(nwc, ab))
                            ab.push(nwc);
                    }

                    break;
                }
                case 8: { // remove horizontal line
                    for (let i = 0; i < this.TILE_COLUMNS; i++) {
                        let newc: FieldCoord = { x: i, y: c.y };
                       if (this.FilterFieldCoord(newc, cs) && this.FilterFieldCoord(newc, ab))
                            ab.push(newc);
                    }

                    break;
                }
            }
        }

        FilterFieldCoord(c: FieldCoord, arr: Array<FieldCoord>): boolean {
            return (arr.filter((csc, idx) => { return csc.x == c.x && csc.y == c.y; }, this).length == 0);
        }

        preload() {
            this.game.load.image('b0', 'res/square_green.png');
            this.game.load.image('b1', 'res/square_blue.png');
            this.game.load.image('b2', 'res/square_red.png');
            this.game.load.image('b3', 'res/square_stone.png');
            this.game.load.image('b4', 'res/square_wood.png');
            this.game.load.image('b5', 'res/square_yellow.png');
            this.TILE_COLORS = 6;

            this.game.load.image('s0', 'res/square_any.png');
            this.game.load.image('s1', 'res/bomb.png');
            this.game.load.image('s2', 'res/line.png');

            this.game.load.image('field', 'res/cfield.png');

            this.game.load.audio("sfx_battery", "res/sfx/battery.mp3");
            this.game.load.audio("sfx_numkey", "res/sfx/numkey.mp3");
            this.game.load.audio("sfx_wall", "res/sfx/wall.mp3");
            this.game.load.audio("sfx_cells", "res/sfx/need_cells.mp3");
            this.game.load.audio("sfx_pistol", "res/sfx/pistol.mp3");
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

            let style = { font: "bold 65px Courier", fill: "#ff0000", align: "right" };
            this.textValue = this.game.add.text(0, 0, "0", style);

            this.dummySprite = this.game.add.sprite(
                -1000,
                -1000,
                "b" + this.game.rnd.between(0, 5));

            this.sfxBattery = this.game.add.audio("sfx_battery");
            this.sfxNumKey = this.game.add.audio("sfx_numkey");
            this.sfxWall = this.game.add.audio("sfx_wall");
            this.sfxCells = this.game.add.audio("sfx_cells");
            this.sfxPistol = this.game.add.audio("sfx_pistol");
        }

        update() {
            if (this.maxRow >= this.TILE_ROWS) {
                this.sfxCells.play();
                // game over
                // play animation (remove all blocks in some way)
                this.game.state.start("EndGameState", true, false, this.points);
                return;
            }

            // spawn
            if (!this.spawned) {
                this.GenerateTopBlocks();
                this.spawned = true;
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
