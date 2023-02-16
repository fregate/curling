export default class AtlasButton {
	constructor(atlas: string, frames: string[]) {
		this.atlas = atlas;
		if (!frames.includes(this.normal))
			throw "button atlas has no normal frame";

		if (!frames.includes(this.hover))
			this.hover = this.normal;

		if (!frames.includes(this.pressed))
			this.pressed = this.normal;

		if (!frames.includes(this.disabled))
			this.disabled = this.normal;
	}

	private normal = "normal";
	private hover = "hover";
	private pressed = "pressed";
	private disabled = "disabled";

	private atlas: string;
	add(scene: Phaser.Scene, x: number, y: number, title: string, style, callback: Function) {
		const button_group = scene.add.group();
		const text = scene.add.text(x, y, title, style).setPadding(10).setOrigin(0.5).setDepth(1);
		const bg = scene.add.image(x, y, this.atlas, this.normal)
		.setOrigin(0.5)
		.setInteractive({ useHandCursor: true })
		.on('pointerdown', () => {
			bg.setTexture(this.atlas, this.pressed);
		})
		.on('pointerup', () => {
			bg.setTexture(this.atlas, this.normal);
			callback();
		})
		.on('pointerover', () => {
			bg.setTexture(this.atlas, this.hover);
		})
		.on('pointerout', () => {
			bg.setTexture(this.atlas, this.normal);
		}).setDepth(0);

		button_group.add(text);
		button_group.add(bg);

		return button_group;
	}
}
