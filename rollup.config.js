import typescript from 'rollup-plugin-typescript';
import sourceMaps from 'rollup-plugin-sourcemaps';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const examplePck = {
  input: './src/index.ts',
  output: {
    file: 'examples/monitor.me.js',
    format: 'iife',
    name: 'Monitor',
  },
  plugins: [
    resolve(),
    commonjs({
      exclude: 'node_modules',
    }),
    json(),
    typescript({
      exclude: 'node_modules/**',
      typescript: require('typescript'),
    }),
  ],
};

const libPck = {
  input: './src/index.ts',
  plugins: [
    resolve(),
    commonjs({
      exclude: 'node_modules',
    }),
    json(),
    typescript({
      exclude: 'node_modules/**',
      typescript: require('typescript'),
    }),
    sourceMaps(),
    terser(),
  ],
  output: [
    {
      file: 'lib/monitor.me.js',
      format: 'iife',
      name: 'Monitor',
      sourcemap: true,
    },
  ],
};

const packages = {
  examplePck,
  libPck,
};
let result = packages;
const pck = process.env.PCK;
if (pck) {
  result = [packages[pck]];
}
export default [...Object.values(result)];
