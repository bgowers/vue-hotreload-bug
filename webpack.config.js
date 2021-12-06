const path = require('path')
const fs = require('fs')
const { VueLoaderPlugin } = require('vue-loader')
const SystemJSPublicPathWebpackPlugin = require('systemjs-webpack-interop/SystemJSPublicPathWebpackPlugin')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')
const packageJson = require('./package.json')

module.exports = (env, options) => {
    const isProduction = options.mode === 'production'
    const VARIANTS_DIR = path.resolve(__dirname, 'src', 'variants')
    const cutExtName = filename => filename.replace(path.extname(filename), '')

    return {
        entry: Object.fromEntries(
            fs
                .readdirSync(VARIANTS_DIR)
                .map(filename => [
                    cutExtName(filename),
                    path.join(VARIANTS_DIR, filename),
                ]),
        ),

        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        appendTsSuffixTo: [/\.vue$/],
                    },
                },
                {
                    test: /\.vue$/,
                    use: 'vue-loader',
                },
                {
                    test: /\.s?css$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                },
            ],
        },

        externals: ['vue'],

        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },

            extensions: ['.ts', '.js', '.vue', '.json'],
        },

        output: {
            libraryTarget: 'system',
            publicPath: '/',
            filename: isProduction ? '[name].[contenthash].js' : '[name].js',
            assetModuleFilename: isProduction
                ? '[name].[contenthash][ext]'
                : '[name][ext]',
        },

        plugins: [
            new SystemJSPublicPathWebpackPlugin(),
            new VueLoaderPlugin(),
            new WebpackManifestPlugin(),
            new WebpackManifestPlugin({
                generate: (seed, files, entries) => {
                    return {
                        mfeName: packageJson.name,
                        entries: Object.entries(entries).map(([key, value]) => {
                            return {
                                variant: key,
                                fileName: value[0],
                            }
                        }),
                    }
                },
                useEntryKeys: true,
                fileName: 'metadata.json',
            }),
        ],

        devServer: {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods':
                    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers':
                    'X-Requested-With, content-type, Authorization',
            },

            /* It should be disabled if we run this in dev mode and try to use chunks from other remotes built in prod mode  */
            hot: false,
        },
    }
}
