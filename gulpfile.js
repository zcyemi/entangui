const gulp = require('gulp');
const childprocess = require('child_process');
const browserSync = require('browser-sync').create();

gulp.task("start",()=>{
    gulp.src('./samples/**').pipe(gulp.dest('./dist'));
    childprocess.exec("tsc && rollup -c rollup.config.ts");
    browserSync.init({
        server: "./dist",
        files: "./dist/**/**.*"
    });
})
gulp.task("syncfile",()=>{
    return gulp.src('./samples/**').pipe(gulp.dest('./dist'));
});


gulp.task("watch",()=>{
    childprocess.exec("rollup -c rollup.config.ts -w");
    gulp.watch("./samples/**/**.*",()=>{
        return gulp.src('./samples/**').pipe(gulp.dest('./dist'));
    });
})
