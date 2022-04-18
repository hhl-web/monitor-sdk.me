module.exports = {
    extends: ['alloy', 'alloy/vue', 'alloy/typescript'],
    env: {
      // 你的环境变量（包含多个预定义的全局变量）
      //
      // browser: true,
      // node: true,
      // mocha: true,
      // jest: true,
      // jquery: true
    },
    globals: {
      // 你的全局变量（设置为 false 表示它不允许被重新赋值）
      //
      // myGlobal: false
    },
    rules: {
      // 自定义你的规则，这里我把以前tslint的规则直接搬过来了，还没排查未生效项
      'no-empty': false,
      'only-arrow-functions': [false, 'allow-declarations', 'allow-named-functions'],
      quotemark: [false, 'single'],
      indent: [true, 'spaces', 2],
      'interface-name': false,
      'ordered-imports': false,
      'object-literal-sort-keys': false,
      'no-consecutive-blank-lines': false,
      semicolon: false,
      'max-line-length': false,
      'prefer-for-of': false,
      'trailing-comma': false,
      'arrow-parens': false,
      'no-console': false,
    },
  }
  