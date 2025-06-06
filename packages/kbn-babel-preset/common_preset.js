/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

module.exports = () => ({
  presets: [
    // plugins always run before presets, but in this case we need the
    // @babel/preset-typescript preset to run first so we have to move
    // our explicit plugin configs to a sub-preset
    {
      plugins: [
        require.resolve('babel-plugin-add-module-exports'),

        /**
         * The static class features proposal https://github.com/tc39/proposal-static-class-features
         * has been merged with the class fields proposal and is now stage 4.
         * We include this here because Monaco needs this and
         * this transform has to run before the transform class properties transform.
         */
        require.resolve('@babel/plugin-transform-class-static-block'),

        // The class properties proposal was merged with the private fields proposal
        // into the "class fields" proposal. Babel doesn't support this combined
        // proposal yet, which includes private field, so this transform is
        // TECHNICALLY stage 2, but for all intents and purposes it's stage 3
        //
        // See https://github.com/babel/proposals/issues/12 for progress
        require.resolve('@babel/plugin-transform-class-properties'),

        // Optional Chaining proposal is stage 4 (https://github.com/tc39/proposal-optional-chaining)
        // Need this since we are using TypeScript 3.7+
        require.resolve('@babel/plugin-proposal-optional-chaining'),

        // Nullish coalescing proposal is stage 4 (https://github.com/tc39/proposal-nullish-coalescing)
        // Need this since we are using TypeScript 3.7+
        require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),

        // Proposal is on stage 4, and included in ECMA-262 (https://github.com/tc39/proposal-export-ns-from)
        // Need this since we are using TypeScript 3.8+
        require.resolve('@babel/plugin-proposal-export-namespace-from'),

        // Proposal is on stage 4, and included in ECMA-262 (https://github.com/tc39/proposal-export-ns-from)
        // Need this since we are using TypeScript 3.9+
        require.resolve('@babel/plugin-proposal-private-methods'),

        // It enables the @babel/runtime so we can decrease the bundle sizes of the produced outputs
        [
          require.resolve('@babel/plugin-transform-runtime'),
          {
            version: '^7.12.5',
          },
        ],
      ],
    },

    require.resolve('@babel/preset-react'),

    [
      require.resolve('@babel/preset-typescript'),
      {
        allowNamespaces: true,
        allowDeclareFields: true,
      },
    ],

    // need to run before the typescript preset, else the param decorators
    // are stripped from the imports
    {
      plugins: [
        // Required for TypeScript decorators support
        require.resolve('babel-plugin-transform-typescript-metadata'),

        // Required for TypeScript decorators support
        [require.resolve('@babel/plugin-proposal-decorators'), { version: 'legacy' }],
      ],
    },
  ],
});
