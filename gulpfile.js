var gulp = require("gulp"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify"),
  babel = require("gulp-babel"),
  minifyCSS = require("gulp-minify-css"),
  sass = require("gulp-sass"),
  htmlmin = require("gulp-htmlmin"),
  clean = require("gulp-clean"),
  autoprefixer = require("gulp-autoprefixer"),
  image = require("gulp-image"),
  connect = require("gulp-connect"),
  hash = require("gulp-hash-filename"),
  rename = require("gulp-rename"),
  htmlreplace = require("gulp-html-replace"),
  ftp = require("vinyl-ftp"),
  gutil = require("gulp-util"),
  fs = require("fs"),
  open = require("gulp-open");

var hashedCSS;

gulp.task("compile-sass", function () {
  return gulp
    .src(["./src/scss/*.scss"])
    .pipe(sass())
    .pipe(concat("style.css"))
    .pipe(gulp.dest("./src/css/"));
});

gulp.task("minify-css", function () {
  return gulp
    .src(["./src/css/*.css"])
    .pipe(
      autoprefixer({
        cascade: false,
      })
    )
    .pipe(concat("style.css"))
    .pipe(minifyCSS())
    .pipe(
      hash({
        format: "{name}-{hash:8}{ext}",
      })
    )
    .pipe(
      rename(function (path) {
        path.basename += ".min";
        hashedCSS = "./css/" + path.basename + ".css";
      })
    )
    .pipe(gulp.dest("./css"))
    .pipe(connect.reload());
});

function foo(folder, enconding) {
  return new Promise(function (resolve, reject) {
    fs.readdir(folder, enconding, function (err, filenames) {
      if (err) reject(err);
      else resolve(filenames);
    });
  });
}

const getCssPath = async () => {
  var cssPath;
  await foo("./css/").then(
    (files) => (cssPath = "/css/" + files.filter((el) => /\.min.css$/.test(el)))
  );
  return cssPath;
};

gulp.task("minifyhtml", function () {
  return gulp
    .src(["./src/*.html"])
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(
      htmlreplace({
        css: hashedCSS ? hashedCSS : getCssPath(),
      })
    )
    .pipe(gulp.dest("./"))
    .pipe(connect.reload());
});

gulp.task("copy-fonts", function () {
  return gulp.src(["./src/fonts/*"]).pipe(gulp.dest("./fonts/"));
});

gulp.task("copy-json", function () {
  return gulp.src(["./src/json/*"]).pipe(gulp.dest("./json/"));
});

// Чистим директорию назначения и делаем ребилд, чтобы удаленные из проекта файлы не остались
gulp.task("clean", function () {
  return gulp
    .src(["./src/css/style.css"], { read: false, allowEmpty: true })
    .pipe(clean());
});

gulp.task("clean-old-css", function () {
  return gulp.src(["./css"], { read: false, allowEmpty: true }).pipe(clean());
});

gulp.task("connect", function () {
  var server = connect.server({
    root: "./",
    livereload: true,
  });

  return gulp.src("./").pipe(
    open({
      uri: "http://" + server.host + ":" + server.port,
    })
  );
});

function watchFiles() {
  gulp.watch(
    "./src/scss/*.scss",
    gulp.series([
      "clean-old-css",
      "compile-sass",
      "minify-css",
      "clean",
      "minifyhtml"
    ])
  );
  gulp.watch("./src/*.html", gulp.series(["minifyhtml"]));
  gulp.watch("./src/img/*");
}

const build = gulp.series(
  "clean-old-css",
  "compile-sass",
  "minify-css",
  "minifyhtml",
  "clean",
  "copy-fonts",
  "copy-json"
);

const watch = gulp.parallel("connect", watchFiles);

exports.build = build;
// exports.deploy = deploy;
exports.default = gulp.series(build, watch);
