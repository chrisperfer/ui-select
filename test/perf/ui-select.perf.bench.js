'use strict';

// Lightweight perf probes for ui-select. These do not assert thresholds;
// they log timings to help inform future optimizations.

describe('ui-select performance benchmarks', function () {
  var $rootScope, $compile, $timeout;

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function compileWithItems(count, multiple) {
    var scope = $rootScope.$new();
    scope.people = [];
    for (var i = 0; i < count; i++) {
      scope.people.push({ name: 'Name' + i, email: 'user' + i + '@example.com', age: i % 80 });
    }
    var multiAttr = multiple ? ' multiple' : '';
    var el = $compile(
      '<ui-select ng-model="selection.selected" theme="bootstrap" style="width: 800px;"' + multiAttr + '> \
         <ui-select-match placeholder="Pick...">{{$select.selected.name}}</ui-select-match> \
         <ui-select-choices repeat="person in people | filter: $select.search"> \
           <div ng-bind-html="person.name | highlight: $select.search"></div> \
           <div ng-bind-html="person.email | highlight: $select.search"></div> \
         </ui-select-choices> \
       </ui-select>'
    )(scope);
    scope.$digest();
    return el;
  }

  beforeEach(module('ngSanitize', 'ui.select'));
  beforeEach(inject(function (_$rootScope_, _$compile_, _$timeout_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    $timeout = _$timeout_;
  }));

  it('renders 1000 items (multiple) and opens dropdown', function () {
    var t0 = now();
    var el = compileWithItems(1000, true);
    var t1 = now();

    // Open dropdown
    var $select = el.scope().$select;
    var open0 = now();
    $select.activate();
    $rootScope.$digest();
    $timeout.flush();
    var open1 = now();

    // Type search
    var search0 = now();
    el.scope().$select.search = 'Name9';
    el.scope().$digest();
    $timeout.flush();
    var search1 = now();

    // eslint-disable-next-line no-console
    console.log('[ui-select bench] compile(ms)=', (t1 - t0).toFixed(2), 'open(ms)=', (open1 - open0).toFixed(2), 'search(ms)=', (search1 - search0).toFixed(2));

    expect(true).toBe(true);
  });

  it('selects and removes items with preserveArrayReference enabled', inject(function (uiSelectConfig) {
    var prev = uiSelectConfig.preserveArrayReference;
    uiSelectConfig.preserveArrayReference = true;
    var el = compileWithItems(500, true);
    var $select = el.scope().$select;
    var $multi = el.scope().$selectMultiple;

    var t0 = now();
    $select.select(el.scope().people[10]);
    $select.select(el.scope().people[20]);
    var t1 = now();
    $multi.removeChoice(0);
    var t2 = now();

    // eslint-disable-next-line no-console
    console.log('[ui-select bench] select-2(ms)=', (t1 - t0).toFixed(2), 'remove-1(ms)=', (t2 - t1).toFixed(2));

    uiSelectConfig.preserveArrayReference = prev;
    expect(true).toBe(true);
  }));
});

