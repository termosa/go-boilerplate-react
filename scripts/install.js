const go = require('go')
const npmRun = require('npm-run')
const { Spinner } = require('clui')
const { basename, join, sep } = require('path')
const tmpPath = require('temp-dir')

const options = {}

const CWD = process.cwd()

const CSS_FRAMEWORKS = [
  { package: 'bulma', cssPath: 'bulma/css/bulma.min.css' },
  { package: 'bootstrap', cssPath: 'bootstrap/dist/css/bootstrap.min.css' }
]

const spin = msg => {
  const spinner = new Spinner(msg, ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'])
  spinner.start()
  return spinner
}

const step = msg => console.log(` ${(step.c = (step.c || 0) + 1).toString().padStart(2)}. ${msg}`)

const execute = (command, options = {}) => new Promise((resolve, reject) => {
  const argv = command.split(' ')
  npmRun.spawn(argv[0], argv.slice(1), options)
    .on('exit', code => {
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
      default: basename(CWD),
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

const removeTmpDir = path => {
  step('Remove temporary folder')
  return go.remove(join(path, '..'))
}

const createReactApp = async path => {
  const spinner = spin('Initializing React application')

  await execute(`create-react-app ${path} --use-npm`)
  const version = require(join(path, 'package.json')).dependencies['react-scripts']

  spinner.stop()
  step(`Initialize React application (react-scripts@${version})`)
  return path
}

const installDependencies = async path => {
  const deps = ['go']
  if (options.router) deps.push('react-router-dom')
  if (options.framework) deps.push(options.framework)
  const spinner = spin(`Installing dependencies: ${deps.join(', ')}`)

  await execute(`npm install ${deps.join(' ')}`, { cwd: path })

  spinner.stop()
  step(`Install dependencies (${deps.join(', ')})`)
  return path
}

const setupAppTemplate = async path => {
  const spinner = spin('Generating application files')

  // Cleanup src directory
  const initialAppFiles = ['App.js', 'App.test.js', 'App.css', 'logo.svg']
  await Promise.all(initialAppFiles.map(e => go.remove(join(path, 'src', e))))

  // Setup new application root component
  const context = {
    framework: options.framework && getFrameworkCssPath(options.framework),
    router: options.router
  }
  const appTemplatePath = join('templates', 'app')
  await go.processTemplates(context, { cwd: appTemplatePath }, join(path, 'src') + sep)

  spinner.stop()
  step('Generate application files')
  return path
}

const clearDestinationFolder = async path => {
  const spinner = spin('Clearing destination folder')

  const entriesToRemove = [
    '.git', '.gitignore',
    '.goconfig.json',
    'package.json', 'package-lock.json',
    'node_modules',
    join('templates', 'app'),
    join('scripts', 'install.js')
  ].map(e => join(CWD, e))
  await Promise.all(entriesToRemove.map(e => go.remove(e)))

  spinner.stop()
  step('Clear destination folder')
  return path
}

const moveToDestination = async path => {
  const spinner = spin('Moving files to destination folder')

  await go.move(path, CWD)

  spinner.stop()
  step('Move application to destination folder')
  return path
}

module.exports = {
  name: 'install',
  callback () {
    return configure(0)
      .then(createTmpDir)
      .then(createReactApp)
      .then(installDependencies)
      .then(setupAppTemplate)
      .then(clearDestinationFolder)
      .then(moveToDestination)
      .then(removeTmpDir)
  }
}
