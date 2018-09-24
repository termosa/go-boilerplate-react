const go = require('go')
const { join } = require('path')

const IMPORT_COMPONENT_ANCHOR = '/* import components */'
const EXPORT_COMPONENT_ANCHOR = '/* export components */'
const IMPORT_PAGE_ANCHOR = '/* import pages */'
const DEFINE_PAGE_ANCHOR = '/* define pages */'

const normalizeName = name => name.replace(/[^a-z\d\$]/i, '')

const patchComponentsIndex = async name => {
  const indexFile = (await go.readFile(join('src', 'components', 'index.js'))).toString()
    .replace(
      IMPORT_COMPONENT_ANCHOR,
      `${IMPORT_COMPONENT_ANCHOR}\nimport ${name} from './${name}/${name}'`
    )
    .replace(
      EXPORT_COMPONENT_ANCHOR,
      `${EXPORT_COMPONENT_ANCHOR}\n  ${name},`
    )
  await go.writeFile(join('src', 'components', 'index.js'), indexFile)
}

const patchAppFile = async (name, path, exact) => {
  const appFile = (await go.readFile(join('src', 'App.js'))).toString()
    .replace(
      IMPORT_PAGE_ANCHOR,
      `${IMPORT_PAGE_ANCHOR}\n  ${name},`
    )
    .replace(
      DEFINE_PAGE_ANCHOR,
      `${DEFINE_PAGE_ANCHOR}\n        <Route${exact ? ' exact' : ''} path="/${path}" component={${name}} />`
    )
  await go.writeFile(join('src', 'App.js'), appFile)
}

module.exports = {
  name: 'create',
  description: 'generates new component file',
  options: { css: Boolean, path: String, exact: Boolean },
  async callback ({ args }) {
    const name = normalizeName(args._[1] || await go.ask('Component name:'))
    const path = args.path
    const exact = args.exact
    const needCss = args.css

    if (!name) throw 'Name should be not empty and consist only of latin letters, numbers or $ character'

    const context = { name, needCss }
    if (needCss) {
      await go.processTemplates(
        context,
        join('templates', 'component', 'component.css'),
        join('src', 'components', name, `${name}.css`)
      )
    }
    await go.processTemplates(
      context,
      join('templates', 'component', 'component.js'),
      join('src', 'components', name, `${name}.js`)
    )

    await patchComponentsIndex(name)
    if (typeof path !== 'undefined') {
      await patchAppFile(name, path, exact)
    }

    console.log(join('src', 'components', name), 'is created')
  }
}
