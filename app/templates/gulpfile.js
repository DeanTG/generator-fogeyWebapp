const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const bowerFiles = require('main-bower-files');
const zip = require('gulp-zip');
const replace = require('replace-in-file');
const rev = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const revdel = require('gulp-rev-delete-original');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

let config = {
  appname: <%- appname %>,
  dev: true,
  hash: false,
  zipUrl: '/Users/deantg/Downloads'
}

gulp.task('styles', () => {
  <% if (includeSass) { %>
  return gulp.src('app/styles/**/*.scss')
    .pipe($.plumber())
    .pipe($.if(config.dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
  <% } else { %>
  return gulp.src('app/styles/*.css')
    .pipe($.if(config.dev, $.sourcemaps.init()))
  <% } %>
  .pipe($.postcss([
      autoprefixer({ browsers: ['> 1%', 'last 2 versions'] })
    ]))
    .pipe($.if(config.dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.if(!config.dev, gulp.dest('dist/styles')))
    .pipe(reload({ stream: true }));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(config.dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(config.dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe($.if(!config.dev, gulp.dest('dist/scripts')))
    .pipe(reload({ stream: true }));
});

gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe($.if(/\.css$/, $.postcss([cssnano({ safe: true, autoprefixer: false })])))
    .pipe($.if(/\.html$/,$.htmlmin({
      minifyCSS: true,
      minifyJS: { compress: { drop_console: true } },
      collapseWhitespace: true,
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist/'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('bowerFiles', () => {
  return gulp.src(bowerFiles())
    .pipe($.if('**/*.{eot,svg,ttf,woff,woff2}', gulp.dest('app/assets/fonts')))
    .pipe($.if('**/*.js', gulp.dest('app/assets/libs')));
});

gulp.task('manifest', ['html'], () => {
  if(config.hash && !config.dev){
    gulp.src(['dist/styles/*.css', 'dist/scripts/pages/*.js'])
      .pipe(rev())
      .pipe(revdel())
      .pipe($.if(/\.css$/, gulp.dest('dist/styles')))
      .pipe($.if(/\.js/, gulp.dest('dist/scripts/pages')))
      .pipe(rev.manifest())
      .pipe(gulp.dest('.rev'));
  }
});

gulp.task('rev', ['manifest'], () => {
  if(config.hash && !config.dev){
    gulp.src(['.rev/*.json', 'dist/*.html'])
      .pipe(revCollector())
      .pipe(gulp.dest('dist'));
  }
});

gulp.task('extras', () => {
  return gulp.src([
    'app/assets/**/*',
  ], {
    dot: true
  }).pipe(gulp.dest('dist/assets'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', '.rev']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'bowerFiles'], () => {
    browserSync.init({
      open: false,
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/scripts/**/*.js',
      'app/images/**/*',
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('bower.json', ['wiredep']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    open: false,
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

// inject bower components
// run bower install xx -S
gulp.task('wiredep', () => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: [<% if (includeModernizr) { %>'modernizr', <% } %> <% if (includeRequirejs) { %>'requirejs'<% } %>],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
<% if (includeSass) { %>
  gulp.src('app/styles/*.scss')
  .pipe($.filter(file => file.stat && file.stat.size))
  .pipe(wiredep({
    ignorePath: /^(\.\.\/)+/
  }))
  .pipe(gulp.dest('app/styles'));
<% } %>
  gulp.src('app/scripts/**/*.js')
    .pipe(wiredep({
      exclude: ['modernizr', 'requirejs'],
      ignorePath: /^(\.\.\/)*\.\./,
      fileTypes: {
        js: {
          block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
          detect: {
            js: /^\/\/bowerfilepath$/gi,
          },
          replace: {
            js: function(filePath) {
              let name = filePath.split('/')[2],
                path = filePath.replace('.js', '');
              if (config.dev) {
                path = filePath.replace('.js', '');
              } else {
                path = '../../assets/libs/' + filePath.split('/').pop().replace('.js', '');
              }
              return `"${name}": "${path}",`;
            }
          }
        },
      }
    }))
    .pipe(gulp.dest('app/scripts/'));
});

gulp.task('build', ['rev', 'images', 'bowerFiles', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

gulp.task('zip', ['build'], () => {
  return gulp.src('dist/**/*')
    .pipe(zip(`${config.appname}_${new Date().getMonth()+1}${new Date().getDate()}_${new Date().getHours()+1}${new Date().getMinutes()}.zip`))
    .pipe(gulp.dest(config.zipUrl));
})

gulp.task('default', () => {
  return new Promise(resolve => {
    config.dev = false;
    runSequence(['clean', 'wiredep'], 'build', resolve);
  });
});