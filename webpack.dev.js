const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
	mode: "development",
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: './node_modules/phaser/dist/phaser.js',
					to: 'lib/phaser.min.js'
				}
			]
		})
	]
});
