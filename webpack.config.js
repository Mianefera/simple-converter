const path = require('path');

module.exports = (env) => {
    return {
        mode: env.mode ?? 'development',
        entry: {
            content: path.resolve(__dirname, 'content.js'),
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: "[name].js",
            clean: true
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
        resolve: {
            extensions: ['.ts', '.js'],
        },
    }
}