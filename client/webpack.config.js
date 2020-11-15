/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        app: './src/main.ts',
        vendors: ['phaser'],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },

    // devtool: 'inline-source-map',
    devtool: false,

    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },

    output: {
        filename: 'app.bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },

    mode: 'development',

    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        writeToDisk: true,
        open: true,
        port: 3000,
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'index.html',
                },
                {
                    from: 'assets/**/*',
                },
            ],
        }),
        new webpack.DefinePlugin({
            'typeof CANVAS_RENDERER': JSON.stringify(true),
            'typeof WEBGL_RENDERER': JSON.stringify(true),
            __SERVER_BASE_HOST: JSON.stringify(process.env.SERVER_BASE_HOST ?? 'localhost:8080')
        }),
    ],

    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                output: {
                    comments: false,
                },
            },
            extractComments: false,
        })],
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
};
