'use strict';
const Generator = require('yeoman-generator');
const commandExists = require('command-exists').sync;
const yosay = require('yosay');
const chalk = require('chalk');
const wiredep = require('wiredep');
const mkdirp = require('mkdirp');
const _s = require('underscore.string');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });

    this.option('babel', {
      desc: 'Use Babel',
      type: Boolean,
      defaults: true
    });
  }

  initializing() {}

  prompting() {
    if (!this.options['skip-welcome-message']) {
      this.log(yosay('start to generator your app.'));
    }

    const prompts = [{
        type: 'checkbox',
        name: 'features',
        message: 'Which additional features would you like to include?',
        choices: [{
          name: 'Sass',
          value: 'includeSass',
          checked: true
        }, {
          name: 'Bootstrap',
          value: 'includeBootstrap',
          checked: true
        }, {
          name: 'Modernizr',
          value: 'includeModernizr',
          checked: true
        }, {
          name: 'requirejs',
          value: 'includeRequirejs',
          checked: true
        }]
      },
      /*{
        type: 'list',
        name: 'legacyBootstrap',
        message: 'Which version of Bootstrap would you like to include?',
        choices: [{
          name: 'Bootstrap 3',
          value: true
        }, {
          name: 'Bootstrap 4',
          value: false
        }],
        when: answers => answers.features.indexOf('includeBootstrap') !== -1
      },*/
      {
        type: 'confirm',
        name: 'includeJQuery',
        message: 'Would you like to include jQuery?',
        default: true,
        when: answers => answers.features.indexOf('includeBootstrap') === -1
      }
    ];

    return this.prompt(prompts).then(answers => {
      const features = answers.features;
      const hasFeature = feat => features && features.indexOf(feat) !== -1;

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeSass = hasFeature('includeSass');
      this.includeBootstrap = hasFeature('includeBootstrap');
      this.includeModernizr = hasFeature('includeModernizr');
      this.includeRequirejs = hasFeature('includeRequirejs');
      this.includeJQuery = answers.includeJQuery;
    });
  }

  writing() {
    this._writingGulpfile();
    this._writingPackageJSON();
    this._writingBabel();
    this._writingGit();
    this._writingBower();
    this._writingEditorConfig();
    this._writingReadme();
    this._writingStyles();
    this._writingScripts();
    this._writingHtml();
    this._writingMisc();
  }

  _writingGulpfile() {
    this.fs.copyTpl(
      this.templatePath('gulpfile.js'),
      this.destinationPath('gulpfile.js'), {
        appname: '"' + this.appname + '"',
        includeSass: this.includeSass,
        includeBootstrap: this.includeBootstrap,
        includeBabel: this.options['babel'],
        includeRequirejs: this.includeRequirejs
      }
    );
  }

  _writingPackageJSON() {
    this.fs.copyTpl(
      this.templatePath('_package.json'),
      this.destinationPath('package.json'), {
        appname: '"' + this.appname + '"',
        includeSass: this.includeSass,
        includeBabel: this.options['babel'],
        includeJQuery: this.includeJQuery,
      }
    );
  }

  _writingBabel() {
    this.fs.copy(
      this.templatePath('babelrc'),
      this.destinationPath('.babelrc')
    );
  }

  _writingGit() {
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath('.gitignore'));
  }

  _writingBower() {
    const bowerJson = {
      name: _s.slugify(this.appname),
      private: true,
      dependencies: {}
    };

    if (this.includeBootstrap) {
      if (this.includeSass) {
        bowerJson.dependencies = {
          'bootstrap-sass': '~3.3.7'
        };
        bowerJson.overrides = {
          'bootstrap-sass': {
            'main': [
              'assets/stylesheets/_bootstrap.scss',
              'assets/fonts/bootstrap/*',
              'assets/javascripts/bootstrap.js'
            ]
          }
        };
      } else {
        bowerJson.dependencies = {
          'bootstrap': '3.3.7'
        };
        bowerJson.overrides = {
          'bootstrap': {
            'main': [
              'dist/css/bootstrap.css',
              'dist/fonts/*',
              'dist/js/bootstrap.js'
            ]
          }
        };
      }
    } else if (this.includeJQuery) {
      bowerJson.dependencies['jquery'] = '~2.1.1';
    }
    if (this.includeRequirejs) {
      bowerJson.dependencies['requirejs'] = '~2.3.5';
    }
    if (this.includeModernizr) {
      bowerJson.dependencies['modernizr'] = '~2.8.1';
      bowerJson.overrides = {
        'modernizr': {
          'main': [
            './modernizr.js'
          ]
        }
      };
    }
    bowerJson.dependencies['customize-common'] = '~1.0.0';

    this.fs.writeJSON('bower.json', bowerJson);
    this.fs.copy(
      this.templatePath('bowerrc'),
      this.destinationPath('.bowerrc')
    );
  }

  _writingEditorConfig() {
    this.fs.copy(
      this.templatePath('editorconfig'),
      this.destinationPath('.editorconfig')
    );
  }

  _writingReadme() {
    this.fs.copy(
      this.templatePath('README.md'),
      this.destinationPath('README.md')
    );
  }

  _writingStyles() {
    let css = 'main';

    if (this.includeSass) {
      css += '.scss';
    } else {
      css += '.css';
    }

    this.fs.copyTpl(
      this.templatePath(css),
      this.destinationPath('app/styles/' + css), {
        includeBootstrap: this.includeBootstrap,
        includeSass: this.includeSass,
      }
    );
  }

  _writingScripts() {
    if (this.includeRequirejs) {
      this.fs.copyTpl(
        this.templatePath('main.js'),
        this.destinationPath('app/scripts/main.js'), {
          includeRequirejs: this.includeRequirejs,
          includeBootstrap: this.includeBootstrap,
        }
      );
    }
  }

  _writingHtml() {
    this.fs.copyTpl(
      this.templatePath('index.html'),
      this.destinationPath('app/htmls/index.html'), {
        appname: this.appname,
        includeSass: this.includeSass,
        includeBootstrap: this.includeBootstrap,
        includeModernizr: this.includeModernizr,
        includeRequirejs: this.includeRequirejs,
      }
    );
  }

  _writingMisc() {
    mkdirp('app/images/icons');
    mkdirp('app/assets/libs');
  }

  install() {
    const hasYarn = commandExists('yarn');
    this.installDependencies({
      npm: !hasYarn,
      bower: true,
      yarn: hasYarn,
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });
  }

  end() {
    const bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
    const howToInstall = `After running ${chalk.yellow.bold('npm install & bower install')}, inject your front end dependencies by running ${chalk.yellow.bold('gulp wiredep')}.`;

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    // wire Bower packages to .html
    wiredep({
      bowerJson: bowerJson,
      directory: 'bower_components',
      exclude: ['_bootstrap.scss', 'modernizr', 'requirejs'],
      ignorePath: /^(\.\.\/)*\.\./,
      src: 'app/htmls/*.html'
    });

    if (this.includeSass) {
      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        ignorePath: /^(\.\.\/)+/,
        src: 'app/styles/*.scss'
      });
    }
  }
};