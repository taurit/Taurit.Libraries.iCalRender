var gulp = require('gulp');
var less = require('gulp-less');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var print = require('gulp-print');

gulp.task('styles', function () {
    return gulp.src(['SamplePageStyles.less', 'iCalStyles.less'])
      .pipe(less())
      .pipe(gulp.dest('.'));
});

gulp.task('vet', function () {
    return gulp.src(['Scripts/iCalRender.js'])
      .pipe(print())
    //.pipe(jscs())
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish', { 'verbose': true }))
      .pipe(jshint.reporter('fail'));
});

gulp.task('watch', function () {
    gulp.watch(['SamplePageStyles.less', 'iCalStyles.less'], ['styles']);
    gulp.watch(['Scripts/iCalRender.js'], ['vet']);
});
