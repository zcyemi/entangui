const gulp = require('gulp');
const browserSync = require('browser-sync').create();

gulp.task("start",()=>{
    browserSync.init({
        server: "./dist",
        files: "./dist/**/**.*"
    });
})
