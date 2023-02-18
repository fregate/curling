interface SwipeDirection {
	left: boolean,
	right: boolean,
	up: boolean,
	down: boolean,

	angle?: number
}

interface SwipeCallbacks {
	leftCallback?: Function;
	rightCallback?: Function;
	upCallback?: Function;
	downCallback?: Function;
}

export default class SwipePlugin extends Phaser.Plugins.BasePlugin {
	private pt: Phaser.Geom.Point = new Phaser.Geom.Point;

	public static SwipeEvent: string = "swipe";

	constructor(pluginManager) {
		super(pluginManager);
	}

	public attach(scene: Phaser.Scene, threshold: number, callbacks?: SwipeCallbacks, context?) {
		if (callbacks !== undefined) {
			scene.events.on(SwipePlugin.SwipeEvent, (e) => {
				if (e.left && callbacks.leftCallback) {
					callbacks.leftCallback.call(context);
				}
				if (e.right && callbacks.rightCallback) {
					callbacks.rightCallback.call(context);
				}
				if (e.up && callbacks.upCallback) {
					callbacks.upCallback.call(context);
				}
				if (e.down && callbacks.downCallback) {
					callbacks.downCallback.call(context);
				}
			});
		}

		scene.input.on("pointerdown", (e) => {
			this.pt.x = e.x;
			this.pt.y = e.y;
		});

		scene.input.on("pointerup", (e) => {
			let directions: SwipeDirection = {
				left: false,
				right: false,
				up: false,
				down: false,
				angle: 0,
			};

			let deltaY = (e.y - this.pt.y);
			let deltaX = (e.x - this.pt.x);
			let dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			if (dist < threshold)
				return;

			directions.angle = Math.atan2(deltaY, deltaX);

			if (directions.angle > -Math.PI / 4 && directions.angle < Math.PI / 4) {
				directions.right = true;
			} else if (directions.angle > 3 * Math.PI / 4 || directions.angle < -3 * Math.PI / 4) {
				directions.left = true;
			} else if (directions.angle > Math.PI / 4 && directions.angle < 3 * Math.PI / 4) {
				directions.down = true;
			} else if (directions.angle > -3 * Math.PI / 4 && directions.angle < -Math.PI / 4) {
				directions.up = true;
			}

			this.sendEvent(scene, directions);
		});
	}

	private sendEvent(scene: Phaser.Scene, directions: SwipeDirection) {
		scene.events.emit(SwipePlugin.SwipeEvent, directions);
	}
}
