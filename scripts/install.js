const go = require('go')
const npmRun = require('npm-run')
const { Spinner } = require('clui')
const { basename, join, sep } = require('path')
const tmpPath = require('temp-dir')

const options = {}

const CSS_FRAMEWORKS = [
  { package: 'bulma', cssPath: 'bulma/css/bulma.min.css' },
  { package: 'bootstrap', cssPath: 'bootstrap/dist/css/bootstrap.min.css' }
]

const step = msg => console.log(` ${(step.c = (step.c || 0) + 1).toString().padStart(2)}. ${msg}`)

const execute = (command, options = {}) => new Promise((resolve, reject) => {
  const spinner = new Spinner(`Run: ${command}`, ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
  spinner.start()
  const argv = command.split(' ')
  npmRun.spawn(argv[0], argv.slice(1), options)
    .on('exit', code => {
      spinner.stop()
      if (code) reject(`Failed: ${command}`)
      else resolve()
    })
})

const getFrameworkCssPath = framework =>
  CSS_FRAMEWORKS.find(({ package }) => framework === package).cssPath

const configure = (skip) => skip ? '' :
  go.ask([
    { name: 'name',
      message: 'Name of the project:',
      default: basename(process.cwd()),
      validate: input => !!input.trim().length },
    { name: 'router',
      type: 'confirm',
      message: 'Do you want to install React Router?' },
    { name: 'css',
      type: 'confirm',
      message: 'Do you want to use CSS Framework?',
      default: false },
    { name: 'framework',
      when: ({ css }) => css,
      message: 'Choose CSS Framework:',
      choices: CSS_FRAMEWORKS.map(({ package }) => package),
      default: 'bootstrap' }
  ])
  .then(answers => Object.assign(options, answers))
  .then(() => options.name)

const createTmpDir = name => {
  const salt = Math.random().toString().slice(2)
  const path = join(tmpPath, salt, name)
  step(`Create temporary folder (.../${join(salt, name)})`)
  return go.fs.ensureDir(path)
    .then(() => path)
}

const mockTmpDir = () =>
  go.fs.readdir(tmpPath)
    .then(entries => entries.find(e => e.match(/^\d{16}$/)))
    .then(salt => go.readdir(join(tmpPath, salt)).then(p => join(tmpPath, salt, p[0])))
    .then(path => (step('Mocked ' + path), path))

const removeTmpDir = path => {
  step('Remove temporary folder')
  return go.remove(join(path, '..'))
}

const createReactApp = path => {
  return execute(`create-react-app ${path} --use-npm`)
    .then(() => require(join(path, 'package.json')).dependencies['react-scripts'])
    .then(version => step(`Setup React application (react-scripts@${version})`))
    .then(() => path)
}

const installDependencies = path => {
  const deps = []
  if (options.router) deps.push('react-router-dom')
  if (options.framework) deps.push(options.framework)
  return execute(`npm install ${deps.join(' ')}`, { cwd: path })
    .then(() => step(`Install dependencies (${deps.join(', ')})`))
    .then(() => path)
}

const setupAppTemplate = async path => {
  step('Generate application files')

  // Cleanup src directory
  const initialAppFiles = ['App.js', 'App.test.js', 'App.css', 'logo.svg']
  await Promise.all(initialAppFiles.map(e => go.remove(join(path, 'src', e))))

  // Setup new application root component
  const context = {
    framework: options.framework && getFrameworkCssPath(options.framework),
    message: 'To get started, edit <code>src/App.jsx</code> and save to reload.',
    router: options.router
  }
  const appTemplatePath = join('templates', 'app-component')
  await go.processTemplates(context, { cwd: appTemplatePath }, join(path, 'src') + sep)
  return path
}

const clearDestinationFolder = path => {
  step('Clear destination folder')
  return go.remove(process.cwd())
    .then(() => path)
  return go.fs.readdir(path)
    .then(entries => Promise.all(entries.map(entry => go.remove(join(path, entry)))))
}

const moveToDestination = path => {
  step('Move application to destination folder')
  return go.move(path, process.cwd())
    .then(() => path)
}

module.exports = {
  name: 'install',
  callback () {
    return configure(0)
      .then(createTmpDir)
      //.then(mockTmpDir)
      .then(createReactApp)
      .then(installDependencies)
      .then(setupAppTemplate)
      .then(clearDestinationFolder)
      .then(moveToDestination)
      .then(removeTmpDir)/**/
  }
}
