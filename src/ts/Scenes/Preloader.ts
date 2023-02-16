import GameMenu from "./GameMenu";

export default class Preloader extends Phaser.Scene {
    public static Name: string = "Preloader";

    public preload(): void {
        this.addProgressBar();

		this.load.path = "assets/";
		// put all assets here
        this.load.atlas('stones', 'stones.png', 'stones.json');
        this.load.atlas('button', 'btn.png', 'btn.json');
		// this.load.image('b0', 'square_green.png');
		// this.load.image('b1', 'square_blue.png');
		// this.load.image('b2', 'square_red.png');
		// this.load.image('b3', 'square_stone.png');
		// this.load.image('b4', 'square_wood.png');
		// this.load.image('b5', 'square_yellow.png');

		// this.load.image('s0', 'square_any.png');
		// this.load.image('s1', 'bomb.png');
		// this.load.image('s2', 'line.png');

		this.load.image('field', 'cfield.png');
		this.load.image("title", "title.png");
		this.load.image("rules", "rules.png");

		this.load.audio("sfx_battery", "sfx/battery.mp3");
		this.load.audio("sfx_wall", "sfx/wall.mp3");
		this.load.audio("sfx_cells", "sfx/need_cells.mp3");
		this.load.audio("sfx_pistol", "sfx/pistol.mp3");

		// this.load.image('start_bg', 'start.jpg');
		// this.load.image('finish_bg', 'end.jpg');
        // this.load.image('level_bg', 'level.png');
        // this.load.image('menu_bg', 'menu.png');
        // this.load.json('level1', 'levels/00001.json');
        // this.load.json('level2', 'levels/00002.json');
        // this.load.json('level3', 'levels/00003.json');
        // this.load.json('level4', 'levels/00004.json');
        // this.load.json('level5', 'levels/00005.json');
        // this.load.json('level6', 'levels/00006.json');
        // this.load.atlas('flares', 'particles/flares.png', 'particles/flares.json');
    }

    public create(): void {
        this.scene.start(GameMenu.Name);
    }

    private addProgressBar(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        /** Customizable. This text color will be used around the progress bar. */
        const outerTextColor = '#FACF5A';

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);

        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: "Loading...",
            style: {
                font: "20px UiFont",
                color: outerTextColor
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: "0%",
            style: {
                font: "18px UiFont",
                color: "#FACF5A"
            }
        });
        percentText.setOrigin(0.5, 0.5);

        const assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: "",
            style: {
                font: "18px UiFont",
                color: outerTextColor
            }
        });

        assetText.setOrigin(0.5, 0.5);

        this.load.on("progress", (value: number) => {
            percentText.setText(parseInt(value * 100 + "", 10) + "%");
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect((width / 4) + 10, (height / 2) - 30 + 10, (width / 2 - 10 - 10) * value, 30);
        });

        this.load.on("fileprogress", (file: Phaser.Loader.File) => {
            assetText.setText("Loading asset: " + file.key);
        });

        this.load.on("complete", () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });
    }
}
