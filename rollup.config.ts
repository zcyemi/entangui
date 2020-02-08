import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import { DEFAULT_EXTENSIONS } from '@babel/core';

export default {
    input: `src/index.ts`,
    output: [
        { file: 'dist/index.es.js', format: 'es' }
    ],
    external: [],
    plugins: [
        resolve({
            extensions: ['.ts', '.js','.tsx'],
        }),
        
        typescript({
            tsconfigOverride: {
                compilerOptions: { module: 'es2015', declaration: false },
            },
            tsconfig: 'tsconfig.json',
            useTsconfigDeclarationDir: true
        }),
        // renameExtensions(renameExtensionsConfig),
        babel({
            extensions: [
                ...DEFAULT_EXTENSIONS,
                'ts',
                'tsx'
            ],
            runtimeHelpers:true
        }),
        commonjs({
            include: 'node_modules/**'
        }),
        
    ]
}