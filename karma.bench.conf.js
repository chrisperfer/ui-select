module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'dist/select.js',
      'src/**/*.html',
      'test/perf/**/*.bench.js'
    ],
    preprocessors: {
      'src/**/*.html': ['ng-html2js']
    },
    ngHtml2JsPreprocessor: {
      stripPrefix: 'src/',
      moduleName: 'ui.select'
    },
    exclude: ['./index.js'],
    port: 9876,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome'],
    singleRun: true
  });
};

