const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/index.ts',
    'content/publicAi': './src/content/publicAi.ts',
    'content/personalCloud': './src/content/personalCloud.ts',
    'content/riskyShare': './src/content/riskyShare.ts',
    'content/aiSiteMonitor': './src/content/aiSiteMonitor.ts',
    'content/allUrls': './src/content/allUrls.ts',
    'popup/popup': './src/popup/popup.ts',
    'popup/history': './src/popup/history.ts',
    'popup/settings': './src/popup/settings.ts',
    'intervention/intervention': './src/intervention/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@content': path.resolve(__dirname, 'src/content'),
      '@popup': path.resolve(__dirname, 'src/popup'),
      '@intervention': path.resolve(__dirname, 'src/intervention'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
        { from: 'src/popup/popup.html', to: 'popup/popup.html' },
        { from: 'src/popup/popup.css', to: 'popup/popup.css' },
        { from: 'src/popup/history.html', to: 'popup/history.html' },
        { from: 'src/popup/history.css', to: 'popup/history.css' },
        { from: 'src/popup/settings.html', to: 'popup/settings.html' },
        { from: 'src/popup/settings.css', to: 'popup/settings.css' },
      ],
    }),
  ],
  optimization: {
    minimize: false, // Keep readable for hackathon debugging
  },
  devtool: 'source-map',
};
