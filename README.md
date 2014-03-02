## Information

<table>
<tr>
<td>Package</td><td>gulp-sourcemaps</td>
</tr>
<tr>
<td>Description</td>
<td>Write source maps</td>
</tr>
<tr>
<td>Node Version</td>
<td>≥ 0.9</td>
</tr>
</table>

## Usage

```javascript
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('javascript', function() {
	gulp.src('src/**/*.js')
	.pipe(concat('all.js'))
	.pipe(uglify({outSourceMap: true}))
	.pipe(sourcemaps())
	.pipe(gulp.dest('dist'));
});
```

## Options

- `inline`

	By default the source maps are inlined. Pass `false` to write separate files.

- `includeContent`

	By default the source maps include the source code. Pass `false` to use the original files.

- `sourceRoot`

	Set the path where the source files are hosted (use this when `includeContent` is set to `false`).