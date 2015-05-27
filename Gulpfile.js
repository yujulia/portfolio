/** -------------------------------------------------------- requires
*/
var gulp = require("gulp"),
    gutil = require('gulp-load-utils')(['date']),
    browserSync = require("browser-sync").create(),
    reload = browserSync.reload,
    browserify = require("browserify"),
    source = require("vinyl-source-stream"),
    sass = require("gulp-sass"),
    concat = require("gulp-concat"),
    changed = require("gulp-changed"),
    postcss = require("gulp-postcss"),
    autoprefixer = require("autoprefixer-core"),
    csswring = require("csswring"),
    zip = require("gulp-zip"),
    rename = require("gulp-rename"),
    imagemin = require("gulp-imagemin"),
    jade = require("gulp-jade"),
    symlink = require("gulp-sym"),
    uglify = require("gulp-uglify"),
    jshint = require("gulp-jshint"),
    data = require("./data/projects.json"),
    gconfig = require("./data/gulp-config.json");

    gconfig =JSON.parse(JSON.stringify(gconfig));



// -------------------------------------------------------- tasks
/**  
    styles
    compile into css, put it in build, concat, add main file, minify, put in deploy
**/
gulp.task("styles", function(){
    var processors = [ autoprefixer({browsers: ['last 2 version']}) ];

    return gulp.src(['node_modules/normalize.css/normalize.css', gconfig.SASS_SRC+"*.scss"])
        .pipe(sass({ errLogToConsole: true }))
        .pipe(gulp.dest(gconfig.CSS_SRC))
        .pipe(concat("main.css"))
        .pipe(postcss(processors))
        .pipe(gulp.dest(gconfig.CSS_BUILD))
        .pipe(reload({ stream: true }));
});

/** ----------------------------- 
    lint
**/
gulp.task("lint", function(){
    return gulp.src(gconfig.JS_SRC+"*.js")
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
});

/** ----------------------------- 
    scripts
    browserify base, put it in build, put minified in deploy
**/
gulp.task("scripts", function(){
    return browserify(gconfig.JS_SRC + "base.js")
        .bundle()
        .pipe(source("base.js"))
        .pipe(gulp.dest(gconfig.JS_BUILD));
});

/** ----------------------------- 
    build-jade
    generate HTML from JADE templates
**/
gulp.task("build-jade", function(){

    var jdata = data;

    return gulp.src(gconfig.JADE_SRC+"*.jade")
        .pipe(jade({ 
            locals: { "dev" : true, "data" : jdata, "timestamp":  gutil.date('mmm d, yyyy h:MM:ss TT Z') },
            pretty: true
        }))
        .pipe(gulp.dest(gconfig.HTML_BUILD));
});

// -------------------------------------------------------- init project 
/**  
    set up sym link in build directory to look up
    static assets in deploy
**/
gulp.task("link-assets", function(){
    return gulp.src([gconfig.IMG_DEPLOY, gconfig.FONT_DEPLOY])
        .pipe(symlink([gconfig.IMG_BUILD, gconfig.FONT_BUILD], {force: true}));
});

gulp.task("init", ["link-assets"]); // use once

// -------------------------------------------------------- deploy 

/**  
    image processing
**/
gulp.task("images", function(){
    return gulp.src(gconfig.IMG_SRC+"**")
        .pipe(imagemin())
        .pipe(gulp.dest(gconfig.IMG_BUILD));
});

/**  
    min-scripts
    minified site use js
**/
gulp.task("min-scripts", function(){
    return gulp.src(gconfig.JS_BUILD + "base.js")
        .pipe(uglify({ preserveComments: "some"}))
        .pipe(rename({ extname: ".min.js"}))
        .pipe(gulp.dest(gconfig.JS_DEPLOY));
});

/**  
    min-styles
    minified site use js
**/
gulp.task("min-styles", function(){
    var processors = [ csswring ];

    return gulp.src(gconfig.CSS_BUILD+"main.css")
        .pipe(postcss(processors))
        .pipe(rename({ extname: ".min.css"}))
        .pipe(gulp.dest(gconfig.CSS_DEPLOY));
});

/**  
    pub-jade
    generate HTML from JADE templates for deploy
**/
gulp.task("pub-jade", function(){
    var jdata = data;
    return gulp.src(gconfig.JADE_SRC+"*.jade")
        .pipe(jade({ 
            locals: { "dev": false, "data" : jdata, "timestamp":  gutil.date('mmm d, yyyy h:MM:ss TT Z') },
            pretty: true
        }))
        .pipe(gulp.dest(gconfig.HTML_DEPLOY));
});

/** ----------------------------- 
    deploy 
    generate deploy version of site "gulp deploy"
**/
gulp.task("deploy", ["images", "min-scripts", "min-styles", "pub-jade"]);


// -------------------------------------------------------- serve 
/**  
    script-watch
    make sure scripts task is complete before reloading browser
**/
gulp.task("script-watch", ["scripts"], function(){
    reload();
});

/**  
    serve
    use browsersync to create static server for build
**/
gulp.task("serve", ["styles", "build-jade", "scripts"], function(){
    
    browserSync.init({
        server: "./build"
    });

    gulp.watch(gconfig.SASS_SRC + "/**/*", ["styles"]);
    gulp.watch(gconfig.JS_SRC + "*.js", ["lint", "script-watch"]);
    gulp.watch(gconfig.JADE_SRC + "*.jade", ["build-jade"]);

    gulp.watch("build/*.html").on("change", reload);
});

/** serve-deploy
    test deploy dir
**/
gulp.task("serve-deploy", ["deploy"], function(){
    browserSync.init({
        server: "./deploy"
    });
});

// -------------------------------------------------------- default 

gulp.task("default", ["serve"]);

// 
// use "gulp init" to set up this project (symlinks)
// use "gulp" to monitor js, css and html changes
// use "gulp deploy" to minimize images and move relevant files to dist



