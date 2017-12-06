const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const bowerFiles = require('main-bower-files');


const $ = gulpLoadPlugins();
const reload = browserSync.reload;
let config = {
  dev: true
}

gulp.task('styles', () => {<% if (includeSass) { %>
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(config.dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))<% } else { %>
  return gulp.src('app/styles/*.css')
    .pipe($.if(config.dev, $.sourcemaps.init()))<% } %>
    .pipe($.postcss([
      autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']})
    ]))
    .pipe($.if(config.dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('scripts', () => {
  // return gulp.src('app/scripts/**/*.js')
  //   .pipe($.plumber())
  //   .pipe($.if(config.dev, $.sourcemaps.init()))
  //   .pipe($.babel())
  //   .pipe($.if(config.dev, $.sourcemaps.write('.')))
  //   .pipe(gulp.dest('.tmp/scripts'))
  //   .pipe(reload({stream: true}));
});
<% } -%>

gulp.task('lint', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.eslint({ fix: true }))
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
    .pipe(gulp.dest('app/scripts'));
});

<% if (includeBabel) { -%>
gulp.task('html', ['styles', 'scripts'], () => {
<% } else { -%>
gulp.task('html', ['styles'], () => {
<% } -%>
  return gulp.src('app/htmls/*.html')
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
    .pipe($.if(/\.css$/, $.postcss([cssnano({safe: true, autoprefixer: false})])))
    .pipe($.if(/\.html$/, $.htmlmin({
      minifyCSS: true,
      // minifyJS: {compress: {drop_console: true}},
      // collapseWhitespace: true,
      // processConditionalComments: true,
      // removeComments: true,
      // removeEmptyAttributes: true,
      // removeScriptTypeAttributes: true,
      // removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist/htmls/'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('transfer',  () => {
  return gulp.src(bowerFiles())
    .pipe($.if('**/*.{eot,svg,ttf,woff,woff2}', gulp.dest('styles/fonts')))
    .pipe($.if('**/*.js', gulp.dest('assets/libs')));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/htmls/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep', 'transfer'], ['styles'<% if (includeBabel) { %>, 'scripts'<% } %>], () => {
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
      'app/htmls/*.html',
<% if (!includeBabel) { -%>
      'app/scripts/**/*.js',
<% } -%>
      'app/images/**/*',
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
<% if (includeBabel) { -%>
    gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
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
gulp.task('wiredep', () => {<% if (includeSass) { %>
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));
<% } %>
  gulp.src('app/htmls/*.html')
    .pipe(wiredep({
      exclude: ['_bootstrap.scss', 'modernizr', 'requirejs'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app/htmls'));
});

gulp.task('build', ['html', 'images', 'transfer', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    config.dev = false;
    runSequence(['clean', 'wiredep'], 'build', resolve);
  });
});
