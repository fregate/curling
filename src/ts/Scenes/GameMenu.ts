import AtlasButton from "../Widgets/Button";
import Curling from "./Curling";

export default class GameMenu extends Phaser.Scene {
	public static Name: string = "GameMenu";

	private sfx: Phaser.Sound.BaseSound;

	private atlasBtn: AtlasButton;

	public preload(): void {
		this.atlasBtn = new AtlasButton("button", this.textures.get("button").getFrameNames());
	}

	public create(): void {
		this.add.image(this.cameras.main.width / 2, 0, "title").setOrigin(0.5, 0);
		this.sfx = this.sound.add("sfx_battery");

		let styleTextCommonButton = { font: "17px UiFont", fill: "#fff", align: "center", wordWrap: false, boundsAlignH: "center", boundsAlignV: "middle" };

		this.atlasBtn.add(this, this.cameras.main.width / 2, 470, "Посмотреть правила", styleTextCommonButton, () => { this.ShowRules(); });
		this.atlasBtn.add(this, this.cameras.main.width / 2, 550, "Восхищаться рекордами", styleTextCommonButton, () => { this.ShowHighscores(); });

		this.atlasBtn.add(
			this,
			this.cameras.main.width / 2, 691,
			"ЖМИ И ИГРАЙ!",
			styleTextCommonButton,
			() => { this.StartGame(); });
	}

	StartGame() {
		this.sfx.play();
		this.scene.start(Curling.Name);
	}

	ShowRules() {
		this.sfx.play();
		window['showRules']();
	}

	ShowHighscores() {
		this.sfx.play();
		window['showHighscores']();
	}
};
