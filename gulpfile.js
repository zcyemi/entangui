const gulp = require('gulp');
const browserSync = require('browser-sync').create();

gulp.task("start",()=>{

    gulp.watch('./samples/**.*',()=>{
        return gulp.src('./samples/**').pipe(gulp.dest('./dist'));
    })
    
    browserSync.init({
        server: "./dist",
        files: "./dist/**/**.*"
    });
})


gulp.task("sync",()=>{
   return gulp.src('./samples/**').pipe(gulp.dest('./dist'));
})
