var gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify-es').default,
	cleancss = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	rsync = require('gulp-rsync'),
	newer = require('gulp-newer'),
	rename = require('gulp-rename'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	notify = require('gulp-notify'),
	debug = require('gulp-debug'),
	del = require('del');

// Local Server
gulp.task('browser-sync', function () {
	browserSync({
		server: {
			baseDir: 'src'
		},
		notify: false,
		// online: false, // Work offline without internet connection
		// tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
	})
});

function bsReload(done) {
	browserSync.reload();
	done();
};

// Custom Styles
gulp.task('styles', function () {
	return gulp.src('src/sass/**/*.sass')
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: [__dirname + '/node_modules']
		}))
		.on('error', notify.onError(function (err) {
			return {
				title: 'Sass',
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
gulp.task('scripts', function () {
	return gulp.src([
			// 'node_modules/tiny-slider/dist/min/tiny-slider.js', // libs
			'src/js/_*.js'
		])
		.pipe(concat('scripts.min.js'))
		//.pipe(uglify()) // Minify js (opt.)
		.pipe(gulp.dest('src/js'))
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Images
gulp.task('img-opt', async function () {
	return gulp.src('src/img/_src/**/*.{png,jpg,jpeg,webp,raw,svg}')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{
				removeViewBox: false
			}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(newer('src/img'))
		.pipe(rename(function (path) {
			path.extname = path.extname.replace('jpeg', 'jpg')
		}))
		.pipe(gulp.dest('src/img'))
});

gulp.task('img', gulp.series('img-opt', bsReload));

// Clean IMG's
gulp.task('cleanimg', function () {
	return del(['src/img/**/*', '!src/img/_src/**/*'], {
		force: true
	})
});

// Code & Reload
gulp.task('code', function () {
	return gulp.src('src/**/*.html')
		.pipe(browserSync.reload({
			stream: true
		}))
});

// Deploy
gulp.task('rsync', function () {
	return gulp.src('src/')
		.pipe(rsync({
			root: 'src/',
			hostname: 'username@yousite.com',
			destination: 'yousite/public_html/',
			// include: ['*.htaccess'], // Included files
			exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files
			recursive: true,
			archive: true,
			silent: false,
			compress: true
		}))
});

// Build
gulp.task('css:public', function () {
	return gulp.src('src/css/*.css')
		.pipe(gulp.dest('public/css'))
		.pipe(debug({
			title: 'dest'
		}))
});

gulp.task('js:public', function () {
	return gulp.src('src/js/scripts.min.js')
		.pipe(uglify())
		.pipe(gulp.dest('public/js/'))
		.pipe(debug({
			title: 'dest'
		}))
});

gulp.task('html:public', function () {
	return gulp.src('src/*.{html,htaccess,access}')
		.pipe(gulp.dest('public/'))
		.pipe(debug({
			title: 'dest'
		}))
});

gulp.task('img:public', function () {
	return gulp.src('src/img/*.{png,jpg,jpeg,webp,raw,ico,svg}')
		.pipe(gulp.dest('public/img/'))
		.pipe(debug({
			title: 'dest'
		}))
});

gulp.task('fonts:public', function () {
	return gulp.src(['src/fonts/*', '!src/fonts/_src/**'])
		.pipe(gulp.dest('public/fonts/'))
		.pipe(debug({
			title: 'dest'
		}))
});

gulp.task('clean:public', function () {
	return del('public')
});

gulp.task('public', gulp.series('clean:public', gulp.parallel('css:public', 'js:public', 'html:public', 'img:public', 'fonts:public')));

// Watch
gulp.task('watch', function () {
	gulp.watch('src/sass/**/*.sass', gulp.parallel('styles'));
	gulp.watch(['src/js/_custom.js', 'src/js/_libs.js'], gulp.parallel('scripts'));
	gulp.watch('src/*.html', gulp.parallel('code'));
	gulp.watch('src/img/_src/**/*', gulp.parallel('img'));
});

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));