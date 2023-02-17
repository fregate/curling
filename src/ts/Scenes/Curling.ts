import Finish from "./Finish";

class AnimationWaiter {
	private refs: number = 0;

	private callback: Function;
	private context;

	constructor(cb: Function, context?) {
		this.callback = cb;
		this.context = context;
	}

	public add(_) {
		this.refs++;
	}

	public release() {
		this.refs--;
		if (this.refs == 0)
			this.callback.apply(this.context);
	}
};

export default class Curling extends Phaser.Scene {
	public static Name: string = "Curling";

	private TILE_ROWS: number = 11;
	private TILE_COLUMNS: number = 6;

	private TILE_SIZE: number = 64;
	private TILE_SPACE: number = 5;

	private OFFSET_FIELD: number = 91;

	private TILE_COLORS: number = 6;

	private maxRow: number = 0;
	private field: Phaser.GameObjects.GameObject[][]; // TILE_COLUMNS x TILE_ROWS

	private lockInput: boolean = false;

	private sfxBattery: Phaser.Sound.BaseSound;
	private sfxWall: Phaser.Sound.BaseSound;
	private sfxCells: Phaser.Sound.BaseSound;
	private sfxPistol: Phaser.Sound.BaseSound;

	private bonuses: string[];

	private row: Phaser.GameObjects.Group;
	private spawned: boolean;

	private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
	// swipe: PhaserSwipe.Swipe;

	private textValue;
	private points: number;

	private shiftRowLeft() {
		if (this.lockInput) {
			return;
		}

		this.sfxWall.play();
		let shifted = this.row.getChildren().shift();
		this.row.add(shifted);
		this.row.getChildren().forEach((spr, idx) => {
			this.tweens.add({
				targets: spr,
				x: this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
				duration: 100,
				onStart: () => { this.lockInput = true },
				onComplete: () => { this.lockInput = false }
			});
		});
	}

	private shiftRowRight() {
		if (this.lockInput) {
			return;
		}

		this.sfxWall.play();
		let last = this.row.getChildren().pop();
		this.row.getChildren().unshift(last);
		this.row.getChildren().forEach((spr, idx) => {
			this.tweens.add({
				targets: spr,
				x: this.OFFSET_FIELD + this.TILE_SPACE + idx * (this.TILE_SPACE + this.TILE_SIZE),
				duration: 100,
				onStart: () => { this.lockInput = true },
				onComplete: () => { this.lockInput = false }
			});
		});
	}

	private dropBlocks() {
		if (this.lockInput) {
			return;
		}

		this.lockInput = true;

		this.sfxBattery.play();
		let waiter = new AnimationWaiter(this.checkField, this);
		this.row.getChildren().forEach((spr, idx) => {
			if (this.field.at(idx) === undefined)
				this.field[idx] = []; // allocate new line

			let fcy = this.field[idx].filter((spr) => { return this.parseColorFromSprite(spr) >= 0; }).length;
			this.field[idx][fcy] = spr;

			waiter.add(this.tweens.add({
				targets: spr,
				y: this.cameras.main.height - this.TILE_SPACE - (fcy * (this.TILE_SPACE + this.TILE_SIZE)) - this.TILE_SIZE,
				duration: 100,
				onComplete: () => { waiter.release() }
			}));
		});

		this.row.clear();
	}

	private removeEmptySpaces() {
		this.field.forEach((column, fldidx) => {
			let counter = 0;
			column.forEach((tile) => {
				if (tile.getData("removed") === true) {
					return;
				}
				this.tweens.add({
					targets: tile,
					y: this.cameras.main.height - this.TILE_SPACE - (counter * (this.TILE_SPACE + this.TILE_SIZE)) - this.TILE_SIZE,
					duration: 100,
					onComplete: () => { this.checkField() }
				});
				counter += 1;
			});
			const filtered = column.filter((val) => { return val.getData("removed") !== true; });
			this.field[fldidx] = filtered;
		});
	}

	private isTileChecked(tile: Phaser.GameObjects.GameObject): boolean {
		return tile.getData("used") === true;
	}

	private checkField() {
		let localPoints: number = 0;
		for (let x = 0; x < this.TILE_COLUMNS; x++) {
			for (let y = 0; y < this.TILE_ROWS; y++) {
				if (!this.field[x])
					continue;

				if (!this.field[x][y])
					break;

				if (this.isTileChecked(this.field[x][y]))
					continue;

				let stack: Phaser.Geom.Point[] = [];
				let stackColor = -1;
				stack.push(new Phaser.Geom.Point(x, y));
				let colorspace: Phaser.Geom.Point[] = [];
				while (stack.length) {
					let ccc = stack.pop();
					if (stackColor < 0) {
						stackColor = this.parseColorFromSprite(this.field[ccc.x][ccc.y]);
					}

					colorspace.push(ccc);

					// check north
					if ((ccc.y < this.TILE_ROWS - 1) && this.checkColor(ccc.x, ccc.y + 1, stackColor)) {
						let nc = new Phaser.Geom.Point(ccc.x, ccc.y + 1);
						// check for not in colorspace
						if (this.checkFilterFieldCoord(nc, colorspace))
							stack.push(nc);
					}

					// check south
					if (ccc.y > 0 && this.checkColor(ccc.x, ccc.y - 1, stackColor)) {
						let sc = new Phaser.Geom.Point(ccc.x, ccc.y - 1);
						if (this.checkFilterFieldCoord(sc, colorspace))
							stack.push(sc);
					}

					// check west
					if (ccc.x > 0 && this.checkColor(ccc.x - 1, ccc.y, stackColor)) {
						let wc = new Phaser.Geom.Point(ccc.x - 1, ccc.y);
						if (this.checkFilterFieldCoord(wc, colorspace))
							stack.push(wc);
					}

					// check east
					if ((ccc.x < this.TILE_COLUMNS - 1) && this.checkColor(ccc.x + 1, ccc.y, stackColor)) {
						let ec = new Phaser.Geom.Point(ccc.x + 1, ccc.y);
						if (this.checkFilterFieldCoord(ec, colorspace))
							stack.push(ec);
					}
				}

				if (colorspace.length < 3)
					continue;

				colorspace.forEach((c) => {
					this.field[c.x][c.y].setData("used", true);
				});

				if (colorspace.length >= 6) {
					this.bonuses = this.bonuses.concat(Array.from({ length: colorspace.length - 5 }, () => "line"));
				} else if (colorspace.length == 5) {
					this.bonuses.push("bomb");
				} else if (colorspace.length == 4) {
					this.bonuses.push("any");
				}

				let pt = this.removeBlocks(colorspace);
				localPoints += pt;
			}
		}

		if (localPoints == 0) { // field not contain something to remove
			this.finishUpdate();
		} else {
			this.sfxPistol.play();
			this.points += localPoints;
			this.textValue.text = this.points.toString();
		}
	}

	private removeBlocks(cs: Array<Phaser.Geom.Point>): number {
		while (true) {
			let actionBlocks: Phaser.Geom.Point[] = [];
			cs.forEach((ccc) => {
				let spr = this.field[ccc.x][ccc.y];
				if (spr && this.parseColorFromSprite(spr) >= 0) {
					actionBlocks = actionBlocks.concat(this.getActionBlocks(ccc, cs));
					this.tweens.add({
						targets: spr,
						alpha: 0,
						duration: 100,
						onComplete: () => {
							spr.destroy(true);
							spr.setData("removed", true);
							this.removeEmptySpaces();
						}
					});
				}
			});

			if (actionBlocks.length == 0)
				break;

			cs = cs.concat(actionBlocks);
		}

		return cs.length;
	}

	public finishUpdate() {
		// update max height
		for (let c = 0; c < this.TILE_COLUMNS; c++) {
			this.maxRow = Math.max(this.field[c].length, this.maxRow);
		}

		this.lockInput = false;
		this.spawned = false;
	}

	private generateTopBlocks() {
		for (let i = 0; i < this.bonuses.length && i < this.TILE_COLUMNS; i++) {
			let block = this.add.image(0, 0, "stones", this.bonuses[i]);
			block.setData({
				"bonus": this.bonuses[i],
				"color": -1
			});
			this.row.add(block);
		}

		while (this.row.getLength() < this.TILE_COLUMNS) {
			const idx = Phaser.Math.Between(0, this.TILE_COLORS - 1);
			let block = this.add.image(0, 0, "stones", "stone" + idx);
			block.setData("color", idx);
			this.row.add(block);
		}

		this.row.shuffle();
		Phaser.Actions.GridAlign(this.row.getChildren(), {
			width: -1,
			cellWidth: this.TILE_SIZE + this.TILE_SPACE,
			cellHeight: this.TILE_SIZE + this.TILE_SPACE,
			x: this.OFFSET_FIELD + this.TILE_SPACE * 1.5,
			y: -(this.TILE_SPACE + this.TILE_SIZE)
		});

		this.row.setOrigin(0);
		let waiter = new AnimationWaiter(() => { this.lockInput = false });
		let counter = 0;
		this.row.children.iterate((spr) => {
			this.tweens.add({
				targets: spr,
				y: this.TILE_SPACE,
				duration: 100,
				delay: (counter++) * 15,
				onComplete: () => { waiter.release(); }
			});
		}, this);

		this.bonuses = [];
	}

	private parseColorFromSprite(spr: Phaser.GameObjects.GameObject): number {
		const color = spr.getData("color");
		return color < 0 ? this.TILE_COLORS : spr.getData("color");
	}

	private checkColor(x: number, y: number, color: number): boolean {
		if (!this.field[x][y])
			return false;

		const stoneColor = this.parseColorFromSprite(this.field[x][y]);
		return (stoneColor == color || stoneColor >= this.TILE_COLORS);
	}

	private getActionBlocks(c: Phaser.Geom.Point, cs: Array<Phaser.Geom.Point>): Array<Phaser.Geom.Point> {
		if (this.parseColorFromSprite(this.field[c.x][c.y]) < this.TILE_COLORS)
			return [];

		let ab: Phaser.Geom.Point[] = [];
		const bonus = this.field[c.x][c.y].getData("bonus");
		switch (bonus) {
			// case "any": { // any color - handled automatically
			// 	return;
			// }

			case "bomb": { // bomb 3x3 c.x,c.y - center
				{ // north
					let nc = new Phaser.Geom.Point(c.x, Math.min(this.TILE_ROWS - 1, c.y + 1));
					if (this.checkFilterFieldCoord(nc, cs) && this.checkFilterFieldCoord(nc, ab))
						ab.push(nc);
				}

				{ // north east
					let nec = new Phaser.Geom.Point(Math.min(this.TILE_COLUMNS - 1, c.x + 1), Math.min(this.TILE_ROWS - 1, c.y + 1));
					if (this.checkFilterFieldCoord(nec, cs) && this.checkFilterFieldCoord(nec, ab))
						ab.push(nec);
				}

				{ // east
					let ec = new Phaser.Geom.Point(Math.min(this.TILE_COLUMNS - 1, c.x + 1), c.y);
					if (this.checkFilterFieldCoord(ec, cs) && this.checkFilterFieldCoord(ec, ab))
						ab.push(ec);
				}

				{ // south east
					let sec = new Phaser.Geom.Point(Math.min(this.TILE_COLUMNS - 1, c.x + 1), Math.max(0, c.y - 1));
					if (this.checkFilterFieldCoord(sec, cs) && this.checkFilterFieldCoord(sec, ab))
						ab.push(sec);
				}

				{ // south 
					let sc = new Phaser.Geom.Point(c.x, Math.max(0, c.y - 1));
					if (this.checkFilterFieldCoord(sc, cs) && this.checkFilterFieldCoord(sc, ab))
						ab.push(sc);
				}

				{ // south west
					let swc = new Phaser.Geom.Point(Math.max(0, c.x - 1), Math.max(0, c.y - 1));
					if (this.checkFilterFieldCoord(swc, cs) && this.checkFilterFieldCoord(swc, ab))
						ab.push(swc);
				}

				{ // west
					let wc = new Phaser.Geom.Point(Math.max(0, c.x - 1), c.y);
					if (this.checkFilterFieldCoord(wc, cs) && this.checkFilterFieldCoord(wc, ab))
						ab.push(wc);
				}

				{ // north west
					let nwc = new Phaser.Geom.Point(Math.max(0, c.x - 1), Math.min(this.TILE_ROWS - 1, c.y + 1));
					if (this.checkFilterFieldCoord(nwc, cs) && this.checkFilterFieldCoord(nwc, ab))
						ab.push(nwc);
				}

				break;
			}

			case "line": { // remove horizontal line
				for (let i = 0; i < this.TILE_COLUMNS; i++) {
					let newc = new Phaser.Geom.Point(i, c.y);
					if (this.checkFilterFieldCoord(newc, cs) && this.checkFilterFieldCoord(newc, ab))
						ab.push(newc);
				}

				break;
			}
		}

		return ab;
	}

	private checkFilterFieldCoord(c: Phaser.Geom.Point, arr: Array<Phaser.Geom.Point>): boolean {
		return (arr.filter((csc) => { return csc.x == c.x && csc.y == c.y; }).length == 0);
	}

	private finishGame() {
		this.field = [];
		this.scene.start(Finish.Name, { pts: this.points });
		this.scene.stop();
	}

	public create(): void {
		this.add.image(this.cameras.main.width / 2, 0, "field").setOrigin(0.5, 0);
		this.row = this.add.group();

		this.spawned = false;

		this.points = 0;

		this.field = [];

		this.bonuses = [];

		this.cursors = this.input.keyboard.createCursorKeys();
		this.cursors.down.on('down', () => this.dropBlocks());
		this.cursors.left.on('down', () => this.shiftRowLeft());
		this.cursors.right.on('down', () => this.shiftRowRight());

		// this.swipe = new PhaserSwipe.Swipe(this.game);
		// this.swipe.swipeDown.add(SimpleGame.prototype.DropBlocks, this);
		// this.swipe.swipeLeft.add(SimpleGame.prototype.ShiftRowLeft, this);
		// this.swipe.swipeRight.add(SimpleGame.prototype.ShiftRowRight, this);

		this.maxRow = 0;

		let style = { font: "bold 65px UiFont", fill: "#ff0000", align: "right" };
		this.textValue = this.add.text(0, 0, "0", style);

		this.sfxBattery = this.sound.add("sfx_battery");
		this.sfxWall = this.sound.add("sfx_wall");
		this.sfxCells = this.sound.add("sfx_cells");
		this.sfxPistol = this.sound.add("sfx_pistol");

		this.lockInput = false;
	}

	update() {
		if (this.lockInput)
			return;

		// check game over
		if (this.maxRow >= this.TILE_ROWS) {
			this.lockInput = true;
			this.sfxCells.play();

			let counter = 0;
			let waiter = new AnimationWaiter(this.finishGame, this);
			for (let x = 0; x < this.TILE_COLUMNS; x++) {
				for (let y = 0; y < this.TILE_ROWS; y++) {
					if (!this.field[x] || !this.field[x][y])
						continue;

					let spr = this.field[x][y];
					waiter.add(this.tweens.add({
						onComplete: () => { waiter.release() },
						targets: spr,
						alpha: 0,
						duration: 15,
						delay: (counter++) * 15
					}));
				}
			}
			return;
		}

		// spawn new row
		if (!this.spawned) {
			this.generateTopBlocks();
			this.spawned = true;
		}
	}
}
