'use strict';

describe('ui-select performance optimizations', function() {
  var $rootScope, $compile, $timeout, $$uisDebounce;

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function generateLargeDataset(count) {
    var items = [];
    for (var i = 0; i < count; i++) {
      items.push({
        id: i,
        name: 'Item ' + i,
        email: 'user' + i + '@example.com',
        age: Math.floor(Math.random() * 80),
        department: 'Department ' + (i % 20),
        disabled: i % 5 === 0 // Every 5th item is disabled
      });
    }
    return items;
  }

  function compileSelect(config) {
    var scope = $rootScope.$new();
    scope.people = generateLargeDataset(config.itemCount || 1000);
    scope.selection = { selected: config.multiple ? [] : null };

    var attrs = '';
    if (config.searchDebounce !== undefined) {
      attrs += ' search-debounce="' + config.searchDebounce + '"';
    }
    if (config.disableChoice) {
      attrs += ' ui-disable-choice="' + config.disableChoice + '"';
      scope.isDisabled = function(item) {
        return item.disabled;
      };
    }
    if (config.multiple) {
      attrs += ' multiple';
    }
    if (config.trackBy) {
      attrs += ' track-by="' + config.trackBy + '"';
    }

    var template = config.multiple ?
      '<ui-select ng-model="selection.selected" theme="bootstrap"' + attrs + '>' +
        '<ui-select-match placeholder="Select...">{{$item.name}}</ui-select-match>' +
        '<ui-select-choices repeat="person in people | filter: $select.search track by person.id">' +
          '<div ng-bind-html="person.name | highlight: $select.search"></div>' +
        '</ui-select-choices>' +
      '</ui-select>' :
      '<ui-select ng-model="selection.selected" theme="bootstrap"' + attrs + '>' +
        '<ui-select-match placeholder="Select...">{{$select.selected.name}}</ui-select-match>' +
        '<ui-select-choices repeat="person in people | filter: $select.search">' +
          '<div ng-bind-html="person.name | highlight: $select.search"></div>' +
        '</ui-select-choices>' +
      '</ui-select>';

    var el = $compile(template)(scope);
    scope.$digest();

    var $select = el.controller('uiSelect');

    return { element: el, scope: scope, $select: $select };
  }

  beforeEach(module('ngSanitize', 'ui.select'));
  beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_, _$$uisDebounce_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $timeout = _$timeout_;
    $$uisDebounce = _$$uisDebounce_;
  }));

  describe('Search Debounce Performance', function() {
    it('should measure digest cycles with NO debounce (debounce=0)', function(done) {
      var result = compileSelect({ itemCount: 5000, searchDebounce: 0 });
      var $select = result.$select;

      $select.activate();
      result.scope.$digest();

      var digestCount = 0;
      var unwatchFn = result.scope.$watch(function() {
        digestCount++;
      });

      // Simulate rapid typing
      var searchTerms = ['I', 'It', 'Ite', 'Item', 'Item ', 'Item 1', 'Item 10'];
      var startTime = now();

      searchTerms.forEach(function(term) {
        $select.search = term;
        result.scope.$digest();
      });

      var endTime = now();
      var totalTime = endTime - startTime;

      console.log('[NO DEBOUNCE] Digest cycles:', digestCount,
                  'Total time:', totalTime.toFixed(2) + 'ms',
                  'Avg per keystroke:', (totalTime / searchTerms.length).toFixed(2) + 'ms');

      unwatchFn();
      expect(digestCount).toBeGreaterThan(searchTerms.length); // Multiple digests per search
      done();
    });

    it('should measure digest cycles WITH debounce (debounce=200)', function(done) {
      var result = compileSelect({ itemCount: 5000, searchDebounce: 200 });
      var $select = result.$select;

      $select.activate();
      result.scope.$digest();

      var digestCount = 0;
      var unwatchFn = result.scope.$watch(function() {
        digestCount++;
      });

      // Simulate rapid typing (faster than debounce)
      var searchTerms = ['I', 'It', 'Ite', 'Item', 'Item ', 'Item 1', 'Item 10'];
      var startTime = now();

      searchTerms.forEach(function(term, index) {
        setTimeout(function() {
          $select.search = term;
          result.scope.$digest();

          if (index === searchTerms.length - 1) {
            // Wait for debounce to complete
            setTimeout(function() {
              $timeout.flush();
              var endTime = now();
              var totalTime = endTime - startTime;

              console.log('[WITH DEBOUNCE=200] Digest cycles:', digestCount,
                          'Total time:', totalTime.toFixed(2) + 'ms',
                          'Searches performed:', Math.floor(digestCount / 2)); // Roughly half are from debounced searches

              unwatchFn();
              expect(digestCount).toBeLessThan(searchTerms.length * 2); // Far fewer digests
              done();
            }, 250);
          }
        }, index * 30); // Type every 30ms (faster than debounce)
      });
    });

    it('should compare performance of default debounce (200ms) vs no debounce', function() {
      // Test with default debounce
      var defaultResult = compileSelect({ itemCount: 5000 }); // Uses default 200ms
      var defaultSelect = defaultResult.$select;

      defaultSelect.activate();
      defaultResult.scope.$digest();

      var defaultDigests = 0;
      var defaultUnwatch = defaultResult.scope.$watch(function() { defaultDigests++; });

      // Type 5 characters quickly
      for (var i = 1; i <= 5; i++) {
        defaultSelect.search = 'Item ' + i;
        defaultResult.scope.$digest();
      }

      defaultUnwatch();

      // Test with no debounce
      var noDebounceResult = compileSelect({ itemCount: 5000, searchDebounce: 0 });
      var noDebounceSelect = noDebounceResult.$select;

      noDebounceSelect.activate();
      noDebounceResult.scope.$digest();

      var noDebounceDigests = 0;
      var noDebounceUnwatch = noDebounceResult.scope.$watch(function() { noDebounceDigests++; });

      // Type same 5 characters
      for (var j = 1; j <= 5; j++) {
        noDebounceSelect.search = 'Item ' + j;
        noDebounceResult.scope.$digest();
      }

      noDebounceUnwatch();

      console.log('[DEBOUNCE COMPARISON]',
                  'Default (200ms):', defaultDigests, 'digests',
                  'No debounce (0ms):', noDebounceDigests, 'digests',
                  'Reduction:', ((1 - defaultDigests/noDebounceDigests) * 100).toFixed(1) + '%');

      expect(defaultDigests).toBeLessThan(noDebounceDigests);
    });
  });

  describe('Disabled Items Optimization', function() {
    it('should measure performance WITHOUT pre-computation (baseline)', function() {
      var result = compileSelect({
        itemCount: 5000,
        multiple: true,
        disableChoice: 'person.disabled'
      });
      var $select = result.$select;

      // Temporarily disable pre-computation to test baseline
      var originalFlags = $select._itemDisabledFlags;
      $select._itemDisabledFlags = null;

      $select.activate();
      result.scope.$digest();

      var startTime = now();

      // Trigger multiple isDisabled checks
      for (var i = 0; i < 100; i++) {
        var item = result.scope.people[i];
        var itemScope = {};
        itemScope[$select.itemProperty] = item;
        itemScope.$eval = function() { return item.disabled; };
        $select.isDisabled(itemScope);
      }

      var endTime = now();
      var totalTime = endTime - startTime;

      console.log('[NO PRE-COMPUTATION] 100 isDisabled calls:', totalTime.toFixed(2) + 'ms',
                  'Avg per call:', (totalTime / 100).toFixed(3) + 'ms');

      $select._itemDisabledFlags = originalFlags;
      expect(totalTime).toBeGreaterThan(0);
    });

    it('should measure performance WITH pre-computation (optimized)', function() {
      var result = compileSelect({
        itemCount: 5000,
        multiple: true,
        disableChoice: 'person.disabled',
        trackBy: 'person.id'
      });
      var $select = result.$select;

      $select.activate();
      result.scope.$digest();

      // Ensure pre-computation happened
      $select.refreshItems();
      result.scope.$digest();

      expect($select._itemDisabledFlags).toBeDefined();

      var startTime = now();

      // Trigger multiple isDisabled checks
      for (var i = 0; i < 100; i++) {
        var item = result.scope.people[i];
        var itemScope = {};
        itemScope[$select.itemProperty] = item;
        $select.isDisabled(itemScope);
      }

      var endTime = now();
      var totalTime = endTime - startTime;

      console.log('[WITH PRE-COMPUTATION] 100 isDisabled calls:', totalTime.toFixed(2) + 'ms',
                  'Avg per call:', (totalTime / 100).toFixed(3) + 'ms',
                  'Cache size:', Object.keys($select._itemDisabledFlags || {}).length);

      expect(totalTime).toBeLessThan(10); // Should be very fast with O(1) lookups
    });

    it('should compare pre-computation vs runtime evaluation', function() {
      var dataset = generateLargeDataset(10000);

      // Baseline: Runtime evaluation
      var runtimeStart = now();
      var runtimeDisabled = 0;

      dataset.forEach(function(item) {
        // Simulate runtime evaluation
        if (item.disabled) {
          runtimeDisabled++;
        }
      });

      var runtimeEnd = now();
      var runtimeTime = runtimeEnd - runtimeStart;

      // Optimized: Pre-computed lookup
      var cache = {};
      var cacheStart = now();

      // Pre-compute once
      dataset.forEach(function(item) {
        cache[item.id] = item.disabled;
      });

      var cacheCreated = now();
      var cacheCreationTime = cacheCreated - cacheStart;

      // Perform lookups
      var lookupDisabled = 0;
      dataset.forEach(function(item) {
        if (cache[item.id]) {
          lookupDisabled++;
        }
      });

      var cacheEnd = now();
      var lookupTime = cacheEnd - cacheCreated;

      console.log('[DISABLED OPTIMIZATION COMPARISON]');
      console.log('  Runtime evaluation:', runtimeTime.toFixed(2) + 'ms');
      console.log('  Cache creation:', cacheCreationTime.toFixed(2) + 'ms');
      console.log('  Cache lookups:', lookupTime.toFixed(2) + 'ms');
      console.log('  Total optimized:', (cacheCreationTime + lookupTime).toFixed(2) + 'ms');
      console.log('  Speedup:', ((runtimeTime / lookupTime).toFixed(1)) + 'x faster for lookups');

      expect(lookupTime).toBeLessThan(runtimeTime);
      expect(runtimeDisabled).toBe(lookupDisabled); // Ensure correctness
    });

    it('should handle large multi-select with many disabled items efficiently', function() {
      var result = compileSelect({
        itemCount: 10000,
        multiple: true,
        disableChoice: 'person.disabled',
        trackBy: 'person.id'
      });

      var $select = result.$select;

      // Open and trigger refresh
      var openStart = now();
      $select.activate();
      result.scope.$digest();
      $select.refreshItems();
      result.scope.$digest();
      var openEnd = now();

      // Select some items
      var selectStart = now();
      for (var i = 0; i < 10; i++) {
        if (!result.scope.people[i].disabled) {
          result.scope.selection.selected.push(result.scope.people[i]);
        }
      }
      result.scope.$digest();
      var selectEnd = now();

      console.log('[LARGE MULTI-SELECT]');
      console.log('  Items:', result.scope.people.length);
      console.log('  Disabled items:', result.scope.people.filter(function(p) { return p.disabled; }).length);
      console.log('  Open time:', (openEnd - openStart).toFixed(2) + 'ms');
      console.log('  Select 10 items:', (selectEnd - selectStart).toFixed(2) + 'ms');
      console.log('  Cache entries:', Object.keys($select._itemDisabledFlags || {}).length);

      expect($select._itemDisabledFlags).toBeDefined();
      expect(Object.keys($select._itemDisabledFlags).length).toBe(10000);
    });
  });

  describe('Combined Optimizations', function() {
    it('should measure cumulative performance improvements', function(done) {
      // Baseline: No optimizations
      var baselineResult = compileSelect({
        itemCount: 5000,
        searchDebounce: 0,
        multiple: true,
        disableChoice: 'person.disabled'
      });

      var baselineSelect = baselineResult.$select;
      baselineSelect._itemDisabledFlags = null; // Disable optimization

      baselineSelect.activate();
      baselineResult.scope.$digest();

      var baselineDigests = 0;
      var baselineUnwatch = baselineResult.scope.$watch(function() { baselineDigests++; });

      var baselineStart = now();

      // Simulate user interaction
      ['I', 'It', 'Item'].forEach(function(term) {
        baselineSelect.search = term;
        baselineResult.scope.$digest();
      });

      var baselineEnd = now();
      baselineUnwatch();

      // Optimized: Both optimizations enabled
      var optimizedResult = compileSelect({
        itemCount: 5000,
        searchDebounce: 200,
        multiple: true,
        disableChoice: 'person.disabled',
        trackBy: 'person.id'
      });

      var optimizedSelect = optimizedResult.$select;

      optimizedSelect.activate();
      optimizedResult.scope.$digest();
      optimizedSelect.refreshItems();
      optimizedResult.scope.$digest();

      var optimizedDigests = 0;
      var optimizedUnwatch = optimizedResult.scope.$watch(function() { optimizedDigests++; });

      var optimizedStart = now();

      // Simulate same user interaction
      ['I', 'It', 'Item'].forEach(function(term, index) {
        setTimeout(function() {
          optimizedSelect.search = term;
          optimizedResult.scope.$digest();

          if (index === 2) {
            setTimeout(function() {
              var optimizedEnd = now();
              optimizedUnwatch();

              console.log('[COMBINED OPTIMIZATIONS]');
              console.log('  Baseline: ' + (baselineEnd - baselineStart).toFixed(2) + 'ms, ' + baselineDigests + ' digests');
              console.log('  Optimized: ' + (optimizedEnd - optimizedStart).toFixed(2) + 'ms, ' + optimizedDigests + ' digests');
              console.log('  Performance improvement: ' + ((1 - (optimizedEnd - optimizedStart)/(baselineEnd - baselineStart)) * 100).toFixed(1) + '%');
              console.log('  Digest reduction: ' + ((1 - optimizedDigests/baselineDigests) * 100).toFixed(1) + '%');

              expect(optimizedDigests).toBeLessThan(baselineDigests);
              expect(optimizedSelect._itemDisabledFlags).toBeDefined();
              done();
            }, 250);
          }
        }, index * 50);
      });
    });
  });
});