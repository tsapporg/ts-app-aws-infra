const npmPackage: any = {
  name: 'ts-app-aws-infra',
  version: '0.0.0',
  private: false,
  license: 'MIT',
  type: 'module',
  exports: {
    '.': './src/index.ts'
  },
  types: './src/index.ts',
  publishConfig: {
    main: './dist/index.mjs',
    types: './dist/index.d.ts'
  },
  dependencies: { 
    '@aws-sdk/client-dynamodb': '3.427.0',
    '@expo/spawn-async': '1.7.2'
  },
  devDependencies: {}
}

export default { npmPackage }