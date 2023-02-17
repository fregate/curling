import AtlasButton from "../Widgets/Button";
import GameMenu from "./GameMenu";

export default class Finish extends Phaser.Scene {
	public static Name: string = "Finish";

	private sfx: Phaser.Sound.BaseSound;

	points: number;
	private atlasBtn: AtlasButton;

	public init(ptsObject: object): void {
		this.points = ptsObject["pts"];
	}

	public preload(): void {
		this.atlasBtn = new AtlasButton("button", this.textures.get("button").getFrameNames());
	}

	public create(): void {
		this.sfx = this.sound.add("sfx_battery");

		let style = { font: "bold 40px UiFont", fill: "#fff" };
		this.add.text(this.cameras.main.width / 2, 100, "ВОТ И ВСЕ", style).setOrigin(0.5);

		style.font = "bold 30px UiFont";
		this.add.text(this.cameras.main.width / 2, 150, "Убрано камней: " + this.points, style).setOrigin(0.5);

		let styleTextCommonButton = { font: "17px UiFont", fill: "#fff" };

		this.atlasBtn.add(this, this.cameras.main.width / 2, 470, "Я буду ROGUE ONE!", styleTextCommonButton, () => { this.mainMenu(); });
		this.atlasBtn.add(this, this.cameras.main.width / 2, 550, "Сохранить результат", styleTextCommonButton, () => { this.saveResult(); });
	}

	mainMenu() {
		this.sfx.play();
		this.scene.start(GameMenu.Name);
	}

	saveResult() {
		if (this.points !== undefined) {
			this.sfx.play();
			window['showNameBox'](this.points, this, this.mainMenu);
		} else {
			this.mainMenu();
		}
	}
}
