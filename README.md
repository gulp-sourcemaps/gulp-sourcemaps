## Information

<table>
<tr>
<td>Package</td><td>gulp-sourcemaps</td>
</tr>
<tr>
<td>Description</td>
<td>Source map support for Gulp</td>
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
    .pipe(sourcemaps.init())
      .pipe(concat('all.js'))
      .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});
```

All plugin between `sourcemaps.init()` and `sourcemaps.write()` need to support source maps.


## Options

- `inline`

  By default the source maps are inlined. Pass `false` to write separate files.

- `includeContent`

  By default the source maps include the source code. Pass `false` to use the original files.

- `sourceRoot`

  Set the path where the source files are hosted (use this when `includeContent` is set to `false`).

## Plugin developers only: How to add source map support to plugins

- Generate a source map for the transformation the plugin is applying
- Apply this source map to the vinyl `file` by calling `file.applySourceMap(sourceMap)`.
  This combines the source map of this plugin with the source maps coming from plugins further up the chain.

### Example:

```javascript
var through = require('through2');
var myTransform = require('myTransform');

module.exports = function(options) {

  function transform(file, encoding, callback) {
    // generate source maps if plugin source-map present
    if (file.sourceMap) {
      options.makeSourceMaps = true;
    }

    // do normal plugin logic
    var result = myTransform(file.contents, options);
    file.contents = new Buffer(result.code);

    // apply source map to the chain
    if (file.sourceMap) {
      file.applySourceMap(result.map);
    }

    this.push(file);
    callback();
  }

  return through.obj(transform);
};
```
