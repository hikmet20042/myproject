module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    'react/no-unescaped-entities': 'off',
    'no-restricted-syntax': [
      'warn',
      {
        selector: "JSXAttribute[name.name='fallback'] JSXExpressionContainer > Literal[value=null]",
        message: 'Avoid fallback={null}. Use a deliberate UI state fallback component.',
      },
      {
        selector: "JSXText[value=/Loading\\.\\.\\./]",
        message: 'Avoid direct "Loading..." text. Use LoadingState for page-level loading.',
      },
      {
        selector: "Literal[value='Loading...']",
        message: 'Avoid direct "Loading..." text. Use LoadingState for page-level loading.',
      },
      {
        selector:
          "CatchClause CallExpression[callee.type='Identifier'][callee.name=/^set[A-Z]/][arguments.length=1][arguments.0.type='ArrayExpression'][arguments.0.elements.length=0]",
        message: 'Avoid resetting data to [] in catch blocks. Preserve previous content and surface an error state.',
      },
    ],
  },
  overrides: [
    {
      files: ['app/**/*.tsx', 'components/**/*.tsx', 'features/**/*.tsx', 'pages/**/*.tsx'],
      excludedFiles: ['**/layout.tsx'],
      rules: {
        'no-restricted-syntax': [
          'warn',
          {
            selector: "CallExpression[callee.name='useSession']",
            message: 'Auth ownership belongs in layout guards. Avoid useSession in non-layout UI files.',
          },
          {
            selector: "CallExpression[callee.object.name='router'][callee.property.name='push']",
            message: 'Avoid auth redirects outside layouts. Route access control belongs in layout guards.',
          },
          {
            selector: "CallExpression[callee.object.name='router'][callee.property.name='replace']",
            message: 'Avoid auth redirects outside layouts. Route access control belongs in layout guards.',
          },
          {
            selector: "JSXIdentifier[name='UnauthorizedState']",
            message: 'Unauthorized rendering must be handled by layout-level guards.',
          },
          {
            selector: "Identifier[name='accountType']",
            message: 'Permission checks should not be duplicated outside layout ownership boundaries.',
          },
          {
            selector: "Identifier[name='organizationStatus']",
            message: 'Permission checks should not be duplicated outside layout ownership boundaries.',
          },
          {
            selector: "Literal[value='unauthenticated']",
            message: 'Avoid auth status branching outside layout ownership boundaries.',
          },
        ],
      },
    },
  ],
}
