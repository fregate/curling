const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
	mode: "production",
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: './node_modules/phaser/dist/phaser.min.js',
					to: 'lib/'
				}
			]
		})
	]
});
