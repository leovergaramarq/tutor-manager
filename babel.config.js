export default function (api) {
    api.cache(true);

    const ignore = ["./src/public/**/*"];

    const parserOpts = { allowReturnOutsideFunction: true };

    const presets = [
        [
            "@babel/preset-env",
            {
                modules: false
            }
        ]
    ];
    //   const plugins= [
    //     [
    //       '@babel/plugin-transform-runtime', {
    //       corejs: 2,
    //       helpers: true,
    //       regenerator: true,
    //       useESModules: false
    //     }
    //     ]
    //   ];
    const plugins = [
        [
            "@babel/plugin-transform-modules-commonjs",
            {
                allowTopLevelThis: true,
                strictMode: false
            }
        ]
    ];

    return {
        ignore,
        parserOpts,
        presets,
        plugins
    };
}
