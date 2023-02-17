import 'phaser';
import Curling from './Scenes/Curling';
import Finish from './Scenes/Finish';
import GameMenu from './Scenes/GameMenu';
import Preloader from './Scenes/Preloader';

const gameConfig: Phaser.Types.Core.GameConfig = {
	scale: {
		mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
		parent: 'content',
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 600,
		height: 800
	},
	type: Phaser.AUTO,
	backgroundColor: "#001640",
	title: "Fun with stones"
};

export default class Game extends Phaser.Game {
	constructor(config: Phaser.Types.Core.GameConfig) {
		super(config);

		if (this.device.os.desktop) {
			this.scale.scaleMode = Phaser.Scale.ScaleModes.NONE;
		} else {
			this.scale.scaleMode = Phaser.Scale.ScaleModes.ENVELOP;
		}

		this.scene.add(Preloader.Name, Preloader);
		this.scene.add(GameMenu.Name, GameMenu);
		this.scene.add(Curling.Name, Curling);
		this.scene.add(Finish.Name, Finish);

		this.scene.start(Preloader.Name);
	}
}

function resize(): void {
	const canvas = document.querySelector("canvas");
	const width = window.innerWidth;
	const height = window.innerHeight;
	const wratio = width / height;
	const ratio = Number(gameConfig.scale.width) / Number(gameConfig.scale.height);
	if (wratio < ratio) {
		canvas.style.width = width + "px";
		canvas.style.height = (width / ratio) + "px";
	} else {
		canvas.style.width = (height * ratio) + "px";
		canvas.style.height = height + "px";
	}
}

window.onload = (): void => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const game = new Game(gameConfig);
	resize();
	window.addEventListener("resize", resize, true);
};
