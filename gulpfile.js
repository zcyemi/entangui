const gulp = require('gulp');
const browserSync = require('browser-sync').create();

gulp.task("start",()=>{

    gulp.src('./samples/**').pipe(gulp.dest('./dist'));
    browserSync.init({
        server: "./dist",
        files: "./dist/**/**.*"
    });
})
