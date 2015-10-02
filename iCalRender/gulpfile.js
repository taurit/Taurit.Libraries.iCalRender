var gulp = require('gulp');
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var plumber = require('gulp-plumber');
var autoprefixer = require('gulp-autoprefixer');
var stripDebug = require('gulp-strip-debug');
var es = require('event-stream');

gulp.task('libStyles', function () {
    return gulp.src(['Styles/iCalStyles.less'])
      .pipe(plumber())
      .pipe(less())
      .pipe(autoprefixer({
          browsers: ['last 4 versions', 'ie 8', 'ie 9', '> 1%']
      }))
      .pipe(cssmin())
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest('./build'));
});


gulp.task('exampleStyles', function () {
    return gulp.src(['Examples/Examples.less'])
      .pipe(plumber())
      .pipe(less())
      .pipe(autoprefixer({
          browsers: ['last 4 versions', 'ie 8', 'ie 9', '> 1%']
      }))
      .pipe(cssmin())
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest('./Examples'));
});

gulp.task('libScripts', function () {
    return es.merge(
        gulp.src(['lib/ical.js']).pipe(uglify()).pipe(rename({ suffix: '.min' })).pipe(gulp.dest('./build')),
        gulp.src(['lib/jquery-2.1.4.min.js']).pipe(gulp.dest('./build')),
        gulp.src(['Scripts/iCalRender.Header.js', 'Scripts/iCalRender.Functions.js', 'Scripts/iCalRender.ExtendedEvent.js', 'Scripts/iCalRender.EventPositionCalculator.js', 'Scripts/iCalRender.Renderer.js'])
          .pipe(concat('icalrender.js'))
          .pipe(stripDebug())
          .pipe(gulp.dest('./build'))
          .pipe(uglify())
          .pipe(rename({ suffix: '.min' }))
          .pipe(gulp.dest('./build'))
      );
});


gulp.task('validate', function () {
    return gulp.src(['Scripts/*.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish', { 'verbose': true }))
      .pipe(jshint.reporter('fail'));
});

gulp.task('watch', function () {
    // library assets
    gulp.watch(['Scripts/*.js'], ['validate', 'libScripts']);
    gulp.watch(['Styles/iCalStyles.less'], ['libStyles']);

    // sample page assets
    gulp.watch(['Examples/Examples.less'], ['exampleStyles']);
});
