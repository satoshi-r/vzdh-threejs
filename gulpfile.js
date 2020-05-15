const gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify-es').default,
	cleancss = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	webp = require('gulp-webp'),
	clone = require('gulp-clone'),
	clonesink = clone.sink(),
	newer = require('gulp-newer'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	notify = require('gulp-notify'),
	debug = require('gulp-debug'),
	del = require('del'),
	webpack = require('webpack-stream');

const isDev = process.env.NODE_ENV == 'development';

const webpackConfig = {
	output: {
		filename: 'scripts.min.js'
	},
	module: {
		rules: [{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: '/node_modules/'
		}]
	},
	mode: isDev ? 'development' : 'production',
	devtool: isDev ? 'source-map' : 'none'
};

const bsReload = (done => {
	browserSync.reload();
	done();
});

// Local Server
gulp.task('browser-sync', () => {
	browserSync({
		proxy: 'localhost/vzdh-threejs/src',
		notify: false,
		port: 4000
	})
});



// Custom Styles
gulp.task('styles', () => {
	return gulp.src(['src/sass/**/*.sass', 'src/scss/**/*.scss'])
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [__dirname + '/node_modules']
		}))
		.on('error', notify.onError((err) => {
			return {
				title: 'Styles',
				message: err.message
			}
		}))
		.pipe(concat('styles.min.css'))
		.pipe(autoprefixer({
			grid: true,
			overrideBrowserslist: ['last 10 versions']
		}))
		.pipe(cleancss({
			level: {
				1: {
					specialComments: 0
				}
			}
		})) // Optional. Comment out when debugging
		.pipe(gulp.dest('src/css'))
		.pipe(browserSync.stream())
});

// Scripts
gulp.task('scripts', () => {
	return gulp.src('src/js/index.js')
		.pipe(webpack(webpackConfig))
		.pipe(debug({
			title: 'webpack'
		}))
		.pipe(gulp.dest('src/js'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Images
gulp.task('images', async () => {
	return gulp.src('src/img/_src/**/*.{png,jpg,jpeg,webp,raw,svg,gif}')
		.pipe(imagemin([
			imagemin.gifsicle({
				interlaced: true
			}),
			imagemin.mozjpeg({
				quality: 75,
				progressive: true
			}),
			imagemin.optipng({
				optimizationLevel: 5
			}),
			imagemin.svgo({
				plugins: [{
						removeViewBox: true
					},
					{
						cleanupIDs: false
					}
				]
			})
		]))
		.pipe(newer('src/img'))
		.pipe(rename((path => path.extname = path.extname.replace('jpeg', 'jpg'))))
		.pipe(clonesink) // start stream
		.pipe(webp()) // convert images to webp and save a copy of the original format
		.pipe(clonesink.tap()) // close stream

		.pipe(gulp.dest('src/img'))
});

gulp.task('img', gulp.series('images', bsReload));

// Clean IMG's
gulp.task('cleanimg', () => {
	return del(['src/img/**/*', '!src/img/_src', '!src/img/favicon.*'], {
		force: true
	})
});

// Code & Reload
gulp.task('code', () => {
	return gulp.src('src/**/*.html')
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Build
gulp.task('css:build', () => {
	return gulp.src('src/css/*.css')
		.pipe(gulp.dest('dist/css'))
});

gulp.task('js:build', () => {
	return gulp.src('src/js/scripts.min.js')
		.pipe(uglify())
		.pipe(gulp.dest('dist/js/'))
});

gulp.task('html:build', () => {
	return gulp.src('src/*.{html,htaccess,access}')
		.pipe(gulp.dest('dist/'))
});

gulp.task('img:build', () => {
	return gulp.src('src/img/*.{png,jpg,jpeg,webp,raw,ico,svg}')
		.pipe(gulp.dest('dist/img/'))
});

// Static
gulp.task('static:build', () => {
	return gulp.src('src/static/**/*')
		.pipe(gulp.dest('dist/static'))
})

gulp.task('fonts:build', () => {
	return gulp.src(['src/fonts/*', '!src/fonts/_src/**'])
		.pipe(gulp.dest('dist/fonts/'))
});

// Delete build
gulp.task('clean:build', () => {
	return del('dist')
});

gulp.task('build', gulp.series('clean:build', gulp.parallel('css:build', 'js:build', 'html:build', 'static:build', 'img:build', 'fonts:build')));

// Watch
gulp.task('watch', () => {
	gulp.watch(['src/sass/**/*.sass', 'src/scss/**/*.scss'], gulp.parallel('styles'));
	gulp.watch(['src/js/*.js', '!src/js/scripts.min.js'], gulp.parallel('scripts'));
	gulp.watch('src/*.html', gulp.parallel('code'));
	gulp.watch('src/img/_src/**/*', gulp.parallel('img'));
});

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));